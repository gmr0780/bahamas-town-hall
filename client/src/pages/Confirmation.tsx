import { useState } from 'react';
import type { SurveyData } from '../hooks/useSurvey';
import SurveyLayout from '../components/SurveyLayout';
import { api } from '../lib/api';

interface Props {
  data: SurveyData;
  onBack: () => void;
}

export default function Confirmation({ data, onBack }: Props) {
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    setSubmitting(true);
    setError('');
    try {
      await api.submitSurvey(data);
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || 'Failed to submit. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cyan-50 to-blue-50 flex items-center justify-center px-4">
        <div className="max-w-md text-center">
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
    <SurveyLayout step={5} title="Review & Submit">
      <div className="space-y-4">
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-medium text-gray-800 mb-2">Your Information</h3>
          <div className="text-sm text-gray-600 space-y-1">
            <p><strong>Name:</strong> {data.name}</p>
            <p><strong>Email:</strong> {data.email}</p>
            {data.phone && <p><strong>Phone:</strong> {data.phone}</p>}
            <p><strong>Island:</strong> {data.island}</p>
            <p><strong>Age Group:</strong> {data.age_group}</p>
            <p><strong>Sector:</strong> {data.sector}</p>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-medium text-gray-800 mb-2">Self-Assessment</h3>
          <div className="text-sm text-gray-600 space-y-1">
            <p><strong>Tech Comfort:</strong> {data.tech_comfort_level}/5</p>
            {data.primary_barrier && <p><strong>Primary Barrier:</strong> {data.primary_barrier}</p>}
            <p><strong>Career Interest:</strong> {data.interested_in_careers ? 'Yes' : 'No'}</p>
            {data.desired_skill && <p><strong>Desired Skill:</strong> {data.desired_skill}</p>}
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-medium text-gray-800 mb-2">Top Priorities</h3>
          <ol className="text-sm text-gray-600 list-decimal list-inside space-y-1">
            {data.topic_votes
              .sort((a, b) => a.rank - b.rank)
              .map((v) => (
                <li key={v.topic}>{v.topic}</li>
              ))}
          </ol>
        </div>

        {data.interest_areas.length > 0 && (
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-medium text-gray-800 mb-2">Interest Areas</h3>
            <div className="flex flex-wrap gap-2">
              {data.interest_areas.map((area) => (
                <span key={area} className="text-xs bg-cyan-100 text-cyan-800 px-2 py-1 rounded-full">
                  {area}
                </span>
              ))}
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
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
            onClick={handleSubmit}
            disabled={submitting}
            className="bg-cyan-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-cyan-700 transition-colors disabled:bg-gray-300"
          >
            {submitting ? 'Submitting...' : 'Submit Survey'}
          </button>
        </div>
      </div>
    </SurveyLayout>
  );
}
