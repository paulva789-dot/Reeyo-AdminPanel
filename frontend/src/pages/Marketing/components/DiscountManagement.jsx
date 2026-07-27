// src/pages/Marketing/components/DiscountManagement.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Info, Gift, Disc3, RefreshCw, ArrowRight } from 'lucide-react';
import { apiClient, ApiError } from '../../../services/apiClient';

const DiscountManagement = () => {
  const navigate = useNavigate();
  const [rewards, setRewards] = useState([]);
  const [wheels, setWheels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [rewardsRes, wheelsRes] = await Promise.all([
        apiClient.get('/engagement/loyalty/rewards'),
        apiClient.get('/engagement/spin-wheels'),
      ]);
      setRewards((rewardsRes.data || []).filter((r) => ['DISCOUNT_CODE', 'FREE_DELIVERY'].includes(r.reward_type)));
      setWheels(wheelsRes.data || []);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not load discount-adjacent data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const discountSegments = wheels.flatMap((w) =>
    (w.segments || [])
      .filter((s) => ['DISCOUNT_PCT', 'DISCOUNT_FIXED', 'PROMO_CODE'].includes(s.reward_type))
      .map((s) => ({ ...s, wheelName: w.name }))
  );

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <Info size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-gray-700">
          <p className="font-semibold mb-1">There's no general-purpose "promo code" endpoint on the admin-api.</p>
          <p>
            The closest real equivalents are <strong>Loyalty Rewards</strong> (a customer redeems Reecoins for a discount code or
            free delivery) and <strong>Spin Wheel segments</strong> (a customer wins a discount by chance). Both are shown below,
            read-only — manage them from Engagement.
          </p>
        </div>
      </div>

      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">{error}</p>}

      {loading ? (
        <div className="flex justify-center py-12"><RefreshCw className="w-6 h-6 text-indigo-500 animate-spin" /></div>
      ) : (
        <>
          <section>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2"><Gift size={18} className="text-purple-600" /> Loyalty Discount Rewards</h3>
              <button onClick={() => navigate('/engagement')} className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
                Manage in Engagement <ArrowRight size={14} />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {rewards.map((r) => (
                <div key={r.id} className="border rounded-lg p-3 bg-white">
                  <p className="font-medium text-sm text-gray-800">{r.name}</p>
                  <p className="text-xs text-gray-500">{r.reward_type} &middot; {r.points_cost} pts &middot; {r.is_active ? 'Active' : 'Inactive'}</p>
                </div>
              ))}
              {rewards.length === 0 && <p className="col-span-full text-sm text-gray-500 italic">No discount-type loyalty rewards configured yet.</p>}
            </div>
          </section>

          <section>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2"><Disc3 size={18} className="text-indigo-600" /> Spin Wheel Discount Segments</h3>
              <button onClick={() => navigate('/engagement')} className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
                Manage in Engagement <ArrowRight size={14} />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {discountSegments.map((s) => (
                <div key={s.id} className="border rounded-lg p-3 bg-white">
                  <p className="font-medium text-sm text-gray-800">{s.label}</p>
                  <p className="text-xs text-gray-500">{s.reward_type} &middot; on "{s.wheelName}"</p>
                </div>
              ))}
              {discountSegments.length === 0 && <p className="col-span-full text-sm text-gray-500 italic">No discount-type spin wheel segments configured yet.</p>}
            </div>
          </section>
        </>
      )}
    </div>
  );
};

export default DiscountManagement;
