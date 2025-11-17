import { Router, Request, Response } from 'express';
import pool from '../config/database';

const router = Router();

/**
 * Get heatmap data for checkin activity by location
 *
 * @route GET /api/heatmap/checkins
 *
 * @queryparam {string} [start] - Optional start timestamp filter (ISO 8601 format, e.g., '2022-03-01' or '2022-03-01T00:00:00Z')
 * @queryparam {string} [end] - Optional end timestamp filter (ISO 8601 format, e.g., '2022-03-31' or '2022-03-31T23:59:59Z')
 * @queryparam {string} [venue_type] - Optional venue type filter. Valid values: 'Pub' or 'Restaurant'
 *
 * @returns {Array<Object>} Array of venue checkin heatmap data points, sorted by checkin count (descending)
 *
 * @example
 * // Request: GET /api/heatmap/checkins
 * // Response:
 * [
 *   {
 *     "venue_id": 1344,
 *     "venue_type": "Pub",
 *     "checkin_count": "54174",
 *     "longitude": -162.84407093388845,
 *     "latitude": 3927.436359050686
 *   },
 *   {
 *     "venue_id": 1342,
 *     "venue_type": "Pub",
 *     "checkin_count": "50400",
 *     "longitude": -271.3042071873528,
 *     "latitude": 4984.710389294818
 *   }
 * ]
 *
 * @example
 * // Filter by date range: GET /api/heatmap/checkins?start=2022-03-01&end=2022-03-31
 *
 * @example
 * // Filter by venue type: GET /api/heatmap/checkins?venue_type=Pub
 *
 * @example
 * // Combined filters: GET /api/heatmap/checkins?start=2022-03-01&end=2022-03-31&venue_type=Restaurant
 *
 * @description
 * This endpoint aggregates checkin data from the checkin_journal table and joins it with venue location data
 * (pubs and restaurants). For each venue, it returns:
 * - venue_id: The unique identifier of the venue (pub_id or restaurant_id)
 * - venue_type: Type of venue ('Pub' or 'Restaurant')
 * - checkin_count: Total number of checkins at this venue (as string)
 * - longitude: X coordinate of the building centroid (PostGIS ST_X)
 * - latitude: Y coordinate of the building centroid (PostGIS ST_Y)
 *
 * The query uses PostGIS spatial functions to extract coordinates from building polygons.
 * Results are ordered by checkin count in descending order (most popular venues first).
 *
 * @note The checkin_count is returned as a string due to PostgreSQL's bigint type.
 *       Convert to number in the frontend if needed: parseInt(checkin_count)
 */
