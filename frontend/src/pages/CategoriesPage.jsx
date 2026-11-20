import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal, ArrowRight } from 'lucide-react';
import { api } from '../api/client';
import ProductCard from '../components/ProductCard';

export default function CategoriesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [categories, setCategories] = useState([]);
  const [finishes, setFinishes] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const selectedCategory = searchParams.get('category') || '';
  const selectedFinish = searchParams.get('finish') || '';
  const searchQuery = searchParams.get('q') || '';
  const [inputQuery, setInputQuery] = useState(searchQuery);

  useEffect(() => {
    Promise.all([api.getCategories(), api.getFinishes()])
      .then(([cats, fins]) => {
        setCategories(cats);
        setFinishes(fins);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    api
      .getItems({
        category: selectedCategory,
        finish: selectedFinish,
        q: searchQuery,
      })
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [selectedCategory, selectedFinish, searchQuery]);

  const updateParam = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    setSearchParams(next);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    updateParam('q', inputQuery.trim());
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="border-b border-aastra-silver dark:border-neutral-800 pb-8 mb-8">
        <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-aastra-gold-dark dark:text-aastra-gold mb-2">
          AASTRA Product Directory
        </div>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-4xl font-semibold text-aastra-black dark:text-white">
              Architectural Hardware Range
            </h1>
            <p className="mt-2 text-sm text-aastra-slate dark:text-neutral-400">
              Browse by chapter category, filter by finish, or search by model code.
            </p>
          </div>

          <form onSubmit={handleSearch} className="flex w-full md:w-96">
            <input
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              placeholder="Search code or name (e.g. AAE.671)..."
              className="flex-1 px-3.5 py-2.5 text-sm bg-white dark:bg-neutral-900 border border-aastra-silver dark:border-neutral-700 focus:outline-none focus:border-aastra-gold"
            />
            <button
              type="submit"
              className="px-4 bg-aastra-black dark:bg-aastra-gold text-white dark:text-black flex items-center justify-center"
            >
              <Search className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Sidebar Filters */}
        <aside className="lg:col-span-3 space-y-6">
          <div className="bg-white dark:bg-[#181818] border border-aastra-silver/80 dark:border-neutral-800 p-5">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-aastra-pearl dark:border-neutral-800">
              <span className="text-xs font-semibold uppercase tracking-widest flex items-center gap-1.5">
                <SlidersHorizontal className="w-3.5 h-3.5 text-aastra-gold" /> Categories
              </span>
              {(selectedCategory || selectedFinish || searchQuery) && (
                <button
                  type="button"
                  onClick={() => {
                    setInputQuery('');
                    setSearchParams({});
                  }}
                  className="text-[11px] text-aastra-gold-dark dark:text-aastra-gold hover:underline"
                >
                  Reset
                </button>
              )}
            </div>

            <ul className="space-y-1.5 text-sm">
              <li>
                <button
                  type="button"
                  onClick={() => updateParam('category', '')}
                  className={`w-full text-left px-3 py-2 flex items-center justify-between transition ${
                    !selectedCategory
                      ? 'bg-aastra-black text-white dark:bg-aastra-gold dark:text-black font-medium'
                      : 'text-aastra-slate dark:text-neutral-300 hover:bg-aastra-pearl dark:hover:bg-neutral-800'
                  }`}
                >
                  <span>All Categories</span>
                </button>
              </li>
              {categories.map((c) => (
                <li key={c.id} className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => updateParam('category', c.slug)}
                    className={`flex-1 text-left px-3 py-2 flex items-center justify-between transition text-xs ${
                      selectedCategory === c.slug
                        ? 'bg-aastra-black text-white dark:bg-aastra-gold dark:text-black font-medium'
                        : 'text-aastra-slate dark:text-neutral-300 hover:bg-aastra-pearl dark:hover:bg-neutral-800'
                    }`}
                  >
                    <span>{c.name}</span>
                    <span className="font-mono text-[10px] opacity-70">{c.item_count || 0}</span>
                  </button>
                  <Link
                    to={`/category/${c.slug}`}
                    title="Open Category & PDF Pages"
                    className="p-2 text-aastra-gray hover:text-aastra-gold"
                  >
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Finishes Filter */}
          <div className="bg-white dark:bg-[#181818] border border-aastra-silver/80 dark:border-neutral-800 p-5">
            <div className="text-xs font-semibold uppercase tracking-widest mb-4 pb-2 border-b border-aastra-pearl dark:border-neutral-800">
              Filter by Finish
            </div>
            <div className="flex flex-wrap gap-2">
              {finishes.map((f) => {
                const active = selectedFinish === f.slug;
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => updateParam('finish', active ? '' : f.slug)}
                    className={`inline-flex items-center gap-2 px-2.5 py-1.5 text-xs border transition ${
                      active
                        ? 'border-aastra-gold bg-aastra-gold-tint dark:bg-aastra-gold/20 text-aastra-black dark:text-aastra-gold-light font-semibold'
                        : 'border-aastra-silver/70 dark:border-neutral-700 text-aastra-slate dark:text-neutral-300 hover:border-aastra-gold'
                    }`}
                  >
                    <span
                      style={{ background: f.swatch_gradient || f.swatch_hex }}
                      className="w-3.5 h-3.5 rounded-full border border-black/20"
                    />
                    {f.name}
                  </button>
                );
              })}
            </div>
          </div>
        </aside>

        {/* Product Grid */}
        <div className="lg:col-span-9">
          <div className="mb-4 text-xs text-aastra-slate dark:text-neutral-400 flex items-center justify-between">
            <span>
              Showing <strong className="text-aastra-black dark:text-white">{items.length}</strong>{' '}
              hardware items
            </span>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-72 bg-aastra-pearl dark:bg-neutral-900 animate-pulse" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="bg-white dark:bg-[#181818] border border-aastra-silver dark:border-neutral-800 p-12 text-center">
              <p className="text-aastra-slate dark:text-neutral-400">
                No hardware items match your current filter.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {items.map((item) => (
                <ProductCard key={item.id} item={item} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
