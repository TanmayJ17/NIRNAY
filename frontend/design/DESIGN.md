---
name: Civic Precision Control
colors:
  surface: '#f8f9fa'
  surface-dim: '#d9dadb'
  surface-bright: '#f8f9fa'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f4f5'
  surface-container: '#edeeef'
  surface-container-high: '#e7e8e9'
  surface-container-highest: '#e1e3e4'
  on-surface: '#191c1d'
  on-surface-variant: '#434655'
  inverse-surface: '#2e3132'
  inverse-on-surface: '#f0f1f2'
  outline: '#747686'
  outline-variant: '#c4c5d7'
  surface-tint: '#2151da'
  primary: '#0037b0'
  on-primary: '#ffffff'
  primary-container: '#1d4ed8'
  on-primary-container: '#cad3ff'
  inverse-primary: '#b7c4ff'
  secondary: '#565e74'
  on-secondary: '#ffffff'
  secondary-container: '#dae2fd'
  on-secondary-container: '#5c647a'
  tertiary: '#384558'
  on-tertiary: '#ffffff'
  tertiary-container: '#505d70'
  on-tertiary-container: '#c8d6ed'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dce1ff'
  primary-fixed-dim: '#b7c4ff'
  on-primary-fixed: '#001551'
  on-primary-fixed-variant: '#0039b5'
  secondary-fixed: '#dae2fd'
  secondary-fixed-dim: '#bec6e0'
  on-secondary-fixed: '#131b2e'
  on-secondary-fixed-variant: '#3f465c'
  tertiary-fixed: '#d6e3fb'
  tertiary-fixed-dim: '#bac7de'
  on-tertiary-fixed: '#0f1c2d'
  on-tertiary-fixed-variant: '#3b485a'
  background: '#f8f9fa'
  on-background: '#191c1d'
  surface-variant: '#e1e3e4'
typography:
  headline-lg:
    fontFamily: Geist
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Geist
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: -0.015em
  headline-sm:
    fontFamily: Geist
    fontSize: 15px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Geist
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-md:
    fontFamily: Geist
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
  body-sm:
    fontFamily: Geist
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  label-md:
    fontFamily: Geist
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 14px
    letterSpacing: 0.04em
  label-sm:
    fontFamily: Geist
    fontSize: 10px
    fontWeight: '500'
    lineHeight: 12px
    letterSpacing: 0.05em
  metric-lg:
    fontFamily: JetBrains Mono
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: -0.02em
  metric-md:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 18px
  metric-sm:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 0.75rem
  margin: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 0.75rem
  space-lg: 1rem
  space-xl: 1.5rem
---

## Brand & Style

This design system is engineered for mission-critical municipal infrastructure monitoring and high-stakes pre-storm operational command. The emotional baseline is absolute composure, technical rigor, and zero ambiguity under cognitive load. It rejects consumer embellishments, gradients, glows, and decorative micro-interactions in favor of utilitarian speed, deterministic spatial hierarchy, and rapid situational assessment.

The target audience comprises chief engineers, drainage superintendents, and municipal dispatchers operating in high-pressure monitoring environments. Information density must remain compact without collapsing into visual noise. The style sits at the precise intersection of high-density developer consoles and tactical geospatial dashboards: flat surface steps, hairline boundaries, strict tabular alignment, and disciplined semantic coloring.

## Colors

The palette operates under strict functional zoning:

- **Surface Tiers**: Base canvas uses `#F8F9FA`. Primary panels, cards, and inspection drawers use pure `#FFFFFF`. Subtle secondary rails and recessed metric containers use `#F1F3F5`.
- **Structural Dividers**: Every perimeter, table division, and docked panel relies on crisp 1px neutral borders: `#E5E7EB` for standard layout divisions and `#D1D5DB` for active or focused boundaries.
- **Primary Accent (`#1D4ED8`)**: Reserved strictly for high-priority executive actions (e.g., "Dispatch Pump Crew", "Confirm Sluice Opening") and tactical corridor selections on map vector overlays. It is never used decoratively.
- **Semantic Hotspot Tokens**: Tri-state alerting is strictly isolated to hydrological hotspot severity:
  - Nominal / Cleared: `#16A34A` (Background tint: `#F0FDF4`, Border: `#BBF7D0`)
  - Warning / Pre-Alert: `#D97706` (Background tint: `#FFFBEB`, Border: `#FDE68A`)
  - Critical / Overflow Imminent: `#DC2626` (Background tint: `#FEF2F2`, Border: `#FECACA`)
- **Text & Data Contrast**: Primary values and titles sit at `#0F172A`, secondary telemetry captions at `#475467`, and disabled or muted states at `#9CA3AF`.

## Typography

Typography prioritizes rapid scannability and structural density:

