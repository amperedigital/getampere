# Changelog

## v1.871 - 2026-01-19
- **Code Optimization**:
  - **Component Refactor**: Moved logic for "Shiny CTA" buttons from inline HTML `<style>` blocks to `input.css`.
    - *Action*: Extracted `.shiny-cta`, hover states, and complex `@property` definitions into the main stylesheet.
    - *Benefit*: Significantly reduced HTML file size, removed duplicate code blocks, and centralized button styling.

## v1.870 - 2026-01-19
- **Code Optimization**:
  - **Inline Styles Refactor**: Moved inline animation styles and keyframes for the hero "CALL" animation into `styles.css`.
    - *Action*: Extracted `@keyframes letterSlideIn` to `input.css` and created a reusable `.animate-letter-reveal` utility class.
    - *Benefit*: Reduces HTML bloat, improves maintainability, and allows for cleaner markup.

## v1.869 - 2026-01-19
- **Hero Typography**:
  - **SVG Dot Alignment**: Lowered the position of the period dot.
    - *Fix*: Removed `mb-[0.06em]` to drop the dot down to the natural baseline, aligning it with the bottom of the "L".

## v1.868 - 2026-01-19
- **Hero Typography**:
  - **Layout**: Split "Handle Every" into two lines ("Handle" / "Every").
  - **SVG Dot Alignment**: Adjusted the period dot after "CALL".
    - *Spacing*: Increased left margin (`ml-2`) for better visual separation.
    - *Alignment*: Applied `align-baseline` and `mb-[0.06em]` to strictly align the dot with the text baseline.

## v1.867 - 2026-01-19
- **Hero Typography**:
  - **SVG Dot**: Replaced the font-based full stop in "CALL." with an SVG circle.
    - *Goal*: Ensure a perfectly round geometric dot at all sizes, replacing the previous `font-space-grotesk` period.

## v1.866 - 2026-01-19
- **Hero Typography**:
  - **Layout Refinement**: Updated the hero heading "Built to Handle Every Call".
    - *Change*: Forced a line break between "Built to" and "Handle Every" to improve visual balance and impact.

## v1.865 - 2026-01-19
- **Hero Fixes**:
  - **Background Images**: Restored missing background images on Hero Slide 2.
    - *Issue*: Tailwind v3 arbitrary value scanner failed to process URLs with query strings containing HTML entities (`&amp;`).
    - *Fix*: Removed query parameters from `bg-[url(...)]` classes in `index.html` to ensure correct CSS generation.

## v1.864 - 2026-01-19
- **System Rollback**:
  - **Tailwind Downgrade**: Emergency rollback from Tailwind v4 Alpha to v3.
    - *Reason*: Critical layout regressions observed in production build immediately following v4 upgrade.
    - *Action*: Restored stable Tailwind v3 configuration and dependencies.

