import React, { useState } from 'react';
import { ShieldCheck, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';

interface WizardStepGdprProps {
  onAccept: () => void;
  isLoading: boolean;
}

export const WizardStepGdpr: React.FC<WizardStepGdprProps> = ({ onAccept, isLoading }) => {
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState(false);

  const handleStart = () => {
    if (!agreed) {
      setError(true);
      return;
    }
    setError(false);
    onAccept();
  };

  return (
    <div className="max-w-3xl mx-auto bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-10">
      <div className="flex items-center gap-3 text-ou-blue mb-4">
        <div className="p-3 bg-ou-light rounded-xl">
          <ShieldCheck className="w-8 h-8 text-ou-blue" />
        </div>
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-ou-blue">
            Výzkumný pilotní experiment
          </span>
          <h2 className="text-2xl font-bold text-slate-800">
            Úvodní informace a etický souhlas
          </h2>
        </div>
      </div>

      <div className="prose prose-slate text-sm sm:text-base leading-relaxed text-slate-600 space-y-4 my-6">
        <p>
          Vítejte v pilotním testování doporučovacího systému pro výběr témat závěrečných prací 
          na <strong>Katedře informatiky a počítačů Přírodovědecké fakulty Ostravské univerzity</strong>.
          Tento software vzniká jako výzkumný artefakt v rámci bakalářské práce <em>Davida Faula </em>
          pod vedením <em>doc. RNDr. PaedDr. Hashima Habibally, PhD., Ph.D.</em>
        </p>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 sm:p-5 text-sm space-y-2">
          <h3 className="font-semibold text-slate-800 flex items-center gap-2">
            Zásady ochrany osobních údajů a anonymita (GDPR):
          </h3>
          <ul className="list-disc list-inside space-y-1 text-slate-600 pl-2">
            <li>Systém <strong>nesbírá žádná jména, kontakty ani rodná či studentská čísla</strong>.</li>
            <li>Vaše odpovědi jsou uloženy pod náhodně vygenerovaným <strong>pseudonymním kódem sezení</strong> (např. <code>STU-ABC1234</code>).</li>
            <li>Kód slouží výhradně ke spárování měření před a po použití systému pro ověření výzkumných hypotéz.</li>
            <li>Data budou uchována v anonymizované podobě na zabezpečeném univerzitním úložišti do 31. 12. 2027 a využita pouze pro vědecké účely.</li>
          </ul>
        </div>

        <p className="text-xs text-slate-500">
          Účast ve studii je zcela dobrovolná a můžete ji kdykoliv bez udání důvodu přerušit. 
          Celý proces (pre-test, profil a doporučení, post-test) zabere přibližně <strong>8–10 minut</strong>.
        </p>
      </div>

      <div className="pt-4 border-t border-slate-200">
        <label className="flex items-start gap-3 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => {
              setAgreed(e.target.checked);
              if (e.target.checked) setError(false);
            }}
            className="mt-1 w-5 h-5 rounded border-slate-300 text-ou-blue focus:ring-ou-blue"
          />
          <span className="text-sm sm:text-base font-medium text-slate-800">
            Souhlasím s výše uvedenými podmínkami a potvrzuji, že jsem byl/a informován/a o účelu 
            a způsobu zpracování dat v anonymizované podobě.
          </span>
        </label>

        {error && (
          <div className="mt-3 flex items-center gap-2 text-rose-600 text-sm">
            <AlertCircle className="w-4 h-4" />
            Pro pokračování je nutné potvrdit etický souhlas.
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <button
            onClick={handleStart}
            disabled={isLoading || !agreed}
            type="button"
            
            className="flex items-center gap-2 px-6 py-3 bg-ou-blue hover:bg-ou-dark text-white font-semibold rounded-xl transition shadow disabled:opacity-50"
          >
            {isLoading ? 'Inicializuji sezení...' : 'Vstoupit do výzkumu'}
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
