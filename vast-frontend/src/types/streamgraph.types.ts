/**
 * Type definitions for streamgraph data
 */

export interface ActivityDataPoint {
  activity: string;
  participant_count: number;
}

export interface TemporalStreamgraphData {
  [timestamp: string]: {
    [activity: string]: number;
  };
}

export interface StreamgraphDataResponse {
  data: TemporalStreamgraphData;
}

export interface ActivityDetails {
  activity: string;
  participant_count: number;
  time_bucket: string;
}
