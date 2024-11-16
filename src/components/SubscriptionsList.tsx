import React from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { format } from 'date-fns';
import { AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';

type Subscription = {
  id: number;
  merchant: string;
  amount: number;
  frequency: string;
  day_of_month: number;
  last_transaction_date: string;
  is_active: boolean;
  is_false_positive: boolean;
};

export function SubscriptionsList() {
  const queryClient = useQueryClient();

  const { data: subscriptions, isLoading } = useQuery<Subscription[]>('subscriptions', async () => {
    const response = await fetch('/api/subscriptions');
    if (!response.ok) throw new Error('Failed to fetch subscriptions');
    return response.json();
  });

  const markFalsePositive = useMutation(
    async (id: number) => {
      const response = await fetch(`/api/subscriptions/${id}/false-positive`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to mark as false positive');
      return response.json();
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('subscriptions');
        toast.success('Marked as false positive');
      },
    }
  );

  const markInactive = useMutation(
    async (id: number) => {
      const response = await fetch(`/api/subscriptions/${id}/inactive`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to mark as inactive');
      return response.json();
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('subscriptions');
        toast.success('Marked as inactive');
      },
    }
  );

  if (isLoading) {
    return <div className="text-center py-8">Loading subscriptions...</div>;
  }

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Merchant
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Amount
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Frequency
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Billing Day
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Last Transaction
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {subscriptions?.map((subscription) => (
              <tr key={subscription.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {subscription.merchant}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  ${subscription.amount.toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {subscription.frequency}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {subscription.day_of_month}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {format(new Date(subscription.last_transaction_date), 'MMM d, yyyy')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                      ${
                        subscription.is_false_positive
                          ? 'bg-yellow-100 text-yellow-800'
                          : subscription.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                  >
                    {subscription.is_false_positive
                      ? 'False Positive'
                      : subscription.is_active
                      ? 'Active'
                      : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {subscription.is_active && !subscription.is_false_positive && (
                    <div className="flex space-x-2">
                      <button
                        onClick={() => markFalsePositive.mutate(subscription.id)}
                        className="text-yellow-600 hover:text-yellow-900"
                        title="Mark as false positive"
                      >
                        <AlertCircle className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => markInactive.mutate(subscription.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Mark as inactive"
                      >
                        <XCircle className="h-5 w-5" />
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}