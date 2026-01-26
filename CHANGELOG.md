# Changelog
## [v2.413] - 2026-01-25

### Fixed
- **Close Icon Alignment**: Fixed an issue where the "X" close icon appeared tiny and off-center in the top-right button.
  - Updated `card-expander.js` to dynamicallly manage SVG `viewBox` attributes.
  - Switched to a standard 24x24 Material Design "Close" path.
  - Implemented state preservation for original icon `viewBox` (restoring 32x32 sockets correctly).

## v2.412_remove_bounce (2026-01-25)
### Changed
- **Animation Feel**: Updated the expansion easing curve from `Spring Pop` (overshooting) to `Expo Ease Out` (`cubic-bezier(0.19, 1, 0.22, 1)`). This eliminates the bounce/rebound effect, resulting in a smooth, confident "magnetic" lock-in feel.

## v2.411_fix_syntax_and_safety (2026-01-25)
### Fixed
- **JavaScript Syntax Error**: Removed a duplicate block of code in `card-expander.js` that caused an `Identifier 'topRightBtn' has already been declared` error, restoring card functionality.
### Added
- **Safety**: Added `scripts/validate_js.sh` to the publishing pipeline. This tool uses `node --check` to verify the syntax of all JavaScript files in `deploy/` before a release can proceed, preventing Syntax Errors from reaching production.

## v2.410_fix_syntax_error (2026-01-25)
### Fixed
- **JavaScript Sytax Error**: Fixed a stray closing brace `}` inside the `collapse` function of `card-expander.js` which was prematurely closing the method, leaving subsequent code (like `this.activeCard = null`) executing in class body scope, causing `Uncaught SyntaxError: Unexpected token '.'`.

## v2.409_fix_scrolling_expansion (2026-01-25)
### Fixed
- **Scroll-Aware Expansion**: Cards now expand correctly even when the list is scrolled. Previously, the expansion calculation did not account for `scrollTop` in the `absolute` positioning logic, causing cards to jump to the top of the content (often out of view) or break completely.
- **Scroll-Aware Collapse**: Fixed the return animation to ensure the card flies back to the correct specific slot in the scrollable list.
- **CSS Architecture**: Consolidated `.socket-card-container.is-expanded` rules and removed `!important` from positioning properties to allows JavaScript to dynamically set the correct Top/Left values matching the user's scroll position.

## v2.408_flip_collapse (2026-01-25)
### Fixed
- **Animation Glitches**: Implemented full bidirectional FLIP (First-Last-Invert-Play) animation logic.
  - **Expand**: Locks card to grid position via inline styles before releasing to CSS class, preventing "width snap".
  - **Collapse**: Calculates the exact position of the "spacer" and animates the card from full-screen back to those coordinates before returning it to the grid flow. This solves the "doesn't pop back in place" issue where the card would instantly snap without transitioning.

## v2.407_flip_and_vis (2026-01-25)
### Fixed
- **Mobile Triggers**: Expand buttons are now `opacity-100` by default on mobile (hidden only on desktop until hover), fixing the "missing hover" issue on touch devices.
- **Animation Logic (FLIP)**: Implemented "First Last Invert Play" (FLIP) logic in `card-expander.js`. The card now measures its start position in the grid and explicitly animating from those coordinates to the full-screen insets, effectively preventing the "width snap" and "bottom bounce" visual glitches. Use of `requestAnimationFrame` ensures the browser registers the start frame before expanding.

## v2.406_easing_fix (2026-01-25)
### Fixed
- **Animation missing**: Added explicit `transition-duration: 0.6s` to `.socket-card-container` in CSS. Previously, only the timing function was defined, resulting in instant (0s) transitions that made the "Spring Pop" effect invisible.

## v2.405_fix_sockets (2026-01-25)
### Fixed
- **Glass Socket Initialization**: corrected JS selector syntax (`.socket-card-container` vs `.socket-card-container @container`) which caused the socket SVG path generator to fail on load, resulting in "lost" card shapes.


## [v2.357_control_overlap_fix] - 2026-01-25
- **v2.404_ease_and_polish**
  - **Visuals**: Added "Spring Pop" easing (`cubic-bezier(0.34, 1.56, 0.64, 1)`) to the expansion animation for a more tactile feel.
  - **Styles**: Activated dark mode scrollbars (`tailwind-scrollbar`) for all scrollable panels.
  - **Interaction**: Fixed the Close (Top-Right) button sticky-hover state when in Expanded Mode.
  - **Responsive**: Applied active Container Query classes (`@lg:text-sm`, `@lg:gap-y-6`) to the Metric Grids. Content now scales up significantly when expanded.
- **v2.403_container_queries_align**
  - **Mechanics**: Implemented CSS Container Queries (`@container`) scaffolding for auto-scaling card content (Grids, Charts, Typography) when expanded.
  - **Fixed**: Solved Layout Shift bug where the expanded card (absolute overlay) did not perfectly align with the underlying grid column.
  - **CSS**: Standardized Desktop Grid Padding and Expanded Card Insets to `2rem (Top/Bottom)` and `1.5rem (Left/Right)` for pixel-perfect overlays.
- **v2.402_bottom_right_trigger**
  - **UX**: Separated "Expand" and "Close" controls.
    - **Expand**: New floating button at Bottom-Right of each card (Maximize icon). Only appears on hover.
    - **Close**: Top-Right button (was previously dual-purpose). Now transforms to "X" only when the card is expanded.
  - **Visuals**: Reverted Top-Right button to the original brand Socket Logo when collapsed.
  - **Logic**: Updated `card-expander.js` to handle the dual-trigger workflow (Expand from Bottom, Close from Top).
- **v2.401_intuitive_triggers**
  - **UX Improvement**: Replaced the generic Socket Brand icon on card buttons with a "Maximize" (Corner Brackets) icon to clearly indicate the expand function.
  - **Interaction**: Added `cursor-pointer` and `hover:bg-white/5` (white glow) to the button trigger for better affordance.
  - **Logic**: The `card-expander.js` system automatically adapts to this change (it stores the new Maximize icon as the 'original' state to restore upon closing).
- **v2.400_focus_mode_cards**
  - **Feature**: Added "Zen Mode" Card Expansion. Clicking the top-right button on any grid card now expands it to fill the entire column.
  - **Interaction**: Uses a "Lift & Fill" technique (Spacer insertion) to ensure the underlying grid layout does not shift or collapse.
  - **Visuals**: Other cards fade out (`opacity: 0`) to provide focus. The expanded card respects the 1.5rem responsive gutters.
  - **Resizing**: The generated socket path (glass effect) automatically redraws to match the new dimensions via the existing ResizeObserver.
