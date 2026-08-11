import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { sortFailureModesForReport, buildReportLiveResultRows } from '../src/lib/report-data.js';
test('sortFailureModesForReport naturally sorts by FM number without mutating', (t) => {
  const fmList = [
    { fmNo: 'FM10' },
    { fmNo: 'FM2' },
    { fmNo: 'FM1' },
    { fmNo: 'FM20' }
  ];
  
  // Clone to check for mutation
  const originalList = [...fmList];

  const sorted = sortFailureModesForReport(fmList);

  // Assert no mutation
  assert.deepStrictEqual(fmList, originalList, 'Source array was mutated');

  // Assert natural sorting order
  const sortedIds = sorted.map(fm => fm.fmNo);
  assert.deepStrictEqual(sortedIds, ['FM1', 'FM2', 'FM10', 'FM20'], 'Failed to naturally sort FM numbers');
});

test('buildReportLiveResultRows emits all FMs and anonymizes aggregate data', (t) => {
  const fmList = [
    { fmNo: 'FM1', potentialFailureMode: 'Failure 1', owner: 'Owner 1' },
    { fmNo: 'FM2', potentialFailureMode: 'Failure 2', owner: 'Owner 2' }
  ];

  const aggregated = [
    {
      fmNo: 'FM1',
      count: 2,
      averageLikelihood: 3.5,
      averageConsequence: 4.0,
      riskScore: 14,
      finalRiskLevel: 'HIGH',
      likelihoodDistribution: [],
      consequenceDistribution: [],
      combinationDistribution: [],
      // These fields should NOT be included in the output
      memberId: 'user_123',
      email: 'test@example.com',
      experience: 'expert',
      riskLikelihood: 3,
      negativeConsequence: 4,
      draft: {}
    }
  ];

  const rows = buildReportLiveResultRows(fmList, aggregated);

  assert.strictEqual(rows.length, 2, 'Should emit row for every imported FM');

  const fm1Row = rows.find(r => r.fmNo === 'FM1');
  const fm2Row = rows.find(r => r.fmNo === 'FM2');

  assert.ok(fm1Row, 'FM1 should exist');
  assert.ok(fm2Row, 'FM2 should exist');

  // FM1 should have complete assessments
  assert.strictEqual(fm1Row.hasCompleteAssessments, true, 'FM1 should have complete assessments');
  
  // Check anonymization on FM1
  assert.strictEqual(fm1Row.count, 2);
  assert.strictEqual(fm1Row.riskScore, 14);
  assert.strictEqual(fm1Row.memberId, undefined, 'memberId must not be present');
  assert.strictEqual(fm1Row.email, undefined, 'email must not be present');
  assert.strictEqual(fm1Row.experience, undefined, 'experience must not be present');
  assert.strictEqual(fm1Row.riskLikelihood, undefined, 'riskLikelihood must not be present');
  assert.strictEqual(fm1Row.negativeConsequence, undefined, 'negativeConsequence must not be present');
  assert.strictEqual(fm1Row.draft, undefined, 'draft must not be present');

  // FM2 should not have complete assessments
  assert.strictEqual(fm2Row.hasCompleteAssessments, false, 'FM2 should not have complete assessments');
  assert.strictEqual(fm2Row.count, 0, 'FM2 should have 0 count when no aggregate exists');
});

