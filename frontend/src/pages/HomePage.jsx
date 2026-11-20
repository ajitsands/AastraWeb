import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  FileDown,
  ShieldCheck,
  Compass,
  Layers,
  Award,
  BookOpen,
} from 'lucide-react';
import { api, resolveAssetUrl } from '../api/client';
import ProductCard from '../components/ProductCard';
import GuaranteeSeal from '../components/GuaranteeSeal';

export default function HomePage() {
  const [categories, setCategories] = useState([]);
  const [finishes, setFinishes] = useState([]);
  const [featuredItems, setFeaturedItems] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.getCategories(),
      api.getFinishes(),
      api.getItems({ featured: 1 }),
      api.getGroups(),
    ])
      .then(([cats, fins, items, grps]) => {
        setCategories(cats);
        setFinishes(fins);
        setFeaturedItems(items);
        setGroups(grps);
      })
      .catch((err) => console.error('Failed loading homepage data:', err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      {/* ================= HERO SECTION (Classic Architectural Light/Dark) ================= */}
      <section className="relative bg-aastra-pearl dark:bg-[#151515] border-b border-aastra-silver/80 dark:border-neutral-800 overflow-hidden">
        {/* Subtle architectural grid lines */}
        <div
          className="absolute inset-0 opacity-[0.04] dark:opacity-[0.06] pointer-events-none"
          style={{
            backgroundImage:
              'linear-gradient(to right, #161616 1px, transparent 1px), linear-gradient(to bottom, #161616 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24 relative">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Editorial Column */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-3">
                <span className="h-[1px] w-10 bg-aastra-gold" />
                <span className="text-[11px] font-semibold uppercase tracking-[0.25em] text-aastra-gold-dark dark:text-aastra-gold">
                  AASTRA Architectural Ironmongery
                </span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-[54px] font-light text-aastra-black dark:text-white leading-[1.12] tracking-tight">
                Timeless{' '}
                <span className="font-bold">Door Hardware</span>,{' '}
                <span className="font-extralight text-aastra-slate dark:text-neutral-300">
                  Engineered to Endure.
                </span>
              </h1>

              <p className="text-base sm:text-lg text-aastra-slate dark:text-neutral-400 max-w-2xl leading-relaxed font-light">
                Precision-crafted door handles, flush pulls, architectural hinges, locks, and
                accessories in SS304 stainless steel and solid brass. Designed for architects,
                interior designers, and discerning residential and commercial spaces.
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <Link
                  to="/categories"
                  className="inline-flex items-center gap-2.5 px-7 py-3.5 bg-aastra-black hover:bg-aastra-charcoal dark:bg-aastra-gold dark:hover:bg-aastra-gold-light text-white dark:text-black text-xs font-semibold uppercase tracking-[0.18em] transition shadow-classic"
                >
                  Explore Hardware Range <ArrowRight className="w-4 h-4" />
                </Link>

                <Link
                  to="/catalogue"
                  className="inline-flex items-center gap-2.5 px-7 py-3.5 bg-white dark:bg-transparent border border-aastra-black/30 dark:border-neutral-600 hover:border-aastra-gold text-aastra-black dark:text-white text-xs font-semibold uppercase tracking-[0.18em] transition"
                >
                  <FileDown className="w-4 h-4 text-aastra-gold" /> Download PDF Brochures
                </Link>
              </div>

              {/* Architectural Trust Bar */}
              <div className="pt-8 mt-6 border-t border-aastra-silver/80 dark:border-neutral-800 grid grid-cols-3 gap-6 max-w-xl">
                <div>
                  <div className="font-classic text-2xl sm:text-3xl font-semibold text-aastra-black dark:text-white">
                    10 Year
                  </div>
                  <div className="text-[11px] uppercase tracking-wider text-aastra-slate dark:text-neutral-400">
                    Mechanical Guarantee
                  </div>
                </div>
                <div>
                  <div className="font-classic text-2xl sm:text-3xl font-semibold text-aastra-black dark:text-white">
                    SS304
                  </div>
                  <div className="text-[11px] uppercase tracking-wider text-aastra-slate dark:text-neutral-400">
                    &amp; Solid Brass Grade
                  </div>
                </div>
                <div>
                  <div className="font-classic text-2xl sm:text-3xl font-semibold text-aastra-black dark:text-white">
                    8+
                  </div>
                  <div className="text-[11px] uppercase tracking-wider text-aastra-slate dark:text-neutral-400">
                    Signature Finishes
                  </div>
                </div>
              </div>
            </div>

            {/* Right Classic Showcase Frame */}
            <div className="lg:col-span-5">
              <div className="bg-white dark:bg-[#1A1A1A] border border-aastra-silver dark:border-neutral-800 p-6 sm:p-8 shadow-elevated relative">
                <div className="absolute top-0 left-0 right-0 h-1 bg-aastra-gold" />
                <div className="flex items-center justify-between mb-6 pb-3 border-b border-aastra-pearl dark:border-neutral-800">
                  <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-aastra-gray">
                    SPECIFICATION EDITION
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 bg-aastra-pearl dark:bg-neutral-800 text-aastra-black dark:text-aastra-gold">
                    AH SERIES
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-white border border-aastra-pearl p-4 flex flex-col items-center justify-center aspect-square">
                    <img
                      src="/samples/aae671_photo.png"
                      alt="Half Dome Door Stop"
                      className="max-h-24 object-contain"
                    />
                    <span className="mt-2 text-[10px] font-mono text-aastra-slate">AAE.671</span>
                  </div>
                  <div className="bg-white border border-aastra-pearl p-4 flex flex-col items-center justify-center aspect-square">
                    <img
                      src="/samples/arh201_photo.png"
                      alt="Round Flush Pull"
                      className="max-h-24 object-contain"
                    />
                    <span className="mt-2 text-[10px] font-mono text-aastra-slate">ARH.201</span>
                  </div>
                  <div className="bg-white border border-aastra-pearl p-4 flex flex-col items-center justify-center aspect-square">
                    <img
                      src="/samples/aae825_photo.png"
                      alt="Door Eye Viewer"
                      className="max-h-24 object-contain"
                    />
                    <span className="mt-2 text-[10px] font-mono text-aastra-slate">AAE.825</span>
                  </div>
                  <div className="bg-white border border-aastra-pearl p-4 flex flex-col items-center justify-center aspect-square">
                    <img
                      src="/samples/arh204_photo.png"
                      alt="Rectangular Flush Pull"
                      className="max-h-24 object-contain"
                    />
                    <span className="mt-2 text-[10px] font-mono text-aastra-slate">ARH.204</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-aastra-pearl dark:border-neutral-800">
                  <div className="flex items-center gap-2.5">
                    <GuaranteeSeal size={38} accent="gold" />
                    <div className="text-xs leading-tight">
                      <div className="font-semibold text-aastra-black dark:text-white">
                        Architectural Datasheets
                      </div>
                      <div className="text-aastra-gray text-[11px]">Instant A4 PDF generation</div>
                    </div>
                  </div>
                  <Link
                    to="/catalogue"
                    className="text-xs font-semibold uppercase tracking-wider text-aastra-gold-dark dark:text-aastra-gold hover:underline"
                  >
                    View All →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= BROWSE BY CATEGORY ================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-aastra-gold-dark dark:text-aastra-gold mb-2">
              Architectural Chapters
            </div>
            <h2 className="text-2xl sm:text-3xl font-light text-aastra-black dark:text-white tracking-tight">
              Browse Hardware <span className="font-bold">by Category</span>
            </h2>
          </div>
          <Link
            to="/categories"
            className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-aastra-slate dark:text-neutral-300 hover:text-aastra-gold transition"
          >
            View All Categories <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-64 bg-aastra-pearl dark:bg-neutral-900 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                to={`/category/${cat.slug}`}
                className="group bg-white dark:bg-[#181818] border border-aastra-silver/80 dark:border-neutral-800 hover:border-aastra-gold transition-all duration-300 p-6 flex flex-col justify-between shadow-classic"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 bg-aastra-pearl dark:bg-neutral-800 text-aastra-slate dark:text-neutral-300">
                      Chapter {cat.chapter_number}
                    </span>
                    <span className="text-[10px] uppercase tracking-widest text-aastra-gray">
                      {cat.section_label}
                    </span>
                  </div>

                  <div className="h-32 bg-white border border-aastra-pearl p-4 mb-5 flex items-center justify-center">
                    {cat.image_url ? (
                      <img
                        src={resolveAssetUrl(cat.image_url)}
                        alt={cat.name}
                        className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <Layers className="w-8 h-8 text-aastra-silver" />
                    )}
                  </div>

                  <h3 className="text-xl font-semibold text-aastra-black dark:text-white group-hover:text-aastra-gold transition">
                    {cat.name}
                  </h3>
                  <p className="mt-1.5 text-xs text-aastra-slate dark:text-neutral-400 line-clamp-2 leading-relaxed">
                    {cat.description}
                  </p>
                </div>

                <div className="mt-5 pt-3 border-t border-aastra-pearl dark:border-neutral-800 flex items-center justify-between text-[11px] font-medium">
                  <span className="text-aastra-gray">
                    {cat.item_count || 0} Items · {cat.group_count || 0} PDF Pages
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-aastra-gold group-hover:translate-x-1 transition" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* ================= BROWSE BY FINISH ================= */}
      <section className="bg-aastra-pearl dark:bg-[#141414] border-y border-aastra-silver/80 dark:border-neutral-800 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-aastra-gold-dark dark:text-aastra-gold mb-2">
              Curated Architectural Surfaces
            </div>
            <h2 className="text-2xl sm:text-3xl font-light text-aastra-black dark:text-white tracking-tight">
              Browse <span className="font-bold">by Finish</span>
            </h2>
            <p className="mt-3 text-sm text-aastra-slate dark:text-neutral-400">
              Coordinate your complete door schedule across brushed stainless steel, antique &amp;
              satin brass, polished chrome, and deep architectural matt black.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
            {finishes.map((fin) => (
              <Link
                key={fin.id}
                to={`/finishes?finish=${fin.slug}`}
                className="group bg-white dark:bg-[#1B1B1B] border border-aastra-silver/70 dark:border-neutral-800 hover:border-aastra-gold p-4 flex flex-col items-center text-center transition shadow-sm"
              >
                <div
                  style={{ background: fin.swatch_gradient || fin.swatch_hex }}
                  className="w-14 h-14 rounded-full border-2 border-white dark:border-neutral-700 shadow-md ring-1 ring-black/15 group-hover:scale-105 transition-transform"
                />
                <div className="mt-3 text-xs font-semibold text-aastra-black dark:text-white group-hover:text-aastra-gold transition">
                  {fin.name}
                </div>
                <div className="text-[10px] font-mono text-aastra-gray mt-0.5">{fin.code}</div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ================= FEATURED PRODUCTS ================= */}
      {featuredItems.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-aastra-gold-dark dark:text-aastra-gold mb-2">
                Specified Ironmongery
              </div>
              <h2 className="text-2xl sm:text-3xl font-light text-aastra-black dark:text-white tracking-tight">
                Featured <span className="font-bold">Architectural Hardware</span>
              </h2>
            </div>
            <Link
              to="/categories"
              className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-aastra-slate dark:text-neutral-300 hover:text-aastra-gold transition"
            >
              Browse Full Range <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredItems.slice(0, 6).map((item) => (
              <ProductCard key={item.id} item={item} />
            ))}
          </div>
        </section>
      )}

      {/* ================= PDF CATALOGUE BROCHURE PAGES ================= */}
      {groups.length > 0 && (
        <section className="bg-aastra-black text-white py-16 border-y border-aastra-gold/40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-aastra-gold mb-2">
                  Technical Documentation
                </div>
                <h2 className="text-2xl sm:text-3xl font-light text-white tracking-tight">
                  Instant PDF <span className="font-bold">Catalogue Sheets</span>
                </h2>
                <p className="mt-2 text-sm text-neutral-400 max-w-2xl">
                  Every AASTRA product group is formatted to our AH Chapter &amp; Page specification
                  standard (e.g. <span className="font-mono text-aastra-gold">AH.8.06</span>) with
                  technical drawings, finish matrices, and our 10-Year Mechanical Guarantee seal.
                </p>
              </div>
              <Link
                to="/catalogue"
                className="inline-flex items-center gap-2 px-6 py-3 bg-aastra-gold text-black text-xs font-semibold uppercase tracking-widest hover:bg-aastra-gold-light transition shrink-0"
              >
                <BookOpen className="w-4 h-4" /> Open PDF Catalogue
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {groups.slice(0, 5).map((grp) => (
                <Link
                  key={grp.id}
                  to={`/catalogue?page=${encodeURIComponent(grp.page_code)}`}
                  className="bg-aastra-charcoal/80 border border-neutral-800 hover:border-aastra-gold p-5 flex flex-col justify-between transition group"
                >
                  <div>
                    <div className="inline-block px-2.5 py-1 bg-neutral-900 border-l-2 border-aastra-gold text-xs font-mono font-semibold text-aastra-gold mb-3">
                      {grp.page_code}
                    </div>
                    <h3 className="text-lg font-semibold text-white group-hover:text-aastra-gold transition">
                      {grp.title}
                    </h3>
                    <p className="text-xs text-neutral-400 mt-1">
                      {grp.category_name} · {grp.items?.length || 0} models
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-neutral-800 flex items-center justify-between text-[11px] text-neutral-300 group-hover:text-aastra-gold">
                    <span>Preview &amp; PDF</span>
                    <FileDown className="w-3.5 h-3.5" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ================= CLASSIC VALUE PILLARS ================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="border border-aastra-silver/80 dark:border-neutral-800 bg-white dark:bg-[#181818] p-8">
            <Compass className="w-7 h-7 text-aastra-gold mb-4" />
            <h3 className="text-2xl font-semibold text-aastra-black dark:text-white mb-2">
              Architectural Specification
            </h3>
            <p className="text-sm text-aastra-slate dark:text-neutral-400 leading-relaxed">
              Full dimensional drawings, material grades, and finish code matrices prepared for
              architects, contractors, and ironmongery schedules.
            </p>
          </div>
          <div className="border border-aastra-silver/80 dark:border-neutral-800 bg-white dark:bg-[#181818] p-8">
            <ShieldCheck className="w-7 h-7 text-aastra-gold mb-4" />
            <h3 className="text-2xl font-semibold text-aastra-black dark:text-white mb-2">
              10-Year Mechanical Guarantee
            </h3>
            <p className="text-sm text-aastra-slate dark:text-neutral-400 leading-relaxed">
              Every AASTRA architectural hardware piece is backed by our 10-year mechanical
              warranty, ensuring lasting performance in high-traffic environments.
            </p>
          </div>
          <div className="border border-aastra-silver/80 dark:border-neutral-800 bg-white dark:bg-[#181818] p-8">
            <Award className="w-7 h-7 text-aastra-gold mb-4" />
            <h3 className="text-2xl font-semibold text-aastra-black dark:text-white mb-2">
              Bespoke Finishes &amp; Sizes
            </h3>
            <p className="text-sm text-aastra-slate dark:text-neutral-400 leading-relaxed">
              Beyond our core stock finishes, special finishes and custom project dimensions are
              available upon request subject to minimum order quantity.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
