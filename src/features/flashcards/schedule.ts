import type {
  Flashcard,
  PracticeTask,
  ProgressStore,
  Direction,
  PracticeState,
} from "./model";
import { ensureProgress } from "./storage";

export type SessionOptions = {
  now: number;
  batchSize: number;
  newPerSession: number;
  mixESPL: number;
};

function isNewState(session: PracticeState): boolean {
  return session.totalReviews === 0;
}

function makeTask(card: Flashcard, dir: Direction): PracticeTask {
  const prompt = dir === "ES_PL" ? card.es : card.pl;
  const expected =
    dir === "ES_PL"
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
  const pickedKeys = new Set<string>();

  let countESPL = 0;
  let countPLES = 0;

  for (const card of cards) {
    progress = ensureProgress(progress, card.id, options.now);
  }

  const targetESPL = Math.round(options.batchSize * options.mixESPL);

  const canTakeWithMix = (dir: Direction) => {
    if (dir === "ES_PL") return countESPL < targetESPL;
    return countPLES < options.batchSize - targetESPL;
  };

  const tryTake = (card: Flashcard, dir: Direction): boolean => {
    const key = `${card.id}_${dir}`;
    if (pickedKeys.has(key) || queue.length >= options.batchSize) return false;

    queue.push(makeTask(card, dir));
    pickedKeys.add(key);

    if (dir === "ES_PL") countESPL++;
    else countPLES++;

    return true;
  };

  const due: { card: Flashcard; dir: Direction; score: number }[] = [];
  const freshNew: { card: Flashcard; dir: Direction }[] = [];
  const directions: Direction[] = ["ES_PL", "PL_ES"];

  for (const card of cards) {
    const state = progress[card.id];
    if (!state) continue;

    for (const dir of directions) {
      const sDir = state[dir];
      if (!sDir) continue;
      if (isNewState(sDir)) {
        freshNew.push({ card, dir });
      } else if (sDir.dueAt <= options.now) {
        due.push({ card, dir, score: overdueScore(sDir, options.now) });
      }
    }
  }

  due.sort((a, b) => b.score - a.score);

  // Priorytet 1: Due z miksowaniem
  for (const item of due) {
    if (!canTakeWithMix(item.dir)) continue;
    tryTake(item.card, item.dir);
  }

  // Priorytet 2: Dopełnij due bez miksu
  for (const item of due) {
    tryTake(item.card, item.dir);
  }

  // Priorytet 3: Nowe (limit + miks)
  let addedNew = 0;
  for (const item of freshNew) {
    if (queue.length >= options.batchSize) break;
    if (addedNew >= options.newPerSession) break;
    if (!canTakeWithMix(item.dir)) continue;

    if (tryTake(item.card, item.dir)) addedNew++;
  }

  return { queue, progress };
}
