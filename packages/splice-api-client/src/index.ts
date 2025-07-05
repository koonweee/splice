export { ApiKeyStoreClient } from './client/api-key-store-client';
export { BankConnectionClient } from './client/bank-connection-client';
export { BankRegistryClient } from './client/bank-registry-client';
export { BaseClient } from './client/base-client';
export { UserClient } from './client/user-client';

export type { ApiClientError, ClientConfig, RequestHeaders } from './types/client-config';
export { buildQueryString, createHeaders, HttpError, handleResponse } from './utils/http-helpers';

import { ApiKeyStoreClient } from './client/api-key-store-client';
import { BankConnectionClient } from './client/bank-connection-client';
import { BankRegistryClient } from './client/bank-registry-client';
import { UserClient } from './client/user-client';
import type { ClientConfig } from './types/client-config';

export class SpliceApiClient {
  public readonly users: UserClient;
  public readonly bankConnections: BankConnectionClient;
  public readonly bankRegistry: BankRegistryClient;
  public readonly apiKeyStore: ApiKeyStoreClient;

  constructor(config: ClientConfig) {
    this.users = new UserClient(config);
    this.bankConnections = new BankConnectionClient(config);
    this.bankRegistry = new BankRegistryClient(config);
    this.apiKeyStore = new ApiKeyStoreClient(config);
  }

  setJwt(jwt: string): void {
    this.users.setJwt(jwt);
    this.bankConnections.setJwt(jwt);
    this.bankRegistry.setJwt(jwt);
    this.apiKeyStore.setJwt(jwt);
  }

  clearJwt(): void {
    this.users.clearJwt();
    this.bankConnections.clearJwt();
    this.bankRegistry.clearJwt();
    this.apiKeyStore.clearJwt();
  }
}
