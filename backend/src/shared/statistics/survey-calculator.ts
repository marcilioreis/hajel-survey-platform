// src/shared/statistics/survey-calculator.ts
// Funções puras para dimensionamento amostral (calculadora de margem de erro).
// Fonte única da verdade dos cálculos no backend; o frontend espelha estas fórmulas
// apenas para feedback otimista — o valor persistido é sempre recalculado aqui.

export interface CalculatorParams {
  /** Nível de confiança como fração (ex.: 0.95). */
  confidenceLevel: number;
  /** Proporção esperada como fração (ex.: 0.5). */
  expectedProportion: number;
  /** Tamanho da população; undefined/null → população infinita. */
  populationSize?: number | null;
}

const Z_SCORES: Record<string, number> = {
  '0.9': 1.645,
  '0.95': 1.96,
  '0.99': 2.576,
};

/** Valor crítico Z da normal para o nível de confiança (fração). Fallback 1.96 (95%). */
export function getZScore(confidence: number): number {
  return Z_SCORES[String(confidence)] ?? 1.96;
}

/**
 * Margem de erro (fração, ex.: 0.05) a partir do tamanho da amostra.
 * População infinita: e = Z * sqrt(p*q / n)
 * População finita:   e = Z * sqrt(p*q*(N-n) / (n*(N-1)))
 */
export function calcMarginOfError(sampleSize: number, params: CalculatorParams): number {
  const Z = getZScore(params.confidenceLevel);
  const p = params.expectedProportion;
  const q = 1 - p;
  const N = params.populationSize;

  if (N && N > 1 && sampleSize <= N) {
    return Z * Math.sqrt((p * q * (N - sampleSize)) / (sampleSize * (N - 1)));
  }
  return Z * Math.sqrt((p * q) / sampleSize);
}

/**
 * Tamanho mínimo de amostra (arredondado para cima) a partir da margem de erro (fração).
 * População infinita: n = Z²*p*q / e²
 * População finita:   n = N*Z²*p*q / ((N-1)*e² + Z²*p*q)
 */
export function calcSampleSize(marginOfError: number, params: CalculatorParams): number {
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

/**
 * Amostra ajustada pela taxa de resposta esperada (fração, 0 < r ≤ 1).
 * Representa o número de abordagens necessárias para obter `n` respostas válidas.
 */
export function adjustSampleForResponseRate(n: number, responseRate?: number | null): number {
  if (!responseRate || responseRate <= 0 || responseRate > 1) return n;
  return Math.ceil(n / responseRate);
}
