import type { Flashcard } from "./model";

const now = Date.now();

export const SEED_CARDS: Flashcard[] = [
  {
    id: "salud-001",
    es: "dolor",
    fon: "do-LOR",
    pl: "ból",
    tags: ["zdrowie"],
    createdAt: now,
  },
  {
    id: "escuela-001",
    es: "cuaderno",
    fon: "kwa-DER-no",
    pl: "zeszyt",
    tags: ["szkoła"],
    createdAt: now,
  },
  {
    id: "viaje-001",
    es: "billete",
    fon: "bi-ʎE-te",
    pl: "bilet",
    tags: ["podróże"],
    createdAt: now,
  },
];
