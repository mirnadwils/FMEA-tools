import React from 'react';
import { RadarChart, Radar, PolarAngleAxis, PolarGrid, PolarRadiusAxis, Tooltip, ResponsiveContainer } from 'recharts';
import RiskDistributionDashboard from '@/components/RiskDistributionDashboard';
import { buildReportRiskOverview } from '@/lib/report-data';

export default function RiskOverviewReportSection({ fmList, liveResults }) {
  const { overviewRows, finalDistribution, responseDistribution } = buildReportRiskOverview(fmList, liveResults);

  return (
    <div className="report-section mb-12">
      <h2 className="text-2xl font-bold mb-6">Risk Overview</h2>
      
      {/* Cards and Bar/Pie Charts */}
      <div className="mb-8 report-preserve-bg">
        <RiskDistributionDashboard 
          finalDistribution={finalDistribution} 
          responseRows={responseDistribution} 
        />
      </div>

      {/* Radar Chart */}
      <div className="mb-8 p-6 bg-white border border-gray-200 rounded-lg shadow-sm report-chart-container">
        <h3 className="font-bold text-xl mb-4">Risk Profile (Radar)</h3>
        {overviewRows.length > 0 ? (
          <div className="mx-auto w-full max-w-[600px] h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={overviewRows} outerRadius="72%">
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
                <Radar
                  dataKey="riskScore"
                  name="Risk score"
                  stroke="#dc2626"
                  fill="#ef4444"
                  fillOpacity={0.35}
                  strokeWidth={2}
                  isAnimationActive={false}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="text-gray-500 italic">No failure modes for radar chart.</div>
        )}
      </div>

      {/* Complete Stable Table */}
      <div className="w-full">
        <h3 className="font-bold text-xl mb-4">All Failure Modes</h3>
        <table className="w-full text-left border-collapse" style={{ fontSize: '0.875rem' }}>
          <thead>
            <tr className="bg-gray-100 border-b-2 border-gray-300">
              <th className="py-2 px-3 font-semibold text-gray-700 w-[10%]">FM</th>
              <th className="py-2 px-3 font-semibold text-gray-700 w-[50%]">Title</th>
              <th className="py-2 px-3 font-semibold text-gray-700 text-center w-[10%]">L</th>
              <th className="py-2 px-3 font-semibold text-gray-700 text-center w-[10%]">C</th>
              <th className="py-2 px-3 font-semibold text-gray-700 text-center w-[10%]">Score</th>
              <th className="py-2 px-3 font-semibold text-gray-700 w-[10%]">Level</th>
            </tr>
          </thead>
          <tbody>
            {overviewRows.length === 0 ? (
              <tr>
                <td colSpan="6" className="py-4 text-center text-gray-500 italic border-b border-gray-200">
                  No failure modes to display.
                </td>
              </tr>
            ) : (
              overviewRows.map((item) => (
                <tr key={item.fmNo} className="border-b border-gray-200 report-table-row">
                  <td className="py-2 px-3 font-bold text-gray-800">{item.fmNo}</td>
                  <td className="py-2 px-3 text-gray-700 max-w-xs">{item.title}</td>
                  <td className="py-2 px-3 text-center text-gray-600">{item.hasData ? item.roundedLikelihood : '—'}</td>
                  <td className="py-2 px-3 text-center text-gray-600">{item.hasData ? item.roundedConsequence : '—'}</td>
                  <td className="py-2 px-3 text-center font-bold text-gray-800">{item.hasData ? item.riskScore : '—'}</td>
                  <td className="py-2 px-3 text-gray-700">
                    {item.hasData ? item.riskLevel : <span className="text-gray-400 italic">No data</span>}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