- **v2.368_responsive_gutters_fix**
  - **Fixed**: Solved horizontal overflow and clipping on Small Desktop/Landscape Tablet (820px-1024px).
  - **CSS**: Applied `width: calc(100% - 3rem)` to `#tech-demo-scene-container` to compensate for the `left: 1.5rem` offset in relative layout mode.
  - **Layout**: Unified page gutters to `1.5rem` (Header, Scene, Cards) for consistent alignment in this range.
## [v2.367_universal_tablet_positioning] - 2026-01-25
### UI & Visuals
- **Tech Demo v15.67 (Universal Tablet Positioning)**
    - **Logic Refinement**:
        - **Change**: Removed `and (orientation: portrait)` from the Tablet Positioning Media Query (820px - 1024px).
        - **Impact**: Landscape Desktops and Tablets in this width range now *inherit* the "Lifted" control layout (3rem lift), rather than falling back to the unstyled flow.
        - **Target**: Resolves the "dead zone" reported between 820px and 1023px on Desktop, ensuring the Mobile UI is fully active and positioned.
    - **iPad Pro Context**: The specific override for iPad Pro (1024px Portrait -> 9rem lift) remains active and takes precedence for that specific device state.
## [v2.366_height_independence] - 2026-01-25
### UI & Visuals
- **Tech Demo v15.66 (Height Independence)**
    - **Logic Refinement**:
        - **Maintain**: The unified Width Layout (1024px triggers Mobile Mode) remains active.
        - **Correct**: Removed the forced `height: 100vh` from the unified block.
        - **Reasoning**: While widths (layout columns) should match, viewport heights differ vastly between an iPad Pro (Tall) and a Landscape Laptop (Short). Forcing 1024px desktops to 100vh often cuts off content.
        - **Implementation**: The master container reverts to `min-height: 100vh` (Tailwind default) but allows auto-expansion. The specific `height: 100%` override on columns is removed to let them grow naturally with content.
## [v2.365_unified_tablet_desktop_1024_retry] - 2026-01-25
### UI & Visuals
- **Tech Demo v15.65 (Deploy Retry)**
    - **Note**: Retry of v2.365 due to Cloudflare API 502 error.
    - **Logic**: (Same as v2.365) Unified 1024px layout strategy with full-height enforcement.
## [v2.365_unified_tablet_desktop_1024] - 2026-01-25
### UI & Visuals
- **Tech Demo v15.64 (Unified 1024px Layout Strategy)**
    - **Philosophy**: Simplified the responsive logic for the 1024px break point.
        - **Goal**: Make "Desktop 1024px" and "iPad Pro 1024px" behavior identical to resolve fragility.
        - **Implementation**:
            - **Height**: Reverted `#tech-demo-master` to `height: 100vh` (App-like full height) for the <= 1024px range. This restores the full-screen "Command Center" feel for iPad Pro and comparable desktops.
            - **Columns**: Forced Left and Right columns to `height: 100%` to ensure the dark backgrounds and card grids extend fully to the viewport edges, preventing the "cutoff" look seen in screenshots.
            - **Scroll Safety**: Maintained `overflow-y: auto` on the master container so that strictly shorter screens in this width range can still scroll if content overflows, but standard Tablets/Pro Desktops will fit snugly.
## [v2.364_reinclude_ipad_pro_base] - 2026-01-25
### UI & Visuals
- **Tech Demo v15.63 (iPad Pro Base Layout Restoration)**
    - **Logic Correction**:
        - **Revert**: Changed the Tablet Portrait Positioning query range back to `max-width: 1024px` (was 1023px).
        - **Reason**: iPad Pro (1024px) relies on this query for essential layout properties (Gutters, Live Demo Pill position, Controls Target base). Excluding it caused those elements to break.
        - **Conflict Resolution**: The slider position (`bottom: 3rem` in this block) is successfully overridden by the specific 1024px rule (`bottom: 9rem`) added in v2.363, because the specific rule appears later in the cascade.
## [v2.363_ipad_pro_specific] - 2026-01-25
### UI & Visuals
- **Tech Demo v15.62 (iPad Pro Specific Fix)**
    - **Control Positioning**:
        - **Targeted Adjustment**: Added a specific CSS rule for `(width: 1024px) and (orientation: portrait)`.
        - **Action**: Applied `bottom: 9rem` *only* to this iPad Pro viewport, restoring the "Lifted" look that fits the taller screen.
        - **Context**: Other devices (820px-1023px) remain at the safer `3rem` (or standard flow) to prevent desktop overlaps.
    - **Visuals**:
        - **Correction**: Reverted `#mobile-sliders-container` background to `bg-transparent` (from slate-950), restoring the intended aesthetic.
## [v2.362_exclude_ipad_pro] - 2026-01-25
### UI & Visuals
- **Tech Demo v15.61 (iPad Pro Exclusion)**
    - **Positioning Logic**:
        - **Change**: Restricted the "Tablet Portrait Lift" media query to `max-width: 1023px` (previously 1024px).
        - **Effect**: Specifically excludes iPad Pro 12.9" / 11" (which report typically as 1024px width in portrait) from the "Lifted" layout controls that were adjusted in v2.361.
        - **Result**: iPad Pro now falls back to the standard flow positioning for controls (beneath the scene), avoiding the verified overlaps caused by the 3rem lift.
## [v2.361_ipad_pro_fix] - 2026-01-25
### UI & Visuals
- **Tech Demo v15.60 (iPad Pro Adjustment)**
    - **Positioning Update**:
        - **Fix**: Reduced the vertical lift of `#mobile-sliders-container` from `9rem` to `3rem` in the Tablet Portrait media query (820px-1024px).
        - **Reason**: The previous 9rem lift was excessive for iPad Pro, causing the controls to overlap the scene. 3rem provides sufficient clearance while keeping controls accessible.
## [v2.360_layout_safety] - 2026-01-25
### UI & Visuals
- **Tech Demo v15.59 (Layout Safety & flow)**
    - **Visual Clarity**:
        - **Mobile Sliders**: Changed background from `transparent` to `bg-slate-950`. This ensures that in any edge case where controls might overlap the Scene (e.g., extremely short windows), they obscure the underlying Neural Net rather than blending confusingly with it.
    - **Scroll & Flow Logic (The "Short Desktop" Fix)**:
        - **Issue**: On 820px-1024px Desktop screens with short height (Landscape), the "App-Style" fixed height (`h-screen`) forced content to clip or overlap because vertical space ran out.
        - **Fix**: For all screens under 1024px, we now force `height: auto` and `overflow-y: auto` on the Master Container and Left Column.
        - **Result**: The page mimics a scrolling website on these devices, allowing the Neural Net and Sliders to stack naturally without crashing into each other, regardless of viewport height.
