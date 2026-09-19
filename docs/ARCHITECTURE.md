# AVANYX Store - System Architecture

## Phase 1 Native Android Overview
The client is structured following clean architectural principles:
- **Presentation Layer (UI/UX):** Custom Material 3 Jetpack Compose layout using MVVM.
- **Navigation Engine:** Type-safe Compose Navigation.
- **Data Repository Layer:** Local Kotlin mock repository designed to easily plug into remote API endpoint drivers in future phases.
- **Edge-to-Edge Experience:** Built with transparent system bars and full bleed drawing.
