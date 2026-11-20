import React, { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Upload, X, Image as ImageIcon } from 'lucide-react';
import { api, resolveAssetUrl } from '../../api/client';
import TableBuilder, { createBlankTable } from '../../components/TableBuilder';

const createEmptyItem = (defaultCatId = '') => ({
  category_id: defaultCatId,
  name: '',
  code: '',
  subtitle: '',
  material: 'Stainless Steel',
  specifications: '',
  footnote: '"Special finishes & sizes available upon request subject to minimum order quantity"',
  images: [], // Max 3: [{ url, caption, type: 'photo' | 'drawing' }]
  spec_table: createBlankTable(3, 6),
  finish_ids: [],
  group_ids: [],
  is_featured: false,
  is_active: true,
  sort_order: 0,
});

export default function AdminItems() {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
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
      api.getCategories(true),
      api.getFinishes(true),
      api.getGroups({ all: 1 }),
    ])
      .then(([its, cats, fins, grps]) => {
        setItems(its);
        setCategories(cats);
        setFinishes(fins);
        setGroups(grps);
      })
      .catch(() => {});
  };

  useEffect(loadAll, []);

  const openNew = () => {
    setForm(createEmptyItem(categories[0]?.id || ''));
    setEditingId(null);
    setError('');
    setShowForm(true);
  };

  const openEdit = (it) => {
    setForm({
      category_id: it.category_id,
      name: it.name || '',
      code: it.code || '',
      subtitle: it.subtitle || '',
      material: it.material || '',
      specifications: it.specifications || '',
      footnote: it.footnote || '',
      images: (it.images || []).slice(0, 3),
      spec_table: it.spec_table || createBlankTable(3, 6),
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
    if (!file || form.images.length >= 3) return;
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
      if (editingId) {
        await api.updateItem(editingId, form);
      } else {
        await api.createItem(form);
      }
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
          <h1 className="text-3xl font-semibold text-aastra-black dark:text-white">
            Hardware Items &amp; Specification Tables
          </h1>
          <p className="text-sm text-aastra-slate dark:text-neutral-400">
            Add products with model codes, 1–3 photos/drawings, dynamic merged-cell tables, and
            assign to PDF catalogue groups.
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
          className="bg-white dark:bg-[#181818] border border-aastra-gold p-6 space-y-6 shadow-classic"
        >
          <div className="flex items-center justify-between border-b border-aastra-pearl dark:border-neutral-800 pb-3">
            <h2 className="text-xl font-semibold">{editingId ? 'Edit Item' : 'New Hardware Item'}</h2>
            <button type="button" onClick={() => setShowForm(false)}>
              <X className="w-5 h-5 text-aastra-gray" />
            </button>
          </div>

          {error && <div className="p-3 text-xs bg-red-50 text-red-700 border border-red-300">{error}</div>}

          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1">
                Item Name *
              </label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Floor Mounted Half Dome Door Stop"
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
                placeholder="e.g. AAE.671"
                className="w-full px-3 py-2 text-sm font-mono bg-aastra-pearl dark:bg-neutral-900 border border-aastra-silver dark:border-neutral-700"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1">
                Category *
              </label>
              <select
                required
                value={form.category_id}
                onChange={(e) => setForm({ ...form, category_id: Number(e.target.value) })}
                className="w-full px-3 py-2 text-sm bg-aastra-pearl dark:bg-neutral-900 border border-aastra-silver dark:border-neutral-700"
              >
                <option value="">Select Category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    Ch.{c.chapter_number} — {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1">
                Specifications (One bullet point per line)
              </label>
              <textarea
                rows="5"
                value={form.specifications}
                onChange={(e) => setForm({ ...form, specifications: e.target.value })}
                placeholder={"Floor mounted half dome door stop\nStainless steel SS304 grade\n43mm diameter\nWith locating pin\nSupplied with suitable screws and fixings"}
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
                  placeholder="Stainless Steel / Solid Brass / Zinc Alloy"
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

          {/* 1 to 3 Images Max (Product Photos + Technical Drawings) */}
          <div className="border border-aastra-silver dark:border-neutral-800 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-aastra-gold" /> Product &amp; Technical Drawing
                  Images (1 to 3 Max)
                </h3>
                <p className="text-[11px] text-aastra-gray">
                  Upload product photos and technical CAD/dimension drawings ({form.images.length}/3
                  added).
                </p>
              </div>
              {form.images.length < 3 && (
                <label className="inline-flex items-center gap-1.5 px-4 py-2 bg-aastra-black dark:bg-aastra-gold text-white dark:text-black text-xs font-semibold uppercase tracking-wider cursor-pointer">
                  <Upload className="w-3.5 h-3.5" />
                  {uploadingIdx ? 'Uploading...' : 'Upload Image'}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {form.images.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                    <div className="h-28 bg-white border border-aastra-pearl flex items-center justify-center p-2">
                      <img
                        src={resolveAssetUrl(img.url)}
                        alt=""
                        className="max-h-full max-w-full object-contain"
                      />
                    </div>
                    <input
                      type="text"
                      value={img.caption || ''}
                      onChange={(e) => updateImageField(idx, 'caption', e.target.value)}
                      placeholder="Caption (e.g. Product View / Drawing)"
                      className="w-full px-2 py-1 text-xs bg-white dark:bg-neutral-800 border border-aastra-silver dark:border-neutral-700"
                    />
                    <select
                      value={img.type || 'photo'}
                      onChange={(e) => updateImageField(idx, 'type', e.target.value)}
                      className="w-full px-2 py-1 text-xs bg-white dark:bg-neutral-800 border border-aastra-silver dark:border-neutral-700"
                    >
                      <option value="photo">Product Photo</option>
                      <option value="drawing">Technical Drawing</option>
                    </select>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Dynamic Table Builder with Cell Merging */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider">
              Specification &amp; Finishes Table (Custom Rows/Cols + Cell Merging)
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
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-5 py-2 border border-aastra-silver dark:border-neutral-700 text-xs uppercase tracking-wider"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2 bg-aastra-black dark:bg-aastra-gold text-white dark:text-black text-xs font-semibold uppercase tracking-wider"
              >
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
              <th className="px-4 py-3">Category</th>
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
                      className="w-10 h-10 object-contain bg-white border border-aastra-pearl p-1"
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
                <td className="px-4 py-3 text-xs">{it.category_name}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {(it.groups || []).map((g) => (
                      <span
                        key={g.id}
                        className="px-2 py-0.5 bg-aastra-pearl dark:bg-neutral-800 text-[10px] font-mono"
                      >
                        {g.page_code}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3 text-right space-x-2">
                  <button
                    type="button"
                    onClick={() => openEdit(it)}
                    className="p-1.5 text-aastra-slate hover:text-aastra-gold"
                    title="Edit"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(it)}
                    className="p-1.5 text-red-500 hover:text-red-700"
                    title="Delete"
                  >
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
