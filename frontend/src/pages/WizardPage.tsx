import React, { useState, useEffect } from 'react';
import { WizardStepGdpr } from '../components/WizardStepGdpr';
import { WizardStepPreTest } from '../components/WizardStepPreTest';
import { WizardStepProfile } from '../components/WizardStepProfile';
import { WizardStepRecommendations } from '../components/WizardStepRecommendations';
import { WizardStepPostTest } from '../components/WizardStepPostTest';
import { WizardStepFinished } from '../components/WizardStepFinished';
import {
  initSession,
  submitPreTest,
  saveProfile,
  getRecommendations,
  submitPostTest,
  fetchCourses,
} from '../services/api';
import {
  CourseItem,
  PreTestData,
  StudentProfileData,
  RecommendationsResponse,
  PostTestData,
} from '../types';

interface WizardPageProps {
  sessionCode: string | null;
  setSessionCode: (code: string) => void;
  onGoToDemo: () => void;
}

export const WizardPage: React.FC<WizardPageProps> = ({
  sessionCode,
  setSessionCode,
  onGoToDemo,
}) => {
  const [step, setStep] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [courses, setCourses] = useState<CourseItem[]>([]);

  // Uložený stav z průběhu
  const [profileData, setProfileData] = useState<StudentProfileData | null>(null);
  const [recommendations, setRecommendations] = useState<RecommendationsResponse | null>(null);
  const [finalSus, setFinalSus] = useState<number>(0);
  const [certaintyDiff, setCertaintyDiff] = useState<number>(0);

  useEffect(() => {
    fetchCourses()
      .then((data) => setCourses(data))
      .catch((err) => console.error(err));
  }, []);

  // Krok 0 -> Krok 1 (GDPR souhlas -> Inicializace sezení)
  const handleGdprAccept = async () => {
    setIsLoading(true);
    try {
      const res = await initSession('pilot');
      setSessionCode(res.session_code);
      setStep(1);
    } catch (err) {
      console.error(err);
      alert('Chyba při inicializaci sezení. Zkontrolujte, zda běží backend na portu 8000.');
    } finally {
      setIsLoading(false);
    }
  };

  // Krok 1 -> Krok 2 (Pre-test -> Profil)
  const handlePreTestSubmit = async (data: PreTestData) => {
    setIsLoading(true);
    try {
      await submitPreTest(data);
      setStep(2);
    } catch (err) {
      console.error(err);
      alert('Chyba při ukládání pre-testu.');
    } finally {
      setIsLoading(false);
    }
  };

  // Krok 2 -> Krok 3 (Profil -> Výpočet doporučení)
  const handleProfileSubmit = async (profile: StudentProfileData) => {
    if (!sessionCode) return;
    setIsLoading(true);
    try {
      setProfileData(profile);
      await saveProfile(sessionCode, profile);
      const recs = await getRecommendations({
        session_code: sessionCode,
        top_k: 5,
      });
      setRecommendations(recs);
      setStep(3);
    } catch (err) {
      console.error(err);
      alert('Chyba při výpočtu doporučení.');
    } finally {
      setIsLoading(false);
    }
  };

  // Krok 3 -> Krok 4 (Doporučení -> Post-test)
  const handleProceedToPostTest = () => {
    setStep(4);
  };

  // Krok 4 -> Krok 5 (Post-test -> Hotovo)
  const handlePostTestSubmit = async (data: PostTestData) => {
    setIsLoading(true);
    try {
      const res = await submitPostTest(data);
      setFinalSus(res.sus_final_score);
      setCertaintyDiff(res.certainty_difference);
      setStep(5);
    } catch (err) {
      console.error(err);
      alert('Chyba při ukládání post-testu.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestart = () => {
    setStep(0);
    setProfileData(null);
    setRecommendations(null);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Progress indikátor pro kroky 1-4 */}
      {step >= 1 && step <= 4 && (
        <div className="max-w-3xl mx-auto mb-8">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-2">
            <span className={step >= 1 ? 'text-ou-blue font-bold' : ''}>1. Demografie & Jistota</span>
            <span className={step >= 2 ? 'text-ou-blue font-bold' : ''}>2. Profilový formulář</span>
            <span className={step >= 3 ? 'text-ou-blue font-bold' : ''}>3. Doporučení témat</span>
            <span className={step >= 4 ? 'text-ou-blue font-bold' : ''}>4. Evaluace SUS/TAM</span>
          </div>
          <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
            <div
              className="bg-ou-blue h-full transition-all duration-300"
              style={{ width: `${(step / 4) * 100}%` }}
            ></div>
          </div>
        </div>
      )}

      {step === 0 && (
        <WizardStepGdpr onAccept={handleGdprAccept} isLoading={isLoading} />
      )}

      {step === 1 && sessionCode && (
        <WizardStepPreTest
          sessionCode={sessionCode}
          onSubmit={handlePreTestSubmit}
          isLoading={isLoading}
          onBack={() => setStep(0)}
        />
      )}

      {step === 2 && (
        <WizardStepProfile
          initialProfile={profileData}
          courses={courses}
          onSubmit={handleProfileSubmit}
          isLoading={isLoading}
          onBack={() => setStep(1)}
        />
      )}

      {step === 3 && recommendations && (
        <WizardStepRecommendations
          data={recommendations}
          profile={profileData}
          onProceed={handleProceedToPostTest}
          onBack={() => setStep(2)}
        />
      )}

      {step === 4 && sessionCode && (
        <WizardStepPostTest
          sessionCode={sessionCode}
          onSubmit={handlePostTestSubmit}
          isLoading={isLoading}
          onBack={() => setStep(3)}
        />
      )}

      {step === 5 && sessionCode && (
        <WizardStepFinished
          sessionCode={sessionCode}
          susScore={finalSus}
          certaintyDiff={certaintyDiff}
          onRestart={handleRestart}
          onGoToDemo={onGoToDemo}
        />
      )}
    </div>
  );
};
