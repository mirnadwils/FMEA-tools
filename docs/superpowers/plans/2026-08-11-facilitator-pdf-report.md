# Facilitator PDF Report Implementation Plan

> **For agentic workers:** Implement the tasks in order. Keep all report copy English and use the browser print dialog; do not introduce server-side PDF generation, Blob persistence, or assessment mutations.

**Goal:** Give facilitators an English print-ready FMEA Workshop Report containing Participants, the complete Risk Overview, and a detailed anonymous Live Result page for each FM.

**Architecture:** Add a facilitator-gated report route rendered by a client-side report component. It fetches existing session, membership, and aggregate live-result data using authenticated browser requests, builds print-safe presentation models with existing pure mappers, and renders screen/print CSS that uses `window.print()`. Reusable report-specific chart components use fixed height/width contracts for reliable browser PDF output.

**Tech Stack:** Next.js 16 App Router, React 19, Clerk authentication, Recharts 3, Tailwind CSS, Node built-in test runner, ESLint.

## Global Constraints

- Only facilitators may open or print the report.
- Every visible report label is English regardless of selected UI language.
- No report route, component, or data mapper can receive individual assessment records, individual Likelihood/Consequence values, member weights, or any new personally identifying data beyond the existing Participants-tab fields.
- The report may not write to Neon, Vercel Blob, assessment endpoints, submission endpoints, or FM status endpoints.
- Risk Overview renders all imported FMs in stable FM-number order and ignores interactive table query/filter/sort state.
- Each FM detail begins on a new printable page. An FM with no completed assessment still prints its description and a clear no-data message.
- Charts must have deterministic printable dimensions and cannot rely only on an unbounded `ResponsiveContainer` parent.

## File Structure

- Create: `src/app/facilitator/sessions/[code]/report/page.jsx` — server route gate and report shell.
- Create: `src/app/facilitator/sessions/[code]/report/FacilitatorReport.jsx` — client data loading, print command, report composition.
- Create: `src/components/report/ReportHeader.jsx` — English cover/metadata and print command.
- Create: `src/components/report/ParticipantsReportSection.jsx` — printable members/progress table.
- Create: `src/components/report/RiskOverviewReportSection.jsx` — cards, pie, stacked bars, radar, and complete FM table.
- Create: `src/components/report/LiveResultReportSection.jsx` — one detailed printable FM section using its description, results, distributions, and heatmap.
- Create: `src/components/report/report.css` — A4, print-only, and page-break rules.
- Create: `src/lib/report-data.js` — pure stable sorting and report view-model helpers.
- Create: `tests/report-data.test.js` — pure mapper and source-contract tests.
- Modify: `src/components/FMEAApp.jsx` — add the facilitator Export tab report link/button.
- Modify: `src/lib/i18n.js` only if an existing English print string cannot be reused by the facilitator screen; report text itself must remain local to report components as English.

## Task 1: Establish Safe, Deterministic Report Data Models

**Files:**

- Create: `src/lib/report-data.js`
- Create: `tests/report-data.test.js`

- [ ] **Step 1: Write failing tests for stable report ordering and no-data representation**

Test `sortFailureModesForReport(fmList)` with values such as `FM1`, `FM2`, and `FM10`, confirming natural FM-number order and no mutation of the source input.

Test `buildReportLiveResultRows(fmList, aggregated)` to confirm it emits every imported FM; joins an aggregate by `fmNo`; preserves only anonymous aggregate fields; and marks an FM with no complete aggregate as `hasCompleteAssessments: false`.

Include assertions that the returned row has no `memberId`, `email`, `experience`, `riskLikelihood`, `negativeConsequence`, or raw draft object.

- [ ] **Step 2: Run the focused tests and verify they fail**

Run: `node --test tests/report-data.test.js`

Expected: FAIL because the report-data module does not exist.

- [ ] **Step 3: Implement the pure report helpers**

Implement a natural, stable FM comparator without changing the source array. Build rows only from FM description fields and the already anonymous live-results aggregate fields (`count`, averages, rounded scores, final level, Likelihood/Consequence distributions, and combination distribution).

Make `buildReportRiskOverview` reuse `buildRiskOverviewData`, `buildFinalFmDistribution`, and `buildResponseDistribution`, then return a stable, unfiltered overview table order.

