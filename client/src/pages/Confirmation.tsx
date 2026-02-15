import { useState, useRef, useEffect, useCallback } from 'react';
import type { SurveyData, Question } from '../lib/types';
import SurveyLayout from '../components/SurveyLayout';
import { api } from '../lib/api';

declare global {
  interface Window {
    turnstile?: {
      render: (container: string | HTMLElement, options: any) => string;
      reset: (widgetId: string) => void;
    };
  }
}

interface Props {
  data: SurveyData;
  questions: Question[];
  onBack: () => void;
}

export default function Confirmation({ data, questions, onBack }: Props) {
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [turnstileToken, setTurnstileToken] = useState('');
  const turnstileRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string>(undefined);

  const renderTurnstile = useCallback(() => {
    if (turnstileRef.current && window.turnstile && !widgetIdRef.current) {
      widgetIdRef.current = window.turnstile.render(turnstileRef.current, {
        sitekey: '0x4AAAAAACdQ_pJ4jiR82h13',
        callback: (token: string) => setTurnstileToken(token),
        'error-callback': () => setTurnstileToken(''),
      });
    }
  }, []);

  useEffect(() => {
    renderTurnstile();
    // If turnstile script hasn't loaded yet, wait for it
    if (!window.turnstile) {
      const interval = setInterval(() => {
        if (window.turnstile) {
          renderTurnstile();
          clearInterval(interval);
        }
      }, 200);
      return () => clearInterval(interval);
    }
  }, [renderTurnstile]);

  const handleSubmit = async () => {
    if (!turnstileToken) {
      setError('Please complete the verification check.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const answers = Object.entries(data.answers)
        .filter(([, value]) => value !== '' && value !== '[]')
        .map(([qid, value]) => ({ question_id: parseInt(qid), value }));

      await api.submitSurvey({
        name: data.name,
        email: data.email,
        phone: data.phone || undefined,
        lives_in_bahamas: data.lives_in_bahamas,
        island: data.island,
        country: data.country || undefined,
        age_group: data.age_group,
        sector: data.sector,
        answers,
        turnstile_token: turnstileToken,
      });
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || 'Failed to submit. Please try again.');
      // Reset turnstile on failure
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.reset(widgetIdRef.current);
        setTurnstileToken('');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const formatAnswer = (q: Question, value: string): string => {
    if (!value) return '-';
    if (q.type === 'checkbox') {
      try { return JSON.parse(value).join(', '); } catch { return value; }
    }
    if (q.type === 'scale') {
      const opts = q.options as { max: number };
      return `${value}/${opts.max}`;
    }
    return value;
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-bahamas-aqua-light to-white flex items-center justify-center px-4">
        <div className="max-w-md text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Thank You!</h1>
          <p className="text-gray-600 mb-4">
            Your feedback has been submitted successfully. Your voice matters in shaping
            the technology future of The Bahamas.
          </p>
          <div className="bg-white rounded-lg border border-gray-200 p-4 text-left">
            <h3 className="font-semibold text-gray-800 mb-2">Town Hall Details</h3>
            <p className="text-sm text-gray-600">
              Join us for the Bahamas Technology Town Hall to discuss these topics
              further with government officials and technology leaders.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <SurveyLayout step={3} title="Review & Submit" totalSteps={3}>
      <div className="space-y-4">
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-medium text-gray-800 mb-2">Your Information</h3>
          <div className="text-sm text-gray-600 space-y-1">
            <p><strong>Name:</strong> {data.name}</p>
            <p><strong>Email:</strong> {data.email}</p>
            {data.phone && <p><strong>Phone:</strong> {data.phone}</p>}
            <p><strong>Resides in Bahamas:</strong> {data.lives_in_bahamas ? 'Yes' : 'No'}</p>
            {!data.lives_in_bahamas && data.country && (
              <p><strong>Country:</strong> {data.country}</p>
            )}
            <p><strong>{data.lives_in_bahamas ? 'Island' : 'Home Island'}:</strong> {data.island}</p>
            <p><strong>Age Group:</strong> {data.age_group}</p>
            <p><strong>Sector:</strong> {data.sector}</p>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-medium text-gray-800 mb-2">Your Responses</h3>
          <div className="text-sm text-gray-600 space-y-2">
            {questions.map((q) => {
              const val = data.answers[q.id];
              if (!val || val === '[]') return null;
              return (
                <div key={q.id}>
                  <strong>{q.label}:</strong>{' '}
                  {formatAnswer(q, val)}
                </div>
              );
            })}
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div ref={turnstileRef} className="flex justify-center" />

        <div className="pt-4 flex justify-between">
          <button
            type="button"
            onClick={onBack}
            className="px-6 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Back
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="bg-bahamas-aqua text-white px-6 py-2 rounded-lg font-medium hover:opacity-90 transition-opacity disabled:bg-gray-300"
          >
            {submitting ? 'Submitting...' : 'Submit Survey'}
          </button>
        </div>
      </div>
    </SurveyLayout>
  );
}
