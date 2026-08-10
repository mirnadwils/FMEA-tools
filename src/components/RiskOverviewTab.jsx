'use client';

import React, { useState, useMemo } from 'react';
import { RadarChart, Radar, PolarAngleAxis, PolarGrid, PolarRadiusAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { ChevronUp, ChevronDown, Search } from 'lucide-react';
import { buildRiskOverviewData } from '@/lib/risk-overview';
import {
  DEFAULT_RISK_OVERVIEW_SORT,
  getRiskOverviewTableRows,
  toggleRiskOverviewSort,
} from '@/lib/risk-overview-table';

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

/** Sortable column header button */
function SortHeader({ label, sortKey, currentSort, onToggle, align = 'left' }) {
  const isActive = currentSort.key === sortKey;
  const ariaSortValue = isActive ? (currentSort.direction === 'asc' ? 'ascending' : 'descending') : 'none';

  return (
    <th className={`${align === 'center' ? 'text-center' : 'text-left'} text-xs font-bold text-slate-500 uppercase tracking-wider py-2 px-2`}>
      <button
        type="button"
        onClick={() => onToggle(sortKey)}
        className={`inline-flex items-center gap-0.5 hover:text-slate-700 transition-colors ${isActive ? 'text-slate-800' : ''}`}
        aria-sort={ariaSortValue}
      >
        {label}
        {isActive && (
          currentSort.direction === 'asc'
            ? <ChevronUp size={12} className="text-teal-600" />
            : <ChevronDown size={12} className="text-teal-600" />
        )}
      </button>
    </th>
  );
}

/**
 * Facilitator-only Risk Overview radar tab.
 * Renders a Recharts radar chart comparing final Merdeka risk scores across all failure modes,
 * with a filterable/sortable summary table below.
 */
export default function RiskOverviewTab({ session, liveData, lang }) {
  const [query, setQuery] = useState('');
  const [dataStatus, setDataStatus] = useState('all');
  const [riskLevel, setRiskLevel] = useState('all');
  const [sort, setSort] = useState(DEFAULT_RISK_OVERVIEW_SORT);

  if (!liveData) return <div className="text-slate-500 animate-pulse text-sm">Loading...</div>;

  const data = buildRiskOverviewData(session.fmList, liveData.aggregated, lang);

  if (!data.length) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center shadow-sm">
        <div className="text-slate-400 text-sm">No failure modes to display.</div>
      </div>
    );
  }

  // Table rows are derived from data but radar always shows all FMs
  const tableRows = getRiskOverviewTableRows(data, { query, dataStatus, riskLevel, sort });

  function handleToggleSort(key) {
    setSort((current) => toggleRiskOverviewSort(current, key));
  }

  return (
    <div className="space-y-4">
      {/* Radar Chart — width-driven, capped at 560px, never derived from FM count */}
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

        <div className="mx-auto w-full max-w-[560px] aspect-square min-h-[360px] max-h-[560px]">
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

      {/* Summary table with search, filters, and sortable headers */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm overflow-x-auto">
        {/* Control bar */}
        <div className="flex flex-col gap-3 mb-4 md:flex-row md:items-center">
          <div className="relative flex-1 max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search FM or title"
              aria-label="Search FM or title"
              className="w-full pl-8 pr-3 py-2 border border-slate-300 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-teal-400 focus:border-teal-400 outline-none transition-all"
            />
          </div>
          <select
            value={dataStatus}
            onChange={(event) => setDataStatus(event.target.value)}
            aria-label="Filter data status"
            className="px-3 py-2 border border-slate-300 rounded-xl text-sm text-slate-700 bg-white focus:ring-2 focus:ring-teal-400 outline-none transition-all"
          >
            <option value="all">All data</option>
            <option value="hasData">Has data</option>
            <option value="noData">No data</option>
          </select>
          <select
            value={riskLevel}
            onChange={(event) => setRiskLevel(event.target.value)}
            aria-label="Filter risk level"
            className="px-3 py-2 border border-slate-300 rounded-xl text-sm text-slate-700 bg-white focus:ring-2 focus:ring-teal-400 outline-none transition-all"
          >
            <option value="all">All levels</option>
            <option value="Low">Low</option>
            <option value="Moderate">Moderate</option>
            <option value="High">High</option>
            <option value="Extreme">Extreme</option>
          </select>
        </div>

        {tableRows.length === 0 ? (
          <div className="text-sm text-slate-400 italic text-center py-6">
            No failure modes match these controls.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <SortHeader label="FM" sortKey="fmNo" currentSort={sort} onToggle={handleToggleSort} />
                <SortHeader label="Title" sortKey="title" currentSort={sort} onToggle={handleToggleSort} />
                <SortHeader label="L" sortKey="roundedLikelihood" currentSort={sort} onToggle={handleToggleSort} align="center" />
                <SortHeader label="C" sortKey="roundedConsequence" currentSort={sort} onToggle={handleToggleSort} align="center" />
                <SortHeader label="Score" sortKey="riskScore" currentSort={sort} onToggle={handleToggleSort} align="center" />
                <SortHeader label="Level" sortKey="riskLevel" currentSort={sort} onToggle={handleToggleSort} />
              </tr>
            </thead>
            <tbody>
              {tableRows.map((item) => (
                <tr key={item.fmNo} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                  <td className="py-2 px-2 font-bold text-slate-700">{item.fmNo}</td>
                  <td className="py-2 px-2 text-slate-600 max-w-xs truncate">{item.title}</td>
                  <td className="py-2 px-2 text-center text-slate-600">{item.hasData ? item.roundedLikelihood : '—'}</td>
                  <td className="py-2 px-2 text-center text-slate-600">{item.hasData ? item.roundedConsequence : '—'}</td>
                  <td className="py-2 px-2 text-center font-bold text-slate-800">{item.hasData ? item.riskScore : '—'}</td>
                  <td className="py-2 px-2 text-slate-600">{item.hasData ? item.riskLevel : <span className="text-slate-400 italic">No data</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
