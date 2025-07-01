import { Injectable, Logger } from '@nestjs/common';
import {
  BankConnection,
  DataSourceAdapter,
  DataSourceContext,
  StandardizedAccount,
  StandardizedTransaction,
} from '@splice/api';
import { ScraperService } from '../../scraper/scraper.service';

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

@Injectable()
export class ScraperAdapter implements DataSourceAdapter {
  private readonly logger = new Logger(ScraperAdapter.name);

  constructor(private readonly scraperService: ScraperService) {}

  async initiateConnection(userId: string): Promise<{ linkToken?: string; status: 'ready' | 'redirect' }> {
    this.logger.log(`Initiating scraper connection for user ${userId}`);
    // For scrapers, the connection is ready immediately since credentials are stored in Bitwarden
    return { status: 'ready' };
  }

  async finalizeConnection(connectionData: object): Promise<{ authDetailsUuid: string; metadata: object }> {
    this.logger.log('Finalizing scraper connection');

    // Extract authDetailsUuid from connectionData
    const { authDetailsUuid } = connectionData as { authDetailsUuid: string };

    if (!authDetailsUuid) {
      throw new Error('authDetailsUuid is required for scraper connections');
    }

    return {
      authDetailsUuid,
      metadata: {
        sourceType: 'SCRAPER',
        connectionType: 'credential-based',
      },
    };
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

  async fetchAccounts(connection: BankConnection, _context?: DataSourceContext): Promise<StandardizedAccount[]> {
    this.logger.log(`Fetching accounts for scraper connection ${connection.id}`);

    // For scrapers, we don't have a separate account fetching mechanism
    // The accounts are discovered during transaction scraping
    // Return a placeholder account for now
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
    context?: DataSourceContext,
  ): Promise<StandardizedTransaction[]> {
    this.logger.log(
      `Fetching transactions for scraper connection ${connection.id}, account ${accountId} from ${startDate.toISOString()} to ${endDate.toISOString()}`,
    );

    // Extract access token from context
    if (!context?.accessToken) {
      throw new Error('ScraperAdapter.fetchTransactions requires an access token in the context');
    }

    return this.fetchTransactionsWithToken(connection, accountId, startDate, endDate, context.accessToken);
  }

  /**
   * Extended method for fetching transactions with access token
   * This is specific to the scraper adapter and not part of the base interface
   */
  async fetchTransactionsWithToken(
    connection: BankConnection,
    accountId: string,
    _startDate: Date,
    _endDate: Date,
    accessToken: string,
  ): Promise<StandardizedTransaction[]> {
    this.logger.log(`Fetching transactions with token for scraper connection ${connection.id}, account ${accountId}`);

    try {
      // Use the existing scraper service to get raw scraped data
      const scrapedData = await this.scraperService.scrapeByBankConnection(
        connection.userId,
        connection.id,
        accessToken,
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
