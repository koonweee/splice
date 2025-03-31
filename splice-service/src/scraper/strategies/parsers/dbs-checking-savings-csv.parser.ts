export type DBSTransaction = {
  date: string;
  reference: string;
  transactionRef1: string;
  transactionRef2: string;
  transactionRef3: string;
  amount: number; // Negative for credit, positive for debit
}

export type DBSAccountInfo = {
  accountName: string;
  statementDate: string;
  availableBalance: number;
  ledgerBalance: number;
  transactions: DBSTransaction[];
}

function parseDBSBalance(balanceStr: string): number {
  // Remove currency symbol and any whitespace, then parse as float
  return parseFloat(balanceStr.replace(/[^0-9.-]+/g, ''));
}

export function parseCSVLine(line: string): string[] {
  return line.split(',').map(item => item.trim());
}

export function parseTransactionLine(line: string): string[] {
  const result: string[] = [];

  // First handle the first 4 fields which are simple (no internal commas)
  const [dateStr, refStr, debitStr, creditStr, ...rest] = line.split(',');
  result.push(dateStr.trim(), refStr.trim(), debitStr.trim(), creditStr.trim());

  // We expect 3 more fields, but they might have commas in them


  // Regex to match ',<optional text, possibly containing comma with space but not just comma>,'
  const regex = /,(|(([^,]|(, ))+)),/

  // Proccess one match at a time
  let currentMatch: string;
  let remainingLine = `,${rest.join(',')}`;
  const matches: string[] = [];

  for (let i = 0; i < 3; i++) {
    const match = remainingLine.match(regex);
    const currentMatch = match[0];
    const currentMatchWithoutWrappingCommas = currentMatch.substring(1, currentMatch.length - 1);
    matches.push(currentMatchWithoutWrappingCommas);
    remainingLine = `,${remainingLine.substring(currentMatch.length)}`;
  }

  return [...result, ...matches];
}

function parseDBSTransaction(row: string[]): DBSTransaction {
  const debitStr = row[2].trim();
  const creditStr = row[3].trim();
  const amount = debitStr ? parseFloat(debitStr) : creditStr ? -parseFloat(creditStr) : 0;

  return {
    date: row[0],
    reference: row[1],
    transactionRef1: row[4] || '',
    transactionRef2: row[5] || '',
    transactionRef3: row[6] || '',
    amount
  };
}

export function parseDBSCSV(csvContent: string): DBSAccountInfo {
  const lines = csvContent.split('\n')
    .map(line => line.trim())
    .filter(line => line);

  // Parse account details from header using the new CSV parser
  const accountNameRow = parseCSVLine(lines[0]);
  const statementDateRow = parseCSVLine(lines[1]);
  const availableBalanceRow = parseCSVLine(lines[2]);
  const ledgerBalanceRow = parseCSVLine(lines[3]);

  const accountName = accountNameRow[1];
  const statementDate = statementDateRow[1];
  const availableBalance = parseDBSBalance(availableBalanceRow[1]);
  const ledgerBalance = parseDBSBalance(ledgerBalanceRow[1]);

  // Find the header row for transactions
  const transactionHeaderIndex = lines.findIndex(line =>
    line.includes('Transaction Date,Reference,Debit Amount,Credit Amount')
  );

  if (transactionHeaderIndex === -1) {
    throw new Error('Could not find transaction header in CSV');
  }

  // Parse transactions using the new CSV parser
  const transactions = lines
    .slice(transactionHeaderIndex + 1)
    .filter(line => line && !line.startsWith(','))
    .map(line => parseDBSTransaction(parseTransactionLine(line)));

  return {
    accountName,
    statementDate,
    availableBalance,
    ledgerBalance,
    transactions,
  };
}
