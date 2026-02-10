export type EvalQuality = "exact" | "typo" | "no";

export type EvalResult = {
  correct: boolean;
  quality: EvalQuality;
  matched: string | null;
};

function normalize(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[.,;:!?]+$/g, "");
}

// usuwa diakrytyki Unicode: ą->a, ł->l, ñ->n, á->a, ü->u, itd.
function stripDiacritics(s: string): string {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function normLoose(s: string): string {
  return stripDiacritics(normalize(s));
}

// Levenshtein distance (edytowanie: wstaw/usuń/zamień)
function levenshtein(a: string, b: string): number {
  const n = a.length;
  const m = b.length;

  // szybkie przypadki
  if (a === b) return 0;
  if (n === 0) return m;
  if (m === 0) return n;

  const dp = new Array(m + 1);
  for (let j = 0; j <= m; j++) dp[j] = j;

  for (let i = 1; i <= n; i++) {
    let prev = dp[0];
    dp[0] = i;
    for (let j = 1; j <= m; j++) {
      const temp = dp[j];
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[j] = Math.min(
        dp[j] + 1, // usun
        dp[j - 1] + 1, // wsatw
        prev + cost, // zamien
      );
      prev = temp;
    }
  }
  return dp[m];
}

export function evaluateAnswer(
  inputRaw: string,
  expectedRaw: string[],
  maxTypos: number = 2,
): EvalResult {
  const input = normLoose(inputRaw);
  if (!input) return { correct: false, quality: "no", matched: null };

  // 1. Szybkie sprawdzenie "exact match" (bez diakrytyków)
  // Szukamy indeksu, aby móc zwrócić oryginalną pisownię z expectedRaw
  const exactIdx = expectedRaw.findIndex((exp) => normLoose(exp) === input);

  if (exactIdx !== -1) {
    return { correct: true, quality: "exact", matched: expectedRaw[exactIdx] };
  }

  // 2. Sprawdzanie literówek
  let bestMatch = { idx: -1, dist: Infinity };

  expectedRaw.forEach((rawExp, idx) => {
    const exp = normLoose(rawExp);

    // Dynamiczny limit zależny od dlugosci słowa,min 1 literówka
    const dynamicLimit = Math.max(
      1,
      Math.min(maxTypos, Math.floor(exp.length * 0.4)),
    );

    const dist = levenshtein(input, exp);
    if (dist < bestMatch.dist && dist <= dynamicLimit) {
      bestMatch = { idx, dist };
    }
  });

  if (bestMatch.idx !== -1) {
    return {
      correct: true,
      quality: "typo",
      matched: expectedRaw[bestMatch.idx],
    };
  }

  return { correct: false, quality: "no", matched: null };
}
