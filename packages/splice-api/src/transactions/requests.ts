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

export interface CreateTransactionRequest {
  accountId: string;
  providerTransactionId: string;
  providerAccountId: string;
  amount: number;
  isoCurrencyCode?: string;
  unofficialCurrencyCode?: string;
  category?: {
    primary: string;
    detailed?: string;
    confidenceLevel?: string;
  };
  date: string;
  name: string;
  pending: boolean;
  logoUrl?: string;
  websiteUrl?: string;
}

export interface UpdateTransactionRequest {
  amount?: number;
  isoCurrencyCode?: string;
  unofficialCurrencyCode?: string;
  category?: {
    primary: string;
    detailed?: string;
    confidenceLevel?: string;
  };
  date?: string;
  name?: string;
  pending?: boolean;
  logoUrl?: string;
  websiteUrl?: string;
}

export interface TransactionResponse {
  id: string;
  accountId: string;
  providerTransactionId: string;
  providerAccountId: string;
  amount: number;
  isoCurrencyCode?: string;
  unofficialCurrencyCode?: string;
  category?: {
    primary: string;
    detailed?: string;
    confidenceLevel?: string;
  };
  date: string;
  name: string;
  pending: boolean;
  logoUrl?: string;
  websiteUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}
