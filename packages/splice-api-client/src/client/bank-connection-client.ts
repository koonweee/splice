import type {
  BankConnectionResponse,
  BankConnectionStatus,
  CreateBankConnectionRequest,
  GetTransactionsQuery,
  StandardizedAccount,
  StandardizedTransaction,
} from 'splice-api';
import { BaseClient } from './base-client';

export class BankConnectionClient extends BaseClient {
  async getUserBankConnections(): Promise<BankConnectionResponse[]> {
    return this.get<BankConnectionResponse[]>('/users/banks');
  }

  async createBankConnection(request: CreateBankConnectionRequest): Promise<BankConnectionResponse> {
    return this.post<BankConnectionResponse>('/users/banks', request);
  }

  async deleteBankConnection(connectionId: string): Promise<void> {
    return this.delete<void>(`/users/banks/${connectionId}`);
  }

  async getBankConnectionStatus(connectionId: string): Promise<{ status: BankConnectionStatus; lastSync?: Date }> {
    return this.get<{ status: BankConnectionStatus; lastSync?: Date }>(`/users/banks/${connectionId}/status`);
  }

  async getBankConnectionAccounts(connectionId: string, secret: string): Promise<StandardizedAccount[]> {
    return this.get<StandardizedAccount[]>(`/users/banks/${connectionId}/accounts`, {
      headers: { 'X-Secret': secret },
    });
  }

  async initiateBankConnectionLogin(connectionId: string): Promise<object | undefined> {
    return this.post<object | undefined>(`/users/banks/${connectionId}/initiate-login`);
  }

  async finalizeBankConnectionLogin(connectionId: string, secret: string, payload: object): Promise<void> {
    const headers: Record<string, string> = { 'X-Secret': secret };

    return this.post<void>(`/users/banks/${connectionId}/finalize-login`, payload, headers);
  }

  async getBankConnectionTransactions(
    connectionId: string,
    secret: string,
    query?: GetTransactionsQuery,
  ): Promise<StandardizedTransaction[]> {
    return this.get<StandardizedTransaction[]>(`/users/banks/${connectionId}/transactions`, {
      headers: { 'X-Secret': secret },
      queryParams: query as Record<string, string | undefined>,
    });
  }
}
