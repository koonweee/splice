import type { BankConnection } from '../bank-connections';

export interface StandardizedAccount {
  id: string;
  name: string;
  type: 'CHECKING' | 'SAVINGS' | 'CREDIT_CARD' | 'INVESTMENT' | 'LOAN' | 'OTHER';
  balance?: number;
  currency?: string;
  institution: string;
  metadata?: Record<string, any>;
}

export interface StandardizedTransaction {
  id: string;
  accountId: string;
  date: string;
  description: string;
  amount: number;
  currency?: string;
  category?: string;
  type: 'DEBIT' | 'CREDIT';
  metadata?: Record<string, any>;
}

export interface DataSourceContext {
  accessToken?: string;
  [key: string]: any;
}

export interface DataSourceAdapter {
  initiateConnection(userId: string): Promise<{ linkToken?: string; status: 'ready' | 'redirect' }>;
  finalizeConnection(connectionData: object): Promise<{ authDetailsUuid: string; metadata: object }>;
  getHealthStatus(connection: BankConnection): Promise<{ healthy: boolean; error?: string }>;
  fetchAccounts(connection: BankConnection, context?: DataSourceContext): Promise<StandardizedAccount[]>;
  fetchTransactions(
    connection: BankConnection,
    accountId: string,
    startDate: Date,
    endDate: Date,
    context?: DataSourceContext,
  ): Promise<StandardizedTransaction[]>;
}
