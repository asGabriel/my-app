const API_BASE = '/api';
const FINANCE_PATH = `${API_BASE}/financeManager`;
const AUTH_PATH = `${API_BASE}/auth`;

interface RequestOptions extends RequestInit {
  token?: string;
}

let onUnauthorized: (() => void) | null = null;

export function setUnauthorizedHandler(handler: (() => void) | null) {
  onUnauthorized = handler;
}

async function request<T>(
  url: string,
  options: RequestOptions = {}
): Promise<T> {
  const { token, ...fetchOptions } = options;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(url, {
    ...fetchOptions,
    headers,
  });

  if (!response.ok) {
    if (response.status === 401 && token && onUnauthorized) {
      onUnauthorized();
    }
    const errorData = await response.json().catch(() => ({}));
    throw new ApiError(response.status, errorData.message || `API Error: ${response.status}`);
  }

  return response.json();
}

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  return request<T>(`${FINANCE_PATH}${endpoint}`, options);
}

export async function authRequest<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  return request<T>(`${AUTH_PATH}${endpoint}`, options);
}
