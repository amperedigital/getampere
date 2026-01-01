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
  Include `<script src="https://cdn.jsdelivr.net/gh/amperedigital/getampere@v1.0.2/assets/js/hero-slider.min.js" defer></script>` on pages that use it. The script pauses on hover/drag, re-aligns the nearest card once interaction stops, resumes after the configured delay, and logs `[HeroSlider] …` messages in the console for debugging auto behavior.

## Pulse Animation Embeds (scheduling & ERP)
- Each animation lives as a standalone HTML snippet and gets embedded via Aura blocks, so no external JS or inline styles are allowed—only Tailwind utility classes and SMIL.
- The center hub styling is shared between scheduling and ERP: 64px dark orb, matching halo animation, and an arced “AI PHONE ANSWER” text path hugging the circle. Keep the color accents per-card (blue for scheduling, amber/orange for ERP) but reuse the structure.
- Beam dots must not be visible before their animations start; the first particle on each path stays `hidden`, and every subsequent `<circle>` has `visibility="hidden"` plus a SMIL `<set>` that toggles to `visible` at the same time as its `animateMotion begin`. This prevents the stray top-left cluster during hover/zoom without breaking the animation.
- The scheduling Acuity connector (`line3`) extends 15% farther (`L200,315`) with its node positioned via `top-[79%]` so the dot sits directly on the path across breakpoints. Any future path length tweaks should keep the node coordinates in sync.
- Responsive layout matters: every SVG endpoint, node, and label stack must stay aligned inside their card wrappers across breakpoints, including during Aura’s hover zoom. When adjusting positions, verify the small/medium/large breakpoints and ensure hover transforms don’t expose hidden dots or gradients.

## CRM Integrations Card (Salesforce / HubSpot / Pipedrive)
- The CRM canvas lives in both `index.html` and `crm-integrations.html`; always update both files in lockstep.
- Each roundel (Salesforce at `left-[25%]`, HubSpot at `left-[75%]`, Pipedrive at `top-[79%] left-1/2`) follows the SAME structure:
  - Outer absolute container has `pointer-events-none` so the SVG interactions beneath stay untouched.
  - Immediate child is `absolute bottom-full ... flex flex-col ... pointer-events-auto` (no extra wrappers) so only the logo stack is interactive.
  - The button uses `class="peer w-12 h-12 ... focus-visible:ring-*"`; **never** swap this to a `group` pattern or the tooltip will re-open while the cursor is on the card background.
  - Tooltip is the next sibling (`absolute top-1/2 left-full ml-3 ... origin-left z-[120]` for Salesforce, `z-60` on HubSpot, `origin-top` on Pipedrive). It stays `pointer-events-none` until the `peer` is hovered/focused, then Tailwind’s `peer-hover:*` utilities toggle opacity, translation, and pointer events. That keeps the tooltip readable without triggering the other cards.
- Keep Salesforce’s tooltip at `z-[120]` (embed uses `z-[90]`) so it floats above the center hub but doesn’t collide with the other labels. If the layout feels cramped, reposition the absolute container instead of stacking multiple `z` hacks.
- All adjustments must stay Tailwind-only—no inline styles, no custom CSS. When you need different offsets or delays, add Tailwind classes or use arbitrary values (`ml-[14px]`, `z-[120]`, etc.) like the current implementation.
