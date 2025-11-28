/**
 * Map configuration
 *
 * These bounds define the coordinate system for the map visualization.
 * Update these values based on your data's actual extent.
 *
 * You can get these values from the API: GET /api/utils/bounds
 *
 * IMPORTANT: The bounds should match the coordinate system of the BaseMap.png
 * image located in src/assets/. The heatmap will be overlaid on this base map,
 * so the bounds must align with the map's coordinate system.
 *
 * COLOR SCHEMES: Color palettes are now managed by the colorScale service,
 * which provides theme-aware colors that automatically adapt to light/dark modes.
 * Available schemes: 'coral', 'slate', 'mixed'
 */

import type { ColorScheme } from '../services/colorScale';

export const MAP_CONFIG = {
  // Coordinate bounds (update these to match the BaseMap.png coordinate system)
  bounds: {
    minLongitude: -4762.19066918826,
    maxLongitude: 2650,
    minLatitude: -30.08359080145072,
    maxLatitude: 7851.521932949959,
  },

  // Visual settings
  visual: {
    // Width and height of the SVG canvas
    // These dimensions match the BaseMap.png aspect ratio (1076 x 1144)
    // Adding padding for axes: 60px left/bottom, 40px top/right
    width: 1076 + 60 + 40,  // 1176
    height: 1144 + 60 + 40, // 1244

    // Padding around the map (for axes and labels)
    padding: {
      top: 40,
      right: 40,
      bottom: 60,
      left: 60,
    },
  },

  // Heatmap settings
  heatmap: {
    // Default color scheme to use
    // Options: 'coral' (warm, energetic), 'slate' (cool, professional), 'mixed' (balanced)
    defaultColorScheme: 'coral' as ColorScheme,

    // Opacity for heatmap cells
    opacity: 0.85,

    // Minimum count to display a cell (filter out noise)
    minCount: 1,

    // Number of discrete color steps in the scale
    colorSteps: 10,
  },

  image: {
    opacity: 0.5,
  },
} as const;
