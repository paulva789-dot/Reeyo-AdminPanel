// src/pages/Engagement/components/SharedCarts.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Users } from 'lucide-react';
import { apiClient, ApiError } from '../../../services/apiClient';

const SharedCarts = () => {
  const [carts, setCarts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchCarts = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiClient.get('/engagement/shared-carts');
      setCarts(res.data || []);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not load shared carts.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCarts(); }, [fetchCarts]);

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600 flex items-center gap-2">
        <Users size={16} /> Read-only: carts customers have shared with friends via a share link.
      </p>
      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-2">{error}</p>}

      {loading ? (
        <div className="flex justify-center py-8"><RefreshCw className="w-5 h-5 text-indigo-500 animate-spin" /></div>
      ) : (
        <div className="overflow-x-auto border rounded-lg">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left">Share Token</th>
                <th className="px-4 py-2 text-left">Views</th>
                <th className="px-4 py-2 text-left">Adopted</th>
                <th className="px-4 py-2 text-left">Created</th>
                <th className="px-4 py-2 text-left">Expires</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {carts.map((cart) => (
                <tr key={cart.id}>
                  <td className="px-4 py-2 font-mono text-xs">{cart.share_token.slice(0, 12)}...</td>
                  <td className="px-4 py-2">{cart.view_count}</td>
                  <td className="px-4 py-2">{cart.adopted_count}</td>
                  <td className="px-4 py-2 text-gray-500">{new Date(cart.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-2 text-gray-500">{cart.expires_at ? new Date(cart.expires_at).toLocaleDateString() : '—'}</td>
                </tr>
              ))}
              {carts.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">No shared carts yet.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default SharedCarts;
