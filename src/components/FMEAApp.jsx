'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useUser } from '@clerk/nextjs';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from 'recharts';
import * as XLSX from 'xlsx';
import {
  Lock, Unlock, Upload, Download, Users, BarChart3, ArrowLeft, CheckCircle2,
  Copy, RefreshCw, ClipboardList, Settings, AlertTriangle, Trophy,
  FileSpreadsheet, ChevronRight, HardHat, Shield, Sparkles,
  BookOpen, Send, RotateCcw, Eye, LogIn
} from 'lucide-react';
import * as api from '@/lib/api';
import { t, PROFESSIONAL_ROLES, EXPERIENCE_LEVELS, EXPERIENCE_WEIGHT } from '@/lib/i18n';
import {
  LIKELIHOOD_LEVELS, NEGATIVE_CONSEQUENCE_LEVELS, POSITIVE_CONSEQUENCE_LEVELS,
  getRiskCell, getOpportunityCell, RISK_LEVEL_CONFIG, OPPORTUNITY_LEVEL_CONFIG,
} from '@/lib/merdeka';
import AppShell, { LangProvider, useLang } from './AppShell';
import ProfileSetup from './ProfileSetup';
import AssessmentForm from './AssessmentForm';
import GuidelineTab from './GuidelineTab';

/* =========================================================================
   FMEA WORKSHOP TOOL v2 — PT Solusi Geotek Optima
   Clerk-authenticated, Merdeka Risk & Opportunity Matrix
   ========================================================================= */

// ---------------------------------------------------------------------------
// UTILITY
// ---------------------------------------------------------------------------

