import React, { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Upload, X } from 'lucide-react';
import { api, resolveAssetUrl } from '../../api/client';

const emptyForm = {
  name: '',
  section_label: 'ACCESSORIES',
  side_tab_label: 'DOOR HARDWARE',
  chapter_number: 8,
  description: '',
  image_url: '',
  sort_order: 0,
  is_active: true,
};

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const load = () => {
    api.getCategories(true).then(setCategories).catch(() => {});
  };

  useEffect(load, []);

  const openNew = () => {
    setForm(emptyForm);
    setEditingId(null);
    setError('');
    setShowForm(true);
  };

  const openEdit = (cat) => {
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
    setError('');
    setShowForm(true);
  };

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const res = await api.uploadImage(file);
      setForm((f) => ({ ...f, image_url: res.url }));
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (editingId) {
        await api.updateCategory(editingId, form);
      } else {
        await api.createCategory(form);
      }
      setShowForm(false);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (cat) => {
    if (!window.confirm(`Delete category "${cat.name}"? All items inside it will also be removed.`)) {
      return;
    }
    await api.deleteCategory(cat.id);
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-aastra-black dark:text-white">Categories</h1>
          <p className="text-sm text-aastra-slate dark:text-neutral-400">
            Organize hardware families with AH Chapter Numbers and PDF section labels.
          </p>
        </div>
        <button
          type="button"
          onClick={openNew}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-aastra-black dark:bg-aastra-gold text-white dark:text-black text-xs font-semibold uppercase tracking-widest"
        >
          <Plus className="w-4 h-4" /> Add Category
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSave}
          className="bg-white dark:bg-[#181818] border border-aastra-gold p-6 space-y-4 shadow-classic"
        >
          <div className="flex items-center justify-between border-b border-aastra-pearl dark:border-neutral-800 pb-3">
            <h2 className="text-xl font-semibold">
              {editingId ? 'Edit Category' : 'New Category'}
            </h2>
            <button type="button" onClick={() => setShowForm(false)}>
              <X className="w-5 h-5 text-aastra-gray" />
            </button>
          </div>

          {error && <div className="p-3 text-xs bg-red-50 text-red-700 border border-red-300">{error}</div>}

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1">
                Category Name *
              </label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Door Stops"
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
                placeholder="ACCESSORIES / HANDLES / HINGES"
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
                placeholder="DOOR HARDWARE"
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
            <div className="flex-1 min-w-[240px]">
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1">
                Cover Image URL
              </label>
              <input
                type="text"
                value={form.image_url}
                onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                placeholder="/uploads/... or /samples/..."
                className="w-full px-3 py-2 text-sm bg-aastra-pearl dark:bg-neutral-900 border border-aastra-silver dark:border-neutral-700"
              />
            </div>
            <label className="mt-5 inline-flex items-center gap-2 px-4 py-2 border border-aastra-silver dark:border-neutral-700 text-xs font-medium cursor-pointer hover:border-aastra-gold">
              <Upload className="w-3.5 h-3.5" />
              {uploading ? 'Uploading...' : 'Upload Image'}
              <input type="file" accept="image/*" onChange={handleUpload} className="hidden" />
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
              {saving ? 'Saving...' : 'Save Category'}
            </button>
          </div>
        </form>
      )}

      {/* Table */}
      <div className="bg-white dark:bg-[#181818] border border-aastra-silver dark:border-neutral-800 overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-aastra-pearl dark:bg-neutral-900 text-[11px] uppercase tracking-wider text-aastra-slate dark:text-neutral-400 border-b border-aastra-silver dark:border-neutral-800">
            <tr>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Chapter</th>
              <th className="px-4 py-3">Section / Tab</th>
              <th className="px-4 py-3">Items</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-aastra-pearl dark:divide-neutral-800">
            {categories.map((cat) => (
              <tr key={cat.id} className="hover:bg-aastra-pearl/50 dark:hover:bg-neutral-900/50">
                <td className="px-4 py-3 flex items-center gap-3">
                  {cat.image_url && (
                    <img
                      src={resolveAssetUrl(cat.image_url)}
                      alt=""
                      className="w-10 h-10 object-contain bg-white border border-aastra-pearl p-1"
                    />
                  )}
                  <div>
                    <div className="font-semibold text-aastra-black dark:text-white">{cat.name}</div>
                    <div className="text-xs font-mono text-aastra-gray">{cat.slug}</div>
                  </div>
                </td>
                <td className="px-4 py-3 font-mono text-xs">Ch. {cat.chapter_number}</td>
                <td className="px-4 py-3 text-xs text-aastra-slate dark:text-neutral-400">
                  {cat.section_label} · {cat.side_tab_label}
                </td>
                <td className="px-4 py-3 text-xs">{cat.item_count || 0}</td>
                <td className="px-4 py-3 text-right space-x-2">
                  <button
                    type="button"
                    onClick={() => openEdit(cat)}
                    className="p-1.5 text-aastra-slate hover:text-aastra-gold"
                    title="Edit"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(cat)}
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
