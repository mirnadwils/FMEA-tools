import test from 'node:test';
import assert from 'node:assert/strict';
import { buildMemberProgress } from '../src/lib/member-progress.js';

test('reports complete and incomplete FM numbers without rating values', () => {
  const [member] = buildMemberProgress(
    [{ id: 7, display_name: 'Siti', email: 'siti@example.com', professional_role_key: 'geotech', experience_level: 'expert' }],
    ['FM-1', 'FM-2', 'FM-3'],
    [
      { member_id: 7, fm_no: 'FM-1', risk_likelihood: 4, negative_consequence: 3 },
      { member_id: 7, fm_no: 'FM-2', risk_likelihood: 2, negative_consequence: null },
    ],
  );

  assert.deepEqual(member.completedFmNos, ['FM-1']);
  assert.deepEqual(member.incompleteFmNos, ['FM-2', 'FM-3']);
  assert.equal(member.completedCount, 1);
  assert.equal(member.totalFmCount, 3);
  assert.equal('risk_likelihood' in member, false);
  assert.equal('negative_consequence' in member, false);
});

test('marks every imported FM incomplete when a member has no drafts', () => {
  const [member] = buildMemberProgress([{ id: 8, display_name: 'Budi' }], ['FM-1'], []);
  assert.deepEqual(member.completedFmNos, []);
  assert.deepEqual(member.incompleteFmNos, ['FM-1']);
});

import { readFile } from 'node:fs/promises';
test('membership route returns progress only from the facilitator branch', async () => {
  const route = await readFile(new URL('../src/app/api/sessions/[code]/membership/route.js', import.meta.url), 'utf8');
  assert.match(route, /getSessionMembersWithProgress/);
  assert.match(route, /if \(appRole === 'facilitator'\)/);
});

test('returns zero progress lists when the session has no imported FMs', () => {
  const [member] = buildMemberProgress([{ id: 9, display_name: 'No FM' }], [], []);
  assert.deepEqual(member.completedFmNos, []);
  assert.deepEqual(member.incompleteFmNos, []);
  assert.equal(member.totalFmCount, 0);
});
