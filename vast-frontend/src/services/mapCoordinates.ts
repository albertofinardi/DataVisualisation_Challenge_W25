/**
 * Map Coordinate Mapping Service
 *
 * Provides utilities for converting between geographic coordinates and pixel positions
 * for map visualizations. This service can be reused across different map-based views.
 */

import { scaleLinear, type ScaleLinear } from 'd3-scale';
import { MAP_CONFIG } from '../config/map.config';

export interface CoordinateScales {
  xScale: ScaleLinear<number, number>;
  yScale: ScaleLinear<number, number>;
}

export interface MapDimensions {
  width: number;
  height: number;
  padding: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
}

export interface CoordinateBounds {
  minLongitude: number;
  maxLongitude: number;
  minLatitude: number;
  maxLatitude: number;
}

/**
 * Creates D3 scales for mapping geographic coordinates to pixel positions
 */
export function createCoordinateScales(
  bounds: CoordinateBounds = MAP_CONFIG.bounds,
  dimensions: MapDimensions = MAP_CONFIG.visual
): CoordinateScales {
  const { minLongitude, maxLongitude, minLatitude, maxLatitude } = bounds;
  const { width, height, padding } = dimensions;

  // Create linear scale for X (longitude to pixel x)
  const xScale = scaleLinear()
    .domain([minLongitude, maxLongitude])
    .range([padding.left, width - padding.right]);

  // Create linear scale for Y (latitude to pixel y)
  // Note: Y-axis is inverted in SVG (0 at top)
  const yScale = scaleLinear()
    .domain([minLatitude, maxLatitude])
    .range([height - padding.bottom, padding.top]);

  return { xScale, yScale };
}

/**
 * Converts a longitude value to pixel X coordinate
 */
export function longitudeToX(
  longitude: number,
  xScale: ScaleLinear<number, number>
): number {
  return xScale(longitude);
}

/**
 * Converts a latitude value to pixel Y coordinate
 */
export function latitudeToY(
  latitude: number,
  yScale: ScaleLinear<number, number>
): number {
  return yScale(latitude);
}

/**
 * Converts pixel X coordinate back to longitude
 */
export function xToLongitude(
  x: number,
  xScale: ScaleLinear<number, number>
): number {
  return xScale.invert(x);
}

/**
 * Converts pixel Y coordinate back to latitude
 */
export function yToLatitude(
  y: number,
  yScale: ScaleLinear<number, number>
): number {
  return yScale.invert(y);
}

/**
 * Converts a geographic point to pixel coordinates
 */
export function geoToPixel(
  longitude: number,
  latitude: number,
  scales: CoordinateScales
): { x: number; y: number } {
  return {
    x: longitudeToX(longitude, scales.xScale),
    y: latitudeToY(latitude, scales.yScale),
  };
}

/**
 * Converts a pixel point to geographic coordinates
 */
export function pixelToGeo(
  x: number,
  y: number,
  scales: CoordinateScales
): { longitude: number; latitude: number } {
  return {
    longitude: xToLongitude(x, scales.xScale),
    latitude: yToLatitude(y, scales.yScale),
  };
}

/**
 * Calculates the pixel size for a grid cell given its coordinate size
 */
export function getCellPixelSize(
  cellSizeInCoords: number,
  scales: CoordinateScales
): { width: number; height: number } {
  // Calculate how many pixels represent the cell size in each dimension
  const x1 = scales.xScale(0);
  const x2 = scales.xScale(cellSizeInCoords);
  const y1 = scales.yScale(0);
  const y2 = scales.yScale(cellSizeInCoords);

  return {
    width: Math.abs(x2 - x1),
    height: Math.abs(y2 - y1),
  };
}

/**
 * Checks if a geographic coordinate is within bounds
 */
export function isWithinBounds(
  longitude: number,
  latitude: number,
  bounds: CoordinateBounds = MAP_CONFIG.bounds
): boolean {
  return (
    longitude >= bounds.minLongitude &&
    longitude <= bounds.maxLongitude &&
    latitude >= bounds.minLatitude &&
    latitude <= bounds.maxLatitude
  );
}

/**
 * Clamps a coordinate to stay within bounds
 */
export function clampToBounds(
  longitude: number,
  latitude: number,
  bounds: CoordinateBounds = MAP_CONFIG.bounds
): { longitude: number; latitude: number } {
  return {
    longitude: Math.max(
      bounds.minLongitude,
      Math.min(bounds.maxLongitude, longitude)
    ),
    latitude: Math.max(
      bounds.minLatitude,
      Math.min(bounds.maxLatitude, latitude)
    ),
  };
}

/**
 * Calculates the aspect ratio of the coordinate bounds
 */
export function getAspectRatio(
  bounds: CoordinateBounds = MAP_CONFIG.bounds
): number {
  const width = bounds.maxLongitude - bounds.minLongitude;
  const height = bounds.maxLatitude - bounds.minLatitude;
  return width / height;
}

/**
 * Gets the center point of the bounds
 */
export function getBoundsCenter(
  bounds: CoordinateBounds = MAP_CONFIG.bounds
): { longitude: number; latitude: number } {
  return {
    longitude: (bounds.minLongitude + bounds.maxLongitude) / 2,
    latitude: (bounds.minLatitude + bounds.maxLatitude) / 2,
  };
}
