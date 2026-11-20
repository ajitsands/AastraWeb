import React, { useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { Download, Printer, Loader2, Sparkles } from 'lucide-react';
import SpecTableView from './SpecTableView';
import GuaranteeSeal from './GuaranteeSeal';
import { resolveAssetUrl } from '../api/client';

/**
 * AASTRA A4 Architectural Catalogue Page Renderer & PDF Exporter
 * Uniform tight margins (10mm / 38px on all 4 sides), restructured grayscale layout
 * with optional subtle AASTRA brand gold accents.
 */
export default function CataloguePdfPreview({
  group,
  items = [],
  showControls = true,
  scale = 1,
}) {
  const sheetRef = useRef(null);
  const [exporting, setExporting] = useState(false);
  const [brandAccent, setBrandAccent] = useState(true); // Subtle gold hairline & seal tint

  const pageItems = items.length ? items : group?.items || [];
  const isCompact = group?.layout_mode === 'compact' || pageItems.length >= 3;
  const pageCode = group?.page_code || 'AH.8.01';
  const sectionLabel = (group?.section_label || 'ACCESSORIES').toUpperCase();
  const categoryBadge = (group?.category_badge || group?.title || 'HARDWARE').toUpperCase();
  const sideTabLabel = (group?.side_tab_label || 'DOOR HARDWARE').toUpperCase();
  const footerWebsite = group?.footer_website || 'www.aastra.uk';

  const handleDownloadPdf = async () => {
    if (!sheetRef.current || exporting) return;
    setExporting(true);
    try {
      const el = sheetRef.current;
      // Temporarily reset transform if scaled for crisp 1:1 capture
      const prevTransform = el.style.transform;
      el.style.transform = 'none';

      const canvas = await html2canvas(el, {
        scale: 2.5,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#FFFFFF',
        width: 794,
        height: 1123,
        windowWidth: 794,
        windowHeight: 1123,
      });

      el.style.transform = prevTransform;

      const imgData = canvas.toDataURL('image/jpeg', 0.96);
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true,
      });
      pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297, undefined, 'FAST');
      const safeName = `${pageCode} - ${group?.title || 'Catalogue'}`.replace(/[^a-zA-Z0-9._ -]/g, '');
      pdf.save(`${safeName}.pdf`);
    } catch (err) {
      console.error('PDF export failed:', err);
      alert('Could not generate PDF. Please try Print / Save PDF instead.');
    } finally {
      setExporting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const accentColor = brandAccent ? '#C9A227' : '#6E7175';

  return (
    <div className="flex flex-col items-center">
      {showControls && (
        <div className="w-full max-w-[794px] mb-4 flex flex-wrap items-center justify-between gap-3 p-3 bg-white dark:bg-neutral-900 border border-aastra-silver dark:border-neutral-800 rounded-sm shadow-sm">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 bg-aastra-black text-white dark:bg-aastra-gold dark:text-black text-xs font-mono font-semibold tracking-wider">
              {pageCode}
            </span>
            <span className="text-sm font-medium text-aastra-black dark:text-neutral-200">
              {group?.title || 'Catalogue Page'}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setBrandAccent((v) => !v)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border rounded-sm transition ${
                brandAccent
                  ? 'border-aastra-gold bg-aastra-gold-tint text-aastra-black dark:bg-aastra-gold/20 dark:text-aastra-gold-light'
                  : 'border-aastra-silver dark:border-neutral-700 text-aastra-slate dark:text-neutral-300'
              }`}
              title="Toggle subtle brand gold accent on grayscale sheet"
            >
              <Sparkles className="w-3.5 h-3.5" />
              {brandAccent ? 'Grayscale + Gold Trim' : 'Pure Grayscale'}
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-aastra-silver dark:border-neutral-700 bg-white dark:bg-neutral-800 text-aastra-black dark:text-neutral-100 hover:border-aastra-black rounded-sm transition"
            >
              <Printer className="w-3.5 h-3.5" /> Print
            </button>

            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={exporting}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold bg-aastra-black hover:bg-aastra-charcoal dark:bg-aastra-gold dark:hover:bg-aastra-gold-light text-white dark:text-black rounded-sm transition disabled:opacity-60"
            >
              {exporting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Generating PDF...
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" /> Download PDF
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* A4 Sheet Wrapper (794px x 1123px = 210mm x 297mm @ 96dpi) */}
      <div
        className="overflow-x-auto w-full flex justify-center pb-2"
        style={{ minHeight: scale < 1 ? `${1123 * scale + 16}px` : undefined }}
      >
        <div
          ref={sheetRef}
          className="aastra-pdf-sheet bg-white text-[#1A1A1A] shadow-elevated relative flex flex-col justify-between shrink-0"
          style={{
            width: '794px',
            height: '1123px',
            padding: '36px', // Equal ~9.5mm tight margins on Top, Bottom, Left, Right!
            boxSizing: 'border-box',
            transform: scale !== 1 ? `scale(${scale})` : undefined,
            transformOrigin: 'top center',
            fontFamily: 'Inter, Arial, sans-serif',
          }}
        >
          {/* Vertical Right-Edge Chapter Tab — Pure SVG for crisp 90-degree UP orientation in both browser & PDF */}
          <div
            style={{
              position: 'absolute',
              right: '0px',
              top: '132px',
              width: '24px',
              height: '138px',
              zIndex: 10,
              lineHeight: 0,
            }}
          >
            <svg width="24" height="138" viewBox="0 0 24 138" xmlns="http://www.w3.org/2000/svg">
              <rect x="0" y="0" width="24" height="138" fill="#7A7D82" />
              <rect x="0" y="0" width="2.5" height="138" fill={accentColor} />
              <text
                x="13"
                y="69"
                fill="#FFFFFF"
                fontSize="9.2"
                fontWeight="600"
                letterSpacing="1.8"
                fontFamily="Montserrat, Inter, Arial, sans-serif"
                textAnchor="middle"
                dominantBaseline="central"
                transform="rotate(-90 13 69)"
              >
                {sideTabLabel}
              </text>
            </svg>
          </div>

          {/* ================= HEADER ================= */}
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'space-between',
                paddingBottom: '8px',
                borderBottom: `1.5px solid #2C2C2C`,
              }}
            >
              <div>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    letterSpacing: '1.8px',
                    color: '#161616',
                    fontFamily: 'Montserrat, Inter, Arial, sans-serif',
                  }}
                >
                  AASTRA
                </span>{' '}
                <span
                  style={{
                    fontSize: '10.5px',
                    fontWeight: 400,
                    letterSpacing: '1.6px',
                    color: '#555555',
                    fontFamily: 'Montserrat, Inter, Arial, sans-serif',
                  }}
                >
                  ARCHITECTURAL HARDWARE
                </span>
              </div>
              <img
                src="/brand/logo-gray.gif"
                alt="AASTRA"
                crossOrigin="anonymous"
                style={{ height: '24px', objectFit: 'contain' }}
              />
            </div>

            {/* Thin gold/gray accent bar + Section Label + Category Badge */}
            <div
              style={{
                height: '2px',
                width: '100%',
                backgroundColor: accentColor,
                opacity: brandAccent ? 0.85 : 0.4,
                marginTop: '2px',
              }}
            />

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginTop: '10px',
                marginBottom: isCompact ? '10px' : '14px',
              }}
            >
              <div
                style={{
                  backgroundColor: '#6F7277',
                  color: '#FFFFFF',
                  height: '30px',
                  padding: '0 20px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12.5px',
                  fontWeight: 700,
                  letterSpacing: '1.8px',
                  lineHeight: 1,
                  fontFamily: 'Montserrat, Inter, Arial, sans-serif',
                  borderLeft: `4px solid ${accentColor}`,
                  paddingBottom: '2px',
                }}
              >
                {categoryBadge}
              </div>

              <div
                style={{
                  backgroundColor: '#919499',
                  color: '#FFFFFF',
                  height: '24px',
                  padding: '0 16px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '9.5px',
                  fontWeight: 600,
                  letterSpacing: '1.8px',
                  lineHeight: 1,
                  fontFamily: 'Montserrat, Inter, Arial, sans-serif',
                  paddingBottom: '2px',
                }}
              >
                {sectionLabel}
              </div>
            </div>
          </div>

          {/* ================= BODY ITEMS ================= */}
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-start',
              gap: isCompact ? '14px' : '22px',
              overflow: 'hidden',
              paddingRight: '4px',
            }}
          >
            {pageItems.length === 0 ? (
              <div
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#888',
                  fontSize: '12px',
                  border: '1px dashed #CCC',
                }}
              >
                No items assigned to this catalogue page yet. Add items from the Admin Panel.
              </div>
            ) : (
              pageItems.map((item, idx) => {
                const specLines = (item.specifications || '')
                  .split('\n')
                  .map((l) => l.trim())
                  .filter(Boolean);
                const imgs = (item.images || []).slice(0, 3);

                return (
                  <div
                    key={item.id || idx}
                    style={{
                      border: '1px solid #DCDCDC',
                      borderTop: `2px solid #4A4A4A`,
                      padding: isCompact ? '10px 12px' : '13px 15px',
                      backgroundColor: '#FFFFFF',
                    }}
                  >
                    {/* Top Row: Specs on left + 1-3 Images/Drawings on right */}
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        gap: '14px',
                        marginBottom: isCompact ? '8px' : '11px',
                      }}
                    >
                      {/* Left: Model & Specs */}
                      <div style={{ flex: '0 0 41%', minWidth: 0 }}>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'baseline',
                            gap: '8px',
                            marginBottom: '4px',
                          }}
                        >
                          <span
                            style={{
                              fontSize: isCompact ? '11px' : '12px',
                              fontWeight: 700,
                              color: '#161616',
                              letterSpacing: '0.4px',
                            }}
                          >
                            Model – {item.code}
                          </span>
                        </div>
                        <div
                          style={{
                            fontSize: '9px',
                            fontWeight: 700,
                            letterSpacing: '1.2px',
                            color: '#666666',
                            textTransform: 'uppercase',
                            marginBottom: '4px',
                            borderBottom: '1px solid #E5E5E5',
                            paddingBottom: '2px',
                          }}
                        >
                          SPECIFICATION
                        </div>
                        <ul
                          style={{
                            margin: 0,
                            paddingLeft: '13px',
                            fontSize: isCompact ? '9.2px' : '10px',
                            lineHeight: isCompact ? 1.38 : 1.48,
                            color: '#2E2E2E',
                          }}
                        >
                          {specLines.map((line, li) => (
                            <li key={li} style={{ marginBottom: '1.5px' }}>
                              {line}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Right: 1 to 3 Product & Technical Drawing Images */}
                      <div
                        style={{
                          flex: 1,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'flex-end',
                          gap: '10px',
                        }}
                      >
                        {imgs.map((imgObj, imIdx) => (
                          <div
                            key={imIdx}
                            style={{
                              flex: imgs.length === 1 ? '0 0 auto' : '1 1 0',
                              maxWidth: imgs.length === 1 ? '210px' : imgs.length === 2 ? '185px' : '130px',
                              height: isCompact ? '92px' : '118px',
                              border: '1px solid #ECECEC',
                              backgroundColor: '#FFFFFF',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              padding: '4px',
                              overflow: 'hidden',
                            }}
                          >
                            <img
                              src={resolveAssetUrl(imgObj.url)}
                              alt={imgObj.caption || item.name}
                              crossOrigin="anonymous"
                              style={{
                                maxWidth: '100%',
                                maxHeight: '100%',
                                objectFit: 'contain',
                              }}
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Specification / Finishes Table */}
                    {item.spec_table && (
                      <div style={{ marginTop: '4px' }}>
                        <SpecTableView table={item.spec_table} mode="pdf" compact={isCompact} />
                      </div>
                    )}

                    {/* Footnote */}
                    {item.footnote && (
                      <div
                        style={{
                          marginTop: '5px',
                          fontSize: '8px',
                          fontStyle: 'italic',
                          color: '#666666',
                        }}
                      >
                        {item.footnote}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* ================= FOOTER ================= */}
          <div style={{ marginTop: '12px' }}>
            <div
              style={{
                borderTop: '1.5px solid #2C2C2C',
                paddingTop: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
              }}
            >
              {/* Left: AH.Chapter.Page Badge (Clean Sans-Serif, Vertically & Horizontally Centered) */}
              <div
                style={{
                  backgroundColor: '#7A7D82',
                  color: '#FFFFFF',
                  height: '34px',
                  minWidth: '108px',
                  padding: '0 18px 2px 18px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '14px',
                  fontWeight: 700,
                  letterSpacing: '1.6px',
                  lineHeight: 1,
                  fontFamily: 'Montserrat, Inter, Arial, sans-serif',
                  borderLeft: `4px solid ${accentColor}`,
                }}
              >
                {pageCode}
              </div>

              {/* Center: Company Contact Details */}
              <div
                style={{
                  flex: 1,
                  textAlign: 'center',
                  fontSize: '7.6px',
                  lineHeight: 1.45,
                  color: '#555555',
                  fontFamily: 'Inter, Arial, sans-serif',
                }}
              >
                <div style={{ fontWeight: 700, color: '#222222', letterSpacing: '0.5px' }}>
                  AASTRA Architectural Hardware
                </div>
                <div>33 Dunstable Road, Houghton Regis, Dunstable, LU5 5DB, UK</div>
                <div>Direct: +44 7435 620033 · Email: business@aastra.uk</div>
              </div>

              {/* Right: 10-Year Mechanical Guarantee Seal + Website */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {group?.show_guarantee_seal !== 0 && (
                  <GuaranteeSeal size={44} accent={brandAccent ? 'gold' : 'grayscale'} />
                )}
                <div style={{ textAlign: 'right' }}>
                  <div
                    style={{
                      fontSize: '11.5px',
                      fontWeight: 700,
                      color: '#222222',
                      letterSpacing: '0.5px',
                      fontFamily: 'Montserrat, Inter, Arial, sans-serif',
                    }}
                  >
                    {footerWebsite}
                  </div>
                  <div
                    style={{
                      fontSize: '7px',
                      color: '#777777',
                      letterSpacing: '0.8px',
                    }}
                  >
                    © 2026 AASTRA. All Rights Reserved.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
