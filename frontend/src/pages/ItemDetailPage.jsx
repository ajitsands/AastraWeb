import React, { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, FileDown, Mail, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { api, resolveAssetUrl } from '../api/client';
import SpecTableView from '../components/SpecTableView';
import CataloguePdfPreview from '../components/CataloguePdfPreview';

export default function ItemDetailPage() {
  const { slug } = useParams();
  const [item, setItem] = useState(null);
  const [activeImgIdx, setActiveImgIdx] = useState(0);
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const pdfSectionRef = useRef(null);

  useEffect(() => {
    setLoading(true);
    setActiveImgIdx(0);
    setShowPdfModal(false);
    api
      .getItem(slug)
      .then(setItem)
      .catch(() => setItem(null))
      .finally(() => setLoading(false));
  }, [slug]);

  useEffect(() => {
    if (showPdfModal && pdfSectionRef.current) {
      setTimeout(() => {
        pdfSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 60);
    }
  }, [showPdfModal]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center text-sm text-aastra-gray">
        Loading product specification...
      </div>
    );
  }

  if (!item) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-semibold mb-3">Product Not Found</h2>
        <Link to="/categories" className="text-aastra-gold hover:underline text-sm">
          ← Return to Hardware Range
        </Link>
      </div>
    );
  }

  const images = item.images || [];
  const specLines = (item.specifications || '')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  // Build single-item datasheet group if user clicks Download Datasheet PDF directly on an item
  const singleItemGroup = {
    title: item.name,
    page_code: item.groups?.[0]?.page_code || `AH.${item.chapter_number || 8}.01`,
    section_label: item.section_label || 'ACCESSORIES',
    category_badge: item.category_name || 'HARDWARE',
    side_tab_label: item.side_tab_label || 'DOOR HARDWARE',
    layout_mode: 'standard',
    show_guarantee_seal: 1,
    footer_website: 'www.aastra.uk',
    items: [item],
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-aastra-gray mb-8">
        <Link to="/categories" className="hover:text-aastra-gold flex items-center gap-1">
          <ArrowLeft className="w-3.5 h-3.5" /> Range
        </Link>
        <span>/</span>
        <Link to={`/category/${item.category_slug}`} className="hover:text-aastra-gold">
          {item.category_name}
        </Link>
        <span>/</span>
        <span className="text-aastra-black dark:text-white font-mono">{item.code}</span>
      </div>

      {/* Main Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left: Images & Technical Drawings (1 to 3 max) */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-white border border-aastra-silver dark:border-neutral-800 aspect-[4/3] p-8 flex items-center justify-center relative shadow-classic">
            {images[activeImgIdx] ? (
              <img
                src={resolveAssetUrl(images[activeImgIdx].url)}
                alt={images[activeImgIdx].caption || item.name}
                className="max-h-full max-w-full object-contain"
              />
            ) : (
              <div className="text-sm text-aastra-gray">No Product Image</div>
            )}
            {images[activeImgIdx]?.caption && (
              <span className="absolute bottom-3 right-3 px-2.5 py-1 bg-aastra-pearl text-aastra-slate text-[11px] font-medium border border-aastra-silver/60">
                {images[activeImgIdx].caption}
              </span>
            )}
          </div>

          {images.length > 1 && (
            <div className="grid grid-cols-3 gap-3">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveImgIdx(idx)}
                  className={`bg-white border p-3 h-24 flex flex-col items-center justify-center transition ${
                    activeImgIdx === idx
                      ? 'border-aastra-gold ring-1 ring-aastra-gold'
                      : 'border-aastra-silver/80 hover:border-aastra-black'
                  }`}
                >
                  <img
                    src={resolveAssetUrl(img.url)}
                    alt={img.caption || `Image ${idx + 1}`}
                    className="max-h-14 max-w-full object-contain"
                  />
                  <span className="text-[10px] text-aastra-slate mt-1 truncate max-w-full">
                    {img.caption || (img.type === 'drawing' ? 'Drawing' : 'Photo')}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Product Information */}
        <div className="lg:col-span-6 space-y-6">
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <span className="px-2.5 py-1 bg-aastra-black text-white dark:bg-aastra-gold dark:text-black text-xs font-mono font-semibold">
                Model – {item.code}
              </span>
              <span className="text-xs uppercase tracking-[0.18em] text-aastra-gold-dark dark:text-aastra-gold font-semibold">
                {item.category_name}
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-semibold text-aastra-black dark:text-white leading-tight">
              {item.name}
            </h1>
            {item.subtitle && (
              <p className="mt-2 text-sm text-aastra-slate dark:text-neutral-400">{item.subtitle}</p>
            )}
          </div>

          {/* Specifications List */}
          <div className="bg-aastra-pearl dark:bg-[#181818] border border-aastra-silver/70 dark:border-neutral-800 p-5">
            <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-aastra-black dark:text-aastra-gold mb-3">
              Technical Specification
            </h2>
            <ul className="space-y-2 text-sm text-aastra-slate dark:text-neutral-300">
              {specLines.map((line, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-aastra-gold shrink-0 mt-0.5" />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Available Finishes */}
          {item.finishes?.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-aastra-slate dark:text-neutral-400 mb-3">
                Available Finishes
              </h3>
              <div className="flex flex-wrap gap-2">
                {item.finishes.map((fin) => (
                  <Link
                    key={fin.id}
                    to={`/finishes?finish=${fin.slug}`}
                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-[#181818] border border-aastra-silver/80 dark:border-neutral-700 hover:border-aastra-gold text-xs transition"
                  >
                    <span
                      style={{ background: fin.swatch_gradient || fin.swatch_hex }}
                      className="w-4 h-4 rounded-full border border-black/20"
                    />
                    <span className="font-medium text-aastra-black dark:text-neutral-200">
                      {fin.name}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Actions (No Shopping Cart — Datasheet PDF + Trade Enquiry) */}
          <div className="flex flex-wrap gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowPdfModal((v) => !v)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-aastra-black hover:bg-aastra-charcoal dark:bg-aastra-gold dark:hover:bg-aastra-gold-light text-white dark:text-black text-xs font-semibold uppercase tracking-widest transition"
            >
              <FileDown className="w-4 h-4" />
              {showPdfModal ? 'Hide PDF Datasheet' : 'Generate PDF Datasheet'}
            </button>

            {item.groups?.length > 0 && (
              <Link
                to={`/catalogue?page=${encodeURIComponent(item.groups[0].page_code)}`}
                className="inline-flex items-center gap-2 px-5 py-3 border border-aastra-silver dark:border-neutral-700 hover:border-aastra-gold text-xs font-semibold uppercase tracking-widest transition"
              >
                Brochure Page ({item.groups[0].page_code})
              </Link>
            )}

            <Link
              to={`/contact?item=${encodeURIComponent(item.code)}`}
              className="inline-flex items-center gap-2 px-5 py-3 border border-aastra-gold text-aastra-gold-dark dark:text-aastra-gold hover:bg-aastra-gold hover:text-black text-xs font-semibold uppercase tracking-widest transition"
            >
              <Mail className="w-4 h-4" /> Enquire
            </Link>
          </div>

          <div className="flex items-center gap-2 text-xs text-aastra-slate dark:text-neutral-400 pt-1">
            <ShieldCheck className="w-4 h-4 text-aastra-gold" />
            <span>Covered by the AASTRA 10-Year Mechanical Guarantee</span>
          </div>
        </div>
      </div>

      {/* Full Width Merged-Cell Specification Table */}
      {item.spec_table && (
        <section className="mt-12 pt-10 border-t border-aastra-silver dark:border-neutral-800">
          <h2 className="text-2xl font-semibold text-aastra-black dark:text-white mb-4">
            Ordering Codes &amp; Finish Matrix
          </h2>
          <SpecTableView table={item.spec_table} mode="web" />
          {item.footnote && (
            <p className="mt-3 text-xs italic text-aastra-gray">{item.footnote}</p>
          )}
        </section>
      )}

      {/* Expandable Live PDF Datasheet Preview & Download */}
      {showPdfModal && (
        <section
          ref={pdfSectionRef}
          className="mt-12 pt-10 border-t border-aastra-silver dark:border-neutral-800 scroll-mt-24"
        >
          <div className="bg-aastra-pearl dark:bg-[#121212] border border-aastra-silver dark:border-neutral-800 p-4 sm:p-8">
            <CataloguePdfPreview group={singleItemGroup} />
          </div>
        </section>
      )}
    </div>
  );
}
