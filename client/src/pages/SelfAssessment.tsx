import type { SurveyData } from '../hooks/useSurvey';
import SurveyLayout from '../components/SurveyLayout';
import { BARRIERS, DESIRED_SKILLS, GOV_SERVICES } from '../lib/constants';

interface Props {
  data: SurveyData;
  updateData: (updates: Partial<SurveyData>) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function SelfAssessment({ data, updateData, onNext, onBack }: Props) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext();
  };

  return (
    <SurveyLayout step={2} title="Technology Self-Assessment">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            How comfortable are you with technology? *
          </label>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">Not at all</span>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => updateData({ tech_comfort_level: level })}
                  className={`w-10 h-10 rounded-full font-semibold transition-colors ${
                    data.tech_comfort_level === level
                      ? 'bg-cyan-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
            <span className="text-sm text-gray-500">Very comfortable</span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            What is your primary barrier to using technology?
          </label>
          <select
            value={data.primary_barrier}
            onChange={(e) => updateData({ primary_barrier: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
          >
            <option value="">Select a barrier</option>
            {BARRIERS.map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={data.interested_in_careers}
              onChange={(e) => updateData({ interested_in_careers: e.target.checked })}
              className="w-4 h-4 rounded border-gray-300 text-cyan-600 focus:ring-cyan-500"
            />
            <span className="text-sm font-medium text-gray-700">
              I am interested in a career in technology
            </span>
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            What tech skill would you most like to learn?
          </label>
          <select
            value={data.desired_skill}
            onChange={(e) => updateData({ desired_skill: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
          >
            <option value="">Select a skill</option>
            {DESIRED_SKILLS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            What is your biggest concern about technology in The Bahamas?
          </label>
          <textarea
            value={data.biggest_concern}
            onChange={(e) => updateData({ biggest_concern: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            placeholder="Share your thoughts..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            What do you see as the best opportunity technology can bring?
          </label>
          <textarea
            value={data.best_opportunity}
            onChange={(e) => updateData({ best_opportunity: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            placeholder="Share your vision..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            What government service would you most like to access online?
          </label>
          <select
            value={data.preferred_gov_service}
            onChange={(e) => updateData({ preferred_gov_service: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
          >
            <option value="">Select a service</option>
            {GOV_SERVICES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Any suggestions for how government can better use technology?
          </label>
          <textarea
            value={data.gov_tech_suggestion}
            onChange={(e) => updateData({ gov_tech_suggestion: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            placeholder="Your suggestions..."
          />
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
