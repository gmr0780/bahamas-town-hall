const BASE_URL = '';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${url}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || body.errors?.[0] || `Request failed: ${res.status}`);
  }

  // Handle download responses
  const contentType = res.headers.get('content-type');
  if (contentType?.includes('text/csv')) {
    return (await res.text()) as unknown as T;
  }

  return res.json();
}

export const api = {
  // Citizen
  submitSurvey: (data: any) =>
    request<{ id: number }>('/api/citizens', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Admin auth
  login: (password: string) =>
    request<{ success: boolean }>('/api/admin/login', {
      method: 'POST',
      body: JSON.stringify({ password }),
    }),
  logout: () =>
    request<{ success: boolean }>('/api/admin/logout', { method: 'POST' }),
  checkAuth: () =>
    request<{ authenticated: boolean }>('/api/admin/check'),

  // Admin data
  getStats: () => request<any>('/api/admin/stats'),
  getResponses: (params: Record<string, string>) => {
    const qs = new URLSearchParams(params).toString();
    return request<any>(`/api/admin/responses?${qs}`);
  },
  getResponse: (id: number) => request<any>(`/api/admin/responses/${id}`),
  getDemographics: () => request<any>('/api/admin/demographics'),
  getPriorities: () => request<any>('/api/admin/priorities'),
  generateInsights: () =>
    request<{ insights: string }>('/api/admin/insights', { method: 'POST' }),

  // Export
  exportCsv: (params: Record<string, string>) => {
    const qs = new URLSearchParams(params).toString();
    return `/api/admin/export/csv?${qs}`;
  },
  exportJson: (params: Record<string, string>) => {
    const qs = new URLSearchParams(params).toString();
    return `/api/admin/export/json?${qs}`;
  },
};
