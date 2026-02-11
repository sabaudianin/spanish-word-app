import { useEffect, useState } from "react";
import { SEED_CARDS } from "./features/flashcards/seed";
import {
  ensureProgress,
  loadProgress,
  saveProgress,
} from "./features/flashcards/storage";
import type { ProgressStore } from "./features/flashcards/model";
import { Trainer } from "./components/trainer/Trainer";

function initProgress(): ProgressStore {
  const now = Date.now();
  let progress = loadProgress();
  for (const card of SEED_CARDS) {
    progress = ensureProgress(progress, card.id, now);
  }
  return progress;
}

function App() {
  const [progress, setProgress] = useState<ProgressStore>(() => initProgress());

  useEffect(() => {
    saveProgress(progress);
  }, [progress]);

  return (
    <section className="text-center">
      <div className="container py-4">
        <h1 className="h3">ESPANOLA APP by RafBob</h1>
        <Trainer
          cards={SEED_CARDS}
          progress={progress}
          setProgress={setProgress}
        />
      </div>
    </section>
  );
}

export default App;
