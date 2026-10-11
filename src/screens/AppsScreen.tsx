import React, { useState, useMemo } from 'react';
import { useStore } from '../context/StoreContext';
import { AppCard } from '../components/AppCard';
import { matchesAppCategory } from '../utils/categoryUtils';
import {
  LayoutGrid,
  Sparkles,
  Search,
  ArrowUpDown,
  X,
  SlidersHorizontal
} from 'lucide-react';

type SortOption = 'POPULAR' | 'RATING' | 'NAME' | 'NEWEST';

export const AppsScreen: React.FC = () => {
  const { apps, categories: storeCategories, appsLoading, searchQuery, setSearchQuery } = useStore();
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<SortOption>('POPULAR');

  const nonGameApps = useMemo(() => {
    return apps.filter(
      (a) =>
        !a.isGame &&
        a.category !== 'GAMES' &&
        !['CASUAL', 'ARCADE', 'ACTION', 'RACING'].includes(a.category)
    );
  }, [apps]);

  const categories = useMemo(() => {
    const list = [{ id: 'ALL', label: 'All Applications' }];
    if (storeCategories && storeCategories.length > 0) {
      storeCategories.forEach((c) => {
        list.push({ id: c.id, label: c.name || c.title || c.id });
      });
    }
    return list;
  }, [storeCategories]);

  // Filtered & Sorted Apps
  const filteredAndSorted = useMemo(() => {
    let result = nonGameApps.filter((a) => {
      const matchesCategory = matchesAppCategory(a, filterCategory);

      const query = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !query ||
        a.name.toLowerCase().includes(query) ||
        (a.description || '').toLowerCase().includes(query) ||
        (a.developer || '').toLowerCase().includes(query) ||
        (a.tags || []).some((t) => t.toLowerCase().includes(query));

      return matchesCategory && matchesSearch;
    });

    return result.sort((a, b) => {
      if (sortBy === 'RATING') {
        return (b.rating || 5) - (a.rating || 5);
      }
      if (sortBy === 'NAME') {
        return a.name.localeCompare(b.name);
      }
      if (sortBy === 'NEWEST') {
        return (b.versionCode || 1) - (a.versionCode || 1);
      }
      // Default: POPULAR
      const countA = typeof a.downloadCount === 'number' ? a.downloadCount : (parseInt(String(a.downloads || '0').replace(/[^0-9]/g, ''), 10) || 0);
      const countB = typeof b.downloadCount === 'number' ? b.downloadCount : (parseInt(String(b.downloads || '0').replace(/[^0-9]/g, ''), 10) || 0);
      return countB - countA;
    });
  }, [nonGameApps, filterCategory, searchQuery, sortBy]);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#1D1B20] dark:text-[#E6E1E5] flex items-center gap-2">
            <LayoutGrid className="w-7 h-7 text-[#6750A4] dark:text-[#D0BCFF]" />
            Application Directory
          </h1>
          <p className="text-xs text-[#49454F] dark:text-[#CAC4D0]">
            Browse utility tools, AI assistants, productivity suites, and encrypted communications
          </p>
        </div>

        {/* Sort Dropdown */}
        <div className="flex items-center gap-2">
          <ArrowUpDown className="w-4 h-4 text-[#49454F] dark:text-[#CAC4D0]" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="px-3.5 py-2 rounded-xl bg-white dark:bg-[#1E1F23] border border-black/10 dark:border-white/10 text-xs font-bold text-[#1D1B20] dark:text-[#E6E1E5] focus:outline-none focus:border-[#6750A4]"
          >
            <option value="POPULAR">Most Downloaded</option>
            <option value="RATING">Highest Rated</option>
            <option value="NAME">Alphabetical (A-Z)</option>
            <option value="NEWEST">Latest Version</option>
          </select>
        </div>
      </div>

      {/* Active Search Banner if Search is Applied */}
      {searchQuery && (
        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#6750A4]/10 border border-[#6750A4]/20 text-xs text-[#6750A4] dark:text-[#D0BCFF]">
          <div className="flex items-center gap-2 font-bold">
            <Search className="w-4 h-4" />
            <span>Filtering by query: "{searchQuery}" ({filteredAndSorted.length} matching)</span>
          </div>
          <button
            onClick={() => setSearchQuery('')}
            className="font-black hover:underline flex items-center gap-1 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
            <span>Clear</span>
          </button>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {categories.map((cat) => {
          const count =
            cat.id === 'ALL'
              ? nonGameApps.length
              : nonGameApps.filter(
                  (a) => a.category === cat.id || a.categoryId === cat.id.toLowerCase()
                ).length;

          return (
            <button
              key={cat.id}
              onClick={() => setFilterCategory(cat.id)}
              className={`px-4 py-2 rounded-full text-xs font-bold shrink-0 transition-all flex items-center gap-1.5 cursor-pointer ${
                filterCategory === cat.id
                  ? 'bg-[#6750A4] text-white shadow-md shadow-[#6750A4]/20'
                  : 'bg-white dark:bg-[#1E1F23] text-[#49454F] dark:text-[#CAC4D0] border border-black/5 dark:border-white/5 hover:border-[#6750A4]/30'
              }`}
            >
              <span>{cat.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  filterCategory === cat.id ? 'bg-white/25 text-white' : 'bg-black/5 dark:bg-white/10'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Grid or Empty State */}
      {appsLoading && apps.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="p-4 rounded-2xl bg-white dark:bg-[#1E1F23] border border-black/5 dark:border-white/5 animate-pulse h-24" />
          ))}
        </div>
      ) : filteredAndSorted.length === 0 ? (
        <div className="text-center py-16 px-4 rounded-3xl bg-white dark:bg-[#1E1F23] border border-black/5 dark:border-white/5 space-y-3">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-[#6750A4]/10 text-[#6750A4] dark:text-[#D0BCFF] flex items-center justify-center">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-[#1D1B20] dark:text-[#E6E1E5]">
            {apps.length === 0 ? 'No published apps available' : 'No applications match your criteria'}
          </h3>
          <p className="text-xs text-[#49454F] dark:text-[#CAC4D0] max-w-sm mx-auto">
            {apps.length === 0
              ? 'There are no published applications in the AVANYX directory yet.'
              : searchQuery
                ? `No apps found matching "${searchQuery}". Try a different keyword.`
                : `No applications found in category "${filterCategory}".`}
          </p>
          {(searchQuery || filterCategory !== 'ALL') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setFilterCategory('ALL');
              }}
              className="px-4 py-2 rounded-xl bg-[#6750A4] text-white text-xs font-bold cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAndSorted.map((app) => (
            <AppCard key={app.id} app={app} />
          ))}
        </div>
      )}
    </div>
  );
};
