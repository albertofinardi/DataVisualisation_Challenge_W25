/**
 * Type definitions for heatmap data
 */

export interface LocationDataPoint {
  grid_x: number;
  grid_y: number;
  count: string;
  center_longitude: number;
  center_latitude: number;
}

export interface TemporalHeatmapData {
  [timestamp: string]: LocationDataPoint[];
}

export interface StaticHeatmapData {
  all: LocationDataPoint[];
}

export interface LocationDetails {
  grid_x: number;
  grid_y: number;
  count: string;
  center_longitude: number;
  center_latitude: number;
  time_bucket: string | null;
  participant_count: number;
  participants: number[];
}

export interface Bounds {
  min_longitude: number;
  max_longitude: number;
  min_latitude: number;
  max_latitude: number;
  center_longitude: number;
  center_latitude: number;
  width: number;
  height: number;
}
