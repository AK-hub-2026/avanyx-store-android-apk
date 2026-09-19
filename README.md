# AVANYX Store (Android)

<div align="center">

![AVANYX Store Banner](docs/images/banner.png)

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Platform](https://img.shields.io/badge/Platform-Android%208.0%2B-green.svg)](https://developer.android.com)
[![Kotlin](https://img.shields.io/badge/Kotlin-2.0.21-purple.svg)](https://kotlinlang.org)
[![Jetpack Compose](https://img.shields.io/badge/UI-Jetpack%20Compose%20M3-4285F4.svg)](https://developer.android.com/jetpack/compose)
[![FOSS United](https://img.shields.io/badge/FOSS%20United-Grant%20Candidate-orange.svg)](https://fossunited.org)
[![GitHub Student Pack](https://img.shields.io/badge/GitHub%20Student%20Pack-Aligned-181717.svg)](https://education.github.com/pack)

**A modern, privacy-respecting, native Android application marketplace built for speed, transparency, and independent developers.**

[Getting Started](#-getting-started) •
[Architecture](#-architecture) •
[Security & RBAC](#-security--rbac) •
[FOSS United & Grants](#-foss-united-grants--student-pack) •
[Contributing](CONTRIBUTING.md) •
[Roadmap](ROADMAP.md)

</div>

---

## 🌟 Overview

**AVANYX Store** is an open-source Android client designed to provide a fair, decentralized, and user-centric alternative to proprietary app stores. Built with Kotlin and modern Jetpack Compose (Material Design 3), the app combines fluid edge-to-edge UI interactions with real-time cloud catalog synchronization and robust local Room database caching.

### ✨ Key Features
- 🚀 **Real-time Live Sync:** Instant catalog updates via Firebase Firestore snapshot listeners (`startRealtimeAppSync`) backed by the named production database instance.
- 🔒 **Privacy & Safety First:** Zero-permission media picking, strict package verification, and cryptographic SHA-256 APK checksum validation before installation.
- 📦 **Offline-First Room Caching:** High-speed Jetpack Room caching guarantees that apps, installed package metadata, and user preferences are accessible even in zero-connectivity environments.
- 🎨 **Material 3 Design:** Full dynamic theming, edge-to-edge system transparency, custom typography, and accessible 48dp touch targets.
- 💬 **Live Ratings & Reviews:** Verified user reviews synced bidirectionally with Firestore.
- 🔍 **Fast Instant Search:** Local debounced search engine filtering across titles, developers, categories, and tags.
- 🛡️ **Zero Mock Data in Production:** The app connects directly to the live Firestore production database with automated reconciliation.

---

## 🏗️ Architecture

AVANYX Store follows **Clean Architecture** principles combined with the **MVVM (Model-View-ViewModel)** design pattern:

```text
┌──────────────────────────────────────────────────────────┐
│                 Jetpack Compose UI (M3)                  │
│   HomeScreen • AppsScreen • DetailsScreen • SearchScreen │
└────────────────────────────┬─────────────────────────────┘
                             │ StateFlow / Actions
┌────────────────────────────▼─────────────────────────────┐
│                       ViewModels                         │
│       State Management & Coroutines (Dispatchers.Main)   │
└────────────────────────────┬─────────────────────────────┘
                             │
┌────────────────────────────▼─────────────────────────────┐
│                 Repository Layer                         │
│  RoomAppRepository  ◀══════════════▶  FirestoreRepository│
└─────────────┬───────────────────────────────┬────────────┘
              │                               │
┌─────────────▼──────────────┐  ┌─────────────▼────────────┐
│      Jetpack Room DB       │  │ Named Firestore Database │
│  (Offline-First Local DB)  │  │ (Real-time Cloud Sync)   │
└────────────────────────────┘  └──────────────────────────┘
```

---

## 🔐 Security & RBAC

- **Named Database Isolation:** All queries target the isolated production database instance:
  `ai-studio-avanyxstore-083c830c-ab08-4b8b-aaa3-6b723506e575`
- **Strict Publication Filtering:** Every catalog query enforces `whereEqualTo("status", "PUBLISHED")`, preventing unapproved drafts or suspended apps from appearing on client devices.
- **Role-Based Access Control (RBAC):** Developer console mutations are strictly restricted to verified developer roles and document owners in Firestore rules.
- **Zero Secrets in Repository:** Keystores, signing passwords, and environment credentials are excluded from version control via `.gitignore`.

---

## 🎓 FOSS United Grants & Student Pack

AVANYX Store is designed to advance open-source mobile infrastructure in India and globally:
- **FOSS United Grants:** Applying for community grants to support decentralized APK mirror distribution, automated F-Droid build recipes, and local community translation drives.
- **GitHub Student Developer Pack:** Empowering student software creators to package, publish, and distribute their Android projects freely without proprietary developer account fees.

---

## 🚀 Getting Started

### Prerequisites
- **Android Studio** Koala (2024.1.1) or newer
- **JDK 17** or higher
- **Android SDK** API Level 35

### Building from Source

```bash
# 1. Clone the repository
git clone https://github.com/AK-hub-2026/avanyx-store-android-apk.git
cd avanyx-store-android-apk

# 2. Build Debug APK
gradle assembleDebug

# 3. Run Unit and JVM Tests
gradle :app:testDebugUnitTest
```

The compiled APK will be generated at:
`app/build/outputs/apk/debug/app-debug.apk`

---

## 🤝 Contributing

We welcome contributions from everyone! Please read our:
- [Contributing Guide](CONTRIBUTING.md)
- [Code of Conduct](CODE_OF_CONDUCT.md)
- [Security Policy](SECURITY.md)

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

Copyright © 2026 AVANYX.
