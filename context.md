# Project Context & Instructions

## 1. Critical Technical Constraints
- **Content Preservation**: NEVER change content (text, copy, headings) given by the user unless explicitly requested. If you are refactoring code, you MUST preserve the original text exactly.
- **Tailwind CSS Only**: All styling MUST use Tailwind CSS classes. No custom CSS classes or external stylesheets. Custom CSS is reserved only for complex keyframe animations or third-party integrations (Lenis, SMIL).
- **Typography Standard**: Use Tailwind Typography (`prose` classes) for long-form content to ensure consistency.
- **WSL File Sync Bug**: The workspace environment (WSL) has a bug where standard file editing tools fail on large files.
  - **Mandatory Workaround**: You **MUST** use terminal commands (`cat`, `sed`, `rm`, `echo`) to read or write to `deploy/assets/js/scroll-flipper.js` or `deploy/assets/js/tab-flipper.js`.
  - **Reading**: `cat deploy/assets/js/filename.js`
  - **Writing**: `rm ...` then `cat << 'EOF' > ...`
- **Tool Priorities**:
  - **Searching**: Always prefer the `grep_search` tool over running `grep` manually in the terminal. The tool provides better structured output and is less prone to shell escaping errors.

## 2. Project Overview
- **Type**: Marketing website for Ampere AI (Multi-page architecture).
- **Source**: `deploy/index.html` is the source of truth for the homepage.
- **Stack**: TailwindCSS, Iconify icons, Vanilla JS (ES6 Modules), Supabase CDN.
- **Assets**: Scripts in `deploy/assets/js/`, Images from Supabase/Unsplash.

## 3. Deployment Workflow (Strict)
- **Source of Truth**: The `deploy/` folder is the only source for deployment.
- **CDN Usage**: Production HTML MUST use jsDelivr CDN links for all scripts.
- **Process**:
  1. Edit local files in `deploy/`. 
  2. **Do NOT** manually commit/tag.
  3. **EXECUTE**: `./scripts/publish.sh vX.Y.Z`
  4. **VERIFY**: Check output.
- **Safe HTML Usage**: Use `python3 scripts/safe_replace_html.py` for complex grid/layout updates to prevent breakage.

## 4. Core Systems

### Modal System (v1.0.111+)
- **Usage**: `<section id="my-modal" data-amp-modal-content>`
- **Trigger**: `<button data-modal-trigger="my-modal">`
- **Features**: controlled by `modal.js`. Includes scroll locking (Lenis + Native), outside click close, and editor compatibility (Aura.build).

### ScrollSpy System (v1.585+)
- **Container**: `<nav data-scrollspy-nav>`
- **Behavior**: Tracks active sections (`data-scrollspy-section`) and moves a visual indicator (`data-scrollspy-indicator`).
- **Links**: `[data-spy-link]` auto-updates active class and handles smooth scrolling.
- **Reference**: `assets/js/global.js` (Class `ScrollSpy`).
- **Mobile Rule (CRITICAL)**: When implementing mobile "Horizontal Scroll" centering:
  - **NEVER** use `element.scrollIntoView()` inside a scroll handler. It triggers a page-wide scroll hijack if the container is off-screen, causing "Scroll Locking".
  - **ALWAYS** use scoped container scrolling: `navContainer.scrollTo({ left: calculatedOffset, behavior: 'smooth' })`.

### Anchor Scrolling (Lenis)
- **Usage**: `<a data-scrollto="#target">`
- **Behavior**: Global handler intercepts click, uses Lenis smooth scroll if available, falls back to native.

## 5. Animation Library (Reusable Patterns)

### Vertical Arrow (Pick up & Drop)
- **Pattern**:
  ```html
  <div class="group">
    <span class="hover-push-down-parent">
      <svg class="hover-push-down">...</svg>
    </span>
  </div>
  ```
- **Physics**: Linear lift, cast-down, drop-from-top sequence on hover.

### Section Reveal (Enter Animation)
- **Container**: `<section data-scroll-reveal-section>`
- **Content**: `<div data-reveal-group>` (Fades in + Translates Y).
- **Borders**: `<div data-grid-anim data-grid-axis="x">` (Expands).

### Animated Pulse Dot (Status Indicator)
- **Usage**: `<div class="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>`
- **Context**: Use for live status, system operational badges, or active indicators (e.g., "Services", "All Systems Normal").
- **Colors**: `bg-green-500` (Operational), `bg-blue-500` (Active/Info), `bg-red-500` (Offline).

## 6. Major Components

