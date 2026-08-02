import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  getRiskCell,
  getOpportunityCell,
  LIKELIHOOD_LEVELS,
  NEGATIVE_CONSEQUENCE_LEVELS,
  POSITIVE_CONSEQUENCE_LEVELS,
} from '../src/lib/merdeka.js';

describe('Merdeka Matrix', () => {
  it('correctly maps Likely (4) + Major (4) to Extreme risk score 22', () => {
    const result = getRiskCell(4, 4);
    assert.equal(result.score, 22);
    assert.equal(result.level, 'Extreme');
  });

  it('correctly maps Possible (3) + Significant (4) to Important opportunity score 12', () => {
    const result = getOpportunityCell(3, 4);
    assert.equal(result.score, 12);
    assert.equal(result.level, 'Important');
  });

  it('contains 5 levels for likelihood, negative consequence, and positive consequence', () => {
    assert.equal(LIKELIHOOD_LEVELS.length, 5);
    assert.equal(NEGATIVE_CONSEQUENCE_LEVELS.length, 5);
    assert.equal(POSITIVE_CONSEQUENCE_LEVELS.length, 5);
  });
});
