export interface BankConnectionByIdParams {
  connectionId: string;
}

export interface GetTransactionsQuery {
  startDate?: string;
  endDate?: string;
}