## [v2.359_safe_tablet_lift] - 2026-01-25
### UI & Visuals
- **Tech Demo v15.58 (Safe Tablet Positioning)**
    - **Logic Refinement**:
        - **Issue**: Expanding the "Lifted" controls (raising sliders/buttons) to all screens 820px-1024px caused overlaps on Desktop Landscape windows where vertical height is limited.
        - **Fix**: Re-applied the `and (orientation: portrait)` constraint to the **Positioning** logic.
    - **Result**:
        - **Tablets (Portrait)**: Receive the optimized "Lifted" layout to utilize vertical space.
        - **Desktop (Landscape 820px-1024px)**: Receive the standard "Flow" layout (Sliders below Scene), ensuring no content overlaps regardless of window height.
## [v2.358_broad_tablet_support] - 2026-01-25
### UI & Visuals
- **Tech Demo v15.57 (Tablet Range Unification)**
    - **Visibility Logic (The "Desktop Gap")**:
        - **Change**: Broadened the "Mobile Mode" trigger (Hidden Rings / Visible Sliders) to specificly target `max-width: 1024px` regardless of device orientation.
        - **Reason**: Previously, screens between 860px and 1024px on Desktop (landscape) fell through the cracks, showing a broken desktop layout. Now, anything under 1024px gets the optimized Mobile interface.
    - **Positioning Logic (The "820 View")**:
        - **Change**: Expanded the "Lifted" layout controls (which raise the UI elements for better spacing) to include the **820px** breakpoint (iPad Air) and removed the portrait restriction.
        - **Range**: Now applies to `(min-width: 820px) and (max-width: 1024px)`.
        - **Result**: A consistent "Tablet/Netbook" view for all devices in this width bracket.
### UI & Visuals
- **Tech Demo v15.56 (Responsive Control Overlap)**
    - **Logic Check**: Fixed an issue where both the "Halo Ring" (Desktop controls) and "Mobile Sliders" (Mobile controls) were visible simultaneously on screens between **1025px** and **1279px** (e.g., Landscape Tablets, Small Laptops).
    - **Fix Implementation**:
        - **Default State**: Changed `#mobile-sliders-container` from `xl:hidden` to `hidden` (Hidden by default on ALL screen sizes).
        - **Activation Rule**: Added `display: flex !important` to the specific Media Query that defines "Mobile Mode" (`max-width: 1024px portrait` OR `max-width 768px`).
    - **Result**: The Mobile Sliders now *only* appear when the Halo Ring is explicitly hidden by the same rule, ensuring mutually exclusive visibility across all viewports.

## [v2.356_radius_match] - 2026-01-25
### UI & Visuals
- **Tech Demo v15.55 (Border Radius Alignment)**
    - **Scene Container (Left Column)**: Increased Corner Radius from `rounded-3xl` (1.5rem / 24px) to `rounded-[2rem]` (2rem / 32px).
    - **Reason**: Matches the explicit `2rem` border radius used by the Interactive Cards in the right column (and their generated SVG socket paths), ensuring consistent shape language across the primary UI containers.

## [v2.355_ipad_pro_pill_revert] - 2026-01-25
### UI & Visuals
- **Tech Demo v15.54 (iPad Pro Live Demo Pill Alignment)**
    - **Live Demo Pill (iPad Pro)**: Reverted horizontal positioning from `1.5rem` back to `3rem` (right-12).
        - *Reason*: Matches the restored 3rem padding of the Header Text, maintaining vertical alignment down the "content gutter" line, even though the structural containers (Scene/Grid) remain wider at 1.5rem.

## [v2.354_ipad_pro_text_fix] - 2026-01-25
### UI & Visuals
- **Tech Demo v15.53 (iPad Pro Typography Restoration)**
    - **Header Text Fix**: Reverted the `padding-left: 1.5rem` override on `#tech-demo-header` for iPad Pro.
        - *Reason*: Reducing the padding "jammed" the heavy typography ("AI Neural Architecture") against the screen edge, breaking the design's breathability.
        - *State*: Usage returns to the default `lg:p-12` (3rem), ensuring the text aligns with the breathable design language even while the *structural containers* (Scene & Grid) utilize the wider 1.5rem gutter for efficiency.
    - **Container Logic**: Kept the Scene Container (`left: 1.5rem`) and Right Column (`padding-right: 1.5rem`) expanded. This creates a pleasing visual step where the text is indented relative to the structural frame.

## [v2.353_ipad_pro_real_gutters] - 2026-01-25
### UI & Visuals
- **Tech Demo v15.52 (iPad Pro Page Gutter Correction)**
    - **Page Gutters (iPad Pro 1024px)**: Standardized Outer Page Gutter to `1.5rem` (24px) for specific iPad Pro layout.
        - **Left Edge**: 
            - Header Text (`#tech-demo-header`): `padding-left: 1.5rem`.
            - Scene Container (`#tech-demo-scene-container`): `left: 1.5rem` (Previously `2rem`).
        - **Right Edge**:
            - Content Grid (`#tech-demo-right-column`): `padding-right: 1.5rem` (Previously `2rem`).
            - Live Pillars (`#live-demo-pill`): `right: 1.5rem`.
        - **Correction**: Previous fix (v2.352) only adjusted the header text padding ("Content Gutter") but left the containers ("Page Gutter") at 2rem, creating misalignment. This update aligns the entire page frame.

## [v2.352_ipad_pro_gutters] - 2026-01-25
### UI & Visuals
- **Tech Demo v15.51 (iPad Pro Gutter Reduction)**
    - **Page Gutters (iPad Pro Only)**: Reduced horizontal padding from `3rem` (p-12) to `1.5rem` (24px) for the Header and Live Demo Pill.
        - *Target*: Strictly applied to `min-width: 821px` AND `max-width: 1024px` (Portrait).
        - *Benefit*: Maximizes usable screen real estate on 11" and 12.9" iPads by pushing content closer to the edges, reducing the generous desktop-style whitespace.
    - **Integration**: Added `id="tech-demo-header"` to the main title container to enable precise CSS targeting without affecting other views.

## [v2.351_pill_bisect] - 2026-01-25
### UI & Visuals
- **Tech Demo v15.50 (Live Demo Pill Bisect)**
    - **Live Demo Pill (Desktop)**: Moved from `lg:top-12` (3rem) to `lg:top-8` (2rem).
        - *Reason*: The Scene Container starts at `lg:top-8` (2rem). With `-translate-y-1/2` applied, positioning the pill at `top-8` places its vertical center accurately on the container's top border line, effectively "straddling" or "bisecting" it for the intended mechanical overlay look.