### Scroll Flipper (v1.565+)
**Description**: The primary 3D card stack interaction for "Use Cases".
**File**: `deploy/assets/js/scroll-flipper.js`
**Reconstruction Specs**:
- **Structure**: `[data-scroll-track-container]` > `[data-sticky-cards]` > Cards.
- **Logic**: Scroll-driven requestAnimationFrame loop. Calculates `delta` based on scroll position vs track top.
- **Responsive**: 
  - **Desktop**: Injects `!important` styles for 3D transforms (`rotateX`, `rotateY`, `translateY`).
  - **Mobile**: MUST clean up (removeProperty) all injected styles to let Tailwind utilities take over.

### Walkthrough / Feature ScrollSpy Component
**Usage**: Complex feature lists with a sticky table of contents (e.g., "Platform Walkthrough").
**Structure**:
1. **Container**: Grid layout (`grid-cols-12`).
2. **Left (Nav)**: Sticky Sidebar (`col-span-2`) with `[data-scrollspy-nav]`.
3. **Center (Content)**: Main content (`col-span-7`) with `[data-scrollspy-section]` blocks.
4. **Right (Metadata)**: Optional context column (`col-span-3`) with `[data-reveal-group]`.

**Agent Reconstruction Prompt**:
> "Rebuild the 'Walkthrough / ScrollSpy' component using the following specifications:
>
> 1. **HTML Structure**:
>    - **Container**: `<section id='section-id' class='relative w-full grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8'>`
>    - **Nav**: `<nav class='sticky top-48' data-scrollspy-nav>` inside Left Col.
>    - **Indicator**: `<div class='absolute left-[-1px] ...' data-scrollspy-indicator></div>`
> 
> 2. **Logic**:
>    - Initialize `ScrollSpy` on the nav.

### Icosahedron 3D Scene & AI Status System (v2.127+)
**Description**: The central interactive 3D hero element representing the AI core. Handles system state (Active/Standby/Off), physics simulation, and status visualization.
**File**: `deploy/assets/js/icosahedron-scene.js`
**Reconstruction Specs**:

1.  **System State Machine**:
    *   **States**: `ACTIVE` (Full simulation), `STANDBY` (Breathing mode, low power), `OFF` (Collapsed).
    *   **Auto-Standby**:
        *   **Timeout**: 120 seconds of idle time.
        *   **Warning**: Displays "STANDBY IN Xs" overlay at T-30 seconds.
        *   **Wake**: Any interaction (drag/scroll) immediately resets timer and restores `ACTIVE` state.

2.  **Physics Engine (Animation Loop)**:
    *   **Core Logic**: Uses Linear Interpolation (`lerp`) to transition `simIntensity`.
    *   **Critical Fix (v2.125)**: Standard lerp (`val += (target-val) * speed`) causes "stalling" at the end of the curve (80-99%).
    *   **Minimum Velocity Rule**: You MUST implement a "minStep" (e.g., `0.0025`) to ensure the transition completes efficiently.
        ```javascript
        let step = diff * lerpFactor;
        if (Math.abs(step) < 0.0025) step = (diff > 0) ? 0.0025 : -0.0025; // Force finish
        ```

3.  **UI Status Gauge ("AI ONLINE")**:
    *   **Visuals**: Dynamically generated 20-dot DOM array (`.ampere-dot`) + Status Text.
    *   **Logic**: Rendered in `animate()` loop based on `simIntensity` (0.0-1.0).
    *   **Behavior**:
        *   **Ramp Up**: Dots fill from 0-20, Text says "INITIALIZING XX%".
        *   **Steady**: All dots lit, Text says "AI ONLINE".
        *   **Ramp Down**: Dots drain 20-0, Text says "POWER OFF XX%".
    *   **Mobile Layout Constraints (Critical)**:
        *   The standard `bottom: 75px` places the gauge *behind* the control buttons on mobile.
        *   **Rule**: On mobile (`max-width: 600px`), you MUST position the container at `bottom: 155px` to clear the UI track.
        *   **Desktop**: `bottom: 180px`.

4.  **Scene Components**:
    *   **Nodes**: 12 vertices of Icosahedron + recursive subdivisions (frequency 2 or 3).
    *   **Glow**: SpriteMaterial with additive blending.
    *   **Shell**: Dual rotating wireframe spheres (inner/outer) with gyroscopic counter-rotation.

