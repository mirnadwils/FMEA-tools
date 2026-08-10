import test from 'node:test';
import assert from 'node:assert/strict';
import { buildFinalFmDistribution, buildResponseDistribution } from '../src/lib/risk-distribution.js';

test('counts only final FM levels and calculates pie percentages from assessed FMs', () => {
  const result = buildFinalFmDistribution([
    { fmNo: 'FM-1', riskLevel: 'Extreme', hasData: true },
    { fmNo: 'FM-2', riskLevel: 'High', hasData: true },
    { fmNo: 'FM-3', riskLevel: 'High', hasData: true },
    { fmNo: 'FM-4', riskLevel: null, hasData: false },
  ]);
  assert.equal(result.total, 3);
  assert.deepEqual(result.counts, { Extreme: 1, High: 2, Moderate: 0, Low: 0 });
  assert.equal(result.pieData.find((item) => item.name === 'High').percentage, 66.67);
});

test('maps anonymous combination counts into individual Merdeka response levels', () => {
  const rows = [{ fmNo: 'FM-1', title: 'Seepage' }];
  const aggregated = [{
    fmNo: 'FM-1',
    combinationDistribution: {
      1: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 1 },
      2: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      3: { 1: 0, 2: 0, 3: 1, 4: 0, 5: 0 },
      4: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      5: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    },
  }];
  const [result] = buildResponseDistribution(rows, aggregated);
  assert.equal(result.High, 2);
  assert.equal(result.totalResponses, 2);
  assert.equal('riskLikelihood' in result, false);
  assert.equal('negativeConsequence' in result, false);
});

test('keeps no-response FM rows with zero segments for the chart tooltip', () => {
  const [row] = buildResponseDistribution([{ fmNo: 'FM-9', title: 'No data' }], []);
  assert.deepEqual({ Extreme: row.Extreme, High: row.High, Moderate: row.Moderate, Low: row.Low, total: row.totalResponses },
    { Extreme: 0, High: 0, Moderate: 0, Low: 0, total: 0 });
});

import { readFile } from 'node:fs/promises';

test('renders risk distribution dashboard before the global radar', async () => {
  const component = await readFile(new URL('../src/components/RiskOverviewTab.jsx', import.meta.url), 'utf8');
  assert.ok(component.indexOf('<RiskDistributionDashboard') < component.indexOf('<RadarChart'));
});
