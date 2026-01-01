# PulseBeams Standalone Embed

A framework-agnostic version of the Ampere "Demo AI" CTA. It ships as a simple CSS + JS bundle so you can copy the folder, host the two files, and drop the gradient-beam CTA into any marketing site without needing React, Tailwind, or shadcn.

## Files
- `pulse-beams.css` – visual styles + keyframes (includes Google Font imports for the expected look)
- `pulse-beams.js` – vanilla JS that renders the SVG beams + CTA button and exposes a small API
- `index.html` – local demo harness to preview the component

## Quick start
1. Open `pulse-beams-embed/index.html` in a browser to preview.
2. To embed elsewhere, host `pulse-beams.css` and `pulse-beams.js` (any CDN or your static assets bucket).
3. Include them on the page where you want the CTA:

```html
<link rel="stylesheet" href="/path/to/pulse-beams.css" />
<div
  data-pulse-beams
  data-button-label="Book Demo"
  data-badge-text="Voice AI"
  data-button-href="https://getampere.ai/demo"
  data-button-new-tab="true"
></div>
<script src="/path/to/pulse-beams.js" defer></script>
```

When the script loads it looks for `[data-pulse-beams]` nodes and hydrates them automatically.

## JavaScript API
If you need more control you can mount instances imperatively:

```js
PulseBeamsEmbed.mount('#cta-slot', {
  buttonLabel: 'Connect',
  buttonHref: 'https://getampere.ai/demo',
  newTab: true,
  badgeText: 'Live Demo'
  // beams, colors, width, height are also overridable
});
```

### Supported options
| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `buttonLabel` | `string` | `"Demo AI"` | CTA copy |
| `buttonHref` | `string` | `""` | When set, renders an anchor tag so you can deep-link |
| `newTab` | `boolean` | `false` | Opens anchor in a new tab and adds `rel="noreferrer noopener"` |
| `badgeText` | `string` | `"Live Demo"` | Small badge rendered above the CTA; omit to hide |
| `width` / `height` | `number` | `858 / 434` | Dimensions of the SVG canvas inside the wrapper |
| `gradientColors` | `{ start, middle, end }` | teal → violet palette | Customize the animated stroke colors |
| `beams` | `BeamPath[]` | built-in Ampere layout | Supply your own SVG path data + animation config |

Every option can be passed as a `data-*` attribute (kebab-case) on the host element.

## Custom beams
The `PulseBeamsEmbed.defaults.beams` array mirrors the original React component. Each beam supports:

```ts
interface BeamPath {
  path: string; // SVG path string
  gradientConfig: {
    initial: { x1: string; x2: string; y1: string; y2: string };
    animate: Record<'x1'|'x2'|'y1'|'y2', string | string[]>;
    transition?: { duration?: number };
  };
  connectionPoints?: Array<{ cx: number; cy: number; r: number }>;
}
```

Drop in new beams or colors via `PulseBeamsEmbed.mount(selector, { beams: [...] })`.

## Why vanilla?
The original prompt targeted a React + shadcn setup, but embedding a CTA across arbitrary landing pages works best as a dependency-free bundle. This implementation recreates the same gradients + CTA styling with a couple of static assets, so you can use it inside Webflow, Squarespace, WordPress, or a hand-coded static site with zero build tooling.