5.  **Configuration (Data Attributes)**:
    *   **Usage**: Control physics and timing directly via HTML attributes on the container `div`.
    *   `data-standby-timeout` (Default: `120`): Seconds of idle time before entering Standby mode.
    *   `data-standby-warning` (Default: `30`): Seconds before timeout to show the "STANDBY IN X" warning.
    *   `data-auto-recenter` (Default: `2.5`): Seconds after interaction ends before the camera smooths back to center.
    *   `data-lerp-speed` (Default: `0.015`): The interpolation factor for system state transitions. Higher = faster/snappier.
    *   `data-min-velocity` (Default: `0.0025`): The minimum step size for transitions to prevent "asymptotic stalling" (the feeling of losing steam at 99%).
    *   `data-rotation-rpm` (Default: `0.17`): The base rotation speed of the sphere in Revolutions Per Second.

    **Example**:
    ```html
    <div id="canvas-container"
         data-standby-timeout="120"
         data-standby-warning="30"
         data-auto-recenter="2.5"
         data-lerp-speed="0.015"
         data-min-velocity="0.0025"
         data-rotation-rpm="0.17"></div>
    ```
>    - Cache links and targets.
>    - On scroll, determine active target (top <= activeOffset).
>    - Move indicator (`translateY`) to match active link position.
> 
> 3. **Animation**:
>    - Wrap columns in `data-reveal-group` for staggered entry."

### Ampere 3D Key (RenderJS)
**Description**: High-fidelity 3D logo visualization using Three.js (internally referred to as RenderJS).
**File**: `deploy/assets/js/ampere-3d-key.js`
**Dependencies**: Three.js (v0.160.0+) via Import Map.
**Specs**:
- **Geometry**: Custom Extruded Shape (Rounded Square with bevels) to match the Ampere logo mark. Built programmatically via `THREE.Shape`.
- **Theme Support (v1.738+)**:
  - **Usage**: Add `data-key-theme="dark"` to the container element.
  - **Light Mode (Default)**: Glossy White Body (Ceramic), Navy Ink (`#1e2a40`).
  - **Dark Mode**: Matte Navy Body (`#1e2a40`), Navy Ink (`#1e2a40`). Unified solid look.
  - **Material Physics**:
    - *Light*: `Roughness: 0.2`, `Clearcoat: 1.0` (Glossy/Reflective).
    - *Dark*: `Roughness: 0.6`, `Clearcoat: 0.0` (Matte/Flat) - prevents "black mirror" effect in dark voids.
- **Texture**: Dynamic SVG-to-CanvasTexture generation.
  - **Ink Color**: Standardized to **#1e2a40** (Medium-Dark Navy) for both themes to ensure consistency.
  - **UV Mapping**: Asymmetric mapping to handle bevel distortion (-1.75 to 1.90 range).
- **Choreography (`setProgress(0-1)`)**:
  1. **Rotation**: Tilts up from flat face-down (-PI/2.1) to facing forward.
  2. **Lighting**:
     - *Ambient*: Dark (0.05) -> Bright (0.9).
     - *Rim*: Starts bright (backlit) -> Dims as object faces camera.
     - *Specular Sweep*: Point light physically moves across X axis (-6 to +8) to create a "shine" reflection across the face.
- **Idle Animation**: Continuous `requestAnimationFrame` loop adds:
  - Vertical bobbing (Sine wave).
  - Subtle rotational drift (Y/Z axis wobble) to feel "alive" while floating.
- **Usage**:
  ```javascript
  import { Ampere3DKey } from './assets/js/ampere-3d-key.js';
  const key = new Ampere3DKey(document.getElementById('canvas-container'));
  // Update on scroll
  key.updateProgress(scrollyProgress); // 0.0 to 1.0
  ```

### 3D Icosahedron Scene (v2.00+)
**Description**: Interactive 3D network visualization with connecting nodes and electrons.
**Files**: `deploy/assets/js/icosahedron-scene.js` (Main), `deploy/assets/js/icosahedron-scene-blue-silver.js` (Variant).

**Reconstruction Specs**:

1.  **Dependencies**: Requires standard Three.js Import Map (`three` and `three/addons/`) in `<head>`.
2.  **Container Styling (Required)**:
    ```css
    .scene-container {
        width: 100%; height: 100%;
        background-color: #05060f; /* Seamless load */
        overflow: hidden;
    }
    .scene-container canvas {
        pointer-events: auto !important; /* Ensures OrbitControls receive events */
        touch-action: none; /* CRITICAL: Prevents browser scroll/swipe jacking */
    }
    ```
