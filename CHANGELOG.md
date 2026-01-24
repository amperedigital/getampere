# Changelog

## [v2.299] - 2026-01-24
### Design
- **Tech Demo v14 (Seamless Integration)**
    - Removed the CSS border from the floating action button entirely. The button now relies on the SVG socket stroke for its definition, eliminating the "double border" and "shadow" artifacts.
    - Added `stroke-linecap="round"` and `stroke-linejoin="round"` to the Bezier curve path, ensuring a smooth, continuous join where the socket meets the card body.
    - Slightly adjusted button background opacity to maintain presence as a distinct "plug" element without needing a stroke.

## [v2.293] - 2026-01-24
- **v2.293**: Design Perfection (Implemented "Half-Socket Tangency" (v9). Re-engineered the socket geometry to shift the button significantly closer to the edge (`right: 8px`) while maintaining the 8px internal padding halo. The socket curve now enters via a 16px fillet, wraps around the button (centered at 96,48), and exits vertically tangent to the right border. This creates a much tighter, deeper "bite" that effectively removes the long entrance tail and integrates the button fully into the corner silhouette).

## [v2.292] - 2026-01-24
- **v2.292**: Design Perfection (Implemented "Mathematically Tangent" Socket Geometry (v8). Solved the "curve doesn't complete" issue by recalculating the entire Bezier/Arc chain to be physically tangent. The path now flows from the top edge into a 16px Convex Fillet, then seamlessly into a 32px Concave Socket (centered perfectly at 80,48 to nest the button), and out via another 16px Convex Fillet to the right edge. This creates a true "Liquid S-Curve" that hugs the button with constant padding and zero visual breakage).

## [v2.291] - 2026-01-24
- **v2.291**: Design Perfection (Implemented "Geometric Stamp" Socket Geometry (v7). Refined the SVG socket path to use mathematically perfect tangent arcs. The shape now acts as a true boolean subtraction of the button shape from the card corner. Specifically: Straight Top Edge (0-64px) -> Convex Fillet (r=16) -> Concave Socket Arc (r=32) -> Convex Fillet (r=16) -> Straight Right Edge. This ensures the socket "cups" the button precisely with uniform padding and smooth transitions, eliminating the previous "wavy" or "long tail" appearance).

## [v2.290] - 2026-01-24
- **v2.290**: Design Perfection (Implemented "SVG Shell v6" Architecture. Solved all potential seam and gradient mismatches by moving to a pure-SVG container model. The entire card background, border, and socket cutout are now rendered within a single SVG element using standard `<mask/>` and `<rect/>` primitives. This guarantees pixel-perfect tangent continuity between the socket curve and the card body, with zero overlapping artifacts).

## [v2.289] - 2026-01-24
- **v2.289**: Design Perfection (Implemented "Socket Patch v5" Architecture. Solved the "overlapping border radius" visual glitches by switching to a Hybrid Clip-Path System. The main card body now strictly clips its top-right corner using a calculated polygon, and a 128x128px SVG patch is inserted into the void. This ensures zero border doubling and perfect tangent continuity for the socket curve/button cradle).

## [v2.288] - 2026-01-24
- **v2.288**: Stability & Design (Full Reconstruction of Tech Demo Grid. Replaced incremental patch scripts with a clean-sheet generation script (`rebuild_tech_demo.py`) that enforces "Liquid Socket v4" geometry (2rem fillets) while guaranteeing valid HTML structure. Resolved "Unexpected closing tag" errors by cleaning up legacy markup debris).

## [v2.287] - 2026-01-24
- **v2.287**: Design Perfection (Implemented "Tangent Socket" geometry. Used mathematically calculated SVG paths to create tangent-continuous fillets (curved corners) where the card border meets the button socket, eliminating the previous hard points. This creates the true "inverted corner" / "stamped" look requested. Fixed critical HTML structure issues).

## [v2.286] - 2026-01-24
- **v2.286**: Design Perfection (Implemented "Liquid Socket" geometry. Replaced hard-edged cutout with a mathematically smooth Bezier fillet that creates a seamless, liquid-like transition between the card border and the button socket. Used advanced SVG masking and path borders to eliminate all sharp corners).

## [v2.285] - 2026-01-24
- **v2.285**: Design Overhaul (Implemented "Crater Socket" geometry. Switched from simple masking to a calculated SVG-bordered crater layout. The button is now nested inside the card with perfect uniform padding, creating a distinct "stamped" appearance as requested).

