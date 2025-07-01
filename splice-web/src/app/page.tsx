'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient, ApiError } from '@/lib/api';
import { storage } from '@/lib/storage';

export default function Home() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [apiKey, setApiKey] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await apiClient.createUser({ username, email: email || undefined });
      const newApiKey = response.data.apiKey;
      
      setApiKey(newApiKey);
      storage.setApiKey(newApiKey);
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
    router.push('/store-credentials');
  };

  if (apiKey) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Account Created!</h1>
            <p className="text-gray-600 mt-3 text-lg">Your API key has been generated. Please copy and save it securely.</p>
          </div>

          <div className="bg-gray-50 p-6 rounded-lg mb-8 border">
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              API Key
            </label>
            <div className="flex">
              <input
                type="text"
                value={apiKey}
                readOnly
                className="flex-1 px-4 py-3 bg-white border border-gray-300 rounded-l-lg text-sm font-mono text-gray-900"
              />
              <button
                type="button"
                onClick={() => copyToClipboard(apiKey)}
                className="px-6 py-3 bg-blue-600 text-white rounded-r-lg hover:bg-blue-700 text-sm font-medium transition-colors"
              >
                Copy
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={goToNextStep}
            className="w-full bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 font-semibold text-lg transition-colors shadow-sm"
          >
            Continue to Step 2: Store Credentials
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Welcome to Splice</h1>
          <p className="text-gray-600 mt-3 text-lg">Step 1: Create your user account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="username" className="block text-sm font-semibold text-gray-700 mb-2">
              Username *
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="block w-full px-4 py-3 text-gray-900 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="Enter your username"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
              Email (optional)
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="block w-full px-4 py-3 text-gray-900 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="Enter your email"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !username.trim()}
            className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-semibold text-lg transition-colors shadow-sm"
          >
            {loading ? 'Creating Account...' : 'Create User'}
          </button>
        </form>
      </div>
    </div>
  );
}
