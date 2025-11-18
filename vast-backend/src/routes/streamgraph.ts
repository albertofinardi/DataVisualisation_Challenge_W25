import { Router, Request, Response } from 'express';
import pool from '../config/database';

const router = Router();

// Get participant activities aggregated by time bucket for streamgraph
router.get('/activities', async (req: Request, res: Response) => {
  try {
    const {
      start,
      end,
      time_bucket_minutes = 60
    } = req.query;

    console.log('Streamgraph /activities params:', req.query);

    const timeBucket = Number(time_bucket_minutes);

    let query = `
      WITH time_series AS (
        SELECT
          date_trunc('hour', timestamp) +
          INTERVAL '${timeBucket} minutes' * FLOOR(EXTRACT(EPOCH FROM timestamp - date_trunc('hour', timestamp)) / 60 / ${timeBucket}) as time_bucket,
          current_mode as activity,
          participant_id
        FROM participant_status_logs
        WHERE current_mode IS NOT NULL
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