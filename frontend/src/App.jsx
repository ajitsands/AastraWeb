import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Outlet, useLocation } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { api } from './api/client';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

import HomePage from './pages/HomePage';
import CategoriesPage from './pages/CategoriesPage';
import CategoryDetailPage from './pages/CategoryDetailPage';
import FinishesPage from './pages/FinishesPage';
import ItemDetailPage from './pages/ItemDetailPage';
import CataloguePage from './pages/CataloguePage';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';

import AdminLoginPage from './pages/admin/AdminLoginPage';
import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminAnalytics from './pages/admin/AdminAnalytics';
import AdminCategories from './pages/admin/AdminCategories';
import AdminFinishes from './pages/admin/AdminFinishes';
import AdminItems from './pages/admin/AdminItems';
import AdminGroups from './pages/admin/AdminGroups';

function RouteTracker() {
  const location = useLocation();
  useEffect(() => {
    // Only track public visitor pages (exclude /admin routes)
    if (location.pathname.startsWith('/admin')) return;
    api.trackEvent({
      event_type: 'page_view',
      page_path: location.pathname + location.search,
      page_title: document.title,
      referrer: document.referrer || '',
    });
  }, [location.pathname, location.search]);
  return null;
}

function PublicLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-aastra-paper text-aastra-black dark:bg-[#111111] dark:text-[#F1F1EF] transition-colors overflow-x-hidden">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <RouteTracker />
          <Routes>
            {/* Public Storefront & Architectural Catalogue */}
            <Route element={<PublicLayout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/categories" element={<CategoriesPage />} />
              <Route path="/category/:slug" element={<CategoryDetailPage />} />
              <Route path="/finishes" element={<FinishesPage />} />
              <Route path="/item/:slug" element={<ItemDetailPage />} />
              <Route path="/catalogue" element={<CataloguePage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/contact" element={<ContactPage />} />
            </Route>

            {/* Admin Portal */}
            <Route path="/admin/login" element={<AdminLoginPage />} />
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="analytics" element={<AdminAnalytics />} />
              <Route path="categories" element={<AdminCategories />} />
              <Route path="finishes" element={<AdminFinishes />} />
              <Route path="items" element={<AdminItems />} />
              <Route path="groups" element={<AdminGroups />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
