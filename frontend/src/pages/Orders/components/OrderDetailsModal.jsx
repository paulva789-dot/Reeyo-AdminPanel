// pages/Orders/components/OrderDetailsModal.jsx
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaMapMarkerAlt } from 'react-icons/fa';
import { BsX, BsBoxSeam, BsPerson, BsBicycle, BsCurrencyDollar, BsClock, BsCalendar, BsCheckCircle, BsGeoAlt, BsTruck } from 'react-icons/bs';
import { AiOutlineShop } from 'react-icons/ai';
import { RefreshCw } from 'lucide-react';
import { apiClient, ApiError } from '../../../services/apiClient';

const formatFCFA = (amount) => `${Number(amount || 0).toLocaleString('fr-FR')} FCFA`;

const DetailRow = ({ icon: Icon, label, value, colorClass = 'text-slate-700 dark:text-gray-200' }) => (
    <div className="flex items-start space-x-3 py-2 border-b border-gray-100 dark:border-gray-700 last:border-b-0">
        <Icon size={18} className={`shrink-0 mt-0.5 ${colorClass}`} />
        <div className="flex flex-col">
            <span className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">{label}</span>
            <span className={`text-sm ${colorClass} font-medium leading-tight`}>{value ?? '—'}</span>
        </div>
    </div>
);

const getStatusColor = (status) => {
    if (status === 'DELIVERED') return 'text-green-500';
    if (status === 'CANCELLED' || status === 'REFUNDED') return 'text-red-500';
    if (['RIDER_ASSIGNED', 'PICKED_UP'].includes(status)) return 'text-indigo-600';
    return 'text-yellow-500';
};

const CANCELLABLE_STATUSES = ['PENDING', 'CONFIRMED', 'PREPARING', 'READY'];
const ASSIGNABLE_STATUSES = ['CONFIRMED', 'PREPARING', 'READY'];

