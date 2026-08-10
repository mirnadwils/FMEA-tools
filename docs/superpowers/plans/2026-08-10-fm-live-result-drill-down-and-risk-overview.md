# FM Live Result Drill-Down and Risk Overview Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give facilitators a clickable, language-aware FM Live Results detail view and a radar-chart dashboard that compares final Merdeka risk scores across all failure modes.

**Architecture:** Keep `GET /api/sessions/[code]/live-results` as the anonymous aggregation source and derive the radar series in the client from its `aggregated` items plus `session.fmList`. Extract language resolution and FM walkthrough-field construction into a pure library module, then render it from both the participant assessment modal and the facilitator drill-down so the two views cannot diverge.

**Tech Stack:** Next.js 16 App Router, React 19, Recharts 3, lucide-react, Node built-in test runner, ESLint.

## Global Constraints

- Only a facilitator can obtain Live Results; participants continue to receive HTTP 403 from `GET /api/sessions/[code]/live-results`.
- Risk Overview radar values are final Merdeka `riskScore` values from 1 to 25; an FM without a complete response has the display value 0 and is labelled `No data`.
- Live-result charts and drill-downs expose only anonymous aggregates and FM context—never member name, email, individual response, or experience level.
- The live polling interval remains six seconds.
- FM text resolves to the selected ID/EN UI language and falls back to the available stored language; empty optional fields are omitted.
- Existing experience-weighted Likelihood and Consequence calculations are not changed.

---

## File Structure

- Create: `src/lib/failure-mode-context.js` — pure localized-field resolver shared by assessment and facilitator views.
- Create: `src/lib/risk-overview.js` — pure mapper from `session.fmList` and live aggregates to radar/tooltip data.
- Create: `src/components/FailureModeContext.jsx` — ordered display component for the eleven FM description fields.
- Create: `src/components/LiveResultCharts.jsx` — existing Likelihood, Consequence, and combination-distribution visualizations, reusable in a modal.
- Create: `src/components/LiveResultDetailModal.jsx` — accessible facilitator-only visual detail panel for one FM aggregate.
- Create: `src/components/RiskOverviewTab.jsx` — Recharts radar chart and custom tooltip.
- Modify: `src/components/AssessmentForm.jsx` — replace its inline walkthrough construction with `FailureModeContext`.
- Modify: `src/components/FMEAApp.jsx` — compact clickable result cards, wire the detail modal, and register/render the Risk Overview tab.
- Create: `tests/failure-mode-context.test.js` — localized context ordering/fallback tests.
- Create: `tests/risk-overview.test.js` — final-score and no-data radar mapper tests.

## Task 1: Shared Failure-Mode Context Model

**Files:**
- Create: `src/lib/failure-mode-context.js`
- Create: `tests/failure-mode-context.test.js`

**Interfaces:**
- Produces: `resolveLocalizedValue(value, lang): string`
- Produces: `getFailureModeContextFields(fm, lang): Array<{ key: string, label: string, value: string, highlighted: boolean }>`
- Consumed by: `FailureModeContext`, `AssessmentForm`, and `LiveResultDetailModal`.

- [ ] **Step 1: Write the failing tests for fixed order and fallback**

```js
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
```

- [ ] **Step 2: Run the new test to verify it fails**

Run: `node --test tests/failure-mode-context.test.js`

Expected: FAIL because `src/lib/failure-mode-context.js` does not exist.

- [ ] **Step 3: Implement the pure context helpers**

```js
const FIELD_DEFINITIONS = [
  ['category', 'Category', 'Kategori'],
  ['title', 'Potential Failure Mode', 'Potensi Failure Mode'],
  ['mechanism', 'Main Trigger / Detailed Mechanism', 'Pemicu Utama / Mekanisme Detail'],
  ['initiation', 'Initiation', 'Inisiasi'],
  ['continuation', 'Continuation', 'Kelanjutan'],
  ['progression', 'Progression', 'Progresi'],
  ['detectionMonitoring', 'Potential Detection / Monitoring', 'Potensi Deteksi / Monitoring'],
  ['intervention', 'Possible Intervention / Risk Controls', 'Kemungkinan Intervensi / Kontrol Risiko'],
  ['effect', 'Potential Effect / Consequence', 'Potensi Efek / Konsekuensi'],
  ['notes', 'PFMA Notes / Workshop Questions', 'Catatan PFMA / Pertanyaan Workshop'],
  ['ownerAction', 'Owner / Action', 'Pemilik / Tindakan'],
];

export function resolveLocalizedValue(value, lang) {
  if (!value) return '';
  if (typeof value === 'string') return value;
  return value[lang] || value.id || value.en || '';
}

export function getFailureModeContextFields(fm, lang) {
  return FIELD_DEFINITIONS.flatMap(([key, en, id]) => {
    const value = resolveLocalizedValue(fm[key], lang);
    return value ? [{ key, label: lang === 'id' ? id : en, value, highlighted: key === 'notes' }] : [];
  });
}
```

