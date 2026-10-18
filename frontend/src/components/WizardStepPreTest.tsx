import React, { useState } from 'react';
import { UserCheck, HelpCircle, ArrowRight, ArrowLeft } from 'lucide-react';
import { PreTestData } from '../types';

interface WizardStepPreTestProps {
  sessionCode: string;
  onSubmit: (data: PreTestData) => void;
  isLoading: boolean;
  onBack: () => void;
}

export const WizardStepPreTest: React.FC<WizardStepPreTestProps> = ({
  sessionCode,
  onSubmit,
  isLoading,
  onBack,
}) => {
  const [studyProgram, setStudyProgram] = useState('Aplikovaná informatika (Bc.)');
  const [studyYear, setStudyYear] = useState('2. ročník Bc.');
  const [studyForm, setStudyForm] = useState('Prezenční');
  const [gender, setGender] = useState('Preferuji neuvádět');
  const [age, setAge] = useState<number>(21);
  const [thesisState, setThesisState] = useState('Nemám ještě téma');
  const [selectionMethod, setSelectionMethod] = useState('Zatím téma nemám vybrané');
  
  // Klíčová položka pro párové testování H2 (0 až 10)
  const [certaintyPre, setCertaintyPre] = useState<number>(4);

  // Položky Bloku C - Výzkumná sebeúčinnost pro I_eff (H1)
  const [blockC, setBlockC] = useState<Record<string, number>>({
    c1: 0, // Věřím, že dokážu vyhledat a analyzovat odbornou literaturu k tématu
    c2: 0, // Dokážu samostatně formulovat cíl a metodiku své závěrečné práce
    c3: 0, // Věřím, že zvládnu praktickou implementaci softwarového artefaktu či analýzy
    c4: 0, // Zvládnu statistické nebo experimentální vyhodnocení dosažených výsledků
    c5: 0, // [Reverzní] Obávám se, že náročnost metodologie přesáhne mé dosavadní schopnosti
    c6: 0, // [Reverzní] Nejistota v mých dovednostech mi výběr tématu výrazně komplikuje
    c7: 0, // Dokážu efektivně rozvrhnout čas a dokončit bakalářskou práci v termínu
  });

  const isInCompleted = Object.values(blockC).every((val) => val > 0);

  

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      session_code: sessionCode,
      study_program: studyProgram,
      study_year: studyYear,
      study_form: studyForm,
      gender,
      age: Number(age) || 21,
      current_thesis_state: thesisState,
      selection_method: selectionMethod,
      decision_certainty_pre: Number(certaintyPre),
      self_efficacy_score: 0.5, // Backend přepočte přesně z block_c
      responses_block_a_g: {
        block_c: blockC,
      },
    });
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl mx-auto bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-10 space-y-8">
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-ou-blue mb-1">
          <UserCheck className="w-4 h-4" />
          Krok 1 z 4 • Vstupní orientace
        </div>
        <h2 className="text-2xl font-bold text-slate-800">
          Očekávání a vaše výchozí představa o tématu
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Nejprve zjistíme vaše studijní zaměření a to, jak jasnou představu o závěrečné práci v tuto chvíli máte.
        </p>
      </div>

      {/* Demografie */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
            Studijní program / obor
          </label>
          <select
            value={studyProgram}
            onChange={(e) => {
              const val = e.target.value;
              setStudyProgram(val);
              // Synchronizujeme výchozí ročník se změnou programu,
              // aby hodnota vždy odpovídala některé z možností selectu.
              setStudyYear(val === 'Informatika (nMgr.)' ? '1. ročník nMgr.' : '1. ročník Bc.');
            }}
            className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-sm focus:ring-ou-blue focus:border-ou-blue"
          >
            <option>Aplikovaná informatika (Bc.)</option>
            <option>Informatika ve vzdělávání (Bc.)</option>
            <option>Informační technologie (Bc.)</option>
            <option>Informatika (nMgr.)</option>
            <option>Jiný obor PřF OU</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
            Ročník studia
          </label>
          <select
            value={studyYear}
            onChange={(e) => setStudyYear(e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-sm focus:ring-ou-blue focus:border-ou-blue"
          >
            {studyProgram === 'Informatika (nMgr.)' ? (
              <>
                <option>1. ročník nMgr.</option>
                <option>2. ročník nMgr.</option>
              </>
            ) : studyProgram === 'Jiný obor PřF OU' ? (
              <>
                <option>1. ročník Bc.</option>
                <option>2. ročník Bc.</option>
                <option>3. ročník Bc.</option>
                <option>1. ročník nMgr.</option>
                <option>2. ročník nMgr.</option>
              </>
            ) : (
              <>
                <option>1. ročník Bc.</option>
                <option>2. ročník Bc.</option>
                <option>3. ročník Bc.</option>
              </>
            )}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
            Forma studia
          </label>
          <select
            value={studyForm}
            onChange={(e) => setStudyForm(e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-sm focus:ring-ou-blue focus:border-ou-blue"
          >
            <option>Prezenční</option>
            <option>Kombinovaná</option>
            <option>Distancní</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
            Aktuální stav závěrečné práce
          </label>
          <select
            value={thesisState}
            onChange={(e) => setThesisState(e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-sm focus:ring-ou-blue focus:border-ou-blue"
          >
            <option>Nemám ještě téma (tápu / hledám směr)</option>
            <option>Mám téma, ale nezačal/a jsem psát</option>
            <option>Pracuji na závěrečné práci</option>
            <option>Téma vybírám orientačně</option>
          </select>
        </div>
      </div>

      {(thesisState === 'Pracuji na závěrečné práci' || thesisState === 'Mám téma, ale nezačal/a jsem psát') && (
        <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start gap-2.5">
          <span className="text-base flex-shrink-0">💡</span>
          <div>
            <strong className="block font-semibold mb-0.5">Tip pro vás:</strong>
            Tento systém je určen primárně pro studenty, kteří téma teprve hledají a potřebují se zorientovat. 
            Můžete jej však využít pro inspiraci a ověření, jak vámi zvolený směr rezonuje s vaším profilem zájmů.
          </div>
        </div>
      )}

      {/* Primární položka: Rozhodovací jistota před použitím */}
      <div className="bg-ou-light/50 border border-ou-blue/20 rounded-2xl p-5 sm:p-6 space-y-3">
        <div className="flex items-center justify-between">
          <label className="font-bold text-slate-800 text-sm sm:text-base flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-ou-blue" />
            Máte v tuto chvíli jasno, o jakém tématu chcete psát svou bakalářskou práci?
          </label>
          <span className="text-2xl font-black text-ou-blue font-mono px-3 py-1 bg-white rounded-lg border border-ou-blue/20 shadow-sm">
            {certaintyPre} / 10
          </span>
        </div>
        <p className="text-xs text-slate-600">
          Zvolte na škále od 0 (vůbec netuším, tápu) po 10 (mám naprosto konkrétní a vybrané téma).
        </p>
        <input
          type="range"
          min="0"
          max="10"
          step="1"
          value={certaintyPre}
          onChange={(e) => setCertaintyPre(Number(e.target.value))}
          className="w-full h-2.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-ou-blue"
        />
        <div className="flex justify-between text-[11px] text-slate-500 font-medium">
          <span>0 - Vůbec netuším</span>
          <span>5 - Mám pár nápadů, ale váhám</span>
          <span>10 - Mám naprosto jasno</span>
        </div>
      </div>

      {/* Sebedůvěra a očekávání od zpracování práce */}
      <div className="space-y-4">
        <div className="border-b border-slate-200 pb-2">
          <h3 className="text-base font-bold text-slate-800">
            Sebedůvěra a očekávání od zpracování práce
          </h3>
          <p className="text-xs text-slate-500">
            Ohodnoťte svá očekávání: 1 = Rozhodně nesouhlasím až 5 = Rozhodně souhlasím.
          </p>
        </div>

        <div className="space-y-3 text-sm">
          {[
            { id: 'c1', text: 'Věřím, že dokážu vyhledat a porozumět odborné literatuře a zdrojům k tématu.' },
            { id: 'c2', text: 'Dokážu samostatně zformulovat cíl a plán své závěrečné práce.' },
            { id: 'c3', text: 'Věřím, že zvládnu praktickou realizaci softwarového řešení či analýzy.' },
            { id: 'c4', text: 'Zvládnu experimentální nebo statistické vyhodnocení dosažených výsledků.' },
            { id: 'c5', text: 'Mám obavu, zda zvládnu metodologickou a teoretickou náročnost tématu.' },
            { id: 'c6', text: 'Při volbě tématu vnímám nejistotu ohledně svých technických dovedností.' },
            { id: 'c7', text: 'Dokážu efektivně rozvrhnout čas a dokončit bakalářskou práci v termínu.' },
          ].map((item) => (
            <div key={item.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <span className="text-slate-700 font-medium leading-snug flex-1">
                {item.text}
              </span>
              <div className="flex items-center gap-1.5 self-end sm:self-center">
                {[1, 2, 3, 4, 5].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setBlockC((prev) => ({ ...prev, [item.id]: val }))}
                    className={`w-8 h-8 rounded-lg text-xs font-bold transition ${
                      blockC[item.id] === val
                        ? 'bg-ou-blue text-white shadow-sm'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {val}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="pt-4 border-t border-slate-200 flex justify-between items-center">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2.5 text-slate-600 hover:text-slate-900 font-medium text-sm transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Zpět k souhlasu
        </button>

        <button
          type="submit"
          disabled={isLoading || isInCompleted === false}
          className="flex items-center gap-2 px-6 py-3 bg-ou-blue hover:bg-ou-dark text-white font-semibold rounded-xl transition shadow disabled:opacity-50"
        >
          {isLoading ? 'Ukládám...' : 'Pokračovat k profilu'}
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </form>
  );
};
