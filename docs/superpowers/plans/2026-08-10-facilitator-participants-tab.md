# Facilitator Participants Tab Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the facilitator Translation editor with a Participants tab showing identities, Field Work, experience, and anonymous-per-member FM completion progress without exposing individual Risk ratings.

**Architecture:** Compute completion from imported FM numbers and saved draft presence on the server, then return an identity/profile/progress projection only to facilitators through the existing membership endpoint. Render that projection in a dedicated client component controlled by the facilitator dashboard’s existing six-second refresh; participants retain their current aggregate-only endpoint response.

**Tech Stack:** Next.js 16 App Router, React 19, Neon/Postgres, lucide-react, Node built-in test runner, ESLint.

## Global Constraints

- `Translations` disappears from facilitator navigation and the translation editor no longer renders; translation storage and its API are unchanged.
- Only facilitator membership responses include the member list, identity, Field Work, experience, and progress fields.
- A complete FM has both `risk_likelihood` and `negative_consequence`; missing or partial drafts are incomplete.
- Progress includes every imported FM regardless of open/locked/closed state.
- API responses and the tab must never expose individual rating values, draft timestamps, submission snapshots, or experience weights.
- Field Work resolves through stable `professional_role_key` values; `other` displays `custom_role_text` when present.
- Participant membership responses and existing six-second live refresh behavior remain compatible.

---

## File Structure

- Create: `src/lib/member-progress.js` — pure member-progress projection and raw-draft field stripping.
- Create: `tests/member-progress.test.js` — completion, partial draft, no-FM, and privacy-shape tests.
- Modify: `src/lib/users.js` — query member identity/profile, imported FM numbers, and drafts, then return the projection for facilitators.
- Modify: `src/app/api/sessions/[code]/membership/route.js` — call the enriched query only for facilitators while preserving participant output.
- Create: `src/components/ParticipantsTab.jsx` — table/list and accessible expand/collapse progress display.
- Modify: `src/components/FMEAApp.jsx` — remove `TranslationReviewTab`, add `Participants` navigation, poll membership data, and render the new component.

## Task 1: Pure Participant Progress Projection

**Files:**
- Create: `src/lib/member-progress.js`
- Create: `tests/member-progress.test.js`

**Interfaces:**
- Produces: `buildMemberProgress(members, allFmNos, drafts): Array<MemberProgress>`
- `MemberProgress` contains only original identity/profile fields plus `completedFmNos`, `incompleteFmNos`, `completedCount`, and `totalFmCount`.
- Consumed by: `getSessionMembersWithProgress` in Task 2.

- [ ] **Step 1: Write failing tests for complete/partial classification and privacy**

```js
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
```

- [ ] **Step 2: Run the new tests to verify they fail**

Run: `node --test tests/member-progress.test.js`

Expected: FAIL because `src/lib/member-progress.js` does not exist.

- [ ] **Step 3: Implement a projection that never returns drafts**

```js
export function buildMemberProgress(members, allFmNos, drafts) {
  const completeByMember = new Map();
  for (const draft of drafts) {
    if (draft.risk_likelihood != null && draft.negative_consequence != null) {
      if (!completeByMember.has(draft.member_id)) completeByMember.set(draft.member_id, new Set());
      completeByMember.get(draft.member_id).add(draft.fm_no);
    }
  }
  return members.map((member) => {
    const completed = completeByMember.get(member.id) || new Set();
    const completedFmNos = allFmNos.filter((fmNo) => completed.has(fmNo));
    const incompleteFmNos = allFmNos.filter((fmNo) => !completed.has(fmNo));
    return { ...member, completedFmNos, incompleteFmNos, completedCount: completedFmNos.length, totalFmCount: allFmNos.length };
  });
}
```

- [ ] **Step 4: Run the focused tests to verify they pass**

Run: `node --test tests/member-progress.test.js`

Expected: PASS with 2 tests.

- [ ] **Step 5: Commit the privacy-safe projection**

```bash
git add src/lib/member-progress.js tests/member-progress.test.js
git commit -m "feat: summarize member FM progress"
```

## Task 2: Facilitator Membership Progress API

**Files:**
- Modify: `src/lib/users.js:100-128`
- Modify: `src/app/api/sessions/[code]/membership/route.js:42-70`
- Test: `tests/member-progress.test.js`

