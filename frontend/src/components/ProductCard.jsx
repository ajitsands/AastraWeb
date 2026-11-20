import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { resolveAssetUrl } from '../api/client';

export default function ProductCard({ item }) {
  const primaryImage = item.images?.[0]?.url;

  return (
    <Link
      to={`/item/${item.slug}`}
      className="group bg-white dark:bg-[#181818] border border-aastra-silver/80 dark:border-neutral-800 hover:border-aastra-gold transition-all duration-300 flex flex-col overflow-hidden shadow-classic"
    >
      {/* Image Frame */}
      <div className="aspect-[4/3] bg-white p-6 flex items-center justify-center relative overflow-hidden border-b border-aastra-pearl dark:border-neutral-800">
        {primaryImage ? (
          <img
            src={resolveAssetUrl(primaryImage)}
            alt={item.name}
            className="max-h-full max-w-full object-contain transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="text-xs uppercase tracking-widest text-aastra-gray">No Image</div>
        )}
        <span className="absolute top-3 left-3 px-2.5 py-0.5 bg-aastra-black/90 text-white text-[10px] font-mono tracking-wider">
          {item.code}
        </span>
      </div>

      {/* Details */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          <div className="text-[10px] uppercase tracking-[0.16em] text-aastra-gold font-semibold mb-1">
            {item.category_name}
          </div>
          <h3 className="text-xl font-semibold text-aastra-black dark:text-white leading-snug group-hover:text-aastra-gold transition">
            {item.name}
          </h3>
          {item.subtitle && (
            <p className="mt-1.5 text-xs text-aastra-slate dark:text-neutral-400 line-clamp-2">
              {item.subtitle}
            </p>
          )}
        </div>

        <div className="mt-4 pt-3 border-t border-aastra-pearl dark:border-neutral-800 flex items-center justify-between">
          {/* Finish Swatches */}
          <div className="flex items-center gap-1.5">
            {(item.finishes || []).slice(0, 6).map((f) => (
              <span
                key={f.id}
                title={f.name}
                style={{ background: f.swatch_gradient || f.swatch_hex }}
                className="w-4 h-4 rounded-full border border-black/20 dark:border-white/20 shadow-inner"
              />
            ))}
          </div>

          <span className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-aastra-black dark:text-aastra-gold group-hover:translate-x-0.5 transition">
            Details <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}
