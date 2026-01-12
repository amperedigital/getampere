## Reusable Smooth Anchor Scroll (Lenis)

To enable smooth anchor scrolling anywhere in the app (using Lenis if available, or native fallback), use the `data-scrollto` attribute on any clickable element:

```html
<span data-scrollto="#target-section">Scroll to Section</span>
<a data-scrollto="#footer">Go to Footer</a>
```

**How it works:**
- A global event listener (in `index.html`) intercepts clicks on any `[data-scrollto]` element.
- It scrolls smoothly to the target selector using Lenis if present, or falls back to `scrollIntoView({behavior: 'smooth'})`.
- No inline JS or custom handlers needed—just add the attribute.

**Example:**
```html
<span class="font-mono text-sm" data-scrollto="#integrations-tabs">SCROLL TO DISCOVER</span>
```

**Note:** This is the preferred method for all anchor scrolls going forward.

## Reusable Vertical Arrow Interaction (Pick up & Drop)

When adding a vertical arrow (e.g., "Scroll to Discover") that requires an interaction, use the global **Pick up & Drop** physics classes.

**Markup Pattern:**
```html
<div class="group">
  <span class="hover-push-down-parent">
    <svg class="hover-push-down">...</svg>
  </span>
</div>
```

**How it works:**
- `.hover-push-down-parent`: Acts as the 3D perspective container.
- `.hover-push-down`: Controlled by a global `@keyframes arrow-pickup-drop` that handles a linear lift, cast-down, and drop-from-top sequence.
- **Trigger**: The animation scales with the `.group` hover state.
- **Physics**: Linear easing, settles exactly at original vertical position (0px) to prevent hover-out jumps.

# Context

## Critical Technical Constraints
- **Tailwind CSS Only**: All styling MUST use Tailwind CSS classes. No custom CSS classes, external stylesheets, or `<style>` blocks are permitted for general layout, typography, or component styling. Custom CSS is strictly reserved for animations (keyframes) or third-party integrations (e.g., Lenis, SMIL) that cannot be achieved via standard Tailwind utilities.
- **WSL File Sync Bug**: The workspace environment (WSL) has a bug where standard file editing tools (`read_file`, `create_file`, `replace_string_in_file`) fail with a "File Too Large" error for certain files (specifically `deploy/assets/js/tab-flipper.js`).
- **Mandatory Workaround**: You **MUST** use terminal commands (`cat`, `sed`, `rm`, `echo`, heredocs) to read or write to `deploy/assets/js/tab-flipper.js`.
  - **Reading**: Use `cat deploy/assets/js/tab-flipper.js`.
  - **Writing**: Use `cat << 'EOF' > deploy/assets/js/tab-flipper.js` (ensure you `rm` the file first if overwriting completely to be safe).
  - **Do NOT** use the standard edit tools for this file.

## Project Overview
- Single-page marketing site for Ampere AI featuring TailwindCSS, Iconify icons, and custom animation utilities defined inline in `home.html`.
- Layout mixes dark hero/header with light sections (enterprise solutions, metrics, subscription CTA, carousel, footer) for contrast.
- Page loads multiple Google Fonts plus inline animation helpers (e.g., `animate-on-scroll`).
- Hero navigation uses a floating ampersand tab (logo plus white nav bar) with responsive behavior: full logo on desktop/tablet, single “A” logomark on mobile. CTA/hamburger button share a transition animation, and the nav bar must sit atop the Unicorn background with no gaps between logo and white strip.

## Key Sections in `home.html`
1. **Navigation/Hero** – Fixed nav with brand label, CTA buttons, and hero describing "Emily 2.0" autonomous voice agent plus highlight cards and feature media.
2. **Enterprise Solutions** – Light theme block showcasing solution cards, toggles, and carousel.
3. **Performance Metrics** – Split layout with stats, case studies, and supporting imagery.
4. **Newsletter CTA** – Email capture form emphasizing trust logos.
5. **Call-to-Action & Footer** – Gradient panel followed by footer links and social icons.

