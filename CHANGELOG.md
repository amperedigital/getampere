# Changelog

## v1.194 - 2026-01-08
- **Stable Release: Real Card Stack UI**
- Finalized precision alignment for the 3D card stack, ensuring all right-side edges align perfectly.
- Implemented synchronized hover-flattening: background cards now lay flat simultaneously when the active card is hovered to prevent corner protrusions.
- Standardized `transform-origin: center` and `scale: 1.0` across the stack to eliminate perspective divergence.
- Fixed 0-byte deployment issue from previous version sync error.

## v1.189 - 2026-01-05
- Optimized mobile scroll performance and fixed rendering artifacts for the hero section.
- Unified SMIL animation synchronization with tab state changes in `tab-flipper.js`.

## v1.0.1 - 2025-12-21
- Hero slider auto-resume now realigns to the nearest card after manual drag or momentum stops, preventing half-visible slides.
- Rebuilt/minified `hero-slider.min.js` and switched the site to load it from jsDelivr `@v1.0.1`.
- Documented the CDN usage and new alignment behavior in `context.md`.

## v1.0 - 2025-12-21
- Initial extraction of hero slider logic to `assets/js/hero-slider.js` with minified build.
- Created reusable configuration via `data-hero-slider` attributes and enabled drag momentum + auto-drift.
