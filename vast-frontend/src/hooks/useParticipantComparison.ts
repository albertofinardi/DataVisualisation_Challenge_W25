import { useState, useCallback } from 'react';
import { api } from '@/services/api';
import type { ParticipantComparisonResponse } from '@/types/participant-comparison.types';

export function useParticipantComparison() {
  const [data, setData] = useState<ParticipantComparisonResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (params: {
    participant1: number;
    participant2: number;
    startDate?: string;
    startTime?: string;
    endDate?: string;
    endTime?: string;
  }) => {
    setLoading(true);
    setError(null);

    try {
      const start = params.startDate && params.startTime
        ? `${params.startDate}T${params.startTime}:00`
        : undefined;
      const end = params.endDate && params.endTime
        ? `${params.endDate}T${params.endTime}:00`
        : undefined;

      const result = await api.fetchParticipantComparison({
        participant1: params.participant1,
        participant2: params.participant2,
        start,
        end,
      });

      setData(result);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching participant comparison:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    data,
    loading,
    error,
    fetchData,
  };
}
