/** biome-ignore-all lint/complexity/noBannedTypes: <each adapter should extend the base types> */
import type { BankConnection } from '../bank-connections';

export enum StandardizedAccountType {
  CHECKING = 'CHECKING',
  SAVINGS = 'SAVINGS',
  CREDIT_CARD = 'CREDIT_CARD',
  INVESTMENT = 'INVESTMENT',
  OTHER = 'OTHER',
}

export interface StandardizedAccount {
  id: string;
  name: string;
  /** Last 2-4 alphanumeric characters of account number */
  mask?: string;
  type: StandardizedAccountType;
  balances?: StandardizedAccountBalances;
  institution: string;
  metadata?: Record<string, any>;
}

export interface StandardizedAccountBalances {
  /** Total balance (reflects posted transactions) */
  current?: number;
  /** Available balance (ie. current balance less pending transactions) */
  available?: number;
  /** Currency code in ISO 4217 format */
  isoCurrencyCode?: string;
  /** Unofficial currency code (ie. for non-ISO currencies like crypto) */
  unofficialCurrencyCode?: string;
  /** Last updated timestamp */
  lastUpdated?: string;
}

export interface StandardizedTransaction {
  id: string;
  accountId: string;
  date: string;
  datetime?: string;
  description: string;
  merchantName?: string;
  pending: boolean;
  logoUrl?: string;
  websiteUrl?: string;
  amount: number;
  isoCurrencyCode?: string;
  unofficialCurrencyCode?: string;
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
    startDate: Date,
    endDate: Date,
    vaultAccessToken: string,
    accountId?: string,
  ): Promise<StandardizedTransaction[]>;
}
