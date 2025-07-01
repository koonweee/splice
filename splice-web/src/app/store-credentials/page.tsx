'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ApiError, apiClient } from '@/lib/api';
import { storage } from '@/lib/storage';

export default function StoreCredentials() {
  const [bitwardenToken, setBitwardenToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [secret, setSecret] = useState('');
  const [apiKey, setApiKey] = useState('');
  const router = useRouter();

  useEffect(() => {
    const storedApiKey = storage.getApiKey();
    if (!storedApiKey) {
      router.push('/');
      return;
    }
    setApiKey(storedApiKey);
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey) return;

    setLoading(true);
    setError('');

    try {
      const response = await apiClient.storeApiKey(bitwardenToken, apiKey);
      const newSecret = response.headers['x-secret'] || response.headers['X-Secret'];
      console.log('Available headers:', Object.keys(response.headers));

      setSecret(newSecret);
      storage.setSecret(newSecret);
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

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const goToNextStep = () => {
    router.push('/banks');
  };

  if (secret) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow p-6">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Credentials Stored!</h1>
            <p className="text-gray-600 mt-2">
              Your Bitwarden token has been encrypted and stored. Save this secret for accessing your financial data.
            </p>
          </div>

          <div className="bg-gray-100 p-4 rounded-lg mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Access Secret</label>
            <div className="flex">
              <input
                type="text"
                value={secret}
                readOnly
                className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-l-md text-sm font-mono"
              />
              <button
                onClick={() => copyToClipboard(secret)}
                className="px-4 py-2 bg-blue-600 text-white rounded-r-md hover:bg-blue-700 text-sm"
              >
                Copy
              </button>
            </div>
          </div>

          <button
            onClick={goToNextStep}
            className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 font-medium"
          >
            Continue to Step 3: Manage Banks
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow p-6">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Store Credentials</h1>
          <p className="text-gray-600 mt-2">Step 2: Securely store your Bitwarden access token</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="bitwardenToken" className="block text-sm font-medium text-gray-700">
              Bitwarden Access Token *
            </label>
            <textarea
              id="bitwardenToken"
              value={bitwardenToken}
              onChange={(e) => setBitwardenToken(e.target.value)}
              required
              rows={4}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Paste your Bitwarden access token here"
            />
            <p className="mt-1 text-xs text-gray-500">
              This token will be encrypted and stored securely. It's needed to access your bank credentials from
              Bitwarden.
            </p>
          </div>

          {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">{error}</div>}

          <button
            type="submit"
            disabled={loading || !bitwardenToken.trim() || !apiKey}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
          >
            {loading ? 'Storing Token...' : 'Store Token'}
          </button>
        </form>

        <div className="mt-4 text-center">
          <button onClick={() => router.push('/')} className="text-sm text-blue-600 hover:text-blue-800 underline">
            ← Back to Step 1
          </button>
        </div>
      </div>
    </div>
  );
}
