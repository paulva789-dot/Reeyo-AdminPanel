// src/pages/Auth/LoginPage.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, LogIn } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(email, password);
    setLoading(false);

    if (result.success) {
      navigate('/', { replace: true });
    } else if (result.code === 'ACCOUNT_SUSPENDED') {
      setError('This admin account has been suspended. Contact a super admin.');
    } else if (result.code === 'AUTH_INVALID_CREDENTIALS') {
      setError('Incorrect email or password.');
    } else {
      setError(result.message || 'Sign in failed. Please try again.');
    }
  };

  const inputVariants = {
    rest: { scale: 1, borderColor: '#e5e7eb' },
    focus: { scale: 1.01, borderColor: '#3b82f6', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">

      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 100, duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* App Logo/Branding */}
        <div className="text-center mb-8">
          <img src="/logo.svg" alt="Reeyo" className="w-16 h-16 mx-auto mb-3" />
          <h1 className="text-5xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600">
            Reeyo
          </h1>
          <p className="mt-2 text-gray-500 text-lg font-medium">Sign in to your Dashboard</p>
        </div>

        {/* Login Form Card */}
        <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-200/50">

          <form onSubmit={handleSubmit} className="space-y-6" noValidate>

            {/* Email Input */}
            <motion.div
              initial="rest"
              whileFocus="focus"
              variants={inputVariants}
              className="relative rounded-xl border-2 border-gray-200 transition-all duration-200"
            >
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="email"
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="username"
                required
                className="w-full pl-12 pr-4 py-3 bg-white text-gray-800 rounded-xl focus:outline-none min-h-[44px]"
              />
            </motion.div>

            {/* Password Input */}
            <motion.div
              initial="rest"
              whileFocus="focus"
              variants={inputVariants}
              className="relative rounded-xl border-2 border-gray-200 transition-all duration-200"
            >
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
                className="w-full pl-12 pr-4 py-3 bg-white text-gray-800 rounded-xl focus:outline-none min-h-[44px]"
              />
            </motion.div>

            {/* Error Message */}
            <AnimatePresence>
                {error && (
                    <motion.p
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="text-sm text-red-600 font-medium bg-red-50 p-3 rounded-lg border border-red-200"
                        role="alert"
                    >
                        {error}
                    </motion.p>
                )}
            </AnimatePresence>

            {/* Login Button */}
            <motion.button
              type="submit"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={loading}
              className={`
                w-full flex items-center justify-center gap-2 py-3 rounded-xl min-h-[44px]
                text-white font-semibold text-lg transition-all duration-300
                ${loading
                  ? 'bg-blue-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/50'
                }
              `}
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Authenticating...
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  Sign In
                </>
              )}
            </motion.button>
          </form>

          {/* Forgot Password Link */}
          <div className="mt-6 text-center">
            <a href="/forgot-password" className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors">
              Forgot Password?
            </a>
          </div>
        </div>

      </motion.div>
    </div>
  );
}

export default LoginPage;
