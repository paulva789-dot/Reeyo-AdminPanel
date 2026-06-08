# API Integration Guide - Reeyo Admin Panel

## Current Approach: Mock Data + Simulated API Calls

### Overview
The Reeyo Admin Panel **currently uses mock data with simulated API calls** to demonstrate functionality while backend integration is being developed. This guide explains the current approach and the migration path to real APIs.

## Current Implementation

### 1. Mock Data Pattern

**Location:** Component-level mock functions in each page

All data is currently **simulated locally** with realistic delays:

```javascript
// Example from src/pages/Users/DeliveryGuys/RiderManagement.jsx
const initialRiders = [
  { 
    id: 101, 
    name: 'Eric Njume', 
    phone: '675112233', 
    email: 'eric.njume@reyoo.com', 
    vehicle_type: 'Motorcycle', 
    status: 'Online',
    availability: 'Available',
    total_deliveries: 345,
    rating: 4.8,
    license_verified: true,
    vehicle_verified: true,
    city: 'Douala',
    created_at: '2023-01-01T10:00:00Z' 
  },
  // ... more mock data
];

const simulateFetchRiders = () => {
  return new Promise(resolve => {
    setTimeout(() => resolve(mockRiders), 800); // 800ms delay
  });
};
```

### 2. Mock Functions Pattern

Each page has simulated fetch functions with realistic delays:

```javascript
// src/pages/Users/DeliveryGuys/RiderManagement.jsx
const simulateFetchRiderEarnings = (riderId) => {
  const earningsMap = {
    101: [
      { id: 'e001', delivery_id: 'd-20240501-A1', amount: 1500, created_at: '2024-05-01' },
      { id: 'e002', delivery_id: 'd-20240501-A2', amount: 2000, created_at: '2024-05-01' },
    ],
    // ... more mock earnings
  };
  
  return new Promise(resolve => {
    setTimeout(() => resolve(earningsMap[riderId] || []), 500);
  });
};
```

### 3. Authentication (Mock)

**Location:** `src/context/AuthContext.jsx`

Currently uses **hardcoded demo credentials**:

```javascript
const login = (email, password) => {
  // Mock authentication - demo credentials
  if (email === 'admin@reeyo.com' && password === 'password123') {
    setIsAuthenticated(true);
    setAdminEmail(email);
    return true;
  }
  return false;
};
```

**Demo Credentials:**
- Email: `admin@reeyo.com`
- Password: `password123`

### 4. Supabase Client Setup (Prepared)

**Location:** `src/lib/supabase.js`

Supabase client is initialized but not yet used in authentication:

```javascript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

### 5. State Management

Uses React's **useState hooks** for all state:

```javascript
const [riders, setRiders] = useState([]);
const [loading, setLoading] = useState(true);
const [searchTerm, setSearchTerm] = useState('');
const [statusFilter, setStatusFilter] = useState('All');

