# Changelog

## v1.905 - 2026-01-20
- **Visual Refinement (Visibility)**:
  - **Visible Circuit Grid**: Increased opacity of static traces (`0.3`) and brightened the color to a distinct dark bronze (`0x553311`) so the underlying "Motherboard Pattern" is clearly visible even when inert.
  - **Rectangular Packets**: Significantly elongated the electron meshes (`0.18` length) to create distinct "Long Rectangular" data packets instead of short pulses, matching visual reference.


## v1.904 - 2026-01-20
- **Visual Enhancement (Circuitry)**:
  - **Inert Traces**: Changed the static circuitry traces to be barely visible ("inert") dark lines (`opacity: 0.1`, `color: 0x2a1005`), so they only appear "active" when electrons travel over them.
  - **Beam Electrons**: Replaced digital "cube" electrons with elongated "Beam/Pulse" geometry that orients along the path tangent, simulating a streak of light moving through the traces.
  - **Density Boost**: Increased trace density significantly (Chips: 18->32, Traces: 3->6 per chip) to fill visual gaps and create a more continuous web.

## v1.903 - 2026-01-20
- **Visual Enhancement (Motherboard)**:
  - **Manhattan Traces**: Implemented a "Grid-Aligned" trace generation algorithm. Circuit paths now run parallel (North-South / East-West relative to the sphere's poles), creating a structured PCB look instead of random squiggles.
  - **Components (Chips)**: Added 18 random "Chip/CPU" meshes to the sphere surface using `BoxGeometry`, aligned to the surface normal, serving as hubs for the circuitry tracks.
  - **Digital Packets**: Changed electron particles from spheres to small cubes (`BoxGeometry`) to represent "Data Packets" flowing through the motherboard.

## v1.902.1 - 2026-01-20
- **Refinement**:
  - Implemented **Connected Circuit Chains** algorithm to ensure traces are visibly connected and uniform.
  - Fixed electron interaction reactivity bug.

## v1.902 - 2026-01-20
- **Visual Enhancement**:
  - **Connected Circuitry**: Replaced random segments with **Continuous Circuit Chains**. Generated 24 long winding paths (20 segments each) that form a cohesive "web" across the sphere surface to solve visual separation issues.
  - **Dark Orb**: Changed central sphere base to deep Dark Copper/Chocolate (`0x220e05`) for high contrast.
  - **Visible Traces**: Changed trace color to Bright Gold (`0xffaa44`) and optimized geometry for visibility.
  - **More Electrons**: Increased electron particle count (80 active particles) and size.
  - **Interaction Fix**: Fixed a bug where electron activity levels were not correctly linked to the scanner focus (added `sphereActiveFactor` calculation).

## v1.901 - 2026-01-20
- **Feature (Path Animation)**:
  - Replaced texture-based circuitry with **Geometric Paths** (`initCircuitryPaths`).
  - Added 60 randomized `QuadraticBezierCurve3` arcs along the sphere surface to represent copper traces.
  - Implemented an **Electron System**: Small glowing pulses that travel along these curves individually.
- **Interaction (Scanner)**:
  - When the user "scans" (rotates lattice in front of camera), the electron activity level increases, Spawning more pulses and increasing their speed.
  - Static traces rendered as faint etched lines (`LineBasicMaterial`) for structure.

## v1.900 - 2026-01-20
- **Visual Update**:
  - **Dynamic Electrification**: The central orb's circuitry now glows and flickers ("electrifies") only when an outer lattice node is highlighted.
  - **Wave Effect**: The circuitry texture flows vertically (`offset.y`) when active to simulate moving energy.
  - **Reduced Base**: The base glow of the circuitry has been reduced to near zero (0.1) and only ramps up to full intensity (~1.6) during interaction.

## v1.899 - 2026-01-20
- **Visual Update**:
  - **Procedural Texture**: Added `createCircuitryTexture()` to generate dynamic, glowing circuitry patterns.
  - **Material**: Applied Circuitry Texture to Central Orb as `emissiveMap` (for glow) and `bumpMap` (for relief).
  - **Colors**: Circuit patterns use warm amber/gold tones (`#ff9933` to `#ff5522`) set against the copper base.

## v1.898 - 2026-01-20
- **Visual Update**:
  - **Cohesion**: Unified Icosahedron wireframe (`0xb87333`) and Nodes (`0xb87333`) to match the Central Orb's copper material.
  - **Lighting**: Replaced complex 3-point setup with a **Single Diffused Spotlight** (`penumbra: 1.0`, `angle: 60deg`) to create soft, broad-spectrum illumination without sharp inputs.
  - **Glow**: Updated interaction glow texture to Amber/Copper gradient.

## v1.897 - 2026-01-20
- **Visual Update**:
  - **Icosahedron**: Adjusted Central Orb material to Real Copper (`0xb87333` base, `0x5a2010` glow).
  - **Correction**: Heavily reduced `emissiveIntensity` (3.0 -> 1.0) to prevent orange saturation and increased `metalness` (0.6) to capture the "browny red" metallic look defined by the user.

## v1.896 - 2026-01-20
- **Visual Update**:
  - **Icosahedron**: Changed Central Orb material from Blue to Golden Copper.
  - **Lighting**: Updated Rim and Fill lights to warm tones (`0xffccaa`, `0xaa5533`) to compliment the copper aesthetic.

## v1.895 - 2026-01-20
- **Visual Update**:
  - **Icosahedron**: Removed sharp specular reflections ("three points of light") from the central sphere.
  - **Material**: Switched to "Frosted Glass/Satin" look (`roughness: 0.4`, `clearcoatRoughness: 0.4`) and boosted `emissiveIntensity` to 3.0 for a pure glow.
  - **Lighting**: Heavily reduced directional/point light intensity to preventing glare, increased ambient light to maintain visibility.

## v1.894 - 2026-01-20
- **Visual Update**:
  - **Icosahedron**: Reduced Central Sphere radius by 25% (0.8 -> 0.6).
  - **Material**: Changed central sphere from dark metal to Blue Glass (`transmission: 0.9`, `color: 0x3b82f6`).
  - **Lighting**: Increased scene brightness with stronger Camera Light (Intensity 4) and added new Fill Light and Rim Light for better glass definition.

## v1.893 - 2026-01-20
- **Fix**:
  - **Icosahedron Experiment**: Configured `importmap` in `Icosahedron.html` to correctly resolve `three` and `three/addons/` module paths.
  - **Refactor**: Updated `icosahedron-scene.js` to use mapped imports for OrbitControls stability.

## v1.892 - 2026-01-20
- **Feature**:
  - **3D Playground**: Added `Icosahedron.html` featuring a 3GS (Three.js) wireframe implementation of an Icosahedron (12 vertices, 20 faces).
  - **Component**: created `assets/js/icosahedron-scene.js`.

## v1.891 - 2026-01-20
- **Fix**:
  - **Logo SVG**: Corrected the "i" dot in the "Ampere.ai" wordmark to use the correct dark color (`cls-4`) instead of blue (`cls-3`). This restores the correct visual identity for the logo "eye".

## v1.890 - 2026-01-19
- **Build System**:
  - **Smart Dependency Linking**: Updated `publish.sh` to automatically force updates of parent "loader" scripts (e.g., `global.js`) when their child dependencies (e.g., `ampere-3d-key.js`) are modified.
  - **Benefit**: Prevents version skew where a cached parent script tries to load a non-existent older version of a child script.

## v1.889 - 2026-01-19
- **Fix**:
  - **Version Alignment**: Force updated `global.js` reference in `index.html` to `v1.888` to ensure correct loading of the updated `ampere-3d-key.js` component.
  - **3D Key**: Resolved potential version mismatch causing the 3D key to fail to load.

## v1.888 - 2026-01-19
- **Refactor**:
  - **HTML Structure Audit**: Removed redundant container wrappers from `index.html`.
    - *Action*: Deleted `#wrapper` div which contained the gradient blur effect but served no structural purpose.
    - *Action*: Verified and preserved `.gradient-blur` layer stack (6 levels) for visual fidelity.
    - *Benefit*: Simplified DOM hierarchy without visual regression.

## v1.887 - 2026-01-19
- **Performance**:
  - **Iconify Optimization**: Deferred loading of the Iconify library to unblock main thread rendering.

## v1.886 - 2026-01-19
- **Refactor**:
  - **Three.js Cleanup**: Optimized modular imports for 3D components.

## v1.885 - 2026-01-19
- **Refactor**:
  - **GSAP Removal**: Removed GSAP dependency in favor of native CSS/JS animations for reduced bundle size.

## v1.883 - 2026-01-19
- **Refactor**:
  - **Observer Consolidation**: Merged multiple duplicate IntersectionObserver instances into a unified handler in `global.js`.

## v1.882 - 2026-01-19
- **Refactor**:
  - **Chart.js Cleanup**: Consolidated all inline Chart.js initialization logic into a single external file.
    - *Action*: Extracted 3 inline scripts (Fixed Chart, 3D Chart, Aura Chart) from `index.html`.
    - *Action*: Created `deploy/assets/js/chart-init.js` to manage all chart instances.
    - *Benefit*: Significantly reduced `index.html` complexity (~200 lines removed) and standardized chart initialization.

## v1.881 - 2026-01-19
- **Refactor**:
  - **Inline CSS Migration**: Moved `#amp-hero-slider` styles from `index.html` to `components.css`.
    - *Action*: Removed inline `<style>` block and appended rules to external stylesheet.
    - *Benefit*: Improved separation of concerns and reduced `index.html` file size.

## v1.880 - 2026-01-19
- **Refactor**:
  - **Logo Performance**: Reverted to inline SVG injection for the logo to eliminate visual flash/delay.
    - *Action*: Moved SVGs back into `index.html` from `logo-loader.js`.
    - *Reason*: The deferred loading of the logo script caused the "tail end" of the logo to flash in after the layout was established.
    - *Note*: Container sizing fixes from v1.879 are preserved in `components.css`.

## v1.879 - 2026-01-19
- **Fix**:
  - **Logo Layout Shift (CLS)**: Forced explicit width for `#amp-logo-container` in `components.css`.
    - *Action*: Added hardcoded `width`/`min-width` rules (220px desktop, 300px large) to CSS.
    - *Reason*: Tailwind arbitrary value classes were not generating reliably in the build.
  - **Animation Glitch**: Removed `transform-gpu` from main navigation.
    - *Reason*: Reduce layer composition repaints during load.

## v1.878 - 2026-01-19
- **Hotfix**:
  - **Logo Layout Shift**: Applied strict width/height constraints to `#amp-logo-container` in `index.html`.
    - *Action*: Replaced `class="contents"` with explicit responsive sizing (e.g., `md:w-[220px]`).
    - *Benefit*: Reserves screen space for the logo immediately, preventing navigation elements from sliding/jumping once the JS injects the SVG.

## v1.877 - 2026-01-19
- **Refactor**:
  - **Logo SVG Optimization**: Extracted extensive inline SVG markup from `index.html` into a new dedicated loader (`logo-loader.js`).
    - *Action*: Replaced raw SVG block with a container div and an injected script.
    - *Benefit*: Cleaner HTML structure and decoupled logo logic (handling mobile/desktop variants dynamically).
- **Build System**:
  - **Asset Workflow**: Updated `publish.sh` to automatically convert local `assets/` references to CDN links for production.
  - **Exclusion Policy**: Added support for excluded local assets (e.g., `logo-loader.js`) to remain served via Cloudflare Workers for performance/compatibility.

## v1.876 - 2026-01-19
- **Hotfix**:
  - **Mobile Menu**: Restored inline critical styles for `.amp-hamburger` to resolve visibility/interaction regression on mobile devices.
    - *Action*: Re-injected specific CSS for hamburger toggle button back into `index.html`.
    - *Note*: Tailwind build latency or specificity issues were likely causing the menu button to disappear.

## v1.875 - 2026-01-19
- **Code Optimization**:
  - **Inline CSS Migration**: Moved ~300 lines of inline styles from `index.html` (after `<head>`) to `input.css`.
    - *Scope*: Migrated `body`, utility overrides, hamburger menu, card stack logic, and animation keyframes.
    - *Benefit*: Centralized style definitions and significantly reduced HTML payload size.

## v1.874 - 2026-01-19
- **Code Optimization**:
  - **Gradient Blur Refactor**: Migrated large `.gradient-blur` inline style block to `input.css`.
    - *Action*: Moved ~80 lines of CSS controlling the progressive top-blur effect into the main component layer.
    - *Benefit*: Improved `index.html` readability and maintainability by removing extensive inline visual definitions.

## v1.873 - 2026-01-19
- **Code Optimization**:
  - **Styles Refactor**: Eliminated heavy inline styles for background grids and complex shadows.
    - *Action*: Introduced `.bg-grid-blue-fade` and `.shadow-card-cyan` utilities in `input.css`.
    - *Benefit*: Cleaner HTML markup and consistent reuse of design tokens.

## v1.872 - 2026-01-19
- **Bug Fix**:
  - **Script Redundancy**: Removed duplicate script inclusions in `index.html` (Modal, Global, etc.) that were causing undefined behavior and redeclaration errors.
  - **Modal Safety**: Wrapped `modal.js` in an IIFE to scope `initModal` locally, preventing potential future namespace collisions.

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


## v1.877
- **CSS Architecture**: Extracted non-standard/dependent styles (Hamburger, Nav Transitions, Animations) from `index.html` into a dedicated `assets/css/components.css` file.
- **Cleanup**: Removed inline `<style>` blocks from `index.html` to improve markup cleanliness and maintainability.
- **Fix**: Persisted critical mobile menu and reduced motion styles that were risked by Tailwind purging.

- **Dead Code Removal**: Removed unused `.font-oswald` class from `components.css`.
- **Logo Optimization**: Moved inline SVG styles (`.cls-1`, etc.) to `components.css`, cleaning up `index.html`.
- **Safety**: Created backup `backups/index.html.backup.20260119.pre_logo_refactor` completely intact.
## v1.883 - 2026-01-19
- **Refactor**:
  - **Global Animation Trigger**: Moved inline IntersectionObserver logic from `index.html` to `global.js`.
    - *Action*: Centralized the "animate-on-scroll" play-state management.
  - **CSS Optimization**: Moved animation pause/running styles to `components.css`.
    - *Benefit*: Eliminates JavaScript-based style injection and potential FOUC.
## v1.884 - 2026-01-19
- **Refactor**:
  - **Global Observer Consolidation**: Removed the redundant "animate-on-scroll" observer added in v1.883.
    - *Action*: Updated `components.css` to listen for the `.in-view` class (standard) instead of `.animate`.
    - *Action*: Deleted the duplicated observer logic from `global.js`.
    - *Result*: The site now uses the single, existing `window.globalObserver` to trigger all scroll animations.
## v1.885 - 2026-01-19
- **Cleanup**:
  - **Removed Unused Dependencies**: Removed `GSAP`/`ScrollTrigger` from `index.html`.
    - *Reason*: No longer used in the codebase; replaced by custom JS and CSS animations.
    - *Benefit*: Reduced page load weight by ~60KB.
## v1.886 - 2026-01-19
- **Refactor**:
  - **Three.js Import Cleanup**: Removed the `importmap` from `index.html`.
    - *Action*: Updated `ampere-3d-key.js` to use a direct CDN URL for Three.js.
    - *Benefit*: Cleared `<head>` of config scripts; Three.js remains fully lazy-loaded via dynamic import in `global.js`.
## v1.887 - 2026-01-19
- **Performance**:
  - **Defer Iconify**: Added `defer` attribute to `iconify-icon.min.js`.
    - *Action*: Unblocks the HTML parser during initial page load.
    - *Result*: Faster First Contentful Paint (FCP) as icon upgrades happen asynchronously.
