# Changelog

All notable changes to the **AVANYX Store** Android client will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [2.3.1] - 2026-09-15

### Added
- Real-time Firestore snapshot listener (`startRealtimeAppSync`) connected to the named production database instance.
- Immediate on-launch catalog sync with automated update reconciliation.
- Interactive Ratings & Reviews section in `AppDetailsScreen` with live submission to Firestore.
- Isolated test repository fixture (`TestAppRepository`) for Robolectric testing.
- Comprehensive open-source governance files: `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `SECURITY.md`, `ROADMAP.md`, `SUPPORT.md`, and issue/PR templates.

### Fixed
- Enforced named Firestore Database ID (`ai-studio-avanyxstore-083c830c-ab08-4b8b-aaa3-6b723506e575`) across all queries and listeners.
- Added strict `whereEqualTo("status", "PUBLISHED")` filter to all app queries to eliminate draft and unreviewed app leaks.
- Resolved `FirebaseAuthInvalidCredentialsException` with automatic account creation fallback and guest exploration mode.
- Purged all hardcoded mock and demo datasets (`initialApps`, `initialUpdates`, `LocalDemoAppRepository`) from production binaries.
- Fixed `AppDatabase.kt` database prepopulation callback to rely strictly on live Firestore sync.

### Security
- Hardened Firestore queries against injection and unapproved document visibility.
- Confirmed `.gitignore` exclusions for all sensitive artifacts, keystores, and credentials.

---

## [2.3.0] - 2026-09-14
- Initial release of Room database caching layer with `AppDatabase`.
- Background installed apps detection and update scanning.
- Dynamic Material 3 dark and light theme switching.
