import React, { useMemo, useState } from 'react';
import {
  Award,
  ArrowRight,
  ArrowLeft,
  Tag,
  Compass,
  Sliders,
  CheckCircle2,
  Layers,
  Printer,
  Download,
  Copy,
  Check,
  Wrench,
  User,
  GraduationCap
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
  const [copied, setCopied] = useState(false);

  // Vyhodnocení dominantních rysů studenta
  const insights = useMemo(() => {
    return profile ? getProfileInsights(profile) : null;
  }, [profile]);

  // Generování textového reportu pro stažení nebo zkopírování
  const generateReportText = () => {
    let report = `================================================================================\n`;
    report += `DOPORUČENÁ TÉMATA BAKALÁŘSKÝCH PRACÍ (DSR ARTEFAKT KIP PřF OU)\n`;
    report += `Datum: ${new Date().toLocaleDateString('cs-CZ')} | Kód sezení: ${data.session_code || 'N/A'}\n`;
    report += `================================================================================\n\n`;

    if (profile && insights) {
      report += `PROFIL STUDENTA:\n`;
      report += `- Dominantní typ: ${insights.archetypeTitle} (Kód: ${insights.hollandCode})\n`;
      report += `- Kariérní kotvy: ${insights.dominantAnchors.join(', ')}\n`;
      report += `- Typ výstupu: ${insights.outputLabel}\n`;
      report += `- Styl řešení: ${insights.problemSolvingLabel}\n\n`;
    }

    report += `TOP DOPORUČENÁ TÉMATA:\n`;
    report += `--------------------------------------------------------------------------------\n`;
    recommendations.forEach((item, idx) => {
      report += `${idx + 1}. [${item.code}] ${item.title}\n`;
      report += `   Vedoucí: ${item.supervisor_name}\n`;
      report += `   Celková shoda: ${Math.round(item.total_score * 100)} % (Profil: ${Math.round(item.s_exp * 100)} %, Sylaby: ${Math.round(item.s_cont * 100)} %, Zájmy: ${Math.round(item.s_kw * 100)} %)\n`;
      report += `   Anotace: ${item.description}\n`;
      if (item.explanation_text) {
        report += `   Zdůvodnění: ${item.explanation_text}\n`;
      }
      report += `\n`;
    });

    return report;
  };

  // Stažení přehledu jako textového souboru
  const handleDownloadReport = () => {
    const text = generateReportText();
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Doporuceni_BP_${data.session_code || 'vysledky'}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Zkopírování přehledu do schránky
  const handleCopyReport = async () => {
    try {
      await navigator.clipboard.writeText(generateReportText());
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
      handleDownloadReport();
    }
  };

  // Tisk / export do PDF
  const handlePrint = () => {
    window.print();
  };

  const currentDateFormatted = new Date().toLocaleDateString('cs-CZ', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* 0. TISKOVÁ HLAVIČKA (Zobrazuje se pouze při tisku/exportu do PDF) */}
      <div className="hidden print:block border-b-2 border-slate-900 pb-4 mb-6">
        <div className="flex justify-between items-start">
          <div>
            <div className="text-xs uppercase font-bold tracking-wider text-slate-600">
              Ostravská univerzita • Přírodovědecká fakulta
            </div>
            <div className="text-sm font-semibold text-slate-800">
              Katedra informatiky a počítačů (KIP)
            </div>
            <h1 className="text-xl font-bold text-slate-950 mt-1">
              Podklady pro výběr bakalářské práce & konzultaci s vedoucím
            </h1>
          </div>
          <div className="text-right text-xs text-slate-600">
            <div>Datum vygenerování: <strong>{currentDateFormatted}</strong></div>
            {data.session_code && <div>Identifikátor: <strong className="font-mono">{data.session_code}</strong></div>}
          </div>
        </div>
      </div>

      {/* 1. HLAVNÍ KARTA: Tvůj diagnostický profil (Hollandův Hexagon & Styl práce) */}
      {profile && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6 print-avoid-break">
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

            {/* Akční tlačítka pro tisk a export */}
            <div className="flex items-center gap-2 self-start sm:self-auto no-print">
              <button
                type="button"
                onClick={handleCopyReport}
                className="px-3 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition flex items-center gap-1.5 shadow-sm"
                title="Zkopírovat souhrn do schránky (pro e-mail vedoucímu)"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Zkopírováno</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-600" />
                    <span>Kopírovat</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleDownloadReport}
                className="px-3 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition flex items-center gap-1.5 shadow-sm"
                title="Stáhnout textový report (.txt)"
              >
                <Download className="w-3.5 h-3.5 text-slate-600" />
                <span>Stáhnout .txt</span>
              </button>

              <button
                type="button"
                onClick={handlePrint}
                className="px-3 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition flex items-center gap-1.5 shadow-sm"
                title="Vytisknout nebo uložit jako PDF"
              >
                <Printer className="w-3.5 h-3.5 text-slate-600" />
                <span>Tisk</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
            {/* Vlevo: Hollandův Hexagon (Radar Chart) */}
            <div className="md:col-span-6 flex flex-col items-center justify-center p-3 bg-slate-50/70 border border-slate-200/80 rounded-2xl">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-ou-blue" />
                Hollandův hexagon (RIASEC)
              </span>
              <HollandHexagonChart riasec={profile.riasec} size={280} />
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
                      <Wrench className="w-4 h-4 text-ou-blue flex-shrink-0 mt-0.5" />
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
                className={`rounded-2xl border transition overflow-hidden print-avoid-break ${
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
                      <GraduationCap className="w-4 h-4 text-ou-blue" />
                      Vedoucí práce: <strong className="text-slate-800">{item.supervisor_name}</strong>
                    </div>
                  </div>

                  {/* Anotace */}
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {item.description}
                  </p>

                  {/* Srozumitelný rozpad shody */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                    <span className="text-xs font-bold text-slate-700 block">
                      Rozpad míry shody:
                    </span>

                    <div className="space-y-2.5 text-xs">
                      {/* Soulad s profilem */}
                      <div>
                        <div className="flex justify-between items-center text-[11.5px] mb-1">
                          <span className="font-medium text-slate-700 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-blue-600" />
                            Soulad s osobnostním profilem a stylem:
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
                              Návaznost na absolvované předměty:
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
                              Průnik se zájmovými technologiemi:
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
        <div className="mt-8 pt-5 border-t border-slate-200 flex justify-between items-center no-print">
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
