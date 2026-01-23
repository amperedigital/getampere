# Changelog

## [v2.207] - 2026-01-17
### Added
- **Dual Halo Interaction**: Split the single rotary dial into two concentric, independently interactive rings to support future "Data Pairs" logic.
  - **Outer Ring (Blue)**: Contains even indices (0, 2, 4...) [Data Sources, Encryption, Protocol, etc.]. Radius 300px.
  - **Inner Ring (Purple)**: Contains odd indices (1, 3, 5...) [Optimization, Neural Config, Latency, etc.]. Radius 230px.
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
