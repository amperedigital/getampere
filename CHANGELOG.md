## [v2.198] - 2026-01-23
- **Tech Demo**:
  - **Interaction Fix (Critical)**: Updated `tech-demo-scene.js` to correctly locate the SVG overlay. Since the SVG is a sibling of the scene container, the selector was changed from `container.querySelector` to `container.parentElement.querySelector`. This restores drag and scroll events.
  - **Visual Polish**: Removed all background, border, and shadow styles from the Left Column and Scene Container. The ring now floats freely without any "boxing" artifacts, blending seamlessly with the dark background.

## [v2.197] - 2026-01-23
- **Tech Demo**:
  - **Interaction Fix**: Enabled pointer events on the SVG Overlay to allow `HaloRotator` to receive drag/scroll inputs. It was previously blocked by a parent layer.
  - **Visual Cleanup**: Removed the `bg-slate-900/20` background from the main scene container, eliminating the visible "square box" artifact behind the ring.

## [v2.196] - 2026-01-23
- **Tech Demo**:
  - **Interaction Engine**: Implemented `HaloRotator` class (`assets/js/halo-rotator.js`) to handle physics-based rotation.
    - **Mechanics**: Supports Mouse Drag (Y-axis) and Scroll Wheel to rotate the ring.
    - **Snapping**: Automatically snaps to 30-degree increments (aligning with 12 slots) using a spring physics loop.
    - **Illumination**: Active slots at 12 o'clock and 6 o'clock are dynamically illuminated (Green/Emerald).
    - **Integration**: Mapped SVG elements to 0-11 indices for precise state tracking.

## [v2.195] - 2026-01-23
- **Tech Demo**:
    - **Refinement**: Uniformly reduced the Halo Ring width from 80px to 60px (`r=270` to `r=330`).
    - **Symmetry**: This creates equal 20px padding for both the text labels (at `r=290`) and the marker dots (at `cx=310`) relative to the ring's edges.

## v2.194
- **Tech Demo**:
    - **Fine Tuning**: Moved rotary markers (dots) inwards to `cx=310`.
    - **Alignment**: Reduced gap between markers and text labels (`r=290`) to 20px, creating a tighter visual grouping within the halo band.

## v2.193
- **Tech Demo**:
    - **Refined Halo Layout**: Adjusted detailed positioning for Rotary Interaction.
        - **Markers**: Repositioned dots to `cx=330` (Outer Edge of Halo) to align visually with external selection needles while remaining strictly inside the blue ring.
        - **Text**: Moved text tracks to `r=290` (Inner Track) to provide visual clearance from markers.
        - **Clearance**: Established 40px radial separation between interactive dots and text labels.

## v2.192
- **Tech Demo**:
    - **Visual Alignment**: Relocated the 12 rotary markers (dots) back to the outer perimeter (`r=350`) to align precisely with the static Selection Needles (`r=365`) and the Outer Dashed Ring (`r=360`).
    - **Structure**: The dots remain grouped within the `#halo-rotary-dial` to rotate with the text, while the Needles remain static.

## v2.191
- **Tech Demo**:
    - **Visual Structure**: Restructured the SVG Overlay for rotary interaction.
        - Created a dedicated `#halo-rotary-dial` group to house all dynamic elements (Ring Band, Dots, Text).
        - Separated static elements (Outer Dashed Ring, Selection Needles) into the fixed parent layer.
    - **Dimensions**: Widened the Blue Halo inwards to `r=260` (Inner Edge) to accommodate the markers, while maintaining the `r=340` Outer Edge.
    - **Alignment**: Moved all 12 markers (dots) from the outer perimeter (`r=350`) to the new inner track (`r=280`) inside the widened halo.

## v2.190
- **Tech Demo**:
    - **Interface**: Added static "Selection Needle" markers (Triangular Brackets) at 12 o'clock and 6 o'clock positions in the SVG overlay.
    - **Visuals**: Markers are placed at `r=375` (approx) pointing inward to the ring, designated as the active selection zones for the upcoming rotary dial interaction.

## v2.189
- **Tech Demo**:
    - **Stability**: Fixed a critical bug in the "Auto-Recenter" logic where the camera would forcefully zoom into `z=5` (instead of the configured `z=6.4`) after interaction timeout or initialization, causing the model to "fill the ring" unexpectedly.
    - **Logic**: Ensured `autoRecenter` uses the configured `cameraDistance` or the captured initial position.
    - **Resize**: Restored responsive camera zoom logic with proper configuration safety.

## v2.188
- **Tech Demo**:
    - **Alignment**: Fixed misalignment of 9 o'clock ("Diagnostics") and 3 o'clock ("Neural Config") labels by implementing an extended 240-degree SVG path to prevent clipping and anchor offset issues.
    - **Stability**: Disabled auto-zoom reset on window resize to preserve the camera state during Power Down/Standby transitions so the model remains "contained".
    - **Branding**: Updated main heading to "AI Neural Architecture" with emphasis styling.

## v2.187
- **Tech Demo**:
    - **Alignment**: Modified SVG text paths to `r=320` to match the Halo graphic exactly.
    - **Typography**: Adjusted vertical `dy=2` offset to center text labels within the ring band.
    - **Visuals**: Ensured concentric alignment with outer Dot markers (r=350).

## v2.186
- **Tech Demo**:
    - **Typography Engine**: Replaced static rotated labels with SVG `<textPath>` elements to achieve true curvature ("Smile" / "Frown" orientation) conforming to the ring radius.
    - **Readability**: Implemented a dual-path system (Clockwise Upper, Counter-Clockwise Lower) to ensure all text is readable upright ("Feet Out/Down" for bottom hemisphere, "Feet In/Down" for upper).
    - **Scaling**: Optimized `data-camera-distance` to `6.4` per user request for precise ring padding.

## v2.185
- **Tech Demo**:
    - **Visualization**: Increased `data-camera-distance` substantially to `6.8` (from `5.2`) to create proper separation between the Neural Sphere and the Ring (avoiding the "tight fit" look).
    - **Typography**: Inverted the "Concave" text rotation for all labels (from `rotate(90)` to `rotate(-90)`). This ensures "System Logs" (bottom) is readable upright while maintaining the tangential orientation.

## v2.184
- **Tech Demo**:
    - **Initialization**: Fixed a layout bug where the 3D scene would load slightly off-center and only correct itself after a window resize.
    - **Padding**: Tuned `data-camera-distance` to `5.2` (from `6.0`) to achieve the requested ~3rem internal padding between the Neural Net and the Ring.

## v2.183
- **Tech Demo**:
    - **Stability**: Fixed a JavaScript crash (`Uncaught TypeError: reading 'target'`) caused by uninitialized controls in the auto-recenter logic.
    - **Visualization**: Optimized the Neural Net sizing. Reduced `data-camera-distance` to 6.0 to improve fill factor within the ring.

## v2.180
- **Tech Demo**:
    - **Layout**: Fundamental restructuring. The 3D Scene Container is now nested *inside* the same layout bounds as the Ring (Master Container: 800x800 aspect square).
    - **Centering**: Removed all `setViewOffset` logic from the 3D engine (previously used to offset the subject). The scene is now mathematically centered to the ring by default.
    - **Architecture**: Implements the "Container inside a Ring" requirement strictly.

## v2.181
- **Tech Demo**:
    - **Architecture**: Nested the 3D Scene container *inside* the Ring overlay container to guarantee strict parent-child centering.
    - **Layout**: Scene now fits strictly within the ring bounds (`inset-10` clearance).
    - **Markup**: Fixed potential unclosed tags and misaligned layers from previous iterations.

