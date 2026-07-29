# FMEA Clerk + Neon Modernization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver a PT SGO FMEA workshop application where Clerk users resume drafts and submit separate Merdeka Risk and Opportunity assessments stored in NeonDB.

**Architecture:** Clerk owns email authentication and `publicMetadata.appRole`; Neon owns all FMEA data. Protected route handlers authenticate with Clerk and authorize using role plus Neon session membership. A literal, versioned Merdeka matrix drives assessment results and one private PDF belongs to each session.

**Tech Stack:** Next.js 16 App Router, React 19, Clerk, Neon PostgreSQL, Vitest, Testing Library, Lucide, private object storage.

## Global Constraints

- Keep NeonDB; do not add Firestore.
- Only `facilitator` and `participant` are application roles.
- Do not migrate anonymous participants or their votes.
- Use server-side Clerk authentication for every mutation.
- Preserve Merdeka cells, labels, colours, and response guidance exactly as supplied.
- All system-owned copy is Indonesian and English.
- Use test-first development for each production change.

---

## File Structure

- Create `src/lib/auth.js`, `src/lib/i18n.js`, `src/lib/merdeka.js`, `src/lib/assessment.js`, `src/lib/users.js`, and `src/lib/audit.js`.
- Create Clerk route/middleware files and protected profile, membership, assessment, submission, and document API routes.
- Create focused UI units `AppShell`, `AssessmentForm`, and `GuidelineTab`; progressively split `src/components/FMEAApp.jsx` rather than expanding it.
- Modify `src/lib/migrate.js`, existing session routes, `src/lib/api.js`, `src/app/layout.js`, `src/app/page.js`, and CSS.
- Add focused unit, route, and component tests under `tests/`.

## Task 1: Clerk, tests, and protected application shell

**Files:** Modify `package.json`, `src/app/layout.js`, `next.config.mjs`; create `vitest.config.mjs`, `tests/setup.js`, `src/middleware.js`, `src/lib/auth.js`, Clerk sign-in/sign-up routes, `.env.example`, and `tests/lib/auth.test.js`.

**Interfaces:** `getAuthenticatedUser()` returns Clerk identity; `requireAppRole(roles, metadata)` rejects unauthorized callers.

- [ ] **Step 1: Write the failing role test.**

```js
it('rejects a participant when facilitator is required', async () => {
  await expect(requireAppRole(['facilitator'], { appRole: 'participant' }))
    .rejects.toMatchObject({ status: 403 });
});
```

- [ ] **Step 2: Verify RED.** Run `npm run test -- tests/lib/auth.test.js`; expect a missing `@/lib/auth` failure.
- [ ] **Step 3: Install `@clerk/nextjs`, `vitest`, `@vitejs/plugin-react`, `jsdom`, Testing Library; add `test` and `test:watch` scripts.**
- [ ] **Step 4: Implement the smallest guard, ClerkProvider, Clerk pages, and current Clerk 16-compatible middleware.**

```js
export async function requireAppRole(allowed, metadata) {
  if (!allowed.includes(metadata?.appRole)) {
    throw Object.assign(new Error('Forbidden'), { status: 403 });
  }
}
```

- [ ] **Step 5: Verify GREEN.** Run `npm run test -- tests/lib/auth.test.js && npm run lint && npm run build`; expect success.
- [ ] **Step 6: Commit.** `git add package.json package-lock.json src tests .env.example vitest.config.mjs next.config.mjs && git commit -m "feat: add Clerk authentication foundation"`.

## Task 2: Authenticated Neon schema and user profile

**Files:** Modify `src/lib/migrate.js`, `src/lib/db.js`; create `src/lib/users.js`, `src/lib/audit.js`; add `tests/lib/users.test.js` and `tests/lib/audit.test.js`.

**Interfaces:** `upsertUserFromClerk(user)`, `getSessionMembership(code, clerkUserId)`, `writeAuditLog(event)`.

- [ ] **Step 1: Write a failing Clerk-to-user mapping test.**

```js
it('maps Clerk identity to Neon profile values', () => {
  expect(toUserInsert({ id: 'user_1', email: 'ana@sgo.id', firstName: 'Ana' }))
    .toEqual(['user_1', 'ana@sgo.id', 'Ana', 'id', 'participant']);
});
```