## [v2.350_desktop_alignment_polish] - 2026-01-25
### UI & Visuals
- **Tech Demo v15.49 (Desktop Alignment & Clearance)**
    - **Live Demo Pill (Desktop)**: Adjusted horizontal positioning from `lg:right-20` (5rem) to `lg:right-12` (3rem).
        - *Reason*: Aligns perfectly with the standard `p-12` grid padding used by the Header and Breadcrumbs, fixing the visual "drift" on desktop.
    - **Power Cluster Controls (Desktop)**: Lifted from `lg:bottom-[-2rem]` to `lg:bottom-12`.
        - *Reason*: The controls were sitting too low, often touching the screen edge or overlapping bottom-left widgets (e.g., Chat). This lift places them cleanly inside the scene container's bottom padding zone.
    - **Safety Check**: These changes apply to `lg:` (Desktop/Laptop), but iPad Pro (821-1024px) remains protected by its specific `!important` media query overrides (`bottom: 15rem`, `right: 3rem`), ensuring no regression on tablets.

## [v2.349_standby_controls_fix] - 2026-01-25
### UI & Visuals
- **Tech Demo v15.48 (Mobile Control State Logic Repair)**
    - **Bug Fix**: Addressed regression where Mobile Ring Sliders remained active/interactive during `STANDBY` mode.
        - *Root Cause*: The state observer used a legacy CSS selector (`.lg:hidden`) to find the sliders, but the container had been updated to `.xl:hidden` in a previous layout pass, causing the JS toggle logic to fail silently.
        - *Resolution*: Updated the logic to target the container by ID (`#mobile-sliders-container`), ensuring controls are correctly disabled (dimmed/grayscale) when the system enters Standby or Offline states. All inputs now strictly require `ACTIVE` state to be usable.

## [v2.348_tablet_size_bump] - 2026-01-25
### UI & Visuals
- **Tech Demo v15.47 (Tablet Scale Increase)**
    - **Container Sizing**: Increased the Dashed Ring container height for Tablet devices (`md` breakpoint, >= 768px).
    - **Change**: Upgraded from the Mobile default (`h-[350px]`) to `h-[600px]` for iPad Air (820px) and iPad Mini.
    - **Reason**: 350px was too small for the available real estate on tablets, leaving large gaps. 600px effectively utilizes the screen space (~70% increase in visual size).

## [v2.347_ipad_air_fix] - 2026-01-25
### UI & Visuals
- **Tech Demo v15.46 (iPad Air 820px Layout Fix)**
    - **CSS Overrides Separation**:
        - **Visuals (Global Mobile/Tablet)**: Rules for Hiding Rings, showing Dashed Ring, and 95% Containment remain applied to ALL devices `<= 1024px` (including iPad Air & iPhone).
        - **Positioning (Targeted)**: The "Lifted" controls logic (`bottom: 15rem`, Pill `top: 2rem`) is now restricted to **Large Tablets only** (`min-width: 821px` AND `max-width: 1024px`).
    - **Impact**: 
        - iPad Pro (1024px) retains the spacious "Lifted" layout.
        - iPad Air (820px) and Phones revert to the standard flow positioning (controls stacked below content), preventing the overlap/clipping issues seen on the smaller tablet viewport.

## [v2.346_ipad_expansion_root_fix] - 2026-01-25
### UI & Visuals
- **Tech Demo v15.45 (Neural Net Expansion Root Cause Fix)**
    - **Logic Repair**: Removed legacy "Auto-Recenter Math" in the `animate()` loop that was overriding the carefully calculated camera position with an arbitrary Z-value on mobile/iPad.
        - *Issue*: Even though `handleResize()` calculated the correct position (85% containment), the idle animation loop immediately "corrected" it to a different, closer distance, causing the "Expansion on load" effect.
        - *Fix*: The animation loop now strictly respects `this.initialCameraPos`, which is authoritative and set by the responsive logic.
    - **Cleanup**: Removed unused `IcosahedronScene` import from `tech-demo.html` to reduce network requests and script overhead.
    - **Initialization**: Removed legacy Camera Z initialization to prevent initial frame jumps.

## [v2.345_ipad_fixes_final] - 2026-01-25
### UI & Visuals
- **Tech Demo v15.44 (iPad Visibility & Expansion Fix)**
    - **Dashed Ring Visibility**: Applied a specific override for iPad/Mobile (`#halo-ring-dashed`) to set `stroke: #475569` (Slate-600) and `opacity: 1`. 
        - *Reason*: The default `slate-700/50` was too faint to be seen on the iPad display. This new color is visible but subtle (darker than the rejected Slate-400).
    - **Neural Net Expansion**: Reduced the `fillPercentage` for Mobile/iPad from 95% to **85%**.
        - *Reason*: Users reported the net "expands" on load. The 95% fill, combined with 3D perspective, visually touched or crossed the ring boundary. 85% ensures a clear "safe zone" cushion inside the Dashed Ring.

## [v2.344_ipad_restore_ring] - 2026-01-25
### UI & Visuals
- **Tech Demo v15.43 (Dashed Ring Aesthetic Restoration)**
    - **Reverted Dashed Ring Styling**: 
        - Removed the aggressive CSS overrides (`stroke: slate-400`, `stroke-width: 2px`) for `#halo-ring-dashed` on iPad/Mobile.
        - **Reasoning**: The previous change made the ring look like a "new, different" element overlaying the content. Restoring the original subtle style (`slate-700/50`, `1px`) preserves the intended background aesthetic while maintaining the active containment logic.
    - **Note**: The containment logic (JS 95% limit) and positioning fixes remain active.

## [v2.343_ipad_pill] - 2026-01-25
### UI & Visuals
- **Tech Demo v15.42 (iPad Pill Positioning)**
    - **Live Demo Pill**: Adjusted positioning for iPad Pro/Mobile.
        - Added ID `#live-demo-pill`.
        - Applied CSS Override in the Containment Media Query: `top: 2rem`, `right: 3rem`. matches user request for better breathing room on tablet devices.

## [v2.342_ipad_spacing] - 2026-01-25
### UI & Visuals
- **Tech Demo v15.41 (iPad Spacing Adjustment)**
    - **Slider Positioning**: Updated `#mobile-sliders-container` for iPad Pro Portrait/Mobile to `bottom: 9rem` (was 6rem) per user request ("9rem works for iPad"). This ensures optimal spacing from the bezel and other UI elements.

## [v2.341_containment_rules] - 2026-01-25
### UI & Visuals
- **Tech Demo v15.40 (Unified Containment Rules)**
    - **Global Layout Rule**: Established a unified rule linking Ring Visibility to Container Rules across all breakpoints.
        - **Condition**: IF (Mobile `< 768px`) OR (Tablet/iPad `< 1024px` AND Portrait) -> Rings Hidden.
        - **Effect 1**: Dashed Line Container (Diameter 720px) becomes fully visible (`opacity: 1`, `slate-400`).
        - **Effect 2 (JS)**: Neural Net strictly resizes to fit 95% of the Dashed Ring (0.9 ratio).
        - **Effect 3 (Visual)**: `clip-path` set to 46% of container (matching 360/800 radius) to hard-clip any potential overflows.
    - **Desktop Behavior**: If above conditions are NOT met (e.g. 1024px Landscape), Rings remain visible, and Neural Net fits to the Inner Ring (Standard).

