import { StoreApp, NavigationTab, DeveloperProfile } from '../types';
import { AVANYX_CORE_FAQS } from '../data/avanyxFaqData';

export const PRIMARY_SEO_KEYWORDS = [
  'AVANYX Store',
  'AVANYX App Store',
  'Secure App Marketplace',
  'Android App Store',
  'AI Verified APK',
  'APK Download',
  'Bomb Rush 3D',
  'AVANYX AutoPDF',
  'Developer Console',
  'Student Publishing',
  'AVANYX Developer Console',
  'Android App Publishing',
  'Student App Publishing',
  'Publish Android Apps',
  'Upload APK',
  'Software Developer Marketplace',
  'Developer Registration',
  'Student Developer Platform',
  'Indie Android Developers',
  'AI Verified Developer Apps',
  'Malware Free APK',
  'Android Apps',
  'Android Games',
  'AVANYX Identity'
];

export const SITE_ORIGIN = 'https://avanyxstore.org';

/**
 * Extracts auto-generated keywords for any published app
 */
export function generateAppKeywords(app: StoreApp): string {
  const dynamicWords: string[] = [
    app.name,
    `${app.name} APK`,
    `${app.name} Download`,
    `${app.name} Android`,
    app.category,
    app.developer || 'AVANYX Developer',
    app.packageName
  ];

  if (app.tags && Array.isArray(app.tags)) {
    dynamicWords.push(...app.tags);
  }

  // Deduplicate and combine with primary keywords
  const combined = Array.from(new Set([...dynamicWords, ...PRIMARY_SEO_KEYWORDS]));
  return combined.slice(0, 30).join(', ');
}

/**
 * Generates full SEO metadata package for a given app
 */
export interface SeoMetadataPackage {
  title: string;
  description: string;
  keywords: string;
  canonicalUrl: string;
  ogImage: string;
  ogType: string;
  jsonLdSchema: Record<string, any>;
}

