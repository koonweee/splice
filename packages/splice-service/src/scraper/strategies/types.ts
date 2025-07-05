import type { Logger } from '@nestjs/common';
import type { ScrapedData } from 'splice-api';
import type { Page } from 'playwright';

export interface ScraperStrategy {
  name: string;
  startUrl: string;
  scrape(secret: string, page: Page, logger: Logger): Promise<ScrapedData>;
}

export interface Loader {
  load(filePath: string): Promise<string>;
}
