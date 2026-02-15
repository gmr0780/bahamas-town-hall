import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

export default function PrioritiesView() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getPriorities().then(setData).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-gray-500">Loading priorities...</div>;
  if (!data) return <div className="text-red-500">Failed to load priorities</div>;

  const rankingData = data.topic_rankings.map((r: any) => ({
    topic: r.topic,
    total: parseInt(r.total_votes),
    avg_rank: parseFloat(r.avg_rank),
    rank_1: parseInt(r.rank_1),
    rank_2: parseInt(r.rank_2),
    rank_3: parseInt(r.rank_3),
  }));

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Priorities</h1>

      <div className="grid grid-cols-1 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-800 mb-4">Topic Rankings</h3>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={rankingData} layout="vertical">
              <XAxis type="number" />
              <YAxis dataKey="topic" type="category" width={200} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="rank_1" name="#1 Priority" fill="#0891b2" stackId="a" />
              <Bar dataKey="rank_2" name="#2 Priority" fill="#22d3ee" stackId="a" />
              <Bar dataKey="rank_3" name="#3 Priority" fill="#a5f3fc" stackId="a" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h3 className="font-semibold text-gray-800">Topic Details</h3>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Topic</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Total Votes</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Avg Rank</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">#1</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">#2</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">#3</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rankingData.map((r: any) => (
                <tr key={r.topic}>
                  <td className="px-4 py-3 text-gray-800">{r.topic}</td>
                  <td className="px-4 py-3 text-right font-medium">{r.total}</td>
                  <td className="px-4 py-3 text-right">{r.avg_rank}</td>
                  <td className="px-4 py-3 text-right">{r.rank_1}</td>
                  <td className="px-4 py-3 text-right">{r.rank_2}</td>
                  <td className="px-4 py-3 text-right">{r.rank_3}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-800 mb-4">Preferred Government Services</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.gov_services.map((r: any) => ({ name: r.preferred_gov_service, count: parseInt(r.count) }))} layout="vertical">
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" width={180} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#0891b2" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