const fetchRiders = async () => {
  setLoading(true);
  try {
    const data = await simulateFetchRiders();
    setRiders(data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)) || []);
  } catch (error) {
    console.error('Error fetching riders:', error);
  } finally {
    setLoading(false);
  }
};
```

## Mock Data Files Location

Mock data is embedded in component files. Key locations:

- **Riders:** `src/pages/Users/DeliveryGuys/RiderManagement.jsx` → `simulateFetchRiders()`
- **Vendors:** `src/pages/Vendors/VendorManagement.jsx` → `simulateFetchVendors()`
- **Customers:** `src/pages/Customers/CustomerManagement.jsx` → `simulateFetchCustomers()`
- **Orders:** `src/pages/Orders/OrderManagement.jsx` → `simulateFetchOrders()`
- **Finance:** `src/pages/Finance/FinanceManagement.jsx` → mock calculations
- **Announcements:** `src/pages/Announcements/AnnouncementManagement.jsx` → `simulateFetchAnnouncements()`
- **Analytics:** `src/pages/Analytics/Analytics.jsx` → calculated from mock data

## Backend APIs (Ready for Integration)

Once ready to connect to real APIs, these endpoints are available on **admin-api (port 3005)**:

### Base URL
```
http://localhost:3005/api
```

### Authentication Endpoints
- `POST /auth/login` - Admin login
- `POST /auth/logout` - Admin logout
- `GET /auth/verify` - Verify authentication token

### Rider Management
- `GET /riders` - Fetch all riders
- `GET /riders/:id` - Get rider details
- `PUT /riders/:id` - Update rider information
- `DELETE /riders/:id` - Delete rider account
- `GET /riders/:id/earnings` - Get rider earnings
- `PUT /riders/:id/verify` - Verify rider documentation

### Vendor Management
- `GET /vendors` - Fetch all vendors/restaurants
- `GET /vendors/:id` - Get vendor details
- `PUT /vendors/:id` - Update vendor information
- `DELETE /vendors/:id` - Delete vendor account
- `GET /vendors/:id/performance` - Get vendor metrics
- `PUT /vendors/:id/approve` - Approve vendor

### Customer Management
- `GET /customers` - Fetch all customers
- `GET /customers/:id` - Get customer details
- `PUT /customers/:id` - Update customer information
- `DELETE /customers/:id` - Delete customer account

### Order Management
- `GET /orders` - Fetch all orders
- `GET /orders/:id` - Get order details
- `PUT /orders/:id/status` - Update order status
- `GET /orders/analytics` - Get order analytics

## Migration to Real APIs

### Step 1: Create API Client Service

Create `src/services/api.js`:

```javascript
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3005/api';

export const apiClient = {
  async get(endpoint, token) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    if (!response.ok) throw new Error(`API Error: ${response.statusText}`);
    return response.json();
  },

  async post(endpoint, data, token) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error(`API Error: ${response.statusText}`);
    return response.json();
  },

  async put(endpoint, data, token) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error(`API Error: ${response.statusText}`);
    return response.json();
  },

  async delete(endpoint, token) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    if (!response.ok) throw new Error(`API Error: ${response.statusText}`);
    return response.json();
  }
};
```

### Step 2: Update Authentication Context

Replace mock auth in `src/context/AuthContext.jsx`:

```javascript
// BEFORE (Mock)
const login = (email, password) => {
  if (email === 'admin@reeyo.com' && password === 'password123') {
    setIsAuthenticated(true);
    return true;
  }
  return false;
};

// AFTER (Real API)
import { apiClient } from '../services/api';

const login = async (email, password) => {
  try {
    const response = await apiClient.post('/auth/login', { email, password });
    const token = response.token;
    setToken(token);
    setIsAuthenticated(true);
    setAdminEmail(email);
    localStorage.setItem('authToken', token);
    return true;
  } catch (error) {
    console.error('Login failed:', error);
    return false;
  }
};
```

### Step 3: Replace Mock Functions with API Calls

Example for RiderManagement.jsx:

```javascript
// BEFORE (Mock)
const fetchRiders = async () => {
  setLoading(true);
  try {
    const data = await simulateFetchRiders();
    setRiders(data);
  } finally {
    setLoading(false);
  }
};

// AFTER (Real API)
import { apiClient } from '../../../services/api';

const fetchRiders = async () => {
  setLoading(true);
  try {
    const token = localStorage.getItem('authToken');
    const data = await apiClient.get('/riders', token);
    setRiders(data);
  } finally {
    setLoading(false);
  }
};
```

### Step 4: Update Other CRUD Operations

```javascript
// Handle update
const handleToggleVerification = async (riderId, field, currentValue) => {
  try {
    const token = localStorage.getItem('authToken');
    const updateData = { [field]: !currentValue };
    const result = await apiClient.put(`/riders/${riderId}`, updateData, token);
    
    // Update local state
    setRiders(riders.map(r => r.id === riderId ? result : r));
    if (selectedRider?.id === riderId) {
      setSelectedRider(result);
    }
  } catch (error) {
    console.error('Error updating rider:', error);
  }
};

