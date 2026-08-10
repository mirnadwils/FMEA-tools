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
