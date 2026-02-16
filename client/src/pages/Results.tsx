import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts';

const COLORS = ['#00B4D8', '#0077B6', '#023E8A', '#48CAE4', '#90E0EF', '#CAF0F8', '#ADE8F4', '#0096C7'];

interface QuestionStat {
  id: number;
  type: string;
  label: string;
  distribution?: { value?: string; item?: string; count: string }[];
  average?: number;
  response_count?: number;
}

interface ResultsData {
  total_responses: number;
  by_island: { island: string; count: string }[];
  by_age_group: { age_group: string; count: string }[];
  by_sector: { sector: string; count: string }[];
  questions: QuestionStat[];
}

export default function Results() {
  const navigate = useNavigate();
  const [data, setData] = useState<ResultsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/results')
      .then((r) => r.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-bahamas-aqua-light to-white flex items-center justify-center">
        <p className="text-gray-500">Loading results...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-bahamas-aqua-light to-white flex items-center justify-center">
        <p className="text-red-500">Failed to load results</p>
      </div>
    );
  }

  const islandData = data.by_island.map((r) => ({ name: r.island, value: parseInt(r.count) }));
  const ageData = data.by_age_group.map((r) => ({ name: r.age_group, value: parseInt(r.count) }));
  const sectorData = data.by_sector.map((r) => ({ name: r.sector, value: parseInt(r.count) }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-bahamas-aqua-light to-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-bahamas-aqua rounded-xl mb-3">
            <span className="text-white font-bold text-lg">BS</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Survey Results</h1>
          <p className="text-gray-600 mt-2">
            {data.total_responses.toLocaleString()} response{data.total_responses !== 1 ? 's' : ''} collected
          </p>
        </div>

        {/* Demographics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <ChartCard title="By Island">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={islandData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {islandData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="By Age Group">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={ageData} layout="vertical" margin={{ left: 20 }}>
                <XAxis type="number" />
                <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="value" fill="#00B4D8" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="By Sector">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={sectorData} layout="vertical" margin={{ left: 20 }}>
                <XAxis type="number" />
                <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="value" fill="#0077B6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Question Results */}
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Survey Questions</h2>
        <div className="space-y-6 mb-8">
          {data.questions.map((q) => (
            <QuestionResult key={q.id} question={q} />
          ))}
        </div>

        <div className="text-center">
          <button
            onClick={() => navigate('/')}
            className="text-bahamas-aqua hover:opacity-80 text-sm font-medium"
          >
            &larr; Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <h3 className="font-semibold text-gray-800 mb-3 text-sm">{title}</h3>
      {children}
    </div>
  );
}

function QuestionResult({ question }: { question: QuestionStat }) {
  if (question.type === 'text' || question.type === 'textarea') {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="font-medium text-gray-800 mb-1">{question.label}</h3>
        <p className="text-sm text-gray-500">{question.response_count} response{question.response_count !== 1 ? 's' : ''}</p>
      </div>
    );
  }

  if (question.type === 'scale' && question.distribution) {
    const chartData = question.distribution.map((d) => ({
      name: d.value!,
      count: parseInt(d.count),
    }));

    return (
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="font-medium text-gray-800 mb-1">{question.label}</h3>
        {question.average !== undefined && (
          <p className="text-sm text-bahamas-aqua font-medium mb-3">Average: {question.average}</p>
        )}
        <ResponsiveContainer width="100%" height={150}>
          <BarChart data={chartData}>
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="count" fill="#00B4D8" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  }

  if ((question.type === 'dropdown' || question.type === 'checkbox') && question.distribution) {
    const chartData = question.distribution.map((d) => ({
      name: d.value || d.item || '',
      count: parseInt(d.count),
    }));

    return (
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="font-medium text-gray-800 mb-3">{question.label}</h3>
        <ResponsiveContainer width="100%" height={Math.max(150, chartData.length * 35)}>
          <BarChart data={chartData} layout="vertical" margin={{ left: 20 }}>
            <XAxis type="number" />
            <YAxis type="category" dataKey="name" width={150} tick={{ fontSize: 12 }} />
            <Tooltip />
            <Bar dataKey="count" fill="#48CAE4" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  }

  return null;
}
