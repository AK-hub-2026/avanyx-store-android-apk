import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import {
  ArrowLeft,
  CheckCircle2,
  Globe,
  Github,
  Instagram,
  Facebook,
  Youtube,
  MessageCircle,
  Building2,
  MapPin,
  Calendar,
  Layers,
  Download,
  Star,
  ExternalLink,
  Check,
  ShieldCheck,
  Share2,
  Sparkles,
  Mail,
  Link as LinkIcon
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { DeveloperProfile, StoreApp } from '../types';
import { fetchPublicDeveloperProfile, fetchAppsByDeveloper } from '../services/firestoreService';

export const DeveloperProfileScreen: React.FC = () => {
  const {
    selectedDeveloper,
    selectedDeveloperUid,
    closeDeveloperProfile,
    openAppDetails,
    downloadApp
  } = useStore();

  const [profile, setProfile] = useState<DeveloperProfile | null>(selectedDeveloper);
  const [developerApps, setDeveloperApps] = useState<StoreApp[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      if (!selectedDeveloperUid && !selectedDeveloper) return;
      setLoading(true);
      const lookup = selectedDeveloperUid || selectedDeveloper?.publicDeveloperId || selectedDeveloper?.developerSlug || selectedDeveloper?.uid || selectedDeveloper?.displayName || '';
      
      try {
        const [prof, apps] = await Promise.all([
          fetchPublicDeveloperProfile(lookup),
          fetchAppsByDeveloper(lookup)
        ]);

        if (isMounted) {
          if (prof) {
            setProfile(prof);
          }
          setDeveloperApps(apps || []);
        }
      } catch (e) {
        console.warn('[DeveloperProfileScreen] Error loading developer profile data:', e);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, [selectedDeveloperUid, selectedDeveloper]);

  const handleShare = () => {
    const devSlug =
      profile?.developerSlug ||
      profile?.publicDeveloperId ||
      (profile?.displayName
        ? profile.displayName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
        : '') ||
      selectedDeveloperUid ||
      'developer';
    const shareUrl = `https://store-avanyx.pages.dev/developer/${devSlug}`;

    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  if (loading && !profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <div className="w-10 h-10 border-4 border-[#6750A4]/30 border-t-[#6750A4] rounded-full animate-spin" />
        <p className="text-xs font-semibold text-[#49454F] dark:text-[#CAC4D0]">Loading Developer Profile...</p>
      </div>
    );
  }

  const devName = profile?.displayName || selectedDeveloperUid || 'Verified Developer';
  const bannerImg = profile?.bannerUrl || 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=1400';
  const logoImg = profile?.logoUrl || profile?.avatarUrl || `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(devName)}`;
  const isVerified = profile?.verified || profile?.verificationBadge === 'VERIFIED' || profile?.verificationBadge === 'VERIFIED_DEVELOPER';

  const contactEmail = profile?.contactEmail || profile?.supportEmail;
  const websiteUrl = profile?.officialWebsite || profile?.websiteUrl;
  const githubUrl = profile?.githubUrl;
  const instagramUrl = profile?.instagramUrl;
  const facebookUrl = profile?.facebookUrl;
  const youtubeUrl = profile?.youtubeUrl;
  const whatsappUrl = profile?.whatsappUrl;
  const otherLinks = profile?.otherPublicLinks || [];

  const hasAnyLinks = Boolean(
    contactEmail ||
    websiteUrl ||
    githubUrl ||
    instagramUrl ||
    facebookUrl ||
    youtubeUrl ||
    whatsappUrl ||
    (otherLinks && otherLinks.length > 0)
  );

  return (
    <div className="max-w-5xl mx-auto pb-20 px-4 sm:px-6 lg:px-8 pt-2 space-y-6">
      {/* Top Bar Navigation */}
      <div className="flex items-center justify-between">
        <button
          id="btn-back-from-developer-profile"
          onClick={closeDeveloperProfile}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-white dark:bg-[#1E1F23] hover:bg-[#F3EDF7] dark:hover:bg-[#2B2C30] text-[#1D1B20] dark:text-[#E6E1E5] border border-black/5 dark:border-white/5 transition shadow-sm text-xs font-bold"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Store
        </button>

        <button
          id="btn-share-developer-profile"
          onClick={handleShare}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-white dark:bg-[#1E1F23] hover:bg-[#F3EDF7] dark:hover:bg-[#2B2C30] text-[#49454F] dark:text-[#CAC4D0] border border-black/5 dark:border-white/5 transition text-xs font-bold shadow-sm"
        >
          {copiedLink ? <Check className="w-4 h-4 text-emerald-500" /> : <Share2 className="w-4 h-4" />}
          {copiedLink ? 'Link Copied' : 'Share Profile'}
        </button>
      </div>

      {/* Developer Header Banner Card */}
      <div className="relative rounded-[24px] overflow-hidden bg-white dark:bg-[#1E1F23] border border-black/5 dark:border-white/5 shadow-sm">
        {/* Banner Graphic — Container matching Home Featured Banner */}
        <div className="w-full aspect-[1024/500] max-h-[360px] relative overflow-hidden bg-[#1E1F23]">
          <img
            src={bannerImg}
            alt="Developer Banner"
            className="w-full h-full object-cover object-center"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60 pointer-events-none" />
        </div>

        {/* Developer Info Area — Avatar overlaps banner slightly (Play Store style) */}
        <div className="relative px-6 sm:px-8 pb-6 -mt-12 sm:-mt-16 flex flex-col md:flex-row md:items-end justify-between gap-6 z-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-5">
            <div className="relative w-24 h-24 sm:w-32 sm:h-32 rounded-2xl overflow-hidden ring-4 ring-white dark:ring-[#1E1F23] bg-white dark:bg-[#2B2C30] shadow-xl shrink-0">
              <img
                src={logoImg}
                alt={devName}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              {isVerified && (
                <div
                  className="absolute bottom-1 right-1 bg-[#6750A4] text-white p-1 rounded-full shadow-md ring-2 ring-white dark:ring-[#1E1F23]"
                  title="Verified Developer"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black text-[#1D1B20] dark:text-[#E6E1E5] tracking-tight">
                  {devName}
                </h1>
                {isVerified && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#6750A4]/15 text-[#6750A4] dark:text-[#D0BCFF] border border-[#6750A4]/30">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Verified Publisher
                  </span>
                )}
              </div>

              {profile?.organizationName && (
                <div className="flex items-center gap-1.5 text-xs text-[#49454F] dark:text-[#CAC4D0] font-medium">
                  <Building2 className="w-3.5 h-3.5 text-[#6750A4]" />
                  <span>{profile.organizationName}</span>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-3.5 text-[11px] text-[#49454F] dark:text-[#CAC4D0] pt-1">
                {profile?.country && (
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-slate-400" />
                    <span>{profile.country}</span>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Layers className="w-3 h-3 text-slate-400" />
                  <span>{developerApps.length} Published {developerApps.length === 1 ? 'App' : 'Apps'}</span>
                </div>
                {profile?.createdAt && (
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    <span>Publisher since {new Date(profile.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short' })}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Bio / Description */}
        {(profile?.shortDescription || profile?.bio) && (
          <div className="px-6 sm:px-8 pb-5 pt-3 border-t border-black/5 dark:border-white/5">
            <p className="text-xs text-[#49454F] dark:text-[#CAC4D0] leading-relaxed max-w-3xl">
              {profile.shortDescription || profile.bio}
            </p>
          </div>
        )}

        {/* Official & Verified Social / Community Links */}
        {hasAnyLinks && (
          <div className="px-6 sm:px-8 py-3.5 bg-black/[0.02] dark:bg-white/[0.02] border-t border-black/5 dark:border-white/5 flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-bold text-[#49454F] dark:text-[#CAC4D0] mr-1 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-[#6750A4]" /> Official Links:
            </span>

            {contactEmail && (
              <a
                href={`mailto:${contactEmail}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-[#2B2C30] hover:bg-[#F3EDF7] dark:hover:bg-[#34353A] text-[#1D1B20] dark:text-[#E6E1E5] border border-black/5 dark:border-white/10 transition text-xs font-semibold shadow-xs"
              >
                <Mail className="w-3.5 h-3.5 text-[#6750A4]" />
                Contact Email
                <ExternalLink className="w-3 h-3 opacity-60" />
              </a>
            )}

            {websiteUrl && (
              <a
                href={websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-[#2B2C30] hover:bg-[#F3EDF7] dark:hover:bg-[#34353A] text-[#1D1B20] dark:text-[#E6E1E5] border border-black/5 dark:border-white/10 transition text-xs font-semibold shadow-xs"
              >
                <Globe className="w-3.5 h-3.5 text-[#6750A4]" />
                Website
                <ExternalLink className="w-3 h-3 opacity-60" />
              </a>
            )}

            {githubUrl && (
              <a
                href={githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-[#2B2C30] hover:bg-[#F3EDF7] dark:hover:bg-[#34353A] text-[#1D1B20] dark:text-[#E6E1E5] border border-black/5 dark:border-white/10 transition text-xs font-semibold shadow-xs"
              >
                <Github className="w-3.5 h-3.5 text-[#1D1B20] dark:text-white" />
                GitHub
                <ExternalLink className="w-3 h-3 opacity-60" />
              </a>
            )}

            {instagramUrl && (
              <a
                href={instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-[#2B2C30] hover:bg-[#F3EDF7] dark:hover:bg-[#34353A] text-[#1D1B20] dark:text-[#E6E1E5] border border-black/5 dark:border-white/10 transition text-xs font-semibold shadow-xs"
              >
                <Instagram className="w-3.5 h-3.5 text-pink-500" />
                Instagram
                <ExternalLink className="w-3 h-3 opacity-60" />
              </a>
            )}

            {facebookUrl && (
              <a
                href={facebookUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-[#2B2C30] hover:bg-[#F3EDF7] dark:hover:bg-[#34353A] text-[#1D1B20] dark:text-[#E6E1E5] border border-black/5 dark:border-white/10 transition text-xs font-semibold shadow-xs"
              >
                <Facebook className="w-3.5 h-3.5 text-blue-600" />
                Facebook
                <ExternalLink className="w-3 h-3 opacity-60" />
              </a>
            )}

            {youtubeUrl && (
              <a
                href={youtubeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-[#2B2C30] hover:bg-[#F3EDF7] dark:hover:bg-[#34353A] text-[#1D1B20] dark:text-[#E6E1E5] border border-black/5 dark:border-white/10 transition text-xs font-semibold shadow-xs"
              >
                <Youtube className="w-3.5 h-3.5 text-red-500" />
                YouTube
                <ExternalLink className="w-3 h-3 opacity-60" />
              </a>
            )}

            {whatsappUrl && (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-[#2B2C30] hover:bg-[#F3EDF7] dark:hover:bg-[#34353A] text-[#1D1B20] dark:text-[#E6E1E5] border border-black/5 dark:border-white/10 transition text-xs font-semibold shadow-xs"
              >
                <MessageCircle className="w-3.5 h-3.5 text-emerald-500" />
                Community
                <ExternalLink className="w-3 h-3 opacity-60" />
              </a>
            )}

            {otherLinks.map((link, idx) => (
              <a
                key={idx}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-[#2B2C30] hover:bg-[#F3EDF7] dark:hover:bg-[#34353A] text-[#1D1B20] dark:text-[#E6E1E5] border border-black/5 dark:border-white/10 transition text-xs font-semibold shadow-xs"
              >
                <LinkIcon className="w-3.5 h-3.5 text-[#6750A4]" />
                {link.label || 'Link'}
                <ExternalLink className="w-3 h-3 opacity-60" />
              </a>
            ))}
          </div>
        )}
      </div>

      {/* Developer Portfolio Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-[#6750A4] dark:text-[#D0BCFF]" />
            <h2 className="text-base font-extrabold text-[#1D1B20] dark:text-[#E6E1E5]">
              Published Applications ({developerApps.length})
            </h2>
          </div>
        </div>

        {developerApps.length === 0 ? (
          <div className="text-center py-14 px-4 bg-white dark:bg-[#1E1F23] rounded-3xl border border-black/5 dark:border-white/5 space-y-2">
            <Layers className="w-10 h-10 text-[#49454F] dark:text-[#CAC4D0] mx-auto opacity-50" />
            <h3 className="text-sm font-bold text-[#1D1B20] dark:text-[#E6E1E5]">No Published Apps</h3>
            <p className="text-xs text-[#49454F] dark:text-[#CAC4D0] max-w-sm mx-auto">
              This developer has not released any public applications yet or their submissions are currently in review.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {developerApps.map((app) => (
              <motion.div
                key={app.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-[#1E1F23] border border-black/5 dark:border-white/5 rounded-3xl p-5 flex flex-col justify-between transition hover:shadow-md group space-y-4"
              >
                <div>
                  <div className="flex items-start gap-3.5">
                    <div
                      onClick={() => openAppDetails(app.id)}
                      className="w-14 h-14 rounded-2xl overflow-hidden bg-[#F3EDF7] dark:bg-[#2B2C30] shrink-0 cursor-pointer shadow-xs group-hover:scale-105 transition"
                    >
                      <img
                        src={app.iconUrl}
                        alt={app.name}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3
                        onClick={() => openAppDetails(app.id)}
                        className="text-sm font-extrabold text-[#1D1B20] dark:text-[#E6E1E5] truncate cursor-pointer hover:text-[#6750A4] transition"
                      >
                        {app.name}
                      </h3>
                      <p className="text-[11px] text-[#49454F] dark:text-[#CAC4D0] font-medium">{app.category}</p>
                      
                      <div className="flex items-center gap-2 mt-1 text-[11px] text-[#49454F] dark:text-[#CAC4D0]">
                        <div className="flex items-center gap-1 text-amber-500 font-bold">
                          <Star className="w-3 h-3 fill-current" />
                          <span>{app.rating.toFixed(1)}</span>
                        </div>
                        <span>•</span>
                        <span>{app.downloads}</span>
                        <span>•</span>
                        <span>{app.apkSize}</span>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-[#49454F] dark:text-[#CAC4D0] line-clamp-2 mt-3 leading-relaxed">
                    {app.description}
                  </p>
                </div>

                <div className="flex items-center gap-2 pt-3 border-t border-black/5 dark:border-white/5">
                  <button
                    onClick={() => openAppDetails(app.id)}
                    className="flex-1 py-2 px-3 rounded-xl bg-[#F3EDF7] dark:bg-[#2B2C30] hover:bg-[#E8DEF8] dark:hover:bg-[#34353A] text-xs font-bold text-[#1D1B20] dark:text-[#E6E1E5] transition text-center"
                  >
                    View Details
                  </button>
                  <button
                    onClick={() => downloadApp(app)}
                    className="p-2 rounded-xl bg-[#6750A4]/10 hover:bg-[#6750A4]/20 text-[#6750A4] dark:text-[#D0BCFF] transition"
                    title="Install APK"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Developer Information Card */}
      <div className="bg-white dark:bg-[#1E1F23] rounded-3xl border border-black/5 dark:border-white/5 p-6 space-y-4 shadow-xs">
        <div className="flex items-center gap-2 border-b border-black/5 dark:border-white/5 pb-3">
          <Building2 className="w-4 h-4 text-[#6750A4] dark:text-[#D0BCFF]" />
          <h3 className="text-sm font-extrabold text-[#1D1B20] dark:text-[#E6E1E5]">
            Publisher Information & Verification
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div className="space-y-1">
            <span className="text-[#49454F] dark:text-[#CAC4D0] block text-[11px]">Developer / Studio</span>
            <span className="font-bold text-[#1D1B20] dark:text-[#E6E1E5]">{devName}</span>
          </div>

          <div className="space-y-1">
            <span className="text-[#49454F] dark:text-[#CAC4D0] block text-[11px]">Organization</span>
            <span className="font-bold text-[#1D1B20] dark:text-[#E6E1E5]">{profile?.organizationName || 'Independent Studio'}</span>
          </div>

          <div className="space-y-1">
            <span className="text-[#49454F] dark:text-[#CAC4D0] block text-[11px]">Country / Region</span>
            <span className="font-bold text-[#1D1B20] dark:text-[#E6E1E5]">{profile?.country || 'Global'}</span>
          </div>

          <div className="space-y-1">
            <span className="text-[#49454F] dark:text-[#CAC4D0] block text-[11px]">Verification Authority</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Avanyx Store Verified
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeveloperProfileScreen;
