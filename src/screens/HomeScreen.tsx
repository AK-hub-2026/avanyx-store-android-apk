import React from 'react';
import { useStore } from '../context/StoreContext';
import { AppCard } from '../components/AppCard';
import { AppCategory } from '../types';
import { matchesAppCategory } from '../utils/categoryUtils';
import {
  ShieldCheck,
  Sparkles,
  Gamepad2,
  Layers,
  Wrench,
  GraduationCap,
  Download,
  Search,
  Code2,
  Zap,
  ArrowRight,
  Star,
  Flame,
  CheckCircle2,
  TrendingUp,
  Cpu,
  Smartphone,
  Globe2,
  Terminal,
  Lock
} from 'lucide-react';

export const HomeScreen: React.FC = () => {
  const {
    apps,
    categories: storeCategories,
    featuredBanners,
    appsLoading,
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    setCurrentTab,
    openAppDetails,
    isAuthenticated,
    user
  } = useStore();

  const isDeveloper = isAuthenticated && (user.role === 'DEVELOPER' || user.role === 'ADMIN' || user.realRole === 'ADMIN' || user.verifiedDeveloper);

  const getCategoryIcon = (id: string) => {
    switch (id.toUpperCase()) {
      case 'GAMES': return Gamepad2;
      case 'TOOLS': return Wrench;
      case 'PRODUCTIVITY': return Zap;
      case 'EDUCATION': return GraduationCap;
      case 'SECURITY': return ShieldCheck;
      case 'TRUSTED': return ShieldCheck;
      case 'RECOMMENDED': return Sparkles;
      case 'AI':
      case 'AI_AGENTS': return Cpu;
      default: return Sparkles;
    }
  };

  const categories = React.useMemo(() => {
    // Required core production categories
    const core = [
      { id: 'ALL', label: 'All Packages', icon: Sparkles },
      { id: 'RECOMMENDED', label: 'Recommended', icon: Sparkles },
      { id: 'TRUSTED', label: 'Trusted Apps', icon: ShieldCheck },
      { id: 'GAMES', label: 'Games', icon: Gamepad2 },
      { id: 'AI', label: 'AI Apps', icon: Cpu },
      { id: 'EDUCATION', label: 'Education', icon: GraduationCap },
      { id: 'TOOLS', label: 'Tools', icon: Wrench }
    ];

    if (storeCategories && storeCategories.length > 0) {
      storeCategories.forEach((c) => {
        const idUpper = (c.id || '').toUpperCase();
        if (!core.some((item) => item.id.toUpperCase() === idUpper)) {
          core.push({
            id: c.id,
            label: c.name || c.title || c.id,
            icon: getCategoryIcon(c.id)
          });
        }
      });
    }
    return core;
  }, [storeCategories]);

  // Filtering by search & category (Fixed to load strictly matching Firestore apps)
  const filteredApps = apps.filter((app) => {
    const matchesCategory = matchesAppCategory(app, selectedCategory);

    const matchesSearch =
      !searchQuery.trim() ||
      app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.developer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.tags?.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesCategory && matchesSearch;
  });

  // Deduplicated section lists for default view (Requirement 1: remove duplicated apps across sections)
  const usedAppIds = new Set<string>();

  const featuredApp = apps.find((a) => a.isFeatured) || apps[0];
  if (featuredApp) usedAppIds.add(featuredApp.id);

  // Recommended = recommended: true (fallback to highest score if not flagged)
  let recommendedApps = apps.filter((a) => !usedAppIds.has(a.id) && matchesAppCategory(a, 'RECOMMENDED'));
  if (recommendedApps.length === 0) {
    recommendedApps = [...apps]
      .filter((a) => !usedAppIds.has(a.id))
      .sort((a, b) => {
        const scoreA = (a.rating || 5) * 10 + (a.securityScore || 98);
        const scoreB = (b.rating || 5) * 10 + (b.securityScore || 98);
        return scoreB - scoreA;
      })
      .slice(0, 6);
  }
  recommendedApps.forEach((a) => usedAppIds.add(a.id));

  // Trusted Apps = verified: true
  let trustedAppsList = apps.filter((a) => !usedAppIds.has(a.id) && matchesAppCategory(a, 'TRUSTED'));
  if (trustedAppsList.length === 0) {
    trustedAppsList = apps.filter((a) => matchesAppCategory(a, 'TRUSTED'));
  }
  trustedAppsList.slice(0, 6).forEach((a) => usedAppIds.add(a.id));

  // Games = category: "Games"
  let gamesList = apps.filter((a) => !usedAppIds.has(a.id) && matchesAppCategory(a, 'GAMES'));
  if (gamesList.length === 0) {
    gamesList = apps.filter((a) => matchesAppCategory(a, 'GAMES'));
  }
  gamesList.slice(0, 6).forEach((a) => usedAppIds.add(a.id));

  // AI Apps = category: "AI"
  let aiAppsList = apps.filter((a) => !usedAppIds.has(a.id) && matchesAppCategory(a, 'AI'));
  if (aiAppsList.length === 0) {
    aiAppsList = apps.filter((a) => matchesAppCategory(a, 'AI'));
  }
  aiAppsList.slice(0, 6).forEach((a) => usedAppIds.add(a.id));

  // Education = category: "Education"
  let educationList = apps.filter((a) => !usedAppIds.has(a.id) && matchesAppCategory(a, 'EDUCATION'));
  if (educationList.length === 0) {
    educationList = apps.filter((a) => matchesAppCategory(a, 'EDUCATION'));
  }
  educationList.slice(0, 6).forEach((a) => usedAppIds.add(a.id));

  // Tools = category: "Tools"
  let devToolsList = apps.filter((a) => !usedAppIds.has(a.id) && matchesAppCategory(a, 'TOOLS'));
  if (devToolsList.length === 0) {
    devToolsList = apps.filter((a) => matchesAppCategory(a, 'TOOLS'));
  }
  devToolsList.slice(0, 6).forEach((a) => usedAppIds.add(a.id));

  return (
    <div className="space-y-10 pb-16 selection:bg-[#6750A4]/20 selection:text-[#6750A4]">
      {/* ───────────────────────────────────────────────────────────── */}
      {/* 0. STORE HEADER WITH CANONICAL H1 & DIRECT DEFINITION */}
      {/* ───────────────────────────────────────────────────────────── */}
      <header className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-black text-[#1D1B20] dark:text-white tracking-tight">
          AVANYX Store: Android App Marketplace
        </h1>
        <p className="text-xs sm:text-sm text-[#49454F] dark:text-[#CAC4D0] max-w-3xl leading-relaxed">
          AVANYX Store is an independent Android application marketplace and developer publishing platform providing direct APK downloads with zero telemetry and verified package integrity.
        </p>
      </header>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* STORE SEARCH & CATEGORY BAR */}
      {/* ───────────────────────────────────────────────────────────── */}
      <section className="space-y-4">
        {/* Active Search Notification Banner if searching */}
        {searchQuery && (
          <div className="flex items-center justify-between p-4 rounded-2xl bg-[#6750A4]/10 border border-[#6750A4]/20 text-xs">
            <div className="flex items-center gap-2 text-[#6750A4] dark:text-[#D0BCFF] font-bold">
              <Search className="w-4 h-4" />
              <span>Showing results for "{searchQuery}"</span>
            </div>
            <button
              onClick={() => setSearchQuery('')}
              className="text-[#6750A4] dark:text-[#D0BCFF] font-extrabold hover:underline"
            >
              Clear Search ({filteredApps.length} found)
            </button>
          </div>
        )}

        {/* Category Pills */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {categories.map((cat) => {
              const Icon = cat.icon;
              const isActive = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id as any)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold shrink-0 transition-all ${
                    isActive
                      ? 'bg-[#6750A4] text-white shadow-md shadow-[#6750A4]/20'
                      : 'bg-white dark:bg-[#1E1F23] text-[#49454F] dark:text-[#CAC4D0] border border-black/5 dark:border-white/5 hover:border-[#6750A4]/30'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>

          <div className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 shrink-0">
            <ShieldCheck className="w-4 h-4" />
            <span>{apps.length} Verified Packages</span>
          </div>
        </div>
      </section>

      {/* If search query or non-ALL category is active: show direct filtered grid */}
      {(searchQuery.trim() !== '' || selectedCategory !== 'ALL') ? (
        <section className="space-y-4">
          <h2 className="text-xl font-extrabold text-[#1D1B20] dark:text-[#E6E1E5] flex items-center gap-2">
            <Layers className="w-5 h-5 text-[#6750A4] dark:text-[#D0BCFF]" />
            <span>
              {selectedCategory === 'ALL'
                ? 'Search Results'
                : categories.find((c) => c.id === selectedCategory)?.label || 'Directory'}
            </span>
            <span className="text-xs font-bold text-[#49454F] dark:text-[#CAC4D0]">
              ({filteredApps.length})
            </span>
          </h2>

          {filteredApps.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-[#18191D] rounded-3xl border border-black/5 dark:border-white/5 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mx-auto text-zinc-400">
                <Search className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-[#1D1B20] dark:text-white">
                No matching packages found
              </p>
              <p className="text-xs text-[#49454F] dark:text-[#CAC4D0]">
                {apps.length === 0 ? 'No published apps available' : 'Try searching for a different keyword, category, or clear your filters.'}
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('ALL');
                }}
                className="px-4 py-2 rounded-xl bg-[#6750A4] text-white text-xs font-bold"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredApps.map((app) => (
                <AppCard key={app.id} app={app} />
              ))}
            </div>
          )}
        </section>
      ) : apps.length === 0 ? (
        /* If Firestore returns 0 apps, show "No published apps available" instead of fake apps */
        <section className="text-center py-20 px-4 rounded-3xl bg-white dark:bg-[#18191D] border border-black/5 dark:border-white/5 space-y-4 my-8">
          <div className="w-16 h-16 mx-auto rounded-3xl bg-[#6750A4]/10 text-[#6750A4] dark:text-[#D0BCFF] flex items-center justify-center">
            <Layers className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-extrabold text-[#1D1B20] dark:text-white">
              No published apps available
            </h2>
            <p className="text-xs text-[#49454F] dark:text-[#CAC4D0] max-w-md mx-auto">
              The AVANYX Store apps collection currently has no published packages. Verified publishers can submit applications via the Developer Console.
            </p>
          </div>
        </section>
      ) : (
        /* Standard Store Home Catalog View */
        <>
          {/* 0. LIVE FIRESTORE FEATURED BANNERS */}
          {featuredBanners && featuredBanners.length > 0 && (
            <section id="store-featured-banners" className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {featuredBanners.map((banner) => (
                  <div
                    key={banner.id}
                    onClick={() => {
                      if (banner.targetAppId) {
                        openAppDetails(banner.targetAppId);
                      }
                    }}
                    className={`relative overflow-hidden rounded-3xl p-6 sm:p-7 flex flex-col justify-between min-h-[170px] cursor-pointer transition-transform hover:scale-[1.01] active:scale-[0.99] border border-white/10 shadow-xl bg-gradient-to-br ${
                      banner.gradient || 'from-[#1E142F] to-[#12131C]'
                    }`}
                  >
                    {banner.imageUrl && (
                      <div className="absolute right-0 top-0 bottom-0 w-2/5 overflow-hidden opacity-30 pointer-events-none">
                        <img
                          src={banner.imageUrl}
                          alt={banner.title}
                          className="w-full h-full object-cover object-center"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    )}
                    <div className="relative z-10 space-y-2 max-w-[80%]">
                      {banner.badgeText && (
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-white/15 text-white backdrop-blur-md border border-white/20">
                          {banner.badgeText}
                        </span>
                      )}
                      <h3 className="text-xl sm:text-2xl font-black text-white leading-tight">
                        {banner.title}
                      </h3>
                      {banner.subtitle && (
                        <p className="text-xs text-white/80 font-medium line-clamp-2">
                          {banner.subtitle}
                        </p>
                      )}
                    </div>
                    {banner.ctaText && (
                      <div className="relative z-10 pt-3">
                        <span className="inline-flex items-center gap-1.5 text-xs font-black text-white hover:underline">
                          <span>{banner.ctaText}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* 1. EDITOR'S CHOICE SPOTLIGHT */}
          {featuredApp && (
            <section id="featured" className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-extrabold text-[#1D1B20] dark:text-[#E6E1E5] flex items-center gap-2">
                  <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                  <span>Editor's Choice Spotlight</span>
                </h2>
                <span className="px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-500 text-[10px] font-black uppercase">
                  Verified Feature
                </span>
              </div>

              <AppCard app={featuredApp} featuredLayout />
            </section>
          )}

          {/* 1.25. LATEST & TRENDING RELEASES */}
          {apps.length > 0 && (
            <section id="latest-trending" className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-extrabold text-[#1D1B20] dark:text-[#E6E1E5] flex items-center gap-2">
                    <Flame className="w-5 h-5 text-amber-500" />
                    <span>Latest & Trending Releases</span>
                  </h2>
                  <p className="text-xs text-[#49454F] dark:text-[#CAC4D0] mt-0.5">
                    Newly published AI-verified applications, trending APKs, and fresh community releases.
                  </p>
                </div>
                <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-bold">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>Auto SEO Indexed</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...apps]
                  .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
                  .slice(0, 6)
                  .map((app) => (
                    <AppCard key={`latest-${app.id}`} app={app} />
                  ))}
              </div>
            </section>
          )}

          {/* 1.5. RECOMMENDED FOR YOU */}
          {recommendedApps.length > 0 && (
            <section id="recommended-apps" className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-extrabold text-[#1D1B20] dark:text-[#E6E1E5] flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-[#9333EA] dark:text-[#C084FC]" />
                    <span>Recommended For You</span>
                  </h2>
                  <p className="text-xs text-[#49454F] dark:text-[#CAC4D0] mt-0.5">
                    Curated algorithms based on verified security compliance, high star ratings, and community reviews.
                  </p>
                </div>
                <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-[#9333EA] dark:text-[#C084FC] text-xs font-bold">
                  <Star className="w-3.5 h-3.5 fill-current" />
                  <span>Top Rated & Verified</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {recommendedApps.map((app) => (
                  <AppCard key={`rec-${app.id}`} app={app} />
                ))}
              </div>
            </section>
          )}

          {/* 2. TRUSTED APPS */}
          <section id="trusted-apps" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-extrabold text-[#1D1B20] dark:text-[#E6E1E5] flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-500" />
                  <span>Trusted Apps</span>
                </h2>
                <p className="text-xs text-[#49454F] dark:text-[#CAC4D0] mt-0.5">
                  Verified Android APKs and Desktop packages with SHA-256 validation.
                </p>
              </div>
              <button
                onClick={() => setCurrentTab('APPS')}
                className="text-xs font-bold text-[#6750A4] dark:text-[#D0BCFF] hover:underline flex items-center gap-1"
              >
                <span>View All Apps</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {trustedAppsList.slice(0, 6).map((app) => (
                <AppCard key={app.id} app={app} />
              ))}
            </div>
          </section>

          {/* 3. HIGH-PERFORMANCE GAMES */}
          <section id="games" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-extrabold text-[#1D1B20] dark:text-[#E6E1E5] flex items-center gap-2">
                  <Gamepad2 className="w-5 h-5 text-amber-500" />
                  <span>High-Performance Games</span>
                </h2>
                <p className="text-xs text-[#49454F] dark:text-[#CAC4D0] mt-0.5">
                  Action, arcade, 3D titles, and casual games with offline support.
                </p>
              </div>
              <button
                onClick={() => setCurrentTab('GAMES')}
                className="text-xs font-bold text-[#6750A4] dark:text-[#D0BCFF] hover:underline flex items-center gap-1"
              >
                <span>View All Games</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {gamesList.slice(0, 6).map((app) => (
                <AppCard key={app.id} app={app} />
              ))}
            </div>
          </section>

          {/* 4. NEXT-GEN AI APPS */}
          <section id="ai-apps" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-extrabold text-[#1D1B20] dark:text-[#E6E1E5] flex items-center gap-2">
                  <Cpu className="w-5 h-5 text-[#6750A4] dark:text-[#D0BCFF]" />
                  <span>Next-Gen AI Apps</span>
                </h2>
                <p className="text-xs text-[#49454F] dark:text-[#CAC4D0] mt-0.5">
                  Intelligent copilots, LLM tools, voice assistants, and creative generators.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(aiAppsList.length > 0 ? aiAppsList : apps.slice(0, 3)).map((app) => (
                <AppCard key={`ai-${app.id}`} app={app} />
              ))}
            </div>
          </section>

          {/* 4.5. EDUCATION & STUDENT SHOWCASE */}
          <section id="education-apps" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-extrabold text-[#1D1B20] dark:text-[#E6E1E5] flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-cyan-500" />
                  <span>Education & Campus Projects</span>
                </h2>
                <p className="text-xs text-[#49454F] dark:text-[#CAC4D0] mt-0.5">
                  Educational software, campus study suites, and student innovation showcase.
                </p>
              </div>
              <button
                onClick={() => setSelectedCategory('EDUCATION')}
                className="text-xs font-bold text-cyan-600 dark:text-cyan-400 hover:underline flex items-center gap-1"
              >
                <span>Browse Education</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(educationList.length > 0 ? educationList : apps.slice(0, 3)).map((app) => (
                <AppCard key={`edu-${app.id}`} app={app} />
              ))}
            </div>
          </section>

          {/* 5. DEVELOPER TOOLS & UTILITIES */}
          <section id="dev-tools" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-extrabold text-[#1D1B20] dark:text-[#E6E1E5] flex items-center gap-2">
                  <Wrench className="w-5 h-5 text-indigo-500" />
                  <span>Developer Tools & SDKs</span>
                </h2>
                <p className="text-xs text-[#49454F] dark:text-[#CAC4D0] mt-0.5">
                  APKs, CLI toolkits, testbeds, and cryptographic signing tools.
                </p>
              </div>
              <button
                onClick={() => {
                  if (!isAuthenticated) {
                    setCurrentTab('LOGIN');
                    if (typeof window !== 'undefined' && window.history && window.history.pushState) {
                      window.history.pushState({}, '', '/login');
                    }
                  } else if (isDeveloper) {
                    setCurrentTab('DEV_CONSOLE');
                    if (typeof window !== 'undefined' && window.history && window.history.pushState) {
                      window.history.pushState({}, '', '/developer');
                    }
                  } else {
                    setCurrentTab('ACCOUNT');
                    if (typeof window !== 'undefined' && window.history && window.history.pushState) {
                      window.history.pushState({}, '', '/account');
                    }
                  }
                }}
                className="text-xs font-bold text-[#6750A4] dark:text-[#D0BCFF] hover:underline flex items-center gap-1"
              >
                <span>Developer Console</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(devToolsList.length > 0 ? devToolsList : apps.slice(0, 3)).map((app) => (
                <AppCard key={`dev-${app.id}`} app={app} />
              ))}
            </div>
          </section>

          {/* 6. ABOUT AVANYX STORE & ANDROID APP MARKETPLACE EXPLANATORY HUB */}
          <section className="mt-12 pt-8 border-t border-black/5 dark:border-white/5 space-y-8">
            <div className="p-6 sm:p-10 rounded-3xl bg-white dark:bg-[#18191D] border border-black/5 dark:border-white/5 shadow-sm space-y-8">
              {/* Key Takeaways */}
              <div className="p-6 rounded-2xl bg-gradient-to-br from-[#6750A4]/10 via-[#F8F9FA] to-emerald-500/10 dark:from-[#221C35] dark:via-[#1E1F23] dark:to-[#122822] border border-[#6750A4]/20 space-y-3">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#6750A4]/15 text-[#6750A4] dark:text-[#D0BCFF] text-[11px] font-black uppercase">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Key Takeaways</span>
                </div>
                <h2 className="text-xl font-black text-[#1D1B20] dark:text-white">
                  AVANYX Store Overview at a Glance
                </h2>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-xs text-[#49454F] dark:text-[#CAC4D0]">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span><strong>Independent Distribution:</strong> Open Android software marketplace for direct, telemetry-free APK downloads.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span><strong>Direct Downloads:</strong> Users can download verified APK packages directly to devices without mandatory account sign-in.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span><strong>Developer Freedom:</strong> Independent publishers distribute Android apps via the Developer Console with 0% platform fee on free software.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span><strong>Academic Support:</strong> Eligible secondary and college students access free hosting via the Student Console.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span><strong>Cryptographic Integrity:</strong> Every binary is audited via CyberShield and validated against NIST FIPS 180-4 SHA-256 signatures.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span><strong>Standards-Compliant:</strong> Fully compatible with AOSP Android package guidelines, W3C PWA standards, and TLS 1.3 transport encryption.</span>
                  </li>
                </ul>
              </div>

              {/* Core Explanatory Sections */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-[#49454F] dark:text-[#CAC4D0]">
                <div className="space-y-2">
                  <h2 className="text-base font-extrabold text-[#1D1B20] dark:text-white flex items-center gap-2">
                    <Globe2 className="w-4 h-4 text-[#6750A4] dark:text-[#D0BCFF]" />
                    <span>What is AVANYX Store?</span>
                  </h2>
                  <p className="leading-relaxed">
                    AVANYX Store is an independent Android application marketplace and software publishing platform. It serves as a secure distribution channel where mobile device users discover verified applications and independent creators publish native Android software packages without restrictive store monopolies or aggressive tracking layers.
                  </p>
                </div>

                <div className="space-y-2">
                  <h2 className="text-base font-extrabold text-[#1D1B20] dark:text-white flex items-center gap-2">
                    <Search className="w-4 h-4 text-emerald-500" />
                    <span>How Android App Discovery Works</span>
                  </h2>
                  <p className="leading-relaxed">
                    Users can browse software categories including Games, Productivity, Developer Tools, and Education, or execute direct keyword searches. Each app profile transparently lists the compiled package name, release version, file size, developer credentials, and cryptographic SHA-256 hash before downloading.
                  </p>
                </div>

                <div className="space-y-2">
                  <h2 className="text-base font-extrabold text-[#1D1B20] dark:text-white flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-indigo-500" />
                    <span>How Developers Publish Apps</span>
                  </h2>
                  <p className="leading-relaxed">
                    Verified publishers access the <a href="/developer-console" onClick={(e) => { e.preventDefault(); setCurrentTab('DEV_CONSOLE'); }} className="text-[#6750A4] dark:text-[#D0BCFF] font-bold hover:underline">Developer Console</a> to upload compiled APK packages, set release notes, configure rollout stages, and monitor live telemetry. Applications retain 100% creator copyright with 0% platform commission on free and open-source binaries.
                  </p>
                </div>

                <div className="space-y-2">
                  <h2 className="text-base font-extrabold text-[#1D1B20] dark:text-white flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-purple-400" />
                    <span>How App Verification Information is Presented</span>
                  </h2>
                  <p className="leading-relaxed">
                    Prior to public availability, every uploaded binary undergoes static DEX bytecode inspection, sandbox runtime emulation, and permission profiling. Once audited, the verified status, permissions matrix, and SHA-256 checksum are displayed on the public app page so users can independently verify file integrity.
                  </p>
                </div>

                <div className="space-y-2">
                  <h2 className="text-base font-extrabold text-[#1D1B20] dark:text-white flex items-center gap-2">
                    <Lock className="w-4 h-4 text-amber-500" />
                    <span>Security and Privacy Approach</span>
                  </h2>
                  <p className="leading-relaxed">
                    AVANYX Store operates under a strict privacy-first principle. No behavioral tracking, advertising SDK injections, or device fingerprinting is permitted. All package downloads are served over encrypted TLS 1.3 connections directly from cloud edge nodes.
                  </p>
                </div>

                <div className="space-y-2">
                  <h2 className="text-base font-extrabold text-[#1D1B20] dark:text-white flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-cyan-500" />
                    <span>Developer Console & Student Developer Program</span>
                  </h2>
                  <p className="leading-relaxed">
                    Professional studios manage software via the <a href="/developer/apply" onClick={(e) => { e.preventDefault(); setCurrentTab('DEVELOPER_APPLY'); }} className="text-[#6750A4] dark:text-[#D0BCFF] font-bold hover:underline">Developer Application</a> portal. Enrolled secondary and university students receive free hosting quotas and verified academic badges through the <a href="/student/apply" onClick={(e) => { e.preventDefault(); setCurrentTab('STUDENT_APPLY'); }} className="text-indigo-500 font-bold hover:underline">Student Developer Program</a>.
                  </p>
                </div>
              </div>

              {/* Frequently Asked Questions */}
              <div className="pt-6 border-t border-black/5 dark:border-white/5 space-y-4">
                <h2 className="text-lg font-black text-[#1D1B20] dark:text-white">
                  Frequently Asked Questions About AVANYX Store
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-[#49454F] dark:text-[#CAC4D0]">
                  <div className="p-4 rounded-2xl bg-[#F8F9FA] dark:bg-[#25262B] border border-black/5 dark:border-white/5 space-y-1.5">
                    <h3 className="font-extrabold text-[#1D1B20] dark:text-white">Can I download Android apps without creating an account?</h3>
                    <p className="leading-relaxed">
                      Yes. AVANYX Store allows guest users to freely search, browse, and download verified Android APK packages directly without requiring an account or sign-in.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-[#F8F9FA] dark:bg-[#25262B] border border-black/5 dark:border-white/5 space-y-1.5">
                    <h3 className="font-extrabold text-[#1D1B20] dark:text-white">What is an APK file and how do I install it?</h3>
                    <p className="leading-relaxed">
                      An APK (Android Package) is the standard package file format used by Android to distribute mobile applications. To install, download the verified APK file from AVANYX Store and tap it on your Android device to install.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-[#F8F9FA] dark:bg-[#25262B] border border-black/5 dark:border-white/5 space-y-1.5">
                    <h3 className="font-extrabold text-[#1D1B20] dark:text-white">How much does it cost developers to publish free apps?</h3>
                    <p className="leading-relaxed">
                      Zero. AVANYX Store charges 0% platform commission on free and open-source applications, with no recurring developer membership charges or listing fees.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-[#F8F9FA] dark:bg-[#25262B] border border-black/5 dark:border-white/5 space-y-1.5">
                    <h3 className="font-extrabold text-[#1D1B20] dark:text-white">How does AVANYX Store check APK package integrity?</h3>
                    <p className="leading-relaxed">
                      AVANYX Store calculates and validates a cryptographic SHA-256 hash checksum for every package release according to the NIST FIPS 180-4 standard, ensuring binary code integrity.
                    </p>
                  </div>
                </div>
              </div>

              {/* Contextual Internal Links */}
              <div className="pt-4 border-t border-black/5 dark:border-white/5 flex flex-wrap items-center gap-3 text-xs font-bold text-[#6750A4] dark:text-[#D0BCFF]">
                <a
                  href="/about"
                  onClick={(e) => {
                    e.preventDefault();
                    setCurrentTab('INTRO');
                    if (typeof window !== 'undefined' && window.history && window.history.pushState) {
                      window.history.pushState({}, '', '/about');
                    }
                  }}
                  className="hover:underline flex items-center gap-1"
                >
                  <span>About AVANYX Store</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
                <span className="text-zinc-300 dark:text-zinc-700">•</span>
                <a
                  href="/faq"
                  onClick={(e) => {
                    e.preventDefault();
                    setCurrentTab('INTRO');
                    if (typeof window !== 'undefined' && window.history && window.history.pushState) {
                      window.history.pushState({}, '', '/faq');
                    }
                  }}
                  className="hover:underline"
                >
                  Knowledge Base & FAQs
                </a>
                <span className="text-zinc-300 dark:text-zinc-700">•</span>
                <a
                  href="/developer-console"
                  onClick={(e) => {
                    e.preventDefault();
                    setCurrentTab('DEV_CONSOLE');
                    if (typeof window !== 'undefined' && window.history && window.history.pushState) {
                      window.history.pushState({}, '', '/developer-console');
                    }
                  }}
                  className="hover:underline"
                >
                  Developer Console
                </a>
                <span className="text-zinc-300 dark:text-zinc-700">•</span>
                <a
                  href="/student-console"
                  onClick={(e) => {
                    e.preventDefault();
                    setCurrentTab('STUDENT_CONSOLE');
                    if (typeof window !== 'undefined' && window.history && window.history.pushState) {
                      window.history.pushState({}, '', '/student-console');
                    }
                  }}
                  className="hover:underline"
                >
                  Student Console
                </a>
                <span className="text-zinc-300 dark:text-zinc-700">•</span>
                <a
                  href="/developer/apply"
                  onClick={(e) => {
                    e.preventDefault();
                    setCurrentTab('DEVELOPER_APPLY');
                    if (typeof window !== 'undefined' && window.history && window.history.pushState) {
                      window.history.pushState({}, '', '/developer/apply');
                    }
                  }}
                  className="hover:underline"
                >
                  Apply for Developer
                </a>
                <span className="text-zinc-300 dark:text-zinc-700">•</span>
                <a
                  href="/student/apply"
                  onClick={(e) => {
                    e.preventDefault();
                    setCurrentTab('STUDENT_APPLY');
                    if (typeof window !== 'undefined' && window.history && window.history.pushState) {
                      window.history.pushState({}, '', '/student/apply');
                    }
                  }}
                  className="hover:underline"
                >
                  Student Grants
                </a>
                <span className="text-zinc-300 dark:text-zinc-700">•</span>
                <a href="/site.webmanifest" className="hover:underline">
                  PWA Web Manifest
                </a>
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
};
