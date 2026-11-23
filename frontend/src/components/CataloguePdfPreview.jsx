import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { Download, Printer, Loader2, Sparkles, Layers } from 'lucide-react';
import SpecTableView from './SpecTableView';
import GuaranteeSeal from './GuaranteeSeal';
import { api, resolveAssetUrl } from '../api/client';

/**
 * Compute sequential page code for multi-page groups:
 * e.g. "AH.5.01" + pageIndex 1 => "AH.5.02" (preserving leading zero padding)
 */
function computePageCode(baseCode, pageIdx) {
  if (pageIdx === 0) return baseCode;
  const match = String(baseCode).match(/^(.*?)(\d+)$/);
  if (!match) return `${baseCode}.${pageIdx + 1}`;
  const [, prefix, numStr] = match;
  const nextNum = parseInt(numStr, 10) + pageIdx;
  const padded = String(nextNum).padStart(numStr.length, '0');
  return `${prefix}${padded}`;
}

/**
 * Helper sub-components for the 6 AASTRA PDF Specification Templates
 */
function BadgesStrip({ badges, accentColor }) {
  if (!badges) return null;
  const { fire_rated, cad_available, ce_certified } = badges;
  if (!fire_rated && !cad_available && !ce_certified) return null;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px', flexWrap: 'wrap' }}>
      {fire_rated && (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '8.5px', fontWeight: 600, color: '#222' }}>
          <svg width="16" height="16" viewBox="0 0 16 16">
            <rect x="0.5" y="0.5" width="15" height="15" fill="#FFFFFF" stroke="#9B1C1C" strokeWidth="1.4" />
            <text x="8" y="8.5" textAnchor="middle" dominantBaseline="central" fill="#9B1C1C" fontSize="10" fontWeight="800" fontFamily="Montserrat, Arial, sans-serif">F</text>
          </svg>
          Tested for fire resistant &amp; smoke control doors
        </span>
      )}
      {cad_available && (
        <svg width="28" height="16" viewBox="0 0 28 16">
          <rect x="0.5" y="0.5" width="27" height="15" fill="#FFFFFF" stroke="#333333" strokeWidth="1" />
          <text x="14" y="8.5" textAnchor="middle" dominantBaseline="central" fill="#161616" fontSize="7.5" fontWeight="700" fontFamily="Montserrat, Arial, sans-serif">CAD</text>
        </svg>
      )}
      {ce_certified && (
        <svg width="26" height="16" viewBox="0 0 26 16">
          <rect x="0.5" y="0.5" width="25" height="15" fill="#FFFFFF" stroke={accentColor} strokeWidth="1.2" />
          <text x="13" y="8.5" textAnchor="middle" dominantBaseline="central" fill="#161616" fontSize="7.5" fontWeight="700" fontFamily="Montserrat, Arial, sans-serif">EN</text>
        </svg>
      )}
    </div>
  );
}

