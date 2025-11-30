import { Router, Request, Response } from 'express';
import pool from '../config/database';

const router = Router();

/**
 * Get all buildings with their polygon geometry and type
 *
 * @route GET /api/buildings/polygons
 *
 * @returns {Array<Object>} Array of building polygon data
 *
 * @example
 * // Request: GET /api/buildings/polygons
 * // Response:
 * [
 *   {
 *     "building_id": 1,
 *     "building_type": "Pub",
 *     "polygon": [[x1, y1], [x2, y2], [x3, y3], ...]
 *   },
 *   {
 *     "building_id": 2,
 *     "building_type": "Restaurant",
 *     "polygon": [[x1, y1], [x2, y2], ...]
 *   }
 * ]
 */
router.get('/polygons', async (_req: Request, res: Response) => {
  try {
    const query = `
      WITH building_types AS (
        SELECT
          b.building_id,
          b.location,
          CASE
            WHEN p.pub_id IS NOT NULL THEN 'Pub'
            WHEN r.restaurant_id IS NOT NULL THEN 'Restaurant'
            WHEN s.school_id IS NOT NULL THEN 'School'
            WHEN e.employer_id IS NOT NULL THEN 'Employer'
            WHEN a.apartment_id IS NOT NULL THEN 'Apartment'
            ELSE b.building_type
          END as building_type
        FROM buildings b
        LEFT JOIN pubs p ON b.building_id = p.building_id
        LEFT JOIN restaurants r ON b.building_id = r.building_id
        LEFT JOIN apartments a ON b.building_id = a.building_id
        LEFT JOIN employers e ON b.building_id = e.building_id
        LEFT JOIN schools s ON b.building_id = s.building_id
      ),
      polygon_points AS (
        SELECT
          bt.building_id,
          bt.building_type,
          ST_X((dp).geom) as x,
          ST_Y((dp).geom) as y,
          (dp).path[1] as point_order
        FROM building_types bt,
        LATERAL ST_DumpPoints(bt.location) as dp
      )
      SELECT
        building_id,
        building_type,
        json_agg(
          json_build_array(x, y)
          ORDER BY point_order
        ) as polygon
      FROM polygon_points
      GROUP BY building_id, building_type
      ORDER BY building_id
    `;

    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export { router };
