// src/components/layout/Sidebar.jsx
import React, { useState, useCallback, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Users,
  Utensils,
  Bike,
  Settings,
  FileText,
  DollarSign,
  Megaphone,
  ChevronDown,
  MessageSquare,
  X,
  Sparkles,
  Shield, // ADDED Shield icon for CMS
} from "lucide-react";

// Navigation Data - Abbreviated for better UX
const sidebarNav = [
  { title: "Dashboard", icon: LayoutDashboard, path: "/" },
  { title: "Orders", icon: FileText, path: "/orders" },
  {
    title: "Users",
    icon: Users,
    path: "/users",
    children: [
      { title: "Customers", path: "/users/customers" },
      { title: "Riders", path: "/users/delivery-guys" },
    ],
  },
  // NEW ENTRY FOR THE ENHANCED CMS PAGE
  { title: "CMS (Customers)", icon: Shield, path: "/cms/customers" },
  {
    title: "Vendors",
    icon: Utensils,
    path: "/vendors",
    children: [
      { title: "All Vendors", path: "/users/vendors" },
      { title: "Menu Approvals", path: "/users/vendors/approvals" },
    ],
  },
  {
    title: "Logistics",
    icon: Bike,
    path: "/logistics",
    children: [
      { title: "Live Tracker", path: "/logistics/live" },
      { title: "Delivery Zones", path: "/logistics/zones" },
    ],
  },

  // chat feature side bar navigation route
  { title: "Chat", icon: MessageSquare, path: "/chat" },
  { title: "Finance", icon: DollarSign, path: "/finance" },
  { title: "Announcements", icon: Megaphone, path: "/announcements" },
  { title: "Settings", icon: Settings, path: "/settings" },
];

