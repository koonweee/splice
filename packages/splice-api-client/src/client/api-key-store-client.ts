import type { ApiKeyType } from '@splice/api';
import { createHeaders, HttpError } from '../utils/http-helpers';
import { BaseClient } from './base-client';

export class ApiKeyStoreClient extends BaseClient {
  async storeApiKey(apiKey: string, keyType: ApiKeyType, organisationId: string): Promise<string> {
    // This endpoint returns the secret in the X-Secret response header,
    // so we need custom handling instead of using the base client methods
    const url = `${this.baseURL}/api-key-store`;
    const headers = createHeaders({ 'X-Api-Key': apiKey }, this.jwt);

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({ keyType, organisationId }),
      signal: AbortSignal.timeout(this.timeout),
    });

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

    const secret = response.headers.get('X-Secret');
    if (!secret) {
      throw new HttpError('X-Secret header not found in response', response.status);
    }

    return secret;
  }
}