## [v2.284] - 2026-01-24
- **v2.284**: Design Perfection (Implemented true "Socket Notch" aesthetic. Used Masked Gradients to create a perfectly concave corner cutout that cradles the floating action button, complete with a hairline SVG stroke to define the curved edge. Buttons are now nested in the void with uniform spacing).

## [v2.283] - 2026-01-24
- **v2.283**: Design Refinement (Implemented "Carved Notch" aesthetic. Updated all cards to use a large top-right inverse-style radius with a floating button filling the negative space, creating a "socketed" look).

## [v2.282] - 2026-01-24
- **v2.282**: Design Refresh (Applied "Organic Glass" aesthetic to all cards: Asymmetric corners (mirrored columns), gradient glass backgrounds, subtle borders, and circular action buttons. Maintained existing color palette).

## [v2.281] - 2026-01-24
- **v2.281**: Layout Adjustment (Reduced desktop card grid gap from `gap-8` (2rem) to `gap-4` (1rem) as requested).

## [v2.280] - 2026-01-24
- **v2.280**: Critical Repair (Fixed corrupted HTML markup in Cards 3, 4, 5, and 6 caused by previous failed edit. Restored full `rounded-3xl` and `lg:p-8` styling to all cards).

## [v2.279] - 2026-01-24
- **v2.279**: Visual Polish (Updated internal desktop card padding to `lg:p-8` (2rem) and confirmed grid spacing is `gap-8` (2rem) as requested).

## [v2.278] - 2026-01-24
- **v2.278**: Visual Polish & Repair (Fixed HTML corruption in Card 2, corrected its radius to `rounded-3xl` to match other cards).

## [v2.277] - 2026-01-24
- **v2.277**: Visual Correction (Fixed HTML corruption in Card 1, updated all card radii to standard `rounded-3xl` per user request, and removed `bg-white/5` from scene container to restore dark navy appearance while keeping border).

## [v2.276] - 2026-01-24
- **v2.276**: Visual Polish (Restored left scene container border/background, increased right container padding to `pr-12`, and standardized all card and container radii to `rounded-2xl`).

## [v2.274] - 2026-01-24
- **v2.274**: Desktop Layout Restoration & Polish (Reverted Scene background to transparent, updated `isMobile` logic to use Viewport width to prevent splitscreen desktop regressions, increased card radii to `rounded-[2rem]`, and restored desktop card gap to `gap-8`).
- **v2.273**: Responsive Fix (Updated resize handler and status gauge CSS to respect 1024px mobile breakpoint, ensuring valid layout on 820px iPad Air).
- **v2.272**: Tablet Breakpoint Fix (Synced JS mobile detection and CSS injections to 1024px to enforce Mobile Layout on iPad Mini/Tablets).
- **v2.271**: Visual Enhancement (Increased Inner Sphere size by 20% on mobile to improve visibility).
- **v2.270**: Mobile Standby Timer Fix (Added 'STBY IN' prefix and fixed countdown freeze bug by observing childList mutations).
- **v2.269**: Mobile Standby Timer Integration (Moved countdown into status pill to fix overlap, hidden large warning text on mobile).
- **v2.268**: Mobile Power Button Logic Fix (Standby/Off -> On, Active -> Off).
- **v2.267**: Mobile Logic Update (Sliders are now disabled and greyed out when system is not ACTIVE, mirroring desktop lock).
- **v2.266**: Mobile Layout Fix (Stacked sliders below neural net, removed overlap, increased neural net size via camera distance 4.5).
- **v2.265**: Mobile Slider Upgrade (Snapping 0-5 steps, live title updates, enhanced visual ticks) and Neural Net Resizing (reduced camera distance to 6.0 on mobile).
- **v2.264**: Mobile Redesign (Replaced rings with sliders, maximized neural net size, hidden markers/rings on mobile).
- **v2.263**: Layout fix (switched pt-12 to mt-12 on ring container to correctly push it down from overlay buttons).
- **v2.262**: Layout refinements (reduced grid gap to 0.5rem aka gap-2, added top padding to ring container on mobile).
- **v2.261**: Maximize card width (reduced container right padding to 1rem).
- **v2.260**: UI refinements (raised mobile controls to top-2, increased control spacing, reduced card grid gap to 1rem).
### Changed
- **Mobile Control Alignment**:
    -   **Horizontal Flow**: Refactored the Mobile Control Cluster from a vertical column (`flex-col`) to a single horizontal row (`flex-row`). The Status Pill now sits to the immediate left of the Power Button, creating a seamless "Status + Action" unit in the top-right corner of the scene.

