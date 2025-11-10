import { Router, Request, Response } from 'express';
import { initializeDatabase } from '../db/init';
import pool from '../config/database';

const router = Router();

// Initialize database schema
router.post('/init', async (_req: Request, res: Response) => {
  try {
    await initializeDatabase();
    res.json({
      success: true,
      message: 'Database schema initialized successfully'
    });
  } catch (error: any) {
    console.error('Init error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});


// Get all participants
router.get('/participants', async (_req: Request, res: Response) => {
  try {
    const result = await pool.query(
      'SELECT * FROM participants ORDER BY participant_id'
    );
    res.json(result.rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get participant by ID
router.get('/participants/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT * FROM participants WHERE participant_id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Participant not found' });
    }

    return res.json(result.rows[0]);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// Get participant status logs
router.get('/participants/:id/status-logs', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { start, end, limit = 1000 } = req.query;

    let query = `
      SELECT
        id,
        timestamp,
        ST_AsText(current_location) as current_location,
        participant_id,
        current_mode,
        hunger_status,
        sleep_status,
        apartment_id,
        available_balance,
        job_id,
        financial_status,
        daily_food_budget,
        weekly_extra_budget
      FROM participant_status_logs
      WHERE participant_id = $1
    `;

    const params: any[] = [id];

    if (start) {
      params.push(start);
      query += ` AND timestamp >= $${params.length}`;
    }

    if (end) {
      params.push(end);
      query += ` AND timestamp <= $${params.length}`;
    }

    query += ` ORDER BY timestamp LIMIT $${params.length + 1}`;
    params.push(limit);

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get financial journal for participant
router.get('/participants/:id/financial', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { start, end } = req.query;

    let query = `
      SELECT * FROM financial_journal
      WHERE participant_id = $1
    `;

    const params: any[] = [id];

    if (start) {
      params.push(start);
      query += ` AND timestamp >= $${params.length}`;
    }

    if (end) {
      params.push(end);
      query += ` AND timestamp <= $${params.length}`;
    }

    query += ' ORDER BY timestamp';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get checkin journal for participant
router.get('/participants/:id/checkins', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { start, end } = req.query;

    let query = `
      SELECT * FROM checkin_journal
      WHERE participant_id = $1
    `;

    const params: any[] = [id];

    if (start) {
      params.push(start);
      query += ` AND timestamp >= $${params.length}`;
    }

    if (end) {
      params.push(end);
      query += ` AND timestamp <= $${params.length}`;
    }

    query += ' ORDER BY timestamp';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get database statistics
router.get('/stats', async (_req: Request, res: Response) => {
  try {
    const stats = await Promise.all([
      pool.query('SELECT COUNT(*) as count FROM participants'),
      pool.query('SELECT COUNT(*) as count FROM participant_status_logs'),
      pool.query('SELECT COUNT(*) as count FROM checkin_journal'),
      pool.query('SELECT COUNT(*) as count FROM financial_journal'),
      pool.query('SELECT COUNT(*) as count FROM buildings')
    ]);

    res.json({
      participants: parseInt(stats[0].rows[0].count),
      statusLogs: parseInt(stats[1].rows[0].count),
      checkins: parseInt(stats[2].rows[0].count),
      financialEntries: parseInt(stats[3].rows[0].count),
      buildings: parseInt(stats[4].rows[0].count)
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export { router };
