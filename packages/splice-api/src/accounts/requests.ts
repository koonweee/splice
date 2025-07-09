import type { StandardizedAccount, StandardizedAccountBalances } from '../ledger';

export interface AccountByIdParams {
  accountId: string;
}

export interface CreateAccountRequest extends Omit<StandardizedAccount, 'id' | 'bankConnection' | 'type'> {
  bankConnectionId: string;
  type: {
    type: string;
    subtype?: string;
  };
}

export interface UpdateAccountRequest {
  name?: string;
  balances?: StandardizedAccountBalances;
  mask?: string;
}

export interface AccountResponse extends Omit<StandardizedAccount, 'bankConnection' | 'type'> {
  bankConnectionId: string;
  type: {
    type: string;
    subtype?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}
