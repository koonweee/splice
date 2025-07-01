import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ScraperService } from '../scraper/scraper.service';

@Injectable()
export class TransactionsService {
  constructor(
    private readonly configService: ConfigService,
    private readonly scraperService: ScraperService,
  ) {}

  /**
   * Retrieves transactions for a specific bank connection
   * @param userId The user's UUID
   * @param connectionId The bank connection ID
   * @param accessToken The Bitwarden access token
   * @returns Promise containing transactions and account information
   */
  async getTransactionsByBankConnection(userId: string, connectionId: string, accessToken: string): Promise<object> {
    const data = await this.scraperService.scrapeByBankConnection(userId, connectionId, accessToken);
    return data;
  }
}
