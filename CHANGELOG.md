# Changelog

## v1.219 - 2026-01-09
- **Mobile UX & Dynamic Viewport Height Fixes**
- Reverted excessive margins (mt-24 -> mt-4) for better layout density.
- Implemented `max-md:overflow-y-auto` fallback for card content to prevent CTAs from being blocked by short mobile viewports.
- Enhanced modal system to use `h-auto` and `max-h-[calc(100dvh-5rem)]` on mobile, preventing browser navigation bars from obstructing modal actions.
- Maintained critical card height calculations while adding protective scrolling layers.

## v1.218 - 2026-01-09
- **Refined Card Stack Spacing**
- Increased mobile/tablet top margin for the card container (mt-12 -> mt-24) to prevent overlap with navigation tabs.
- Added internal padding (pt-16) to the 3D grid container to safely accommodate the upward translation of stacked back-cards.
- Maintained stable height calculations while providing breathing room for the 3D depth effect.

## v1.217 - 2026-01-09
- **Emergency Revert: Mobile Optimization Rollback**
- Reverted mobile list fallback breakpoint to 375px.
- Reverted tabs grid layout to 768px (md) breakpoint.
- Reverted 3D stack physics to stable values (12deg/6deg) and restored grid-based positioning.
- Fixed layout regressions across multiple breakpoints.

## v1.207 - 2026-01-08
- **Stable Release: Precision Stacking Logic Reverted**
- Restored "Incremental Stack" behavior: background cards are hidden (`opacity-0`) until they have been passed, creating a build-up effect rather than a pre-filled stack.
- Corrected `inactive-next` visibility and z-index to match the original stable design.
- Maintained the improved hover-flattening physics (`--stack-y: 0px !important`).

## v1.206 - 2026-01-08- **Stable Release: Restored Stacking Architecture**
- Fixed vanishing stack layers by ensuring `inactive-next` cards remain visible (`opacity-100`).
- Re-applied horizontal/vertical offsets to all non-active cards via generic `:not(.active)` selector.
- Corrected hover/touch flattening logic to include `--stack-y` reset for a perfectly unified flat state.
- Standardized `z-index` for all stack layers to ensure correct depth visibility.

## v1.205 - 2026-01-08
- **Stable Release: Refined Sticky Navigation & Modular Core**
- Adjusted sticky navigation top margin on tablet+ from 6rem to 7.5rem to prevent header overlap.
- Optimized sticky container minimum height to match new offset (120px).
- Confirmed full stability of modular card and modal systems.

## v1.204 - 2026-01-08
- **Stable Release: Modular Architecture & Integrated Modal System**
- Optimized mobile modal positioning: reduced top whitespace by 12rem for improved focus and centered layout on small viewports.
- Finalized Modular Card Architecture: Abstracted 3D stacking into `data-stack-index` system.
- Generic SMIL Interaction Engine: Auto-detection of animations via `data-smil-anim`.
- Decoupled `tab-flipper.js` from hardcoded IDs for easier content scaling.
- Fixed "System Operational" badge positioning in mobile modal view.

## v1.203 - 2026-01-08
- **Modular Architecture Refactor**
- Abstracted 3D stacking logic into a data-driven system using `data-stack-index`.
- Decoupled `tab-flipper.js` from hardcoded IDs, enabling dynamic card addition without JS modifications.
- Introduced `data-smil-anim` attribute for generic SVG animation lifecycle management.
- Standardized card container structure for easier content updates and reuse.

## v1.202 - 2026-01-08
- **Stable Release: Advanced 3D Card Stack Interactivity**
- Fixed mobile straightening interaction using `ontouchstart` listener hack for improved iOS/Safari responsiveness.
- Implemented CSS-variable driven transform system for precision 3D alignment and multi-layer synchronization.
- Enhanced layout spacing for both desktop and mobile, ensuring no overlap with navigation bars.
- Unified hover and touch triggers across the entire stack to provide a consistent, tactile user experience.
- Resolved CSS conflicts with global reveal animations.

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
