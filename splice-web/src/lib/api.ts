const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public response?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface ApiRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  body?: unknown;
  params?: Record<string, string>;
}

class ApiClient {
  private async request<T>(endpoint: string, options: ApiRequestOptions = {}): Promise<T> {
    const { method = 'GET', headers = {}, body, params } = options;

    let url = `${API_BASE_URL}${endpoint}`;

    if (params) {
      const searchParams = new URLSearchParams(params);
      url += `?${searchParams.toString()}`;
    }

    const requestHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...headers,
    };

    const response = await fetch(url, {
      method,
      headers: requestHeaders,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ApiError(
        response.status,
        errorData.message || `HTTP ${response.status}: ${response.statusText}`,
        errorData,
      );
    }

    const responseHeaders: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      console.log(`Header: ${key} = ${value}`);
      responseHeaders[key] = value;
    });

    // Handle empty responses (like 201 with headers only)
    let data = null;
    const contentType = response.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      try {
        data = await response.json();
      } catch {
        // If JSON parsing fails, treat as empty response
        data = null;
      }
    }

    return { data, headers: responseHeaders } as T;
  }

  // User endpoints
  async createUser(userData: { username: string; email?: string }) {
    return this.request<{ data: { id: string; username: string; email?: string; apiKey: string } }>('/users', {
      method: 'POST',
      body: userData,
    });
  }

  // API Key Store endpoints
  async storeApiKey(bitwardenToken: string, jwtToken: string) {
    return this.request<{ headers: { 'X-Secret': string } }>('/api-key-store', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${jwtToken}`,
        'X-Api-Key': bitwardenToken,
      },
      body: { keyType: 'BITWARDEN' },
    });
  }

  // Bank endpoints
  async getAvailableBanks(token: string) {
    return this.request<{ data: Array<{ id: string; name: string; logoUrl?: string; sourceType: string }> }>(
      '/banks/available',
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );
  }

  async getUserBanks(token: string) {
    return this.request<{
      data: Array<{ id: string; bankName: string; status: string; alias?: string; lastSync?: string }>;
    }>('/users/banks', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  async createBankConnection(
    token: string,
    connectionData: { bankId: string; authDetailsUuid: string; alias?: string },
  ) {
    return this.request<{ data: { id: string; bankId: string; status: string } }>('/users/banks', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: connectionData,
    });
  }

  // Transaction endpoints
  async getTransactionsByConnection(token: string, secret: string, connectionId: string) {
    return this.request<{
      data: {
        accountName: string;
        transactions: Array<{ id: string; date: string; description: string; amount: number }>;
      };
    }>('/transactions/by-connection', {
      headers: {
        Authorization: `Bearer ${token}`,
        'X-Secret': secret,
      },
      params: {
        connectionId,
      },
    });
  }
}

export const apiClient = new ApiClient();
