import React, { useMemo } from 'react';
import {
  Award,
  User,
  Info,
  ArrowRight,
  ArrowLeft,
  BookOpen,
  Tag,
  Compass,
  Sliders,
  CheckCircle2,
  Sparkles,
  Layers,
  Printer
} from 'lucide-react';
import { RecommendationsResponse, StudentProfileData } from '../types';
import { HollandHexagonChart } from './HollandHexagonChart';
import { getProfileInsights } from '../utils/profileCalculator';

interface WizardStepRecommendationsProps {
  data: RecommendationsResponse;
  profile?: StudentProfileData | null;
  onProceed: () => void;
  onBack: () => void;
}

export const WizardStepRecommendations: React.FC<WizardStepRecommendationsProps> = ({
  data,
  profile,
  onProceed,
  onBack,
}) => {
  const { recommendations } = data;

  // Vyhodnocení dominantních rysů studenta
  const insights = useMemo(() => {
    return profile ? getProfileInsights(profile) : null;
  }, [profile]);

  // Tisk / export do PDF
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* 1. HLAVNÍ KARTA: Tvůj diagnostický profil (Hollandův Hexagon & Styl práce) */}
      {profile && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-ou-blue mb-1">
                <Compass className="w-4 h-4" />
                Vyhodnocení osobnostního profilu
              </div>
              <h2 className="text-2xl font-bold text-slate-800">
                Tvůj diagnostický profil a pracovní styl
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Výsledek propojení Hollandovy typologie RIASEC, profesních kotev a tvých studijních preferencí.
              </p>
            </div>

            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition flex items-center gap-1.5 self-start sm:self-auto shadow-sm"
              title="Vytisknout nebo uložit jako PDF"
            >
              <Printer className="w-3.5 h-3.5 text-slate-600" />
              Tisk / Uložit PDF
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
            {/* Vlevo: Hollandův Hexagon (Radar Chart) */}
            <div className="md:col-span-6 flex flex-col items-center justify-center p-2 bg-slate-50/70 border border-slate-200/80 rounded-2xl">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-ou-blue" />
                Hollandův hexagon (RIASEC)
              </span>
              <HollandHexagonChart riasec={profile.riasec} size={300} />
            </div>

            {/* Vpravo: Slovní interpretace a silné stránky */}
            <div className="md:col-span-6 space-y-4">
              {insights && (
                <>
                  {/* Archetyp */}
                  <div className="p-4 bg-ou-light/50 border border-ou-blue/30 rounded-2xl">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-ou-blue block mb-1">
                      Tvůj dominantní typ
                    </span>
                    <h3 className="text-lg font-extrabold text-slate-900">
                      {insights.archetypeTitle}
                    </h3>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      {insights.isBalanced ? (
                        <>Profil vykazuje <strong>všestranný zájem</strong> napříč technologiemi, bádáním i prací s lidmi bez úzké jednostranné specializace.</>
                      ) : (
                        <>Kombinace kódu <strong className="text-ou-blue font-mono font-bold">{insights.hollandCode}</strong> ({insights.dominantRiasec.join(' + ')}).</>
                      )}
                    </p>
                  </div>

                  {/* Dominantní kotvy */}
                  <div className="space-y-1.5">
                    <span className="text-xs font-bold text-slate-700 block">
                      Kariérní motivátory (Kotvy):
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {insights.dominantAnchors.map((anchor) => (
                        <span
                          key={anchor}
                          className="px-2.5 py-1 bg-slate-100 border border-slate-200 text-slate-700 rounded-lg text-xs font-medium flex items-center gap-1"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-ou-blue" />
                          {anchor}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Styl práce a parametr závěrečné práce */}
                  <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
                    <div className="flex items-start gap-2 text-slate-600">
                      <Layers className="w-4 h-4 text-ou-blue flex-shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-slate-800">Typ výstupu: </strong>
                        {insights.outputLabel}
                      </div>
                    </div>

                    <div className="flex items-start gap-2 text-slate-600">
                      <Sparkles className="w-4 h-4 text-ou-blue flex-shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-slate-800">Přístup k řešení: </strong>
                        {insights.problemSolvingLabel}
                      </div>
                    </div>

                    <div className="flex items-start gap-2 text-slate-600">
                      <User className="w-4 h-4 text-ou-blue flex-shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-slate-800">Vedení práce: </strong>
                        {insights.supervisionLabel}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 2. KARTA: Seznam doporučených témat */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
        <div className="border-b border-slate-200 pb-4">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-ou-blue mb-1">
            <Award className="w-4 h-4" />
            Krok 3 z 4 • Výsledky doporučení
          </div>
          <h2 className="text-2xl font-bold text-slate-800">
            Doporučená témata bakalářských prací pro tebe
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Seřazeno podle míry shody s tvým diagnostickým profilem, absolvovanými předměty a zájmy.
          </p>
        </div>

        {/* Seznam témat */}
        <div className="space-y-6">
          {recommendations.map((item, index) => {
            const isTop = index === 0;
            const matchPercentage = Math.round(item.total_score * 100);
            const expPercentage = Math.round(item.s_exp * 100);
            const contPercentage = Math.round(item.s_cont * 100);
            const kwPercentage = Math.round(item.s_kw * 100);

            return (
              <div
                key={item.code}
                className={`rounded-2xl border transition overflow-hidden ${
                  isTop
                    ? 'border-ou-blue shadow-md bg-white ring-1 ring-ou-blue/40'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                {/* Horní pruh karty */}
                <div
                  className={`px-5 py-3 flex items-center justify-between text-xs font-semibold ${
                    isTop
                      ? 'bg-ou-blue text-white'
                      : 'bg-slate-100 text-slate-600 border-b border-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                        isTop ? 'bg-white text-ou-blue' : 'bg-slate-300 text-slate-800'
                      }`}
                    >
                      {index + 1}
                    </span>
                    <span className="font-mono tracking-wider">{item.code}</span>
                    {isTop && (
                      <span className="ml-1 px-2 py-0.5 bg-white/20 rounded text-[11px] font-bold">
                        ★ Nejvyšší doporučení
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs opacity-90 hidden sm:inline">
                      Náročnost: {(item.difficulty * 10).toFixed(1)} / 10
                    </span>
                    <span
                      className={`px-3 py-1 rounded-full font-mono font-bold text-xs shadow-sm ${
                        isTop ? 'bg-white text-ou-blue' : 'bg-ou-light text-ou-blue'
                      }`}
                    >
                      Celková shoda: {matchPercentage} %
                    </span>
                  </div>
                </div>

                <div className="p-5 sm:p-6 space-y-5">
                  {/* Název a vedoucí */}
                  <div>
                    <h3 className="text-lg sm:text-xl font-bold text-slate-900 leading-snug">
                      {item.title}
                    </h3>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1.5">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      Vedoucí práce: <strong className="text-slate-700">{item.supervisor_name}</strong>
                    </div>
                  </div>

                  {/* Anotace */}
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {item.description}
                  </p>

                  {/* Srozumitelný rozpad shody (Čistá procenta bez technického žargonu) */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                    <span className="text-xs font-bold text-slate-700 block">
                      Proč ti toto téma doporučujeme (Rozpad souladu):
                    </span>

                    <div className="space-y-2.5 text-xs">
                      {/* Soulad s profilem */}
                      <div>
                        <div className="flex justify-between items-center text-[11.5px] mb-1">
                          <span className="font-medium text-slate-700 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-blue-600" />
                            Soulad s tvým osobnostním profilem a stylem:
                          </span>
                          <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                            {expPercentage} %
                          </span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(100, expPercentage)}%` }}
                          />
                        </div>
                      </div>

                      {/* Návaznost na předměty (STAG) */}
                      {contPercentage > 0 && (
                        <div>
                          <div className="flex justify-between items-center text-[11.5px] mb-1">
                            <span className="font-medium text-slate-700 flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-emerald-600" />
                              Návaznost na tvé absolvované předměty:
                            </span>
                            <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                              {contPercentage} %
                            </span>
                          </div>
                          <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                            <div
                              className="bg-emerald-600 h-2 rounded-full transition-all duration-500"
                              style={{ width: `${Math.min(100, contPercentage)}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Shoda klíčových slov */}
                      {kwPercentage > 0 && (
                        <div>
                          <div className="flex justify-between items-center text-[11.5px] mb-1">
                            <span className="font-medium text-slate-700 flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-purple-600" />
                              Průnik s tvými zájmovými technologiemi:
                            </span>
                            <span className="font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                              {kwPercentage} %
                            </span>
                          </div>
                          <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                            <div
                              className="bg-purple-600 h-2 rounded-full transition-all duration-500"
                              style={{ width: `${Math.min(100, kwPercentage)}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Doporučení pro studenta a jak téma uchopit */}
                  <div className="bg-ou-light/40 border border-ou-blue/20 rounded-xl p-4 flex items-start gap-3">
                    <Info className="w-4 h-4 text-ou-blue flex-shrink-0 mt-0.5" />
                    <div className="text-xs text-slate-700 leading-relaxed">
                      <strong className="text-ou-blue block font-bold mb-1">
                        Doporučení pro tebe & jak téma uchopit:
                      </strong>
                      <p>{item.explanation_text}</p>
                    </div>
                  </div>

                  {/* Shodná klíčová slova */}
                  {item.matched_keywords && item.matched_keywords.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                        <Tag className="w-3 h-3 text-ou-blue" />
                        Shodná klíčová slova:
                      </span>
                      {item.matched_keywords.map((kw) => (
                        <span
                          key={kw}
                          className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-[11px] font-semibold"
                        >
                          ✓ {kw}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Navigace na post-test */}
        <div className="mt-8 pt-5 border-t border-slate-200 flex justify-between items-center">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-2.5 text-slate-600 hover:text-slate-900 font-medium text-sm transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Zpět k úpravě profilu
          </button>

          <button
            type="button"
            onClick={onProceed}
            className="flex items-center gap-2 px-6 py-3 bg-ou-blue hover:bg-ou-dark text-white font-semibold rounded-xl transition shadow"
          >
            Přejít k závěrečnému hodnocení (Post-test)
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