**Interfaces:**
- Produces: `getSessionMembersWithProgress(sessionCode): Promise<Array<MemberProgress>>`.
- Consumed by: facilitator branch of `GET /api/sessions/[code]/membership`.
- Preserves: participant response `{ myMembership, totalMembers }` with no `members` property.

- [ ] **Step 1: Add a failing source-contract assertion for the facilitator API projection**

```js
import { readFile } from 'node:fs/promises';

test('membership route returns progress only from the facilitator branch', async () => {
  const route = await readFile(new URL('../src/app/api/sessions/[code]/membership/route.js', import.meta.url), 'utf8');
  assert.match(route, /getSessionMembersWithProgress/);
  assert.match(route, /if \(appRole === 'facilitator'\)/);
});
```

- [ ] **Step 2: Run tests to verify the source contract fails**

Run: `node --test tests/member-progress.test.js`

Expected: FAIL because the enriched query function is not yet used.

- [ ] **Step 3: Add an enriched member query and wire the facilitator branch**

Implement `getSessionMembersWithProgress(sessionCode)` in `users.js` with three parameterized queries:

```js
const members = await getSessionMembers(sessionCode);
const fmRows = await query(
  `SELECT fm.fm_no FROM failure_modes fm JOIN sessions s ON fm.session_id = s.id WHERE s.code = $1 ORDER BY fm.id`,
  [sessionCode.toUpperCase()],
);
const drafts = await query(
  `SELECT ad.member_id, ad.fm_no, ad.risk_likelihood, ad.negative_consequence
   FROM assessment_drafts ad
   JOIN session_members sm ON sm.id = ad.member_id
   JOIN sessions s ON s.id = sm.session_id
   WHERE s.code = $1`,
  [sessionCode.toUpperCase()],
);
return buildMemberProgress(members, fmRows.map((row) => row.fm_no), drafts);
```

In the facilitator branch, use this function instead of `getSessionMembers`. Do not add drafts to the JSON response. Keep the non-facilitator branch exactly as it is.

- [ ] **Step 4: Run focused tests and full verification**

Run: `node --test tests/member-progress.test.js && npm test && npm run lint && npm run build`

Expected: all commands exit 0.

- [ ] **Step 5: Commit the facilitator API**

```bash
git add src/lib/users.js src/app/api/sessions/[code]/membership/route.js src/lib/member-progress.js tests/member-progress.test.js
git commit -m "feat: expose facilitator member progress"
```

## Task 3: Participants Tab UI

**Files:**
- Create: `src/components/ParticipantsTab.jsx`
- Test: `tests/member-progress.test.js`

**Interfaces:**
- Consumes: `members: Array<MemberProgress>`, `lang`, and shared `PROFESSIONAL_ROLES` / `EXPERIENCE_LEVELS` labels.
- Produces: `<ParticipantsTab members={members} lang={lang} />`.

- [ ] **Step 1: Extend the green model tests for empty imported-FM lists**

```js
test('returns zero progress lists when the session has no imported FMs', () => {
  const [member] = buildMemberProgress([{ id: 9, display_name: 'No FM' }], [], []);
  assert.deepEqual(member.completedFmNos, []);
  assert.deepEqual(member.incompleteFmNos, []);
  assert.equal(member.totalFmCount, 0);
});
```

- [ ] **Step 2: Run the regression test before building the UI**

Run: `node --test tests/member-progress.test.js`

Expected: PASS. Task 1 owns completion logic; this regression locks the empty-state input used by the tab.

- [ ] **Step 3: Create the accessible participant list**

Implement per-member rows using a `Set` of expanded member IDs in component state. Each compact row shows display name/email, resolved Field Work label, experience label, and localized progress. For `other`, prefer `custom_role_text` over the generic Other label. The expand button must expose `aria-expanded` and include its participant name in `aria-label`.

Expanded content uses two labelled sections:

```jsx
<section><h4>Completed FMs</h4>{member.completedFmNos.length ? member.completedFmNos.map(renderBadge) : <p>No completed FMs.</p>}</section>
<section><h4>Incomplete FMs</h4>{member.incompleteFmNos.length ? member.incompleteFmNos.map(renderBadge) : <p>No incomplete FMs.</p>}</section>
```

