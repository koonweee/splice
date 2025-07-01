'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { storage } from '@/lib/storage';

interface Step {
  number: number;
  title: string;
  path: string;
  description: string;
}

const steps: Step[] = [
  {
    number: 1,
    title: 'Create Account',
    path: '/',
    description: 'Create your user account'
  },
  {
    number: 2,
    title: 'Store Credentials',
    path: '/store-credentials',
    description: 'Store your Bitwarden token'
  },
  {
    number: 3,
    title: 'Manage Banks',
    path: '/banks',
    description: 'Connect your bank accounts'
  },
  {
    number: 4,
    title: 'View Transactions',
    path: '/transactions',
    description: 'Access your financial data'
  }
];

export default function Navigation() {
  const pathname = usePathname();
  const [hasApiKey, setHasApiKey] = useState(false);
  const [hasSecret, setHasSecret] = useState(false);

  useEffect(() => {
    setHasApiKey(storage.hasApiKey());
    setHasSecret(storage.hasSecret());
  }, [pathname]);

  const getStepStatus = (step: Step) => {
    if (pathname === step.path) {
      return 'current';
    }
    
    switch (step.number) {
      case 1:
        return hasApiKey ? 'completed' : 'pending';
      case 2:
        return hasSecret ? 'completed' : hasApiKey ? 'available' : 'locked';
      case 3:
        return hasSecret ? 'available' : 'locked';
      case 4:
        return hasSecret ? 'available' : 'locked';
      default:
        return 'pending';
    }
  };

  const getStepClasses = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-600 text-white border-green-600';
      case 'current':
        return 'bg-blue-600 text-white border-blue-600 ring-2 ring-blue-200';
      case 'available':
        return 'bg-white text-blue-600 border-blue-600 hover:bg-blue-50';
      case 'locked':
        return 'bg-gray-100 text-gray-400 border-gray-300';
      default:
        return 'bg-gray-100 text-gray-500 border-gray-300';
    }
  };

  const getConnectorClasses = (currentStatus: string, nextStatus: string) => {
    if (currentStatus === 'completed' || nextStatus === 'completed' || nextStatus === 'current') {
      return 'bg-green-600';
    }
    return 'bg-gray-300';
  };

  return (
    <div className="bg-white border-b border-gray-200 py-6 shadow-sm">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex items-center justify-between">
          {steps.map((step, index) => {
            const status = getStepStatus(step);
            const nextStatus = index < steps.length - 1 ? getStepStatus(steps[index + 1]) : 'pending';
            
            return (
              <div key={step.number} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div className={`
                    w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold border-2
                    ${getStepClasses(status)}
                  `}>
                    {status === 'completed' ? '✓' : step.number}
                  </div>
                  <div className="mt-3 text-center max-w-24">
                    <div className="text-sm font-semibold text-gray-900 leading-tight">
                      {step.title}
                    </div>
                    <div className="text-xs text-gray-600 mt-1 hidden sm:block leading-tight">
                      {step.description}
                    </div>
                  </div>
                </div>
                
                {index < steps.length - 1 && (
                  <div className={`
                    flex-1 h-1 mx-4 max-w-16 rounded-full
                    ${getConnectorClasses(status, nextStatus)}
                  `} />
                )}
              </div>
            );
          })}
        </nav>
      </div>
    </div>
  );
}