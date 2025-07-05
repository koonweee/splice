import { HttpException, HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BankConnectionStatus, type ScrapedData } from '@splice/api';
import { chromium } from 'playwright';
import { BankConnectionService } from '../bank-connections/bank-connection.service';
import { BankRegistryService } from '../bank-registry/bank-registry.service';
import { VaultService } from '../vault/vault.service';
import { ScraperStrategy } from './strategies/types';

@Injectable()
export class ScraperService {
  private readonly SCRAPER_TIMEOUT_MS = 20000;
  private readonly logger = new Logger(ScraperService.name);
  private readonly scraperStrategies = new Map<string, ScraperStrategy>();

  constructor(
    @Inject('SCRAPER_STRATEGIES')
    private readonly strategies: ScraperStrategy[],
    private readonly configService: ConfigService,
    private readonly vaultService: VaultService,
    private readonly bankConnectionService: BankConnectionService,
    private readonly bankRegistryService: BankRegistryService,
  ) {
    // Register all strategies
    strategies.forEach((strategy) => {
      this.scraperStrategies.set(strategy.name, strategy);
    });
  }

  async scrapeByBankConnection(userId: string, connectionId: string, accessToken: string): Promise<ScrapedData> {
    // Get the bank connection
    const connection = await this.bankConnectionService.findByUserIdAndConnectionId(userId, connectionId);
    if (!connection) {
      throw new HttpException('Bank connection not found', HttpStatus.NOT_FOUND);
    }

    if (connection.status === BankConnectionStatus.INACTIVE) {
      throw new HttpException('Bank connection is inactive', HttpStatus.BAD_REQUEST);
    }

    // Get the bank from registry
    const bank = connection.bank;
    if (!bank || !bank.scraperIdentifier) {
      throw new HttpException('Bank is not configured for scraping', HttpStatus.BAD_REQUEST);
    }

    // Get the scraper strategy
    const strategy = this.scraperStrategies.get(bank.scraperIdentifier);
    if (!strategy) {
      throw new HttpException(`No scraper strategy found for bank: ${bank.name}`, HttpStatus.NOT_FOUND);
    }

    // Launch browser for this request
    this.logger.log('Launching browser for scraping request');
    const browser = await chromium.launch({
      headless: true,
    });

    try {
      // Update connection status to indicate scraping in progress
      await this.bankConnectionService.updateStatus(connectionId, BankConnectionStatus.ACTIVE);

      if (!connection.authDetailsUuid) {
        throw new Error('Bank connection not authenticated. Please complete login first.');
      }

      this.logger.log(`Retrieving secret for connection ${connectionId}: ${connection.authDetailsUuid}`);
      const secret = await this.vaultService.getSecret(connection.authDetailsUuid, accessToken);

      const page = await browser.newPage();
      try {
        // Wrap scraping logic with timeout
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Scraping timeout')), this.SCRAPER_TIMEOUT_MS);
        });

        const scrapingPromise = async () => {
          this.logger.log(`Navigating to ${strategy.startUrl} for bank connection ${connectionId}`);
          await page.goto(strategy.startUrl);
          // Wait for network to be idle
          await page.waitForLoadState('networkidle');
          this.logger.log(`Page settled ${strategy.startUrl}`);

          const data = await strategy.scrape(secret, page, this.logger);

          // Update last sync time on successful scraping
          await this.bankConnectionService.updateLastSync(connectionId);

          return data;
        };

        const data = await Promise.race([scrapingPromise(), timeoutPromise]);
        return data;
      } finally {
        await page.close();
      }
    } catch (error) {
      let message: string = 'An error occurred while scraping the bank connection';
      if (error instanceof Error) {
        message = error.message;
      }
      this.logger.error(`Failed to scrape bank connection ${connectionId}: ${message}`);
      // Update connection status to error
      await this.bankConnectionService.updateStatus(connectionId, BankConnectionStatus.ERROR);
      throw new HttpException(`Failed to scrape bank connection: ${message}`, HttpStatus.INTERNAL_SERVER_ERROR);
    } finally {
      // Always close the browser
      await browser.close();
      this.logger.log('Browser closed');
    }
  }

  getAvailableStrategies(): string[] {
    return Array.from(this.scraperStrategies.keys());
  }
}
