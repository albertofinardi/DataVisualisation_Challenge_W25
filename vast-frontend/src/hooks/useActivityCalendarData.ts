import { useState, useCallback } from 'react';
import { api } from '../services/api';
import type { ActivityTimelineData, ParticipantTimelineData } from '../types/activity-calendar.types';

export interface ActivityCalendarDataParams {
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  participantId?: number; // Optional participant ID for single participant view
}

export interface UseActivityCalendarDataReturn {
  calendarData: ActivityTimelineData;
  loading: boolean;
  error: string | null;
  fetchData: (params: ActivityCalendarDataParams) => Promise<void>;
  clearError: () => void;
}

/**
 * Custom hook for managing activity calendar data fetching and state
 */
export function useActivityCalendarData(): UseActivityCalendarDataReturn {
  const [calendarData, setCalendarData] = useState<ActivityTimelineData>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetches activity timeline calendar data from the API
   */
  const fetchData = useCallback(async (params: ActivityCalendarDataParams) => {
    try {
      setLoading(true);
      setError(null);

      const timeParams = {
        start: `${params.startDate}T${params.startTime}:00Z`,
        end: `${params.endDate}T${params.endTime}:00Z`,
      };

      if (params.participantId) {
        // Fetch single participant data
        const response = await api.fetchParticipantTimeline({
          participant_id: params.participantId,
          ...timeParams,
        });

        // Transform per-participant data to match ActivityTimelineData format
        const transformedData: ActivityTimelineData = {};
        Object.entries(response.data).forEach(([date, hours]) => {
          transformedData[date] = {};
          Object.entries(hours).forEach(([hour, participants]) => {
            // Get the activity for the selected participant
            const participantKey = String(params.participantId);
            if (participants[participantKey]) {
              transformedData[date][hour] = participants[participantKey];
            }
          });
        });

        setCalendarData(transformedData);
      } else {
        // Fetch aggregated data (all participants)
        const response = await api.fetchActivityTimeline(timeParams);
        setCalendarData(response.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Clears the error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    calendarData,
    loading,
    error,
    fetchData,
    clearError,
  };
}
