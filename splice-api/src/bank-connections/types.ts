export enum BankSourceType {
  SCRAPER = 'SCRAPER',
  PLAID = 'PLAID',
  SIMPLEFIN = 'SIMPLEFIN',
}

export enum BankConnectionStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  ERROR = 'ERROR',
  PENDING_AUTH = 'PENDING_AUTH',
}

export interface BankRegistry {
  id: string;
  name: string;
  logoUrl?: string;
  sourceType: BankSourceType;
  scraperIdentifier?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface BankConnection {
  id: string;
  userId: string;
  bankId: string;
  status: BankConnectionStatus;
  alias?: string;
  lastSync?: Date;
  authDetailsUuid: string;
  createdAt: Date;
  updatedAt: Date;
  bank?: BankRegistry;
}

export interface CreateBankConnectionRequest {
  bankId: string;
  alias?: string;
  authDetailsUuid: string;
}

export interface UpdateBankConnectionRequest {
  alias?: string;
  status?: BankConnectionStatus;
}

export interface BankConnectionResponse {
  id: string;
  bankId: string;
  bankName: string;
  bankLogoUrl?: string;
  sourceType: BankSourceType;
  status: BankConnectionStatus;
  alias?: string;
  lastSync?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface AvailableBankResponse {
  id: string;
  name: string;
  logoUrl?: string;
  sourceType: BankSourceType;
}