3.  **Initialization**:
    ```javascript
    import { IcosahedronScene } from './assets/js/icosahedron-scene.js';
    new IcosahedronScene(document.getElementById('target-container'));
    ```

**Browser Compatibility Constraints (CRITICAL)**:
Certain browsers (like "Comet" or specialized setups) report extremely high `deltaY` values for scroll events, which causes standard Three.js `OrbitControls` to instantly zoom the camera to infinity or zero, making the scene "disappear".

**Mandatory Implementation Pattern**:
You **MUST** use the "Discrete Step Zoom" pattern when implementing `OrbitControls`. Do NOT rely on native `enableZoom`.

```javascript
initControls() {
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    
    // 1. DISABLE Native Zoom (Prevent infinite jumps)
    this.controls.enableZoom = false; 
    
    this.controls.rotateSpeed = 0.5;
    this.controls.autoRotate = false; 

    // 2. Custom "Discrete Step" Zoom Handler
    const handleZoom = (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (e.deltaY === 0) return;

        // 3. HARD CLAMP LIMITS (Prevent vanishing)
        const minD = 1.2;
        const maxD = 60.0;
        const zoomFactor = 0.05; // Fixed 5% step regardless of scroll speed

        const dir = new THREE.Vector3().subVectors(this.camera.position, this.controls.target);
        const dist = dir.length();
        dir.normalize();

        let newDist = dist;
        // 4. IGNORE MAGNITUDE (Only check direction)
        if (e.deltaY > 0) {
            newDist = Math.min(dist * (1 + zoomFactor), maxD);
        } else {
            newDist = Math.max(dist * (1 - zoomFactor), minD);
        }

        this.camera.position.copy(this.controls.target).addScaledVector(dir, newDist);
    };
    
    // 5. ATTACH (Non-Passive to allow preventDefault)
    this.renderer.domElement.addEventListener('wheel', handleZoom, { passive: false });
}
```

**Agent Reconstruction Prompt**:
> "Rebuild the '3D Icosahedron Scene' (Manhattan Sphere) using these exact specifications:
>
> 1. **Geometry & Structure**:
>    - **Outer Cage**: `THREE.IcosahedronGeometry(radius: 1.5, detail: 2)`. 
>      - Rendered as `THREE.LineSegments` (Wireframe).
>      - Color: `#88b0d1`. **Opacity: 0.1 (10%)**.
>    - **Central Sphere**: `THREE.SphereGeometry(radius: 0.72, widthSegments: 64, heightSegments: 64)`.
>      - Material: `MeshPhysicalMaterial` (Obsidian Glass).
>      - Color: `#000000`, Roughness: 0.15, Clearcoat: 1.0.
>    - **Nodes**: Placed at unique vertices of the Outer Cage geometry.
>      - Geometry: `THREE.SphereGeometry(radius: 0.015, widthSegments: 8, heightSegments: 8)`.
>      - Attributes: Each node gets a random persistent HSL color.
>
> 2. **Circuitry Logic (Manhattan Algorithm)**:
>    - Generate 65+ 'Bus Lines' on the Central Sphere surface.
>    - **Routing**: Strictly orthogonal. Steps must only change Phi OR Theta, never both at once.
>    - **Visuals**: Use `LineGeometry` (Fat Lines) with `linewidth: 2.5`.
>      - Base Color: `#041725`.
>      - **Opacity Strategy**: 5% Inactive (Stealth) -> 100% Active.
>      - Active Flash: When an electron passes, the line lerps to Bright Blue (`r:0, g:0.6, b:1.0`).
>    - **Electrons**: 120 particles (`THREE.Sprite`) traversing the paths.
>      - Speed increases based on camera proximity (activity level).
>
> 3. **Animation & Interaction**:
>    - **Neural Activity (Node Flashing)**:
>      - **Trigger**: ~2% probability per tick (Slower, calmer rhythm).
>      - **Decay**: Slower fade-out (0.92 multiplier) for prolonged glow.
>      - **Proximity**: Nodes closer to screen center scale up (1.4x).
>    - **Controls**: MANDATORY 'Discrete Step Zoom' (see code block). Instantly clamps `deltaY` and steps 5%.
>
> 4. **Lighting Setup**:
>    - **Ambient**: `#aaccff` (Intensity 0.2).
>    - **Spotlight**: `#e6f3ff` (Intensity 8.0, Pos: -10, 10, 10).
>    - **Core Glow**: `PointLight` inside the sphere, color `#0088ff`."