## [v2.258] - 2026-01-24
### Changed
- **Mobile Control Layout**:
    -   **Re-Positioning**: Moved the Power Button and Status Pill *inside* the 3D scene container (`absolute top-4 right-4`). This places them directly overlaying the visualization area, closer to the Neuronet as requested, rather than floating in the header.
    -   **Visual Styling**: Updated the Power Button to use **Emerald/Green** styling when the system is ON (Active or Standby), contrasting with **Slate/Gray** when OFF. This replaces the previous Blue theme for the button itself.

## [v2.257] - 2026-01-24
### Changed
- **Mobile Mobile Controls Simplified**:
    -   **Control Cluster**: Replaced the previous 3-button design (Active, Standby, Off) with a **Single Power Toggle** button.
    -   **Power Logic**: Tapping the Power button toggles the system between `ACTIVE` and `OFF`. `STANDBY` mode is now handled exclusively by the automatic idle timer, removing the manual button.
    -   **Visual Feedback**: The Power button now glows blue when the system is On (Active or Standby) and dims to slate/grey when Off.
    -   **Status Pill**: Retained the Status Pill ("AI ONLINE", "STANDBY") to provide clear systemic feedback, especially for the auto-standby state.

## [v2.256] - 2026-01-23
### Changed
- **Mobile Header Refactor**:
    -   **Breadcrumb Placement**: Moved the breadcrumb navigation ("Visualization / V-Amp 2.0") to its own dedicated row at the very top. This prevents it from overlapping or fighting with the top-right control cluster on narrow screens.
    -   **Control Layout**: The control cluster now sits `justify-between` across from the Main Title only, ensuring proper alignment.
- **Visual Sizing**:
    -   **Neural Net**: Increased `mobileBoost` scaling to `3.2` (from 2.4). This forces the central icosahedron to render dramatically larger, counteracting the aggressive "fit-to-width" resize logic on mobile/portrait screens.

## [v2.255] - 2026-01-23
### Changed
- **Mobile Visual Balance**:
    -   **Vertical Spacing**: Shifted the 3D scene container from `-mt-4` (pull up) to `mt-4` (push down). This moves the entire visualization lower into the available whitespace, further separating the Halo Ring from the header text.
    -   **Container Sizing**: Slightly reduced height to `420px` to ensure the now-lower ring doesn't push the card grid off-screen.
    -   **Neuronet Scaling**: Drastically increased `mobileBoost` to `2.4`. This forces the central 3D network to render significantly larger, addressing the "too small/resizing" issue where the object appeared to shrink after load.

## [v2.254] - 2026-01-23
### Changed
- **Mobile Layout Fine-Tuning**:
    -   **Vertical Positioning**: Adjusted the 3D scene container margin to `-mt-4` and height to `440px`.
        -   *Goal 1*: Fix the overlap where the ring was cutting into the "Architecture" heading.
        -   *Goal 2*: Pull the bottom card grid up closer to the ring to reduce the "dead space" void.
    -   **Neuronet Sizing**: Increased `mobileBoost` scaling from 1.6 to 1.9. This significantly enlarges the central AI sphere/icosahedron relative to the Halo Ring, filling the inner void for a more "powerful" look.

## [v2.253] - 2026-01-23
### Changed
- **Mobile Interaction Fixes**:
    -   **Scroll Restoration**: Added `touch-action: pan-y` to the Halo Ring SVG. This forces the browser to allow vertical page scrolling even when the user touches the active ring area, fixing the "Scroll Locked" sensation.
    -   **Live Demo Pill**: Hidden on mobile (`hidden lg:inline-flex`) to declutter the header area as requested.
- **Layout Adjustments**:
    -   **Vertical Spacing**: Increased scene negative margin to `-mt-24` and set height to `480px` to pull the 3D visualization even higher, reducing the black void between the header and the cards.
    -   **Chat Widget Clearance**: Added `pb-40` (padding-bottom) to the card grid container on mobile. This ensures users can scroll the bottom cards into view without them being obstructed by the "Ready to chat?" widget.

