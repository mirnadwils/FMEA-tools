import { buildRiskOverviewData } from './risk-overview.js';
import { buildFinalFmDistribution, buildResponseDistribution } from './risk-distribution.js';

export function sortFailureModesForReport(fmList) {
  return [...fmList].sort((a, b) => {
    // Basic natural sort on fmNo, assuming format like FM1, FM2, FM10
    const aMatch = a.fmNo.match(/FM(\d+)/);
    const bMatch = b.fmNo.match(/FM(\d+)/);
    
    if (aMatch && bMatch) {
      return parseInt(aMatch[1], 10) - parseInt(bMatch[1], 10);
    }
    
    return a.fmNo.localeCompare(b.fmNo);
  });
}

export function buildReportLiveResultRows(fmList, aggregated) {
  const sortedFMs = sortFailureModesForReport(fmList);
  
  return sortedFMs.map(fm => {
    const agg = aggregated.find(a => a.fmNo === fm.fmNo);
    const hasCompleteAssessments = !!agg && agg.count > 0;
    
    return {
      fmNo: fm.fmNo,
      category: fm.category,
      potentialFailureMode: fm.potentialFailureMode,
      mainTrigger: fm.mainTrigger,
      initiation: fm.initiation,
      continuation: fm.continuation,
      progression: fm.progression,
      potentialDetection: fm.potentialDetection,
      possibleIntervention: fm.possibleIntervention,
      potentialEffect: fm.potentialEffect,
      pfmaNotes: fm.pfmaNotes,
      owner: fm.owner,
      
      hasCompleteAssessments,
      count: hasCompleteAssessments ? agg.count : 0,
      averageLikelihood: hasCompleteAssessments ? agg.averageLikelihood : null,
      averageConsequence: hasCompleteAssessments ? agg.averageConsequence : null,
      roundedLikelihood: hasCompleteAssessments ? agg.roundedLikelihood : null,
      roundedConsequence: hasCompleteAssessments ? agg.roundedConsequence : null,
      riskScore: hasCompleteAssessments ? agg.riskScore : null,
      finalRiskLevel: hasCompleteAssessments ? agg.finalRiskLevel : null,
      likelihoodDistribution: hasCompleteAssessments ? agg.likelihoodDistribution : null,
      consequenceDistribution: hasCompleteAssessments ? agg.consequenceDistribution : null,
      combinationDistribution: hasCompleteAssessments ? agg.combinationDistribution : null,
    };
  });
}

export function buildReportRiskOverview(fmList, aggregated) {
  const overviewRows = buildRiskOverviewData(fmList, aggregated, 'en');
  const finalDistribution = buildFinalFmDistribution(overviewRows);
  const responseDistribution = buildResponseDistribution(overviewRows);
  
  // Sort the overview rows by natural FM order
  const sortedOverviewRows = [...overviewRows].sort((a, b) => {
    const aMatch = a.fmNo.match(/FM(\d+)/);
    const bMatch = b.fmNo.match(/FM(\d+)/);
    
    if (aMatch && bMatch) {
      return parseInt(aMatch[1], 10) - parseInt(bMatch[1], 10);
    }
    
    return a.fmNo.localeCompare(b.fmNo);
  });

  return {
    overviewRows: sortedOverviewRows,
    finalDistribution,
    responseDistribution
  };
}
