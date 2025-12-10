/**
 * Color Scale Service
 *
 * Provides theme-aware color palettes and scales for data visualizations.
 * All colors are derived from the app's core palette and respect light/dark themes.
 */

import { scaleQuantize, scaleSequential, type ScaleQuantize, type ScaleSequential } from 'd3-scale';
import { interpolateRgb } from 'd3-interpolate';

export type ColorScheme = 'coral' | 'slate' | 'mixed';

/**
 * Predefined color palettes for different visualization schemes
 */
export const COLOR_PALETTES = {
  coral: {
    gradient: [
      '#fef4f0', // Very light coral (bg-coral-light)
      '#fcd4c3', // Light peachy
      '#f7b99b', // Lighter coral
      '#ef8354', // Core coral-glow
      '#e06d3f', // Darker coral
      '#d55a2f', // Deep coral
      '#c85a2e', // Very deep coral
      '#b8491f', // Brown-coral
      '#a33c18', // Dark brown-coral
      '#8e3014', // Very dark brown-coral
    ],
    stroke: '#2d3142',
    hover: '#4f5d75',
    selected: '#ef8354',
  },
  slate: {
    gradient: [
      '#f2f3f5', // Very light slate (bg-slate-light)
      '#d4d8e0', // Light gray-slate
      '#b6bdcc', // Lighter slate
      '#8da4c4', // Mid-light slate
      '#6b7a94', // Lighter slate
      '#5a6b87', // Mid slate
      '#4f5d75', // Core blue-slate
      '#3d4e6b', // Darker slate
      '#354561', // Deep slate
      '#2d3c57', // Very deep slate
    ],
    stroke: '#2d3142',
    hover: '#ef8354',
    selected: '#4f5d75',
  },
  mixed: {
    gradient: [
      '#f2f3f5', // Light slate
      '#e8d4d0', // Blend
      '#ddb6a8', // Coral-slate blend
      '#c89080', // Mid coral-slate
      '#a36a58', // Darker blend
      '#7a5548', // Deep blend
      '#6b5d5d', // Brown blend
      '#5a5565', // Slate-heavy
      '#4a4d6d', // Dark slate
      '#3a4575', // Deep slate-coral
    ],
    stroke: '#2d3142',
    hover: '#ef8354',
    selected: '#4f5d75',
  },
};


/**
 * Gets CSS variable value from the document
 */
export function getCSSVariable(variableName: string): string {
  if (typeof window === 'undefined') return '';
  return getComputedStyle(document.documentElement)
    .getPropertyValue(variableName)
    .trim();
}

/**
 * Creates a quantize scale (divides domain into discrete buckets)
 * Perfect for heatmaps where you want discrete color steps
 */
export function createQuantizeScale(
  domain: [number, number],
  scheme: ColorScheme = 'coral'
): ScaleQuantize<string, never> {
  const palette = COLOR_PALETTES[scheme];

  return scaleQuantize<string>()
    .domain(domain)
    .range(palette.gradient);
}

/**
 * Creates a continuous sequential scale (smooth gradient)
 * Perfect for smooth color transitions
 */
export function createSequentialScale(
  domain: [number, number],
  scheme: ColorScheme = 'coral'
): ScaleSequential<string, never> {
  const palette = COLOR_PALETTES[scheme];

  // Get the first and last colors for interpolation
  const startColor = palette.gradient[0];
  const endColor = palette.gradient[palette.gradient.length - 1];

  return scaleSequential(interpolateRgb(startColor, endColor)).domain(domain);
}

/**
 * Gets the stroke color
 */
export function getStrokeColor(
  scheme: ColorScheme = 'coral'
): string {
  return COLOR_PALETTES[scheme].stroke;
}

/**
 * Gets the hover color
 */
export function getHoverColor(
  scheme: ColorScheme = 'coral'
): string {
  return COLOR_PALETTES[scheme].hover;
}

/**
 * Gets the selection color
 */
export function getSelectedColor(
  scheme: ColorScheme = 'coral'
): string {
  return COLOR_PALETTES[scheme].selected;
}

/**
 * Gets the full color palette for a scheme
 */
export function getColorPalette(
  scheme: ColorScheme = 'coral'
): string[] {
  return COLOR_PALETTES[scheme].gradient;
}

/**
 * Creates a color scale with custom steps
 * Useful when you want a specific number of color steps
 */
