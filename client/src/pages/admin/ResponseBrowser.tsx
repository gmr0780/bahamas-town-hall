import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import { ISLANDS, AGE_GROUPS, SECTORS } from '../../lib/registration-options';

export default function ResponseBrowser() {
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState('');
  const [filters, setFilters] = useState({
    page: '1',
    limit: '20',
    island: '',
    age_group: '',
    sector: '',
    search: '',
    sort: 'created_at',
    order: 'desc',
  });

  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const handleSearchChange = useCallback((value: string) => {
    setSearchInput(value);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setFilters((prev) => ({ ...prev, search: value, page: '1' }));
    }, 400);
  }, []);

  useEffect(() => {
    return () => clearTimeout(debounceRef.current);
  }, []);

  useEffect(() => {
    setLoading(true);
    const params: Record<string, string> = {};
    Object.entries(filters).forEach(([k, v]) => { if (v) params[k] = v; });
    api.getResponses(params).then(setData).finally(() => setLoading(false));
  }, [filters]);

  const updateFilter = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: '1' }));
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Responses</h1>

      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
        <div className="flex flex-wrap gap-3">
          <input
            type="text"
            placeholder="Search name or email..."
            value={searchInput}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-bahamas-aqua focus:border-transparent"
          />
          <select
            value={filters.island}
            onChange={(e) => updateFilter('island', e.target.value)}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
          >
            <option value="">All Islands</option>
            {ISLANDS.map((i) => <option key={i} value={i}>{i}</option>)}
          </select>
          <select
            value={filters.age_group}
            onChange={(e) => updateFilter('age_group', e.target.value)}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
          >
            <option value="">All Ages</option>
            {AGE_GROUPS.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
          <select
            value={filters.sector}
            onChange={(e) => updateFilter('sector', e.target.value)}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
          >
            <option value="">All Sectors</option>
            {SECTORS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : !data?.data?.length ? (
          <div className="p-8 text-center text-gray-500">No responses found</div>
        ) : (
          <>
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Name</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Island</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Age</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Sector</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.data.map((row: any) => (
                  <tr
                    key={row.id}
                    onClick={() => navigate(`/admin/responses/${row.id}`)}
                    className="hover:bg-gray-50 cursor-pointer"
                  >
                    <td className="px-4 py-3 font-medium text-gray-900">{row.name}</td>
                    <td className="px-4 py-3 text-gray-600">{row.island}</td>
                    <td className="px-4 py-3 text-gray-600">{row.age_group}</td>
                    <td className="px-4 py-3 text-gray-600">{row.sector}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {new Date(row.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="px-4 py-3 border-t border-gray-200 flex justify-between items-center text-sm">
              <span className="text-gray-500">
                Page {data.page} of {data.total_pages} ({data.total} total)
              </span>
              <div className="flex gap-2">
                <button
                  disabled={data.page <= 1}
                  onClick={() => setFilters((p) => ({ ...p, page: String(data.page - 1) }))}
                  className="px-3 py-1 border border-gray-300 rounded-lg disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  disabled={data.page >= data.total_pages}
                  onClick={() => setFilters((p) => ({ ...p, page: String(data.page + 1) }))}
                  className="px-3 py-1 border border-gray-300 rounded-lg disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
