// src/components/layout/Header.jsx
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Bell, 
  User, 
  Menu, 
  Settings,
  LogOut,
  ChevronDown,
  MessageSquare,
  HelpCircle,
  X
} from 'lucide-react';
import ThemeToggle from '../ThemeToggle.jsx'; // <-- Ajout de l'import de ton bouton

function Header({ toggleSidebar }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const notifRef = useRef(null);
  const profileRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const notifications = [
    { id: 1, title: 'New Order #3847', message: 'Customer placed order', time: '2m ago', unread: true },
    { id: 2, title: 'Vendor Request', message: 'New vendor signup pending', time: '15m ago', unread: true },
    { id: 3, title: 'Payment Received', message: 'Order #3840 paid', time: '1h ago', unread: false },
  ];

  const unreadCount = notifications.filter(n => n.unread).length;

  return (
    <header 
      className={`
        sticky top-0 
        z-40
        bg-white/95 dark:bg-slate-900/95 backdrop-blur-md /* Adaptatif */
        border-b border-gray-200 dark:border-slate-800 /* Adaptatif */
        text-slate-900 dark:text-gray-100
        shadow-md
        transition-all duration-300
      `}
    >
      <div className="px-4 lg:px-6 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Left Section */}
          <div className="flex items-center gap-4 flex-1">
            {/* Mobile Menu Button */}
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleSidebar}
              className="lg:hidden p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              <Menu className="w-6 h-6 text-slate-900 dark:text-gray-300" />
            </motion.button>
            <div className="hidden sm:block">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Welcome back, Admin</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Manage your dashboard with confidence</p>
            </div>

            {/* Enhanced Search Bar */}
            <motion.div 
              className="relative flex-1 max-w-md"
              animate={{ 
                scale: searchFocused ? 1.02 : 1,
              }}
              transition={{ duration: 0.2 }}
            >
              <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${
                searchFocused ? 'text-blue-500' : 'text-slate-900 dark:text-gray-500'
              }`} />
              <input
                type="text"
                placeholder="Search orders, users, vendors..."
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                className={`
                  w-full pl-10 pr-4 py-2.5 
                  bg-white dark:bg-slate-800 border-2 rounded-xl
                  focus:outline-none text-sm
                  text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500
                  transition-all duration-200
                  ${searchFocused 
                    ? 'border-blue-500 bg-white dark:bg-slate-900 shadow-md' 
                    : 'border-transparent hover:bg-slate-100 dark:hover:bg-slate-700'
                  }
                `}
              />
            </motion.div>
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-2">
            
            {/* AJOUT ICI : Ton bouton d'interrupteur Dark/Light mode */}
            <div className="mr-2">
              <ThemeToggle />
            </div>

            {/* Help Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="hidden md:flex p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              title="Help Center"
            >
              <HelpCircle className="w-5 h-5 text-slate-900 dark:text-gray-400" />
            </motion.button>

            {/* Messages Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="hidden md:flex p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors relative"
              title="Messages"
            >
              <MessageSquare className="w-5 h-5 text-slate-900 dark:text-gray-400" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-green-500 rounded-full border-2 border-white dark:border-slate-900" />
            </motion.button>

            {/* Notifications Dropdown */}
            <div className="relative" ref={notifRef}>
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                title="Notifications"
              >
                <Bell className="w-5 h-5 text-slate-900 dark:text-gray-400" />
                {unreadCount > 0 && (
                  <motion.span 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-[10px] font-bold text-white border-2 border-white dark:border-slate-900"
                  >
                    {unreadCount}
                  </motion.span>
                )}
              </motion.button>

              <AnimatePresence>
                {showNotifications && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-gray-200 dark:border-slate-800 overflow-hidden z-50"
                  >
                    <div className="p-4 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between">
                      <h3 className="font-semibold text-gray-900 dark:text-white">Notifications</h3>
                      <button 
                        onClick={() => setShowNotifications(false)}
                        className="p-1 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                      >
                        <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                      </button>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {notifications.map((notif) => (
                        <motion.div
                          key={notif.id}
                          whileHover={{ backgroundColor: '#f9fafb' }}
                          className="p-4 border-b border-gray-50 dark:border-slate-800/50 cursor-pointer transition-colors"
                        >
                          <div className="flex items-start gap-3">
                            <div className={`w-2 h-2 mt-2 rounded-full flex-shrink-0 ${
                              notif.unread ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-700'
                            }`} />
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-sm text-gray-900 dark:text-white">{notif.title}</p>
                              <p className="text-xs text-gray-600 dark:text-gray-300 mt-0.5">{notif.message}</p>
                              <p className="text-xs text-gray-400 mt-1">{notif.time}</p>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                    <div className="p-3 text-center border-t border-gray-100 dark:border-slate-800">
                      <button className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400">
                        View All Notifications
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* User Profile Dropdown */}
            <div className="relative" ref={profileRef}>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center gap-2 pl-3 ml-2 border-l border-gray-200 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-r-lg pr-2 py-1 transition-colors"
              >
                <div className="w-9 h-9 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center ring-2 ring-orange-200 dark:ring-orange-900/50">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">Super Admin</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">admin@reeyo.com</p>
                </div>
                <ChevronDown className="w-4 h-4 text-gray-500 transition-transform" />
              </motion.button>

              <AnimatePresence>
                {showProfileMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-gray-200 dark:border-slate-800 overflow-hidden z-50"
                  >
                    <div className="p-4 border-b border-gray-100 dark:border-slate-800 bg-gradient-to-br from-orange-50 to-blue-50 dark:from-slate-800 dark:to-slate-850">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center ring-2 ring-white dark:ring-slate-700">
                          <User className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white">Super Admin</p>
                          <p className="text-xs text-gray-600 dark:text-gray-300">admin@reeyo.com</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-2">
                      <motion.button
                        whileHover={{ backgroundColor: '#f3f4f6' }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-sm text-gray-700 dark:text-gray-300 dark:hover:bg-slate-800 transition-colors"
                      >
                        <User className="w-4 h-4" />
                        <span>My Profile</span>
                      </motion.button>
                      <motion.button
                        whileHover={{ backgroundColor: '#f3f4f6' }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-sm text-gray-700 dark:text-gray-300 dark:hover:bg-slate-800 transition-colors"
                      >
                        <Settings className="w-4 h-4" />
                        <span>Account Settings</span>
                      </motion.button>
                    </div>

                    <div className="p-2 border-t border-gray-100 dark:border-slate-800">
                      <motion.button
                        whileHover={{ backgroundColor: '#fef2f2' }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-sm text-red-600 dark:text-red-400 font-medium dark:hover:bg-red-950/30 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out</span>
                      </motion.button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats Bar */}
      <AnimatePresence>
        {isScrolled && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-900/50 px-6 py-2 hidden lg:block overflow-hidden"
          >
            <div className="flex items-center gap-6 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-gray-600 dark:text-gray-400">System: <span className="font-semibold text-green-600 dark:text-green-400">Online</span></span>
              </div>
              <div className="text-gray-600 dark:text-gray-400">
                Active Orders: <span className="font-semibold text-gray-900 dark:text-white">24</span>
              </div>
              <div className="text-gray-600 dark:text-gray-400">
                Online Riders: <span className="font-semibold text-gray-900 dark:text-white">18</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

export default Header;