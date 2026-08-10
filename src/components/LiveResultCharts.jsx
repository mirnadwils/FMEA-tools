'use client';

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { t } from '@/lib/i18n';

/**
 * Reusable charts for a single FM aggregate: Likelihood bar, Consequence bar, and 5×5 heatmap.
 * Extracted from FMEAApp ResultsTab to be shared with LiveResultDetailModal.
 */
export default function LiveResultCharts({ aggregate, lang }) {
  const { likelihoodDistribution, consequenceDistribution, combinationDistribution } = aggregate;

  const lData = likelihoodDistribution
    ? Object.keys(likelihoodDistribution).map(k => ({ name: k, count: likelihoodDistribution[k] }))
    : [];
  const cData = consequenceDistribution
    ? Object.keys(consequenceDistribution).map(k => ({ name: k, count: consequenceDistribution[k] }))
    : [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Likelihood Chart */}
      <div className="space-y-2">
        <div className="text-xs font-bold text-slate-600 uppercase tracking-wider">{t(lang, 'results.likelihood_dist')}</div>
        <div className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={lData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
              <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
              <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
              <Bar dataKey="count" fill="#0ea5e9" radius={[4, 4, 0, 0]} name={t(lang, 'results.count')} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Consequence Chart */}
      <div className="space-y-2">
        <div className="text-xs font-bold text-slate-600 uppercase tracking-wider">{t(lang, 'results.consequence_dist')}</div>
        <div className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={cData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
              <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
              <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
              <Bar dataKey="count" fill="#f43f5e" radius={[4, 4, 0, 0]} name={t(lang, 'results.count')} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Combination Heatmap */}
      <div className="space-y-2">
        <div className="text-xs font-bold text-slate-600 uppercase tracking-wider">{t(lang, 'results.combination_heatmap')}</div>
        <div className="overflow-x-auto">
          <table className="w-full text-[10px] text-center border-collapse">
            <thead>
              <tr>
                <th className="font-normal text-slate-400 pb-1">L \ C</th>
                {[1, 2, 3, 4, 5].map(c => <th key={c} className="font-normal text-slate-500 pb-1 w-6">{c}</th>)}
              </tr>
            </thead>
            <tbody>
              {[1, 2, 3, 4, 5].map(l => (
                <tr key={l}>
                  <th className="font-normal text-slate-500 pr-2 w-6">{l}</th>
                  {[1, 2, 3, 4, 5].map(c => {
                    const val = combinationDistribution?.[l]?.[c] || 0;
                    const hasVal = val > 0;
                    return (
                      <td key={c} className="p-0.5">
                        <div className={`w-full py-1 rounded-sm border ${hasVal ? 'bg-amber-100 border-amber-300 text-amber-900 font-bold' : 'bg-slate-50 border-slate-100 text-slate-300'}`}>
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
  );
}
