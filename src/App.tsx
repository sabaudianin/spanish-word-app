import { useEffect } from "react";
import { SEED_CARDS } from "./features/flashcards/seed";
import {
  ensureProgress,
  loadProgress,
  saveProgress,
} from "./features/flashcards/storage";

function App() {
  useEffect(() => {
    const now = Date.now();
    let progress = loadProgress();
    for (const card of SEED_CARDS) {
      progress = ensureProgress(progress, card.id, now);
    }
    saveProgress(progress);
  }, []);

  return (
    <section className="text-center">
      <div className="container py-4">
        <h1 className="h3">ESPANOLA APP by RafBob</h1>
      </div>
    </section>
  );
}

export default App;
