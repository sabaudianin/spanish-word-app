import { useMemo, useState } from "react";
import type {
  Flashcard,
  PracticeTask,
  ProgressStore,
} from "../../features/flashcards/model";
import { buildSessionQueue } from "../../features/flashcards/schedule";
import { evaluateAnswer } from "../../features/flashcards/evaluator";
import { updateProgressAfterAnswer } from "../../features/flashcards/progress";
import { saveProgress } from "../../features/flashcards/storage";

type TrainerProps = {
  cards: Flashcard[];
  progress: ProgressStore;
  setProgress: (p: ProgressStore) => void;
};

type CheckState =
  | { status: "idle" }
  | {
      status: "checked";
      quality: "exact" | "typo" | "no";
      matched: string | null;
    };

export const Trainer = ({ cards, progress, setProgress }: TrainerProps) => {
  const [sesionNow] = useState(() => Date.now());
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [check, setCheck] = useState<CheckState>({ status: "idle" });

  //budujemy kolejke render
  const { queue } = useMemo(() => {
    return buildSessionQueue(cards, progress, {
      now: sesionNow,
      batchSize: 20,
      newPerSession: 10,
      mixESPL: 0.7,
    });
  }, [cards, sesionNow, progress]);

  const task: PracticeTask | undefined = queue[index];
  const isDone = !task;
  const handleCheck = () => {
    const res = evaluateAnswer(answer, task.expected, 2);
    setCheck({ status: "checked", quality: res.quality, matched: res.matched });

    const quality = res.quality;
    const nextProgress = updateProgressAfterAnswer(
      progress,
      task.cardId,
      task.dir,
      quality,
      Date.now(),
    );
    setProgress(nextProgress);
  };

  const handleNext = () => {
    setAnswer("");
    setCheck({ status: "idle" });
    setIndex((i) => i + 1);
  };

  const dirLabel = (dir: PracticeTask["dir"]) =>
    dir === "ES_PL" ? "ES->PL" : "PL->ES";

  const qualityBadge = (q: "exact" | "typo" | "no") => {
    switch (q) {
      case "exact":
        return <span className="badge text-bg-success">OK</span>;
      case "typo":
        return <span className="badge text-bg-warning">Literówka</span>;

      case "no":
        return <span className="badge text-bg-danger">Błąd</span>;
      default:
        return null;
    }
  };

  if (isDone) {
    return (
      <div className="card">
        <div className="card-body">
          <h2 className="h5 mb-2">Sesja Zakończona !</h2>
          <p className="text-muted mb-0">Nie ma więcej zadań w kolejce</p>
        </div>
      </div>
    );
  }

  return (
    <section className="card">
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-center mb-2">
          <div className="text-muted mb-2">
            {index + 1}/{queue.length}-{dirLabel(task.dir)}
          </div>
          <div className="text-muted small">
            {task.tags.map((t) => (
              <span
                key={t}
                className="badge text-bg-light me-1"
              ></span>
            ))}
          </div>
        </div>

        <div className="mb-2">
          <div className="h4 mb-1">{task.prompt}</div>
          {task.hint && <div className="text-muted">{task.hint}</div>}
        </div>

        <div className="mb-3">
          <label className="form-label">Odpowiedź</label>
          <input
            className="form-control"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Wpisz tłumaczenie"
            disabled={check.status === "checked"}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                if (check.status === "idle") handleCheck();
                else handleNext();
              }
            }}
          />
        </div>

        {check.status === "checked" && (
          <div className="mb-3">
            {qualityBadge(check.quality)}
            <span className="ms-2 text-muted">
              Poprawnie:<b>{task.expected[0]}</b>
            </span>
          </div>
        )}

        <div className="d-flex gap-2">
          {check.status === "idle" ? (
            <button
              className="btn-primary"
              onClick={handleCheck}
              disabled={!answer.trim()}
            >
              Sprawdź
            </button>
          ) : (
            <button
              className="btn btn-primary"
              onClick={handleNext}
            >
              Dalej
            </button>
          )}
        </div>
      </div>
    </section>
  );
};
