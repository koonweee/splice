import type { AvailableBankResponse } from 'splice-api';
import { BaseClient } from './base-client';

export class BankRegistryClient extends BaseClient {
  async getAvailableBanks(): Promise<AvailableBankResponse[]> {
    return this.get<AvailableBankResponse[]>('/banks/available');
  }
}
