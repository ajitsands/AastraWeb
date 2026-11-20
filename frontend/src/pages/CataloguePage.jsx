import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FileText, Layers } from 'lucide-react';
import { api } from '../api/client';
import CataloguePdfPreview from '../components/CataloguePdfPreview';

export default function CataloguePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [groups, setGroups] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);

  const requestedPage = searchParams.get('page');

  useEffect(() => {
    api
      .getGroups()
      .then((data) => {
        setGroups(data);
        if (requestedPage) {
          const match = data.find((g) => g.page_code === requestedPage);
          setSelected(match || data[0] || null);
        } else {
          setSelected(data[0] || null);
        }
      })
      .catch(() => setGroups([]))
      .finally(() => setLoading(false));
  }, [requestedPage]);

  const handleSelect = (grp) => {
    setSelected(grp);
    setSearchParams({ page: grp.page_code });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="border-b border-aastra-silver dark:border-neutral-800 pb-8 mb-8">
        <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-aastra-gold-dark dark:text-aastra-gold mb-2">
          AASTRA Architectural Hardware — AH Series
        </div>
        <h1 className="text-4xl font-semibold text-aastra-black dark:text-white">
          PDF Brochure &amp; Catalogue Generator
        </h1>
        <p className="mt-2 text-sm text-aastra-slate dark:text-neutral-400 max-w-3xl">
          Select any chapter page below to preview the restructured A4 architectural datasheet
          (equal compact margins, grayscale precision layout, 10-Year Mechanical Guarantee seal) and
          download it instantly as a high-resolution PDF.
        </p>
      </div>

      {loading ? (
        <div className="py-16 text-center text-sm text-aastra-gray">
          Loading catalogue pages...
        </div>
      ) : groups.length === 0 ? (
        <div className="p-12 border border-aastra-silver dark:border-neutral-800 text-center text-sm text-aastra-gray">
          No catalogue page groups have been created yet. Create them in the Admin Panel.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Page Index */}
          <aside className="lg:col-span-4 space-y-2">
            <div className="text-xs font-semibold uppercase tracking-widest text-aastra-slate dark:text-neutral-400 mb-3 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-aastra-gold" /> Catalogue Pages ({groups.length})
            </div>

            {groups.map((grp) => {
              const active = selected?.id === grp.id;
              return (
                <button
                  key={grp.id}
                  type="button"
                  onClick={() => handleSelect(grp)}
                  className={`w-full text-left p-4 border transition flex items-start justify-between gap-3 ${
                    active
                      ? 'bg-aastra-black text-white dark:bg-aastra-gold dark:text-black border-aastra-black dark:border-aastra-gold shadow-classic'
                      : 'bg-white dark:bg-[#181818] border-aastra-silver/80 dark:border-neutral-800 hover:border-aastra-gold'
                  }`}
                >
                  <div>
                    <div
                      className={`text-xs font-mono font-bold mb-1 ${
                        active ? 'text-aastra-gold dark:text-black' : 'text-aastra-gold-dark dark:text-aastra-gold'
                      }`}
                    >
                      {grp.page_code}
                    </div>
                    <div className="font-semibold text-sm">{grp.title}</div>
                    <div
                      className={`text-xs mt-0.5 ${
                        active ? 'text-neutral-300 dark:text-black/75' : 'text-aastra-gray'
                      }`}
                    >
                      {grp.category_name} · {grp.items?.length || 0} item(s)
                    </div>
                  </div>
                  <FileText className="w-4 h-4 shrink-0 mt-1 opacity-70" />
                </button>
              );
            })}
          </aside>

          {/* Right Live A4 Preview & Export */}
          <div className="lg:col-span-8 bg-aastra-pearl dark:bg-[#121212] border border-aastra-silver/80 dark:border-neutral-800 p-4 sm:p-6">
            {selected && <CataloguePdfPreview group={selected} />}
          </div>
        </div>
      )}
    </div>
  );
}