export function generateAppSeoData(app: StoreApp, origin: string = SITE_ORIGIN): SeoMetadataPackage {
  const title = `AVANYX Store - ${app.name} APK Download (v${app.version || '1.0.0'})`;
  const rawDesc = (app as any).tagline || app.description || app.fullDescription || 'AI-verified secure Android application.';
  const cleanDesc = rawDesc.replace(/(<([^>]+)>)/gi, '').slice(0, 75);
  const description = `AVANYX Store presents ${app.name} APK v${app.version || '1.0.0'}. ${cleanDesc} Secure, AI-verified, malware-scanned direct Android download.`;
  const keywords = generateAppKeywords(app);
  const canonicalUrl = `${origin}/app/${app.id}`;
  const ogImage = app.iconUrl || app.bannerUrl || `${origin}/avanyx-store-banner.webp`;

  const catStr = (app.category || '').toString().toUpperCase();
  const isGame = catStr === 'GAME' || catStr === 'GAMES' || catStr === 'ACTION' || catStr === 'ARCADE' || catStr === 'CASUAL' || catStr === 'RACING';

  const softwareAppSchema: Record<string, any> = {
    '@type': isGame ? 'GameApplication' : 'SoftwareApplication',
    'name': app.name,
    'operatingSystem': 'Android',
    'applicationCategory': isGame ? 'GameApplication' : `${app.category || 'Mobile'}Application`,
    'offers': {
      '@type': 'Offer',
      'price': '0',
      'priceCurrency': 'USD',
      'availability': 'https://schema.org/InStock'
    },
    'softwareVersion': app.version || '1.0.0',
    'fileSize': app.apkSize || '15 MB',
    'downloadUrl': app.downloadUrl || canonicalUrl,
    'author': {
      '@type': 'Organization',
      'name': app.developer || 'AVANYX Verified Developer'
    },
    'publisher': {
      '@type': 'Organization',
      'name': 'AVANYX Store',
      'url': origin,
      'logo': `${origin}/avanyx-store-logo.webp`
    },
    'image': app.iconUrl || `${origin}/avanyx-store-logo.webp`,
    'description': cleanDesc,
    'mainEntityOfPage': canonicalUrl
  };

  if (app.rating) {
    softwareAppSchema['aggregateRating'] = {
      '@type': 'AggregateRating',
      'ratingValue': app.rating.toString(),
      'reviewCount': (app.reviewCount || 12).toString(),
      'bestRating': '5',
      'worstRating': '1'
    };
  }

  // Breadcrumb Schema for the application
  const breadcrumbSchema = {
    '@type': 'BreadcrumbList',
    'itemListElement': [
      {
        '@type': 'ListItem',
        'position': 1,
        'name': 'AVANYX Store',
        'item': `${origin}/store`
      },
      {
        '@type': 'ListItem',
        'position': 2,
        'name': isGame ? 'Android Games' : 'Android Apps',
        'item': `${origin}/${isGame ? 'games' : 'apps'}`
      },
      {
        '@type': 'ListItem',
        'position': 3,
        'name': app.name,
        'item': canonicalUrl
      }
    ]
  };

  // Dynamic FAQ Schema tailored for each app
  const appFaqSchema = {
    '@type': 'FAQPage',
    'mainEntity': [
      {
        '@type': 'Question',
        'name': `How do I download ${app.name} APK on AVANYX Store?`,
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': `You can download ${app.name} APK directly from AVANYX Store with zero registration required. Every package is cryptographically signed and verified for malware.`
        }
      },
      {
        '@type': 'Question',
        'name': `Is ${app.name} verified and safe to install?`,
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': `Yes, ${app.name} has passed the CyberShield 4-tier security audit including DEX bytecode analysis, sandbox execution, and SHA-256 integrity verification.`
        }
      }
    ]
  };

  const jsonLdSchema: Record<string, any> = {
    '@context': 'https://schema.org',
    '@graph': [
      softwareAppSchema,
      breadcrumbSchema,
      appFaqSchema
    ]
  };

  return {
    title,
    description,
    keywords,
    canonicalUrl,
    ogImage,
    ogType: 'mobile_application',
    jsonLdSchema
  };
}

/**
 * Generates SEO metadata package for primary store tabs
 */
