export interface AvanyxFaqItem {
  id: string;
  q: string;
  a: string;
  explanation: string;
  internalLink?: {
    label: string;
    href: string;
  };
}

export const AVANYX_CORE_FAQS: AvanyxFaqItem[] = [
  {
    id: 'faq-what-is-avanyx',
    q: 'What is AVANYX Store?',
    a: 'AVANYX Store is an independent Android application marketplace and software distribution platform where users discover verified apps and developers publish software directly.',
    explanation: 'The platform provides direct, malware-scanned APK downloads for users, alongside dedicated administrative consoles for independent developers and students with 0% commission on free applications.',
    internalLink: {
      label: 'Explore Store Catalog',
      href: '/store'
    }
  },
  {
    id: 'faq-can-i-download',
    q: 'Can I download Android apps from AVANYX Store?',
    a: 'Yes, users can freely download verified Android APK packages directly from AVANYX Store.',
    explanation: 'Downloads are served over encrypted TLS 1.3 connections directly to your Android device, tablet, or desktop emulator without requiring third-party store clients or mandatory account sign-in.',
    internalLink: {
      label: 'Browse Android Apps',
      href: '/apps'
    }
  },
  {
    id: 'faq-can-developers-publish',
    q: 'Can developers publish Android apps on AVANYX Store?',
    a: 'Yes, verified developers can publish compiled Android APK applications through the AVANYX Developer Console.',
    explanation: 'Registered developers upload their compiled binaries, provide app metadata, define release notes, and distribute to a worldwide audience with zero forced publisher fees.',
    internalLink: {
      label: 'Apply for Developer Verification',
      href: '/developer/apply'
    }
  },
  {
    id: 'faq-what-is-dev-console',
    q: 'What is AVANYX Developer Console?',
    a: 'AVANYX Developer Console is the administrative portal that allows verified software developers to upload Android APK packages, configure releases, monitor analytics, and manage application listings.',
    explanation: 'It provides indie developers with real-time download telemetry, user rating moderation, APK version rollback controls, and release management.',
    internalLink: {
      label: 'Open Developer Console',
      href: '/developer-console'
    }
  },
  {
    id: 'faq-what-is-student-publishing',
    q: 'What is Student App Publishing?',
    a: 'Student App Publishing is a specialized AVANYX Store program that grants verified secondary and university students access to developer tooling, free application hosting, and community visibility.',
    explanation: 'Enrolled students who have completed 10th standard or equivalent can publish academic software projects, portfolio utilities, and student-built tools with zero registration costs and an official Verified Student checkmark.',
    internalLink: {
      label: 'Apply for Student Publishing',
      href: '/student/apply'
    }
  },
  {
    id: 'faq-how-apk-verification-works',
    q: 'How does APK verification work?',
    a: 'APK verification on AVANYX Store is an automated multi-stage security process that evaluates decompiled DEX bytecode, manifest permissions, and network activity before approving any application.',
    explanation: 'The CyberShield security pipeline inspects every submitted package for malicious payloads, suspicious background services, and unauthorized device access patterns before the release goes public.',
    internalLink: {
      label: 'Review CyberShield AI Security',
      href: '/about#ai-pipeline'
    }
  },
  {
    id: 'faq-how-check-apk-integrity',
    q: 'How does AVANYX Store check APK integrity?',
    a: 'AVANYX Store checks APK integrity by calculating and validating cryptographic SHA-256 hash checksums for every uploaded package.',
    explanation: 'When an APK is compiled and uploaded, its cryptographic signature is registered. During user downloads, the SHA-256 hash ensures that the package received on your device matches the audited binary bit-for-bit.',
    internalLink: {
      label: 'View Security Policy',
      href: '/security.txt'
    }
  },
  {
    id: 'faq-can-guests-browse',
    q: 'Can guests browse AVANYX Store?',
    a: 'Yes, guests can freely browse the marketplace, search application categories, and download APKs without creating an account.',
    explanation: 'We prioritize user privacy and open access. User accounts are completely optional and only necessary if you choose to publish apps, leave verified reviews, or participate in student verification programs.',
    internalLink: {
      label: 'Enter Store as Guest',
      href: '/store'
    }
  },
  {
    id: 'faq-do-i-need-account-for-docs',
    q: 'Do I need an account to read the documentation?',
    a: 'No, all AVANYX Store documentation, API guides, FAQs, and developer policies are completely public and accessible without an account.',
    explanation: 'Anyone, including web-connected AI search agents, can inspect our technical specifications, privacy rules, and publishing requirements at any time.',
    internalLink: {
      label: 'Read Platform Documentation',
      href: '/about'
    }
  },
  {
    id: 'faq-how-auto-seo-works',
    q: 'How does automatic app SEO work?',
    a: 'AutoSEOEngine automatically extracts metadata from published apps in Firestore to generate search engine titles, meta descriptions, canonical URLs, Open Graph tags, and Schema.org structured data.',
    explanation: 'Developers do not need to manually enter hundreds of keywords. The engine analyzes verified app attributes, version strings, categories, and developer details to produce standards-compliant SEO tags instantly.',
    internalLink: {
      label: 'Inspect SEO Engine Details',
      href: '/about#features'
    }
  },
  {
    id: 'faq-how-new-apps-indexed',
    q: 'How are newly published applications indexed?',
    a: 'Newly published applications are indexed immediately through dynamic sitemap updates, internal store category listings, and SoftwareApplication JSON-LD schemas.',
    explanation: 'Search engines and AI discovery systems can find newly released applications via the public XML sitemap at /sitemap.xml and crawlable category hubs under /apps and /games.',
    internalLink: {
      label: 'View XML Sitemap',
      href: '/sitemap.xml'
    }
  },
  {
    id: 'faq-what-shown-on-app-page',
    q: 'What information is shown on an app page?',
    a: 'An app page displays verified package details including the app name, developer profile, version code, file size, SHA-256 checksum, category, user reviews, feature screenshots, and direct download links.',
    explanation: 'Every detail page provides transparent technical specifications, verified developer links, security audit status, and installation instructions for Android devices.',
    internalLink: {
      label: 'Sample App Page: Bomb Rush 3D',
      href: '/app/bomb-rush-3d'
    }
  },
  {
    id: 'faq-what-content-prohibited',
    q: 'What content is prohibited on AVANYX Store?',
    a: 'Prohibited content includes malware, spyware, unauthorized cryptominers, phishing applications, copyright-infringing assets, predatory adware, and software that secretly tracks user behavior.',
    explanation: 'Software violating our content guidelines is immediately quarantined by the security response team, and offending developer accounts face immediate suspension.',
    internalLink: {
      label: 'Review Content Policies',
      href: '/about#terms'
    }
  },
  {
    id: 'faq-bomb-rush-3d',
    q: 'What is Bomb Rush 3D on AVANYX Store?',
    a: 'Bomb Rush 3D is a featured high-FPS 3D action mobile game available on AVANYX Store with offline gameplay support and clean malware verification.',
    explanation: 'It showcases the high-performance APK distribution capabilities of the store, offering fast-paced 3D arcade combat with zero forced telemetry.',
    internalLink: {
      label: 'View Bomb Rush 3D Details',
      href: '/app/bomb-rush-3d'
    }
  },
  {
    id: 'faq-autopdf',
    q: 'What is AVANYX AutoPDF?',
    a: 'AVANYX AutoPDF is a productivity utility application available on AVANYX Store for automated document scanning, PDF compilation, and offline OCR text recognition.',
    explanation: 'It provides privacy-first document processing on Android devices without transmitting user documents to external cloud servers.',
    internalLink: {
      label: 'View AutoPDF Details',
      href: '/app/avanyx-autopdf'
    }
  },
  {
    id: 'faq-student-limitations',
    q: 'What limitations apply to student developer accounts?',
    a: 'Student developer accounts have standard infrastructure rate limits of up to 10 active published package releases per account.',
    explanation: 'This boundary ensures equitable server bandwidth and database usage while offering free educational hosting for student software creators.',
    internalLink: {
      label: 'Student Program Requirements',
      href: '/student/apply'
    }
  },
  {
    id: 'faq-pwa-support',
    q: 'Can I install AVANYX Store as a Progressive Web App (PWA)?',
    a: 'Yes, AVANYX Store complies with W3C Web App Manifest standards and can be installed directly to Android home screens or desktop docks.',
    explanation: 'The PWA version provides offline catalog caching, fast launch speeds, and responsive layouts across phones, tablets, and desktop workstations.',
    internalLink: {
      label: 'PWA Web Manifest',
      href: '/site.webmanifest'
    }
  },
  {
    id: 'faq-commission-rate',
    q: 'Does AVANYX Store charge any commission on free or paid apps?',
    a: 'AVANYX Store charges 0% commission on free applications and open-source software distribution.',
    explanation: 'Independent developers and student creators retain 100% ownership of their software and code, with no recurring developer membership charges or listing fees.',
    internalLink: {
      label: 'Developer Console Information',
      href: '/developer-console'
    }
  }
];