Use Indonesian equivalents when `lang === 'id'`. Do not render any field from drafts, submissions, or `assessment_drafts` beyond the provided FM-number arrays.

- [ ] **Step 4: Run unit tests and lint**

Run: `node --test tests/member-progress.test.js && npm run lint`

Expected: both commands exit 0.

- [ ] **Step 5: Commit the Participants component**

```bash
git add src/components/ParticipantsTab.jsx tests/member-progress.test.js
git commit -m "feat: add facilitator participants view"
```

## Task 4: Replace the Translation Navigation Entry

**Files:**
- Modify: `src/components/FMEAApp.jsx:1-27,639-849`
- Test: `tests/member-progress.test.js`

**Interfaces:**
- Consumes: `api.getMembership(session.code)` returning facilitator `members` from Task 2.
- Produces: the `Participants` tab in `FacilitatorDashboard`.
- Removes: `TranslationReviewTab` UI only.

- [ ] **Step 1: Add a failing source-contract assertion for tab replacement**

```js
test('facilitator dashboard no longer renders the Translation editor tab', async () => {
  const app = await readFile(new URL('../src/components/FMEAApp.jsx', import.meta.url), 'utf8');
  assert.match(app, /id: 'participants'/);
  assert.doesNotMatch(app, /TranslationReviewTab/);
});
```

- [ ] **Step 2: Run the focused test to verify it fails**

Run: `node --test tests/member-progress.test.js`

Expected: FAIL because the Translation tab/component still exists.

- [ ] **Step 3: Wire membership data into the existing facilitator refresh**

Add `members` state to `FacilitatorDashboard`. In its existing `refresh` callback, call `api.getMembership(session.code)` and set `members` from `membershipData.members || []`; preserve the existing full-session and live-results requests. Do not add a separate interval in `ParticipantsTab`.

Remove the entire `TranslationReviewTab` function and its now-unused imports. Replace the navigation item with:

```jsx
{ id: 'participants', label: lang === 'id' ? 'Peserta' : 'Participants', icon: <Users size={15} /> }
```

Render `<ParticipantsTab members={members} lang={lang} />` when `tab === 'participants'`. Keep the server translation routes and `api.updateTranslations` export intact, because they are outside this UI removal.

- [ ] **Step 4: Run focused tests, all tests, lint, and production build**

Run: `node --test tests/member-progress.test.js && npm test && npm run lint && npm run build`

Expected: all commands exit 0.

- [ ] **Step 5: Manually verify both roles**

Run: `npm run dev`

As a facilitator, open Participants and verify identity, Field Work, experience, progress, expand/collapse, and live refresh after a participant saves a complete FM. As a participant, call `GET /api/sessions/<code>/membership` and verify the response omits `members`, `completedFmNos`, and `incompleteFmNos`.

- [ ] **Step 6: Commit the navigation replacement**

```bash
git add src/components/FMEAApp.jsx src/components/ParticipantsTab.jsx src/lib/users.js src/app/api/sessions/[code]/membership/route.js src/lib/member-progress.js tests/member-progress.test.js
git commit -m "feat: replace translations with participants tab"
```

## Task 5: Final Requirement Verification

**Files:**
- Verify: `src/lib/member-progress.js`
- Verify: `src/lib/users.js`
- Verify: `src/app/api/sessions/[code]/membership/route.js`
- Verify: `src/components/ParticipantsTab.jsx`
- Verify: `src/components/FMEAApp.jsx`
- Verify: `tests/member-progress.test.js`

- [ ] **Step 1: Verify every approved requirement**

Confirm: Translation tab is absent; Participants tab is facilitator-only; email/name, Field Work, and experience render; completed/incomplete FM lists use only FM numbers; partial drafts are incomplete; all imported FMs count; participant API responses remain private; and the tab uses the existing refresh loop.

- [ ] **Step 2: Run final verification**

Run: `npm test && npm run lint && npm run build`

Expected: all commands exit 0.

- [ ] **Step 3: Commit an evidence-backed correction only if verification exposed one**

```bash
git add src/lib/member-progress.js src/lib/users.js src/app/api/sessions/[code]/membership/route.js src/components/ParticipantsTab.jsx src/components/FMEAApp.jsx tests/member-progress.test.js
git commit -m "fix: verify participants tab privacy"
```
