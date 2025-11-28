import { Router, Request, Response } from 'express';
import pool from '../config/database';

const router = Router();

/**
 * Get origin-destination flow data for travel patterns
 *
 * @route GET /api/flow/od-flows
 *
 * @queryparam {string} [start] - Optional start timestamp filter (ISO 8601 format, e.g., '2022-03-21T07:00:00Z')
 * @queryparam {string} [end] - Optional end timestamp filter (ISO 8601 format, e.g., '2022-03-21T19:00:00Z')
 * @queryparam {number} [cell_size=50] - Grid cell size for spatial aggregation (default: 50 units)
 * @queryparam {number} [min_trip_count=10] - Minimum number of trips to include a flow (default: 10)
 *
 * @returns {Object} Object containing array of flow data points
 *
 * @example
 * // Request: GET /api/flow/od-flows?start=2022-03-21T07:00:00Z&end=2022-03-21T19:00:00Z&cell_size=50&min_trip_count=10
 * // Response:
 * {
 *   "flows": [
 *     {
 *       "origin_grid_x": 10,
 *       "origin_grid_y": 20,
 *       "destination_grid_x": 15,
 *       "destination_grid_y": 25,
 *       "trip_count": 234,
 *       "avg_duration_minutes": 12.5,
 *       "origin_center_longitude": -500.0,
 *       "origin_center_latitude": 1000.0,
 *       "destination_center_longitude": -250.0,
 *       "destination_center_latitude": 1250.0
 *     }
 *   ]
 * }
 *
 * @description
 * This endpoint analyzes travel patterns by aggregating trips from the travel_journal table.
 * It groups trips by origin and destination grid cells to identify major flow corridors.
 *
 * The query:
 * 1. JOINs travel_journal with buildings table to get GEOMETRY coordinates from location IDs
 * 2. Uses ST_Centroid() to get center points of building polygons
 * 3. Converts locations to grid coordinates using FLOOR(coordinate / cell_size)
 * 4. Aggregates trips between each origin-destination pair
 * 5. Calculates average trip duration from travel_start_time and travel_end_time
 * 6. Calculates center coordinates for each grid cell
 * 7. Filters out flows with fewer trips than min_trip_count
 *
 * This is essential for traffic analysis and identifying bottlenecks.
 */
router.get('/od-flows', async (req: Request, res: Response) => {
  try {
    const {
      start,
      end,
      cell_size = 50,
      min_trip_count = 10,
    } = req.query;

    // Convert query params to proper types
    const cellSize = typeof cell_size === 'string' ? parseFloat(cell_size) : cell_size;
    const minTripCount = typeof min_trip_count === 'string' ? parseInt(min_trip_count) : min_trip_count;

    const params: any[] = [cellSize, minTripCount];

    let query = `
      WITH travel_data AS (
        SELECT
          tj.participant_id,
          ST_Centroid(b_start.location) as start_location,
          ST_Centroid(b_end.location) as end_location,
          tj.travel_start_time,
          tj.travel_end_time,
          EXTRACT(EPOCH FROM (tj.travel_end_time - tj.travel_start_time)) / 60 as duration_minutes
        FROM travel_journal tj
        LEFT JOIN buildings b_start ON tj.travel_start_location_id = b_start.building_id
        LEFT JOIN buildings b_end ON tj.travel_end_location_id = b_end.building_id
        WHERE b_start.location IS NOT NULL
          AND b_end.location IS NOT NULL
    `;

    // Add time filters
    if (start) {
      params.push(start);
      query += ` AND tj.travel_start_time >= $${params.length}`;
    }

    if (end) {
      params.push(end);
      query += ` AND tj.travel_start_time <= $${params.length}`;
    }

    query += `
      ),
      gridded_flows AS (
        SELECT
          -- Origin grid coordinates
          FLOOR(ST_X(start_location) / $1)::int as origin_grid_x,
          FLOOR(ST_Y(start_location) / $1)::int as origin_grid_y,

          -- Destination grid coordinates
          FLOOR(ST_X(end_location) / $1)::int as destination_grid_x,
          FLOOR(ST_Y(end_location) / $1)::int as destination_grid_y,

          -- Trip metrics
          duration_minutes,

          -- Original coordinates for averaging
          ST_X(start_location) as origin_lon,
          ST_Y(start_location) as origin_lat,
          ST_X(end_location) as dest_lon,
          ST_Y(end_location) as dest_lat
        FROM travel_data
      )
      SELECT
        origin_grid_x,
        origin_grid_y,
        destination_grid_x,
        destination_grid_y,
        COUNT(*) as trip_count,
        AVG(duration_minutes) as avg_duration_minutes,

        -- Calculate center coordinates for each grid cell
        AVG(origin_lon) as origin_center_longitude,
        AVG(origin_lat) as origin_center_latitude,
        AVG(dest_lon) as destination_center_longitude,
        AVG(dest_lat) as destination_center_latitude
      FROM gridded_flows
      WHERE origin_grid_x != destination_grid_x
         OR origin_grid_y != destination_grid_y  -- Exclude trips that stay in same cell
      GROUP BY origin_grid_x, origin_grid_y, destination_grid_x, destination_grid_y
      HAVING COUNT(*) >= $2  -- Minimum trip count filter
      ORDER BY trip_count DESC
    `;

    const result = await pool.query(query, params);

    // Convert trip_count from string to number
    const flows = result.rows.map(row => ({
      origin_grid_x: row.origin_grid_x,
      origin_grid_y: row.origin_grid_y,
      destination_grid_x: row.destination_grid_x,
      destination_grid_y: row.destination_grid_y,
      trip_count: parseInt(row.trip_count),
      avg_duration_minutes: row.avg_duration_minutes ? parseFloat(row.avg_duration_minutes) : null,
      origin_center_longitude: parseFloat(row.origin_center_longitude),
      origin_center_latitude: parseFloat(row.origin_center_latitude),
      destination_center_longitude: parseFloat(row.destination_center_longitude),
      destination_center_latitude: parseFloat(row.destination_center_latitude),
    }));

    res.json({ flows });
  } catch (error) {
    console.error('Error fetching flow data:', error);
    res.status(500).json({
      error: 'Failed to fetch flow data',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export { router };
