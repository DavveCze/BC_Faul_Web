import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { WizardPage } from './pages/WizardPage';
import { DemoSandboxPage } from './pages/DemoSandboxPage';
import { AdminPanelPage } from './pages/AdminPanelPage';

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<'wizard' | 'demo' | 'admin'>('wizard');
  const [sessionCode, setSessionCode] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900">
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        sessionCode={sessionCode}
      />

      <main className="flex-1">
        {currentTab === 'wizard' && (
          <WizardPage
            sessionCode={sessionCode}
            setSessionCode={setSessionCode}
            onGoToDemo={() => setCurrentTab('demo')}
          />
        )}

        {currentTab === 'demo' && <DemoSandboxPage />}

        {currentTab === 'admin' && <AdminPanelPage />}
      </main>

      <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 space-y-1">
          <p className="font-semibold text-slate-700">
            Doporučovací systém pro výběr závěrečné práce • DSR Artefakt (2027)
          </p>
          <p>
            Autor: <strong>David Faul</strong> | Vedoucí práce: <strong>doc. RNDr. PaedDr. Hashim Habiballa, PhD., Ph.D.</strong>
          </p>
          <p className="text-[11px] text-slate-400">
            Katedra informatiky a počítačů • Přírodovědecká fakulta • Ostravská univerzita
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;
