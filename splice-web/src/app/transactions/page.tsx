'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ApiError, apiClient } from '@/lib/api';
import { storage } from '@/lib/storage';

interface BankConnection {
  id: string;
  bankName: string;
  status: string;
  alias?: string;
  lastSync?: string;
}

interface Transaction {
  date: string;
  reference: string;
  transactionRef1: string;
  transactionRef2: string;
  transactionRef3: string;
  amount: number;
}

interface AccountData {
  transactions: Transaction[];
  totalBalance: number;
  type: string;
}

type TransactionData = Record<string, AccountData>;

export default function Transactions() {
  const [connectedBanks, setConnectedBanks] = useState<BankConnection[]>([]);
  const [selectedConnectionId, setSelectedConnectionId] = useState('');
  const [transactionData, setTransactionData] = useState<TransactionData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [secret, setSecret] = useState('');
  const router = useRouter();

  useEffect(() => {
    const storedApiKey = storage.getApiKey();
    const storedSecret = storage.getSecret();

    if (!storedApiKey || !storedSecret) {
      router.push('/');
      return;
    }

    setApiKey(storedApiKey);
    setSecret(storedSecret);
    loadConnectedBanks(storedApiKey);
  }, [router]);

  const loadConnectedBanks = async (key: string) => {
    try {
      const response = await apiClient.getUserBanks(key);
      const activeBanks = response.data;
      setConnectedBanks(activeBanks);
    } catch (err) {
      console.error('Failed to load connected banks:', err);
      setError('Failed to load connected banks');
    }
  };

  const handleFetchTransactions = async () => {
    if (!apiKey || !secret || !selectedConnectionId) return;

    setLoading(true);
    setError('');
    setTransactionData(null);

    try {
      const response = await apiClient.getTransactionsByConnection(apiKey, secret, selectedConnectionId);
      setTransactionData(response.data);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred while fetching transactions');
      }
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  console.log('transactionData', transactionData)

  if (connectedBanks.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow p-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">No Active Banks</h1>
            <p className="text-gray-600 mb-6">
              You need to have at least one active bank connection to view transactions.
            </p>
            <button
              onClick={() => router.push('/banks')}
              className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 font-medium"
            >
              Go to Bank Management
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">View Transactions</h1>
            <p className="text-gray-600 mt-2">Step 4: Fetch and view your financial data</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1">
              <label htmlFor="connectionSelect" className="block text-sm font-medium text-gray-700">
                Select Bank Connection
              </label>
              <select
                id="connectionSelect"
                value={selectedConnectionId}
                onChange={(e) => setSelectedConnectionId(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Choose a bank connection...</option>
                {connectedBanks.map((connection) => (
                  <option key={connection.id} value={connection.id}>
                    {connection.alias || connection.bankName}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleFetchTransactions}
              disabled={loading || !selectedConnectionId}
              className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
            >
              {loading ? 'Fetching...' : 'Fetch Transactions'}
            </button>
          </div>

          {error && <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">{error}</div>}
        </div>

        {transactionData && Object.entries(transactionData).map(([accountName, accountData]) => (
          <div key={accountName} className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900">{accountName}</h2>
              <p className="text-gray-600">{accountData.transactions.length} transactions found</p>
              <p className="text-sm text-gray-500">Balance: {formatCurrency(accountData.totalBalance)} • Type: {accountData.type}</p>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Reference
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {accountData.transactions.map((transaction, index) => {
                    const description = [transaction.transactionRef1, transaction.transactionRef2, transaction.transactionRef3]
                      .filter(ref => ref && ref.trim())
                      .join(' ');
                    
                    return (
                      <tr key={`${accountName}-${index}`} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {transaction.date}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {transaction.reference}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">{description || 'No description'}</td>
                        <td
                          className={`px-6 py-4 whitespace-nowrap text-sm text-right font-medium ${transaction.amount >= 0 ? 'text-green-600' : 'text-red-600'
                            }`}
                        >
                          {formatCurrency(transaction.amount)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ))}

        <div className="mt-6 text-center">
          <button onClick={() => router.push('/banks')} className="text-sm text-blue-600 hover:text-blue-800 underline">
            ← Back to Bank Management
          </button>
        </div>
      </div>
    </div>
  );
}
