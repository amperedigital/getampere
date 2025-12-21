# Changelog

## v1.0.1 - 2025-12-21
- Hero slider auto-resume now realigns to the nearest card after manual drag or momentum stops, preventing half-visible slides.
- Rebuilt/minified `hero-slider.min.js` and switched the site to load it from jsDelivr `@v1.0.1`.
- Documented the CDN usage and new alignment behavior in `context.md`.

## v1.0 - 2025-12-21
- Initial extraction of hero slider logic to `assets/js/hero-slider.js` with minified build.
- Created reusable configuration via `data-hero-slider` attributes and enabled drag momentum + auto-drift.
