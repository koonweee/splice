import type { BaseInterface } from '../common/base.types';

export enum DataSourceType {
  SCRAPER = 'SCRAPER',
  PLAID = 'PLAID',
  SIMPLEFIN = 'SIMPLEFIN',
}

export interface Bank extends BaseInterface {
  name: string;
  logoUrl?: string;
  sourceType: DataSourceType;
  scraperIdentifier?: string;
  isActive: boolean;
}

export interface AvailableBankResponse {
  id: string;
  name: string;
  logoUrl?: string;
  sourceType: DataSourceType;
}
