export interface ClientConfig {
  baseURL: string;
  timeout?: number;
  retries?: number;
  jwt?: string;
}

export interface RequestHeaders {
  [key: string]: string;
}

export interface ApiClientError extends Error {
  status?: number;
  response?: any;
}
