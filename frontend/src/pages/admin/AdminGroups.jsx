import React, { useEffect, useRef, useState } from 'react';
import { Plus, Pencil, Trash2, Eye, X, ArrowUp, ArrowDown } from 'lucide-react';
import { api } from '../../api/client';
import CataloguePdfPreview from '../../components/CataloguePdfPreview';

const createEmptyGroup = (defaultCatId = '') => ({
  category_id: defaultCatId,
  title: '',
  prefix: 'AH',
  chapter_number: '8',
  page_number: '01',
  section_label: 'ACCESSORIES',
  category_badge: 'DOOR STOPS',
  side_tab_label: 'DOOR HARDWARE',
  layout_mode: 'standard',
  show_guarantee_seal: true,
  footer_website: 'www.aastra.uk',
  item_ids: [],
  is_active: true,
});

export default function AdminGroups() {
  const [groups, setGroups] = useState([]);
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(createEmptyGroup());
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [previewGroup, setPreviewGroup] = useState(null);
  const previewRef = useRef(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (previewGroup && previewRef.current) {
      setTimeout(() => {
        previewRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 60);
    }
  }, [previewGroup]);

  const loadAll = () => {
    Promise.all([
      api.getGroups({ all: 1 }),
      api.getCategories(true),
      api.getItems({ all: 1 }),
    ])
      .then(([grps, cats, its]) => {
        setGroups(grps);
        setCategories(cats);
        setItems(its);
        if (previewGroup) {
          const updated = grps.find((g) => g.id === previewGroup.id);
          if (updated) setPreviewGroup(updated);
        }
      })
      .catch(() => {});
  };

  useEffect(loadAll, []);

  const openNew = () => {
    const firstCat = categories[0];
    setForm({
      ...createEmptyGroup(firstCat?.id || ''),
      chapter_number: String(firstCat?.chapter_number || '8'),
      section_label: firstCat?.section_label || 'ACCESSORIES',
      category_badge: (firstCat?.name || 'HARDWARE').toUpperCase(),
      side_tab_label: firstCat?.side_tab_label || 'DOOR HARDWARE',
    });
    setEditingId(null);
    setError('');
    setShowForm(true);
  };

  const openEdit = (grp) => {
    setForm({
      category_id: grp.category_id,
      title: grp.title || '',
      prefix: grp.prefix || 'AH',
      chapter_number: String(grp.chapter_number || '8'),
      page_number: String(grp.page_number || '01'),
      section_label: grp.section_label || 'ACCESSORIES',
      category_badge: grp.category_badge || '',
      side_tab_label: grp.side_tab_label || 'DOOR HARDWARE',
      layout_mode: grp.layout_mode || 'standard',
      show_guarantee_seal: !!Number(grp.show_guarantee_seal),
      footer_website: grp.footer_website || 'www.aastra.uk',
      item_ids: grp.item_ids || [],
      is_active: !!Number(grp.is_active),
    });
    setEditingId(grp.id);
    setError('');
    setShowForm(true);
  };

  const handleCategoryChange = (catId) => {
    const cat = categories.find((c) => Number(c.id) === Number(catId));
    setForm((f) => ({
      ...f,
      category_id: Number(catId),
      chapter_number: cat ? String(cat.chapter_number) : f.chapter_number,
      section_label: cat ? cat.section_label : f.section_label,
      category_badge: cat ? cat.name.toUpperCase() : f.category_badge,
      side_tab_label: cat ? cat.side_tab_label : f.side_tab_label,
    }));
  };

  const toggleItem = (itemId) => {
    setForm((f) => {
      if (f.item_ids.includes(itemId)) {
        return { ...f, item_ids: f.item_ids.filter((id) => id !== itemId) };
      }
      return { ...f, item_ids: [...f.item_ids, itemId] };
    });
  };

  const moveItem = (idx, dir) => {
    setForm((f) => {
      const next = [...f.item_ids];
      const target = idx + dir;
      if (target < 0 || target >= next.length) return f;
      [next[idx], next[target]] = [next[target], next[idx]];
      return { ...f, item_ids: next };
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload = {
        ...form,
        page_code: `${form.prefix}.${form.chapter_number}.${form.page_number}`,
      };
      if (editingId) {
        await api.updateGroup(editingId, payload);
      } else {
        await api.createGroup(payload);
      }
      setShowForm(false);
      loadAll();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (grp) => {
    if (!window.confirm(`Delete PDF Page Group "${grp.page_code} — ${grp.title}"?`)) return;
    await api.deleteGroup(grp.id);
    if (previewGroup?.id === grp.id) setPreviewGroup(null);
    loadAll();
  };

  const computedCode = `${form.prefix || 'AH'}.${form.chapter_number || '8'}.${form.page_number || '01'}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-aastra-black dark:text-white">
            Catalogue PDF Page Groups
          </h1>
          <p className="text-sm text-aastra-slate dark:text-neutral-400">
            Group items into numbered A4 catalogue pages (e.g.{' '}
            <span className="font-mono">AH.8.06</span> = AASTRA Hardware · Chapter · Page) and
            generate downloadable PDFs.
          </p>
        </div>
        <button
          type="button"
          onClick={openNew}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-aastra-black dark:bg-aastra-gold text-white dark:text-black text-xs font-semibold uppercase tracking-widest"
        >
          <Plus className="w-4 h-4" /> Create PDF Page Group
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSave}
          className="bg-white dark:bg-[#181818] border border-aastra-gold p-6 space-y-5 shadow-classic"
        >
          <div className="flex items-center justify-between border-b border-aastra-pearl dark:border-neutral-800 pb-3">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-semibold">
                {editingId ? 'Edit PDF Page Group' : 'New PDF Page Group'}
              </h2>
              <span className="px-2.5 py-0.5 bg-aastra-black text-aastra-gold font-mono text-xs font-bold">
                {computedCode}
              </span>
            </div>
            <button type="button" onClick={() => setShowForm(false)}>
              <X className="w-5 h-5 text-aastra-gray" />
            </button>
          </div>

          {error && <div className="p-3 text-xs bg-red-50 text-red-700 border border-red-300">{error}</div>}

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1">
                Page Group Title *
              </label>
              <input
                type="text"
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. Floor Mounted Door Stops"
                className="w-full px-3 py-2 text-sm bg-aastra-pearl dark:bg-neutral-900 border border-aastra-silver dark:border-neutral-700"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1">
                Category *
              </label>
              <select
                required
                value={form.category_id}
                onChange={(e) => handleCategoryChange(e.target.value)}
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

          {/* AH.Chapter.Page numbering */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1">
                Prefix
              </label>
              <input
                type="text"
                value={form.prefix}
                onChange={(e) => setForm({ ...form, prefix: e.target.value })}
                className="w-full px-3 py-2 text-sm font-mono bg-aastra-pearl dark:bg-neutral-900 border border-aastra-silver dark:border-neutral-700"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1">
                Chapter No.
              </label>
              <input
                type="text"
                value={form.chapter_number}
                onChange={(e) => setForm({ ...form, chapter_number: e.target.value })}
                className="w-full px-3 py-2 text-sm font-mono bg-aastra-pearl dark:bg-neutral-900 border border-aastra-silver dark:border-neutral-700"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1">
                Page No.
              </label>
              <input
                type="text"
                value={form.page_number}
                onChange={(e) => setForm({ ...form, page_number: e.target.value })}
                placeholder="06"
                className="w-full px-3 py-2 text-sm font-mono bg-aastra-pearl dark:bg-neutral-900 border border-aastra-silver dark:border-neutral-700"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1">
                Section Badge
              </label>
              <input
                type="text"
                value={form.section_label}
                onChange={(e) => setForm({ ...form, section_label: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-aastra-pearl dark:bg-neutral-900 border border-aastra-silver dark:border-neutral-700"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1">
                Category Pill
              </label>
              <input
                type="text"
                value={form.category_badge}
                onChange={(e) => setForm({ ...form, category_badge: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-aastra-pearl dark:bg-neutral-900 border border-aastra-silver dark:border-neutral-700"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1">
                Layout Density
              </label>
              <select
                value={form.layout_mode}
                onChange={(e) => setForm({ ...form, layout_mode: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-aastra-pearl dark:bg-neutral-900 border border-aastra-silver dark:border-neutral-700"
              >
                <option value="standard">Standard (1–2 items)</option>
                <option value="compact">Compact (3–4 items)</option>
              </select>
            </div>
          </div>

          {/* Item Selector & Ordering */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="border border-aastra-silver dark:border-neutral-800 p-4">
              <div className="text-xs font-semibold uppercase tracking-wider mb-2">
                Available Items (Click to add/remove)
              </div>
              <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                {items.map((it) => {
                  const selected = form.item_ids.includes(Number(it.id));
                  return (
                    <label
                      key={it.id}
                      className={`flex items-center gap-2 p-2 text-xs border cursor-pointer transition ${
                        selected
                          ? 'border-aastra-gold bg-aastra-gold-tint dark:bg-aastra-gold/15'
                          : 'border-aastra-pearl dark:border-neutral-800 hover:border-aastra-silver'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => toggleItem(Number(it.id))}
                      />
                      <span className="font-mono font-semibold">{it.code}</span>
                      <span className="truncate">{it.name}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="border border-aastra-silver dark:border-neutral-800 p-4">
              <div className="text-xs font-semibold uppercase tracking-wider mb-2">
                Selected Items Order on PDF Page ({form.item_ids.length})
              </div>
              {form.item_ids.length === 0 ? (
                <p className="text-xs text-aastra-gray py-6 text-center">
                  Select items from the left to include them on this A4 PDF sheet.
                </p>
              ) : (
                <div className="space-y-1.5">
                  {form.item_ids.map((id, idx) => {
                    const it = items.find((x) => Number(x.id) === Number(id));
                    if (!it) return null;
                    return (
                      <div
                        key={id}
                        className="flex items-center justify-between gap-2 p-2 bg-aastra-pearl dark:bg-neutral-900 border border-aastra-silver/60 dark:border-neutral-700 text-xs"
                      >
                        <div className="truncate">
                          <span className="font-mono font-semibold mr-2">{idx + 1}. {it.code}</span>
                          <span>{it.name}</span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button type="button" onClick={() => moveItem(idx, -1)} className="p-1 hover:text-aastra-gold">
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button type="button" onClick={() => moveItem(idx, 1)} className="p-1 hover:text-aastra-gold">
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                          <button type="button" onClick={() => toggleItem(id)} className="p-1 text-red-500">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-aastra-pearl dark:border-neutral-800">
            <div className="flex items-center gap-5 text-xs">
              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.show_guarantee_seal}
                  onChange={(e) => setForm({ ...form, show_guarantee_seal: e.target.checked })}
                />
                Show 10-Year Mechanical Guarantee Seal
              </label>
              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                />
                Published
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
                {saving ? 'Saving...' : 'Save PDF Group'}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Groups List */}
      <div className="bg-white dark:bg-[#181818] border border-aastra-silver dark:border-neutral-800 overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-aastra-pearl dark:bg-neutral-900 text-[11px] uppercase tracking-wider text-aastra-slate dark:text-neutral-400 border-b border-aastra-silver dark:border-neutral-800">
            <tr>
              <th className="px-4 py-3">Page Code</th>
              <th className="px-4 py-3">Group Title</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Models Included</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-aastra-pearl dark:divide-neutral-800">
            {groups.map((grp) => (
              <tr key={grp.id} className="hover:bg-aastra-pearl/50 dark:hover:bg-neutral-900/50">
                <td className="px-4 py-3">
                  <span className="px-2.5 py-1 bg-aastra-black text-aastra-gold font-mono text-xs font-bold">
                    {grp.page_code}
                  </span>
                </td>
                <td className="px-4 py-3 font-semibold text-aastra-black dark:text-white">
                  {grp.title}
                </td>
                <td className="px-4 py-3 text-xs">{grp.category_name}</td>
                <td className="px-4 py-3 text-xs font-mono text-aastra-slate dark:text-neutral-400">
                  {(grp.items || []).map((i) => i.code).join(', ') || 'None'}
                </td>
                <td className="px-4 py-3 text-right space-x-2">
                  <button
                    type="button"
                    onClick={() => setPreviewGroup(grp)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs bg-aastra-gold-tint dark:bg-aastra-gold/20 text-aastra-gold-dark dark:text-aastra-gold font-semibold hover:underline"
                  >
                    <Eye className="w-3.5 h-3.5" /> Preview / PDF
                  </button>
                  <button
                    type="button"
                    onClick={() => openEdit(grp)}
                    className="p-1.5 text-aastra-slate hover:text-aastra-gold"
                    title="Edit"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(grp)}
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

      {/* Live A4 PDF Preview & Export Drawer */}
      {previewGroup && (
        <div
          ref={previewRef}
          className="bg-aastra-pearl dark:bg-[#121212] border-2 border-aastra-gold p-4 sm:p-6 scroll-mt-20"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">
              Live A4 PDF Preview — <span className="font-mono">{previewGroup.page_code}</span>
            </h3>
            <button
              type="button"
              onClick={() => setPreviewGroup(null)}
              className="p-1.5 text-aastra-slate hover:text-aastra-black dark:hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <CataloguePdfPreview group={previewGroup} />
        </div>
      )}
    </div>
  );
}