### Distortion Grid (v1.778 Stable)
**Description**: An HTML5 Canvas-based interactive grid that creates a distortion/lens effect. Includes "Smart Density" scaling to maintain visual consistency across device sizes.
**File**: `deploy/assets/js/distortion-grid.js`
**Implementation**:
- **Smart Density**:
  - **Mobile/Small**: Defaults to tight `8px` spacing for high-DPI sharpness.
  - **Desktop/Large**: Automatically increases spacing if total dots > 8000, preventing CPU overload.
  - **Responsive Dot Size**: Dot radius scales proportionally with spacing to keep "texture" consistent.
- **Pattern**: "Absolute Overlay" (Must be placed behind content but inside a relative container).
- **Z-Index Strategy**: The grid container uses `z-index: 0` to sit behind content (`z-index: 10+`).
- **Sleep Logic**: Canvas freezes (but stays visible) when idle/offscreen.
- **Wake Logic**: Mouse movement wakes the animation loop.

**HTML Structure (Mandatory)**:
```html
<!-- Wrapper: Relative context for positioning -->
<div class="relative w-full h-[600px] overflow-hidden bg-[#05060f]">
  
  <!-- 1. The Grid Component (Absolute, Background) -->
  <div data-object="distortion-grid" 
       class="absolute inset-0 z-0 pointer-events-none opacity-60 mix-blend-screen">
       
       <!-- 1a. Vignette Mask (Inner Overlay) -->
       <!-- Must be inside the grid container to mask the canvas -->
       <div class="absolute inset-0 w-full h-full z-10 bg-[radial-gradient(circle_at_center,transparent_10%,#05060f_90%)]"></div>
  </div>

  <!-- 2. The Content (Relative, Foreground) -->
  <div class="relative z-10 container mx-auto">
      <h1>Your Content Here</h1>
  </div>
</div>
```

**Attributes**:
- `data-object="distortion-grid"`: The trigger attribute used by `global.js` to initialize the `DistortionGrid` class.
- `data-idle-color="R, G, B"`: (Optional) Override default white dots (e.g., "30, 42, 64").
- `data-hover-color="R, G, B"`: (Optional) Override hover color.

**Theme Strategy (Light vs Dark)**:
The component is agnostic, but the providing HTML controls the look.
- **Dark Mode (Default)**:
  - Container Class: `mix-blend-screen` (Lighten).
  - Dots: Default (White).
  - Mask: `to-[#05060f]`.
- **Light Mode**:
  - Container Class: `mix-blend-multiply` (Darken).
  - Dots: Set `data-idle-color="30, 42, 64"` (Navy).
  - Mask: `bg-[radial-gradient(circle_at_center,transparent_10%,#ffffff_90%)]` (Fade to White).

**Light Mode Example**:
```html
<div data-object="distortion-grid" 
     data-idle-color="30, 42, 64"
     class="absolute inset-0 z-0 pointer-events-none opacity-60 mix-blend-multiply">
     
     <div class="absolute inset-0 w-full h-full z-10 bg-[radial-gradient(circle_at_center,transparent_10%,#ffffff_90%)]"></div>
</div>
```

**Animation Modes (v1.790+)**:
Control the physics interaction using `data-wave-type="..."`.
1.  **Lens (Default)** (`balloon` / `lens`):
    *   Effect: Clean magnifying glass. Dots stay tight (low repulsion), magnify slightly (1.2x), and emit a subtle glow. No gaps.
    *   Best for: Professional, polished UI backdrops.
2.  **Void** (`balloon-void`):
    *   Effect: Strong repulsion creates a large empty circle around the mouse. High contrast.
    *   Best for: Dramatic hero sections.
3.  **Planar** (`planar`):
    *   Effect: Global ocean swell animation. Disables local mouse physics (except zoom).
    *   Best for: Ambient backgrounds without direct interaction needs.
4.  **Standard** (`interaction`):
    *   Effect: Original "swirl" physics with ambient noise/wobble.

## 7. Performance & Scroll Standards (Mobile)
**CRITICAL**: Strictly mandated patterns for scroll-linked animations.

