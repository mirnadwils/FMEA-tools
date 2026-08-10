# Risk Overview Layout and Table Controls Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove excessive vertical whitespace from the facilitator Risk Overview radar and add table-only search, filters, and sortable columns.

**Architecture:** Keep the radar data untouched and render it in a width-driven square container capped at 560 pixels; it must not derive height from FM count. Put filtering and sorting in a pure table-row utility, then let `RiskOverviewTab` keep only the control state and render its derived table rows; the radar continues to render the original unfiltered live data.

**Tech Stack:** Next.js 16 App Router, React 19, Recharts 3, lucide-react, Node built-in test runner, ESLint.

## Global Constraints

- The radar uses all session FMs and final Merdeka risk scores on the 1-to-25 scale, regardless of table search, filters, or sorting.
- The radar container height is width-driven, centred, and constrained to the 360-to-560 pixel range; it is never calculated from the number of FMs.
- Table search matches FM number and the current language-resolved title, case-insensitively.
- Table filters are `All`, `Has data`, `No data` and `All`, `Low`, `Moderate`, `High`, `Extreme`.
- Repeated click on the same sortable header reverses its direction. Sortable columns are FM, title, rounded Likelihood, rounded Consequence, final score, and risk level.
- Existing live aggregation, participant authorization, six-second polling, and risk calculations are unchanged.

---

## File Structure

- Create: `src/lib/risk-overview-table.js` — pure filtering, sorting, and sort-toggle helpers.
- Create: `tests/risk-overview-table.test.js` — unit coverage for search, combined filters, table-only sorting, and repeated-click reversal.
- Modify: `src/components/RiskOverviewTab.jsx` — fixed responsive radar container and table control UI.

## Task 1: Pure Table Filter and Sort Model

**Files:**
- Create: `src/lib/risk-overview-table.js`
- Create: `tests/risk-overview-table.test.js`

**Interfaces:**
- Produces: `DEFAULT_RISK_OVERVIEW_SORT = { key: 'riskScore', direction: 'desc' }`
- Produces: `toggleRiskOverviewSort(currentSort, key): { key: string, direction: 'asc' | 'desc' }`
- Produces: `getRiskOverviewTableRows(rows, { query, dataStatus, riskLevel, sort }): Array<RiskOverviewRow>`
- Consumed by: `RiskOverviewTab`.

- [ ] **Step 1: Write failing tests for search, combined filters, and sort reversal**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_RISK_OVERVIEW_SORT,
  getRiskOverviewTableRows,
  toggleRiskOverviewSort,
} from '../src/lib/risk-overview-table.js';

const rows = [
  { fmNo: 'FM-10', title: 'Leak at crest', hasData: true, riskLevel: 'High', roundedLikelihood: 4, roundedConsequence: 3, riskScore: 20 },
  { fmNo: 'FM-2', title: 'Settlement', hasData: true, riskLevel: 'Moderate', roundedLikelihood: 2, roundedConsequence: 2, riskScore: 8 },
  { fmNo: 'FM-3', title: 'Unassessed drain', hasData: false, riskLevel: null, roundedLikelihood: null, roundedConsequence: null, riskScore: 0 },
];

test('searches FM number and localized title case-insensitively', () => {
  assert.deepEqual(getRiskOverviewTableRows(rows, { query: 'fm-2', dataStatus: 'all', riskLevel: 'all', sort: DEFAULT_RISK_OVERVIEW_SORT }).map((row) => row.fmNo), ['FM-2']);
  assert.deepEqual(getRiskOverviewTableRows(rows, { query: 'CREST', dataStatus: 'all', riskLevel: 'all', sort: DEFAULT_RISK_OVERVIEW_SORT }).map((row) => row.fmNo), ['FM-10']);
});

test('combines status and risk-level filters', () => {
  assert.deepEqual(getRiskOverviewTableRows(rows, { query: '', dataStatus: 'hasData', riskLevel: 'High', sort: DEFAULT_RISK_OVERVIEW_SORT }).map((row) => row.fmNo), ['FM-10']);
  assert.deepEqual(getRiskOverviewTableRows(rows, { query: '', dataStatus: 'noData', riskLevel: 'all', sort: DEFAULT_RISK_OVERVIEW_SORT }).map((row) => row.fmNo), ['FM-3']);
});

