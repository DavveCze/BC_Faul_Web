import React, { useState, useMemo, useRef } from 'react';
import {
  Sparkles,
  BookOpen,
  Tag,
  ArrowRight,
  ArrowLeft,
  UploadCloud,
  FileText,
  CheckCircle2,
  Trash2,
  GraduationCap,
  Plus,
  AlertCircle,
  RotateCcw
} from 'lucide-react';
import { StudentProfileData, CourseItem, CompletedCourseInput, ParsedStagCourse } from '../types/index';
import { QUIZ_QUESTIONS, calculateProfileFromAnswers, getProfileInsights } from '../utils/profileCalculator';
import { uploadStagFile, parseStagText } from '../services/api';

interface WizardStepProfileProps {
  initialProfile?: StudentProfileData | null;
  courses: CourseItem[];
  onSubmit: (profile: StudentProfileData) => void;
  isLoading: boolean;
  onBack: () => void;
}

export const WizardStepProfile: React.FC<WizardStepProfileProps> = ({
  initialProfile,
  courses,
  onSubmit,
  isLoading,
  onBack,
}) => {
  // Výchozí odpovědi 1-5 pro 12 scénářových otázek
  const [answers, setAnswers] = useState<Record<string, number>>({
    q1: 0,
    q2: 0,
    q3: 0,
    q4: 0,
    q5: 0,
    q6: 0,
    q7: 0,
    q8: 0,
    q9: 0,
    q10: 0,
    q11: 0,
    q12: 0,
  });

  // Absolvované předměty studenta (výchozí stav čistý nebo z předchozího kroku)
  const [selectedCourses, setSelectedCourses] = useState<CompletedCourseInput[]>(
    initialProfile?.completed_courses || []
  );

  // STAG metadata (striktně anonymizováno - žádná jména ani čísla osob)
  const [stagLoading, setStagLoading] = useState(false);
  const [stagError, setStagError] = useState<string | null>(null);
  const [stagStudyInfo, setStagStudyInfo] = useState<{
    program: string | null;
    study_form: string | null;
  } | null>(null);

  // Režimy zadávání STAGu
  const [showPasteModal, setShowPasteModal] = useState(false);
  const [pastedText, setPastedText] = useState('');
  const [courseFilter, setCourseFilter] = useState<'all' | 'kip' | 'passed'>('all');
  const [manualCatalogOpen, setManualCatalogOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Volitelný modul 2: klíčová slova zájmů
  const [keywordsInput, setKeywordsInput] = useState<string>(
    initialProfile?.hobby_keywords ? initialProfile.hobby_keywords.join(', ') : 'web, aplikace, databáze'
  );

  const handleAnswerChange = (questionId: string, value: number) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  // Upload PDF ze STAGu
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setStagLoading(true);
    setStagError(null);

    try {
      const res = await uploadStagFile(file);
      if (res.courses && res.courses.length > 0) {
        if (res.study) {
          setStagStudyInfo(res.study);
        }
        const imported: CompletedCourseInput[] = res.courses.map((c: ParsedStagCourse) => ({
          code: c.code,
          grade: c.grade,
          name: c.name,
          credits: c.credits,
          statut: c.statut,
          exam_type: c.exam_type,
          is_passed: c.is_passed,
        }));
        setSelectedCourses(imported);
      } else {
        setStagError('V souboru nebyly nalezeny žádné předměty v odpovídajícím formátu.');
      }
    } catch (err: any) {
      setStagError(err.response?.data?.detail || 'Chyba při čtení exportu ze STAGu.');
    } finally {
      setStagLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Parsování zkopírovaného textu
  const handleTextParseSubmit = async () => {
    if (!pastedText.trim()) return;

    setStagLoading(true);
    setStagError(null);

    try {
      const res = await parseStagText(pastedText);
      if (res.courses && res.courses.length > 0) {
        if (res.study) {
          setStagStudyInfo(res.study);
        }
        const imported: CompletedCourseInput[] = res.courses.map((c: ParsedStagCourse) => ({
          code: c.code,
          grade: c.grade,
          name: c.name,
          credits: c.credits,
          statut: c.statut,
          exam_type: c.exam_type,
          is_passed: c.is_passed,
        }));
        setSelectedCourses(imported);
        setShowPasteModal(false);
        setPastedText('');
      } else {
        setStagError('V zadaném textu nebyly nalezeny žádné předměty v odpovídajícím formátu.');
      }
    } catch (err: any) {
      setStagError(err.response?.data?.detail || 'Chyba při čtení textu ze STAGu.');
    } finally {
      setStagLoading(false);
    }
  };

  const handleGradeChange = (code: string, grade: string) => {
    setSelectedCourses((prev) =>
      prev.map((c) => (c.code === code ? { ...c, grade } : c))
    );
  };

  const handleRemoveCourse = (code: string) => {
    setSelectedCourses((prev) => prev.filter((c) => c.code !== code));
  };

  const handleAddManualCourse = (course: CourseItem) => {
    if (selectedCourses.some((c) => c.code === course.code)) return;
    setSelectedCourses((prev) => [
      ...prev,
      {
        code: course.code,
        name: course.name,
        grade: 'A',
        credits: course.credits,
        statut: 'A',
        is_passed: true,
      },
    ]);
  };

  const handleClearAllCourses = () => {
    setSelectedCourses([]);
    setStagStudyInfo(null);
    setStagError(null);
  };

  // Filtrování zobrazených předmětů
  const filteredCourses = useMemo(() => {
    return selectedCourses.filter((c) => {
      if (courseFilter === 'kip') {
        return c.code.startsWith('KIP/');
      }
      if (courseFilter === 'passed') {
        return c.grade !== 'F' && c.grade !== '4';
      }
      return true;
    });
  }, [selectedCourses, courseFilter]);

  const kipCount = useMemo(() => {
    return selectedCourses.filter((c) => c.code.startsWith('KIP/')).length;
  }, [selectedCourses]);

  // Živý přepočet profilu
  const computedProfile = useMemo(() => {
    const kwList = keywordsInput
      .split(',')
      .map((k) => k.trim())
      .filter((k) => k.length > 1);
    const prof = calculateProfileFromAnswers(answers, kwList);
    prof.completed_courses = selectedCourses;
    return prof;
  }, [answers, keywordsInput, selectedCourses]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(computedProfile);
  };

  const isInCompleted = Object.values(answers).every((val) => val > 0);

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-10 space-y-10">
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-ou-blue mb-1">
          <Sparkles className="w-4 h-4" />
          Krok 2 z 4 • Osobnostní a profesní diagnostika
        </div>
        <h2 className="text-2xl font-bold text-slate-800">
          Jaký typ úkolů a způsob práce vás nejvíce vystihuje?
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Odpovězte na následujících 12 výroků podle toho, jak přirozeně vnímáte své silné stránky a motivaci.
          Algoritmus na pozadí propojí vaše preference se zaměřením vypsaných bakalářských témat.
        </p>
      </div>

      {/* 12 scénářových otázek */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
          <h3 className="text-base font-bold text-slate-800">
            1. Scénáře činností, motivace a pracovního stylu
          </h3>
          <span className="text-xs text-slate-500 hidden sm:inline">
            1 = Vůbec mě nevystihuje • 5 = Zcela mě vystihuje
          </span>
        </div>

        <div className="space-y-3.5">
          {QUIZ_QUESTIONS.map((q, idx) => (
            <div
              key={q.id}
              className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-slate-300 transition"
            >
              <div className="flex items-start gap-3 flex-1">
                <span className="w-6 h-6 rounded-full bg-white border border-slate-300 text-slate-600 font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
                  {idx + 1}
                </span>
                <span className="text-sm text-slate-800 font-medium leading-relaxed">
                  {q.text}
                </span>
              </div>

              <div className="flex items-center gap-1.5 self-end sm:self-center pl-9 sm:pl-0">
                {[1, 2, 3, 4, 5].map((val) => {
                  const isSelected = (answers[q.id] || 0) === val;
                  return (
                    <button
                      key={val}
                      type="button"
                      onClick={() => handleAnswerChange(q.id, val)}
                      className={`w-9 h-9 rounded-xl text-xs font-bold transition flex items-center justify-center ${
                        isSelected
                          ? 'bg-ou-blue text-white shadow'
                          : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {val}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Volitelný modul 1: Absolvované kurzy a import ze STAGu */}
      <div className="space-y-4">
        <div className="border-b border-slate-200 pb-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-ou-blue" />
              <h3 className="text-base font-bold text-slate-800">
                2. Absolvované předměty z IS/STAG (Volitelné)
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Nahrajte export ze STAGu nebo zadejte předměty ručně. Algoritmus využije sylaby absolvovaných kurzů pro přesnější doporučení navazujících témat.
            </p>
          </div>

          {selectedCourses.length > 0 && (
            <button
              type="button"
              onClick={handleClearAllCourses}
              className="text-xs text-red-600 hover:text-red-700 flex items-center gap-1 font-medium self-start sm:self-auto"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Resetovat předměty
            </button>
          )}
        </div>

        {/* Informační karta úspěšného anonymního importu ze STAGu */}
        {selectedCourses.length > 0 && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center justify-between gap-3 text-xs text-emerald-900">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0">
                <GraduationCap className="w-4 h-4" />
              </div>
              <div>
                <p className="font-bold text-emerald-950">
                  Export úspěšně načten a plně anonymizován
                </p>
                <p className="text-emerald-700">
                  {stagStudyInfo?.program && (
                    <>Obor: <span className="font-semibold">{stagStudyInfo.program}</span> • </>
                  )}
                  Načteno <span className="font-semibold">{selectedCourses.length} předmětů</span> (z toho {kipCount} KIP)
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Chybová hláška */}
        {stagError && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-center gap-2 text-xs text-red-700">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{stagError}</span>
          </div>
        )}

        {/* Drop zóna pro import souboru nebo textu */}
        {selectedCourses.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Upload PDF */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 hover:border-ou-blue hover:bg-ou-light/20 rounded-2xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center gap-2"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.txt"
                onChange={handleFileUpload}
                className="hidden"
              />
              <div className="w-10 h-10 rounded-full bg-ou-light text-ou-blue flex items-center justify-center">
                <UploadCloud className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800">
                  {stagLoading ? 'Analyzuji export...' : 'Nahrát export ze STAGu (PDF)'}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Vložte soubor <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-700">prubeh_studia.pdf</code> stažený ze STAGu
                </p>
              </div>
            </div>

            {/* Vložit text ze STAGu */}
            <div
              onClick={() => setShowPasteModal(true)}
              className="border border-slate-200 hover:border-slate-300 bg-slate-50 hover:bg-slate-100/80 rounded-2xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center gap-2"
            >
              <div className="w-10 h-10 rounded-full bg-white border border-slate-200 text-slate-700 flex items-center justify-center shadow-sm">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800">
                  Vložit text z tabulky STAG
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Zkopírujte řádky předmětů přímo z webového rozhraní portálu STAG
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Ovládací lišta načtených kurzů */}
            <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setCourseFilter('all')}
                  className={`px-2.5 py-1 rounded-lg font-medium transition ${
                    courseFilter === 'all'
                      ? 'bg-ou-blue text-white shadow-sm'
                      : 'text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Všechny ({selectedCourses.length})
                </button>
                <button
                  type="button"
                  onClick={() => setCourseFilter('kip')}
                  className={`px-2.5 py-1 rounded-lg font-medium transition ${
                    courseFilter === 'kip'
                      ? 'bg-ou-blue text-white shadow-sm'
                      : 'text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Pouze KIP ({kipCount})
                </button>
                <button
                  type="button"
                  onClick={() => setCourseFilter('passed')}
                  className={`px-2.5 py-1 rounded-lg font-medium transition ${
                    courseFilter === 'passed'
                      ? 'bg-ou-blue text-white shadow-sm'
                      : 'text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Splněné ({selectedCourses.filter((c) => c.grade !== 'F').length})
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-100 font-medium flex items-center gap-1"
                >
                  <UploadCloud className="w-3.5 h-3.5" />
                  Nahrát jiné PDF
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.txt"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => setManualCatalogOpen(!manualCatalogOpen)}
                  className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-100 font-medium flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  {manualCatalogOpen ? 'Zavřít katalog' : 'Přidat předmět'}
                </button>
              </div>
            </div>

            {/* Rozbalovací katalog pro ruční přidání */}
            {manualCatalogOpen && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <p className="text-xs font-bold text-slate-700">
                  Vyberte předmět z výchozího katalogu pro přidání:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto text-xs">
                  {courses
                    .filter((c) => !selectedCourses.some((sc) => sc.code === c.code))
                    .map((c) => (
                      <div
                        key={c.code}
                        onClick={() => handleAddManualCourse(c)}
                        className="p-2 bg-white rounded-lg border border-slate-200 hover:border-ou-blue cursor-pointer flex items-center justify-between"
                      >
                        <div>
                          <span className="font-bold text-slate-800">{c.code}</span>
                          <span className="text-slate-600 block text-[11px] truncate max-w-[200px]">
                            {c.name}
                          </span>
                        </div>
                        <Plus className="w-4 h-4 text-ou-blue" />
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Mřížka načtených předmětů */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs max-h-80 overflow-y-auto pr-1">
              {filteredCourses.map((c) => (
                <div
                  key={c.code}
                  className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-2 hover:border-slate-300 transition"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-slate-800">{c.code}</span>
                      {c.statut && (
                        <span className="px-1.5 py-0.2 bg-slate-200 text-slate-700 text-[10px] font-semibold rounded">
                          {c.statut}
                        </span>
                      )}
                      {c.credits ? (
                        <span className="text-slate-400 text-[11px]">{c.credits} kr.</span>
                      ) : null}
                    </div>
                    <span className="text-slate-600 block text-[11px] truncate">
                      {c.name || c.code}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <select
                      value={c.grade}
                      onChange={(e) => handleGradeChange(c.code, e.target.value)}
                      className={`text-xs rounded-lg px-2 py-1 font-bold border focus:ring-ou-blue ${
                        c.grade === 'F' || c.grade === '4'
                          ? 'bg-red-50 text-red-600 border-red-200'
                          : 'bg-white text-ou-blue border-slate-300'
                      }`}
                    >
                      <option value="A">A (1)</option>
                      <option value="B">B (1.5)</option>
                      <option value="C">C (2)</option>
                      <option value="D">D (2.5)</option>
                      <option value="E">E (3)</option>
                      <option value="S">S (Zápočet)</option>
                      <option value="F">F (Nesplněno)</option>
                    </select>

                    <button
                      type="button"
                      onClick={() => handleRemoveCourse(c.code)}
                      title="Odebrat z profilu"
                      className="p-1 text-slate-400 hover:text-red-500 rounded transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Modal / textarea pro ruční vložení textu */}
        {showPasteModal && (
          <div className="p-4 bg-slate-50 border border-slate-300 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                Vložení textu exportu ze STAGu
              </h4>
              <button
                type="button"
                onClick={() => setShowPasteModal(false)}
                className="text-xs text-slate-500 hover:text-slate-800"
              >
                Zavřít
              </button>
            </div>
            <textarea
              rows={5}
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
              placeholder="Zkopírujte a vložte řádky ze STAGu, např.:&#10;24/25 KIP/7ALG1 Základy algoritmizace ZS 5 2+3+0 A AZk 1 20.12.24 94&#10;24/25 KIP/7APOS Architektura počítačů a základy OS ZS 5 2+2+0 A CZk 1 07.01.25 79"
              className="w-full bg-white border border-slate-300 rounded-xl p-3 text-xs font-mono focus:ring-ou-blue focus:border-ou-blue"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowPasteModal(false)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-200 rounded-lg transition"
              >
                Zrušit
              </button>
              <button
                type="button"
                onClick={handleTextParseSubmit}
                disabled={stagLoading || !pastedText.trim()}
                className="px-4 py-1.5 text-xs font-bold bg-ou-blue text-white rounded-lg hover:bg-ou-dark transition disabled:opacity-50"
              >
                {stagLoading ? 'Analyzuji...' : 'Zpracovat zadané předměty'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Volitelný modul 2: Klíčová slova mimostudijních zájmů */}
      <div className="space-y-3">
        <div className="border-b border-slate-200 pb-2">
          <div className="flex items-center gap-2">
            <Tag className="w-4 h-4 text-ou-blue" />
            <h3 className="text-base font-bold text-slate-800">
              3. Zájmové okruhy a témata, která vás lákají (Volitelné)
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Uveďte několik klíčových slov oddělených čárkou (např. technologie, koníčky, domény jako web, hry, mobil, bioinformatika, finance, psychologie).
          </p>
        </div>

        <input
          type="text"
          value={keywordsInput}
          onChange={(e) => setKeywordsInput(e.target.value)}
          placeholder="např. web, react, databáze, hry, grafika, strojové učení, bezpečnost, psychologie"
          className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-sm focus:ring-ou-blue focus:border-ou-blue"
        />
      </div>

      {/* Navigační tlačítka */}
      <div className="pt-4 border-t border-slate-200 flex justify-between items-center">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2.5 text-slate-600 hover:text-slate-900 font-medium text-sm transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Zpět k orientaci
        </button>

        <button
          type="submit"
          disabled={isLoading || isInCompleted === false}
          className="flex items-center gap-2 px-6 py-3 bg-ou-blue hover:bg-ou-dark text-white font-semibold rounded-xl transition shadow disabled:opacity-50"
        >
          {isLoading ? 'Vyhodnocuji profil...' : 'Zobrazit doporučená témata'}
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </form>
  );
};
