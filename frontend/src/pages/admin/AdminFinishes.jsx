import React, { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, X } from 'lucide-react';
import { api } from '../../api/client';

const emptyForm = {
  name: '',
  code: '',
  swatch_hex: '#C4C6C8',
  swatch_gradient: '',
  description: '',
  sort_order: 0,
  is_active: true,
};

export default function AdminFinishes() {
  const [finishes, setFinishes] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = () => {
    api.getFinishes(true).then(setFinishes).catch(() => {});
  };

  useEffect(load, []);

  const openNew = () => {
    setForm(emptyForm);
    setEditingId(null);
    setError('');
    setShowForm(true);
  };

  const openEdit = (fin) => {
    setForm({
      name: fin.name || '',
      code: fin.code || '',
      swatch_hex: fin.swatch_hex || '#C4C6C8',
      swatch_gradient: fin.swatch_gradient || '',
      description: fin.description || '',
      sort_order: fin.sort_order ?? 0,
      is_active: !!Number(fin.is_active),
    });
    setEditingId(fin.id);
    setError('');
    setShowForm(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (editingId) {
        await api.updateFinish(editingId, form);
      } else {
        await api.createFinish(form);
      }
      setShowForm(false);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (fin) => {
    if (!window.confirm(`Delete finish "${fin.name}"?`)) return;
    await api.deleteFinish(fin.id);
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-aastra-black dark:text-white">Finishes</h1>
          <p className="text-sm text-aastra-slate dark:text-neutral-400">
            Manage architectural metal finishes and color swatches shown across the website.
          </p>
        </div>
        <button
          type="button"
          onClick={openNew}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-aastra-black dark:bg-aastra-gold text-white dark:text-black text-xs font-semibold uppercase tracking-widest"
        >
          <Plus className="w-4 h-4" /> Add Finish
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSave}
          className="bg-white dark:bg-[#181818] border border-aastra-gold p-6 space-y-4 shadow-classic"
        >
          <div className="flex items-center justify-between border-b border-aastra-pearl dark:border-neutral-800 pb-3">
            <h2 className="text-xl font-semibold">{editingId ? 'Edit Finish' : 'New Finish'}</h2>
            <button type="button" onClick={() => setShowForm(false)}>
              <X className="w-5 h-5 text-aastra-gray" />
            </button>
          </div>

          {error && <div className="p-3 text-xs bg-red-50 text-red-700 border border-red-300">{error}</div>}

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1">
                Finish Name *
              </label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Satin Brass"
                className="w-full px-3 py-2 text-sm bg-aastra-pearl dark:bg-neutral-900 border border-aastra-silver dark:border-neutral-700"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1">
                Short Code
              </label>
              <input
                type="text"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                placeholder="e.g. SB"
                className="w-full px-3 py-2 text-sm font-mono bg-aastra-pearl dark:bg-neutral-900 border border-aastra-silver dark:border-neutral-700"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1">
                Swatch Color
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={form.swatch_hex}
                  onChange={(e) => setForm({ ...form, swatch_hex: e.target.value })}
                  className="h-9 w-12 cursor-pointer border border-aastra-silver"
                />
                <input
                  type="text"
                  value={form.swatch_hex}
                  onChange={(e) => setForm({ ...form, swatch_hex: e.target.value })}
                  className="flex-1 px-2 py-2 text-xs font-mono bg-aastra-pearl dark:bg-neutral-900 border border-aastra-silver dark:border-neutral-700"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1">
              Optional Metallic CSS Gradient
            </label>
            <input
              type="text"
              value={form.swatch_gradient}
              onChange={(e) => setForm({ ...form, swatch_gradient: e.target.value })}
              placeholder="linear-gradient(135deg, #DEC372 0%, #B3923C 55%, #D2B55E 100%)"
              className="w-full px-3 py-2 text-xs font-mono bg-aastra-pearl dark:bg-neutral-900 border border-aastra-silver dark:border-neutral-700"
            />
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
              {saving ? 'Saving...' : 'Save Finish'}
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {finishes.map((fin) => (
          <div
            key={fin.id}
            className="bg-white dark:bg-[#181818] border border-aastra-silver dark:border-neutral-800 p-5 flex flex-col justify-between"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div
                  style={{ background: fin.swatch_gradient || fin.swatch_hex }}
                  className="w-11 h-11 rounded-full border border-black/20 shadow-inner shrink-0"
                />
                <div>
                  <div className="font-semibold text-aastra-black dark:text-white">{fin.name}</div>
                  <div className="text-xs font-mono text-aastra-gray">
                    {fin.code} · {fin.item_count || 0} items
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => openEdit(fin)}
                  className="p-1 text-aastra-slate hover:text-aastra-gold"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(fin)}
                  className="p-1 text-red-500 hover:text-red-700"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            {fin.description && (
              <p className="mt-3 text-xs text-aastra-slate dark:text-neutral-400 line-clamp-2">
                {fin.description}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
