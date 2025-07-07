export interface AccountByIdParams {
  accountId: string;
}

export interface CreateAccountRequest {
  bankConnectionId: string;
  providerAccountId: string;
  name: string;
  type: {
    type: string;
    subtype?: string;
  };
  balances: {
    current?: number;
    available?: number;
    isoCurrencyCode?: string;
    unofficialCurrencyCode?: string;
    lastUpdated?: string;
  };
  mask?: string;
}

export interface UpdateAccountRequest {
  name?: string;
  balances?: {
    current?: number;
    available?: number;
    isoCurrencyCode?: string;
    unofficialCurrencyCode?: string;
    lastUpdated?: string;
  };
  mask?: string;
}

export interface AccountResponse {
  id: string;
  bankConnectionId: string;
  providerAccountId: string;
  name: string;
  type: {
    type: string;
    subtype?: string;
  };
  balances: {
    current?: number;
    available?: number;
    isoCurrencyCode?: string;
    unofficialCurrencyCode?: string;
    lastUpdated?: string;
  };
  mask?: string;
  createdAt: Date;
  updatedAt: Date;
}
