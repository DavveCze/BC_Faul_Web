import React from 'react';
import { CheckCircle2, TrendingUp, Sparkles, RotateCcw, Sliders } from 'lucide-react';

interface WizardStepFinishedProps {
  sessionCode: string;
  susScore: number;
  certaintyDiff: number;
  onRestart: () => void;
  onGoToDemo: () => void;
}

export const WizardStepFinished: React.FC<WizardStepFinishedProps> = ({
  sessionCode,
  susScore,
  certaintyDiff,
  onRestart,
  onGoToDemo,
}) => {
  // Bangor et al. (2009) slovní interpretace SUS skóre dle Sekce 7.2 bpfaul.tex
  const getSusLabel = (score: number) => {
    if (score >= 85) return 'Vynikající (Excelentní)';
    if (score >= 71) return 'Dobrá (Přijatelná pro produkci)';
    if (score >= 51) return 'Hraniční (Vyžaduje zlepšení)';
    return 'Nízká (Těžkopádná)';
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-10 text-center space-y-8">
      <div className="inline-flex p-4 bg-emerald-50 rounded-full text-emerald-600">
        <CheckCircle2 className="w-12 h-12" />
      </div>

      <div>
        <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
          Úspěšně uloženo do výzkumného datasetu
        </span>
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 mt-3">
          Děkujeme za účast v pilotním testování!
        </h2>
        <p className="text-sm text-slate-600 mt-2 max-w-lg mx-auto">
          Vaše odpovědi byly bezpečně spárovány pod pseudonymním kódem{' '}
          <code className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 font-mono">
            {sessionCode}
          </code>
          .
        </p>
      </div>

      {/* Shrnutí individuálních metrik */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
        <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
          <span className="text-xs text-slate-500 font-semibold uppercase block">
            Vaše hodnocení použitelnosti (SUS)
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-ou-blue font-mono">{susScore}</span>
            <span className="text-xs text-slate-500">/ 100 bodů</span>
          </div>
          <p className="text-xs text-slate-600 font-medium pt-1">
            Standard: <strong className="text-slate-800">{getSusLabel(susScore)}</strong>
          </p>
        </div>

        <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
          <span className="text-xs text-slate-500 font-semibold uppercase block flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
            Změna rozhodovací jistoty (H2)
          </span>
          <div className="flex items-baseline gap-2">
            <span
              className={`text-3xl font-black font-mono ${
                certaintyDiff >= 0 ? 'text-emerald-600' : 'text-amber-600'
              }`}
            >
              {certaintyDiff >= 0 ? `+${certaintyDiff}` : certaintyDiff}
            </span>
            <span className="text-xs text-slate-500">bodů na škále 0–10</span>
          </div>
          <p className="text-xs text-slate-600 font-medium pt-1">
            {certaintyDiff > 0
              ? 'Doporučení přispěla ke zvýšení vaší jistoty o tématu.'
              : 'Jistota zůstala na srovnatelné úrovni jako před testem.'}
          </p>
        </div>
      </div>

      <div className="bg-ou-light/40 border border-ou-blue/20 rounded-xl p-4 text-xs text-slate-600 text-left space-y-1">
        <strong className="text-ou-blue block font-semibold flex items-center gap-1.5">
          <Sparkles className="w-4 h-4" />
          Jak data pomohou výzkumu:
        </strong>
        <p>
          Data z vašeho sezení budou v anonymizované podobě použita pro statistické vyhodnocení párového testu
          velikosti účinku (d_z) a analýzu použitelnosti v Kapitole 7 bakalářské práce Davida Faula.
        </p>
      </div>

      <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-center gap-3">
        <button
          onClick={onRestart}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl text-sm transition"
        >
          <RotateCcw className="w-4 h-4" />
          Zahájit nové testování
        </button>

        <button
          onClick={onGoToDemo}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-ou-blue hover:bg-ou-dark text-white font-semibold rounded-xl text-sm transition shadow"
        >
          <Sliders className="w-4 h-4" />
          Vyzkoušet Demo Sandbox (volné zkoušení vah)
        </button>
      </div>
    </div>
  );
};
