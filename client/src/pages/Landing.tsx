import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';

export default function Landing() {
  const navigate = useNavigate();
  const [surveyOpen, setSurveyOpen] = useState<boolean | null>(null);
  const [responseCount, setResponseCount] = useState<number | null>(null);

  useEffect(() => {
    api.getSurveyStatus().then((r) => setSurveyOpen(r.survey_open));
    api.getResponseCount().then((r) => setResponseCount(r.count));
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-bahamas-aqua-light to-white flex items-center justify-center px-4 py-8">
      <div className="max-w-xl w-full text-center">
        <div className="mb-4 sm:mb-6">
          <div className="inline-block rounded-2xl overflow-hidden shadow-lg mb-3 sm:mb-4">
            <svg width="120" height="80" viewBox="0 0 300 200" className="w-24 h-16 sm:w-32 sm:h-20">
              {/* Aquamarine top band */}
              <rect width="300" height="66.67" fill="#00B4D8" />
              {/* Gold middle band */}
              <rect y="66.67" width="300" height="66.67" fill="#FFD700" />
              {/* Aquamarine bottom band */}
              <rect y="133.33" width="300" height="66.67" fill="#00B4D8" />
              {/* Black triangle on hoist side */}
              <polygon points="0,0 120,100 0,200" fill="#1A1A2E" />
            </svg>
          </div>
        </div>
        <h1 className="text-2xl sm:text-4xl font-bold text-bahamas-black mb-2">
          Bahamas Technology Town Hall
        </h1>
        <p className="text-xs sm:text-sm font-medium text-bahamas-aqua uppercase tracking-wide mb-3 sm:mb-4">
          Commonwealth of The Bahamas
        </p>
        <p className="text-base sm:text-lg text-gray-600 mb-2">
          Share your voice on the future of technology in The Bahamas
        </p>
        <p className="text-sm sm:text-base text-gray-500 mb-6 sm:mb-8">
          Your feedback will help shape national technology policy, infrastructure
          investment, and digital skills programs. This survey takes about 5 minutes.
        </p>

        {responseCount !== null && responseCount > 0 && (
          <p className="text-sm text-bahamas-aqua font-medium mb-4">
            Join {responseCount.toLocaleString()} Bahamian{responseCount !== 1 ? 's' : ''} who've shared their voice
          </p>
        )}

        {surveyOpen === false ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
            <p className="text-yellow-800 font-medium">The survey is currently closed</p>
            <p className="text-yellow-600 text-sm mt-1">Please check back later.</p>
          </div>
        ) : (
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Choose your experience</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg mx-auto">
            <button
              onClick={() => navigate('/survey')}
              className="group bg-white rounded-xl border-2 border-gray-200 hover:border-gray-400 p-5 text-left transition-all shadow-sm hover:shadow-lg w-full"
            >
              <div className="text-2xl mb-2">📋</div>
              <h3 className="font-bold text-gray-900 mb-1">Classic Form</h3>
              <p className="text-xs text-gray-500 mb-2">A simple step-by-step questionnaire. Pick your answers and submit at your own pace.</p>
              <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">~5 minutes</span>
            </button>
            <button
              onClick={() => navigate('/survey/chat')}
              className="group bg-gradient-to-br from-white to-bahamas-aqua/5 rounded-xl border-2 border-bahamas-aqua p-5 text-left transition-all shadow-sm hover:shadow-lg w-full relative overflow-hidden"
            >
              <div className="absolute top-2 right-2 bg-bahamas-aqua text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">AI-Powered</div>
              <div className="text-2xl mb-2">🤖</div>
              <h3 className="font-bold text-gray-900 mb-1">Chat with Bahamas AI</h3>
              <p className="text-xs text-gray-500 mb-2">Talk naturally with our AI — type or use your voice. Get a personalized tech personality at the end!</p>
              <span className="text-[10px] text-bahamas-aqua font-medium uppercase tracking-wide">~5 minutes &middot; voice enabled</span>
            </button>
          </div>
        )}
        <div className="mt-4 flex justify-center gap-4">
          <button
            onClick={() => navigate('/results')}
            className="text-bahamas-aqua hover:opacity-80 text-sm font-medium"
          >
            View Survey Results
          </button>
        </div>
        <p className="mt-4 sm:mt-6 text-xs sm:text-sm text-gray-400">
          Your responses are collected for policy research purposes only.
        </p>
      </div>
    </div>
  );
}
