import type {
  Flashcard,
  PracticeTask,
  ProgressStore,
  Direction,
  PracticeState,
} from "./model";
import { ensureProgress } from "./storage";

//opcje sesji
export type SessionOptions = {
  now: number;
  batchSize: number;
  newPerSession: number;
  mixESPL: number;
};

//wykrywanie nowego kierunku
function isNewState(sesion: PracticeState): boolean {
  return sesion.totalReviews === 0;
}

//zmienia flashcard i direction na practice task
function makeTask(card: Flashcard, dir: Direction): PracticeTask {
  const prompt = dir === "ES_PL" ? card.es : card.pl;
  const expected =
    dir == "ES_PL"
      ? [card.pl, ...(card.plAlt ?? [])]
      : [card.es, ...(card.esAlt ?? [])];

  return {
    cardId: card.id,
    prompt,
    dir,
    expected,
    hint: card.fon,
    tags: card.tags,
  };
}

// im wyzszy priorytrt tym blizej

function overdueScore(state: PracticeState, now: number): number {
  return Math.max(0, now - state.dueAt);
}

export function buildSessionQueue(
  cards: Flashcard[],
  progressIn: ProgressStore,
  options: SessionOptions,
): { queue: PracticeTask[]; progress: ProgressStore } {
  let progress = { ...progressIn };
  const queue: PracticeTask[] = [];
  const pickedKeys = new Set<string>(); // Format: "id_dir"

  let countESPL = 0;
  let countPLES = 0;

  // 1. Normalizacja (Boundary)
  for (const card of cards) {
    progress = ensureProgress(progress, card.id, options.now);
  }
  // Helper do bezpiecznego dodawania
  const tryTake = (card: Flashcard, dir: Direction): boolean => {
    const key = `${card.id}_${dir}`;
    if (pickedKeys.has(key) || queue.length >= options.batchSize) return false;

    queue.push(makeTask(card, dir));
    pickedKeys.add(key);
    if (dir === "ES_PL") countESPL++;
    else countPLES++;
    return true;
  };

  // 2. Kategoryzacja (jedno przejście po kartach)
  const due: { card: Flashcard; dir: Direction; score: number }[] = [];
  const freshNew: { card: Flashcard; dir: Direction }[] = [];
  const directions: Direction[] = ["ES_PL", "PL_ES"];

  for (const card of cards) {
    const state = progress[card.id];

    for (const dir of directions) {
      const sDir = state[dir];

      if (isNewState(sDir)) {
        freshNew.push({ card, dir });
      } else if (sDir.dueAt <= options.now) {
        due.push({ card, dir, score: overdueScore(sDir, options.now) });
      }
    }
  }

  due.sort((a, b) => b.score - a.score);

  // 3. Budowanie kolejki (Miksowanie)
  const targetESPL = Math.round(options.batchSize * options.mixESPL);

  // Priorytet 1: Due z zachowaniem limitu kierunku
  for (const item of due) {
    const isESPL = item.dir === "ES_PL";
    const canTake = isESPL
      ? countESPL < targetESPL
      : countPLES < options.batchSize - targetESPL;

    if (canTake) {
      tryTake(item.card, item.dir); // tu liczniki się zaktualizują
    }
  }

  const canTakeWithMix = (dir: Direction) => {
    if (dir === "ES_PL") return countESPL < targetESPL;
    return countPLES < options.batchSize - targetESPL;
  };
  // Priorytet 2: Dopełnienie pozostałymi due (bez względu na miks)
  for (const item of due) tryTake(item.card, item.dir);

  // Priorytet 3: Nowe (z limitem)
  let addedNew = 0;
  for (const item of freshNew) {
    if (queue.length >= options.batchSize) break;
    if (addedNew >= options.newPerSession) break;

    // respektuj miks
    if (!canTakeWithMix(item.dir)) continue;

    if (tryTake(item.card, item.dir)) {
      addedNew++;
    }
  }
  return { queue, progress };
}
