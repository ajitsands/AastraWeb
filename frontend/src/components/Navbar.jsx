import React, { useEffect, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Sun, Moon, Search, Menu, X, ChevronDown, FileText } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { api } from '../api/client';

export default function Navbar() {
  const { theme, toggleTheme } = useTheme();
  const [categories, setCategories] = useState([]);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [catOpen, setCatOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    api.getCategories().then(setCategories).catch(() => {});
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/categories?q=${encodeURIComponent(query.trim())}`);
      setSearchOpen(false);
      setQuery('');
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-[#141414]/95 backdrop-blur border-b border-aastra-silver/80 dark:border-neutral-800 transition-colors">
      {/* Classic Top Announcement Bar */}
      <div className="bg-aastra-black text-neutral-300 text-[10px] sm:text-[11px] tracking-widest uppercase">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 min-h-[32px] py-1.5 flex items-center justify-center sm:justify-between gap-4">
          <div className="hidden sm:flex items-center gap-4 whitespace-nowrap">
            <span className="text-aastra-gold font-medium">AASTRA Architectural Hardware</span>
            <span className="hidden md:inline text-neutral-500">|</span>
            <a href="tel:+447435620033" className="hidden md:inline hover:text-aastra-gold transition">
              +44 7435 620033
            </a>
            <span className="hidden lg:inline text-neutral-500">|</span>
            <a href="mailto:business@aastra.uk" className="hidden lg:inline normal-case tracking-normal hover:text-aastra-gold transition">
              business@aastra.uk
            </a>
          </div>
          <div className="flex items-center gap-5 whitespace-nowrap">
            <Link to="/catalogue" className="hover:text-aastra-gold transition flex items-center gap-1">
              <FileText className="w-3 h-3 shrink-0" /> PDF Brochures
            </Link>
            <span className="sm:hidden text-neutral-600">|</span>
            <Link to="/contact" className="hover:text-aastra-gold transition">
              Trade Enquiries
            </Link>
          </div>
        </div>
      </div>

      {/* Main Classic Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-20 flex items-center justify-between gap-4">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-3 group shrink-0">
            <img
              src={theme === 'dark' ? '/brand/logo-gold.gif' : '/brand/logo-black.gif'}
              alt="AASTRA Architectural Hardware"
              className="h-8 sm:h-9 w-auto object-contain transition-opacity group-hover:opacity-85"
            />
          </Link>

          {/* Desktop Links */}
          <nav className="hidden lg:flex items-center gap-8 text-xs font-medium tracking-[0.14em] uppercase">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `py-2 border-b-2 transition ${
                  isActive
                    ? 'border-aastra-gold text-aastra-black dark:text-aastra-gold'
                    : 'border-transparent text-aastra-slate dark:text-neutral-300 hover:text-aastra-black dark:hover:text-white'
                }`
              }
            >
              Home
            </NavLink>

            {/* Collections Dropdown */}
            <div
              className="relative"
              onMouseEnter={() => setCatOpen(true)}
              onMouseLeave={() => setCatOpen(false)}
            >
              <Link
                to="/categories"
                className="py-2 flex items-center gap-1 text-aastra-slate dark:text-neutral-300 hover:text-aastra-black dark:hover:text-white transition"
              >
                Hardware Range <ChevronDown className="w-3.5 h-3.5" />
              </Link>

              {catOpen && categories.length > 0 && (
                <div className="absolute left-0 top-full pt-2 w-72 z-50">
                  <div className="bg-white dark:bg-[#191919] border border-aastra-silver dark:border-neutral-800 shadow-elevated py-2">
                    <div className="px-4 py-1.5 text-[10px] tracking-[0.18em] text-aastra-gold font-semibold border-b border-aastra-pearl dark:border-neutral-800">
                      ARCHITECTURAL CHAPTERS
                    </div>
                    {categories.map((cat) => (
                      <Link
                        key={cat.id}
                        to={`/category/${cat.slug}`}
                        onClick={() => setCatOpen(false)}
                        className="flex items-center justify-between px-4 py-2.5 text-xs tracking-normal normal-case text-aastra-slate dark:text-neutral-200 hover:bg-aastra-pearl dark:hover:bg-neutral-800 hover:text-aastra-black dark:hover:text-aastra-gold transition"
                      >
                        <span className="font-medium">{cat.name}</span>
                        <span className="text-[10px] font-mono text-aastra-gray">
                          Ch.{cat.chapter_number}
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <NavLink
              to="/finishes"
              className={({ isActive }) =>
                `py-2 border-b-2 transition ${
                  isActive
                    ? 'border-aastra-gold text-aastra-black dark:text-aastra-gold'
                    : 'border-transparent text-aastra-slate dark:text-neutral-300 hover:text-aastra-black dark:hover:text-white'
                }`
              }
            >
              Finishes
            </NavLink>

            <NavLink
              to="/catalogue"
              className={({ isActive }) =>
                `py-2 border-b-2 transition ${
                  isActive
                    ? 'border-aastra-gold text-aastra-black dark:text-aastra-gold'
                    : 'border-transparent text-aastra-slate dark:text-neutral-300 hover:text-aastra-black dark:hover:text-white'
                }`
              }
            >
              PDF Catalogue
            </NavLink>

            <NavLink
              to="/about"
              className={({ isActive }) =>
                `py-2 border-b-2 transition ${
                  isActive
                    ? 'border-aastra-gold text-aastra-black dark:text-aastra-gold'
                    : 'border-transparent text-aastra-slate dark:text-neutral-300 hover:text-aastra-black dark:hover:text-white'
                }`
              }
            >
              About
            </NavLink>

            <NavLink
              to="/contact"
              className={({ isActive }) =>
                `py-2 border-b-2 transition ${
                  isActive
                    ? 'border-aastra-gold text-aastra-black dark:text-aastra-gold'
                    : 'border-transparent text-aastra-slate dark:text-neutral-300 hover:text-aastra-black dark:hover:text-white'
                }`
              }
            >
              Enquire
            </NavLink>
          </nav>

          {/* Right Utility Controls */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSearchOpen((v) => !v)}
              className="p-2.5 text-aastra-slate dark:text-neutral-300 hover:text-aastra-black dark:hover:text-aastra-gold transition"
              aria-label="Search products"
            >
              <Search className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={toggleTheme}
              className="p-2.5 border border-aastra-silver/80 dark:border-neutral-700 rounded-sm text-aastra-slate dark:text-aastra-gold hover:border-aastra-gold transition"
              title={theme === 'light' ? 'Switch to Dark Theme' : 'Switch to Light Theme'}
              aria-label="Toggle color theme"
            >
              {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>

            <button
              type="button"
              onClick={() => setMobileOpen((v) => !v)}
              className="lg:hidden p-2.5 text-aastra-black dark:text-white"
              aria-label="Toggle navigation"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Expandable Search Bar */}
        {searchOpen && (
          <form onSubmit={handleSearch} className="pb-4 border-t border-aastra-pearl dark:border-neutral-800 pt-3">
            <div className="flex gap-2">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by model code (e.g. AAE.671, ARH.201), item name, or specification..."
                autoFocus
                className="flex-1 px-4 py-2.5 text-sm bg-aastra-pearl dark:bg-neutral-900 border border-aastra-silver dark:border-neutral-700 focus:outline-none focus:border-aastra-gold"
              />
              <button
                type="submit"
                className="px-6 py-2.5 bg-aastra-black dark:bg-aastra-gold text-white dark:text-black text-xs font-semibold uppercase tracking-widest hover:opacity-90 transition"
              >
                Search
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="lg:hidden bg-white dark:bg-[#161616] border-t border-aastra-silver dark:border-neutral-800 px-6 py-5 space-y-3 text-xs uppercase tracking-widest">
          {[
            ['/', 'Home'],
            ['/categories', 'Hardware Range'],
            ['/finishes', 'Finishes'],
            ['/catalogue', 'PDF Catalogue'],
            ['/about', 'About AASTRA'],
            ['/contact', 'Trade Enquiry'],
          ].map(([to, label]) => (
            <Link
              key={to}
              to={to}
              onClick={() => setMobileOpen(false)}
              className="block py-2 text-aastra-slate dark:text-neutral-200 hover:text-aastra-gold border-b border-aastra-pearl dark:border-neutral-800"
            >
              {label}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
}
