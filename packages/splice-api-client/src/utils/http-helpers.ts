import type { ApiClientError, RequestHeaders } from '../types/client-config';

export class HttpError extends Error implements ApiClientError {
  constructor(
    message: string,
    public status?: number,
    public response?: any,
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

export function createHeaders(baseHeaders: RequestHeaders = {}, jwt?: string): RequestHeaders {
  const headers: RequestHeaders = {
    'Content-Type': 'application/json',
    ...baseHeaders,
  };

  if (jwt) {
    headers.Authorization = `Bearer ${jwt}`;
  }

  return headers;
}

export function buildQueryString(params: Record<string, string | undefined>): string {
  const filtered = Object.entries(params).filter(([_, value]) => value !== undefined);
  if (filtered.length === 0) return '';

  const searchParams = new URLSearchParams(filtered as [string, string][]);
  return `?${searchParams.toString()}`;
}

export async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
    let errorBody: any;

    try {
      errorBody = await response.json();
      if (errorBody.message) {
        errorMessage = errorBody.message;
      }
    } catch {
      // Response body might not be JSON
    }

    throw new HttpError(errorMessage, response.status, errorBody);
  }

  const contentType = response.headers.get('content-type');
  if (contentType?.includes('application/json')) {
    return response.json();
  }

  // For responses that don't return JSON (like 204 No Content)
  return {} as T;
}
