## [v2.663] - 2026-01-29
- **DMZ Layout Polish**:
    - **Positioning**: Removed all `absolute` and negative margin hacks. The controller now sits in the natural DOM flow (Relative) inside the Header block.
    - **Sizing**: Applied `md:w-[23rem]` to maintain the preferred width on Tablet/Desktop, while keeping `w-full` on mobile.
    - **Fix**: Resolves the "Top of Screen" jump bug by strictly adhering to block layout.

## [v2.661] - 2026-01-29
- **DMZ Layout Revert**:
    - **Tablet Strategy**: Removed the manual "Beside Header" positioning (negative margins) for the 768px-1023px range.
    - **Result**: The layout now remains in "Mobile Mode" (Stacked, Full Width) up to 1023px, ensuring consistent placement below the text without vertical alignment glitches at specific viewports (e.g., 820px).

## [v2.660] - 2026-01-29
- **DMZ Layout Finalization**:
    - **Width**: Increased Mini Controller width to `23rem` (was 12rem/w-48) for better breathing room.
    - **Breakpoint**: Reverted to standard `md` (768px) breakpoint for the "Beside Header" transition, matching the user's manual adjustment.
    - **Behavior**: Below 768px, sliders stack naturally below text (full width). Above 768px, they sit to the right of the header.

## [v2.659] - 2026-01-28
- **DMZ Layout Tune**:
    - **Method**: Replicated the user's manual "Inspector Fix" for alignment.
    - **Header**: Reverted to `block` layout (removed `flex`).
    - **Sliders**: Applied specific width (`w-48`), negative top margin (`-mt-32`), and right alignment (`ml-auto`) to pull the controls up beside the heading without relying on absolute positioning or flex column behavior.

## [v2.658] - 2026-01-28
- **DMZ Layout Structure**:
    - **Architecture**: Moved `#mobile-sliders-container` DOM element into the Header flex container. This creates a native "Two Column" layout on Tablet (Text Left, Sliders Right) without relying on fragile absolute positioning.
    - **Optimization**: Added `flex-wrap` to the header container to ensure graceful degradation on smaller mobile devices.
    - **Cleanup**: Removed the temporary CSS overrides for positioning; now relies on standard utility classes.

## [v2.657] - 2026-01-28
- **DMZ Layout Polish**:
    - **Positioning**: Changed Mini Controller from `fixed` to `absolute`. This ensures it acts as part of the header "beside the heading" and scrolls with the page, rather than floating awkwardly over content when scrolling.
    - **Refinement**: Increased label tracking and shadow for premium feel against the deep background.
    - **Alignment**: Tuned `top` offset to 104px to better match the optical center of the heading text.

## [v2.656] - 2026-01-28
- **DMZ Polish**:
    - **Style**: Removed the background, blur, and border from the DMZ Mini Controller as requested. It now floats cleanly.
    - **Position**: Adjusted vertical alignment (`top: 108px`) to visually align with the "AI Neural Architecture" heading baseline.
    - **Readability**: Added text shadow to labels for better contrast against the deep space background.

## [v2.655] - 2026-01-28
- **DMZ Layout (Mini Controller)**:
    - **Concept**: For the Tablet Portrait / "Dead Man Zone" (820px-1023px), we moved the slider controls from the bottom of the screen to the top right header area.
    - **Implementation**: Instead of creating duplicate DOM elements, we used CSS to reposition the existing `#mobile-sliders-container`.
    - **Styling**: Applied specific "Mini Mode" styling (compressed width, smaller font, blurred background) only in this media query range.
    - **Fix**: Prevents the controls from overlapping the Neural Net visualization in the center of the screen.

## [v2.654-failed] - 2026-01-28
    - **Removal**: Removed `md:h-[600px]` from the responsive ring container. This class was forcing a fixed 600px height on tablets (768px+), which conflicted with the "Mobile Stack" logic desired for the 820px-1023px range.
    - **Styling**: Ensured the `.aspect-square-mobile-override` class applies `margin-bottom: 2rem` and `position: relative` to force the slider cluster downwards in the document flow, preventing overlay.
    - **Uniformity**: Now, the Dead Man Zone (820-1023px) behaves exactly like Mobile (Vertical Stack, Controlled Height), consistent with the user's requirement.

## [v2.654] - 2026-01-28
- **Dead Man Zone (Overlap Fix)**:
    - **Issue**: The Neural Net container wasn't pushing the sliders down, causing them to float in the middle of the visualization.
    - **Fix**: Increased `min-height` to `480px` and enforced `margin-bottom: 2rem` and `position: relative` on the `.aspect-square-mobile-override` class.
    - **Result**: This ensures the container physically occupies space in the document flow, forcing the sliders to render BELOW the Neural Net rather than overlapping it.

## [v2.653] - 2026-01-28
- **Dead Man Zone (Visibility Fix)**:
    - **Issue**: The previous `height: auto` override caused the Neural Net container to collapse to 0 height because the internal content relies on absolute positioning/height-inheritance.
    - **Fix**: Updated the `.aspect-square-mobile-override` CSS to enforce a responsive fixed height.
    - **Logic**: `height: 50vh` (Half viewport height) with safety clamps:
        - `min-height: 350px` (Ensures usability on small mobiles).
        - `max-height: 600px` (Prevents it from becoming gigantic on tall tablets).
    - **Result**: The Neural Net is now visible and properly scaled across all Mobile and Tablet orientations (0-1023px).

## [v2.652] - 2026-01-28
- **Dead Man Zone (1023px) Fix**:
    - **Issue**: The layout range <1024px was forcing fixed heights (`h-[350px]` or `md:h-[600px]`) which caused content clipping and overlap in the 820px-1023px zone.
    - **Fix**: Implemented strict CSS override for `.aspect-square-mobile-override` in the critical 0-1023px range.
    - **Override**: Forces `height: auto` and `max-height: 50vh`, allowing the Neural Net sphere to scale naturally without pushing the controls off-screen or creating massive vertical gaps.
    - **Min-Height**: Removed the strict `min-h-[420px]` on the container for mobile to allow it to shrink if needed.

## [v2.651] - 2026-01-28
- **Card Metadata Density**:
    - **Spacing**: Reduced the vertical grid gap in the card detail view from `gap-y-5` (1.25rem) to `gap-y-2` (0.5rem). This tightens the "meta vertical spacing" on mobile/tablet cards, improving information density and reducing the need for scrolling.

## [v2.650] - 2026-01-28
- **iPad Pro Layout Polish (Vertical Alignment)**:
    - **Logic Split**: Modified `#tech-demo-wrapper` vertical alignment logic to differentiate between iPad Pro and Desktop.
    - **iPad Pro (1024px / lg)**: Now uses `lg:justify-center` instead of `justify-end`. This "raises" the Neural Net visualization to the vertical center of the screen, fixing the issue where it felt too low on tablet devices.
    - **Desktop (1280px+ / xl)**: Applied `xl:justify-end` to ensure that on actual large monitors, the visualization remains successfully anchored to the bottom (the intended desktop aesthetic).

## [v2.649] - 2026-01-28
- **Rollback & Alignment Fix**:
    - **Rollback**: Fully restored system state to **v2.644** (HTML, CSS, JS) to recover the correct iPad Pro (1024px) Two-Column layout which was broken by the `xl` breakpoint shift.
    - **Mobile Refinement**: Applied `mt-0` (was `mt-12`) to the `#tech-demo-wrapper` on mobile/tablet breakpoints. This eliminates the top gap, pushing the Neural Net visualization closer to the button cluster as requested.
    - **Dependencies**: Synced `styles.css`, `tech-demo-scene.js`, and `ai-chat.js` to ensure the restored HTML functions correctly without version mismatches.

## [v2.648] - 2026-01-28
- **Desktop/Tablet Layout Refinement**:
    - **Desktop Rule (1025px+)**: Changed `tech-demo-wrapper` alignment from `xl:justify-center` to `xl:justify-end`. This ensures the Neural Net scene correctly anchors to the bottom of the container on large screens/Desktop, correcting the "pushed too high" regression.
    - **Tablet Safety**: Enforced `h-auto` on the wrapper for mobile/tablet screens to prevent vertical stacking crashes, while restoring `xl:h-full` for Desktop to maintain the 2-column height balance.

## [v2.647] - 2026-01-28
- **iPad Pro & Mobile Layout (Final Fluid Fix)**:
    - **Issue**: "Dead Man Zone" persisted because hardcoded heights (`h-[350px]`, `min-h-[420px]`) and hidden controls prevented the layout from being truly fluid on tablets.
    - **Fluidity**: Removed ALL fixed height constraints from the 3D Scene Container. It now uses `aspect-square` exclusively, allowing it to scale proportionally to fill the available width (up to `max-w-[800px]`) without forcing vertical gaps or scrollbars.
    - **Controls**: Restored the **Ring Sliders** (`#mobile-sliders-container`) for the Tablet range (up to `xl` breakpoint). Previously they were hidden beyond 820px, leaving iPad users with no controls.
    - **Validation**: This guarantees a "100% responsive" vertical stack for all devices below 1280px.

## [v2.646] - 2026-01-28
- **Layout & Breakpoint Shift (Dead Man Zone Fix)**:
    - **Issue**: The layout range 820px-1023px (Tablet/iPad Portrait) was inconsistent, attempting to use Desktop styles without sufficient width ("Dead Man Zone").
    - **Fix**: Shifted the primary Desktop breakpoint from `lg` (1024px) to `xl` (1280px) across `tech-demo.html`.
    - **Result**: Devices between 820px and 1279px will now strictly use the **Mobile Layout** (Vertical Stack, Scrollable Cards), ensuring a consistent "Universal Compact" experience corresponding to user requirements.
    - **Cleanup**: Removed the legacy `md:h-[600px]` override on the 3D ring container to allow organic mobile sizing in this range.

## [v2.645] - 2026-01-28
- **iPad Pro & Layout Improvements**:
    - **Visual Center**: Changed `tech-demo-wrapper` alignment from `justify-end` to `justify-center`. This moves the main Neural Net ring up into the visual center on iPad Pro and Desktop, fixing the layout gap.
    - **Card Metadata Spacing**: Reduced grid gap from `gap-y-5` (20px) to `gap-y-2` (8px) in the card details to fix excessive spacing and improve information density.
- **Documentation**:
    - **Ampere AI Chat**: Added comprehensive reconstruction specifications for the Voice/Chat interface in `context.md` (v2.644), including dependency mapping and status pill logic.

## [v2.643] - 2026-01-28
- **Power Button FOUC Fix**:
    - **Issue**: The Power Button's default HTML class was `text-amber-300`, causing it to appear Orange momentarily (or permanently if JS fails) before the JavaScript state manager takes over.
    - **Fix**: Updated `tech-demo.html` to default to `text-slate-500` (Off/Neutral). This ensures the button starts neutral, and only turns Orange (Standby) or Green (Active) when the application logic explicitly sets that state.

