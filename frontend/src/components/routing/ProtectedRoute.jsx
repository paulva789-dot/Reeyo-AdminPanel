// src/components/routing/ProtectedRoute.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

// This wrapper component is crucial for applying the DashboardLayout
// only to protected content, after the user is logged in.
import DashboardLayout from '../layout/DashboardLayout';

function Forbidden() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-24 text-center text-gray-500 dark:text-gray-400">
      <ShieldAlert size={40} className="text-red-500" />
      <p className="text-lg font-semibold text-gray-700 dark:text-gray-200">Super Admin access required</p>
      <p className="text-sm">Your account doesn't have permission to view this page.</p>
    </div>
  );
}

// For nested/child routes (e.g. inside a parent's <Outlet>) that already sit
// behind an outer ProtectedRoute and only need the stricter role check.
export function RequireSuperAdmin({ children }) {
  const { isSuperAdmin } = useAuth();
  return isSuperAdmin ? children : <Forbidden />;
}

function ProtectedRoute({ element: Element, requiredRole }) {
  const { isAuthenticated, role } = useAuth();

  if (!isAuthenticated) {
    // Redirect to login page if not authenticated
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && role !== requiredRole) {
    return (
      <DashboardLayout>
        <Forbidden />
      </DashboardLayout>
    );
  }

  // Render the DashboardLayout wrapping the protected element if authenticated
  return <DashboardLayout><Element /></DashboardLayout>;
}

export default ProtectedRoute;