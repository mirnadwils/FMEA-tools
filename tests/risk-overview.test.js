import test from 'node:test';
import assert from 'node:assert/strict';
import { buildRiskOverviewData } from '../src/lib/risk-overview.js';

test('maps every FM to its final Merdeka score and localized tooltip data', () => {
  const result = buildRiskOverviewData(
    [{ no: 'FM-1', title: { id: 'Retak', en: 'Crack' } }, { no: 'FM-2', title: { id: 'Bocor', en: 'Leak' } }],
    [{ fmNo: 'FM-1', riskScore: 22, riskLevel: 'Extreme', avgRiskLikelihood: 4.2, avgNegativeConsequence: 4.1, roundedLikelihood: 4, roundedConsequence: 4, count: 3 }],
    'en'
  );
  assert.deepEqual(result.map(({ fmNo, title, riskScore, hasData }) => ({ fmNo, title, riskScore, hasData })), [
    { fmNo: 'FM-1', title: 'Crack', riskScore: 22, hasData: true },
    { fmNo: 'FM-2', title: 'Leak', riskScore: 0, hasData: false },
  ]);
});

test('marks a session FM with no aggregate as no data and score zero', () => {
  const [item] = buildRiskOverviewData([{ no: 'FM-9', title: 'Unassessed' }], [], 'en');
  assert.equal(item.riskScore, 0);
  assert.equal(item.hasData, false);
  assert.equal(item.riskLevel, null);
});