- [ ] **Step 2: Verify RED.** Run `npm run test -- tests/lib/users.test.js`; expect missing helper.
- [ ] **Step 3: Add idempotent tables:** `users`, `professional_roles`, `session_members`, `assessment_templates`, `assessment_drafts`, `assessment_submissions`, `assessment_reopens`, `session_documents`, and `audit_logs`. Add foreign keys, one membership per user/session, one draft per member/FM, and checks for role/experience.
- [ ] **Step 4: Implement helper and audit writer.** Use Clerk ID as the immutable user identifier; retain old tables only for archival compatibility.
- [ ] **Step 5: Verify GREEN.** Run focused tests, lint, then the development `/api/migrate` endpoint after database backup.
- [ ] **Step 6: Commit.** `git add src/lib tests/lib && git commit -m "feat: add authenticated workshop schema"`.

## Task 3: Clerk-backed session membership and authorization

**Files:** Create `src/app/api/me/route.js`, `src/app/api/sessions/[code]/membership/route.js`, `tests/api/membership.test.js`; modify session creation/full-data routes, `src/lib/api.js`, `src/components/FMEAApp.jsx`.

**Interfaces:** `POST /membership` takes `{ professionalRoleId, customRole, experience }`; client identity is never accepted. `GET /api/me` returns the current user and app role.

- [ ] **Step 1: Write the failing missing-experience test.**

```js
it('rejects membership without experience', async () => {
  expect((await postMembership({ professionalRoleId: 'geotechnical' })).status).toBe(400);
});
```

- [ ] **Step 2: Verify RED.** Run `npm run test -- tests/api/membership.test.js`; expect missing route.
- [ ] **Step 3: Implement server-side identity lookup, facilitator-only session creation, participant session-code joining, professional role/experience persistence, and aggregate-only participant results.**
- [ ] **Step 4: Remove `participantKey` and role/name slug identity generation from the client.**
- [ ] **Step 5: Verify GREEN.** Run the focused test, lint, and build.
- [ ] **Step 6: Commit.** `git add src/app/api src/lib/api.js src/components tests/api && git commit -m "feat: use Clerk users for session membership"`.

## Task 4: Versioned Merdeka Risk and Opportunity assessment

**Files:** Create `src/lib/merdeka.js`, `src/components/AssessmentForm.jsx`, `tests/lib/merdeka.test.js`, `tests/components/AssessmentForm.test.jsx`; modify migration and FMEA UI.

**Interfaces:** `getRiskCell(likelihood, consequence)` and `getOpportunityCell(likelihood, consequence)` return `{ score, level, responseKey, color }`.

- [ ] **Step 1: Write literal matrix tests from the supplied tables.**

```js
it('maps Likely + Major to Extreme risk score 22', () => {
  expect(getRiskCell(4, 4)).toMatchObject({ score: 22, level: 'Extreme' });
});
it('maps Possible + Significant to Important opportunity score 15', () => {
  expect(getOpportunityCell(3, 4)).toMatchObject({ score: 15, level: 'Important' });
});
```

- [ ] **Step 2: Verify RED.** Run `npm run test -- tests/lib/merdeka.test.js`; expect missing helper.
- [ ] **Step 3: Implement an explicit `merdeka-v1` matrix, bilingual likelihood/response text, and seed definition.** No generic multiplication logic.
- [ ] **Step 4: Replace Severity/Detection controls with Risk Likelihood + Negative Consequence and Opportunity Likelihood + Positive Consequence.** Display both results and responses.
- [ ] **Step 5: Verify GREEN.** Run unit/component tests and lint.
- [ ] **Step 6: Commit.** `git add src/lib/merdeka.js src/lib/migrate.js src/components tests && git commit -m "feat: add Merdeka risk and opportunity assessment"`.

## Task 5: Draft persistence, immutable submission, and audited reopen

**Files:** Create `src/lib/assessment.js`, assessment/submission routes, `tests/lib/assessment.test.js`, `tests/api/submission.test.js`; modify full-data route, API client, and FMEA UI.

**Interfaces:** `isReadyToSubmit(openFmNos, drafts)`; `POST /assessment`; `POST /submission`; facilitator-only `PUT /submission` with `{ memberId, reason }`.

- [ ] **Step 1: Write failing readiness and lock tests.**

```js
it('does not submit when opportunity is incomplete', () => {
  expect(isReadyToSubmit(['FM-1'], { 'FM-1': { riskLikelihood: 3, negativeConsequence: 3 } })).toBe(false);
});
it('rejects draft writes after submission', async () => {
  expect((await saveSubmittedMembersDraft()).status).toBe(409);
});
```

