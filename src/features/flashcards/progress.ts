import type { Direction, ProgressStore } from "./model";
import type { EvalQuality } from "./evaluator";
import { applyReviewResult } from "./review";

export function updateProgressAfterAnswer(
  progress: ProgressStore,
  cardId: string,
  dir: Direction,
  quality: EvalQuality,
  now: number,
): ProgressStore {
  const cardProgress = progress[cardId];
  const prev = cardProgress[dir];
  const next = applyReviewResult(prev, quality, now);

  return {
    ...progress,
    [cardId]: { ...cardProgress, [dir]: next },
  };
}
