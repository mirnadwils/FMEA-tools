'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from 'recharts';
import * as XLSX from 'xlsx';
import {
  Lock, Unlock, Upload, Download, Users, BarChart3, ArrowLeft, CheckCircle2,
  Copy, RefreshCw, ClipboardList, LogIn, Settings, AlertTriangle, Trophy,
  FileSpreadsheet, ChevronRight, UserPlus, Printer, HardHat
} from 'lucide-react';
import * as api from '@/lib/api';

/* =========================================================================
   FMEA WORKSHOP TOOL — SGO
   Alat pengisian Preliminary FMEA (PFMA) untuk workshop multi-peserta.
   Data disimpan di NeonDB PostgreSQL melalui Next.js API routes.
   ========================================================================= */

// ---------------------------------------------------------------------------
// KONSTANTA — SKALA PENILAIAN (sesuai kriteria SGO)
// ---------------------------------------------------------------------------

const ROLES = [
  'Owner',
  'Engineer of Record',
  'Geotechnical Engineer',
  'Environmental Engineer',
  'Hydraulic Engineer',
  'Seismic Engineer',
  'Operation',
  'Instrumentation Engineer',
  'ITRB',
  'Lainnya',
];

const EXPERIENCE_WEIGHT = { beginner: 1, experienced: 2, expert: 3 };

const LIKELIHOOD_SCALE = [
  { val: 1, label: 'Remote', prob: '< 1/1.000.000', color: 'blue',
    desc: 'Perlu beberapa kejadian independen yang terjadi bersamaan/berurutan agar failure terjadi; kemungkinan hampir dapat diabaikan.' },
  { val: 2, label: 'Low', prob: '1/1.000.000 – 1/100.000', color: 'green',
    desc: 'Kemungkinan tidak bisa disingkirkan, namun tidak ada bukti kuat bahwa inisiasi telah terjadi atau kondisi tersebut ada.' },
  { val: 3, label: 'Moderate', prob: '1/100.000 – 1/10.000', color: 'yellow',
    desc: 'Kondisi/defect fundamental diketahui ada; bukti tidak langsung condong ke arah "less likely".' },
  { val: 4, label: 'High', prob: '1/10.000 – 1/1.000', color: 'orange',
    desc: 'Kondisi/defect fundamental diketahui ada; bukti tidak langsung condong ke arah "more likely".' },
  { val: 5, label: 'Very High', prob: '> 1/1.000', color: 'red',
    desc: 'Ada bukti langsung/tidak langsung substansial bahwa failure mode sudah mulai terjadi atau kemungkinan besar akan terjadi.' },
];

const SEVERITY_SCALE = [
  { val: 1, label: 'Low', color: 'blue', desc: 'Konsekuensi minor terhadap keselamatan publik, lingkungan, infrastruktur, atau reputasi (Rating Matrix 1–2).' },
  { val: 2, label: 'Significant', color: 'green', desc: 'Konsekuensi cukup berarti namun masih terbatas (Rating Matrix 3).' },
  { val: 3, label: 'High', color: 'yellow', desc: 'Konsekuensi signifikan terhadap keselamatan publik/lingkungan/operasional (Rating Matrix 4).' },
  { val: 4, label: 'Very High', color: 'orange', desc: 'Konsekuensi besar dan meluas (Rating Matrix 5–6).' },
  { val: 5, label: 'Extreme', color: 'red', desc: 'Konsekuensi maksimum/katastropik (Rating Matrix 7–8).' },
];

const DETECTION_SCALE = [
  { val: 1, label: 'Effective', color: 'green',
    desc: 'Kontrol dirancang dan beroperasi efektif pada semua kondisi; seluruh elemen desain & implementasi memadai.' },
  { val: 2, label: 'Partially Effective', color: 'yellow',
    desc: 'Sebagian aspek desain/implementasi kontrol kurang memadai atau hanya berfungsi sebagian.' },
  { val: 3, label: 'Partially Effective', color: 'yellow',
    desc: 'Sebagian aspek desain/implementasi kontrol kurang memadai atau hanya berfungsi sebagian (mendekati ineffective).' },
  { val: 4, label: 'Ineffective', color: 'red',
    desc: 'Kontrol tidak ada atau dirancang/beroperasi secara tidak efektif dalam mencapai tujuan.' },
];

const COLOR_MAP = {
  blue:   { chip: 'bg-blue-50 border-blue-300 text-blue-800',     ring: 'ring-blue-400',   solid: '#3b82f6', soft: 'bg-blue-100' },
  green:  { chip: 'bg-green-50 border-green-300 text-green-800',  ring: 'ring-green-400',  solid: '#22c55e', soft: 'bg-green-100' },
  lime:   { chip: 'bg-lime-50 border-lime-300 text-lime-800',     ring: 'ring-lime-400',   solid: '#84cc16', soft: 'bg-lime-100' },
  yellow: { chip: 'bg-yellow-50 border-yellow-300 text-yellow-800', ring: 'ring-yellow-400', solid: '#eab308', soft: 'bg-yellow-100' },
  orange: { chip: 'bg-orange-50 border-orange-300 text-orange-800', ring: 'ring-orange-400', solid: '#f97316', soft: 'bg-orange-100' },
  red:    { chip: 'bg-red-50 border-red-300 text-red-800',        ring: 'ring-red-400',    solid: '#ef4444', soft: 'bg-red-100' },
};