## Assets & Scripts
- Remote assets pulled from Supabase CDN plus Unsplash placeholders; no local build tooling.
- Local SVG logo lives at `assets/logo-mark-white-square.svg` and should accompany the Ampere AI wordmark in the nav.
- `toggleMenu`, `setView`, and carousel helpers manage interactivity; rely solely on client-side JS.
- Background uses Unicorn Studio script for animated canvas along with custom gradient blur overlay.
- Chart.js hero graph uses a custom `datasetPadding` plugin (activated only when y-axis stacks are visible) with responsive clip/padding rules. Endpoints need ~20px spacing from y-axis labels, and a slight x-axis offset is enabled on larger breakpoints so Monday/Sunday points stay visible.
- Case-study content at the bottom of the hero card gains breakpoint-specific downward translations (starting at `md`, increasing at `lg`) and the parent container uses `lg:min-h-[720px]` to prevent overlap. For ultra-wide layouts (`min-[1440px]` and `min-[2015px]`) the translation resets to zero.
- Hero highlight slider logic now lives in `assets/js/hero-slider.js` (ship `hero-slider.min.js` via jsDelivr). Any slider container just needs the `data-hero-slider` attribute plus optional tuners:
  - `data-auto-delay` (default 5000ms) controls idle time before auto-advance.
  - `data-auto-duration` (default 1800ms) sets glide duration/easing.
  - `data-resume-delay` / `data-retry-delay` manage hover resume timing.
  - `data-momentum-friction` / `data-momentum-step` adjust drag-release inertia.
  Include `<script src="https://cdn.jsdelivr.net/gh/amperedigital/getampere@v1.0.1/assets/js/hero-slider.min.js" defer></script>` on pages that use it. The script pauses on hover/drag, re-aligns the nearest card once interaction stops, resumes after the configured delay, and logs `[HeroSlider] …` messages in the console for debugging auto behavior.

## Modal System (v1.0.111+)
- **Implementation**: `assets/js/modal.js` handles open/close logic, accessibility (inert, aria), scroll locking, and **auto-wrapping** of content.
- **Structure**:
  - **Content**: Define your modal content in a `<section>` or `<div>` anywhere in the body (usually at the bottom).
    - Must have an `id` (e.g., `id="my-modal"`).
    - Must have the attribute `data-amp-modal-content`.
    - **Do NOT** add the modal shell (backdrop, fixed position, etc.) manually. The JS does this.
  - **Visibility**:
    - **Live Site**: A script in `<head>` injects `[data-amp-modal-content] { display: none; }` if the hostname matches production domains (`getampere.ai`, `workers.dev`). This prevents FOUC.
    - **Editor (Aura)**: The CSS rule is NOT injected, so the content remains visible.
  - **Trigger**: `<button data-modal-trigger="my-modal">Open Modal</button>`.

### Editor Compatibility (Aura.build)
- **Detection**: `modal.js` and `global.js` detect the editor environment via:
  - Hostname/URL containing `aura.build`.
  - `window.location.href === 'about:srcdoc'`.
  - `window.self !== window.top` (running inside an iframe).
- **Behavior in Editor**:
  - **Modal**: The `wrapModalContent` function **aborts** early. The modal content remains a static, inline block element at its original DOM position. It is NOT wrapped in a fixed overlay, making it easy to edit inline.
  - **Scrolling**: `global.js` **skips** initializing Lenis smooth scrolling. This restores native scroll wheel functionality, preventing conflicts with the editor's canvas scrolling.
  - **DOM Preservation**: When wrapping (on live site), `modal.js` inserts the modal shell back into the content's **original parent** (e.g., `<section>`) instead of appending to `<body>`. This prevents empty "footprint" tags in the DOM.

### Scroll Locking Strategy
- **Native Lock**: Uses `document.body.style.overflow = 'hidden'` when modal is open.
- **Lenis Integration**: Pauses Lenis (`lenis.stop()`) on open, resumes on close.
- **Scrollable Content**: Elements inside the modal that need to scroll must have:
  - `data-modal-scroll` attribute.
  - `data-lenis-prevent` attribute to stop Lenis from interfering with touch events.
  - `overscroll-contain` CSS class to prevent scroll chaining.
  - Explicit height constraints (e.g., `h-full` inside a fixed parent) and content that overflows (e.g., `min-h-[101%]`).
- **Mobile Support**: This combination ensures native touch scrolling works on iOS/Android while keeping the background page locked.

## 3D Use Case Component (Modular Card Stack)

The Use Case section uses a high-precision 3D stacking engine that synchronizes across tabs, touch, and scroll.

### 🏗️ Architecture
- **CSS-Attribute Driven**: Stacking is controlled by `data-stack-index="n"`.
- **Selector Path**: `[data-stack-index="0"]` (active), `[data-stack-index="1-3"]` (background cards).
- **Transform Variables**:
  - `--stack-y`: Vertical offset for the stack look.
  - `--rot-y`: Y-axis perspective (12deg for stack, 0deg for flat).
  - `--rot-x`: X-axis tilt (6deg for stack, 0deg for flat).

### 🛠️ Modular Component Pattern
To replicate or expand this component, use the following structure:

#### 1. The Container
```html
<div data-tab-flipper class="relative">
  <!-- Interactive Tabs (MUST match card index) -->
  <button data-tab-trigger="0">Tab 1</button>
  <button data-tab-trigger="1">Tab 2</button>

  <!-- The Stack Wrapper -->
  <div class="group/cards" style="perspective: 2000px; transform-style: preserve-3d;">
    
    <!-- Generic Card Shell -->
    <div data-tab-card data-stack-index="0">
      <div data-smil-anim class="relative"> <!-- generic smil trigger container -->
         <!-- Content (Left) & Media (Right) -->
      </div>
    </div>
    
  </div>
</div>
```

#### 2. Interaction Lifecycle (`tab-flipper.js`)
- **Card States**: Automatically toggle `.active`, `.inactive-prev`, and `.inactive-next`.
- **SMIL Detection**: Any element with `data-smil-anim` inside a card is automatically managed.
  - Animations start on: `active`, `hover`, or `mobile-scroll-in-view`.
  - Use `data-smil-complex` for SVGs that require `force-smil-display` (handling visibility/transparency edge cases like UC003/004).
- **Mobile Logic**: Cards automatically flatten to a vertical list for viewport widths `<375px`.

### 🎛️ CSS Stacking Variables
The transforms are applied globally to `[data-tab-card]` via `!important` CSS variables to ensure the interaction overrides any conflicting reveal animations.

```css
[data-tab-card] {
  transform: translateY(var(--stack-y)) rotateY(var(--rot-y)) rotateX(var(--rot-x)) !important;
}
```

## Visual Design Cues and Guidelines
- **Spacing Principle**: Always apply generous top and bottom margins to CTA buttons and interactive elements (e.g., `py-6` or `my-8`). Avoid "cramming" content; breathing room is critical for maintaining visual quality and brand hierarchy.

## Component Specifics

### UC002 Card (Field Service Software)
- **Design**: Static image card (split layout).
- **Content**: Left side text, Right side image container (laptop edge look).
- **Image**: Uses a static image from Supabase instead of SMIL animation.
- **Implementation**: Standard HTML structure similar to other cards, but with `<img>` instead of `<svg>` in the media container. No SMIL logic required in `tab-flipper.js`.

## Deployment Workflow (Strict)
- **Source of Truth**: The `deploy/` folder is the only source for deployment.
- **CDN Usage**: Production HTML (`deploy/index.html`) MUST use jsDelivr CDN links for all scripts (e.g., `https://cdn.jsdelivr.net/gh/amperedigital/getampere@vX.Y.Z/assets/js/...`).
- **Local Paths Forbidden**: NEVER change script sources to local relative paths (e.g., `./assets/js/...`) in `deploy/index.html` without explicit user permission.
- **Update Process**:
  1. Edit local files in `deploy/`.
  2. **STOP**: Do NOT manually commit, tag, or edit `index.html` versions.
  3. **EXECUTE**: Run the publish script: `./scripts/publish.sh vX.Y.Z`
     - This script handles git operations, selective CDN updates, and deployment.
  4. **VERIFY**: Check the output to ensure only changed assets were updated.
- **Testing vs Backups**:
  - **Git** is primarily for version control and backups.
  - **Wrangler** (`npx wrangler deploy`) is the ONLY way to test changes on the live site.
  - ALWAYS run `npx wrangler deploy` after pushing changes, even if you think the git push was sufficient.
- **Session Start**: Read this file at the start of every session to ensure compliance.

## Known Issues & Fixes

### Stray Pixel / Ghost Element in SMIL Animations
- **Symptom**: A static "dot" or artifact appears at coordinates (0,0) (top-left of the SVG container) before a SMIL `<animateMotion>` begins.
- **Cause**: 
  - SMIL elements with `begin="trigger.begin + Xs"` are technically "active" but not yet "moving" during the delay period `X`.
  - If `fill="freeze"` or default behavior applies, the element renders at its initial definition position (often 0,0 if not specified) before the motion path takes over.
  - CSS `opacity: 0` or `visibility: hidden` combined with JS overrides (`display: block !important`) can fail to hide it due to race conditions or browser rendering order.
- **Fix**: **Clip Path Isolation**.
  - Wrap the animated elements in a `<g clip-path="url(#my-clip)">`.
  - Define a `<clipPath>` that covers *only* the valid animation area (e.g., the ring path).
  - Ensure the (0,0) coordinate is *outside* this clip path.
  - This physically prevents the browser from rendering the element until it enters the valid motion path area, regardless of its opacity/visibility state.
  - *Example*: See `uc004-beam-window` in `index.html`.