### The "NO JANK" Rule
- **Problem**: Calling `element.getBoundingClientRect()` inside a `scroll` loop or `requestAnimationFrame` causes "Layout Thrashing". Browsers are forced to recalculate layout every frame, causing Freeze/Crash on mobile and low-power devices (Inspector Responsive Mode).
- **Mandated Solution**: **Geometry Caching**.
  1. **Calculate Once**: Measure offsets (`offsetTop`, `rect.top`) ONLY on `window.resize` or init. Save these to a `this.cache` object.
  2. **Read Cheaply**: In the `update()` loop, ONLY read `window.scrollY`.
  3. **Math Only**: Calculate relative positions using `cache.top - window.scrollY`.
  4. **Example**:
     ```javascript
     // BAD
     update() {
         const rect = this.el.getBoundingClientRect(); // CRASH
         const dist = rect.top; 
     }

     // GOOD
     init() {
         this.cache = { top: this.el.getBoundingClientRect().top + window.scrollY };
     }
     update() {
         const dist = this.cache.top - window.scrollY; // 60FPS
     }
     ```

### Intersection Observers
- Use `IntersectionObserver` to toggle a `this.isOnScreen` boolean.
- **Optimization**: If `!this.isOnScreen`, return immediately from `update()` loops. Do not run math for invisible components.

### Smooth Scrolling (Lenis)
- **Mobile Rule**: **NEVER** initialize Lenis (or any inertial scroll library) on mobile or touch devices.
- **Reason**: It prevents standard native gestures (swipe-to-refresh, address bar expansion) and feels "floaty" or broken to mobile users.
- **Implementation**:
  ```javascript
  // MANDATORY CHECK
  const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  if (!isTouch && window.innerWidth > 1024) {
      // Init Lenis
  }
  ```

## 8. Known Issues & Fixes
- **SMIL Ghost Pixel**: Static artifact at (0,0) before animation starts.
  - **Fix**: Use `<g clip-path="url(#my-clip)">` to isolate the element until it moves.
- **Editor Compatibility**: `global.js` and `modal.js` disable Lenis and complex wrapping when inside `aura.build` to allow inline editing.

## 9. File Editing & Tool Safety (Strict)
**Objective**: Prevent accidental deletion of file content during automated edits (specifically footer scripts).

### Tool Selection Heuristic
1.  **Block Swaps / HTML Structure** (`scripts/safe_replace_html.py`):
    *   **Use When**: Replacing an entire Section, Component, or Div that has an `id`.
    *   **Reason**: It understands DOM nesting (closing tags) and guarantees isolation.
    *   **Safety**: High (Broken HTML is better than Deleted HTML).

2.  **Surgical / Text Edits** (`scripts/smart_replace.py`):
    *   **Use When**: Fixing typos, changing classes, updating attributes, or editing lines *without* IDs.
    *   **Reason**: It includes a **Safety Block** that aborts if the edit attempts to delete >15 lines (net).
    *   **Safety**: High (Prevents mass deletion).

3.  **Standard Replacement** (`replace_string_in_file`):
    *   **Use When**: You are 100% certain the string is unique and < 5 lines long.
    *   **Constraint**: NEVER use this with "greedy" context (e.g., selecting from the middle of the file to the end).
    *   **Risk**: High (Can delete hidden lines if context is not precise).

### "Safe HTML" Command
```bash
# Correct usage for replacing a Hero Section
python3 scripts/safe_replace_html.py "deploy/index.html" "hero-section" "new-content.html"
```

### "Smart Replace" Command
```bash
# Correct usage for fixing a typo safely
python3 scripts/smart_replace.py "deploy/index.html" "old_snippet.txt" "new_snippet.txt"
```
## 7. Design Principles (Directive)

### Room to Breathe
- **Core Concept**: Ambiguity in spacing destroys trust. Layouts must confidently frame content.
- **Rule**: Avoid tight spacing on major containers.
  - **Mobile Insets**: Minimum `32px` (`inset-8` or `p-8`) for full-screen frames.
  - **Desktop Insets**: Scale up to `48px`+ (`p-12`+).
- **Anti-Pattern**: Content touching the viewport edge or container border without a specific bleeding-edge design intent.
- **Implementation**: When refactoring a jammed UI, **double** the current padding first, then adjust.

### Pill & Badge Placement
- **Responsive Straddle Pattern (Canonical)**:
  - **Mobile**: Center strictly (`left-1/2 -translate-x-1/2` top `4`).
  - **Desktop**: Align to the container "frame" but **bisect the border**.
    - If container is `inset-12` (top 3rem), the pill MUST be `top-12 -translate-y-1/2`.
    - **Horizontal**: Do NOT flush align. Inset it further (e.g., `right-20` if container is `right-12`) to create visual depth.
- **Styling**: `rounded-full`, `px-4 py-2` (Standard Skinny), `backdrop-blur`.
- **Shape**: Use `rounded-full` for pills unless explicitly designing a square-tech aesthetic. Maintain `tracking-widest` for system labels.
