import { useNavigate } from 'react-router-dom';

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-bahamas-aqua-light to-white flex items-center justify-center px-4">
      <div className="max-w-xl text-center">
        <div className="mb-6">
          {/* Bahamas flag-inspired emblem */}
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-2xl mb-4 relative overflow-hidden">
            <div className="absolute inset-0 bg-bahamas-aqua" />
            <div className="absolute left-0 top-0 bottom-0 w-8 bg-bahamas-black"
              style={{ clipPath: 'polygon(0 0, 100% 50%, 0 100%)' }} />
            <span className="relative text-white text-3xl font-bold z-10">BS</span>
          </div>
        </div>
        <h1 className="text-4xl font-bold text-bahamas-black mb-2">
          Bahamas Technology Town Hall
        </h1>
        <p className="text-sm font-medium text-bahamas-aqua uppercase tracking-wide mb-4">
          Commonwealth of The Bahamas
        </p>
        <p className="text-lg text-gray-600 mb-2">
          Share your voice on the future of technology in The Bahamas
        </p>
        <p className="text-gray-500 mb-8">
          Your feedback will help shape national technology policy, infrastructure
          investment, and digital skills programs. This survey takes about 5 minutes.
        </p>
        <button
          onClick={() => navigate('/survey')}
          className="bg-bahamas-aqua text-white px-8 py-3 rounded-lg text-lg font-semibold hover:opacity-90 transition-opacity shadow-lg hover:shadow-xl"
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
