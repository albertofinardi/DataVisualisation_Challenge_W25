/**
 * API service for fetching heatmap data
 */

import { MAP_CONFIG } from '../config/map.config';
import type { TemporalHeatmapData, StaticHeatmapData, LocationDetails, Bounds } from '../types/heatmap.types';
import type { StreamgraphDataResponse } from '../types/streamgraph.types';
import type { ActivityTimelineDataResponse, ParticipantTimelineDataResponse } from '../types/activity-calendar.types';
import type { ParticipantComparisonResponse } from '../types/participant-comparison.types';
import type { BuildingPolygonData } from '../types/buildings.types';

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

  /**
   * Fetch activity timeline calendar data (aggregated dominant activity per hour per day)
   */
  async fetchActivityTimeline(params: {
    start?: string;
    end?: string;
  }): Promise<ActivityTimelineDataResponse> {
    const queryParams = new URLSearchParams(
      Object.fromEntries(
        Object.entries(params)
          .filter(([, value]) => value !== undefined)
          .map(([key, value]) => [key, String(value)])
      )
    );

    const response = await fetch(`${baseUrl}/activity-calendar/timeline-aggregated?${queryParams}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch activity timeline data: ${response.statusText}`);
    }
    return response.json();
  },

  /**
   * Fetch activity timeline calendar data for a single participant
   */
  async fetchParticipantTimeline(params: {
    participant_id: number;
    start?: string;
    end?: string;
  }): Promise<ParticipantTimelineDataResponse> {
    const queryParams = new URLSearchParams(
      Object.fromEntries(
        Object.entries(params)
          .filter(([, value]) => value !== undefined)
          .map(([key, value]) => [key, String(value)])
      )
    );

    const response = await fetch(`${baseUrl}/activity-calendar/timeline?${queryParams}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch participant timeline data: ${response.statusText}`);
    }
    return response.json();
  },

  /**
   * Fetch participant comparison data
   */
  async fetchParticipantComparison(params: {
    participant1: number;
    participant2: number;
    start?: string;
    end?: string;
  }): Promise<ParticipantComparisonResponse> {
    const queryParams = new URLSearchParams(
      Object.fromEntries(
        Object.entries(params)
          .filter(([, value]) => value !== undefined)
          .map(([key, value]) => [key, String(value)])
      )
    );

    const response = await fetch(`${baseUrl}/participant-comparison/compare?${queryParams}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch participant comparison data: ${response.statusText}`);
    }
    return response.json();
  },

  /**
   * Fetch building polygon data with type information
   */
  async fetchBuildingPolygons(): Promise<BuildingPolygonData[]> {
    const response = await fetch(`${baseUrl}/buildings/polygons`);
    if (!response.ok) {
      throw new Error(`Failed to fetch building polygons: ${response.statusText}`);
    }
    return response.json();
  },
};
