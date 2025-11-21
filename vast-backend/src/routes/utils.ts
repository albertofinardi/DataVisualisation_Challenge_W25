import { Router, Request, Response } from 'express';
import pool from '../config/database';

const router = Router();

/**
 * Get bounding box coordinates for the map
 *
 * @route GET /api/utils/bounds
 *
 * @queryparam {string} [start] - Optional start timestamp filter (ISO 8601)
 * @queryparam {string} [end] - Optional end timestamp filter (ISO 8601)
 *
 * @returns {Object} Bounding box with min/max coordinates
 *
 * @example
 * // GET /api/utils/bounds
 * {
 *   "min_longitude": -500.5,
 *   "max_longitude": 800.3,
 *   "min_latitude": 3500.2,
 *   "max_latitude": 5200.8,
 *   "center_longitude": 149.9,
 *   "center_latitude": 4350.5,
 *   "width": 1300.8,
 *   "height": 1700.6
 * }
 *
 * @description
 * Returns the bounding box combining both building locations and participant location data.
 * This ensures the bounds cover all map features, not just areas visited by participants.
 * Useful for setting initial map view and zoom levels.
 *
 * Optionally filter by time range to get bounds for specific periods (affects participant data only).
 *
 * Returns:
 * - min_longitude, max_longitude: X coordinate range (top-left X, bottom-right X)
 * - min_latitude, max_latitude: Y coordinate range (top-left Y, bottom-right Y)
 * - center_longitude, center_latitude: Center point of the bounds
 * - width, height: Dimensions of the bounding box
 */
router.get('/bounds', async (req: Request, res: Response) => {
  try {
    const { start, end } = req.query;

    // Query to get bounds from both buildings and participant logs
    // Using UNION to combine building polygons and participant point locations
    let query = `
      WITH all_locations AS (
        -- Get all vertices from building polygons
        SELECT
          ST_X((ST_DumpPoints(location)).geom) as x,
          ST_Y((ST_DumpPoints(location)).geom) as y
        FROM buildings
        WHERE location IS NOT NULL

        UNION ALL

        -- Get participant locations (optionally filtered by time)
        SELECT
          ST_X(current_location) as x,
          ST_Y(current_location) as y
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
      )
      SELECT
        MIN(x) as min_longitude,
        MAX(x) as max_longitude,
        MIN(y) as min_latitude,
        MAX(y) as max_latitude,
        AVG(x) as center_longitude,
        AVG(y) as center_latitude
      FROM all_locations
    `;

    const result = await pool.query(query, params);

    if (result.rows.length === 0 || !result.rows[0].min_longitude) {
      return res.json({
        min_longitude: 0,
        max_longitude: 0,
        min_latitude: 0,
        max_latitude: 0,
        center_longitude: 0,
        center_latitude: 0,
        width: 0,
        height: 0
      });
    }

    const bounds = result.rows[0];
    const width = bounds.max_longitude - bounds.min_longitude;
    const height = bounds.max_latitude - bounds.min_latitude;

    return res.json({
      min_longitude: parseFloat(bounds.min_longitude),
      max_longitude: parseFloat(bounds.max_longitude),
      min_latitude: parseFloat(bounds.min_latitude),
      max_latitude: parseFloat(bounds.max_latitude),
      center_longitude: parseFloat(bounds.center_longitude),
      center_latitude: parseFloat(bounds.center_latitude),
      width: width,
      height: height
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

/**
 * Get all unique participant IDs
 *
 * @route GET /api/utils/participants
 *
 * @returns {Object} Array of all unique participant IDs
 *
 * @example
 * // GET /api/utils/participants
 * {
 *   "participant_ids": [1, 2, 3, 4, ...]
 * }
 *
 * @description
 * Returns all unique participant IDs from the participants table.
 * This list is static and can be hardcoded in the frontend to avoid unnecessary queries.
 */
router.get('/participants', async (_req: Request, res: Response) => {
  try {
    const query = `
      SELECT participant_id
      FROM participants
      ORDER BY participant_id ASC
    `;

    const result = await pool.query(query);

    const participantIds = result.rows.map((row: any) => parseInt(row.participant_id));

    return res.json({
      participant_ids: participantIds
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

export { router };