- [ ] **Step 4: Run the focused tests**

Run: `node --test tests/report-data.test.js`

Expected: PASS.

## Task 2: Add a Facilitator-Gated Report Route and Data Loader

**Files:**

- Create: `src/app/facilitator/sessions/[code]/report/page.jsx`
- Create: `src/app/facilitator/sessions/[code]/report/FacilitatorReport.jsx`
- Modify: `src/lib/api.js` only if a minimal report-specific read helper improves reuse.
- Test: `tests/report-data.test.js`

- [ ] **Step 1: Read the applicable installed Next.js 16 App Router documentation**

Before coding, read the relevant route/page and async `params` guidance under `node_modules/next/dist/docs/`, as required by `AGENTS.md`. Follow its current conventions for server pages and client boundaries.

- [ ] **Step 2: Add a failing source-contract test for route authorization**

Read the route source in a Node test and assert it imports the established server auth helper and calls the facilitator role requirement before rendering the report client component.

- [ ] **Step 3: Implement the server page authorization boundary**

Use the project’s established server authentication/role utilities to reject non-facilitators before report content is rendered. Resolve and normalize the dynamic session code using the Next.js 16 documented async params pattern.

The client component fetches only:

1. `getFullSession(code)` for session metadata and FM descriptions.
2. `getMembership(code)` for facilitator-visible participant profile/progress data.
3. `getLiveResults(code)` for anonymous aggregates.

Render English loading, access-denied, and retry-safe error states. Do not start printing until all datasets are loaded.

- [ ] **Step 4: Implement printing readiness**

Expose a `Print report` button. Disable it during load and while report charts are not ready. After React has painted charts, wait for the browser’s next rendering frame before enabling it. The button invokes `window.print()` only; it must not upload, write, or call a mutation endpoint.

- [ ] **Step 5: Run focused tests and lint**

Run: `node --test tests/report-data.test.js && npm run lint`

Expected: both commands exit 0.

## Task 3: Build Print-Safe Shared Report Styling and Cover

**Files:**

- Create: `src/components/report/report.css`
- Create: `src/components/report/ReportHeader.jsx`
- Modify: `src/app/facilitator/sessions/[code]/report/FacilitatorReport.jsx`

- [ ] **Step 1: Implement A4 and page-break styling**

Set `@page` to A4 portrait with suitable print margins. Make body/report backgrounds white for print, hide `.screen-only` controls, show `.print-only` report metadata, and apply `break-before: page` to report sections and FM sections. Add `break-inside: avoid` to score-card rows, charts, and the description notice card.

Use a report-scoped CSS class instead of changing styles across the existing interactive dashboard.

- [ ] **Step 2: Implement the English report header**

Render **FMEA Workshop Report**, workshop name, session code, facilitator name when present, and an English formatted generated timestamp. Add a compact overview of imported FM and participant counts. Screen view includes a Back-to-dashboard link and `Print report` control; both are hidden in printed output.

- [ ] **Step 3: Verify local CSS boundaries**

Confirm CSS selectors are report-scoped and cannot alter existing facilitator dashboard layout. Run `npm run lint`.

Expected: exit 0.

## Task 4: Render the Participants and Complete Risk Overview Sections

**Files:**

- Create: `src/components/report/ParticipantsReportSection.jsx`
- Create: `src/components/report/RiskOverviewReportSection.jsx`
- Modify: `src/app/facilitator/sessions/[code]/report/FacilitatorReport.jsx`
- Test: `tests/report-data.test.js`

- [ ] **Step 1: Add source-contract tests for complete report content**

Assert the risk overview report component renders the risk distribution dashboard data, a `RadarChart`, and a full table model rather than `getRiskOverviewTableRows` or any interactive filter state. Assert the participant report table contains name/email, Field Work, experience, completion count, completed FM numbers, and incomplete FM numbers.

- [ ] **Step 2: Implement the Participants report table**

Create a landscape-friendly, wrapping table row that prints all existing facilitator member fields and progress lists. Use English headings and explicit em dashes/empty text for unavailable field values. Do not import or display assessment content.

- [ ] **Step 3: Implement the Risk Overview report section**

