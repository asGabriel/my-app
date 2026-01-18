// In development, Vite proxy handles /api -> backend
// In production, we need the full URL
const API_BASE_URL = import.meta.env.PROD 
  ? import.meta.env.VITE_API_URL 
  : '';

const API_PATH = `${API_BASE_URL}/api/financeManager`;

interface RequestOptions extends RequestInit {
  token?: string;
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { token, ...fetchOptions } = options;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(`${API_PATH}${endpoint}`, {
    ...fetchOptions,
    headers,
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status}`);
  }

  return response.json();
}
