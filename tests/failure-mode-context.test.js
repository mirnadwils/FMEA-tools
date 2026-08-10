import test from 'node:test';
import assert from 'node:assert/strict';
import { getFailureModeContextFields } from '../src/lib/failure-mode-context.js';

test('returns non-empty FM context fields in workshop order and selected language', () => {
  const fields = getFailureModeContextFields({
    category: { id: 'Kategori', en: 'Category' },
    title: { id: 'Mode gagal', en: 'Failure mode' },
    notes: { id: 'Catatan', en: 'Notes' },
    ownerAction: { id: 'Pemilik', en: 'Owner' },
  }, 'en');

  assert.deepEqual(fields.map(({ key, value }) => [key, value]), [
    ['category', 'Category'],
    ['title', 'Failure mode'],
    ['notes', 'Notes'],
    ['ownerAction', 'Owner'],
  ]);
  assert.equal(fields.find((field) => field.key === 'notes').highlighted, true);
});

test('falls back to supplied FM language instead of returning blank', () => {
  const fields = getFailureModeContextFields({ title: { id: 'Mode gagal', en: '' } }, 'en');
  assert.equal(fields[0].value, 'Mode gagal');
});

test('defines all eleven facilitator and assessment context fields', () => {
  const fields = getFailureModeContextFields({
    category: 'a', title: 'b', mechanism: 'c', initiation: 'd', continuation: 'e',
    progression: 'f', detectionMonitoring: 'g', intervention: 'h', effect: 'i',
    notes: 'j', ownerAction: 'k',
  }, 'id');
  assert.equal(fields.length, 11);
});

test('returns no context rows for absent optional FM fields', () => {
  assert.deepEqual(getFailureModeContextFields({ title: 'Only title' }, 'en').map((field) => field.key), ['title']);
});
