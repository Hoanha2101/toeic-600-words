import { supabase } from './supabaseClient';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

export async function getAuthToken(): Promise<string | null> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      return session.access_token;
    }
  } catch (err) {
    console.error('Failed to get Supabase session:', err);
  }

  // Check localStorage for offline / mock token
  const devToken = localStorage.getItem('dev_auth_token');
  if (devToken) {
    return devToken;
  }

  return null;
}

export class ApiError extends Error {
  status: number;
  data: any;
  isNetworkError: boolean;

  constructor(status: number, message: string, data?: any, isNetworkError: boolean = false) {
    super(message);
    this.status = status;
    this.data = data;
    this.isNetworkError = isNetworkError;
    this.name = 'ApiError';
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = await getAuthToken();

  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const url = `${API_BASE_URL}${endpoint}`;
  let response: Response;

  try {
    response = await fetch(url, {
      ...options,
      headers,
    });
  } catch (netErr: any) {
    console.error('API network fetch failure:', netErr);
    const isOffline = typeof navigator !== 'undefined' && !navigator.onLine;
    const msg = isOffline
      ? 'Bạn đang mất kết nối Internet. Vui lòng kiểm tra WiFi/4G và thử lại.'
      : 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra đường truyền mạng hoặc thử lại.';
    throw new ApiError(0, msg, { originalError: netErr?.message || String(netErr) }, true);
  }

  if (!response.ok) {
    let errorDetail = response.statusText;
    let data: any = null;
    try {
      data = await response.json();
      errorDetail = data.detail || data.message || JSON.stringify(data);
    } catch {
      // not json
    }
    throw new ApiError(response.status, errorDetail, data, false);
  }

  // If 204 No Content
  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

export const apiClient = {
  get: <T>(endpoint: string) => request<T>(endpoint, { method: 'GET' }),
  post: <T>(endpoint: string, body?: any) => request<T>(endpoint, { method: 'POST', body: JSON.stringify(body) }),
  put: <T>(endpoint: string, body?: any) => request<T>(endpoint, { method: 'PUT', body: JSON.stringify(body) }),
  patch: <T>(endpoint: string, body?: any) => request<T>(endpoint, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: <T>(endpoint: string) => request<T>(endpoint, { method: 'DELETE' }),
};
