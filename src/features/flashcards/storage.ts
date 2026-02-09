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
  if (!progress[cardId]) return progress;

  const init: CardProgress = {
    ES_PL: makeInitialState("ES_PL", now),
    PL_ES: makeInitialState("PL_ES", now),
  };
  return { ...progress, [cardId]: init };
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