// Handle delete
const handleDeleteRider = async (riderId) => {
  try {
    const token = localStorage.getItem('authToken');
    await apiClient.delete(`/riders/${riderId}`, token);
    setRiders(riders.filter(r => r.id !== riderId));
  } catch (error) {
    console.error('Error deleting rider:', error);
  }
};
```

### Step 5: Environment Configuration

Update `.env.local`:

```
VITE_API_BASE_URL=http://localhost:3005/api
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_key
```

For production, update `.env.production`:

```
VITE_API_BASE_URL=https://api.reeyo.com/admin
```

## Integration Checklist

- [ ] Create `src/services/api.js` client with GET, POST, PUT, DELETE methods
- [ ] Update `src/context/AuthContext.jsx` with real login via `/auth/login`
- [ ] In `src/pages/Users/DeliveryGuys/RiderManagement.jsx`:
  - [ ] Replace `simulateFetchRiders()` → `apiClient.get('/riders', token)`
  - [ ] Replace rider update logic with `apiClient.put()` calls
  - [ ] Replace rider delete logic with `apiClient.delete()` calls
  - [ ] Replace earnings fetch with `/riders/:id/earnings` endpoint
- [ ] In `src/pages/Vendors/VendorManagement.jsx`:
  - [ ] Replace `simulateFetchVendors()` → `apiClient.get('/vendors', token)`
  - [ ] Replace vendor updates with real API calls
- [ ] In `src/pages/Customers/CustomerManagement.jsx`:
  - [ ] Replace `simulateFetchCustomers()` → `apiClient.get('/customers', token)`
  - [ ] Replace customer updates with real API calls
- [ ] In `src/pages/Orders/OrderManagement.jsx`:
  - [ ] Replace `simulateFetchOrders()` → `apiClient.get('/orders', token)`
  - [ ] Replace order status updates with `/orders/:id/status` endpoint
- [ ] In `src/pages/Finance/FinanceManagement.jsx`:
  - [ ] Connect to real transaction/earnings data from backend
- [ ] In `src/pages/Announcements/AnnouncementManagement.jsx`:
  - [ ] Replace mock announcements with API calls
- [ ] In `src/pages/Analytics/Analytics.jsx`:
  - [ ] Replace calculated analytics with `/orders/analytics` endpoint
- [ ] Add global error handling and retry logic
- [ ] Test all API endpoints before deployment
- [ ] Update environment variables for production
- [ ] Configure CORS settings on backend if needed

## Testing API Calls

To test the admin-api endpoints:

1. **Backend must be running:**
   ```bash
   cd Reeyo-Backend/apps/admin-api
   npm install
   npm run dev
   ```

2. **Test with Postman:**
   - Import: `Reeyo-Backend/apps/admin-api/docs_admin/`
   - Set Base URL to `http://localhost:3005/api`
   - Login first to get token
   - Use token in Authorization header for protected endpoints

3. **Common Test Flow:**
   ```
   1. POST /auth/login (get token)
   2. GET /riders (with token)
   3. PUT /riders/:id (update with token)
   4. DELETE /riders/:id (delete with token)
   ```

## Troubleshooting

### "Cannot reach backend" error
- Check if admin-api server is running on port 3005
- Verify `VITE_API_BASE_URL` environment variable
- Check CORS configuration if API is on different domain

### "401 Unauthorized" error
- Ensure token is being sent in Authorization header
- Check if token has expired
- Re-login to get fresh token

### "Network error" during fetch
- Verify backend is accessible at configured URL
- Check browser console for CORS errors
- Ensure request headers match API expectations

## Related Documentation
- [Admin API Documentation](../../Reeyo-Backend/apps/admin-api/README.md)
- [Backend API Testing Guide](../../Reeyo-Backend/docs/API_test.md)
- [Security Guide](./SECURITY_GUIDE.md)
