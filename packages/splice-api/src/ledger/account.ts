import type { BankConnection } from '../bank-connections';

export interface StandardizedAccount {
  /** ID, this is Splice's record of the account, NOT the source's ID */
  id: string;
  /** Bank connection. A Splice bank connection can have one or many accounts */
  bankConnection: BankConnection;
  /** Provider's ID of the account (eg. Plaid account_id) */
  providerAccountId: string;
  /** Balances */
  balances: StandardizedAccountBalances;
  /** Mask (last 2-4 alphanumeric characters of account number) */
  mask?: string;
  /** Display name of the account */
  name: string;
  /** Type of the account */
  type: StandardizedAccountType;
}

export interface StandardizedAccountBalances {
  /** Total balance (reflects posted transactions) */
  current?: number;
  /** Available balance (ie. current balance less pending transactions) */
  available?: number;
  /** Currency code in ISO 4217 format */
  isoCurrencyCode?: string;
  /** Unofficial currency code (ie. for non-ISO currencies like crypto) */
  unofficialCurrencyCode?: string;
  /** Last updated timestamp */
  lastUpdated?: string;
}

export interface BaseStandardizedAccountType {
  type: AccountType;
  subtype?: string;
}

export type StandardizedAccountType =
  | DepositoryAccountType
  | CreditAccountType
  | InvestmentAccountType
  | OtherAccountType;

export enum AccountType {
  DEPOSITORY = 'DEPOSITORY',
  CREDIT = 'CREDIT',
  INVESTMENT = 'INVESTMENT',
  OTHER = 'OTHER',
}

export enum DepositoryAccountSubtype {
  CHECKING = 'CHECKING',
  SAVINGS = 'SAVINGS',
  HSA = 'HSA',
}

export interface DepositoryAccountType extends BaseStandardizedAccountType {
  type: AccountType.DEPOSITORY;
  subtype?: DepositoryAccountSubtype;
}

export enum CreditAccountSubtype {
  CREDIT_CARD = 'CREDIT_CARD',
}

export interface CreditAccountType extends BaseStandardizedAccountType {
  type: AccountType.CREDIT;
  subtype?: CreditAccountSubtype;
}

export enum InvestmentAccountSubtype {
  _401K = '401K',
  BROKERAGE = 'BROKERAGE',
  CRYPTO_EXCHANGE = 'CRYPTO_EXCHANGE',
  HSA = 'HSA',
  IRA = 'IRA',
  OTHER = 'OTHER',
  ROTH_IRA = 'ROTH_IRA',
  ROTH_401K = 'ROTH_401K',
}

export interface InvestmentAccountType extends BaseStandardizedAccountType {
  type: AccountType.INVESTMENT;
  subtype?: InvestmentAccountSubtype;
}

export interface OtherAccountType extends BaseStandardizedAccountType {
  type: AccountType.OTHER;
}
