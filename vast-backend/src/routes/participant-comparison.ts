import { Router, Request, Response } from 'express';
import pool from '../config/database';

const router = Router();

// Get participant comparison data for two participants
router.get('/compare', async (req: Request, res: Response): Promise<void> => {
  try {
    const { participant1, participant2, start, end } = req.query;

    if (!participant1 || !participant2) {
      res.status(400).json({ 
        error: 'Both participant1 and participant2 are required' 
      });
      return;
    }

    console.log('Participant comparison params:', req.query);

    // Get participant demographics
    const participantsQuery = `
      SELECT 
        participant_id,
        household_size,
        have_kids,
        age,
        education_level,
        interest_group,
        joviality
      FROM participants
      WHERE participant_id IN ($1, $2)
      ORDER BY participant_id
    `;

    const participantsResult = await pool.query(participantsQuery, [participant1, participant2]);

    if (participantsResult.rows.length !== 2) {
      res.status(404).json({ 
        error: 'One or both participants not found' 
      });
      return;
    }

    // Get activity mode distribution for both participants
    const activityDistributionQuery = `
      SELECT 
        participant_id,
        current_mode,
        COUNT(*) as count
      FROM participant_status_logs
      WHERE participant_id IN ($1, $2)
        AND current_mode IS NOT NULL
        ${start ? 'AND timestamp >= $3' : ''}
        ${end && start ? 'AND timestamp <= $4' : end ? 'AND timestamp <= $3' : ''}
      GROUP BY participant_id, current_mode
      ORDER BY participant_id, count DESC
    `;

    const params: any[] = [participant1, participant2];
    if (start) params.push(start);
    if (end) params.push(end);

    const activityResult = await pool.query(activityDistributionQuery, params);

    // Get location timeline data for animation
    const timelineQuery = `
      SELECT 
        participant_id,
        timestamp,
        ST_X(current_location::geometry) as x,
        ST_Y(current_location::geometry) as y,
        current_mode
      FROM participant_status_logs
      WHERE participant_id IN ($1, $2)
        AND current_location IS NOT NULL
        ${start ? 'AND timestamp >= $3' : ''}
        ${end && start ? 'AND timestamp <= $4' : end ? 'AND timestamp <= $3' : ''}
      ORDER BY timestamp
    `;

    const timelineResult = await pool.query(timelineQuery, params);

    // Structure the response
    const participant1Data = participantsResult.rows.find(
      (p: any) => p.participant_id === parseInt(participant1 as string)
    );
    const participant2Data = participantsResult.rows.find(
      (p: any) => p.participant_id === parseInt(participant2 as string)
    );

    // Group activity data by participant
    const activityByParticipant: { [key: string]: { [mode: string]: number } } = {
      [participant1 as string]: {},
      [participant2 as string]: {}
    };

    activityResult.rows.forEach((row: any) => {
      const pid = String(row.participant_id);
      activityByParticipant[pid][row.current_mode] = parseInt(row.count);
    });

    // Group timeline data by participant
    const timelineByParticipant: { [key: string]: any[] } = {
      [participant1 as string]: [],
      [participant2 as string]: []
    };

    timelineResult.rows.forEach((row: any) => {
      const pid = String(row.participant_id);
      timelineByParticipant[pid].push({
        timestamp: row.timestamp,
        x: parseFloat(row.x),
        y: parseFloat(row.y),
        mode: row.current_mode
      });
    });

    const response = {
      participants: {
        [participant1 as string]: {
          info: participant1Data,
          activityDistribution: activityByParticipant[participant1 as string],
          timeline: timelineByParticipant[participant1 as string]
        },
        [participant2 as string]: {
          info: participant2Data,
          activityDistribution: activityByParticipant[participant2 as string],
          timeline: timelineByParticipant[participant2 as string]
        }
      },
      timeRange: {
        start: start || null,
        end: end || null
      }
    };

    res.json(response);
  } catch (error: any) {
    console.error('Comparison error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
