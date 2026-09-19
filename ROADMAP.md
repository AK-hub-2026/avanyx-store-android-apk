# AVANYX Store Roadmap

This document outlines the strategic engineering roadmap for the AVANYX Store open-source ecosystem.

---

## Phase 1: Android Client Core & Live Firestore Sync (Current - v2.3.x)
- [x] Modern Jetpack Compose UI with Material 3 theming and edge-to-edge support.
- [x] Offline-first local database caching powered by Room (`AppDatabase`).
- [x] Multi-format authentication (Firebase Email/Password, Anonymous Guest, Google ID Token).
- [x] Realtime Firestore catalog synchronization via snapshot listeners (`startRealtimeAppSync`).
- [x] Strict server-side and client-side status filtering (`whereEqualTo("status", "PUBLISHED")`).
- [x] Background package scanning and local update detection engine (`InstalledAppsManager`).
- [x] User ratings and reviews integration with live bidirectional Firestore sync.
- [x] Removal of all mock and fallback datasets for pure production Firestore data loading.

---

## Phase 2: Open Source Community & Developer Portal (Next)
- [ ] Automated F-Droid build recipe support.
- [ ] Decentralized APK mirror fallback support (IPFS / decentralized storage).
- [ ] Web Developer Console for third-party indie developers to upload and manage app submissions.
- [ ] Reproducible builds and in-app cryptographic signature verification for downloaded APKs.
- [ ] Push notification service for automatic app update alerts.

---

## Phase 3: Decentralized Distribution & Grants Expansion
- [ ] Delta update downloads to reduce bandwidth consumption for users in low-connectivity areas.
- [ ] Integration with FOSS United community repository.
- [ ] Multi-language internationalization (i18n) for Hindi, Spanish, French, German, and Mandarin.
- [ ] Student developer showcase category in collaboration with GitHub Student Developer Pack.
