export interface AccountTransactionsResponse {
  accountName: string;
  transactions: Array<{
    id: string;
    date: string;
    description: string;
    amount: number;
  }>;
}
