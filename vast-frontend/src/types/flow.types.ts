/**
 * Type definitions for flow diagram data (Origin-Destination flows)
 */

export interface FlowDataPoint {
  origin_grid_x: number;
  origin_grid_y: number;
  destination_grid_x: number;
  destination_grid_y: number;
  trip_count: number;
  avg_duration_minutes: number | null;
  origin_center_longitude: number;
  origin_center_latitude: number;
  destination_center_longitude: number;
  destination_center_latitude: number;
}

export interface FlowDiagramData {
  flows: FlowDataPoint[];
}

export interface FlowNode {
  id: string;
  grid_x: number;
  grid_y: number;
  longitude: number;
  latitude: number;
  total_outbound: number;
  total_inbound: number;
}

export interface FlowLink {
  source: string;
  target: string;
  value: number;
  avg_duration_minutes: number | null;
}
