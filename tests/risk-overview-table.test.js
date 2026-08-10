import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_RISK_OVERVIEW_SORT,
  getRiskOverviewTableRows,
  toggleRiskOverviewSort,
} from '../src/lib/risk-overview-table.js';

const rows = [
  { fmNo: 'FM-10', title: 'Leak at crest', hasData: true, riskLevel: 'High', roundedLikelihood: 4, roundedConsequence: 3, riskScore: 20 },
  { fmNo: 'FM-2', title: 'Settlement', hasData: true, riskLevel: 'Moderate', roundedLikelihood: 2, roundedConsequence: 2, riskScore: 8 },
  { fmNo: 'FM-3', title: 'Unassessed drain', hasData: false, riskLevel: null, roundedLikelihood: null, roundedConsequence: null, riskScore: 0 },
];

test('searches FM number and localized title case-insensitively', () => {
  assert.deepEqual(getRiskOverviewTableRows(rows, { query: 'fm-2', dataStatus: 'all', riskLevel: 'all', sort: DEFAULT_RISK_OVERVIEW_SORT }).map((row) => row.fmNo), ['FM-2']);
  assert.deepEqual(getRiskOverviewTableRows(rows, { query: 'CREST', dataStatus: 'all', riskLevel: 'all', sort: DEFAULT_RISK_OVERVIEW_SORT }).map((row) => row.fmNo), ['FM-10']);
});

test('combines status and risk-level filters', () => {
  assert.deepEqual(getRiskOverviewTableRows(rows, { query: '', dataStatus: 'hasData', riskLevel: 'High', sort: DEFAULT_RISK_OVERVIEW_SORT }).map((row) => row.fmNo), ['FM-10']);
  assert.deepEqual(getRiskOverviewTableRows(rows, { query: '', dataStatus: 'noData', riskLevel: 'all', sort: DEFAULT_RISK_OVERVIEW_SORT }).map((row) => row.fmNo), ['FM-3']);
});

test('repeated sort on the same column reverses direction', () => {
  const ascending = toggleRiskOverviewSort(DEFAULT_RISK_OVERVIEW_SORT, 'fmNo');
  assert.deepEqual(ascending, { key: 'fmNo', direction: 'asc' });
  assert.deepEqual(toggleRiskOverviewSort(ascending, 'fmNo'), { key: 'fmNo', direction: 'desc' });
});

test('returns a sorted copy without mutating radar source rows', () => {
  const original = [...rows];
  getRiskOverviewTableRows(rows, { query: '', dataStatus: 'all', riskLevel: 'all', sort: { key: 'fmNo', direction: 'asc' } });
  assert.deepEqual(rows, original);
});
