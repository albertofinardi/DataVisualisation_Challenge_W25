/**
 * API service for fetching heatmap data
 */

import { MAP_CONFIG } from '../config/map.config';
import type { TemporalHeatmapData, StaticHeatmapData, LocationDetails, Bounds } from '../types/heatmap.types';
import type { StreamgraphDataResponse } from '../types/streamgraph.types';

const { baseUrl } = MAP_CONFIG.api;

export interface HeatmapParams {
  start?: string;
  end?: string;
  cell_size?: number;
  time_bucket_minutes?: number;
  include_temporal?: boolean;
}

export interface LocationDetailsParams {
  grid_x: number;
  grid_y: number;
  time_bucket?: string;
  cell_size?: number;
  time_bucket_minutes?: number;
}

export const api = {
  /**
   * Fetch temporal heatmap data (grouped by time)
   */
  async fetchTemporalHeatmap(params: HeatmapParams): Promise<{ data: TemporalHeatmapData, globalMaxCount: number }> {
    const queryParams = new URLSearchParams({
      include_temporal: 'true',
      ...Object.fromEntries(
        Object.entries(params).map(([key, value]) => [key, String(value)])
      ),
    });

    const response = await fetch(`${baseUrl}/heatmap/locations?${queryParams}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch heatmap data: ${response.statusText}`);
    }
    return response.json();
  },

  /**
   * Fetch static heatmap data (all time aggregated)
   */
  async fetchStaticHeatmap(params: Omit<HeatmapParams, 'include_temporal'>): Promise<StaticHeatmapData> {
    const queryParams = new URLSearchParams({
      include_temporal: 'false',
      ...Object.fromEntries(
        Object.entries(params).map(([key, value]) => [key, String(value)])
      ),
    });

    const response = await fetch(`${baseUrl}/heatmap/locations?${queryParams}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch heatmap data: ${response.statusText}`);
    }
    return response.json();
  },

  /**
   * Fetch details for a specific grid cell
   */
  async fetchLocationDetails(params: LocationDetailsParams): Promise<LocationDetails> {
    const queryParams = new URLSearchParams(
      Object.fromEntries(
        Object.entries(params)
          .filter(([, value]) => value !== undefined)
          .map(([key, value]) => [key, String(value)])
      )
    );

    const response = await fetch(`${baseUrl}/heatmap/locations/details?${queryParams}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch location details: ${response.statusText}`);
    }
    return response.json();
  },

  /**
   * Fetch map bounds
   */
  async fetchBounds(params?: { start?: string; end?: string }): Promise<Bounds> {
    const queryParams = params
      ? new URLSearchParams(
          Object.fromEntries(
            Object.entries(params)
              .filter(([, value]) => value !== undefined)
              .map(([key, value]) => [key, String(value)])
          )
        )
      : '';

    const response = await fetch(`${baseUrl}/utils/bounds${queryParams ? `?${queryParams}` : ''}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch bounds: ${response.statusText}`);
    }
    return response.json();
  },

  /**
   * Fetch streamgraph activity data (grouped by time)
   */
  async fetchStreamgraphActivities(params: {
    start?: string;
    end?: string;
    time_bucket_minutes?: number;
  }): Promise<StreamgraphDataResponse> {
    const queryParams = new URLSearchParams(
      Object.fromEntries(
        Object.entries(params)
          .filter(([, value]) => value !== undefined)
          .map(([key, value]) => [key, String(value)])
      )
    );

    const response = await fetch(`${baseUrl}/streamgraph/activities?${queryParams}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch streamgraph data: ${response.statusText}`);
    }
    return response.json();
  },
};
