'use client';

import React, { useState, useEffect } from 'react';
import { CheckCircle2, Shield, Sparkles } from 'lucide-react';
import { t } from '@/lib/i18n';
import {
  LIKELIHOOD_LEVELS,
  NEGATIVE_CONSEQUENCE_LEVELS,
  POSITIVE_CONSEQUENCE_LEVELS,
  getRiskCell,
  getOpportunityCell,
  RISK_LEVEL_CONFIG,
  OPPORTUNITY_LEVEL_CONFIG,
} from '@/lib/merdeka';
import { useLang } from './AppShell';

function LevelPicker({ title, levels, value, onChange, lang }) {
  return (
    <div className="mb-4">
      <div className="text-sm font-bold text-slate-700 mb-2">{title}</div>
      <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${levels.length}, minmax(0,1fr))` }}>
        {levels.map((level) => {
          const selected = value === level.value;
          return (
            <button
              key={level.value}
              type="button"
              onClick={() => onChange(level.value)}
              className={`text-left p-2.5 rounded-xl border-2 transition-all ${
                selected
                  ? 'ring-2 shadow-md'
                  : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm'
              }`}
              style={selected ? {
                borderColor: level.color,
                backgroundColor: `${level.color}15`,
                boxShadow: `0 0 0 3px ${level.color}30`,
              } : {}}
              title={level.description[lang]}
            >
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-sm" style={selected ? { color: level.color } : { color: '#64748b' }}>
                  {level.value}
                </span>
                {selected && <CheckCircle2 size={14} style={{ color: level.color }} />}
              </div>
              <div className="text-[11px] font-bold leading-tight mt-0.5" style={selected ? { color: level.color } : { color: '#475569' }}>
                {level.label[lang]}
              </div>
            </button>
          );
        })}
      </div>
      {value && (
        <div className="text-xs text-slate-500 mt-2 italic leading-relaxed">
          {levels.find((l) => l.value === value)?.description[lang]}
        </div>
      )}
    </div>
  );
}

function ResultBadge({ label, cell, icon }) {
  if (!cell) return null;
  return (
    <div
      className="flex items-center gap-3 p-3 rounded-xl border-2"
      style={{
        backgroundColor: cell.bgColor,
        borderColor: cell.color,
        color: cell.textColor,
      }}
    >
      {icon}
      <div className="min-w-0">
        <div className="text-[10px] font-bold uppercase tracking-wider opacity-70">{label}</div>
        <div className="text-lg font-extrabold leading-tight">{cell.level}</div>
        <div className="text-xs font-bold">{t('en', 'common.loading') !== 'Loading...' ? '' : ''}Score: {cell.score}</div>
      </div>
    </div>
  );
}

export default function AssessmentForm({ fm, existingDraft, onSave, onCancel, readOnly }) {
  const { lang } = useLang();

  const [riskL, setRiskL] = useState(existingDraft?.riskLikelihood || null);
  const [negC, setNegC] = useState(existingDraft?.negativeConsequence || null);
  const [oppL, setOppL] = useState(existingDraft?.oppLikelihood || null);
  const [posC, setPosC] = useState(existingDraft?.positiveConsequence || null);
  const [saving, setSaving] = useState(false);

  const riskCell = riskL && negC ? getRiskCell(riskL, negC) : null;
  const oppCell = oppL && posC ? getOpportunityCell(oppL, posC) : null;

  async function handleSave() {
    setSaving(true);
    try {
      await onSave({
        fmNo: fm.no,
        riskLikelihood: riskL,
        negativeConsequence: negC,
        oppLikelihood: oppL,
        positiveConsequence: posC,
      });
    } catch (e) {
      console.error('Save error:', e);
    }
    setSaving(false);
  }

  const canSave = riskL && negC && oppL && posC;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div
        className="bg-white rounded-2xl max-w-3xl w-full overflow-y-auto shadow-2xl border border-slate-200"
        style={{ maxHeight: '92vh' }}
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-100 sticky top-0 bg-white/95 backdrop-blur-md rounded-t-2xl z-10">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 text-white text-xs font-bold">
              FM {fm.no}
            </span>
            {fm.category && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-teal-50 text-teal-700 text-xs font-bold border border-teal-200">
                {fm.category}
              </span>
            )}
            {readOnly && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 text-xs font-bold border border-amber-200">
                🔒 {t(lang, 'submit.locked')}
              </span>
            )}
          </div>
          <h3 className="text-lg font-bold text-slate-800 mt-2 leading-snug">{fm.title || '(Untitled)'}</h3>
        </div>

        {/* FM Context */}
        <div className="px-5 pt-4 space-y-2">
          {fm.mechanism && (
            <div className="text-sm text-slate-600">
              <span className="font-bold text-slate-700">Trigger / {lang === 'id' ? 'Mekanisme' : 'Mechanism'}: </span>
              {fm.mechanism}
            </div>
          )}
          {fm.effect && (
            <div className="text-sm text-slate-600">
              <span className="font-bold text-slate-700">{lang === 'id' ? 'Potensi Efek' : 'Potential Effect'}: </span>
              {fm.effect}
            </div>
          )}
          {fm.notes && (
            <div className="text-sm bg-amber-50 border border-amber-200 rounded-xl p-3 text-amber-800">
              <span className="font-bold">PFMA Notes: </span>{fm.notes}
            </div>
          )}
        </div>

        {/* Assessment sections */}
        <div className="p-5 space-y-6">
          {/* RISK ASSESSMENT */}
          <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Shield size={18} className="text-red-600" />
              <h4 className="font-bold text-red-800 text-sm uppercase tracking-wider">
                {t(lang, 'assessment.risk_title')}
              </h4>
            </div>

            <LevelPicker
              title={t(lang, 'assessment.risk_likelihood')}
              levels={LIKELIHOOD_LEVELS}
              value={riskL}
              onChange={readOnly ? () => {} : setRiskL}
              lang={lang}
            />

            <LevelPicker
              title={t(lang, 'assessment.negative_consequence')}
              levels={NEGATIVE_CONSEQUENCE_LEVELS}
              value={negC}
              onChange={readOnly ? () => {} : setNegC}
              lang={lang}
            />

            {riskCell && (
              <div className="mt-3 space-y-2">
                <ResultBadge
                  label={t(lang, 'assessment.risk_result')}
                  cell={riskCell}
                  icon={<Shield size={22} />}
                />
                <div className="text-xs text-slate-600 bg-white/70 rounded-lg p-2.5 border border-slate-200">
                  <span className="font-bold">{t(lang, 'assessment.response')}: </span>
                  {riskCell.response[lang]}
                </div>
              </div>
            )}
          </div>

          {/* OPPORTUNITY ASSESSMENT */}
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={18} className="text-purple-600" />
              <h4 className="font-bold text-purple-800 text-sm uppercase tracking-wider">
                {t(lang, 'assessment.opp_title')}
              </h4>
            </div>

            <LevelPicker
              title={t(lang, 'assessment.opp_likelihood')}
              levels={LIKELIHOOD_LEVELS}
              value={oppL}
              onChange={readOnly ? () => {} : setOppL}
              lang={lang}
            />

            <LevelPicker
              title={t(lang, 'assessment.positive_consequence')}
              levels={POSITIVE_CONSEQUENCE_LEVELS}
              value={posC}
              onChange={readOnly ? () => {} : setPosC}
              lang={lang}
            />

            {oppCell && (
              <div className="mt-3 space-y-2">
                <ResultBadge
                  label={t(lang, 'assessment.opp_result')}
                  cell={oppCell}
                  icon={<Sparkles size={22} />}
                />
                <div className="text-xs text-slate-600 bg-white/70 rounded-lg p-2.5 border border-slate-200">
                  <span className="font-bold">{t(lang, 'assessment.response')}: </span>
                  {oppCell.response[lang]}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        {!readOnly && (
          <div className="p-4 border-t border-slate-100 flex justify-end gap-2 sticky bottom-0 bg-white/95 backdrop-blur-md rounded-b-2xl">
            <button
              onClick={onCancel}
              className="px-4 py-2.5 rounded-xl text-slate-600 font-semibold hover:bg-slate-100 transition-all"
            >
              {t(lang, 'assessment.cancel')}
            </button>
            <button
              disabled={!canSave || saving}
              onClick={handleSave}
              className={`px-6 py-2.5 rounded-xl font-bold text-white transition-all flex items-center gap-2 ${
                canSave && !saving
                  ? 'bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 shadow-sm'
                  : 'bg-slate-300 cursor-not-allowed'
              }`}
            >
              <CheckCircle2 size={16} />
              {saving ? t(lang, 'common.saving') : t(lang, 'assessment.save_draft')}
            </button>
          </div>
        )}

        {readOnly && (
          <div className="p-4 border-t border-slate-100 flex justify-end">
            <button
              onClick={onCancel}
              className="px-5 py-2.5 rounded-xl text-slate-600 font-semibold hover:bg-slate-100 transition-all"
            >
              {t(lang, 'common.back')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
