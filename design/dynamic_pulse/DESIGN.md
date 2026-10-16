---
name: Dynamic Pulse
colors:
  surface: '#131313'
  surface-dim: '#131313'
  surface-bright: '#393939'
  surface-container-lowest: '#0e0e0e'
  surface-container-low: '#1b1b1b'
  surface-container: '#1f1f1f'
  surface-container-high: '#2a2a2a'
  surface-container-highest: '#353535'
  on-surface: '#e2e2e2'
  on-surface-variant: '#ebbbb4'
  inverse-surface: '#e2e2e2'
  inverse-on-surface: '#303030'
  outline: '#b18780'
  outline-variant: '#603e39'
  surface-tint: '#ffb4a8'
  primary: '#ffb4a8'
  on-primary: '#690000'
  primary-container: '#ff5541'
  on-primary-container: '#5c0000'
  inverse-primary: '#c00000'
  secondary: '#ffb4a8'
  on-secondary: '#690000'
  secondary-container: '#c00000'
  on-secondary-container: '#ffcdc5'
  tertiary: '#acc7ff'
  on-tertiary: '#002f67'
  tertiary-container: '#488fff'
  on-tertiary-container: '#00285b'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ffdad4'
  primary-fixed-dim: '#ffb4a8'
  on-primary-fixed: '#410000'
  on-primary-fixed-variant: '#930000'
  secondary-fixed: '#ffdad4'
  secondary-fixed-dim: '#ffb4a8'
  on-secondary-fixed: '#410000'
  on-secondary-fixed-variant: '#930000'
  tertiary-fixed: '#d7e2ff'
  tertiary-fixed-dim: '#acc7ff'
  on-tertiary-fixed: '#001a40'
  on-tertiary-fixed-variant: '#004491'
  background: '#131313'
  on-background: '#e2e2e2'
  surface-variant: '#353535'
  canvas-black: '#000000'
  surface-crimson-low: '#160605'
  surface-crimson-base: '#210e0b'
  surface-crimson-elevated: '#2f1a17'
  surface-crimson-bright: '#3b2421'
  flame-red: '#ff0101'
  crimson-core: '#c00000'
  kinetic-coral: '#ff5541'
  telemetry-blue: '#488fff'
  border-subtle: rgba(255, 255, 255, 0.08)
  border-active: rgba(255, 1, 1, 0.45)
  text-primary: '#ffffff'
  text-secondary: '#ebbbb4'
  text-muted: '#8d6e68'
typography:
  display-hero:
    fontFamily: Plus Jakarta Sans
    fontSize: 44px
    fontWeight: '700'
    lineHeight: 52px
    letterSpacing: -0.03em
  display-hero-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 38px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 34px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 30px
    letterSpacing: -0.015em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 26px
    letterSpacing: -0.01em
  metric-val-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  metric-val-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 26px
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '500'
    lineHeight: 24px
    letterSpacing: -0.005em
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
    letterSpacing: 0em
  body-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 18px
    letterSpacing: 0.01em
  label-caps:
    fontFamily: Plus Jakarta Sans
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.05em
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 10px
    fontWeight: '500'
    lineHeight: 13px
    letterSpacing: 0.02em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  space-3xs: 0.125rem
  space-2xs: 0.25rem
  space-xs: 0.5rem
  space-sm: 0.75rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
  space-2xl: 3rem
  gutter: 0.75rem
  margin-mobile: 1rem
  margin-tablet: 1.5rem
  margin-desktop: 2rem
---

## Brand & Style

The brand targets performance-driven athletes, coaches, and daily fitness enthusiasts who require effortless glanceability and laser-sharp visual discipline during high-output sessions. The experience rejects heavy, bulky visual clutter in favor of an energetic, razor-sharp, and contemporary athletic demeanor. It evokes precision, focus, and unrelenting momentum.