- [ ] **Step 2: Verify RED.** Run focused tests; expect missing helper/routes.
- [ ] **Step 3: Upsert only the authenticated member's draft.** Use a Neon transaction to validate all open FMs, store an immutable template-versioned JSON snapshot, mark submission, and create an audit record. Reject subsequent writes; reopen requires facilitator plus non-empty reason.
- [ ] **Step 4: Add checklist, confirmation, read-only submitted state, submitted timestamp, and facilitator reopen UI.**
- [ ] **Step 5: Verify GREEN.** Run focused tests, lint, build.
- [ ] **Step 6: Commit.** `git add src/lib src/app/api src/components tests && git commit -m "feat: lock submitted FMEA assessments"`.

## Task 6: Bilingual shell, professional roles, experience, and Guideline

**Files:** Create `src/lib/i18n.js`, `src/components/AppShell.jsx`, `src/components/GuidelineTab.jsx`, tests; modify layout/page/FMEA/CSS and `public` logo asset if supplied.

**Interfaces:** `t(language, key)` and `GuidelineTab({ language, template, document })`.

- [ ] **Step 1: Write the failing experience-copy test.**

```js
it('returns Indonesian Beginner copy', () => {
  expect(t('id', 'experience.beginner')).toBe('0–3 tahun pengalaman di bidang dam / geoteknik');
});
```

- [ ] **Step 2: Verify RED.** Run `npm run test -- tests/lib/i18n.test.js`; expect missing module.
- [ ] **Step 3: Implement dictionaries, saved language preference, 20 professional roles plus Other/session custom role, and fixed weights 1/2/3.**
- [ ] **Step 4: Implement PT Solusi Geotek Optima header, language switcher, Clerk account menu, and Guideline with exact Merdeka tables/responses.** Render company name if official logo has not yet been supplied.
- [ ] **Step 5: Verify GREEN and commit.** Run component tests, lint, then `git add src public tests && git commit -m "feat: add bilingual workshop guidance"`.

## Task 7: Private session PDF material

**Files:** Create `src/lib/documents.js`, document route, tests; modify migration/API client/UI and `.env.example`.

**External decision:** Choose Vercel Blob, Cloudflare R2, or Supabase Storage before implementation. This is the only blocker for PDF upload/download.

- [ ] **Step 1: Write failing non-member download test.**

```js
it('denies a PDF download to a non-member', async () => {
  expect((await downloadAsNonMember()).status).toBe(403);
});
```

- [ ] **Step 2: Verify RED.** Run document test; expect missing route.
- [ ] **Step 3: Implement provider adapter and protected upload/download.** Accept one PDF only, validate MIME/size, store private object key, restrict replacement to before assessment begins, retain document history, and authorize every download by Clerk identity plus membership.
- [ ] **Step 4: Add Download Material to Guideline and facilitator upload in setup.**
- [ ] **Step 5: Verify GREEN and commit.** Run document tests, lint, build, then commit `feat: add protected session materials`.

## Task 8: Remove legacy trust boundaries and release verification

**Files:** Modify all remaining session API routes and client calls; create `tests/api/authorization.test.js`, `docs/deployment/clerk-neon-checklist.md`, `tests/e2e/workshop-flow.md`.

- [ ] **Step 1: Write a failing participant-FM-control test.**

```js
it('does not allow a participant to open a failure mode', async () => {
  expect((await setFmStatusAsParticipant()).status).toBe(403);
});
```

- [ ] **Step 2: Verify RED.** Run authorization test; expect existing route to lack a guard.
- [ ] **Step 3: Guard all legacy APIs.** Retire participant-key APIs with `410 Gone` after Clerk equivalents are live; participant result endpoints return aggregates only.
- [ ] **Step 4: Verify release.** Run `npm run test && npm run lint && npm run build`; then manually verify sign-in/resume, submit lock, reopen audit, non-member PDF denial, no individual vote leakage, both languages, and all Merdeka cells.
- [ ] **Step 5: Commit.** `git add src tests docs && git commit -m "feat: complete authenticated FMEA workshop flow"`.

## Plan Self-Review

- Tasks 1–8 cover all approved design requirements.
- Object storage choice blocks only Task 7; Clerk + Neon work can begin now.
- Each behavior change has a red-green test cycle, exact affected units, and verification commands.
