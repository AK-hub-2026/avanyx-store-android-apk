import React, { useState } from 'react';
import {
  Layers,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  FolderPlus,
  RefreshCw,
  Search,
  Sparkles,
  Database,
  X,
  Package
} from 'lucide-react';
import { CategoryItem, StoreApp } from '../../types';
import { adminSaveCategory, adminDeleteCategory, seedCategoriesAndBannersIfEmpty } from '../../services/firestoreService';

interface AdminCategoryManagerProps {
  categories: CategoryItem[];
  appsList: StoreApp[];
  onRefresh: () => void;
}

export const AdminCategoryManager: React.FC<AdminCategoryManagerProps> = ({
  categories,
  appsList,
  onRefresh
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryItem | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('Layers');
  const [displayOrder, setDisplayOrder] = useState<number>(0);
  const [featured, setFeatured] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'SUCCESS' | 'ERROR'; text: string } | null>(null);

  const openAddModal = () => {
    setEditingCategory(null);
    setName('');
    setSlug('');
    setDescription('');
    setIcon('Layers');
    setDisplayOrder(categories.length + 1);
    setFeatured(false);
    setModalOpen(true);
    setStatusMessage(null);
  };

  const openEditModal = (cat: CategoryItem) => {
    setEditingCategory(cat);
    setName(cat.name);
    setSlug(cat.slug || '');
    setDescription(cat.description || '');
    setIcon(cat.icon || 'Layers');
    setDisplayOrder(cat.displayOrder || 0);
    setFeatured(!!cat.featured);
    setModalOpen(true);
    setStatusMessage(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !slug.trim()) {
      setStatusMessage({ type: 'ERROR', text: 'Category Name and URL Slug are required.' });
      return;
    }

    setIsSubmitting(true);
    setStatusMessage(null);

    const targetId = editingCategory ? editingCategory.id : slug.toLowerCase().trim().replace(/[^a-z0-9_-]/g, '_');
    const categoryPayload: CategoryItem = {
      id: targetId,
      name: name.trim(),
      slug: slug.toLowerCase().trim(),
      description: description.trim(),
      icon: icon.trim() || 'Layers',
      displayOrder: Number(displayOrder) || 0,
      featured
    };

    try {
      await adminSaveCategory(categoryPayload);
      setStatusMessage({
        type: 'SUCCESS',
        text: `Category "${name}" successfully saved to Firestore live collection.`
      });
      setTimeout(() => {
        setModalOpen(false);
        onRefresh();
      }, 1200);
    } catch (err: any) {
      console.error('Error saving category:', err);
      setStatusMessage({
        type: 'ERROR',
        text: err.message || 'Failed to persist category to Firestore.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (cat: CategoryItem) => {
    if (!window.confirm(`Are you sure you want to permanently delete the category "${cat.name}"?`)) {
      return;
    }

    try {
      await adminDeleteCategory(cat.id);
      setStatusMessage({
        type: 'SUCCESS',
        text: `Category "${cat.name}" deleted from Firestore.`
      });
      onRefresh();
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (err: any) {
      console.error('Error deleting category:', err);
      setStatusMessage({
        type: 'ERROR',
        text: err.message || 'Failed to remove category from Firestore.'
      });
    }
  };

  const handleSeedDefaults = async () => {
    setIsSubmitting(true);
    try {
      await seedCategoriesAndBannersIfEmpty();
      setStatusMessage({
        type: 'SUCCESS',
        text: 'Default standard categories verified & populated into Firestore.'
      });
      onRefresh();
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (err: any) {
      setStatusMessage({
        type: 'ERROR',
        text: 'Failed to seed categories: ' + (err.message || String(err))
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredCategories = categories.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.slug || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div id="admin-category-manager" className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-white dark:bg-[#1E1F23] border border-black/5 dark:border-white/5 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
            <Layers className="w-5 h-5" />
            <span className="text-xs font-bold uppercase tracking-wider">Live Schema Engine</span>
          </div>
          <h2 className="text-xl font-black text-[#1D1B20] dark:text-white">Store Category Manager</h2>
          <p className="text-xs text-[#49454F] dark:text-[#CAC4D0]">
            Manage, reorder, and provision dynamic category taxonomies stored in Firestore.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {categories.length === 0 && (
            <button
              onClick={handleSeedDefaults}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 text-xs font-bold flex items-center gap-1.5 transition-all"
            >
              <Database className="w-4 h-4" />
              <span>Seed Defaults</span>
            </button>
          )}

          <button
            onClick={openAddModal}
            className="px-4 py-2.5 rounded-2xl bg-[#6750A4] hover:bg-[#523e85] text-white font-bold text-xs flex items-center gap-2 transition-all shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add Category</span>
          </button>
        </div>
      </div>

      {/* Status Notifications */}
      {statusMessage && (
        <div
          className={`p-4 rounded-2xl text-xs font-bold flex items-center gap-2 ${
            statusMessage.type === 'SUCCESS'
              ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
              : 'bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400'
          }`}
        >
          {statusMessage.type === 'SUCCESS' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Search & Counter Filter */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 rounded-3xl bg-white dark:bg-[#1E1F23] border border-black/5 dark:border-white/5">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#49454F] dark:text-[#CAC4D0]" />
          <input
            type="text"
            placeholder="Search categories by name or slug..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-2xl bg-[#F3EDF7] dark:bg-[#25262B] text-xs text-[#1D1B20] dark:text-white placeholder-[#49454F] focus:outline-none focus:ring-2 focus:ring-[#6750A4]"
          />
        </div>

        <div className="text-xs font-bold text-[#49454F] dark:text-[#CAC4D0]">
          Total Categories: <span className="text-[#1D1B20] dark:text-white font-black">{categories.length}</span>
        </div>
      </div>

      {/* Categories Table / List */}
      <div className="bg-white dark:bg-[#1E1F23] rounded-3xl border border-black/5 dark:border-white/5 overflow-hidden shadow-sm">
        {filteredCategories.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <FolderPlus className="w-10 h-10 text-[#49454F] dark:text-[#CAC4D0] mx-auto opacity-40" />
            <p className="text-xs text-[#49454F] dark:text-[#CAC4D0]">
              No categories found matching your search.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-black/5 dark:divide-white/5">
            {filteredCategories
              .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0))
              .map((cat) => {
                const matchingAppsCount = appsList.filter((app) => {
                  const cLower = (cat.slug || cat.name || '').toLowerCase();
                  const appCat = (app.category || '').toLowerCase();
                  return appCat === cLower || (app.tags || []).map((t) => t.toLowerCase()).includes(cLower);
                }).length;

                return (
                  <div
                    key={cat.id}
                    className="p-4 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-10 h-10 rounded-2xl bg-[#6750A4]/15 text-[#6750A4] dark:text-[#D0BCFF] flex items-center justify-center font-black text-sm shrink-0">
                        {cat.displayOrder || 0}
                      </div>

                      <div className="space-y-0.5 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-extrabold text-sm text-[#1D1B20] dark:text-white">
                            {cat.name}
                          </span>
                          <code className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-[#F3EDF7] dark:bg-[#25262B] text-[#49454F] dark:text-[#CAC4D0]">
                            {cat.slug}
                          </code>
                          {cat.featured && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center gap-1">
                              <Sparkles className="w-3 h-3" /> Featured
                            </span>
                          )}
                        </div>
                        {cat.description && (
                          <p className="text-xs text-[#49454F] dark:text-[#CAC4D0] truncate max-w-md">
                            {cat.description}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-center">
                      <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#F3EDF7] dark:bg-[#25262B] text-xs font-bold text-[#49454F] dark:text-[#CAC4D0]">
                        <Package className="w-3.5 h-3.5 text-[#6750A4] dark:text-[#D0BCFF]" />
                        <span>{matchingAppsCount} Apps</span>
                      </div>

                      <button
                        onClick={() => openEditModal(cat)}
                        className="p-2 rounded-xl text-[#49454F] dark:text-[#CAC4D0] hover:bg-black/5 dark:hover:bg-white/5 transition-all"
                        title="Edit Category"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleDelete(cat)}
                        className="p-2 rounded-xl text-rose-500 hover:bg-rose-500/10 transition-all"
                        title="Delete Category"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>

      {/* Add / Edit Category Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1E1F23] rounded-3xl p-6 max-w-md w-full border border-black/10 dark:border-white/10 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-base text-[#1D1B20] dark:text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-[#6750A4] dark:text-[#D0BCFF]" />
                {editingCategory ? 'Edit Store Category' : 'Create New Category'}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-2 rounded-xl text-[#49454F] dark:text-[#CAC4D0] hover:bg-black/5 dark:hover:bg-white/5"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-bold text-[#49454F] dark:text-[#CAC4D0] mb-1">
                  Category Display Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (!editingCategory) {
                      setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-'));
                    }
                  }}
                  placeholder="e.g. Games, Artificial Intelligence, Developer Tools"
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-[#F3EDF7] dark:bg-[#25262B] text-xs text-[#1D1B20] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#6750A4]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#49454F] dark:text-[#CAC4D0] mb-1">
                  URL / Query Slug *
                </label>
                <input
                  type="text"
                  required
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase())}
                  placeholder="e.g. games, ai, developer-tools"
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-[#F3EDF7] dark:bg-[#25262B] text-xs font-mono text-[#1D1B20] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#6750A4]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#49454F] dark:text-[#CAC4D0] mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description for category banner..."
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-[#F3EDF7] dark:bg-[#25262B] text-xs text-[#1D1B20] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#6750A4]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#49454F] dark:text-[#CAC4D0] mb-1">
                    Display Order
                  </label>
                  <input
                    type="number"
                    value={displayOrder}
                    onChange={(e) => setDisplayOrder(parseInt(e.target.value) || 0)}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-[#F3EDF7] dark:bg-[#25262B] text-xs text-[#1D1B20] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#6750A4]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#49454F] dark:text-[#CAC4D0] mb-1">
                    Icon Identifier
                  </label>
                  <input
                    type="text"
                    value={icon}
                    onChange={(e) => setIcon(e.target.value)}
                    placeholder="Gamepad2, Sparkles, Code..."
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-[#F3EDF7] dark:bg-[#25262B] text-xs text-[#1D1B20] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#6750A4]"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="featured-cat-checkbox"
                  checked={featured}
                  onChange={(e) => setFeatured(e.target.checked)}
                  className="w-4 h-4 rounded text-[#6750A4] focus:ring-[#6750A4]"
                />
                <label htmlFor="featured-cat-checkbox" className="text-xs font-bold text-[#1D1B20] dark:text-white">
                  Mark as Featured Category in Main Navigation
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-black/5 dark:border-white/5">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-[#F3EDF7] dark:bg-[#25262B] text-xs font-bold text-[#1D1B20] dark:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-[#6750A4] text-white text-xs font-bold hover:bg-[#523e85] disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isSubmitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>{editingCategory ? 'Save Changes' : 'Create Category'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
