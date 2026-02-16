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
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [personality, setPersonality] = useState<{ title: string; emoji: string; description: string } | null>(null);
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

      const result = await api.submitSurvey({
        name: `${data.first_name} ${data.last_name}`,
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
      // Fetch AI summary (fire-and-forget, don't block)
      fetch('/api/chat/summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ citizen_id: result.id }),
      })
        .then((r) => r.json())
        .then((d) => {
          if (d.summary) setAiSummary(d.summary);
          if (d.personality_title) {
            setPersonality({
              title: d.personality_title,
              emoji: d.personality_emoji || '',
              description: d.personality_description || '',
            });
          }
        })
        .catch(() => {});
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
    const shareUrl = 'https://bahamastech.ai';
    const shareText = personality
      ? `I'm ${personality.emoji} ${personality.title}! Take the Bahamas Tech Town Hall survey to find yours.`
      : "I shared my voice at the Bahamas Technology Town Hall! Join me in shaping the future of technology in The Bahamas.";
    const linkedInTitle = personality
      ? `I'm ${personality.emoji} ${personality.title}!`
      : 'Bahamas Technology Town Hall';
    const linkedInSummary = personality
      ? `${personality.description} Take the survey to discover your tech personality!`
      : 'Share your voice and help shape the technology future of The Bahamas.';
    const linkedInUrl = `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(linkedInTitle)}&summary=${encodeURIComponent(linkedInSummary)}`;
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;

    return (
      <div className="min-h-screen bg-gradient-to-br from-bahamas-aqua-light to-white flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
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

          {personality && (
            <div className="bg-gradient-to-br from-bahamas-aqua/5 to-yellow-50 rounded-xl border-2 border-bahamas-aqua/30 p-6 mb-4">
              <div className="text-5xl mb-3">{personality.emoji}</div>
              <p className="text-xs uppercase tracking-wider text-bahamas-aqua font-semibold mb-1">Your Tech Personality</p>
              <h2 className="text-xl font-bold text-gray-900 mb-2">{personality.title}</h2>
              <p className="text-sm text-gray-600 leading-relaxed">{personality.description}</p>
            </div>
          )}

          {aiSummary && (
            <div className="bg-white rounded-lg border border-gray-200 p-5 mb-4 text-left">
              <div className="flex items-center gap-2 mb-3">
                <svg width="20" height="13" viewBox="0 0 300 200" className="rounded-sm flex-shrink-0">
                  <rect width="300" height="66.67" fill="#00B4D8" />
                  <rect y="66.67" width="300" height="66.67" fill="#FFD700" />
                  <rect y="133.33" width="300" height="66.67" fill="#00B4D8" />
                  <polygon points="0,0 120,100 0,200" fill="#1A1A2E" />
                </svg>
                <h3 className="font-semibold text-gray-800">Bahamas AI Insight</h3>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed">{aiSummary}</p>
            </div>
          )}

          <div className="bg-white rounded-lg border border-gray-200 p-5 mb-4">
            <h3 className="font-semibold text-gray-800 mb-3">Share the Town Hall</h3>
            <p className="text-sm text-gray-600 mb-4">
              Help spread the word and encourage others to share their voice.
            </p>
            <div className="flex flex-col gap-2">
              <a
                href={linkedInUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 bg-[#0A66C2] text-white px-4 py-3 rounded-lg font-medium text-sm hover:opacity-90 transition-opacity"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
                Share on LinkedIn
              </a>
              <div className="flex gap-2">
                <a
                  href={twitterUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 bg-gray-900 text-white px-4 py-2.5 rounded-lg font-medium text-sm hover:opacity-90 transition-opacity"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                  Post on X
                </a>
                <a
                  href={facebookUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 bg-[#1877F2] text-white px-4 py-2.5 rounded-lg font-medium text-sm hover:opacity-90 transition-opacity"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                  Facebook
                </a>
              </div>
            </div>
          </div>

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
            <p><strong>Name:</strong> {data.first_name} {data.last_name}</p>
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

        <div className="pt-4 flex gap-3 sm:gap-0 sm:justify-between">
          <button
            type="button"
            onClick={onBack}
            className="flex-1 sm:flex-none px-6 py-3 sm:py-2 border border-gray-300 rounded-lg font-medium text-base sm:text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Back
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex-1 sm:flex-none bg-bahamas-aqua text-white px-6 py-3 sm:py-2 rounded-lg font-medium text-base sm:text-sm hover:opacity-90 transition-opacity disabled:bg-gray-300"
          >
            {submitting ? 'Submitting...' : 'Submit Survey'}
          </button>
        </div>
      </div>
    </SurveyLayout>
  );
}