The aesthetic fuses **Athletic Kinetic Minimalism** with **Modern Dark-Mode Precision**. Anchored by deep carbon-to-pure-black surfaces and ignited by pure flame red and crimson accents, the design prioritizes clean, crisp geometric typography that balances both Latin and Thai typography seamlessly. The feel is aerodynamic, balanced, and premium, treating telemetric health data with high clarity and deliberate restraint.

## Colors

The color system delivers stark contrast, ensuring data visibility in bright outdoor light or low-light workout spaces:

- **Baseline Foundation:** The system is rooted in pure pitch black (`#000000`), reducing OLED power draw while providing an infinite depth canvas.
- **Primary (`#ff0101` - Flame Red):** The energetic driver of the UI. Applied strictly to primary actions, critical biometric zones, active timer states, and peak performance thresholds.
- **Secondary (`#c00000` - Crimson Core):** A deeper, richer red used for supporting progress rings, secondary containers, and active state fills that prevent visual exhaustion from oversaturated primaries.
- **Tertiary (`#488fff` - Telemetry Blue):** An electric cyan-blue supporting metric for contrast, dedicated to hydration tracking, sleep recovery phases, and differential telemetry.
- **Crimson Surface Stack:** Depth is structured through pure black stepping into nuanced deep-crimson surfaces:
  - `canvas-black` (`#000000`): Screen root canvas.
  - `surface-crimson-low` (`#160605`): Inset modules and receded tracks.
  - `surface-crimson-base` (`#210e0b`): Default cards and telemetry tiles.
  - `surface-crimson-elevated` (`#2f1a17`): Modals, bottom sheets, and floating action containers.
  - `surface-crimson-bright` (`#3b2421`): Hover states, selected tabs, and segmented highlights.

## Typography

Typography moves away from heavy, quirky display forms in favor of **Plus Jakarta Sans** across all roles, with fallback and localization parity to modern, geometric loopless Thai typefaces (such as Prompt and Kanit). 

- **Clarity & Proportions:** The family delivers tall x-height, open apertures, and crisp geometric terminals that maintain optimal legibility even at small sizes and high velocities.
- **Thai & Latin Harmony:** Plus Jakarta Sans aligns in optical weight, cap-height, and neutral geometry with modern Thai sans-serifs, providing smooth bilingual layout pairing without baseline drift or font jarring.
- **Optical Weighting:** Heavy `800` and `900` black weights are retired in favor of tight, refined `600` SemiBold and `700` Bold for headers and statistics. This creates an athletic, high-tech aesthetic that avoids feeling bulky or blocky.
- **Data & Telemetry:** Numbers in timers and counters utilize tabular lining figures (`font-variant-numeric: tabular-nums`) to eliminate horizontal jitter during live counting.

## Layout & Spacing

The layout model is governed by an athletic fluid grid adapted for fast handheld interaction and high information density:

- **Grid Architecture:** 
  - Mobile (<600px): 4 fluid columns with `1rem` (16px) margins and `0.75rem` (12px) gutters.
  - Tablet (600px–1024px): 8 fluid columns with `1.5rem` (24px) margins and `1rem` (16px) gutters.
  - Desktop (>1024px): 12 fluid columns with a max content container of `1280px` centered on canvas.
- **Vertical Rhythm:** Built strictly on an 8px scale with a 4px sub-rhythm for tight metric groupings (e.g., metric label stacked directly 4px above metric values).
- **Edge Security:** Active workout dashboards enforce a minimum `1rem` thumb clearance zone along all viewport boundaries to eliminate accidental touches during movement.

## Elevation & Depth

Visual hierarchy on pure black surfaces avoids muddy, diffuse gray drop-shadows. Depth is articulated through three distinct techniques:

