import type { Logger } from '@nestjs/common';
import type { Page } from 'playwright';
import type { ScrapedData } from 'splice-api';

export interface ScraperStrategy {
  name: string;
  startUrl: string;
  scrape(secret: string, page: Page, logger: Logger): Promise<ScrapedData>;
}

export interface Loader {
  load(filePath: string): Promise<string>;
}
