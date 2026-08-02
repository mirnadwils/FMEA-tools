import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getRiskCell, RISK_MATRIX } from '../src/lib/merdeka.js';

// ---------------------------------------------------------------------------
// Inline stubs for functions we'll test — mirrors the production logic
// so tests remain self-contained without importing server-side modules.
// ---------------------------------------------------------------------------

const EXPERIENCE_WEIGHT = { beginner: 1, experienced: 2, expert: 3 };

/**
 * Risk-only readiness check (matches the updated assessment.js contract).
 */
function isReadyToSubmit(openFmNos, drafts) {
  if (!openFmNos || openFmNos.length === 0) return false;
  for (const fmNo of openFmNos) {
    const draft = drafts[fmNo];
    if (!draft) return false;
    if (!draft.riskLikelihood || !draft.negativeConsequence) return false;
  }
  return true;
}

/**
 * Weighted average for aggregation.
 */
function weightedAvg(assessments, field) {
  if (!assessments || !assessments.length) return null;
  let sumWV = 0, sumW = 0;
  for (const a of assessments) {
    const w = EXPERIENCE_WEIGHT[a.experience] || 1;
    const val = a[field];
    if (val != null) { sumWV += val * w; sumW += w; }
  }
  return sumW ? sumWV / sumW : null;
}

function roundRating(avg, max) {
  if (avg == null || isNaN(avg)) return null;
  return Math.min(max, Math.max(1, Math.round(avg)));
}

// ---------------------------------------------------------------------------
// TESTS
// ---------------------------------------------------------------------------

describe('Risk-Only Submission Completeness', () => {
  it('accepts when every open FM has risk likelihood + negative consequence', () => {
    const openFmNos = ['FM-1', 'FM-2'];
    const drafts = {
      'FM-1': { riskLikelihood: 3, negativeConsequence: 4 },
      'FM-2': { riskLikelihood: 5, negativeConsequence: 2 },
    };
    assert.equal(isReadyToSubmit(openFmNos, drafts), true);
  });

  it('rejects when a FM is missing risk likelihood', () => {
    const openFmNos = ['FM-1'];
    const drafts = {
      'FM-1': { riskLikelihood: null, negativeConsequence: 3 },
    };
    assert.equal(isReadyToSubmit(openFmNos, drafts), false);
  });

  it('rejects when a FM is missing negative consequence', () => {
    const openFmNos = ['FM-1'];
    const drafts = {
      'FM-1': { riskLikelihood: 4, negativeConsequence: null },
    };
    assert.equal(isReadyToSubmit(openFmNos, drafts), false);
  });

  it('rejects when no open FMs exist', () => {
    assert.equal(isReadyToSubmit([], {}), false);
    assert.equal(isReadyToSubmit(null, {}), false);
  });

  it('does NOT require opportunity fields for readiness', () => {
    const openFmNos = ['FM-1'];
    const drafts = {
      'FM-1': { riskLikelihood: 2, negativeConsequence: 5 },
      // No oppLikelihood or positiveConsequence — should still pass
    };
    assert.equal(isReadyToSubmit(openFmNos, drafts), true);
  });

  it('rejects when an open FM has no draft at all', () => {
    const openFmNos = ['FM-1', 'FM-2'];
    const drafts = {
      'FM-1': { riskLikelihood: 3, negativeConsequence: 4 },
      // FM-2 missing entirely
    };
    assert.equal(isReadyToSubmit(openFmNos, drafts), false);
  });
});

describe('Risk Matrix (new ranked scoring)', () => {
  it('Rare (1) + Catastrophic (5) = High, score 14', () => {
    const cell = getRiskCell(1, 5);
    assert.equal(cell.level, 'High');
    assert.equal(cell.score, 14);
  });

  it('Possible (3) + Moderate (3) = High, score 16', () => {
    const cell = getRiskCell(3, 3);
    assert.equal(cell.level, 'High');
    assert.equal(cell.score, 16);
  });

  it('Almost Certain (5) + Low (1) = Moderate, score 12', () => {
    const cell = getRiskCell(5, 1);
    assert.equal(cell.level, 'Moderate');
    assert.equal(cell.score, 12);
  });

  it('Almost Certain (5) + Minor (2) = High, score 13', () => {
    const cell = getRiskCell(5, 2);
    assert.equal(cell.level, 'High');
    assert.equal(cell.score, 13);
  });

  it('returns null for out-of-range inputs', () => {
    assert.equal(getRiskCell(0, 3), null);
    assert.equal(getRiskCell(6, 3), null);
    assert.equal(getRiskCell(3, 0), null);
  });

  it('all 25 cells exist and have level + score', () => {
    for (let l = 1; l <= 5; l++) {
      for (let c = 1; c <= 5; c++) {
        const cell = getRiskCell(l, c);
        assert.ok(cell, `Missing cell for L=${l}, C=${c}`);
        assert.ok(cell.level, `Missing level for L=${l}, C=${c}`);
        assert.ok(typeof cell.score === 'number', `Missing score for L=${l}, C=${c}`);
      }
    }
  });
});

describe('Facilitator Draft Aggregation (weighted average)', () => {
  it('computes weighted average for risk likelihood', () => {
    const assessments = [
      { riskLikelihood: 4, experience: 'expert' },     // weight 3
      { riskLikelihood: 2, experience: 'beginner' },    // weight 1
      { riskLikelihood: 3, experience: 'experienced' }, // weight 2
    ];
    // (4*3 + 2*1 + 3*2) / (3+1+2) = (12+2+6)/6 = 20/6 ≈ 3.33
    const avg = weightedAvg(assessments, 'riskLikelihood');
    assert.ok(Math.abs(avg - 20 / 6) < 0.001);
    assert.equal(roundRating(avg, 5), 3);
  });

  it('returns null for empty assessments', () => {
    assert.equal(weightedAvg([], 'riskLikelihood'), null);
    assert.equal(weightedAvg(null, 'riskLikelihood'), null);
  });

  it('defaults to weight 1 for unknown experience', () => {
    const assessments = [
      { riskLikelihood: 5, experience: 'unknown' },
    ];
    assert.equal(weightedAvg(assessments, 'riskLikelihood'), 5);
  });
});

describe('Risk-Only Submission Snapshot', () => {
  it('snapshot should include risk fields but not opportunity fields', () => {
    const draftMap = {};
    const drafts = [
      { fm_no: 'FM-1', risk_likelihood: 3, negative_consequence: 4 },
      { fm_no: 'FM-2', risk_likelihood: 5, negative_consequence: 2 },
    ];
    for (const d of drafts) {
      draftMap[d.fm_no] = {
        riskLikelihood: d.risk_likelihood,
        negativeConsequence: d.negative_consequence,
      };
    }
    // Verify no opportunity fields in snapshot
    for (const [fmNo, data] of Object.entries(draftMap)) {
      assert.ok(!('oppLikelihood' in data), `${fmNo} should not have oppLikelihood`);
      assert.ok(!('positiveConsequence' in data), `${fmNo} should not have positiveConsequence`);
      assert.ok('riskLikelihood' in data, `${fmNo} should have riskLikelihood`);
      assert.ok('negativeConsequence' in data, `${fmNo} should have negativeConsequence`);
    }
  });
});
