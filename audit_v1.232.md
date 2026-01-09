# Stable Baseline Audit (v1.232)
*Date: January 9, 2026*

## Purpose
This document serves as a high-fidelity reference for the functionality and styling of the site as of version 1.232. Any modular redesign must maintain or improve upon these metrics.

## 1. Responsive & Structural Checklist

### Desktop (>=1024px)
- [ ] **Nav**: Fixed at top, white strip sits flush.
- [ ] **Tabs**: Sticky at `top-[7.5rem]`.
- [ ] **Card Stack**: 3D stacking active. Translates: `--stack-y` at -20px, -40px, -60px.
- [ ] **Animations**: SMIL animations in cards trigger on hover/active.

### Tablet (iPad Air/Pro @ 768px-1024px)
- [ ] **Heading**: "Works Seamlessly..." is left-aligned. Font size is `5xl`.
- [ ] **Tabs**: Sticky position at `top-[7.5rem]` keeps nav border visible.
- [ ] **Modals**: Scrolling is handled by the outer shell (`modalShell`). Close button at bottom is always visible.
- [ ] **Scrolling**: Lenis is disabled (using native smooth scroll).

### Mobile (iPhone/Android < 768px)
- [ ] **Card Stack**: **DISABLED** (Stacking logic in `tab-flipper.js` strictly skips `<768px`).
- [ ] **Margins**: Cards container has `mt-0` on `max-md` to prevent gaps.
- [ ] **Reveal**: `mobile-reveal` opacity animations trigger correctly.

## 2. Interactive Systems

### Modal System (`modal.js`)
- **WRAP Logic**: In production, `data-amp-modal-content` is automatically wrapped into a fixed modal shell.
- **Scroll Lock**: `body` overflow set to `hidden`, Lenis paused.
- **Auto-Alignment**: `pt-12 md:pt-24` on the shell prevents badge clipping (e.g. "System Operational" badge).

### SMIL Orchestration (`tab-flipper.js`)
- **Triggers**: Relies on `data-smil-anim` and `data-smil-complex`.
- **Force Visibility**: Uses `.force-visible` and `.force-smil-display` classes injected via JS styled in `<head>`.
- **UC004 Fix**: Requires `clip-path` isolation to prevent "ghost dots" at (0,0).

## 3. Navigation & Anchors
- **Scroll Target**: `#integrations-tabs`.
- **Offset**: `scroll-mt-24` ($96px$) provides exactly `1rem` gap below the $80px$ nav.
- **Global Listener**: `data-scrollto` handles clicks without inline JS.

## 4. Risks for Modularization
- **ID Duplication**: If components are templated, IDs like `crm-card-container` must remain unique or the JS selector logic in `tab-flipper.js` must be updated to use classes/data-attributes only.
- **Style Injection**: JS-injected styles inside `tab-flipper.js` (like `@keyframes crm-ping`) need to be migrated to a global stylesheet or handled carefully.
- **Relative Media Paths**: `./assets/...` paths in `index.html` must remain valid when moving to subdirectories or being processed by a build tool.
