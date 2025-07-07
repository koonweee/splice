import type { BankConnection } from '../bank-connections';
import type { StandardizedAccount, StandardizedTransaction } from '../ledger';

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
