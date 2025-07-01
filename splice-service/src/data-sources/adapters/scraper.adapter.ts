import { Injectable, Logger } from '@nestjs/common';
import {
  BankConnection,
  BankConnectionStatus,
  DataSourceAdapter,
  StandardizedAccount,
  StandardizedTransaction,
} from '@splice/api';
import { ScraperService } from '../../scraper/scraper.service';
import { VaultService } from '../../vault/vault.service';
import { BankConnectionService } from '../../bank-connections/bank-connection.service';

interface DBSAccountData {
  transactions: Array<{
    date: string;
    reference: string;
    transactionRef1: string;
    transactionRef2: string;
    transactionRef3: string;
    amount: number;
  }>;
  totalBalance: number;
  type: 'savings_or_checking' | 'credit_card';
}

// biome-ignore lint/complexity/noBannedTypes: <Scraper does not require any additional data to initiate the login process>
type ScraperInitiateConnectionPayload = {};
type ScraperFinalizeConnectionPayload = {
  username: string;
  password: string;
};

@Injectable()
export class ScraperAdapter
  implements DataSourceAdapter<ScraperInitiateConnectionPayload, ScraperFinalizeConnectionPayload>
{
  private readonly logger = new Logger(ScraperAdapter.name);

  constructor(
    private readonly scraperService: ScraperService,
    private readonly vaultService: VaultService,
    private readonly bankConnectionService: BankConnectionService,
  ) {}

  async initiateConnection(userId: string) {
    this.logger.log(`Initiating scraper connection for user ${userId}`);
    // For scrapers, no setup required so this returns immediately
    return {};
  }

  async finalizeConnection(
    connection: BankConnection,
    connectionData: ScraperFinalizeConnectionPayload,
    vaultAccessToken: string,
    vaultOrganizationId: string,
  ): Promise<void> {
    this.logger.log('Finalizing scraper connection');

    // Attempt to store the credentials in vault
    const authDetailsUuid = await this.vaultService.createSecret(
      connection.id,
      connectionData,
      vaultAccessToken,
      vaultOrganizationId,
    );

    this.logger.log(`Created vault secret for scraper connection ${connection.id} with uuid ${authDetailsUuid}`);

    // Set the auth details uuid on the connection
    await this.bankConnectionService.updateAuthDetailsUuid(connection.id, authDetailsUuid);

    // Set the connection status to ACTIVE
    await this.bankConnectionService.updateStatus(connection.id, BankConnectionStatus.ACTIVE);

    this.logger.log(`Finalized scraper connection ${connection.id}`);
  }

  async getHealthStatus(connection: BankConnection): Promise<{ healthy: boolean; error?: string }> {
    this.logger.log(`Checking health status for scraper connection ${connection.id}`);

    try {
      // Check if we can retrieve the secret from vault
      // We need an access token for this, but for health check we can just verify the connection exists
      if (!connection.authDetailsUuid) {
        return {
          healthy: false,
          error: 'Missing authentication details UUID',
        };
      }

      // For now, assume healthy if connection has required fields
      // In the future, we could do a lightweight test of the scraper strategy
      return { healthy: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Health check failed for connection ${connection.id}: ${errorMessage}`);
      return {
        healthy: false,
        error: errorMessage,
      };
    }
  }

  async fetchAccounts(connection: BankConnection, _vaultAccessToken: string): Promise<StandardizedAccount[]> {
    this.logger.log(`Fetching accounts for scraper connection ${connection.id}`);

    // For scrapers, we could potentially scrape to discover accounts
    // For now, return a placeholder account but we have access to the vault token if needed
    this.logger.debug(`Using vault access token for connection ${connection.id}`);

    return [
      {
        id: `${connection.id}-default`,
        name: connection.bank.name,
        type: 'OTHER',
        institution: connection.bank.name,
        metadata: {
          connectionId: connection.id,
          scraperIdentifier: connection.bank.scraperIdentifier,
        },
      },
    ];
  }

  async fetchTransactions(
    connection: BankConnection,
    accountId: string,
    startDate: Date,
    endDate: Date,
    vaultAccessToken: string,
  ): Promise<StandardizedTransaction[]> {
    this.logger.log(
      `Fetching transactions for scraper connection ${connection.id}, account ${accountId} from ${startDate.toISOString()} to ${endDate.toISOString()}`,
    );

    return this.fetchTransactionsWithToken(connection, accountId, startDate, endDate, vaultAccessToken);
  }

  /**
   * Extended method for fetching transactions with vault access token
   * This is specific to the scraper adapter and not part of the base interface
   */
  async fetchTransactionsWithToken(
    connection: BankConnection,
    accountId: string,
    _startDate: Date,
    _endDate: Date,
    vaultAccessToken: string,
  ): Promise<StandardizedTransaction[]> {
    this.logger.log(
      `Fetching transactions with vault token for scraper connection ${connection.id}, account ${accountId}`,
    );

    try {
      // Use the existing scraper service to get raw scraped data
      const scrapedData = await this.scraperService.scrapeByBankConnection(
        connection.userId,
        connection.id,
        vaultAccessToken,
      );

      // Transform the scraped data to standardized format
      return this.transformScrapedDataToStandardizedTransactions(scrapedData, accountId, connection);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to fetch transactions for connection ${connection.id}: ${errorMessage}`);
      throw error;
    }
  }

  private transformScrapedDataToStandardizedTransactions(
    scrapedData: Record<string, unknown>,
    _accountId: string,
    connection: BankConnection,
  ): StandardizedTransaction[] {
    const transactions: StandardizedTransaction[] = [];

    // The scraped data structure is: { "Account Name": { transactions: [...], totalBalance: number, type: string } }
    for (const [accountName, accountData] of Object.entries(scrapedData)) {
      if (typeof accountData !== 'object' || !accountData) continue;

      const typedAccountData = accountData as DBSAccountData;

      if (!typedAccountData.transactions || !Array.isArray(typedAccountData.transactions)) {
        continue;
      }

      // Transform each transaction to standardized format
      for (const transaction of typedAccountData.transactions) {
        const standardizedTransaction: StandardizedTransaction = {
          id: `${connection.id}-${accountName}-${transaction.date}-${transaction.reference}`,
          accountId: `${connection.id}-${accountName}`,
          date: transaction.date,
          description: this.buildTransactionDescription(transaction),
          amount: Math.abs(transaction.amount), // Store as positive amount
          currency: 'SGD', // DBS is Singapore bank
          type: transaction.amount >= 0 ? 'DEBIT' : 'CREDIT',
          metadata: {
            originalAmount: transaction.amount,
            reference: transaction.reference,
            transactionRef1: transaction.transactionRef1,
            transactionRef2: transaction.transactionRef2,
            transactionRef3: transaction.transactionRef3,
            accountName,
            accountBalance: typedAccountData.totalBalance,
            accountType: typedAccountData.type,
          },
        };

        transactions.push(standardizedTransaction);
      }
    }

    this.logger.log(`Transformed ${transactions.length} transactions from scraped data`);
    return transactions;
  }

  private buildTransactionDescription(transaction: {
    reference: string;
    transactionRef1: string;
    transactionRef2: string;
    transactionRef3: string;
  }): string {
    const parts = [
      transaction.reference,
      transaction.transactionRef1,
      transaction.transactionRef2,
      transaction.transactionRef3,
    ].filter((part) => part && part.trim().length > 0);

    return parts.join(' - ');
  }
}
