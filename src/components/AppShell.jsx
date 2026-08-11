'use client';

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { UserButton, useUser } from '@clerk/nextjs';
import { Globe, HardHat, Menu, X, ChevronDown, Save, CheckCircle2 } from 'lucide-react';
import { t, PROFESSIONAL_ROLES, EXPERIENCE_LEVELS } from '@/lib/i18n';
import { updateProfile } from '@/lib/api';

// Language context for bilingual support
const LangContext = createContext({ lang: 'id', setLang: () => { } });

export function useLang() {
  return useContext(LangContext);
}

export function LangProvider({ children, initialLang = 'id' }) {
  const [lang, setLang] = useState(initialLang);

  useEffect(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('fmea_lang') : null;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (saved) setLang(saved);
  }, []);

  function changeLang(newLang) {
    setLang(newLang);
    if (typeof window !== 'undefined') localStorage.setItem('fmea_lang', newLang);
  }

  return (
    <LangContext.Provider value={{ lang, setLang: changeLang }}>
      {children}
    </LangContext.Provider>
  );
}

export default function AppShell({ sessionName, children }) {
  const { lang, setLang } = useLang();
  const { user, isLoaded } = useUser();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profile, setProfile] = useState(null);
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const [editRole, setEditRole] = useState('');
  const [editExperience, setEditExperience] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const dropdownRef = useRef(null);
  
  // Fetch profile to get role and experience
  useEffect(() => {
    if (isLoaded && user) {
      fetch('/api/me')
        .then(res => res.json())
        .then(data => {
          if (!data.error) setProfile(data);
        })
        .catch(console.error);
    }
  }, [isLoaded, user]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowProfileEdit(false);
      }
    }
    if (showProfileEdit) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showProfileEdit]);

  function openProfileEdit() {
    setEditRole(profile?.professional_role_key || '');
    setEditExperience(profile?.experience_level || '');
    setSaved(false);
    setShowProfileEdit(true);
  }

  async function handleSaveProfile() {
    if (!editRole || !editExperience) return;
    setSaving(true);
    try {
      const updated = await updateProfile({
        professionalRoleKey: editRole,
        experienceLevel: editExperience,
      });
      setProfile(prev => ({
        ...prev,
        professional_role_key: editRole,
        experience_level: editExperience,
      }));
      setSaved(true);
      setTimeout(() => {
        setShowProfileEdit(false);
        setSaved(false);
      }, 1200);
    } catch (e) {
      alert(e.message);
    }
    setSaving(false);
  }

  // Format role key for display
  const displayRole = profile?.professional_role_key
    ? PROFESSIONAL_ROLES.find(r => r.key === profile.professional_role_key)?.label[lang]
      || profile.professional_role_key.replace(/_/g, ' ')
    : null;

  const displayExp = profile?.experience_level
    ? EXPERIENCE_LEVELS.find(e => e.key === profile.experience_level)?.label[lang]
      || profile.experience_level
    : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-700/50 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
          {/* Logo + Brand */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 bg-white rounded-lg p-1 overflow-hidden shadow-sm flex items-center justify-center shrink-0">
                <img src="/logo.png" alt="SGO Logo" className="h-full w-auto object-contain" />
              </div>
              <div className="hidden sm:block">
                <div className="text-white font-bold text-sm leading-tight tracking-wide">
                  PT Solusi Geotek Optima
                </div>
                <div className="text-teal-400 text-[10px] uppercase tracking-widest leading-tight font-bold">
                  FMEA Workshop
                </div>
              </div>
            </div>

            {sessionName && (
              <>
                <div className="hidden sm:block w-px h-6 bg-slate-600" />
                <div className="text-teal-300 font-semibold text-sm truncate max-w-[200px]">
                  {sessionName}
                </div>
              </>
            )}
          </div>

          {/* Right side: Language + Profile + User */}
          <div className="flex items-center gap-2">
            {/* Language toggle */}
            <button
              onClick={() => setLang(lang === 'id' ? 'en' : 'id')}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-all text-xs font-semibold"
              title={lang === 'id' ? 'Switch to English' : 'Ganti ke Bahasa Indonesia'}
            >
              <Globe size={14} />
              <span className="uppercase">{lang === 'id' ? 'EN' : 'ID'}</span>
            </button>

            {/* Profile Info — Clickable to edit */}
            {profile && profile.professional_role_key && (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={openProfileEdit}
                  className="hidden md:flex flex-col items-end justify-center mr-2 text-right px-2.5 py-1 rounded-lg hover:bg-slate-800 transition-all cursor-pointer group"
                  title={lang === 'id' ? 'Klik untuk ubah profil' : 'Click to edit profile'}
                >
                  <div className="text-xs text-white font-bold capitalize flex items-center gap-1">
                    {displayRole}
                    <ChevronDown size={10} className="text-slate-400 group-hover:text-teal-400 transition-colors" />
                  </div>
                  <div className="text-[10px] text-teal-400 uppercase tracking-wider font-semibold">
                    {displayExp}
                  </div>
                </button>

                {/* Edit Dropdown */}
                {showProfileEdit && (
                  <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 p-5 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    <h4 className="font-bold text-slate-800 text-sm mb-4">
                      {lang === 'id' ? 'Edit Profil' : 'Edit Profile'}
                    </h4>

                    {/* Role Selector */}
                    <div className="mb-4">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        {t(lang, 'profile.role')}
                      </label>
                      <select
                        value={editRole}
                        onChange={(e) => setEditRole(e.target.value)}
                        className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white text-slate-900 focus:ring-2 focus:ring-teal-400 focus:border-teal-400 transition-all"
                      >
                        <option value="">{lang === 'id' ? '-- Pilih --' : '-- Select --'}</option>
                        {PROFESSIONAL_ROLES.map((r) => (
                          <option key={r.key} value={r.key}>{r.label[lang]}</option>
                        ))}
                      </select>
                    </div>

                    {/* Experience Level */}
                    <div className="mb-4">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        {t(lang, 'profile.experience')}
                      </label>
                      <div className="mt-1.5 space-y-1.5">
                        {EXPERIENCE_LEVELS.map((exp) => (
                          <label
                            key={exp.key}
                            className={`flex items-center gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-all text-sm ${
                              editExperience === exp.key
                                ? 'border-teal-400 bg-teal-50 ring-1 ring-teal-200'
                                : 'border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            <input
                              type="radio"
                              name="header_exp"
                              value={exp.key}
                              checked={editExperience === exp.key}
                              onChange={(e) => setEditExperience(e.target.value)}
                              className="accent-teal-600"
                            />
                            <div className="flex-1">
                              <span className="font-semibold text-slate-800">{exp.label[lang]}</span>
                              <span className="text-[10px] text-slate-400 ml-1.5">
                                ({lang === 'id' ? 'Bobot' : 'Weight'}: {exp.weight})
                              </span>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Save */}
                    <button
                      disabled={saving || !editRole || !editExperience}
                      onClick={handleSaveProfile}
                      className="w-full bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-bold py-2 rounded-xl flex items-center justify-center gap-2 text-sm transition-all disabled:opacity-50"
                    >
                      {saved ? (
                        <><CheckCircle2 size={14} /> {lang === 'id' ? 'Tersimpan!' : 'Saved!'}</>
                      ) : saving ? (
                        t(lang, 'common.saving')
                      ) : (
                        <><Save size={14} /> {lang === 'id' ? 'Simpan' : 'Save'}</>
                      )}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Clerk user button */}
            {user && (
              <UserButton
                appearance={{
                  elements: {
                    avatarBox: 'w-8 h-8',
                  },
                }}
              />
            )}

            {/* Mobile menu toggle */}
            <button
              className="sm:hidden p-1.5 text-slate-300 hover:text-white"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white/50 py-3">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between text-xs text-slate-400">
          <span>© {new Date().getFullYear()} PT Solusi Geotek Optima</span>
          <span className="hidden sm:inline">FMEA Workshop</span>
        </div>
      </footer>
    </div>
  );
}
