import { useState } from 'react';
import type { SurveyData } from '../hooks/useSurvey';
import SurveyLayout from '../components/SurveyLayout';
import { TOPICS } from '../lib/constants';

interface Props {
  data: SurveyData;
  updateData: (updates: Partial<SurveyData>) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function Priorities({ data, updateData, onNext, onBack }: Props) {
  const [selected, setSelected] = useState<string[]>(
    data.topic_votes.sort((a, b) => a.rank - b.rank).map((v) => v.topic)
  );

  const toggleTopic = (topic: string) => {
    setSelected((prev) => {
      if (prev.includes(topic)) {
        return prev.filter((t) => t !== topic);
      }
      if (prev.length >= 3) return prev;
      return [...prev, topic];
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selected.length !== 3) return;
    updateData({
      topic_votes: selected.map((topic, i) => ({ topic, rank: i + 1 })),
    });
    onNext();
  };

  return (
    <SurveyLayout step={3} title="Your Top Priorities">
      <form onSubmit={handleSubmit}>
        <p className="text-sm text-gray-600 mb-4">
          Select your <strong>top 3 technology priorities</strong> for The Bahamas.
          Click in order of importance (1st = most important).
        </p>

        <div className="space-y-2 mb-6">
          {TOPICS.map((topic) => {
            const idx = selected.indexOf(topic);
            const isSelected = idx !== -1;
            return (
              <button
                key={topic}
                type="button"
                onClick={() => toggleTopic(topic)}
                className={`w-full text-left px-4 py-3 rounded-lg border transition-colors flex items-center gap-3 ${
                  isSelected
                    ? 'border-cyan-500 bg-cyan-50 text-cyan-800'
                    : 'border-gray-200 hover:border-gray-300 text-gray-700'
                }`}
              >
                {isSelected ? (
                  <span className="inline-flex items-center justify-center w-7 h-7 bg-cyan-600 text-white rounded-full text-sm font-bold">
                    {idx + 1}
                  </span>
                ) : (
                  <span className="inline-flex items-center justify-center w-7 h-7 bg-gray-100 text-gray-400 rounded-full text-sm">
                    -
                  </span>
                )}
                {topic}
              </button>
            );
          })}
        </div>

        {selected.length < 3 && (
          <p className="text-sm text-amber-600 mb-4">
            Please select {3 - selected.length} more topic{3 - selected.length > 1 ? 's' : ''}.
          </p>
        )}

        <div className="pt-4 flex justify-between">
          <button
            type="button"
            onClick={onBack}
            className="px-6 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Back
          </button>
          <button
            type="submit"
            disabled={selected.length !== 3}
            className="bg-cyan-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-cyan-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      </form>
    </SurveyLayout>
  );
}
