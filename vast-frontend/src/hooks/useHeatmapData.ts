import { useState, useCallback } from 'react';
import { api } from '../services/api';
import type { TemporalHeatmapData, LocationDataPoint, LocationDetails } from '../types/heatmap.types';

export interface HeatmapDataParams {
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  cellSize: number;
  timeBucketMinutes: number;
  interestGroups?: string[];
}

export interface UseHeatmapDataReturn {
  heatmapData: TemporalHeatmapData;
  globalMaxCount: number;
  groupMaxCounts: Record<string, number>;
  timestamps: string[];
  loading: boolean;
  error: string | null;
  selectedCell: LocationDetails | null;
  fetchData: (params: HeatmapDataParams) => Promise<void>;
  selectCell: (cell: LocationDataPoint, timestamp: string) => void;
  clearSelectedCell: () => void;
  clearError: () => void;
  getCurrentData: (timeIndex: number) => LocationDataPoint[];
}

/**
 * Custom hook for managing heatmap data fetching and state
 */
export function useHeatmapData(): UseHeatmapDataReturn {
  const [heatmapData, setHeatmapData] = useState<TemporalHeatmapData>({});
  const [globalMaxCount, setGlobalMaxCount] = useState<number>(1);
  const [groupMaxCounts, setGroupMaxCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCell, setSelectedCell] = useState<LocationDetails | null>(null);

  // Derive timestamps from heatmap data
  const timestamps = Object.keys(heatmapData || {}).sort();

  /**
   * Fetches temporal heatmap data from the API
   */
  const fetchData = useCallback(async (params: HeatmapDataParams) => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.fetchTemporalHeatmap({
        start: `${params.startDate}T${params.startTime}:00Z`,
        end: `${params.endDate}T${params.endTime}:00Z`,
        cell_size: params.cellSize,
        time_bucket_minutes: params.timeBucketMinutes,
        interest_groups: params.interestGroups,
      });

      setHeatmapData(response.data);
      setGlobalMaxCount(response.globalMaxCount);
      setGroupMaxCounts(response.groupMaxCounts || {});
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Selects a cell to show its details
   */
  const selectCell = useCallback(
    (cell: LocationDataPoint, timestamp: string) => {
      setSelectedCell({
        ...cell,
        time_bucket: timestamp,
        participant_count: 0,
        participants: [],
      });
    },
    []
  );

  /**
   * Clears the selected cell
   */
  const clearSelectedCell = useCallback(() => {
    setSelectedCell(null);
  }, []);

  /**
   * Clears the error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Gets the data for a specific time index
   */
  const getCurrentData = useCallback(
    (timeIndex: number): LocationDataPoint[] => {
      const timestamp = timestamps[timeIndex];
      return timestamp ? heatmapData[timestamp] : [];
    },
    [heatmapData, timestamps]
  );

  return {
    heatmapData,
    globalMaxCount,
    groupMaxCounts,
    timestamps,
    loading,
    error,
    selectedCell,
    fetchData,
    selectCell,
    clearSelectedCell,
    clearError,
    getCurrentData,
  };
}
