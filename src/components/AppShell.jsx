'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserButton, useUser } from '@clerk/nextjs';
import { Globe, HardHat, Menu, X } from 'lucide-react';
import { t } from '@/lib/i18n';

// Language context for bilingual support
const LangContext = createContext({ lang: 'id', setLang: () => { } });

export function useLang() {
  return useContext(LangContext);
}

export function LangProvider({ children, initialLang = 'id' }) {
  const [lang, setLang] = useState(initialLang);

  useEffect(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('fmea_lang') : null;
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

          {/* Right side: Language + User */}
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

            {/* Profile Info */}
            {profile && profile.professional_role_key && (
               <div className="hidden md:flex flex-col items-end justify-center mr-2 text-right">
                  <div className="text-xs text-white font-bold capitalize">
                    {profile.professional_role_key.replace('_', ' ')}
                  </div>
                  <div className="text-[10px] text-teal-400 uppercase tracking-wider font-semibold">
                    {profile.experience_level}
                  </div>
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
