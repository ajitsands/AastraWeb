import React from 'react';
import { Link } from 'react-router-dom';
import GuaranteeSeal from './GuaranteeSeal';

export default function Footer() {
  return (
    <footer className="bg-aastra-black text-neutral-300 border-t-2 border-aastra-gold/70 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
          {/* Brand Column */}
          <div className="md:col-span-4 space-y-4">
            <img
              src="/brand/logo-gold.gif"
              alt="AASTRA Architectural Hardware"
              className="h-8 w-auto object-contain"
            />
            <p className="text-sm text-neutral-400 leading-relaxed">
              AASTRA Architectural Hardware engineers precision door handles, flush pulls, locks,
              hinges, and architectural ironmongery for luxury residential, hospitality, and
              commercial projects.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <GuaranteeSeal size={48} accent="gold" />
              <div className="text-xs">
                <div className="text-white font-semibold tracking-wider uppercase">
                  10-Year Mechanical Guarantee
                </div>
                <div className="text-neutral-400">Tested to architectural ironmongery standards</div>
              </div>
            </div>
          </div>

          {/* Hardware Range */}
          <div className="md:col-span-3 space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-[0.18em] text-aastra-gold">
              Hardware Range
            </h4>
            <ul className="space-y-2 text-sm text-neutral-400">
              <li><Link to="/category/door-handles-on-rose" className="hover:text-white transition">Door Handles on Rose</Link></li>
              <li><Link to="/category/door-handles-on-backplate" className="hover:text-white transition">Door Handles on Backplate</Link></li>
              <li><Link to="/category/flush-pulls" className="hover:text-white transition">Flush Pulls</Link></li>
              <li><Link to="/category/door-stops" className="hover:text-white transition">Door Stops</Link></li>
              <li><Link to="/category/door-viewers" className="hover:text-white transition">Door Viewers</Link></li>
            </ul>
          </div>

          {/* Resources */}
          <div className="md:col-span-2 space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-[0.18em] text-aastra-gold">
              Resources
            </h4>
            <ul className="space-y-2 text-sm text-neutral-400">
              <li><Link to="/finishes" className="hover:text-white transition">Finishes Guide</Link></li>
              <li><Link to="/catalogue" className="hover:text-white transition">PDF Brochures</Link></li>
              <li><Link to="/about" className="hover:text-white transition">About AASTRA</Link></li>
              <li><Link to="/contact" className="hover:text-white transition">Project Enquiries</Link></li>
              <li><Link to="/admin" className="hover:text-white transition">Admin Portal</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div className="md:col-span-3 space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-[0.18em] text-aastra-gold">
              Specification Desk
            </h4>
            <div className="text-sm space-y-1.5 text-neutral-300 leading-relaxed">
              <div className="font-semibold text-white">AASTRA Architectural Hardware</div>
              <div className="text-xs text-neutral-400">
                33 Dunstable Road, Houghton Regis, Dunstable, LU5 5DB, UK
              </div>
              <div className="text-xs pt-1">
                Direct:{' '}
                <a href="tel:+447435620033" className="text-neutral-200 hover:text-aastra-gold">
                  +44 7435 620033
                </a>
              </div>
              <div className="text-xs">
                Email:{' '}
                <a href="mailto:business@aastra.uk" className="text-neutral-200 hover:text-aastra-gold">
                  business@aastra.uk
                </a>
              </div>
              <div className="text-xs">
                Web:{' '}
                <a href="https://aastra.uk" className="text-aastra-gold hover:underline">
                  www.aastra.uk
                </a>
              </div>
            </div>
            <Link
              to="/contact"
              className="inline-block mt-2 px-5 py-2.5 border border-aastra-gold text-aastra-gold hover:bg-aastra-gold hover:text-black text-xs font-semibold uppercase tracking-widest transition"
            >
              Request Specification
            </Link>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-neutral-500">
          <div>© 2026 AASTRA. All Rights Reserved.</div>
          <div className="tracking-widest uppercase">AASTRA Architectural Hardware · UK</div>
        </div>
      </div>
    </footer>
  );
}
