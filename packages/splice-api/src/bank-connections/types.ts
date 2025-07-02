import type { Bank, DataSourceType } from '../banks';
import type { BaseInterface } from '../common/base.types';

export enum BankConnectionStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  ERROR = 'ERROR',
  PENDING_AUTH = 'PENDING_AUTH',
}

export interface BankConnection extends BaseInterface {
  userId: string;
  bankId: string;
  status: BankConnectionStatus;
  alias?: string;
  lastSync?: Date;
  authDetailsUuid: string;
  bank: Bank;
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
  sourceType: DataSourceType;
  status: BankConnectionStatus;
  alias?: string;
  lastSync?: Date;
  createdAt: Date;
  updatedAt: Date;
}