// Enhanced NavItem Component with professional animations
function NavItem({ item, onNavigate }) {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const hasChildren = item.children && item.children.length > 0;

  const linkBaseClasses = `w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 group relative`;
  const activeClasses = `bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/30`;
  const inactiveClasses = `text-gray-300 hover:bg-white/10 hover:text-white`;

  // Check if any child is active
  const isParentActive =
    hasChildren &&
    item.children.some(
      (child) =>
        location.pathname === child.path ||
        location.pathname.startsWith(child.path + "/"),
    );

  const toggleDropdown = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  // Auto-expand parent when child is active
  useEffect(() => {
    if (isParentActive && !isOpen) {
      setIsOpen(true);
    }
  }, [isParentActive, isOpen]);

  if (hasChildren) {
    return (
      <div className="space-y-1">
        <motion.button
          onClick={toggleDropdown}
          className={`${linkBaseClasses} justify-between ${isParentActive ? activeClasses : inactiveClasses}`}
          whileHover={{ x: 4 }}
          whileTap={{ scale: 0.98 }}
        >
          <span className="flex items-center gap-3">
            <item.icon size={20} strokeWidth={2.5} />
            <span className="font-medium text-sm">{item.title}</span>
          </span>
          <motion.div
            initial={false}
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <ChevronDown size={16} />
          </motion.div>
        </motion.button>

        <AnimatePresence initial={false}>
          {isOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{
                height: "auto",
                opacity: 1,
                transition: {
                  height: { duration: 0.3, ease: "easeInOut" },
                  opacity: { duration: 0.2, delay: 0.1 },
                },
              }}
              exit={{
                height: 0,
                opacity: 0,
                transition: {
                  height: { duration: 0.3, ease: "easeInOut" },
                  opacity: { duration: 0.15 },
                },
              }}
              className="overflow-hidden"
            >
              <div className="pl-4 pr-2 py-1 space-y-0.5 border-l-2 border-orange-500/30 ml-4">
                {item.children.map((child, idx) => (
                  <motion.div
                    key={child.path}
                    initial={{ x: -10, opacity: 0 }}
                    animate={{
                      x: 0,
                      opacity: 1,
                      transition: { delay: idx * 0.05 },
                    }}
                    exit={{ x: -10, opacity: 0 }}
                  >
                    <NavLink
                      to={child.path}
                      onClick={onNavigate}
                      className={({ isActive }) =>
                        `flex items-center py-2 px-3 text-sm rounded-lg transition-all duration-200 ${
                          isActive
                            ? "bg-orange-500/20 text-orange-400 font-semibold border-l-2 border-orange-500"
                            : "text-gray-400 hover:bg-white/5 hover:text-gray-200"
                        }`
                      }
                    >
                      <span className="truncate">{child.title}</span>
                    </NavLink>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <NavLink
      to={item.path}
      onClick={onNavigate}
      className={({ isActive }) =>
        `${linkBaseClasses} ${isActive ? activeClasses : inactiveClasses}`
      }
      end={item.path === "/"}
    >
      {({ isActive }) => (
        <>
          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
            <item.icon size={20} strokeWidth={2.5} />
          </motion.div>
          <span className="font-medium text-sm truncate">{item.title}</span>
          {isActive && (
            <motion.span
              layoutId="activeIndicator"
              className="ml-auto w-1.5 h-1.5 bg-white rounded-full"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            />
          )}
        </>
      )}
    </NavLink>
  );
}

// Main Sidebar Component
function Sidebar({ isMobileOpen, setIsMobileOpen }) {
  const handleNavigation = useCallback(() => {
    // Auto-close mobile menu on navigation
    if (window.innerWidth < 1024) {
      setIsMobileOpen(false);
    }
  }, [setIsMobileOpen]);

  return (
    <>
      {/* Mobile Backdrop Overlay with smooth fade */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 lg:hidden"
            onClick={() => setIsMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar Content */}
      <aside
        className={`
                    fixed inset-y-0 left-0 
                    w-64 z-40 
                    bg-gradient-to-b from-[#004B6E] to-[#003850]
                    text-white h-full 
                    flex flex-col
                    shadow-2xl
                    transform transition-transform duration-300 ease-in-out
                    ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
                    lg:translate-x-0
                `}
      >
        {/* Logo/Header Section */}
        <div className="p-5 flex items-center justify-between flex-shrink-0 border-b border-white/10">
          <motion.h1
            className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent"
            whileHover={{ scale: 1.05 }}
          >
            Reeyo
          </motion.h1>
          <motion.button
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
            className="lg:hidden p-1.5 rounded-lg hover:bg-white/10 transition-colors"
            onClick={() => setIsMobileOpen(false)}
          >
            <X className="w-5 h-5" />
          </motion.button>
        </div>

        {/* Navigation Section - Scrollable */}
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
          {sidebarNav.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <NavItem item={item} onNavigate={handleNavigation} />
            </motion.div>
          ))}
        </nav>

        {/* Compact Footer Section */}
        <div className="p-3 border-t border-white/10 flex-shrink-0 space-y-2">
          {/* Version Info - Minimized */}
          <div className="text-[10px] text-gray-400 px-2">
            <p className="font-semibold text-gray-300">Reeyo Delivery</p>
            <p>Admin v1.0 • {new Date().getFullYear()}</p>
          </div>

          {/* Compact Promo Card with Gradient Animation */}
          <motion.div
            initial={{ scale: 1 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg cursor-pointer relative overflow-hidden group"
          >
            {/* Animated shimmer effect */}
            <motion.div
              className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors"
              animate={{
                background: [
                  "radial-gradient(circle at 0% 0%, rgba(255,255,255,0.1) 0%, transparent 50%)",
                  "radial-gradient(circle at 100% 100%, rgba(255,255,255,0.1) 0%, transparent 50%)",
                  "radial-gradient(circle at 0% 0%, rgba(255,255,255,0.1) 0%, transparent 50%)",
                ],
              }}
              transition={{ duration: 3, repeat: Infinity }}
            />

            <div className="relative">
              <div className="flex items-start gap-2">
                <Sparkles
                  size={16}
                  className="text-yellow-300 flex-shrink-0 mt-0.5"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-white leading-tight">
                    Boost Sales
                  </p>
                  <p className="text-[10px] text-blue-100 mt-0.5 leading-snug">
                    Try AI logistics tools
                  </p>
                </div>
              </div>
              <button className="mt-2 w-full bg-white text-blue-600 text-[10px] font-bold px-3 py-1.5 rounded-md hover:bg-gray-100 transition-all hover:shadow-md">
                Explore →
              </button>
            </div>
          </motion.div>
        </div>
      </aside>

      {/* Custom scrollbar styles */}
      <style>{`
                .scrollbar-thin::-webkit-scrollbar {
                    width: 4px;
                }
                .scrollbar-thin::-webkit-scrollbar-track {
                    background: transparent;
                }
                .scrollbar-thin::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.2);
                    border-radius: 2px;
                }
                .scrollbar-thin::-webkit-scrollbar-thumb:hover {
                    background: rgba(255, 255, 255, 0.3);
                }
            `}</style>
    </>
  );
}

export default Sidebar;