- [ ] **Step 4: Run the context tests to verify they pass**

Run: `node --test tests/failure-mode-context.test.js`

Expected: PASS with 2 tests.

- [ ] **Step 5: Commit the context model**

```bash
git add src/lib/failure-mode-context.js tests/failure-mode-context.test.js
git commit -m "feat: share localized FM context fields"
```

## Task 2: Reuse the Context in the Assessment Page

**Files:**
- Create: `src/components/FailureModeContext.jsx`
- Modify: `src/components/AssessmentForm.jsx`
- Test: `tests/failure-mode-context.test.js`

**Interfaces:**
- Consumes: `getFailureModeContextFields(fm, lang)` from Task 1.
- Produces: `<FailureModeContext fm={fm} lang={lang} />`.
- Consumed by: `AssessmentForm` and facilitator detail modal.

- [ ] **Step 1: Extend the green model test to assert that every required field has an explicit definition**

```js
test('defines all eleven facilitator and assessment context fields', () => {
  const fields = getFailureModeContextFields({
    category: 'a', title: 'b', mechanism: 'c', initiation: 'd', continuation: 'e',
    progression: 'f', detectionMonitoring: 'g', intervention: 'h', effect: 'i',
    notes: 'j', ownerAction: 'k',
  }, 'id');
  assert.equal(fields.length, 11);
});
```

- [ ] **Step 2: Run the test to preserve the model contract before UI extraction**

Run: `node --test tests/failure-mode-context.test.js`

Expected: PASS. This is a refactor task: Task 1 has already introduced and tested the shared behavior; this assertion prevents the UI extraction from silently dropping a required context field.

- [ ] **Step 3: Create the shared rendering component and replace the inline walkthrough map**

```jsx
export default function FailureModeContext({ fm, lang }) {
  return (
    <div className="space-y-2">
      {getFailureModeContextFields(fm, lang).map((field) => (
        <div key={field.key} className={field.highlighted
          ? 'text-sm bg-amber-50 border border-amber-200 rounded-xl p-3 text-amber-800'
          : 'text-sm text-slate-600'}>
          <span className="font-bold text-slate-700">{field.label}: </span>{field.value}
        </div>
      ))}
    </div>
  );
}
```

Replace the `fmFields` array and its render loop in `AssessmentForm.jsx` with `<FailureModeContext fm={fm} lang={lang} />`; retain the existing FM number/category/title modal header and assessment controls.

- [ ] **Step 4: Run the model tests and lint**

Run: `node --test tests/failure-mode-context.test.js && npm run lint`

Expected: PASS and exit code 0.

- [ ] **Step 5: Commit the shared presentation**

```bash
git add src/components/FailureModeContext.jsx src/components/AssessmentForm.jsx tests/failure-mode-context.test.js
git commit -m "refactor: reuse FM walkthrough context"
```

## Task 3: Risk Overview Data Mapper

**Files:**
- Create: `src/lib/risk-overview.js`
- Create: `tests/risk-overview.test.js`

**Interfaces:**
- Produces: `buildRiskOverviewData(fmList, aggregated, lang): Array<{ fmNo, title, riskScore, riskLevel, avgRiskLikelihood, avgNegativeConsequence, roundedLikelihood, roundedConsequence, hasData }>`.
- Consumed by: `RiskOverviewTab` in Task 5.

- [ ] **Step 1: Write failing radar-data tests**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { buildRiskOverviewData } from '../src/lib/risk-overview.js';

