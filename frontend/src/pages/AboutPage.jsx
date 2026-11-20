import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Layers, Compass, Award } from 'lucide-react';
import GuaranteeSeal from '../components/GuaranteeSeal';

export default function AboutPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14 space-y-14">
      <div className="border-b border-aastra-silver dark:border-neutral-800 pb-10">
        <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-aastra-gold-dark dark:text-aastra-gold mb-2">
          Our Craft &amp; Heritage
        </div>
        <h1 className="text-4xl sm:text-5xl font-semibold text-aastra-black dark:text-white max-w-3xl leading-tight">
          AASTRA Architectural Hardware
        </h1>
        <p className="mt-4 text-base text-aastra-slate dark:text-neutral-400 max-w-3xl leading-relaxed">
          AASTRA delivers precision-engineered architectural door hardware designed for longevity,
          tactile excellence, and clean contemporary elegance. From SS304 stainless steel flush
          pulls and floor-mounted door stops to optical brass door viewers and designer lever sets,
          every component is manufactured to exacting mechanical tolerances.
        </p>
      </div>

      {/* 10-Year Guarantee Highlight */}
      <div className="bg-aastra-pearl dark:bg-[#181818] border border-aastra-silver dark:border-neutral-800 p-8 sm:p-10 flex flex-col md:flex-row items-center gap-8">
        <GuaranteeSeal size={110} accent="gold" className="shrink-0" />
        <div className="space-y-3">
          <h2 className="text-3xl font-semibold text-aastra-black dark:text-white">
            10-Year Mechanical Guarantee
          </h2>
          <p className="text-sm text-aastra-slate dark:text-neutral-300 leading-relaxed">
            Every AASTRA architectural hardware range carries our 10-Year Mechanical Guarantee,
            reflecting rigorous material selection — including marine-grade SS304 stainless steel,
            solid forged brass, and durable PVD / architectural finishes.
          </p>
          <div className="pt-2">
            <Link
              to="/catalogue"
              className="inline-block px-6 py-2.5 bg-aastra-black dark:bg-aastra-gold text-white dark:text-black text-xs font-semibold uppercase tracking-widest hover:opacity-90 transition"
            >
              Browse Technical PDFs
            </Link>
          </div>
        </div>
      </div>

      {/* Standards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          {
            icon: Compass,
            title: 'AH Chapter System',
            desc: 'All AASTRA technical sheets follow our structured AH.Chapter.Page numbering system for effortless architectural door scheduling.',
          },
          {
            icon: Layers,
            title: 'Coordinated Finishes',
            desc: 'Maintain visual continuity across every door with matching Satin SS, Polished SS, Antique Brass, Satin Brass, and Matt Black suites.',
          },
          {
            icon: Award,
            title: 'Bespoke Project Support',
            desc: 'Special finishes, custom lengths, and tailored specifications are available on request subject to minimum order quantity.',
          },
        ].map(({ icon: Icon, title, desc }) => (
          <div
            key={title}
            className="bg-white dark:bg-[#181818] border border-aastra-silver/80 dark:border-neutral-800 p-6"
          >
            <Icon className="w-6 h-6 text-aastra-gold mb-3" />
            <h3 className="text-xl font-semibold text-aastra-black dark:text-white mb-2">{title}</h3>
            <p className="text-sm text-aastra-slate dark:text-neutral-400 leading-relaxed">{desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