export function generateTabSeoData(
  tab: NavigationTab,
  options?: {
    searchQuery?: string;
    developer?: DeveloperProfile | null;
    origin?: string;
    path?: string;
  }
): SeoMetadataPackage {
  const origin = options?.origin || SITE_ORIGIN;
  const q = options?.searchQuery ? options.searchQuery.trim() : '';
  const currentPath = options?.path || (typeof window !== 'undefined' ? window.location.pathname : '');

  // Dynamic FAQ Schema generated strictly from verified visible FAQs
  const fullFaqPageSchema = {
    '@type': 'FAQPage',
    'mainEntity': AVANYX_CORE_FAQS.map((faq) => ({
      '@type': 'Question',
      'name': faq.q,
      'acceptedAnswer': {
        '@type': 'Answer',
        'text': `${faq.a} ${faq.explanation}`
      }
    }))
  };

  if (q) {
    return {
      title: `AVANYX Store - Search "${q}" Apps & Games`,
      description: `AVANYX Store search results for "${q}". Browse and download AI-verified Android APKs, games, and developer tools with zero malware.`,
      keywords: `${q}, search ${q}, ${PRIMARY_SEO_KEYWORDS.join(', ')}`,
      canonicalUrl: `${origin}/store?q=${encodeURIComponent(q)}`,
      ogImage: `${origin}/avanyx-store-banner.webp`,
      ogType: 'website',
      jsonLdSchema: {
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'SearchResultsPage',
            'name': `AVANYX Store Search Results for "${q}"`,
            'url': `${origin}/store?q=${encodeURIComponent(q)}`
          },
          {
            '@type': 'BreadcrumbList',
            'itemListElement': [
              { '@type': 'ListItem', 'position': 1, 'name': 'AVANYX Store', 'item': `${origin}/store` },
              { '@type': 'ListItem', 'position': 2, 'name': `Search "${q}"`, 'item': `${origin}/store?q=${encodeURIComponent(q)}` }
            ]
          }
        ]
      }
    };
  }

  // Handle dedicated public routes like /about and /faq regardless of currentTab
  if (currentPath === '/faq' || currentPath === '/faqs') {
    return {
      title: 'AVANYX Store - FAQ Knowledge Base & Verified Answers',
      description: 'Explore verified answers to frequently asked questions about AVANYX Store, APK downloads, developer registration, student publishing, and AI verification.',
      keywords: `FAQ, Knowledge Base, Android APK FAQs, Developer Help, ${PRIMARY_SEO_KEYWORDS.join(', ')}`,
      canonicalUrl: `${origin}/faq`,
      ogImage: `${origin}/avanyx-store-banner.webp`,
      ogType: 'website',
      jsonLdSchema: {
        '@context': 'https://schema.org',
        '@graph': [
          fullFaqPageSchema,
          {
            '@type': 'BreadcrumbList',
            'itemListElement': [
              { '@type': 'ListItem', 'position': 1, 'name': 'AVANYX Store', 'item': `${origin}/store` },
              { '@type': 'ListItem', 'position': 2, 'name': 'FAQ Knowledge Base', 'item': `${origin}/faq` }
            ]
          }
        ]
      }
    };
  }

  if (currentPath === '/about') {
    return {
      title: 'AVANYX Store - About the Open Android App Marketplace & Ecosystem',
      description: 'Learn about AVANYX Store, an independent Android app marketplace providing direct APK downloads, 0% developer fees, and AI security scanning.',
      keywords: `About AVANYX, App Store History, Mission, Independent Marketplace, ${PRIMARY_SEO_KEYWORDS.join(', ')}`,
      canonicalUrl: `${origin}/about`,
      ogImage: `${origin}/avanyx-store-banner.webp`,
      ogType: 'website',
      jsonLdSchema: {
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'Organization',
            'name': 'AVANYX Store',
            'url': origin,
            'logo': `${origin}/avanyx-store-logo.webp`,
            'description': 'Independent Android app marketplace with native client, Developer Console, and Student Publishing.',
            'sameAs': [
              'https://twitter.com/avanyxstore',
              'https://github.com/avanyxstore'
            ]
          },
          {
            '@type': 'BreadcrumbList',
            'itemListElement': [
              { '@type': 'ListItem', 'position': 1, 'name': 'AVANYX Store', 'item': `${origin}/store` },
              { '@type': 'ListItem', 'position': 2, 'name': 'About AVANYX', 'item': `${origin}/about` }
            ]
          },
          fullFaqPageSchema
        ]
      }
    };
  }

  if (tab === 'DEV_CONSOLE' || currentPath === '/developer-console' || currentPath === '/developer') {
    return {
      title: 'AVANYX Store - Developer Console & Android App Publishing Portal',
      description: 'AVANYX Developer Console enables verified software creators to submit Android APK packages, inspect AI security audits, manage release tracks, and view download analytics.',
      keywords: `Developer Console, Android Publishing, Upload APK, Release Tracks, ${PRIMARY_SEO_KEYWORDS.join(', ')}`,
      canonicalUrl: `${origin}/developer-console`,
      ogImage: `${origin}/avanyx-store-banner.webp`,
      ogType: 'website',
      jsonLdSchema: {
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'WebPage',
            'name': 'AVANYX Developer Console',
            'url': `${origin}/developer-console`,
            'description': 'Administrative portal for Android app publishing and release management.'
          },
          {
            '@type': 'BreadcrumbList',
            'itemListElement': [
              { '@type': 'ListItem', 'position': 1, 'name': 'AVANYX Store', 'item': `${origin}/store` },
              { '@type': 'ListItem', 'position': 2, 'name': 'Developer Console', 'item': `${origin}/developer-console` }
            ]
          }
        ]
      }
    };
  }

  if (tab === 'STUDENT_CONSOLE' || currentPath === '/student-console' || currentPath === '/student') {
    return {
      title: 'AVANYX Store - Student Developer Console & Academic Publishing Hub',
      description: 'AVANYX Student Console offers verified student developers a dedicated portal to publish academic Android apps, manage release packages, and build portfolios with zero fees.',
      keywords: `Student Console, Academic Publishing, Student Developer Program, ${PRIMARY_SEO_KEYWORDS.join(', ')}`,
      canonicalUrl: `${origin}/student-console`,
      ogImage: `${origin}/avanyx-store-banner.webp`,
      ogType: 'website',
      jsonLdSchema: {
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'WebPage',
            'name': 'AVANYX Student Console',
            'url': `${origin}/student-console`,
            'description': 'Student publishing portal for academic projects and early developer portfolios.'
          },
          {
            '@type': 'BreadcrumbList',
            'itemListElement': [
              { '@type': 'ListItem', 'position': 1, 'name': 'AVANYX Store', 'item': `${origin}/store` },
              { '@type': 'ListItem', 'position': 2, 'name': 'Student Console', 'item': `${origin}/student-console` }
            ]
          }
        ]
      }
    };
  }

  switch (tab) {
    case 'INTRO':
      return {
        title: 'AVANYX Store - Official Secure App Marketplace & AI Publishing Platform',
        description: 'AVANYX Store is the official secure Android app marketplace featuring native APK downloads, Developer Console, Student Publishing, and AI verification.',
        keywords: PRIMARY_SEO_KEYWORDS.join(', '),
        canonicalUrl: `${origin}/`,
        ogImage: `${origin}/avanyx-store-banner.webp`,
        ogType: 'website',
        jsonLdSchema: {
          '@context': 'https://schema.org',
          '@graph': [
            {
              '@type': 'Organization',
              'name': 'AVANYX Store',
              'url': origin,
              'logo': `${origin}/avanyx-store-logo.webp`,
              'description': 'Official secure app marketplace with native Android client, Developer Console, and Student Publishing.',
              'sameAs': [
                'https://twitter.com/avanyxstore',
                'https://github.com/avanyxstore'
              ]
            },
            {
              '@type': 'BreadcrumbList',
              'itemListElement': [
                { '@type': 'ListItem', 'position': 1, 'name': 'AVANYX Store', 'item': `${origin}/store` },
                { '@type': 'ListItem', 'position': 2, 'name': 'Developer Console', 'item': `${origin}/developer-console` },
                { '@type': 'ListItem', 'position': 3, 'name': 'Student Console', 'item': `${origin}/student-console` },
                { '@type': 'ListItem', 'position': 4, 'name': 'About AVANYX', 'item': `${origin}/about` },
                { '@type': 'ListItem', 'position': 5, 'name': 'Frequently Asked Questions', 'item': `${origin}/faq` }
              ]
            },
            fullFaqPageSchema
          ]
        }
      };

    case 'GAMES':
      return {
        title: 'AVANYX Store - Android Games APK Downloads | Bomb Rush 3D & Action',
        description: 'AVANYX Store features top AI-verified Android games including Bomb Rush 3D, high FPS action titles, arcade games, and malware-scanned APK downloads.',
        keywords: `Android Games, Bomb Rush 3D, Game APK, ${PRIMARY_SEO_KEYWORDS.join(', ')}`,
        canonicalUrl: `${origin}/games`,
        ogImage: `${origin}/avanyx-store-banner.webp`,
        ogType: 'website',
        jsonLdSchema: {
          '@context': 'https://schema.org',
          '@graph': [
            {
              '@type': 'CollectionPage',
              'name': 'Android Games Directory - AVANYX Store',
              'description': 'Verified Android games APK directory on AVANYX Store.',
              'url': `${origin}/games`
            },
            {
              '@type': 'BreadcrumbList',
              'itemListElement': [
                { '@type': 'ListItem', 'position': 1, 'name': 'AVANYX Store', 'item': `${origin}/store` },
                { '@type': 'ListItem', 'position': 2, 'name': 'Android Games', 'item': `${origin}/games` }
              ]
            }
          ]
        }
      };

    case 'APPS':
      return {
        title: 'AVANYX Store - Android Apps Directory & APK Downloads | AVANYX AutoPDF',
        description: 'AVANYX Store provides AI-verified productivity and utility Android apps including AVANYX AutoPDF, developer tools, and secure direct APK downloads.',
        keywords: `Android Apps, AVANYX AutoPDF, PDF Tools, Utility APK, ${PRIMARY_SEO_KEYWORDS.join(', ')}`,
        canonicalUrl: `${origin}/apps`,
        ogImage: `${origin}/avanyx-store-banner.webp`,
        ogType: 'website',
        jsonLdSchema: {
          '@context': 'https://schema.org',
          '@graph': [
            {
              '@type': 'CollectionPage',
              'name': 'Android Apps Directory - AVANYX Store',
              'description': 'Verified Android utility and productivity apps on AVANYX Store.',
              'url': `${origin}/apps`
            },
            {
              '@type': 'BreadcrumbList',
              'itemListElement': [
                { '@type': 'ListItem', 'position': 1, 'name': 'AVANYX Store', 'item': `${origin}/store` },
                { '@type': 'ListItem', 'position': 2, 'name': 'Android Apps', 'item': `${origin}/apps` }
              ]
            }
          ]
        }
      };

    case 'DEVELOPER_PROFILE':
      if (options?.developer) {
        const devName = options.developer.displayName || options.developer.organizationName || 'Developer';
        return {
          title: `AVANYX Store - ${devName} Developer Profile & Published Apps`,
          description: `AVANYX Store presents verified developer portfolio and published Android applications for ${devName}. AI-audited secure APK downloads.`,
          keywords: `${devName}, ${devName} apps, developer portfolio, ${PRIMARY_SEO_KEYWORDS.join(', ')}`,
          canonicalUrl: `${origin}/developer-profile/${options.developer.uid}`,
          ogImage: options.developer.avatarUrl || `${origin}/avanyx-store-banner.webp`,
          ogType: 'profile',
          jsonLdSchema: {
            '@context': 'https://schema.org',
            '@graph': [
              {
                '@type': 'Organization',
                'name': devName,
                'description': options.developer.bio || `Developer profile for ${devName} on AVANYX Store.`,
                'url': `${origin}/developer-profile/${options.developer.uid}`
              },
              {
                '@type': 'BreadcrumbList',
                'itemListElement': [
                  { '@type': 'ListItem', 'position': 1, 'name': 'AVANYX Store', 'item': `${origin}/store` },
                  { '@type': 'ListItem', 'position': 2, 'name': 'Developers', 'item': `${origin}/developer-console` },
                  { '@type': 'ListItem', 'position': 3, 'name': devName, 'item': `${origin}/developer-profile/${options.developer.uid}` }
                ]
              }
            ]
          }
        };
      }
      break;

    case 'DEVELOPER_APPLY':
      return {
        title: 'AVANYX Store - Apply for Developer Console & Publish Android Apps',
        description: 'AVANYX Store Developer Program invites Android publishers to upload APKs, access AI security scans, manage release tracks, and distribute globally.',
        keywords: `Developer Console, Publish Android App, Developer Verification, ${PRIMARY_SEO_KEYWORDS.join(', ')}`,
        canonicalUrl: `${origin}/developer/apply`,
        ogImage: `${origin}/avanyx-store-banner.webp`,
        ogType: 'website',
        jsonLdSchema: {
          '@context': 'https://schema.org',
          '@graph': [
            {
              '@type': 'WebPage',
              'name': 'Developer Program Application - AVANYX Store',
              'url': `${origin}/developer/apply`,
              'description': 'Official portal to apply for verified developer publishing rights on AVANYX Store.'
            },
            {
              '@type': 'HowTo',
              'name': 'How to Apply for AVANYX Developer Verification',
              'description': 'Step-by-step verification process for independent Android developers and software publishers on AVANYX Store.',
              'step': [
                {
                  '@type': 'HowToStep',
                  'position': 1,
                  'name': 'Provide Legal & Studio Identity',
                  'text': 'Enter your legal name, studio or organization name, support email, and primary country.'
                },
                {
                  '@type': 'HowToStep',
                  'position': 2,
                  'name': 'Verify Phone & Email 2FA',
                  'text': 'Complete one-time passcode verification for two-factor publisher authentication.'
                },
                {
                  '@type': 'HowToStep',
                  'position': 3,
                  'name': 'Submit Identity & Agree to Distribution Terms',
                  'text': 'Complete identity verification and agree to the 0% commission AVANYX Developer Agreement.'
                },
                {
                  '@type': 'HowToStep',
                  'position': 4,
                  'name': 'Admin Review & Developer Console Access',
                  'text': 'Receive approval within 24–48 hours to start uploading APK packages.'
                }
              ]
            },
            {
              '@type': 'BreadcrumbList',
              'itemListElement': [
                { '@type': 'ListItem', 'position': 1, 'name': 'AVANYX Store', 'item': `${origin}/store` },
                { '@type': 'ListItem', 'position': 2, 'name': 'Developer Console', 'item': `${origin}/developer-console` },
                { '@type': 'ListItem', 'position': 3, 'name': 'Apply', 'item': `${origin}/developer/apply` }
              ]
            }
          ]
        }
      };

    case 'STUDENT_APPLY':
      return {
        title: 'AVANYX Store - Student Publishing Program & Free App Distribution',
        description: 'AVANYX Store Student Publishing Program offers 100% free app hosting, zero developer fees, and global distribution for verified academic developers.',
        keywords: `Student Publishing, Free App Hosting, Student Developers, ${PRIMARY_SEO_KEYWORDS.join(', ')}`,
        canonicalUrl: `${origin}/student/apply`,
        ogImage: `${origin}/avanyx-store-banner.webp`,
        ogType: 'website',
        jsonLdSchema: {
          '@context': 'https://schema.org',
          '@graph': [
            {
              '@type': 'WebPage',
              'name': 'Student Publishing Program - AVANYX Store',
              'url': `${origin}/student/apply`,
              'description': 'Dedicated publishing pathway for enrolled students with free app hosting.'
            },
            {
              '@type': 'HowTo',
              'name': 'How to Apply for the AVANYX Student Developer Program',
              'description': 'Verification process for secondary and university students to access free Android app publishing.',
              'step': [
                {
                  '@type': 'HowToStep',
                  'position': 1,
                  'name': 'Academic Enrollment Proof',
                  'text': 'Provide your school or university name, academic board, degree program, and graduation year.'
                },
                {
                  '@type': 'HowToStep',
                  'position': 2,
                  'name': 'Document Verification',
                  'text': 'Upload a valid student ID card or 10th standard certificate for enrollment confirmation.'
                },
                {
                  '@type': 'HowToStep',
                  'position': 3,
                  'name': 'Honor Code Confirmation',
                  'text': 'Agree to the Student Developer Honor Code to guarantee ethical, malware-free publishing.'
                },
                {
                  '@type': 'HowToStep',
                  'position': 4,
                  'name': 'Student Console Access',
                  'text': 'Receive verified student badge and free hosting quota of up to 10 active release tracks.'
                }
              ]
            },
            {
              '@type': 'BreadcrumbList',
              'itemListElement': [
                { '@type': 'ListItem', 'position': 1, 'name': 'AVANYX Store', 'item': `${origin}/store` },
                { '@type': 'ListItem', 'position': 2, 'name': 'Student Console', 'item': `${origin}/student-console` },
                { '@type': 'ListItem', 'position': 3, 'name': 'Student Apply', 'item': `${origin}/student/apply` }
              ]
            }
          ]
        }
      };

    case 'HOME':
    default:
      return {
        title: 'AVANYX Store - Secure App Marketplace & APK Downloads',
        description: 'AVANYX Store is the official Android app marketplace for direct APK downloads, security scanning, developer publishing, and verified software distribution.',
        keywords: PRIMARY_SEO_KEYWORDS.join(', '),
        canonicalUrl: `${origin}/store`,
        ogImage: `${origin}/avanyx-store-banner.webp`,
        ogType: 'website',
        jsonLdSchema: {
          '@context': 'https://schema.org',
          '@graph': [
            {
              '@type': 'WebSite',
              'name': 'AVANYX Store',
              'url': `${origin}/store`,
              'potentialAction': {
                '@type': 'SearchAction',
                'target': `${origin}/store?q={search_term_string}`,
                'query-input': 'required name=search_term_string'
              }
            },
            {
              '@type': 'BreadcrumbList',
              'itemListElement': [
                { '@type': 'ListItem', 'position': 1, 'name': 'AVANYX Store', 'item': `${origin}/store` },
                { '@type': 'ListItem', 'position': 2, 'name': 'Developer Console', 'item': `${origin}/developer-console` },
                { '@type': 'ListItem', 'position': 3, 'name': 'Student Console', 'item': `${origin}/student-console` },
                { '@type': 'ListItem', 'position': 4, 'name': 'About AVANYX', 'item': `${origin}/about` },
                { '@type': 'ListItem', 'position': 5, 'name': 'FAQ', 'item': `${origin}/faq` }
              ]
            }
          ]
        }
      };
  }

  return {
    title: 'AVANYX Store - Secure App Marketplace',
    description: 'AVANYX Store is the official secure Android app marketplace with native Android client, Developer Console, Student Publishing, and verified APK downloads.',
    keywords: PRIMARY_SEO_KEYWORDS.join(', '),
    canonicalUrl: `${origin}/store`,
    ogImage: `${origin}/avanyx-store-banner.webp`,
    ogType: 'website',
    jsonLdSchema: {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      'name': 'AVANYX Store',
      'url': `${origin}/store`
    }
  };
}

