'use client';

import React from 'react';
import { Download, BookOpen, Scale, Table2, AlertTriangle, Info } from 'lucide-react';
import { t } from '@/lib/i18n';
import {
  LIKELIHOOD_LEVELS,
  NEGATIVE_CONSEQUENCE_LEVELS,
  RISK_MATRIX,
  RISK_LEVEL_CONFIG,
} from '@/lib/merdeka';
import { EXPERIENCE_LEVELS } from '@/lib/i18n';
import { useLang } from './AppShell';

function MatrixTable({ title, icon, rows, cols, matrix, levelConfig }) {
  const { lang } = useLang();
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        {icon}
        <h4 className="font-bold text-slate-800">{title}</h4>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr>
              <th className="p-2 text-left bg-slate-50 border border-slate-200 rounded-tl-lg">
                L ↓ / C →
              </th>
              {cols.map((c) => (
                <th
                  key={c.value}
                  className="p-2 text-center border border-slate-200 font-bold"
                  style={{ backgroundColor: `${c.color}20`, color: c.color }}
                >
                  {c.value}. {c.label[lang]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.value}>
                <td
                  className="p-2 border border-slate-200 font-bold whitespace-nowrap"
                  style={{ backgroundColor: `${r.color}15`, color: r.color }}
                >
                  {r.value}. {r.label[lang]}
                </td>
                {cols.map((c) => {
                  const cell = matrix[r.value]?.[c.value];
                  if (!cell) return <td key={c.value} className="p-2 border border-slate-200">—</td>;
                  const cfg = levelConfig[cell.level];
                  return (
                    <td
                      key={c.value}
                      className="p-2 border border-slate-200 text-center font-bold"
                      style={{ backgroundColor: cfg?.bgColor, color: cfg?.textColor }}
                    >
                      <div className="text-[10px] opacity-70">{cell.score}</div>
                      <div>{cell.level}</div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ResponseTable({ title, levelConfig, lang }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <AlertTriangle size={18} className="text-amber-500" />
        <h4 className="font-bold text-slate-800">{title}</h4>
      </div>
      <div className="space-y-2">
        {Object.entries(levelConfig).map(([level, cfg]) => (
          <div
            key={level}
            className="flex items-start gap-3 p-3 rounded-xl border"
            style={{ backgroundColor: cfg.bgColor, borderColor: cfg.color }}
          >
            <div
              className="px-2.5 py-1 rounded-lg text-xs font-extrabold whitespace-nowrap"
              style={{ backgroundColor: cfg.color, color: '#fff' }}
            >
              {level}
            </div>
            <div className="text-xs leading-relaxed" style={{ color: cfg.textColor }}>
              {cfg.response[lang]}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function GuidelineTab({ sessionCode, hasDocument }) {
  const { lang } = useLang();

  return (
    <div className="space-y-5">
      {/* Download Material */}
      <div className="bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-200 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <BookOpen size={18} className="text-teal-600" />
          <h4 className="font-bold text-teal-800">{t(lang, 'guideline.download_material')}</h4>
        </div>
        {hasDocument ? (
          <a
            href={`/api/sessions/${encodeURIComponent(sessionCode)}/documents`}
            download
            className="inline-flex items-center gap-2 bg-gradient-to-r from-teal-600 to-emerald-600 text-white font-bold px-5 py-2.5 rounded-xl hover:from-teal-700 hover:to-emerald-700 transition-all shadow-sm mt-2"
          >
            <Download size={16} />
            {t(lang, 'guideline.download_material')}
          </a>
        ) : (
          <p className="text-sm text-teal-600 italic">{t(lang, 'guideline.no_material')}</p>
        )}
      </div>

      {/* Workshop Workflow — Risk-only */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <Info size={18} className="text-blue-500" />
          <h4 className="font-bold text-slate-800">{t(lang, 'guideline.workflow')}</h4>
        </div>
        <ol className="text-sm text-slate-600 space-y-2 list-decimal list-inside">
          {lang === 'id' ? (
            <>
              <li>Fasilitator membuka failure mode untuk penilaian.</li>
              <li>Peserta menilai setiap failure mode untuk <strong>Risiko</strong> (Kemungkinan × Konsekuensi Negatif).</li>
              <li>Draf tersimpan otomatis dan dapat diubah selama status masih Draf.</li>
              <li>Setelah semua failure mode yang terbuka dinilai lengkap, peserta menekan <strong>Kirim Penilaian</strong>.</li>
              <li>Penilaian yang sudah dikirim bersifat <strong>permanen</strong> dan tidak dapat diubah.</li>
              <li>Fasilitator dapat membuka kembali penilaian dengan alasan yang tercatat.</li>
            </>
          ) : (
            <>
              <li>The facilitator opens failure modes for assessment.</li>
              <li>Participants assess each failure mode for <strong>Risk</strong> (Likelihood × Negative Consequence).</li>
              <li>Drafts are auto-saved and editable while in Draft status.</li>
              <li>Once all open failure modes have complete assessments, the participant clicks <strong>Submit Assessment</strong>.</li>
              <li>Submitted assessments are <strong>immutable</strong> and cannot be modified.</li>
              <li>A facilitator can reopen an assessment with a recorded reason.</li>
            </>
          )}
        </ol>
      </div>

      {/* Experience Weighting */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <Scale size={18} className="text-indigo-500" />
          <h4 className="font-bold text-slate-800">{t(lang, 'guideline.weighting')}</h4>
        </div>
        <p className="text-sm text-slate-600 mb-3">{t(lang, 'guideline.weighting_desc')}</p>
        <div className="grid grid-cols-3 gap-2">
          {EXPERIENCE_LEVELS.map((exp) => (
            <div key={exp.key} className="bg-slate-50 rounded-xl p-3 text-center border border-slate-200">
              <div className="text-2xl font-extrabold text-slate-800">{exp.weight}</div>
              <div className="text-xs font-bold text-slate-600 mt-1">{exp.label[lang]}</div>
              <div className="text-[10px] text-slate-400">{exp.description[lang]}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Likelihood Table */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Table2 size={18} className="text-slate-600" />
          <h4 className="font-bold text-slate-800">{t(lang, 'guideline.likelihood_table')}</h4>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50">
                <th className="p-2 text-left border border-slate-200">{lang === 'id' ? 'Nilai' : 'Value'}</th>
                <th className="p-2 text-left border border-slate-200">{lang === 'id' ? 'Label' : 'Label'}</th>
                <th className="p-2 text-left border border-slate-200">{lang === 'id' ? 'Deskripsi' : 'Description'}</th>
                <th className="p-2 text-left border border-slate-200">{lang === 'id' ? 'Frekuensi' : 'Frequency'}</th>
                <th className="p-2 text-left border border-slate-200">{lang === 'id' ? 'Probabilitas' : 'Probability'}</th>
              </tr>
            </thead>
            <tbody>
              {LIKELIHOOD_LEVELS.map((l) => (
                <tr key={l.value}>
                  <td className="p-2 border border-slate-200 font-bold text-center" style={{ color: l.color }}>{l.value}</td>
                  <td className="p-2 border border-slate-200 font-bold" style={{ color: l.color }}>{l.label[lang]}</td>
                  <td className="p-2 border border-slate-200">{l.description[lang]}</td>
                  <td className="p-2 border border-slate-200">{l.frequency[lang]}</td>
                  <td className="p-2 border border-slate-200 font-mono">{l.probability}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Risk Matrix */}
      <MatrixTable
        title={t(lang, 'guideline.risk_matrix')}
        icon={<Table2 size={18} className="text-red-500" />}
        rows={LIKELIHOOD_LEVELS}
        cols={NEGATIVE_CONSEQUENCE_LEVELS}
        matrix={RISK_MATRIX}
        levelConfig={RISK_LEVEL_CONFIG}
      />

      {/* Risk Response */}
      <ResponseTable
        title={`${t(lang, 'guideline.response_table')} — ${lang === 'id' ? 'Risiko' : 'Risk'}`}
        levelConfig={RISK_LEVEL_CONFIG}
        lang={lang}
      />
    </div>
  );
}
