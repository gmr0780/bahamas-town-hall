import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

const COLORS = ['#0891b2', '#06b6d4', '#22d3ee', '#67e8f9', '#a5f3fc', '#0e7490', '#155e75', '#164e63'];

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
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Demographics</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ChartCard title="By Island">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data.by_island.map((r: any) => ({ name: r.island, value: parseInt(r.count) }))}
                cx="50%" cy="50%" outerRadius={100}
                dataKey="value" label={({ name, value }) => `${name}: ${value}`}
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
              <Bar dataKey="count" fill="#0891b2" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="By Sector">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.by_sector.map((r: any) => ({ name: r.sector, count: parseInt(r.count) }))} layout="vertical">
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" width={150} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#06b6d4" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Primary Barriers">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.by_barrier.map((r: any) => ({ name: r.primary_barrier, count: parseInt(r.count) }))} layout="vertical">
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" width={180} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#22d3ee" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Tech Comfort by Island">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.comfort_by_island.map((r: any) => ({ name: r.island, comfort: parseFloat(r.avg_comfort) }))}>
              <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-45} textAnchor="end" height={80} />
              <YAxis domain={[0, 5]} />
              <Tooltip />
              <Bar dataKey="comfort" fill="#0e7490" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Interest Areas">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.interest_areas.map((r: any) => ({ name: r.area, count: parseInt(r.count) }))} layout="vertical">
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" width={180} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#67e8f9" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Career Interest">
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={data.career_interest.map((r: any) => ({
                  name: r.interested_in_careers ? 'Interested' : 'Not Interested',
                  value: parseInt(r.count),
                }))}
                cx="50%" cy="50%" outerRadius={80}
                dataKey="value" label
              >
                <Cell fill="#0891b2" />
                <Cell fill="#d1d5db" />
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Desired Skills">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.by_desired_skill.map((r: any) => ({ name: r.desired_skill, count: parseInt(r.count) }))} layout="vertical">
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" width={180} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#155e75" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h3 className="font-semibold text-gray-800 mb-4">{title}</h3>
      {children}
    </div>
  );
}