export function createSteppedScale(
  domain: [number, number],
  steps: number,
  scheme: ColorScheme = 'coral'
): ScaleQuantize<string, never> {
  const fullPalette = COLOR_PALETTES[scheme].gradient;

  // Sample the palette to get the desired number of steps
  const stepSize = (fullPalette.length - 1) / (steps - 1);
  const sampledPalette = Array.from({ length: steps }, (_, i) =>
    fullPalette[Math.round(i * stepSize)]
  );

  return scaleQuantize<string>()
    .domain(domain)
    .range(sampledPalette);
}

/**
 * Gets theme-aware colors from CSS variables
 * Useful for UI elements that should match the theme
 */
export function getThemeColors() {
  return {
    background: {
      primary: getCSSVariable('--color-bg-primary'),
      secondary: getCSSVariable('--color-bg-secondary'),
      tertiary: getCSSVariable('--color-bg-tertiary'),
      elevated: getCSSVariable('--color-bg-elevated'),
    },
    text: {
      primary: getCSSVariable('--color-text-primary'),
      secondary: getCSSVariable('--color-text-secondary'),
      tertiary: getCSSVariable('--color-text-tertiary'),
      quaternary: getCSSVariable('--color-text-quaternary'),
    },
    border: {
      primary: getCSSVariable('--color-border-primary'),
      secondary: getCSSVariable('--color-border-secondary'),
      strong: getCSSVariable('--color-border-strong'),
    },
    heatmap: {
      stroke: getCSSVariable('--color-heatmap-stroke'),
      selected: getCSSVariable('--color-heatmap-selected'),
      hover: getCSSVariable('--color-heatmap-hover'),
    },
    tooltip: {
      background: getCSSVariable('--tooltip-bg'),
      text: getCSSVariable('--tooltip-text'),
      border: getCSSVariable('--tooltip-border'),
    },
  };
}

/**
 * Gets the data visualization palette from CSS variables
 */
export function getVizPalette(): string[] {
  return Array.from({ length: 12 }, (_, i) =>
    getCSSVariable(`--color-viz-${i + 1}`)
  );
}

/**
 * Interpolates between two colors for custom gradients
 */
export function interpolateColors(
  color1: string,
  color2: string,
  steps: number
): string[] {
  const interpolator = interpolateRgb(color1, color2);
  return Array.from({ length: steps }, (_, i) =>
    interpolator(i / (steps - 1))
  );
}

/**
 * Color schemes for interest groups (A-J)
 * Each group gets a distinct color
 * Starting with darker colors for better visibility (removed very light initial colors)
 */
export const INTEREST_GROUP_COLORS: Record<string, string[]> = {
  A: ['#f7b99b', '#ef8354', '#e06d3f', '#d55a2f', '#c85a2e', '#b8491f', '#a33c18', '#8e3014'],
  B: ['#9bbef7', '#5493ef', '#3f7ae0', '#2f66d5', '#2e59c8', '#1f47b8', '#1838a3', '#14308e'],
  C: ['#be9bf7', '#9354ef', '#7a3fe0', '#662fd5', '#592ec8', '#471fb8', '#3818a3', '#30148e'],
  D: ['#f79bbe', '#ef5493', '#e03f7a', '#d52f66', '#c82e59', '#b81f47', '#a31838', '#8e1430'],
  E: ['#9bf7be', '#54ef93', '#3fe07a', '#2fd566', '#2ec859', '#1fb847', '#18a338', '#148e30'],
  F: ['#f7f79b', '#efef54', '#e0e03f', '#d5d52f', '#c8c82e', '#b8b81f', '#a3a318', '#8e8e14'],
  G: ['#f79bf7', '#ef54ef', '#e03fe0', '#d52fd5', '#c82ec8', '#b81fb8', '#a318a3', '#8e148e'],
  H: ['#9bf7f7', '#54efef', '#3fe0e0', '#2fd5d5', '#2ec8c8', '#1fb8b8', '#18a3a3', '#148e8e'],
  I: ['#fff79b', '#ffef54', '#ffe03f', '#ffd52f', '#ffc82e', '#ffb81f', '#ffa318', '#ff8e14'],
  J: ['#ff9b9b', '#ff5454', '#ff3f3f', '#ff2f2f', '#ff2e2e', '#ff1f1f', '#ff1818', '#ff1414'],
};

/**
 * Gets the color gradient for a specific interest group
 */
export function getInterestGroupColors(group: string): string[] {
  return INTEREST_GROUP_COLORS[group] || INTEREST_GROUP_COLORS.A;
}

/**
 * Creates a color scale for a specific interest group
 */
export function createInterestGroupScale(
  domain: [number, number],
  group: string
): ScaleQuantize<string, never> {
  const colors = getInterestGroupColors(group);

  return scaleQuantize<string>()
    .domain(domain)
    .range(colors);
}
