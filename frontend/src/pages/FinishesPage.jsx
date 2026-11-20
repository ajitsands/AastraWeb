import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../api/client';
import ProductCard from '../components/ProductCard';

export default function FinishesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [finishes, setFinishes] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const activeSlug = searchParams.get('finish') || '';

  useEffect(() => {
    api.getFinishes().then((data) => {
      setFinishes(data);
    });
  }, []);

  useEffect(() => {
    setLoading(true);
    api
      .getItems(activeSlug ? { finish: activeSlug } : {})
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [activeSlug]);

  const activeFinish = finishes.find((f) => f.slug === activeSlug);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="border-b border-aastra-silver dark:border-neutral-800 pb-8 mb-10">
        <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-aastra-gold-dark dark:text-aastra-gold mb-2">
          Surface Engineering
        </div>
        <h1 className="text-4xl font-semibold text-aastra-black dark:text-white">
          Architectural Hardware Finishes
        </h1>
        <p className="mt-2 text-sm text-aastra-slate dark:text-neutral-400 max-w-2xl">
          Select a finish below to inspect compatible AASTRA hardware items. Special bespoke
          finishes and custom PVD tones are also available upon project request.
        </p>
      </div>

      {/* Swatch Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4 mb-10">
        {finishes.map((fin) => {
          const isSelected = activeSlug === fin.slug;
          return (
            <button
              key={fin.id}
              type="button"
              onClick={() => setSearchParams(isSelected ? {} : { finish: fin.slug })}
              className={`p-4 border text-center flex flex-col items-center transition ${
                isSelected
                  ? 'border-aastra-gold bg-aastra-gold-tint dark:bg-aastra-gold/15 ring-1 ring-aastra-gold'
                  : 'border-aastra-silver/80 dark:border-neutral-800 bg-white dark:bg-[#181818] hover:border-aastra-gold'
              }`}
            >
              <div
                style={{ background: fin.swatch_gradient || fin.swatch_hex }}
                className="w-14 h-14 rounded-full border-2 border-white dark:border-neutral-700 shadow-md ring-1 ring-black/15"
              />
              <div className="mt-3 text-xs font-semibold text-aastra-black dark:text-white">
                {fin.name}
              </div>
              <div className="text-[10px] font-mono text-aastra-gray">{fin.code}</div>
            </button>
          );
        })}
      </div>

      {/* Selected Finish Description */}
      {activeFinish && (
        <div className="mb-10 p-6 bg-aastra-pearl dark:bg-[#181818] border-l-4 border-aastra-gold flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div
              style={{ background: activeFinish.swatch_gradient || activeFinish.swatch_hex }}
              className="w-12 h-12 rounded-full border border-black/20 shrink-0"
            />
            <div>
              <h2 className="text-2xl font-semibold text-aastra-black dark:text-white">
                {activeFinish.name}{' '}
                <span className="text-xs font-mono text-aastra-gray">({activeFinish.code})</span>
              </h2>
              <p className="text-sm text-aastra-slate dark:text-neutral-400">
                {activeFinish.description}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSearchParams({})}
            className="text-xs uppercase tracking-widest font-semibold text-aastra-gold-dark dark:text-aastra-gold hover:underline shrink-0"
          >
            Show All Finishes
          </button>
        </div>
      )}

      {/* Items */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-72 bg-aastra-pearl dark:bg-neutral-900 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => (
            <ProductCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