## v2.179
- **Tech Demo**:
    - **Layout**: Introduced a strict Flexbox centering wrapper to ensure absolute alignment of the 3D Scene and SVG Ring.
    - **Typography**: Inverted text rotation to align with the "inner angle" perspective.
    - **UX**: "System Logs" (6 o'clock) remains the green active marker.

## v2.178
- **Tech Demo**:
    - **Visualization**: Added all 12 clock positions to the ring HUD with new metric titles.
    - **Active State**: The 6 o'clock marker ("System Logs") is now illuminated in Green to signify activation.
    - **Alignment**: Markers persist at `r=350`, with text maintained in tangential orientation for rotation readability.

## v2.177
- **Tech Demo**:
    - **Visualization**: Refined the ring overlay to use tangential text rotation. Titles now wrap around the circle face.
    - **Layout**: Markers moved to `r=350` (outside the main band, inside the border).
    - **Typography**: Text is now oriented "Feet Inward" (rotates with the ring relative to center), improving readability at the 6 o'clock activation point.

## v2.176
- **Tech Demo**:
    - **Visualization**: Reduced size of the neural network 3D object to create more negative space between it and the ring.
    - **HUD**: Updated ring markers to 8 positions (12, 2, 3, 5, 6, 7, 8, 9) with new titles ("Encryption", "Throughput", "Integrity").
    - **Layout**: Moved marker dots to the inner edge of the ring (`r=290`) to avoid conflict with the border line.

## v2.175
- **Tech Demo**: Added new HUD metrics at clock positions 4 and 5 ("Encryption", "Latency") to the SVG ring overlay.

## v2.174
- **Critical Control Fix**:
  - **Null Safety**: Wrapped `this.controls.update()` in a conditional check within the main render loop. This prevents the "Cannot read properties of undefined" error caused by disabling `OrbitControls` in the previous version.

## v2.173
- **Tech Demo Cleanup**:
  - **Controls Disabled**: Removed `OrbitControls` (Zoom/Pan/Rotate) from `tech-demo-scene.js`. The 3D view is now locked to a standard perspective, eliminating alignment issues between the 2D overlay and the 3D object.
  - **Ring Refinement**: 
    - **Visual Weight**: Increased the ring band width to 40px (stroke-width) with low opacity, creating a distinct "track" rather than a thin line.
    - **Text Placement**: Positioned label text radially inward (x=-15 relative to marker) to sit perfectly centered on the new 40px band width.
    - **Layout Capability**: Prepared the SVG structure to easily accept new cardinal placeholders (9, 3, 4, 5) as requested in future updates.

## v2.172
- **Ring System Refactor**:
  - **Revert to SVG**: Replaced the 3D-integrated ring with a pure HTML/SVG overlay to resolve visual artifacting and clipping issues ("the mess"). 
  - **Design Polish**:
    - **Centering**: The SVG is now perfectly centered in the scene container using `flex items-center justify-center`.
    - **Layout**: Implemented the "Dot on Ring, Text Inward" logic. The text labels (DATA SOURCES, SYSTEM LOGS, etc.) are positioned structurally inside the ring radius relative to their markers.
    - **Stability**: Since zoom-sync is no longer a requirement, the 2D overlay provides sharper text rendering and consistent layout regardless of camera angle.
  - **Code Cleanup**: Removed all 3D ring generation code from `tech-demo-scene.js` to keep the logic clean.

## v2.171
- **Codebase Isolation**:
  - **Forked Architecture**: Created `tech-demo-scene.js` as a dedicated branch of the visualizer logic specifically for the new Tech Demo layout. This successfully decouples the new 3D Ring features from the legacy `icosahedron.html` page, ensuring the original implementation remains untouched and production-stable.
  - **Tech Demo Updates**:
    - Updated `tech-demo.html` to dynamically import `TechDemoScene` from the new file.
    - Re-applied the **3D Tech Ring** (Markers + Inward Labels) to the branched file.

## v2.170
- **Release Retry**:
  - Re-attempting deployment of v2.169 features (3D Ring) after Cloudflare API timeout.
  
## v2.169
- **3D HUD Integration**:
  - **Ring System Migration**: Moved the "Tech Ring" overlay from a 2D SVG into the 3D scene (Three.js). This ensures the ring zooms, tilts, and scales in perfext synchronization with the neural net.
  - **Architecture**: The Ring is now a child of the `rotation` group, inheriting the 20-degree tilt of the Icosahedron, creating a true equatorial frame.
  - **Components**:
    - **Outer Dashed Ring**: `THREE.LineDashedMaterial` loop.
    - **Inner HUD Line**: `THREE.LineLoop` (Blue-500).
    - **Faint Band**: Double-sided `Mesh` with low alpha for depth.
    - **High-Fidelity Labels**: Implemented a `CanvasTexture` generator to render crisp "DATA SOURCES", "NEURAL CONFIG", etc. as 3D Planes placed radially inward from the cardinal markers.

## v2.168
- **Critical Visibility Fix**:
  - **CSS Conflict Resolution**: Removed the generic `relative` class from the scene container which was overriding `absolute inset-0`, causing the container to collapse to 0 height.
  - **Initialization Stability**: Added a 50ms `setTimeout` delay to the 3D scene initialization to ensure the DOM layout engine has fully computed the container dimensions before the WebGL renderer attaches.

## v2.167
- **Scene Recovery**:
  - **Layout Fix**: Replaced `w-full h-full relative` with `absolute inset-0` for the `#tech-demo-scene` container.
  - **Reasoning**: The flex/relative behavior of the parent container was causing the canvas to collapse to 0 height. `absolute inset-0` forces it to fill the rounded frame regardless of the content flow.

## v2.166
- **Architecture Stability**:
  - **Isolation**: Confirmed that `tech-demo.html` structures are fully isolated from the legacy `icosahedron.html` file. Each uses separate layout containers.
  - **Visibility Fix**: Adjusted the SVG overlay in the Tech Demo to ensuring it does not occlude the 3D scene. added `fill="none"` explicit definitions and verified z-indexing.

## v2.165
- **UI Architecture**:
  - **Outer Ring Control**: Implemented a flat SVG-based HUD overlay surrounding the 3D neural net.
  - **Dial Visualization**: Added a concentric ring system with tech-styled dashed borders and 4 cardinal labels ("DATA SOURCES", "NEURAL CONFIG", "SYSTEM LOGS", "DIAGNOSTICS").
  - **Layering**: Configured the ring as a `pointer-events-none` overlay (Z-10) to ensure the 3D scene below remains fully interactive.
  - **Animation**: Applied a slow linear rotation (`animate-spin-slow`) to simulate an active system scan.

## v2.164
- **Card Styling**:
  - **Centered Content**: Upgraded all grid cards to `border-2` (2px width) and strictly centered their content containers using `flex flex-col items-center justify-center`.
  - **Stats Card**: Refactored the first stats card to center its inner grid (`max-w-[200px]`) and maintain standard card padding/borders consistent with the placeholder cards.

## v2.163
- **Layout Precision**:
  - **Gap Consistency**: Reduced the central gutter between the 3D scene and the grid to **2rem** (from 3rem) to match the internal grid spacing.
  - **Grid Spacing**: Increased the internal grid gap from `gap-3` (0.75rem) to `gap-8` (**2rem**), creating a uniform rhythmic spacing across the entire right pane and the center division.

## v2.162
- **Layout Precision**:
  - **Symmetrical Grids**: Adjusted desktop layout to ensure perfect symmetry between the Left (3D) and Right (Grid) columns.
    - **Height Matching**: Both containers now use identical vertical insets (Top/Bottom 3rem), ensuring the 3D viewport and the Controls Grid are exactly the same height.
    - **Center Gap**: Set internal margins to `1.5rem` from the center line on both sides, creating a uniform `3rem` gutter that matches the outer screen margins.

## v2.161
- **Layout Overhaul**:
  - **Right Column Grid**: Converted the interactive panel into a 6-box grid (2 cols x 3 rows).
  - **Border Removal**: Removed the vertical division border between the 3D scene and the control panel to create a seamless aesthetic.
  - **Adaptive Grid**: Implemented responsive behavior where the grid stacks vertically on mobile (`min-h-[600px]`) and fills the viewport on desktop.
  - **Placeholder Slots**: Added 5 placeholder cards for future interactive modules (Connect, Source, Config, Logs, More).

## v2.160
- **UI Tweaks**:
  - **Breadcrumb Spacing**: Reduced horizontal gap between breadcrumb elements (`gap-3` → `gap-2`) to tighten the layout. The previous spacing left the separators floating too far from the text labels.

## v2.159
- **UI Refinement**:
  - **Breadcrumb Visibility**: Changed the breadcrumb slash separators (`/`) from Slate-700 to **Blue-400** to match the "V-Amp 2.0" label and improve visibility against the dark background.

## v2.158
- **UI Refinement**:
  - **Breadcrumb Formatting**: Added a leading slash to the breadcrumb navigation (`/ Visualization / V-Amp 2.0`) as per user request.

## v2.157
- **Deployment Sync**: Forced redeploy to ensure breadcrumb visualization (`Visualization / V-Amp 2.0`) is propagated to all edges.
- **Reference**: Confirmed single slash separator `/` preference for breadcrumb standard.

## v2.156
- **UI Polish**:
  - **Breadcrumb Added**: Replaced the "Interactive Visualization" footer text with a structure breadcrumb in the header (`Visualization / V-Amp 2.0`).
  - **Versioning**: Updated version label to "V-Amp 2.0" (Blue/Glow) to match the new branding.
  - **Cleanup**: Removed the old centered footer label from the desktop view.

## v2.155
- **Layout Precision**:
  - **Desktop Pill Horizontal Alignment**: Increased right margin to `lg:right-20` (was `lg:right-12`) to ensure the pill is visually "inset" from the container edge, rather than flush with it.
  - Maintains the `lg:top-12 -translate-y-1/2` vertical straddle alignment.

## v2.154
- **Precision Layout**:
  - **Pill Alignment (Desktop)**: Moved "Live Demo" pill specific to desktop to strictly straddle the container border.
    - Updated position to `lg:top-12` (matching container's `lg:inset-12`).
    - Added `lg:-translate-y-1/2` to vertically center the pill (and its dot) exactly on the border line.

## v2.153
- **Responsive Design Fixes**:
  - **Desktop 3D Scaling**: Reduced base `data-camera-distance` to `6.0` (was 9.5) to "maximize" the neural net size on desktop (closer camera).
  - **Mobile 3D Scaling**: Updated `icosahedron-scene.js` with a higher zoom multiplier (1.6x) for mobile to compensate for the closer base distance (Net effective distance: 9.6).
  - **Desktop Pill Alignment**: Adjusted "Live Demo" pill desktop position to `lg:right-12` (was `lg:right-20`) to perfectly align with the content container's `lg:inset-12` right edge.
  - **Responsive Logic**: Added `camera.position.z` recalculation to `onWindowResize` event to handle live resizing correctly.

## v2.152
- **Typography Fix**: Removed `text-transform: uppercase` from the standby warning CSS inject.
  - Ensures the unit "s" (seconds) appears as lowercase (e.g., "STANDBY IN 30s") instead of "30S".

## v2.151
- **Mobile Layout Polish**:
  - Restored internal text padding to `p-8` (was reduced to `p-4` in v2.150) to fix "jammed text" issue while keeping the 1rem outer container margin.
  - Ensures text has "room to breathe" (approx 1rem visual padding inside the scene border).
  - Maintained skinnier "Live Demo" pill (`py-2`).

## v2.150
- **Mobile Layout Optimization**:
  - Reduced horizontal container padding to `1rem` (was `2rem`) to maximize screen real estate (`left-4`, `right-4`, `p-4`).
  - Refined "Live Demo" pill padding to be skinnier (`px-4 py-2`).
- **Design Principles**: Applied "Maximize Utility" rule for mobile contexts.

## v2.149
- **Responsive Design**: Mobile layout optimization.
  - **Copy**: Removed hyphen from "decision making" in the tech demo blurb.
  - **UI**: Hidden "Interactive Visualization" label on mobile (`hidden lg:block`) to conserve vertical space and reduce visual clutter for future content additions.

## v2.148
- **Mobile Responsiveness**: Implemented dynamic camera zoom logic in `icosahedron-scene.js`.
  - Automatically multiplies `cameraDistance` by 1.5x on mobile devices (`width <= 600px`).
  - Ensures the neural network sphere is fully contained within the padded area, preventing overlap with UI elements.

## v2.147
- **Responsive Design**: Continued refinement of `tech-demo.html` based on design directives.
  - **Vertical Canvas**: Increased mobile scene height to `h-[80vh]` for maximum screen real estate.
  - **Bezel Layout**: Adjusted mobile container inset (`bottom-24`) to create a black "bezel" area at the bottom.
  - **Typography**: Moved "Interactive Visualization" text to `bottom-10`, placing it cleanly in the bezel area, outside the rounded scene container (no overlap).
  - **Neural Net Spacing**: Increased `data-camera-distance` to `9.5` to provide substantial lateral breathing room for the sphere.
  - **Controls**: Pushed "Standby/Power" buttons down (`bottom: 40px`) via injected CSS update in `icosahedron-scene.js`.

## v2.146
- **Responsive Design**: Major responsiveness overhaul for Mobile First ("Breathing Room").
  - **Left Column**: Increased height to `h-[65vh]` (from `50vh`) to provide more vertical canvas.
  - **Insets**: Doubled mobile container inset to `inset-8` (32px) for maximum breathing room.
  - **Typography**: Increased padding `p-10 pt-20` to push content well inside the frame. Restored `text-4xl` as spacing now permits.
  - **Pill**: Repositioned to `top-2 right-10` to correctly straddle the new 32px border margin.

## v2.145
- **Responsive Design**: Optimized `tech-demo.html` for mobile devices.
  - Adjusted title sizing (`text-3xl`) and padding (`p-6`) to prevent overlap on small screens.
  - Relocated "Live Demo" pill (`right-6`) on mobile to improve spacing and prevent edge crowding.

## v2.144
- **UI Consistency**: Updated both "Live Demo" (`tech-demo.html`) and "System Operational" (`index.html`) pills to use `rounded-full` (standard pill radius) instead of `rounded-xl`, maintaining `p-4` spacing.

## v2.143
- **Tech Demo Layout**: Adjusted "Live Demo" pill right alignment (`lg:right-20`, `right-12`) to align with flattened border sections, avoiding corner radius curvature.

## v2.142
- **Tech Demo Layout**: 
  - Updated "Live Demo" pill styling to match site-wide "System Operational" badge (Rounded-XL, P-4, Tracking-Widest).
  - Adjusted vertical positioning (`lg:top-6`, `-top-2`) to perfectly straddle the visualization container border.

## v2.141
- **Tech Demo Layout**: Fine-tuned "Live Demo" pill alignment (`top-8` desktop, `top-1` mobile) to precisely bisect the visualization container border.

## v2.140
- **Tech Demo Layout**: Adjusted "Live Demo" pill vertical alignment (`top-10`) to correctly straddle the container border for a connected "tab" aesthetic.

## v2.139
- **Tech Demo Layout**: Adjusted "Live Demo" pill position to sit on the container border ("tab" style) for better visual integration.

## v2.138
- **Layout**: Refined `tech-demo.html` header layout.
  - Increased header padding to `p-20` on desktop to give typography more breathing room from the edge.
  - Moved the "LIVE DEMO" status pill to the top-right corner of the left visualization column, creating a balanced split header.

## v2.137
- **Scene**: Implemented `data-camera-distance` attribute to control the initial zoom level of the Icosahedron scene.
- **Visuals**: Adjusted the neural network scale in `tech-demo.html` (Camera Z: 5.0 -> 7.5) to provide significant breathing room within its container.

## v2.136
- **Layout**: Major redesign of `tech-demo.html`.
  - Moved title section to the left column, overlaying the 3D scene in the top-left corner.
  - Added padding (`inset-12` on desktop) to the 3D scene container to provide "breathing room" and a framed aesthetic.
  - Reserved the right column for future interactive control panel elements.

## v2.135
- **UI**: Added version branding ("V - AMP 2.0") to the "AI ONLINE" status text in the 3D scene animation.
- **Cache**: Bumped script version references in `tech-demo.html` and `icosahedron.html` to force asset reload.

## v2.134
- **Branding**: Updated website title from "Ampere AI" to "Get Ampere AI" across all accessible pages (`index.html`, `tech-demo.html`, `icosahedron.html`, `3d_key_demo.html`) including page titles, SVG titles, and ARIA labels.

## v2.133
- **Assets**: Refreshed the actual favicon image files in `deploy/favicon/` with updated versions provided by the user.

## v2.132
- **Assets**: Updated favicon links across all deployment pages (`index.html`, `tech-demo.html`, `icosahedron.html`, etc.) to point to the new `/favicon/` directory structure, ensuring consistent icons across devices (SVG, PNG 96x96, Apple Touch Icon).

## v2.131
- **New Page**: Added `tech-demo.html`, a split-screen technical demonstration page showcasing the 3D Icosahedron scene alongside real-time metrics and a responsive Tailwind layout.

## v2.130
- **Configuration**: Explicitly added the new data attributes to the `icosahedron.html` and `icosahedron-blue-silver.html` markup so they are visible and editable.

## v2.129
- **Configuration**: Exposed key physics and timing variables via data attributes on the container element for easier tuning without code changes.
  - `data-standby-timeout`: Auto-standby delay (default 120s).
  - `data-standby-warning`: Countdown duration (default 30s).
  - `data-auto-recenter`: Camera reset delay (default 2.5s).
  - `data-lerp-speed`: Animation smoothing factor (default 0.015).
  - `data-min-velocity`: Snap-to-finish threshold (default 0.0025).
  - `data-rotation-rpm`: Rotation speed in Revs Per Second (default 0.17).

## v2.128
- **UI Text**: Updated the power-down status text from "POWER OFF XX%" to "POWER XX%" to be more semantically consistent with a draining percentage.

## v2.127
- **UI Mobile**: Fixed layout issue where the "AI ONLINE" status gauge and "Power Up" graphics were obscured by the control buttons. Moved the gauge position up (`bottom: 155px`) to ensure clear separation and visibility above the UI track.

## v2.126
- **Physics**: Implemented "Minimum Velocity" logic for system state transitions. The animation now switches from exponential easing to linear movement at the tail end, ensuring the "Power Up" sequence maintains momentum past 80% and hits 100% cleanly without stalling.
- **Physics**: Increased base animation transition speed (`lerpSpeed` 0.005 -> 0.015).

## v2.124
- **UI Status Gauge**: Implemented "Power Down" visualization. Gague now remains visible during shutdown, tracking power from 100% to 0% ("POWER OFF XX%").
- **Logic**: Decoupled gauge visibility from system state, allowing it to display during any intense activity (startup or shutdown).

## v2.123
- **Features**: Added "AI ONLINE" status gauge with 20-dot progress bar that ramps up with system power.
- **UI**: Display placed above buttons (Desktop) or slightly above track (Mobile) to avoid clutter.
- **Interaction**: Gauge automatically hides when the "STANDBY IN..." warning appears.

## v2.122
- **UI Standby**: Increased warning countdown duration from 15s to 30s to ensure user visibility before timeout.

## v2.121
- **UI Standby**: Moved Desktop Standby Warning above the control track (`bottom: 170px`) to prevent footer overlap and ensure visibility.
- **UI Standby**: Extended warning countdown to 15 seconds (from 10s) and optimized DOM updates to prevent flickering.

## v2.120
- **UI Standby**: Fixed Desktop visibility of the Standby Countdown warning by removing restrictive CSS opacity rule.
- **Physics**: Reduced rotation speed by an additional 15% for both inner sphere and outer shell (353 frames/rev).

## v2.119
- **Physics**: Reduced rotation speed by an additional 15% for both inner sphere and outer shell (353 frames/rev).

## v2.118
- **UI Colors**: Switched from RGB (Green/Red/Yellow) to Monotone (Cyan/Blue/Silver) to align with brand identity and remove "Christmas vibe".
- **Visuals**: Updated 3D Nodes to strictly emit Cyan/Blue hues (0.55-0.65 HSL) instead of random RGB colors.
- **Standby Warning**: Changed warning text color from Orange to Ice Blue/White.

## v2.117
- **Critical Fix**: Resolved syntax error ('Unexpected identifier') in `onPointerDown` caused by corrupted merge in v2.116.
- **UI Interaction**: Ensured label click logic is clean and duplication-free.

## v2.116
- **Physics**: Reversed Outer Sphere rotation direction and reduced speed to 30% of core speed.
- **Layout (Desktop)**: Applied vertical camera offset (8% height) to lift the object up, increasing visual gap between object and UI buttons.
- **UI Interaction**: Fixed "Jump Glitch" on button clicks by disabling drag logic when clicking directly on labels.
- **UI Standby**: Fixed Desktop Standby Warning visibility (CSS opacity logic corrected).

## v2.115
- **Physics**: Reduced rotation speed by an additional 10% (300 frames/rev).
- **Layout (Desktop)**: Lifted UI controls up by 25px (bottom: 110px) to provide more breathing room above instructions.
- **Layout (Desktop)**: Increased minimum zoom distance (2.0) to prevent the object from overlapping the UI when fully zoomed in.
- **Fix**: Corrected UI "slide" calculation to use dynamic container width, resolving button misalignment errors.

## v2.114
- **Physics**: Reduced rotation speed by an additional 10% to accommodate future voice interaction.

## v2.113
- **Physics**: Reduced maximum rotation speed by 50% for a smoother, more deliberate motion.

## v2.112
- **UI Colors**: Updated Control Bar themes to match state:
  - **Power Up**: Green (#00ff88) text and indicator.
  - **Power Down**: Red (#ff4444) text and indicator.
  - **Standby**: Yellow (#ffcc00) text and indicator.
- **UI**: Inactive states are now Light Gray.

## v2.111
- **UI**: Added "Digital Dot" indicators next to UI labels to improve visual balance.
- **UI**: Reduced Standby Warning to simple text (no pill background) and positioned it unobtrusively above instructions.
- **Fix**: Removed duplicate CSS definitions for standby warning.

## v2.110
- **UI Polish**: Switched UI label centering to Flexbox to fix slight horizontal misalignment on mobile.

## v2.109
- **Feature**: Increased Auto-Standby timer to 2 minutes (120s).
- **Feature**: Added visual "STANDBY IN Xs" countdown warning during the last 10 seconds of inactivity.
- **Fix**: Standby countdown is aborted immediately on user interaction or state change.

## v2.108
- **Fix**: UI button interactions now correctly reset the auto-standby timer (preventing immediate standby after Power Up).

## v2.107 - 2026-01-21
- **Mobile UI**:
  - **Restored Controls**: Re-enabled the "Standby | Power Up | Power Down" toggle switch on mobile devices.
  - **Choice Architecture**: Users can now choose to interact via the tactile UI buttons OR the invisible gesture controls (Single/Double Tap).
  - **Layout**: Positioned the controls (`bottom: 90px`) to float cleanly above the updated instruction text.

## v2.106 - 2026-01-21
- **Mobile Centering Fix**:
  - **View Offset**: Implemented `camera.setViewOffset()` on mobile devices to shift the viewport rendering downwards by 12%. This visually raises the 3D Orb towards the top of the screen (clearing the bottom area) **without** moving the camera pivot or rotation center.
  - **Result**: The object spins perfectly on its axis but sits comfortably high in the frame, maintaining the correct perspective.
- **Mobile UI**:
  - Hid the toggle buttons on mobile as requested (v2.105 logic confirmed).
  - Updated instructions to explain Tap gestures.

## v2.105 - 2026-01-21
- **Mobile UI Overhaul**:
  - **Removed Button UI**: Hidden the "Standby | Power Up | Power Down" toggle switch on mobile devices (<600px) to maximize screen real estate for the 3D model.
  - **Enhanced Instructions**: Updated the overlay text on mobile to explicitly explain the new gesture controls: `Single Tap: Power Up • Double Tap: Power Down`.
  - **Layout**: Adjusted mobile instruction font sizing and line-height to accommodate the multi-line explanation cleanly.

## v2.104 - 2026-01-21
- **Mobile Gestures & Power Management**:
  - **Tap Controls**: Implemented touch gestures for state control on mobile devices.
    - **Single Tap**: Power Up (`ACTIVE`). Debounced by 300ms.
    - **Double Tap**: Power Down (`OFF`).
  - **Auto-Standby**: Added an inactivity timer. If the system is in `ACTIVE` mode and no user interaction (touch/drag) is detected for 10 seconds, it automatically transitions to `STANDBY` (breathing mode).
  - **Interaction Wake**: Touching or dragging the model resets the inactivity timer, keeping the system active while being manipulated.

## v2.103 - 2026-01-21
- **Mobile Experience Corrective**:
  - **Fixed Stationary Position**: Removed the experimental "Vertical Offset" (-0.8Y) on mobile. While this was intended to clear the UI, it caused the object to "swing" during vertical rotation because the pivot point was offset from the object center. The object now rotates perfectly around its own axis (0,0,0) and stays visually stationary.
  - **Disabled Panning**: Explicitly set `controls.enablePan = false`. This prevents 2-finger drag or sloppy inputs from accidentally shifting the object off-screen.

## v2.102 - 2026-01-21
- **Mobile Experience Tune**:
  - **Disable Mobile Scroll Zoom**: Explicitly disabled the `wheel` event listener on mobile devices. This prevents browser momentum scrolling (or single-finger drag interactions mapped to scroll) from triggering the camera zoom.
  - **Strict Pinch Logic**: Hardened the pinch-to-zoom logic to strictly require exactly 2 touches, resetting immediately if the touch count changes, to prevent accidental zooms during rotation.

## v2.101 - 2026-01-21
- **Deep Mobile Optimization**:
  - **Dynamic Viewport Scaling**: Implemented intelligent aspect-ratio detection logic to dynamically adjust the camera distance (Z-axis). This ensures the subject maintains consistent "safe margins" horizontally, preventing side-clipping on narrow mobile screens (portrait mode) regardless of their resolution (e.g., iPhone Max).
  - **Responsive Layout**: Updated the "Instruction Overlay" text to display "Pinch to Zoom" on touch devices (Tablet/Mobile) instead of "Scroll to Zoom".
  - **Fluid UI Sizing**: The toggle switch track now uses fluid width calculations (`width: calc(100% - 48px)`) with a strict max-width cap, ensuring it fits perfectly on small screens while remaining usable.

## v2.100 - 2026-01-21
- **Mobile Experience Overhaul**:
  - **Scroll Locking**: Implemented aggressive `touch-action` and `preventDefault()` logic to strictly keep the page from scrolling while interacting with the 3D model.
  - **Zoom Constraints**: Capped the maximum zoom-out distance (`maxD = 10.0`) to prevent the model from becoming lost.
  - **Viewport Optimization**: Added logic to shift the orbital center DOWN on mobile devices, effectively rendering the active model HIGHER in the viewport to clear bottom-aligned UI.

## v2.034 - 2026-01-21
- **Visual Tune**: Increased base vertical tilt (pitch) from 10° to 20° to reveal more of the sphere's top crown.
- **UX Enhancement**: Added Auto-Recenter logic.
    - **Behavior**: If the user manipulates the camera (orbit/pan/zoom) and then stops interacting for 2.5 seconds, the camera smoothly drifts back to its starting position `(0, 0, 5)`.
    - **Triggers**: Detects Mouse Down/Up, Wheel Zoom, and Touch Zoom interactions.
## v2.033 - 2026-01-21
- **Animation Update**: Upgraded outer shell rotation to full Biaxial motion.
    - **Mechanism**: Added a secondary rotation vector on the X-axis (Pitch) to combine with the existing Y-axis (Yaw) spin.
    - **Effect**: The outer lattice now "tumbles" gyroscopically around the steady central core, rather than just spinning flatly.
    - **Speed Ratios**: Core (100%) : Shell Yaw (-50%) : Shell Pitch (20%).
## v2.032 - 2026-01-21
- **Animation Update**: Implemented contra-rotation for the outer lattice structure.
    - **Logic**: The outer shell (wireframe + nodes) now rotates in the opposite direction to the central orb.
    - **Speed**: The shell rotates at 50% of the orb's speed, creating a rich parallax depth effect.
    - **Axis**: Aligned with the central orb's vertical axis (tilted 10 degrees).
## v2.031 - 2026-01-21
- **Rotation Tune**: Adjusted central orb rotation dynamics.
    - **Axis**: Changed from "Clock Face" (Camera Z-axis) to "Spinning Top" (World Y-axis). This creates a lateral latitudinal spin.
    - **Speed**: Reduced max speed by 50% (from 60 RPM to 30 RPM) for a more deliberate, heavy machinery feel.
## v2.030 - 2026-01-21
- **Feature Checkpoint**: `v2.029` saved as stable backup.
- **Animation Update**: Added rotation to the central orb.
    - **Behavior**: The orb spins on its axis during the "POWER UP" state, creating a dynamic churning effect.
    - **Speed**: Ramps up to ~1 revolution per second (60 RPM).
    - **Smoothing**: Rotation speed is coupled to the simulation intensity, ensuring a gentle acceleration on power-up and a smooth deceleration on power-down/standby.
## v2.029 - 2026-01-21
- **Animation Fix**: Smoothed the electron trace "Power Down" sequence.
    - **Logic**: Removed the strict state check for electron spawning. Spawning logic is now purely driven by `simIntensity`.
    - **Effect**: Electron traces now continue to spawn (with decreasing probability) as the system powers off, mirroring the "Power Up" ramp in reverse, instead of abruptly cutting off.
## v2.028 - 2026-01-21
- **UI Update**: Renamed "ON" state to "POWER UP" on the toggle switch to match "POWER DOWN".
## v2.027 - 2026-01-21
- **UI Update**: Renamed "OFF" state to "POWER DOWN" on the toggle switch to better reflect the slow shutdown behavior.
- **Animation Refinement**: Implemented sequential transition logic for Standby mode.
    - **Logic**: The system now checks if the simulation intensity is still active (> 5%) before allowing the Standby pulse to fade in.
    - **Effect**: Active -> (Fades to near zero) -> Standby Breathing fades in. This prevents the "breathing" from overlapping with the power-down fade.
## v2.026 - 2026-01-21
- **Animation Tune**: Delayed the onset of the "Breathing" effect during the transition to Standby.
    - **Logic**: Applied a non-linear mixing curve (squared dampening) to the pulse amplitude for both the Central Orb and Nodes.
    - **Effect**: The system now fades down to a steady low-light state *before* the deep breathing oscillation becomes visible, matching the desired "Power Down -> Sleep" sequence.
## v2.025 - 2026-01-21
- **Rendering Fix**: Synchronized the Core Light (Orb) and Ambient Light transitions with the Node simulation. 
    - **Fix**: Removed the secondary interpolation lag ("double smoothing") where lighting was chasing a moving target.
    - **Result**: The central orb now powers down and pulses in perfect unison with the nodes, eliminating the 1-2 second lag perceived during state switches.
## v2.024 - 2026-01-21
- **UI Refinement**: Polished the "Pill Toggle Switch" interaction and layout.
    - **Visuals**: Increased track padding for a better "pill-in-track" aesthetic.
    - **Interaction**: Implemented custom drag offset logic to prevent the thumb from jumping under the finger when clicked.
    - **Snapping**: Tuned easing curves for a satisfying "mechanical" snap feel.
    - **Layout**: Reordered states to STANDBY (Left) -> ON (Center) -> OFF (Right) per user request.
## v2.023 - 2026-01-21
- **UI Upgrade**: Replaced standard buttons with a large, interactive "Pill Toggle Switch".
    - **Interaction**: Supports "Drag and Throw" mechanism - users can drag the slider thumb or click the track to jump.
    - **Visuals**: Modern, glass-morphism style with a glowing thumb and dynamic text highlighting.
    - **States**: seamless 3-way toggle (OFF | STANDBY | ON).
    - **Sizing**: Increased overall control size by ~20% for better usability.
## v2.022 - 2026-01-21
- **Bugfix**: Fixed `ReferenceError: pulse is not defined` by promoting the pulse timer variable to the top of the `animate()` function scope, ensuring it is accessible to both the lighting and node loops.
## v2.021 - 2026-01-21
- **Favicon Update**: Removed explicit SVG icon reference as the provided PNG is the source of truth. Relying on `favicon.ico` and PNG variants.
## v2.020 - 2026-01-21
- **Bugfix**: Fixed `SyntaxError` due to duplicate variable declaration (`pulse`) in `icosahedron-scene.js` that was missed in v2.019.
- **Assets**: Added `favicon.ico` (sourced from Slack icon) and updated all HTML pages to include the favicon link.
## v2.019 - 2026-01-21
- **Bugfix**: Fixed `SyntaxError` due to duplicate variable declaration (`pulse`) in the animation loop.
## v2.018 - 2026-01-21
- **Transitions Update**: Completely rewrote the rendering loop to support additive state mixing.
    - **Behavior**: Switching between Active, Standby, and Off is now fully seamless.
    - **Active → Standby**: Chaos fades out over ~3s while the standby pulse fades in. No snapping or jarring switches.
    - **Standby → Off**: Pulse gently fades to black.
    - **Active → Off**: Chaos gently fades to black.
## v2.017 - 2026-01-21
- **Off Mode Fix**: Implemented a true "Zero State" for the Off mode.
    - **Change**: Node firing and emissive logic now fully respects the global `simIntensity` scalar during fade-out.
    - **Behavior**: When switching to Off, all nodes and circuits now fade smoothly to absolute black (0 opacity/emissive), ensuring no residual activity remains.
## v2.016 - 2026-01-21
- **Gradual Off-Ramp**: Applied the slow transition effect to powering OFF/STANDBY as well.
    - **Change**: `lerpSpeed` is now constantly `0.005` in all directions.
    - **Behavior**: Electrons now fade out gradually instead of vanishing instantly when switching away from Active mode.
## v2.015 - 2026-01-21
- **Composition Update**: Tilted the entire 3D object by 10 degrees (X-axis) for a better default viewing angle.
- **Power On Logic**: Implemented a true `simIntensity` variable that smoothly ramps simulation activity (electron generation, node firing intensity) from 0 to 1 over several seconds, fixing the "instant on" feeling.
- **Standby Refinement**: Lowered the minimum intensity of the heartbeat pulse to near zero (0.05), increasing the dynamic range and making the "breath" more visible.
## v2.015 - 2026-01-21
- **Composition Update**: Tilted the entire 3D object (Icosahedron + Sphere) by 10 degrees on the vertical axis for a better default viewing angle.
## v2.014 - 2026-01-21
- **UX Update**: Set default load state to **STANDBY** (was ACTIVE).
- **Refinement**: Slowed down the "Standby Heartbeat" animation (50% slower) to create more "space" between breaths.
## v2.013 - 2026-01-21
- **UI Update**: Inactive buttons are now lighter/visible (#cccccc) based on user feedback.
- **Standby Mode Refined**: All static nodes now pulse in unison with a breathing/heartbeat animation.
- **Power On Sequence**: Added gradual transition (lerp) for power-on state (slower ramp-up).
- **Cleanup**: Removed the SpotLight (distracting dot) as requested.
## v2.012 - 2026-01-21
- **UI Update**: Repositioned System Control to Bottom Center (Above Title).
- **Feature (Standby Mode)**: Added "Standby" state.
    - **Logic**: OFF (Dark) -> STANDBY (Dim + Heartbeat Pulse) -> ACTIVE (Full).
    - **Visuals**: Standby mode features a subtle breathing animation on the core light.
    - **Control**: Segmented 3-state control bar.
## v2.011 - 2026-01-21
- **Feature (System Toggle)**: Restored the "SYSTEM ACTIVE" toggle button.
    - **Function**: Allows users to power down all lighting and neural activity for a stealth look.
    - **Behavior**: 
      - **Off**: Dims all scene lights, stops electron flow, disables node firing.
      - **On**: Restores full illumination and simulation logic.

## v2.010 - 2026-01-21
- **Restoration**: Restored 'Blue Silver' variants (html and js files).
    - **Note**: These files are preserved as legacy/backup variants.

## v2.009 - 2026-01-21
- **Cleanup**: Removed duplicate file `deploy/Icosahedron.html`.
    - **Consolidation**: `deploy/icosahedron.html` (lowercase) is the canonical source.

## v2.009 - 2026-01-21
- **Cleanup**: Removed legacy/redundant files (`icosahedron-blue-silver.html` and `icosahedron-scene-blue-silver.js`).
    - **Why**: Maintaining a Single Source of Truth for the 3D scene.

## v2.008 - 2026-01-21
- **Mobile Controls Fix**: Enabled Touch Interactions.
    - **Resolution**: Implemented custom "Pinch-to-Zoom" logic.
    - **Fix**: Forced `touch-action: none` to prevent page scrolling during interaction.
    - **Rotation**: Enabled native OrbitControls touch rotation.
- **Visual Polish**: Rotated the Central Orb by 90 degrees on the X-axis.

## v2.008 - 2026-01-21
- **Visual Polish**: Rotated the Central Orb by 90 degrees on the X-axis.
    - **Why**: Hides the "Pole/Eye" of the sphere circuitry mapping from facing the camera directly.

## v2.007 - 2026-01-21
- **Refinement (Neural Activity)**: Slowed down the flashing rhythm of the nodes.
    - **Frequency**: Reduced firing probability from 6% to 2% per tick.
    - **Duration**: Increased flash decay time (0.75 -> 0.92 multiplier) for a calmer pulse.

## v2.006 - 2026-01-21
- **Design Update (Obsidian Orb)**: Updated `icosahedron-scene.js` to the new "Black Glass" aesthetic.
    - **Sphere**: Changed to `MeshPhysicalMaterial` (Pitch Black, Roughness 0.15, Clearcoat 1.0).
    - **Cage**: Reduced wireframe opacity to 10%.
    - **Traces**: Stealth mode (5% inactive) to Flashing.

## v2.006 - 2026-01-21
- **Design Update (Obsidian Orb)**: Updated `icosahedron-scene.js` to the new "Black Glass" aesthetic.
    - **Sphere**: Changed to `MeshPhysicalMaterial` (Pitch Black, Roughness 0.15, Clearcoat 1.0) for a reflective obsidian look.
    - **Cage**: Reduced wireframe opacity to 10% (Subtle).
    - **Traces**: Stealth mode (5% opacity inactive) -> Flashing (0.05 to 1.0 alpha on electron pass).
    - **Lighting**: Maintained previous lighting for specular reflection on the dark surface.

# Changelog

## v2.005 - 2026-01-21
- **Critical Fix (Browser Compatibility)**: Replaced standard `OrbitControls` zoom with a custom "Discrete Step Zoom" mechanism.
- **Why**: Fixes the "disappearing scene" issue in sensitive browsers (like Comet) where high-delta scroll events caused the camera to zoom to infinity instantly.
- **Details**:
    - Disabled native `enableZoom`.
    - Added custom wheel listener.
    - Captures scroll direction only (ignoring magnitude).
    - Applies a fixed 5% zoom step per tick.
    - Force-clamps distance between 1.2 and 60.0.
    - Reduced `rotateSpeed` to 0.5 for smoother handling.

## v2.004 - 2026-01-21
- **Deep Rollback (v1.955)**: Reverted `deploy/` to **v1.955**.
- **Reason**: v1.960 also exhibited the broken scroll zoom. User requested a deeper rollback to v1.955 to find the stable state for controls.

## v2.003 - 2026-01-21
- **Rollback to Pre-Light-Toggle (v1.960)**: Reverted `deploy/` to **v1.960**.
- **Reason**: User suspects the zoom functionality broke when the light toggle feature was added (v1.961). Testing the immediately preceding version to isolate the issue.

## v2.002 - 2026-01-21
- **Zoom Fix Rollback**: Restored `deploy/` directory to **v1.961**.
- **Reason**: User identified that the zoom scroll behavior in later versions (v1.98x - v1.99x) was broken ("either way far away or super close"). Rolling back to v1.961 to restore the correct incremental zoom functionality.

## v2.001 - 2026-01-21
- **Correction Rollback**: The previous rollback to v1.900 was incorrect (user error).
- **Target**: Restored `deploy/` to **v1.990**.
- **State**: This returns to the "Brushed Metal" texture version with the Toggle Switch present, undoing the accidental regression to the primitive v1.900 state.

## v2.000 - 2026-01-21
- **Hard Rollback**: Restored the entire `deploy/` directory to **v1.900** as requested.
- **Reason**: Persistent dissatisfaction with recent zoom/scroll mechanics in v1.98x/v1.99x series. The user specifically identified "incremental zoom" issues.
- **State**: This reverts the project to the state before the "Metal Orb" and "high density circuit" experiments, likely returning to a lighter visuals or previous geometry configuration that had the correct "feel".

## v1.999 - 2026-01-21
- **Zoom Crash Fix (Post-Revert)**: Although v1.981 was fully restored, the "broken zoom" issue persists because the v1.981 code lacks collision constraints. Code analysis shows that without `minDistance`, users can zoom inside the opaque central sphere (radius 0.86), causing the "disappearing / 1000% black screen" effect.
- **Correction**: Added `minDistance: 2.0` to the v1.981 codebase. This forces the camera to stay outside the lattice, mimicking the "safe" viewing distance of the Blue Steel demo (which didn't have a solid core to clip into). This should permanently solve the "extreme magnification" disorientation.

## v1.998 - 2026-01-21
- **Rollback**: Restored the entire `deploy/` directory to the state of **v1.981** (from 2026-01-21).
- **Reason**: User requested a full revert ("restore everything back to version 1.981") to return to the preferred visual and control state, undoing recent experiments with textures, materials, and zoom constraints.

## v1.997 - 2026-01-21
- **Zoom Crash Fix**: Identified the root cause of the "disappearing" behavior. Unlike the "Blue Steel" demo (which is hollow), this scene contains a solid opaque metal sphere. When the user zooms in past the surface, the camera clips inside the sphere, rendering a black void.
- **Constraints**: Re-applied `minDistance: 1.8` to mechanically prevent the camera from entering the solid sphere. This ensures the object always remains visible.
- **Speed Tuning**: Set `zoomSpeed: 0.6` to provide a balanced scroll feel—control without the jumpiness of 1.0 or the crawl of 0.05.

## v1.996 - 2026-01-21
- **Controls Rollback**: Completely removed all custom zoom constraints (`minDistance`, `maxDistance`, `zoomSpeed`). The control scheme is now code-identical to the "Blue Steel" demo (`icosahedron-blue-silver.html`), which serves as the reference for correct behavior. This invalidates any "sticky" or "jumpy" zoom issues introduced by recent boundary attempts.

## v1.995 - 2026-01-21
- **Zoom Restoration**: Reverted `zoomSpeed` and `dampingFactor` to their default values (1.0 and 0.05). This restores the original behavior that the user described as "smooth in increments".
- **Boundaries**: Adjusted `minDistance` to `1.2` (prevent clipping) and `maxDistance` to `100.0` (prevent feeling boxed in). The goal is to provide the standard navigation feel while invisible walls prevent the specific bug of "disappearing" inside the model.

## v1.994 - 2026-01-21
- **Zoom Precision**: Set `zoomSpeed` to `0.05` and increased `dampingFactor` to `0.1`.
- **Range Adjustment**: Widened the zoom range (`1.3` to `50.0`).
- **Goal**: Address the "0 to 100" complaint by making the zoom extremely granular and increasing friction, preventing the camera from sliding instantly to the minimum/maximum limits.

## v1.993 - 2026-01-21
- **Zoom Calibration**: Drastically reduced the `zoomSpeed` of the `OrbitControls` to `0.3` (from default 1.0). This prevents the "0 to 100" jumpiness and restores the smooth, incremental zoom behavior users expect when scrolling.

## v1.992 - 2026-01-21
- **Visual Refinement**: Restored the "Node Animations" (blinking halos) while keeping the static "Pin Dots" invisible (`opacity: 0`). This satisfies the request to remove the distracting dots while fixing the unintended loss of animation.
- **Zoom Fix**: Widened the zoom constraints (`minDistance: 2.0`, `maxDistance: 20.0`) to fix the "disappearing" bug while restoring a freer, smoother zoom feel that users were accustomed to.

## v1.991 - 2026-01-21
- **Visual Cleanup**: Removed the "light pin dots" (LED nodes) from the icosahedron vertexes to reduce visual clutter and focus on the central sphere.
- **UX Fix**: Constrained the `OrbitControls` zoom to a safe range (`minDistance: 2.5`, `maxDistance: 10.0`). This prevents the user from zooming "through" the object or losing it in the void (the "disappearing" bug).

## v1.990 - 2026-01-21
- **Texture Upgrade (Brushed Metal)**:
  - **Procedural Grain**: Rewrote `createMetalTexture` to generate a directional "brushed steel" effect using thousands of randomized horizontal streaks instead of generic noise.
  - **High Definition**: Increased texture resolution to 1024x1024.
  - **Material Physics**: Tuned the `MeshStandardMaterial` to `0.75` metalness and `0.008` bump scale, allowing the new grain texture to catch light realistically and define the surface curvature.

## v1.989 - 2026-01-21
- **Design Two Visuals (Metal Texture)**:
  - **Procedural Texture**: Implemented a dynamic Javascript canvas texture generator (`createMetalTexture`) to create a bespoke "scratched metal" surface map.
  - **Surface Detail**: Applied this new texture to both the `roughnessMap` (creating variation in how shiny different parts of the sphere are) and the `bumpMap` (adding subtle physical imperfections). This transforms the sphere from a smooth plastic-like ball into a realistic machined steel component with scratches, noise, and tactile detail.

## v1.988 - 2026-01-21
- **Design Two Visuals (Lighting & Visibility Overhaul)**:
  - **Lighting Setup**: Significantly boosted scene lighting to ensure the metal orb is visible.
    - **Ambient**: Increased from 0.2 to **0.5**.
    - **Key Light**: Increased intensity from 8 to **12**.
    - **Rim Light**: Added a new Blue Rim Light (`0x0088ff`, intensity 10) on the right side to define the edge of the sphere against the void.
  - **Material Tune**:
    - **Color**: Lightened the base metal color to **Silver/Light Steel** (`0x8899aa`) so it reflects light more effectively.
    - **Emissive Lift**: Added a subtle dark blue emissive glow (`0x001122`, 0.2) to the sphere surface itself. This prevents the "shadow side" from crushing to pure black, simulating complex light bounce.

## v1.987 - 2026-01-21
- **Design Two Visuals (Metal Visibilty Fix)**:
  - **Material Tune**: Fixed the issue where the metal orb appeared black. Adjusted the material physics to compensate for the scene's lighting (Standard lighting vs Environment Map).
  - **Settings**: Increased base color brightness (`0x3a4b5c` Steel Blue) and reduced metalness to `0.5`. This creates a polished, glossy "Steel" look that properly reflects the scene lights without turning pitch black.

## v1.986 - 2026-01-21
- **Design Two Visuals (Metal Orb)**:
  - **Material Update**: Switched the central sphere material from plain Lambert to **Standard Metal** (`metalness: 0.9`, `roughness: 0.3`). This gives the orb a sleek, high-tech metallic finish that catches the scene's lighting.
  - **Light Intensity**: Reduced the internal core light intensity to **20%** (0.2), creating a moodier, more sophisticated look where the circuitry glow pops against the darker, metallic surface.

## v1.985 - 2026-01-21
- **Design Two Visuals (Dark Opacity Boost)**:
  - **Trace Visibility**: Increased the base opacity of all unlit circuit traces and pads from **10%** to **50%**. This significantly increases the visual weight and contrast of the "dark" circuitry against the background, making the complex network grid clearly visible at all times, not just when lit.
  - **Chip Clusters**: Validated that the component chip clusters also respect this new higher opacity (0.55), ensuring they stand out slightly more than the traces.

## v1.984 - 2026-01-21
- **Bug Fix (Animation Crash)**:
  - **Null Safety**: Fixed a critical `TypeError` in the new optimized animation loop. The generated "start ports" for circuit traces (invisible logical nodes) were being added to the render loop, causing a crash when the renderer tried to access their non-existent geometry. Added a safety check to ensure only visible pads are processed.

## v1.983 - 2026-01-21
- **Design Two Visuals (Chip Clusters & Performance)**:
  - **Component Layouts**: Moved away from pure random traces to a "Component-based" layout. The generator now first places 40 "Chips" (dense grids of pads) on the sphere surface.
  - **Connection Logic**: Circuit traces now specifically spawn from the edge ports of these chips, mimicking real PCB routing where lines connect components. This solves the "floating lines with no start/end" visual issue.
  - **Infinite Wrapping**: Fixed a coordinate wrapping bug in the walker algorithm. Traces can now loop around the sphere's longitude (360 degrees) indefinitely without hitting invisible seams.
- **Performance Optimization**:
  - **Active Set Rendering**: Refactored the animation loop to track only "active" (illuminated) segments in a separate Set. This reduces the per-frame iteration count from ~10,000 meshes to ~50, drastically improving framerate and pulse speed.
  - **Speed Boost**: Doubled the travel speed of electron pulses for a more energetic look.

## v1.982 - 2026-01-21
- **Design Two Visuals (Smart Routing & End-to-End Traces)**:
  - **Smart Walker**: Replaced the random path generation with a "Smart Walker" algorithm that checks forward/backward lookahead directions and prioritizes maintaining inertia. This creates long, deliberate straight connections instead of random erratic zig-zags.
  - **Backtracking & Cleanup**: Implemented a strict validation system that completely discards any circuit path shorter than **40 segments** (previously 10). If a path fails this check, its reserved grid points are now properly released (deleted from `gridMap`), preventing invisible "dead zones" from blocking future valid paths.
  - **Guaranteed Wrapping**: Changed the main loop to a `while` loop that forces the generator to keep retrying until the specific target of valid long buses is met. This guarantees the sphere is fully wrapped in end-to-end circuitry.

## v1.981 - 2026-01-21
- **Design Two Visuals (Visible Base State)**:
  - **Trace Visibility**: Increased the base opacity of all circuit traces and pads from **0%** (invisible) to **10%** (faintly visible). This provides better context and density, ensuring the viewer can see the complex network structure even when it's not actively carrying a pulse.
  - **Animation Logic**: Updated the illumination decay curve to map 0-100% intensity to 10-100% opacity, ensuring smooth transitions between the "faint idle" and "bright active" states.

## v1.980 - 2026-01-21
- **Design Two Visuals (Hyper-Dense Wrapping)**:
  - **Resolution Scaling**: Doubled the underlying circuitry grid from `45x60` to `90x120`. This allows for much finer, more intricate routing without collisions.
  - **Density Boost**: Quadrupled the number of circuit buses (`50` -> `200`) and massively extended their lifetimes (`30-70` steps -> `100-200` steps) to ensure traces wrap completely around the sphere ("End-to-End" look).
  - **Stub Filtering**: Implemented a "failed start" filter that discards any circuit trace shorter than 10 segments, ensuring only long, deliberate paths appear.
  - **Result**: A dense, complex network of long, continuous lines that fully encircle the sphere, with no unsightly "broken" or "floating" fragments.

## v1.975 - 2026-01-21
- **Design Two Visuals (Connected Illumination)**:
  - **Pad Linking**: Refactored the circuit generation logic to link pad meshes to their corresponding wire segments.
  - **Seamless Traces**: Pads now light up in perfect synchronization with their connected wire segments, ensuring a continuous, unbroken beam of light as the electron travels. No more "dark corners" between lit segments.
  - **Cleanup**: Removed redundant pad generation loops, resulting in optimized geometry count.

## v1.974 - 2026-01-21
- **Design Two Visuals (Invisible Start State)**:
  - **Trace Visibility**: Changed the initial state of all circuit traces and pads to be **completely invisible** (opacity 0). They now only appear when energized by an electron pulse.
  - **Non-Overlapping Logic**: Implemented a `gridMap` collision detection system during generation. This ensures that circuit buses never cross or touch each other, mimicking realistic parallel PCB routing.
  - **Generation**: Buses now abort or skip lanes if they detect an impending collision, resulting in cleaner, separated paths.

## v1.973 - 2026-01-21
- **Design Two Animation (Precise Sync)**:
  - **Segmentation**: Drastically reduced the length of individual circuit segments (`4-14` -> `2-5` grid units).
  - **Effect**: Shorter segments mean the "lit" portion of the wire is much closer to the actual position of the electron pulse, solving the "light running ahead" desync issue.
  - **Trail Handling**: Increased the cooling rate (`0.96` -> `0.82`) so trails fade out quickly behind the electron, preventing the "always lit" look.
  - **Pulse Speed**: Adjusted electron speed to match the new shorter segment lengths for smooth traversal.
  - **Bus Length**: Increased the number of steps per bus (`15-40` -> `30-70`) so that even with shorter segments, the overall visual path remains long and continuous across the sphere.

## v1.972 - 2026-01-21
- **Design Two Visuals (Pads)**:
  - **Pad Size**: Increased circuit intersection pads by 50% (`0.0084` -> `0.0126`). This improves the visual connection between segments and hides joints.
- **Design Two Animation (Continuous Beams)**:
  - **Logic Overhaul**: Rewrote the electron pulse logic. Instead of jumping to random single wire segments, electrons now lock onto a continuous "Bus Route" (a chain of connected wire segments).
  - **Traversal**: Electrons travel the full length of a bus (from start to finish, potentially 40+ steps) before fading out.
  - **360 Movement**: Increased the generated bus length by 200-300% to create long, winding paths that can wrap around the sphere.
  - **Sync**: Line illumination is now strictly synchronized with the electron's position in the chain. As soon as an electron enters a segment, that specific segment lights up and stays lit until the electron leaves it.

## v1.971 - 2026-01-21
- **Design Two Visuals (Pads & Lines)**:
  - **Trace Quality**: Disabled `depthWrite` on circuit lines to fix the "dashed" artifact caused by self-occlusion in the depth buffer.
  - **Pad Density**: Added logic to spawn a trace pad (circle) at *every* intersection point of the circuitry path, not just the start and end. This significantly increases the technical detail and "connectedness" of the grid.

## v1.970 - 2026-01-21
- **Design Two Visuals (Rendering Clean-up)**:
  - **Trace Fix**: Disabled `alphaToCoverage` on the circuit line material. This prevents the "dashed" artifacting seen when lines fade out or vary in opacity.
- **Design Two Tuning (Node Timing)**:
  - **Flash Interval**: Drastically increased the time between node flashes.
    - Probability: `0.02` -> `0.005` (75% reduction).
    - Cooldown: `15-65` frames -> `60-180` frames (Triple the pause duration).
  - **Goal**: Make individual node events much rarer and spaced out.

## v1.969 - 2026-01-21
- **Design Two Tuning (Speed Reduction)**:
  - **Electron Speed**: Halved the travel speed of electrons along the paths (Base `0.005`, Max `0.02`).
  - **Node Decay**: Slowed the fade-out rate of firing nodes (Decay factor `0.75` -> `0.85`), creating a softer, longer pulse instead of a quick blink.
  - **Trace Cooling**: Slowed the rate at which lit paths fade back to black (`0.92` -> `0.96`), matching the slower electron speed.
  - **Goal**: Address user feedback that despite previous probability reductions, the *speed* of the animation remained too frantic.

## v1.968 - 2026-01-21
- **Design Two Tuning (Aggressive Reductions)**:
  - **Node Firing**: Reduced probability from `0.038` to `0.02` (~47% reduction). Increased cooldown variance.
  - **Electron Swarm**: Halved the influence of "Activity Level" (proximity) on electron generation (`0.1` -> `0.05`).
  - **Electron Speed**: Slightly reduced top speed variance (`0.04` -> `0.03`).
  - **Reason**: User reported previous 20% tweaks were imperceptible. Adjusted parameters more aggressively to ensure a visible "calming" effect.

## v1.967 - 2026-01-21
- **Design Two Tuning**:
  - **Activity**: Further reduced firing probability for nodes (0.048 -> 0.038) and electrons (0.008 -> 0.0064) by another ~20%.
  - **Goal**: Create a more "idling" brain state rather than a hyperactive one.

## v1.966 - 2026-01-21
- **Design Two Tuning**:
  - **Activity**: Reduced firing probability for both LED nodes (0.06 -> 0.048) and electron pulses (base 0.01 -> 0.008) by 20% to calm the scene.
  - **Wireframe**: Increased opacity slightly (0.5 -> 0.6) for better structural definition while maintaining transparency.

## v1.965 - 2026-01-21
- **Design Two Visuals (Wireframe)**:
  - **Opacity**: Reduced outer lattice wireframe opacity to 50% (`0.5`) and enabled transparency.
  - **Goal**: Make the outer cage less intrusive, allowing the inner "brain" circuitry to be the primary focal point.

## v1.964 - 2026-01-21
- **Design Two Geometry (Orientation)**:
  - **Start Rotation**: Rotated the entire icosahedron group 90 degrees on the X-axis (`Math.PI / 2`).
  - **Purpose**: Moves the spherical "pole" (where lines converge) away from the camera view, presenting the "flat" side of the lattice and circuitry for a less eye-like, more architectural initial appearance.

## v1.963 - 2026-01-21
- **UI Refinement**:
  - **Toggle Label**: Changed static "Lights" label to dynamic "ON / OFF" status text that updates with the switch state.

## v1.962 - 2026-01-21
- **UI & Controls (Enhanced Toggle)**:
  - **Switch UI**: Replaced the simple button with a modern "Slide Toggle" switch for lighting control.
  - **Styling**: Added custom CSS for a glassmorphism toggle switch with smooth animations.

## v1.961 - 2026-01-21
- **UI & Controls (Interactive Toggle)**:
  - **Light Switch**: Added a "Lights: ON/OFF" button to the demo viewer (`icosahedron.html`).
  - **Logic**: Implemented `toggleLights()` in `IcosahedronScene` class.
    - **OFF State**: Forces circuit traces to black (0 intensity), disables electron pulses, sets node emissive intensity to 0, and hides halos.
    - **ON State**: Resumes normal random firing logic and activity.

## v1.960 - 2026-01-21
- **Design Two Visuals (Contrast)**:
  - **Trace Visibility**: Reduced base intensity of unlit sphere traces by another 20% (`0x041725` -> `0x03121d`). 
  - **Effect**: Traces are now extremely subtle when inactive, making the active firing sequences pop with maximum contrast.

## v1.959 - 2026-01-21
- **Design Two Geometry (Core Scale)**:
  - **Sphere Size**: Increased `centralSphere` diameter by another 20% (Radius 0.72 -> 0.864).
  - **Circuitry**: Adjusted `surfaceRadius` (0.725 -> 0.87) to match the larger core sphere.
  - **Effect**: The core brain now fills more of the icosahedron cage volume.

## v1.958 - 2026-01-21
- **Design Two Visuals (Lattice Focus)**:
  - **Wireframe Dimming**: Reduced wireframe brightness by another ~20% (`0x627e96` -> `0x4e6578`).
  - **Goal**: Make the "brain activity lights" (nodes and circuitry) significantly more prominent by receding the outer cage into the background.

## v1.957 - 2026-01-21
- **Design Two Visuals (Lattice)**:
  - **Wireframe Color**: Further reduced brightness by another 20% (`0x7a9ebc` -> `0x627e96`) to deepen the cage contrast against the bright nodes.

## v1.956 - 2026-01-21
- **Design Two Visuals (Lattice)**:
  - **Wireframe Color**: Reduced brightness by 10% (`0x88b0d1` -> `0x7a9ebc`) to make the outer cage slightly less dominant compared to the illuminated core circuitry.

## v1.955 - 2026-01-21
- **Design Two Visuals (Contrast)**:
  - **Darker Traces**: Reduced base circuit line color by ~50% (`0x082e4b` -> `0x041725`) to make them nearly invisible when not illuminated, enhancing the "firing" contrast.
  - **Larger Pads**: Increased `padGeometry` radius by 20% (0.007 -> 0.0084) for better visibility of connection points.

## v1.954 - 2026-01-21
- **Design Two Geometry**:
  - **Core Scale**: Increased `centralSphere` diameter by 20% (Radius 0.6 -> 0.72).
  - **Circuitry**: Adjusted `surfaceRadius` (0.605 -> 0.725) to map circuit lines correctly to the expanded sphere surface.

## v1.953 - 2026-01-21
- **Design Two Experiment**:
  - **Node Density**: Increased `IcosahedronGeometry` detail from 1 to 2.
  - **Effect**: Increases node count from 42 to 162, creating a much denser "neural" network of nodes and lattice lines.

## v1.952 - 2026-01-21
- **Design Two Visuals (RGB Nodes)**:
  - **Colors**: Updated `addNodes` to assign random vivid RGB colors (HSL) to each node sphere instead of uniform white-blue.
  - **Halo**: Re-introduced a "tiny tiny" sprite halo to each node that tints with the node's random color.
  - **Animation**: Node emissive flash now uses the unique node color; halo opacity pulses subtly with firing state.
  - **Texture**: Updated `createGlowTexture` to be neutral white to support accurate color tinting.

## v1.938 - 2026-01-21
- **Design Two Logic (Parallel Buses)**:
  - **Circuitry**: Completely rewrote `initCircuitryPaths` to generate "Buses" of parallel lines instead of random curves.
  - **Architecture**: Implemented "Manhattan on Sphere" logic where lines travel strictly along latitudes or longitudes, making 90-degree turns.
  - **Visuals**: Maintains the optimized `Line2` (Fat Line) rendering but with organized, clean geometry.

## v1.937 - 2026-01-21
- **Design Two Optimization (Flat + Fat)**:
  - **Performance**: Replaced 3D `TubeGeometry` (high poly) with `LineSegments2` (Fat Lines) which are billboarded flat lines with width.
  - **Density**: Reduced `numChips` from 150 to 60 to significantly lower draw calls and server load.
  - **Visuals**: Used `linewidth` of 2.5 to maintain the "dense" feel despite fewer actual lines.
  - **Circuitry**: Updated animation loop to handle `LineMaterial` opacity/color pulses instead of Mesh properties.

## v1.936 - 2026-01-21
- **Design Two Tweak**:
  - **Electrons**: Changed electron shape from squares (`BoxGeometry`) to pulse dots (`SphereGeometry`).

## v1.935 - 2026-01-21
- **Design Two Iteration (Circuitry)**:
  - **Circuitry**: Completely refactored `initCircuitryPaths` in `icosahedron-scene.js`.
  - **Visual**: Replaced thin lines with `TubeGeometry` (radius 0.003) for physical width.
  - **Density**: Increased `numChips` from 90 to 150 for denser connections.
  - **Animation**: Updated material animation to handle `MeshStandardMaterial` emissive pulses instead of basic line colors.

## v1.934 - 2026-01-21
- **Design Two Initialization (Low-Poly Sphere) - Retry**:
  - Re-deployment of v1.933 changes due to interruption.
  - **Geometry**: Updated `icosahedron-scene.js` to use `IcosahedronGeometry(radius, 1)` (80 faces).

## v1.933 - 2026-01-21
- **Design Two Initialization (Low-Poly Sphere)**:
  - **Geometry**: Updated `icosahedron-scene.js` to use `IcosahedronGeometry(radius, 1)` (80 faces) instead of `detail: 0` (20 faces).
  - **Visual**: Creates a "dimpled sphere" or geodesic dome structure.
  - **Mesh Adjustment**: Reduced texture density from 30x to 15x to accommodate the smaller faces of the subdivided geometry.

## v1.932 - 2026-01-21
- **Design Freeze (Design One)**:
  - **Action**: Saved the "Bluey Silver" design state to `icosahedron-blue-silver.html` and `assets/js/icosahedron-scene-blue-silver.js`.
  - **Purpose**: "Locking down" the first approved design concept before iterating on new concepts in the main file.
  - **Live URL**: `/icosahedron-blue-silver.html` will now host this specific version permanently.

## v1.931 - 2026-01-20
- **Fix**: Renamed `Icosahedron.html` to `icosahedron.html` (lowercase) to fix URL accessibility issues.

## v1.930 - 2026-01-20
- **Theme Overhaul (Bluey Silver)**:
  - **Goal**: Transition the entire Icosahedron aesthetic from Copper/Gold to a "Bluey Silver" palette.
  - **Implementation**:
    - **Wireframe & Mesh**: Changed colors to Silver Blue (`0x88b0d1`).
    - **Mesh Visibility**: Increased fine mesh opacity from 0.15 to 0.5 and density to 30x repeat for a clearer screen effect.
    - **Lighting**: Switched ambient and spotlights to Cool Blue/White (`0xaaccff` / `0xe6f3ff`).
    - **Central Sphere**: Updated to Dark Blue Metal (`0x051a24`).
    - **Effects**: Circuit traces, nodes, and electrons now use Electric Blue and Cyan hues.

## v1.928 - 2026-01-20
- **Visual Repair (Fine Mesh Texture)**:
  - **Goal**: Replace the "yarn-like" thick circuitry with a fine, screen-like mesh texture.
  - **Implementation**:
    - **Texture Generation**: Created a high-density 64x64px repeating cross-hatch pattern with 1px thin lines.
    - **Mapping**: Repeated the texture 10x per face (`repeat: [10, 10]`) to create a dense, fine-grain mesh look.
    - **Material**: `MeshBasicMaterial` with `opacity: 0.15` and `additive` blending for a subtle, holographic screen effect.
  - **Backup**: Archived the "yarn" experiment to `backups/icosahedron-scene.backup.v1.927.yarn_texture`.

## v1.927 - 2026-01-20
- **Feature Pivot (Face-Mapped Mesh)**:
  - **Goal**: Implement a "Light Opaque Circuitry" mesh that is mapped *onto* the faces of the icosahedron, without creating a separate displaced wireframe geometry (avoiding the v1.924 interference pattern).
  - **Implementation**:
    - Generates a procedural 256x256 Grid Texture (Cyan-White lines, Transparent BG) via HTML5 Canvas.
    - Applies this texture to a `MeshBasicMaterial` on the standard Icosahedron layout (`detail: 0`).
    - **Result**: The flat faces of the icosahedron now display a glowing grid/circuit mesh pattern that aligns perfectly with the copper wireframe edges, creating a "holographic panel" aesthetic.

## v1.926 - 2026-01-20
- **Reversion**: Restored "Glass Panel" look (v1.921/1.923).
  - **Reason**: The "Light Circuitry" experiment (v1.924/1.925) was not the desired "face meshing" effect.
  - **Archive**: The glitchy circuitry mesh code has been backed up to `backups/icosahedron-scene.backup.v1.924.glitchy_circuit` for future reference.

## v1.925 - 2026-01-20
- **Visual Repair (Geometric Alignment)**:
  - **Issue**: The "Light Circuitry" mesh was misaligned with the outer copper frame.
  - **Root Cause**: The circuitry mesh was generated with `detail: 1` (geodesic sphere) while the frame was `detail: 0` (angular icosahedron), causing their edges to cross.
  - **Fix**: Reduced circuitry mesh to `detail: 0` to match the outer frame perfectly. It now sits as a perfect, slightly smaller inner cage (`scale: 0.98`) without intersecting lines.

## v1.924 - 2026-01-20
- **Feature Pivot (Circuitry Shell)**:
  - **Change**: Removed the physical glass simulation entirely in favor of a "Light, Opaque Circuitry" mesh as requested.
  - **Implementation**:
    - Replaced `MeshPhysicalMaterial` (Glass) with a `MeshBasicMaterial` (Self-illuminated/Light).
    - **Visual**: A dense, opaque, light-cyan (`0xe0f7fa`) wireframe mesh (`detail: 1`) that sits just inside the copper frame.
    - **Effect**: Creates a "holographic blueprint" or "circuit net" aesthetic that is visually light but opaque in structure.

## v1.923 - 2026-01-20
- **Regression Fix**: Reverted changes from v1.922 (White Glass + Fill Light).
  - **Reason**: User feedback indicated the "white tinge" and extra lighting were not desired.
  - **Restored State (v1.921)**:
    - Lighting: Single spotlight (no fill).
    - Material: Dark Copper (`0x331a00`) with `opacity: 0.25`, `ior: 1.3`, and `clearcoat: 1.0`.

## v1.922 - 2026-01-20
- **Visual Repair (Lighting & Material)**:
  - **Goal**: Address "shaded" appearance and "pinpoint" reflections; achieve "lighter tinge of white".
  - **Lighting**:
    - Added a **Secondary Fill Light** (Cool Blue/White, Intensity 5) from the bottom right to illuminate the shadowed back faces of the glass, reducing the single-point reflection issue.
  - **Material**:
    - **Color**: Changed from Dark Copper (`0x331a00`) to **Pure White** (`0xffffff`) to give the requested "lighter tinge".
    - **Reflectivity**: Increased `ior` to `1.5` (Standard Glass) and sharpened `roughness` to `0.1`.
    - **Definition**: Increased `opacity` to `0.3` to ensure the white glass surface catches the light visibly.

## v1.921 - 2026-01-20
- **Visual Repair (Glass Reflectivity)**:
  - **Goal**: Create a "Glass Panel" look that is visible but not overwhelming.
  - **Enhancements**:
    - **Clearcoat**: Enabled `clearcoat: 1.0` and `clearcoatRoughness: 0.1` to add a sharp, highly reflective layer on top of the frosted base. This mimics the dual nature of polished glass (shiny surface, blurry depth).
    - **IOR**: Increased to `1.3` (from `1.1`) to naturally increase the Fresnel reflection intensity at glancing angles.
    - **Presence**: Slightly bumped `opacity` and `transmission` to `0.25` to support the reflective layer better.

## v1.920 - 2026-01-20
- **Visual Repair (True Increment)**:
  - **Adjustment**: Replaced the "extreme" glass settings of v1.919 with a much more subtle configuration that mimics the visibility of v1.918 (Phong, 15% opacity) while introducing the requested "little bit of blur".
  - **Settings**:
    - `opacity: 0.2` (Was 1.0): Drastically reduced visual weight to match the previous "ghost" look.
    - `transmission: 0.2` (Was 0.9): Reduced refraction intensity to just 20%, creating a subtle blur without dominating the scene.
    - `emissive: 0x050200`: Restored the faint glow for visibility in shadows.
    - `roughness: 0.2`: Maintained the blurriness factor.

## v1.919 - 2026-01-20
- **Visual Enhancement (Incremental Blur)**:
  - **Material**: Switched back to `MeshPhysicalMaterial` to enable blur capabilities.
  - **Tuning (Subtle)**:
    - `roughness: 0.2`: Adds the requested "little bit of blur".
    - `transmission: 0.9`: Makes the glass highly transparent (mostly clear) rather than solid.
    - `opacity: 1.0`: Adjusted to rely on `transmission` for visibility physics rather than alpha blending.
    - `ior: 1.15` & `thickness: 0.1`: Drastically reduced refraction settings compared to v1.917 to avoid the "extreme" distortion/fisheye effect, ensuring the geometry stays grounded.

## v1.918 - 2026-01-20
- **Visual Revert**:
  - **Glass Material**: Restored the `MeshPhongMaterial` settings from v1.916.
  - **Settings**: Opacity is reset to `0.15` (15%).

## v1.917 - 2026-01-20
- **Visual Enhancement (Glass Mechanics)**:
  - **Refraction Enabled**: Switched back to `MeshPhysicalMaterial` to support the user's request for "blur and distortion" which `Phong` cannot provide.
  - **Mechanics**:
    - `transmission: 0.95`: Nearly clear glass.
    - `roughness: 0.25`: Provides the "frosted/blur" effect on objects seen through the glass.
    - `depthWrite: false`: Maintained this critical setting to ensure the inner circuitry is not occluded by the depth buffer.
    - `color`: Switched to `0xcd7f32` (Bronze Tint) to match the copper aesthetic while remaining translucent.

## v1.916 - 2026-01-20
- **Visual Enhancement (Glass Visibility)**:
  - **Omni-Directional Visibility**: Adjusted the `glassShell` material to ensure it is visible on all faces, not just strictly where the light hits.
  - **Tuning**: 
    - Added faint `emissive` glow (`0x050200`) to prevent faces from disappearing in shadow.
    - Increased `opacity` (`0.1` -> `0.15`).
    - Reduced `shininess` (`90` -> `30`) to spread specular highlights across the entire face rather than a sharp point.
    - Enabled `flatShading: true` to distinctively emphasize the faceted icosahedron geometry.

## v1.915 - 2026-01-20
- **Visual Fix (Transparency)**:
  - **Glass Occlusion Fix**: Replaced the experimental `MeshPhysicalMaterial` (Transmission) with a stable `MeshPhongMaterial` (Alpha Blending) for the outer glass shell.
  - **Visibility Restoration**: Set `depthWrite: false` on the glass shell. This is a critical fix that forces the renderer to process the glass *after* the inner transparent circuitry, restoring the visibility of the glowing traces which were previously occluded by the depth buffer.

## v1.914 - 2026-01-20
- **Visual Enhancement (Glass Shell)**:
  - **Icosahedron Faces**: Added a subtle `MeshPhysicalMaterial` shell to the Icosahedron faces. This creates a faint "Glass" effect between the wireframe edges.
  - **Subtlety Tuning**: Configured with high transmission (`0.6`), low opacity (`0.1`), and low IOR (`1.2`) to ensure the central sphere remains clearly visible and the outer shell doesn't obstruct the view, just adds depth.

## v1.913 - 2026-01-20
- **Visual Repair (Finish)**:
  - **Matte Finish**: Switched the Central Sphere material to `MeshLambertMaterial`. This material significantly differs from Standard/Physical materials as it uses Gouraud shading with **zero specular highlights**, effectively guaranteeing the removal of the persistent "white ring" artifact while keeping the dark copper base color (`0x1a0b04`).

## v1.912 - 2026-01-20
- **Visual Repair (Artifacts)**:
  - **White Ring Removal**: Downgraded the Central Sphere material from `MeshPhysicalMaterial` to a rougher `MeshStandardMaterial`. Removed `clearcoat` entirely and increased roughness (`0.2` -> `0.6`) to eliminate the unwanted white specular rim highlight ("White Ring") while maintaining the dark copper aesthetic.

## v1.911 - 2026-01-20
- **Visual Repair (Illumination)**:
  - **Trace Illumination**: Implemented vertex-color animation for pure circuitry traces. When an electron pulse travels along a path, the entire trace segment now flashes bright Orange/Gold (`intensity: 1.0`) and fades out rapidly (`intensity *= 0.92`), creating the requested "brief second of illumination".
  - **Color Decay**: Added a decay loop to the animation frame to smoothly revert traces to their dark bronze base color after the pulse passes.

## v1.910 - 2026-01-20
- **Visual Cleanup**:
  - **Remove Chips**: Removed the square "motherboard chip" geometries. The user felt they looked weird and randomly placed. The circuitry traces remain, radiating from these invisible origin points, creating a cleaner "pure energy" look.
  - **Retained Density**: Kept the high density (90 clusters) and restored nodes from v1.909.

## v1.909 - 2026-01-20
- **Visual Repair (Coverage & Nodes)**:
  - **Circuitry Gaps**: Significantly increased `numChips` from 48 to **90** and increased pole-biased chips to 16. This provides much denser coverage across the sphere surface to eliminate "huge gaps".
  - **Node Restoration**: Restored the "Light Up Nodes" feature. Nodes (vertices) are now **visible at all times** as small dark copper spheres and light up (scale & emissive brightness) when in focus, fixing the issue of them being "too small" or invisible initially.
  - **Material Update**: Switched nodes to `MeshStandardMaterial` to support true emissive lighting effects.

## v1.908 - 2026-01-20
- **Visual Repair (Cleanup & Logic)**:
  - **Fixed Electron Traces**: Restored `addNodes` (formerly the outer vertices) but initialized them as **invisible** (`opacity: 0`). This ensures the `sphereActiveFactor` logic in the animation loop works correctly (fixing missing electrons) without rendering the unwanted "permanent green/gold dots".
  - **Circuit Separation**: Reduced `numChips` to `48` and `tracesPerChip` to `3-6` with longer path segments (`0.15` - `0.35`). This creates more distinct, separated "Circuit Lines" rather than a dense "Mesh" web, addressing the "mesh-like" feedback.
  - **Pole Coverage**: Maintained the biased distribution for North/South pole coverage to prevent gaps.

## v1.907 - 2026-01-20
- **Visual Repair (Cleanup & Coverage)**:
  - **Removed Artifacts**: Disabled the `addNodes` call (vertex spheres) and removed `pads` from chips. This eliminates the "four or five permanent green/gold dots" that were cluttering the view.
  - **Full Orb Coverage**: Increased `numChips` to `64` and implemented a biased distribution logic that forces 12 chips to spawn specifically in the North and South Pole regions.
  - **Pole Connectivity**: Relaxed the trace clamping from `0.1` to `0.01` radians, allowing circuitry lines to flow almost entirely to the geometric poles, fixing the "huge gaps" issue.

## v1.906 - 2026-01-20
- **Visual Repair (Electrons)**:
  - **Glowing Dots**: Reverted electron geometry to small points (`0.012` cube) and attached a **Glow Sprite** (Halo) to each one. This creates the requested "Glowing Dot" effect traversing the lines, rather than "long rectangles".
  - **Trace Visibility**: Kept the traces visible (`opacity: 0.3`) as requested, so the path pattern is evident.

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

## [v1.940] - 2026-01-21
- **Aesthetic**: Added PCB-style "Terminal Pads" (Circles) to the start and end of every parallel circuit trace.
- **Circuitry**: Increased bus density and tightened spacing for a "chip-like" appearance.
- **Refinement**: Aligned with reference images showing nodes at trace endpoints.

## [v1.944] - 2026-01-21
- **Circuitry Overhaul**: Implemented a "Grid Snapping" system for circuit traces. Lines now align perfectly to a 60x80 conceptual grid on the sphere.
- **Density**: Increased max buses to 90 and electron count to 120 for a high-density, complex look.
- **Aesthetic**: Traces are strictly parallel and form organized "data highways" rather than random wandering paths.

## [v1.948] - 2026-01-21
- **Visuals**: Implemented "Neuron Firing" animation on vertices. Nodes rest at a pale white state and randomly pulse effectively to a bright yellow-white (`0xffffaa`).
- **Logic**: Vertex pulsation is independent but blends with the existing viewport-proximity highlight system.

## [v1.949] - 2026-01-21
### Changed
- **Visuals**: Removed atmospheric glow shell (`meshShell`) from Icosahedron scene for a cleaner, "naked bulb" look.
- **Lighting**: Changed node firing color from warm yellow-white to cool LED white-blue (`0xaaddff`).
- **Animation**: Made node firing decay faster (0.9 factor) and removed sprite glows to simulate snappy LED behavior.

## [v1.950] - 2026-01-21
### Changed
- **Animation**: Tripled LED firing frequency (probability 0.02 -> 0.06).
- **Speed**: Doubled cooldown decay rate and shortened cooldown window (10-50 frames).
- **Snappiness**: Increased firing decay rate (0.75) for sharper on/off transitions.

## [v1.951] - 2026-01-21
### Changed
- **Visuals**: Reduced circuit grid density (PHI:60->45, THETA:80->60) to prevent trace clutter at small scales.
- **Trace Lines**: Darkened initial line color by 20% (`0x082e4b`) to improve contrast and reduce visual noise.
- **Complexity**: Reduced number of buses (90->65) and max lanes (4->3) for a cleaner, defined look.

## [v2.182] - 2026-01-22
### Fixed
- **Ring Visibility**: Restored the 2D SVG Halos by restacking the DOM. The 3D Scene is now explicitly laid out *behind* the SVG overlay (z-0 vs z-20) instead of nested inside it.
- **Controls Positioning**: Moved the "Standby / Power" control pill outside the aspect-constrained ring container. It now attaches to the main card (`.group/scene`), sitting at the bottom of the viewport/card window, ensuring it does not overlap the visualization.
- **Visual Scale**: Adjusted 3D camera distance (8.5 -> 10.5) to compensate for the full-container expansion, maintaining the illusion that the sphere fits strictly inside the inner ring.


## [2.187] - 2026-01-22
### Fixed
- **Ring Alignment**: Modified SVG text paths definitions to `r=320` used by the main Halo band (previously `r=325` was slightly off-center).
- **Text Centering**: Adjusted vertical offset (`dy=2`) for all labels to center them precisely within the Halo band width.
- **Visuals**: Aligned text ring to be concentric with the outer Dot markers (r=350) while residing inside the glow.
