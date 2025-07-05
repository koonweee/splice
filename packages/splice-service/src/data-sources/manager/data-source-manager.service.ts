import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  BankConnection,
  DataSourceAdapter,
  DataSourceType,
  StandardizedAccount,
  StandardizedTransaction,
} from 'splice-api';
import { DATA_SOURCE_ADAPTERS } from '../adapters/adapter.constants';

@Injectable()
export class DataSourceManager {
  private readonly logger = new Logger(DataSourceManager.name);

  constructor(
    @Inject(DATA_SOURCE_ADAPTERS)
    private readonly adapters: Map<DataSourceType, DataSourceAdapter>,
  ) {}

  async initiateConnection(sourceType: DataSourceType, userUuid: string): Promise<object | undefined> {
    const adapter = this.getAdapter(sourceType);
    this.logger.log(`Initiating connection for source type ${sourceType}`);
    return adapter.initiateConnection(userUuid);
  }

  async validateFinalizeConnectionPayload(sourceType: DataSourceType, payload?: object): Promise<void> {
    const adapter = this.getAdapter(sourceType);
    this.logger.log(`Validating finalize connection payload for source type ${sourceType}`);
    return adapter.validateFinalizeConnectionPayload(payload);
  }

  async fetchAccounts(connection: BankConnection, vaultAccessToken: string): Promise<StandardizedAccount[]> {
    const adapter = this.getAdapter(connection.bank.sourceType);
    this.logger.log(`Fetching accounts for connection ${connection.id}`);
    return adapter.fetchAccounts(connection, vaultAccessToken);
  }

  async fetchTransactions(
    connection: BankConnection,
    accountId: string,
    startDate: Date,
    endDate: Date,
    vaultAccessToken: string,
  ): Promise<StandardizedTransaction[]> {
    const adapter = this.getAdapter(connection.bank.sourceType);
    this.logger.log(`Fetching transactions for connection ${connection.id}, account ${accountId}`);
    return adapter.fetchTransactions(connection, accountId, startDate, endDate, vaultAccessToken);
  }

  private getAdapter(sourceType: DataSourceType): DataSourceAdapter {
    const adapter = this.adapters.get(sourceType);
    if (!adapter) {
      throw new Error(`No adapter registered for source type: ${sourceType}`);
    }
    return adapter;
  }
}