Render all four final-risk summary cards, the final-FM pie, anonymous per-FM stacked response bar chart, global radar, and a complete stable FM table. Reuse `RISK_COLORS`, the canonical Merdeka risk values, and pure risk-data mappers so interactive and printed calculations are identical.

Charts must use print-specific fixed-height wrappers and suitable widths. The bar chart may span its own printable page if there are enough FM rows; it must never shrink individual rows into unreadable height.

- [ ] **Step 4: Run focused tests and lint**

Run: `node --test tests/report-data.test.js && npm run lint`

Expected: both commands exit 0.

## Task 5: Render One Complete Live Result Section per FM

**Files:**

- Create: `src/components/report/LiveResultReportSection.jsx`
- Modify: `src/app/facilitator/sessions/[code]/report/FacilitatorReport.jsx`
- Test: `tests/report-data.test.js`

- [ ] **Step 1: Add a source-contract test for each FM’s required content**

Assert that the FM report section renders the 11 description fields from the Live Result modal, four result cards, both distribution chart titles, and the Likelihood x Consequence heatmap title.

- [ ] **Step 2: Implement the FM description and result cards**

Follow the existing `LiveResultDetailModal` label ordering and bilingual field resolution, but use fixed English labels in the report. Include category, potential failure mode, main trigger/detailed mechanism, initiation, continuation, progression, potential detection/monitoring, possible intervention/risk controls, potential effect/consequence, PFMA notes/workshop questions, and owner/action.

Use the same weighted averages, rounded pair, risk score, and final risk level passed by existing live results. Do not recalculate or alter the weighting formula.

- [ ] **Step 3: Implement print-safe distributions and heatmap**

Reuse the exact anonymous `likelihoodDistribution`, `consequenceDistribution`, and `combinationDistribution` data contract from `LiveResultCharts`. Render their printable BarCharts with explicit dimensions and a 5x5 heatmap with the existing Merdeka cell colouring/score semantics.

When `count === 0` or no aggregate exists, retain the full FM description and show **No complete assessments yet** instead of empty result cards/charts.

- [ ] **Step 4: Compose all FM pages**

Map sorted report FM rows to this section, ensuring every imported FM appears exactly once, and use an FM identifier as the React key. Apply the section page-break class.

- [ ] **Step 5: Run focused tests and lint**

Run: `node --test tests/report-data.test.js && npm run lint`

Expected: both commands exit 0.

## Task 6: Add the Facilitator Dashboard Entry Point

**Files:**

- Modify: `src/components/FMEAApp.jsx`
- Test: `tests/report-data.test.js`

- [ ] **Step 1: Add a source-contract test for the report link**

Assert the Export tab includes an anchor/link whose route is derived from the current session code and targets the facilitator report path. It must be separate from the existing Excel export action.

- [ ] **Step 2: Add the Print / Save as PDF action**

Use the existing localized `export.print` label on the dashboard only. The action opens `/facilitator/sessions/{encoded-session-code}/report` in a new tab with safe `noopener` handling. Preserve the existing Excel export unchanged.

- [ ] **Step 3: Run focused tests and lint**

Run: `node --test tests/report-data.test.js && npm run lint`

Expected: both commands exit 0.

## Task 7: Full Verification and Browser Print QA

**Files:**

- Verify: all files above

- [ ] **Step 1: Run automated verification**

Run: `npm test && npm run lint && npm run build`

Expected: all commands exit 0.

- [ ] **Step 2: Manually verify authorization and content**

Run the app and verify a facilitator can open the report and a participant cannot. Verify every label in the report is English even if the UI language is Indonesian. Check Participants, all Risk Overview cards/charts/table, and all imported FMs.

- [ ] **Step 3: Verify generated PDF appearance**

Use Chromium’s Print Preview and choose Save as PDF. Inspect the saved PDF using the PDF render-and-verify workflow: render pages with Poppler, inspect cover, Participants, Risk Overview, a no-response FM, and a populated FM. Confirm no blank/clipped Recharts, no page-overlap, readable heatmap cells, and a clean page start for each FM.

- [ ] **Step 4: Make an evidence-backed correction only if needed**

If visual inspection reveals a clipping or page-break issue, write a regression test where feasible, apply the smallest report-scoped fix, then rerun the full verification suite and repeat PDF inspection.
