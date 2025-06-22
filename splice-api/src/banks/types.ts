export enum BankSourceType {
  SCRAPER = 'SCRAPER',
  PLAID = 'PLAID',
  SIMPLEFIN = 'SIMPLEFIN',
}

export interface Bank {
  id: string;
  name: string;
  logoUrl?: string;
  sourceType: BankSourceType;
  scraperIdentifier?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AvailableBankResponse {
  id: string;
  name: string;
  logoUrl?: string;
  sourceType: BankSourceType;
}