test('maps every FM to its final Merdeka score and localized tooltip data', () => {
  const result = buildRiskOverviewData(
    [{ no: 'FM-1', title: { id: 'Retak', en: 'Crack' } }, { no: 'FM-2', title: { id: 'Bocor', en: 'Leak' } }],
    [{ fmNo: 'FM-1', riskScore: 22, riskLevel: 'Extreme', avgRiskLikelihood: 4.2, avgNegativeConsequence: 4.1, roundedLikelihood: 4, roundedConsequence: 4 }],
    'en'
  );
  assert.deepEqual(result.map(({ fmNo, title, riskScore, hasData }) => ({ fmNo, title, riskScore, hasData })), [
    { fmNo: 'FM-1', title: 'Crack', riskScore: 22, hasData: true },
    { fmNo: 'FM-2', title: 'Leak', riskScore: 0, hasData: false },
  ]);
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --test tests/risk-overview.test.js`

Expected: FAIL because `src/lib/risk-overview.js` does not exist.

- [ ] **Step 3: Implement the mapper without recalculating risks**

```js
import { resolveLocalizedValue } from './failure-mode-context.js';

export function buildRiskOverviewData(fmList, aggregated, lang) {
  const aggregateByFm = new Map((aggregated || []).map((item) => [item.fmNo, item]));
  return (fmList || []).map((fm) => {
    const aggregate = aggregateByFm.get(fm.no);
    return {
      fmNo: fm.no,
      title: resolveLocalizedValue(fm.title, lang) || '(Untitled)',
      riskScore: aggregate?.riskScore || 0,
      riskLevel: aggregate?.riskLevel || null,
      avgRiskLikelihood: aggregate?.avgRiskLikelihood ?? null,
      avgNegativeConsequence: aggregate?.avgNegativeConsequence ?? null,
      roundedLikelihood: aggregate?.roundedLikelihood ?? null,
      roundedConsequence: aggregate?.roundedConsequence ?? null,
      hasData: Boolean(aggregate?.count && aggregate?.riskScore),
    };
  });
}
```

- [ ] **Step 4: Run the radar-data test to verify it passes**

Run: `node --test tests/risk-overview.test.js`

Expected: PASS with 1 test.

- [ ] **Step 5: Commit the radar data mapper**

```bash
git add src/lib/risk-overview.js tests/risk-overview.test.js
git commit -m "feat: map FM scores for risk overview"
```

## Task 4: Clickable Live Result Detail Panel

**Files:**
- Create: `src/components/LiveResultCharts.jsx`
- Create: `src/components/LiveResultDetailModal.jsx`
- Modify: `src/components/FMEAApp.jsx:1-20,511-647`
- Test: `tests/failure-mode-context.test.js`

**Interfaces:**
- Consumes: `<FailureModeContext fm lang />` from Task 2.
- Consumes: aggregate object fields `count`, `avgRiskLikelihood`, `avgNegativeConsequence`, `roundedLikelihood`, `roundedConsequence`, `riskScore`, `riskLevel`, `likelihoodDistribution`, `consequenceDistribution`, and `combinationDistribution`.
- Produces: `<LiveResultDetailModal fm aggregate lang onClose />`.

- [ ] **Step 1: Add a regression test for the missing-data context contract**

```js
test('returns no context rows for absent optional FM fields', () => {
  assert.deepEqual(getFailureModeContextFields({ title: 'Only title' }, 'en').map((field) => field.key), ['title']);
});
```

- [ ] **Step 2: Run the focused test before extracting the visual components**

Run: `node --test tests/failure-mode-context.test.js`

Expected: PASS. The context omission behavior was implemented in Task 1; retain this focused test while moving visual code so empty fields cannot appear in the facilitator panel.

- [ ] **Step 3: Extract existing visualizations and create the modal**

Move the two `BarChart` blocks and 5-by-5 heatmap from `ResultsTab` into `LiveResultCharts`, preserving its current exact unweighted inputs. Create `LiveResultDetailModal` as a focusable dialog with a Close button, Escape-key close handler, `role="dialog"`, `aria-modal="true"`, and this layout:

```jsx
<LiveResultDetailModal fm={fm} aggregate={aggregate} lang={lang} onClose={onClose}>
  <header>{/* FM badge, localized category, localized title, close button */}</header>
  <FailureModeContext fm={fm} lang={lang} />
  <section aria-label="Risk summary" className="grid grid-cols-2 gap-3">
    <div>Weighted: L {aggregate.avgRiskLikelihood} / C {aggregate.avgNegativeConsequence}</div>
    <div>Rounded: L {aggregate.roundedLikelihood} / C {aggregate.roundedConsequence}</div>
    <div>Score: {aggregate.riskScore}</div>
    <div>Level: {aggregate.riskLevel}</div>
  </section>
  {aggregate.count > 0 ? <LiveResultCharts aggregate={aggregate} lang={lang} /> : <p>No data</p>}
</LiveResultDetailModal>
```

Do not pass any membership rows or individual drafts into either component.

- [ ] **Step 4: Turn each `ResultsTab` FM summary card into an explicit keyboard-accessible “View FM details” button**

Maintain `selectedResult` state in `ResultsTab`. On click, store `{ fm, aggregate }`; render the modal when it is non-null. Keep the existing score, response-count, and weighted-average summary visible in the compact list, but remove the inline charts so the charts appear only in the selected FM detail panel.

- [ ] **Step 5: Run focused tests and lint**

Run: `node --test tests/failure-mode-context.test.js && npm run lint`

Expected: PASS and exit code 0.

- [ ] **Step 6: Commit the drill-down panel**

```bash
git add src/components/LiveResultCharts.jsx src/components/LiveResultDetailModal.jsx src/components/FMEAApp.jsx tests/failure-mode-context.test.js
git commit -m "feat: add facilitator FM result drill-down"
```

## Task 5: Facilitator Risk Overview Radar Tab

**Files:**
- Create: `src/components/RiskOverviewTab.jsx`
- Modify: `src/components/FMEAApp.jsx:1-20,832-896`
- Test: `tests/risk-overview.test.js`

**Interfaces:**
- Consumes: `buildRiskOverviewData(session.fmList, liveData.aggregated, lang)` from Task 3.
- Produces: `<RiskOverviewTab session liveData lang />`.

- [ ] **Step 1: Add a no-data tooltip regression test**

```js
test('marks a session FM with no aggregate as no data and score zero', () => {
  const [item] = buildRiskOverviewData([{ no: 'FM-9', title: 'Unassessed' }], [], 'en');
  assert.equal(item.riskScore, 0);
  assert.equal(item.hasData, false);
  assert.equal(item.riskLevel, null);
});
```

- [ ] **Step 2: Run the mapper test before rendering the chart**

Run: `node --test tests/risk-overview.test.js`

Expected: PASS. Task 3 implements this data contract; the test locks it before Recharts rendering is added.

- [ ] **Step 3: Implement the responsive radar chart and custom tooltip**

```jsx
<ResponsiveContainer width="100%" height={Math.max(420, data.length * 48)}>
  <RadarChart data={data} outerRadius="72%">
    <PolarGrid />
    <PolarAngleAxis dataKey="fmNo" />
    <PolarRadiusAxis domain={[0, 25]} tickCount={6} />
    <Tooltip content={<RiskOverviewTooltip />} />
    <Radar dataKey="riskScore" name="Risk score" stroke="#dc2626" fill="#ef4444" fillOpacity={0.35} />
  </RadarChart>
</ResponsiveContainer>
```

`RiskOverviewTooltip` must render `FM {fmNo}`, title, either `No data` or score and risk level, plus weighted and rounded Likelihood/Consequence values. It must not use the axis label alone to identify a failure mode.

- [ ] **Step 4: Register the facilitator-only tab**

Import `Radar` from `lucide-react` as the tab icon. Add `{ id: 'overview', label: 'Risk Overview', icon: <Radar size={15} /> }` after Results in `FacilitatorDashboard`, then conditionally render:

```jsx
{tab === 'overview' && <RiskOverviewTab session={session} liveData={liveData} lang={lang} />}
```

Reuse the dashboard’s existing `liveData` and six-second `refresh`; do not create a client request from `RiskOverviewTab`.

- [ ] **Step 5: Run the mapper test, all tests, lint, and production build**

Run: `node --test tests/risk-overview.test.js && npm test && npm run lint && npm run build`

Expected: all commands exit 0; the build reports no runtime import error for Recharts radar components.

- [ ] **Step 6: Commit the Risk Overview dashboard**

```bash
git add src/components/RiskOverviewTab.jsx src/components/FMEAApp.jsx src/lib/risk-overview.js tests/risk-overview.test.js
git commit -m "feat: add facilitator risk overview radar"
```

## Task 6: Final Regression Verification

**Files:**
- Verify: `src/components/FMEAApp.jsx`
- Verify: `src/components/AssessmentForm.jsx`
- Verify: `src/components/FailureModeContext.jsx`
- Verify: `src/components/LiveResultCharts.jsx`
- Verify: `src/components/LiveResultDetailModal.jsx`
- Verify: `src/components/RiskOverviewTab.jsx`
- Verify: `src/lib/failure-mode-context.js`
- Verify: `src/lib/risk-overview.js`
- Verify: `tests/failure-mode-context.test.js`
- Verify: `tests/risk-overview.test.js`

- [ ] **Step 1: Re-read the approved design and make a requirement checklist**

Confirm: drill-down opens from every FM card; all eleven context fields have the same order as assessment; charts remain anonymous; radar is score 1–25; tooltip contains FM number and title; no-data FMs are zero; participant permissions are unchanged; six-second refresh serves both views.

- [ ] **Step 2: Run the full verification suite**

Run: `npm test && npm run lint && npm run build`

Expected: all commands exit 0.

- [ ] **Step 3: Manually verify the facilitator interaction**

Run: `npm run dev`

Open an authenticated facilitator session with at least two FMs, save complete drafts, then verify card click, modal close button, Escape close, language toggle, bar charts, heatmap, Radar tooltip, and a no-response FM. Attempt the Live Results endpoint as a participant and confirm HTTP 403.

- [ ] **Step 4: Commit any final correction only if verification revealed one**

```bash
git add src/components src/lib tests
git commit -m "fix: verify facilitator live result views"
```
