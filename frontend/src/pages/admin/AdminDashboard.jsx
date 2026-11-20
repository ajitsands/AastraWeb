import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FolderTree, Palette, Package, FileText, Mail, ArrowRight } from 'lucide-react';
import { api } from '../../api/client';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [enquiries, setEnquiries] = useState([]);

  useEffect(() => {
    api.getDashboardStats().then(setStats).catch(() => {});
    api.getEnquiries().then(setEnquiries).catch(() => {});
  }, []);

  const cards = [
    { label: 'Categories', value: stats?.categories ?? '—', to: '/admin/categories', icon: FolderTree },
    { label: 'Finishes', value: stats?.finishes ?? '—', to: '/admin/finishes', icon: Palette },
    { label: 'Hardware Items', value: stats?.items ?? '—', to: '/admin/items', icon: Package },
    { label: 'PDF Page Groups', value: stats?.groups ?? '—', to: '/admin/groups', icon: FileText },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold text-aastra-black dark:text-white">
          Dashboard Overview
        </h1>
        <p className="text-sm text-aastra-slate dark:text-neutral-400 mt-1">
          Manage AASTRA categories, finishes, product specification tables, and AH.Chapter.Page PDF
          catalogue groups.
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {cards.map(({ label, value, to, icon: Icon }) => (
          <Link
            key={label}
            to={to}
            className="bg-white dark:bg-[#181818] border border-aastra-silver dark:border-neutral-800 hover:border-aastra-gold p-6 transition group shadow-sm"
          >
            <div className="flex items-center justify-between mb-4">
              <Icon className="w-5 h-5 text-aastra-gold" />
              <ArrowRight className="w-4 h-4 text-aastra-gray group-hover:text-aastra-gold group-hover:translate-x-0.5 transition" />
            </div>
            <div className="text-3xl font-classic font-bold text-aastra-black dark:text-white">
              {value}
            </div>
            <div className="text-xs uppercase tracking-wider text-aastra-slate dark:text-neutral-400 mt-1">
              {label}
            </div>
          </Link>
        ))}
      </div>

      {/* Recent Trade Enquiries */}
      <div className="bg-white dark:bg-[#181818] border border-aastra-silver dark:border-neutral-800 p-6">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-aastra-pearl dark:border-neutral-800">
          <h2 className="text-xl font-semibold text-aastra-black dark:text-white flex items-center gap-2">
            <Mail className="w-4 h-4 text-aastra-gold" /> Recent Trade Enquiries
          </h2>
          <span className="text-xs text-aastra-gray">{enquiries.length} total</span>
        </div>

        {enquiries.length === 0 ? (
          <p className="text-sm text-aastra-gray py-4">No trade enquiries submitted yet.</p>
        ) : (
          <div className="divide-y divide-aastra-pearl dark:divide-neutral-800">
            {enquiries.slice(0, 6).map((enq) => (
              <div key={enq.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="text-sm font-semibold text-aastra-black dark:text-white">
                    {enq.name}{' '}
                    {enq.company && <span className="font-normal text-aastra-gray">({enq.company})</span>}
                    {enq.item_code && (
                      <span className="ml-2 px-2 py-0.5 bg-aastra-pearl dark:bg-neutral-800 font-mono text-[11px]">
                        {enq.item_code}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-aastra-slate dark:text-neutral-400 mt-0.5">
                    {enq.email} — {enq.message}
                  </div>
                </div>
                <span className="text-[11px] uppercase tracking-wider px-2.5 py-1 bg-aastra-gold-tint dark:bg-aastra-gold/20 text-aastra-gold-dark dark:text-aastra-gold font-semibold self-start">
                  {enq.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