- **Proportional Text (`Geist`)**: Used across all UI labels, table headers, breadcrumbs, status legends, and system dialogs. Strict tracking adjustments eliminate loose spatial footprints.
- **Monospaced Data (`JetBrains Mono`)**: Mandatory for all coordinates, rainfall rates (mm/hr), pump discharge telemetry (cusecs), culvert capacities, timestamps, and fleet unit IDs. Numbers must render with uniform tabular figures (`font-variant-numeric: tabular-nums`) to ensure vertical column stability during real-time streaming updates.
- **Display Scale Capping**: Headlines never exceed 24px desktop / 20px mobile. Screen real estate is prioritized for situational telemetry and map viewports.

## Layout & Spacing

The layout is structured around an exact 8px base rhythm (with 4px half-steps for compact data tables and badge padding):

- **Command Architecture**: Multi-pane split interface consisting of a fixed 56px utility masthead, a persistent 320px telemetry and incident stack (left or floating dock), a full-bleed dynamic GIS spatial viewport (center), and an expandable 360px asset/culvert parameter drawer (right).
- **Table and Stream Densities**: Row heights in operational log lists are fixed to 32px or 36px. Cell internal padding is strictly 6px vertical by 8px horizontal to prevent horizontal scrollbars while retaining full text integrity.
- **Responsive Handling**:
  - **Desktop (>=1280px)**: Three-pane layout active concurrently. Zero layout shifts.
  - **Laptop/Field Toughbook (1024px - 1279px)**: Asset parameter drawer collapses into an overlay flyout; telemetry rail remains anchored.
  - **Tablet/Vehicle Unit (<1024px)**: Single-pane view with a bottom-sheet sheet controller for hotspot triage and full-width map toggling.

## Elevation & Depth

This design system avoids multi-layer ambient drop shadows. Depth and hierarchy are achieved entirely through structural surface tone shifts and sharp 1px borders:

- **Level 0 (App Shell/Canvas)**: `#F8F9FA`. Background baseline for geospatial frame borders and structural margins.
- **Level 1 (Panels & Tables)**: Pure `#FFFFFF` resting directly on Level 0, bounded by a uniform 1px solid border (`#E5E7EB`). No shadow.
- **Level 2 (Active Inspection Cards, Map Popovers, Tooltips)**: `#FFFFFF` bounded by `#D1D5DB` with a subtle, non-diffuse 1px technical offset: `box-shadow: 0 1px 2px rgba(15, 23, 42, 0.06)`.
- **Level 3 (Modal Overlays / Emergency Confirmations)**: `#FFFFFF` framed by `#0F172A` hairline border (1px), elevated over a neutral `#0F172A` backdrop mask at 24% opacity. No heavy blurs.

## Shapes

Corner radii are kept compact (`0.25rem` / 4px) across all interactive elements, containers, and badges to reflect industrial control equipment. 

- Form inputs, segmented controllers, and utility buttons use strict 4px corners (`rounded-sm`).
- Outer dashboard container modules use 4px corners or flush 0px borders where docking occurs against browser edges.
- Hotspot telemetry badges use 2px or 4px subtle squircle geometries. Rounded pill shapes are prohibited to avoid looking like consumer status tags.

## Components

- **Buttons**:
  - *Primary Action*: `#1D4ED8` background, `#FFFFFF` text, 1px solid `#1E40AF` border. Height: 32px. Flat state; active state darkens to `#1E40AF`.
  - *Secondary / Utility*: `#FFFFFF` surface, `#0F172A` text, 1px solid `#E5E7EB` border. Hover: `#F1F3F5`.
  - *Critical Triage*: `#DC2626` background, `#FFFFFF` text. Used only for emergency override operations.
- **Hotspot Status Chips**:
  - Compact (18px height), inline-flex items with monospaced code and label.
  - *Nominal*: `#F0FDF4` bg, `#16A34A` text, 1px `#BBF7D0` border.
  - *Warning*: `#FFFBEB` bg, `#D97706` text, 1px `#FDE68A` border.
  - *Critical*: `#FEF2F2` bg, `#DC2626` text, 1px `#FECACA` border. Includes a 6px static solid circle indicator (no animation, no pulse).
- **Data Tables & Water-Level Lists**:
  - Sticky headers at `#F8F9FA` with 11px uppercase Geist typography.
  - Alternating rows prohibited; rows separate using 1px horizontal lines (`#E5E7EB`).
  - Metric cells (e.g., gauge level, capacity %) always right-aligned using JetBrains Mono with units appended in 10px muted weight (`#475467`).
- **Telemetry Inputs & Filters**:
  - Single-line search and parametric dropdowns with 32px height, 1px solid `#D1D5DB` borders, `#FFFFFF` fill, and zero glow on focus (focus switches border to `#1D4ED8` with a 1px solid outline).
- **Inspection Cards**:
  - Contain structural header strips, live sensor readings in a 2-column key-value grid, and clear breadcrumb paths (`Drain No. 4 > Barapullah Basin`). Separated by clean 1px internal dividers.