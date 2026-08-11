import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Shield } from 'lucide-react';

export default function LiveResultReportSection({ reportRows }) {
  if (!reportRows || reportRows.length === 0) return null;

  return (
    <div className="w-full">
      {reportRows.map((fm) => (
        <div key={fm.fmNo} className="report-fm-section mb-16">
          <div className="border-b-2 border-gray-800 pb-2 mb-6">
            <div className="flex items-center gap-3 mb-2">
              <span className="inline-flex items-center px-3 py-1 rounded-md bg-gray-800 text-white text-sm font-bold report-preserve-bg">
                FM {fm.fmNo}
              </span>
              {fm.category && (
                <span className="inline-flex items-center px-3 py-1 rounded-md bg-teal-50 text-teal-800 text-sm font-bold border border-teal-200 report-preserve-bg">
                  {fm.category}
                </span>
              )}
            </div>
            <h3 className="text-2xl font-bold text-gray-900">{fm.potentialFailureMode || '(Untitled)'}</h3>
          </div>

          <div className="mb-6 bg-white border border-gray-200 rounded-xl p-5 shadow-sm report-description-notice">
            <h4 className="font-bold text-lg mb-4 text-gray-800 border-b border-gray-100 pb-2">Description</h4>
            <div className="space-y-3">
              {[
                { label: 'Category', value: fm.category },
                { label: 'Potential Failure Mode', value: fm.potentialFailureMode },
                { label: 'Main Trigger / Detailed Mechanism', value: fm.mainTrigger },
                { label: 'Initiation', value: fm.initiation },
                { label: 'Continuation', value: fm.continuation },
                { label: 'Progression', value: fm.progression },
                { label: 'Potential Detection / Monitoring', value: fm.potentialDetection },
                { label: 'Possible Intervention / Risk Controls', value: fm.possibleIntervention },
                { label: 'Potential Effect / Consequence', value: fm.potentialEffect },
                { label: 'PFMA Notes / Workshop Questions', value: fm.pfmaNotes },
                { label: 'Owner / Action', value: fm.owner }
              ].map(field => (
                field.value ? (
                  <div key={field.label} className="text-sm">
                    <span className="font-bold text-gray-700">{field.label}: </span>
                    <span className="text-gray-600">{field.value}</span>
                  </div>
                ) : null
              ))}
            </div>
          </div>

          {!fm.hasCompleteAssessments ? (
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-8 text-center mt-6 report-description-notice">
              <p className="text-gray-500 font-medium italic">No complete assessments yet</p>
            </div>
          ) : (
            <>
              {/* Risk Summary Cards */}
              <div className="grid grid-cols-4 gap-4 mb-6 report-score-card">
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 report-preserve-bg">
                  <div className="text-xs font-bold uppercase text-gray-500 tracking-wider">Weighted Average</div>
                  <div className="text-base font-bold text-gray-800 mt-1">
                    L: {fm.averageLikelihood != null ? fm.averageLikelihood : '—'}
                    <span className="opacity-50 mx-2">|</span>
                    C: {fm.averageConsequence != null ? fm.averageConsequence : '—'}
                  </div>
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 report-preserve-bg">
                  <div className="text-xs font-bold uppercase text-gray-500 tracking-wider flex items-center gap-1">
                    <Shield size={12} /> Rounded
                  </div>
                  <div className="text-base font-bold text-gray-800 mt-1">
                    L: {fm.roundedLikelihood != null ? fm.roundedLikelihood : '—'}
                    <span className="opacity-50 mx-2">|</span>
                    C: {fm.roundedConsequence != null ? fm.roundedConsequence : '—'}
                  </div>
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 report-preserve-bg">
                  <div className="text-xs font-bold uppercase text-gray-500 tracking-wider">Score</div>
                  <div className="text-xl font-extrabold text-gray-900 mt-0.5">{fm.riskScore || '—'}</div>
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 report-preserve-bg">
                  <div className="text-xs font-bold uppercase text-gray-500 tracking-wider">Risk Level</div>
                  <div className="text-base font-bold text-gray-800 mt-1">{fm.finalRiskLevel || '—'}</div>
                </div>
              </div>

              {/* Distributions */}
              <div className="grid grid-cols-3 gap-6 report-chart-container bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                {/* Likelihood Chart */}
                <div className="space-y-3">
                  <div className="text-sm font-bold text-gray-700 uppercase tracking-wider">Likelihood Distribution</div>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={
                        fm.likelihoodDistribution 
                          ? Object.keys(fm.likelihoodDistribution).map(k => ({ name: k, count: fm.likelihoodDistribution[k] }))
                          : []
                      } margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                        <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                        <Bar dataKey="count" fill="#0ea5e9" radius={[4, 4, 0, 0]} isAnimationActive={false} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Consequence Chart */}
                <div className="space-y-3">
                  <div className="text-sm font-bold text-gray-700 uppercase tracking-wider">Consequence Distribution</div>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={
                        fm.consequenceDistribution 
                          ? Object.keys(fm.consequenceDistribution).map(k => ({ name: k, count: fm.consequenceDistribution[k] }))
                          : []
                      } margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                        <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                        <Bar dataKey="count" fill="#f43f5e" radius={[4, 4, 0, 0]} isAnimationActive={false} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Heatmap */}
                <div className="space-y-3">
                  <div className="text-sm font-bold text-gray-700 uppercase tracking-wider">Likelihood x Consequence Heatmap</div>
                  <div className="w-full">
                    <table className="w-full text-xs text-center border-collapse">
                      <thead>
                        <tr>
                          <th className="font-normal text-gray-400 pb-2 w-8">L \ C</th>
                          {[1, 2, 3, 4, 5].map(c => <th key={c} className="font-medium text-gray-500 pb-2">{c}</th>)}
                        </tr>
                      </thead>
                      <tbody>
                        {[1, 2, 3, 4, 5].map(l => (
                          <tr key={l}>
                            <th className="font-medium text-gray-500 pr-2 py-1 w-8">{l}</th>
                            {[1, 2, 3, 4, 5].map(c => {
                              const val = fm.combinationDistribution?.[l]?.[c] || 0;
                              const hasVal = val > 0;
                              const cellClass = hasVal 
                                ? 'bg-amber-100 border-amber-300 text-amber-900 font-bold report-preserve-bg' 
                                : 'bg-gray-50 border-gray-100 text-gray-300 report-preserve-bg';
                              return (
                                <td key={c} className="p-0.5">
                                  <div className={`w-full py-1.5 rounded-sm border ${cellClass}`}>
                                    {val}
                                  </div>
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      ))}
    </div>
  );
}
