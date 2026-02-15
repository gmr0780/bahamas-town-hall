import type { SurveyData } from '../lib/types';
import SurveyLayout from '../components/SurveyLayout';
import { ISLANDS, AGE_GROUPS, SECTORS, COUNTRIES } from '../lib/registration-options';

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
    <SurveyLayout step={1} title="Tell Us About Yourself" totalSteps={3}>
      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5 lg:space-y-6">
        <div>
          <label className="block text-sm sm:text-base font-medium text-gray-700 mb-1 sm:mb-2">Full Name *</label>
          <input
            type="text"
            required
            value={data.name}
            onChange={(e) => updateData({ name: e.target.value })}
            className="w-full px-3 sm:px-4 py-3 sm:py-2.5 border border-gray-300 rounded-lg text-base focus:ring-2 focus:ring-bahamas-aqua focus:border-transparent"
            placeholder="Enter your full name"
          />
        </div>
        <div>
          <label className="block text-sm sm:text-base font-medium text-gray-700 mb-1 sm:mb-2">Email Address *</label>
          <input
            type="email"
            required
            value={data.email}
            onChange={(e) => updateData({ email: e.target.value })}
            className="w-full px-3 sm:px-4 py-3 sm:py-2.5 border border-gray-300 rounded-lg text-base focus:ring-2 focus:ring-bahamas-aqua focus:border-transparent"
            placeholder="your@email.com"
          />
        </div>
        <div>
          <label className="block text-sm sm:text-base font-medium text-gray-700 mb-1 sm:mb-2">Phone (optional)</label>
          <input
            type="tel"
            value={data.phone}
            onChange={(e) => updateData({ phone: e.target.value })}
            className="w-full px-3 sm:px-4 py-3 sm:py-2.5 border border-gray-300 rounded-lg text-base focus:ring-2 focus:ring-bahamas-aqua focus:border-transparent"
            placeholder="(242) 555-0000"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Do you currently live in The Bahamas? *
          </label>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => updateData({ lives_in_bahamas: true, country: '' })}
              className={`flex-1 py-3 sm:py-2 rounded-lg border text-sm font-medium transition-colors ${
                data.lives_in_bahamas
                  ? 'border-bahamas-aqua bg-bahamas-aqua-light text-bahamas-aqua'
                  : 'border-gray-300 text-gray-600 hover:bg-gray-50'
              }`}
            >
              Yes, I live in The Bahamas
            </button>
            <button
              type="button"
              onClick={() => updateData({ lives_in_bahamas: false })}
              className={`flex-1 py-3 sm:py-2 rounded-lg border text-sm font-medium transition-colors ${
                !data.lives_in_bahamas
                  ? 'border-bahamas-aqua bg-bahamas-aqua-light text-bahamas-aqua'
                  : 'border-gray-300 text-gray-600 hover:bg-gray-50'
              }`}
            >
              No, I live abroad
            </button>
          </div>
        </div>

        {!data.lives_in_bahamas && (
          <div>
            <label className="block text-sm sm:text-base font-medium text-gray-700 mb-1 sm:mb-2">
              Country of Residence *
            </label>
            <select
              required
              value={data.country}
              onChange={(e) => updateData({ country: e.target.value })}
              className="w-full px-3 sm:px-4 py-3 sm:py-2.5 border border-gray-300 rounded-lg text-base focus:ring-2 focus:ring-bahamas-aqua focus:border-transparent"
            >
              <option value="">Select your country</option>
              {COUNTRIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="block text-sm sm:text-base font-medium text-gray-700 mb-1 sm:mb-2">
            {data.lives_in_bahamas
              ? 'Which island do you live on? *'
              : 'Which island are you from? *'}
          </label>
          <select
            required
            value={data.island}
            onChange={(e) => updateData({ island: e.target.value })}
            className="w-full px-3 sm:px-4 py-3 sm:py-2.5 border border-gray-300 rounded-lg text-base focus:ring-2 focus:ring-bahamas-aqua focus:border-transparent"
          >
            <option value="">
              {data.lives_in_bahamas ? 'Select your island' : 'Select your home island'}
            </option>
            {ISLANDS.map((island) => (
              <option key={island} value={island}>{island}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm sm:text-base font-medium text-gray-700 mb-1 sm:mb-2">Age Group *</label>
          <select
            required
            value={data.age_group}
            onChange={(e) => updateData({ age_group: e.target.value })}
            className="w-full px-3 sm:px-4 py-3 sm:py-2.5 border border-gray-300 rounded-lg text-base focus:ring-2 focus:ring-bahamas-aqua focus:border-transparent"
          >
            <option value="">Select your age group</option>
            {AGE_GROUPS.map((ag) => (
              <option key={ag} value={ag}>{ag}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm sm:text-base font-medium text-gray-700 mb-1 sm:mb-2">Sector *</label>
          <select
            required
            value={data.sector}
            onChange={(e) => updateData({ sector: e.target.value })}
            className="w-full px-3 sm:px-4 py-3 sm:py-2.5 border border-gray-300 rounded-lg text-base focus:ring-2 focus:ring-bahamas-aqua focus:border-transparent"
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
            className="bg-bahamas-aqua text-white px-8 py-3 sm:px-6 sm:py-2 rounded-lg font-medium text-base sm:text-sm hover:opacity-90 transition-opacity w-full sm:w-auto"
          >
            Next
          </button>
        </div>
      </form>
    </SurveyLayout>
  );
}
