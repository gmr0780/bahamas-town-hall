import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';

export default function ResponseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) api.getResponse(parseInt(id)).then(setData).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="text-gray-500">Loading...</div>;
  if (!data) return <div className="text-red-500">Response not found</div>;

  const { citizen, survey, topic_votes, interest_areas } = data;

  return (
    <div>
      <button
        onClick={() => navigate('/admin/responses')}
        className="text-sm text-cyan-600 hover:text-cyan-700 mb-4 inline-flex items-center gap-1"
      >
        &larr; Back to Responses
      </button>

      <h1 className="text-2xl font-bold text-gray-900 mb-6">{citizen.name}</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Section title="Personal Information">
          <Field label="Email" value={citizen.email} />
          <Field label="Phone" value={citizen.phone} />
          <Field label="Lives in Bahamas" value={citizen.lives_in_bahamas ? 'Yes' : 'No'} />
          {!citizen.lives_in_bahamas && <Field label="Country" value={citizen.country} />}
          <Field label={citizen.lives_in_bahamas ? 'Island' : 'Home Island'} value={citizen.island} />
          <Field label="Age Group" value={citizen.age_group} />
          <Field label="Sector" value={citizen.sector} />
          <Field label="Submitted" value={new Date(citizen.created_at).toLocaleString()} />
        </Section>

        {survey && (
          <Section title="Self-Assessment">
            <Field label="Tech Comfort" value={`${survey.tech_comfort_level}/5`} />
            <Field label="Primary Barrier" value={survey.primary_barrier} />
            <Field label="Career Interest" value={survey.interested_in_careers ? 'Yes' : 'No'} />
            <Field label="Desired Skill" value={survey.desired_skill} />
            <Field label="Preferred Gov Service" value={survey.preferred_gov_service} />
          </Section>
        )}

        {survey && (
          <Section title="Open-Ended Responses">
            <Field label="Biggest Concern" value={survey.biggest_concern} />
            <Field label="Best Opportunity" value={survey.best_opportunity} />
            <Field label="Gov Tech Suggestion" value={survey.gov_tech_suggestion} />
          </Section>
        )}

        <Section title="Topic Priorities">
          {topic_votes.length === 0 ? (
            <p className="text-sm text-gray-500">No priorities recorded</p>
          ) : (
            <ol className="list-decimal list-inside space-y-1">
              {topic_votes.map((v: any) => (
                <li key={v.id} className="text-sm text-gray-700">{v.topic}</li>
              ))}
            </ol>
          )}
        </Section>

        <Section title="Interest Areas">
          {interest_areas.length === 0 ? (
            <p className="text-sm text-gray-500">No interests recorded</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {interest_areas.map((ia: any) => (
                <span key={ia.id} className="text-xs bg-cyan-100 text-cyan-800 px-2 py-1 rounded-full">
                  {ia.area}
                </span>
              ))}
            </div>
          )}
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h2 className="font-semibold text-gray-800 mb-4">{title}</h2>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <span className="text-xs text-gray-500">{label}</span>
      <p className="text-sm text-gray-800">{value || '-'}</p>
    </div>
  );
}