router.get('/checkins', async (req: Request, res: Response) => {
  try {
    const { start, end, venue_type } = req.query;

    let query = `
      WITH venue_locations AS (
        -- Get pub locations
        SELECT
          p.pub_id as venue_id,
          'Pub' as venue_type,
          ST_Centroid(b.location) as location
        FROM pubs p
        JOIN buildings b ON p.building_id = b.building_id

        UNION ALL

        -- Get restaurant locations
        SELECT
          r.restaurant_id as venue_id,
          'Restaurant' as venue_type,
          ST_Centroid(b.location) as location
        FROM restaurants r
        JOIN buildings b ON r.building_id = b.building_id
      ),
      checkin_counts AS (
        SELECT
          c.venue_id,
          c.venue_type,
          COUNT(*) as checkin_count
        FROM checkin_journal c
        WHERE 1=1
    `;

    const params: any[] = [];

    if (start) {
      params.push(start);
      query += ` AND c.timestamp >= $${params.length}`;
    }

    if (end) {
      params.push(end);
      query += ` AND c.timestamp <= $${params.length}`;
    }

    if (venue_type) {
      params.push(venue_type);
      query += ` AND c.venue_type = $${params.length}`;
    }

    query += `
        GROUP BY c.venue_id, c.venue_type
      )
      SELECT
        vl.venue_id,
        vl.venue_type,
        cc.checkin_count,
        ST_X(vl.location) as longitude,
        ST_Y(vl.location) as latitude
      FROM checkin_counts cc
      JOIN venue_locations vl ON cc.venue_id = vl.venue_id AND cc.venue_type = vl.venue_type
      ORDER BY cc.checkin_count DESC
    `;

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get spatial-temporal heatmap data from participant location logs
 *
 * @route GET /api/heatmap/locations
 *
 * @queryparam {string} [start] - Optional start timestamp (ISO 8601, e.g., '2022-03-01T00:00:00Z')
 * @queryparam {string} [end] - Optional end timestamp (ISO 8601, e.g., '2022-03-01T23:59:59Z')
 * @queryparam {number} [cell_size=100] - Grid cell size in map units (default: 100)
 * @queryparam {number} [time_bucket_minutes=60] - Time bucket size in minutes for temporal aggregation (default: 60)
 * @queryparam {boolean} [include_temporal=true] - Include time buckets in response (default: true)
 *
 * @returns {Object} Object with time buckets as keys, each containing an array of location data
 *
 * @example
 * // Temporal heatmap (default)
 * // GET /api/heatmap/locations?start=2022-03-01&time_bucket_minutes=60
 * {
 *   "2022-03-01T05:00:00.000Z": [
 *     {
 *       "grid_x": -200,
 *       "grid_y": 4000,
 *       "count": "342",
 *       "center_longitude": -175.5,
 *       "center_latitude": 4025.0
 *     }
 *   ],
 *   "2022-03-01T06:00:00.000Z": [
 *     {
 *       "grid_x": -200,
 *       "grid_y": 4000,
 *       "count": "458",
 *       "center_longitude": -175.5,
 *       "center_latitude": 4025.0
 *     }
 *   ]
 * }
 *
 * @example
 * // Simple spatial heatmap (no time buckets)
 * // GET /api/heatmap/locations?start=2022-03-01&end=2022-03-02&cell_size=50&include_temporal=false
 * {
 *   "all": [
 *     {
 *       "grid_x": -200,
 *       "grid_y": 4000,
 *       "count": "1523",
 *       "center_longitude": -175.5,
 *       "center_latitude": 4025.0
 *     }
 *   ]
 * }
 *
 * @description
 * This endpoint creates a spatial (and optionally temporal) heatmap by:
 * 1. Discretizing space into a grid based on cell_size
 * 2. Discretizing time into buckets (by default)
 * 3. Counting participant locations in each grid cell (and time bucket)
 *
 * ## Spatial Discretization
 * - Uses floor((coordinate / cell_size)) * cell_size to create grid cells
 * - Smaller cell_size = higher resolution, more cells, more data
 * - Recommended: 50-200 depending on your map zoom level
 *
 * ## Temporal Discretization (default behavior)
 * - Groups data into time buckets (e.g., hourly, every 30 min)
 * - Perfect for animating activity over time
 * - Response format: { "timestamp": [locations], "timestamp": [locations] }
 *
 * ## Use Cases
 * - **Static heatmap**: Set include_temporal=false, returns { "all": [locations] }
 * - **Animated heatmap**: Default behavior, returns { "time": [locations] } for each bucket
 * - **Peak analysis**: Use time_bucket_minutes to find busy hours
 *
 * @note
 * - Count is returned as string (PostgreSQL bigint)
 * - Grid coordinates (grid_x, grid_y) are the lower-left corner of each cell
 * - Center coordinates are the geometric center of each cell
 */
router.get('/locations', async (req: Request, res: Response) => {
  try {
    const {
      start,
      end,
      cell_size = 100,
      time_bucket_minutes = 60,
      include_temporal = 'true'
    } = req.query;

    console.log('Heatmap /locations params:', req.query);

    const cellSize = Number(cell_size);
    const timeBucket = Number(time_bucket_minutes);
    const includeTemporal = include_temporal === 'true';

    let query = `
      WITH location_data AS (
        SELECT
          participant_id,
          timestamp,
          ST_X(current_location) as longitude,
          ST_Y(current_location) as latitude
        FROM participant_status_logs
        WHERE current_location IS NOT NULL
    `;

    const params: any[] = [];

    if (start) {
      params.push(start);
      query += ` AND timestamp >= $${params.length}`;
    }

    if (end) {
      params.push(end);
      query += ` AND timestamp <= $${params.length}`;
    }

    query += `
      ),
      grid_data AS (
        SELECT
          participant_id,
    `;


    // Add time bucket column if requested
    if (includeTemporal) {
      query += `
          date_trunc('hour', timestamp) +
          INTERVAL '${timeBucket} minutes' * FLOOR(EXTRACT(EPOCH FROM timestamp - date_trunc('hour', timestamp)) / 60 / ${timeBucket}) as time_bucket,
      `;
    }

    query += `
          FLOOR(longitude / ${cellSize}) * ${cellSize} as grid_x,
          FLOOR(latitude / ${cellSize}) * ${cellSize} as grid_y
        FROM location_data
      ),
      agg_data AS (
        SELECT
          ${includeTemporal ? 'time_bucket,' : ''}
          grid_x,
          grid_y,
          COUNT(DISTINCT participant_id) as count,
          grid_x + ${cellSize / 2} as center_longitude,
          grid_y + ${cellSize / 2} as center_latitude
        FROM grid_data
        GROUP BY
          ${includeTemporal ? 'time_bucket,' : ''} grid_x, grid_y
      ),
      global_max AS (
        SELECT MAX(count) as global_max_count FROM agg_data
      )
      SELECT agg_data.*, global_max.global_max_count
      FROM agg_data CROSS JOIN global_max
      ORDER BY ${includeTemporal ? 'time_bucket, count DESC' : 'count DESC'}
    `;
    const result = await pool.query(query, params);

    // Extract globalMaxCount from the first row (all rows have it)
    let globalMaxCount = 1;
    if (result.rows.length > 0 && result.rows[0].global_max_count) {
      globalMaxCount = parseInt(result.rows[0].global_max_count);
    }
      if (result.rows.length > 0 && result.rows[0].global_max_count !== null && result.rows[0].global_max_count !== undefined) {
        globalMaxCount = parseInt(result.rows[0].global_max_count);
      }

    // Transform the response to group by time bucket
    if (includeTemporal) {
      const groupedData: { [key: string]: any[] } = {};

      result.rows.forEach((row: any) => {
        const { time_bucket, global_max_count, ...locationData } = row;
        const timeKey = time_bucket.toISOString();

        if (!groupedData[timeKey]) {
          groupedData[timeKey] = [];
        }

        groupedData[timeKey].push(locationData);
      });

      return res.json({ data: groupedData, globalMaxCount });
    } else {
      // For non-temporal queries, wrap in an "all" key
      const allRows = result.rows.map(({ global_max_count, ...row }) => row);
      return res.json({ all: allRows, globalMaxCount });
    }
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

/**
 * Get detailed participant information for a specific grid cell and time bucket
 *
 * @route GET /api/heatmap/locations/details
 *
 * @queryparam {number} grid_x - The grid cell X coordinate (required)
 * @queryparam {number} grid_y - The grid cell Y coordinate (required)
 * @queryparam {string} [time_bucket] - The time bucket timestamp (ISO 8601, required for temporal queries)
 * @queryparam {number} [cell_size=100] - Grid cell size in map units (must match the heatmap query)
 * @queryparam {number} [time_bucket_minutes=60] - Time bucket size in minutes (must match the heatmap query)
 *
 * @returns {Object} Detailed information about participants in the grid cell
 *
 * @example
 * // Get participants in a specific grid cell at a specific time
 * // GET /api/heatmap/locations/details?grid_x=-200&grid_y=4000&time_bucket=2022-03-01T05:00:00.000Z&cell_size=100
 * {
 *   "grid_x": -200,
 *   "grid_y": 4000,
 *   "time_bucket": "2022-03-01T05:00:00.000Z",
 *   "participant_count": 5,
 *   "participants": [12, 45, 78, 123, 456]
 * }
 *
 * @example
 * // Get participants in a specific grid cell (no time filter)
 * // GET /api/heatmap/locations/details?grid_x=-200&grid_y=4000&cell_size=100
 * {
 *   "grid_x": -200,
 *   "grid_y": 4000,
 *   "participant_count": 23,
 *   "participants": [12, 45, 78, 123, 456, ...]
 * }
 *
 * @description
 * This endpoint provides detailed participant information for a specific grid cell,
 * useful for showing details when a user clicks on a heatmap cell.
 *
 * Returns:
 * - grid_x, grid_y: The grid coordinates
 * - time_bucket: The time bucket (if provided)
 * - participant_count: Number of unique participants
 * - participants: Array of participant IDs
 */
router.get('/locations/details', async (req: Request, res: Response) => {
  try {
    const {
      grid_x,
      grid_y,
      time_bucket,
      cell_size = 100,
      time_bucket_minutes = 60
    } = req.query;

    if (!grid_x || !grid_y) {
      return res.status(400).json({ error: 'grid_x and grid_y are required' });
    }

    const cellSize = Number(cell_size);
    const gridX = Number(grid_x);
    const gridY = Number(grid_y);
    const timeBucket = Number(time_bucket_minutes);

    let query = `
      WITH location_data AS (
        SELECT
          participant_id,
          timestamp,
          ST_X(current_location) as longitude,
          ST_Y(current_location) as latitude
        FROM participant_status_logs
        WHERE current_location IS NOT NULL
      ),
      grid_data AS (
        SELECT
          participant_id,
          FLOOR(longitude / ${cellSize}) * ${cellSize} as grid_x,
          FLOOR(latitude / ${cellSize}) * ${cellSize} as grid_y
    `;

    if (time_bucket) {
      query += `,
          date_trunc('hour', timestamp) +
          INTERVAL '${timeBucket} minutes' * FLOOR(EXTRACT(EPOCH FROM timestamp - date_trunc('hour', timestamp)) / 60 / ${timeBucket}) as time_bucket
      `;
    }

    query += `
        FROM location_data
      )
      SELECT
        ARRAY_AGG(DISTINCT participant_id ORDER BY participant_id) as participants,
        COUNT(DISTINCT participant_id) as participant_count
      FROM grid_data
      WHERE grid_x = $1 AND grid_y = $2
    `;

    const params: any[] = [gridX, gridY];

    if (time_bucket) {
      params.push(time_bucket);
      query += ` AND time_bucket = $${params.length}`;
    }

    const result = await pool.query(query, params);

    if (result.rows.length === 0 || !result.rows[0].participants) {
      return res.json({
        grid_x: gridX,
        grid_y: gridY,
        time_bucket: time_bucket || null,
        participant_count: 0,
        participants: []
      });
    }

    return res.json({
      grid_x: gridX,
      grid_y: gridY,
      time_bucket: time_bucket || null,
      participant_count: parseInt(result.rows[0].participant_count),
      participants: result.rows[0].participants
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

export { router };
