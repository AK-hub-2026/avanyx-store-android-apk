# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 2.3.x   | :white_check_mark: |
| < 2.3.0 | :x:                |

---

## Reporting a Vulnerability

We take the security of AVANYX Store, its users, and participating developers very seriously.

If you believe you have found a security vulnerability in this repository, please do **NOT** open a public issue. Instead, report it privately:

1. **Email:** Send details to `security@avanyx.org` or `aditya.avanyx@gmail.com`.
2. **GitHub Security Advisory:** Submit a private vulnerability report via GitHub's "Security" tab.

### What to Include in Your Report
- A description of the vulnerability and its potential impact.
- Step-by-step reproduction steps or Proof of Concept (PoC) code.
- Affected components (e.g., Firestore queries, APK installer, download engine, auth flow).
- Any proposed remediation or mitigation if available.

### Response Timeline
- **Initial Response:** Within 48 hours acknowledging receipt.
- **Triage & Status Update:** Within 5 business days.
- **Fix & Public Disclosure:** Coordinated release and disclosure schedule after patch deployment.

---

## Security Best Practices in AVANYX Store

1. **Named Firestore Database Isolation:** All queries target the isolated database instance (`ai-studio-avanyxstore-083c830c-ab08-4b8b-aaa3-6b723506e575`).
2. **Strict RBAC & Status Verification:** App queries enforce `whereEqualTo("status", "PUBLISHED")` to guarantee that drafts, suspended, or unapproved apps cannot be accessed by clients.
3. **APK Checksum Verification:** Installed packages are cryptographically validated against SHA-256 hashes recorded in Firestore before package manager invocation.
4. **Android Package Sandbox & Zero-Permission Media Picker:** Adheres to modern Google Play and AOSP security policies, using scoped storage and least-privilege permissions.
5. **No Secret Ingestion:** Keystores, signing passwords, and environment credentials are never checked into version control.
