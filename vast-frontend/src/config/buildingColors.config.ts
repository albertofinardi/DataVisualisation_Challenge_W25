import type { BuildingType } from '../types/buildings.types';

/**
 * Color palette for building types
 * Colors are chosen to be distinct and semantically meaningful
 */
export const BUILDING_COLORS: Record<BuildingType, { light: string; dark: string }> = {
  Pub: {
    light: '#f59e0b', // Amber - warm, social
    dark: '#fbbf24',
  },
  Restaurant: {
    light: '#ef4444', // Red - dining, food
    dark: '#f87171',
  },
  Apartment: {
    light: '#3b82f6', // Blue - residential, calm
    dark: '#60a5fa',
  },
  Employer: {
    light: '#8b5cf6', // Purple - professional, corporate
    dark: '#a78bfa',
  },
  School: {
    light: '#10b981', // Green - education, growth
    dark: '#34d399',
  },
};

/**
 * Hover/highlight colors
 */
export const BUILDING_INTERACTION_COLORS = {
  hover: {
    light: '#fbbf24', // Bright amber
    dark: '#fcd34d',
  },
  selected: {
    light: '#dc2626', // Bright red
    dark: '#ef4444',
  },
};

/**
 * Get color for a building type based on theme
 */
export const getBuildingColor = (type: BuildingType, theme: 'light' | 'dark' = 'light'): string => {
  // Fallback to a neutral gray if type is undefined or not found
  if (!type || !BUILDING_COLORS[type]) {
    return theme === 'dark' ? '#6b7280' : '#9ca3af';
  }
  return BUILDING_COLORS[type][theme];
};

/**
 * Get hover color based on theme
 */
export const getHoverColor = (theme: 'light' | 'dark' = 'light'): string => {
  return BUILDING_INTERACTION_COLORS.hover[theme];
};

/**
 * Get selected color based on theme
 */
export const getSelectedColor = (theme: 'light' | 'dark' = 'light'): string => {
  return BUILDING_INTERACTION_COLORS.selected[theme];
};

/**
 * Opacity settings for building polygons
 */
export const BUILDING_OPACITY = {
  default: 0.6,
  hover: 0.85,
  selected: 0.9,
  filtered: 0.2,
};
