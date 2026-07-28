// src/App.jsx (FINAL FIXED VERSION)

import React, { Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

// New Imports
import { useAuth } from "./context/AuthContext";
import ProtectedRoute, { RequireSuperAdmin } from "./components/routing/ProtectedRoute";

// --- Lazy-loaded page components (Protected & Public) ---
const DashboardOverview = React.lazy(
  () => import("./pages/DashboardOverview.jsx"),
);
const CustomerManagement = React.lazy(
  () => import("./pages/Users/Customers/CustomerManagement.jsx"),
);
const VendorManagement = React.lazy(
  () => import("./pages/Users/Vendors/VendorManagement.jsx"),
);
const MenuApprovals = React.lazy(
  () => import("./pages/Users/Vendors/menuApprove/MenuApprovals.jsx"),
);
const RiderManagement = React.lazy(
  () => import("./pages/Users/DeliveryGuys/RiderManagement.jsx"),
);
const OrderManagement = React.lazy(
  () => import("./pages/Orders/OrderManagement.jsx"),
);
const LiveTracker = React.lazy(
  () => import("./pages/Logistics/LiveTracker/LiveTracker.jsx"),
);
const DeliveryZones = React.lazy(
  () => import("./pages/Logistics/DeliveryZones/DeliveryZones.jsx"),
);
const FinancePage = React.lazy(() => import("./pages/Finance/FinancePage"));
const AnnouncementsPage = React.lazy(
  () => import("./pages/Announcements/AnnouncementsPage.jsx"),
);
const DisputesPage = React.lazy(
  () => import("./pages/Disputes/DisputesPage.jsx"),
);
const EngagementPage = React.lazy(
  () => import("./pages/Engagement/EngagementPage.jsx"),
);
const AnalyticsPage = React.lazy(
  () => import("./pages/Analytics/AnalyticsPage.jsx"),
);

//chat feature
const ChatPage = React.lazy(() => import("./pages/Chat/ChatPaage.jsx"));

// Marketing
const MarketingPage = React.lazy(() => import('./pages/Marketing/MarketingPage')); 

// Auth Pages
const LoginPage = React.lazy(() => import("./pages/Auth/LoginPage.jsx"));
const ForgetPasswordPage = React.lazy(
  () => import("./pages/Auth/ForgotPasswordPage.jsx"),
);

// CMS
const CMSCustomersPage = React.lazy(
  () => import("./pages/CMS/CustomersPage.jsx"),
);

// Settings Page Imports (Required for Nested Routes)
const SettingsPage = React.lazy(
  () => import("./pages/Settings/SettingsPage.jsx"),
);
const UserAccess = React.lazy(
  () => import("./pages/Settings/components/UserAccess.jsx"),
);
const OperationalParameters = React.lazy(
  () => import("./pages/Settings/components/OperationalParameters.jsx"),
);
const Integrations = React.lazy(
  () => import("./pages/Settings/components/Integrations.jsx"),
);
const PlatformServices = React.lazy(
  () => import("./pages/Settings/components/PlatformServices.jsx"),
);
const FeatureFlags = React.lazy(
  () => import("./pages/Settings/components/FeatureFlags.jsx"),
);
const ApiKeys = React.lazy(
  () => import("./pages/Settings/components/ApiKeys.jsx"),
);
const AdminUsers = React.lazy(
  () => import("./pages/Settings/components/AdminUsers.jsx"),
);
const DataBackup = React.lazy(
  () => import("./pages/Settings/components/DataBackup.jsx"),
);

// Support System Import (NEW)
// const LiveQueue = React.lazy(() => import('./pages/Support/LiveQueue.jsx'));

// --- Loading Fallback Component ---
const LoadingFallback = () => (
  <div className="flex justify-center items-center h-screen w-full bg-gray-50">
       {" "}
    <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600"></div>
        <p className="ml-4 text-lg text-gray-700">Loading Reeyo's Admin...</p>
     {" "}
  </div>
);

// --- Main App Component ---

function App() {
  // Access isAuthenticated and the assumed isLoading state from useAuth
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  // FIX: Handle Authentication Loading on Refresh
  if (isAuthLoading) {
    return <LoadingFallback />;
  }

  return (
    <Suspense fallback={<LoadingFallback />}>
           {" "}
      <Routes>
                       {" "}
        {/* ======================= PUBLIC ROUTES ======================= */}   
                   {" "}
        <Route
          path="/login"
          element={
            isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />
          }
        />
               {" "}
        <Route
          path="/forgot-password"
          element={
            isAuthenticated ? (
              <Navigate to="/" replace />
            ) : (
              <ForgetPasswordPage />
            )
          }
        />
               {" "}
        {/* ======================= PROTECTED ROUTES (Requires Layout) ======================= */}
                {/* Main Dashboard Route */}       {" "}
        <Route
          path="/"
          element={<ProtectedRoute element={DashboardOverview} />}
        />
        {/* SETTINGS NESTED ROUTES (FIXED: The correct structure for tabs) */}
        <Route
          path="/settings"
          element={<ProtectedRoute element={SettingsPage} />}
        >
          {/* Index route redirects to the default tab (User & Access) */}
          <Route index element={<Navigate to="access" replace />} />
          <Route path="access" element={<UserAccess />} />
          <Route path="operational" element={<OperationalParameters />} />
          <Route path="integrations" element={<Integrations />} />
          <Route path="services" element={<PlatformServices />} />
          <Route path="feature-flags" element={<FeatureFlags />} />
          <Route
            path="admin-users"
            element={
              <RequireSuperAdmin>
                <AdminUsers />
              </RequireSuperAdmin>
            }
          />
          <Route
            path="api-keys"
            element={
              <RequireSuperAdmin>
                <ApiKeys />
              </RequireSuperAdmin>
            }
          />
          <Route path="data" element={<DataBackup />} />
        </Route>
                {/* User Management Sub-Routes */}       {" "}
        <Route
          path="/users/customers"
          element={<ProtectedRoute element={CustomerManagement} />}
        />
               {" "}
        <Route
          path="/users/delivery-guys"
          element={<ProtectedRoute element={RiderManagement} />}
        />
               {" "}
        <Route
          path="/users/vendors"
          element={<ProtectedRoute element={VendorManagement} />}
        />
                        {/* Functional Pages */}       {" "}
        <Route
          path="/orders"
          element={<ProtectedRoute element={OrderManagement} />}
        />
               {" "}
        <Route
          path="/users/vendors/approvals"
          element={<ProtectedRoute element={MenuApprovals} />}
        />
                        {/* Logistics Routes */}       {" "}
        <Route
          path="/logistics/live"
          element={<ProtectedRoute element={LiveTracker} />}
        />
               {" "}
        <Route
          path="/logistics/zones"
          element={<ProtectedRoute element={DeliveryZones} />}
        />
                {/* Finance & Announcements (Top-Level Routes) */}       {" "}
        <Route
          path="/finance"
          element={<ProtectedRoute element={FinancePage} />}
        />
               {" "}
        <Route
          path="/announcements"
          element={<ProtectedRoute element={AnnouncementsPage} />}
        />
        <Route
          path="/disputes"
          element={<ProtectedRoute element={DisputesPage} />}
        />
        <Route
          path="/engagement"
          element={<ProtectedRoute element={EngagementPage} />}
        />
        <Route
          path="/analytics"
          element={<ProtectedRoute element={AnalyticsPage} />}
        />
        <Route
          path="/marketing"
          element={<ProtectedRoute element={MarketingPage} />}
        />
        {/* The chat feature route */}
        <Route path="/chat" element={<ProtectedRoute element={ChatPage} />} />
        {/* Support System Route (NEW)
        <Route path="/support/queue" element={<ProtectedRoute element={LiveQueue} />} /> */}
                {/* CMS Route */}       {" "}
        <Route
          path="/cms/customers"
          element={<ProtectedRoute element={CMSCustomersPage} />}
        />
               {" "}
        {/* Fallback route: If a protected path is not found, redirect to dashboard. If not authenticated, go to login. */}
               {" "}
        <Route
          path="*"
          element={
            isAuthenticated ? (
              <Navigate to="/" replace />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
             {" "}
      </Routes>
         {" "}
    </Suspense>
  );
}

export default App;
