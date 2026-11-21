import React, { useEffect, useState } from 'react';
import {
  Globe,
  FileDown,
  Eye,
  Users,
  Monitor,
  Smartphone,
  Tablet,
  Download,
  RefreshCw,
  Search,
  MapPin,
} from 'lucide-react';
import { api } from '../../api/client';

export default function AdminAnalytics() {
  const [days, setDays] = useState(30);
  const [summary, setSummary] = useState(null);
  const [logs, setLogs] = useState([]);
  const [eventFilter, setEventFilter] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [sum, logRows] = await Promise.all([
        api.getAnalyticsSummary(days),
        api.getAnalyticsLogs({ type: eventFilter, q: search, limit: 200 }),
      ]);
      setSummary(sum);
      setLogs(logRows);
    } catch (err) {
      console.error('Failed loading analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [days, eventFilter]);

  const handleSearch = (e) => {
    e.preventDefault();
    loadData();
  };

  const exportCsv = () => {
    if (!logs.length) return;
    const headers = [
      'Timestamp',
      'Event',
      'IP Address',
      'Country',
      'City',
      'Region',
      'ISP',
      'Device',
      'Browser',
      'OS',
      'Page Path',
      'PDF Code',
      'PDF Title',
      'Referrer',
    ];
    const escape = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const rows = logs.map((l) =>
      [
        l.created_at,
        l.event_type,
        l.ip_address,
        l.country,
        l.city,
        l.region,
        l.isp,
        l.device_type,
        l.browser,
        l.os,
        l.page_path,
        l.pdf_page_code || l.item_code || '',
        l.pdf_title || '',
        l.referrer || '',
      ]
        .map(escape)
        .join(',')
    );
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `aastra-analytics-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const DeviceIcon = ({ type }) => {
    if (type === 'Mobile') return <Smartphone className="w-3.5 h-3.5 text-aastra-gold" />;
    if (type === 'Tablet') return <Tablet className="w-3.5 h-3.5 text-aastra-gold" />;
    return <Monitor className="w-3.5 h-3.5 text-aastra-slate dark:text-neutral-400" />;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-aastra-black dark:text-white">
            Visitor &amp; PDF Download Analytics
          </h1>
          <p className="text-sm text-aastra-slate dark:text-neutral-400">
            Track visitor IP addresses, geolocation, visited pages, devices, and product PDF
            brochure downloads.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="px-3 py-2 text-xs bg-white dark:bg-[#181818] border border-aastra-silver dark:border-neutral-700"
          >
            <option value={7}>Last 7 Days</option>
            <option value={30}>Last 30 Days</option>
            <option value={90}>Last 90 Days</option>
            <option value={365}>Last 12 Months</option>
          </select>

          <button
            type="button"
            onClick={loadData}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs border border-aastra-silver dark:border-neutral-700 bg-white dark:bg-[#181818] hover:border-aastra-gold"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>

          <button
            type="button"
            onClick={exportCsv}
            disabled={!logs.length}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold uppercase tracking-wider bg-aastra-black dark:bg-aastra-gold text-white dark:text-black disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" /> Export CSV
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#181818] border border-aastra-silver dark:border-neutral-800 p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs uppercase tracking-wider text-aastra-gray">Page Views</span>
            <Eye className="w-4 h-4 text-aastra-gold" />
          </div>
          <div className="text-3xl font-bold text-aastra-black dark:text-white">
            {summary?.total_views ?? 0}
          </div>
          <div className="text-[11px] text-aastra-gray mt-1">Last {days} days</div>
        </div>

        <div className="bg-white dark:bg-[#181818] border border-aastra-silver dark:border-neutral-800 p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs uppercase tracking-wider text-aastra-gray">Unique Visitors</span>
            <Users className="w-4 h-4 text-aastra-gold" />
          </div>
          <div className="text-3xl font-bold text-aastra-black dark:text-white">
            {summary?.unique_visitors ?? 0}
          </div>
          <div className="text-[11px] text-aastra-gray mt-1">Distinct IP addresses</div>
        </div>

        <div className="bg-white dark:bg-[#181818] border border-aastra-silver dark:border-neutral-800 p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs uppercase tracking-wider text-aastra-gray">PDF Downloads</span>
            <FileDown className="w-4 h-4 text-aastra-gold" />
          </div>
          <div className="text-3xl font-bold text-aastra-black dark:text-white">
            {summary?.total_downloads ?? 0}
          </div>
          <div className="text-[11px] text-aastra-gray mt-1">Brochures &amp; Datasheets</div>
        </div>

        <div className="bg-white dark:bg-[#181818] border border-aastra-silver dark:border-neutral-800 p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs uppercase tracking-wider text-aastra-gray">Devices</span>
            <Globe className="w-4 h-4 text-aastra-gold" />
          </div>
          <div className="flex flex-wrap gap-3 pt-1">
            {(summary?.devices || []).length === 0 ? (
              <span className="text-xs text-aastra-gray">No data yet</span>
            ) : (
              summary.devices.map((d) => (
                <div key={d.device_type} className="flex items-center gap-1.5 text-xs">
                  <DeviceIcon type={d.device_type} />
                  <span className="font-semibold">{d.device_type}:</span>
                  <span>{d.count}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Breakdowns: Top PDFs, Visitor Locations, Top Pages */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Top Downloaded PDFs */}
        <div className="bg-white dark:bg-[#181818] border border-aastra-silver dark:border-neutral-800 p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wider mb-3 pb-2 border-b border-aastra-pearl dark:border-neutral-800 flex items-center gap-2">
            <FileDown className="w-4 h-4 text-aastra-gold" /> Top Downloaded PDFs
          </h2>
          {!summary?.top_pdfs?.length ? (
            <p className="text-xs text-aastra-gray py-4">No PDF downloads recorded yet.</p>
          ) : (
            <div className="space-y-2.5">
              {summary.top_pdfs.map((p, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between gap-2 text-xs pb-2 border-b border-aastra-pearl/70 dark:border-neutral-800/70 last:border-0"
                >
                  <div className="min-w-0">
                    <span className="font-mono font-bold text-aastra-gold-dark dark:text-aastra-gold mr-2">
                      {p.code}
                    </span>
                    <span className="text-aastra-slate dark:text-neutral-300 truncate block">
                      {p.title}
                    </span>
                  </div>
                  <span className="px-2 py-0.5 bg-aastra-pearl dark:bg-neutral-800 font-mono font-semibold shrink-0">
                    {p.downloads}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Visitor Geolocation */}
        <div className="bg-white dark:bg-[#181818] border border-aastra-silver dark:border-neutral-800 p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wider mb-3 pb-2 border-b border-aastra-pearl dark:border-neutral-800 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-aastra-gold" /> Visitor Locations
          </h2>
          {!summary?.locations?.length ? (
            <p className="text-xs text-aastra-gray py-4">No geolocation data yet.</p>
          ) : (
            <div className="space-y-2.5">
              {summary.locations.map((loc, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between gap-2 text-xs pb-2 border-b border-aastra-pearl/70 dark:border-neutral-800/70 last:border-0"
                >
                  <div className="min-w-0">
                    <div className="font-semibold text-aastra-black dark:text-white truncate">
                      {loc.city !== '—' ? `${loc.city}, ` : ''}
                      {loc.country}
                      {loc.country_code && (
                        <span className="ml-1.5 font-mono text-[10px] text-aastra-gray">
                          [{loc.country_code}]
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-aastra-gray">
                      {loc.unique_ips} IP(s) · {loc.downloads} PDF(s)
                    </div>
                  </div>
                  <span className="px-2 py-0.5 bg-aastra-pearl dark:bg-neutral-800 font-mono font-semibold shrink-0">
                    {loc.hits}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Pages */}
        <div className="bg-white dark:bg-[#181818] border border-aastra-silver dark:border-neutral-800 p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wider mb-3 pb-2 border-b border-aastra-pearl dark:border-neutral-800 flex items-center gap-2">
            <Eye className="w-4 h-4 text-aastra-gold" /> Most Visited Pages
          </h2>
          {!summary?.top_pages?.length ? (
            <p className="text-xs text-aastra-gray py-4">No page views recorded yet.</p>
          ) : (
            <div className="space-y-2.5">
              {summary.top_pages.map((pg, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between gap-2 text-xs pb-2 border-b border-aastra-pearl/70 dark:border-neutral-800/70 last:border-0"
                >
                  <span className="font-mono text-aastra-slate dark:text-neutral-300 truncate">
                    {pg.page_path}
                  </span>
                  <span className="px-2 py-0.5 bg-aastra-pearl dark:bg-neutral-800 font-mono font-semibold shrink-0">
                    {pg.views}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Live Activity Log Table */}
      <div className="bg-white dark:bg-[#181818] border border-aastra-silver dark:border-neutral-800">
        <div className="p-4 border-b border-aastra-pearl dark:border-neutral-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {[
              ['', 'All Activity'],
              ['page_view', 'Page Views'],
              ['pdf_download', 'PDF Downloads'],
            ].map(([val, label]) => (
              <button
                key={val}
                type="button"
                onClick={() => setEventFilter(val)}
                className={`px-3 py-1.5 text-xs font-medium border transition ${
                  eventFilter === val
                    ? 'bg-aastra-black text-white dark:bg-aastra-gold dark:text-black border-aastra-black dark:border-aastra-gold'
                    : 'border-aastra-silver dark:border-neutral-700 text-aastra-slate dark:text-neutral-300'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSearch} className="flex w-full md:w-80">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search IP, city, country, page, PDF..."
              className="flex-1 px-3 py-1.5 text-xs bg-aastra-pearl dark:bg-neutral-900 border border-aastra-silver dark:border-neutral-700 focus:outline-none focus:border-aastra-gold"
            />
            <button
              type="submit"
              className="px-3 bg-aastra-black dark:bg-aastra-gold text-white dark:text-black"
            >
              <Search className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-aastra-pearl dark:bg-neutral-900 text-[10px] uppercase tracking-wider text-aastra-slate dark:text-neutral-400 border-b border-aastra-silver dark:border-neutral-800">
              <tr>
                <th className="px-4 py-3 whitespace-nowrap">Time</th>
                <th className="px-4 py-3 whitespace-nowrap">Event</th>
                <th className="px-4 py-3 whitespace-nowrap">IP Address</th>
                <th className="px-4 py-3 whitespace-nowrap">Location</th>
                <th className="px-4 py-3 whitespace-nowrap">Page / PDF</th>
                <th className="px-4 py-3 whitespace-nowrap">Device / Browser</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-aastra-pearl dark:divide-neutral-800">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-4 py-8 text-center text-aastra-gray">
                    No activity logged yet. Visit public pages or download a PDF to see live tracking.
                  </td>
                </tr>
              ) : (
                logs.map((row) => (
                  <tr key={row.id} className="hover:bg-aastra-pearl/40 dark:hover:bg-neutral-900/40">
                    <td className="px-4 py-2.5 font-mono text-[11px] whitespace-nowrap text-aastra-gray">
                      {row.created_at}
                    </td>
                    <td className="px-4 py-2.5 whitespace-nowrap">
                      {row.event_type === 'pdf_download' ? (
                        <span className="px-2 py-0.5 bg-aastra-gold/20 text-aastra-gold-dark dark:text-aastra-gold font-semibold">
                          PDF Download
                        </span>
                      ) : row.event_type === 'pdf_print' ? (
                        <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-semibold">
                          PDF Print
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-aastra-pearl dark:bg-neutral-800 text-aastra-slate dark:text-neutral-300">
                          Page View
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 font-mono whitespace-nowrap">{row.ip_address}</td>
                    <td className="px-4 py-2.5 whitespace-nowrap">
                      <div className="font-medium text-aastra-black dark:text-white">
                        {row.city ? `${row.city}, ` : ''}
                        {row.country || 'Unknown'}
                      </div>
                      {row.isp && (
                        <div className="text-[10px] text-aastra-gray truncate max-w-[180px]">
                          {row.isp}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-2.5 max-w-[260px]">
                      {row.pdf_page_code || row.item_code ? (
                        <div>
                          <span className="font-mono font-bold text-aastra-gold-dark dark:text-aastra-gold">
                            {row.pdf_page_code || row.item_code}
                          </span>{' '}
                          <span className="text-aastra-slate dark:text-neutral-300">
                            {row.pdf_title}
                          </span>
                        </div>
                      ) : (
                        <span className="font-mono text-aastra-slate dark:text-neutral-300 break-all">
                          {row.page_path}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <DeviceIcon type={row.device_type} />
                        <span>
                          {row.device_type} · {row.browser} ({row.os})
                        </span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
