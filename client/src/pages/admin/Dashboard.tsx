import { useState, useEffect } from 'react';
import { api } from '../../lib/api';

interface Stats {
  total_responses: number;
  today_responses: number;
  by_island: { island: string; count: string }[];
  by_age_group: { age_group: string; count: string }[];
  by_sector: { sector: string; count: string }[];
  avg_tech_comfort: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getStats().then(setStats).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-gray-500">Loading dashboard...</div>;
  if (!stats) return <div className="text-red-500">Failed to load stats</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <StatCard label="Total Responses" value={stats.total_responses} />
        <StatCard label="Today" value={stats.today_responses} />
        <StatCard label="Avg Tech Comfort" value={`${stats.avg_tech_comfort}/5`} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <BreakdownCard title="By Island" data={stats.by_island.map(r => ({ label: r.island, count: parseInt(r.count) }))} />
        <BreakdownCard title="By Age Group" data={stats.by_age_group.map(r => ({ label: r.age_group, count: parseInt(r.count) }))} />
        <BreakdownCard title="By Sector" data={stats.by_sector.map(r => ({ label: r.sector, count: parseInt(r.count) }))} />
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
    </div>
  );
}

function BreakdownCard({ title, data }: { title: string; data: { label: string; count: number }[] }) {
  const max = Math.max(...data.map(d => d.count), 1);
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h3 className="font-semibold text-gray-800 mb-4">{title}</h3>
      <div className="space-y-2">
        {data.slice(0, 8).map((item) => (
          <div key={item.label}>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600 truncate">{item.label}</span>
              <span className="text-gray-900 font-medium">{item.count}</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-1.5">
              <div
                className="bg-cyan-500 h-1.5 rounded-full"
                style={{ width: `${(item.count / max) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
