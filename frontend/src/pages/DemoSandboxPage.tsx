import React, { useState, useEffect, useMemo } from 'react';
import {
  Sliders,
  Sparkles,
  RefreshCw,
  Info,
  Tag,
  Dices,
  Layers,
  User,
  CheckCircle2,
  Award
} from 'lucide-react';
import { CourseItem, StudentProfileData, RecommendationsResponse } from '../types';
import { fetchCourses, initSession, saveProfile, getRecommendations } from '../services/api';
import { HollandHexagonChart } from '../components/HollandHexagonChart';
import { EditableNumberLabel } from '../components/EditableNumberLabel';

const ANCHOR_OPTIONS = [
  { code: 'TF', label: 'Odborná technologická kompetence' },
  { code: 'AU', label: 'Autonomie a nezávislost' },
  { code: 'CH', label: 'Čistá intelektuální výzva' },
  { code: 'SV', label: 'Služba a oddanost věci' },
  { code: 'SE', label: 'Jistota a stabilita' },
  { code: 'GM', label: 'Vedení a management' },
] as const;

export const DemoSandboxPage: React.FC = () => {
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [sessionCode, setSessionCode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // 1. Váhy citlivostní analýzy (součet vždy = 1.00)
  const [alpha, setAlpha] = useState<number>(0.5);
  const [beta, setBeta] = useState<number>(0.3);
  const [gamma, setGamma] = useState<number>(0.2);

  // Proporcionální přepočet vah se zachováním zadané hodnoty
  const updateWeight = (changed: 'alpha' | 'beta' | 'gamma', newVal: number) => {
    const clamped = Math.max(0, Math.min(1, parseFloat(newVal.toFixed(3))));
    const remain = Math.max(0, 1 - clamped);

    if (changed === 'alpha') {
      const otherSum = beta + gamma;
      setAlpha(clamped);
      if (otherSum > 0) {
        setBeta(parseFloat((remain * (beta / otherSum)).toFixed(2)));
        setGamma(parseFloat((remain - remain * (beta / otherSum)).toFixed(2)));
      } else {
        setBeta(parseFloat((remain / 2).toFixed(2)));
        setGamma(parseFloat((remain / 2).toFixed(2)));
      }
    } else if (changed === 'beta') {
      const otherSum = alpha + gamma;
      setBeta(clamped);
      if (otherSum > 0) {
        setAlpha(parseFloat((remain * (alpha / otherSum)).toFixed(2)));
        setGamma(parseFloat((remain - remain * (alpha / otherSum)).toFixed(2)));
      } else {
        setAlpha(parseFloat((remain / 2).toFixed(2)));
        setGamma(parseFloat((remain / 2).toFixed(2)));
      }
    } else if (changed === 'gamma') {
      const otherSum = alpha + beta;
      setGamma(clamped);
      if (otherSum > 0) {
        setAlpha(parseFloat((remain * (alpha / otherSum)).toFixed(2)));
        setBeta(parseFloat((remain - remain * (alpha / otherSum)).toFixed(2)));
      } else {
        setAlpha(parseFloat((remain / 2).toFixed(2)));
        setBeta(parseFloat((remain / 2).toFixed(2)));
      }
    }
  };

  // 2. RIASEC profil
  const [riasec, setRiasec] = useState({
    R: 0.5,
    I: 0.85,
    A: 0.6,
    S: 0.4,
    E: 0.4,
    C: 0.7,
  });

  // 3. Kariérní kotvy (vybrané 2 dominantní)
  const [selectedAnchors, setSelectedAnchors] = useState<string[]>(['TF', 'AU']);

  // 4. Styl práce a parametry závěrečné práce
  const [outputType, setOutputType] = useState<number>(0.85); // 0 = analýza, 1 = aplikace
  const [problemSolvingStyle, setProblemSolvingStyle] = useState<number>(0.7); // 0 = osvědčené, 1 = inovace
  const [supervisionPreference, setSupervisionPreference] = useState<number>(0.5); // 0 = mantinely, 1 = volnost
  const [selfEfficacy, setSelfEfficacy] = useState<number>(0.75); // výzkumná sebedůvěra I_eff

  // 5. Předměty a klíčová slova
  const [selectedCourses, setSelectedCourses] = useState<string[]>([
    'KIP/7ALG1',
    'KIP/7OPR1',
    'KIP/7UVDT',
  ]);
  const [hobbyKeywords, setHobbyKeywords] = useState<string>('web, react, databáze, api, umělá inteligence');

  const [results, setResults] = useState<RecommendationsResponse | null>(null);

  useEffect(() => {
    fetchCourses().then((data) => setCourses(data)).catch(() => {});
    initSession('demo').then((data) => {
      setSessionCode(data.session_code);
    }).catch(() => {});
  }, []);

  // Tlačítko: Náhodný generátor profilu (Nemění váhy alpha, beta, gamma)
  const randomizeProfile = () => {
    // Čistý náhodný rozptyl po 0.05 v rozsahu [0.15, 1.0]
    const randVal = () => Math.round((0.15 + Math.random() * 0.8) / 0.05) * 0.05;

    // 1. RIASEC
    setRiasec({
      R: randVal(),
      I: randVal(),
      A: randVal(),
      S: randVal(),
      E: randVal(),
      C: randVal(),
    });

    // 2. Náhodné 2 Scheinovy kotvy
    const all = ['TF', 'AU', 'CH', 'SV', 'SE', 'GM'];
    const shuffled = [...all].sort(() => 0.5 - Math.random());
    setSelectedAnchors([shuffled[0], shuffled[1]]);

    // 3. Styl práce a parametry
    setOutputType(randVal());
    setProblemSolvingStyle(randVal());
    setSupervisionPreference(randVal());
    setSelfEfficacy(randVal());
  };

  const handleToggleAnchor = (code: string) => {
    if (selectedAnchors.includes(code)) {
      if (selectedAnchors.length > 1) {
        setSelectedAnchors(selectedAnchors.filter((a) => a !== code));
      }
    } else {
      if (selectedAnchors.length >= 2) {
        setSelectedAnchors([selectedAnchors[1], code]);
      } else {
        setSelectedAnchors([...selectedAnchors, code]);
      }
    }
  };

  const recalculate = async () => {
    if (!sessionCode) return;
    setIsLoading(true);
    try {
      // Sestavení vah kotev
      const anchorsPayload: Record<string, number> = {};
      if (selectedAnchors.length === 2) {
        anchorsPayload[selectedAnchors[0]] = 0.6;
        anchorsPayload[selectedAnchors[1]] = 0.4;
      } else if (selectedAnchors.length === 1) {
        anchorsPayload[selectedAnchors[0]] = 1.0;
      } else {
        anchorsPayload['TF'] = 0.6;
        anchorsPayload['AU'] = 0.4;
      }

      const profileData: StudentProfileData = {
        riasec,
        career_anchors: anchorsPayload,
        problem_solving_style: problemSolvingStyle,
        orientation_type: 0.7,
        output_type: outputType,
        supervision_preference: supervisionPreference,
        completed_courses: selectedCourses.map((c) => ({ code: c, grade: 'A' })),
        hobby_keywords: hobbyKeywords.split(',').map((k) => k.trim()).filter((k) => k),
      };

      await saveProfile(sessionCode, profileData);
      const recs = await getRecommendations({
        session_code: sessionCode,
        top_k: 5,
        custom_alpha: alpha,
        custom_beta: beta,
        custom_gamma: gamma,
      });
      setResults(recs);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  // Automatický živý přepočet při libovolné změně parametrů
  useEffect(() => {
    if (sessionCode) {
      const timer = setTimeout(() => {
        recalculate();
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [
    sessionCode,
    alpha,
    beta,
    gamma,
    riasec,
    selectedAnchors,
    outputType,
    problemSolvingStyle,
    supervisionPreference,
    selfEfficacy,
    selectedCourses,
  ]);

  const currentWeightsSum = useMemo(() => {
    return (alpha + beta + gamma).toFixed(2);
  }, [alpha, beta, gamma]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-ou-blue mb-1">
            <Sliders className="w-4 h-4" />
            Interaktivní Demo & Citlivostní analýza
          </div>
          <h2 className="text-2xl font-bold text-slate-800">
            Algoritmický sandbox doporučovacího systému
          </h2>
          <p className="text-sm text-slate-500 mt-1 max-w-2xl">
            Tento režim slouží pro demonstraci fungování modelu, obhajobu bakalářské práce a testování citlivosti vah (α, β, γ).
            Čísla u posuvníků můžete <strong>dvojklikem přímo přepsat</strong> z klávesnice.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={randomizeProfile}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs transition shadow-sm"
            title="Náhodně vygeneruje profil studenta (RIASEC, kotvy, styl) při zachování vah"
          >
            <Dices className="w-4 h-4 text-ou-blue" />
            Náhodný profil
          </button>

          <button
            type="button"
            onClick={recalculate}
            disabled={isLoading}
            className="flex items-center gap-2 px-5 py-2.5 bg-ou-blue hover:bg-ou-dark text-white font-semibold rounded-xl text-xs transition shadow disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Přepočítat
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEVÝ SLOUPEC: Ovládací prvky a simulátor profilu */}
        <div className="lg:col-span-5 space-y-6">
          {/* 1. Agregační váhy modelu */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-base font-bold text-slate-800">
                Agregační váhy modelu (Součet = 1.00)
              </h3>
              <span className="text-xs font-mono font-bold px-2 py-0.5 bg-slate-100 rounded text-slate-700">
                &Sigma; = {currentWeightsSum}
              </span>
            </div>

            <div className="space-y-3.5 text-xs">
              {/* Alpha */}
              <div>
                <div className="flex justify-between items-center font-semibold mb-1">
                  <span className="text-blue-700">α (Osobnostní profil studenta):</span>
                  <EditableNumberLabel
                    value={alpha}
                    onChange={(val) => updateWeight('alpha', val)}
                    min={0}
                    max={1}
                    step={0.05}
                    decimals={2}
                    className="text-blue-700"
                  />
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={alpha}
                  onChange={(e) => updateWeight('alpha', parseFloat(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
              </div>

              {/* Beta */}
              <div>
                <div className="flex justify-between items-center font-semibold mb-1">
                  <span className="text-emerald-700">β (Absolvované předměty ze STAGu):</span>
                  <EditableNumberLabel
                    value={beta}
                    onChange={(val) => updateWeight('beta', val)}
                    min={0}
                    max={1}
                    step={0.05}
                    decimals={2}
                    className="text-emerald-700"
                  />
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={beta}
                  onChange={(e) => updateWeight('beta', parseFloat(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                />
              </div>

              {/* Gamma */}
              <div>
                <div className="flex justify-between items-center font-semibold mb-1">
                  <span className="text-purple-700">γ (Zájmové technologie a klíčová slova):</span>
                  <EditableNumberLabel
                    value={gamma}
                    onChange={(val) => updateWeight('gamma', val)}
                    min={0}
                    max={1}
                    step={0.05}
                    decimals={2}
                    className="text-purple-700"
                  />
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={gamma}
                  onChange={(e) => updateWeight('gamma', parseFloat(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                />
              </div>
            </div>
          </div>

          {/* 2. Hollandův hexagon a RIASEC posuvníky */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-base font-bold text-slate-800">
                Hollandův RIASEC profil
              </h3>
              <span className="text-[11px] text-slate-500">Dvojklik na % pro přepsání</span>
            </div>

            {/* Živý radar chart */}
            <div className="flex justify-center py-1">
              <HollandHexagonChart riasec={riasec} size={240} />
            </div>

            {/* Mřížka 6 posuvníků */}
            <div className="grid grid-cols-2 gap-2.5 text-xs pt-2">
              {Object.entries(riasec).map(([dim, val]) => (
                <div key={dim} className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="font-extrabold text-slate-800">{dim}</span>
                    <EditableNumberLabel
                      value={val}
                      onChange={(newVal) => setRiasec({ ...riasec, [dim]: newVal })}
                      min={0}
                      max={1}
                      step={0.05}
                      isPercentage={true}
                      className="text-ou-blue"
                    />
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={val}
                    onChange={(e) =>
                      setRiasec({ ...riasec, [dim]: parseFloat(e.target.value) })
                    }
                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-ou-blue"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* 3. Kariérní kotvy (Schein) */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-3">
            <h3 className="text-base font-bold text-slate-800">
              Kariérní motivátory (Vyberte 1–2 kotvy)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {ANCHOR_OPTIONS.map((anc) => {
                const isSelected = selectedAnchors.includes(anc.code);
                return (
                  <button
                    key={anc.code}
                    type="button"
                    onClick={() => handleToggleAnchor(anc.code)}
                    className={`p-2.5 rounded-xl border text-left font-medium transition flex items-center justify-between ${
                      isSelected
                        ? 'bg-ou-light/50 border-ou-blue text-ou-blue font-bold shadow-sm'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <span>{anc.label}</span>
                    {isSelected && <CheckCircle2 className="w-4 h-4 text-ou-blue flex-shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. Styl práce a parametry závěrečné práce */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-800">
              Styl práce a preference bakalářky
            </h3>

            <div className="space-y-4 text-xs">
              {/* Typ výstupu */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-slate-700">
                  <span className="font-semibold flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-ou-blue" />
                    Typ výstupu (Analýza ➔ Aplikace):
                  </span>
                  <EditableNumberLabel
                    value={outputType}
                    onChange={setOutputType}
                    min={0}
                    max={1}
                    step={0.05}
                    isPercentage={true}
                    className="text-ou-blue"
                  />
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={outputType}
                  onChange={(e) => setOutputType(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-ou-blue"
                />
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>0% Teorie / Rešerše</span>
                  <span>100% Funkční aplikace</span>
                </div>
              </div>

              {/* Přístup k inovacím */}
              <div className="space-y-1 pt-2 border-t border-slate-100">
                <div className="flex justify-between items-center text-slate-700">
                  <span className="font-semibold flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-ou-blue" />
                    Inovace (Standard ➔ Experiment):
                  </span>
                  <EditableNumberLabel
                    value={problemSolvingStyle}
                    onChange={setProblemSolvingStyle}
                    min={0}
                    max={1}
                    step={0.05}
                    isPercentage={true}
                    className="text-ou-blue"
                  />
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={problemSolvingStyle}
                  onChange={(e) => setProblemSolvingStyle(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-ou-blue"
                />
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>0% Osvědčený postup</span>
                  <span>100% Nové technologie</span>
                </div>
              </div>

              {/* Míra supervize */}
              <div className="space-y-1 pt-2 border-t border-slate-100">
                <div className="flex justify-between items-center text-slate-700">
                  <span className="font-semibold flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-ou-blue" />
                    Vedení (Pravidelné ➔ Volná ruka):
                  </span>
                  <EditableNumberLabel
                    value={supervisionPreference}
                    onChange={setSupervisionPreference}
                    min={0}
                    max={1}
                    step={0.05}
                    isPercentage={true}
                    className="text-ou-blue"
                  />
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={supervisionPreference}
                  onChange={(e) => setSupervisionPreference(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-ou-blue"
                />
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>0% Pevné mantinely</span>
                  <span>100% Samostatnost</span>
                </div>
              </div>

              {/* Sebeúčinnost I_eff */}
              <div className="space-y-1 pt-2 border-t border-slate-100">
                <div className="flex justify-between items-center text-slate-700">
                  <span className="font-semibold flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-ou-blue" />
                    Výzkumná sebedůvěra (I_eff penalizace):
                  </span>
                  <EditableNumberLabel
                    value={selfEfficacy}
                    onChange={setSelfEfficacy}
                    min={0}
                    max={1}
                    step={0.05}
                    isPercentage={true}
                    className="text-ou-blue"
                  />
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={selfEfficacy}
                  onChange={(e) => setSelfEfficacy(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-ou-blue"
                />
              </div>
            </div>
          </div>

          {/* 5. Zájmová klíčová slova */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-3">
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <Tag className="w-4 h-4 text-ou-blue" />
              Zájmová klíčová slova
            </h3>
            <input
              type="text"
              value={hobbyKeywords}
              onChange={(e) => setHobbyKeywords(e.target.value)}
              placeholder="např. web, react, databáze, hry, mobil, umělá inteligence"
              className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs focus:ring-ou-blue focus:border-ou-blue"
            />
          </div>
        </div>

        {/* PRAVÝ SLOUPEC: Živé výsledky doporučení (moderní čistý vzhled) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-ou-blue" />
              Živé pořadí Top 5 doporučených témat
            </h3>
            {results && (
              <span className="text-xs text-slate-500 font-mono">
                Počet témat: {results.recommendations.length}
              </span>
            )}
          </div>

          {results ? (
            <div className="space-y-4">
              {results.recommendations.map((item, index) => {
                const matchPct = Math.round(item.total_score * 100);
                const expPct = Math.round(item.s_exp * 100);
                const contPct = Math.round(item.s_cont * 100);
                const kwPct = Math.round(item.s_kw * 100);

                return (
                  <div
                    key={item.code}
                    className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-3 hover:border-ou-blue/60 transition"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="w-5 h-5 rounded-full bg-ou-blue text-white text-[11px] font-bold flex items-center justify-center">
                            {index + 1}
                          </span>
                          <span className="text-xs font-mono font-semibold text-slate-500">
                            {item.code}
                          </span>
                          <span className="text-xs text-slate-400">•</span>
                          <span className="text-xs text-slate-600 font-medium">
                            {item.supervisor_name}
                          </span>
                        </div>
                        <h4 className="text-base font-bold text-slate-900 leading-snug">
                          {item.title}
                        </h4>
                      </div>

                      <div className="text-right flex-shrink-0">
                        <span className="text-lg font-black font-mono text-ou-blue">
                          {matchPct} %
                        </span>
                        <span className="block text-[10px] text-slate-400">Celková shoda</span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 line-clamp-2">
                      {item.description}
                    </p>

                    {/* Čistý rozpad souladu */}
                    <div className="space-y-2 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <div>
                        <div className="flex justify-between items-center text-[11px] mb-0.5">
                          <span className="text-slate-600 font-medium">Soulad s osobností studenta:</span>
                          <strong className="text-blue-700 font-mono">{expPct} %</strong>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                            style={{ width: `${Math.min(100, expPct)}%` }}
                          />
                        </div>
                      </div>

                      {beta > 0 && (
                        <div>
                          <div className="flex justify-between items-center text-[11px] mb-0.5">
                            <span className="text-slate-600 font-medium">Návaznost na předměty:</span>
                            <strong className="text-emerald-700 font-mono">{contPct} %</strong>
                          </div>
                          <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-emerald-600 h-1.5 rounded-full transition-all duration-300"
                              style={{ width: `${Math.min(100, contPct)}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {gamma > 0 && (
                        <div>
                          <div className="flex justify-between items-center text-[11px] mb-0.5">
                            <span className="text-slate-600 font-medium">Shoda klíčových slov:</span>
                            <strong className="text-purple-700 font-mono">{kwPct} %</strong>
                          </div>
                          <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-purple-600 h-1.5 rounded-full transition-all duration-300"
                              style={{ width: `${Math.min(100, kwPct)}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Doporučení a vysvětlení */}
                    <div className="text-xs text-slate-600 bg-ou-light/40 p-2.5 rounded-lg border border-ou-blue/20 flex items-start gap-2">
                      <Info className="w-3.5 h-3.5 text-ou-blue flex-shrink-0 mt-0.5" />
                      <span>{item.explanation_text}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500">
              Načítám témata...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
