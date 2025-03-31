import { Controller, Get, Query } from '@nestjs/common';
import { ScraperService } from './scraper.service';

@Controller('scraper')
export class ScraperController {
  constructor(private readonly scraperService: ScraperService) {}

  @Get()
  async scrape(@Query('website') website: string) {
    return await this.scraperService.scrapeWebsite(website);
  }
}
