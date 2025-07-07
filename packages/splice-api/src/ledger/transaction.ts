export interface StandardizedTransaction {
  /** ID, this is Splice's record of the transaction, NOT the source's ID */
  id: string;
  /** ID of the account the transaction belongs to (Splice's record of the account) */
  accountId: string;
  /** Providers ID of the transaction (eg. Plaid transaction_id) */
  providerTransactionId: string;
  /** Providers ID of the account the transaction belongs to (eg. Plaid account_id) */
  providerAccountId: string;
  /** Amount of the transaction (positive for debit, negative for credit) */
  amount: number;
  /** ISO currency code (eg. USD, EUR) */
  isoCurrencyCode?: string;
  /** unofficial currency code (eg. for non-ISO currencies like crypto) */
  unofficialCurrencyCode?: string;
  /** Category for the transaction */
  category?: TransactionCategory;
  /** Date of the transaction (for pending: the date the transaction occurred, for posted: the date the transaction posted) */
  date: string;
  /** Name of the transaction (merchant name or transaction description) */
  name: string;
  /** Whether the transaction is pending */
  pending: boolean;
  /** Logo URL of the merchant */
  logoUrl?: string;
  /** Website URL of the merchant */
  websiteUrl?: string;
}

export interface TransactionCategory {
  primary: string;
  detailed?: string;
  confidenceLevel?: string;
}