test('repeated sort on the same column reverses direction', () => {
  const ascending = toggleRiskOverviewSort(DEFAULT_RISK_OVERVIEW_SORT, 'fmNo');
  assert.deepEqual(ascending, { key: 'fmNo', direction: 'asc' });
  assert.deepEqual(toggleRiskOverviewSort(ascending, 'fmNo'), { key: 'fmNo', direction: 'desc' });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `node --test tests/risk-overview-table.test.js`

Expected: FAIL because `src/lib/risk-overview-table.js` does not exist.

- [ ] **Step 3: Implement table-only derivation helpers**

```js
export const DEFAULT_RISK_OVERVIEW_SORT = { key: 'riskScore', direction: 'desc' };

export function toggleRiskOverviewSort(currentSort, key) {
  return currentSort.key === key
    ? { key, direction: currentSort.direction === 'asc' ? 'desc' : 'asc' }
    : { key, direction: 'asc' };
}

export function getRiskOverviewTableRows(rows, { query, dataStatus, riskLevel, sort }) {
  const term = query.trim().toLocaleLowerCase();
  const filtered = rows.filter((row) => {
    const matchesText = !term || row.fmNo.toLocaleLowerCase().includes(term) || row.title.toLocaleLowerCase().includes(term);
    const matchesStatus = dataStatus === 'all' || (dataStatus === 'hasData' ? row.hasData : !row.hasData);
    const matchesLevel = riskLevel === 'all' || row.riskLevel === riskLevel;
    return matchesText && matchesStatus && matchesLevel;
  });
  return [...filtered].sort((left, right) => compareRiskOverviewRows(left, right, sort));
}
```

Implement `compareRiskOverviewRows` with `localeCompare(..., undefined, { numeric: true, sensitivity: 'base' })` for FM/title, `LOW < MODERATE < HIGH < EXTREME` for risk level, and a null-last numeric comparison for Likelihood, Consequence, and Score. Multiply the result by `-1` only for descending sort.

- [ ] **Step 4: Run the table model tests to verify they pass**

Run: `node --test tests/risk-overview-table.test.js`

Expected: PASS with 3 tests.

- [ ] **Step 5: Commit the table model**

```bash
git add src/lib/risk-overview-table.js tests/risk-overview-table.test.js
git commit -m "feat: add risk overview table controls model"
```

## Task 2: Compact Width-Driven Radar Layout

**Files:**
- Modify: `src/components/RiskOverviewTab.jsx:1-106`
- Test: `tests/risk-overview-table.test.js`

**Interfaces:**
- Consumes: unchanged `buildRiskOverviewData(session.fmList, liveData.aggregated, lang)`.
- Produces: a radar rendering area independent of FM count.

- [ ] **Step 1: Capture the layout regression as an acceptance check**

Record the current failing visual condition: on a session with many FMs, `const chartHeight = Math.max(420, data.length * 48)` makes the chart canvas taller for each additional FM although radar diameter is limited by available width.

- [ ] **Step 2: Replace the count-derived chart height with a bounded square container**

Delete `chartHeight` and replace the chart wrapper with:

```jsx
<div className="mx-auto w-full max-w-[560px] aspect-square min-h-[360px] max-h-[560px]">
  <ResponsiveContainer width="100%" height="100%">
    <RadarChart data={data} outerRadius="72%">
      {/* existing grid, axes, tooltip, and radar remain unchanged */}
    </RadarChart>
  </ResponsiveContainer>
</div>
```

Do not change `data`, `riskScore`, `PolarRadiusAxis domain={[0, 25]}`, tooltip content, or any request/polling logic.

- [ ] **Step 3: Run the existing overview tests, lint, and production build**

Run: `npm test && npm run lint && npm run build`

Expected: all commands exit 0.

- [ ] **Step 4: Manually verify the visual root-cause regression**

Run: `npm run dev`

Open Risk Overview with the same session shown in the supplied screenshot. Confirm the radar is centred, the chart card has no count-proportional empty vertical space, and the tooltip still exposes FM number/title/score on hover.

- [ ] **Step 5: Commit the layout correction**

```bash
git add src/components/RiskOverviewTab.jsx
git commit -m "fix: constrain risk overview radar height"
```

## Task 3: Table Search, Filters, and Sortable Headers

**Files:**
- Modify: `src/components/RiskOverviewTab.jsx:1-145`
- Test: `tests/risk-overview-table.test.js`

**Interfaces:**
- Consumes: `DEFAULT_RISK_OVERVIEW_SORT`, `getRiskOverviewTableRows`, and `toggleRiskOverviewSort` from Task 1.
- Produces: client-only table controls that operate on `tableRows`, not the `data` passed to the radar.

- [ ] **Step 1: Add a regression test that sorting does not mutate original radar data**

```js
test('returns a sorted copy without mutating radar source rows', () => {
  const original = [...rows];
  getRiskOverviewTableRows(rows, { query: '', dataStatus: 'all', riskLevel: 'all', sort: { key: 'fmNo', direction: 'asc' } });
  assert.deepEqual(rows, original);
});
```

- [ ] **Step 2: Run the test to verify it fails before immutable sorting is implemented**

Run: `node --test tests/risk-overview-table.test.js`

Expected: FAIL until the implementation copies rows before sorting.

- [ ] **Step 3: Add state and derive table rows without changing radar data**

At the top of `RiskOverviewTab`, import `useMemo` and `useState`; add:

```jsx
const [query, setQuery] = useState('');
const [dataStatus, setDataStatus] = useState('all');
const [riskLevel, setRiskLevel] = useState('all');
const [sort, setSort] = useState(DEFAULT_RISK_OVERVIEW_SORT);

const tableRows = useMemo(() => getRiskOverviewTableRows(data, {
  query, dataStatus, riskLevel, sort,
}), [data, query, dataStatus, riskLevel, sort]);
```

Keep `<RadarChart data={data}>` exactly as is. It must not consume `tableRows`.

- [ ] **Step 4: Add the control bar and accessible sortable headers**

Place the controls immediately above the summary table:

```jsx
<div className="flex flex-col gap-3 mb-4 md:flex-row md:items-center">
  <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search FM or title" aria-label="Search FM or title" />
  <select value={dataStatus} onChange={(event) => setDataStatus(event.target.value)} aria-label="Filter data status">
    <option value="all">All data</option><option value="hasData">Has data</option><option value="noData">No data</option>
  </select>
  <select value={riskLevel} onChange={(event) => setRiskLevel(event.target.value)} aria-label="Filter risk level">
    <option value="all">All levels</option><option value="Low">Low</option><option value="Moderate">Moderate</option><option value="High">High</option><option value="Extreme">Extreme</option>
  </select>
</div>
```

Replace each sortable `<th>` text with a button that calls `setSort((current) => toggleRiskOverviewSort(current, key))`, sets `aria-sort` to `ascending`, `descending`, or `none`, and shows a compact direction icon only for the active key. Render `tableRows`, not `data`, in the table body. Show `No failure modes match these controls.` when the filtered list is empty.

- [ ] **Step 5: Run focused tests, lint, and build**

Run: `node --test tests/risk-overview-table.test.js && npm run lint && npm run build`

Expected: all commands exit 0.

- [ ] **Step 6: Manually test client interaction**

Run: `npm run dev`

In Risk Overview, verify searching by FM number and title; each status and level filter; every sortable header; a repeated header click; combined filters returning zero rows; and that the radar visual does not change during any table interaction.

- [ ] **Step 7: Commit the interactive table**

```bash
git add src/components/RiskOverviewTab.jsx src/lib/risk-overview-table.js tests/risk-overview-table.test.js
git commit -m "feat: filter and sort risk overview table"
```

## Task 4: Final Requirement Verification

**Files:**
- Verify: `src/components/RiskOverviewTab.jsx`
- Verify: `src/lib/risk-overview-table.js`
- Verify: `tests/risk-overview-table.test.js`

- [ ] **Step 1: Check each approved requirement against the implementation**

Confirm: radar remains global; no height uses `data.length`; display range is 360-to-560 pixels; table supports title/FM search; both filter groups work together; six headers sort; same-header click reverses direction; and no table state feeds the radar.

- [ ] **Step 2: Run complete verification**

Run: `npm test && npm run lint && npm run build`

Expected: all commands exit 0.

- [ ] **Step 3: Commit an evidence-backed final correction only if verification exposed one**

```bash
git add src/components/RiskOverviewTab.jsx src/lib/risk-overview-table.js tests/risk-overview-table.test.js
git commit -m "fix: verify risk overview controls"
```
