'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useUser } from '@clerk/nextjs';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from 'recharts';
import * as XLSX from 'xlsx';
import {
  Lock, Unlock, Upload, Download, Users, BarChart3, ArrowLeft, CheckCircle2,
  Copy, RefreshCw, ClipboardList, Settings, AlertTriangle, Trophy,
  FileSpreadsheet, ChevronRight, HardHat, Shield, Sparkles,
  BookOpen, Send, RotateCcw, Eye, LogIn, Globe, Save
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

/** Try multiple keyword patterns in priority order, return first match. */
function findValMulti(row, ...keywordSets) {
  for (const keywords of keywordSets) {
    const val = findVal(row, keywords);
    if (val) return val;
  }
  return '';
}

/** Read a single column value from a row. Returns { en: value }. */
function findSingle(row, ...keywordSets) {
  const val = findValMulti(row, ...keywordSets);
  return { en: val };
}

function mapRowToFM(row, idx) {
  const no = findValMulti(row, ['fm', 'no'], ['fm_no'], ['no']) || String(idx + 1);
  return {
    no,
    category: findSingle(row, ['category']),
    title: findSingle(row, ['failure', 'mode'], ['title']),
    mechanism: findSingle(row, ['mechanism'], ['trigger']),
    initiation: findSingle(row, ['initiation']),
    continuation: findSingle(row, ['continuation']),
    progression: findSingle(row, ['progression']),
    detectionMonitoring: findSingle(row, ['detection'], ['monitoring']),
    intervention: findSingle(row, ['intervention'], ['risk', 'control']),
    effect: findSingle(row, ['effect'], ['consequence']),
    notes: findSingle(row, ['notes'], ['question']),
    ownerAction: findSingle(row, ['owner'], ['action']),
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

function resolveLang(val, lang) {
  if (!val) return '';
  if (typeof val === 'string') return val;
  return val[lang] || val.id || val.en || '';
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
  const [fileErrs, setFileErrs] = useState([]); // Array of error strings
  const [busy, setBusy] = useState(false);
  const fileRef = useRef(null);

  function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    setFileErrs([]);
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target.result);
        const wb = XLSX.read(data, { type: 'array' });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
        
        // Map and filter out completely empty rows
        const parsed = rows.map(mapRowToFM).filter((fm) => fm.title?.en || fm.category?.en);
        
        if (!parsed.length) { 
          setFileErrs([lang === 'id' ? 'Tidak ada baris valid.' : 'No valid rows found.']); 
          return; 
        }

        setPreview(parsed);
      } catch (e) {
        setFileErrs([lang === 'id' ? 'Gagal membaca file.' : 'Failed to read file.']);
      }
    };
    reader.readAsArrayBuffer(file);
  }

  async function confirmImport() {
    setBusy(true);
    setFileErrs([]);
    try {
      await api.importFMs(session.code, preview);
      const data = await api.getFullSession(session.code);
      onUpdateSession(data.session);
      setPreview(null);
      if (fileRef.current) fileRef.current.value = '';
    } catch (e) {
      // Show server-side validation errors if any
      const msg = typeof e.details === 'object' ? JSON.stringify(e.details) : e.message;
      setFileErrs(['Import failed: ' + msg]);
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
        
        {fileErrs.length > 0 && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl space-y-1">
            <div className="text-sm font-bold text-red-700 flex items-center gap-1"><AlertTriangle size={15} /> Validation Errors</div>
            <ul className="text-xs text-red-600 list-disc pl-5">
              {fileErrs.map((err, idx) => <li key={idx}>{err}</li>)}
            </ul>
          </div>
        )}
      </div>

      {preview && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="font-bold text-slate-800 mb-2">{t(lang, 'import.preview')} — {preview.length} failure mode</div>
          <div className="max-h-80 overflow-y-auto border border-slate-100 rounded-xl">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 sticky top-0"><tr>
                <th className="p-2 text-left">No</th>
                <th className="p-2 text-left">Category</th>
                <th className="p-2 text-left">Failure Mode</th>
              </tr></thead>
              <tbody>
                {preview.map((fm, i) => (
                  <tr key={i} className="border-t border-slate-100">
                    <td className="p-2">{fm.no}</td>
                    <td className="p-2">{fm.category?.en}</td>
                    <td className="p-2">{fm.title?.en}</td>
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
                  {resolveLang(fm.category, lang) && <Badge color="#0d9488" bgColor="#f0fdfa">{resolveLang(fm.category, lang)}</Badge>}
                  {status === 'open' && <Badge color="#16a34a" bgColor="#dcfce7">{t(lang, 'fm.open')}</Badge>}
                  {status === 'closed' && <Badge color="#dc2626" bgColor="#fee2e2">{t(lang, 'fm.closed')}</Badge>}
                  {status === 'locked' && <Badge color="#ca8a04" bgColor="#fef9c3">{t(lang, 'fm.locked')}</Badge>}
                </div>
                <div className="text-sm text-slate-700 truncate mt-1">{resolveLang(fm.title, lang) || '(Untitled)'}</div>
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
  
  const [link, setLink] = useState('');
  const [title, setTitle] = useState('');

  useEffect(() => {
    api.getDocumentInfo(session.code).then(setDocInfo).catch(() => {});
  }, [session.code]);

  async function handleSave(e) {
    e.preventDefault();
    if (!link) return;
    setBusy(true); setErr('');
    try {
      await api.uploadDocument(session.code, link, title || 'Reference Material');
      const info = await api.getDocumentInfo(session.code);
      setDocInfo(info);
      setLink('');
      setTitle('');
    } catch (e) {
      setErr(e.message);
    }
    setBusy(false);
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
      <div className="flex items-center gap-2 font-bold text-slate-800 mb-3"><BookOpen size={18} /> {t(lang, 'upload.title')}</div>
      
      {docInfo && (
        <div className="bg-teal-50 border border-teal-200 rounded-xl p-3 mb-4 text-sm text-teal-800">
          <div className="flex items-center gap-2 mb-1">
             <CheckCircle2 size={16} className="text-teal-600" />
             <b>{docInfo.title}</b> (v{docInfo.version})
          </div>
          <a href={docInfo.link} target="_blank" rel="noreferrer" className="text-teal-600 underline font-bold truncate block">{t(lang, 'guideline.download_material')}</a>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-3">
        <div>
           <label className="block text-xs font-bold text-slate-600 mb-1">Document Title (Optional)</label>
           <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Reference Material" className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-teal-500" />
        </div>
        <div>
           <label className="block text-xs font-bold text-slate-600 mb-1">Google Drive Link (Required)</label>
           <input type="url" value={link} onChange={e => setLink(e.target.value)} placeholder="https://docs.google.com/..." required className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-teal-500" />
        </div>
        <button type="submit" disabled={busy || !link} className="bg-teal-600 hover:bg-teal-700 text-white font-bold px-4 py-2 rounded-xl text-sm transition-colors disabled:opacity-50">
           {busy ? t(lang, 'common.saving') : 'Save Link'}
        </button>
      </form>
      {err && <div className="text-sm text-red-600 mt-2">{err}</div>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// RESULTS TAB (Facilitator only)
// ---------------------------------------------------------------------------

function ResultsTab({ session, liveData, lang }) {
  if (!liveData) return <div className="text-slate-500 animate-pulse text-sm">Loading...</div>;

  const { totalMembers, aggregated } = liveData;

  // Re-link with full FM data to get titles, sort by risk score descending
  const sorted = aggregated.map((agg) => {
    const fm = session.fmList.find((f) => f.no === agg.fmNo) || { no: agg.fmNo, title: 'Unknown' };
    return { fm, ...agg };
  });

  const top = sorted.find((x) => x.riskScore > 0);
  const totalAssessments = sorted.reduce((sum, item) => sum + item.count, 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={<Users size={18} />} label={t(lang, 'results.participants')} value={totalMembers || 0} />
        <StatCard icon={<ClipboardList size={18} />} label={t(lang, 'results.total_fm')} value={session.fmList.length} />
        <StatCard icon={<CheckCircle2 size={18} />} label={t(lang, 'results.assessments')} value={totalAssessments} />
        <StatCard icon={<Trophy size={18} />} label={t(lang, 'results.highest_risk')} value={top ? top.riskScore : '-'} sub={top ? `FM ${top.fm.no}` : ''} />
      </div>

      <div className="space-y-3">
        {sorted.map(({ fm, count, avgRiskLikelihood, avgNegativeConsequence, roundedLikelihood, roundedConsequence, riskScore, riskLevel, likelihoodDistribution, consequenceDistribution, combinationDistribution }) => {
          const riskCell = roundedLikelihood && roundedConsequence ? getRiskCell(roundedLikelihood, roundedConsequence) : null;

          // Format data for recharts
          const lData = likelihoodDistribution ? Object.keys(likelihoodDistribution).map(k => ({ name: k, count: likelihoodDistribution[k] })) : [];
          const cData = consequenceDistribution ? Object.keys(consequenceDistribution).map(k => ({ name: k, count: consequenceDistribution[k] })) : [];

          return (
            <div key={fm.no} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge color="#1e293b" bgColor="#f1f5f9">FM {fm.no}</Badge>
                    {resolveLang(fm.category, lang) && <Badge color="#0d9488" bgColor="#f0fdfa">{resolveLang(fm.category, lang)}</Badge>}
                    <span className="text-xs text-slate-400">{count} {t(lang, 'results.responses')}</span>
                  </div>
                  <div className="font-bold text-slate-800 mt-1">{resolveLang(fm.title, lang) || '(Untitled)'}</div>
                </div>
                <div className="flex gap-2 shrink-0">
                  {riskCell && (
                    <div className="flex gap-2 text-center">
                      <div className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200">
                        <div className="text-[10px] font-bold uppercase text-slate-500">{t(lang, 'results.weighted_avg')}</div>
                        <div className="text-sm font-bold text-slate-700">L: {avgRiskLikelihood} <span className="opacity-50">|</span> C: {avgNegativeConsequence}</div>
                      </div>
                      <div className="px-3 py-1.5 rounded-xl" style={{ backgroundColor: riskCell.bgColor, color: riskCell.textColor }}>
                        <div className="text-[10px] font-bold uppercase flex items-center gap-1 justify-center"><Shield size={10} /> {t(lang, 'results.rounded')}</div>
                        <div className="text-lg font-extrabold leading-tight">{riskCell.score}</div>
                        <div className="text-[10px] font-bold">{riskCell.level}</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              {count === 0 && <div className="text-sm text-slate-400 italic mt-2">{t(lang, 'results.no_data')}</div>}
              
              {count > 0 && likelihoodDistribution && (
                <div className="mt-6 pt-4 border-t border-slate-100 grid grid-cols-1 lg:grid-cols-3 gap-6">
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
                                const val = combinationDistribution[l]?.[c] || 0;
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
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// EXPORT TAB
// ---------------------------------------------------------------------------

function ExportTab({ session, liveData }) {
  const { lang } = useLang();

  function exportExcel() {
    if (!liveData) return;
    const { aggregated } = liveData;

    const rows = session.fmList.map((fm) => {
      const agg = aggregated.find((a) => a.fmNo === fm.no) || {};
      const rRL = agg.roundedLikelihood;
      const rNC = agg.roundedConsequence;
      const riskCell = rRL && rNC ? getRiskCell(rRL, rNC) : null;

      return {
        'FM No.': fm.no, 'Category': resolveLang(fm.category, lang), 'Potential Failure Mode': resolveLang(fm.title, lang),
        'Risk Likelihood': rRL || '', 'Neg. Consequence': rNC || '',
        'Risk Score': riskCell?.score || '', 'Risk Level': riskCell?.level || '',
        'Respondents': agg.count || 0,
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
// TRANSLATION REVIEW TAB
// ---------------------------------------------------------------------------

function TranslationReviewTab({ session, onUpdateSession }) {
  const { lang } = useLang();
  const [selectedFmNo, setSelectedFmNo] = useState(null);
  const [editFields, setEditFields] = useState({});
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  const activeFm = session.fmList.find((f) => f.no === selectedFmNo);

  const fieldsToReview = [
    { key: 'title', label: 'Potential Failure Mode' },
    { key: 'mechanism', label: 'Mechanism' },
    { key: 'initiation', label: 'Initiation' },
    { key: 'continuation', label: 'Continuation' },
    { key: 'progression', label: 'Progression' },
    { key: 'detectionMonitoring', label: 'Detection / Monitoring' },
    { key: 'intervention', label: 'Intervention' },
    { key: 'effect', label: 'Effect' },
    { key: 'notes', label: 'Notes' },
    { key: 'ownerAction', label: 'Owner / Action' },
  ];

  function openFm(fm) {
    setSelectedFmNo(fm.no);
    setSaved(false);
    const initialEdits = {};
    fieldsToReview.forEach((f) => {
      if (fm[f.key] && typeof fm[f.key] === 'object') {
        initialEdits[f.key] = fm[f.key].en || '';
      }
    });
    setEditFields(initialEdits);
  }

  async function handleSave() {
    if (!activeFm) return;
    setBusy(true);
    try {
      await api.updateTranslations(session.code, activeFm.no, editFields);
      // Optimistically update the session
      const updatedList = session.fmList.map((fm) => {
        if (fm.no !== activeFm.no) return fm;
        const newFm = { ...fm };
        Object.keys(editFields).forEach((key) => {
          if (newFm[key] && typeof newFm[key] === 'object') {
            newFm[key] = { ...newFm[key], en: editFields[key] };
          }
        });
        return newFm;
      });
      onUpdateSession({ ...session, fmList: updatedList });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      alert(e.message);
    }
    setBusy(false);
  }

  return (
    <div className="flex flex-col md:flex-row gap-4">
      {/* List */}
      <div className="w-full md:w-1/3 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col max-h-[600px]">
        <div className="p-3 bg-slate-50 border-b border-slate-200 font-bold text-slate-800 text-sm flex items-center gap-2">
          <Globe size={16} className="text-blue-500" />
          Select Failure Mode
        </div>
        <div className="overflow-y-auto flex-1 divide-y divide-slate-100">
          {session.fmList.map((fm) => (
            <button
              key={fm.no}
              onClick={() => openFm(fm)}
              className={`w-full text-left p-3 text-sm transition-all hover:bg-slate-50 ${selectedFmNo === fm.no ? 'bg-blue-50 border-l-4 border-blue-500' : 'border-l-4 border-transparent'}`}
            >
              <div className="font-bold text-slate-800">FM {fm.no}</div>
              <div className="text-slate-500 truncate text-xs">{resolveLang(fm.title, 'id')}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Editor */}
      <div className="w-full md:w-2/3 bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
        {!activeFm ? (
          <div className="h-full flex items-center justify-center text-slate-400 italic text-sm">
            Select a Failure Mode to review translations.
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-800 text-lg">FM {activeFm.no} Translations</h3>
              <button
                disabled={busy}
                onClick={handleSave}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-sm transition-all flex items-center gap-2 disabled:opacity-50"
              >
                <Save size={16} /> {busy ? 'Saving...' : (saved ? 'Saved!' : 'Save Edits')}
              </button>
            </div>
            
            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
              {fieldsToReview.map((field) => {
                const val = activeFm[field.key];
                if (!val || typeof val !== 'object' || !val.id) return null; // Only show fields that have bilingual data
                
                return (
                  <div key={field.key} className="bg-slate-50 rounded-xl p-3 border border-slate-200">
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{field.label}</div>
                    
                    <div className="grid md:grid-cols-2 gap-3">
                      <div>
                        <div className="text-[10px] font-bold text-slate-400 mb-1">ID (Source)</div>
                        <div className="text-sm p-2.5 bg-white border border-slate-200 rounded-lg text-slate-700">
                          {val.id}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] font-bold text-blue-500 mb-1">EN (Translation)</div>
                        <textarea
                          value={editFields[field.key] || ''}
                          onChange={(e) => setEditFields({ ...editFields, [field.key]: e.target.value })}
                          className="w-full text-sm p-2 border border-blue-200 rounded-lg text-slate-800 focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all min-h-[60px]"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// FACILITATOR DASHBOARD
// ---------------------------------------------------------------------------

function FacilitatorDashboard({ session, onUpdateSession, onExit }) {
  const { lang } = useLang();
  const [tab, setTab] = useState('import');
  const [liveData, setLiveData] = useState(null);
  const [copied, setCopied] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const data = await api.getFullSession(session.code);
      onUpdateSession(data.session);
      try {
        const live = await api.getLiveResults(session.code);
        setLiveData(live);
      } catch (e) { console.error('Failed to get live results', e); }
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
    { id: 'translations', label: 'Translations', icon: <Globe size={15} /> },
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
      {tab === 'translations' && <TranslationReviewTab session={session} onUpdateSession={onUpdateSession} />}
      {tab === 'results' && <ResultsTab session={session} liveData={liveData} lang={lang} />}
      {tab === 'export' && <ExportTab session={session} liveData={liveData} />}
    </div>
  );
}

// ---------------------------------------------------------------------------
// PARTICIPANT JOIN
// ---------------------------------------------------------------------------

function ParticipantJoin({ onBack, onJoined }) {
  const { lang } = useLang();
  const [code, setCode] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  async function join() {
    const c = code.trim().toUpperCase();
    if (!c) { setErr(lang === 'id' ? 'Masukkan kode sesi.' : 'Enter session code.'); return; }
    setBusy(true); setErr('');
    try {
      const sessionData = await api.getFullSession(c);
      await api.joinMembership(c);
      onJoined({ session: sessionData.session });
    } catch (e) {
      // Surface server error message (e.g. missing profile) instead of generic text
      setErr(e.message || (lang === 'id' ? 'Gagal bergabung sesi.' : 'Failed to join session.'));
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
        {err && <div className="text-sm text-red-600 flex items-start gap-1"><AlertTriangle size={14} className="mt-0.5 shrink-0" /> {err}</div>}
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
    return d && d.riskLikelihood && d.negativeConsequence;
  });
  const canSubmit = openFms.length > 0 && allComplete && !isSubmitted;

  const tabs = [
    { id: 'list', label: t(lang, 'tab.fm_list'), icon: <ClipboardList size={15} /> },
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
            const complete = hasRisk;
            const isOpen = status === 'open';

            return (
              <div key={fm.no} className={`bg-white border-2 rounded-2xl p-4 flex items-center justify-between gap-3 transition-all shadow-sm ${isOpen ? 'border-teal-300' : 'border-slate-200'}`}>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge color="#1e293b" bgColor="#f1f5f9">FM {fm.no}</Badge>
                    {resolveLang(fm.category, lang) && <Badge color="#0d9488" bgColor="#f0fdfa">{resolveLang(fm.category, lang)}</Badge>}
                    {status === 'locked' && <Badge color="#ca8a04" bgColor="#fef9c3">{t(lang, 'fm.not_opened')}</Badge>}
                    {status === 'closed' && <Badge color="#dc2626" bgColor="#fee2e2">{t(lang, 'fm.closed')}</Badge>}
                    {complete && <Badge color="#16a34a" bgColor="#dcfce7"><CheckCircle2 size={11} /> {t(lang, 'fm.assessed')}</Badge>}
                  </div>
                  <div className="text-sm text-slate-700 truncate mt-1">{resolveLang(fm.title, lang) || '(Untitled)'}</div>
                  {complete && (
                    <div className="flex gap-2 mt-1.5">
                      {getRiskCell(draft.riskLikelihood, draft.negativeConsequence) && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                          style={{ backgroundColor: getRiskCell(draft.riskLikelihood, draft.negativeConsequence).bgColor, color: getRiskCell(draft.riskLikelihood, draft.negativeConsequence).textColor }}>
                          Risk: {getRiskCell(draft.riskLikelihood, draft.negativeConsequence).level} ({getRiskCell(draft.riskLikelihood, draft.negativeConsequence).score})
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
                  const ok = d && d.riskLikelihood && d.negativeConsequence;
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
