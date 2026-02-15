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

  const { citizen, answers } = data;

  const formatValue = (answer: any): string => {
    if (!answer.value) return '-';
    if (answer.type === 'checkbox') {
      try { return JSON.parse(answer.value).join(', '); } catch { return answer.value; }
    }
    if (answer.type === 'scale') {
      const opts = answer.options as { max: number };
      return `${answer.value}/${opts?.max || 5}`;
    }
    return answer.value;
  };

  return (
    <div>
      <button
        onClick={() => navigate('/admin/responses')}
        className="text-sm text-bahamas-aqua hover:opacity-80 mb-4 inline-flex items-center gap-1"
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

        <Section title="Survey Responses">
          {answers.length === 0 ? (
            <p className="text-sm text-gray-500">No survey responses recorded</p>
          ) : (
            answers.map((a: any) => (
              <Field key={a.question_id} label={a.label} value={formatValue(a)} />
            ))
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