## [v2.642] - 2026-01-28
- **Power Button Visuals (Urgent Fix)**:
    - **Issue**: The active state green color was not applying due to a specificity conflict with the default Tailwind `text-amber-300` class in the HTML.
    - **Fix**: Implemented `style.setProperty('color', ..., 'important')` in Javascript to strictly force the Emerald Green color (#34d399) and the low-opacity background (#10b981 with 5% opacity) when Active. This guarantees the visual state regardless of load order or CSS specificity.

## [v2.641] - 2026-01-28
- **Power Button Visuals**:
    - **Fix**: Removed conflicting CSS `!important` rule that was forcing a dark/black background on the button's active state.
    - **Polish**: Lightened the active state background significantly (to 5% opacity) to achieve the requested "very very light" look.
    - **Verify**: Icon color now correctly displays as Emerald (Green) instead of persisting as Amber (Orange), as the visual conflict is resolved.

## [v2.640] - 2026-01-28
- **Tablet Breakpoint Adjustment**:
    - **Logic Strict**: Changed the layout and logic breakpoints from `<= 1024px` to `< 1024px`.
    - **iPad Pro (1024px)**: Now correctly treated as "Desktop" (Two-Column Layout, Desktop Camera Logic).
    - **iPad Air & Mobile (<1024px)**: Remain strictly on "Mobile" (Single Column, Mobile Camera Zoom).
    - **CSS**: Updated specific media queries in `styles.css` to respect the 1023px cutoff.


## [v2.639] - 2026-01-28
- **Redeploy**: Forced cache-busting redeploy to ensure v2.638 changes (Mobile scroll fix & Status Pill sync) propagate to all edges.


## [v2.638] - 2026-01-28
- **Mobile UX Refinement**:
    - **No Scroll Jump**: Disabled the automatic `scrollIntoView` behavior on mobile when an agent card becomes active. This prevents the page from unexpectedly scrolling/jumping during the "Power Up" sequence when the first agent activates.
- **Visual Polish**:
    - **Status Pill Sync**: The "Live Demo" blinking dot in the header pill now syncs with the system power state colors (Amber for Standby, Emerald for Active, Slate for Off), matching the power button logic.

## [v2.637] - 2026-01-28
- **Mobile Visualizer Fix**:
    - **DOM Nesting Correction**: Moved the Voice UV Visualizer *inside* the `Ring Container` (specifically into the aspect-ratio preserved block). 
    - **Result**: The `top-1/2` positioning now calculates relative to the Orb itself, not the entire scene wrapper (which included bottom sliders/padding), ensuring true mathematical centering of the waveform within the Neural Net.

## [v2.637] - 2026-01-28
- **Mobile Visualizer Fix**:
    - **DOM Nesting Correction**: Moved the Voice UV Visualizer *inside* the `Ring Container` (specifically into the aspect-ratio preserved block). 
    - **Result**: The `top-1/2` positioning now calculates relative to the Orb itself, not the entire scene wrapper (which included bottom sliders/padding), ensuring true mathematical centering of the waveform within the Neural Net.

    - **DOM Nesting Correction**: Moved the Voice UV Visualizer *inside* the `Ring Container` (specifically into the aspect-ratio preserved block). 
    - **Result**: The `top-1/2` positioning now calculates relative to the Orb itself, not the entire scene wrapper (which included bottom sliders/padding), ensuring true mathematical centering of the waveform within the Neural Net.

## [v2.636] - 2026-01-28
- **Mobile UX Refinement (Voice UV)**:
    - **True Optical Centering**: Relocated the Voice UV Visualizer DOM element *inside* the `tech-demo-scene-container`.
    - **Logic**: By parenting the visualizer to the Orb's container and using `top-1/2 left-1/2`, the waveform is now mathematically centered on the Neural Net visualization rather than the entire page column (which caused it to float too high due to the header text).

## [v2.635] - 2026-01-28
- **Mobile Layout Experiment**:
    - **Visualizer Centering**: Moved the Voice UV Visualizer to the absolute center of the Neural Net Orb (`top-1/2 left-1/2`) on mobile and tablet devices (<1024px). This creates a direct visual integration between the voice synthesis and the neural core.
    - **Desktop Stability**: Preserved the bottom-right positioning for desktop layouts.

## [v2.635] - 2026-01-28
- **Mobile Layout Experiment**:
    - **Visualizer Centering**: Moved the Voice UV Visualizer to the absolute center of the Neural Net Orb (`top-1/2 left-1/2`) on mobile and tablet devices (<1024px). This creates a direct visual integration between the voice synthesis and the neural core.
    - **Desktop Stability**: Preserved the bottom-right positioning for desktop layouts.

## [v2.634] - 2026-01-28
- **Typography Polish**:
    - **Button Weight**: Updated the "Start Conversation" and "End Call" buttons to use `font-medium` (500) instead of `font-bold` (700). This reduces visual heaviness on mobile screens where the specific font (Geist/Sans) renders thicker, ensuring a refined and legible UI.

## [v2.633] - 2026-01-28
- **Mobile UX Relocation (Voice UV)**:
    - **Upper Right Placement**: Moved the Voice UV Visualizer on mobile to the **Upper Right** of the Neural Architecture section (`top-32 right-6`) to maintain a strong visual connection with the Neural Net title and the active agent state, while avoiding overlay issues with the bottom card stack.
    - **Unified Component**: Reverted the decision to use a "Compact" visualizer on mobile. The system now renders the full universal **Apple Glass Pill** (High Fidelity) on all devices, ensuring a consistent design language.

## [v2.632] - 2026-01-28
- **Mobile UX Refinement**:
    - **Adaptive Visualizer**: Updated `ai-chat.js` to detect the device layout.
        - **Desktop**: Renders the large Apple Glass Pill container (bottom-right).
        - **Mobile**: Renders a compact, squared-off visualizer *inside* the Status Pill (top-center). This prevents the large pill from obscuring the UI on small screens.
    - **Layout Cleanup**: Restored `hidden lg:flex` to the desktop visualizer container in `tech-demo.html` to ensure it doesn't float over the mobile interface.

## [v2.631] - 2026-01-28
- **UI Logic Fix (Visualizer Injection)**:
    - **Legacy Purge**: Updated `AmpereAIChat.js` to force the destruction and re-creation of the Visualizer element when moving it to the active container. This prevents the "Old Icon" (the legacy visualizer from the hidden transcript window) from being moved into the main view, ensuring the new **Apple Glass Pill** component is always generated fresh.

## [v2.630] - 2026-01-28
- **cache-busting**: Updated `tech-demo.html` module import to `ai-chat.js?v=2.629` (previously 2.626) to ensure the new Apple Glass Pill and Squared Blocks visualizer loads for all users.

## [v2.629] - 2026-01-28
- **Visual Overhaul (Voice UV)**:
    - **Apple Glass Pill**: Wrapped the Voice Visualizer in a high-fidelity "Muted Pebble" glass container (\`bg-slate-900/90\`, \`backdrop-blur-xl\`, \`rounded-full\`, \`shadow-2xl\`) to match the system's "Glass OS" design language.
    - **Squared Aesthetics**: Changed the audio bars from rounded caps to **Squared-Off Blocks** (\`rounded-[1px]\`) to align with the wider blocky/technical or "UV System" aesthetic.
    - **Dramatic Presence**: Increased bar thickness to \`w-[8px]\` (from 6px) and container height to \`h-12\` (from h-8) for a much more visible and dramatic presence on desktop.
    - **Waiting State**: Restored the "Thinking/Waiting" animation (staggered pulse) when the agent is listening but not speaking. This ensures the interface never looks "frozen" or "off" during conversational pauses.

## [v2.628] - 2026-01-28
- **Visibility Guarantee (Visualizer)**:
    - **Container Logic**: Updated `tech-demo.html` to remove `hidden lg:flex` from the Voice Visualizer wrapper, making it visible on ALL screen sizes (`flex` by default). This solves the issue of it vanishing on tablets or smaller viewports.
    - **Visual Debug**: Added a subtle `bg-black/20 backdrop-blur-sm` wrapper around the bars so the container's footprint is always visible, even if the bars themselves are idle.
    - **Bar Dimensions**: Increased container height to `h-8` (was `h-6`) and hardcoded bar width to `w-[6px]` (pixel-perfect) to prevent Tailwind utility stripping or collapse.
    - **Fallback Color**: Added `bg-blue-500` as a fallback class for the bars in case the gradient plugin fails to load or render on some devices.

## [v2.627] - 2026-01-28
- **cache-busting**: Updated `tech-demo.html` module import to explicitly request `ai-chat.js?v=2.626` to force browsers to reload the new Visualizer code.

## [v2.626] - 2026-01-28
- **Visual Upgrade (Voice UV Waveform)**:
    - **ElevenLabs Aesthetic**: Replaced the static CSS pulse animation with a high-fidelity JS-driven waveform simulation. This mimics the official ElevenLabs "Bar Visualizer" component.
    - **Synthetic Look**: Updated the bars to use a Cyan-to-Blue gradient (`bg-gradient-to-t from-blue-500 to-cyan-300`) and increased thickness for a more robust "App-Like" feel.
    - **Dynamic Animation**: The bars now animate with variable heights (20-100%) and a center-bias algorithm when the agent is speaking, creating a realistic "voice energy" effect that responds to the conversation state.

## [v2.625] - 2026-01-28
- **Logic Hardening (Voice UV Injection)**:
    - **Enforced Relocation**: Updated `AmpereAIChat.js` to strictly enforce the visualizer's location. If the visualizer exists but is in the wrong container (e.g. the old Status Pill), it is now forcibly detached and moved to the new `#voice-visualizer-container`.
    - **Resilience**: This fixes edge cases where the visualizer might have been initialized in the old location before the new container was ready, or persisted across state changes.

## [v2.624] - 2026-01-28
- **UI Relocation (Voice UV)**:
    - **Strategic Placement**: Moved the Voice UV Visualizer from the Status Pill to a new dedicated location at the bottom-right of the left interface column. This places it centrally near the "Fold", creating a stronger visual connection between the Neural Architecture (Left) and the Voice Agent (Right).
    - **Injection Logic Priority**: Updated `AmpereAIChat.js` to prioritize the new `#voice-visualizer-container` ID if it exists, falling back to the Status Pill only if the container is missing (e.g., on Mobile).

## [v2.622] - 2026-01-28
- **Debug Instrumentation**: Added comprehensive console logging to `AmpereAIChat.js` to trace the injection path of the Voice UV Visualizer. This will help identify why the element is invalid or hidden in the production DOM.

## [v2.621] - 2026-01-28
- **Visual Visibility Fix (Voice UV)**:
    - **Enhanced Audio Visualizer**: Updated `ai-chat.js` to render the Voice UV bars with 100% opacity (up from 70%) and increased thickness (w-1 up from w-0.5) to ensure they are clearly visible against all backgrounds.
    - **Active State Priority**: The visualizer now strictly pulses at full opacity when the agent is speaking, and dims to 60% when listening, providing clear turn-taking feedback.

## [v2.620] - 2026-01-28
- **Logic Refinement (Standby & Voice UV)**:
    - **No "OFF" State**: Updated the global Power Button logic (`tech-demo.html`) to toggle between `ACTIVE` and `STANDBY`. The `OFF` state is now effectively unreachable by user interaction, ensuring the system always returns to the "Loaded" state (Standby) when powering down, as requested.
    - **Robust Voice UV**: Hardened the Audio Visualizer injection logic in `AmpereAIChat.js`. It now re-checks for the visualizer's existence in the DOM on every status update. If the visualizer was accidentally removed or detatched, it gets re-injected immediately. This guarantees the Voice UV bars appear when the conversation starts.

## [v2.619] - 2026-01-28
- **UI Logic Update (Default Standby)**:
    - **Session End Behavior**: Updated `tech-demo.html` to transition the system to `STANDBY` (instead of `OFF`) when the voice session ends. This aligns the "Post-Call" state with the "Initial Load" state.
    - **Status Text**: Updated `TechDemoScene.js` to display "STANDBY" (in Slate-400) when in Standby mode, and "DISCONNECTED" only if explicitly powered OFF. This ensures meaningful system status feedback.
    - **Voice UV Integrity**: Reinforced the Voice Visualizer injection logic in `ai-chat.js` to ensure the audio bars (Voice UV) appear reliably alongside the System UV dots during the active session.

## [v2.618] - 2026-01-28
- **Refinement (Persistent Status UI)**:
    - **Always-On Pill**: Updated `TechDemoScene.js` to force the Status Pill (System Status + UV Meter) to remain visible at all times in Pill Mode, regardless of system state (Active, Standby, or Off).
    - **Preventing Empty State**: This ensures that when the system is powered down or disconnected, users see the "DISCONNECTED" status and the (inactive) UV Dot structure, rather than an empty void which could be mistaken for a text input field.

## [v2.617] - 2026-01-28
- **Refinement (Status & Logic)**:
    - **Accelerated Power Up**: Increased `lerpSpeed` (0.015 -> 0.05) and `minVelocity` (0.0025 -> 0.01) significantly. The system now powers up ~3x faster, reducing the wait time during the "INITIALIZING" sequence.
    - **Status Conflict Resolution**: Updated `TechDemoScene.js` to respect the `AmpereAIChat` status. It effectively "unlocks" the status text when the Agent is Connecting or Connected, preventing the "AI ONLINE" idle loop from overwriting the connection messages.
    - **Unified Standby State**: Forced the Mobile Pill to display "DISCONNECTED" (in Slate Grey) immediately during power-down or standby, ensuring the "Off" state is identical to the "Load" state as requested.

## [v2.616] - 2026-01-28
- **Fix (Unified Status System)**:
    - **Non-Destructive Integration**: Updated `AmpereAIChat.js` to intelligently detect if the Status Pill is managed by `TechDemoScene.js `(Text + Dots). If found, it now updates the status *in-place* and appends audio visualizer bars, rather than wiping the entire container.
    - **Result**: This resolves the issue where the "Power Up UV" sequence (Dots) was being destroyed when the agent connected. Now, the UV Meter (Dots) remains visible alongside the Connection Status and Audio Visualizer, preserving the full animation sequence and system status context.

## [v2.615] - 2026-01-28
- **Fix (Animation Loop Initialization)**:
    - **Variable Initialization**: Fixed a critical race condition where `simIntensity` and `lightTargets` were undefined during the first few frames of the render loop (before the `setTimeout` callback in `initUI` triggered). This caused the animation variables to become `NaN`, effectively freezing the visual state and preventing the UV Meter from animating.
    - **Result**: The UV Meter and Power Up sequence should now animate correctly on load and interaction.

## [v2.614] - 2026-01-28
- **Fix (Desktop UV Restoration)**:
    - **Adaptive Dot Matrix**: Updated `TechDemoScene.js` to use an adaptive dot count for the Power Up UV Meter. It now correctly renders **20 dots** on Desktop (restoring the original high-fidelity visualization) while using **5 dots** on Mobile (to fit the compact pill).
    - **Status Logic**: Adjusted the Status Pill logic to explicitly display "DISCONNECTED" (instead of blank or "Power 0%") when the system is in Standby/Off mode on the Pill layout. This corresponds to the user's request for clear system state feedback on load.
    - **Visibility**: Forced the Status Pill to remain visible (opacity 1) even in Standby mode for the Pill layout, preventing the "vanishing UI" issue on mobile.

## [v2.613] - 2026-01-28
- **Fix (Mobile Status Injection)**:
    - **UV Matrix Restoration**: Fixed a logic gap in `TechDemoScene.js` where the "Dot Matrix" UV meter and Initialization text failed to render in the Mobile Status Pill. Explicitly enabled Pill Mode rendering for the dot row with a reduced count (5 dots) to fit the mobile layout while preserving the "Desktop-grade" system status aesthetic.

## [v2.612] - 2026-01-28
- **Logic Refinement (Status Sequence)**:
    - **Initialization Handover**: Removed the forced "Disconnected" status on page load in `AmpereAIChat`. This allows the `TechDemoScene` to correctly own the Status Pill during the boot-up sequence, displaying "INITIALIZING...", "SYSTEM CHECK", or "STANDBY" along with its own "Dot Matrix" UV meter, matching the Desktop experience.
    - **Audio/Visual Handshake**: Combined with the v2.611 audio delay, this ensures a clean sequence: Page Load -> Scene Initialization -> User Click -> Power Up Animation -> Agent Connects -> Visualizer Active -> Agent Speaks.

## [v2.611] - 2026-01-28
- **UI & Logic Refinement (Authentic Desktop Experience on Mobile)**:
    - **Pill Layout Restored**: Reverted the Mobile Status Pill to match the Desktop layout exactly (Visual parity). It now features the [Blue Dot] on the left, a vertical divider, and the [Status] on the right. The "Live Demo" text remains hidden on mobile to save space, but the structure is identical.
    - **Audio Delay**: Implemented a 1.8-second delay between the "Start Conversation" click (Power Up) and the actual Agent Connection. This ensures the 3D Power-Up animation completes its ramp-up sequence before "Emily" starts speaking, preventing audio/visual sync issues.

## [v2.610] - 2026-01-28
- **UI Refinement (Mobile Pill Finalization)**:
    - **Hidden Left Indicator**: On Mobile, the "Base Indicator" (Blue Dot + Live Demo text) is now completely hidden. The Status Pill now contains *only* the connection status (`DISCONNECTED` or `CONNECTED` + Visualizer). This removes all asymmetry and "empty space" to the right.
    - **Enhanced Visualizer**: Increased the height (`h-4`) and base opacity (`70%`) of the "UV Meter" bars in the pill to make them clearly visible on mobile screens against the dark background.
    - **Behavior**: The Visualizer now appears immediately upon connection start, ensuring the user gets feedback that audio is active.

## [v2.609] - 2026-01-28
- **UI Refinement (Mobile Space Optimization)**:
    - **Removed Divider Line**: On Mobile, the vertical divider line (`border-l`) and its associated padding (`pl-2`) inside the Status Pill have been removed. This eliminates the "dead space" or "double gap" between the Blue Indicator Dot and the Status Text using just a simple gap (`gap-2`).
    - **Result**: The "Disconnected" state is now tightly packed: `[ • DISCONNECTED ]`, removing the perception of extra empty space or misalignment. Desktop layout remains unchanged.

## [v2.608] - 2026-01-28
- **UI Logic Update (Status Pill Polish)**:
    - **Removed Connected Dot**: The static status dot in the "Connected" state has been removed. The UI now displays `[Text] [Visualizer]`, eliminating the "extra dot" that appeared between the text and the bars.
    - **Visual Hierarchy**: The Yellow Ping dot remains for "Connecting", and the Red dot for "Error", as these are critical state indicators without a visualizer.

## [v2.607] - 2026-01-28
- **UI Logic Update (Status Pill)**:
    - **Cleaner Disconnected State**: Removed the grey status dot when the system is in the "DISCONNECTED" state. The text label alone provides sufficient context, reducing redundancy and visual clutter (especially for the "Load Screen" initial state).
    - **Active States**: Connection and Connecting states retain their respective dots (Blue/Yellow) and animations.

## [v2.606] - 2026-01-28
- **UI Refinement (Mobile Clipping Prevention)**:
    - **Hidden Label**: The "LIVE DEMO" text label is now hidden on Mobile (`hidden lg:block`). The Blue Pulse Dot remains, acting as the system indicator. This recovers significant horizontal space.
    - **Responsive Tracking**: The "DISCONNECTED/CONNECTED" status text now uses standard tracking (`tracking-normal`) on Mobile instead of `tracking-widest`. It retains wide tracking on Desktop.
    - **Max Width Safety**: Added `max-w-[90vw]` to the pill container as a final fail-safe against horizontal overflow.

## [v2.605] - 2026-01-28
- **UI Refinement (Mobile Fitting)**:
    - **Compact Status Pill**: Reduced padding and gaps on the Status Pill specifically for Mobile screens (`gap-2`, `px-3`, `pl-2`) while maintaining full spacing on Desktop. This prevents the pill from clipping off the edges on narrower devices when displaying longer status messages like "DISCONNECTED".

## [v2.604] - 2026-01-28
- **UI Polish (Mobile Spacing & State)**:
    - **Header Pushed Down**: Increased top padding (`pt-24`) on the Mobile Header to clear the newly centered Status Pill. This aligns the "AI Neural Architecture" heading with the page gutters properly.
    - **Initial State**: The Status Pill now explicitly shows "Disconnected" (with a grey status dot) on page load, ensuring the UI is informative immediately.

## [v2.603] - 2026-01-28
- **UI Polish (Mobile Layout)**:
    - **Pill Alignment**: Restored absolute positioning for the Mobile Status Pill (`top-8`, Centered). This ensures it aligns neatly with the page top margin and doesn't "float" awkwardly in the content flow.

## [v2.602] - 2026-01-28
- **UI Refinement (Clean Mobile)**:
    - **Visualizer in Pill**: Moved the Audio Visualizer ("UV Meter") inside the unified Status Pill on Mobile. Now, when the user speaks, the pill animates, providing immediate feedback without needing the transcript window open.
    - **Removed Breadcrumbs**: Hid the secondary navigation breadcrumbs on Mobile to reduce header clutter.
    - **Pill Positioning**: Updated the status pill to flow naturally in the layout on Mobile (removed fixed positioning) to prevent overlap with headers or notches.
    - **Refined Status**: The pill now shows Text + Connection Dot + Audio Visualizer (when active).

## [v2.601] - 2026-01-28
- **UI Refactor (Mobile Simplification)**:
    - **Unified Status Pill**: The "Live Demo" pill (previously Desktop only) is now the primary status indicator for BOTH Mobile and Desktop. It is centered at the top of the screen on Mobile.
    - **Removed Power Button**: The separate Power Button on Mobile/Tablet has been removed. The "Start Conversation" button is now the sole interaction point to wake the system.
    - **Removed Standby Pill**: The segregated "Standby/Power" pill on Mobile has been removed to reduce clutter.
    - **Transcript Toggle**: Retained the Transcript Toggle in the top-right corner as a subtle utility.

## [v2.600] - 2026-01-28
- **Feature (Hidden Transcript)**:
    - **Phone Metaphor**: The AI conversation now follows a "Phone Call" metaphor. The transcript window remains hidden by default when a voice session starts.
    - **Context-Aware Controls**: Added a "Show Transcript" icon button beside the **Power Button** (on both Desktop and Mobile).
    - **Logic**:
        - The transcript button is **hidden** by default.
        - It is only revealed when the system is **Powered ON** (Visual State: ACTIVE).
        - Clicking it toggles the transcript window without affecting the voice session.
    - **Wiring**: Removed direct `textChatBtnId` mapping in favor of manual event listeners to support multiple buttons (Desktop/Mobile contexts).

## [v2.598] - 2026-01-28
- **Refactoring (Modal Simplification)**:
    - **Single Primary Action**: Removed the separate "Chat" button. The primary interaction is assumed to be **Voice First**.
    - **Fallback Logc**:
        - If "Start Conversation" is clicked and no microphone is detected:
        - The chat window opens automatically.
        - A "System Dialog" appears inside the chat history offering two options:
            1.  **Retry Mic**: Reloads the page/context to try again.
            2.  **Use Text Chat**: Enables the text input for typing-based interaction (without audio input).
    - **System Messages**: Updated `addMessage` to support HTML content, allowing interactive buttons inside system notifications.

## [v2.597] - 2026-01-28
- **Refactoring (Error Handling)**:
    - **Microphone Check**: Added explicit pre-check for microphone access before attempting to start the AI session.
    - **Friendly Dialogue**:
        - If microphone access is denied or no device is found, the system now displays a helpful message in the chat window: **"Microphone not detected. Please connect a microphone to start the conversation."**
        - This replaces generic connection errors with specific guidance for users without audio hardware.
    - **Status UI**: Updates the status pill to "No Mic Detected" in red when this occurs.

## [v2.596] - 2026-01-28
- **Refactoring (Global State Enforcement)**:
    - **Concept**: Ensures the AI Chat Interface respects the global machine state (ACTIVE/STANDBY/OFF) regardless of how that state was reached (e.g., auto-timeout, manual power toggle, etc.).
    - **Behavior**:
        - If the system transitions to **STANDBY** or **OFF** for any reason, the **Chat Window is immediately forced hidden** and any active AI session is terminated.
        - This prevents the chat window from "hanging around" when the machine powers down or sleeps.
    - **Implementation**:
        - Hooked into the `MutationObserver` monitoring `data-system-state` on the body tag to trigger cleanup logic on non-ACTIVE states.

## [v2.595] - 2026-01-28
- **Feature (Unified Power Architecture)**:
    - **Synchronized Systems**: The "Power Button" (Visuals) and "Start/End Conversation" (AI) are now functionally linked as a single system.
    - **Flows**:
        - **Power Button ON**: Turns on the 3D scene lights/rings AND automatically starts the AI Agent session.
        - **Power Button OFF**: Powers down the visuals AND hangs up the AI / Closes chat window.
        - **Start Conversation / Chat**: Starting the AI via buttons automatically triggers the visual "Power Up" sequence for the machine.
        - **End Call / Close Window**: Ending the AI session automatically triggers the visual "Power Down" sequence.
    - **Implementation**:
        - Updated `AmpereAIChat` to support `onStart` and `onEnd` callbacks.
        - Wired `tech-demo.html` to bi-directionally sync `window.demoScene` state with `window.ampereAI` session state.

## [v2.594] - 2026-01-28
- **Refactoring (Chat Connection Logic)**:
    - **Unified Connection**:
        - Clicking the **"Chat"** button now **automatically starts the voice/agent session** if not already connected. Previously it only opened the UI.
        - This ensures users immediately hear the agent's voice and see the greeting upon opening the chat window, fulfilling the "immediate response" requirement.
    - **Message Handling**:
        - Implemented `onMessage` handler in the ElevenLabs client configuration.
        - Incoming transcriptions from the agent ("Agent Speaking") are now displayed as bubbles in the chat window.
        - Added `addMessage` support for System messages ("Connection established").
    - **UI Polish**:
        - Refined chat bubble styles (rounded corners, borders) to distinguish User vs Agent vs System messages.

## [v2.593] - 2026-01-28
- **Refactoring (Chat UX Refinement)**:
    - **Buttons & Layout**:
        - Reduced CTA button sizes to standard "Pill" dimensions (`px-5 py-2.5`) to match system design.
        - Fixed typo: "Star Conversation" -> "Start Conversation".
        - Added tooltips to Voice ("Start Voice Mode") and Chat ("Open Text Interface") buttons.
        - Replaced initial voice button icon with a microphone SVG.
    - **Chat Interaction**:
        - **Text Input**: Added a functional text input field and send button to the chat window. Users can now type messages.
        - **Close Control**: Added a close button (X) to the internal chat header. Clicking it hangs up the session and hides the window.
        - **Modality**: Chat button now focuses the input field when opening the window.

## [v2.592] - 2026-01-28
- **Refactoring (Interaction Modalities)**:
    - **Concept**: Separated "Voice Mode" and "Text Mode" into distinct interaction paths, replacing the single integrated widget button.
    - **Voice Mode (Primary)**:
        - Moved the **"Start Conversation"** button out of the chat window and into the main "Left Column" text area as a primary CTA.
        - **Visuals**: Large pill button, blue heavy shadow, highly visible below the main description.
        - **Logic**: Directly triggers the ElevenLabs session. Auto-reveals the visualizer window upon connection.
    - **Text Mode (Secondary)**:
        - Added a discrete **"Chat"** text button next to the voice button.
        - **Logic**: Toggles the visibility of the "Transcript/Chat Window" (Right Column) without necessarily starting audio.
    - **Status Integration**:
        - Wired `AmpereAIChat` to inject its connection status (Connecting, Secure, Error) directly into the new **Live Demo Pill** (Status Window), unifying all system status indicators in one top-bar location.
        - Removed legacy status headers from the Chat Window itself to reduce clutter.

## [v2.591] - 2026-01-28
- **Refactoring (Status Window Integration)**:
    - **Concept**: Refactored the floating "UV Display" / "Active Status" cluster into the **Live Demo Pill**. It is no longer a separate floating element attached to the neural net container.
    - **Live Demo Pill**:
        - Expanded the pill to serve as a comprehensive **Status Window**.
        - Left side: Retained Pulsing Dot + "Live Demo" label.
        - Right side: Added a dynamic injection target for the System Status.
    - **JS Logic**:
        - `TechDemoScene` now creates the Status UI (Dot Row + Text + Warning) inside the Pill's injection target if available.
        - **Layout Switch**: When inside the Pill, the status UI switches to a **Horizontal (Flex Row)** layout (`Text | Dots`) instead of the vertical stack.
        - **Typography**: Switched status text to `JetBrains Mono` for consistency.
        - **Visuals**: Dots are now smaller (6px) and tighter (4px gap) to fit the inline bar format.

## [v2.590] - 2026-01-28
- **Layout Tuning (Bottom Flush)**:
    - **Scene Container**: Removed `lg:pb-32` (8rem padding). This constraint was artificially holding the 3D visuals up. By removing it, the `justify-end` wrapper can now push the Neural Net/Ring to the absolute bottom of the card, maximizing the clearance from the Header Text.

## [v2.589] - 2026-01-28
- **Layout Recovery (Zero-Height Fix)**:
    - **Issue**: In v2.588/587, setting `h-auto` on the Ring Container without an explicit aspect ratio caused it to collapse to 0px height because its children were relying on `h-full` (parent reference).
    - **Fix**: Added `lg:aspect-square` directly to the `Ring Container`. This gives it an *intrinsic* height based on its width (which is expanded to `w-full`), forcing it to occupy physical space even when `h-auto`.
    - **Alignment**: Retained `justify-end` on the wrapper to keep this now-visible square anchored to the bottom of the card.

## [v2.588] - 2026-01-28
- **Layout Recovery & Refinement (Scene Visibility)**:
    - **Fix**: Reverted `tech-demo-wrapper` to `h-full` to fix the height collapse introduced in v2.587 (where `h-auto` parents caused `h-full` children to disappear).
    - **Alignment**: Applied `lg:justify-end` to the *wrapper* rather than the container.
    - **Sizing**: Switches the inner Ring Container to `lg:h-auto` (previously `h-full`). This allows the visual block to size itself naturally (max 800px width/height) and be pushed to the bottom of the wrapper by the flex alignment, ensuring it sits as low as possible without shrinking.

## [v2.587] - 2026-01-28
- **Layout Finalization (Bottom Anchor)**:
    - **Container Alignment**: Switched `tech-demo-scene-container` from `lg:justify-center` to `lg:justify-end`. This strictly anchors the visual content to the bottom of the card/column.
    - **Wrapper Logic**: Removed `lg:mt-48` and switched the wrapper to `lg:h-auto` with `lg:max-h-full`. This allows the wrapper to shrink to the content size (maintaining the aspect-square width) and sit at the bottom of the column, maximizing the gap between the Header Text and the Visualization.

## [v2.586] - 2026-01-28
- **Layout Tuning (Neural Net Alignment)**:
    - **Visual Translation**: Replaced `lg:pt-64` with `lg:mt-48` on the `tech-demo-wrapper`.
    - **Outcome**: This pushes the Neural Net and Halo Ring down by 12rem (clearing the "AI Neural Architecture" header) *without* compressing the container height. This ensures the visuals retain their full original width and impact, fulfilling the "push down, but width remains the same" requirement.

## [v2.585] - 2026-01-28
- **Layout Repair (Scene Alignment)**:
    - **Container Restoration**: Reverted the `tech-demo-scene-container` top position back to `lg:top-8` (2rem). This restores the correct layout symmetry where the left and right columns are perfectly aligned at the top.
    - **Internal Shift**: Applied `lg:pt-64` (16rem) to the *internal* `tech-demo-wrapper` instead. This successfully pushes the Neural Net and Halo visuals down to clear the header text, *without* breaking the container boundary or hiding the top-right Power button.

## [v2.584] - 2026-01-28
- **Layout Adjustments (Desktop)**:
    - **Header Clearance**: Increased the top inset of the Scene Container from `lg:top-40` to `lg:top-64` (16rem). This aggressive spacing ensures the 3D Neural Net visuals are pushed well below the absolute-positioned Page Title and Description, preventing overlap on all screen heights.

## [v2.583] - 2026-01-28
- **Layout Adjustments**:
    - **Chat Interface Relocation**: Successfully moved the AI Chat widget from the mobile slider area to the top of the **Right Column** (`#tech-demo-right-column`). It now sits directly above the card stack on all devices, respecting the column's width and padding.
    - **Scene Spacing**: Pushed the **Neural Net / Scene Container** down on desktop (`lg:top-8` -> `lg:top-40`). This creates significant vertical clearance (10rem) to ensure the scene visuals do not overlap or crowd the Helper/Title text in the top-left corner.

## [v2.581] - 2026-01-28
- **Fix: AI Chat SDK Import**:
    - **Corrected Package Name**: Switched the import from the non-existent `@elevenlabs/convai` to the correct `@elevenlabs/client` package.
    - **CDN**: Updated to use `https://esm.sh/@elevenlabs/client?bundle`. This resolves the `500 Server Error` seen in the console when trying to load the chat module.

## [v2.580] - 2026-01-28
- **Feature: Inline AI Chat (Glass Interface)**:
    - **Custom UI**: Replaced the floating ElevenLabs widget with a fully custom "Glass Card" interface powered by the ElevenLabs SDK.
    - **Integration**: Encapsulated in a new `AmpereAIChat` module (`assets/js/ai-chat.js`).
    - **Placement**: Integrated directly into the Mobile DOM flow (between the Neural Orb and the Sliders), solving the "random floating overlay" issue.
    - **Visuals**: Features a real-time listening/speaking status dot, pulsing audio visualizer, and "Action Area" buttons (Start/End) styled to match the site's glassmorphism aesthetic.

## [v2.579] - 2026-01-28
- **Mobile UI (Padding)**: Increased the bottom padding of the card slider track to `pb-12` (3rem). This ensures the horizontal scrollbar sits comfortably below the cards with a clear visual gap, preventing it from touching the content.

## [v2.578] - 2026-01-28
- **Mobile Layout (Gap Fix)**:
    - **Removed Minimum Height**: Removed the `min-h-[60vh]` constraint from the card slider track on mobile. This was forcing a large empty gap below the cards. The container now `shrink-wraps` (`h-auto`) to the actual card height.
    - **Visual Adjustment**: Added `pb-6` (1.5rem) padding to the slider track. This ensures the scrollbar (and screen bottom) don't visually "choke" the card content, providing a cleaner look while remaining compact.

## [v2.577] - 2026-01-28
- **Mobile Layout (Refinement)**:
    - **Zero-Gap Scrollbar**: Removed internal padding (`pb-4` -> `0`) from the card slider track. The visual scrollbar now sits directly flush against the card content boundary.
    - **Container Tightening**: Reduced external column padding (`pb-12` -> `pb-4`) to eliminate the visual gap between the card stack and the bottom of the screen.

## [v2.576] - 2026-01-28
- **Mobile Experience**: 
    - **Zen Mode Disabled**: Completely disabled card expansion ("Zen Mode") on mobile phone screens (`< 768px`). Users will now view cards directly in the horizontal slider to prevent navigation confusion and overlapping artifacts.
    - **Tablet Support**: Maintained Zen Mode capability for Tablet and Desktop devices (`>= 768px`) where the screen real estate supports strictly centered or grid-based expansion.

## [v2.575] - 2026-01-28
- **Mobile Zen Mode (Alignment)**:
    - **In-Line Expansion**: Cards now expand strictly from their scroll track position (`startTop`, `startLeft`) instead of centering on screen. This maintains the "scroller context" and prevents the disorienting "hovering" effect.
    - **Anchored Geometry**: Width exactly matches the card slot. Max-height fills the space below the header to the bottom of the screen (`availableSpace`).

## [v2.574] - 2026-01-28
- **Mobile Card UI Polish**:
    - **Header Sizing**: Reduced title size to `clamp(1.1rem, 4cqw, ...)` and added `line-clamp-2` to prevent overflow on small screens.
    - **Safe Area**: Increased header margin to `mr-16` (4rem) to ensure the title never overlaps the Close button.
    - **Breathing Room**: Increased card internal padding to `pt-10 pb-8 pl-8` and metric grid spacing to `gap-y-5`.

## [v2.573] - 2026-01-28
- **Mobile Zen Mode**: 
    - **Content-First Sizing**: Cards now expand to specific content height (`auto`) instead of filling the full screen height.
    - **Vertical Centering**: Expanded cards are perfectly centered on screen using `transform: translate(-50%, -50%)`.
    - **Height Limits**: Capped to `calc(100vh - 64px)` with internal scrolling enabled if content overflows. This eliminates the "empty space" issue on shorter cards.

## [v2.572] - 2026-01-28
- **Mobile Zen Mode**: Removed opening animation on mobile devices. Cards now expand instantly to the centered "Zen" position, mirroring the instant-close behavior. This eliminates visual distraction and layout interpolation artifacts during the transition.

## [v2.571] - 2026-01-28
- **Mobile UI Polish**: 
    - **Card Parsing**: Increased internal padding (Top 2rem, Bottom/Left 1.5rem) for better content breathing room on mobile.
    - **Uniform Height**: Implemented strict JavaScript-based height equalization. Measures the tallest card content and enforces that height across the entire slider to prevent "stepping" visual defects. (Refactored to `CardExpander` module).

## [v2.570] - 2026-01-28
- **Zen Mode (Mobile):** Removed closing animation on mobile devices. Cards now close instantly to prevent layout thrashing and "bounce" artifacts.
- **Controller Logic:** Implemented auto-close for expanded cards when a new agent is selected via the ring slider.
- **UI Polish:** Enforced a minimum height (500px) on all agent cards to ensure uniform alignment regardless of content length.

## [v2.567] - 2026-01-28
- **Zen Mode (Fixed):**
    - **Universal Target**: Rewrote the target calculation to ignore the parent container's unpredictable scroll position on mobile. Now uses `window.innerHeight` and `window.innerWidth` with a fixed `16px` (1rem) safe area.
    - **Result**: The card will now reliably open to fill the screen (minus 16px margins), centered perfectly, regardless of whether the column is scrolled, offset, or sticky.

## [v2.566] - 2026-01-28
- **Zen Mode Logic**:
    - **Positioning Engine**: Rewrote the `expand` logic to use `position: fixed` coordinates relative to the Viewport, instead of calculating Absolute offsets.
    - **Mobile Fix**: This resolves the issue where expanding a card on mobile (scrolled view) caused it to open "lower" than expected. The new calculation (`paddingTop` of container) ensures precise 16px/32px vertical alignment on all devices, regardless of scroll position.

## [v2.565] - 2026-01-28
- **Card Animation System**:
    - **Clipped Animation Fix**: Overhauled the card closing animation (`collapse`) to use `position: fixed` instead of `absolute`. This solves a critical bug on Mobile where the shrinking card would be "trapped" and clipped inside the `overflow: auto` scroll track, causing visual artifacting, cropped content ("trailed animation"), and misalignment ("dropped/lower" appearance). The card now floats above all containers until fully restored to its slot.

## [v2.564] - 2026-01-28
- **Zen Mode Fixes**:
    - **Closing Animation**: Fixed visual artifacts (jumping/stuttering) when closing an expanded card by enforcing a JS-driven `transition` matching the CSS cubic-bezier curve (`0.5s`), ensuring the card smoothly glides back to its original grid slot.
    - **Layout Stability**: Removed `transform: none` on the close button in expanded state, restoring intended hover transitions.

## [v2.563] - 2026-01-28
- **Mobile UI Fixes**:
    - **Card Opener**: Hidden the "Expand/Maximize" button on Agent Cards for mobile devices (`< 1024px`) to prevent text clipping on smaller screens. The button remains accessible on Desktop via hover.

## [v2.562] - 2026-01-27
- **Mobile Interaction Refinement**:
    - **Left Alignment**: Changed the scroll snap alignment behavior from `center` to `start` (Left Aligned), satisfying the request for the active card to be positioned "all the way to the left".
    - **Scroll Sync Logic**: Updated `scrollIntoView` to use `inline: 'start'`, ensuring the card aligns perfectly with the left edge of the container (respecting padding) when triggered via the slider.

## [v2.561] - 2026-01-27
- **Mobile Interaction**:
    - **Smooth Scroll Sync**: Connected the Mobile Active Agent Slider (Inner Ring) to the card scroll track. Changing the agent on the slider now smoothly scrolls (`behavior: 'smooth'`) the corresponding card to the center of the screen.

## [v2.560] - 2026-01-27
- **Mobile Card UI**:
    - **Single Card View**: Increased mobile card width to `85%` (was `40%`) to display a single focused card with a visual "peek" of the next card, improving focus and scroll affordance.
    - **Vertical Fix**: Increased track minimum height to `60vh` to prevent content clipping on mobile screens.
    - **Zen Mode Fix**: Updated expanded card behavior to use `position: fixed` on mobile, ensuring expanded cards break out of the horizontal scroll track and overlay the full screen correctly.

## [v2.558] - 2026-01-27
- **Mobile Polish**:
    - **Visual Fix**: Removed the background blur and border from the sticky mobile controls to clean up the UI transparency.
    - **Scroll Logic**: creating a "Center Snap" behavior for the Active Agent scroll sync. `scrollIntoView` now targets `inline: 'center'` instead of `start`, ensuring the active card is perfectly centered and never cut off by the screen edge.

## [v2.557] - 2026-01-27
- **Mobile Experience Upgrade (< 1024px)**:
    - **Horizontal Scroll Track**: Replaced the tight grid layout with a horizontal "Snap Scroll" track for Agent Cards. Viewport now fits ~2.5 cards visible at once (`min-w-[40%]`).
    - **Scroll Sync**: Changing the "Active Agent" via the bottom slider now automatically scrolls the track to center the corresponding card.
    - **Sticky Controls**: Restored "Sticky" positioning for the bottom control slider cluster, ensuring it remains accessible while scrolling through cards. Added a glass backdrop (`bg-slate-900/80`, `blur-md`) for legibility.
    - **Power Tooltip**: Moved the Desktop Power Button tooltip from "Left" to "Below" (Centered) to prevent layout clipping.

## [v2.556] - 2026-01-27
- **Device Support (Tablet / Compact)**:
    - **Layout Consistency**: Applied the iPad Pro layout logic (Floating UI) to the Tablet/Compact range (`820px - 1023px`).
    - **Behavior**: Forced `position: absolute` for both the Status Meter and Control Sliders, stacking them at `bottom: 19rem` and `bottom: 15rem` respectively. This ensures the Chat Widget has ample clearance on smaller tablet devices as well.

## [v2.555] - 2026-01-27
- **Device Support (iPad Pro)**:
    - **UI Polish**: Raised the Control Sliders to `bottom: 15rem` (from 11rem) to maximize clearance for the Chat Widget while maintaining a safe visual gap (~4rem) below the UV Meter (`19rem`).

## [v2.554] - 2026-01-27
- **Device Support (iPad Pro)**:
    - **Visual Calibration**: Optimized the vertical placement to ensure the UI sits "Just below the Ring" but keeps the sliders clear of the Chat Widget.
        - **UV / Status Meter**: Lowered to `bottom: 19rem` (from 28rem) to sit cleanly below the "Dashed Ring" / Neural Net.
        - **Control Sliders**: Lowered to `bottom: 11rem` (from 18rem) to provide distinct separation below the UV, while comfortably clearing the screen bottom.

## [v2.553] - 2026-01-27
- **Device Support (iPad Pro)**:
    - **Stacking Fix**: Corrected the stacking order of the Bottom UI elements.
        - **UV / Status Pill**: Moved to `bottom: 28rem` (Upper Position).
        - **Control Sliders**: Moved to `bottom: 18rem` (Lower Position).
        - **Fix**: Resolves the intersection issue where the sliders were inverted and rendering on top of the status meter. Forced `position: absolute` on the slider container to ensure deterministic placement relative to the viewport/master container.

## [v2.552] - 2026-01-27
- **Device Support (iPad Pro)**:
    - **UI Polish**: Further increased the separation between the Bottom Sliders and the "UV" Status Pill to `6rem` (`bottom: 24rem`) to accommodate the Standby Counter and prevent intersection.

## [v2.551] - 2026-01-27
- **Device Support (iPad Pro)**:
    - **UI Polish**: Increased vertical separation between the Bottom Sliders and the "UV" / Status Pill by `3rem` (setting Sliders to `bottom: 21rem`) to prevent visual overlap.

## [v2.550] - 2026-01-27
- **Device Support (iPad Pro)**:
    - **Layout Fix**: Shifted the bottom UI controls (Sliders & UV/Status Meter) upwards significantly (`bottom: 18rem`) on iPad Pro Portrait (`1024px`) to provide ample clearance for the embedded Chat Widget.
    - **Refinement**: Tightened vertical spacing within the slider cluster to reduce visual noise in the raised position.

## [v2.549] - 2026-01-27
- **Visual Polish (Zen Mode Scaling)**:
    - **Feature**: Implemented expansive typography scaling for "Zen Mode" (Expanded Card View).
    - **Behavior**: When a card is expanded, the content (Header, Subheader, Metrics table, and LED bars) now scales up significantly (2x-3x) to utilize the increased screen real estate, rather than remaining small in a vast container.
    - **Technical**: Added CSS overrides in `src/input.css` targeting `.socket-card-container.is-expanded`. Uses `clamp()` and container queries/viewport units to ensure smooth scaling.

## [v2.548] - 2026-01-27
- **Visual Polish (Standby Sync)**:
    - **Logic Update**: Switched the Standby Pulse animation from CSS (`animate-pulse-slow`) to a JavaScript-driven opacity update in the main render loop.
    - **Context**: The Power Button now "breathes" in perfect synchronization with the Neural Net's ambient/core light pulse (~7s cycle), creating a unified "alive" feeling.
    - **Implementation**: `tech-demo-scene.js` now captures `.power-toggle-btn` elements and updates their opacity based on the scene's internal `sine` wave generator.

## [v2.547] - 2026-01-27
- **Visual Polish (Standby Pulse)**:
    - **Color Update**: Changed Power Button Standby color from `text-amber-400` to lighter `text-amber-300` (less orange) as requested.
    - **Animation**: Added `.animate-pulse-slow` to the Standby state. The Power Button (and its glass container) now breathes slowly (4s cycle) when the system is ready, replacing the static amber state.
    - **Implementation**: Updated both the initial HTML state and the JS state logic in `tech-demo.html`.

## [v2.546] - 2026-01-27
- **Visual Polish (Standby Init)**:
    - **Logic Update**: Updated the *initial* HTML class state of the Power Buttons (Desktop & Mobile) to use `text-amber-400` instead of `text-slate-500`.
    - **Context**: Since the application boots into "Standby" (not Off), the button icon should immediately reflect the Amber readiness state before any JS updates kick in. This eliminates the "Slate Flash" on load.

## [v2.545] - 2026-01-27
- **Visual Polish (Power Button)**:
    - **Standby State**: Updated the Power Button icon color in Standby mode to **Amber** (`text-amber-400`).
    - **Context**: Previously, the button would appear Green (Active) or Slate (Off). The Standby state is now distinct, indicating the system is "Ready" but not "Active".
    - **Logic**: Updated `updateMobileDisplay` in `tech-demo.html` to explicitly handle `STANDBY` state separation.
        - **Active**: `text-emerald-400` + Rotation.
        - **Standby**: `text-amber-400`.
        - **Off**: `text-slate-500`.

## [v2.544] - 2026-01-27
- **Visual Polish (Active Text)**:
    - **Correction**: Manually set the "Front Door Agent" text (Index 1) to the **Active Green** state (`fill-emerald-400` + Glow) in the HTML markup.
    - **Context**: In v2.543, all text was set to the inactive slate color. Since "Front Door Agent" is the default active selection on load, it appeared "off" until the user interacted with the ring. This fix ensures the initial state matches the active selection logic.
    - **Inactive States**: Confirmed all other indices (3, 5, 7, 9, 11) are set to the muted `fill-slate-500/50`.

## [v2.543] - 2026-01-27
- **Visual Polish (Text Muting)**:
    - **Concept**: The text labels on the Halo Rings were visually competing with the central elements due to their high brightness and glow.
    - **Implementation**:
        - **Inactive State**: Changed the default text style from `fill-blue-400` (Outer) / `fill-slate-400` (Inner) with glows to a unified, muted **`fill-slate-500/50`** with **no drop-shadows**.
        - **Active State**: Preserved the `fill-emerald-400` + `drop-shadow` for the selected item.
    - **Result**: The text now recedes into the background until activated, creating a cleaner, less cluttered visual hierarchy centered on the orb.
    - **Reversion**: Removed the radial gradient experiment from v2.542 and restored the solid dark band (`slate-800/20`) as per user instruction.

## [v2.542] - 2026-01-27
- **Visual Polish (Gradient Halo)**:
    - **Concept**: Applied a Radial Gradient to the Outer Halo Ring to verify visual consistency with the Card Styles ("linear gradient mapping").
    - **Implementation**:
        - **Radial Gradient**: Defined a `radialGradient` (`#grad-ring-track`) that mimics the card's subtle glass reflection.
            - Stops:
                - 75%: Transparent (Inner Edge)
                - 85%: `slate-800/40` (Mid Band Body)
                - 95%: `white/5` (Outer Glint)
                - 100%: Transparent (Outer Edge)
        - **Application**: Applied this gradient as the `stroke` content for the main 60px Ring Band.
    - **Goal**: To visually "connect" the central control element with the surrounding card aesthetics using shared lighting/gradient logic.

## [v2.541] - 2026-01-27
- **Visual Polish (Dark Halo)**:
    - **Concept**: Changed the Outer Halo Ring from a "Light/Glass" aesthetic (`white/10`) to a "Dark/Stealth" aesthetic to blend with the background.
    - **Implementation**:
        - **Band**: Changed from `stroke-white/10` (Light) to `stroke-slate-800/20` (Dark, subtle tonal shift).
        - **Borders**: Changed from `stroke-white/20` to `stroke-slate-700/30`.
    - **Interaction**: Preserved the `hover:stroke-cyan-400` state, allowing the ring to illuminate only when interacted with. This fulfills the requirement for the ring to be "dark, almost the same color as the background" while resting.

## [v2.540] - 2026-01-27
- **Visual Polish (Central Orb Scale)**:
    - **Reverted**: Rolled back the scene-wide camera zoom from v2.539. This was inadvertently scaling the outer cage/icosahedron.
    - **Sphere Geometry**: Directly applied the 20% size increase to the internal Sphere Geometry and its associated Circuitry Paths.
        - **Desktop Radius**: `0.72` -> `0.864`
        - **Mobile Radius**: `0.864` -> `1.037`
    - **Outcome**: The central black orb and its blue circuitry are now significantly larger, while the outer wireframe cage remains at its standard size, creating a denser, more filling core visualization.

## [v2.539] - 2026-01-27
- **Visual Polish (Neural Halo & Orb)**:
    - **Logic Fix (Orb Size)**: Updated `tech-demo-scene.js` to correctly calculate the scene camera distance based on a 20% larger target fill percentage (increased from 0.95 to 1.15). The previous HTML data-attribute change was being overridden by the responsive layout logic.
    - **Halo Ring Interaction**: Restored and improved the interaction state for the outer Halo Ring (`#halo-ring-outer`).
        - **Base State**: `stroke-white/10` (Slightly more visible than v2.538).
        - **Hover State**: Added `hover:stroke-cyan-400/30` with a smooth 500ms transition. This restores the "responsive" feel of the UI that was lost in the previous update.

## [v2.538] - 2026-01-27
- **Visual Polish (Neural Halo)**: Refined the visual weight of the central Neural Network visualization.
    - **Lighter Ring**: Changed the background Halo Ring color from `stroke-blue-500/10` to `stroke-white/5`. This makes the ring feel more translucent and less "tinted", fitting the lighter aesthetic.
    - **Larger Orb**: Increased the visual diameter of the Central Orb by ~20% (reduced camera distance from `13.0` to `10.8`). This makes the neural activity more prominent in the frame.

## [v2.537] - 2026-01-27
- **Visual Polish (Button Blending)**:
    - **Reduced Opacity**: Lowered the background opacity of the Card Launch Buttons from `bg-white/10` to `bg-white/5`.
    - **Context**: The buttons were appearing "lighter" than the card background because their 10% white layer was stacking on top of the card's local 5% white gradient. Reducing to 5% brings the total tonal value closer to the card body, making the buttons feel more integrated and less like "stickers".

## [v2.536] - 2026-01-27
- **Visual Polish (Green Glass)**: Refined the Active State of the Master Power Button to be much more subtle.
    - **Deep Tint**: Instead of replacing the dark glass with a light transparent green (which felt "ghostly"), we now **tint** the dark glass base with green (`rgba(6, 40, 25, 0.75)`). This preserves the solid "pebble" weight of the button while clearly indicating it is ON.
    - **Subtle Rim**: Reduced the green rim highlight opacity to `0.2`, making the translucency feel natural and high-end.

## [v2.535] - 2026-01-27
- **Visual Polish (Button Simplification)**:
    - **No Bottom Glint**: Removed the bottom "rebound" glint from both the Master Power Button and all Card Launch Buttons. Lighting is now strictly top-down (12 o'clock only), making the controls feel more grounded and less "shiny/glassy".
    - **No Drop Shadows**: Removed the heavy `box-shadow` and `drop-shadow` effects from buttons to flatten the UI and reduce visual noise.
    - **Active State (Power)**: Added a **Light Green Background** (`bg-green-500/20`) to the Master Power Button when in the `ACTIVE` state. This replaces the previous "Rotated Glint" logic, providing a clearer, more standard "On" indicator.
    - **No Rotation**: Removed the 180° rotation animation from the Master Power Button. It now remains static, using color (Green vs Slate) to indicate state.

## [v2.534] - 2026-01-27
- **Visual Polish (Icon Scaling)**: Reduced the size of specific dashboard icons that felt visually overweight compared to the rest of the set.
    - **Front Door Agent**: Scaled down from `w-6 h-6` (24px) to `w-5 h-5` (20px).
    - **Onboarding Coach**: Scaled down from `w-6 h-6` (24px) to `w-5 h-5` (20px).
    - **Sales Advisor**: Scaled down from `w-6 h-6` (24px) to `w-5 h-5` (20px).
    - **Context**: These icons use full-bleed 32x32 viewboxes, making them appear larger than standard 24px outlined icons. The reduction brings their visual weight into parity with the other card controls.

## [v2.533] - 2026-01-27
- **Visual Polish (Card Buttons)**:
    - **Unified Glint Physics**: Updated all socket card buttons (Launch triggers) to match the new **vertical lighting model** used by the Master Power Button.
        - **Change**: Replaced the diagonal 180° gradient with a strictly vertical (Top-to-Bottom) glint.
        - **Stops**: Glint is strong at 12 o'clock (0.8 opacity), softens at 15%, disappears in the middle, and reappears softly at 6 o'clock (0.2 opacity).
    - **Interaction Update**: Removed the `hover:rotate-180` animation from card buttons. They are now statically oriented (12/6 axis) to feel like physical controls rather than spinning icons.

## [v2.532] - 2026-01-27
- **UX Improvement (Desktop Controls)**:
    - **Dynamic Tooltip**: Added a hover-state tooltip to the Desktop Power Button (`top-right`) that explicitly states the action ("Turn On", "Turn Off", "Wake") before clicking.
    - **ARIA Support**: Added `aria-label` and `aria-pressed` attributes that update dynamically with system state, improving accessibility.
    - **Visual Fix (Status Meter)**: Restored the "Glass Pill" container styling (`bg-black/40`, `backdrop-blur`) to the bottom Power/UV Meter, ensuring it matches the Standby Warning pill.
    - **Visual Polish (Glint)**: Softened the `linear-gradient` stops on the `.apple-glass` class to eliminate the sharp "aliasing" edge effect on the top button glint.

## [v2.530] - 2026-01-27
- **Interaction Logic (Rocker Switch)**:
    - **Hover Fix**: Disabled CSS-based rotation on hover for the `.apple-glass` element.
    - **Issue**: On Desktop, the hover state (force-rotating to 180°) was conflicting with the System State logic (where "On" meant 360° or 180° depending on previous state), causing inconsistencies in the "Click" status visualization.
    - **Resolution**: Rotation is now **JavaScript-driven only** via the `.apple-glass-rotated` class. "On" corresponds to a simple 180° flip (swapping the glints), and "Off" corresponds to 0° (Standard). Hovering no longer rotates the glint, preventing the "Click Status" mismatch.

## [v2.529] - 2026-01-27
- **Visual Polish (Standby Visuals)**:
    - **Standby Warning Pill**: Restored the "Pill" styling for the `STANDBY IN 30S` warning text on Desktop.
        - **Style**: Applies `bg-black/40`, `border-white/10`, and `backdrop-blur` to match the Standard Pill aesthetic used elsewhere (like the Live Demo badge).
        - **Fix**: Previously, the warning was just floating text. It now sits inside a proper container for better visibility and consistency.

## [v2.528] - 2026-01-27
- **UI Architecture (Desktop Power Cluster)**:
    - **Concept Shift**: Replaced the Desktop Slider Control with the **Mobile Power Button** (Rocker Switch style).
    - **Layout**:
        - **Control**: The Rocker Switch is positioned at the **Top Right** (`lg:top-28 lg:right-12`), sitting with "breathing room" beneath the Live Demo Pill.
        - **Meter**: The Status Display (Dots + Text) is preserved and remains centered **underneath the Neural Net** (at the bottom of the scene container).
    - **Removal**: Removed the Desktop Slider Track and its associated drag/resize logic from `tech-demo-scene.js`. 
    - **Logic**: Unified the power toggle logic. Both the Mobile and Desktop buttons now share the same `power-toggle-btn` class and state synchronization (controlled by `window.toggleMobilePower` and observed via mutation observer).

## [v2.527] - 2026-01-27
- **Tooling Fix (Validator)**: Upgraded `scripts/validate_js.sh` to enforce Strict ESM validation.
    - **Issue**: The previous validator (`node --check file.js`) was too lenient with CommonJS files, allowing invalid class syntax (like undeclared private fields) to pass silently.
    - **Fix**: The validator now pipes content to `node --check --input-type=module`. This forces strict mode and treats all JS files as ES Modules, ensuring that syntax errors—including the one that caused the v2.525 regression—are caught before publish.

## [v2.526] - 2026-01-27
- **Hotfix (Critical)**: Fixed a `SyntaxError` in `tech-demo-scene.js` introduced in v2.525.
    - **Issue**: A template literal was prematurely closed during the removal of the specific border layer CSS, causing subsequent CSS rules to be parsed as invalid JavaScript.
    - **Fix**: Restored the integrity of the CSS injection string.

## [v2.525] - 2026-01-27
- **Visual Polish (Desktop Restorations)**:
    - **Live Demo Pill (Desktop)**: Restored to the canonical "Standard Pill" style (`bg-black/40` + `border-white/10`).
        - **Fix**: Removed the `.apple-glass` class which was mistakenly applied, causing the pill to inherit the "Rocker Switch" vertical glints (which look broken on non-interactive display pills).
    - **Desktop Control Cluster**: Restored to a clean, flat aesthetic.
        - **Fix**: Removed the injected `#ampere-ui-border-layer` (the pseudo-element that creates the spinning/rocking glints). The wide, pill-shaped track handles shadows better with a simple `border-white/10` than with the complex localized glint physics meant for round buttons.

## [v2.524] - 2026-01-27
- **Interaction Polish**: 
    - **Active Glint**: The "Rotating Glint" animation (180-degree border spin) now triggers on both `hover` and `active` (mouse down) states. This provides a subtle "button press" simulation where the light refraction shifts as pressure is applied.

## [v2.514] - 2026-01-27
- **Visual Polish (Clean Glass)**:
    - **No Gradient Blur**: Removed all `text-shadow` glows from the Desktop Control Cluster labels, ensuring a crisp, clean appearance consistent with the "Glass Pebble" aesthetic.
    - **Mobile Layout**: Swapped the positions of the Mobile Power Button (now Left) and Status Pill (now Right) to better align with the new header hierarchy.

## [v2.513] - 2026-01-27
- **Visual Refresh (Icon-Only Color)**: Finalized the "Glass Pebble" control aesthetic.
    - **Thumb/Button Transparency**: Removed all underglow and background tints from the toggle buttons. They are now purely clear glass (`apple-glass`).
    - **Icon Illumination**: Color (Green/Emerald) is now applied **strictly** to the icon SVG (Mobile) or Text Label (Desktop), ensuring the glass lens only reflects/refracts the content behind it.
    - **Mobile Power**: Updated the mobile toggle logic to remove `bg-emerald` tints, relying on `text-emerald` and `drop-shadow` on the icon itself.

## [v2.512] - 2026-01-27
- **Visual Refresh (True Pebble Glass)**: Refined the control aesthetics to match the "Glass Stone" request.
    - **Thumb**: Removed all gradient fills and gradient blurs from the thumb body. It is now a purely transparent glass "pebble" (`rgba(255,255,255,0.05)`) with a sharp shadow (`0 4px 12px`) and a subtle inner reflection.
    - **Color Logic**: Color is now provided strictly by an under-glow element (`#ampere-thumb-glow`) sitting *behind* the glass surface, diffusing softly (`blur(6px)`).
    - **Interaction**:
        - **Live Demo Pill**: Hovering this *non-button* element NO LONGER triggers the border rotation animation.
        - **Interactive Buttons**: Only actionable elements (Track, Thumb, Mobile Toggles) trigger the rotating glint on hover.
    - **Text**: Status labels now use flat colors (Emerald for Active, Slate for Standby) with cleaner shadows, abandoning the "glowing neon" look.

## [v2.511] - 2026-01-27
- **Visual Polish (Pebble Glass)**: Refined the glass aesthetic based on "Muted Pebble" feedback.
    - **Material**: Increased opacity (`rgba(20,20,24,0.85)`) and blur (`40px`) to create a solid, muted feel instead of a thin steel sheet.
    - **Glints**: Implemented a rotating "Incomplete Border" animation. Hovering the track or button rotates the gradient border 180 degrees, shifting the highlight position dynamically.
    - **Uniformity**: Applied this logic to both the `tech-demo-scene.js` Control Cluster and the global `.apple-glass` utility (Live Demo Pill, Mobile Toggles).

## [v2.510] - 2026-01-27
- **Visual Refresh (2026 Apple Glass)**: Implemented "Incomplete Border" glass effect.
    - **Aesthetic**: Replaces the "frosted/steel" look with a darker, transparent glass (`rgba(0,0,0,0.4)`) featuring diagonal gradient borders (`135deg`) that simulate light glints on broken edges.
    - **Application**: Applied to all key interactive elements including the Live Demo Pill, Mobile Slider Track, and toggles.
    - **Zen Mode**: Removed `isolate` property to fix transparency issues on expanded cards.

## [v2.509] - 2026-01-27
- **Fix (iPad Pro)**: Hidden the Zen Mode expand trigger (`.expand-trigger`) specifically on iPad Pro Portrait (`width: 1024px`) to prevent visual overlap with the card controls. Users can still expand cards by clicking anywhere on the card body.

## [v2.508] - 2026-01-27
- **Fix (Card Interaction)**: Resolved the "Right Shift" issue in expanded state ("Zen Mode").
    - The expander now dynamically calculates the target `left` and `width` based on the container's computed padding (`div.paddingLeft`), rather than using hardcoded values.
    - This ensures the expanded card aligns perfectly with the visual edges of the content column, regardless of asymmetric padding rules (`lg:pl-2`/`pr-6`).

## [v2.507] - 2026-01-27
- **Fix (Card Styles)**: Added deep background color (`rgba(10, 10, 15, 0.95)`) and backdrop blur to Expanded Cards ("Zen Mode"). This prevents underlying cards from being visible through the expanded state.
- **Fix (Z-Index)**: Explicitly enforced `z-index: 50 !important` and shadow depth in CSS for the expanded state to ensure correct layering.

## [v2.506] - 2026-01-27
- **Fix (Layout)**: Removed `isolation: isolate` from Socket Cards. This reverts a legacy change (v2.436) that was causing Z-index stacking issues for the expanded "Zen Mode" card state.
- **Fix (Card Interaction)**: Ensuring the expanded card properly overlays siblings without clipping or margin artifacts.

## [v2.505] - 2026-01-27
- **Tech Demo UI**: Reverted "Apple Glass" effect on Desktop Control Cluster and Live Demo Pill (User Request: "Should not have been touched").
- **Mobile Controls**: Maintained the new "Apple Glass" look (`.apple-glass`) on the mobile Standby/Power buttons exclusively.

## [v2.504] - 2026-01-27
- **Tech Demo UI**: Applied "Apple-like" Glass effect to all control elements (Live Demo pill, Mobile controls, Desktop Control Cluster).
- **Refactor**: Unified glass styling using `.apple-glass` class and matching injected styles.

## [v2.503] - 2026-01-27
- **Tech Demo Spacing (Mobile)**:
    - **Header Vertical Rhythm**:
        - **Lifted Breadcrumbs**: Reduced the header container's top padding from `pt-12` to `pt-8`.
        - **Increased Gap**: Increased the margin between the breadcrumbs and the heading from `mb-1` to `mb-8`.
    - **Result**: The breadcrumb now sits higher on the screen, with a substantial visual gap separating it from the main title, improving legibility and modernizing the layout balance on small screens.

## [v2.502] - 2026-01-27
- **Responsive Typography & Layout (Mobile/Tablet)**:
    - **Heading & Blurb**: Significantly increased base font sizes for screens 1023px and down.
        - Heading: `text-5xl` (was `text-4xl`).
        - Blurb: `text-lg` (was `text-sm`).
    - **Power Cluster**: Relocated the mobile power controls (Standby/Toggle) from the top-right (`right-4`) to the top-left (`left-8`). This aligns it vertically with the Header's content indentation (`p-8`), creating a cleaner left-aligned vertical rhythm on mobile devices.

## [v2.501] - 2026-01-27
- **Responsive Layout Fix (iPad Air / Tablet)**:
    - **Range Definition**: Redefined the tablet layout range to `820px - 1023px` (strictly excluding 1024px iPad Pro).
    - **Stacked Layout**: Enforced `width: 100%` and `height: auto` for both columns within this range.
    - **Context**: This fixes an issue where iPad Air devices (820px) were correctly stacking vertically (due to being `< lg`), but were inheriting the `42%/58%` width constraints intended for the desktop/iPad Pro split view, resulting in narrow centered columns. They now correctly fill the screen width.

## [v2.500] - 2026-01-27
- **iPad Pro Refinement (Live Demo Pill)**:
    - **Positioning Fix**: Updated the scoped CSS for the `820px-1024px` range to use `right: 3rem !important` (was 5rem).
    - **Alignment**: This ensures the pill is correctly positioned at 3rem from the right edge on iPad Pro, matching the new Desktop positioning and correcting the unintentional 5rem override that was migrated from the legacy inline styles.

## [v2.499] - 2026-01-27
- **Tech Demo Refinement (Desktop)**:
    - **Live Demo Pill**: Adjusted position to `lg:right-12` (3rem) to perfectly mirror the Header's left indentation (`pl-12`). This ensures symmetric "hanging" alignment relative to the Scene Container's borders on both sides.

## [v2.498] - 2026-01-27
- **Tech Demo Refinement (Desktop)**:
    - **Header Indentation**: While maintaining the 1.5rem (`lg:left-6`) structural gutter for the Scene Container, we increased the Header's left padding to `lg:pl-12` (3rem).
    - **Logic**: This creates a 1.5rem "internal indentation" relative to the Scene Container's border, ensuring the breadcrumb and title don't feel "jammed" against the screen edge despite the tighter global margins.

## [v2.497] - 2026-01-27
- **Tech Demo Refinement (Desktop)**:
    - **Tighter Gutters**: Reduced the global horizontal page gutters on Desktop from `3rem/2rem` to a symmetric `1.5rem` (24px) to match the iPad Pro "Compact" layout spacing.
        - Header: `lg:px-6` (was `12`)
        - Live Demo Pill: `lg:right-6` (was `12`)
        - Scene Container: `lg:left-6` (was `8`)
        - Right Column: `lg:pr-6` (was `8`)

## [v2.496] - 2026-01-27
- **Tech Demo Refinement (Desktop)**:
    - **Vertical Spacing**: Increased the desktop header top padding `lg:pt-20` (5rem) to strictly match the iPad Pro vertical positioning, ensuring consistent alignment of the breadcrumb and title across large screens.

## [v2.495] - 2026-01-27
- **Refactoring (Tech Demo)**:
    - **CSS Migration**: Moved all inline styles from `tech-demo.html` to `src/input.css`.
    - **Scoped Styles**: Strictly scoped all moved styles to `#tech-demo-master` and `.tech-demo-page` to prevent global conflicts.
    - **Cleanup**: Removed the `<style>` block from `tech-demo.html`.

## [v2.494] - 2026-01-27
- **iPad Pro Refinement (Page Gutters)**:
    - **Symmetric Margins**: Reduced the Right Column's right padding from `2rem` (default) to `1.5rem` (`padding-right: 1.5rem !important`) within the iPad Pro media query.
    - **Logic**: This now exactly matches the Left Column's visual left gutter (`left: 1.5rem`), creating perfect symmetry on the outer edges of the screen (1.5rem Left / 1.5rem Right).

## [v2.493] - 2026-01-27
- **iPad Pro Refinement (Column Gap)**:
    - **Gap Synchronization**: Adjusted the Scene Container's width calculation in the iPad Pro profile from `calc(100% - 3rem)` to `calc(100% - 2.5rem)`.
    - **Logic**: With a fixed left offset of `1.5rem`, this new width leaves exactly `1rem` of empty space on the right edge of the Left Column. This perfectly matches the `gap-4` (1rem) grid spacing used between cards in the Right Column, satisfying the design requirement.

## [v2.492] - 2026-01-27
- **iPad Pro Refinement (Header Spacing)**:
    - **Increased Breathing Room**: Increased the top padding of the Left Column Header (`#tech-demo-header`) from ~3rem to `5rem` within the iPad Pro breakpoint range.
    - **Logic**: This pushes the breadcrumb and "AI Neural Architecture" title down, creating more negative space at the top of the interface as requested.

## [v2.491] - 2026-01-27
- **iPad Pro Refinement (Vertical Alignment)**:
    - **Header Balance**: Corrected the visual starting height of the Left Column by pushing the Scene Container top offset from `1rem` to `2rem`.
    - **Symmetry**: This ensures the Left Column's visual border starts at the exact same Y-coordinate as the Right Column's content (which has `pt-8` / 2rem padding), resolving the "Left side higher than right" discrepancy.

## [v2.490] - 2026-01-27
- **iPad Pro Specific (Visual Correction)**:
    - **Isolation Strategy**: Removed all previous Tailwind-based adjustments (which inadvertently affected Desktop) and migrated all iPad Pro specific fixes to the dedicated `@media (min-width: 820px) and (max-width: 1024px)` CSS block.
    - **Header Alignment**: Increased Header Left Padding to `2.75rem` while keeping Scene Container at `1.5rem`. This pushes the "AI Neural Architecture" text visually *inside* the border-radius container by 1.25rem, fixing the "hanging outside" look.
    - **Pill Offset**: Shifted the "LIVE DEMO" pill to `right: 5rem` (from 1.5rem). This moves it significantly leftwards, preventing it from bisecting the radius corner and providing the requested right margin.
    - **Column Balance**: Applied the `42% / 58%` column width split *strictly* to the iPad Pro breakpoint range, ensuring Desktop remains 50/50.
    - **Scroll Unlock**: Unlocked vertical scrolling (`overflow-y: auto`) exclusively for this tablet range.

## [v2.489] - 2026-01-27
- **iPad Pro Refinement (Visual Alignment)**:
    - **Header Containment**: Increased Left Column Header padding from `p-6` (1.5rem) to `p-8` (2rem) and reduced Scene Container offsets to `top-4/left-4`. This ensures the "AI Neural Architecture" title sits visually *inside* the border-radius container (1rem clear margin) rather than hanging outside it.
    - **Pill Adjustment**: Shifted the "LIVE DEMO" status pill to the left (`right-12` -> `right-20`) to grant it more breathing room from the container edge on tablet screens, as requested.

## [v2.488] - 2026-01-27
- **iPad Pro Layout Optimization**:
    - **Native Scrolling**: Relaxed the viewport lock from `lg:overflow-hidden` to `xl:overflow-hidden`. This restores native vertical scrolling on iPad Pro devices (width < 1280px) while maintaining the fixed "app-like" experience on large desktops.
    - **Grid Maximization**: Shifted column balance from 50/50 to ~42/58 (`lg:w-[42%]` / `lg:w-[58%]`) to grant significantly more horizontal space to the data grid.
    - **Space Efficiency**: Reduced Left Header padding (`lg:p-12` -> `lg:p-6`) and removed redundant column gutters (`lg:pl-0`) to push content closer to the edges, utilizing the full tablet screen width.

## [v2.487] - 2026-01-27
- **UI Tuning (Title Typography)**:
    - **Reduced Heading Scale**: Updated the container query clamp for Agent Card Titles from `max 2.5rem` to `max 1.75rem`.
    - **Logic**: Caps the headline size on ultra-wide screens to maintain a balanced hierarchy with the newly compacted metrics grid.

## [v2.486] - 2026-01-27
- **UI Tuning (Typography & Layout)**:
    - **Reduced Metrics Scale**: Updated the container query clamp for metrics from `max 1.75rem` to `max 1.1rem`.
        - **Logic**: This prevents the data grid font from becoming excessively large on ultra-wide screens (e.g., 3000px width), keeping it dense and legible.
    - **Tightened Grid**: Reduced vertical gap from `gap-y-6` (1.5rem) to `gap-y-2` (0.5rem) on desktop.
    - **Result**: The data tables are now much more compact and professional, avoiding the sparse/huge look on large displays.

## [v2.485] - 2026-01-27
- **Rendering Optimization (Artifact Fix)**:
    - **Backdrop Blur Removal**: Removed `backdrop-blur-md` from all 6 Agent Cards (`.socket-card-container`).
    - **Reasoning**: The dynamic repainting of these elements (triggered by SVG path updates or interactions) combined with cached blur layers was causing persistent pixel bleeding and artifacting. Since the card backgrounds are essentially transparent glass over empty space, the expensive blur filter was unnecessary and its removal eliminates the graphical glitch.

## [v2.484] - 2026-01-26
- **Typography Stabilization (Ultra-Wide support)**:
    - **Unit Change**: Switched all container query units in the card internal layouts from `cqw` (width-based) to `cqmin` (min of width/height).
    - **Impact**: This prevents fonts from exploding to massive sizes on ultra-wide screens (e.g. 3000px width) where the container height remains relatively standard. The text scaling is now constrained by the limiting dimension (usually height in these aspect ratios), ensuring "uniform" and sane readability across all form factors.

## [v2.483] - 2026-01-26
- **Layout Stabilization (Card Background Sync)**:
    - **Visual Fix**: Resolved the "repaint/detachment" glitch where the glass card backgrounds would drift or snap separately from their SVG borders during resize.
    - **Method**: 
        - Added `socket-background` class to the backdrop blur layers.
        - Updated `glass-socket.js` to programmatically apply the exact same calculated Bezier path to the background's `clip-path` (via `path()`), ensuring pixel-perfect 1:1 synchronization with the border.
    - **DevOps**: Updated `tech-demo.html` to use local `glass-socket.js` import for faster iteration and to replace the stale hardcoded CDN link.

## [v2.482] - 2026-01-26
- **Deployment Fix (Cache Busting)**:
    - **CSS Link**: Updated the stylesheet link in `tech-demo.html` with a version query string (`?v=2.482`).
    - **Resolution**: Forces browsers to load the freshly compiled CSS (which contains the removal of the `#tech-demo-right-column` padding override) instead of serving the cached legacy version.

## [v2.481] - 2026-01-26
- **Layout Fix (Desktop Override Removal)**:
    - **CSS Cleanup**: Removed specific `!important` padding overrides for `#tech-demo-right-column` in the tablet/compact-desktop range (820px-1024px).
    - **Resolution**: This override was preventing the Tailwind classes (`lg:pl-2`) from taking effect, preserving the "huge gap". Removing it allows the new 1rem gap logic to apply correctly.

## [v2.480] - 2026-01-26
- **Layout Unification (Center Column Seam)**:
    - **Gap Reduction**: Tightened the central gap between the Neural Net (Left Column) and the Card Grid (Right Column).
    - **Symmetry**: Reduced Scene `lg:right` inset from 4 to 2, and Grid `lg:pl` from 4 to 2.
    - **Visual Result**: The central column gap is now 1rem (`0.5rem` + `0.5rem`), matching strictly with the `gap-4` (1rem) used between the grid cards. This eliminates the "huge gap" dissonance.

## [v2.479] - 2026-01-26
- **Layout Precision (Expand Button & Gap)**:
    - **Expand Trigger**: Updated positioning to `top-[0.7rem] right-[4.8rem]` (arbitrary values) to perfectly nestle the button into the socket's bezier curve.
    - **Content Gutter**: Standardized the metrics grid padding to `pr-8` (2rem). This matches the visual rhythm of the larger `lg:gap-8` layout elements found elsewhere, providing a balanced clearance that isn't as loose as 2.5rem but not "jammed" like 1.5rem.

## [v2.478] - 2026-01-26
- **Final Layout Polish (Scrollbar & Gutter)**:
    - **Scrollbar Position**: Doubled the right spacing of the container (`pr-2` -> `pr-4` on desktop) to move the scrollbar distinctly inwards from the card edge.
    - **Content Gutter**: Increased the metrics grid right padding (`pr-6` -> `pr-10` / 2.5rem) to ensure massive separation between the data and the scrollbar.

## [v2.477] - 2026-01-26
- **Layout Tuning (Content Spacing)**:
    - **Scrollbar Gap**: Increased the padding-right of the inner metrics grid from `pr-2` (0.5rem) to `pr-6` (1.5rem).
    - **Visual Result**: The scrollbar stays near the right edge, but the content is pushed significantly left, creating a clear "gutter" between the data and the scroll control to prevent jamming.

## [v2.476] - 2026-01-26
- **Layout Tuning (Scrollbar Breathing Room)**:
    - **Balanced Insets**: Adjusted parent container padding to `pl-8` (Left) but `pr-2` (Right).
    - **Result**: The scrollbar is no longer "jammed" against the border (it has `0.5rem` clearance) but is still pushed further right than the content, creating distinct visual layers.
    - **Vertical Rhythm**: Restored `py-8` to parent, simplifying header/grid margins.

## [v2.475] - 2026-01-26
- **Layout Consistency (Global Scrollbar Fix)**:
    - **Global Application**: Applied the "Right-Aligned Scrollbar" fix to ALL 6 agent cards (previously only applied to Booking Agent).
    - **Uniformity**: Ensured all cards (Front Door, Sales, Support, etc.) now have flush-right scrollbars with proper content insets.

## [v2.474] - 2026-01-26
- **Layout Refinement (Scrollbar)**:
    - **Right-Aligned Scrollbar**: Restructured the card content container to remove parent padding.
    - **Content Spacing**: Migrated padding to the Header and Grid directly (`mx`, `mt` for header; `pl` for grid) to ensure the scrollbar sits flush against the right edge of the card while content remains visually inset.

## [v2.473] - 2026-01-26
- **Layout Restoration & Spacing**:
    - **Corner Reset**: Restored Main Icon button to absolute zero (`top-0 right-0`) as requested.
    - **Expand Trigger**: Positioned to the left (`top-2 right-20`) with meaningful spacing to let the design breathe.

## [v2.472] - 2026-01-26
- **Layout Adjustment (Buttons)**:
    - **Reverted Positioning**: Moved the Expand Trigger back to the top-right horizontal row (`top-5 right-20`), aligned with the Main Icon (`top-5 right-5`).
    - **Reason**: User feedback indicated the stacked approach (v2.471) felt unnatural, effectively requesting a restoration of the previous horizontal layout logic.

## [v2.471] - 2026-01-26
- **Zen Mode Scaling & Layout Fixes**:
    - **Smart Typography Scaling**: Replaced strict `min()` clamps with `clamp(min, cqw, max)` logic. This fixes the issue where text stayed tiny in expanded mode (creating gaps) while preventing it from exploding indefinitely.
    - **Button Layout**: Restored the Main Glass Icon to `top-5 right-5` and positioned the Expand Trigger vertically below it (`top-20 right-5`) for a clean, aligned control stack.

## [v2.470] - 2026-01-26
- **Zen Mode & Layout Stabilization**:
    - **Visual Fix (Text Explosion)**: Replaced unbounded `cqw` units with `min(cqw, rem)` clamps for all metrics and headers. This prevents typography from becoming comically large when the card expands to fill the screen (Zen Mode).
    - **Grid Alignment**: Added proper flex alignment to numeric data cells (`flex items-center justify-end`) to ensure they stay vertically centered with their corresponding rows and graphs.
    - **Button Positioning**: Moved the Top-Right button cluster (Icon & Expand Trigger) inward by ~1.5rem (`top-4 right-6`) to provide breathing room from the viewport edge in Zen Mode.

## [v2.469] - 2026-01-26
- **Layout Refinement (Metrics Scroll)**:
    - **No Card Scroll**: Reverted the card content container to `overflow-hidden` to prevent unwanted scrollbars on the card body itself.
    - **Internal Metrics Scroll**: Applied `overflow-y-auto` specifically to the Metrics Grid container (`div.grid`).
    - **Preservation**: This ensures the card shell remains fixed size while allowing the data list to scroll if it exceeds available space, satisfying the requirement for "growing content without destroying grid layout".

## [v2.468] - 2026-01-26
- **UX Improved (Zen Button + Interaction)**:
    - **Moved "Open Zen" button**: Relocated from bottom-right to **top-right** (beside the card icon). This eliminates content clipping issues without requiring excessive padding.
    - **Card Click Expansion**: Enabled "Click Anywhere" on the card to trigger Zen Mode, improving accessibility and usability (especially on touch devices).
    - **Cleanup**: Removed the `!pb-20` padding fix from v2.467 as it is no longer needed.

## [v2.467] - 2026-01-26
- **UI Fix (Zen Button Clipping)**: Added `!pb-20` to the Agent Card content containers.
    - **Issue**: The absolute positioned Expand/Zen button (Bottom-Right) was being overlapped by the metrics content on full cards.
    - **Fix**: Increased bottom padding on the scrolling content area to guarantee a 5rem safety clearance, ensuring the content flow terminates before intersecting the button.

## [v2.466] - 2026-01-26
- **System Restore**: Performed a hard rollback of `deploy/tech-demo.html`, `context.md`, and `CHANGELOG.md` to version `v2.445.stable`.
    - **Reasoning**: Recent layout changes (v2.450+) introduced persistent regressions in the Header alignment, Right Column Gutters, and Zen Mode interactivity.
    - **State**: The codebase is now mathematically identical to the stable release from earlier today.

## [v2.445] - 2026-01-26
- **Interaction Correction**: Confirmed the retention of `group-hover` triggers for the Glass Button (Background & Rotation) to maintain the "Card Hover" feedback loop requested by design.
- **Rendering Fix (Rotation Bleed)**: Added `overflow-hidden` and `isolate` to the Glass Button container (`.w-14.h-14`). This creates a strict stacking context and clipping mask around the rotating SVG, preventing the animation's repaint rect from spilling over onto adjacent cards (the source of the "gradient bleed").

## [v2.444] - 2026-01-26
- **Interaction Refinement (Decoupled Hover)**: Decoupled the Glass Button interactions from the main Card hover state.
    - **Background**: `hover:bg-white/5` (was `group-hover:...`). Now only brightens when the button itself is hovered.
    - **Rotation**: `group-hover/button-trigger:rotate-180` (was `group-hover:...`). Now only rotates when the button is specifically hovered.
    - **Reasoning**: This prevents the heavy rotation redraw from triggering constantly as the user moves across the grid ("card hover"), restricting it to deliberate button interactions. This should eliminate the residual artifacting on neighbor cards.

## [v2.443] - 2026-01-26
- **Feature Restoration**: Re-enabled the `group-hover:rotate-180` animation on the Agent Card glass buttons. With the underlying rendering layer fix from v2.442 (removing forced GPU promotion on backdrops) confirmed to solve the bleed issues, this animation can now safely return without triggering artifacts.

## [v2.442] - 2026-01-26
- **Rendering Fix (Card Backdrops)**: Removed `transform: translate3d(0,0,0)` and `backface-visibility: hidden` from the card backdrop layers. These forced promotions were causing persistent layer bleeding on inactive cards by creating large, overlapping GPU textures. Reverting to standard flow context allows `isolation: isolate` on the container to properly manage the stacking context.

## [v2.441] - 2026-01-26
- **Test (Artifacting)**: Temporarily disabled the `rotate-180` animation on the Glass Button hover state. This is a diagnostic step to confirm if the continuous repaint caused by the SVG rotation is the trigger for the "gradient bleed" flashes on adjacent cards.

## [v2.440] - 2026-01-26
- **Rendering Fix (Button Artifacts)**: Removed unnecessary `transform: translateZ(...)` forced layer promotions from the Glass Button and its internal icon. These properties, when combined with the card's backdrop-filter, were triggering GPU texture bleeds on adjacent cards during hover animations.
- **Cleanup**: Stripped `will-change: backdrop-filter` to further reduce GPU memory pressure and artifacting potential.

## [v2.439] - 2026-01-26
- **Critical Rendering Fix**: Removed `will-change: backdrop-filter` from all Agent Cards. This property was causing aggressive GPU layer promotion that led to "gradient bleed" artifacts and flashing on adjacent cards during hover states. The removal relies on standard compositing which handles the static blur correctly without the artifacting side effects.

## [v2.438] - 2026-01-26
- **Global Rollout (Zen Mode)**: Applied the "UV Meter" scaling fix to **all 5 remaining Agent Cards** (Demo Guide, Onboarding, Technical, Sales, Booking). Now every single metric bar in the grid scales proportionally using `em` units when expanded, maintaining perfect layout ratios.

## [v2.437] - 2026-01-26
- **Visual Fix**: Completed the UV Meter scaling update for *all* metrics in the Front Door Agent card (Bounce, Routed, Avg Time, etc.), ensuring they all resize correctly in "Zen Mode".
- **Rendering Isolation**: Applied `isolation: isolate` to ALL socket cards (not just the active one) to permanently prevent stacking context leakage and shadow artifacts during hover or expansion.

## [v2.436] - 2026-01-26
- **Visual Fix (Zen Mode)**: "UV Meter" bars in the Agent Card stats now use relative `em` units instead of fixed pixels. This ensures they scale up beautifully alongside the text when the card is expanded, rather than remaining tiny.
- **Rendering Fix**: Added `isolation: isolate` to Agent Cards to contain stacking contexts. This prevents the hover effects (glow/blur) of one card from causing repainting artifacts on adjacent cards.

## [v2.435] - 2026-01-26
- **Critical Fix**: Improved Halo Ring coordinate detection by using `getScreenCTM()` instead of simple rect scaling. This eliminates persistent offset errors caused by container padding or aspect ratio clamping, ensuring the mouse position exactly matches the SVG visual geometry.
- **Tuning**: Re-aligned hit zones closer to visual bounds (Inner: 180-265, Outer: 275-400) now that the underlying math is precise.

## [v2.434] - 2026-01-26
- **UX Refinement**: Increased the "Dead Zone" between the Inner and Outer rings to **25px** (Inner Max: 255px, Outer Min: 280px) to practically eliminate accidental ring switching.
- **Visual Feedback**: Refactored the Halo Wheel hover effect to use robust CSS class swapping (`stroke-blue-500/10` ↔ `stroke-blue-500/50`) instead of style manipulation, ensuring reliable visual feedback on all browsers.

## [v2.433] - 2026-01-26
- **Visual Feedback**: Added dynamic hover highlighting to the Halo Wheel rings. When a user hovers over a ring's interaction zone (Inner or Outer), the ring's stroke opacity boosts from 10% to 50%, clearly indicating which ring will be grabbed.

## [v2.432] - 2026-01-26
- **UX Refinement**: Tightened hit detection zones for the 3D Halo Wheel to eliminate ambiguous clicks. Added a "Dead Zone" (0-150px) in the center and capped the outer ring (450px) to prevent accidental edge interactions.
- **Visual Feedback**: Implemented cursor state changes (`cursor: grab`) when hovering over valid ring interaction zones, improving affordance on desktop.

## [v2.431] - 2026-01-26
- **Animation Logic**: Implemented Hysteresis Thresholding for card power states.
- **Power Up**: Cards now wait until system intensity hits 95% (synced with "AI ONLINE") before activating.
- **Power Down**: Cards remain active until system intensity drops below 10%, ensuring they visually "drain" with the power meter instead of snapping off immediately.

## [v2.430] - 2026-01-26
- **Visual Sync**: Synchronized the "Power Up" animation of Agent Cards with the system initialization ramp-up. Cards now remain in standby until the system initialization reaches ~80%, providing a more cohesive "power grid" effect. (Previously, they snapped to active instantly).
- **Optimization**: Applied `transform: translate3d(0,0,0)` and `backface-visibility: hidden` to glass cards to eliminate shader artifacting/flickering during focus changes or scrolling.
- **Refactor**: Cleaned up inline styles for GPU compositing layers.

## [v2.429] - 2026-01-26
- **Feature**: Wired the "Halo Wheel" (and mobile slider) to the Agent Cards.
- **Interaction**: Rotating the inner wheel now selects the active agent in real-time.
- **Visuals**: As the user turns the wheel, the corresponding agent card lights up (`active` state) while others dim (`standby` state). This works for both Desktop 3D Ring and Mobile Range Slider.

## [v2.428] - 2026-01-26
- **Interaction Logic**: Connected the Global Power State (`ACTIVE` / `STANDBY` / `OFF`) to the individual Agent Card visual states.
- **Power Up Behavior**: When system enters `ACTIVE` state, the Front Door Agent automatically wakes up (`active` state), while other agents remain in `standby`.
- **Power Down Behavior**: When system enters `STANDBY` or `OFF` state, ALL agents (including Front Door) revert to `standby` mode.

## [v2.427] - 2026-01-26
- **Live/Standby States**: Implemented visual state logic for Agent Cards in the Power Cluster.
- **Default State**: "Front Door Agent" is now the only active card (`data-agent-status="active"`). All other agents are dimmed and desaturated (`data-agent-status="standby"`).
- **Visuals**: Standby agents are at 50% opacity and 100% grayscale to reduce visual noise and focus attention on the active agent.

## [v2.426] - 2026-01-26
- **Refactor**: Renamed all internal references, comments, and documentation from "Range Slider" to "Range Meter" to better reflect the non-interactive visualization nature of the component.

## [v2.425] - 2026-01-26
- **UI Unification**: Transformed all standard progress bars into "LED Glass Range Meters".
- **Visuals**: Meters now mimic the "Power Cluster" glass block aesthetic with segmentation (8px block / 2px gap) and bevels.
- **Performance**: Utilized CSS Masking and Repeater Gradients (`repeating-linear-gradient`) to simulate segmented LEDs without increasing DOM node count.

## [v2.424] - 2026-01-26
- **Typography**: Converted Socket Card typography to use Container Queries (`cqw`). Titles, subtitles, and metrics now scale fluently with the card width.
- **Motion**: Eliminated text "snapping" during card expansion (Zen Mode); text size now transitions continuously using the container's easing curve.
- **Visibility**: Increased base scaling factors for Metrics to improve readability on large screens.

## [v2.423] - 2026-01-26
- **UI Upgrade**: Replaced standard dots with "Glass Blocks" (8x12px) in the Power Cluster.
- **Visuals**: Blocks feature inner depth shadows (inactive) and complex illuminated glow (active) for a more tactile, premium feel.

# Changelog

## [v2.422] - 2026-01-26
- **Restored**: UI Status Dots in Power Cluster (20-dot row).
- **Updated**: Range dots now use Emerald Green theme (`#10b981`) to match the Power Up button.
- **Design**: "Dot Gauge" established as the standard visualization for range sliders.

# Changelog
### Changed
## [v2.421] - 2026-01-26
### Changed
- **Tech Demo UI**: Added "Glass Lift" hover effect to the Power Cluster track. On hover, the control lifts (`translateY(-1px)`), the shadow deepens, and a subtle rim light appears.

- **Tech Demo UI**: Improved contrast on "Power Up" button. Darkened green background and changed text to White for better legibility.

## [v2.418] - 2026-01-26
### Changed
- **Tech Demo UI**: Updated "Power Up" active state color from Blue to Emerald Green for clearer status indication.

## [v2.417] - 2026-01-25

### Changed
- **Glass Button Accuracy**: Updated the "Power Cluster" (Desktop Slider Track & Thumb, and Mobile Buttons) to use a true "Gradient Mask Border" technique (`linear-gradient` border-box) instead of `inset` shadows. This accurately recreates the "Partial Border" look where the Top-Left and Bottom-Right corners are highlighted, while maintaining transparency elsewhere.
- **Improved Spacing**: Increased Desktop Slider Track height to `48px` (from `42px`) while keeping the Thumb at `36px`, increasing the internal padding to `6px` (up from `2px`) for a much less cramped appearance.
- **Card Hover Logic**: Updated the Expand Button rotation trigger. Now, hovering anywhere on the **Card** (`.socket-card-container`) will trigger the button's spin effect, providing earlier interactive feedback.

## [v2.416] - 2026-01-25

### Changed
- **Power Cluster Glass Aesthetics**:
  - **Desktop Slider**:
    - Applied the specific "highlight opposite corners" shadowing (`inset 1px 1px` Top-Left, `inset -1px -1px` Bottom-Right) to mimic the SVG gradient border of the card buttons.
    - Fixed padding uniformity: Track Height 42px (40px content) - 2x 2px Padding - 36px Thumb = Perfect alignment.
  - **Mobile Controls**:
    - Applied the same Highlight/Shadow glass effect to the Status Pill and Power Toggle button using `shadow-[inset_1px_1px...]` utility classes.

## [v2.415] - 2026-01-25

### Changed
- **Power Cluster Refinement (Desktop & Mobile)**:
  - **Aesthetic Upgrade**: Updated the "Power Cluster" (3-state slider on desktop, toggle and status on mobile) to use the new "Apple Glass" style.
    - **Background**: `bg-black/40` / `rgba(0,0,0,0.4)` with `backdrop-filter: blur(24px)`.
    - **Border**: `rgba(255,255,255,0.1)` for a crisp edge.
    - **Shadow**: `shadow-[0_8px_32px_rgba(0,0,0,0.12)]`.
  - **Height Uniformity**: Enforced a `42px` height across all control pills (matching the "Live Demo" pill) for visual consistency.
  - **Typography**: Removed `font-mono` from status text and labels, switching to a clean system sans-serif font (`ui-sans-serif`).
  - **Design Cleanup**: Removed the "dot matrix" status row from the desktop cluster and the single status dot from the mobile control labels to reduce visual noise.

## [v2.414] - 2026-01-25

### Changed
- **Button Hover Effect**: Replaced the "Zoom/Scale" hover effect on card expand buttons with a "Gradient Rotation" effect.
  - Removed `group-hover:scale-110`.
  - Added `group-hover:rotate-180` to the glass border SVG.
  - This creates a sophisticated light-shifting effect on the glass bezel without changing the button's physical size.


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
