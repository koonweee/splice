import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import {
  BankConnection,
  DataSourceAdapter,
  StandardizedAccount,
  StandardizedAccountType,
  StandardizedTransaction,
} from 'splice-api';
import { z } from 'zod';
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

// Zod schema for scraper connection finalization payload
const ScraperFinalizeConnectionSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

@Injectable()
export class ScraperAdapter implements DataSourceAdapter {
  private readonly logger = new Logger(ScraperAdapter.name);

  constructor(private readonly scraperService: ScraperService) {}

  async initiateConnection() {
    this.logger.log(`Initiating scraper connection`);
    // For scrapers, no setup required so this returns immediately
    return undefined;
  }

  async validateFinalizeConnectionPayload(payload?: object): Promise<void> {
    this.logger.log(`Validating finalize connection payload for scraper connection`);

    try {
      // Use Zod to validate the payload structure
      ScraperFinalizeConnectionSchema.parse(payload);
      this.logger.log('Scraper connection payload validation successful');
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessages = error.errors.map((err) => `${err.path.join('.')}: ${err.message}`).join(', ');
        this.logger.error(`Scraper connection payload validation failed: ${errorMessages}`);
        throw new BadRequestException(`Validation failed: ${errorMessages}`);
      }
      this.logger.error(`Scraper connection payload validation failed: ${error}`);
      // Re-throw unexpected errors
      throw new BadRequestException(`Validation failed: ${error}`);
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
        type: StandardizedAccountType.OTHER,
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
    startDate: Date,
    endDate: Date,
    vaultAccessToken: string,
    accountId?: string,
  ): Promise<StandardizedTransaction[]> {
    this.logger.log(
      `Fetching transactions for scraper connection ${connection.id}, account ${accountId} from ${startDate.toISOString()} to ${endDate.toISOString()}`,
    );

    return this.fetchTransactionsWithToken(connection, startDate, endDate, vaultAccessToken, accountId);
  }

  /**
   * Extended method for fetching transactions with vault access token
   * This is specific to the scraper adapter and not part of the base interface
   */
  async fetchTransactionsWithToken(
    connection: BankConnection,
    startDate: Date,
    endDate: Date,
    vaultAccessToken: string,
    accountId?: string,
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
      return this.transformScrapedDataToStandardizedTransactions(scrapedData, connection, accountId);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to fetch transactions for connection ${connection.id}: ${errorMessage}`);
      throw error;
    }
  }

  private transformScrapedDataToStandardizedTransactions(
    scrapedData: Record<string, unknown>,
    connection: BankConnection,
    accountId?: string,
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
          pending: false,
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
