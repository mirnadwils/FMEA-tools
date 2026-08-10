# Risk Distribution Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add final-FM risk summaries, a final-FM percentage pie chart, and an anonymous individual-response stacked bar chart before the facilitator Risk Overview radar.

**Architecture:** Derive both visual datasets entirely in the client from the existing anonymous `liveData.aggregated` payload. A pure risk-distribution library maps final FM levels for cards/pie and maps every nonzero Likelihood × Consequence combination count through `getRiskCell` for per-FM response bars; a reusable dashboard component renders those results before the existing radar without changing API requests.

**Tech Stack:** Next.js 16 App Router, React 19, Recharts 3, Node built-in test runner, ESLint.

## Global Constraints

- Summary cards and pie segments count only FMs with a final `riskLevel`; FMs without complete responses are excluded from their total and percentage denominator.
- Stacked bar segments count individual complete responses by the individual Merdeka cell level derived from anonymous `combinationDistribution`.
- No component or helper may receive member identity, raw assessment draft, individual rating value, experience level, or weighting.
- Every session FM appears in the stacked bar dataset; a no-response FM has four zero counts and tooltip text `No complete responses`.
- Colors remain stable: Extreme red, High yellow, Moderate blue, Low green.
- Existing radar data, table data, filters, sorting, API routes, calculations, and polling remain unchanged.

---

## File Structure

- Create: `src/lib/risk-distribution.js` — pure final-FM and individual-response distribution mappers.
- Create: `tests/risk-distribution.test.js` — unit coverage for levels, no-data exclusion, matrix-cell mapping, and privacy-safe output.
- Create: `src/components/RiskDistributionDashboard.jsx` — four cards, pie chart, and horizontal stacked bar chart with tooltips.
- Modify: `src/components/RiskOverviewTab.jsx` — create dashboard data and render the dashboard before the radar chart.

## Task 1: Pure Distribution Data Mappers

**Files:**
- Create: `src/lib/risk-distribution.js`
- Create: `tests/risk-distribution.test.js`

**Interfaces:**
- Produces: `RISK_LEVELS = ['Extreme', 'High', 'Moderate', 'Low']`.
- Produces: `buildFinalFmDistribution(overviewRows): { total, counts, pieData }`.
- Produces: `buildResponseDistribution(overviewRows, aggregated): Array<{ fmNo, title, totalResponses, Extreme, High, Moderate, Low }>`.
- Consumed by: `RiskDistributionDashboard` and `RiskOverviewTab`.

- [ ] **Step 1: Write failing tests for final FM counts and response-level matrix mapping**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { buildFinalFmDistribution, buildResponseDistribution } from '../src/lib/risk-distribution.js';

test('counts only final FM levels and calculates pie percentages from assessed FMs', () => {
  const result = buildFinalFmDistribution([
    { fmNo: 'FM-1', riskLevel: 'Extreme', hasData: true },
    { fmNo: 'FM-2', riskLevel: 'High', hasData: true },
    { fmNo: 'FM-3', riskLevel: 'High', hasData: true },
    { fmNo: 'FM-4', riskLevel: null, hasData: false },
  ]);
  assert.equal(result.total, 3);
  assert.deepEqual(result.counts, { Extreme: 1, High: 2, Moderate: 0, Low: 0 });
  assert.equal(result.pieData.find((item) => item.name === 'High').percentage, 66.67);
});

