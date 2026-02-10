import type { PracticeState } from "./model";
import type { EvalQuality } from "./evaluator";

const MIN_EASE = 1.3;
const MAX_EASE = 3.0;
const DAY_MS = 24 * 60 * 60 * 1000;

const LEARNING_STEPS_DAYS = [10 / (24 * 60), 1, 3] as const;

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function isLearning(s: PracticeState): boolean {
  return s.totalReviews < LEARNING_STEPS_DAYS.length;
}

export function applyReviewResult(
  state: PracticeState,
  quality: EvalQuality,
  now: number,
): PracticeState {
  const next = { ...state };
  next.lastReviewedAt = now;
  next.totalReviews = (state.totalReviews ?? 0) + 1;

  // 1. Obliczenia logiki (zmiana interwału i ease)
  if (isLearning(state)) {
    const currentStep = clamp(state.streak, 0, LEARNING_STEPS_DAYS.length - 1);

    if (quality === "no") {
      next.streak = 0;
      next.lapses += 1;
      next.intervalDays = LEARNING_STEPS_DAYS[0];
    } else if (quality === "typo") {
      // Zostajemy na tym samym kroku, streak bez zmian lub reset
      next.intervalDays = LEARNING_STEPS_DAYS[currentStep];
    } else {
      // Exact - idziemy do przodu
      next.streak += 1;
      const nextStep = clamp(next.streak, 0, LEARNING_STEPS_DAYS.length - 1);
      next.intervalDays = LEARNING_STEPS_DAYS[nextStep];
      next.ease = clamp(next.ease + 0.02, MIN_EASE, MAX_EASE);
    }
  } else {
    // REVIEW MODE
    if (quality === "no") {
      next.streak = 0;
      next.lapses += 1;
      next.ease = clamp(next.ease - 0.2, MIN_EASE, MAX_EASE);
      next.intervalDays = 1;
    } else if (quality === "typo") {
      next.streak = 0;
      next.intervalDays = Math.max(1, next.intervalDays * 1.1);
    } else {
      next.streak += 1;
      next.ease = clamp(next.ease + 0.05, MIN_EASE, MAX_EASE);
      // Dodajemy (±5%)
      const fuzz = 0.95 + Math.random() * 0.1;
      next.intervalDays = Math.max(1, next.intervalDays * next.ease * fuzz);
    }
  }

  // 2. Wspólna aktualizacja daty (na samym końcu)
  next.dueAt = now + Math.round(next.intervalDays * DAY_MS);

  return next;
}
