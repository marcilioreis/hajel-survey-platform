// Espelho das funções de cálculo do backend (backend/src/shared/statistics/survey-calculator.ts).
// Usado apenas para feedback otimista na UI; o valor persistido é sempre recalculado no servidor.

export interface CalculatorParams {
  /** Nível de confiança como fração (ex.: 0.95). */
  confidenceLevel: number;
  /** Proporção esperada como fração (ex.: 0.5). */
  expectedProportion: number;
  /** Tamanho da população; undefined/null → população infinita. */
  populationSize?: number | null;
}

const Z_SCORES: Record<string, number> = {
  "0.9": 1.645,
  "0.95": 1.96,
  "0.99": 2.576,
};

/** Valor crítico Z da normal para o nível de confiança (fração). Fallback 1.96 (95%). */
export function getZScore(confidence: number): number {
  return Z_SCORES[String(confidence)] ?? 1.96;
}

/** Margem de erro (fração) a partir do tamanho da amostra. */
export function calcMarginOfError(
  sampleSize: number,
  params: CalculatorParams,
): number {
  const Z = getZScore(params.confidenceLevel);
  const p = params.expectedProportion;
  const q = 1 - p;
  const N = params.populationSize;

  if (N && N > 1 && sampleSize <= N) {
    return Z * Math.sqrt((p * q * (N - sampleSize)) / (sampleSize * (N - 1)));
  }
  return Z * Math.sqrt((p * q) / sampleSize);
}

/** Tamanho mínimo de amostra (arredondado para cima) a partir da margem de erro (fração). */
export function calcSampleSize(
  marginOfError: number,
  params: CalculatorParams,
): number {
  const Z = getZScore(params.confidenceLevel);
  const p = params.expectedProportion;
  const q = 1 - p;
  const N = params.populationSize;
  const zpq = Z * Z * p * q;

  if (N && N > 1) {
    const numerator = N * zpq;
    const denominator = (N - 1) * marginOfError * marginOfError + zpq;
    return Math.min(Math.ceil(numerator / denominator), N);
  }
  return Math.ceil(zpq / (marginOfError * marginOfError));
}

/** Amostra ajustada pela taxa de resposta esperada (fração, 0 < r ≤ 1). */
export function adjustSampleForResponseRate(
  n: number,
  responseRate?: number | null,
): number {
  if (!responseRate || responseRate <= 0 || responseRate > 1) return n;
  return Math.ceil(n / responseRate);
}

/** Formata uma fração como porcentagem (ex.: 0.05 → "5,0%"). */
export function formatPercent(frac: number, digits = 1): string {
  return `${(frac * 100).toLocaleString("pt-BR", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })}%`;
}
