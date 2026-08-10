const RISK_LEVEL_ORDER = { Low: 1, Moderate: 2, High: 3, Extreme: 4 };

export const DEFAULT_RISK_OVERVIEW_SORT = { key: 'riskScore', direction: 'desc' };

export function toggleRiskOverviewSort(currentSort, key) {
  return currentSort.key === key
    ? { key, direction: currentSort.direction === 'asc' ? 'desc' : 'asc' }
    : { key, direction: 'asc' };
}

function compareRiskOverviewRows(left, right, sort) {
  const { key, direction } = sort;
  const multiplier = direction === 'desc' ? -1 : 1;

  if (key === 'fmNo' || key === 'title') {
    const a = left[key] ?? '';
    const b = right[key] ?? '';
    return multiplier * a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
  }

  if (key === 'riskLevel') {
    const a = RISK_LEVEL_ORDER[left.riskLevel] ?? 0;
    const b = RISK_LEVEL_ORDER[right.riskLevel] ?? 0;
    return multiplier * (a - b);
  }

  // Numeric columns: roundedLikelihood, roundedConsequence, riskScore
  const a = left[key] ?? -Infinity;
  const b = right[key] ?? -Infinity;
  return multiplier * (a - b);
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
