import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { StandardizedTransaction } from '@splice/api';
import { BankConnectionService } from '../bank-connections/bank-connection.service';
import { DataSourceManager } from '../data-sources/manager/data-source-manager.service';

@Injectable()
export class TransactionsService {
  constructor(
    private readonly configService: ConfigService,
    private readonly dataSourceManager: DataSourceManager,
    private readonly bankConnectionService: BankConnectionService,
  ) {}

  /**
   * Retrieves transactions for a specific bank connection using the appropriate data source adapter
   * @param userId The user's UUID
   * @param connectionId The bank connection ID
   * @param vaultAccessToken The Bitwarden vault access token
   * @param startDate Optional start date for filtering transactions
   * @param endDate Optional end date for filtering transactions
   * @returns Promise containing standardized transactions
   */
  async getTransactionsByBankConnection(
    userId: string,
    connectionId: string,
    vaultAccessToken: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<StandardizedTransaction[]> {
    // Fetch the bank connection to determine source type and get connection details
    const connection = await this.bankConnectionService.findByUserIdAndConnectionId(userId, connectionId);
    if (!connection) {
      throw new Error(`Bank connection not found: ${connectionId}`);
    }

    return await this.dataSourceManager.fetchTransactions(
      connection,
      `${connectionId}-default`, // Use default account ID for now
      startDate || new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // Default to last 90 days
      endDate || new Date(),
      vaultAccessToken,
    );
  }
}
