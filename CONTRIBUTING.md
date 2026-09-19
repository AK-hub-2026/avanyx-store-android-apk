# Contributing to AVANYX Store

Thank you for your interest in contributing to **AVANYX Store**! We welcome contributions from developers, designers, technical writers, and open-source enthusiasts. As an open-source alternative application marketplace, community contributions are essential to our growth.

---

## Code of Conduct

All contributors and participants are expected to adhere to our [Code of Conduct](CODE_OF_CONDUCT.md). Please read it before participating.

---

## How Can I Contribute?

- **Reporting Bugs:** Submit clear, reproducible bug reports with log traces.
- **Suggesting Features:** Propose ideas aligned with privacy, decentralization, and high-performance Android UX.
- **Submitting Pull Requests:** Fix known bugs, implement roadmap items, optimize performance, or improve test coverage.
- **Documentation:** Enhance setup guides, API docs, architecture diagrams, or translations.

---

## Development Setup

### Prerequisites
1. **Android Studio** (Koala / Ladybug or newer recommended).
2. **JDK 17+** (Required for Gradle 8.x and AGP 8.6+).
3. **Android SDK** with platform `android-35` installed.
4. **Git** installed on your system.

### Cloning & Building

```bash
# Clone the repository
git clone https://github.com/AK-hub-2026/avanyx-store-android-apk.git
cd avanyx-store-android-apk

# Assemble debug build
gradle assembleDebug

# Run unit tests
gradle :app:testDebugUnitTest
```

---

## Commit Guidelines

We enforce the [Conventional Commits](https://www.conventionalcommits.org/) specification:

- `feat:` A new user-facing feature.
- `fix:` A bug fix.
- `docs:` Documentation improvements or additions.
- `refactor:` Code changes that neither fix bugs nor add features.
- `security:` Security vulnerability patches or security rule hardening.
- `release:` Release preparation and version bumps.

**Example:**
```
feat(search): implement instant debounced filtering in search bar
fix(sync): filter published apps to prevent draft app leaks
docs: add architecture sequence diagram for Room-Firestore sync
```

---

## Pull Request Process

1. **Fork** the repository and create a descriptive branch:
   ```bash
   git checkout -b feat/your-feature-name
   ```
2. Ensure the code compiles cleanly:
   ```bash
   gradle assembleDebug
   ```
3. Run and verify unit tests:
   ```bash
   gradle :app:testDebugUnitTest
   ```
4. Commit your changes with conventional commit messages.
5. Push to your fork and submit a Pull Request targeting the `main` branch.
6. Fill out the PR template completely.

---

## Architecture Guidelines

- **UI Framework:** Jetpack Compose with Material 3 theming.
- **State Management:** MVVM with Kotlin Coroutines & `Flow` / `StateFlow`.
- **Local Persistence:** Android Jetpack Room (`AppDatabase`).
- **Cloud Sync:** Firebase Firestore with offline cache and realtime snapshot listeners.
- **Zero Mock Data:** Production builds must only consume live published data from Firestore.

---

## Grants & Acknowledgments

AVANYX Store is built as an open-source initiative and actively pursues support from:
- **FOSS United Grants**
- **GitHub Student Developer Pack**
- Community Sponsors and Open Source Backers
