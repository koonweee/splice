export interface GetTransactionsByAccountQuery {
  accountName: string;
  userId: string;
}

export interface GetTransactionsByConnectionQuery {
  userId: string;
  connectionId: string;
}

export interface GetSecretQuery {
  secretId: string;
}

export interface TransactionHeaders {
  'X-Secret': string;
}