function rpnCategory(rpn) {
  if (rpn <= 8) return { label: 'Low', color: 'green' };
  if (rpn <= 20) return { label: 'Medium', color: 'lime' };
  if (rpn <= 40) return { label: 'High', color: 'yellow' };
  if (rpn <= 60) return { label: 'Extreme', color: 'orange' };
  return { label: 'Critical', color: 'red' };
}

function roundRating(avg, max) {
  if (avg == null || isNaN(avg)) return null;
  const r = Math.round(avg);
  return Math.min(max, Math.max(1, r));
}

function scaleMeta(scaleArr, val) {
  return scaleArr.find((s) => s.val === val) || null;
}

function weightedAvg(votes, field) {
  if (!votes.length) return null;
  let sumWV = 0, sumW = 0;
  for (const v of votes) {
    const w = EXPERIENCE_WEIGHT[v.experience] || 1;
    sumWV += v[field] * w;
    sumW += w;
  }
  return sumW ? sumWV / sumW : null;
}

// ---------------------------------------------------------------------------
// UTIL — kode sesi, import excel
// ---------------------------------------------------------------------------

function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let s = '';
  for (let i = 0; i < 6; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

function slug(str) {
  return String(str || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function findVal(row, keywords) {
  const keys = Object.keys(row);
  const key = keys.find((k) => {
    const kl = k.toLowerCase();
    return keywords.every((kw) => kl.includes(kw));
  });
  return key !== undefined ? String(row[key] ?? '').trim() : '';
}

function mapRowToFM(row, idx) {
  const no = findVal(row, ['fm', 'no']) || String(idx + 1);
  return {
    no,
    category: findVal(row, ['category']),
    title: findVal(row, ['potential', 'failure']),
    mechanism: findVal(row, ['trigger']) || findVal(row, ['mechanism']),
    initiation: findVal(row, ['initiation']),
    continuation: findVal(row, ['continuation']),
    progression: findVal(row, ['progression']),
    detectionMonitoring: findVal(row, ['detection', 'monitoring']),
    intervention: findVal(row, ['intervention']) || findVal(row, ['controls']),
    effect: findVal(row, ['effect']),
    notes: findVal(row, ['notes']),
    ownerAction: findVal(row, ['owner']),
  };
}

// ---------------------------------------------------------------------------
// KOMPONEN KECIL
// ---------------------------------------------------------------------------

function Badge({ color = 'blue', children }) {
  const c = COLOR_MAP[color] || COLOR_MAP.blue;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-semibold ${c.chip}`}>
      {children}
    </span>
  );
}

function StatCard({ icon, label, value, sub }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-start gap-3">
      <div className="p-2 rounded-lg bg-slate-100 text-slate-600">{icon}</div>
      <div>
        <div className="text-xs text-slate-500 font-medium">{label}</div>
        <div className="text-xl font-bold text-slate-800">{value}</div>
        {sub && <div className="text-xs text-slate-400 mt-0.5">{sub}</div>}
      </div>
    </div>
  );
}

function RatingPicker({ title, scaleArr, value, onChange }) {
  return (
    <div className="mb-5">
      <div className="text-sm font-semibold text-slate-700 mb-2">{title}</div>
      <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${scaleArr.length}, minmax(0,1fr))` }}>
        {scaleArr.map((s) => {
          const c = COLOR_MAP[s.color];
          const selected = value === s.val;
          return (
            <button
              key={s.val}
              type="button"
              onClick={() => onChange(s.val)}
              className={`text-left p-2.5 rounded-lg border-2 transition-all ${
                selected ? `${c.chip} ${c.ring} ring-2 shadow-sm` : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
              title={s.desc}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm">{s.val}</span>
                {selected && <CheckCircle2 size={15} />}
              </div>
              <div className="text-xs font-semibold leading-tight mt-0.5">{s.label}</div>
            </button>
          );
        })}
      </div>
      {value && <div className="text-xs text-slate-500 mt-1.5 italic">{scaleMeta(scaleArr, value)?.desc}</div>}
    </div>
  );
}

function VotingForm({ fm, existingVote, onSubmit, onCancel }) {
  const [l, setL] = useState(existingVote?.likelihood || null);
  const [s, setS] = useState(existingVote?.severity || null);
  const [d, setD] = useState(existingVote?.detection || null);
  const canSubmit = l && s && d;

  return (
    <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-2xl w-full overflow-y-auto shadow-2xl" style={{ maxHeight: '90vh' }}>
        <div className="p-5 border-b border-slate-100 sticky top-0 bg-white rounded-t-2xl">
          <div className="flex items-center gap-2">
            <Badge color="blue">FM {fm.no}</Badge>
            {fm.category && <Badge color="lime">{fm.category}</Badge>}
          </div>
          <h3 className="text-lg font-bold text-slate-800 mt-2">{fm.title || '(Tanpa judul)'}</h3>
        </div>
        <div className="p-5 space-y-3">
          {fm.mechanism && (
            <div className="text-sm text-slate-600"><span className="font-semibold text-slate-700">Trigger / Mekanisme: </span>{fm.mechanism}</div>
          )}
          {fm.effect && (
            <div className="text-sm text-slate-600"><span className="font-semibold text-slate-700">Potensi Efek: </span>{fm.effect}</div>
          )}
          {fm.detectionMonitoring && (
            <div className="text-sm text-slate-600"><span className="font-semibold text-slate-700">Deteksi / Monitoring saat ini: </span>{fm.detectionMonitoring}</div>
          )}
          {fm.intervention && (
            <div className="text-sm text-slate-600"><span className="font-semibold text-slate-700">Kontrol / Mitigasi: </span>{fm.intervention}</div>
          )}
          {fm.notes && (
            <div className="text-sm bg-amber-50 border border-amber-200 rounded-lg p-2.5 text-amber-800">
              <span className="font-semibold">Catatan PFMA: </span>{fm.notes}
            </div>
          )}

          <div className="pt-2">
            <RatingPicker title="1. Likelihood — kemungkinan terjadinya failure mode" scaleArr={LIKELIHOOD_SCALE} value={l} onChange={setL} />
            <RatingPicker title="2. Severity / Consequence — dampak jika terjadi" scaleArr={SEVERITY_SCALE} value={s} onChange={setS} />
            <RatingPicker title="3. Detection — efektivitas kontrol/monitoring saat ini" scaleArr={DETECTION_SCALE} value={d} onChange={setD} />
          </div>
        </div>
        <div className="p-4 border-t border-slate-100 flex justify-end gap-2 sticky bottom-0 bg-white rounded-b-2xl">
          <button onClick={onCancel} className="px-4 py-2 rounded-lg text-slate-600 font-medium hover:bg-slate-100">Batal</button>
          <button
            disabled={!canSubmit}
            onClick={() => onSubmit({ likelihood: l, severity: s, detection: d, ts: Date.now() })}
            className={`px-5 py-2 rounded-lg font-semibold text-white ${canSubmit ? 'bg-teal-600 hover:bg-teal-700' : 'bg-slate-300 cursor-not-allowed'}`}
          >
            Kirim Penilaian
          </button>
        </div>
      </div>
    </div>
  );
}

function distFor(scaleArr, votesArr, field) {
  return scaleArr.map((s) => ({
    val: String(s.val),
    label: s.label,
    count: votesArr.filter((v) => v[field] === s.val).length,
    color: COLOR_MAP[s.color].solid,
  }));
}

function MiniBar({ data, height = 110 }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
        <XAxis dataKey="val" tick={{ fontSize: 11 }} axisLine={{ stroke: '#cbd5e1' }} tickLine={false} />
        <YAxis allowDecimals={false} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={24} />
        <Tooltip formatter={(v, n, p) => [`${v} suara`, p.payload.label]} labelFormatter={(l) => `Rating ${l}`} />
        <Bar dataKey="count" radius={[4, 4, 0, 0]}>
          {data.map((d, i) => (
            <Cell key={i} fill={d.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

function FMResultCard({ fm, votes }) {
  const n = votes.length;
  const avgL = weightedAvg(votes, 'likelihood');
  const avgS = weightedAvg(votes, 'severity');
  const avgD = weightedAvg(votes, 'detection');
  const rL = roundRating(avgL, 5);
  const rS = roundRating(avgS, 5);
  const rD = roundRating(avgD, 4);
  const rpn = rL && rS && rD ? rL * rS * rD : null;
  const cat = rpn ? rpnCategory(rpn) : null;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge color="blue">FM {fm.no}</Badge>
            {fm.category && <Badge color="lime">{fm.category}</Badge>}
            <span className="text-xs text-slate-400">{n} respon</span>
          </div>
          <div className="font-semibold text-slate-800 mt-1">{fm.title || '(Tanpa judul)'}</div>
        </div>
        {rpn && (
          <div className="text-right">
            <div className="text-xs text-slate-400 font-medium">RPN</div>
            <div className="text-2xl font-extrabold text-slate-800">{rpn}</div>
            <Badge color={cat.color}>{cat.label}</Badge>
          </div>
        )}
      </div>

      {n === 0 ? (
        <div className="text-sm text-slate-400 italic mt-3">Belum ada penilaian masuk.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
          <div>
            <div className="text-xs font-semibold text-slate-500 mb-1">Likelihood — rata² {avgL.toFixed(2)} → <b>{rL}</b></div>
            <MiniBar data={distFor(LIKELIHOOD_SCALE, votes, 'likelihood')} />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500 mb-1">Severity — rata² {avgS.toFixed(2)} → <b>{rS}</b></div>
            <MiniBar data={distFor(SEVERITY_SCALE, votes, 'severity')} />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500 mb-1">Detection — rata² {avgD.toFixed(2)} → <b>{rD}</b></div>
            <MiniBar data={distFor(DETECTION_SCALE, votes, 'detection')} />
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// LANDING
// ---------------------------------------------------------------------------

function Landing({ onPickFacilitator, onPickParticipant }) {
  return (
    <div className="min-h-full flex items-center justify-center p-6">
      <div className="max-w-3xl w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 text-teal-700 font-bold text-sm tracking-wide uppercase mb-2">
            <HardHat size={18} /> SGO Geotechnical Workshop Tools
          </div>
          <h1 className="text-3xl font-extrabold text-slate-800">Preliminary FMEA (PFMA) — Live Workshop</h1>
          <p className="text-slate-500 mt-2">Penilaian Likelihood, Severity, dan Detection secara kolaboratif untuk setiap failure mode.</p>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <button
            onClick={onPickFacilitator}
            className="text-left bg-white border-2 border-slate-200 hover:border-teal-400 rounded-2xl p-6 transition-all group"
          >
            <div className="p-3 bg-slate-800 text-white rounded-xl inline-flex mb-3"><Settings size={22} /></div>
            <div className="font-bold text-lg text-slate-800">Saya Fasilitator</div>
            <div className="text-sm text-slate-500 mt-1">Buat sesi baru, import daftar failure mode, kontrol lock/unlock, dan lihat hasil live.</div>
            <div className="text-teal-600 font-semibold text-sm mt-3 flex items-center gap-1 group-hover:gap-2 transition-all">Mulai <ChevronRight size={16} /></div>
          </button>
          <button
            onClick={onPickParticipant}
            className="text-left bg-white border-2 border-slate-200 hover:border-teal-400 rounded-2xl p-6 transition-all group"
          >
            <div className="p-3 bg-teal-600 text-white rounded-xl inline-flex mb-3"><UserPlus size={22} /></div>
            <div className="font-bold text-lg text-slate-800">Saya Peserta Workshop</div>
            <div className="text-sm text-slate-500 mt-1">Masuk pakai kode sesi dari fasilitator, pilih role, lalu mulai menilai failure mode.</div>
            <div className="text-teal-600 font-semibold text-sm mt-3 flex items-center gap-1 group-hover:gap-2 transition-all">Gabung <ChevronRight size={16} /></div>
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// FACILITATOR
// ---------------------------------------------------------------------------

function FacilitatorSetup({ onBack, onSessionReady }) {
  const [name, setName] = useState('');
  const [facilitator, setFacilitator] = useState('');
  const [existingCode, setExistingCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  async function createSession() {
    if (!name.trim()) { setErr('Nama sesi wajib diisi.'); return; }
    setBusy(true);
    setErr('');
    try {
      const code = generateCode();
      await api.createSession(name.trim(), facilitator.trim(), code);
      // Fetch full session data
      const data = await api.getFullSession(code);
      setBusy(false);
      onSessionReady(data.session);
    } catch (e) {
      setBusy(false);
      setErr(e.message || 'Gagal membuat sesi.');
    }
  }

  async function loadSession() {
    const code = existingCode.trim().toUpperCase();
    if (!code) return;
    setBusy(true);
    setErr('');
    try {
      const data = await api.getFullSession(code);
      setBusy(false);
      onSessionReady(data.session);
    } catch (e) {
      setBusy(false);
      setErr('Kode sesi tidak ditemukan.');
    }
  }

  return (
    <div className="max-w-lg mx-auto p-6">
      <button onClick={onBack} className="text-slate-500 flex items-center gap-1 text-sm mb-4 hover:text-slate-700"><ArrowLeft size={16} /> Kembali</button>
      <h2 className="text-xl font-bold text-slate-800 mb-4">Buat Sesi Workshop Baru</h2>
      <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
        <div>
          <label className="text-xs font-semibold text-slate-500">Nama Sesi / Proyek</label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="cth. PFMA Bypass TSF - Pani Gold Project"
            className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-400" />
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-500">Nama Fasilitator (opsional)</label>
          <input value={facilitator} onChange={(e) => setFacilitator(e.target.value)} placeholder="cth. Mirna"
            className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-400" />
        </div>
        {err && <div className="text-sm text-red-600 flex items-center gap-1"><AlertTriangle size={14} /> {err}</div>}
        <button disabled={busy} onClick={createSession} className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-2.5 rounded-lg">
          {busy ? 'Membuat...' : 'Buat Sesi'}
        </button>
      </div>

      <div className="text-center text-xs text-slate-400 my-4">— atau —</div>

      <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
        <label className="text-xs font-semibold text-slate-500">Lanjutkan sesi yang sudah ada (kode sesi)</label>
        <input value={existingCode} onChange={(e) => setExistingCode(e.target.value.toUpperCase())} placeholder="cth. K7X9QM" maxLength={6}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm tracking-widest font-mono text-slate-900 placeholder:text-slate-400" />
        <button disabled={busy} onClick={loadSession} className="w-full bg-slate-800 hover:bg-slate-900 text-white font-semibold py-2.5 rounded-lg">
          Lanjutkan Sesi
        </button>
      </div>
    </div>
  );
}

function ImportTab({ session, onUpdateSession }) {
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
        if (!parsed.length) { setFileErr('Tidak ada baris valid yang terbaca. Periksa header kolom Excel.'); return; }
        setPreview(parsed);
      } catch (e2) {
        setFileErr('Gagal membaca file. Pastikan formatnya .xlsx.');
      }
    };
    reader.readAsArrayBuffer(file);
  }

  async function confirmImport() {
    setBusy(true);
    try {
      await api.importFMs(session.code, preview);
      // Refresh session data
      const data = await api.getFullSession(session.code);
      onUpdateSession(data.session);
      setPreview(null);
      if (fileRef.current) fileRef.current.value = '';
    } catch (e) {
      setFileErr('Gagal mengimpor: ' + e.message);
    }
    setBusy(false);
  }

  return (
    <div className="space-y-4">
      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <div className="flex items-center gap-2 font-bold text-slate-800 mb-1"><FileSpreadsheet size={18} /> Import Daftar Failure Mode (.xlsx)</div>
        <p className="text-sm text-slate-500 mb-3">
          Kolom yang dikenali otomatis: FM No., Category, Potential Failure Mode, Main Trigger / Detailed Mechanism, Initiation,
          Continuation, Progression, Potential Detection / Monitoring, Possible Intervention / Risk Controls, Potential Effect / Consequence,
          PFMA Notes / Workshop Questions, Owner / Action.
        </p>
        <input ref={fileRef} type="file" accept=".xlsx,.xls" onChange={handleFile}
          className="block w-full text-sm text-slate-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-teal-50 file:text-teal-700 file:font-semibold hover:file:bg-teal-100" />
        {fileErr && <div className="text-sm text-red-600 mt-2 flex items-center gap-1"><AlertTriangle size={14} /> {fileErr}</div>}
      </div>

      {preview && (
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="font-bold text-slate-800 mb-2">Preview — {preview.length} failure mode terbaca</div>
          <div className="max-h-80 overflow-y-auto border border-slate-100 rounded-lg">
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
            <button onClick={() => setPreview(null)} className="px-4 py-2 text-slate-500 font-medium">Batal</button>
            <button disabled={busy} onClick={confirmImport} className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg">
              {busy ? 'Mengimpor...' : `Gunakan ${preview.length} Failure Mode Ini`}
            </button>
          </div>
        </div>
      )}

      {!preview && session.fmList.length > 0 && (
        <div className="text-sm text-slate-500">Sesi ini sudah memiliki <b>{session.fmList.length}</b> failure mode. Import ulang untuk mengganti daftar.</div>
      )}
    </div>
  );
}

function ControlTab({ session, onUpdateSession }) {
  async function setStatus(fmNo, status) {
    try {
      await api.updateFMStatus(session.code, fmNo, status);
      const fmStatus = { ...session.fmStatus, [fmNo]: status };
      onUpdateSession({ ...session, fmStatus });
    } catch (e) {
      console.error('Failed to update status:', e);
    }
  }

  async function bulkSet(status) {
    try {
      const items = session.fmList.map((fm) => ({ fmNo: fm.no, status }));
      await api.bulkUpdateFMStatus(session.code, items);
      const fmStatus = {};
      session.fmList.forEach((fm) => (fmStatus[fm.no] = status));
      onUpdateSession({ ...session, fmStatus });
    } catch (e) {
      console.error('Failed to bulk update status:', e);
    }
  }

  if (!session.fmList.length) {
    return <div className="text-slate-500 text-sm italic">Belum ada failure mode. Import daftar FM terlebih dahulu di tab &quot;Import FM&quot;.</div>;
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2 mb-2">
        <button onClick={() => bulkSet('open')} className="flex items-center gap-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-lg"><Unlock size={14} /> Buka Semua</button>
        <button onClick={() => bulkSet('locked')} className="flex items-center gap-1 px-3 py-1.5 bg-slate-600 hover:bg-slate-700 text-white text-sm font-semibold rounded-lg"><Lock size={14} /> Kunci Semua</button>
      </div>
      <div className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-100">
        {session.fmList.map((fm) => {
          const status = session.fmStatus[fm.no] || 'locked';
          return (
            <div key={fm.no} className="flex items-center justify-between p-3 gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <Badge color="blue">FM {fm.no}</Badge>
                  {fm.category && <Badge color="lime">{fm.category}</Badge>}
                  {status === 'open' && <Badge color="green">Terbuka</Badge>}
                  {status === 'closed' && <Badge color="red">Ditutup</Badge>}
                  {status === 'locked' && <Badge color="yellow">Terkunci</Badge>}
                </div>
                <div className="text-sm text-slate-700 truncate mt-1">{fm.title}</div>
              </div>
              <div className="flex gap-1.5 shrink-0">
                <button onClick={() => setStatus(fm.no, 'open')} title="Buka untuk voting"
                  className={`p-2 rounded-lg ${status === 'open' ? 'bg-green-600 text-white' : 'bg-slate-100 text-slate-500 hover:bg-green-100'}`}><Unlock size={15} /></button>
                <button onClick={() => setStatus(fm.no, 'locked')} title="Kunci sementara"
                  className={`p-2 rounded-lg ${status === 'locked' ? 'bg-yellow-500 text-white' : 'bg-slate-100 text-slate-500 hover:bg-yellow-100'}`}><Lock size={15} /></button>
                <button onClick={() => setStatus(fm.no, 'closed')} title="Tutup permanen (kunci hasil final)"
                  className={`px-2.5 rounded-lg text-xs font-semibold ${status === 'closed' ? 'bg-red-600 text-white' : 'bg-slate-100 text-slate-500 hover:bg-red-100'}`}>Final</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ResultsTab({ session, participants }) {
  const sorted = [...session.fmList].map((fm) => {
    const votes = participants.map((p) => {
      const v = p.votes?.[fm.no];
      if (!v) return null;
      return { ...v, experience: p.experience || 'beginner' };
    }).filter(Boolean);
    const n = votes.length;
    const avgL = weightedAvg(votes, 'likelihood');
    const avgS = weightedAvg(votes, 'severity');
    const avgD = weightedAvg(votes, 'detection');
    const rL = roundRating(avgL, 5), rS = roundRating(avgS, 5), rD = roundRating(avgD, 4);
    const rpn = rL && rS && rD ? rL * rS * rD : -1;
    return { fm, votes, rpn };
  }).sort((a, b) => b.rpn - a.rpn);

  const top = sorted.filter((x) => x.rpn > 0)[0];
  const totalVotesCast = participants.reduce((a, p) => a + Object.keys(p.votes || {}).length, 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={<Users size={18} />} label="Peserta Bergabung" value={participants.length} />
        <StatCard icon={<ClipboardList size={18} />} label="Total Failure Mode" value={session.fmList.length} />
        <StatCard icon={<CheckCircle2 size={18} />} label="Total Penilaian Masuk" value={totalVotesCast} />
        <StatCard icon={<Trophy size={18} />} label="RPN Tertinggi" value={top ? top.rpn : '-'} sub={top ? `FM ${top.fm.no}` : ''} />
      </div>

      <div className="space-y-3">
        {sorted.map(({ fm, votes }) => <FMResultCard key={fm.no} fm={fm} votes={votes} />)}
      </div>
    </div>
  );
}

function ExportTab({ session, participants }) {
  function buildRows() {
    return session.fmList.map((fm) => {
      const votes = participants.map((p) => {
        const v = p.votes?.[fm.no];
        if (!v) return null;
        return { ...v, experience: p.experience || 'beginner' };
      }).filter(Boolean);
      const n = votes.length;
      const avgL = weightedAvg(votes, 'likelihood');
      const avgS = weightedAvg(votes, 'severity');
      const avgD = weightedAvg(votes, 'detection');
      const rL = roundRating(avgL, 5), rS = roundRating(avgS, 5), rD = roundRating(avgD, 4);
      const rpn = rL && rS && rD ? rL * rS * rD : '';
      const cat = rpn ? rpnCategory(rpn).label : '';
      return {
        'FM No.': fm.no, 'Category': fm.category, 'Potential Failure Mode': fm.title,
        'Main Trigger / Detailed Mechanism': fm.mechanism, 'Initiation': fm.initiation, 'Continuation': fm.continuation,
        'Progression': fm.progression, 'Potential Detection / Monitoring': fm.detectionMonitoring,
        'Possible Intervention / Risk Controls': fm.intervention, 'Potential Effect / Consequence': fm.effect,
        'PFMA Notes / Workshop Questions': fm.notes,
        'Likelihood (Workshop)': rL || '', 'Likelihood Avg': avgL ? avgL.toFixed(2) : '',
        'Consequence (Workshop)': rS || '', 'Consequence Avg': avgS ? avgS.toFixed(2) : '',
        'Detection (Workshop)': rD || '', 'Detection Avg': avgD ? avgD.toFixed(2) : '',
        'Risk Priority (Workshop)': rpn, 'Risk Priority Category': cat,
        'Jumlah Responden': n, 'Owner / Action': fm.ownerAction,
      };
    });
  }

  function buildRawVotes() {
    const rows = [];
    participants.forEach((p) => {
      Object.entries(p.votes || {}).forEach(([fmNo, v]) => {
        rows.push({
          'FM No.': fmNo, 'Role Peserta': p.role, 'Experience': p.experience || 'beginner',
          'Nama Peserta': p.name || '(anonim)',
          'Likelihood': v.likelihood, 'Severity': v.severity, 'Detection': v.detection,
          'Waktu': new Date(v.ts).toLocaleString('id-ID'),
        });
      });
    });
    return rows;
  }

  function exportExcel() {
    const wb = XLSX.utils.book_new();
    const ws1 = XLSX.utils.json_to_sheet(buildRows());
    XLSX.utils.book_append_sheet(wb, ws1, 'FMEA Summary');
    const ws2 = XLSX.utils.json_to_sheet(buildRawVotes());
    XLSX.utils.book_append_sheet(wb, ws2, 'Raw Votes');
    XLSX.writeFile(wb, `PFMA_${slug(session.name)}_${session.code}.xlsx`);
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 text-center">
      <FileSpreadsheet size={40} className="mx-auto text-teal-600 mb-3" />
      <div className="font-bold text-slate-800 text-lg">Export Hasil Workshop</div>
      <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
        File Excel berisi sheet &quot;FMEA Summary&quot; (rata-rata, rating final, RPN, kategori) dan &quot;Raw Votes&quot; (data mentah tiap suara per peserta).
      </p>
      <button onClick={exportExcel} className="mt-4 inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold px-6 py-3 rounded-lg">
        <Download size={18} /> Download Excel (.xlsx)
      </button>
      <div className="mt-3">
        <button onClick={() => window.print()} className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-700 text-sm font-medium">
          <Printer size={15} /> Cetak / Simpan sebagai PDF halaman ini
        </button>
      </div>
    </div>
  );
}

function FacilitatorDashboard({ session, onUpdateSession, onExit }) {
  const [tab, setTab] = useState('import');
  const [participants, setParticipants] = useState([]);
  const [copied, setCopied] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const data = await api.getFullSession(session.code);
      onUpdateSession(data.session);
      setParticipants(data.participants);
    } catch (e) {
      console.error('Refresh error:', e);
    }
  }, [session.code]); // eslint-disable-line

  useEffect(() => {
    refresh();
    const t = setInterval(refresh, 5000);
    return () => clearInterval(t);
  }, [refresh]);

  function copyCode() {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(session.code).catch(() => {});
    } else {
      const ta = document.createElement('textarea');
      ta.value = session.code; document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); } catch (e) {}
      document.body.removeChild(ta);
    }
    setCopied(true); setTimeout(() => setCopied(false), 1500);
  }

  const tabs = [
    { id: 'import', label: 'Import FM', icon: <Upload size={15} /> },
    { id: 'control', label: 'Kontrol Sesi', icon: <Lock size={15} /> },
    { id: 'results', label: 'Hasil Live', icon: <BarChart3 size={15} /> },
    { id: 'export', label: 'Export', icon: <Download size={15} /> },
  ];

  return (
    <div className="max-w-5xl mx-auto p-5">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-5">
        <div>
          <button onClick={onExit} className="text-slate-400 flex items-center gap-1 text-xs mb-1 hover:text-slate-600"><ArrowLeft size={13} /> Keluar</button>
          <h2 className="text-xl font-bold text-slate-800">{session.name}</h2>
        </div>
        <button onClick={copyCode} className="flex items-center gap-2 bg-slate-800 text-white px-4 py-2.5 rounded-xl font-mono text-lg tracking-widest">
          {session.code} {copied ? <CheckCircle2 size={18} /> : <Copy size={16} />}
        </button>
      </div>

      <div className="flex gap-1 mb-4 bg-slate-100 p-1 rounded-xl w-fit flex-wrap">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-semibold ${tab === t.id ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}>
            {t.icon} {t.label}
          </button>
        ))}
        <button onClick={refresh} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-slate-400 hover:text-slate-600"><RefreshCw size={14} /></button>
      </div>

      {tab === 'import' && <ImportTab session={session} onUpdateSession={onUpdateSession} />}
      {tab === 'control' && <ControlTab session={session} onUpdateSession={onUpdateSession} />}
      {tab === 'results' && <ResultsTab session={session} participants={participants} />}
      {tab === 'export' && <ExportTab session={session} participants={participants} />}
    </div>
  );
}

// ---------------------------------------------------------------------------
// PARTICIPANT
// ---------------------------------------------------------------------------

function ParticipantJoin({ onBack, onJoined }) {
  const [code, setCode] = useState('');
  const [role, setRole] = useState('');
  const [experience, setExperience] = useState('');
  const [name, setName] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  async function join() {
    const c = code.trim().toUpperCase();
    if (!c) { setErr('Masukkan kode sesi.'); return; }
    if (!role) { setErr('Pilih role Anda.'); return; }
    if (!experience) { setErr('Pilih level pengalaman Anda.'); return; }
    setBusy(true);
    setErr('');
    try {
      // Verify session exists
      const sessionData = await api.getFullSession(c);

      // Generate participant key
      const participantKey = name.trim()
        ? `${slug(role)}__${slug(name)}`
        : `anon-${Math.random().toString(36).slice(2, 9)}`;

      // Join session
      await api.joinSession(c, participantKey, role, name.trim(), experience);

      setBusy(false);
      onJoined({
        session: sessionData.session,
        participant: {
          id: participantKey,
          role,
          experience,
          name: name.trim(),
          votes: {},
        },
      });
    } catch (e) {
      setBusy(false);
      setErr('Kode sesi tidak ditemukan. Cek kembali dengan fasilitator.');
    }
  }

  return (
    <div className="max-w-md mx-auto p-6">
      <button onClick={onBack} className="text-slate-500 flex items-center gap-1 text-sm mb-4 hover:text-slate-700"><ArrowLeft size={16} /> Kembali</button>
      <h2 className="text-xl font-bold text-slate-800 mb-4">Gabung Sesi Workshop</h2>
      <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3.5">
        <div>
          <label className="text-xs font-semibold text-slate-500">Kode Sesi</label>
          <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} maxLength={6} placeholder="cth. K7X9QM"
            className="w-full mt-1 px-3 py-2.5 border border-slate-300 rounded-lg text-lg tracking-widest font-mono text-center text-slate-900 placeholder:text-slate-400" />
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-500">Role / Background Anda</label>
          <select value={role} onChange={(e) => setRole(e.target.value)} className="w-full mt-1 px-3 py-2.5 border border-slate-300 rounded-lg text-sm bg-white text-slate-900">
            <option value="">-- Pilih Role --</option>
            {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-500">Experience in FMEA / Dam Engineering</label>
          <select value={experience} onChange={(e) => setExperience(e.target.value)} className="w-full mt-1 px-3 py-2.5 border border-slate-300 rounded-lg text-sm bg-white text-slate-900">
            <option value="">-- Pilih Level Pengalaman --</option>
            <option value="beginner">Beginner</option>
            <option value="experienced">Experienced</option>
            <option value="expert">Expert</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-500">Nama (opsional, membantu jika Anda perlu reload halaman)</label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="cth. Budi"
            className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-400" />
        </div>
        {err && <div className="text-sm text-red-600 flex items-center gap-1"><AlertTriangle size={14} /> {err}</div>}
        <button disabled={busy} onClick={join} className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-2.5 rounded-lg flex items-center justify-center gap-2">
          <LogIn size={17} /> {busy ? 'Menghubungkan...' : 'Gabung Sesi'}
        </button>
      </div>
    </div>
  );
}

function ParticipantMain({ initialSession, participant, onExit }) {
  const [session, setSession] = useState(initialSession);
  const [participants, setParticipants] = useState([]);
  const [votingFM, setVotingFM] = useState(null);
  const [tab, setTab] = useState('list');
  const [myVotes, setMyVotes] = useState(participant.votes || {});

  const refresh = useCallback(async () => {
    try {
      const data = await api.getFullSession(session.code);
      setSession(data.session);
      setParticipants(data.participants);

      // Update my votes from server data
      const me = data.participants.find((p) => p.id === participant.id);
      if (me) setMyVotes(me.votes || {});
    } catch (e) {
      console.error('Refresh error:', e);
    }
  }, [session.code, participant.id]);

  useEffect(() => {
    refresh();
    const t = setInterval(refresh, 5000);
    return () => clearInterval(t);
  }, [refresh]);

  async function handleSubmitVote(fm, vote) {
    try {
      await api.submitVote(session.code, participant.id, fm.no, vote.likelihood, vote.severity, vote.detection);
      const updatedVotes = { ...myVotes, [fm.no]: vote };
      setMyVotes(updatedVotes);
      setVotingFM(null);
      refresh();
    } catch (e) {
      console.error('Vote error:', e);
    }
  }

  const openable = (fm) => (session.fmStatus[fm.no] || 'locked') === 'open';

  return (
    <div className="max-w-3xl mx-auto p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <button onClick={onExit} className="text-slate-400 flex items-center gap-1 text-xs mb-1 hover:text-slate-600"><ArrowLeft size={13} /> Keluar</button>
          <h2 className="text-lg font-bold text-slate-800">{session.name}</h2>
          <div className="text-xs text-slate-400 flex items-center gap-1.5 flex-wrap">
            <span>Role:</span> <b className="text-slate-600">{participant.role}</b>
            {participant.experience && (
              <Badge color={participant.experience === 'expert' ? 'blue' : participant.experience === 'experienced' ? 'green' : 'yellow'}>
                {participant.experience === 'expert' ? 'Expert' : participant.experience === 'experienced' ? 'Experienced' : 'Beginner'}
              </Badge>
            )}
            {participant.name ? <span>· {participant.name}</span> : null}
          </div>
        </div>
        <button onClick={refresh} className="p-2 text-slate-400 hover:text-slate-600"><RefreshCw size={16} /></button>
      </div>

      <div className="flex gap-1 mb-4 bg-slate-100 p-1 rounded-xl w-fit">
        <button onClick={() => setTab('list')} className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-semibold ${tab === 'list' ? 'bg-white shadow text-slate-800' : 'text-slate-500'}`}><ClipboardList size={15} /> Daftar FM</button>
        <button onClick={() => setTab('results')} className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-semibold ${tab === 'results' ? 'bg-white shadow text-slate-800' : 'text-slate-500'}`}><BarChart3 size={15} /> Hasil Live</button>
      </div>

      {tab === 'list' && (
        <div className="space-y-2">
          {session.fmList.length === 0 && <div className="text-slate-400 italic text-sm">Fasilitator belum mengimpor daftar failure mode.</div>}
          {session.fmList.map((fm) => {
            const status = session.fmStatus[fm.no] || 'locked';
            const voted = !!myVotes[fm.no];
            return (
              <div key={fm.no} className={`bg-white border rounded-xl p-3.5 flex items-center justify-between gap-3 ${status === 'open' ? 'border-teal-300' : 'border-slate-200'}`}>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge color="blue">FM {fm.no}</Badge>
                    {fm.category && <Badge color="lime">{fm.category}</Badge>}
                    {status === 'locked' && <Badge color="yellow">Belum dibuka</Badge>}
                    {status === 'closed' && <Badge color="red">Ditutup</Badge>}
                    {voted && <Badge color="green"><CheckCircle2 size={11} /> Sudah dinilai</Badge>}
                  </div>
                  <div className="text-sm text-slate-700 truncate mt-1">{fm.title}</div>
                </div>
                <button
                  disabled={!openable(fm)}
                  onClick={() => setVotingFM(fm)}
                  className={`shrink-0 px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-1.5 ${
                    openable(fm) ? (voted ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' : 'bg-teal-600 text-white hover:bg-teal-700') : 'bg-slate-100 text-slate-300 cursor-not-allowed'
                  }`}
                >
                  {openable(fm) ? (voted ? 'Ubah' : 'Nilai') : <Lock size={14} />}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {tab === 'results' && <ResultsTab session={session} participants={participants} />}

      {votingFM && (
        <VotingForm fm={votingFM} existingVote={myVotes[votingFM.no]} onCancel={() => setVotingFM(null)}
          onSubmit={(vote) => handleSubmitVote(votingFM, vote)} />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// APP ROOT
// ---------------------------------------------------------------------------

export default function FMEAApp() {
  const [screen, setScreen] = useState('landing');
  const [session, setSession] = useState(null);
  const [participantInfo, setParticipantInfo] = useState(null);
  const [migrated, setMigrated] = useState(false);

  // Run migration on first load
  useEffect(() => {
    if (!migrated) {
      api.runMigration()
        .then(() => setMigrated(true))
        .catch((e) => console.error('Migration error (may already exist):', e));
    }
  }, [migrated]);

  return (
    <div className="min-h-screen bg-slate-50" style={{ fontFamily: 'ui-sans-serif, system-ui, sans-serif' }}>
      {screen === 'landing' && (
        <Landing onPickFacilitator={() => setScreen('facSetup')} onPickParticipant={() => setScreen('partJoin')} />
      )}

      {screen === 'facSetup' && (
        <FacilitatorSetup onBack={() => setScreen('landing')} onSessionReady={(s) => { setSession(s); setScreen('facDash'); }} />
      )}

      {screen === 'facDash' && session && (
        <FacilitatorDashboard session={session} onUpdateSession={setSession} onExit={() => { setSession(null); setScreen('landing'); }} />
      )}

      {screen === 'partJoin' && (
        <ParticipantJoin onBack={() => setScreen('landing')} onJoined={({ session: s, participant }) => { setSession(s); setParticipantInfo(participant); setScreen('partMain'); }} />
      )}

      {screen === 'partMain' && session && participantInfo && (
        <ParticipantMain initialSession={session} participant={participantInfo} onExit={() => { setSession(null); setParticipantInfo(null); setScreen('landing'); }} />
      )}
    </div>
  );
}
