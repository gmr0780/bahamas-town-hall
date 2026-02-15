import { useState } from 'react';
import { api } from '../../lib/api';

export default function AIInsights() {
  const [insights, setInsights] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const generate = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await api.generateInsights();
      setInsights(result.insights);
    } catch (err: any) {
      setError(err.message || 'Failed to generate insights');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">AI Insights</h1>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-semibold text-gray-800">Claude Analysis</h3>
            <p className="text-sm text-gray-500">
              Generate AI-powered analysis of citizen survey responses
            </p>
          </div>
          <button
            onClick={generate}
            disabled={loading}
            className="bg-bahamas-aqua text-white px-4 py-2 rounded-lg font-medium hover:opacity-90 transition-opacity disabled:bg-gray-300"
          >
            {loading ? 'Analyzing...' : 'Generate Insights'}
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">
            {error}
          </div>
        )}

        {loading && (
          <div className="flex items-center gap-3 text-gray-500">
            <div className="animate-spin w-5 h-5 border-2 border-bahamas-aqua border-t-transparent rounded-full" />
            Analyzing responses with Claude AI...
          </div>
        )}

        {insights && !loading && (
          <div className="prose prose-sm max-w-none">
            {insights.split('\n').map((line, i) => {
              if (line.startsWith('## ')) {
                return <h2 key={i} className="text-lg font-semibold text-gray-800 mt-6 mb-2">{line.replace('## ', '')}</h2>;
              }
              if (line.startsWith('### ')) {
                return <h3 key={i} className="text-base font-semibold text-gray-700 mt-4 mb-2">{line.replace('### ', '')}</h3>;
              }
              if (line.startsWith('- ')) {
                return <li key={i} className="text-gray-700 ml-4">{line.replace('- ', '')}</li>;
              }
              if (line.startsWith('> ')) {
                return (
                  <blockquote key={i} className="border-l-4 border-bahamas-aqua pl-4 italic text-gray-600 my-2">
                    {line.replace('> ', '')}
                  </blockquote>
                );
              }
              if (line.trim() === '') return <br key={i} />;
              return <p key={i} className="text-gray-700 my-1">{line}</p>;
            })}
          </div>
        )}

        {!insights && !loading && !error && (
          <p className="text-gray-400 text-center py-8">
            Click "Generate Insights" to analyze citizen responses
          </p>
        )}
      </div>
    </div>
  );
}
