import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function AdminLoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('admin@aastra.uk');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/admin', { replace: true });
    } catch (err) {
      setError(err.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-aastra-pearl dark:bg-[#111111] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-[#181818] border border-aastra-silver dark:border-neutral-800 shadow-elevated p-8 relative">
        <div className="absolute top-0 left-0 right-0 h-1 bg-aastra-gold" />

        <div className="text-center mb-8">
          <img
            src="/brand/logo-black.gif"
            alt="AASTRA"
            className="h-8 mx-auto mb-4 dark:hidden"
          />
          <img
            src="/brand/logo-gold.gif"
            alt="AASTRA"
            className="h-8 mx-auto mb-4 hidden dark:block"
          />
          <h1 className="text-2xl font-semibold text-aastra-black dark:text-white">
            Admin Control Panel
          </h1>
          <p className="text-xs text-aastra-gray mt-1 uppercase tracking-widest">
            Catalogue &amp; PDF Brochure Management
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 text-xs bg-red-50 dark:bg-red-950/50 border border-red-300 dark:border-red-800 text-red-700 dark:text-red-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5">
              Admin Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-aastra-pearl dark:bg-neutral-900 border border-aastra-silver dark:border-neutral-700 focus:outline-none focus:border-aastra-gold"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter admin password"
              className="w-full px-3.5 py-2.5 text-sm bg-aastra-pearl dark:bg-neutral-900 border border-aastra-silver dark:border-neutral-700 focus:outline-none focus:border-aastra-gold"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-aastra-black hover:bg-aastra-charcoal dark:bg-aastra-gold dark:text-black text-white text-xs font-semibold uppercase tracking-widest flex items-center justify-center gap-2 transition disabled:opacity-60"
          >
            <Lock className="w-3.5 h-3.5" />
            {loading ? 'Signing in...' : 'Sign In to Admin'}
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-aastra-pearl dark:border-neutral-800 flex items-center justify-between text-xs text-aastra-gray">
          <Link to="/" className="inline-flex items-center gap-1 hover:text-aastra-gold">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Website
          </Link>
          <span className="font-mono text-[11px]">admin@aastra.uk</span>
        </div>
      </div>
    </div>
  );
}