## [v2.340_ipad_final_fix] - 2026-01-25
### UI & Visuals
- **Tech Demo v15.39 (Strict Containment & Layout Fixes)**
    - **Dashed Ring (Force Show)**: Assigned ID `#halo-ring-dashed` and forced `stroke: #94a3b8` (Slate-400), `opacity: 1`, and `stroke-width: 2px` on iPad Pro/Mobile. This guarantees the container boundary is visible.
    - **Crowding Fix (Lifted Controls)**:
        - *Controls Pill*: Raised further to `bottom: 15rem` (approx 240px from bottom).
        - *Sliders*: Raised to `bottom: 6rem` (approx 96px from bottom).
    - **Strict Containment**:
        - **Logic**: Reduced Neural Net fill percentage from 95% to **85%** of the Dashed Ring diameter. This provides a hard visual cushion to prevent expanding beyond the edge.
        - **Hard Clip**: Implemented `clip-path: circle(44vmin at center)` for iPad Portrait to physically chop off any overflowing particles at the ring boundary (calculated as max width of the container).

## [v2.339_ipad_containment] - 2026-01-25
### UI & Visuals
- **Tech Demo v15.38 (iPad Containment & Positioning)**
    - **3D Containment (Fix)**: Updated `tech-demo-scene.js` to strictly constrain the Neural Net to 95% of the **Dashed Ring** (Diameter 720px) on Mobile/iPad Pro, removing the artificial zoom boost. This ensures the 3D model never expands beyond the dashed boundary.
    - **Control Positioning**: moved Layout elements up to avoid crowding the bottom edge on iPad Pro:
        - *Controls Pill*: Raised to `bottom: 12rem`.
        - *Sliders Cluster*: Raised to `bottom: 4rem`.
    - **Visual Boundaries**: Increased opacity of the Dashed Ring on iPad Pro to clearly visualize the containment zone.

## [v2.338_ipad_strict] - 2026-01-25
### Technical
- **Tech Demo v15.37 (Strict Isolation)**
    - **CSS Query Refinement**: Updated the Ring Hiding Logic to stricter targeting: `@media (max-width: 1024px) and (orientation: portrait)`.
        - *Reasoning*: Enforce strict isolation between "iPad Pro Portrait" (Tablet) and "Desktop Window at 1024px" (Desktop). This prevents Desktop users who happen to browse at 1024px Landscape from losing the Rings, while ensuring the iPad experience (Portrait) is clean and ring-free as requested. "No cross-pollination".

## [v2.337_ipad_polish] - 2026-01-25
### UI & Visuals
- **Tech Demo v15.36 (iPad Pro Real Estate & Polish)**
    - **Control Visibility**: Updated Mobile Ring Hiding logic to include `1024px`.
        - *Change*: Changed `@media (max-width: 1023px)` to `(max-width: 1024px)` to explicitly **hide the Halo Rings** on iPad Pro Portrait (1024px).
        - *Reasoning*: User screenshot showed ring overlap/clutter. The Dashboard Cards and Neural Net are the priority here.
    - **Layout Expansion (Gutters)**: Reduced page gutters to maximize usable area (Real Estate).
        - *Header*: Reduced padding from `lg:p-20` (5rem) to `lg:p-12` (3rem).
        - *Scene Container*: Reduced insets from `lg:top-12/bottom-12` to `lg:top-8/bottom-8` (2rem).
        - *Right Column*: Reduced padding from `lg:pt-12`... to `lg:pt-8`... (2rem).
        - *Result*: Tighter, more expansive layout that utilizes the iPad Pro's large screen more efficiently.

## [v2.336_ipad_restore] - 2026-01-25
### UI & Visuals
- **Tech Demo v15.35 (iPad Pro Layout Restoration)**
    - **Layout Revert**: Restored the "Split Column" desktop-style layout for devices >= 1024px, complying with the user's preference for the two-column view on iPad Pro. Reverted `xl` breakpoints to `lg` in HTML.
    - **Mobile Sliders**:
        - Retained visibility of Mobile Range Sliders (`#mobile-sliders-container`) for iPad Pro (1024px) by selectively setting them to `xl:hidden` (so visible at 1024px, hidden at 1280px+).
        - Used the strict CSS override `src/input.css` (Portrait 1024px) to position them absolutely at `bottom: 2rem` within the Left Column.
    - **Neural Net Scaling (Fit Check)**:
        - **Problem**: In 2-column mode on iPad (~500px width), the "Mobile Zoom In" (0.48 factor) caused the neural net to expand beyond the narrow container width, clipping the sides.
        - **Fix (`tech-demo-scene.js`)**: Implemented Aspect Ratio detection.
            - If Aspect < 0.5 (Narrow Column Split View): Use typical factor `0.7` (Zoom Out) to fit width.
            - If Aspect >= 0.5 (Full Width Mobile): Use factor `0.48` (Zoom In) to fill height.
            - This ensures the 3D scene scales correctly whether it's in a narrow column (iPad Split) or full screen (iPhone).

