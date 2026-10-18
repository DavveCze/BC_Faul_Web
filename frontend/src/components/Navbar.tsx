import React from 'react';
import { Compass, Sliders, Database, BookOpen } from 'lucide-react';

interface NavbarProps {
  currentTab: 'wizard' | 'demo' | 'admin';
  setCurrentTab: (tab: 'wizard' | 'demo' | 'admin') => void;
  sessionCode: string | null;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, setCurrentTab, sessionCode }) => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-ou-blue flex items-center justify-center text-white font-bold text-xl shadow">
              OU
            </div>
            <div>
              <div className="text-xs uppercase tracking-wider font-semibold text-ou-blue">
                Ostravská univerzita • PřF KIP
              </div>
              <h1 className="text-base sm:text-lg font-bold text-slate-800 leading-tight">
                Doporučovací systém závěrečných prací
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            {sessionCode && (
              <div className="hidden md:flex items-center gap-1.5 px-3 py-1 bg-slate-100 border border-slate-200 rounded-full text-xs font-mono text-slate-600">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Kód: <strong className="text-slate-800">{sessionCode}</strong>
              </div>
            )}

            <nav className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => setCurrentTab('wizard')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition ${
                  currentTab === 'wizard'
                    ? 'bg-white text-ou-blue shadow-sm font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Compass className="w-4 h-4" />
                <span className="hidden sm:inline">Výzkumný průvodce</span>
                <span className="sm:hidden">Průvodce</span>
              </button>

              <button
                onClick={() => setCurrentTab('demo')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition ${
                  currentTab === 'demo'
                    ? 'bg-white text-ou-blue shadow-sm font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Sliders className="w-4 h-4" />
                <span>Demo Sandbox</span>
              </button>

              <button
                onClick={() => setCurrentTab('admin')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition ${
                  currentTab === 'admin'
                    ? 'bg-white text-ou-blue shadow-sm font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Database className="w-4 h-4" />
                <span className="hidden sm:inline">Správa & Export</span>
                <span className="sm:hidden">Admin</span>
              </button>
            </nav>
          </div>
        </div>
      </div>
    </header>
  );
};
