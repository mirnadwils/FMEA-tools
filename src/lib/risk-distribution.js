import { getRiskCell } from './merdeka.js';

export const RISK_LEVELS = ['Extreme', 'High', 'Moderate', 'Low'];

export function buildFinalFmDistribution(overviewRows) {
  const counts = Object.fromEntries(RISK_LEVELS.map((level) => [level, 0]));
  for (const row of overviewRows) if (row.hasData && counts[row.riskLevel] !== undefined) counts[row.riskLevel]++;
  const total = Object.values(counts).reduce((sum, count) => sum + count, 0);
  const pieData = RISK_LEVELS.map((name) => ({ name, value: counts[name], percentage: total ? Math.round((counts[name] / total) * 10000) / 100 : 0 }));
  return { total, counts, pieData };
}

export function buildResponseDistribution(overviewRows, aggregated) {
  const aggByFm = new Map(aggregated.map((agg) => [agg.fmNo, agg]));
  return overviewRows.map((row) => {
    const counts = Object.fromEntries(RISK_LEVELS.map((level) => [level, 0]));
    let totalResponses = 0;
    const agg = aggByFm.get(row.fmNo);
    if (agg && agg.combinationDistribution) {
      for (let likelihood = 1; likelihood <= 5; likelihood++) {
        for (let consequence = 1; consequence <= 5; consequence++) {
          const count = agg.combinationDistribution[likelihood]?.[consequence] || 0;
          if (count > 0) {
            const cell = getRiskCell(likelihood, consequence);
            if (cell && counts[cell.level] !== undefined) {
              counts[cell.level] += count;
              totalResponses += count;
            }
          }
        }
      }
    }
    return { fmNo: row.fmNo, title: row.title, totalResponses, ...counts };
  });
}