- **Tonal Stepping:** Layering surfaces from `#000000` (root) through `#210e0b` (cards) up to `#2f1a17` (floating overlays).
- **Hairline Ghost Borders:** Every elevated panel, tile, and card is framed with a razor-thin border (`1px solid rgba(255, 255, 255, 0.08)`). This provides crisp structural delineation against black without adding visual bulk.
- **Active Radiant Glow:** When a stat reaches peak threshold or an action becomes active, elements emit a concentrated, vibrant perimeter glow rather than a dark shadow:
  - Primary Action Glow: `0 8px 24px -2px rgba(255, 1, 1, 0.35)`
  - Telemetry Active Glow: `0 8px 24px -2px rgba(72, 143, 255, 0.30)`
- **Glassmorphic Overlays:** Sticky headers and persistent bottom navigation bars use frosted translucent glass (`backdrop-filter: blur(20px) saturate(180%)`) with background fill `rgba(16, 6, 5, 0.82)` to preserve contextual motion beneath.

## Shapes

The shape system employs clean modern `rounded-xl` contours for macro components, offset by streamlined pills for controls and interactive chips:

- **Containers & Tiles:** Standard cards, workout overview sheets, and modal frames utilize `1.5rem` (24px, `rounded-xl`), creating an inviting, aerodynamic silhouette.
- **Small Containers & Insets:** Inner metric sub-cards and table groups use `1rem` (16px, `rounded-lg`).
- **Interactive Controls:** All buttons, metric badges, telemetry tags, segment toggles, and status markers leverage full pills (`9999px`), ensuring tactile ergonomics and rapid visual targeting.

## Components

### Buttons & Actions
- **Primary Button:** Full-pill (`rounded-full`), min-height 52px. Filled with Flame Red (`#ff0101`), displaying bold, crisp white text (`text-primary`, weight 600). Press interaction uses an immediate micro-scale (`transform: scale(0.97)`) paired with a luminous red glow.
- **Secondary Button:** Translucent surface (`rgba(255, 255, 255, 0.06)`) enclosed by a clean border (`1px solid rgba(255, 255, 255, 0.15)`). Text styled in White with Flame Red color shift on hover/focus.
- **Floating Metric Bar:** Elevated pill container anchored at the bottom edge, surfaced in `surface-crimson-elevated` with 16px blur, housing persistent play, pause, and split timers.

### Cards & Metric Tiles
- **Structure:** Surface Crimson Base (`#210e0b`) enclosed in `rounded-xl` with hairline borders (`1px solid rgba(255, 255, 255, 0.08)`).
- **Layout:** Top section houses a micro-label (`label-caps`) in muted pink (`text-secondary`) paired with an optional right-aligned telemetry icon. Center displays the numeric stat in `metric-val-lg` using crisp white. Bottom margin contains pace trends or sparkline visualizations.

### Telemetry Chips & Badges
- Built using full-pill geometry, with height strictly bounded between 24px and 28px.
- Background uses subtle crimson or telemetry tints at 10% opacity, bordered by corresponding color at 25% opacity.
- Typography set in `label-caps` (SemiBold, +0.05em tracking) for swift scanning.

### Form Inputs & Fields
- Inset dark wells (`surface-crimson-low` / `#160605`) with `1rem` corner rounding and `1px solid rgba(255, 255, 255, 0.1)`.
- On active focus, the border shifts to crisp Flame Red (`#ff0101`) accompanied by a subtle 3px outer halo (`rgba(255, 1, 1, 0.2)`).
- Placeholder text uses subdued slate-rose (`#8d6e68`), ensuring high contrast when user input is typed in `#ffffff`.

### Checkboxes, Radios & Segmented Controls
- **Segmented Control:** A unified `rounded-full` crimson frame housing individual segment pills. The active segment glides into place on a `surface-crimson-bright` pill with a clean white label.
- **Toggles / Switches:** Pill switch track in deep crimson-slate; active state snaps the handle to the right, illuminating the track in Flame Red (`#ff0101`).

### Lists & Activity Feeds
- Dividerless architecture. Each feed item is an independent mini-card with `rounded-lg` geometry separated by `0.5rem` vertical spacing.
- Left-aligned 40px circular glyph badge tinted in low-opacity crimson or telemetry blue, housing a clean 20px vector icon.