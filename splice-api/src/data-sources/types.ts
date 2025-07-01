/** biome-ignore-all lint/complexity/noBannedTypes: <each adapter should extend the base types> */
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

/**
 * Interface for object required to finalize the connection
 * - ie. for scraper, this may be { username: string, password: string }
 * - for Plaid, this may be { accessToken: string }
 */
type BaseConnectionData = {};

/**
 * Interface for payload returned by initiateConnection
 * - ie. for plaid, this may be { linkToken: string }
 */
type BaseInitiateConnectionPayload = {};

export interface DataSourceAdapter<I extends BaseInitiateConnectionPayload, J extends BaseConnectionData> {
  /**
   * To be called when user initiates the login process.
   * "setup step" that returns a payload containing data needed to start the login process (ie. link token for Plaid to initiate OAuth flow)
   */
  initiateConnection(userId: string): Promise<I>;
  /**
   * To be called when user completes the login process.
   * "finalization step" that sets the bank connection to ready and stores the connection data provided by the frontend
   */
  finalizeConnection(
    connection: BankConnection,
    connectionData: J,
    vaultAccessToken: string,
    vaultOrganizationId: string,
  ): Promise<void>;
  getHealthStatus(connection: BankConnection): Promise<{ healthy: boolean; error?: string }>;
  fetchAccounts(connection: BankConnection, vaultAccessToken: string): Promise<StandardizedAccount[]>;
  fetchTransactions(
    connection: BankConnection,
    accountId: string,
    startDate: Date,
    endDate: Date,
    vaultAccessToken: string,
  ): Promise<StandardizedTransaction[]>;
}