## [v2.252] - 2026-01-23
### Added
- **Mobile-Specific Controls**: Introduced a specialized mobile header control cluster in the top-right corner.
    -   **Compact Toggle Buttons**: Replaced the large bottom track slider with three distinct icon buttons (Play/Active, Pause/Standby, Power/Off) for easier thumb access.
    -   **Integrated Status**: Added a "Status Pill" (e.g., "AI ONLINE") directly above the buttons to provide immediate system feedback in the same visual zone.
### Changed
- **Mobile Interaction**:
    -   **Touch Drag Enabled**: Removed the mobile guard in `halo-rotator.js`, allowing users to drag the Halo Ring via touch on small screens.
    -   **Legacy UI Hidden**: Set the bottom slider track and status text to `display: none` on mobile to declutter the 3D scene view. Reflowed the "Standby Warning" text to a safe zone (`bottom: 15%`).
    -   **Visuals**: Reduced mobile button sizes and used backdrop-blur for a "floating glass" aesthetic.

## [v2.251] - 2026-01-23
### Changed
- **Mobile Layout & Sizing**:
    -   **Vertical Compactness**: Reduced Mobile Scene container height from 480px to 420px and added `-mt-12` margin-top to pull it visually inside the header's whitespace.
    -   **Header Padding**: Reduced bottom padding on mobile header to zero to minimize gap.
    -   **Neural Net Sizing**: Increased `mobileBoost` scaling factor from 1.3 to 1.5, making the central AI visualization significantly clearer on small screens.
    -   **Buttons**: The layout tightening naturally brings the buttons up; ensured they occupy the bottom zone of the now-tighter container.

## [v2.250] - 2026-01-23
### Changed
- **Mobile UX Refinements**:
    -   **Full-Width Layout**: Removed the inset container constraints (`rounded`, `border`, `bg-white`) on mobile. The 3D scene now spans the full `w-full` for maximum size, while maintaining a fixed height (`480px`). This maximizes the Neuronet visibility.
    -   **Interactive Ring**: Re-enabled touch-drag on the Halo Ring for mobile. (Note: This may interact with scrolling, but prioritizes "playfulness" as requested).
    -   **Larger Fonts**: Increased SVG Ring labels from `text-xs` to `text-sm` for better readability on small screens.
    -   **Layout Tweaks**:
        -   Increased Halo size logic on mobile (`mobileBoost = 1.3`) to make the central Neural Net 30% larger.
        -   Moved the Power UI/Track up to `bottom: 40px` and the Status Text to `bottom: 100px` to prevent overlap with the bottom edge of the new container and each other.

## [v2.249] - 2026-01-23
### Changed
- **Mobile Container Styles**:
    -   Restored the "inset screen" aesthetic on mobile by adding `bg-white/5` and `border-white/5` to the 3D scene container.
    -   Removed `overflow-hidden` from the `body` tag on mobile to allow correct vertical scrolling.
    -   Adjusted `tech-demo-scene.js` to position the Standby/Power UI pill at `bottom: 20px` on mobile (up from implicit values) to ensure it sits safely inside the new 450px container.
- **Scroll Interaction Fix**:
    -   Updated `halo-rotator.js` to strictly disable `wheel` and `pointerdown` interactions on screens narrower than 1024px. This gives "Page Scroll" priority over "Ring Rotation" on mobile/tablet devices, fixing the "Scroll Locked" issue.
- **Cleanup**: Commented out resize debug logs.

## [v2.247] - 2026-01-23
### Changed
- **Mobile Layout Overhaul**:
    -   Converted Mobile Header from `absolute` (overlapping) to `relative` (block flow), pushing the 3D scene down.
    -   Changed Main Wrapper to `min-h-screen` instead of `h-screen` on mobile to allow natural scrolling.
    -   Restructured 3D Scene Container on mobile to be a fixed-height (`450px`) relative block instead of an absolute inset, preventing it from being squashed or covered by text.
    -   Ensured Grid Cards flow naturally below the 3D scene.
- **Debug Logging**: Added detailed console logging for `resizeObserver` and window dimensions to investigate layout thrashing loop.

