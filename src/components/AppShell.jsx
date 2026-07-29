'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserButton, useUser } from '@clerk/nextjs';
import { Globe, HardHat, Menu, X } from 'lucide-react';
import { t } from '@/lib/i18n';

// Language context for bilingual support
const LangContext = createContext({ lang: 'id', setLang: () => {} });

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
  const { user } = useUser();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-700/50 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
          {/* Logo + Brand */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-gradient-to-br from-teal-400 to-emerald-500 rounded-lg shadow-sm">
                <HardHat size={18} className="text-white" />
              </div>
              <div className="hidden sm:block">
                <div className="text-white font-bold text-sm leading-tight tracking-wide">
                  {t(lang, 'app.company')}
                </div>
                <div className="text-slate-400 text-[10px] uppercase tracking-widest leading-tight">
                  {t(lang, 'app.name')}
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
          <span className="hidden sm:inline">Merdeka Risk & Opportunity Matrix v1</span>
        </div>
      </footer>
    </div>
  );
}
