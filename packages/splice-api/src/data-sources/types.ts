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
 * InitiateConnectionResponse is the response type returned by initiateConnection
 * This may be undefined if the data source does not require any additional data to initiate the login process
 * For example, plaid would return an object containing a link token
 */
export interface DataSourceAdapter<InitiateConnectionResponse = undefined> {
  /**
   * To be called when user initiates the login process.
   * "setup step" that returns a payload containing data needed to start the login process (ie. link token for Plaid to initiate OAuth flow)
   */
  initiateConnection(userUuid: string): Promise<InitiateConnectionResponse>;
  /**
   * Function to validate payload when connection is finalized
   * eg. for plaid, validate that the payload contains an access token
   */
  validateFinalizeConnectionPayload(payload?: object): Promise<void>;
  fetchAccounts(connection: BankConnection, vaultAccessToken: string): Promise<StandardizedAccount[]>;
  fetchTransactions(
    connection: BankConnection,
    accountId: string,
    startDate: Date,
    endDate: Date,
    vaultAccessToken: string,
  ): Promise<StandardizedTransaction[]>;
}
