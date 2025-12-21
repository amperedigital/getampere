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
  Include `<script src="https://cdn.jsdelivr.net/gh/amperedigital/getampere@v1.0/assets/js/hero-slider.min.js" defer></script>` on pages that use it. The script pauses on hover/drag, re-aligns the nearest card once interaction stops, resumes after the configured delay, and logs `[HeroSlider] …` messages in the console for debugging auto behavior.
