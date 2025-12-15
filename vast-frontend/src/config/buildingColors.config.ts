import type { BuildingType } from '../types/buildings.types';

/**
 * Color palette for building types
 * Colors are chosen to be distinct and semantically meaningful
 */
export const BUILDING_COLORS: Record<BuildingType, string> = {
  Pub: '#f59e0b', // Amber - warm, social
  Restaurant: '#ef4444', // Red - dining, food
  Apartment: '#3b82f6', // Blue - residential, calm
  Employer: '#8b5cf6', // Purple - professional, corporate
  School: '#10b981', // Green - education, growth
};

/**
 * Hover/highlight colors
 */
export const BUILDING_INTERACTION_COLORS = {
  hover: '#fbbf24', // Bright amber
  selected: '#dc2626', // Bright red
};

/**
 * Get color for a building type
 */
export const getBuildingColor = (type: BuildingType): string => {
  // Fallback to a neutral gray if type is undefined or not found
  if (!type || !BUILDING_COLORS[type]) {
    return '#9ca3af';
  }
  return BUILDING_COLORS[type];
};

/**
 * Get hover color
 */
export const getHoverColor = (): string => {
  return BUILDING_INTERACTION_COLORS.hover;
};

/**
 * Get selected color
 */
export const getSelectedColor = (): string => {
  return BUILDING_INTERACTION_COLORS.selected;
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
