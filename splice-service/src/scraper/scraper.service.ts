import { Injectable, OnModuleInit, OnModuleDestroy, Logger, Inject, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ScrapedData } from '@splice/api';
import { Browser, chromium } from 'playwright';
import { ScraperStrategy } from 'src/scraper/strategies/types';
import { VaultService } from 'src/vault/vault.service';

@Injectable()
export class ScraperService implements OnModuleInit, OnModuleDestroy {
  private browser: Browser | null = null;
  private readonly logger = new Logger(ScraperService.name);
  private readonly scraperStrategies = new Map<string, ScraperStrategy>();

  constructor(
    @Inject('SCRAPER_STRATEGIES') private readonly strategies: ScraperStrategy[],
    private readonly configService: ConfigService,
    private readonly vaultService: VaultService,
  ) {
    // Register all strategies
    strategies.forEach(strategy => {
      this.scraperStrategies.set(strategy.name, strategy);
    });
  }

  async onModuleInit() {
    // Launch the browser when the module initializes
    this.logger.log('Launching browser');
    this.browser = await chromium.launch({
      headless: true, // Explicitly set headless mode
    });
    this.logger.log('Browser launched');
  }

  async onModuleDestroy() {
    // Close the browser when the module is destroyed
    if (this.browser) {
      await this.browser.close();
    }
  }

  async scrapeWebsite(websiteName: string): Promise<ScrapedData> {
    if (!this.browser) {
      this.logger.error('Browser not initialized');
      throw new HttpException('Browser not initialized', HttpStatus.INTERNAL_SERVER_ERROR);
    }

    const strategy = this.scraperStrategies.get(websiteName);
    if (!strategy) {
      throw new HttpException(`No scraper strategy found for website: ${websiteName}`, HttpStatus.NOT_FOUND);
    }

    // Get the secret uuid for the strategy (located in the config at bitwarden.secrets.${websiteName})
    const secretUuid = this.configService.get<string>(`bitwarden.secrets.${websiteName}`);
    if (!secretUuid) {
      throw new HttpException(`No secret uuid found for website: ${websiteName}`, HttpStatus.NOT_FOUND);
    }

    this.logger.log(`Retrieving secret for ${websiteName}: ${secretUuid}`);
    const accessToken = this.configService.get<string>('bitwarden.accessToken');
    if (!accessToken) {
      throw new HttpException('Bitwarden access token not configured', HttpStatus.INTERNAL_SERVER_ERROR);
    }
    const secret = await this.vaultService.getSecret(secretUuid, accessToken);

    const page = await this.browser.newPage();
    try {
      this.logger.log(`Navigating to ${strategy.startUrl}`);
      await page.goto(strategy.startUrl);
      // Wait for network to be idle
      await page.waitForLoadState('networkidle');
      this.logger.log(`Page settled ${strategy.startUrl}`);

      const data = await strategy.scrape(secret, page, this.logger);
      return data;
    } catch (error) {
      this.logger.error(`Failed to scrape ${strategy.startUrl}: ${error.message}`);
      throw new HttpException(
        `Failed to scrape ${strategy.startUrl}: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    } finally {
      await page.close();
    }
  }

  getAvailableStrategies(): string[] {
    return Array.from(this.scraperStrategies.keys());
  }
}