function KeyValueBox({ specs = [], enClass = '', compact = false }) {
  const enCodes = (enClass || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  if (!specs.length && !enCodes.length) return null;

  return (
    <div
      style={{
        backgroundColor: '#F2F2F2',
        borderLeft: '2.5px solid #4A4A4A',
        padding: compact ? '6px 8px' : '8px 10px',
        marginBottom: compact ? '6px' : '8px',
        fontSize: compact ? '8.3px' : '9px',
        lineHeight: 1.38,
      }}
    >
      {specs.map((kv, i) => (
        <div key={i} style={{ display: 'flex', gap: '6px', marginBottom: '2px' }}>
          <div style={{ flex: '0 0 36%', fontWeight: 600, color: '#333333' }}>
            &rsaquo; {kv.label}:
          </div>
          <div style={{ flex: 1, color: '#1A1A1A' }}>{kv.value}</div>
        </div>
      ))}
      {enCodes.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
          <div style={{ flex: '0 0 36%', fontWeight: 600, color: '#333333' }}>&rsaquo; Class:</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0px' }}>
            {enCodes.map((code, idx) => (
              <span
                key={idx}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minWidth: '17px',
                  height: '16px',
                  padding: '0 3px',
                  border: '1px solid #333333',
                  marginLeft: idx === 0 ? 0 : '-1px',
                  backgroundColor: '#FFFFFF',
                  fontSize: '8px',
                  fontWeight: 700,
                  fontFamily: 'Inter, Arial, sans-serif',
                }}
              >
                {code}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Maximum safe content height inside one A4 sheet (1123px - 72px padding - 96px header - 68px footer - safety buffer)
const MAX_BODY_HEIGHT_PX = 868;

/**
 * AASTRA A4 Architectural Catalogue Page Renderer & Multi-Page PDF Exporter
 * Automatically paginates overflow items onto Page 2, Page 3, etc. with sequential AH.Chapter.Page numbering!
 */
export default function CataloguePdfPreview({
  group,
  items = [],
  showControls = true,
  scale = 1,
}) {
  const sheetRefs = useRef([]);
  const containerRef = useRef(null);
  const measureRef = useRef(null);
  const [exporting, setExporting] = useState(false);
  const [brandAccent, setBrandAccent] = useState(true);
  const [responsiveScale, setResponsiveScale] = useState(scale);
  const [measureTick, setMeasureTick] = useState(0);
  const [pages, setPages] = useState([]);

  const pageItems = items.length ? items : group?.items || [];
  const activeTemplate =
    (group?.pdf_template && group.pdf_template !== 'standard'
      ? group.pdf_template
      : pageItems[0]?.pdf_template) || 'standard';

  const isCompact = group?.layout_mode === 'compact';
  const itemGap = isCompact ? 14 : 18;
  const basePageCode = group?.page_code || 'AH.8.01';
  const sectionLabel = (group?.section_label || 'ACCESSORIES').toUpperCase();
  const categoryBadge = (group?.category_badge || group?.title || 'HARDWARE').toUpperCase();
  const sideTabLabel = (group?.side_tab_label || 'DOOR HARDWARE').toUpperCase();
  const footerWebsite = group?.footer_website || 'www.aastra.uk';
  const accentColor = brandAccent ? '#C9A227' : '#6E7175';

  // Responsive mobile/tablet scaling
  useEffect(() => {
    const updateScale = () => {
      if (!containerRef.current) return;
      const availWidth = containerRef.current.clientWidth;
      if (availWidth > 0) {
        setResponsiveScale(Math.min(scale, availWidth / 794));
      }
    };
    updateScale();
    const ro = new ResizeObserver(updateScale);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [scale]);

  // Auto-paginate items based on real measured DOM heights so nothing is ever clipped!
  useLayoutEffect(() => {
    if (pageItems.length === 0) {
      setPages([[]]);
      return;
    }

    // Full-page editorial templates always get 1 item per A4 page
    if (activeTemplate === 'finish_gallery' || activeTemplate === 'hero_catalog') {
      setPages(pageItems.map((it) => [it]));
      return;
    }

    const container = measureRef.current;
    if (!container) {
      setPages([pageItems]);
      return;
    }

    const nodes = Array.from(container.children);
    if (nodes.length === 0) {
      setPages([pageItems]);
      return;
    }

    if (activeTemplate === 'two_column_split') {
      // Pack 2 items per row, then stack rows onto pages
      const resultPages = [];
      let currentPage = [];
      let currentHeight = 0;

      for (let i = 0; i < pageItems.length; i += 2) {
        const h1 = nodes[i]?.getBoundingClientRect().height || 300;
        const h2 = nodes[i + 1]?.getBoundingClientRect().height || 0;
        const rowHeight = Math.max(h1, h2);
        const addedHeight = currentPage.length === 0 ? rowHeight : rowHeight + 16;

        if (currentPage.length > 0 && currentHeight + addedHeight > MAX_BODY_HEIGHT_PX) {
          resultPages.push(currentPage);
          currentPage = pageItems.slice(i, i + 2);
          currentHeight = rowHeight;
        } else {
          currentPage.push(...pageItems.slice(i, i + 2));
          currentHeight += addedHeight;
        }
      }
      if (currentPage.length > 0) resultPages.push(currentPage);
      setPages(resultPages);
      return;
    }

    // Standard, technical_grid, tall_pull_handle: stack items vertically and break to new page automatically
    const resultPages = [];
    let currentPage = [];
    let currentHeight = 0;

    pageItems.forEach((item, idx) => {
      const h = nodes[idx]?.getBoundingClientRect().height || 320;
      const added = currentPage.length === 0 ? h : h + itemGap;

      if (currentPage.length > 0 && currentHeight + added > MAX_BODY_HEIGHT_PX) {
        resultPages.push(currentPage);
        currentPage = [item];
        currentHeight = h;
      } else {
        currentPage.push(item);
        currentHeight += added;
      }
    });
    if (currentPage.length > 0) resultPages.push(currentPage);
    setPages(resultPages);
  }, [pageItems, activeTemplate, isCompact, itemGap, measureTick]);

  // Re-measure when images inside the hidden measure container load
  useEffect(() => {
    const el = measureRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setMeasureTick((t) => t + 1));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const handleDownloadPdf = async () => {
    const activeSheets = sheetRefs.current.filter(Boolean);
    if (!activeSheets.length || exporting) return;
    setExporting(true);
    try {
      api.trackEvent({
        event_type: 'pdf_download',
        page_path: window.location.pathname + window.location.search,
        page_title: document.title,
        pdf_page_code: basePageCode,
        pdf_title: group?.title || categoryBadge,
        item_code: pageItems.length === 1 ? pageItems[0]?.code : null,
      });

      if (document.fonts && document.fonts.ready) {
        await document.fonts.ready;
      }

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true,
      });

      for (let pIdx = 0; pIdx < activeSheets.length; pIdx++) {
        const el = activeSheets[pIdx];
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
          onclone: (clonedDoc) => {
            clonedDoc.querySelectorAll('.pdf-table-cell-inner').forEach((node) => {
              node.style.transform = 'translateY(-3px)';
            });
          },
        });

        el.style.transform = prevTransform;

        const imgData = canvas.toDataURL('image/jpeg', 0.96);
        if (pIdx > 0) pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297, undefined, 'FAST');
      }

      const safeName = `${basePageCode} - ${group?.title || 'Catalogue'}`.replace(/[^a-zA-Z0-9._ -]/g, '');
      pdf.save(`${safeName}.pdf`);
    } catch (err) {
      console.error('PDF export failed:', err);
      alert('Could not generate PDF. Please try Print / Save PDF instead.');
    } finally {
      setExporting(false);
    }
  };

  const handlePrint = () => {
    api.trackEvent({
      event_type: 'pdf_print',
      page_path: window.location.pathname + window.location.search,
      page_title: document.title,
      pdf_page_code: basePageCode,
      pdf_title: group?.title || categoryBadge,
      item_code: pageItems.length === 1 ? pageItems[0]?.code : null,
    });
    window.print();
  };

  // ================= ITEM RENDERERS =================
  const renderStandardItem = (item, idx) => {
    const specLines = (item.specifications || '').split('\n').map((l) => l.trim()).filter(Boolean);
    const imgs = (item.images || []).slice(0, 3);
    return (
      <div
        key={item.id || idx}
        style={{
          border: '1px solid #DCDCDC',
          borderTop: '2px solid #4A4A4A',
          padding: isCompact ? '10px 12px' : '13px 15px',
          backgroundColor: '#FFFFFF',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '14px', marginBottom: isCompact ? '8px' : '11px' }}>
          <div style={{ flex: '0 0 41%', minWidth: 0 }}>
            <div style={{ fontSize: isCompact ? '11px' : '12px', fontWeight: 700, color: '#161616', marginBottom: '4px' }}>
              Model – {item.code}
            </div>
            <div style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '1.2px', color: '#666', textTransform: 'uppercase', marginBottom: '4px', borderBottom: '1px solid #E5E5E5', paddingBottom: '2px' }}>
              SPECIFICATION
            </div>
            <ul style={{ margin: 0, paddingLeft: '13px', fontSize: isCompact ? '9.2px' : '10px', lineHeight: isCompact ? 1.38 : 1.48, color: '#2E2E2E' }}>
              {specLines.map((line, li) => <li key={li} style={{ marginBottom: '1.5px' }}>{line}</li>)}
            </ul>
          </div>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '10px' }}>
            {imgs.map((imgObj, imIdx) => (
              <div key={imIdx} style={{ flex: imgs.length === 1 ? '0 0 auto' : '1 1 0', maxWidth: imgs.length === 1 ? '210px' : imgs.length === 2 ? '185px' : '130px', height: isCompact ? '92px' : '118px', border: '1px solid #ECECEC', backgroundColor: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px', overflow: 'hidden' }}>
                <img src={resolveAssetUrl(imgObj.url)} alt={imgObj.caption || item.name} crossOrigin="anonymous" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
              </div>
            ))}
          </div>
        </div>
        {item.spec_table && <div style={{ marginTop: '4px' }}><SpecTableView table={item.spec_table} mode="pdf" compact={isCompact} /></div>}
        {item.footnote && <div style={{ marginTop: '5px', fontSize: '8px', fontStyle: 'italic', color: '#666' }}>{item.footnote}</div>}
      </div>
    );
  };

  const renderTechnicalGridItem = (item, idx) => {
    const td = item.template_data || {};
    const imgs = (item.images || []).slice(0, 4);
    const suppliedLines = (td.supplied_with || '').split('\n').map((s) => s.trim()).filter(Boolean);

    return (
      <div
        key={item.id || idx}
        style={{
          border: '1px solid #DCDCDC',
          borderTop: '2.5px solid #2C2C2C',
          padding: isCompact ? '10px 12px' : '12px 14px',
          backgroundColor: '#FFFFFF',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', paddingBottom: '5px', borderBottom: '1px solid #E2E2E2' }}>
          <div>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#161616', fontFamily: 'Montserrat, Inter, Arial, sans-serif' }}>
              {item.name} — <span style={{ color: '#555' }}>{item.code}</span>
            </div>
            {item.subtitle && <div style={{ fontSize: '8.8px', color: '#666', marginTop: '1px' }}>{item.subtitle}</div>}
          </div>
          <BadgesStrip badges={td.badges} accentColor={accentColor} />
        </div>

        <div style={{ display: 'flex', gap: '14px', marginBottom: '8px', alignItems: 'flex-start' }}>
          <div style={{ flex: '0 0 46%', display: 'grid', gridTemplateColumns: imgs.length > 1 ? '1fr 1fr' : '1fr', gap: '8px' }}>
            {imgs.map((im, i) => (
              <div key={i} style={{ height: imgs.length > 2 ? '84px' : '124px', border: '1px solid #ECECEC', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF' }}>
                <img src={resolveAssetUrl(im.url)} alt={im.caption || ''} crossOrigin="anonymous" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
              </div>
            ))}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <KeyValueBox specs={td.key_value_specs || []} enClass={td.en_class || ''} compact={isCompact} />
            {suppliedLines.length > 0 && (
              <div style={{ fontSize: '8.4px', color: '#333', marginBottom: '4px' }}>
                <div style={{ fontWeight: 700, marginBottom: '1px' }}>Supplied with:</div>
                {suppliedLines.map((sl, si) => <div key={si}>• {sl}</div>)}
              </div>
            )}
          </div>
        </div>

        {item.spec_table && <SpecTableView table={item.spec_table} mode="pdf" compact={isCompact} />}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', fontSize: '8px', color: '#666' }}>
          <span style={{ fontStyle: 'italic' }}>{item.footnote}</span>
          {td.packing_note && <span style={{ fontWeight: 600 }}>{td.packing_note}</span>}
        </div>
      </div>
    );
  };

  const renderTwoColumnCard = (item, idx) => {
    const td = item.template_data || {};
    const imgs = (item.images || []).slice(0, 2);
    const suppliedLines = (td.supplied_with || '').split('\n').map((s) => s.trim()).filter(Boolean);
    return (
      <div key={item.id || idx} style={{ border: '1px solid #DCDCDC', borderTop: '2px solid #4A4A4A', padding: '10px', backgroundColor: '#FFF' }}>
        <div style={{ fontSize: '11px', fontWeight: 700, color: '#161616', marginBottom: '4px', fontFamily: 'Montserrat, Inter, Arial, sans-serif' }}>
          {item.name}
        </div>
        <div style={{ fontSize: '9px', fontWeight: 600, color: '#666', marginBottom: '6px' }}>Model – {item.code}</div>
        <BadgesStrip badges={td.badges} accentColor={accentColor} />
        <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
          {imgs.map((im, i) => (
            <div key={i} style={{ flex: 1, height: '88px', border: '1px solid #ECECEC', padding: '3px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <img src={resolveAssetUrl(im.url)} alt="" crossOrigin="anonymous" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
            </div>
          ))}
        </div>
        <KeyValueBox specs={td.key_value_specs || []} enClass={td.en_class || ''} compact />
        {suppliedLines.length > 0 && (
          <div style={{ fontSize: '8px', color: '#333', marginBottom: '6px' }}>
            <strong>Supplied with:</strong> {suppliedLines.join(', ')}
          </div>
        )}
        {item.spec_table && <SpecTableView table={item.spec_table} mode="pdf" compact />}
      </div>
    );
  };

  const renderTallPullHandleItem = (item, idx) => {
    const td = item.template_data || {};
    const imgs = (item.images || []).slice(0, 2);
    return (
      <div key={item.id || idx} style={{ border: '1px solid #DCDCDC', borderTop: '2px solid #333', padding: '12px', backgroundColor: '#FFF' }}>
        <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
          <div style={{ flex: '0 0 34%', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#161616', fontFamily: 'Montserrat, Inter, Arial, sans-serif' }}>
              Model {item.code}
            </div>
            <div style={{ display: 'flex', gap: '6px', height: '270px' }}>
              {imgs.map((im, i) => (
                <div key={i} style={{ flex: 1, border: '1px solid #ECECEC', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <img src={resolveAssetUrl(im.url)} alt="" crossOrigin="anonymous" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                </div>
              ))}
            </div>
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '10.5px', fontWeight: 600, color: '#444', marginBottom: '6px' }}>{item.name}</div>
            <KeyValueBox specs={td.key_value_specs || []} compact />
            {item.spec_table && <SpecTableView table={item.spec_table} mode="pdf" compact />}
            {item.footnote && <div style={{ marginTop: '4px', fontSize: '7.8px', fontStyle: 'italic', color: '#666' }}>{item.footnote}</div>}
          </div>
        </div>
      </div>
    );
  };

  const renderFinishGalleryItem = (item, idx) => {
    const td = item.template_data || {};
    const variants = td.finish_variants || [];
    const drawings = (item.images || []).slice(0, 3);
    const specLines = (item.specifications || '').split('\n').map((s) => s.trim()).filter(Boolean);

    return (
      <div key={item.id || idx} style={{ border: '1px solid #DCDCDC', borderTop: '2px solid #333', padding: '14px', backgroundColor: '#FFF', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: '16px', flex: 1 }}>
          <div style={{ flex: '0 0 46%', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ fontSize: '20px', fontWeight: 700, color: '#161616', fontFamily: 'Montserrat, Inter, Arial, sans-serif', letterSpacing: '0.5px' }}>
              {item.name}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: variants.length > 4 ? '1fr 1fr' : '1fr', gap: '8px' }}>
              {variants.map((fv, vi) => (
                <div key={vi} style={{ borderBottom: '1px solid #EEEEEE', paddingBottom: '4px' }}>
                  <div style={{ height: variants.length > 4 ? '68px' : '84px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <img src={resolveAssetUrl(fv.image_url)} alt={fv.name} crossOrigin="anonymous" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                  </div>
                  <div style={{ fontSize: '8.5px', fontWeight: 700, color: '#161616' }}>{fv.code}</div>
                  <div style={{ fontSize: '7.8px', color: '#666' }}>{fv.name}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '10px' }}>
            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#161616', marginBottom: '4px' }}>Model – {item.code}</div>
              {specLines.map((l, li) => (
                <div key={li} style={{ fontSize: '9px', color: '#444', lineHeight: 1.45 }}>{l}</div>
              ))}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
                {drawings.map((d, di) => (
                  <div key={di} style={{ height: '104px', border: '1px solid #ECECEC', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <img src={resolveAssetUrl(d.url)} alt="" crossOrigin="anonymous" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                  </div>
                ))}
              </div>
            </div>
            {item.spec_table && <SpecTableView table={item.spec_table} mode="pdf" compact />}
          </div>
        </div>
      </div>
    );
  };

  const renderHeroCatalogItem = (item, idx) => {
    const td = item.template_data || {};
    const variants = td.finish_variants || [];
    const heroUrl = td.hero_image_url || item.images?.[0]?.url;

    return (
      <div key={item.id || idx} style={{ border: '1px solid #DCDCDC', flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#FFF', overflow: 'hidden' }}>
        <div
          style={{
            height: '360px',
            backgroundColor: '#8D9094',
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            borderBottom: `3px solid ${accentColor}`,
          }}
        >
          {heroUrl && (
            <img src={resolveAssetUrl(heroUrl)} alt={item.name} crossOrigin="anonymous" style={{ maxWidth: '88%', maxHeight: '88%', objectFit: 'contain' }} />
          )}
          <div style={{ position: 'absolute', left: '24px', bottom: '20px', color: '#FFFFFF' }}>
            <div style={{ fontSize: '22px', fontWeight: 700, letterSpacing: '1.5px', fontFamily: 'Montserrat, Inter, Arial, sans-serif', textShadow: '0 1px 4px rgba(0,0,0,0.35)' }}>
              {item.name.toUpperCase()}
            </div>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#F5E6B3', letterSpacing: '1px', fontFamily: 'Montserrat, Inter, Arial, sans-serif' }}>
              {item.code}
            </div>
          </div>
        </div>

        <div style={{ flex: 1, padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '12px' }}>
          {variants.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px' }}>
              {variants.slice(0, 6).map((fv, vi) => (
                <div key={vi} style={{ textAlign: 'center', borderBottom: '1px solid #ECECEC', paddingBottom: '6px' }}>
                  <div style={{ height: '74px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <img src={resolveAssetUrl(fv.image_url)} alt={fv.name} crossOrigin="anonymous" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                  </div>
                  <div style={{ fontSize: '9.5px', fontWeight: 700, color: '#161616', marginTop: '4px' }}>{fv.code}</div>
                  <div style={{ fontSize: '8px', color: '#666' }}>{fv.name}</div>
                </div>
              ))}
            </div>
          )}
          {item.spec_table && <SpecTableView table={item.spec_table} mode="pdf" compact />}
          {item.footnote && <div style={{ fontSize: '8px', fontStyle: 'italic', color: '#666' }}>{item.footnote}</div>}
        </div>
      </div>
    );
  };

  const renderItemByTemplate = (item, idx) => {
    if (activeTemplate === 'technical_grid') return renderTechnicalGridItem(item, idx);
    if (activeTemplate === 'two_column_split') return renderTwoColumnCard(item, idx);
    if (activeTemplate === 'tall_pull_handle') return renderTallPullHandleItem(item, idx);
    if (activeTemplate === 'finish_gallery') return renderFinishGalleryItem(item, idx);
    if (activeTemplate === 'hero_catalog') return renderHeroCatalogItem(item, idx);
    return renderStandardItem(item, idx);
  };

  const effectivePages = pages.length ? pages : [pageItems];
  sheetRefs.current = sheetRefs.current.slice(0, effectivePages.length);

  return (
    <div className="flex flex-col items-center w-full relative">
      {/* Hidden offscreen measurer (exact 718px A4 inner body width) for automatic multi-page pagination */}
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          left: '-9999px',
          top: 0,
          width: activeTemplate === 'two_column_split' ? '351px' : '718px',
          visibility: 'hidden',
          pointerEvents: 'none',
          fontFamily: 'Inter, Arial, sans-serif',
        }}
      >
        <div ref={measureRef}>
          {pageItems.map((it, idx) => (
            <div key={it.id || idx} style={{ marginBottom: 0 }}>
              {renderItemByTemplate(it, idx)}
            </div>
          ))}
        </div>
      </div>

      {showControls && (
        <div className="w-full max-w-[794px] mb-4 flex flex-wrap items-center justify-between gap-3 p-3 bg-white dark:bg-neutral-900 border border-aastra-silver dark:border-neutral-800 rounded-sm shadow-sm">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="px-2.5 py-1 bg-aastra-black text-white dark:bg-aastra-gold dark:text-black text-xs font-mono font-semibold tracking-wider shrink-0">
              {basePageCode}
            </span>
            <span className="text-xs sm:text-sm font-medium text-aastra-black dark:text-neutral-200 truncate">
              {group?.title || 'Catalogue Page'}
            </span>
            {effectivePages.length > 1 && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-aastra-gold-tint dark:bg-aastra-gold/20 text-aastra-gold-dark dark:text-aastra-gold text-[11px] font-semibold shrink-0">
                <Layers className="w-3 h-3" /> {effectivePages.length} Pages
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={() => setBrandAccent((v) => !v)}
              className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-medium border rounded-sm transition ${
                brandAccent
                  ? 'border-aastra-gold bg-aastra-gold-tint text-aastra-black dark:bg-aastra-gold/20 dark:text-aastra-gold-light'
                  : 'border-aastra-silver dark:border-neutral-700 text-aastra-slate dark:text-neutral-300'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{brandAccent ? 'Gold Trim' : 'Pure Grayscale'}</span>
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
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Generating...
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" /> Download PDF
                  {effectivePages.length > 1 ? ` (${effectivePages.length}p)` : ''}
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Multi-Page Responsive A4 Sheets Stack */}
      <div ref={containerRef} className="aastra-pdf-pages-wrapper w-full flex flex-col items-center gap-6">
        {effectivePages.map((chunkItems, pIdx) => {
          const currentPageCode = computePageCode(basePageCode, pIdx);
          return (
            <div
              key={pIdx}
              className="w-full flex justify-center overflow-hidden"
              style={{ height: `${Math.ceil(1123 * responsiveScale) + 12}px` }}
            >
              <div
                ref={(el) => {
                  sheetRefs.current[pIdx] = el;
                }}
                className="aastra-pdf-sheet bg-white text-[#1A1A1A] shadow-elevated relative flex flex-col justify-between shrink-0"
                style={{
                  width: '794px',
                  height: '1123px',
                  padding: '36px',
                  boxSizing: 'border-box',
                  transform: responsiveScale !== 1 ? `scale(${responsiveScale})` : undefined,
                  transformOrigin: 'top center',
                  fontFamily: 'Inter, Arial, sans-serif',
                }}
              >
                {/* Vertical Right-Edge Chapter Tab — Crisp SVG rotated 90° UP */}
                <div style={{ position: 'absolute', right: '0px', top: '132px', width: '24px', height: '138px', zIndex: 10, lineHeight: 0 }}>
                  <svg width="24" height="138" viewBox="0 0 24 138" xmlns="http://www.w3.org/2000/svg">
                    <rect x="0" y="0" width="24" height="138" fill="#7A7D82" />
                    <rect x="0" y="0" width="2.5" height="138" fill={accentColor} />
                    <text x="13" y="69" fill="#FFFFFF" fontSize="9.2" fontWeight="600" letterSpacing="1.8" fontFamily="Montserrat, Inter, Arial, sans-serif" textAnchor="middle" dominantBaseline="central" transform="rotate(-90 13 69)">
                      {sideTabLabel}
                    </text>
                  </svg>
                </div>

                {/* ================= HEADER ================= */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1.5px solid #2C2C2C' }}>
                    <div>
                      <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '1.8px', color: '#161616', fontFamily: 'Montserrat, Inter, Arial, sans-serif' }}>AASTRA</span>{' '}
                      <span style={{ fontSize: '10.5px', fontWeight: 400, letterSpacing: '1.6px', color: '#555555', fontFamily: 'Montserrat, Inter, Arial, sans-serif' }}>ARCHITECTURAL HARDWARE</span>
                    </div>
                    <img src="/brand/logo-gray.gif" alt="AASTRA" crossOrigin="anonymous" style={{ height: '24px', objectFit: 'contain' }} />
                  </div>

                  <div style={{ height: '2px', width: '100%', backgroundColor: accentColor, opacity: brandAccent ? 0.85 : 0.4, marginTop: '2px' }} />

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '10px', marginBottom: isCompact ? '10px' : '14px' }}>
                    {(() => {
                      const w = Math.max(150, categoryBadge.length * 11 + 40);
                      return (
                        <svg width={w} height="30" viewBox={`0 0 ${w} 30`} xmlns="http://www.w3.org/2000/svg">
                          <rect x="0" y="0" width={w} height="30" fill="#6F7277" />
                          <rect x="0" y="0" width="4" height="30" fill={accentColor} />
                          <text x={(w + 4) / 2} y="15.5" fill="#FFFFFF" fontSize="12.5" fontWeight="700" letterSpacing="1.8" fontFamily="Montserrat, Inter, Arial, sans-serif" textAnchor="middle" dominantBaseline="central">
                            {categoryBadge}
                          </text>
                        </svg>
                      );
                    })()}

                    {(() => {
                      const sw = Math.max(96, sectionLabel.length * 8.5 + 32);
                      return (
                        <svg width={sw} height="24" viewBox={`0 0 ${sw} 24`} xmlns="http://www.w3.org/2000/svg">
                          <rect x="0" y="0" width={sw} height="24" fill="#919499" />
                          <text x={sw / 2} y="12.5" fill="#FFFFFF" fontSize="9.5" fontWeight="600" letterSpacing="1.8" fontFamily="Montserrat, Inter, Arial, sans-serif" textAnchor="middle" dominantBaseline="central">
                            {sectionLabel}
                          </text>
                        </svg>
                      );
                    })()}
                  </div>
                </div>

                {/* ================= BODY (AUTO-PAGINATED) ================= */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', gap: `${itemGap}px`, overflow: 'hidden', paddingRight: '4px' }}>
                  {chunkItems.length === 0 ? (
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888', fontSize: '12px', border: '1px dashed #CCC' }}>
                      No items assigned to this catalogue page yet. Add items from the Admin Panel.
                    </div>
                  ) : activeTemplate === 'two_column_split' ? (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', alignItems: 'start' }}>
                      {chunkItems.map((it, idx) => renderTwoColumnCard(it, idx))}
                    </div>
                  ) : (
                    chunkItems.map((it, idx) => renderItemByTemplate(it, idx))
                  )}
                </div>

                {/* ================= FOOTER ================= */}
                <div style={{ marginTop: '12px' }}>
                  <div style={{ borderTop: '1.5px solid #2C2C2C', paddingTop: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                    {(() => {
                      const pw = Math.max(116, currentPageCode.length * 11.5 + 36);
                      return (
                        <svg width={pw} height="34" viewBox={`0 0 ${pw} 34`} xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
                          <rect x="0" y="0" width={pw} height="34" fill="#7A7D82" />
                          <rect x="0" y="0" width="4" height="34" fill={accentColor} />
                          <text x={(pw + 4) / 2} y="17.5" fill="#FFFFFF" fontSize="14" fontWeight="700" letterSpacing="1.6" fontFamily="Montserrat, Inter, Arial, sans-serif" textAnchor="middle" dominantBaseline="central">
                            {currentPageCode}
                          </text>
                        </svg>
                      );
                    })()}

                    <div style={{ flex: 1, textAlign: 'center', fontSize: '7.6px', lineHeight: 1.45, color: '#555555', fontFamily: 'Inter, Arial, sans-serif' }}>
                      <div style={{ fontWeight: 700, color: '#222222', letterSpacing: '0.5px' }}>AASTRA Architectural Hardware</div>
                      <div>33 Dunstable Road, Houghton Regis, Dunstable, LU5 5DB, UK</div>
                      <div>Direct: +44 7435 620033 · Email: business@aastra.uk</div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      {group?.show_guarantee_seal !== 0 && (
                        <GuaranteeSeal size={44} accent={brandAccent ? 'gold' : 'grayscale'} />
                      )}
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#222222', letterSpacing: '0.5px', fontFamily: 'Montserrat, Inter, Arial, sans-serif' }}>
                          {footerWebsite}
                        </div>
                        <div style={{ fontSize: '7px', color: '#777777', letterSpacing: '0.8px' }}>
                          © 2026 AASTRA. All Rights Reserved.
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