## [v2.335_ipad_ui] - 2026-01-25
### UI & Visuals
- **Tech Demo v15.34 (iPad Pro 12.9" Layout Overhaul)**
    - **Control Visibility**: Enabled Mobile Range Sliders specifically for iPad Pro Portrait (1024px) by shifting layout breakpoints from `lg` to `xl`.
        - *Mechanism*: Changed main layout classes to `xl:flex-row`, `xl:w-1/2`, etc. This forces 1024px devices into the "Stacked" column layout (maximizing space) instead of cramping them into side-by-side Desktop columns.
        - *Controls*: Sliders (`#mobile-sliders-container`) are now `xl:hidden` instead of `lg:hidden`, meaning they are **visible** on 1024px screens.
    - **Positioning**: Added CSS override for `orientation: portrait` at 1024px to position these sliders at `bottom: 2rem`, ensuring they sit neatly below the hanging Control Cluster (which is at `bottom: 10rem`).
    - **Space Maximization**: The stack layout allows the 3D scene to occupy the full 1024px width, resolving the "Neural Net expanding beyond container" issue simply by providing a larger container.

## [v2.334_ipad_fixes] - 2026-01-25
### UI & Visuals
- **Tech Demo v15.33 (iPad Pro 12.9" Specifics)**
    - **Logic Expansion**: Updated `isMobile` check to include `1024px` width (changed from `<` to `<=`). This ensures iPad Pro Portrait gets the "Zoom In" visual treatment to fill the screen (95% fill) instead of the small desktop view.
    - **Controls Layout**: Added precise CSS media query override for `1024px` Portrait orientation.
        - *Change*: Forces the Control Cluster to `bottom: 10rem` (lifting it significantly) specifically on iPad Pro Portrait.
        - *Override*: Bypasses the standard Desktop `bottom: -2rem` hang, preventing overlap in the taller portrait vertical flow.

## [v2.333_mobile_zoom_fix] - 2026-01-25
### UI & Visuals
- **Tech Demo v15.32 (Mobile Fill Factor)**
    - **Sizing Correction**: Updated `tech-demo-scene.js` scaling logic to strictly satisfy the "95% Fill" requirement for mobile/tablet.
    - **Math**: Adjusted camera distance factor from `0.65` to `0.33`.
        - *Logic*: Previous zoom (`0.65`) resulted in ~45% occupancy. New factor (`0.33`) calculates to `Z=4.29`, ensuring the `R=1.5` Icosahedron geometry visually occupies ~85% of the viewport height, effectively filling the expanding clip-path area on screens < 1024px.

## [v2.332_mobile_scale] - 2026-01-25
### UI & Visuals
- **Tech Demo v15.31 (Mobile Neural Scale)**
    - **Camera Logic**: Inverted the mobile camera zoom logic in `tech-demo-scene.js`.
        - *Previous*: `distance * 1.6` (Zoom Out). This logic assumed the sphere needed to shrink to fit a cramped UI.
        - *New*: `distance * 0.65` (Zoom In). This aligns with the CSS `clip-path` expansion (85%) on mobile/tablet, bringing the camera significantly closer so the Icosahedron fills the visual void instead of floating as a tiny dot.
    - **Target**: Solves the "tiny neural net" issue on iPad/Tablet layouts where rings are hidden but the sphere failed to scale up to occupy the empty space.

## [v2.331_hang] - 2026-01-25
### UI & Visuals
- **Tech Demo v15.30 (Negative Positioning Strategy)**
    - **Overflow Logic**: Changed the Scene Container to `lg:overflow-visible` (previously hidden) to allow elements to protrude outside the box boundaries.
    - **Control Placement**: Pushed the Control Cluster DOWN to `lg:bottom-[-2rem]`. Use of negative bottom positioning allows it to "hang" slightly off the bottom edge of the container while keeping the container itself aligned with the adjacent grid.
    - **Purpose**: This creates maximum vertical clearance for the internal ring graphic while ensuring the controls are physically separated and lower than the "Start a Call" widget interaction zone.

## [v2.330_hybrid] - 2026-01-25
### UI & Visuals
- **Tech Demo v15.29 (Hybrid Layout Strategy)**
    - **Top Alignment**: Restored the Scene Container to `lg:top-12`. This perfectly aligns the top border with the "Live Demo" pill and the Right Column (as requested).
    - **Control Positioning**: Converted the Control Cluster back to `absolute` positioning at `lg:bottom-24`. This guaranteed "lift" ensures it clears the chat widget regardless of flex flow.
    - **Collision Prevention**: Added `lg:pb-32` (8rem) padding to the Scene Container. This effectively reserves the bottom area for the absolute controls, forcing the `flex-grow` Ring to shrink and stop *before* it hits the controls, combining the best of both layout worlds (Flex Scaling + Absolute Precision).

## [v2.329_lift] - 2026-01-25
### UI & Visuals
- **Tech Demo v15.28 (Layout Container Alignment)**
    - **Container Alignment**: Reverted the Scene Container `bottom` position to `12` (Standard 3rem alignment) to strictly match the Right Column's vertical extent.
    - **Cluster Clearance**: Applied `lg:mb-24` (6rem) margin specifically to the *Control Cluster* element.
    - **Result**: This lifts the controls safely above the "Start a Call" chat widget while keeping the left-side border/container fully expanded and aligned with the right-side content, satisfying both requirements (Alignment + Clearance).

## [v2.328_clearance] - 2026-01-25
### UI & Visuals
- **Tech Demo v15.27 (Chat Widget Clearance)**
    - **Bottom Margin**: Increased the Scene Container `bottom` position from `8` (2rem) to `28` (7rem).
    - **Fix**: This creates a strictly protected vertical zone at the bottom of the screen, ensuring the Control Cluster never gets hidden behind the fixed "Start a Call" / Intercom widget when resizing the window vertically.
    - **Tightening**: Applied `-mt-2` to the control cluster to reduce visual gap between the ring bottom and the controls.

## [v2.327_cluster] - 2026-01-24
### UI & Visuals
- **Tech Demo v15.26 (Cluster Alignment Fix)**
    - **Visuals Alignment**: Updated the `Visuals Wrapper` alignment from `items-center` to `items-end`.
        - *Logic*: This forces the flexible square container (Ring) to sit at the *bottom* of the available vertical space, rather than floating in the middle.
        - *Result*: The Ring now sits directly on top of the Control Cluster with no variable gap, regardless of screen height, solving the "way to the bottom" disconnection issue.

## [v2.326_spacing] - 2026-01-24
### UI & Visuals
- **Tech Demo v15.25 (Spacing & Aspect Fix)**
    - **Header Clearance**: Moved the Main Scene Container `top` position from `12` (3rem) to `32` (8rem) to prevent the "AI Neural Architecture" header from overlapping the visualization geometry.
    - **Aspect Ratio Logic**: TRANSFERRED the `aspect-square` constraint from the Parent Flex Container to the Inner Visuals Wrapper.
        - *Why*: Applying square aspect to a parent that contains (Square + Rectangle Strip) forces squeezing.
        - *Fix*: Parent is now a purely adaptive flex column (`h-full`). Inner visual wrapper is `aspect-square`, scaling to fit the *remaining* space above the controls.
    - **Control Isolation**: Enforced `shrink-0` and extra padding (`pb-4`) on the control cluster to guarantee it never collapses or overlaps with the ring labels.

## [v2.325_flex] - 2026-01-24
### UI & Visuals
- **Tech Demo v15.24 (Flex Layout Refactor)**
    - **Layout Architecture**: Converted the Ring Container into a Flex Column (`flex-col justify-between`) to eliminate overlap/jamming issues.
    - **Visuals Area**: Wrapped Scene & Ring in a `flex-grow` container that maintains the aspect-square constraint but allows shrinking.
    - **Controls Area**: Converted Controls to a standard relative flex item (`pb-2`) that sits naturally below the visuals within the same scaling parent.
    - **Outcome**: The visual ring shrinks to accommodate the controls, ensuring "room to breathe" and preventing UI collision while maintaining 1:1 scaling.

## [v2.324_struct] - 2026-01-24
### UI & Visuals
- **Tech Demo v15.23 (Structural Refactor)**
    - **DOM Restructure**: Moved `#tech-demo-controls-target` from being a sibling of the Ring Container to being a direct child *inside* the scale-constrained Ring Container.
    - **Positioning**: Changed from relative flow (`mt-6`) to absolute positioning (`bottom-4 lg:bottom-8`) inside the aspect-ratio parent.
    - **Fix**: Ensures the control cluster scales *with* the ring and remains visible on short viewports, satisfying the "flex together" requirement.

## [v2.323.responsive_ring] - 2026-01-24
### UI & Visuals
- **Tech Demo v15.22 (Responsive Scaling)**
    - **Vertical Fit**: Changed the Layout Wrapper to `h-full` and satisfied the "disappearing cluster" layout bug by switching the Ring constraints.
    - **Logic**: The Ring now uses `lg:h-full lg:max-h-[calc(100%-4rem)] lg:aspect-square`.
        - *Previous*: Width-driven (caused vertical overflow on short screens).
        - *Now*: Height-driven (shrinks to fit viewport height, spacing for controls preserved).
    - **Result**: On short screens, the ring shrinks to prevent the control cluster from being pushed off-screen.

## [v2.322.alignment] - 2026-01-24
### UI & Visuals
- **Tech Demo v15.21 (Control Insets)**
    - **Layout Fix**: Reduced top margin of the control cluster (`mt-2`) to remove excessive gap below the neural ring.
- **Glass Socket v1.5 (Correction)**
    - **Geometry Repair**: Re-applied the original Bezier path constants (Scale=0.5) to the `glass-socket.js` module.
    - **Fix**: Resolves the "screwed up alignment" where the calculated socket path did not match the static button position, causing visual clipping and overlap.

## [v2.321.deploy_fix] - 2026-01-24
### DevOps
- **Deployment Script Fix**: Updated `scripts/publish.sh` to correctly handle version tags containing underscores (e.g., `v2.315.flex_ui`).
    - **Issue**: The regex previously excluded `_`, causing the script to fail to detect and update CDN links for versions like `v2.320.layout_fix`.
    - **Impact**: This prevented `tech-demo.html` from pointing to the correct new Javascript files, leading to "missing" features (Controls in wrong place, broken sockets).
    - **Resolution**: Updating to this version triggers a complete link refresh.

## [v2.320.layout_fix] - 2026-01-24
### UI & Architecture
- **Tech Demo v15.20 (Layout Refactor)**
    - **Structure**: Split the main "Circle Container" into a vertical flex column (`#tech-demo-wrapper`).
    - **Isolation**: The visual ring now resides in a strictly aspect-ratio locked container (`w-full aspect-square`).
    - **Controls**: The "Power Up" cluster is now injected into a sibling container (`#tech-demo-controls-target`) that sits *below* the ring in the document flow, ensuring correct positioning on all devices without overlap.
- **Optimization**
    - **Glass Socket Script**: Extracted the duplicate socket path generation logic (previously repeated 19 times inline) into a single module `glass-socket.js`.
    - **Performance**: Reduced HTML size and parsing overhead significantly.

## [v2.316.cache_fix] - 2026-01-24
### Deployment
- **Tech Demo v15.15 (Cache Busting)**
    - **CDN Enforcement**: Hardcoded `tech-demo.html` to load the scene script from jsDelivr CDN (`@v2.316...`).
    - **Fix**: Resolves browser caching issues where the new flex layout UI fixes were not appearing for some users.

## [v2.315.flex_ui] - 2026-01-24
### UI Refactor
- **Tech Demo v15.14 (Flexbox Layout)**
    - **Control Cluster**: Moved "Power Up" controls (Slider, Status, Warning) from absolute positioning to a new `flex-col` layout.
    - **Mobile/Desktop Fix**: Controls now sit inline below the Neural Net visualization, preventing overlap with chat widgets or other UI elements on all screen sizes.

## [v2.314] - 2026-01-24
### Assets
- **Tech Demo v15.13 (Completed User Icons)**
    - **Demo Guide**: Swapped to "Dedicated Hosting" carbon icon (CarbonDedicatedHosting.svg).
    - **Completion**: All tech demo cards now use the Carbon set provided in `assets/icons/new/`.

## [v2.313] - 2026-01-24
### Assets
- **Tech Demo v15.12 (Final Icon Set)**
    - **Sales Advisor**: Swapped to "Data Definition" carbon icon (CarbonDataDefinition.svg).
    - **Booking Agent**: Swapped to "Direct Link" carbon icon (CarbonDirectLink.svg).
    - **Source**: Imported from user assets (`assets/icons/new/`).

## [v2.312] - 2026-01-24
### Assets
- **Tech Demo v15.11 (User-Supplied Icons)**
    - **Front Door Agent**: Switched to "API/Hub" carbon icon (CarbonApi.svg).
    - **Technical Specialist**: Switched to "Server Chip" carbon icon (CarbonChip.svg).
    - **Source**: Imported from user assets (`assets/icons/new/`).

## [v2.311] - 2026-01-24
### Assets
- **Tech Demo v15.10 (Standardized Icons)**
    - **Remediation**: Replaced experimental abstract icons with standard geometric primitives to solve rendering ambiguity.
    - **Sales Advisor**: Swapped "Orb" for **"Growth Chart"**.
        - *Visual*: Three vertical bars of ascending height. Unmistakable symbol for revenue/plans.
    - **Demo Guide**: Swapped "Cycle" for **"Presentation Play"**.
        - *Visual*: A rounded screen rectangle containing a solid play triangle. Clear metaphor for walkthroughs/videos.

## [v2.310] - 2026-01-24
### Assets
- **Tech Demo v15.9 (Refined Iconography)**
    - **Sales Advisor**: Swapped complex "Hand holding AI" icon for a minimal "Orb of Value" concept.
        - *Design*: A central solid orb supported by an abstract "cupped hand" curve below it. Removed all text ("AI") for cleaner scaling.
    - **Demo Guide**: Swapped "Stack Cycle" icon for a pure "Sync Cycle".
        - *Design*: Two large chasing arrows forming a circle loop.
        - *Cleanup*: Removed the center stack graphic completely to reduce visual noise.

## [v2.309] - 2026-01-24
### Assets
- **Tech Demo v15.8 (Front Door Polish)**
    - **Icon Reconstruction**: Replaced the "Front Door Agent" icon (previously `#10` Circuit Flow) with a synthesized, high-contrast geometric routing icon.
        - *Reason*: The previous SVG was too complex for the 24px scale, rendering as an indistinct blob.
        - *New Design*: A clear "1-to-3" node split using primitive shapes (`circle`, `path`) and standard strokes (`stroke-width="5"`) to match the "Glass" monoline aesthetic and ensuring perfect legibility at small sizes.

## [v2.308] - 2026-01-24
### Assets
- **Tech Demo v15.7 (Specific Icon Swaps)**
    - **Focused Selection**:
        - *Front Door Agent* → Swapped to `10_AI.svg` (Circuit Flow). Cleaned up the SVG by removing complex inner paths to improve legibility at small scale.
        - *Technical Specialist* → Swapped to `17_AI.svg` (Isometric Cube).
    - **Complexity Reduction**: Removed "AI" text characters from Icon #10 to adhere to visual minimalism guidelines.

## [v2.307] - 2026-01-24
### Assets
- **Tech Demo v15.6 (Iconography Update)**
    - **Custom Vector Integration**: Replaced the previous generic Heroicon placeholders with a new set of bespoke vector assets from the Design System (`assets/icons/SVG`).
    - **Mapped Visuals**:
        - *Front Door Agent* (Reception) → `18_AI.svg` (Gate/Container)
        - *Demo Guide* (Walkthrough) → `08_AI.svg` (Cyclical Process)
        - *Onboarding Coach* (Help) → `32_AI.svg` (Connected Nodes)
        - *Technical Specialist* (Support) → `40_AI.svg` (CPU/Chip Logic)
        - *Sales Advisor* (Revenue) → `24_AI.svg` (Neural/Strategy)
        - *Booking Agent* (Scheduling) → `02_AI.svg` (Grid/Network)
    - **Optimized SVG**: Cleaned all new SVGs to remove hardcoded `fill` colors and `cls` styles, standardizing them to `fill="currentColor"` to inherit the monotone white/90 styling perfectly.

## [v2.306] - 2026-01-24
### Fixes
- **Tech Demo v15.5 (Geometric Precision)**
    - **Stroke Stabilization**: Increased the SVG border stroke width from `1.0px` to `1.5px`. This extra half-pixel provides enough "meat" for the anti-aliasing engine (especially on non-retina displays) to calculate smooth alpha transitions without the "dotted/jagged" artifacting seen on thinner lines.
    - **Backdrop Containment**: Applied a tight `-webkit-mask-image: radial-gradient(white, black)` to the glass background layer. This forces the backdrop blur to strictly respect the compiled border radius, preventing the "squared-off" blur bleeding that can appear as pixelated halos around rounded corners.
    - **Layer Isolation**: Promoted the Icon layer with `translateZ(1px)` and the Background layer with `translateZ(0)`. This forces the browser to composite them as separate texture planes, ensuring the blur filter on the background does not contaminate or re-rasterize the vector icon on top.

## [v2.305] - 2026-01-24
### Fixes
- **Tech Demo v15.4 (Glass Artifacts Fix)**
    - **Separate Composition Layers**: Decomposed the glass button into three distinct layers: Background (Blur), Border (Vector), and Content (Icon). This prevents the backdrop blur filter from "flattening" or rasterizing the icon itself, which was causing the blurriness on hover.
    - **SVG Vector Borders**: Replaced the CSS `mask-composite` border (which was prone to pixelation/aliasing) with a true SVG `<circle>` overlay. This ensures the diagonal gradient border is mathematically perfect and crisp at any screen scale.
    - **Rendering Optimization**: Removed the aggressive GPU layer promotion hacks (`backface-visibility`, `translateZ`) that were contributing to texture scaling artifacts.

## [v2.304] - 2026-01-24
### Fixes
- **Tech Demo v15.3 (Rendering Hotfix)**
    - **Anti-Aliasing**: Fixed pixelation artifacts on the glass button borders when in the default (non-hover) state.
    - **Layer Promotion**: Applied `transform: translateZ(0)`, `will-change: transform`, and `backface-visibility: hidden` to the button containers and their mask layers. This forces the browser to promote these elements to their own compositor layers with high-fidelity rasterization, eliminating the "crunchy" edges seen on some displays at standard scale.

## [v2.303] - 2026-01-24
### Design
- **Tech Demo v15.3 (Glass Aesthetic Update)**
    - **Monotone Buttons**: Stripped all color from the floating action buttons (previously brand-colored). They now feature a unified `bg-white/5` frosted glass appearance with varying opacity.
    - **Apple-Style Gradient Borders**: Implemented a sophisticated diagonal gradient border on the buttons using a `mask-composite` technique. The border is significantly brighter at the Top-Left and Bottom-Right corners (mimicking light hit and reflection) while fading to near-transparent in the perpendicular corners.
    - **Monochrome Icons**: Converted all button icons to a clean translucent white (`text-white/90`), removing the color-coding to fully embrace the minimal glass aesthetic.

## [v2.302] - 2026-01-24
### Fixes
- **Tech Demo v15.2 (Scaling Fix)**
    - **Resize Observer**: Replaced the static window resize listener with a robust `ResizeObserver`. This ensures the socket geometry recalculates instantly whenever the card container changes size (e.g., during responsive layout shifts or flex resizing), preventing "detached" corners.
    - **Transition Override**: Explicitly forced `transition: none !important;` on the generated socket path. This overrides the global `svg path { transition: all 1.5s; }` rule which was causing the "easing/disconnect" artifact where the border would morph slowly while the container snapped to its new size.
    - **Result**: Cards now scale perfectly responsively with zero visual disconnects or animation lag on the border.

## [v2.301] - 2026-01-24
### Design
- **Tech Demo v15.1 (Tangent Continuous Path)**
    - Fixed the "Bumbled" middle curve of the socket cascade by inverting its Bezier definition.
    - **Inverted Logic**: The middle curve now flows Vertical -> Horizontal (V->H) instead of H->V. This creates a seamlessly alternating "Staircase" shape (H->V, V, V->H, H, H->V) that maintains perfect tangent continuity at every joint.
    - **Result**: A smooth, manufactured "zipper" look without the previous sharp kinks or disjointed angles.

## [v2.300] - 2026-01-24
### Design (Major Architecture Update)
- **Tech Demo v15 (Single Continuous Path)**
    - Replaced the failing "Mask + Path" architecture with a JavaScript-generated "Single Path" system.
    - **No More Separate Entities**: The card border is now mathematically defined as one continuous loop that starts at the top-left, traces the top edge, seamlessly enters the "Cascading Socket" Bezier curve, and continues around the card.
    - **Zero Artifacts**: This eliminates all "ghost lines", "shadow gaps", and anti-aliasing seams caused by masking. The stroke is now a single vector with uniform opacity and width.
    - **Visual Perfection**: Achieved the requested "Clean Single Flowing Path" look.

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
