'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient, ApiError } from '@/lib/api';
import { storage } from '@/lib/storage';

interface Bank {
  id: string;
  name: string;
  logoUrl?: string;
  sourceType: string;
}

interface BankConnection {
  id: string;
  bankName: string;
  status: string;
  alias?: string;
  lastSync?: string;
}

export default function Banks() {
  const [availableBanks, setAvailableBanks] = useState<Bank[]>([]);
  const [connectedBanks, setConnectedBanks] = useState<BankConnection[]>([]);
  const [selectedBankId, setSelectedBankId] = useState('');
  const [authDetailsUuid, setAuthDetailsUuid] = useState('');
  const [alias, setAlias] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [apiKey, setApiKey] = useState('');
  const router = useRouter();

  useEffect(() => {
    const storedApiKey = storage.getApiKey();
    if (!storedApiKey) {
      router.push('/');
      return;
    }
    setApiKey(storedApiKey);
    loadData(storedApiKey);
  }, [router]);

  const loadData = async (key: string) => {
    try {
      const [banksResponse, connectionsResponse] = await Promise.all([
        apiClient.getAvailableBanks(key),
        apiClient.getUserBanks(key)
      ]);
      
      setAvailableBanks(banksResponse.data);
      setConnectedBanks(connectionsResponse.data);
    } catch (err) {
      console.error('Failed to load data:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey || !selectedBankId || !authDetailsUuid) return;

    setLoading(true);
    setError('');

    try {
      await apiClient.createBankConnection(apiKey, {
        bankId: selectedBankId,
        authDetailsUuid,
        alias: alias || undefined
      });

      // Reload connected banks
      const connectionsResponse = await apiClient.getUserBanks(apiKey);
      setConnectedBanks(connectionsResponse.data);

      // Reset form
      setSelectedBankId('');
      setAuthDetailsUuid('');
      setAlias('');
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800';
      case 'PENDING_AUTH':
        return 'bg-yellow-100 text-yellow-800';
      case 'ERROR':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const goToNextStep = () => {
    router.push('/transactions');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Manage Bank Connections</h1>
            <p className="text-gray-600 mt-2">Step 3: Connect your bank accounts to Splice</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="bankSelect" className="block text-sm font-medium text-gray-700">
                Select Bank *
              </label>
              <select
                id="bankSelect"
                value={selectedBankId}
                onChange={(e) => setSelectedBankId(e.target.value)}
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Choose a bank...</option>
                {availableBanks.map((bank) => (
                  <option key={bank.id} value={bank.id}>
                    {bank.name} ({bank.sourceType})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="authDetailsUuid" className="block text-sm font-medium text-gray-700">
                Auth Details UUID *
              </label>
              <input
                type="text"
                id="authDetailsUuid"
                value={authDetailsUuid}
                onChange={(e) => setAuthDetailsUuid(e.target.value)}
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter the UUID for your bank credentials in Bitwarden"
              />
              <p className="mt-1 text-xs text-gray-500">
                This is the unique ID of your bank credentials stored in Bitwarden
              </p>
            </div>

            <div>
              <label htmlFor="alias" className="block text-sm font-medium text-gray-700">
                Alias (optional)
              </label>
              <input
                type="text"
                id="alias"
                value={alias}
                onChange={(e) => setAlias(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Give this connection a custom name"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !selectedBankId || !authDetailsUuid}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
            >
              {loading ? 'Connecting Bank...' : 'Connect Bank'}
            </button>
          </form>
        </div>

        {connectedBanks.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Connected Banks</h2>
            <div className="space-y-3">
              {connectedBanks.map((connection) => (
                <div key={connection.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <h3 className="font-medium text-gray-900">
                      {connection.alias || connection.bankName}
                    </h3>
                    {connection.alias && (
                      <p className="text-sm text-gray-500">{connection.bankName}</p>
                    )}
                    {connection.lastSync && (
                      <p className="text-xs text-gray-400">
                        Last sync: {new Date(connection.lastSync).toLocaleString()}
                      </p>
                    )}
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(connection.status)}`}>
                    {connection.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-between">
          <button
            onClick={() => router.push('/store-credentials')}
            className="text-sm text-blue-600 hover:text-blue-800 underline"
          >
            ← Back to Step 2
          </button>
          
          {connectedBanks.length > 0 && (
            <button
              onClick={goToNextStep}
              className="bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 font-medium"
            >
              Continue to Step 4: View Transactions →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}