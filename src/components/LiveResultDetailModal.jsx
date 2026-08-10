'use client';

import React, { useEffect, useRef } from 'react';
import { X, Shield } from 'lucide-react';
import { t } from '@/lib/i18n';
import { resolveLocalizedValue } from '@/lib/failure-mode-context';
import FailureModeContext from './FailureModeContext';
import LiveResultCharts from './LiveResultCharts';

/**
 * Accessible facilitator-only detail panel for one FM aggregate.
 * Shows FM context fields, risk summary, and distribution charts.
 */
export default function LiveResultDetailModal({ fm, aggregate, lang, onClose }) {
  const dialogRef = useRef(null);

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKeyDown);
    dialogRef.current?.focus();
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const category = resolveLocalizedValue(fm.category, lang);
  const title = resolveLocalizedValue(fm.title, lang) || '(Untitled)';

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={`FM ${fm.no} — ${title}`}
        tabIndex={-1}
        className="bg-white rounded-2xl max-w-4xl w-full overflow-y-auto shadow-2xl border border-slate-200 outline-none"
        style={{ maxHeight: '92vh' }}
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-100 sticky top-0 bg-white/95 backdrop-blur-md rounded-t-2xl z-10">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 text-white text-xs font-bold">
                  FM {fm.no}
                </span>
                {category && (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-teal-50 text-teal-700 text-xs font-bold border border-teal-200">
                    {category}
                  </span>
                )}
              </div>
              <h3 className="text-lg font-bold text-slate-800 mt-2 leading-snug">{title}</h3>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all shrink-0"
              aria-label="Close"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* FM Context */}
        <div className="px-5 pt-4">
          <FailureModeContext fm={fm} lang={lang} />
        </div>

        {/* Risk Summary */}
        <section aria-label="Risk summary" className="px-5 pt-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
              <div className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">{t(lang, 'results.weighted_avg')}</div>
              <div className="text-sm font-bold text-slate-700 mt-1">
                L: {aggregate.avgRiskLikelihood != null ? aggregate.avgRiskLikelihood : '—'}
                <span className="opacity-50 mx-1">|</span>
                C: {aggregate.avgNegativeConsequence != null ? aggregate.avgNegativeConsequence : '—'}
              </div>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
              <div className="text-[10px] font-bold uppercase text-slate-500 tracking-wider flex items-center gap-1">
                <Shield size={10} /> {t(lang, 'results.rounded')}
              </div>
              <div className="text-sm font-bold text-slate-700 mt-1">
                L: {aggregate.roundedLikelihood ?? '—'}
                <span className="opacity-50 mx-1">|</span>
                C: {aggregate.roundedConsequence ?? '—'}
              </div>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
              <div className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">Score</div>
              <div className="text-lg font-extrabold text-slate-800 mt-0.5">{aggregate.riskScore || '—'}</div>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
              <div className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">Risk Level</div>
              <div className="text-sm font-bold text-slate-700 mt-1">{aggregate.riskLevel || '—'}</div>
            </div>
          </div>
        </section>

        {/* Charts */}
        <div className="px-5 py-5">
          {aggregate.count > 0 ? (
            <div className="pt-4 border-t border-slate-100">
              <LiveResultCharts aggregate={aggregate} lang={lang} />
            </div>
          ) : (
            <p className="text-sm text-slate-400 italic">{t(lang, 'results.no_data')}</p>
          )}
        </div>

        {/* Close footer */}
        <div className="p-4 border-t border-slate-100 flex justify-end sticky bottom-0 bg-white/95 backdrop-blur-md rounded-b-2xl">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-slate-600 font-semibold hover:bg-slate-100 transition-all"
          >
            {t(lang, 'common.back')}
          </button>
        </div>
      </div>
    </div>
  );
}