/**
 * Dynamically updates document head tags for instant SEO sync
 */
export function applySeoMetadataToDOM(seo: SeoMetadataPackage) {
  if (typeof document === 'undefined') return;

  // 1. Page Title
  document.title = seo.title;

  // Helper for setting meta tags
  const setMetaTag = (selector: string, attrName: string, attrVal: string, content: string) => {
    let el = document.querySelector(selector);
    if (!el) {
      el = document.createElement('meta');
      el.setAttribute(attrName, attrVal);
      document.head.appendChild(el);
    }
    el.setAttribute('content', content);
  };

  // Helper for setting link tags
  const setLinkTag = (rel: string, href: string) => {
    let el = document.querySelector(`link[rel="${rel}"]`);
    if (!el) {
      el = document.createElement('link');
      el.setAttribute('rel', rel);
      document.head.appendChild(el);
    }
    el.setAttribute('href', href);
  };

  // 2. Standard Meta Tags
  setMetaTag('meta[name="description"]', 'name', 'description', seo.description);
  setMetaTag('meta[name="keywords"]', 'name', 'keywords', seo.keywords);

  // 3. Open Graph Tags
  setMetaTag('meta[property="og:title"]', 'property', 'og:title', seo.title);
  setMetaTag('meta[property="og:description"]', 'property', 'og:description', seo.description);
  setMetaTag('meta[property="og:url"]', 'property', 'og:url', seo.canonicalUrl);
  setMetaTag('meta[property="og:image"]', 'property', 'og:image', seo.ogImage);
  setMetaTag('meta[property="og:type"]', 'property', 'og:type', seo.ogType);
  setMetaTag('meta[property="og:site_name"]', 'property', 'og:site_name', 'AVANYX Store');

  // 4. Twitter Tags
  setMetaTag('meta[name="twitter:card"]', 'name', 'twitter:card', 'summary_large_image');
  setMetaTag('meta[name="twitter:title"]', 'name', 'twitter:title', seo.title);
  setMetaTag('meta[name="twitter:description"]', 'name', 'twitter:description', seo.description);
  setMetaTag('meta[name="twitter:image"]', 'name', 'twitter:image', seo.ogImage);

  // 5. Canonical Link
  setLinkTag('canonical', seo.canonicalUrl);

  // 6. Dynamic JSON-LD Script Injection
  let jsonLdScript = document.querySelector('script#dynamic-seo-jsonld');
  if (!jsonLdScript) {
    jsonLdScript = document.createElement('script');
    jsonLdScript.setAttribute('type', 'application/ld+json');
    jsonLdScript.setAttribute('id', 'dynamic-seo-jsonld');
    document.head.appendChild(jsonLdScript);
  }
  jsonLdScript.textContent = JSON.stringify(seo.jsonLdSchema, null, 2);
}

