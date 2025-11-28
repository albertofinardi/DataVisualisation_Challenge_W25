import { useState, useCallback } from 'react';
import { api } from '../services/api';
import type { FlowDataPoint, FlowNode, FlowLink } from '../types/flow.types';

export interface FlowDataParams {
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  cellSize: number;
  minTripCount: number;
}

export interface UseFlowDataReturn {
  flows: FlowDataPoint[];
  nodes: FlowNode[];
  links: FlowLink[];
  loading: boolean;
  error: string | null;
  selectedFlow: FlowDataPoint | null;
  fetchData: (params: FlowDataParams) => Promise<void>;
  selectFlow: (flow: FlowDataPoint | null) => void;
  clearError: () => void;
}

/**
 * Custom hook for managing flow diagram data fetching and state
 */
export function useFlowData(): UseFlowDataReturn {
  const [flows, setFlows] = useState<FlowDataPoint[]>([]);
  const [nodes, setNodes] = useState<FlowNode[]>([]);
  const [links, setLinks] = useState<FlowLink[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFlow, setSelectedFlow] = useState<FlowDataPoint | null>(null);

  /**
   * Process raw flow data into nodes and links for visualization
   */
  const processFlowData = useCallback((flowData: FlowDataPoint[]) => {
    // Create a map to track unique nodes
    const nodeMap = new Map<string, FlowNode>();

    // Process each flow to extract nodes
    flowData.forEach((flow) => {
      const originId = `${flow.origin_grid_x},${flow.origin_grid_y}`;
      const destId = `${flow.destination_grid_x},${flow.destination_grid_y}`;

      // Add or update origin node
      if (!nodeMap.has(originId)) {
        nodeMap.set(originId, {
          id: originId,
          grid_x: flow.origin_grid_x,
          grid_y: flow.origin_grid_y,
          longitude: flow.origin_center_longitude,
          latitude: flow.origin_center_latitude,
          total_outbound: 0,
          total_inbound: 0,
        });
      }
      const originNode = nodeMap.get(originId)!;
      originNode.total_outbound += flow.trip_count;

      // Add or update destination node
      if (!nodeMap.has(destId)) {
        nodeMap.set(destId, {
          id: destId,
          grid_x: flow.destination_grid_x,
          grid_y: flow.destination_grid_y,
          longitude: flow.destination_center_longitude,
          latitude: flow.destination_center_latitude,
          total_outbound: 0,
          total_inbound: 0,
        });
      }
      const destNode = nodeMap.get(destId)!;
      destNode.total_inbound += flow.trip_count;
    });

    // Convert node map to array
    const processedNodes = Array.from(nodeMap.values());

    // Create links from flows
    const processedLinks: FlowLink[] = flowData.map((flow) => ({
      source: `${flow.origin_grid_x},${flow.origin_grid_y}`,
      target: `${flow.destination_grid_x},${flow.destination_grid_y}`,
      value: flow.trip_count,
      avg_duration_minutes: flow.avg_duration_minutes,
    }));

    return { nodes: processedNodes, links: processedLinks };
  }, []);

  /**
   * Fetches flow data from the API
   */
  const fetchData = useCallback(
    async (params: FlowDataParams) => {
      try {
        setLoading(true);
        setError(null);

        const response = await api.fetchFlowData({
          start: `${params.startDate}T${params.startTime}:00Z`,
          end: `${params.endDate}T${params.endTime}:00Z`,
          cell_size: params.cellSize,
          min_trip_count: params.minTripCount,
        });

        setFlows(response.flows);

        // Process the data into nodes and links
        const { nodes: processedNodes, links: processedLinks } = processFlowData(response.flows);
        setNodes(processedNodes);
        setLinks(processedLinks);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load flow data');
      } finally {
        setLoading(false);
      }
    },
    [processFlowData]
  );

  /**
   * Selects a flow to show its details
   */
  const selectFlow = useCallback((flow: FlowDataPoint | null) => {
    setSelectedFlow(flow);
  }, []);

  /**
   * Clears the error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    flows,
    nodes,
    links,
    loading,
    error,
    selectedFlow,
    fetchData,
    selectFlow,
    clearError,
  };
}
