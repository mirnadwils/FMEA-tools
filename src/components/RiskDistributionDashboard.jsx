import React from 'react';
import { PieChart, Pie, Cell, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { RISK_LEVELS } from '@/lib/risk-distribution';

const RISK_COLORS = { Extreme: '#dc2626', High: '#eab308', Moderate: '#2563eb', Low: '#16a34a' };

const CustomPieTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white p-3 border border-slate-200 shadow-md rounded-lg text-sm">
        <div className="font-bold mb-1" style={{ color: payload[0].fill }}>{data.name} Risk</div>
        <div>{data.value} Assessed FMs</div>
        <div className="text-slate-500">{data.percentage}% of total</div>
      </div>
    );
  }
  return null;
};

const CustomBarTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white p-3 border border-slate-200 shadow-md rounded-lg text-sm">
        <div className="font-bold text-slate-800 mb-1">FM {label}</div>
        <div className="text-xs text-slate-500 mb-3">{data.title?.en || data.title?.id || '(Untitled)'}</div>
        {data.totalResponses === 0 ? (
          <div className="text-slate-500 italic">No complete responses</div>
        ) : (
          <div className="space-y-1">
            {RISK_LEVELS.map((level) => {
              if (data[level] > 0) {
                return (
                  <div key={level} className="flex justify-between items-center gap-4">
                    <span style={{ color: RISK_COLORS[level] }} className="font-medium">{level}</span>
                    <span className="font-bold">{data[level]}</span>
                  </div>
                );
              }
              return null;
            })}
            <div className="border-t border-slate-100 pt-1 mt-1 flex justify-between items-center gap-4 font-bold text-slate-700">
              <span>Total</span>
              <span>{data.totalResponses}</span>
            </div>
          </div>
        )}
      </div>
    );
  }
  return null;
};

export default function RiskDistributionDashboard({ finalDistribution, responseRows }) {
  const chartHeight = Math.max(280, responseRows.length * 36);

  return (
    <div className="space-y-6 mb-8">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {RISK_LEVELS.map((level) => (
          <div key={level} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col items-center justify-center">
            <div className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: RISK_COLORS[level] }}>{level}</div>
            <div className="text-3xl font-extrabold text-slate-800">{finalDistribution.counts[level]}</div>
            <div className="text-xs text-slate-400 mt-1">FMs</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm lg:col-span-1">
          <h3 className="font-bold text-slate-800 mb-4 text-center">Final Risk Distribution</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={finalDistribution.pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {finalDistribution.pieData.map((entry) => (
                    <Cell key={entry.name} fill={RISK_COLORS[entry.name]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomPieTooltip />} />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="text-center text-xs text-slate-400 mt-2">
            Based on {finalDistribution.total} assessed FMs
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm lg:col-span-2">
          <h3 className="font-bold text-slate-800 mb-4 text-center">Individual Responses per FM</h3>
          <div style={{ height: chartHeight }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={responseRows}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" allowDecimals={false} />
                <YAxis dataKey="fmNo" type="category" width={50} tick={{ fontSize: 12 }} />
                <Tooltip content={<CustomBarTooltip />} cursor={{ fill: '#f8fafc' }} />
                <Legend verticalAlign="top" height={36} />
                {RISK_LEVELS.map((level) => (
                  <Bar key={level} dataKey={level} stackId="responses" fill={RISK_COLORS[level]} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
