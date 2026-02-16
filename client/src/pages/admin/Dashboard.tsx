import { useState, useEffect } from 'react';
import { api } from '../../lib/api';

interface Stats {
  total_responses: number;
  today_responses: number;
  by_island: { island: string; count: string }[];
  by_age_group: { age_group: string; count: string }[];
  by_sector: { sector: string; count: string }[];
}

interface PageViewStats {
  total_views: number;
  today_views: number;
  by_page: { path: string; count: string }[];
  by_day: { date: string; count: string }[];
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [pageViews, setPageViews] = useState<PageViewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [surveyOpen, setSurveyOpen] = useState<boolean | null>(null);
  const [toggling, setToggling] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const loadStats = (from?: string, to?: string) => {
    setLoading(true);
    const params: Record<string, string> = {};
    if (from) params.date_from = from;
    if (to) params.date_to = to;
    Promise.all([
      api.getStats(params).then(setStats),
      api.getPageViews(params).then(setPageViews),
    ]).finally(() => setLoading(false));
  };

  useEffect(() => {
    loadStats();
    api.getSurveyStatus().then((r) => setSurveyOpen(r.survey_open));
  }, []);

  const applyDateFilter = () => {
    loadStats(dateFrom || undefined, dateTo || undefined);
  };

  const clearDateFilter = () => {
    setDateFrom('');
    setDateTo('');
    loadStats();
  };

  const toggleSurvey = async () => {
    if (surveyOpen === null) return;
    setToggling(true);
    try {
      const result = await api.updateSurveyStatus(!surveyOpen);
      setSurveyOpen(result.survey_open);
    } catch (err) {
      console.error('Failed to toggle survey:', err);
    } finally {
      setToggling(false);
    }
  };

  if (loading) return <div className="text-gray-500">Loading dashboard...</div>;
  if (!stats) return <div className="text-red-500">Failed to load stats</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        {surveyOpen !== null && (
          <button
            onClick={toggleSurvey}
            disabled={toggling}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              surveyOpen
                ? 'bg-green-100 text-green-800 hover:bg-green-200'
                : 'bg-red-100 text-red-800 hover:bg-red-200'
            }`}
          >
            {toggling ? 'Updating...' : surveyOpen ? 'Survey Open' : 'Survey Closed'}
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-end gap-3 mb-6 bg-white rounded-xl border border-gray-200 p-4">
        <div>
          <label className="block text-xs text-gray-500 mb-1">From</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">To</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
          />
        </div>
        <button
          onClick={applyDateFilter}
          className="px-4 py-1.5 bg-bahamas-aqua text-white text-sm rounded-lg hover:opacity-90"
        >
          Apply
        </button>
        {(dateFrom || dateTo) && (
          <button
            onClick={clearDateFilter}
            className="px-4 py-1.5 border border-gray-300 text-gray-600 text-sm rounded-lg hover:bg-gray-50"
          >
            Clear
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Responses" value={stats.total_responses} />
        <StatCard label="Responses Today" value={stats.today_responses} />
        <StatCard label="Total Page Views" value={pageViews?.total_views ?? '-'} />
        <StatCard label="Views Today" value={pageViews?.today_views ?? '-'} />
      </div>

      {pageViews && pageViews.by_page.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <BreakdownCard
            title="Views by Page"
            data={pageViews.by_page.map(r => ({
              label: r.path === '/' ? 'Home' : r.path,
              count: parseInt(r.count),
            }))}
          />
          <BreakdownCard
            title="Views by Day (Last 30 Days)"
            data={pageViews.by_day.map(r => ({
              label: new Date(r.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
              count: parseInt(r.count),
            }))}
          />
        </div>
      )}

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
              <div className="bg-bahamas-aqua h-1.5 rounded-full"
                style={{ width: `${(item.count / max) * 100}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