interface SitemapItem {
  loc: string;
  priority: string;
  changefreq: string;
  lastmod?: string;
}

/**
 * Builds dynamic XML sitemap string from live published apps array
 */
export function generateDynamicSitemapXml(apps: StoreApp[], origin: string = SITE_ORIGIN): string {
  const staticUrls: SitemapItem[] = [
    { loc: `${origin}/`, priority: '1.0', changefreq: 'daily' },
    { loc: `${origin}/store`, priority: '0.95', changefreq: 'hourly' },
    { loc: `${origin}/developer-console`, priority: '0.9', changefreq: 'daily' },
    { loc: `${origin}/student-console`, priority: '0.85', changefreq: 'daily' },
    { loc: `${origin}/about`, priority: '0.8', changefreq: 'weekly' },
    { loc: `${origin}/faq`, priority: '0.8', changefreq: 'weekly' },
    { loc: `${origin}/apps`, priority: '0.8', changefreq: 'daily' },
    { loc: `${origin}/games`, priority: '0.8', changefreq: 'daily' },
    { loc: `${origin}/developer/apply`, priority: '0.7', changefreq: 'monthly' },
    { loc: `${origin}/student/apply`, priority: '0.7', changefreq: 'monthly' },
    { loc: `${origin}/login`, priority: '0.5', changefreq: 'monthly' },
    { loc: `${origin}/signup`, priority: '0.5', changefreq: 'monthly' }
  ];

  const appUrls: SitemapItem[] = apps.map((app) => ({
    loc: `${origin}/app/${app.id}`,
    priority: app.isFeatured ? '0.9' : '0.8',
    changefreq: 'weekly',
    lastmod: new Date().toISOString().split('T')[0]
  }));

  const allUrls = [...staticUrls, ...appUrls];

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

  allUrls.forEach((u) => {
    xml += `  <url>\n`;
    xml += `    <loc>${u.loc}</loc>\n`;
    if (u.lastmod) xml += `    <lastmod>${u.lastmod}</lastmod>\n`;
    xml += `    <changefreq>${u.changefreq}</changefreq>\n`;
    xml += `    <priority>${u.priority}</priority>\n`;
    xml += `  </url>\n`;
  });

  xml += `</urlset>`;
  return xml;
}