function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let s = '';
  for (let i = 0; i < 6; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

function slug(str) {
  return String(str || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function findVal(row, keywords) {
  const keys = Object.keys(row);
  const key = keys.find((k) => keywords.every((kw) => k.toLowerCase().includes(kw)));
  return key !== undefined ? String(row[key] ?? '').trim() : '';
}

function mapRowToFM(row, idx) {
  const no = findVal(row, ['fm', 'no']) || String(idx + 1);
  return {
    no, category: findVal(row, ['category']), title: findVal(row, ['potential', 'failure']),
    mechanism: findVal(row, ['trigger']) || findVal(row, ['mechanism']),
    initiation: findVal(row, ['initiation']), continuation: findVal(row, ['continuation']),
    progression: findVal(row, ['progression']),
    detectionMonitoring: findVal(row, ['detection', 'monitoring']),
    intervention: findVal(row, ['intervention']) || findVal(row, ['controls']),
    effect: findVal(row, ['effect']), notes: findVal(row, ['notes']),
    ownerAction: findVal(row, ['owner']),
  };
}

function weightedAvg(assessments, riskField, expField) {
  if (!assessments || !assessments.length) return null;
  let sumWV = 0, sumW = 0;
  for (const a of assessments) {
    const w = EXPERIENCE_WEIGHT[a.experience] || 1;
    const val = a[riskField];
    if (val != null) { sumWV += val * w; sumW += w; }
  }
  return sumW ? sumWV / sumW : null;
}

function roundRating(avg, max) {
  if (avg == null || isNaN(avg)) return null;
  return Math.min(max, Math.max(1, Math.round(avg)));
}

// ---------------------------------------------------------------------------
// SMALL COMPONENTS
// ---------------------------------------------------------------------------

function Badge({ color = '#64748b', bgColor = '#f1f5f9', children }) {
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold border"
      style={{ color, backgroundColor: bgColor, borderColor: `${color}40` }}
    >
      {children}
    </span>
  );
}

function StatCard({ icon, label, value, sub }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-start gap-3 shadow-sm">
      <div className="p-2 rounded-lg bg-gradient-to-br from-slate-100 to-slate-50 text-slate-600">{icon}</div>
      <div>
        <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">{label}</div>
        <div className="text-2xl font-extrabold text-slate-800">{value}</div>
        {sub && <div className="text-xs text-slate-400 mt-0.5">{sub}</div>}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// LANDING PAGE
// ---------------------------------------------------------------------------

function Landing({ onPickFacilitator, onPickParticipant, user }) {
  const { lang } = useLang();
  return (
    <div className="min-h-[80vh] flex items-center justify-center p-6">
      <div className="max-w-3xl w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 text-teal-700 font-bold text-sm tracking-wide uppercase mb-2">
            <HardHat size={18} /> SGO Geotechnical Workshop Tools
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-800 leading-tight">
            {t(lang, 'landing.title')}
          </h1>
          <p className="text-slate-500 mt-2 max-w-lg mx-auto">{t(lang, 'landing.subtitle')}</p>
          {user && (
            <div className="text-sm text-slate-400 mt-3">
              {lang === 'id' ? 'Masuk sebagai' : 'Signed in as'} <span className="font-bold text-slate-600">{user.fullName || user.primaryEmailAddress?.emailAddress}</span>
            </div>
          )}
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <button
            onClick={onPickFacilitator}
            className="text-left bg-white border-2 border-slate-200 hover:border-teal-400 rounded-2xl p-6 transition-all group shadow-sm hover:shadow-md"
          >
            <div className="p-3 bg-gradient-to-br from-slate-800 to-slate-700 text-white rounded-xl inline-flex mb-3 shadow-sm">
              <Settings size={22} />
            </div>
            <div className="font-bold text-lg text-slate-800">{t(lang, 'landing.facilitator')}</div>
            <div className="text-sm text-slate-500 mt-1">{t(lang, 'landing.facilitator_desc')}</div>
            <div className="text-teal-600 font-bold text-sm mt-3 flex items-center gap-1 group-hover:gap-2 transition-all">
              {t(lang, 'landing.start')} <ChevronRight size={16} />
            </div>
          </button>
          <button
            onClick={onPickParticipant}
            className="text-left bg-white border-2 border-slate-200 hover:border-teal-400 rounded-2xl p-6 transition-all group shadow-sm hover:shadow-md"
          >
            <div className="p-3 bg-gradient-to-br from-teal-600 to-emerald-500 text-white rounded-xl inline-flex mb-3 shadow-sm">
              <Users size={22} />
            </div>
            <div className="font-bold text-lg text-slate-800">{t(lang, 'landing.participant')}</div>
            <div className="text-sm text-slate-500 mt-1">{t(lang, 'landing.participant_desc')}</div>
            <div className="text-teal-600 font-bold text-sm mt-3 flex items-center gap-1 group-hover:gap-2 transition-all">
              {t(lang, 'landing.join')} <ChevronRight size={16} />
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// FACILITATOR SETUP
// ---------------------------------------------------------------------------

function FacilitatorSetup({ onBack, onSessionReady }) {
  const { lang } = useLang();
  const [name, setName] = useState('');
  const [existingCode, setExistingCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  async function createSession() {
    if (!name.trim()) { setErr(lang === 'id' ? 'Nama sesi wajib diisi.' : 'Session name is required.'); return; }
    setBusy(true); setErr('');
    try {
      const code = generateCode();
      await api.createSession(name.trim(), '', code);
      const data = await api.getFullSession(code);
      onSessionReady(data.session);
    } catch (e) {
      setErr(e.message || 'Failed');
    }
    setBusy(false);
  }

  async function loadSession() {
    const code = existingCode.trim().toUpperCase();
    if (!code) return;
    setBusy(true); setErr('');
    try {
      const data = await api.getFullSession(code);
      onSessionReady(data.session);
    } catch (e) {
      setErr(lang === 'id' ? 'Kode sesi tidak ditemukan.' : 'Session code not found.');
    }
    setBusy(false);
  }

  return (
    <div className="max-w-lg mx-auto p-6">
      <button onClick={onBack} className="text-slate-500 flex items-center gap-1 text-sm mb-4 hover:text-slate-700">
        <ArrowLeft size={16} /> {t(lang, 'common.back')}
      </button>
      <h2 className="text-xl font-bold text-slate-800 mb-4">{t(lang, 'session.create')}</h2>
      <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3 shadow-sm">
        <div>
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t(lang, 'session.name')}</label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder={t(lang, 'session.name_placeholder')}
            className="w-full mt-1 px-3 py-2.5 border border-slate-300 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-teal-400" />
        </div>
        {err && <div className="text-sm text-red-600 flex items-center gap-1"><AlertTriangle size={14} /> {err}</div>}
        <button disabled={busy} onClick={createSession}
          className="w-full bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-bold py-2.5 rounded-xl shadow-sm transition-all">
          {busy ? t(lang, 'common.creating') : t(lang, 'session.create_btn')}
        </button>
      </div>

      <div className="text-center text-xs text-slate-400 my-4">{t(lang, 'session.or')}</div>

      <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3 shadow-sm">
        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t(lang, 'session.resume')}</label>
        <input value={existingCode} onChange={(e) => setExistingCode(e.target.value.toUpperCase())} placeholder={t(lang, 'session.code_placeholder')} maxLength={6}
          className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-lg tracking-widest font-mono text-center text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-teal-400" />
        <button disabled={busy} onClick={loadSession}
          className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-2.5 rounded-xl shadow-sm transition-all">
          {t(lang, 'session.resume_btn')}
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// IMPORT TAB
// ---------------------------------------------------------------------------

function ImportTab({ session, onUpdateSession }) {
  const { lang } = useLang();
  const [preview, setPreview] = useState(null);
  const [fileErr, setFileErr] = useState('');
  const [busy, setBusy] = useState(false);
  const fileRef = useRef(null);

  function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    setFileErr('');
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target.result);
        const wb = XLSX.read(data, { type: 'array' });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
        const parsed = rows.map(mapRowToFM).filter((fm) => fm.title || fm.category);
        if (!parsed.length) { setFileErr(lang === 'id' ? 'Tidak ada baris valid.' : 'No valid rows found.'); return; }
        setPreview(parsed);
      } catch {
        setFileErr(lang === 'id' ? 'Gagal membaca file.' : 'Failed to read file.');
      }
    };
    reader.readAsArrayBuffer(file);
  }

  async function confirmImport() {
    setBusy(true);
    try {
      await api.importFMs(session.code, preview);
      const data = await api.getFullSession(session.code);
      onUpdateSession(data.session);
      setPreview(null);
      if (fileRef.current) fileRef.current.value = '';
    } catch (e) {
      setFileErr('Import failed: ' + e.message);
    }
    setBusy(false);
  }

  return (
    <div className="space-y-4">
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center gap-2 font-bold text-slate-800 mb-1"><FileSpreadsheet size={18} /> {t(lang, 'import.title')}</div>
        <p className="text-sm text-slate-500 mb-3">{t(lang, 'import.columns_desc')}</p>
        <input ref={fileRef} type="file" accept=".xlsx,.xls" onChange={handleFile}
          className="block w-full text-sm text-slate-600 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-teal-50 file:text-teal-700 file:font-bold hover:file:bg-teal-100 file:transition-all" />
        {fileErr && <div className="text-sm text-red-600 mt-2 flex items-center gap-1"><AlertTriangle size={14} /> {fileErr}</div>}
      </div>

      {preview && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="font-bold text-slate-800 mb-2">{t(lang, 'import.preview')} — {preview.length} failure mode</div>
          <div className="max-h-80 overflow-y-auto border border-slate-100 rounded-xl">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 sticky top-0"><tr>
                <th className="p-2 text-left">No</th><th className="p-2 text-left">Category</th><th className="p-2 text-left">Potential Failure Mode</th>
              </tr></thead>
              <tbody>
                {preview.map((fm, i) => (
                  <tr key={i} className="border-t border-slate-100">
                    <td className="p-2">{fm.no}</td><td className="p-2">{fm.category}</td><td className="p-2">{fm.title}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex justify-end gap-2 mt-3">
            <button onClick={() => setPreview(null)} className="px-4 py-2 text-slate-500 font-medium">{t(lang, 'assessment.cancel')}</button>
            <button disabled={busy} onClick={confirmImport}
              className="px-5 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 text-white font-bold rounded-xl shadow-sm">
              {busy ? '...' : `${t(lang, 'import.confirm')} (${preview.length})`}
            </button>
          </div>
        </div>
      )}

      {!preview && session.fmList.length > 0 && (
        <div className="text-sm text-slate-500">{t(lang, 'import.existing').replace('{n}', session.fmList.length)} (<b>{session.fmList.length}</b> FM)</div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// CONTROL TAB
// ---------------------------------------------------------------------------

function ControlTab({ session, onUpdateSession }) {
  const { lang } = useLang();

  async function setStatus(fmNo, status) {
    try {
      await api.updateFMStatus(session.code, fmNo, status);
      const fmStatus = { ...session.fmStatus, [fmNo]: status };
      onUpdateSession({ ...session, fmStatus });
    } catch (e) { console.error(e); }
  }

  async function bulkSet(status) {
    try {
      const items = session.fmList.map((fm) => ({ fmNo: fm.no, status }));
      await api.bulkUpdateFMStatus(session.code, items);
      const fmStatus = {};
      session.fmList.forEach((fm) => (fmStatus[fm.no] = status));
      onUpdateSession({ ...session, fmStatus });
    } catch (e) { console.error(e); }
  }

  if (!session.fmList.length) {
    return <div className="text-slate-500 text-sm italic">{t(lang, 'fm.no_fm')}</div>;
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2 mb-2">
        <button onClick={() => bulkSet('open')} className="flex items-center gap-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm font-bold rounded-xl shadow-sm"><Unlock size={14} /> {t(lang, 'control.open_all')}</button>
        <button onClick={() => bulkSet('locked')} className="flex items-center gap-1 px-3 py-1.5 bg-slate-600 hover:bg-slate-700 text-white text-sm font-bold rounded-xl shadow-sm"><Lock size={14} /> {t(lang, 'control.lock_all')}</button>
      </div>
      <div className="bg-white border border-slate-200 rounded-2xl divide-y divide-slate-100 shadow-sm">
        {session.fmList.map((fm) => {
          const status = session.fmStatus[fm.no] || 'locked';
          return (
            <div key={fm.no} className="flex items-center justify-between p-3 gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge color="#1e293b" bgColor="#f1f5f9">FM {fm.no}</Badge>
                  {fm.category && <Badge color="#0d9488" bgColor="#f0fdfa">{fm.category}</Badge>}
                  {status === 'open' && <Badge color="#16a34a" bgColor="#dcfce7">{t(lang, 'fm.open')}</Badge>}
                  {status === 'closed' && <Badge color="#dc2626" bgColor="#fee2e2">{t(lang, 'fm.closed')}</Badge>}
                  {status === 'locked' && <Badge color="#ca8a04" bgColor="#fef9c3">{t(lang, 'fm.locked')}</Badge>}
                </div>
                <div className="text-sm text-slate-700 truncate mt-1">{fm.title}</div>
              </div>
              <div className="flex gap-1.5 shrink-0">
                <button onClick={() => setStatus(fm.no, 'open')} title="Open"
                  className={`p-2 rounded-xl transition-all ${status === 'open' ? 'bg-green-600 text-white shadow-sm' : 'bg-slate-100 text-slate-500 hover:bg-green-100'}`}><Unlock size={15} /></button>
                <button onClick={() => setStatus(fm.no, 'locked')} title="Lock"
                  className={`p-2 rounded-xl transition-all ${status === 'locked' ? 'bg-yellow-500 text-white shadow-sm' : 'bg-slate-100 text-slate-500 hover:bg-yellow-100'}`}><Lock size={15} /></button>
                <button onClick={() => setStatus(fm.no, 'closed')} title="Close"
                  className={`px-2.5 rounded-xl text-xs font-bold transition-all ${status === 'closed' ? 'bg-red-600 text-white shadow-sm' : 'bg-slate-100 text-slate-500 hover:bg-red-100'}`}>Final</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// UPLOAD TAB
// ---------------------------------------------------------------------------

function UploadTab({ session }) {
  const { lang } = useLang();
  const [busy, setBusy] = useState(false);
  const [docInfo, setDocInfo] = useState(null);
  const [err, setErr] = useState('');
  const fileRef = useRef(null);

  useEffect(() => {
    api.getDocumentInfo(session.code).then(setDocInfo).catch(() => {});
  }, [session.code]);

  async function handleUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    setBusy(true); setErr('');
    try {
      await api.uploadDocument(session.code, file, file.name.replace('.pdf', ''));
      const info = await api.getDocumentInfo(session.code);
      setDocInfo(info);
    } catch (e) {
      setErr(e.message);
    }
    setBusy(false);
    if (fileRef.current) fileRef.current.value = '';
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
      <div className="flex items-center gap-2 font-bold text-slate-800 mb-3"><Upload size={18} /> {t(lang, 'upload.title')}</div>
      {docInfo && (
        <div className="bg-teal-50 border border-teal-200 rounded-xl p-3 mb-3 text-sm text-teal-800">
          <b>{docInfo.title}</b> (v{docInfo.version}) — {Math.round((docInfo.fileSize || 0) / 1024)} KB
          <br />
          <a href={api.getDocumentDownloadUrl(session.code)} download className="text-teal-600 underline font-bold">{t(lang, 'guideline.download_material')}</a>
        </div>
      )}
      <input ref={fileRef} type="file" accept=".pdf" onChange={handleUpload}
        className="block w-full text-sm text-slate-600 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-teal-50 file:text-teal-700 file:font-bold hover:file:bg-teal-100" />
      {busy && <div className="text-sm text-slate-500 mt-2">{t(lang, 'common.saving')}</div>}
      {err && <div className="text-sm text-red-600 mt-2">{err}</div>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// RESULTS TAB (shared between facilitator and participant)
// ---------------------------------------------------------------------------

function ResultsTab({ session, members, lang }) {
  const sorted = [...session.fmList].map((fm) => {
    const assessments = (members || []).map((m) => {
      const d = m.drafts?.[fm.no];
      if (!d || !d.riskLikelihood) return null;
      return { ...d, experience: m.experience_level || m.experienceLevel || 'beginner' };
    }).filter(Boolean);
    const n = assessments.length;
    const avgRL = weightedAvg(assessments, 'riskLikelihood', 'experience');
    const avgNC = weightedAvg(assessments, 'negativeConsequence', 'experience');
    const rRL = roundRating(avgRL, 5);
    const rNC = roundRating(avgNC, 5);
    const riskCell = rRL && rNC ? getRiskCell(rRL, rNC) : null;

    const avgOL = weightedAvg(assessments, 'oppLikelihood', 'experience');
    const avgPC = weightedAvg(assessments, 'positiveConsequence', 'experience');
    const rOL = roundRating(avgOL, 5);
    const rPC = roundRating(avgPC, 5);
    const oppCell = rOL && rPC ? getOpportunityCell(rOL, rPC) : null;

    return { fm, n, riskCell, oppCell, riskScore: riskCell?.score || 0 };
  }).sort((a, b) => b.riskScore - a.riskScore);

  const top = sorted.find((x) => x.riskScore > 0);
  const totalAssessments = (members || []).reduce((a, m) => a + Object.keys(m.drafts || {}).length, 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={<Users size={18} />} label={t(lang, 'results.participants')} value={(members || []).length} />
        <StatCard icon={<ClipboardList size={18} />} label={t(lang, 'results.total_fm')} value={session.fmList.length} />
        <StatCard icon={<CheckCircle2 size={18} />} label={t(lang, 'results.assessments')} value={totalAssessments} />
        <StatCard icon={<Trophy size={18} />} label={t(lang, 'results.highest_risk')} value={top ? top.riskScore : '-'} sub={top ? `FM ${top.fm.no}` : ''} />
      </div>

      <div className="space-y-3">
        {sorted.map(({ fm, n, riskCell, oppCell }) => (
          <div key={fm.no} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge color="#1e293b" bgColor="#f1f5f9">FM {fm.no}</Badge>
                  {fm.category && <Badge color="#0d9488" bgColor="#f0fdfa">{fm.category}</Badge>}
                  <span className="text-xs text-slate-400">{n} {t(lang, 'results.responses')}</span>
                </div>
                <div className="font-bold text-slate-800 mt-1">{fm.title || '(Untitled)'}</div>
              </div>
              <div className="flex gap-2 shrink-0">
                {riskCell && (
                  <div className="text-center px-3 py-1.5 rounded-xl" style={{ backgroundColor: riskCell.bgColor, color: riskCell.textColor }}>
                    <div className="text-[10px] font-bold uppercase flex items-center gap-1"><Shield size={10} /> Risk</div>
                    <div className="text-lg font-extrabold leading-tight">{riskCell.score}</div>
                    <div className="text-[10px] font-bold">{riskCell.level}</div>
                  </div>
                )}
                {oppCell && (
                  <div className="text-center px-3 py-1.5 rounded-xl" style={{ backgroundColor: oppCell.bgColor, color: oppCell.textColor }}>
                    <div className="text-[10px] font-bold uppercase flex items-center gap-1"><Sparkles size={10} /> Opp</div>
                    <div className="text-lg font-extrabold leading-tight">{oppCell.score}</div>
                    <div className="text-[10px] font-bold">{oppCell.level}</div>
                  </div>
                )}
              </div>
            </div>
            {n === 0 && <div className="text-sm text-slate-400 italic mt-2">{t(lang, 'results.no_data')}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// EXPORT TAB
// ---------------------------------------------------------------------------

function ExportTab({ session, members }) {
  const { lang } = useLang();

  function exportExcel() {
    const rows = session.fmList.map((fm) => {
      const assessments = (members || []).map((m) => {
        const d = m.drafts?.[fm.no];
        if (!d) return null;
        return { ...d, experience: m.experience_level || 'beginner' };
      }).filter(Boolean);
      const avgRL = weightedAvg(assessments, 'riskLikelihood'); const rRL = roundRating(avgRL, 5);
      const avgNC = weightedAvg(assessments, 'negativeConsequence'); const rNC = roundRating(avgNC, 5);
      const riskCell = rRL && rNC ? getRiskCell(rRL, rNC) : null;
      const avgOL = weightedAvg(assessments, 'oppLikelihood'); const rOL = roundRating(avgOL, 5);
      const avgPC = weightedAvg(assessments, 'positiveConsequence'); const rPC = roundRating(avgPC, 5);
      const oppCell = rOL && rPC ? getOpportunityCell(rOL, rPC) : null;

      return {
        'FM No.': fm.no, 'Category': fm.category, 'Potential Failure Mode': fm.title,
        'Risk Likelihood': rRL || '', 'Neg. Consequence': rNC || '',
        'Risk Score': riskCell?.score || '', 'Risk Level': riskCell?.level || '',
        'Opp Likelihood': rOL || '', 'Pos. Consequence': rPC || '',
        'Opp Score': oppCell?.score || '', 'Opp Level': oppCell?.level || '',
        'Respondents': assessments.length,
      };
    });

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), 'FMEA Summary');
    XLSX.writeFile(wb, `FMEA_${slug(session.name)}_${session.code}.xlsx`);
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center shadow-sm">
      <FileSpreadsheet size={40} className="mx-auto text-teal-600 mb-3" />
      <div className="font-bold text-slate-800 text-lg">{t(lang, 'export.title')}</div>
      <button onClick={exportExcel} className="mt-4 inline-flex items-center gap-2 bg-gradient-to-r from-teal-600 to-emerald-600 text-white font-bold px-6 py-3 rounded-xl shadow-sm hover:from-teal-700 hover:to-emerald-700 transition-all">
        <Download size={18} /> {t(lang, 'export.download')}
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// FACILITATOR DASHBOARD
// ---------------------------------------------------------------------------

function FacilitatorDashboard({ session, onUpdateSession, onExit }) {
  const { lang } = useLang();
  const [tab, setTab] = useState('import');
  const [members, setMembers] = useState([]);
  const [copied, setCopied] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const data = await api.getFullSession(session.code);
      onUpdateSession(data.session);
      try {
        const memberData = await api.getMembership(session.code);
        if (memberData.members) {
          setMembers(memberData.members.map((m) => ({ ...m, drafts: {} })));
        }
      } catch { /* membership may not exist yet */ }
    } catch (e) { console.error(e); }
  }, [session.code]); // eslint-disable-line

  useEffect(() => {
    refresh();
    const t = setInterval(refresh, 6000);
    return () => clearInterval(t);
  }, [refresh]);

  function copyCode() {
    navigator.clipboard?.writeText(session.code).catch(() => {});
    setCopied(true); setTimeout(() => setCopied(false), 1500);
  }

  const tabs = [
    { id: 'import', label: t(lang, 'tab.import'), icon: <Upload size={15} /> },
    { id: 'upload', label: 'PDF', icon: <BookOpen size={15} /> },
    { id: 'control', label: t(lang, 'tab.control'), icon: <Lock size={15} /> },
    { id: 'results', label: t(lang, 'tab.results'), icon: <BarChart3 size={15} /> },
    { id: 'export', label: t(lang, 'tab.export'), icon: <Download size={15} /> },
  ];

  return (
    <div className="max-w-5xl mx-auto p-5">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-5">
        <div>
          <button onClick={onExit} className="text-slate-400 flex items-center gap-1 text-xs mb-1 hover:text-slate-600"><ArrowLeft size={13} /> {t(lang, 'session.exit')}</button>
          <h2 className="text-xl font-bold text-slate-800">{session.name}</h2>
        </div>
        <button onClick={copyCode} className="flex items-center gap-2 bg-slate-800 text-white px-4 py-2.5 rounded-xl font-mono text-lg tracking-widest shadow-sm hover:bg-slate-900 transition-all">
          {session.code} {copied ? <CheckCircle2 size={18} className="text-green-400" /> : <Copy size={16} />}
        </button>
      </div>

      <div className="flex gap-1 mb-4 bg-slate-100 p-1 rounded-xl w-fit flex-wrap">
        {tabs.map((tb) => (
          <button key={tb.id} onClick={() => setTab(tb.id)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-bold transition-all ${tab === tb.id ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}>
            {tb.icon} {tb.label}
          </button>
        ))}
        <button onClick={refresh} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm text-slate-400 hover:text-slate-600"><RefreshCw size={14} /></button>
      </div>

      {tab === 'import' && <ImportTab session={session} onUpdateSession={onUpdateSession} />}
      {tab === 'upload' && <UploadTab session={session} />}
      {tab === 'control' && <ControlTab session={session} onUpdateSession={onUpdateSession} />}
      {tab === 'results' && <ResultsTab session={session} members={members} lang={lang} />}
      {tab === 'export' && <ExportTab session={session} members={members} />}
    </div>
  );
}

// ---------------------------------------------------------------------------
// PARTICIPANT JOIN
// ---------------------------------------------------------------------------

function ParticipantJoin({ onBack, onJoined }) {
  const { lang } = useLang();
  const [code, setCode] = useState('');
  const [roleKey, setRoleKey] = useState('');
  const [experience, setExperience] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  async function join() {
    const c = code.trim().toUpperCase();
    if (!c) { setErr(lang === 'id' ? 'Masukkan kode sesi.' : 'Enter session code.'); return; }
    if (!roleKey) { setErr(lang === 'id' ? 'Pilih role Anda.' : 'Select your role.'); return; }
    if (!experience) { setErr(lang === 'id' ? 'Pilih level pengalaman.' : 'Select experience level.'); return; }
    setBusy(true); setErr('');
    try {
      const sessionData = await api.getFullSession(c);
      await api.joinMembership(c, { professionalRoleKey: roleKey, experienceLevel: experience });
      onJoined({ session: sessionData.session });
    } catch (e) {
      setErr(lang === 'id' ? 'Kode sesi tidak ditemukan.' : 'Session code not found.');
    }
    setBusy(false);
  }

  return (
    <div className="max-w-md mx-auto p-6">
      <button onClick={onBack} className="text-slate-500 flex items-center gap-1 text-sm mb-4 hover:text-slate-700"><ArrowLeft size={16} /> {t(lang, 'common.back')}</button>
      <h2 className="text-xl font-bold text-slate-800 mb-4">{t(lang, 'session.join')}</h2>
      <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-sm">
        <div>
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t(lang, 'session.code')}</label>
          <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} maxLength={6} placeholder={t(lang, 'session.code_placeholder')}
            className="w-full mt-1 px-3 py-2.5 border border-slate-300 rounded-xl text-lg tracking-widest font-mono text-center text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-teal-400" />
        </div>
        <div>
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t(lang, 'profile.role')}</label>
          <select value={roleKey} onChange={(e) => setRoleKey(e.target.value)}
            className="w-full mt-1 px-3 py-2.5 border border-slate-300 rounded-xl text-sm bg-white text-slate-900 focus:ring-2 focus:ring-teal-400">
            <option value="">{lang === 'id' ? '-- Pilih Role --' : '-- Select Role --'}</option>
            {PROFESSIONAL_ROLES.map((r) => <option key={r.key} value={r.key}>{r.label[lang]}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t(lang, 'profile.experience')}</label>
          <select value={experience} onChange={(e) => setExperience(e.target.value)}
            className="w-full mt-1 px-3 py-2.5 border border-slate-300 rounded-xl text-sm bg-white text-slate-900 focus:ring-2 focus:ring-teal-400">
            <option value="">{lang === 'id' ? '-- Pilih Pengalaman --' : '-- Select Experience --'}</option>
            {EXPERIENCE_LEVELS.map((exp) => <option key={exp.key} value={exp.key}>{exp.label[lang]} — {exp.description[lang]}</option>)}
          </select>
        </div>
        {err && <div className="text-sm text-red-600 flex items-center gap-1"><AlertTriangle size={14} /> {err}</div>}
        <button disabled={busy} onClick={join}
          className="w-full bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-bold py-2.5 rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all">
          <Users size={17} /> {busy ? t(lang, 'common.connecting') : t(lang, 'session.join_btn')}
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// PARTICIPANT MAIN WORKSPACE
// ---------------------------------------------------------------------------

function ParticipantMain({ initialSession, onExit }) {
  const { lang } = useLang();
  const [session, setSession] = useState(initialSession);
  const [myDrafts, setMyDrafts] = useState({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [votingFM, setVotingFM] = useState(null);
  const [tab, setTab] = useState('list');
  const [members, setMembers] = useState([]);
  const [hasDocument, setHasDocument] = useState(false);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const data = await api.getFullSession(session.code);
      setSession(data.session);
      try {
        const draftData = await api.getAssessmentDrafts(session.code);
        setMyDrafts(draftData.drafts || {});
      } catch { /* first time */ }
      try {
        const subData = await api.getSubmissionStatus(session.code);
        setIsSubmitted(subData.isSubmitted);
      } catch {}
      try {
        await api.getDocumentInfo(session.code);
        setHasDocument(true);
      } catch { setHasDocument(false); }
      try {
        await api.getMembership(session.code);
        setMembers([]);
      } catch {}
    } catch (e) { console.error(e); }
  }, [session.code]);

  useEffect(() => {
    refresh();
    const t = setInterval(refresh, 6000);
    return () => clearInterval(t);
  }, [refresh]);

  async function handleSaveDraft(draft) {
    await api.saveAssessmentDraft(session.code, draft);
    setMyDrafts((prev) => ({ ...prev, [draft.fmNo]: draft }));
    setVotingFM(null);
  }

  async function handleSubmit() {
    setSubmitting(true);
    try {
      await api.submitAssessment(session.code);
      setIsSubmitted(true);
      setShowSubmitConfirm(false);
    } catch (e) {
      alert(e.message);
    }
    setSubmitting(false);
  }

  const openFms = session.fmList.filter((fm) => (session.fmStatus[fm.no] || 'locked') === 'open');
  const allComplete = openFms.every((fm) => {
    const d = myDrafts[fm.no];
    return d && d.riskLikelihood && d.negativeConsequence && d.oppLikelihood && d.positiveConsequence;
  });
  const canSubmit = openFms.length > 0 && allComplete && !isSubmitted;

  const tabs = [
    { id: 'list', label: t(lang, 'tab.fm_list'), icon: <ClipboardList size={15} /> },
    { id: 'results', label: t(lang, 'tab.results'), icon: <BarChart3 size={15} /> },
    { id: 'guideline', label: t(lang, 'tab.guideline'), icon: <BookOpen size={15} /> },
  ];

  return (
    <div className="max-w-3xl mx-auto p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <button onClick={onExit} className="text-slate-400 flex items-center gap-1 text-xs mb-1 hover:text-slate-600"><ArrowLeft size={13} /> {t(lang, 'session.exit')}</button>
          <h2 className="text-lg font-bold text-slate-800">{session.name}</h2>
          {isSubmitted && (
            <div className="text-xs text-amber-600 font-bold flex items-center gap-1 mt-0.5">
              <CheckCircle2 size={12} /> {t(lang, 'submit.locked')}
            </div>
          )}
        </div>
        <button onClick={refresh} className="p-2 text-slate-400 hover:text-slate-600"><RefreshCw size={16} /></button>
      </div>

      <div className="flex gap-1 mb-4 bg-slate-100 p-1 rounded-xl w-fit flex-wrap">
        {tabs.map((tb) => (
          <button key={tb.id} onClick={() => setTab(tb.id)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-bold transition-all ${tab === tb.id ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500'}`}>
            {tb.icon} {tb.label}
          </button>
        ))}
      </div>

      {tab === 'list' && (
        <div className="space-y-3">
          {session.fmList.length === 0 && <div className="text-slate-400 italic text-sm">{t(lang, 'fm.no_fm')}</div>}
          {session.fmList.map((fm) => {
            const status = session.fmStatus[fm.no] || 'locked';
            const draft = myDrafts[fm.no];
            const hasRisk = draft?.riskLikelihood && draft?.negativeConsequence;
            const hasOpp = draft?.oppLikelihood && draft?.positiveConsequence;
            const complete = hasRisk && hasOpp;
            const isOpen = status === 'open';

            return (
              <div key={fm.no} className={`bg-white border-2 rounded-2xl p-4 flex items-center justify-between gap-3 transition-all shadow-sm ${isOpen ? 'border-teal-300' : 'border-slate-200'}`}>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge color="#1e293b" bgColor="#f1f5f9">FM {fm.no}</Badge>
                    {fm.category && <Badge color="#0d9488" bgColor="#f0fdfa">{fm.category}</Badge>}
                    {status === 'locked' && <Badge color="#ca8a04" bgColor="#fef9c3">{t(lang, 'fm.not_opened')}</Badge>}
                    {status === 'closed' && <Badge color="#dc2626" bgColor="#fee2e2">{t(lang, 'fm.closed')}</Badge>}
                    {complete && <Badge color="#16a34a" bgColor="#dcfce7"><CheckCircle2 size={11} /> {t(lang, 'fm.assessed')}</Badge>}
                    {isOpen && hasRisk && !hasOpp && <Badge color="#f97316" bgColor="#ffedd5">Risk ✓ / Opp ✗</Badge>}
                    {isOpen && !hasRisk && hasOpp && <Badge color="#f97316" bgColor="#ffedd5">Risk ✗ / Opp ✓</Badge>}
                  </div>
                  <div className="text-sm text-slate-700 truncate mt-1">{fm.title}</div>
                  {complete && (
                    <div className="flex gap-2 mt-1.5">
                      {getRiskCell(draft.riskLikelihood, draft.negativeConsequence) && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                          style={{ backgroundColor: getRiskCell(draft.riskLikelihood, draft.negativeConsequence).bgColor, color: getRiskCell(draft.riskLikelihood, draft.negativeConsequence).textColor }}>
                          Risk: {getRiskCell(draft.riskLikelihood, draft.negativeConsequence).level} ({getRiskCell(draft.riskLikelihood, draft.negativeConsequence).score})
                        </span>
                      )}
                      {getOpportunityCell(draft.oppLikelihood, draft.positiveConsequence) && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                          style={{ backgroundColor: getOpportunityCell(draft.oppLikelihood, draft.positiveConsequence).bgColor, color: getOpportunityCell(draft.oppLikelihood, draft.positiveConsequence).textColor }}>
                          Opp: {getOpportunityCell(draft.oppLikelihood, draft.positiveConsequence).level} ({getOpportunityCell(draft.oppLikelihood, draft.positiveConsequence).score})
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <button
                  disabled={!isOpen || isSubmitted}
                  onClick={() => setVotingFM(fm)}
                  className={`shrink-0 px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-1.5 transition-all ${
                    isOpen && !isSubmitted
                      ? (complete ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' : 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white hover:from-teal-700 hover:to-emerald-700 shadow-sm')
                      : 'bg-slate-100 text-slate-300 cursor-not-allowed'
                  }`}
                >
                  {isOpen && !isSubmitted ? (complete ? <><Eye size={14} /> {t(lang, 'fm.edit')}</> : t(lang, 'fm.assess')) : <Lock size={14} />}
                </button>
              </div>
            );
          })}

          {/* Submit section */}
          {!isSubmitted && openFms.length > 0 && (
            <div className="bg-gradient-to-r from-slate-50 to-teal-50 border-2 border-teal-200 rounded-2xl p-5 mt-4">
              <div className="font-bold text-slate-800 mb-2 flex items-center gap-2"><Send size={16} /> {t(lang, 'submit.title')}</div>
              <div className="text-sm text-slate-600 mb-3">
                {allComplete
                  ? (lang === 'id' ? 'Semua failure mode yang terbuka sudah dinilai lengkap. Anda dapat mengirim penilaian.' : 'All open failure modes are fully assessed. You can submit.')
                  : t(lang, 'submit.checklist_incomplete')
                }
              </div>
              <div className="text-xs text-slate-500 mb-3">
                {openFms.map((fm) => {
                  const d = myDrafts[fm.no];
                  const ok = d && d.riskLikelihood && d.negativeConsequence && d.oppLikelihood && d.positiveConsequence;
                  return (
                    <span key={fm.no} className={`inline-flex items-center gap-1 mr-2 mb-1 px-2 py-0.5 rounded-lg text-[10px] font-bold ${ok ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {ok ? <CheckCircle2 size={10} /> : '○'} FM {fm.no}
                    </span>
                  );
                })}
              </div>
              <button
                disabled={!canSubmit}
                onClick={() => setShowSubmitConfirm(true)}
                className={`px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all ${
                  canSubmit ? 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white hover:from-teal-700 hover:to-emerald-700 shadow-sm' : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                <Send size={16} /> {t(lang, 'submit.btn')}
              </button>
            </div>
          )}

          {isSubmitted && (
            <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-5 mt-4 text-center">
              <CheckCircle2 size={32} className="mx-auto text-green-600 mb-2" />
              <div className="font-bold text-green-800 text-lg">{t(lang, 'submit.locked')}</div>
              <p className="text-sm text-green-600 mt-1">
                {lang === 'id' ? 'Penilaian Anda telah dikirim dan terkunci.' : 'Your assessment has been submitted and locked.'}
              </p>
            </div>
          )}
        </div>
      )}

      {tab === 'results' && <ResultsTab session={session} members={members} lang={lang} />}
      {tab === 'guideline' && <GuidelineTab sessionCode={session.code} hasDocument={hasDocument} />}

      {/* Assessment Form Modal */}
      {votingFM && (
        <AssessmentForm
          fm={votingFM}
          existingDraft={myDrafts[votingFM.no]}
          onSave={handleSaveDraft}
          onCancel={() => setVotingFM(null)}
          readOnly={isSubmitted}
        />
      )}

      {/* Submit Confirmation Modal */}
      {showSubmitConfirm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-800 mb-2">{t(lang, 'submit.confirm_title')}</h3>
            <p className="text-sm text-slate-600 mb-4">{t(lang, 'submit.confirm_message')}</p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowSubmitConfirm(false)} className="px-4 py-2 rounded-xl text-slate-600 font-semibold hover:bg-slate-100">{t(lang, 'assessment.cancel')}</button>
              <button
                disabled={submitting}
                onClick={handleSubmit}
                className="px-5 py-2 rounded-xl font-bold text-white bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 shadow-sm"
              >
                {submitting ? '...' : t(lang, 'submit.confirm_btn')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// APP ROOT
// ---------------------------------------------------------------------------

function AppContent() {
  const { user, isLoaded, isSignedIn } = useUser();
  const [screen, setScreen] = useState('landing');
  const [session, setSession] = useState(null);
  const [migrated, setMigrated] = useState(false);
  const [profileComplete, setProfileComplete] = useState(true);

  // Run migration on first load
  useEffect(() => {
    if (!migrated) {
      api.runMigration()
        .then(() => setMigrated(true))
        .catch(() => setMigrated(true)); // may already exist
    }
  }, [migrated]);

  // Sync user profile
  useEffect(() => {
    if (user) {
      api.getMe().then((me) => {
        if (!me.professional_role_key || !me.experience_level) {
          setProfileComplete(false);
        } else {
          setProfileComplete(true);
        }
      }).catch(() => {});
    }
  }, [user]);

  if (!isLoaded) {
    return (
      <AppShell>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-slate-400 animate-pulse font-bold">Loading...</div>
        </div>
      </AppShell>
    );
  }

  if (!isSignedIn) {
    return (
      <AppShell>
        <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
          <div className="p-4 bg-teal-50 border border-teal-200 rounded-3xl mb-4 text-teal-700">
            <HardHat size={40} />
          </div>
          <h2 className="text-2xl font-bold text-slate-800">PT Solusi Geotek Optima — FMEA Workshop</h2>
          <p className="text-slate-500 mt-2 max-w-md">
            Please sign in to access workshop assessments, saved drafts, and session materials.
          </p>
          <a
            href="/sign-in"
            className="mt-6 inline-flex items-center gap-2 bg-gradient-to-r from-teal-600 to-emerald-600 text-white font-bold px-6 py-3 rounded-xl shadow-md hover:from-teal-700 hover:to-emerald-700 transition-all"
          >
            <LogIn size={18} /> Sign In with Email
          </a>
        </div>
      </AppShell>
    );
  }

  // Profile setup needed
  if (user && !profileComplete && screen === 'landing') {
    return (
      <AppShell>
        <ProfileSetup
          onComplete={async (profile) => {
            await api.updateProfile(profile);
            setProfileComplete(true);
          }}
        />
      </AppShell>
    );
  }

  return (
    <AppShell sessionName={session?.name}>
      {screen === 'landing' && (
        <Landing
          user={user}
          onPickFacilitator={() => setScreen('facSetup')}
          onPickParticipant={() => setScreen('partJoin')}
        />
      )}

      {screen === 'facSetup' && (
        <FacilitatorSetup
          onBack={() => setScreen('landing')}
          onSessionReady={(s) => { setSession(s); setScreen('facDash'); }}
        />
      )}

      {screen === 'facDash' && session && (
        <FacilitatorDashboard
          session={session}
          onUpdateSession={setSession}
          onExit={() => { setSession(null); setScreen('landing'); }}
        />
      )}

      {screen === 'partJoin' && (
        <ParticipantJoin
          onBack={() => setScreen('landing')}
          onJoined={({ session: s }) => { setSession(s); setScreen('partMain'); }}
        />
      )}

      {screen === 'partMain' && session && (
        <ParticipantMain
          initialSession={session}
          onExit={() => { setSession(null); setScreen('landing'); }}
        />
      )}
    </AppShell>
  );
}

export default function FMEAApp() {
  return (
    <LangProvider>
      <AppContent />
    </LangProvider>
  );
}
