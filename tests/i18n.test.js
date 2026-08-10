import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
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

  it('keeps current experience weights unchanged', () => {
    assert.equal(EXPERIENCE_LEVELS.length, 3);
    assert.deepEqual(EXPERIENCE_LEVELS.map((level) => level.weight), [1, 3, 5]);
  });

  it('uses Bidang Pekerjaan and Field Work for the profile field', () => {
    assert.equal(t('id', 'profile.role'), 'Bidang Pekerjaan');
    assert.equal(t('en', 'profile.role'), 'Field Work');
  });

  it('keeps stable keys but uses the approved changed field-work labels', () => {
    const byKey = Object.fromEntries(PROFESSIONAL_ROLES.map((role) => [role.key, role.label]));
    assert.deepEqual(byKey.dam_engineer, { id: 'Bidang Bendungan', en: 'Dam' });
    assert.deepEqual(byKey.geotech, { id: 'Bidang Geoteknik', en: 'Geotechnical' });
    assert.deepEqual(byKey.environmental, { id: 'Bidang Lingkungan & Sosial', en: 'Environmental & Social' });
    assert.deepEqual(byKey.other, { id: 'Lainnya', en: 'Other' });
  });

  it('describes an incomplete profile using field-work terminology', () => {
    assert.ok(t('id', 'error.profile_incomplete').includes('Bidang Pekerjaan'));
    assert.ok(t('en', 'error.profile_incomplete').includes('Field Work'));
  });

  it('updates existing seeded field-work labels without changing stable keys', async () => {
    const migration = await readFile(new URL('../src/lib/migrate.js', import.meta.url), 'utf8');
    assert.match(migration, /key: 'dam_engineer', en: 'Dam', id: 'Bidang Bendungan'/);
    assert.match(migration, /ON CONFLICT \(key\) DO UPDATE SET label_en = EXCLUDED\.label_en, label_id = EXCLUDED\.label_id/);
  });
});
