import { AvanyxEcosystemProduct, OAuthScopeDefinition } from '../types/identity';

export const AVANYX_ECOSYSTEM_PRODUCTS: AvanyxEcosystemProduct[] = [
  {
    id: 'avanyx-store',
    name: 'AVANYX Store',
    codename: 'Project Horizon Store',
    tagline: 'Next-Gen Verified Software & App Marketplace',
    description: 'Universal distribution store with SHA-256 package verification, developer telemetry, instant APK downloads, and community reviews.',
    iconName: 'ShoppingBag',
    accentColorHex: '#6750A4',
    badgeText: 'CORE ECOSYSTEM',
    version: 'v1.4.0',
    releaseStatus: 'LIVE',
    supportedPlatforms: ['WEB', 'ANDROID', 'WINDOWS'],
    defaultScopes: ['openid', 'profile', 'email', 'avanyx.store.read', 'avanyx.store.downloads'],
    features: [
      'Universal APK & Web app distribution',
      'Cryptographic SHA-256 integrity checks',
      'Integrated verified developer publishing',
      'Real-time app reviews and ratings'
    ],
    clientId: 'client_avanyx_store_web_prod'
  },
  {
    id: 'aether-platform',
    name: 'Aether Platform',
    codename: 'Project Aether OS',
    tagline: 'Autonomous AI Agent & Cloud Collaboration Workspace',
    description: 'Unified intelligence workspace connecting Gemini-powered agent swarms, dynamic canvas dashboards, and distributed cloud computing.',
    iconName: 'Sparkles',
    accentColorHex: '#0284C7',
    badgeText: 'AI WORKSPACE',
    version: 'v0.9.4',
    releaseStatus: 'BETA',
    supportedPlatforms: ['WEB', 'MAC', 'WINDOWS', 'LINUX'],
    defaultScopes: ['openid', 'profile', 'email', 'avanyx.aether.workspace', 'avanyx.cloud.storage'],
    features: [
      'Multi-agent neural workspace',
      'End-to-end encrypted session state',
      'Real-time collaborative canvas',
      'Server-side Gemini 2.5 flash integrations'
    ],
    clientId: 'client_aether_platform_agent_cloud'
  },
  {
    id: 'infinity-studio',
    name: 'Infinity Studio',
    codename: 'Project Infinity Engine',
    tagline: 'Next-Gen Developer SDK & Asset Publishing Engine',
    description: 'Full-stack game and developer tools engine providing SDK credentials, live analytics webhooks, pipeline CI/CD, and asset libraries.',
    iconName: 'Code2',
    accentColorHex: '#10B981',
    badgeText: 'DEV ENGINE',
    version: 'v2.1.0',
    releaseStatus: 'LIVE',
    supportedPlatforms: ['WEB', 'WINDOWS', 'MAC'],
    defaultScopes: ['openid', 'profile', 'email', 'avanyx.studio.build', 'avanyx.developer.publish'],
    features: [
      'API Key generation and OAuth credentials',
      'Live deployment webhook pipelines',
      'Telemetry graphs & geographic analytics',
      'Direct sync with AVANYX Store listings'
    ],
    clientId: 'client_infinity_studio_developer_sdk'
  },
  {
    id: 'bomb-rush-3d',
    name: 'Bomb Rush 3D',
    codename: 'Project CyberRush',
    tagline: 'Cross-Platform 3D Cyber Action & Cloud Saves',
    description: 'High-octane stylized cyber arcade game featuring real-time online leaderboards, cloud saves, multiplayer matchmaking, and achievements.',
    iconName: 'Gamepad2',
    accentColorHex: '#F59E0B',
    badgeText: 'FIRST-PARTY GAME',
    version: 'v1.0.8',
    releaseStatus: 'LIVE',
    supportedPlatforms: ['WEB', 'ANDROID', 'WINDOWS'],
    defaultScopes: ['openid', 'profile', 'avanyx.games.cloud_save', 'avanyx.games.achievements'],
    features: [
      'Universal AVANYX Identity cloud save synchronization',
      'Global cross-platform leaderboard ranking',
      'Unlockable avatar skins & custom badges',
      'Multiplayer match history & matchmaking'
    ],
    clientId: 'client_bomb_rush_3d_gaming_hub'
  },
  {
    id: 'future-apps',
    name: 'Future Apps & Extensible Ecosystem',
    codename: 'Open AVANYX Identity API',
    tagline: 'OAuth 2.0 / OpenID Connect Protocol for 3rd-Party Devs',
    description: 'Integrate AVANYX Identity SSO into custom web, mobile, and desktop applications using standard OAuth 2.0 authorization code and PKCE workflows.',
    iconName: 'Layers',
    accentColorHex: '#8B5CF6',
    badgeText: 'OAUTH / OIDC',
    version: 'v0.02 SPEC',
    releaseStatus: 'DEV_PREVIEW',
    supportedPlatforms: ['WEB', 'ANDROID', 'IOS', 'WINDOWS', 'MAC', 'LINUX'],
    defaultScopes: ['openid', 'profile', 'email'],
    features: [
      'Standard OAuth 2.0 authorization endpoints',
      'Granular consent permission prompts',
      'Token introspection & revocable grant tokens',
      'Zero-trust cross-device SSO token passing'
    ],
    clientId: 'client_future_apps_open_ecosystem'
  }
];

export const STANDARD_OAUTH_SCOPES: OAuthScopeDefinition[] = [
  {
    scope: 'openid',
    name: 'OpenID Connect Authentication',
    description: 'Allows applications to verify your identity using AVANYX Single Sign-On.',
    category: 'IDENTITY'
  },
  {
    scope: 'profile',
    name: 'Basic Profile Information',
    description: 'Grants read access to your display name, universal avatar, verification badges, and role.',
    category: 'PROFILE'
  },
  {
    scope: 'email',
    name: 'Email Address Access',
    description: 'Allows the connected application to view your verified AVANYX email address.',
    category: 'PROFILE'
  },
  {
    scope: 'avanyx.store.read',
    name: 'AVANYX Store Catalog & Library',
    description: 'Read installed application history, saved wishlists, and user app preferences.',
    category: 'STORE'
  },
  {
    scope: 'avanyx.store.downloads',
    name: 'Manage App Downloads',
    description: 'Initiate and manage application downloads and updates on your device.',
    category: 'STORE'
  },
  {
    scope: 'avanyx.aether.workspace',
    name: 'Aether Platform Workspaces',
    description: 'Sync autonomous AI agent states, canvas documents, and cloud collaboration rooms.',
    category: 'STUDIO'
  },
  {
    scope: 'avanyx.studio.build',
    name: 'Infinity Studio Build Pipelines',
    description: 'Trigger continuous integration builds, manage developer SDK keys, and inspect error logs.',
    category: 'DEVELOPER',
    isSensitive: true
  },
  {
    scope: 'avanyx.developer.publish',
    name: 'Publish to AVANYX Store',
    description: 'Upload new APK releases, edit store metadata, and manage developer listings.',
    category: 'DEVELOPER',
    isSensitive: true
  },
  {
    scope: 'avanyx.games.cloud_save',
    name: 'Gaming Cloud Saves & Profile',
    description: 'Synchronize highscores, unlocked items, and game state across devices in Bomb Rush 3D and future titles.',
    category: 'GAMING'
  },
  {
    scope: 'avanyx.games.achievements',
    name: 'Game Achievements & Leaderboards',
    description: 'Record trophies, unlockable cyber cosmetics, and competitive rank in AVANYX games.',
    category: 'GAMING'
  }
];
