import { useState } from 'react';
import { api } from '../../lib/api';
import { ISLANDS, AGE_GROUPS, SECTORS } from '../../lib/registration-options';

export default function Export() {
  const [filters, setFilters] = useState({ island: '', age_group: '', sector: '' });
  const [downloading, setDownloading] = useState<string | null>(null);

  const getParams = () => {
    const params: Record<string, string> = {};
    if (filters.island) params.island = filters.island;
    if (filters.age_group) params.age_group = filters.age_group;
    if (filters.sector) params.sector = filters.sector;
    return params;
  };

  const download = async (format: 'csv' | 'json') => {
    setDownloading(format);
    try {
      const url = format === 'csv'
        ? api.exportCsv(getParams())
        : api.exportJson(getParams());
      const res = await fetch(url, { credentials: 'include' });
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `town-hall-responses.${format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(blobUrl);
    } catch {
      alert('Failed to download export. Please try again.');
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Export Data</h1>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-800 mb-4">Filter Export</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Island</label>
            <select
              value={filters.island}
              onChange={(e) => setFilters((p) => ({ ...p, island: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="">All Islands</option>
              {ISLANDS.map((i) => <option key={i} value={i}>{i}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Age Group</label>
            <select
              value={filters.age_group}
              onChange={(e) => setFilters((p) => ({ ...p, age_group: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="">All Ages</option>
              {AGE_GROUPS.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sector</label>
            <select
              value={filters.sector}
              onChange={(e) => setFilters((p) => ({ ...p, sector: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="">All Sectors</option>
              {SECTORS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        <div className="flex gap-4">
          <button
            onClick={() => download('csv')}
            disabled={downloading !== null}
            className="bg-bahamas-aqua text-white px-6 py-2 rounded-lg font-medium hover:opacity-90 transition-opacity flex items-center gap-2 disabled:bg-gray-300"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            {downloading === 'csv' ? 'Downloading...' : 'Download CSV'}
          </button>
          <button
            onClick={() => download('json')}
            disabled={downloading !== null}
            className="border border-gray-300 text-gray-700 px-6 py-2 rounded-lg font-medium hover:bg-gray-50 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            {downloading === 'json' ? 'Downloading...' : 'Download JSON'}
          </button>
        </div>
      </div>
    </div>
  );
}
