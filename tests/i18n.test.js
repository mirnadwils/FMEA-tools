import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { t, PROFESSIONAL_ROLES, EXPERIENCE_LEVELS } from '../src/lib/i18n.js';

describe('i18n Translations', () => {
  it('returns Indonesian copy for experience.beginner', () => {
    assert.ok(t('id', 'experience.beginner').includes('Pemula'));
  });

  it('returns English copy for experience.beginner', () => {
    assert.ok(t('en', 'experience.beginner').includes('Beginner'));
  });

  it('includes 20 professional roles as specified', () => {
    assert.equal(PROFESSIONAL_ROLES.length, 20);
  });

  it('includes 3 experience levels with correct weights (1, 2, 3)', () => {
    assert.equal(EXPERIENCE_LEVELS.length, 3);
    assert.equal(EXPERIENCE_LEVELS[0].weight, 1);
    assert.equal(EXPERIENCE_LEVELS[1].weight, 2);
    assert.equal(EXPERIENCE_LEVELS[2].weight, 3);
  });
});