const OrderDetailsModal = ({ isOpen, onClose, orderId, onCancelled }) => {
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showCancelForm, setShowCancelForm] = useState(false);
    const [cancelReason, setCancelReason] = useState('');
    const [cancelling, setCancelling] = useState(false);

    const [showAssignForm, setShowAssignForm] = useState(false);
    const [availableRiders, setAvailableRiders] = useState([]);
    const [ridersLoading, setRidersLoading] = useState(false);
    const [selectedRiderId, setSelectedRiderId] = useState('');
    const [assigning, setAssigning] = useState(false);

    useEffect(() => {
        if (!isOpen || !orderId) return;
        setLoading(true);
        setError('');
        setShowCancelForm(false);
        setShowAssignForm(false);
        apiClient
            .get(`/orders/${orderId}`)
            .then((res) => setOrder(res.data))
            .catch((err) => setError(err instanceof ApiError ? err.message : 'Could not load order.'))
            .finally(() => setLoading(false));
    }, [isOpen, orderId]);

    const openAssignForm = async () => {
        setShowAssignForm(true);
        setRidersLoading(true);
        try {
            const res = await apiClient.get('/riders', { status: 'APPROVED', limit: 100 });
            setAvailableRiders(res.data || []);
        } catch (err) {
            setError(err instanceof ApiError ? err.message : 'Could not load riders.');
        } finally {
            setRidersLoading(false);
        }
    };

    const handleAssignRider = async () => {
        if (!selectedRiderId) return;
        setAssigning(true);
        setError('');
        try {
            const res = await apiClient.post(`/orders/${orderId}/assign-rider`, { riderId: selectedRiderId });
            setOrder((prev) => ({ ...prev, rider: res.data?.rider || prev.rider, status: res.data?.status || prev.status }));
            setShowAssignForm(false);
            setSelectedRiderId('');
        } catch (err) {
            setError(err instanceof ApiError ? err.message : 'Could not assign rider.');
        } finally {
            setAssigning(false);
        }
    };

    const handleCancel = async () => {
        setCancelling(true);
        try {
            // Cancelling never issues a refund on its own — there is no direct
            // refund endpoint. A refund can only be processed by resolving a
            // dispute for this order (POST /disputes/:disputeId/resolve).
            const res = await apiClient.post(`/orders/${orderId}/cancel`, { reason: cancelReason });
            setOrder((prev) => ({ ...prev, status: res.data.status }));
            onCancelled?.(orderId, res.data.status);
            setShowCancelForm(false);
        } catch (err) {
            setError(err instanceof ApiError ? err.message : 'Could not cancel order.');
        } finally {
            setCancelling(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                >
                    <motion.div
                        className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto transition-colors duration-300"
                        initial={{ y: 50, scale: 0.9 }}
                        animate={{ y: 0, scale: 1 }}
                        exit={{ y: 50, scale: 0.9 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="sticky top-0 p-5 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-white dark:bg-gray-800 z-10">
                            <h2 className="text-2xl font-bold text-slate-800 dark:text-gray-100">
                                Order Details <span className="font-mono text-indigo-500">{order?.order_number || ''}</span>
                            </h2>
                            <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300">
                                <BsX size={24} />
                            </button>
                        </div>

                        {loading ? (
                            <div className="p-12 flex items-center justify-center">
                                <RefreshCw className="w-6 h-6 text-indigo-500 animate-spin" />
                            </div>
                        ) : error ? (
                            <div className="p-6 text-red-600 dark:text-red-400">{error}</div>
                        ) : order ? (
                            <>
                                <div className="p-5 grid grid-cols-1 lg:grid-cols-3 gap-6">
                                    <div className="lg:col-span-2 space-y-6">
                                        <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-700">
                                            <h3 className="text-lg font-semibold mb-3 text-slate-800 dark:text-gray-100">Status Timeline</h3>
                                            <div className="space-y-2">
                                                {(order.timeline || []).map((step) => (
                                                    <div key={step.status} className="flex items-center justify-between text-sm">
                                                        <span className={`font-medium ${getStatusColor(step.status)}`}>{step.status.replace(/_/g, ' ')}</span>
                                                        <span className="text-gray-500 dark:text-gray-400">{new Date(step.at).toLocaleString()}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-700">
                                            <h3 className="text-lg font-semibold mb-3 text-slate-800 dark:text-gray-100">Location Details</h3>
                                            <DetailRow icon={AiOutlineShop} label="Vendor" value={order.vendor?.business_name} colorClass="text-orange-500" />
                                            <DetailRow icon={BsGeoAlt} label="Vendor Address" value={order.vendor_address} colorClass="text-slate-800 dark:text-gray-200" />
                                            <DetailRow icon={FaMapMarkerAlt} label="Delivery Address" value={order.delivery_address} colorClass="text-indigo-500" />
                                        </div>

                                        <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-700">
                                            <h3 className="text-lg font-semibold mb-3 text-slate-800 dark:text-gray-100">Special Instructions</h3>
                                            <p className="text-sm text-gray-600 dark:text-gray-300 italic">{order.special_instructions || 'No special instructions provided.'}</p>
                                        </div>
                                    </div>

                                    <div className="lg:col-span-1 space-y-6">
                                        <div className="p-4 rounded-lg bg-indigo-50 dark:bg-indigo-900/50 shadow-inner">
                                            <h3 className="text-lg font-semibold mb-3 text-indigo-600 dark:text-indigo-300">Summary</h3>
                                            <DetailRow icon={BsPerson} label="Customer" value={order.user?.name} />
                                            <div className="flex items-start justify-between space-x-3 py-2 border-b border-gray-100 dark:border-gray-700 last:border-b-0">
                                                <DetailRow icon={BsBicycle} label="Rider" value={order.rider?.name || 'Unassigned'} />
                                                {!order.rider && ASSIGNABLE_STATUSES.includes(order.status) && (
                                                    <button
                                                        onClick={openAssignForm}
                                                        className="mt-2 flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex-shrink-0"
                                                    >
                                                        <BsTruck size={12} /> Assign
                                                    </button>
                                                )}
                                            </div>
                                            <DetailRow icon={BsCurrencyDollar} label="Payment" value={`${order.payment_method}${order.payment ? ` (${order.payment.status})` : ''}`} />
                                            <DetailRow icon={BsClock} label="Est. Delivery" value={order.estimated_delivery_mins ? `${order.estimated_delivery_mins} min` : '—'} />
                                            <DetailRow icon={BsCalendar} label="Actual Delivery" value={order.actual_delivery_mins ? `${order.actual_delivery_mins} min` : '—'} />
                                            <DetailRow icon={BsCheckCircle} label="Order Total" value={formatFCFA(order.total_amount)} colorClass="text-green-600 dark:text-green-400 font-bold text-base" />
                                        </div>

                                        <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-700">
                                            <h3 className="text-lg font-semibold mb-3 text-slate-800 dark:text-gray-100 flex items-center space-x-2">
                                                <BsBoxSeam size={20} />
                                                <span>Order Items ({order.items?.length || 0})</span>
                                            </h3>
                                            <ul className="space-y-2">
                                                {(order.items || []).map((item) => (
                                                    <li key={item.id} className="flex justify-between text-sm text-gray-700 dark:text-gray-300">
                                                        <span className="font-medium">{item.quantity}x {item.name}</span>
                                                        <span className="font-semibold text-gray-900 dark:text-white">{formatFCFA(item.total_price)}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                </div>

                                {showAssignForm && (
                                    <div className="mx-5 mb-5 p-4 rounded-lg border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-900/20 space-y-3">
                                        <h4 className="text-sm font-semibold text-indigo-700 dark:text-indigo-300">Assign a Rider</h4>
                                        {ridersLoading ? (
                                            <RefreshCw className="w-4 h-4 text-indigo-500 animate-spin" />
                                        ) : (
                                            <select
                                                value={selectedRiderId}
                                                onChange={(e) => setSelectedRiderId(e.target.value)}
                                                className="w-full p-2 border border-indigo-300 dark:border-indigo-700 rounded-lg bg-white dark:bg-gray-800 text-sm"
                                            >
                                                <option value="">Select a rider...</option>
                                                {availableRiders.map((r) => (
                                                    <option key={r.id} value={r.id}>
                                                        {r.name} — {r.online_status} ({r.vehicle_type})
                                                    </option>
                                                ))}
                                            </select>
                                        )}
                                        <div className="flex justify-end gap-2">
                                            <button onClick={() => setShowAssignForm(false)} className="px-3 py-1.5 border rounded-lg text-sm">Cancel</button>
                                            <button
                                                onClick={handleAssignRider}
                                                disabled={!selectedRiderId || assigning}
                                                className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-sm disabled:opacity-50"
                                            >
                                                {assigning ? 'Assigning...' : 'Confirm Assignment'}
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {showCancelForm && CANCELLABLE_STATUSES.includes(order.status) && (
                                    <div className="mx-5 mb-5 p-4 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 space-y-3">
                                        <textarea
                                            value={cancelReason}
                                            onChange={(e) => setCancelReason(e.target.value)}
                                            rows={2}
                                            placeholder="Cancellation reason"
                                            className="w-full p-2 border border-red-300 dark:border-red-700 rounded-lg bg-white dark:bg-gray-800 text-sm"
                                        />
                                        <p className="text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-lg p-2">
                                            This only cancels the order — no refund is issued. To refund the customer, resolve a dispute for this order from the Disputes queue.
                                        </p>
                                    </div>
                                )}

                                <div className="sticky bottom-0 p-5 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex justify-end space-x-3">
                                    <button onClick={onClose} className="px-5 py-2 rounded-lg text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                                        Close
                                    </button>
                                    {CANCELLABLE_STATUSES.includes(order.status) && (
                                        showCancelForm ? (
                                            <button
                                                onClick={handleCancel}
                                                disabled={!cancelReason.trim() || cancelling}
                                                className="px-5 py-2 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700 transition-colors disabled:opacity-50"
                                            >
                                                {cancelling ? 'Cancelling...' : 'Confirm Cancellation'}
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => setShowCancelForm(true)}
                                                className="px-5 py-2 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700 transition-colors"
                                            >
                                                Cancel Order
                                            </button>
                                        )
                                    )}
                                </div>
                            </>
                        ) : null}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default OrderDetailsModal;
