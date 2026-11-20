import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Send, CheckCircle2, Globe, Mail, Building2 } from 'lucide-react';
import { api } from '../api/client';

export default function ContactPage() {
  const [searchParams] = useSearchParams();
  const initialItem = searchParams.get('item') || '';

  const [form, setForm] = useState({
    name: '',
    company: '',
    email: '',
    phone: '',
    item_code: initialItem,
    subject: initialItem ? `Specification Enquiry — Model ${initialItem}` : 'Project Hardware Enquiry',
    message: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await api.submitEnquiry(form);
      setSubmitted(true);
    } catch (err) {
      setError(err.message || 'Could not submit enquiry.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
      <div className="border-b border-aastra-silver dark:border-neutral-800 pb-8 mb-10">
        <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-aastra-gold-dark dark:text-aastra-gold mb-2">
          Trade &amp; Specification Desk
        </div>
        <h1 className="text-4xl font-semibold text-aastra-black dark:text-white">
          Project &amp; Product Enquiries
        </h1>
        <p className="mt-2 text-sm text-aastra-slate dark:text-neutral-400 max-w-2xl">
          Request ironmongery schedules, bespoke finish samples, minimum order quantities, or trade
          quotations directly from our specification team.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Form */}
        <div className="lg:col-span-8 bg-white dark:bg-[#181818] border border-aastra-silver dark:border-neutral-800 p-6 sm:p-8 shadow-classic">
          {submitted ? (
            <div className="py-12 text-center space-y-4">
              <CheckCircle2 className="w-12 h-12 text-aastra-gold mx-auto" />
              <h2 className="text-2xl font-semibold text-aastra-black dark:text-white">
                Enquiry Received
              </h2>
              <p className="text-sm text-aastra-slate dark:text-neutral-400 max-w-md mx-auto">
                Thank you for contacting AASTRA Architectural Hardware. Our specification desk will
                review your enquiry and respond shortly.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSubmitted(false);
                  setForm({
                    name: '',
                    company: '',
                    email: '',
                    phone: '',
                    item_code: '',
                    subject: 'Project Hardware Enquiry',
                    message: '',
                  });
                }}
                className="px-6 py-2.5 bg-aastra-black dark:bg-aastra-gold text-white dark:text-black text-xs font-semibold uppercase tracking-widest"
              >
                Send Another Enquiry
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="p-3 text-xs bg-red-50 dark:bg-red-950/40 border border-red-300 dark:border-red-800 text-red-700 dark:text-red-300">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm bg-aastra-pearl dark:bg-neutral-900 border border-aastra-silver dark:border-neutral-700 focus:outline-none focus:border-aastra-gold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5">
                    Company / Practice
                  </label>
                  <input
                    type="text"
                    value={form.company}
                    onChange={(e) => setForm({ ...form, company: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm bg-aastra-pearl dark:bg-neutral-900 border border-aastra-silver dark:border-neutral-700 focus:outline-none focus:border-aastra-gold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm bg-aastra-pearl dark:bg-neutral-900 border border-aastra-silver dark:border-neutral-700 focus:outline-none focus:border-aastra-gold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5">
                    Telephone
                  </label>
                  <input
                    type="text"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm bg-aastra-pearl dark:bg-neutral-900 border border-aastra-silver dark:border-neutral-700 focus:outline-none focus:border-aastra-gold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5">
                    Model / Item Code (Optional)
                  </label>
                  <input
                    type="text"
                    value={form.item_code}
                    onChange={(e) => setForm({ ...form, item_code: e.target.value })}
                    placeholder="e.g. AAE.671 or ARH.201"
                    className="w-full px-3.5 py-2.5 text-sm font-mono bg-aastra-pearl dark:bg-neutral-900 border border-aastra-silver dark:border-neutral-700 focus:outline-none focus:border-aastra-gold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5">
                    Subject
                  </label>
                  <input
                    type="text"
                    value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm bg-aastra-pearl dark:bg-neutral-900 border border-aastra-silver dark:border-neutral-700 focus:outline-none focus:border-aastra-gold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5">
                  Project Details / Message *
                </label>
                <textarea
                  rows="5"
                  required
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  placeholder="Share preferred finishes, quantities, or project specification requirements..."
                  className="w-full px-3.5 py-2.5 text-sm bg-aastra-pearl dark:bg-neutral-900 border border-aastra-silver dark:border-neutral-700 focus:outline-none focus:border-aastra-gold"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-2 px-7 py-3 bg-aastra-black hover:bg-aastra-charcoal dark:bg-aastra-gold dark:text-black text-white text-xs font-semibold uppercase tracking-widest transition disabled:opacity-60"
              >
                <Send className="w-4 h-4" />
                {submitting ? 'Submitting...' : 'Submit Specification Enquiry'}
              </button>
            </form>
          )}
        </div>

        {/* Info Sidebar */}
        <div className="lg:col-span-4 space-y-5">
          <div className="bg-aastra-pearl dark:bg-[#181818] border border-aastra-silver dark:border-neutral-800 p-6 space-y-4">
            <h3 className="text-xl font-semibold text-aastra-black dark:text-white">
              Direct Contact
            </h3>
            <div className="space-y-3 text-sm text-aastra-slate dark:text-neutral-300">
              <div className="flex items-start gap-3">
                <Building2 className="w-4 h-4 text-aastra-gold mt-0.5 shrink-0" />
                <div>
                  <div className="font-semibold text-aastra-black dark:text-white">
                    AASTRA Architectural Hardware
                  </div>
                  <div className="text-xs text-aastra-slate dark:text-neutral-400 mt-0.5 leading-relaxed">
                    33 Dunstable Road, Houghton Regis,<br />
                    Dunstable, LU5 5DB, UK
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Globe className="w-4 h-4 text-aastra-gold shrink-0" />
                <a href="https://aastra.uk" className="hover:text-aastra-gold transition">
                  www.aastra.uk
                </a>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-aastra-gold shrink-0" />
                <a href="mailto:business@aastra.uk" className="hover:text-aastra-gold transition">
                  business@aastra.uk
                </a>
              </div>
              <div className="pt-2 border-t border-aastra-silver/60 dark:border-neutral-800 text-xs">
                <span className="uppercase tracking-wider text-aastra-gray">Direct:</span>{' '}
                <a
                  href="tel:+447435620033"
                  className="font-mono font-semibold text-aastra-black dark:text-white hover:text-aastra-gold"
                >
                  +44 7435 620033
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
