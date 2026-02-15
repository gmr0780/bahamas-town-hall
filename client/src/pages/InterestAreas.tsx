import { useState } from 'react';
import type { SurveyData } from '../hooks/useSurvey';
import SurveyLayout from '../components/SurveyLayout';
import { INTEREST_AREAS } from '../lib/constants';

interface Props {
  data: SurveyData;
  updateData: (updates: Partial<SurveyData>) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function InterestAreasPage({ data, updateData, onNext, onBack }: Props) {
  const [selected, setSelected] = useState<string[]>(data.interest_areas);

  const toggle = (area: string) => {
    setSelected((prev) =>
      prev.includes(area) ? prev.filter((a) => a !== area) : [...prev, area]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateData({ interest_areas: selected });
    onNext();
  };

  return (
    <SurveyLayout step={4} title="Areas of Interest">
      <form onSubmit={handleSubmit}>
        <p className="text-sm text-gray-600 mb-4">
          Which of these initiatives would you be interested in? Select all that apply.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-6">
          {INTEREST_AREAS.map((area) => (
            <label
              key={area}
              className={`flex items-center gap-2 px-4 py-3 rounded-lg border cursor-pointer transition-colors ${
                selected.includes(area)
                  ? 'border-cyan-500 bg-cyan-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <input
                type="checkbox"
                checked={selected.includes(area)}
                onChange={() => toggle(area)}
                className="w-4 h-4 rounded border-gray-300 text-cyan-600 focus:ring-cyan-500"
              />
              <span className="text-sm text-gray-700">{area}</span>
            </label>
          ))}
        </div>

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
            className="bg-cyan-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-cyan-700 transition-colors"
          >
            Next
          </button>
        </div>
      </form>
    </SurveyLayout>
  );
}
