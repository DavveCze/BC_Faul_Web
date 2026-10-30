import React, { useState } from 'react';
import { CheckSquare, HelpCircle, ArrowRight, ArrowLeft, AlertCircle } from 'lucide-react';
import { PostTestData } from '../types';

interface WizardStepPostTestProps {
  sessionCode: string;
  onSubmit: (data: PostTestData) => void;
  isLoading: boolean;
  onBack: () => void;
}

export const WizardStepPostTest: React.FC<WizardStepPostTestProps> = ({
  sessionCode,
  onSubmit,
  isLoading,
  onBack,
}) => {
  // Primární měření H2: jistota po použití (0 až 10) - výchozí stav prázdný
  const [certaintyPost, setCertaintyPost] = useState<number | null>(null);

  // 10 položek SUS škály (Brooke 1996) - výchozí stav prázdný
  const [susScores, setSusScores] = useState<Record<string, number>>({});

  // 6 položek TAM vnímané užitečnosti (Davis 1989) - výchozí stav prázdný
  const [tamScores, setTamScores] = useState<Record<string, number>>({});

  // Hodnocení srozumitelnosti vysvětlení a relevance - výchozí stav prázdný
  const [explanationClarity, setExplanationClarity] = useState<number | null>(null);
  const [topicRelevance, setTopicRelevance] = useState<number | null>(null);
  const [feedbackComment, setFeedbackComment] = useState<string>('');
  const [showValidationWarning, setShowValidationWarning] = useState<boolean>(false);

  const susQuestions = [
    { id: 'sus_1', text: '1. Myslím, že bych tento doporučovací systém rád/a používal/a častěji.' },
    { id: 'sus_2', text: '2. Systém mi připadal zbytečně složitý.' },
    { id: 'sus_3', text: '3. Systém se mi zdál snadno a intuitivně použitelný.' },
    { id: 'sus_4', text: '4. Myslím, že bych potřeboval/a technickou podporu, abych byl/a schopen/na systém používat.' },
    { id: 'sus_5', text: '5. Připadalo mi, že různé funkce a moduly v tomto systému jsou dobře integrovány.' },
    { id: 'sus_6', text: '6. Myslím, že v systému bylo příliš mnoho nekonzistencí.' },
    { id: 'sus_7', text: '7. Dovedu si představit, že většina studentů by se naučila systém používat velmi rychle.' },
    { id: 'sus_8', text: '8. Používání systému mi připadalo těžkopádné.' },
    { id: 'sus_9', text: '9. Cítil/a jsem se velmi sebejistě při práci se systémem.' },
    { id: 'sus_10', text: '10. Musel/a jsem se naučit příliš mnoho věcí, než jsem byl/a schopen/na v systému pracovat.' },
  ];

  const tamQuestions = [
    { id: 'tam_1', text: '1. Použití systému mi umožnilo vybrat téma či získat inspiraci podstatně rychleji.' },
    { id: 'tam_2', text: '2. Systém zlepšil kvalitu mého zvažování o vhodném tématu závěrečné práce.' },
    { id: 'tam_3', text: '3. Práce se systémem mi usnadnila orientaci v nabídce témat KIP PřF OU.' },
    { id: 'tam_4', text: '4. Systém mi nabídl témata, která odpovídají mým schopnostem a jsou pro mě užitečná.' },
    { id: 'tam_5', text: '5. Doporučení a rozpad skóre mi pomohly objevit perspektivní témata, o kterých bych sám/sama neuvažoval/a.' },
    { id: 'tam_6', text: '6. Celkově považuji tento doporučovací systém za užitečný a přínosný nástroj pro studenty informatiky.' },
  ];

  // Výpočet zbývajících nezodpovězených položek
  const susMissingCount = susQuestions.filter((q) => typeof susScores[q.id] !== 'number').length;
  const tamMissingCount = tamQuestions.filter((q) => typeof tamScores[q.id] !== 'number').length;
  const remainingCount =
    (certaintyPost === null ? 1 : 0) +
    susMissingCount +
    tamMissingCount +
    (explanationClarity === null ? 1 : 0) +
    (topicRelevance === null ? 1 : 0);

  const isComplete = remainingCount === 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isComplete) {
      setShowValidationWarning(true);
      return;
    }

    onSubmit({
      session_code: sessionCode,
      decision_certainty_post: Number(certaintyPost),
      sus_scores: susScores,
      tam_scores: tamScores,
      explanation_clarity: Number(explanationClarity),
      topic_relevance: Number(topicRelevance),
      feedback_comment: feedbackComment.trim() || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-10 space-y-10">
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-ou-blue mb-1">
          <CheckSquare className="w-4 h-4" />
          Krok 4 z 4 • Závěrečné zhodnocení
        </div>
        <h2 className="text-2xl font-bold text-slate-800">
          Zhodnocení přínosu a vašeho dojmu ze systému
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Vaše zpětná vazba pomůže posoudit srozumitelnost doporučení a intuitivnost celého nástroje.
        </p>
      </div>

      {/* Rozhodovací jistota PO použití */}
      <div className={`rounded-2xl p-5 sm:p-6 space-y-4 border transition ${certaintyPost === null ? 'bg-slate-50/80 border-slate-200' : 'bg-emerald-50/70 border-emerald-200'}`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <label className="font-bold text-slate-800 text-sm sm:text-base flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            Máte po seznámení s doporučeními jasnější představu, které téma si vybrat?
          </label>
          <span className={`text-xl font-bold font-mono px-3 py-1 rounded-lg border shadow-sm self-start sm:self-auto ${certaintyPost === null ? 'bg-white text-slate-400 border-slate-200' : 'bg-white text-emerald-700 border-emerald-200'}`}>
            {certaintyPost === null ? 'Nevybráno' : `${certaintyPost} / 10`}
          </span>
        </div>
        <p className="text-xs text-slate-600">
          Zvolte na škále od 0 (stále tápu, témata mi nepomohla) po 10 (mám jasno a vybral/a jsem si směr):
        </p>

        {/* Tlačítková škála 0 až 10 */}
        <div className="flex flex-wrap gap-1.5 sm:gap-2 pt-1">
          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((val) => (
            <button
              key={val}
              type="button"
              onClick={() => {
                setCertaintyPost(val);
                setShowValidationWarning(false);
              }}
              className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl font-bold text-xs sm:text-sm transition ${
                certaintyPost === val
                  ? 'bg-emerald-600 text-white shadow-md ring-2 ring-emerald-600/30'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              {val}
            </button>
          ))}
        </div>

        <div className="flex justify-between text-[11px] text-slate-500 font-medium pt-1">
          <span>0 - Stále tápu</span>
          <span>5 - Mám lepší představu</span>
          <span>10 - Mám naprosto jasno</span>
        </div>
      </div>

      {/* Hodnocení použitelnosti (SUS) */}
      <div className="space-y-4">
        <div className="border-b border-slate-200 pb-2 flex justify-between items-end">
          <div>
            <h3 className="text-base font-bold text-slate-800">
              Jak se vám se systémem pracovalo?
            </h3>
            <p className="text-xs text-slate-500">
              Ohodnoťte intuitivnost rozhraní: 1 = Rozhodně nesouhlasím až 5 = Rozhodně souhlasím.
            </p>
          </div>
          {susMissingCount > 0 && (
            <span className="text-[11px] text-slate-400 font-medium">
              Zbývá vybrat: {susMissingCount}
            </span>
          )}
        </div>

        <div className="space-y-2.5 text-xs sm:text-sm">
          {susQuestions.map((q) => (
            <div
              key={q.id}
              className={`p-3 rounded-xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                typeof susScores[q.id] === 'number'
                  ? 'bg-white border-slate-200'
                  : 'bg-slate-50/70 border-slate-200/80'
              }`}
            >
              <span className="text-slate-700 font-medium flex-1">{q.text}</span>
              <div className="flex items-center gap-1.5 self-end sm:self-center">
                {[1, 2, 3, 4, 5].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => {
                      setSusScores((prev) => ({ ...prev, [q.id]: val }));
                      setShowValidationWarning(false);
                    }}
                    className={`w-8 h-8 rounded-lg text-xs font-bold transition ${
                      susScores[q.id] === val
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

      {/* Hodnocení přínosu doporučení (TAM) */}
      <div className="space-y-4">
        <div className="border-b border-slate-200 pb-2 flex justify-between items-end">
          <div>
            <h3 className="text-base font-bold text-slate-800">
              Byla pro vás doporučená témata přínosná?
            </h3>
            <p className="text-xs text-slate-500">
              Ohodnoťte přínos systému pro vaše rozhodování: 1 = Rozhodně nesouhlasím až 5 = Rozhodně souhlasím.
            </p>
          </div>
          {tamMissingCount > 0 && (
            <span className="text-[11px] text-slate-400 font-medium">
              Zbývá vybrat: {tamMissingCount}
            </span>
          )}
        </div>

        <div className="space-y-2.5 text-xs sm:text-sm">
          {tamQuestions.map((q) => (
            <div
              key={q.id}
              className={`p-3 rounded-xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                typeof tamScores[q.id] === 'number'
                  ? 'bg-white border-slate-200'
                  : 'bg-slate-50/70 border-slate-200/80'
              }`}
            >
              <span className="text-slate-700 font-medium flex-1">{q.text}</span>
              <div className="flex items-center gap-1.5 self-end sm:self-center">
                {[1, 2, 3, 4, 5].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => {
                      setTamScores((prev) => ({ ...prev, [q.id]: val }));
                      setShowValidationWarning(false);
                    }}
                    className={`w-8 h-8 rounded-lg text-xs font-bold transition ${
                      tamScores[q.id] === val
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

      {/* Srozumitelnost zdůvodnění a relevance témat */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
          <label className="block text-xs font-bold text-slate-800">
            Srozumitelnost rozpadu a zdůvodnění (1-5):
          </label>
          <p className="text-[11px] text-slate-500">
            Bylo pro vás jasné, PROČ vám byla daná témata doporučena?
          </p>
          <div className="flex items-center gap-2 pt-1">
            {[1, 2, 3, 4, 5].map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => {
                  setExplanationClarity(val);
                  setShowValidationWarning(false);
                }}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition ${
                  explanationClarity === val
                    ? 'bg-ou-blue text-white shadow-sm'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                {val}
              </button>
            ))}
          </div>
        </div>

        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
          <label className="block text-xs font-bold text-slate-800">
            Vnímaná relevance zobrazených témat (1-5):
          </label>
          <p className="text-[11px] text-slate-500">
            Nakolik byla doporučená témata trefná vůči vašemu skutečnému zaměření?
          </p>
          <div className="flex items-center gap-2 pt-1">
            {[1, 2, 3, 4, 5].map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => {
                  setTopicRelevance(val);
                  setShowValidationWarning(false);
                }}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition ${
                  topicRelevance === val
                    ? 'bg-ou-blue text-white shadow-sm'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                {val}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Otevřená zpětná vazba */}
      <div className="space-y-2">
        <label className="block text-xs font-bold text-slate-800 uppercase">
          Slovní komentář a náměty (volitelné):
        </label>
        <p className="text-xs text-slate-500">
          Co vás při výběru potěšilo, co vám chybělo nebo jaké faktory by měl doporučovací systém zohlednit?
        </p>
        <textarea
          rows={3}
          value={feedbackComment}
          onChange={(e) => setFeedbackComment(e.target.value)}
          placeholder="Napište svůj názor či doporučení pro další rozvoj systému..."
          className="w-full text-xs sm:text-sm p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-ou-blue focus:border-ou-blue bg-white"
        />
      </div>

      {/* Upozornění při nevyplnění */}
      {showValidationWarning && !isComplete && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-3 text-amber-800 text-xs">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <span>
            Před odesláním prosím ohodnoťte všechny otázky (zbývá vybrat ještě <strong>{remainingCount}</strong> {remainingCount === 1 ? 'položku' : remainingCount < 5 ? 'položky' : 'položek'}).
          </span>
        </div>
      )}

      {/* Navigace a odeslání */}
      <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4">
        <button
          type="button"
          onClick={onBack}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2.5 text-slate-600 hover:text-slate-900 font-medium text-sm transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Zpět k tématům
        </button>

        <button
          type="submit"
          disabled={isLoading}
          className={`flex items-center gap-2 px-7 py-3 font-semibold rounded-xl transition shadow text-white ${
            isComplete
              ? 'bg-ou-blue hover:bg-ou-dark cursor-pointer'
              : 'bg-slate-400 hover:bg-slate-500 cursor-pointer'
          }`}
        >
          {isLoading ? (
            <span>Ukládám hodnocení...</span>
          ) : isComplete ? (
            <>
              <span>Dokončit a vyhodnotit dotazník</span>
              <ArrowRight className="w-5 h-5" />
            </>
          ) : (
            <span>Dokončit (zbývá {remainingCount} {remainingCount === 1 ? 'otázka' : remainingCount < 5 ? 'otázky' : 'otázek'})</span>
          )}
        </button>
      </div>
    </form>
  );
};
