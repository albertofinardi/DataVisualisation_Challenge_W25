export interface ParticipantInfo {
  participant_id: number;
  household_size: number;
  have_kids: boolean;
  age: number;
  education_level: string;
  interest_group: string;
  joviality: number;
}

export interface ActivityDistribution {
  [mode: string]: number;
}

export interface TimelinePoint {
  timestamp: string;
  x: number;
  y: number;
  mode: string;
}

export interface ParticipantData {
  info: ParticipantInfo;
  activityDistribution: ActivityDistribution;
  timeline: TimelinePoint[];
}

export interface ParticipantComparisonResponse {
  participants: {
    [participantId: string]: ParticipantData;
  };
  timeRange: {
    start: string | null;
    end: string | null;
  };
}
