import React from 'react';
import { Link, NavLink, Outlet, Navigate } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderTree,
  Palette,
  Package,
  FileText,
  LogOut,
  ExternalLink,
  Sun,
  Moon,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

const navItems = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/categories', label: 'Categories', icon: FolderTree },
  { to: '/admin/finishes', label: 'Finishes', icon: Palette },
  { to: '/admin/items', label: 'Items & Tables', icon: Package },
  { to: '/admin/groups', label: 'PDF Page Groups', icon: FileText },
];

export default function AdminLayout() {
  const { isAuthenticated, loading, admin, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-aastra-gray">
        Verifying admin session...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  return (
    <div className="min-h-screen flex bg-aastra-pearl dark:bg-[#111111]">
      {/* Sidebar */}
      <aside className="w-64 bg-aastra-black text-neutral-300 flex flex-col shrink-0 border-r border-neutral-800">
        <div className="h-20 px-6 flex items-center border-b border-neutral-800">
          <Link to="/admin" className="flex flex-col">
            <img src="/brand/logo-gold.gif" alt="AASTRA" className="h-6 w-auto object-contain" />
            <span className="text-[10px] tracking-[0.2em] uppercase text-neutral-500 mt-1">
              Admin Portal
            </span>
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 text-xs font-medium tracking-wide rounded-sm transition ${
                  isActive
                    ? 'bg-aastra-gold text-black font-semibold'
                    : 'text-neutral-300 hover:bg-neutral-800 hover:text-white'
                }`
              }
            >
              <Icon className="w-4 h-4" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-neutral-800 space-y-2 text-xs">
          <div className="px-2 py-1 text-neutral-400 truncate">{admin?.email}</div>
          <Link
            to="/"
            className="flex items-center gap-2 px-3 py-2 text-neutral-300 hover:text-aastra-gold transition"
          >
            <ExternalLink className="w-3.5 h-3.5" /> View Public Website
          </Link>
          <button
            type="button"
            onClick={logout}
            className="w-full flex items-center gap-2 px-3 py-2 text-red-400 hover:bg-red-950/40 rounded-sm transition"
          >
            <LogOut className="w-3.5 h-3.5" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white dark:bg-[#171717] border-b border-aastra-silver dark:border-neutral-800 px-6 flex items-center justify-between">
          <div className="text-xs uppercase tracking-[0.18em] text-aastra-slate dark:text-neutral-400 font-medium">
            AASTRA Architectural Hardware — Management
          </div>
          <button
            type="button"
            onClick={toggleTheme}
            className="p-2 border border-aastra-silver dark:border-neutral-700 rounded-sm text-aastra-slate dark:text-aastra-gold"
            title="Toggle Light/Dark Theme"
          >
            {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          </button>
        </header>

        <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
