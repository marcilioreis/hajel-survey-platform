import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  getZScore,
  calcMarginOfError,
  calcSampleSize,
  adjustSampleForResponseRate,
} from './survey-calculator.js';

const params = { confidenceLevel: 0.95, expectedProportion: 0.5 };

test('getZScore mapeia níveis conhecidos e usa fallback 1.96', () => {
  assert.equal(getZScore(0.9), 1.645);
  assert.equal(getZScore(0.95), 1.96);
  assert.equal(getZScore(0.99), 2.576);
  assert.equal(getZScore(0.5), 1.96);
});

test('calcMarginOfError: população infinita, n=384 → ~5%', () => {
  const e = calcMarginOfError(384, params);
  assert.ok(Math.abs(e - 0.05) < 0.001, `esperado ~0.05, obtido ${e}`);
});

test('calcSampleSize: população infinita, e=5% → 385', () => {
  assert.equal(calcSampleSize(0.05, params), 385);
});

test('calcSampleSize: população finita reduz n e nunca excede N', () => {
  const infinite = calcSampleSize(0.05, params);
  const finite = calcSampleSize(0.05, { ...params, populationSize: 1000 });
  assert.ok(finite < infinite, `finita (${finite}) deve ser < infinita (${infinite})`);
  const tiny = calcSampleSize(0.01, { ...params, populationSize: 200 });
  assert.ok(tiny <= 200, `n (${tiny}) não pode exceder a população (200)`);
});

test('adjustSampleForResponseRate: 384 a 80% → 480', () => {
  assert.equal(adjustSampleForResponseRate(384, 0.8), 480);
  assert.equal(adjustSampleForResponseRate(384, null), 384);
  assert.equal(adjustSampleForResponseRate(384, 0), 384);
});

test('ida e volta: n → margem → n é consistente (aprox.)', () => {
  const n = 600;
  const e = calcMarginOfError(n, params);
  const back = calcSampleSize(e, params);
  assert.ok(Math.abs(back - n) <= 1, `esperado ~${n}, obtido ${back}`);
});
