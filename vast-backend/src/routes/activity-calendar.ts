import { Router, Request, Response } from 'express';
import pool from '../config/database';

const router = Router();

// Get dominant activity per hour per day for activity timeline calendar
router.get('/timeline', async (req: Request, res: Response) => {
  try {
    const {
      start,
      end,
      participant_id
    } = req.query;

    console.log('Activity Calendar /timeline params:', req.query);

    // Build query to get dominant activity per participant per day per hour
    let query = `
      WITH hourly_activities AS (
        SELECT
          participant_id,
          DATE(timestamp) as date,
          EXTRACT(HOUR FROM timestamp) as hour,
          current_mode as activity,
          COUNT(*) as activity_count
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

    if (participant_id) {
      params.push(participant_id);
      query += ` AND participant_id = $${params.length}`;
    }

    query += `
        GROUP BY participant_id, date, hour, activity
      ),
      ranked_activities AS (
        SELECT
          participant_id,
          date,
          hour,
          activity,
          activity_count,
          ROW_NUMBER() OVER (
            PARTITION BY participant_id, date, hour
            ORDER BY activity_count DESC, activity
          ) as rank
        FROM hourly_activities
      )
      SELECT
        participant_id,
        date,
        hour,
        activity as dominant_activity,
        activity_count
      FROM ranked_activities
      WHERE rank = 1
      ORDER BY date, hour, participant_id
    `;

    const result = await pool.query(query, params);

    // Transform data to nested structure: { date: { hour: { participantId: activity } } }
    const timelineData: {
      [date: string]: {
        [hour: string]: {
          [participantId: string]: {
            activity: string;
            count: number;
          };
        };
      };
    } = {};

    result.rows.forEach((row: any) => {
      const dateKey = row.date.toISOString().split('T')[0]; // YYYY-MM-DD format
      const hourKey = String(row.hour);
      const participantKey = String(row.participant_id);

      if (!timelineData[dateKey]) {
        timelineData[dateKey] = {};
      }

      if (!timelineData[dateKey][hourKey]) {
        timelineData[dateKey][hourKey] = {};
      }

      timelineData[dateKey][hourKey][participantKey] = {
        activity: row.dominant_activity,
        count: parseInt(row.activity_count)
      };
    });

    return res.json({ data: timelineData });
  } catch (error: any) {
    console.error('Activity Calendar error:', error);
    return res.status(500).json({ error: error.message });
  }
});

// Get aggregated dominant activity per day per hour (across all participants)
router.get('/timeline-aggregated', async (req: Request, res: Response) => {
  try {
    const {
      start,
      end
    } = req.query;

    console.log('Activity Calendar /timeline-aggregated params:', req.query);

    // Build query to get dominant activity per day per hour across all participants
    let query = `
      WITH hourly_activities AS (
        SELECT
          DATE(timestamp) as date,
          EXTRACT(HOUR FROM timestamp) as hour,
          current_mode as activity,
          COUNT(*) as activity_count
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
        GROUP BY date, hour, activity
      ),
      ranked_activities AS (
        SELECT
          date,
          hour,
          activity,
          activity_count,
          ROW_NUMBER() OVER (
            PARTITION BY date, hour
            ORDER BY activity_count DESC, activity
          ) as rank
        FROM hourly_activities
      )
      SELECT
        date,
        hour,
        activity as dominant_activity,
        activity_count
      FROM ranked_activities
      WHERE rank = 1
      ORDER BY date, hour
    `;

    const result = await pool.query(query, params);

    // Transform data to nested structure: { date: { hour: { activity, count } } }
    const timelineData: {
      [date: string]: {
        [hour: string]: {
          activity: string;
          count: number;
        };
      };
    } = {};

    result.rows.forEach((row: any) => {
      const dateKey = row.date.toISOString().split('T')[0]; // YYYY-MM-DD format
      const hourKey = String(row.hour);

      if (!timelineData[dateKey]) {
        timelineData[dateKey] = {};
      }

      timelineData[dateKey][hourKey] = {
        activity: row.dominant_activity,
        count: parseInt(row.activity_count)
      };
    });

    return res.json({ data: timelineData });
  } catch (error: any) {
    console.error('Activity Calendar aggregated error:', error);
    return res.status(500).json({ error: error.message });
  }
});

export { router };
