import { useState, useEffect } from 'react';
import { Search, Filter, Download, Eye, CheckCircle, XCircle, Pause, Play, Star, DollarSign, Clock, X, Phone, Mail, MapPin, AlertTriangle, Tag, Image as ImageIcon, Link } from 'lucide-react';

// --- START: Mock Data & Utility Functions (Replaces Supabase) ---

const MOCK_VENDORS = [
  {
    id: 'v1',
    restaurant_name: 'Chez Pierre Bistro',
    contact_person: 'Pierre Dupont',
    phone: '+237699000101',
    email: 'pierre@bistro.com',
    commission_rate: 15.0,
    city: 'Douala',
    rating: 4.5,
    status: 'Active',
    created_at: '2022-01-15T10:00:00Z',
    operating_hours: { Mon: '08:00-22:00', Tue: '08:00-22:00', Sat: '09:00-23:00' },
    search_tags: ['french', 'bistro', 'breakfast', 'douala'],
    marketing_tags: [
      { tag: 'In High Demand', startTime: '10:00', endTime: '14:00', days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] },
      { tag: 'Popular', startTime: '17:00', endTime: '21:00', days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] }
    ],
    storefront_image: null,
    google_maps_address: 'https://maps.google.com/?q=Chez+Pierre+Bistro+Douala',
    commission_type: 'percentage',
  },
  {
    id: 'v2',
    restaurant_name: 'Yaounde Fast Food',
    contact_person: 'Sylvie Mballa',
    phone: '+237677111222',
    email: 'sylvie@fastfood.net',
    commission_rate: 20.0,
    city: 'Yaounde',
    rating: 3.8,
    status: 'Pending',
    created_at: '2023-11-20T14:30:00Z',
    operating_hours: null,
    search_tags: ['fast food', 'yaounde', 'burgers', 'delivery'],
    marketing_tags: [],
    storefront_image: null,
    google_maps_address: '',
    commission_type: 'fixed',
    fixed_commission: 500,
  },
  {
    id: 'v3',
    restaurant_name: 'The Sushi Spot',
    contact_person: 'Kenji Tanaka',
    phone: '+237688333444',
    email: 'kenji@sushi.co',
    commission_rate: 12.5,
    city: 'Douala',
    rating: 4.9,
    status: 'Suspended',
    created_at: '2021-05-01T08:45:00Z',
    operating_hours: { Wed: '11:00-20:00', Thu: '11:00-20:00' },
    search_tags: ['sushi', 'japanese', 'douala', 'seafood'],
    marketing_tags: [
      { tag: 'In High Demand', startTime: '12:00', endTime: '15:00', days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] }
    ],
    storefront_image: null,
    google_maps_address: 'https://maps.google.com/?q=The+Sushi+Spot+Douala',
    commission_type: 'percentage',
  },
];

