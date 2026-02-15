import type { SurveyData } from '../hooks/useSurvey';
import SurveyLayout from '../components/SurveyLayout';
import { ISLANDS, AGE_GROUPS, SECTORS } from '../lib/constants';

interface Props {
  data: SurveyData;
  updateData: (updates: Partial<SurveyData>) => void;
  onNext: () => void;
}

export default function Signup({ data, updateData, onNext }: Props) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext();
  };

  return (
    <SurveyLayout step={1} title="Tell Us About Yourself">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
          <input
            type="text"
            required
            value={data.name}
            onChange={(e) => updateData({ name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            placeholder="Enter your full name"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email Address *</label>
          <input
            type="email"
            required
            value={data.email}
            onChange={(e) => updateData({ email: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            placeholder="your@email.com"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Phone (optional)</label>
          <input
            type="tel"
            value={data.phone}
            onChange={(e) => updateData({ phone: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            placeholder="(242) 555-0000"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Island *</label>
          <select
            required
            value={data.island}
            onChange={(e) => updateData({ island: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
          >
            <option value="">Select your island</option>
            {ISLANDS.map((island) => (
              <option key={island} value={island}>{island}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Age Group *</label>
          <select
            required
            value={data.age_group}
            onChange={(e) => updateData({ age_group: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
          >
            <option value="">Select your age group</option>
            {AGE_GROUPS.map((ag) => (
              <option key={ag} value={ag}>{ag}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Sector *</label>
          <select
            required
            value={data.sector}
            onChange={(e) => updateData({ sector: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
          >
            <option value="">Select your sector</option>
            {SECTORS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <div className="pt-4 flex justify-end">
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
