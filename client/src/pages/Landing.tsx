import { useNavigate } from 'react-router-dom';

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 to-blue-50 flex items-center justify-center px-4">
      <div className="max-w-xl text-center">
        <div className="mb-6">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-cyan-600 rounded-2xl mb-4">
            <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Bahamas Technology Town Hall
        </h1>
        <p className="text-lg text-gray-600 mb-2">
          Share your voice on the future of technology in The Bahamas
        </p>
        <p className="text-gray-500 mb-8">
          Your feedback will help shape national technology policy, infrastructure
          investment, and digital skills programs. This survey takes about 5 minutes.
        </p>
        <button
          onClick={() => navigate('/survey')}
          className="bg-cyan-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-cyan-700 transition-colors shadow-lg hover:shadow-xl"
        >
          Take the Survey
        </button>
        <p className="mt-6 text-sm text-gray-400">
          Your responses are collected for policy research purposes only.
        </p>
      </div>
    </div>
  );
}
