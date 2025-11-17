# Heatmap Visualization

This is a D3-based heatmap visualization for participant location data with temporal animation capabilities. The heatmap is overlaid on top of a base map image (BaseMap.png in src/assets).

## Features

- **Base Map Overlay**: Heatmap is rendered on top of the base map image
- **Temporal Heatmap**: Animated visualization showing how participant density changes over time
- **Interactive Cells**: Click on any cell to see detailed participant information
- **Playback Controls**: Play/pause, scrub through time with a timeline slider
- **Color-coded Density**: Visual representation of participant count using a gradient color scheme
- **Tooltips**: Hover over cells to see quick statistics

## Configuration

### Map Bounds (`src/config/map.config.ts`)

**IMPORTANT**: The bounds must match the coordinate system of the BaseMap.png image. The base map is located at `src/assets/BaseMap.png` and the heatmap will be overlaid on top of it.

Update the bounds in the config file to match your base map's coordinate system:

```bash
# Get bounds from the API (should match your base map extent)
curl http://localhost:3000/api/utils/bounds
```

Then update `MAP_CONFIG.bounds` in `src/config/map.config.ts`:

```typescript
bounds: {
  minLongitude: -1000,  // Left edge of base map
  maxLongitude: 1000,   // Right edge of base map
  minLatitude: 0,       // Bottom edge of base map
  maxLatitude: 6000,    // Top edge of base map
}
```

**Note**: If the heatmap doesn't align with features on the base map, adjust these bounds until the overlay matches correctly.

### Visual Settings

You can customize the visualization in `src/config/map.config.ts`:

- **Canvas Size**: `visual.width` and `visual.height`
- **Color Scheme**: `heatmap.colorScheme` (array of colors from low to high density)
- **Opacity**: `heatmap.opacity`
- **Minimum Count**: `heatmap.minCount` (filter out low-density cells)

### API Settings

Update `api.baseUrl` if your backend is running on a different port or host.

## File Structure

```
src/
├── config/
│   └── map.config.ts          # Configuration (bounds, colors, API URL)
├── types/
│   └── heatmap.types.ts       # TypeScript type definitions
├── services/
│   └── api.ts                 # API service for fetching data
├── components/
│   ├── Heatmap.tsx            # D3 heatmap visualization component
│   └── HeatmapViewer.tsx      # Main viewer with controls
└── App.tsx                     # Root component
```

## Usage

### Running the Application

1. Make sure the backend is running:
   ```bash
   cd vast-backend
   npm run dev
   ```

2. Start the frontend:
   ```bash
   cd vast-frontend
   npm run dev
   ```

3. Open your browser to `http://localhost:5173`

### Customizing the Data Query

Edit `HeatmapViewer.tsx` to change the data being fetched:

```typescript
const data = await api.fetchTemporalHeatmap({
  start: '2022-03-21T00:00:00Z',     // Change start time
  end: '2022-03-22T00:00:00Z',       // Change end time
  cell_size: 100,                     // Change grid resolution
  time_bucket_minutes: 60,            // Change time bucket size
});
```

### Cell Size Recommendations

- **Large overview**: 200-500 units
- **Standard view**: 100-200 units
- **Detailed view**: 50-100 units
- **High resolution**: 25-50 units

Smaller cell sizes create more granular heatmaps but may increase rendering time.

### Time Bucket Recommendations

- **Hourly**: 60 minutes
- **Half-hourly**: 30 minutes
- **Daily**: 1440 minutes
- **Every 15 min**: 15 minutes

## API Endpoints Used

1. **GET /api/heatmap/locations**
   - Fetches temporal heatmap data
   - Returns data grouped by time bucket

2. **GET /api/heatmap/locations/details**
   - Fetches participant IDs for a specific cell
   - Called when user clicks on a cell

3. **GET /api/utils/bounds**
   - Fetches coordinate bounds
   - Used to configure the map extent

## Interacting with the Heatmap

1. **Play/Pause**: Animate through time automatically
2. **Timeline Slider**: Scrub to any point in time
3. **Previous/Next**: Step through time frames
4. **Click Cell**: View detailed participant information
5. **Hover Cell**: See quick tooltip with count and coordinates

## Troubleshooting

### No data appears
- Check that the backend is running and accessible
- Verify the date range contains data
- Check browser console for API errors
- Ensure bounds in config match your data extent

### Heatmap looks distorted
- Update the bounds in `map.config.ts` to match your actual data
- Try adjusting the `cell_size` parameter

### Performance issues
- Increase `cell_size` to reduce number of cells
- Increase `time_bucket_minutes` to reduce number of time frames
- Filter to a shorter date range