## [v2.245] - 2026-01-23
### Fixed
- **Three.js Resize Loop**: Patched a critical layout thrashing issue where the WebGL canvas would recursively shrink the container ("clog") by feeding pixel values back into a `width: auto` flex/absolute layout. Decoupled internal buffer size from DOM style (fixed to `100%`).
- **Tech Demo Scene**: `renderer.setSize` now uses `updateStyle: false` to prevent JS interference with CSS grid/aspect-ratio calculations.

## [v2.244] - 2026-01-23
### Fixed
- **Grid Clipping (Safeguard)**: Increased the desktop Grid `min-h` constraint from `700px` to `850px`.
    - **Issue**: Users reported card clipping on screens ~740px high, indicating that the 700px floor was too low to accommodate the content of 3 stacked rows.
    - **Fix**: The new 850px floor guarantees ~283px per card row, ensuring content integrity. On screens shorter than 850px, the grid will now overflow properly and trigger the container's vertical scrollbar.

## [v2.243] - 2026-01-23
### Fixed
- **Grid Clipping**: Added a `min-h-[700px]` constraint to the desktop Grid container.
    - **Logic**: Previously, the `h-full` + `grid-rows-3` directive forced the cards to shrink indefinitely on short screens (< 800px height), causing content clipping.
    - **Fix**: The grid now respects the viewport height *until* it hits 700px. Below that, it refuses to shrink further and enables the parent container's scrollbar (`overflow-y-auto`), ensuring cards remain readable even on short landscape windows.

## [v2.242] - 2026-01-23
### Added
- **Conversation AI**: integrated ElevenLabs Convai widget (`agent_4501ka281xkpe6e8jzbspgy9qh4d`) to the tech demo page.

## [v2.241] - 2026-01-23
### Fixed
- **Scroll/Resize Logic**: Fixed a regression where the "Auto-Recenter" idle timer would pull the camera back to its *initial* non-responsive position (Z=13.0) instead of the *current* responsive position (e.g., Z=9.0).
    - **Fix**: The `handleResize` method now updates `this.initialCameraPos` with the newly calculated optimal Z-distance. This ensures that when the idle animation kicks in, it returns the camera to the *correct size* for the current screen aspect ratio, preventing the "Resize to Small" glitch.

## [v2.240] - 2026-01-23
### Added
- **Debugging**: Added verbose console logging to the 3D Scene `resize` handler to track exactly when and why the scene dimensions are changing (e.g., triggered by `Init` or `ResizeObserver`). This will help identify the source of the "2ms post-load shrink" issue.

## [v2.239] - 2026-01-23
### Fixed
- **Responsive Stability**: Switched from `window.resize` to `ResizeObserver` for the 3D scene. This eliminates the "auto-resize" conflict where the scene would initially render correctly but then snap to the wrong size due to delayed layout shifts (e.g., flexbox adjustments).
- **Precise Sizing**: Updated the Trigonometric scaling target from 90% to **95% of the Inner Ring Diameter**, exactly matching the user requirement. This brings the Neural Net closer to the ring boundary while maintaining perfect containment.

