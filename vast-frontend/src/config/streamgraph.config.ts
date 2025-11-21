/**
 * Streamgraph configuration
 */

import { ACTIVITY_CONFIG } from "./activities.config";

export const STREAMGRAPH_CONFIG = {
  // Color scheme for activities
  colors: ACTIVITY_CONFIG.colors,

  // Visualization settings
  visual: {
    defaultWidth: 900,
    defaultHeight: 500,
    pieChartWidth: 350,
    pieChartHeight: 500,
    pieChartRadius: 120,

    // Margins
    margin: {
      top: 40,
      right: 0,
      bottom: 60,
      left: 60,
    },

    // Opacity settings
    streamOpacity: 0.7,
    streamHoverOpacity: 1.0,
    pieSliceOpacity: 0.8,
    pieSliceHoverOpacity: 1.0,
    verticalLineOpacity: 1.0,

    // Colors
    verticalLineColor: '#ff0000',
    verticalLineWidth: 2,

    // Tooltip
    tooltip: {
      backgroundColor: 'rgba(0, 0, 0, 0.9)',
      textColor: 'white',
      padding: '12px 16px',
      borderRadius: '6px',
      fontSize: '13px',
      maxWidth: '300px',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)',
    },

    // Pie chart container
    pieContainer: {
      borderColor: 'rgba(128, 128, 128, 0.2)',
      borderRadius: '8px',
      backgroundColor: 'rgba(248, 248, 248, 0.5)',
    },
  },

  // Default time bucket in minutes
  defaultTimeBucket: 60,

  // Default date range
  defaultDateRange: {
    startDate: '2022-03-21',
    startTime: '03:00',
    endDate: '2022-03-22',
    endTime: '03:00',
  },
};

// Helper function to get color for an activity
export function getActivityColor(activity: string): string {
  return STREAMGRAPH_CONFIG.colors[activity as keyof typeof STREAMGRAPH_CONFIG.colors] || '#999999';
}

// Helper function to get all activity colors as an array (for d3 color scale)
export function getActivityColors(): string[] {
  return Object.values(STREAMGRAPH_CONFIG.colors);
}

// Helper function to get all activities
export function getActivities(): string[] {
  return Object.keys(STREAMGRAPH_CONFIG.colors);
}
