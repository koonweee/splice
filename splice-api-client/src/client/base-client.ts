import type { ClientConfig, RequestHeaders } from '../types/client-config';
import { createHeaders, HttpError, handleResponse } from '../utils/http-helpers';

export abstract class BaseClient {
  protected baseURL: string;
  protected timeout: number;
  protected retries: number;
  protected jwt?: string;

  constructor(config: ClientConfig) {
    this.baseURL = config.baseURL.replace(/\/$/, '');
    this.timeout = config.timeout ?? 30000;
    this.retries = config.retries ?? 3;
    this.jwt = config.jwt;
  }

  protected async request<T>(
    method: string,
    path: string,
    options: {
      body?: any;
      headers?: RequestHeaders;
      queryParams?: Record<string, string | undefined>;
    } = {},
  ): Promise<T> {
    const url = `${this.baseURL}${path}`;
    const headers = createHeaders(options.headers, this.jwt);

    const requestOptions: RequestInit = {
      method,
      headers,
      signal: AbortSignal.timeout(this.timeout),
    };

    if (options.body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      requestOptions.body = JSON.stringify(options.body);
    }

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= this.retries; attempt++) {
      try {
        const response = await fetch(url, requestOptions);
        return await handleResponse<T>(response);
      } catch (error) {
        lastError = error as Error;

        if (error instanceof HttpError && error.status && error.status < 500) {
          throw error;
        }

        if (attempt === this.retries) {
          break;
        }

        await new Promise((resolve) => setTimeout(resolve, 2 ** attempt * 1000));
      }
    }

    throw lastError || new Error('Request failed after retries');
  }

  protected async get<T>(
    path: string,
    options?: { headers?: RequestHeaders; queryParams?: Record<string, string | undefined> },
  ): Promise<T> {
    const queryString = options?.queryParams ? this.buildQueryString(options.queryParams) : '';
    return this.request<T>('GET', `${path}${queryString}`, options);
  }

  protected async post<T>(path: string, body?: any, headers?: RequestHeaders): Promise<T> {
    return this.request<T>('POST', path, { body, headers });
  }

  protected async put<T>(path: string, body?: any, headers?: RequestHeaders): Promise<T> {
    return this.request<T>('PUT', path, { body, headers });
  }

  protected async delete<T>(path: string, headers?: RequestHeaders): Promise<T> {
    return this.request<T>('DELETE', path, { headers });
  }

  private buildQueryString(params: Record<string, string | undefined>): string {
    const filtered = Object.entries(params).filter(([_, value]) => value !== undefined);
    if (filtered.length === 0) return '';

    const searchParams = new URLSearchParams(filtered as [string, string][]);
    return `?${searchParams.toString()}`;
  }

  public setJwt(jwt: string): void {
    this.jwt = jwt;
  }

  public clearJwt(): void {
    this.jwt = undefined;
  }
}
