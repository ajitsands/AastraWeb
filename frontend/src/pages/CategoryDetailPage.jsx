import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, FileDown, Eye } from 'lucide-react';
import { api } from '../api/client';
import ProductCard from '../components/ProductCard';
import CataloguePdfPreview from '../components/CataloguePdfPreview';

export default function CategoryDetailPage() {
  const { slug } = useParams();
  const [category, setCategory] = useState(null);
  const [activeSubSlug, setActiveSubSlug] = useState('');
  const [activeGroup, setActiveGroup] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    setActiveSubSlug('');
    api
      .getCategory(slug)
      .then((data) => {
        setCategory(data);
        setActiveGroup(data.groups?.[0] || null);
      })
      .catch(() => setCategory(null))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center text-sm text-aastra-gray">
        Loading category...
      </div>
    );
  }

  if (!category) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-semibold mb-3">Category Not Found</h2>
        <Link to="/categories" className="text-aastra-gold hover:underline text-sm">
          ← Return to Hardware Range
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      {/* Breadcrumb & Header */}
      <div>
        <Link
          to="/categories"
          className="inline-flex items-center gap-1.5 text-xs uppercase tracking-widest text-aastra-gray hover:text-aastra-gold mb-4"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Hardware Range
        </Link>

        <div className="border-b border-aastra-silver dark:border-neutral-800 pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 bg-aastra-black text-white dark:bg-aastra-gold dark:text-black text-[10px] font-mono uppercase tracking-wider">
                Chapter {category.chapter_number}
              </span>
              <span className="text-[11px] uppercase tracking-[0.2em] text-aastra-gold-dark dark:text-aastra-gold font-semibold">
                {category.section_label}
              </span>
            </div>
            <h1 className="text-4xl font-semibold text-aastra-black dark:text-white">
              {category.name}
            </h1>
            {category.description && (
              <p className="mt-2 text-sm text-aastra-slate dark:text-neutral-400 max-w-3xl">
                {category.description}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Category Products + Sub Category Pills */}
      <section>
        {category.sub_categories?.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 mb-6">
            <button
              type="button"
              onClick={() => setActiveSubSlug('')}
              className={`px-3.5 py-1.5 text-xs font-medium border transition ${
                !activeSubSlug
                  ? 'bg-aastra-black text-white dark:bg-aastra-gold dark:text-black border-aastra-black dark:border-aastra-gold'
                  : 'bg-white dark:bg-[#181818] border-aastra-silver dark:border-neutral-700 text-aastra-slate dark:text-neutral-300 hover:border-aastra-gold'
              }`}
            >
              All {category.name}
            </button>
            {category.sub_categories.map((sub) => (
              <button
                key={sub.id}
                type="button"
                onClick={() => setActiveSubSlug(sub.slug)}
                className={`px-3.5 py-1.5 text-xs font-medium border transition ${
                  activeSubSlug === sub.slug
                    ? 'bg-aastra-black text-white dark:bg-aastra-gold dark:text-black border-aastra-black dark:border-aastra-gold'
                    : 'bg-white dark:bg-[#181818] border-aastra-silver dark:border-neutral-700 text-aastra-slate dark:text-neutral-300 hover:border-aastra-gold'
                }`}
              >
                {sub.name}
              </button>
            ))}
          </div>
        )}

        {(() => {
          const visibleItems = activeSubSlug
            ? (category.items || []).filter((it) => it.sub_category_slug === activeSubSlug)
            : category.items || [];
          return (
            <>
              <h2 className="text-2xl font-semibold text-aastra-black dark:text-white mb-6">
                Products ({visibleItems.length})
              </h2>
              {visibleItems.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {visibleItems.map((item) => (
                    <ProductCard key={item.id} item={item} />
                  ))}
                </div>
              ) : (
                <div className="p-8 border border-aastra-silver dark:border-neutral-800 text-sm text-aastra-gray bg-white dark:bg-[#181818]">
                  No items added to this sub-category yet.
                </div>
              )}
            </>
          );
        })()}
      </section>

      {/* PDF Catalogue Pages for this Category */}
      {category.groups?.length > 0 && (
        <section className="pt-8 border-t border-aastra-silver dark:border-neutral-800">
          <div className="mb-6">
            <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-aastra-gold-dark dark:text-aastra-gold mb-1">
              Downloadable Brochure Pages
            </div>
            <h2 className="text-2xl sm:text-3xl font-semibold text-aastra-black dark:text-white">
              {category.name} — PDF Catalogue Sheets
            </h2>
          </div>

          {/* Page Tabs */}
          <div className="flex flex-wrap gap-2 mb-6">
            {category.groups.map((grp) => (
              <button
                key={grp.id}
                type="button"
                onClick={() => setActiveGroup(grp)}
                className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-medium border transition ${
                  activeGroup?.id === grp.id
                    ? 'bg-aastra-black text-white dark:bg-aastra-gold dark:text-black border-aastra-black dark:border-aastra-gold'
                    : 'bg-white dark:bg-[#181818] border-aastra-silver dark:border-neutral-700 text-aastra-slate dark:text-neutral-300 hover:border-aastra-gold'
                }`}
              >
                <span className="font-mono font-bold">{grp.page_code}</span>
                <span>{grp.title}</span>
                <FileDown className="w-3.5 h-3.5 opacity-80" />
              </button>
            ))}
          </div>

          {activeGroup && (
            <div className="bg-aastra-pearl dark:bg-[#121212] border border-aastra-silver/80 dark:border-neutral-800 p-4 sm:p-8">
              <CataloguePdfPreview group={activeGroup} />
            </div>
          )}
        </section>
      )}
    </div>
  );
}
