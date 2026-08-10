'use client';

import React from 'react';
import { RadarChart, Radar, PolarAngleAxis, PolarGrid, PolarRadiusAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { buildRiskOverviewData } from '@/lib/risk-overview';

/**
 * Custom tooltip for the Risk Overview radar chart.
 * Shows FM number, title, score/level, and weighted + rounded L/C values.
 */
function RiskOverviewTooltip({ active, payload }) {
  if (!active || !payload || !payload.length) return null;
  const item = payload[0]?.payload;
  if (!item) return null;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-lg max-w-xs">
      <div className="flex items-center gap-2 mb-1">
        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-800 text-white text-[10px] font-bold">
          FM {item.fmNo}
        </span>
      </div>
      <div className="text-sm font-bold text-slate-800 mb-1.5 leading-snug">{item.title}</div>
      {item.hasData ? (
        <div className="space-y-1">
          <div className="text-xs text-slate-600">
            <span className="font-bold">Score:</span> {item.riskScore}
            {item.riskLevel && <span className="ml-2 font-bold text-slate-500">({item.riskLevel})</span>}
          </div>
          <div className="text-xs text-slate-500">
            <span className="font-bold">Weighted:</span> L {item.avgRiskLikelihood} / C {item.avgNegativeConsequence}
          </div>
          <div className="text-xs text-slate-500">
            <span className="font-bold">Rounded:</span> L {item.roundedLikelihood} / C {item.roundedConsequence}
          </div>
        </div>
      ) : (
        <div className="text-xs text-slate-400 italic">No data</div>
      )}
    </div>
  );
}

/**
 * Facilitator-only Risk Overview radar tab.
 * Renders a Recharts radar chart comparing final Merdeka risk scores across all failure modes.
 */
export default function RiskOverviewTab({ session, liveData, lang }) {
  if (!liveData) return <div className="text-slate-500 animate-pulse text-sm">Loading...</div>;

  const data = buildRiskOverviewData(session.fmList, liveData.aggregated, lang);

  if (!data.length) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center shadow-sm">
        <div className="text-slate-400 text-sm">No failure modes to display.</div>
      </div>
    );
  }

  const chartHeight = Math.max(420, data.length * 48);

  return (
    <div className="space-y-4">
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-slate-800 text-lg">Risk Overview</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Final Merdeka risk scores (1–25) across all failure modes
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-red-500/35 border border-red-500 inline-block"></span>
              Risk Score
            </span>
          </div>
        </div>

        <div style={{ width: '100%', height: chartHeight }}>
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={data} outerRadius="72%">
              <PolarGrid stroke="#e2e8f0" />
              <PolarAngleAxis
                dataKey="fmNo"
                tick={{ fontSize: 11, fill: '#475569', fontWeight: 600 }}
              />
              <PolarRadiusAxis
                domain={[0, 25]}
                tickCount={6}
                tick={{ fontSize: 9, fill: '#94a3b8' }}
                axisLine={false}
              />
              <Tooltip content={<RiskOverviewTooltip />} />
              <Radar
                dataKey="riskScore"
                name="Risk score"
                stroke="#dc2626"
                fill="#ef4444"
                fillOpacity={0.35}
                strokeWidth={2}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Summary table below the chart */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100">
              <th className="text-left text-xs font-bold text-slate-500 uppercase tracking-wider py-2 pr-3">FM</th>
              <th className="text-left text-xs font-bold text-slate-500 uppercase tracking-wider py-2 pr-3">Title</th>
              <th className="text-center text-xs font-bold text-slate-500 uppercase tracking-wider py-2 px-2">L</th>
              <th className="text-center text-xs font-bold text-slate-500 uppercase tracking-wider py-2 px-2">C</th>
              <th className="text-center text-xs font-bold text-slate-500 uppercase tracking-wider py-2 px-2">Score</th>
              <th className="text-left text-xs font-bold text-slate-500 uppercase tracking-wider py-2 pl-2">Level</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item) => (
              <tr key={item.fmNo} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                <td className="py-2 pr-3 font-bold text-slate-700">{item.fmNo}</td>
                <td className="py-2 pr-3 text-slate-600 max-w-xs truncate">{item.title}</td>
                <td className="py-2 px-2 text-center text-slate-600">{item.hasData ? item.roundedLikelihood : '—'}</td>
                <td className="py-2 px-2 text-center text-slate-600">{item.hasData ? item.roundedConsequence : '—'}</td>
                <td className="py-2 px-2 text-center font-bold text-slate-800">{item.hasData ? item.riskScore : '—'}</td>
                <td className="py-2 pl-2 text-slate-600">{item.hasData ? item.riskLevel : <span className="text-slate-400 italic">No data</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