## [v2.238] - 2026-01-23
### Fixed
- **Responsive 3D Scaling (Final)**: Replaced heuristic distance math with a strict Trigonometric calculation to lock the 3D Neural Net size to exactly **90% of the Inner Ring's diameter** at all times.
    - **Logic**: Calculates the precise Camera Distance required such that the 3D Object (Height 3.0 units) occupies exactly 45% of the viewport dimension (matching the SVG Ring's 400px/800px ratio).
    - **Aspect Handling**: Dynamically switches calculation base between Height (Landscape) and Width (Portrait) to account for the SVG's `object-fit: contain` behavior, ensuring accurate sizing on all screen shapes.

## [v2.237] - 2026-01-23
### Fixed
- **Responsive 3D Scaling (Refined)**: Implemented a dual-factor sizing capability to address conflicting requirements between Full Screen and Short Height views.
    - **Base Distance**: Increased to `13.0` to provide the requested ~1.5rem "breathing room" between the Neural Net and the Inner Ring on standard layouts.
    - **Height Compensation**: Added a dynamic logic that zooms IN (reduces distance) by up to 20% on short screens (Height < 800px). This prevents the "Too Much Space" issue where the fixed pixel gap felt disproportionately large on smaller viewports.

## [v2.236] - 2026-01-23
### Fixed
- **Responsive 3D Scaling**: Corrected the base `cameraDistance` to `10.0` (previously 6.0 in v2.235 was too aggressive/close). This ensures the neural net sits comfortably inside the inner ring in standard Aspect Ratio 1:1 scenarios, while the new math (added in v2.235) correctly handles zooming out for tall screens.

## [v2.235] - 2026-01-23
### Fixed
- **Responsive 3D Scaling**: Implemented specific aspect-ratio math in `handleResize` to ensure the 3D object maintains a constant visual size relative to the Ring, regardless of whether the viewport is tall (Portrait) or wide (Landscape).
    - **Logic**: If Aspect < 1 (Tall), Camera Distance is increased by factor `1/aspect` to counteract the fixed vertical FOV, preventing the object from growing relative to the width-constrained ring.
    - **Config**: Reduced base `cameraDistance` to `6.0` to fill the ring nicely on standard/wide screens, relying on the new math to handle tall screens automatically.

## [v2.234] - 2026-01-23
### Changed
- **Visual Scaling**: Further increased `cameraDistance` from `9.5` to `12.0` to significantly shrink the 3D Neural Net visualization, ensuring it remains fully contained within the tighter Inner Ring diameter without visual clipping or overcrowding.

## [v2.233] - 2026-01-23
### Fixed
- **Responsiveness**: Forced the Right Grid to expand vertically (`h-full` and `grid-rows-3`) on desktop screens, ensuring it matches the height of the left-side 3D Scene container.
- **Card Expansion**: Added `h-full` to all 6 Agent Card containers to ensure they stretch to fill their grid cells properly.

## [v2.232] - 2026-01-23
### Fixed
- **Responsiveness**: Solved issue where the Neural Net visualization could "bleed" horizontally outside the ring on short-but-wide screens breakdown.
    - **Clip Path**: Applied `clip-path: circle(closest-side at center)` to the `#tech-demo-scene` container. This enforces a strict circular mask matching the smallest dimension, ensuring the 3D scene always aligns perfectly with the SVG ring overlay, even if the parent container aspect ratio distorts to a "pill" shape due to flex constraints.

## [v2.231] - 2026-01-23
### Changed
- **Ring Content**: Updated Outer Ring label at Index 2 from `Transfer` to `Human Handoff` for clarity.

## [v2.230] - 2026-01-23
### Fixed
- **Responsiveness**: Fixed an issue where the Neural Net visualization could overlap the inner ring container on short height screens.
    - **Camera Distance**: Increased `cameraDistance` from `7.6` to `9.5` (Zoom Out) to ensure the 3D Icosahedron fits comfortably inside the newly tightened inner ring diameter (v2.228).
    - **Container Constraints**: Added `max-h-full` to the master aspect-square container to prevent it from exceeding the viewport height if `w-full` dominates on certain aspect ratios.

## [v2.229] - 2026-01-23
### Changed
- **Ring Visualization**: Updated Inner/Outer ring content mapping.
    - **Outer Ring**: Updated labels to represent core technical capabilities:
        1. Memory Function
        2. Transfer
        3. Agent Transfer
        4. OTP Authorization
        5. Identity & Handoff
        6. Calendar Booking

## [v2.228] - 2026-01-23
### Changed
- **Ring Visualization**: Increased the curvature of the ring labels by ~7-8% to better align with the circular tracks.
    - **Outer Ring**: Reduced path radius from `275` to `255`, offset text `dy` from `-12` to `-32` to maintain visual position while increasing text curvature.
    - **Inner Ring**: Reduced path radius from `205` to `190`, offset text `dy` from `-12` to `-27`.

## [v2.227] - 2026-01-23
### Fixed
- **Standby Logic**: Fixed an issue where the Standby Timer would continue counting down even while the user was interacting with the canvas/scene. Added global event listeners (`mousemove`, `click`, `touch`, `scroll`) to the entire document to ensure `lastInteractionTime` is correctly updated on any activity.

## [v2.226] - 2026-01-23
### Refactored
- **Tailwind Cleanup**: Enforced strict utility-first CSS by replacing legacy custom classes (`.ring-text-*`) with inline Tailwind classes for the SVG Ring Visualization.
- **Code Hygiene**: Removed obsolete `<style>` blocks associated with the old ring typography.
- **Code Hygiene**: Removed redundant in-browser Tailwind CDN scripts (production build utilizes `styles.css`).
- **Code Hygiene**: Updated `tech-demo-scene.js` and `halo-rotator.js` to utilize full Tailwind string injection instead of partial class composition.

## [v2.225] - 2026-01-23
### Skipped
- Internal build tag.

## [v2.224] - 2026-01-23
### Changed
- **Ring Typography**: Increased font size of the curved ring text for better legibility at a distance (`10px` -> `12px`).

## [v2.223] - 2026-01-23
### Changed
- **Ring Visualization**: Updated the Inner Ring labels to match the new Agentic System Roles created in v2.217.
    - `Optimization` -> `Front Door Agent`
    - `Neural Config` -> `Demo Guide`
    - `Latency` -> `Onboarding`
    - `Throughput` -> `Tech Specialist`
    - `Diagnostics` -> `Sales Advisor`
    - `Analysis` -> `Booking Agent`

## [v2.222] - 2026-01-23
### Fixed
- **Tech Demo UI**: Further refined UI positioning to prevent overlap with the 3D ring on all resolutions.
    - **Vertical Shift**: The 3D Ring container is now translated upwards (`translate-y-[-12]`) on desktop, actively clearing the bottom of the screen.
    - **Compact Stack**: Tightened the vertical spacing between the Power Graph, Standby Warning, and Control Slider (aligned at `bottom: 100px` and `bottom: 40px` respectively) to sit comfortably in the newly created vacant space.

## [v2.221] - 2026-01-23
### Fixed
- **Tech Demo UI**: Resolved issue where UI controls (Power Up/Down buttons) were floating on top of the 3D ring visual.
    - **Layout**: Reduced Desktop Ring Container height to `85%` to create a dedicated gutter at the bottom of the screen.
    - **Positioning**: Lowered the UI Controls (`#ampere-ui-track`) from `110px` to `50px` to sit comfortably in the new gutter, clearing the visual.

## [v2.220] - 2026-01-23
### Fixed
- **Tech Demo Responsiveness**: Fixed layout issues on shorter desktop screens.
    - **Scene Container**: Updated the main 3D Ring container to use `h-full w-auto` on desktop, ensuring the circle scales down to fit the viewport height instead of getting clipped.
    - **Right Grid**: Enabled `overflow-y-auto` on the right column for shorter screens to prevent content cutoff.
    - **Mobile**: Enabled vertical scrolling on the main wrapper.

## [v2.219] - 2026-01-23
### Changed
- **Agent Grid Typography**: Refined the Dense Metrics UI cards based on design review.
    - **Titles**: Removed bold weight for a cleaner look (`font-normal`).
    - **Subtitles**: Increased font size for better readability (`text-[10px]` -> `text-xs`).

## [v2.218] - 2026-01-17
### Added
- **Dense Metrics UI**: Completely redesigned the Agent Grid cards to serve as dense data dashboards.
    - **Header Update**: Title moved left, Icon moved top-right.
    - **Data Grid**: Implemented a 3-column / 6-row metrics grid for each agent.
    - **Visualization**: Added CSS-based sparklines/progress bars for each metric row.
    - **Content**: Populated each agent with role-specific "live" data points (e.g., Conversion Rates for Sales, Ticket Resolution for Tech).

## [v2.217] - 2026-01-17
### Added
- **UI Agents Grid**: Replaced the right-hand stats grid with a 6-card grid representing the Agentic System Roles:
    - **Front Door Agent**: Reception/Routing
    - **Demo Guide**: Feature Walkthrough
    - **Onboarding Coach**: Setup Assistance
    - **Technical Specialist**: Troubleshooting
    - **Sales Advisor**: Pricing/Enterprise
    - **Booking Agent**: Scheduling
    - *Each card features a unique colored icon and role description.*

## [v2.216] - 2026-01-17
### Added
- **Activation Feedback**: The static top needle indicator now turns Green (Emerald) when both rings are aligned and stable ("Activated"), and Blue when adjusting ("Scanning"). This provides visual confirmation of the system state.

## [v2.215] - 2026-01-17
### Changed
- **Neuronet Visuals**: Further reduced the brightness of the active "firing" nodes to minimize visual distraction.
    - Reduced firing intensity multiplier (1.5 -> 0.8).
    - Lowered halo opacity cap (0.3 -> 0.25).

## [v2.214] - 2026-01-17
### Changed
- **Neuronet Visuals**: Reduced the intensity and brightness of the firing node lights to be less distracting. 
    - Lowered base color saturation and lightness.
    - Reduced firing intensity multiplier (5.0 -> 2.0).
    - Reduced proximity flare intensity.
    - Lowered halo opacity cap.

## [v2.213] - 2026-01-17
### Changed
- **Neuronet Size Adjustment**: Further increased camera distance to `7.6` to refine the spacing between the neuronet and the inner ring.


## [v2.212] - 2026-01-17
### Fixed
- **Active State Highlighting**: Fixed logic in `HaloRotator` to correctly highlight the 12 o'clock item for rings with custom interval counts (like the 6-item inner ring). It now calculates steps based on `snapInterval` rather than a hardcoded 30 degrees.
- **Inner Ring Styling**: Updated `rotatorInner` configuration to properly toggle between `fill-slate-400` (inactive) and `fill-emerald-500` (active), ensuring the active item illuminates green as requested.

## [v2.211] - 2026-01-17
### Changed
- **Neuronet Size Adjustment**: Increased camera distance from `7.2` to `7.4` to fix persistent overlapping with the inner ring.

## [v2.210] - 2026-01-17
### Changed
- **Neuronet Size Adjustment**: Increased camera distance from `6.9` to `7.2` to ensure the central neuronet fits comfortably inside the inner ring without overlap.

## [v2.209] - 2026-01-17
### Changed
- **Neuronet Size Adjustment**: Slightly increased camera distance to `6.9` (was 6.8) to further reduce the visual size of the central neuronet, ensuring better clearance from the inner ring.

## [v2.208] - 2026-01-17
### Fixed
- **Power State Logic**: Restored "Halo Dimming" functionality for OFF/STANDBY states. `HaloRotator` now explicitly toggles the `.halo-dimmed` class on the SVG root.
- **Inner Ring Alignment**: Rotated inner ring items to visually align with the outer ring snaps (12, 2, 4... o'clock).
- **Neuronet Size**: Reduced visible scale by increasing camera distance to `6.8` (from 6.4) to preventing overlapping with the inner ring.

### Changed
- **Inner Ring Style**: Changed from Purple/Violet to **Slate/Silver** (`text-slate-300`, `stroke-slate-500`) for a cleaner, more structural look that complements the blue without being "overdone".

## [v2.207] - 2026-01-17
### Added
- **Dual Halo Interaction**: Split the single rotary dial into two concentric, independently interactive rings to support future "Data Pairs" logic.
  - **Outer Ring (Blue)**: Contains even indices (0, 2, 4...) [Data Sources, Encryption, Protocol, etc.]. Radius 300px.
  - **Inner Ring (Purple/Slate)**: Contains odd indices (1, 3, 5...) [Optimization, Neural Config, Latency, etc.]. Radius 230px.
  - **Separate Hit Testing**: Refactored `HaloRotator` to support `hitMin` and `hitMax` options. The scene now instantiates two rotators:
    - Outer: Mouse > 265px from center.
    - Inner: Mouse < 265px from center.
  - **Visuals**: Distinct coloring (Blue vs Violet) for rings and markers to improve visual separation.
- **SVG Structure Update**: Replaced the monolithic `#halo-rotary-dial` group with separating `#halo-ring-outer` and `#halo-ring-inner` groups in `tech-demo.html`.

## [v2.206] - 2026-01-17
### Changed
- Refined Power Sequence visual states (colors/opacity).

## [v2.205] - 2026-01-17
### Added
- Power Sequence logic (Off -> Boot -> On).

## [v2.204] - 2026-01-17
### Changed
- Centered halo element in container.

## [v2.203] - 2026-01-17
### Fixed
- Dot clipping issues on edges.

## [v2.200] - 2026-01-17
### Changed
- Text direction and alignment updates.

## [v2.199] - 2026-01-17
### Fixed
- Text direction logic.

## [v2.197] - 2026-01-17
### Fixed
- Background interaction bug fixes.

## [v2.196] - 2026-01-17
### Added
- Improved interaction model for rotary dial.

## [v2.195] - 2026-01-17
### Changed
- Adjusted ring width parameters.

## [v2.194] - 2026-01-17
### Added
- Markers to SVG ring.

## [v2.193] - 2026-01-17
### Added
- Initial markers implementation.
