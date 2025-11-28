/**
 * Flow diagram configuration
 */

export const FLOW_CONFIG = {
  // Visualization settings
  visual: {
    defaultWidth: 1200,
    defaultHeight: 800,

    // Margins
    margin: {
      top: 40,
      right: 40,
      bottom: 40,
      left: 40,
    },

    // Node settings
    node: {
      minRadius: 5,
      maxRadius: 30,
      opacity: 0.7,
      hoverOpacity: 1.0,
      strokeWidth: 2,
      strokeColor: '#fff',
      fillColor: '#4e79a7',
      labelFontSize: 11,
      labelColor: '#333',
    },

    // Link/Flow settings
    link: {
      minWidth: 1,
      maxWidth: 15,
      opacity: 0.3,
      hoverOpacity: 0.7,
      color: '#999',
      curveOffset: 0.3, // For curved links
    },

    // Arrow settings
    arrow: {
      size: 6,
      opacity: 0.6,
    },

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
  },

  // Default cell size for grid aggregation
  defaultCellSize: 50,

  // Minimum trip count to display a flow
  minTripCount: 10,

  // Default date range
  defaultDateRange: {
    startDate: '2022-03-21',
    startTime: '07:00',
    endDate: '2022-03-21',
    endTime: '19:00',
  },
};
