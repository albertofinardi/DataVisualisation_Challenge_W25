import { useState, useCallback } from 'react';
import { api } from '../services/api';
import type { TemporalStreamgraphData, ActivityDetails } from '../types/streamgraph.types';

export interface StreamgraphDataParams {
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  timeBucketMinutes: number;
}

export interface UseStreamgraphDataReturn {
  streamgraphData: TemporalStreamgraphData;
  timestamps: string[];
  activities: string[];
  loading: boolean;
  error: string | null;
  selectedActivity: ActivityDetails | null;
  fetchData: (params: StreamgraphDataParams) => Promise<void>;
  selectActivity: (activity: string, timestamp: string, count: number) => void;
  clearSelectedActivity: () => void;
  clearError: () => void;
}

/**
 * Custom hook for managing streamgraph data fetching and state
 */
export function useStreamgraphData(): UseStreamgraphDataReturn {
  const [streamgraphData, setStreamgraphData] = useState<TemporalStreamgraphData>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedActivity, setSelectedActivity] = useState<ActivityDetails | null>(null);

  // Derive timestamps from streamgraph data
  const timestamps = Object.keys(streamgraphData || {}).sort();

  // Derive unique activities from all timestamps
  const activities = Array.from(
    new Set(
      Object.values(streamgraphData || {}).flatMap((timeData) => Object.keys(timeData))
    )
  ).sort();

  /**
   * Fetches temporal streamgraph data from the API
   */
  const fetchData = useCallback(async (params: StreamgraphDataParams) => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.fetchStreamgraphActivities({
        start: `${params.startDate}T${params.startTime}:00Z`,
        end: `${params.endDate}T${params.endTime}:00Z`,
        time_bucket_minutes: params.timeBucketMinutes,
      });

      setStreamgraphData(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Selects an activity to show its details
   */
  const selectActivity = useCallback(
    (activity: string, timestamp: string, count: number) => {
      setSelectedActivity({
        activity,
        time_bucket: timestamp,
        participant_count: count,
      });
    },
    []
  );

  /**
   * Clears the selected activity
   */
  const clearSelectedActivity = useCallback(() => {
    setSelectedActivity(null);
  }, []);

  /**
   * Clears the error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    streamgraphData,
    timestamps,
    activities,
    loading,
    error,
    selectedActivity,
    fetchData,
    selectActivity,
    clearSelectedActivity,
    clearError,
  };
}
