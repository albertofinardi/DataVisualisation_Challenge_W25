/**
 * Type definitions for activity timeline calendar data
 */

// Aggregated data (all participants)
export interface ActivityTimelineData {
  [date: string]: {
    [hour: string]: {
      activity: string;
      count: number;
    };
  };
}

// Single participant data (per participant)
export interface ParticipantTimelineData {
  [date: string]: {
    [hour: string]: {
      [participantId: string]: {
        activity: string;
        count: number;
      };
    };
  };
}

export interface ActivityTimelineDataResponse {
  data: ActivityTimelineData;
}

export interface ParticipantTimelineDataResponse {
  data: ParticipantTimelineData;
}

export interface CalendarCell {
  date: string;
  hour: number;
  activity: string;
  count: number;
}

export interface DayData {
  date: string;
  hours: Map<number, { activity: string; count: number }>;
}
