import { Router, Request, Response } from 'express';
import { initializeDatabase } from '../db/init';
import db from '../config/database';
import {
  importParticipants,
  importBuildings,
  importParticipantStatusLogs,
  importCheckinJournal,
  importFinancialJournal,
  importGenericAttributes
} from '../utils/csvParser';
import path from 'path';
import fs from 'fs';

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

// Import all data from CSV files
router.post('/import', async (_req: Request, res: Response) => {
  try {
    const dataPath = '/app/data/Datasets';
    const results: any = {};

    // Import attributes
    results.participants = await importParticipants(path.join(dataPath, 'Attributes/Participants.csv'));
    results.buildings = await importBuildings(path.join(dataPath, 'Attributes/Buildings.csv'));
    results.apartments = await importGenericAttributes(path.join(dataPath, 'Attributes/Apartments.csv'), 'apartments');
    results.employers = await importGenericAttributes(path.join(dataPath, 'Attributes/Employers.csv'), 'employers');
    results.jobs = await importGenericAttributes(path.join(dataPath, 'Attributes/Jobs.csv'), 'jobs');
    results.pubs = await importGenericAttributes(path.join(dataPath, 'Attributes/Pubs.csv'), 'pubs');
    results.restaurants = await importGenericAttributes(path.join(dataPath, 'Attributes/Restaurants.csv'), 'restaurants');
    results.schools = await importGenericAttributes(path.join(dataPath, 'Attributes/Schools.csv'), 'schools');

    // Import journals
    results.checkins = await importCheckinJournal(path.join(dataPath, 'Journals/CheckinJournal.csv'));
    results.financial = await importFinancialJournal(path.join(dataPath, 'Journals/FinancialJournal.csv'));
    results.socialNetwork = await importGenericAttributes(path.join(dataPath, 'Journals/SocialNetwork.csv'), 'social_network');
    results.travel = await importGenericAttributes(path.join(dataPath, 'Journals/TravelJournal.csv'), 'travel_journal');

    // Import activity logs
    const activityLogsPath = path.join(dataPath, 'Activity Logs');
    const logFiles = fs.readdirSync(activityLogsPath).filter(f => f.endsWith('.csv'));
    let totalActivityLogs = 0;
    for (const file of logFiles) {
      const count = await importParticipantStatusLogs(path.join(activityLogsPath, file));
      totalActivityLogs += count;
    }
    results.activityLogs = totalActivityLogs;

    res.json({
      success: true,
      message: 'Data import completed successfully',
      imported: results
    });
  } catch (error: any) {
    console.error('Import error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});


// Get all participants
router.get('/participants', async (_req: Request, res: Response) => {
  try {
    const stmt = db.prepare('SELECT * FROM participants ORDER BY participantId');
    const rows = stmt.all();
    res.json(rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get participant by ID
router.get('/participants/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const stmt = db.prepare('SELECT * FROM participants WHERE participantId = ?');
    const row = stmt.get(id);

    if (!row) {
      return res.status(404).json({ error: 'Participant not found' });
    }

    return res.json(row);
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
        AsGeoJSON(currentLocation) as location_json,
        participantId,
        currentMode,
        hungerStatus,
        sleepStatus,
        apartmentId,
        availableBalance,
        jobId,
        financialStatus,
        dailyFoodBudget,
        weeklyExtraBudget
      FROM participant_status_logs
      WHERE participantId = ?
    `;

    const params: any[] = [id];

    if (start) {
      query += ` AND timestamp >= ?`;
      params.push(start);
    }

    if (end) {
      query += ` AND timestamp <= ?`;
      params.push(end);
    }

    query += ` ORDER BY timestamp LIMIT ?`;
    params.push(limit);

    const stmt = db.prepare(query);
    const rows = stmt.all(...params);
    res.json(rows);
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
      SELECT
        id,
        participantId,
        timestamp,
        category,
        amount
      FROM financial_journal
      WHERE participantId = ?
    `;

    const params: any[] = [id];

    if (start) {
      query += ` AND timestamp >= ?`;
      params.push(start);
    }

    if (end) {
      query += ` AND timestamp <= ?`;
      params.push(end);
    }

    query += ' ORDER BY timestamp';

    const stmt = db.prepare(query);
    const rows = stmt.all(...params);
    res.json(rows);
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
      SELECT
        id,
        participantId,
        timestamp,
        venueId,
        venueType
      FROM checkin_journal
      WHERE participantId = ?
    `;

    const params: any[] = [id];

    if (start) {
      query += ` AND timestamp >= ?`;
      params.push(start);
    }

    if (end) {
      query += ` AND timestamp <= ?`;
      params.push(end);
    }

    query += ' ORDER BY timestamp';

    const stmt = db.prepare(query);
    const rows = stmt.all(...params);
    res.json(rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get all buildings with location
router.get('/buildings', async (_req: Request, res: Response) => {
  try {
    const stmt = db.prepare(`
      SELECT
        buildingId,
        buildingType,
        maxOccupancy,
        AsGeoJSON(location) as location_json
      FROM buildings
      ORDER BY buildingId
    `);
    const rows = stmt.all();
    res.json(rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get building by ID
router.get('/buildings/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const stmt = db.prepare(`
      SELECT
        buildingId,
        buildingType,
        maxOccupancy,
        AsGeoJSON(location) as location_json
      FROM buildings
      WHERE buildingId = ?
    `);
    const row = stmt.get(id);

    if (!row) {
      return res.status(404).json({ error: 'Building not found' });
    }

    return res.json(row);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// Get all apartments with location
router.get('/apartments', async (_req: Request, res: Response) => {
  try {
    const stmt = db.prepare(`
      SELECT
        apartmentId,
        rentalCost,
        maxOccupancy,
        numberOfRooms,
        buildingId,
        AsGeoJSON(location) as location_json
      FROM apartments
      ORDER BY apartmentId
    `);
    const rows = stmt.all();
    res.json(rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get all restaurants with location
router.get('/restaurants', async (_req: Request, res: Response) => {
  try {
    const stmt = db.prepare(`
      SELECT
        restaurantId,
        foodCost,
        maxOccupancy,
        buildingId,
        AsGeoJSON(location) as location_json
      FROM restaurants
      ORDER BY restaurantId
    `);
    const rows = stmt.all();
    res.json(rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get all pubs with location
router.get('/pubs', async (_req: Request, res: Response) => {
  try {
    const stmt = db.prepare(`
      SELECT
        pubId,
        hourlyCost,
        maxOccupancy,
        buildingId,
        AsGeoJSON(location) as location_json
      FROM pubs
      ORDER BY pubId
    `);
    const rows = stmt.all();
    res.json(rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get all schools with location
router.get('/schools', async (_req: Request, res: Response) => {
  try {
    const stmt = db.prepare(`
      SELECT
        schoolId,
        monthlyCost,
        maxEnrollment,
        buildingId,
        AsGeoJSON(location) as location_json
      FROM schools
      ORDER BY schoolId
    `);
    const rows = stmt.all();
    res.json(rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get all employers with location
router.get('/employers', async (_req: Request, res: Response) => {
  try {
    const stmt = db.prepare(`
      SELECT
        employerId,
        buildingId,
        AsGeoJSON(location) as location_json
      FROM employers
      ORDER BY employerId
    `);
    const rows = stmt.all();
    res.json(rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get database statistics
router.get('/stats', async (_req: Request, res: Response) => {
  try {
    const participantsCount = db.prepare('SELECT COUNT(*) as count FROM participants').get() as any;
    const statusLogsCount = db.prepare('SELECT COUNT(*) as count FROM participant_status_logs').get() as any;
    const checkinsCount = db.prepare('SELECT COUNT(*) as count FROM checkin_journal').get() as any;
    const financialCount = db.prepare('SELECT COUNT(*) as count FROM financial_journal').get() as any;
    const buildingsCount = db.prepare('SELECT COUNT(*) as count FROM buildings').get() as any;

    res.json({
      participants: participantsCount.count,
      statusLogs: statusLogsCount.count,
      checkins: checkinsCount.count,
      financialEntries: financialCount.count,
      buildings: buildingsCount.count
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export { router };
