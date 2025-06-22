import type { BaseInterface } from '../common/base.types';

export enum BankSourceType {
  SCRAPER = 'SCRAPER',
  PLAID = 'PLAID',
  SIMPLEFIN = 'SIMPLEFIN',
}

export interface Bank extends BaseInterface {
  name: string;
  logoUrl?: string;
  sourceType: BankSourceType;
  scraperIdentifier?: string;
  isActive: boolean;
}

export interface AvailableBankResponse {
  id: string;
  name: string;
  logoUrl?: string;
  sourceType: BankSourceType;
}
