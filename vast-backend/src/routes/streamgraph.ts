import { Router, Request, Response } from 'express';
import pool from '../config/database';

const router = Router();

// Get participant activities aggregated by time bucket for streamgraph
router.get('/activities', async (req: Request, res: Response) => {
  try {
    const {
      start,
      end,
      time_bucket_minutes = 60,
      interest_groups
    } = req.query;

    console.log('Streamgraph /activities params:', req.query);

    const timeBucket = Number(time_bucket_minutes);

    // Parse interest_groups parameter (can be comma-separated or array)
    let interestGroupsArray: string[] | null = null;
    if (interest_groups) {
      if (Array.isArray(interest_groups)) {
        interestGroupsArray = interest_groups as string[];
      } else if (typeof interest_groups === 'string') {
        interestGroupsArray = interest_groups.split(',').map(g => g.trim()).filter(g => g.length > 0);
      }
    }

    let query = `
      WITH time_series AS (
        SELECT
          to_timestamp(FLOOR(EXTRACT(EPOCH FROM psl.timestamp) / (${timeBucket} * 60)) * (${timeBucket} * 60)) as time_bucket,
          psl.current_mode as activity,
          psl.participant_id
        FROM participant_status_logs psl
        INNER JOIN participants p ON psl.participant_id = p.participant_id
        WHERE psl.current_mode IS NOT NULL
    `;

    const params: any[] = [];

    if (start) {
      params.push(start);
      query += ` AND psl.timestamp >= $${params.length}`;
    }

    if (end) {
      params.push(end);
      query += ` AND psl.timestamp <= $${params.length}`;
    }

    // Add interest group filtering if specified
    if (interestGroupsArray && interestGroupsArray.length > 0) {
      params.push(interestGroupsArray);
      query += ` AND p.interest_group = ANY($${params.length})`;
    }

    query += `
      )
      SELECT
        time_bucket,
        activity,
        COUNT(DISTINCT participant_id) as participant_count
      FROM time_series
      GROUP BY time_bucket, activity
      ORDER BY time_bucket, activity
    `;

    const result = await pool.query(query, params);

    // Transform data to format suitable for streamgraph
    // Group by time bucket with activities as series
    const groupedData: { [key: string]: { [activity: string]: number } } = {};

    result.rows.forEach((row: any) => {
      const timeKey = row.time_bucket.toISOString();

      if (!groupedData[timeKey]) {
        groupedData[timeKey] = {};
      }

      groupedData[timeKey][row.activity] = parseInt(row.participant_count);
    });

    return res.json({ data: groupedData });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

export { router };