test('maps anonymous combination counts into individual Merdeka response levels', () => {
  const rows = [{ fmNo: 'FM-1', title: 'Seepage' }];
  const aggregated = [{
    fmNo: 'FM-1',
    combinationDistribution: {
      1: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 1 },
      2: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      3: { 1: 0, 2: 0, 3: 1, 4: 0, 5: 0 },
      4: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      5: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    },
  }];
  const [result] = buildResponseDistribution(rows, aggregated);
  assert.equal(result.High, 2);
  assert.equal(result.totalResponses, 2);
  assert.equal('riskLikelihood' in result, false);
  assert.equal('negativeConsequence' in result, false);
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `node --test tests/risk-distribution.test.js`

Expected: FAIL because `src/lib/risk-distribution.js` does not exist.

- [ ] **Step 3: Implement the final and response distribution mappers**

```js
import { getRiskCell } from './merdeka.js';

export const RISK_LEVELS = ['Extreme', 'High', 'Moderate', 'Low'];

export function buildFinalFmDistribution(overviewRows) {
  const counts = Object.fromEntries(RISK_LEVELS.map((level) => [level, 0]));
  for (const row of overviewRows) if (row.hasData && counts[row.riskLevel] !== undefined) counts[row.riskLevel]++;
  const total = Object.values(counts).reduce((sum, count) => sum + count, 0);
  const pieData = RISK_LEVELS.map((name) => ({ name, value: counts[name], percentage: total ? Math.round((counts[name] / total) * 10000) / 100 : 0 }));
  return { total, counts, pieData };
}
```

Implement `buildResponseDistribution` by indexing `aggregated` by `fmNo`, iterating likelihood and consequence from 1 through 5, reading each anonymous cell count, calling `getRiskCell(likelihood, consequence)`, and incrementing only the returned `cell.level`. Emit a row for every overview FM even when no aggregate exists.

- [ ] **Step 4: Run focused tests to verify they pass**

Run: `node --test tests/risk-distribution.test.js`

Expected: PASS with 2 tests.

- [ ] **Step 5: Commit the distribution data model**

```bash
git add src/lib/risk-distribution.js tests/risk-distribution.test.js
git commit -m "feat: derive anonymous risk distributions"
```

## Task 2: Risk Distribution Dashboard Component

**Files:**
- Create: `src/components/RiskDistributionDashboard.jsx`
- Test: `tests/risk-distribution.test.js`

**Interfaces:**
- Consumes: `finalDistribution` from `buildFinalFmDistribution` and `responseRows` from `buildResponseDistribution`.
- Produces: `<RiskDistributionDashboard finalDistribution={...} responseRows={...} />`.

- [ ] **Step 1: Add a green regression test for a no-data FM response row**

```js
test('keeps no-response FM rows with zero segments for the chart tooltip', () => {
  const [row] = buildResponseDistribution([{ fmNo: 'FM-9', title: 'No data' }], []);
  assert.deepEqual({ Extreme: row.Extreme, High: row.High, Moderate: row.Moderate, Low: row.Low, total: row.totalResponses },
    { Extreme: 0, High: 0, Moderate: 0, Low: 0, total: 0 });
});
```

- [ ] **Step 2: Run the regression test before rendering charts**

Run: `node --test tests/risk-distribution.test.js`

Expected: PASS. The data contract was implemented and tested in Task 1; this locks the no-data visual state.

- [ ] **Step 3: Implement cards, pie, and horizontal stacked bars**

Render four summary cards from `RISK_LEVELS`, then a pie chart and a horizontal stacked `BarChart` side by side on large screens and vertically stacked on small screens. Use Recharts `PieChart`, `Pie`, `Cell`, `Legend`, `BarChart`, `Bar`, `XAxis`, `YAxis`, `CartesianGrid`, `Tooltip`, and `ResponsiveContainer`.

Use this stable color map in cards, pie cells, bar segments, and legends:

```js
const RISK_COLORS = { Extreme: '#dc2626', High: '#eab308', Moderate: '#2563eb', Low: '#16a34a' };
```

For the response chart use `layout="vertical"`, `YAxis dataKey="fmNo" type="category"`, `XAxis type="number" allowDecimals={false}`, and one `<Bar stackId="responses" dataKey={level}>` per risk level. Its height is `Math.max(280, responseRows.length * 36)` so every FM remains readable; unlike the radar, bar rows intentionally use data count for readable categorical spacing.

Create custom tooltips:

- Pie tooltip: level, assessed-FM count, and percentage.
- Stacked-bar tooltip: FM number, title, each level’s count, and `No complete responses` when `totalResponses === 0`.

Do not add user or draft data to props.

- [ ] **Step 4: Run focused tests and lint**

Run: `node --test tests/risk-distribution.test.js && npm run lint`

Expected: both commands exit 0.

- [ ] **Step 5: Commit the dashboard component**

```bash
git add src/components/RiskDistributionDashboard.jsx tests/risk-distribution.test.js
git commit -m "feat: render risk distribution dashboard"
```

## Task 3: Integrate Before the Radar Without Affecting Existing Controls

**Files:**
- Modify: `src/components/RiskOverviewTab.jsx:1-220`
- Test: `tests/risk-distribution.test.js`

**Interfaces:**
- Consumes: `buildRiskOverviewData`, `buildFinalFmDistribution`, `buildResponseDistribution`, and `RiskDistributionDashboard`.
- Produces: distribution dashboard before existing radar and table.

- [ ] **Step 1: Add a source-contract regression test for dashboard order**

```js
import { readFile } from 'node:fs/promises';

test('renders risk distribution dashboard before the global radar', async () => {
  const component = await readFile(new URL('../src/components/RiskOverviewTab.jsx', import.meta.url), 'utf8');
  assert.ok(component.indexOf('<RiskDistributionDashboard') < component.indexOf('<RadarChart'));
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --test tests/risk-distribution.test.js`

Expected: FAIL because `RiskOverviewTab` does not yet render the dashboard.

- [ ] **Step 3: Build data once and render the new component before the radar**

Add imports:

```js
import RiskDistributionDashboard from './RiskDistributionDashboard';
import { buildFinalFmDistribution, buildResponseDistribution } from '@/lib/risk-distribution';
```

After `const data = buildRiskOverviewData(...)`, add:

```js
const finalDistribution = buildFinalFmDistribution(data);
const responseRows = buildResponseDistribution(data, liveData.aggregated);
```

Render `<RiskDistributionDashboard finalDistribution={finalDistribution} responseRows={responseRows} />` immediately before the existing radar card. Keep `<RadarChart data={data}>` and `tableRows` unchanged; table filters/sort controls must not be passed to the dashboard.

- [ ] **Step 4: Run focused tests, full tests, lint, and production build**

Run: `node --test tests/risk-distribution.test.js && npm test && npm run lint && npm run build`

Expected: all commands exit 0.

- [ ] **Step 5: Manually verify dashboard semantics**

Run: `npm run dev`

As a facilitator, verify the four cards sum to the pie denominator, the pie percentages sum to 100% when assessed FMs exist, and each stacked-bar total equals the corresponding Live Results complete-response count. Verify a no-response FM shows zero segments with the explicit tooltip message. Search, filter, and sort the table; confirm cards, pie, stacked bars, and radar do not change.

- [ ] **Step 6: Commit the integrated dashboard**

```bash
git add src/components/RiskOverviewTab.jsx src/components/RiskDistributionDashboard.jsx src/lib/risk-distribution.js tests/risk-distribution.test.js
git commit -m "feat: add risk overview distribution dashboard"
```

## Task 4: Final Requirement Verification

**Files:**
- Verify: `src/lib/risk-distribution.js`
- Verify: `src/components/RiskDistributionDashboard.jsx`
- Verify: `src/components/RiskOverviewTab.jsx`
- Verify: `tests/risk-distribution.test.js`

- [ ] **Step 1: Verify requirements line by line**

Confirm: cards and pie count final weighted FM levels; incomplete FMs are excluded from their denominator; bars count individual matrix-level responses from anonymous combination cells; all FMs render including zero-response FMs; colors are stable; dashboard appears before radar; and no table control modifies any new chart.

- [ ] **Step 2: Run final verification**

Run: `npm test && npm run lint && npm run build`

Expected: all commands exit 0.

- [ ] **Step 3: Commit an evidence-backed correction only if verification exposed one**

```bash
git add src/lib/risk-distribution.js src/components/RiskDistributionDashboard.jsx src/components/RiskOverviewTab.jsx tests/risk-distribution.test.js
git commit -m "fix: verify risk distribution dashboard"
```
