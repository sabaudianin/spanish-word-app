import type {
  CardProgress,
  Direction,
  PracticeState,
  ProgressStore,
} from "./model";

const LS_KEY = "espanola_progress.v1";
const DEFAULT_EASE = 2.3;

function makeInitialState(dir: Direction, now: number): PracticeState {
  return {
    dir,
    dueAt: now,
    intervalDays: 0,
    ease: DEFAULT_EASE,
    streak: 0,
    lapses: 0,
    lastReviewedAt: null,
    totalReviews: 0,
    lastGrade: null,
  };
}

export function ensureProgress(
  progress: ProgressStore,
  cardId: string,
  now: number,
): ProgressStore {
  const existing = progress[cardId];

  const init: CardProgress = {
    ES_PL: makeInitialState("ES_PL", now),
    PL_ES: makeInitialState("PL_ES", now),
  };

  // 1) brak wpisu → dodaj
  if (!existing) {
    return { ...progress, [cardId]: init };
  }

  // 2) wpis jest, ale brakuje kierunków → uzupełnij
  const fixed: CardProgress = {
    ES_PL: existing.ES_PL ?? init.ES_PL,
    PL_ES: existing.PL_ES ?? init.PL_ES,
  };

  // jeśli już kompletne → zwróć bez zmian
  if (existing.ES_PL && existing.PL_ES) return progress;

  return { ...progress, [cardId]: fixed };
}

export function loadProgress(): ProgressStore {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as ProgressStore;
  } catch {
    return {};
  }
}

export function saveProgress(progress: ProgressStore): void {
  localStorage.setItem(LS_KEY, JSON.stringify(progress));
}
