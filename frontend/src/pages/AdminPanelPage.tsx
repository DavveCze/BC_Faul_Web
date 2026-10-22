import React, { useState, useEffect } from 'react';
import {
  Database,
  Download,
  Upload,
  CheckCircle2,
  AlertCircle,
  Users,
  BarChart3,
  TrendingUp,
  Sparkles,
  Trash2,
  RotateCcw,
  FileText,
  Copy,
  Check,
  Search,
  Sliders,
  Award
} from 'lucide-react';
import { AdminStatsData, AdminSessionItem, EvaluationChartsData } from '../types';
import {
  fetchAdminStats,
  fetchAdminSessions,
  deleteAdminSession,
  cleanupAdminSessions,
  fetchEvaluationCharts,
  uploadTopicsFile
} from '../services/api';
import { HollandHexagonChart } from '../components/HollandHexagonChart';

type AdminTab = 'charts' | 'sessions' | 'latex' | 'import';

export const AdminPanelPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AdminTab>('charts');
  const [stats, setStats] = useState<AdminStatsData | null>(null);
  const [sessions, setSessions] = useState<AdminSessionItem[]>([]);
  const [evalCharts, setEvalCharts] = useState<EvaluationChartsData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Filtry pro tabulku sezení
  const [searchQuery, setSearchQuery] = useState('');
  const [modeFilter, setModeFilter] = useState<'all' | 'pilot' | 'demo'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'incomplete'>('all');

  // Notifikace a akce
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [copiedLatex, setCopiedLatex] = useState(false);

  // Upload témat
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);

  const loadAllData = async () => {
    setIsLoading(true);
    try {
      const [statsData, sessionsData, chartsData] = await Promise.all([
        fetchAdminStats(),
        fetchAdminSessions(),
        fetchEvaluationCharts(),
      ]);
      setStats(statsData);
      setSessions(sessionsData);
      setEvalCharts(chartsData);
    } catch (err) {
      console.error('Chyba při načítání administrátorských dat:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // Smazání jednoho sezení
  const handleDeleteSingle = async (sessionCode: string) => {
    if (!window.confirm(`Opravdu chcete smazat sezení ${sessionCode} včetně všech navázaných testů?`)) {
      return;
    }
    try {
      await deleteAdminSession(sessionCode);
      setActionMessage({ type: 'success', text: `Sezení ${sessionCode} bylo úspěšně smazáno.` });
      loadAllData();
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.response?.data?.detail || 'Chyba při mazání sezení.' });
    }
  };

  // Hromadné čištění sezení
  const handleCleanup = async (filterType: 'empty' | 'incomplete' | 'demo' | 'all') => {
    const labels = {
      empty: 'všechna zcela prázdná sezení bez odpovědí',
      incomplete: 'všechna nedokončená sezení (bez vyplněného post-testu)',
      demo: 'všechna sezení v testovacím režimu demo',
      all: 'ÚPLNĚ VŠECHNA sezení v databázi (reset před ostrým spuštěním)',
    };

    if (!window.confirm(`Opravdu si přejete smazat ${labels[filterType]}? Tato akce je nevratná.`)) {
      return;
    }

    try {
      const res = await cleanupAdminSessions(filterType);
      setActionMessage({
        type: 'success',
        text: `Úspěšně promazáno: smazáno ${res.deleted_count} sezení, v databázi zbývá ${res.remaining_count}.`,
      });
      loadAllData();
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.response?.data?.detail || 'Chyba při promazávání databáze.' });
    }
  };

  // Kopírování LaTeX kódu
  const handleCopyLatex = () => {
    if (!evalCharts?.latex_table_code) return;
    navigator.clipboard.writeText(evalCharts.latex_table_code);
    setCopiedLatex(true);
    setTimeout(() => setCopiedLatex(false), 2500);
  };

  // Upload témat
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadStatus(null);
    try {
      const res = await uploadTopicsFile(file);
      setUploadStatus(`Úspěšně importováno: ${res.imported} nových témat, aktualizováno: ${res.updated} témat.`);
      loadAllData();
    } catch (err: any) {
      setUploadStatus(`Chyba při nahrávání souboru: ${err.response?.data?.detail || err.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  // Filtrování sezení
  const filteredSessions = sessions.filter((s) => {
    if (searchQuery && !s.session_code.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    if (modeFilter !== 'all' && s.mode !== modeFilter) {
      return false;
    }
    if (statusFilter === 'completed' && !s.has_post) {
      return false;
    }
    if (statusFilter === 'incomplete' && s.has_post) {
      return false;
    }
    return true;
  });

  const emptySessionsCount = sessions.filter((s) => !s.has_pre && !s.has_profile && !s.has_post).length;
  const incompleteSessionsCount = sessions.filter((s) => !s.has_post).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-ou-blue mb-1">
            <Database className="w-4 h-4" />
            Administrace výzkumu & Správa dat
          </div>
          <h2 className="text-2xl font-bold text-slate-800">
            Analytický panel a výzkumný export (DSR Evaluace)
          </h2>
          <p className="text-sm text-slate-500 mt-1 max-w-2xl">
            Sledování vzorku pilotního testování na PřF OU, výpočet metrik hypotéz H1, H2, H3,
            promazávání testovacích dat a export do LaTeX tabulek pro diplomovou práci.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <a
            href="/api/admin/export.csv"
            download="pilot_dataset_faul_2027.csv"
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-xs transition shadow-sm"
          >
            <Download className="w-4 h-4" />
            CSV (Jamovi/SPSS)
          </a>
          <a
            href="/api/admin/export.json"
            download="pilot_dataset_faul_2027.json"
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-semibold rounded-xl text-xs transition shadow-sm"
          >
            <Download className="w-4 h-4" />
            JSON dataset
          </a>
        </div>
      </div>

      {/* Stavová notifikace */}
      {actionMessage && (
        <div
          className={`p-4 rounded-xl text-xs sm:text-sm flex items-center justify-between gap-3 ${
            actionMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {actionMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
            )}
            <span>{actionMessage.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionMessage(null)}
            className="text-xs font-bold underline hover:opacity-80"
          >
            Zavřít
          </button>
        </div>
      )}

      {/* Souhrnné KPI karty */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase">
              <span>Dokončená sezení (N)</span>
              <Users className="w-4 h-4 text-ou-blue" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black font-mono text-slate-900">{stats.completed_post_tests}</span>
              <span className="text-xs text-slate-500">z celkem {stats.total_sessions}</span>
            </div>
            <p className="text-xs text-slate-500 pt-1">
              Cíl pro obhajobu: 20–30 respondentů
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase">
              <span>SUS Skóre (Hypotéza H3)</span>
              <BarChart3 className="w-4 h-4 text-ou-blue" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black font-mono text-ou-blue">{stats.average_sus_score}</span>
              <span className="text-xs text-slate-500">/ 100</span>
            </div>
            <p className="text-xs text-slate-600 font-medium pt-1">
              {stats.average_sus_score >= 68 ? '✓ Nadprůměrná použitelnost (>68)' : 'Probíhá sběr dat'}
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase">
              <span>Změna jistoty (Hypotéza H2)</span>
              <TrendingUp className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black font-mono text-emerald-600">
                {stats.average_certainty_gain >= 0 ? `+${stats.average_certainty_gain}` : stats.average_certainty_gain}
              </span>
              <span className="text-xs text-slate-500">bodů na škále 0–10</span>
            </div>
            <p className="text-xs text-slate-500 pt-1">
              Před: {stats.average_pre_certainty} ➔ Po: {stats.average_post_certainty}
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase">
              <span>Velikost účinku (d_z)</span>
              <Sparkles className="w-4 h-4 text-ou-blue" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black font-mono text-slate-900">
                {stats.h2_effect_size_dz !== null ? stats.h2_effect_size_dz : '–'}
              </span>
              <span className="text-xs text-slate-500">Cohenovo d_z</span>
            </div>
            <p className="text-xs text-slate-500 pt-1">
              {stats.h2_effect_size_dz !== null && stats.h2_effect_size_dz >= 0.8 ? 'Velký efekt (d_z ≥ 0.8)' : 'Lakens (2013)'}
            </p>
          </div>
        </div>
      )}

      {/* Navigační záložky */}
      <div className="flex border-b border-slate-200 space-x-6 text-sm font-semibold">
        <button
          type="button"
          onClick={() => setActiveTab('charts')}
          className={`pb-3 border-b-2 transition flex items-center gap-2 ${
            activeTab === 'charts'
              ? 'border-ou-blue text-ou-blue font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          Výzkumné grafy a metriky pro diplomku
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('sessions')}
          className={`pb-3 border-b-2 transition flex items-center gap-2 ${
            activeTab === 'sessions'
              ? 'border-ou-blue text-ou-blue font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Sliders className="w-4 h-4" />
          Správa sezení a promazávání ({sessions.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('latex')}
          className={`pb-3 border-b-2 transition flex items-center gap-2 ${
            activeTab === 'latex'
              ? 'border-ou-blue text-ou-blue font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <FileText className="w-4 h-4" />
          LaTeX tabulky (bpfaul.tex)
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('import')}
          className={`pb-3 border-b-2 transition flex items-center gap-2 ${
            activeTab === 'import'
              ? 'border-ou-blue text-ou-blue font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Upload className="w-4 h-4" />
          Import témat
        </button>
      </div>

      {/* ZÁLOŽKA 1: VÝZKUMNÉ GRAFY PRO BAKALÁŘKU */}
      {activeTab === 'charts' && evalCharts && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Graf 1: SUS Benchmark a distribuce */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <Award className="w-4 h-4 text-ou-blue" />
                  SUS Použitelnost (Brooke, 1996)
                </h3>
                <span className="text-xs font-mono font-bold bg-ou-light text-ou-blue px-2.5 py-0.5 rounded-full">
                  Průměr: {evalCharts.sus_benchmark_avg} / 100
                </span>
              </div>

              {/* Teploměr / měřítko vůči 68.0 benchmarku */}
              <div className="space-y-2 pt-2">
                <div className="flex justify-between text-xs text-slate-600 font-medium">
                  <span>Průmyslový standard: 68.0 bodů</span>
                  <span>Naměřeno: {evalCharts.sus_benchmark_avg}</span>
                </div>
                <div className="relative w-full bg-slate-100 h-4 rounded-full overflow-hidden">
                  <div
                    className="bg-ou-blue h-4 rounded-full transition-all duration-700"
                    style={{ width: `${Math.min(100, evalCharts.sus_benchmark_avg)}%` }}
                  />
                  {/* Čára pro benchmark 68.0 */}
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10"
                    style={{ left: '68%' }}
                    title="Průmyslový benchmark 68 bodů"
                  />
                </div>
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>0 (Nepoužitelné)</span>
                  <span className="text-red-600 font-bold">68.0 (Průměr)</span>
                  <span>80+ (Vynikající)</span>
                  <span>100</span>
                </div>
              </div>

              {/* Histogram rozložení */}
              <div className="pt-3 border-t border-slate-100 space-y-2">
                <span className="text-xs font-bold text-slate-700 block">Kategorizace výsledků respondentů:</span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                    <span className="text-slate-500 block text-[11px]">Vynikající (&ge; 80 bodů)</span>
                    <strong className="text-emerald-700 text-lg font-mono">{evalCharts.sus_histogram.over_80}</strong> respondentů
                  </div>
                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                    <span className="text-slate-500 block text-[11px]">Dobré (68–79 bodů)</span>
                    <strong className="text-blue-700 text-lg font-mono">{evalCharts.sus_histogram['68_to_80']}</strong> respondentů
                  </div>
                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                    <span className="text-slate-500 block text-[11px]">Podprůměrné (50–67 bodů)</span>
                    <strong className="text-amber-700 text-lg font-mono">{evalCharts.sus_histogram['50_to_68']}</strong> respondentů
                  </div>
                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                    <span className="text-slate-500 block text-[11px]">Nepřijatelné (&lt; 50 bodů)</span>
                    <strong className="text-rose-700 text-lg font-mono">{evalCharts.sus_histogram.under_50}</strong> respondentů
                  </div>
                </div>
              </div>
            </div>

            {/* Graf 2: TAM Model (Užitečnost a snadnost) */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-ou-blue" />
                  Technologické přijetí TAM (Davis, 1989)
                </h3>
                <span className="text-xs text-slate-500">Škála 1 až 5</span>
              </div>

              <div className="space-y-4 pt-2">
                {/* PU */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-800">Vnímaná užitečnost (PU – Perceived Usefulness):</span>
                    <span className="font-mono font-bold text-blue-700 text-sm">{evalCharts.tam_pu_avg} / 5.0</span>
                  </div>
                  <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                    <div
                      className="bg-blue-600 h-3 rounded-full transition-all duration-700"
                      style={{ width: `${(evalCharts.tam_pu_avg / 5) * 100}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Ověřuje, zda student vnímá doporučení jako přínosné pro své rozhodování.
                  </p>
                </div>

                {/* PEOU */}
                <div className="space-y-1.5 pt-2 border-t border-slate-100">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-800">Snadnost použití (PEOU – Ease of Use):</span>
                    <span className="font-mono font-bold text-emerald-700 text-sm">{evalCharts.tam_peou_avg} / 5.0</span>
                  </div>
                  <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-600 h-3 rounded-full transition-all duration-700"
                      style={{ width: `${(evalCharts.tam_peou_avg / 5) * 100}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Měří intuitivnost a bezproblémovost ovládání rozhraní.
                  </p>
                </div>
              </div>
            </div>

            {/* Graf 3: Posun rozhodovací jistoty (Pre -> Post) */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                  Párový posun rozhodovací jistoty (H2)
                </h3>
                <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Zisk: +{evalCharts.certainty_gain_avg} bodů
                </span>
              </div>

              <div className="flex items-center justify-around py-3 text-center bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <span className="text-[11px] text-slate-500 block uppercase font-semibold">Předem (Pre)</span>
                  <span className="text-2xl font-black font-mono text-slate-700">{evalCharts.certainty_pre_avg}</span>
                  <span className="text-[10px] text-slate-400 block">ze 10 bodů</span>
                </div>
                <div className="text-2xl font-bold text-slate-400">➔</div>
                <div>
                  <span className="text-[11px] text-slate-500 block uppercase font-semibold">Po použití (Post)</span>
                  <span className="text-2xl font-black font-mono text-emerald-600">{evalCharts.certainty_post_avg}</span>
                  <span className="text-[10px] text-slate-400 block">ze 10 bodů</span>
                </div>
              </div>

              {/* Seznam párových hodnot */}
              <div className="space-y-1.5 max-h-40 overflow-y-auto text-xs pr-1">
                {evalCharts.certainty_pairs.map((pair) => (
                  <div
                    key={pair.code}
                    className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200/80"
                  >
                    <span className="font-mono text-slate-600 font-semibold">{pair.code}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500">{pair.pre} ➔ {pair.post}</span>
                      <span
                        className={`font-mono font-bold px-1.5 py-0.5 rounded text-[11px] ${
                          pair.diff > 0
                            ? 'bg-emerald-100 text-emerald-800'
                            : pair.diff === 0
                            ? 'bg-slate-200 text-slate-700'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {pair.diff >= 0 ? `+${pair.diff}` : pair.diff}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Graf 4: Agregovaný Hollandův profil respondentů */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-ou-blue" />
                  Průměrný profil respondentů (RIASEC)
                </h3>
                <span className="text-xs text-slate-500">Agregace všech profilů</span>
              </div>

              <div className="flex flex-col items-center justify-center pt-2">
                <HollandHexagonChart
                  riasec={{
                    R: evalCharts.riasec_means.R,
                    I: evalCharts.riasec_means.I,
                    A: evalCharts.riasec_means.A,
                    S: evalCharts.riasec_means.S,
                    E: evalCharts.riasec_means.E,
                    C: evalCharts.riasec_means.C,
                  }}
                  size={260}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ZÁLOŽKA 2: SPRÁVA SEZENÍ & ČIŠTĚNÍ */}
      {activeTab === 'sessions' && (
        <div className="space-y-6">
          {/* Akční lišta hromadného čištění */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <Trash2 className="w-4 h-4 text-ou-blue" />
                  Nástroje pro čištění databáze sezení
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Umožňuje jedním kliknutím odstranit testovací, opuštěné či neúplné pokusy před ostrým spuštěním.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                type="button"
                onClick={() => handleCleanup('empty')}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5 text-slate-500" />
                Smazat prázdná sezení ({emptySessionsCount})
              </button>

              <button
                type="button"
                onClick={() => handleCleanup('incomplete')}
                className="px-4 py-2 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 text-xs font-bold rounded-xl transition flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5 text-amber-600" />
                Smazat nedokončená sezení ({incompleteSessionsCount})
              </button>

              <button
                type="button"
                onClick={() => handleCleanup('demo')}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                Smazat pouze demo sezení
              </button>

              <button
                type="button"
                onClick={() => handleCleanup('all')}
                className="px-4 py-2 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-bold rounded-xl transition flex items-center gap-1.5 ml-auto"
              >
                <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                Resetovat celou databázi
              </button>
            </div>
          </div>

          {/* Tabulka sezení */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Hledat podle kódu sezení (STU-...)..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs focus:ring-ou-blue focus:border-ou-blue"
                />
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={modeFilter}
                  onChange={(e) => setModeFilter(e.target.value as any)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-700"
                >
                  <option value="all">Všechny režimy</option>
                  <option value="pilot">Pouze pilot</option>
                  <option value="demo">Pouze demo</option>
                </select>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-700"
                >
                  <option value="all">Všechny stavy</option>
                  <option value="completed">Pouze dokončené (Post-test)</option>
                  <option value="incomplete">Pouze nedokončené</option>
                </select>
              </div>
            </div>

            {/* Samotná tabulka */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px]">
                    <th className="py-2.5 px-3">Kód sezení</th>
                    <th className="py-2.5 px-3">Datum vytvoření</th>
                    <th className="py-2.5 px-3">Režim</th>
                    <th className="py-2.5 px-3">Pre-test</th>
                    <th className="py-2.5 px-3">Profil</th>
                    <th className="py-2.5 px-3">Post-test</th>
                    <th className="py-2.5 px-3 text-right">Akce</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredSessions.map((s) => (
                    <tr key={s.session_code} className="hover:bg-slate-50/70 transition">
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-800">
                        {s.session_code}
                      </td>
                      <td className="py-2.5 px-3 text-slate-500">
                        {s.created_at}
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            s.mode === 'pilot' ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {s.mode}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        {s.has_pre ? (
                          <span className="text-emerald-700 font-medium">
                            ✓ Vyplněn (Jistota: {s.decision_certainty_pre}/10)
                          </span>
                        ) : (
                          <span className="text-slate-400">–</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3">
                        {s.has_profile ? (
                          <span className="text-emerald-700 font-medium">✓ Vyplněn</span>
                        ) : (
                          <span className="text-slate-400">–</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3">
                        {s.has_post ? (
                          <span className="text-emerald-700 font-bold">
                            ✓ SUS {s.sus_score} (Jistota: {s.decision_certainty_post}/10)
                          </span>
                        ) : (
                          <span className="text-slate-400">Nedokončeno</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleDeleteSingle(s.session_code)}
                          title="Smazat toto sezení"
                          className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredSessions.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        Nenalezena žádná sezení odpovídající zvolenému filtru.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ZÁLOŽKA 3: LATEX TABULKY PRO DIPLOMKU */}
      {activeTab === 'latex' && evalCharts && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
          <div className="border-b border-slate-200 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <FileText className="w-5 h-5 text-ou-blue" />
                Automatický LaTeX export do diplomové práce
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Kód tabulky se souhrnnými statistikami generovaný přímo z databázových dat. Můžete jej přímo vložit do souboru <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800 font-mono">bpfaul.tex</code>.
              </p>
            </div>

            <button
              type="button"
              onClick={handleCopyLatex}
              className="px-4 py-2 bg-ou-blue hover:bg-ou-dark text-white font-bold rounded-xl text-xs transition shadow flex items-center gap-1.5 self-start sm:self-auto"
            >
              {copiedLatex ? (
                <>
                  <Check className="w-4 h-4 text-emerald-300" />
                  Zkopírováno do schránky!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Kopírovat LaTeX kód
                </>
              )}
            </button>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 block uppercase tracking-wide">
              Zdrojový kód tabulky (\begin&#123;table&#125; ... \end&#123;table&#125;):
            </label>
            <pre className="p-4 bg-slate-900 text-slate-100 rounded-2xl font-mono text-xs overflow-x-auto leading-relaxed border border-slate-800 selection:bg-ou-blue">
              {evalCharts.latex_table_code}
            </pre>
          </div>

          <div className="p-4 bg-ou-light/40 border border-ou-blue/20 rounded-xl text-xs text-slate-700 space-y-1">
            <strong className="text-ou-blue block font-bold">Doporučené umístění v bakalářské práci:</strong>
            <p>
              Vložte do <strong>Kapitoly 6 (Evaluace a empirické ověření)</strong> do podkapitoly shrnující statistické ověření hypotéz $H_1$, $H_2$ a $H_3$.
            </p>
          </div>
        </div>
      )}

      {/* ZÁLOŽKA 4: IMPORT TÉMAT */}
      {activeTab === 'import' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
          <div className="border-b border-slate-200 pb-4">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Upload className="w-5 h-5 text-ou-blue" />
              Import témat a sylabů z externího exportu
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Můžete nahrát nový soubor s tématy z univerzitního informačního systému (STAG).
              Importér automaticky rozpozná formát JSON, CSV, TSV i textové bloky.
            </p>
          </div>

          <div className="max-w-xl">
            <label className="block text-xs font-semibold uppercase text-slate-700 mb-2">
              Vyberte soubor (JSON, CSV, TSV nebo TXT):
            </label>
            <input
              type="file"
              accept=".json,.csv,.tsv,.txt"
              onChange={handleFileUpload}
              disabled={isUploading}
              className="block w-full text-xs text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-ou-blue file:text-white hover:file:bg-ou-dark cursor-pointer border border-slate-200 rounded-xl bg-slate-50 p-2"
            />
          </div>

          {uploadStatus && (
            <div
              className={`p-4 rounded-xl text-xs sm:text-sm flex items-center gap-2 ${
                uploadStatus.includes('Chyba')
                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              }`}
            >
              {uploadStatus.includes('Chyba') ? (
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
              ) : (
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              )}
              <span>{uploadStatus}</span>
            </div>
          )}

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1">
            <strong className="text-slate-800 block">Automatické indexování:</strong>
            <p>
              Při nahrání se nová témata okamžitě uloží do SQLite databáze a doporučovací algoritmus pro ně ihned přepočítá TF-IDF vektorové reprezentace.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
