/**
 * Color Scale Service
 *
 * Provides theme-aware color palettes and scales for data visualizations.
 * All colors are derived from the app's core palette and respect light/dark themes.
 */

import { scaleQuantize, scaleSequential, type ScaleQuantize, type ScaleSequential } from 'd3-scale';
import { interpolateRgb } from 'd3-interpolate';

export type ColorScheme = 'coral' | 'slate' | 'mixed';
export type Theme = 'light' | 'dark';

/**
 * Predefined color palettes for different visualization schemes
 */
export const COLOR_PALETTES = {
  coral: {
    light: {
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
    dark: {
      gradient: [
        '#3d2a22', // Dark background tint
        '#662f1a', // Deep brown
        '#9d4025', // Dark coral-brown
        '#c85a2e', // Deep coral
        '#ef8354', // Core coral
        '#ff9d7a', // Lighter coral (accent)
        '#ffaa80', // Peachy coral
        '#ffb893', // Very light coral
        '#ffc5a6', // Pale coral
        '#ffd2b9', // Very pale coral
      ],
      stroke: '#ffffff',
      hover: '#8da4c4',
      selected: '#ff9d7a',
    },
  },
  slate: {
    light: {
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
    dark: {
      gradient: [
        '#2d3649', // Dark background tint
        '#3a4560', // Deeper slate bg
        '#4a5670', // Dark slate
        '#5a6b87', // Mid slate
        '#6b7a94', // Lighter mid slate
        '#7a8fb4', // Mid-light slate
        '#8da4c4', // Light slate (accent)
        '#a3b4d4', // Very light slate
        '#b8c7e4', // Pale slate
        '#cdd8ed', // Very pale slate
      ],
      stroke: '#ffffff',
      hover: '#ff9d7a',
      selected: '#8da4c4',
    },
  },
  mixed: {
    light: {
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
    dark: {
      gradient: [
        '#2d3340', // Dark blend bg
        '#4a3d42', // Deep blend
        '#674752', // Coral-slate blend
        '#845162', // Mid blend
        '#a15b72', // Lighter blend
        '#be6582', // Coral-heavy
        '#db6f92', // Light coral blend
        '#f879a2', // Very light blend
        '#ff8fb2', // Pale blend
        '#ffa5c2', // Very pale blend
      ],
      stroke: '#ffffff',
      hover: '#8da4c4',
      selected: '#ff9d7a',
    },
  },
};

/**
 * Gets the current theme from the document
 */
export function getCurrentTheme(): Theme {
  if (typeof window === 'undefined') return 'light';
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
}

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
  scheme: ColorScheme = 'coral',
  theme?: Theme
): ScaleQuantize<string, never> {
  const currentTheme = theme || getCurrentTheme();
  const palette = COLOR_PALETTES[scheme][currentTheme];

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
  scheme: ColorScheme = 'coral',
  theme?: Theme
): ScaleSequential<string, never> {
  const currentTheme = theme || getCurrentTheme();
  const palette = COLOR_PALETTES[scheme][currentTheme];

  // Get the first and last colors for interpolation
  const startColor = palette.gradient[0];
  const endColor = palette.gradient[palette.gradient.length - 1];

  return scaleSequential(interpolateRgb(startColor, endColor)).domain(domain);
}

/**
 * Gets the stroke color for the current theme
 */
export function getStrokeColor(
  scheme: ColorScheme = 'coral',
  theme?: Theme
): string {
  const currentTheme = theme || getCurrentTheme();
  return COLOR_PALETTES[scheme][currentTheme].stroke;
}

/**
 * Gets the hover color for the current theme
 */
export function getHoverColor(
  scheme: ColorScheme = 'coral',
  theme?: Theme
): string {
  const currentTheme = theme || getCurrentTheme();
  return COLOR_PALETTES[scheme][currentTheme].hover;
}

/**
 * Gets the selection color for the current theme
 */
export function getSelectedColor(
  scheme: ColorScheme = 'coral',
  theme?: Theme
): string {
  const currentTheme = theme || getCurrentTheme();
  return COLOR_PALETTES[scheme][currentTheme].selected;
}

/**
 * Gets the full color palette for a scheme and theme
 */
export function getColorPalette(
  scheme: ColorScheme = 'coral',
  theme?: Theme
): string[] {
  const currentTheme = theme || getCurrentTheme();
  return COLOR_PALETTES[scheme][currentTheme].gradient;
}

/**
 * Creates a color scale with custom steps
 * Useful when you want a specific number of color steps
 */
export function createSteppedScale(
  domain: [number, number],
  steps: number,
  scheme: ColorScheme = 'coral',
  theme?: Theme
): ScaleQuantize<string, never> {
  const currentTheme = theme || getCurrentTheme();
  const fullPalette = COLOR_PALETTES[scheme][currentTheme].gradient;

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