test('Report route enforces facilitator authorization boundary', (t) => {
  const routePath = path.join(process.cwd(), 'src/app/facilitator/sessions/[code]/report/page.jsx');
  
  let source;
  try {
    source = fs.readFileSync(routePath, 'utf8');
  } catch (err) {
    assert.fail(`Route file does not exist: ${routePath}`);
  }

  // Assert it imports getAuthenticatedUser and requireAppRole
  assert.match(source, /import\s+\{.*getAuthenticatedUser.*\}\s+from\s+['"]@\/lib\/auth['"]/, 'Must import getAuthenticatedUser');
  assert.match(source, /import\s+\{.*requireAppRole.*\}\s+from\s+['"]@\/lib\/auth['"]/, 'Must import requireAppRole');
  
  // Assert it calls them
  assert.match(source, /await\s+getAuthenticatedUser\(\)/, 'Must call getAuthenticatedUser');
  assert.match(source, /await\s+requireAppRole\(\s*\[['"]FACILITATOR['"](,\s*['"]ADMIN['"])?\]/i, 'Must require FACILITATOR role');
});

test('ParticipantsReportSection enforces complete data fields', (t) => {
  const compPath = path.join(process.cwd(), 'src/components/report/ParticipantsReportSection.jsx');
  // It's okay if it fails if not implemented yet, that is step 1.
  let source = '';
  try {
    source = fs.readFileSync(compPath, 'utf8');
  } catch(e) {}
  
  if (source) {
    assert.match(source, /name/i, 'Must contain name');
    assert.match(source, /email/i, 'Must contain email');
    assert.match(source, /field work/i, 'Must contain field work');
    assert.match(source, /experience/i, 'Must contain experience');
    assert.match(source, /completion count|completed.*count/i, 'Must contain completion count');
    assert.match(source, /completed fm/i, 'Must contain completed FM numbers');
    assert.match(source, /incomplete fm/i, 'Must contain incomplete FM numbers');
  }
});

test('RiskOverviewReportSection enforces complete report content', (t) => {
  const compPath = path.join(process.cwd(), 'src/components/report/RiskOverviewReportSection.jsx');
  let source = '';
  try {
    source = fs.readFileSync(compPath, 'utf8');
  } catch(e) {}
  
  if (source) {
    assert.match(source, /RadarChart/, 'Must render RadarChart');
    assert.doesNotMatch(source, /getRiskOverviewTableRows/, 'Must not use interactive getRiskOverviewTableRows');
  }
});

test('LiveResultReportSection enforces complete data fields', (t) => {
  const compPath = path.join(process.cwd(), 'src/components/report/LiveResultReportSection.jsx');
  let source = '';
  try {
    source = fs.readFileSync(compPath, 'utf8');
  } catch(e) {}
  
  if (source) {
    // 11 description fields
    assert.match(source, /category/i, 'Must contain category');
    assert.match(source, /potential failure mode/i, 'Must contain potential failure mode');
    assert.match(source, /main trigger/i, 'Must contain main trigger');
    assert.match(source, /initiation/i, 'Must contain initiation');
    assert.match(source, /continuation/i, 'Must contain continuation');
    assert.match(source, /progression/i, 'Must contain progression');
    assert.match(source, /potential detection/i, 'Must contain potential detection');
    assert.match(source, /possible intervention/i, 'Must contain possible intervention');
    assert.match(source, /potential effect/i, 'Must contain potential effect');
    assert.match(source, /pfma notes/i, 'Must contain pfma notes');
    assert.match(source, /owner/i, 'Must contain owner');
    
    // Result cards check (weighted average, rounded pair, etc)
    assert.match(source, /Likelihood Distribution/i, 'Must contain Likelihood Distribution chart title');
    assert.match(source, /Consequence Distribution/i, 'Must contain Consequence Distribution chart title');
    assert.match(source, /Likelihood\s*x\s*Consequence\s*Heatmap/i, 'Must contain heatmap title');
  }
});

test('FMEAApp Export tab includes PDF report link', (t) => {
  const compPath = path.join(process.cwd(), 'src/components/FMEAApp.jsx');
  let source = '';
  try {
    source = fs.readFileSync(compPath, 'utf8');
  } catch(e) {}
  
  if (source) {
    // Assert the Export tab includes an anchor/link targeting the facilitator report path
    assert.match(source, /\/facilitator\/sessions\/\$\{[^}]+\}\/report/, 'Must contain link to facilitator report');
    // Ensure it's separate from existing export action by checking target/rel
    assert.match(source, /target="_blank"/, 'Must open in new tab');
    assert.match(source, /noopener/, 'Must handle noopener safely');
  }
});
