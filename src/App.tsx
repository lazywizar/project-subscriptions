import React from 'react';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Toaster } from 'react-hot-toast';
import { FileUpload } from './components/FileUpload';
import { SubscriptionsList } from './components/SubscriptionsList';
import { TransactionsList } from './components/TransactionsList';
import { CreditCard, Receipt, Upload } from 'lucide-react';

const queryClient = new QueryClient();

function App() {
  const [activeTab, setActiveTab] = React.useState<'subscriptions' | 'transactions'>('subscriptions');

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex">
                <div className="flex-shrink-0 flex items-center">
                  <CreditCard className="h-8 w-8 text-indigo-600" />
                  <span className="ml-2 text-xl font-bold text-gray-900">SubTracker</span>
                </div>
              </div>
            </div>
          </div>
        </nav>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <FileUpload />
          </div>

          <div className="mb-6">
            <div className="sm:hidden">
              <select
                className="block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                value={activeTab}
                onChange={(e) => setActiveTab(e.target.value as 'subscriptions' | 'transactions')}
              >
                <option value="subscriptions">Subscriptions</option>
                <option value="transactions">Transactions</option>
              </select>
            </div>
            <div className="hidden sm:block">
              <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                  <button
                    onClick={() => setActiveTab('subscriptions')}
                    className={`${
                      activeTab === 'subscriptions'
                        ? 'border-indigo-500 text-indigo-600'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    } flex whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                  >
                    <Receipt className="mr-2 h-5 w-5" />
                    Subscriptions
                  </button>
                  <button
                    onClick={() => setActiveTab('transactions')}
                    className={`${
                      activeTab === 'transactions'
                        ? 'border-indigo-500 text-indigo-600'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    } flex whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                  >
                    <Upload className="mr-2 h-5 w-5" />
                    Transactions
                  </button>
                </nav>
              </div>
            </div>
          </div>

          {activeTab === 'subscriptions' ? <SubscriptionsList /> : <TransactionsList />}
        </main>
        <Toaster position="top-right" />
      </div>
    </QueryClientProvider>
  );
}

export default App;