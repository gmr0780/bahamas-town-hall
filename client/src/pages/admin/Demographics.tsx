import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts';

const COLORS = ['#00778B', '#FFC72C', '#0891b2', '#06b6d4', '#22d3ee', '#67e8f9', '#0e7490', '#155e75'];

export default function Demographics() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getDemographics().then(setData).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-gray-500">Loading demographics...</div>;
  if (!data) return <div className="text-red-500">Failed to load demographics</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Demographics & Survey Results</h1>

      {/* Citizen demographics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <ChartCard title="By Island">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data.by_island.map((r: any) => ({ name: r.island, value: parseInt(r.count) }))}
                cx="50%" cy="50%" outerRadius={100}
                dataKey="value" label={({ name, value }: any) => `${name}: ${value}`}
              >
                {data.by_island.map((_: any, i: number) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="By Age Group">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.by_age_group.map((r: any) => ({ name: r.age_group, count: parseInt(r.count) }))}>
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#00778B" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Dynamic question charts */}
      <h2 className="text-lg font-semibold text-gray-800 mb-4">Survey Results by Question</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {data.questions.map((q: any) => (
          <QuestionChart key={q.id} question={q} />
        ))}
      </div>
    </div>
  );
}

function QuestionChart({ question }: { question: any }) {
  const { type, label, distribution, average, total_responses, recent } = question;

  if (type === 'scale' && distribution) {
    return (
      <ChartCard title={label}>
        <p className="text-sm text-gray-500 mb-3">Average: <strong>{average}</strong></p>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={distribution.map((d: any) => ({ rating: d.value, count: parseInt(d.count) }))}>
            <XAxis dataKey="rating" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="count" fill="#00778B" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    );
  }

  if ((type === 'dropdown' || type === 'checkbox') && distribution) {
    return (
      <ChartCard title={label}>
        <ResponsiveContainer width="100%" height={Math.max(200, distribution.length * 35)}>
          <BarChart
            data={distribution.map((d: any) => ({
              name: d.value || d.item,
              count: parseInt(d.count),
            }))}
            layout="vertical"
          >
            <XAxis type="number" />
            <YAxis dataKey="name" type="category" width={180} tick={{ fontSize: 11 }} />
            <Tooltip />
            <Bar dataKey="count" fill="#FFC72C" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    );
  }

  if ((type === 'text' || type === 'textarea') && recent) {
    return (
      <ChartCard title={label}>
        <p className="text-sm text-gray-500 mb-3">{total_responses} total responses</p>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {recent.map((r: any, i: number) => (
            <div key={i} className="bg-gray-50 rounded-lg p-3 text-sm">
              <p className="text-gray-700">{r.value}</p>
              <p className="text-xs text-gray-400 mt-1">{r.island} &middot; {r.age_group}</p>
            </div>
          ))}
        </div>
      </ChartCard>
    );
  }

  return null;
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h3 className="font-semibold text-gray-800 mb-4">{title}</h3>
      {children}
    </div>
  );
}
