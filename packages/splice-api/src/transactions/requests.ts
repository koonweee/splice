import type { StandardizedTransaction } from '../ledger';

export interface TransactionByIdParams {
  transactionId: string;
}

export interface TransactionQueryParams {
  accountId?: string;
  startDate?: string;
  endDate?: string;
  pending?: boolean;
  limit?: number;
  offset?: number;
}

export interface CreateTransactionRequest extends Omit<StandardizedTransaction, 'id'> {}

export interface UpdateTransactionRequest
  extends Partial<Omit<StandardizedTransaction, 'id' | 'accountId' | 'providerTransactionId' | 'providerAccountId'>> {}

export interface TransactionResponse extends StandardizedTransaction {
  createdAt: Date;
  updatedAt: Date;
}