const MOCK_PAYOUTS = [
  { id: 'p1', vendor_id: 'v1', amount: 50000, status: 'Completed', created_at: '2024-10-01T12:00:00Z' },
  { id: 'p2', vendor_id: 'v1', amount: 35000, status: 'Completed', created_at: '2024-09-25T12:00:00Z' },
  { id: 'p3', vendor_id: 'v1', amount: 65000, status: 'Pending', created_at: '2024-10-05T12:00:00Z' },
  { id: 'p4', vendor_id: 'v3', amount: 20000, status: 'Completed', created_at: '2024-09-01T12:00:00Z' },
];

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('fr-CM', {
    style: 'currency',
    currency: 'XAF',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};
// --- END: Mock Data & Utility Functions ---


// Renamed to a standard function declaration, removing 'export default' from the start
function VendorManagement() {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  
  // Modal States
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [vendorPayouts, setVendorPayouts] = useState([]);
  const [payoutsLoading, setPayoutsLoading] = useState(false);
  const [newCommissionRate, setNewCommissionRate] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchVendors();
  }, []);

  // --- START: Data Fetching with Mocking ---
  const fetchVendors = async () => {
    setLoading(true);
    setError(null);
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Use mock data instead of Supabase
      setVendors(MOCK_VENDORS);
    } catch (err) {
      console.error('Error fetching vendors:', err);
      setError('Failed to fetch vendors. (Using mock data).');
    } finally {
      setLoading(false);
    }
  };

  const fetchVendorPayouts = async (vendorId) => {
    setPayoutsLoading(true);
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Filter mock payouts by vendorId
      const payouts = MOCK_PAYOUTS
        .filter(p => p.vendor_id === vendorId)
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        
      setVendorPayouts(payouts);
    } catch (err) {
      console.error('Error fetching vendor payouts:', err);
    } finally {
      setPayoutsLoading(false);
    }
  };
  // --- END: Data Fetching with Mocking ---


  const handleViewDetails = async (vendor) => {
    setSelectedVendor(vendor);
    setNewCommissionRate(vendor.commission_rate.toString());
    setShowDetailsModal(true);
    await fetchVendorPayouts(vendor.id);
  };
  
  const closeModal = () => {
    setShowDetailsModal(false);
    setSelectedVendor(null);
    setVendorPayouts([]);
    setNewCommissionRate('');
  };

  // --- START: Data Updates with Local State (No Supabase) ---
  const handleUpdateStatus = async (vendor, newStatus) => {
    setError(null);
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Update the state locally (MIMICKING DB WRITE)
      setVendors(prevVendors => 
        prevVendors.map(v => 
          v.id === vendor.id ? { ...v, status: newStatus } : v
        )
      );

      // Update the status in the selectedVendor state if the modal is open
      if (selectedVendor?.id === vendor.id) {
        setSelectedVendor((prev) => ({ ...prev, status: newStatus }));
      }
    } catch (err) {
      console.error('Error updating vendor status:', err);
      setError(`Failed to update status for ${vendor.restaurant_name}. (Local state update failed).`);
    }
  };

  const handleUpdateCommission = async (vendorId) => {
    setError(null);
    const rate = parseFloat(newCommissionRate);

    if (isNaN(rate) || rate < 0 || rate > 100) {
      setError('Invalid commission rate. Must be between 0 and 100.');
      return;
    }

    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 300));
        
      // Update the state locally (MIMICKING DB WRITE)
      setVendors(prevVendors => 
        prevVendors.map(v => 
          v.id === vendorId ? { ...v, commission_rate: rate } : v
        )
      );

      // Update local state on success (to refresh the modal)
      if (selectedVendor?.id === vendorId) {
        setSelectedVendor((prev) => ({ ...prev, commission_rate: rate }));
      }
      
    } catch (err) {
      console.error('Error updating commission rate:', err);
      setError('Failed to update commission rate. (Local state update failed).');
    }
  };
  // --- END: Data Updates with Local State (No Supabase) ---

  const exportToCSV = () => {
    const headers = ['Restaurant Name', 'Contact Person', 'Phone', 'Email', 'Commission Rate', 'City', 'Rating', 'Status'];
    const rows = filteredVendors.map(v => [
      // Enclose fields that might contain commas in quotes
      `"${v.restaurant_name}"`, `"${v.contact_person}"`, v.phone, v.email, v.commission_rate, v.city, v.rating, v.status
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'vendors.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const filteredVendors = vendors.filter(vendor => {
    const { restaurant_name, contact_person, email, status } = vendor;
    
    const matchesSearch = restaurant_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          contact_person?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-800 mb-2">Vendor Management</h1>
        <p className="text-slate-600">Manage restaurants and merchant partners</p>
      </div>

      {/* --- Error Notification --- */}
      {error && (
        <div className="mb-4 flex items-center p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg" role="alert">
          <AlertTriangle className="w-5 h-5 mr-3" />
          <span className="font-medium">{error}</span>
          <button onClick={() => setError(null)} className="ml-auto text-red-700 hover:text-red-900">
            <X className="w-5 h-5" />
          </button>
        </div>
      )}
      {/* --------------------------- */}

      <div className="bg-white rounded-lg shadow-md">
        <div className="p-4 border-b border-slate-200 flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by restaurant, contact, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-slate-600" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 appearance-none bg-white pr-8"
            >
              <option value="All">All Status</option>
              <option value="Pending">Pending</option>
              <option value="Active">Active</option>
              <option value="Suspended">Suspended</option>
            </select>
          </div>

          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            Export to CSV
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full table-auto">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider min-w-[150px]">Restaurant</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider min-w-[120px]">Contact Person</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Commission</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider min-w-[80px]">City</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider min-w-[80px]">Rating</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider min-w-[100px]">Status</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider min-w-[120px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredVendors.map((vendor) => (
                <tr key={vendor.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-800">{vendor.restaurant_name}</div>
                    <div className="text-sm text-slate-500">{vendor.email}</div>
                  </td>
                  <td className="px-6 py-4 text-slate-600">{vendor.contact_person}</td>
                  <td className="px-6 py-4">
                    <span className="font-semibold text-orange-600">{vendor.commission_rate}%</span>
                  </td>
                  <td className="px-6 py-4 text-slate-600">{vendor.city || 'N/A'}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-medium">{parseFloat(vendor.rating || 0).toFixed(1)}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      vendor.status === 'Active' ? 'bg-green-100 text-green-800' :
                      vendor.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {vendor.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleViewDetails(vendor)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {vendor.status === 'Pending' && (
                        <>
                          <button
                            onClick={() => handleUpdateStatus(vendor, 'Active')}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Approve"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(vendor, 'Suspended')}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Reject"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      {vendor.status === 'Active' && (
                        <button
                          onClick={() => handleUpdateStatus(vendor, 'Suspended')}
                          className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                          title="Suspend"
                        >
                          <Pause className="w-4 h-4" />
                        </button>
                      )}
                      {vendor.status === 'Suspended' && (
                        <button
                          onClick={() => handleUpdateStatus(vendor, 'Active')}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="Reactivate"
                        >
                          <Play className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredVendors.length === 0 && (
            <div className="text-center py-12 text-slate-500">
              No vendors found matching your criteria
            </div>
          )}
        </div>

        <div className="p-4 border-t border-slate-200 flex items-center justify-between text-sm text-slate-600">
          <div>
            Showing <span className="font-semibold">{filteredVendors.length}</span> of <span className="font-semibold">{vendors.length}</span> vendors
          </div>
        </div>
      </div>

      {/* --- Vendor Details Modal --- */}
      {showDetailsModal && selectedVendor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={closeModal}>
          <div 
            className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()} // Prevent closing on click inside modal
          >
            <div className="p-6 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white z-10">
              <h2 className="text-2xl font-bold text-slate-800">Vendor Details</h2>
              <button
                onClick={closeModal}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-600" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-slate-800 border-b pb-2">Restaurant Information</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <span className="text-orange-600 font-bold text-xl">{selectedVendor.restaurant_name?.charAt(0) || '?'}</span>
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800 text-lg">{selectedVendor.restaurant_name}</p>
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm font-medium">{parseFloat(selectedVendor.rating || 0).toFixed(1)} rating</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-slate-600">
                      <Mail className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate">{selectedVendor.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-600">
                      <Phone className="w-4 h-4 flex-shrink-0" />
                      <span>{selectedVendor.phone}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-600">
                      <MapPin className="w-4 h-4 flex-shrink-0" />
                      <span>{selectedVendor.city || 'Not specified'}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-slate-800 border-b pb-2">Business Details</h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-slate-600 mb-1">Contact Person</p>
                      <p className="font-medium text-slate-800">{selectedVendor.contact_person}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600 mb-1">Status</p>
                      <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                        selectedVendor.status === 'Active' ? 'bg-green-100 text-green-800' :
                        selectedVendor.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {selectedVendor.status}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600 mb-2">Commission Rate</p>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={newCommissionRate}
                          onChange={(e) => setNewCommissionRate(e.target.value)}
                          className="w-24 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                          step="0.5"
                          min="0"
                          max="100"
                        />
                        <span className="text-slate-600">%</span>
                        <button
                          onClick={() => handleUpdateCommission(selectedVendor.id)}
                          disabled={newCommissionRate === selectedVendor.commission_rate.toString()} // Disable if not changed
                          className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm disabled:bg-green-300"
                        >
                          Update
                        </button>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600 mb-1">Member Since</p>
                      <p className="font-medium text-slate-800">
                        {new Date(selectedVendor.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-800 border-b pb-2">Search Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {(selectedVendor.search_tags || []).map((tag, idx) => (
                    <span key={idx} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                      {tag}
                    </span>
                  ))}
                  {(!selectedVendor.search_tags || selectedVendor.search_tags.length === 0) && (
                    <p className="text-slate-500 italic">No search tags specified</p>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-800 border-b pb-2">Marketing Tags</h3>
                {selectedVendor.marketing_tags && selectedVendor.marketing_tags.length > 0 ? (
                  <div className="space-y-3">
                    {selectedVendor.marketing_tags.map((mt, idx) => (
                      <div key={idx} className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                        <div className="flex items-center gap-2 mb-2">
                          <Tag size={16} className="text-purple-600" />
                          <span className="font-medium text-purple-800">{mt.tag}</span>
                        </div>
                        <div className="text-sm text-slate-600">
                          <span className="font-medium">Schedule:</span> {mt.startTime} - {mt.endTime}
                        </div>
                        <div className="text-sm text-slate-600">
                          <span className="font-medium">Days:</span> {mt.days.join(', ')}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-500 italic">No marketing tags set</p>
                )}
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-800 border-b pb-2">Storefront & Location</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-slate-600 mb-2">Storefront Image</p>
                    {selectedVendor.storefront_image ? (
                      <img src={selectedVendor.storefront_image} alt="Storefront" className="w-full h-32 object-cover rounded-lg" />
                    ) : (
                      <div className="w-full h-32 bg-gray-200 rounded-lg flex items-center justify-center">
                        <ImageIcon size={32} className="text-gray-400" />
                        <span className="ml-2 text-gray-500">No image uploaded</span>
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-slate-600 mb-2">Google Maps Address</p>
                    {selectedVendor.google_maps_address ? (
                      <a 
                        href={selectedVendor.google_maps_address} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-blue-600 hover:text-blue-800 underline break-all"
                      >
                        <Link size={16} />
                        View on Map
                      </a>
                    ) : (
                      <p className="text-slate-500 italic">No Google Maps link provided</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-800 border-b pb-2">Operating Hours</h3>
                {selectedVendor.operating_hours ? (
                  <div className="bg-slate-50 p-4 rounded-lg">
                    <pre className="text-sm text-slate-700 whitespace-pre-wrap">{JSON.stringify(selectedVendor.operating_hours, null, 2)}</pre>
                  </div>
                ) : (
                  <p className="text-slate-500 italic">No operating hours specified</p>
                )}
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-800 border-b pb-2">Payout History</h3>
                {payoutsLoading ? (
                  <div className="flex items-center justify-center h-24">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : vendorPayouts.length > 0 ? (
                  <div className="overflow-x-auto border rounded-lg">
                    <table className="w-full">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-semibold text-slate-700">Date</th>
                          <th className="px-4 py-2 text-left text-xs font-semibold text-slate-700">Amount</th>
                          <th className="px-4 py-2 text-left text-xs font-semibold text-slate-700">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {vendorPayouts.map((payout) => (
                          <tr key={payout.id}>
                            <td className="px-4 py-3 text-sm text-slate-600">
                              {new Date(payout.created_at).toLocaleDateString()}
                            </td>
                            <td className="px-4 py-3 text-sm font-semibold text-green-600">
                              {formatCurrency(parseFloat(payout.amount))}
                            </td>
                            <td className="px-4 py-3 text-sm">
                              <span className={`px-2 py-1 rounded text-xs font-semibold ${
                                payout.status === 'Completed' ? 'bg-green-100 text-green-800' :
                                payout.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {payout.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-slate-500 italic">No payout history found.</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="w-5 h-5 text-green-600" />
                    <span className="text-sm text-slate-600">Total Payouts</span>
                  </div>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(vendorPayouts.reduce((sum, p) => sum + parseFloat(p.amount), 0))}
                  </p>
                </div>
                {/* Placeholder/Hardcoded Stats for illustration */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-5 h-5 text-blue-600" />
                    <span className="text-sm text-slate-600">Avg. Delivery</span>
                  </div>
                  <p className="text-2xl font-bold text-blue-600">35 min</p>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Star className="w-5 h-5 text-orange-600" />
                    <span className="text-sm text-slate-600">Reviews</span>
                  </div>
                  <p className="text-2xl font-bold text-orange-600">128</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* ------------------------------------- */}
    </div>
  );
}

// Export default at the last line
export default VendorManagement;

