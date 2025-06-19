import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { GetAccountsResponse } from '@splice/api';
import { ScraperService } from 'src/scraper/scraper.service';
import { VaultService } from 'src/vault/vault.service';

@Injectable()
export class TransactionsService {
  constructor(
    private readonly configService: ConfigService,
    private readonly vaultService: VaultService,
    private readonly scraperService: ScraperService,
  ) {}

  /**
   * Retrieves transactions for a specific account
   * @param accountName The name of the account to get transactions for
   * @returns Promise containing transactions and account information
   */
  async getTransactionsForAccount(accountName: string, accessToken: string): Promise<object> {
    const data = await this.scraperService.scrapeWebsite(accountName, accessToken);
    return data;
  }

  /**
   * Retrieves list of all available accounts
   * @returns Promise containing list of accounts and total count
   */
  async getAccounts(): Promise<GetAccountsResponse> {
    // TODO: Implement account retrieval logic
    return {
      accounts: [
        {
          name: 'DBS Checking',
          lastSyncTime: new Date(),
        },
      ],
    };
  }

  async getSecret(secretId: string): Promise<string> {
    const accessToken = this.configService.get<string>('bitwarden.accessToken');
    if (!accessToken) {
      throw new Error('Bitwarden access token not configured');
    }
    return this.vaultService.getSecret(secretId, accessToken);
  }
}