## v1.738 - 2026-01-18
- **3D Key Color Standardization**:
  - **Unified Ink**: Applied the new Medium-Dark Navy (**#1e2a40**) to the Light Mode ink as well.
    - *Change*: Replaced the previous `#0f172a` (Brand Navy) with `#1e2a40` in Light Mode.
    - *Result*: Consistent branding across themes. The key is effectively the "same color" logically, just with a white body in Light Mode vs a solid navy body in Dark Mode.

## v1.737 - 2026-01-18
- **3D Key Color Refinement**:
  - **Medium-Dark Navy**: Adjusted color to **#1e2a40**.
    - *Goal*: Hitting the sweet spot between the original invisible black/navy and the previous "too light" blue-grey.
    - *Design*: This is a rich, deep navy that preserves the brand identity while reflecting just enough environmental light to be distinct from the black background.

## v1.736 - 2026-01-18
- **3D Key Color Adjustment**:
  - **Lighter Navy**: Shifted Dark Mode color from Slate-600 (Grey-Blue) to **#2d3b59** (Lighter Navy).
    - *Fixes*: Restores the "Navy" hue requested by design, while keeping the value high enough ("quite a few shades lighter") to be visible against the black background.
    - *Result*: A rich blue-grey metallic look instead of the previous slate-grey.

## v1.735 - 2026-01-18
- **3D Key Texture Unification**:
  - **Dynamic SVG Ink**: The "A" Logo and Face Ink now dynamically match the Body Color in Dark Mode (Slate-600 #475569).
    - *Fixes*: The visual disconnect where the face was Navy/Black but the body was Slate-Blue. Now it is a solid, unified block of material.
  - **Refactor**: Variables `inkHex` and `bodyColor` moved to function scope to drive both texture generation and material PBR.

## v1.734 - 2026-01-18
- **3D Key Material Fix (Dark Mode)**:
  - **Matte Finish**: Disabled `clearcoat` and increased `roughness` (0.2 -> 0.6) for the Dark Mode body material.
    - *Fixes*: Prevents the key from acting like a black mirror reflecting the dark void, forcing it to scatter light and show its pigment.
  - **Color**: Lightened further to **Slate-600** (`#475569`) to ensure visibility.
  - **Console**: Log updated to `v1.734`.

## v1.733 - 2026-01-18
- **3D Key Visibility Fix**:
  - **Color**: Lightened Dark Mode body to Slate-700 (`#334155`). In 3D PBR rendering, this lighter grey-blue is required to *appear* as Dark Navy once shaded.
  - **Lighting**: Boosted Ambient Light base intensity to `0.8` (was `0.4`). This aggressive floor prevents the object from crushing to black in the dark environment.
  - **Console**: Log updated to `v1.733`.

## v1.732 - 2026-01-18
- **3D Key Version Bump**:
  - Updated internal console log to `v1.732` to confirm delivery of lighting/material fixes.
  - No functional changes, just a version stamp sync.

## v1.731 - 2026-01-18
- **3D Key Material & Lighting Tweak**:
  - **Material Color**: Shifted Dark Mode body color from `#0a0b14` (Background Black) to `#1e293b` (Slate-800).
    - *Reason*: The exact background color was crushing to pure black in 3D shadows. A lighter base allows the scene lighting to render a visible navy tone that effectively "matches" the dark background once shaded.
  - **Ambient Light**: Boosted base intensity from `0.1` to `0.4`.
    - *Reason*: Ensures the dark material is illuminated enough to be distinct from the void.

## v1.730 - 2026-01-18
- **3D Key Color Update**:
  - Updated the **Dark Mode Color** from Slate-900 (`#0f172a`) to the Site Background Navy (`#0a0b14`).
  - This change applies to both the **Body/Sides** material and the **Logo "Ink"** on the face.
  - Ensures the dark key blends perfectly with the surrounding page background.

## v1.729 - 2026-01-18
- **3D Key Finalization**:
  - Reverted the Hero 3D Key to `data-key-theme="dark"` after successful verification.
  - The feature is now complete: Dark Mode is active with perfect pixel alignment (Flush Top/Right/Bottom, Left Gap).

## v1.728 - 2026-01-18
- **3D Key Theme Test**:
  - Switched Hero 3D Key to `data-key-theme="light"` to verify the visual regression of the texturing changes in Light Mode.
  - Expected: The 5% left gap should be invisible (White on White), looking identical to the original design.

## v1.727 - 2026-01-18
- **3D Key Face Adjustment**:
  - Refined Face Texture to use non-uniform scaling: `scale(0.95, 1.0)`.
  - **Result**:
    - **Left**: 5% White Gap (Preserved).
    - **Right**: Flush (Preserved).
    - **Top**: Flush (Preserved).
    - **Bottom**: Flush (FIXED - Previously had a gap due to uniform scaling).
  - Ensures the Navy logo spans the full vertical height of the face while maintaining the left-side reveal.

## v1.726 - 2026-01-18
- **3D Key Face Adjustment**:
  - Updated Face Texture transformation to `scale(0.95)` with `translate(21.2, 0)`.
  - **Effect**: Creates a ~5% white gap on the LEFT side (revealing the 'A' opening) while keeping the RIGHT and TOP edges flush/edge-to-edge.
  - Aligns with user request for "Left Gapping Only".

## v1.725 - 2026-01-18
- **3D Key Refresh**:
  - **Logo Padding**: Adjusted the generated texture to scale the Ampere logo down by 10% (0.9 scale) and center it with padding.
  - This ensures a visible white border remains around the navy "A" logo, preventing it from merging visually with the dark bevel edges in Dark Mode.

## v1.724 - 2026-01-18
- **3D Key Implementation**:
  - Added `data-key-theme="dark"` to the primary 3D Key instance in the Hero section of `index.html`.
  - This activates the v1.723 dark mode logic, rendering the key body in Brand Navy (`#0f172a`) while keeping the face White.

## v1.723 - 2026-01-18
- **3D Key Debugging**:
  - Updated internal console log to `v1.723` to accurately reflect the loaded version.
  - Confirmed Dark Mode logic (`data-key-theme="dark"`) is present in the build.

## v1.722 - 2026-01-18
- **3D Key Features**:
  - **Dark Mode Support**: Added `data-key-theme="dark"` support to the `Ampere3DKey` container.
  - When set to dark, the key body/sides render in Brand Navy (`#0f172a`) while the face remains White, creating a high-contrast look.
  - Default behavior (`theme="light"` or missing) remains unchanged (All White).

## v1.721 - 2026-01-17
- **3D Key Lighting**: 
  - Moved `mainLight` to the LEFT (`-5, 5, 10`) to match user expectation.
  - Adjusted `shinyLight` sweep to start further left (`-10`) to `+10`.

## v1.720 - 2026-01-17
- **UI Tweaks**:
  - **Start State Lighting Fix**:
    - The key was dark because lights were starting at intensity 0.
    - Updated `setProgress` logic to give `mainLight` (0.8) and `shinyLight` (15.0) significant base intensity at 0% scroll.
    - This ensures the specular highlight is actually visible in the resting state.
  - **Angle Adjustment**:
    - Reduced forward pitch from `-1.1` to `-1.25`. This is a balanced "pitched forward" angle (~71 degrees) that catches the now-active light without being too extreme.

## v1.719 - 2026-01-17
- **UI Tweaks**:
  - **3D Key Lighting**:
    - Moved the Specular Sweep Light (`shinyLight`) position to `Y=3, Z=6` (was `Y=2, Z=4`).
    - This places the light higher and closer to the camera, improving the chance of specular "glint" reflections on the forward-pitched face.
  - **Cleanup**: Removed debug rotation logging.

## v1.718 - 2026-01-17
- **Debug**:
  - Added periodic (2s) console logger to output exact 3D Mesh Rotation (X, Y, Z).
  - Use this to verify that the `startX` changes are actually being applied in your environment.
  - Current Target Start Pitch: `-1.1` rad.

## v1.717 - 2026-01-17
- **UI Tweaks**:
  - Increased 3D Key Pitch Forward angle:
    - Changed `startX` from `-1.35` to `-1.1`.
    - This creates a more pronounced forward tilt (top edge towards camera), ensuring the face catches the overhead light unmistakably.

## v1.716 - 2026-01-17
- **UI Tweaks**:
  - **3D Key Reset & Refine**:
    - Reverted all "Banking" (Z-Axis) and "Leaning Back" (X-Axis) experiments.
    - Applied a subtle **Pitch Forward** (`startX = -1.35`).
    - This tilts the top of the key slightly *toward* the camera (approx 10 degrees from flat), effectively angling the face normal toward the main light source to catch the reflection.
    - Reset Z-axis start rotation to 0.

## v1.714 - 2026-01-17
- **UI Tweaks**:
  - Adjusted 3D Key Pitch (X-Axis) to "Lean Back":
    - Changed `startX` from `-Math.PI/2.1` (~-1.5) to `-1.8` rad.
    - This tilts the top edge of the key *away* from the camera, exposing the face to overhead lighting and creating a backward-leaning floating posture.
  - Retained the subtle Z-banking from previous edit.

## v1.713 - 2026-01-17
- **UI Tweaks**:
  - Adjusted 3D Key **Start State**:
    - Applied the "Right Side Up, Left Side Down" banking (`0.25` rad) to the **Start State** as well.
    - Previously only applied to the End/Scrolled state.
    - This ensures the key catches the specular light immediately upon load, fulfilling the objective of seeing the reflection while floating in the resting state.

## v1.711 - 2026-01-17
- **UI Tweaks**:
  - Adjusted 3D Key Rotation:
    - **Start State**: Reverted to flat (`-Math.PI/2.1`).
    - **End State (Scrolled)**: Added significant banking (`0.35` rad on Z-axis). This tilts the key "Left Side Down, Right Side Up" (Counter-Clockwise) as it floats up, positioning it to catch the specular highlight on the bevels.

## v1.710 - 2026-01-17
- **UI Tweaks**:
  - Corrected 3D Key Axis logic for "Banking" effect:
    - Reverted `rotation.z` to standard behavior (it controls Spin, not Bank).
    - Adjusted `rotation.x` start angle (`-1.2` rad vs `-1.5` rad) to tilt the face slightly towards the camera (Pitch), catching more light on the face.
    - Adjusted `rotation.y` start angle (`-0.3` rad) to actually "Bank" the key (Right Side Up, Left Side Down) relative to the camera view.
  - Added console log debug: "Ampere3DKey v1.710 Loaded".

## v1.709 - 2026-01-17
- **UI Tweaks**:
  - Reverted start-state lighting intensity hacks (v1.708).
  - Adjusted 3D Key start angle:
    - Added positive Z-rotation (`0.25` rad) to bank the key "Right Side Up, Left Side Down" in the start state.
    - Transitions to original position (`-0.1` rad) as user scrolls.
    - This angle change is intended to naturally catch reflection/light on the bevels to solve the "2D vs 3D" visibility issue.

## v1.708 - 2026-01-17
- **UI Tweaks**:
  - Enhanced 3D Key start state:
    - Increased Main Light base intensity (0.0 -> 0.5) to illuminate the face immediately.
    - Added base intensity to Specular Sweep Light (0.0 -> 8.0) to ensure a visible reflection on the bevel at rest.
    - Slightly boosted Ambient Light (0.05 -> 0.1).

## v1.707 - 2026-01-17
- **UI Tweaks**:
  - Fine-tuned CTA Heading spacing for mobile: increased negative margin to `-mt-20` (from `-mt-12`), providing a balanced look between "touching" and "disconnected".

## v1.706 - 2026-01-17
- **Fix**:
  - Adjusted CTA Heading spacing for mobile: Reduced negative margin to `-mt-12` on mobile (was `-mt-24` globally) to prevent visual overlap with the 3D Key. Desktop retains `-mt-24`.

## v1.705 - 2026-01-17
- **UI Update**:
  - Tightened spacing between 3D Key and Heading by doubling the negative margin (from `-mt-12` to `-mt-24`).

## v1.704 - 2026-01-17
- **UI Update**:
  - Drastic 3D Key scale reduction to 0.70 (was 0.93 -> 0.84 -> 0.70).
  - Added console log debug: "Ampere3DKey: Applied scale 0.70".

## v1.703 - 2026-01-17
- **UI Update**:
  - Reduced 3D Key scale by an additional 10% (0.93 -> 0.84) to make the size change clearly visible.

## v1.702 - 2026-01-17
- **UI Update**:
  - Reverted canvas size changes.
  - Applied 7% scale reduction directly to the 3D Key mesh instead (`this.mesh.scale.set(0.93, 0.93, 0.93)`).

## v1.701 - 2026-01-17
- **UI Update**:
  - Reduced 3D Key element size by ~7% (Mobile: 280px -> 260px, Desktop: 500px -> 465px) for better visual balance.

## v1.700 - 2026-01-17
- **UI Update**:
  - Refined CTA section gradient to be more subtle (`from-indigo-500/5`) and spread out (`ellipse` instead of `circle`) for smoother edge fading.

## v1.699 - 2026-01-17
- **UI Update**:
  - Added a circular radial gradient (`from-indigo-500/10`) to the CTA section background to create a subtle glow effect behind the 3D Key.

## v1.698 - 2026-01-17
- **UI Update**:
  - Increased transparency of the "Dark Glass" effect on Hero Slides and Modal.
  - Adjusted gradient opacity from `/80-/90` to `/60-/70` for better visibility of background elements.

## v1.697 - 2026-01-17
- **UI Polish**:
  - Applied the new "Dark Glass" effect to Hero Slides 3 and 6.
  - Updated classes to `bg-gradient-to-br from-[#02040a]/80 to-[#05060e]/90`, `backdrop-blur-3xl`, and `backdrop-brightness-75`.
  - Preserved the original `dots-use-cases.png` background for these slides.

## v1.696 - 2026-01-17
- **UI Polish**:
  - Deepened the "Dark Glass" effect on the AI Hero Panel (Modal).
  - Used custom almost-black navy values (`#02040a` -> `#05060e`).
  - Added `backdrop-brightness-75` to tint the background content darkly.
  - Increased blur to `backdrop-blur-3xl`.

## v1.695 - 2026-01-17
- **UI Polish**:
  - Removed `dots-card.png` background pattern from AI Hero Panel (Modal).
  - Replaced background with a "Dark Navy" gradient mix (`bg-gradient-to-br from-slate-900/80 to-slate-950/90`) + `backdrop-blur-2xl`.

## v1.694 - 2026-01-17
- **UI Polish**:
  - Changed AI Hero Panel background to `background-size: cover` and `no-repeat`.
  - Fixes the visible tiling seams caused by `dots-card.png` not being a seamless pattern.

## v1.693 - 2026-01-17
- **UI Polish**:
  - Adjusted background size of `dots-card.png` in AI Hero Panel to `271px` to force denser repetition of the pattern.

## v1.692 - 2026-01-17
- **UI Polish**:
  - Changed AI Hero Panel (Modal) glass tint from black (`bg-black/40`) to Dark Navy (`bg-slate-900/60`).

## v1.691 - 2026-01-17
- **UI Polish**:
  - Updated AI Hero Panel (Modal) background texture to `dots-card.png`.

## v1.690 - 2026-01-17
- **UI Polish**:
  - Switched AI Hero Panel (Modal) glassmorphism to "Dark Glass" style.
  - Replaced `bg-white/10` with `bg-black/40` while retaining `backdrop-blur-2xl`.

## v1.689 - 2026-01-17
- **UI Polish**:
  - Updated AI Hero Panel (Modal) to use the same glassmorphism design as the hero slides.
  - Added `dots-use-cases.png` background, gradient overlay, and `backdrop-blur-2xl`.

## v1.688 - 2026-01-17
- **UI Polish**:
  - Adjusted top margin for AI Phone Answer chart title on desktop (`xl:mt-12`) to prevent it from hugging the top edge.

## v1.687 - 2026-01-17
- **UI Polish**:
  - Increased glassmorphism intensity on hero slides 3 and 6 (`bg-white/10` + `backdrop-blur-2xl`) for better visibility.

## v1.686 - 2026-01-17
- **UI Polish**:
  - Added glassmorphism effect to hero slides 3 and 6.
  - Applied `bg-white/5` and `backdrop-blur-md` for better visual depth.


## v1.573 - 2026-01-16
- **Mobile Layout Polish**:
- Implemented `mobile-card-gap` class to force 3rem spacing between cards on mobile.
- Reduced excessive padding/margin around the "Integrations" header on mobile using helper classes (`mobile-force-tight-spacing`, `mobile-force-no-margin`).
- Cleaned up manual inline styles from previous hotfix.

## v1.572 - 2026-01-16
- **Bug Fix**: Forced CSS Overrides for Mobile Layout
- Bypassed broken Tailwind `max-md:*` variants (caused by config conflict) by implementing explicit CSS media queries.
- Manually forced auto-height and relative positioning for card containers on mobile to resolve the "cut-off" issue.
- Hid navigation tabs using a dedicated `.mobile-force-hidden` class.

## v1.571 - 2026-01-16
- **Bug Fix**: Fixed SyntaxError in `index.html` caused by automated search/replace.
- Restored valid selector syntax for `querySelectorAll` which was accidentally broken during the previous update.

## v1.570 - 2026-01-16
- **Refactor**: Cleaned up Mobile Animation Logic
- Removed redundant mobile-only IntersectionObserver.
- Added `data-observer` to all tab cards to utilize the existing `global.js` animation system for mobile scrolling.

## v1.569 - 2026-01-16
- **Bug Fix**: Fixed Mobile Layout Clipping & Navigation
- Updated `scroll-flipper.js` to strictly remove forced height/position styles on mobile (<768px), allowing natural vertical stacking of cards.
- Added `!important` to `max-md:!hidden` on navigation tabs to override any persistent JS styles.
- Implemented Mobile-specific `IntersectionObserver` to trigger SMIL animations on scroll since default Desktop render loop is disabled.

## v1.568 - 2026-01-16
- **Improvement**: Scroll Flipper Last Card Exception
- Prevented the last card in the stack from having its content culled/hidden, as no card exists to cover it.

## v1.567 - 2026-01-16
- **Bug Fix**: Adjusted content culling threshold in `scroll-flipper.js`.
- Fixed an issue where content faded out too early. Changed overlap threshold to ensure content stays visible until fully covered by the next card.
- Hardened selector logic to prevent opacity issues.

## v1.565 - 2026-01-15
- **Scroll Flipper Optimization: Content Culling**
- Implemented content occlusion: The text/video content of cards that are stacked behind the active card now fades to `0` opacity.
- This preserves the "stack" visual (backgrounds visible) while removing expensive blur/text compositing from the GPU pipeline.

## v1.560 - 2026-01-15
- **Scroll Flipper Performance**
- Added `IntersectionObserver` sleep/wake logic. The render loop now completely stops (0 CPU) when the section is off-screen.
- Implemented "Mobile Guard" to completely disable scroll loop on mobile (<768px), fixing scrolling conflicts.
- Added dirty-checking for 3D transforms to eliminate Layout Thrashing when idle.

## v1.301 - 2026-01-12
- **Bug Fix**: Fixed SyntaxError in `tab-flipper.js` caused by deployment escape artifacts.
- Files were generated with invalid escape characters (backslashes) in template literals.

## v1.300 - 2026-01-12
- **Modular Tab Flipper**
- Refactored `tab-flipper.js` to remove hardcoded IDs and support generic `data-smil-container`.
- Added support for video playback and static images via attributes.
- Improved code maintainability and scalability for future card types.
## v1.260 - 2026-01-12
- **Stable Release**
- Unified all asset versions to v1.260.
- Fixed layout shift on tablet by replacing `overflow-hidden` with `overflow-x-clip`.
- Removed "issue tags" from CDN URLs for cleaner production deployment.

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
### v1.864
- **Critical Fix**: Reverted Tailwind CSS from v4 to v3.4.17 to resolve layout breakage in production.
- **Build**: Regenerated static CSS assets using stable v3 CLI.
- **Verification**: Confirmed standard utility classes and reset styles are present in output.

