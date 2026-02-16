import { useState, useEffect } from 'react';
import type { Question, SurveyData } from '../lib/types';
import { api } from '../lib/api';
import Signup from './Signup';
import Confirmation from './Confirmation';
import QuestionField from '../components/QuestionField';
import SurveyLayout from '../components/SurveyLayout';

export default function Survey() {
  const [step, setStep] = useState(1);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [surveyOpen, setSurveyOpen] = useState<boolean | null>(null);
  const [data, setData] = useState<SurveyData>({
    name: '', email: '', phone: '',
    lives_in_bahamas: true, island: '', country: '',
    age_group: '', sector: '',
    answers: {},
  });

  useEffect(() => {
    Promise.all([
      api.getQuestions().then(setQuestions),
      api.getSurveyStatus().then((r) => setSurveyOpen(r.survey_open)),
    ]).finally(() => setLoading(false));
  }, []);

  const updateData = (updates: Partial<SurveyData>) => {
    setData((prev) => ({ ...prev, ...updates }));
  };

  const updateAnswer = (questionId: number, value: string) => {
    setData((prev) => ({
      ...prev,
      answers: { ...prev.answers, [questionId]: value },
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-bahamas-aqua-light to-white flex items-center justify-center">
        <p className="text-gray-500">Loading survey...</p>
      </div>
    );
  }

  if (!loading && surveyOpen === false) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-bahamas-aqua-light to-white flex items-center justify-center px-4">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Survey Closed</h1>
          <p className="text-gray-600 mb-4">The survey is currently not accepting responses.</p>
          <button
            onClick={() => window.location.href = '/'}
            className="bg-bahamas-aqua text-white px-6 py-2 rounded-lg font-medium hover:opacity-90"
          >
            Return Home
          </button>
        </div>
      </div>
    );
  }

  switch (step) {
    case 1:
      return <Signup data={data} updateData={updateData} onNext={() => setStep(2)} />;
    case 2:
      return (
        <SurveyLayout step={2} title="Survey Questions" totalSteps={3}>
          <form
            onSubmit={(e) => { e.preventDefault(); setStep(3); }}
            className="space-y-6"
          >
            {questions.map((q) => (
              <QuestionField
                key={q.id}
                question={q}
                value={data.answers[q.id] || ''}
                onChange={(val) => updateAnswer(q.id, val)}
              />
            ))}
            <div className="pt-4 flex gap-3 sm:gap-0 sm:justify-between">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex-1 sm:flex-none px-6 py-3 sm:py-2 border border-gray-300 rounded-lg font-medium text-base sm:text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Back
              </button>
              <button
                type="submit"
                className="flex-1 sm:flex-none bg-bahamas-aqua text-white px-6 py-3 sm:py-2 rounded-lg font-medium text-base sm:text-sm hover:opacity-90 transition-opacity"
              >
                Next
              </button>
            </div>
          </form>
        </SurveyLayout>
      );
    case 3:
      return (
        <Confirmation
          data={data}
          questions={questions}
          onBack={() => setStep(2)}
        />
      );
    default:
      return null;
  }
}
