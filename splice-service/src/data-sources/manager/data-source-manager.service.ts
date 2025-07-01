import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  BankConnection,
  DataSourceAdapter,
  DataSourceContext,
  DataSourceType,
  StandardizedAccount,
  StandardizedTransaction,
} from '@splice/api';
import { DATA_SOURCE_ADAPTERS } from '../adapters/adapter.constants';

@Injectable()
export class DataSourceManager {
  private readonly logger = new Logger(DataSourceManager.name);

  constructor(
    @Inject(DATA_SOURCE_ADAPTERS)
    private readonly adapters: Map<DataSourceType, DataSourceAdapter>,
  ) {}

  async initiateConnection(
    userId: string,
    sourceType: DataSourceType,
  ): Promise<{ linkToken?: string; status: 'ready' | 'redirect' }> {
    const adapter = this.getAdapter(sourceType);
    this.logger.log(`Initiating connection for user ${userId} with source type ${sourceType}`);
    return adapter.initiateConnection(userId);
  }

  async finalizeConnection(
    sourceType: DataSourceType,
    connectionData: object,
  ): Promise<{ authDetailsUuid: string; metadata: object }> {
    const adapter = this.getAdapter(sourceType);
    this.logger.log(`Finalizing connection with source type ${sourceType}`);
    return adapter.finalizeConnection(connectionData);
  }

  async getHealthStatus(connection: BankConnection): Promise<{ healthy: boolean; error?: string }> {
    const adapter = this.getAdapter(connection.bank.sourceType);
    this.logger.log(`Checking health status for connection ${connection.id}`);
    return adapter.getHealthStatus(connection);
  }

  async fetchAccounts(connection: BankConnection, context?: DataSourceContext): Promise<StandardizedAccount[]> {
    const adapter = this.getAdapter(connection.bank.sourceType);
    this.logger.log(`Fetching accounts for connection ${connection.id}`);
    return adapter.fetchAccounts(connection, context);
  }

  async fetchTransactions(
    connection: BankConnection,
    accountId: string,
    startDate: Date,
    endDate: Date,
    context?: DataSourceContext,
  ): Promise<StandardizedTransaction[]> {
    const adapter = this.getAdapter(connection.bank.sourceType);
    this.logger.log(`Fetching transactions for connection ${connection.id}, account ${accountId}`);
    return adapter.fetchTransactions(connection, accountId, startDate, endDate, context);
  }

  private getAdapter(sourceType: DataSourceType): DataSourceAdapter {
    const adapter = this.adapters.get(sourceType);
    if (!adapter) {
      throw new Error(`No adapter registered for source type: ${sourceType}`);
    }
    return adapter;
  }
}
