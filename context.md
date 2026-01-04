# Context

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

## Deployment Workflow (Strict)
- **Source of Truth**: The `deploy/` folder is the only source for deployment.
- **CDN Usage**: Production HTML (`deploy/index.html`) MUST use jsDelivr CDN links for all scripts (e.g., `https://cdn.jsdelivr.net/gh/amperedigital/getampere@vX.Y.Z/assets/js/...`).
- **Local Paths Forbidden**: NEVER change script sources to local relative paths (e.g., `./assets/js/...`) in `deploy/index.html` without explicit user permission.
- **Update Process**:
  1. Edit local files in `deploy/`.
  2. Commit changes: `git commit ...`
  3. Tag version: `git tag vX.Y.Z`
  4. Update HTML: Change CDN links in `deploy/index.html` to the new tag `@vX.Y.Z` **ONLY** for the specific files that were modified. **DO NOT** update tags for unchanged files.
  5. Push: `git push origin main --tags`
  6. Deploy: `npx wrangler deploy`
- **Testing vs Backups**:
  - **Git** is primarily for version control and backups.
  - **Wrangler** (`npx wrangler deploy`) is the ONLY way to test changes on the live site.
  - ALWAYS run `npx wrangler deploy` after pushing changes, even if you think the git push was sufficient.
- **Session Start**: Read this file at the start of every session to ensure compliance.
