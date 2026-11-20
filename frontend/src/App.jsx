import React from 'react';
import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
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
import AdminCategories from './pages/admin/AdminCategories';
import AdminFinishes from './pages/admin/AdminFinishes';
import AdminItems from './pages/admin/AdminItems';
import AdminGroups from './pages/admin/AdminGroups';

function PublicLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-aastra-paper text-aastra-black dark:bg-[#111111] dark:text-[#F1F1EF] transition-colors">
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
