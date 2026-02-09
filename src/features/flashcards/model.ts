export type Direction = "ES_PL" | "PL_ES";

export type Flashcard = {
  id: string;
  es: string;
  pl: string;
  fon?: string;
  tags: string[];
  esAlt?: string[];
  plAlt?: [];
  notes?: string;
  createdAt: number;
};

export type Grade = 0 | 1 | 2 | 3 | 4;

export type PracticeState = {
  dir: Direction;
  dueAt: number; // timestamp
  intervalDays: number; // interwał w dniach
  ease: number; // np. 2.3 start
  streak: number;
  lapses: number;
  lastReviewedAt: number | null;
  totalReviews: number;
  lastGrade: Grade | null;
};

export type CardProgress = Record<Direction, PracticeState>;
export type ProgressStore = Record<string, CardProgress>; // key = cardId

export type PracticeTask = {
  cardId: string;
  dir: Direction;
  prompt: string;
  expected: string[]; // akceptowane odpowiedzi (np. alt)
  hint?: string; // np. fon
  tags: string[];
};
