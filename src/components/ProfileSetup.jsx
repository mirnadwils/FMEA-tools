'use client';

import React, { useState } from 'react';
import { User, Save } from 'lucide-react';
import { t, PROFESSIONAL_ROLES, EXPERIENCE_LEVELS } from '@/lib/i18n';
import { useLang } from './AppShell';

export default function ProfileSetup({ onComplete, initialProfile }) {
  const { lang } = useLang();
  const [roleKey, setRoleKey] = useState(initialProfile?.professionalRoleKey || '');
  const [customRole, setCustomRole] = useState(initialProfile?.customRoleText || '');
  const [experience, setExperience] = useState(initialProfile?.experienceLevel || '');
  const [preferredLang, setPreferredLang] = useState(lang);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (!roleKey) { setErr(lang === 'id' ? 'Pilih peran profesional.' : 'Select a professional role.'); return; }
    if (!experience) { setErr(lang === 'id' ? 'Pilih tingkat pengalaman.' : 'Select experience level.'); return; }
    setBusy(true);
    setErr('');

    try {
      await onComplete({
        professionalRoleKey: roleKey,
        customRoleText: roleKey === 'other' ? customRole : null,
        experienceLevel: experience,
        preferredLanguage: preferredLang,
      });
    } catch (e) {
      setErr(e.message);
    }
    setBusy(false);
  }

  return (
    <div className="max-w-lg mx-auto p-6">
      <div className="text-center mb-6">
        <div className="inline-flex p-3 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-2xl text-white mb-3 shadow-lg">
          <User size={28} />
        </div>
        <h2 className="text-2xl font-bold text-slate-800">{t(lang, 'profile.title')}</h2>
      </div>

      <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-2xl p-6 space-y-5 shadow-sm">
        {/* Professional Role */}
        <div>
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t(lang, 'profile.role')}</label>
          <select
            value={roleKey}
            onChange={(e) => setRoleKey(e.target.value)}
            className="w-full mt-1.5 px-3 py-2.5 border border-slate-300 rounded-xl text-sm bg-white text-slate-900 focus:ring-2 focus:ring-teal-400 focus:border-teal-400 transition-all"
          >
            <option value="">{lang === 'id' ? '-- Pilih Peran --' : '-- Select Role --'}</option>
            {PROFESSIONAL_ROLES.map((r) => (
              <option key={r.key} value={r.key}>{r.label[lang]}</option>
            ))}
          </select>
          {roleKey === 'other' && (
            <input
              value={customRole}
              onChange={(e) => setCustomRole(e.target.value)}
              placeholder={lang === 'id' ? 'Tuliskan peran Anda...' : 'Describe your role...'}
              className="w-full mt-2 px-3 py-2 border border-slate-300 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-teal-400"
            />
          )}
        </div>

        {/* Experience Level */}
        <div>
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t(lang, 'profile.experience')}</label>
          <div className="mt-2 space-y-2">
            {EXPERIENCE_LEVELS.map((exp) => (
              <label
                key={exp.key}
                className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                  experience === exp.key
                    ? 'border-teal-400 bg-teal-50 ring-2 ring-teal-200'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="experience"
                  value={exp.key}
                  checked={experience === exp.key}
                  onChange={(e) => setExperience(e.target.value)}
                  className="mt-0.5 accent-teal-600"
                />
                <div>
                  <div className="font-bold text-sm text-slate-800">{exp.label[lang]}</div>
                  <div className="text-xs text-slate-500">{exp.description[lang]}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    {lang === 'id' ? 'Bobot' : 'Weight'}: {exp.weight}
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Language Preference */}
        <div>
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t(lang, 'profile.language')}</label>
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={() => setPreferredLang('id')}
              className={`flex-1 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                preferredLang === 'id'
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              🇮🇩 Bahasa Indonesia
            </button>
            <button
              type="button"
              onClick={() => setPreferredLang('en')}
              className={`flex-1 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                preferredLang === 'en'
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              🇬🇧 English
            </button>
          </div>
        </div>

        {err && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-3">{err}</div>
        )}

        <button
          type="submit"
          disabled={busy}
          className="w-full bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all disabled:opacity-50"
        >
          <Save size={17} />
          {busy ? (t(lang, 'common.saving')) : t(lang, 'profile.save')}
        </button>
      </form>
    </div>
  );
}
