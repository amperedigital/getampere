# Changelog

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
