import React, { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Upload, X, Image as ImageIcon, LayoutTemplate, Sparkles } from 'lucide-react';
import { api, resolveAssetUrl } from '../../api/client';
import TableBuilder, { createBlankTable } from '../../components/TableBuilder';
import { PDF_TEMPLATES, TEMPLATE_PRESETS, getTemplateMeta } from '../../constants/pdfTemplates';

const defaultTemplateData = () => ({
  key_value_specs: [],
  en_class: '',
  badges: { fire_rated: false, cad_available: false, ce_certified: false },
  supplied_with: '',
  packing_note: '',
  finish_variants: [],
  hero_image_url: '',
});

const createEmptyItem = (defaultCatId = '') => ({
  category_id: defaultCatId,
  sub_category_id: '',
  name: '',
  code: '',
  subtitle: '',
  material: 'Stainless Steel',
  specifications: '',
  footnote: '"Special finishes & sizes available upon request subject to minimum order quantity"',
  images: [],
  spec_table: createBlankTable(3, 6),
  pdf_template: 'standard',
  template_data: defaultTemplateData(),
  finish_ids: [],
  group_ids: [],
  is_featured: false,
  is_active: true,
  sort_order: 0,
});

export default function AdminItems() {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [finishes, setFinishes] = useState([]);
  const [groups, setGroups] = useState([]);
  const [form, setForm] = useState(createEmptyItem());
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingIdx, setUploadingIdx] = useState(false);
  const [error, setError] = useState('');

  const loadAll = () => {
    Promise.all([
      api.getItems({ all: 1 }),
      api.getCategories(false),
      api.getSubCategories({ all: 1 }),
      api.getFinishes(true),
      api.getGroups({ all: 1 }),
    ])
      .then(([its, cats, subs, fins, grps]) => {
        setItems(its);
        setCategories(cats);
        setSubCategories(subs);
        setFinishes(fins);
        setGroups(grps);
      })
      .catch(() => {});
  };

  useEffect(loadAll, []);

  const filteredSubs = subCategories.filter(
    (s) => Number(s.category_id) === Number(form.category_id)
  );

  const tplMeta = getTemplateMeta(form.pdf_template);
  const tData = { ...defaultTemplateData(), ...(form.template_data || {}) };

  const setTemplateField = (key, val) => {
    setForm((f) => ({
      ...f,
      template_data: { ...defaultTemplateData(), ...(f.template_data || {}), [key]: val },
    }));
  };

  const openNew = () => {
    const firstCat = categories[0];
    setForm(createEmptyItem(firstCat?.id || ''));
    setEditingId(null);
    setError('');
    setShowForm(true);
  };

  const openEdit = (it) => {
    setForm({
      category_id: it.category_id,
      sub_category_id: it.sub_category_id || '',
      name: it.name || '',
      code: it.code || '',
      subtitle: it.subtitle || '',
      material: it.material || '',
      specifications: it.specifications || '',
      footnote: it.footnote || '',
      images: (it.images || []).slice(0, 6),
      spec_table: it.spec_table || createBlankTable(3, 6),
      pdf_template: it.pdf_template || 'standard',
      template_data: { ...defaultTemplateData(), ...(it.template_data || {}) },
      finish_ids: it.finish_ids || [],
      group_ids: it.group_ids || [],
      is_featured: !!Number(it.is_featured),
      is_active: !!Number(it.is_active),
      sort_order: it.sort_order ?? 0,
    });
    setEditingId(it.id);
    setError('');
    setShowForm(true);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || form.images.length >= 6) return;
    setUploadingIdx(true);
    setError('');
    try {
      const res = await api.uploadImage(file);
      const nextType = form.images.length === 0 ? 'photo' : 'drawing';
      setForm((f) => ({
        ...f,
        images: [
          ...f.images,
          {
            url: res.url,
            caption: nextType === 'photo' ? 'Product View' : 'Technical Drawing',
            type: nextType,
          },
        ],
      }));
    } catch (err) {
      setError(err.message);
    } finally {
      setUploadingIdx(false);
      e.target.value = '';
    }
  };

  const handleHeroUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingIdx(true);
    try {
      const res = await api.uploadImage(file);
      setTemplateField('hero_image_url', res.url);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploadingIdx(false);
      e.target.value = '';
    }
  };

  const handleFinishVariantUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingIdx(true);
    try {
      const res = await api.uploadImage(file);
      const next = [...(tData.finish_variants || []), { code: 'SSS', name: 'Satin SS', image_url: res.url }];
      setTemplateField('finish_variants', next);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploadingIdx(false);
      e.target.value = '';
    }
  };

  const updateFinishVariant = (idx, key, val) => {
    const next = [...(tData.finish_variants || [])];
    next[idx] = { ...next[idx], [key]: val };
    setTemplateField('finish_variants', next);
  };

  const removeFinishVariant = (idx) => {
    setTemplateField('finish_variants', (tData.finish_variants || []).filter((_, i) => i !== idx));
  };

  const addKvSpec = () => {
    setTemplateField('key_value_specs', [...(tData.key_value_specs || []), { label: '', value: '' }]);
  };

  const updateKvSpec = (idx, key, val) => {
    const next = [...(tData.key_value_specs || [])];
    next[idx] = { ...next[idx], [key]: val };
    setTemplateField('key_value_specs', next);
  };

  const removeKvSpec = (idx) => {
    setTemplateField('key_value_specs', (tData.key_value_specs || []).filter((_, i) => i !== idx));
  };

  const applyTemplatePreset = (presetKey) => {
    const p = TEMPLATE_PRESETS[presetKey];
    if (!p) return;
    setForm((f) => ({
      ...f,
      template_data: {
        ...defaultTemplateData(),
        ...(f.template_data || {}),
        ...p,
      },
    }));
  };

  const updateImageField = (idx, key, val) => {
    setForm((f) => {
      const next = [...f.images];
      next[idx] = { ...next[idx], [key]: val };
      return { ...f, images: next };
    });
  };

  const removeImage = (idx) => {
    setForm((f) => ({ ...f, images: f.images.filter((_, i) => i !== idx) }));
  };

  const toggleId = (listKey, id) => {
    setForm((f) => {
      const set = new Set(f[listKey]);
      if (set.has(id)) set.delete(id);
      else set.add(id);
      return { ...f, [listKey]: Array.from(set) };
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload = {
        ...form,
        sub_category_id: form.sub_category_id ? Number(form.sub_category_id) : null,
      };
      if (editingId) await api.updateItem(editingId, payload);
      else await api.createItem(payload);
      setShowForm(false);
      loadAll();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (it) => {
    if (!window.confirm(`Delete item "${it.code} — ${it.name}"?`)) return;
    await api.deleteItem(it.id);
    loadAll();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-aastra-black dark:text-white">
            Hardware Items &amp; PDF Templates
          </h1>
          <p className="text-sm text-aastra-slate dark:text-neutral-400">
            Assign items to Main &amp; Sub Categories, choose an architectural PDF Specification
            Template, upload photos/drawings, and configure merged-cell tables.
          </p>
        </div>
        <button
          type="button"
          onClick={openNew}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-aastra-black dark:bg-aastra-gold text-white dark:text-black text-xs font-semibold uppercase tracking-widest"
        >
          <Plus className="w-4 h-4" /> Add Item
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSave}
          className="bg-white dark:bg-[#181818] border border-aastra-gold p-5 sm:p-6 space-y-6 shadow-classic"
        >
          <div className="flex items-center justify-between border-b border-aastra-pearl dark:border-neutral-800 pb-3">
            <h2 className="text-xl font-semibold">{editingId ? 'Edit Item' : 'New Hardware Item'}</h2>
            <button type="button" onClick={() => setShowForm(false)}>
              <X className="w-5 h-5 text-aastra-gray" />
            </button>
          </div>

          {error && <div className="p-3 text-xs bg-red-50 text-red-700 border border-red-300">{error}</div>}

          {/* Main Category -> Sub Category -> Name & Code */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1">
                Main Category *
              </label>
              <select
                required
                value={form.category_id}
                onChange={(e) =>
                  setForm({ ...form, category_id: Number(e.target.value), sub_category_id: '' })
                }
                className="w-full px-3 py-2 text-sm bg-aastra-pearl dark:bg-neutral-900 border border-aastra-silver dark:border-neutral-700"
              >
                <option value="">Select Main Category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    Ch.{c.chapter_number} — {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1">
                Sub Category
              </label>
              <select
                value={form.sub_category_id}
                onChange={(e) => setForm({ ...form, sub_category_id: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-aastra-pearl dark:bg-neutral-900 border border-aastra-silver dark:border-neutral-700"
              >
                <option value="">— Select Sub Category —</option>
                {filteredSubs.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1">
                Item Name *
              </label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Overhead Door Closer DCL 15"
                className="w-full px-3 py-2 text-sm bg-aastra-pearl dark:bg-neutral-900 border border-aastra-silver dark:border-neutral-700"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1">
                Model / Item Code *
              </label>
              <input
                type="text"
                required
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                placeholder="e.g. AAE.671 / DCL 15"
                className="w-full px-3 py-2 text-sm font-mono bg-aastra-pearl dark:bg-neutral-900 border border-aastra-silver dark:border-neutral-700"
              />
            </div>
          </div>

          {/* ================= PDF SPECIFICATION TEMPLATE PICKER ================= */}
          <div className="border border-aastra-gold/60 bg-aastra-pearl/40 dark:bg-neutral-900/50 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <LayoutTemplate className="w-4 h-4 text-aastra-gold" />
              <h3 className="text-xs font-semibold uppercase tracking-wider">
                PDF Specification Template Style
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {PDF_TEMPLATES.map((tpl) => {
                const active = form.pdf_template === tpl.id;
                return (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => setForm({ ...form, pdf_template: tpl.id })}
                    className={`text-left p-3 border transition ${
                      active
                        ? 'border-aastra-gold bg-white dark:bg-[#1c1c1c] ring-1 ring-aastra-gold'
                        : 'border-aastra-silver/80 dark:border-neutral-800 bg-white/70 dark:bg-[#161616] hover:border-aastra-gold/60'
                    }`}
                  >
                    <div className="text-xs font-semibold text-aastra-black dark:text-white flex items-center justify-between">
                      <span>{tpl.name}</span>
                      {active && (
                        <span className="text-[9px] uppercase px-1.5 py-0.5 bg-aastra-gold text-black font-bold">
                          Selected
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-aastra-gold-dark dark:text-aastra-gold mt-0.5 font-medium">
                      {tpl.subtitle}
                    </div>
                    <div className="text-[10px] text-aastra-gray mt-1 leading-snug">
                      {tpl.description}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ================= TEMPLATE-SPECIFIC FIELDS ================= */}
          {(tplMeta.supportsKeyValues || tplMeta.supportsEnClass || tplMeta.supportsBadges || tplMeta.supportsSuppliedWith) && (
            <div className="border border-aastra-silver dark:border-neutral-800 p-4 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-aastra-gold" /> Technical Template Details (
                  {tplMeta.name})
                </h3>
                <div className="flex flex-wrap gap-1.5 text-[11px]">
                  <span className="text-aastra-gray mr-1">Load Preset:</span>
                  {[
                    ['closer', 'Door Closer'],
                    ['hinge', 'Concealed Hinge'],
                    ['lockset', 'Mortice Lock'],
                    ['seal', 'Door Seal'],
                    ['pull_handle', 'Pull Handle'],
                  ].map(([k, label]) => (
                    <button
                      key={k}
                      type="button"
                      onClick={() => applyTemplatePreset(k)}
                      className="px-2 py-0.5 border border-aastra-silver dark:border-neutral-700 hover:border-aastra-gold rounded-sm"
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Compliance Badges + EN Classification */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {tplMeta.supportsBadges && (
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold uppercase tracking-wider">
                      Technical Badges
                    </label>
                    <div className="flex flex-wrap gap-4 text-xs pt-1">
                      {[
                        ['fire_rated', '[F] Fire & Smoke Rated'],
                        ['cad_available', '[CAD] CAD Available'],
                        ['ce_certified', '[CE] EN Certified'],
                      ].map(([bKey, bLabel]) => (
                        <label key={bKey} className="inline-flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={!!tData.badges?.[bKey]}
                            onChange={(e) =>
                              setTemplateField('badges', {
                                ...(tData.badges || {}),
                                [bKey]: e.target.checked,
                              })
                            }
                          />
                          {bLabel}
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {tplMeta.supportsEnClass && (
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider mb-1">
                      EN Classification Boxes (Comma-separated)
                    </label>
                    <input
                      type="text"
                      value={tData.en_class || ''}
                      onChange={(e) => setTemplateField('en_class', e.target.value)}
                      placeholder="e.g. 4, 8, 2-4, 0/1, 1, 3"
                      className="w-full px-3 py-1.5 text-xs font-mono bg-aastra-pearl dark:bg-neutral-900 border border-aastra-silver dark:border-neutral-700"
                    />
                  </div>
                )}
              </div>

              {/* Key-Value Specifications Table */}
              {tplMeta.supportsKeyValues && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold uppercase tracking-wider">
                      Structured Specifications (Label : Value)
                    </label>
                    <button
                      type="button"
                      onClick={addKvSpec}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] bg-aastra-black dark:bg-aastra-gold text-white dark:text-black font-semibold"
                    >
                      <Plus className="w-3 h-3" /> Add Row
                    </button>
                  </div>
                  <div className="space-y-1.5">
                    {(tData.key_value_specs || []).map((kv, idx) => (
                      <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                        <input
                          type="text"
                          value={kv.label}
                          onChange={(e) => updateKvSpec(idx, 'label', e.target.value)}
                          placeholder="e.g. Closing force"
                          className="col-span-4 px-2.5 py-1.5 text-xs bg-aastra-pearl dark:bg-neutral-900 border border-aastra-silver dark:border-neutral-700 font-medium"
                        />
                        <input
                          type="text"
                          value={kv.value}
                          onChange={(e) => updateKvSpec(idx, 'value', e.target.value)}
                          placeholder="e.g. EN 2–4"
                          className="col-span-7 px-2.5 py-1.5 text-xs bg-aastra-pearl dark:bg-neutral-900 border border-aastra-silver dark:border-neutral-700"
                        />
                        <button
                          type="button"
                          onClick={() => removeKvSpec(idx)}
                          className="col-span-1 flex justify-center text-red-500 hover:text-red-700"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Supplied With & Packing */}
              {tplMeta.supportsSuppliedWith && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold uppercase tracking-wider mb-1">
                      Supplied With (One item per line)
                    </label>
                    <textarea
                      rows="2"
                      value={tData.supplied_with || ''}
                      onChange={(e) => setTemplateField('supplied_with', e.target.value)}
                      placeholder="1 mortice lock&#10;1 flanged striking plate"
                      className="w-full px-3 py-1.5 text-xs bg-aastra-pearl dark:bg-neutral-900 border border-aastra-silver dark:border-neutral-700"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider mb-1">
                      Packing Note
                    </label>
                    <input
                      type="text"
                      value={tData.packing_note || ''}
                      onChange={(e) => setTemplateField('packing_note', e.target.value)}
                      placeholder="e.g. Packing: 1 set"
                      className="w-full px-3 py-1.5 text-xs bg-aastra-pearl dark:bg-neutral-900 border border-aastra-silver dark:border-neutral-700"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Hero Image + Finish Variant Photos (for Finish Gallery / Hero Catalog templates) */}
          {(tplMeta.supportsHeroImage || tplMeta.supportsFinishVariants) && (
            <div className="border border-aastra-silver dark:border-neutral-800 p-4 space-y-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider">
                Visual Finish Gallery &amp; Hero Media ({tplMeta.name})
              </h3>

              {tplMeta.supportsHeroImage && (
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex-1 min-w-[220px]">
                    <label className="block text-xs font-semibold uppercase tracking-wider mb-1">
                      Hero Banner Image URL
                    </label>
                    <input
                      type="text"
                      value={tData.hero_image_url || ''}
                      onChange={(e) => setTemplateField('hero_image_url', e.target.value)}
                      placeholder="Upload or paste lifestyle/hero product shot"
                      className="w-full px-3 py-2 text-xs bg-aastra-pearl dark:bg-neutral-900 border border-aastra-silver dark:border-neutral-700"
                    />
                  </div>
                  <label className="mt-5 inline-flex items-center gap-1.5 px-4 py-2 bg-aastra-black dark:bg-aastra-gold text-white dark:text-black text-xs font-semibold uppercase cursor-pointer">
                    <Upload className="w-3.5 h-3.5" /> Upload Hero
                    <input type="file" accept="image/*" onChange={handleHeroUpload} className="hidden" />
                  </label>
                </div>
              )}

              {tplMeta.supportsFinishVariants && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-aastra-slate dark:text-neutral-400">
                      Upload finish variant photos (e.g. CRO / OTL / BGO / NEO / SSM / ABM / ZB):
                    </span>
                    <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-aastra-black dark:bg-aastra-gold text-white dark:text-black text-xs font-semibold uppercase cursor-pointer">
                      <Upload className="w-3.5 h-3.5" /> Add Finish Photo
                      <input type="file" accept="image/*" onChange={handleFinishVariantUpload} className="hidden" />
                    </label>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                    {(tData.finish_variants || []).map((fv, idx) => (
                      <div key={idx} className="border border-aastra-silver dark:border-neutral-700 p-2 space-y-1.5 relative bg-aastra-pearl/40 dark:bg-neutral-900">
                        <button
                          type="button"
                          onClick={() => removeFinishVariant(idx)}
                          className="absolute top-1 right-1 p-0.5 bg-white dark:bg-neutral-800 rounded-full text-red-500 shadow"
                        >
                          <X className="w-3 h-3" />
                        </button>
                        <div className="h-16 bg-white flex items-center justify-center p-1">
                          <img src={resolveAssetUrl(fv.image_url)} alt="" className="max-h-full max-w-full object-contain" />
                        </div>
                        <input
                          type="text"
                          value={fv.code || ''}
                          onChange={(e) => updateFinishVariant(idx, 'code', e.target.value)}
                          placeholder="Code (e.g. SSM)"
                          className="w-full px-1.5 py-1 text-[11px] font-mono bg-white dark:bg-neutral-800 border border-aastra-silver dark:border-neutral-700"
                        />
                        <input
                          type="text"
                          value={fv.name || ''}
                          onChange={(e) => updateFinishVariant(idx, 'name', e.target.value)}
                          placeholder="Label (e.g. Satin SS)"
                          className="w-full px-1.5 py-1 text-[11px] bg-white dark:bg-neutral-800 border border-aastra-silver dark:border-neutral-700"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Standard Specs + Subtitle + Material + Footnote */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1">
                General Specifications / Bullet Points (One per line)
              </label>
              <textarea
                rows="4"
                value={form.specifications}
                onChange={(e) => setForm({ ...form, specifications: e.target.value })}
                placeholder={"Floor mounted half dome door stop\nStainless steel SS304 grade\nSupplied with suitable screws and fixings"}
                className="w-full px-3 py-2 text-sm bg-aastra-pearl dark:bg-neutral-900 border border-aastra-silver dark:border-neutral-700"
              />
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1">
                  Short Subtitle
                </label>
                <input
                  type="text"
                  value={form.subtitle}
                  onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-aastra-pearl dark:bg-neutral-900 border border-aastra-silver dark:border-neutral-700"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1">
                  Primary Material
                </label>
                <input
                  type="text"
                  value={form.material}
                  onChange={(e) => setForm({ ...form, material: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-aastra-pearl dark:bg-neutral-900 border border-aastra-silver dark:border-neutral-700"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1">
                  PDF Footnote
                </label>
                <input
                  type="text"
                  value={form.footnote}
                  onChange={(e) => setForm({ ...form, footnote: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-aastra-pearl dark:bg-neutral-900 border border-aastra-silver dark:border-neutral-700"
                />
              </div>
            </div>
          </div>

          {/* Product Photos & Technical Drawings (1 to 6 Max) */}
          <div className="border border-aastra-silver dark:border-neutral-800 p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-aastra-gold" /> Product Photos &amp; Technical
                  Drawings ({form.images.length}/6)
                </h3>
                <p className="text-[11px] text-aastra-gray">
                  Upload product views, dimensional CAD drawings, and installation/mounting diagrams.
                </p>
              </div>
              {form.images.length < 6 && (
                <label className="inline-flex items-center gap-1.5 px-4 py-2 bg-aastra-black dark:bg-aastra-gold text-white dark:text-black text-xs font-semibold uppercase tracking-wider cursor-pointer">
                  <Upload className="w-3.5 h-3.5" />
                  {uploadingIdx ? 'Uploading...' : 'Upload Image'}
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                </label>
              )}
            </div>

            {form.images.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {form.images.map((img, idx) => (
                  <div
                    key={idx}
                    className="border border-aastra-silver/80 dark:border-neutral-700 p-3 space-y-2 bg-aastra-pearl/40 dark:bg-neutral-900/50 relative"
                  >
                    <button
                      type="button"
                      onClick={() => removeImage(idx)}
                      className="absolute top-2 right-2 p-1 bg-white dark:bg-neutral-800 rounded-full text-red-500 shadow"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                    <div className="h-24 bg-white border border-aastra-pearl flex items-center justify-center p-2">
                      <img src={resolveAssetUrl(img.url)} alt="" className="max-h-full max-w-full object-contain" />
                    </div>
                    <input
                      type="text"
                      value={img.caption || ''}
                      onChange={(e) => updateImageField(idx, 'caption', e.target.value)}
                      placeholder="Caption (e.g. Product View / Mounting Diagram)"
                      className="w-full px-2 py-1 text-xs bg-white dark:bg-neutral-800 border border-aastra-silver dark:border-neutral-700"
                    />
                    <select
                      value={img.type || 'photo'}
                      onChange={(e) => updateImageField(idx, 'type', e.target.value)}
                      className="w-full px-2 py-1 text-xs bg-white dark:bg-neutral-800 border border-aastra-silver dark:border-neutral-700"
                    >
                      <option value="photo">Product Photo</option>
                      <option value="drawing">Technical Drawing</option>
                      <option value="mounting">Installation / Mounting Diagram</option>
                    </select>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Dynamic Table Builder with Cell Merging */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider">
              Specification &amp; Ordering Table (Custom Rows/Cols + Cell Merging)
            </h3>
            <TableBuilder
              value={form.spec_table}
              onChange={(nextTable) => setForm((f) => ({ ...f, spec_table: nextTable }))}
            />
          </div>

          {/* Finishes & PDF Group Assignment */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            <div className="border border-aastra-silver/80 dark:border-neutral-800 p-4">
              <div className="text-xs font-semibold uppercase tracking-wider mb-3">
                Available Finishes
              </div>
              <div className="flex flex-wrap gap-2">
                {finishes.map((fin) => {
                  const checked = form.finish_ids.includes(Number(fin.id));
                  return (
                    <button
                      key={fin.id}
                      type="button"
                      onClick={() => toggleId('finish_ids', Number(fin.id))}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs border transition ${
                        checked
                          ? 'border-aastra-gold bg-aastra-gold-tint dark:bg-aastra-gold/20 font-semibold'
                          : 'border-aastra-silver dark:border-neutral-700'
                      }`}
                    >
                      <span
                        style={{ background: fin.swatch_gradient || fin.swatch_hex }}
                        className="w-3 h-3 rounded-full border border-black/20"
                      />
                      {fin.name}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="border border-aastra-silver/80 dark:border-neutral-800 p-4">
              <div className="text-xs font-semibold uppercase tracking-wider mb-3">
                Assign to PDF Catalogue Group(s)
              </div>
              <div className="space-y-1.5 max-h-36 overflow-y-auto">
                {groups.map((grp) => {
                  const checked = form.group_ids.includes(Number(grp.id));
                  return (
                    <label key={grp.id} className="flex items-center gap-2 text-xs cursor-pointer">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleId('group_ids', Number(grp.id))}
                      />
                      <span className="font-mono font-semibold text-aastra-gold-dark dark:text-aastra-gold">
                        {grp.page_code}
                      </span>
                      <span>{grp.title}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-aastra-pearl dark:border-neutral-800">
            <div className="flex items-center gap-6 text-xs">
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.is_featured}
                  onChange={(e) => setForm({ ...form, is_featured: e.target.checked })}
                />
                Featured on Landing Page
              </label>
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                />
                Active (Visible)
              </label>
            </div>

            <div className="flex gap-3">
              <button type="button" onClick={() => setShowForm(false)} className="px-5 py-2 border border-aastra-silver dark:border-neutral-700 text-xs uppercase tracking-wider">
                Cancel
              </button>
              <button type="submit" disabled={saving} className="px-6 py-2 bg-aastra-black dark:bg-aastra-gold text-white dark:text-black text-xs font-semibold uppercase tracking-wider">
                {saving ? 'Saving...' : 'Save Item'}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Items Table */}
      <div className="bg-white dark:bg-[#181818] border border-aastra-silver dark:border-neutral-800 overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-aastra-pearl dark:bg-neutral-900 text-[11px] uppercase tracking-wider text-aastra-slate dark:text-neutral-400 border-b border-aastra-silver dark:border-neutral-800">
            <tr>
              <th className="px-4 py-3">Item</th>
              <th className="px-4 py-3">Code</th>
              <th className="px-4 py-3">Main → Sub Category</th>
              <th className="px-4 py-3">PDF Template</th>
              <th className="px-4 py-3">PDF Groups</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-aastra-pearl dark:divide-neutral-800">
            {items.map((it) => (
              <tr key={it.id} className="hover:bg-aastra-pearl/50 dark:hover:bg-neutral-900/50">
                <td className="px-4 py-3 flex items-center gap-3">
                  {it.images?.[0]?.url && (
                    <img
                      src={resolveAssetUrl(it.images[0].url)}
                      alt=""
                      className="w-10 h-10 object-contain bg-white border border-aastra-pearl p-1 shrink-0"
                    />
                  )}
                  <div>
                    <div className="font-semibold text-aastra-black dark:text-white">{it.name}</div>
                    <div className="text-[11px] text-aastra-gray">
                      {it.images?.length || 0} image(s) · {it.finishes?.length || 0} finish(es)
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 font-mono text-xs font-semibold">{it.code}</td>
                <td className="px-4 py-3 text-xs">
                  <div className="font-medium text-aastra-black dark:text-neutral-200">
                    {it.category_name}
                  </div>
                  {it.sub_category_name && (
                    <div className="text-[11px] text-aastra-gold-dark dark:text-aastra-gold">
                      ↳ {it.sub_category_name}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3 text-xs">
                  <span className="px-2 py-0.5 bg-aastra-pearl dark:bg-neutral-800 text-[10px] font-medium">
                    {getTemplateMeta(it.pdf_template).name}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {(it.groups || []).map((g) => (
                      <span key={g.id} className="px-2 py-0.5 bg-aastra-pearl dark:bg-neutral-800 text-[10px] font-mono">
                        {g.page_code}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3 text-right space-x-2 whitespace-nowrap">
                  <button type="button" onClick={() => openEdit(it)} className="p-1.5 text-aastra-slate hover:text-aastra-gold" title="Edit">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button type="button" onClick={() => handleDelete(it)} className="p-1.5 text-red-500 hover:text-red-700" title="Delete">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
