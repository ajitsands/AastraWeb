import React, { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Upload, X, FolderTree, CornerDownRight } from 'lucide-react';
import { api, resolveAssetUrl } from '../../api/client';

const emptyCatForm = {
  name: '',
  section_label: 'ACCESSORIES',
  side_tab_label: 'DOOR HARDWARE',
  chapter_number: 8,
  description: '',
  image_url: '',
  sort_order: 0,
  is_active: true,
};

const emptySubForm = {
  category_id: '',
  name: '',
  description: '',
  image_url: '',
  sort_order: 0,
  is_active: true,
};

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [form, setForm] = useState(emptyCatForm);
  const [subForm, setSubForm] = useState(emptySubForm);
  const [editingId, setEditingId] = useState(null);
  const [editingSubId, setEditingSubId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showSubForm, setShowSubForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const load = () => {
    Promise.all([api.getCategories(true), api.getSubCategories({ all: 1 })])
      .then(([cats, subs]) => {
        setCategories(cats);
        setSubCategories(subs);
      })
      .catch(() => {});
  };

  useEffect(load, []);

  // Main Category handlers
  const openNewCat = () => {
    setForm(emptyCatForm);
    setEditingId(null);
    setShowSubForm(false);
    setError('');
    setShowForm(true);
  };

  const openEditCat = (cat) => {
    setForm({
      name: cat.name || '',
      section_label: cat.section_label || 'ACCESSORIES',
      side_tab_label: cat.side_tab_label || 'DOOR HARDWARE',
      chapter_number: cat.chapter_number ?? 1,
      description: cat.description || '',
      image_url: cat.image_url || '',
      sort_order: cat.sort_order ?? 0,
      is_active: !!Number(cat.is_active),
    });
    setEditingId(cat.id);
    setShowSubForm(false);
    setError('');
    setShowForm(true);
  };

  const handleUpload = async (e, target = 'cat') => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const res = await api.uploadImage(file);
      if (target === 'cat') setForm((f) => ({ ...f, image_url: res.url }));
      else setSubForm((f) => ({ ...f, image_url: res.url }));
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSaveCat = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (editingId) await api.updateCategory(editingId, form);
      else await api.createCategory(form);
      setShowForm(false);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCat = async (cat) => {
    if (!window.confirm(`Delete Main Category "${cat.name}"? All sub-categories and items inside it will also be removed.`)) {
      return;
    }
    await api.deleteCategory(cat.id);
    load();
  };

  // Sub Category handlers
  const openNewSub = (defaultCatId = '') => {
    setSubForm({
      ...emptySubForm,
      category_id: defaultCatId || categories[0]?.id || '',
    });
    setEditingSubId(null);
    setShowForm(false);
    setError('');
    setShowSubForm(true);
  };

  const openEditSub = (sub) => {
    setSubForm({
      category_id: sub.category_id,
      name: sub.name || '',
      description: sub.description || '',
      image_url: sub.image_url || '',
      sort_order: sub.sort_order ?? 0,
      is_active: !!Number(sub.is_active),
    });
    setEditingSubId(sub.id);
    setShowForm(false);
    setError('');
    setShowSubForm(true);
  };

  const handleSaveSub = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (editingSubId) await api.updateSubCategory(editingSubId, subForm);
      else await api.createSubCategory(subForm);
      setShowSubForm(false);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSub = async (sub) => {
    if (!window.confirm(`Delete Sub Category "${sub.name}"?`)) return;
    await api.deleteSubCategory(sub.id);
    load();
  };

  const activeCategories = categories.filter((c) => Number(c.is_active) === 1);
  const inactiveCategories = categories.filter((c) => Number(c.is_active) !== 1);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-aastra-black dark:text-white">
            Main Categories &amp; Sub Categories
          </h1>
          <p className="text-sm text-aastra-slate dark:text-neutral-400">
            Manage Main Categories (with AH Chapter Numbers) and their Sub Categories for adding
            hardware items.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => openNewSub()}
            className="inline-flex items-center gap-2 px-4 py-2.5 border border-aastra-gold text-aastra-black dark:text-aastra-gold hover:bg-aastra-gold hover:text-black text-xs font-semibold uppercase tracking-widest transition"
          >
            <Plus className="w-4 h-4" /> Add Sub Category
          </button>
          <button
            type="button"
            onClick={openNewCat}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-aastra-black dark:bg-aastra-gold text-white dark:text-black text-xs font-semibold uppercase tracking-widest"
          >
            <Plus className="w-4 h-4" /> Add Main Category
          </button>
        </div>
      </div>

      {/* Main Category Form */}
      {showForm && (
        <form
          onSubmit={handleSaveCat}
          className="bg-white dark:bg-[#181818] border border-aastra-gold p-6 space-y-4 shadow-classic"
        >
          <div className="flex items-center justify-between border-b border-aastra-pearl dark:border-neutral-800 pb-3">
            <h2 className="text-xl font-semibold">
              {editingId ? 'Edit Main Category' : 'New Main Category'}
            </h2>
            <button type="button" onClick={() => setShowForm(false)}>
              <X className="w-5 h-5 text-aastra-gray" />
            </button>
          </div>

          {error && <div className="p-3 text-xs bg-red-50 text-red-700 border border-red-300">{error}</div>}

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1">
                Main Category Name *
              </label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Door Hinges"
                className="w-full px-3 py-2 text-sm bg-aastra-pearl dark:bg-neutral-900 border border-aastra-silver dark:border-neutral-700"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1">
                Chapter Number
              </label>
              <input
                type="number"
                min="1"
                value={form.chapter_number}
                onChange={(e) => setForm({ ...form, chapter_number: Number(e.target.value) })}
                className="w-full px-3 py-2 text-sm bg-aastra-pearl dark:bg-neutral-900 border border-aastra-silver dark:border-neutral-700"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1">
                Sort Order
              </label>
              <input
                type="number"
                value={form.sort_order}
                onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })}
                className="w-full px-3 py-2 text-sm bg-aastra-pearl dark:bg-neutral-900 border border-aastra-silver dark:border-neutral-700"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1">
                PDF Section Label (Top Right)
              </label>
              <input
                type="text"
                value={form.section_label}
                onChange={(e) => setForm({ ...form, section_label: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-aastra-pearl dark:bg-neutral-900 border border-aastra-silver dark:border-neutral-700"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1">
                PDF Vertical Side Tab
              </label>
              <input
                type="text"
                value={form.side_tab_label}
                onChange={(e) => setForm({ ...form, side_tab_label: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-aastra-pearl dark:bg-neutral-900 border border-aastra-silver dark:border-neutral-700"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1">
              Description
            </label>
            <textarea
              rows="2"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-aastra-pearl dark:bg-neutral-900 border border-aastra-silver dark:border-neutral-700"
            />
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[220px]">
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1">
                Cover Image URL
              </label>
              <input
                type="text"
                value={form.image_url}
                onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-aastra-pearl dark:bg-neutral-900 border border-aastra-silver dark:border-neutral-700"
              />
            </div>
            <label className="mt-5 inline-flex items-center gap-2 px-4 py-2 border border-aastra-silver dark:border-neutral-700 text-xs font-medium cursor-pointer hover:border-aastra-gold">
              <Upload className="w-3.5 h-3.5" />
              {uploading ? 'Uploading...' : 'Upload Image'}
              <input type="file" accept="image/*" onChange={(e) => handleUpload(e, 'cat')} className="hidden" />
            </label>
            <label className="mt-5 inline-flex items-center gap-2 text-xs font-medium">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
              />
              Active
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowForm(false)} className="px-5 py-2 border border-aastra-silver dark:border-neutral-700 text-xs uppercase tracking-wider">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="px-6 py-2 bg-aastra-black dark:bg-aastra-gold text-white dark:text-black text-xs font-semibold uppercase tracking-wider">
              {saving ? 'Saving...' : 'Save Main Category'}
            </button>
          </div>
        </form>
      )}

      {/* Sub Category Form */}
      {showSubForm && (
        <form
          onSubmit={handleSaveSub}
          className="bg-white dark:bg-[#181818] border border-aastra-gold p-6 space-y-4 shadow-classic"
        >
          <div className="flex items-center justify-between border-b border-aastra-pearl dark:border-neutral-800 pb-3">
            <h2 className="text-xl font-semibold">
              {editingSubId ? 'Edit Sub Category' : 'New Sub Category'}
            </h2>
            <button type="button" onClick={() => setShowSubForm(false)}>
              <X className="w-5 h-5 text-aastra-gray" />
            </button>
          </div>

          {error && <div className="p-3 text-xs bg-red-50 text-red-700 border border-red-300">{error}</div>}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1">
                Parent Main Category *
              </label>
              <select
                required
                value={subForm.category_id}
                onChange={(e) => setSubForm({ ...subForm, category_id: Number(e.target.value) })}
                className="w-full px-3 py-2 text-sm bg-aastra-pearl dark:bg-neutral-900 border border-aastra-silver dark:border-neutral-700"
              >
                <option value="">Select Main Category</option>
                {activeCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    Ch.{c.chapter_number} — {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1">
                Sub Category Name *
              </label>
              <input
                type="text"
                required
                value={subForm.name}
                onChange={(e) => setSubForm({ ...subForm, name: e.target.value })}
                placeholder="e.g. Concealed Hinges"
                className="w-full px-3 py-2 text-sm bg-aastra-pearl dark:bg-neutral-900 border border-aastra-silver dark:border-neutral-700"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1">
                Sort Order
              </label>
              <input
                type="number"
                value={subForm.sort_order}
                onChange={(e) => setSubForm({ ...subForm, sort_order: Number(e.target.value) })}
                className="w-full px-3 py-2 text-sm bg-aastra-pearl dark:bg-neutral-900 border border-aastra-silver dark:border-neutral-700"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1">
              Description (Optional)
            </label>
            <textarea
              rows="2"
              value={subForm.description}
              onChange={(e) => setSubForm({ ...subForm, description: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-aastra-pearl dark:bg-neutral-900 border border-aastra-silver dark:border-neutral-700"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowSubForm(false)} className="px-5 py-2 border border-aastra-silver dark:border-neutral-700 text-xs uppercase tracking-wider">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="px-6 py-2 bg-aastra-black dark:bg-aastra-gold text-white dark:text-black text-xs font-semibold uppercase tracking-wider">
              {saving ? 'Saving...' : 'Save Sub Category'}
            </button>
          </div>
        </form>
      )}

      {/* Hierarchical Main -> Sub Categories List */}
      <div className="space-y-4">
        {activeCategories.map((cat) => {
          const subs = subCategories.filter((s) => Number(s.category_id) === Number(cat.id));
          return (
            <div
              key={cat.id}
              className="bg-white dark:bg-[#181818] border border-aastra-silver dark:border-neutral-800 overflow-hidden"
            >
              {/* Main Category Header Row */}
              <div className="p-4 flex flex-wrap items-center justify-between gap-3 bg-aastra-pearl/70 dark:bg-neutral-900/70 border-b border-aastra-silver/60 dark:border-neutral-800">
                <div className="flex items-center gap-3">
                  {cat.image_url ? (
                    <img
                      src={resolveAssetUrl(cat.image_url)}
                      alt=""
                      className="w-10 h-10 object-contain bg-white border border-aastra-pearl p-1"
                    />
                  ) : (
                    <FolderTree className="w-5 h-5 text-aastra-gold" />
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-aastra-black dark:text-white">
                        {cat.name}
                      </span>
                      <span className="px-2 py-0.5 bg-aastra-black text-aastra-gold font-mono text-[10px]">
                        Ch.{cat.chapter_number}
                      </span>
                      <span className="text-[11px] text-aastra-gray">
                        {subs.length} sub-categories · {cat.item_count || 0} items
                      </span>
                    </div>
                    <div className="text-[11px] text-aastra-gray">
                      {cat.section_label} · {cat.side_tab_label}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => openNewSub(cat.id)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold border border-aastra-gold text-aastra-gold-dark dark:text-aastra-gold hover:bg-aastra-gold hover:text-black transition"
                  >
                    <Plus className="w-3 h-3" /> Sub Category
                  </button>
                  <button
                    type="button"
                    onClick={() => openEditCat(cat)}
                    className="p-1.5 text-aastra-slate hover:text-aastra-gold"
                    title="Edit Main Category"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteCat(cat)}
                    className="p-1.5 text-red-500 hover:text-red-700"
                    title="Delete Main Category"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Sub Categories Rows */}
              <div className="divide-y divide-aastra-pearl dark:divide-neutral-800/80">
                {subs.length === 0 ? (
                  <div className="px-6 py-3 text-xs text-aastra-gray italic">
                    No sub-categories yet. Click "+ Sub Category" above to add one.
                  </div>
                ) : (
                  subs.map((sub) => (
                    <div
                      key={sub.id}
                      className="px-6 py-2.5 flex items-center justify-between gap-3 hover:bg-aastra-pearl/40 dark:hover:bg-neutral-900/40"
                    >
                      <div className="flex items-center gap-2.5 text-sm">
                        <CornerDownRight className="w-3.5 h-3.5 text-aastra-gold shrink-0" />
                        <span className="font-medium text-aastra-black dark:text-neutral-200">
                          {sub.name}
                        </span>
                        <span className="text-[11px] font-mono text-aastra-gray">
                          ({sub.item_count || 0} items)
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => openEditSub(sub)}
                          className="p-1 text-aastra-slate hover:text-aastra-gold"
                          title="Edit Sub Category"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteSub(sub)}
                          className="p-1 text-red-500 hover:text-red-700"
                          title="Delete Sub Category"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}

        {inactiveCategories.length > 0 && (
          <details className="text-xs text-aastra-gray">
            <summary className="cursor-pointer py-2 hover:text-aastra-gold">
              Archived / Inactive Categories ({inactiveCategories.length})
            </summary>
            <div className="mt-2 space-y-1">
              {inactiveCategories.map((c) => (
                <div key={c.id} className="flex items-center justify-between px-4 py-2 bg-white dark:bg-[#181818] border border-aastra-silver/50 dark:border-neutral-800">
                  <span>{c.name}</span>
                  <button type="button" onClick={() => openEditCat(c)} className="text-aastra-gold hover:underline">
                    Edit / Reactivate
                  </button>
                </div>
              ))}
            </div>
          </details>
        )}
      </div>
    </div>
  );
}
