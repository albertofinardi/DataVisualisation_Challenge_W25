import fs from 'fs';
import csvParser from 'csv-parser';
import pool from '../config/database';

interface ParticipantRow {
  participantId: string;
  householdSize: string;
  haveKids: string;
  age: string;
  educationLevel: string;
  interestGroup: string;
  joviality: string;
}

interface ParticipantStatusLogRow {
  timestamp: string;
  currentLocation: string;
  participantId: string;
  currentMode: string;
  hungerStatus: string;
  sleepStatus: string;
  apartmentId: string;
  availableBalance: string;
  jobId: string;
  financialStatus: string;
  dailyFoodBudget: string;
  weeklyExtraBudget: string;
}

interface CheckinJournalRow {
  participantId: string;
  timestamp: string;
  venueId: string;
  venueType: string;
}

interface FinancialJournalRow {
  participantId: string;
  timestamp: string;
  category: string;
  amount: string;
}

// Helper function to parse WKT POINT to PostGIS format
function parsePoint(wkt: string): string {
  if (!wkt || wkt === '') return 'NULL';
  // WKT format: POINT (x y)
  const match = wkt.match(/POINT\s*\(([^)]+)\)/i);
  if (!match) return 'NULL';
  return `ST_GeomFromText('${wkt}', 0)`;
}

// Helper function to parse WKT POLYGON to PostGIS format
function parsePolygon(wkt: string): string {
  if (!wkt || wkt === '') return 'NULL';
  return `ST_GeomFromText('${wkt.replace(/'/g, "''")}', 0)`;
}

// Helper function to parse array fields
function parseArray(value: string): string {
  if (!value || value === '') return 'NULL';
  // Remove brackets and parse
  const cleanValue = value.replace(/[\[\]]/g, '');
  if (cleanValue === '') return 'NULL';
  return `'{${cleanValue}}'`;
}

export async function importParticipants(filePath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const rows: ParticipantRow[] = [];

    fs.createReadStream(filePath)
      .pipe(csvParser())
      .on('data', (row) => rows.push(row))
      .on('end', async () => {
        const client = await pool.connect();
        try {
          let imported = 0;

          for (const row of rows) {
            await client.query(
              `INSERT INTO participants (participant_id, household_size, have_kids, age, education_level, interest_group, joviality)
               VALUES ($1, $2, $3, $4, $5, $6, $7)
               ON CONFLICT (participant_id) DO NOTHING`,
              [
                parseInt(row.participantId),
                parseInt(row.householdSize),
                row.haveKids.toUpperCase() === 'TRUE',
                parseInt(row.age),
                row.educationLevel,
                row.interestGroup,
                parseFloat(row.joviality)
              ]
            );
            imported++;
          }

          client.release();
          console.log(`Imported ${imported} participants`);
          resolve(imported);
        } catch (error) {
          client.release();
          reject(error);
        }
      })
      .on('error', reject);
  });
}

export async function importParticipantStatusLogs(filePath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const rows: ParticipantStatusLogRow[] = [];

    fs.createReadStream(filePath)
      .pipe(csvParser())
      .on('data', (row) => rows.push(row))
      .on('end', async () => {
        const client = await pool.connect();
        try {
          let imported = 0;

          for (const row of rows) {
            const location = parsePoint(row.currentLocation);

            await client.query(
              `INSERT INTO participant_status_logs
               (timestamp, current_location, participant_id, current_mode, hunger_status,
                sleep_status, apartment_id, available_balance, job_id, financial_status,
                daily_food_budget, weekly_extra_budget)
               VALUES ($1, ${location}, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
              [
                row.timestamp,
                parseInt(row.participantId),
                row.currentMode,
                row.hungerStatus,
                row.sleepStatus,
                row.apartmentId ? parseInt(row.apartmentId) : null,
                row.availableBalance ? parseFloat(row.availableBalance) : null,
                row.jobId ? parseInt(row.jobId) : null,
                row.financialStatus,
                row.dailyFoodBudget ? parseFloat(row.dailyFoodBudget) : null,
                row.weeklyExtraBudget ? parseFloat(row.weeklyExtraBudget) : null
              ]
            );
            imported++;
          }

          client.release();
          console.log(`Imported ${imported} status logs from ${filePath}`);
          resolve(imported);
        } catch (error) {
          client.release();
          reject(error);
        }
      })
      .on('error', reject);
  });
}

export async function importCheckinJournal(filePath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const rows: CheckinJournalRow[] = [];

    fs.createReadStream(filePath)
      .pipe(csvParser())
      .on('data', (row) => rows.push(row))
      .on('end', async () => {
        const client = await pool.connect();
        try {
          let imported = 0;

          for (const row of rows) {
            await client.query(
              `INSERT INTO checkin_journal (participant_id, timestamp, venue_id, venue_type)
               VALUES ($1, $2, $3, $4)`,
              [
                parseInt(row.participantId),
                row.timestamp,
                row.venueId ? parseInt(row.venueId) : null,
                row.venueType
              ]
            );
            imported++;
          }

          client.release();
          console.log(`Imported ${imported} checkin journal entries`);
          resolve(imported);
        } catch (error) {
          client.release();
          reject(error);
        }
      })
      .on('error', reject);
  });
}

export async function importFinancialJournal(filePath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const rows: FinancialJournalRow[] = [];

    fs.createReadStream(filePath)
      .pipe(csvParser())
      .on('data', (row) => rows.push(row))
      .on('end', async () => {
        const client = await pool.connect();
        try {
          let imported = 0;

          for (const row of rows) {
            await client.query(
              `INSERT INTO financial_journal (participant_id, timestamp, category, amount)
               VALUES ($1, $2, $3, $4)`,
              [
                parseInt(row.participantId),
                row.timestamp,
                row.category,
                parseFloat(row.amount)
              ]
            );
            imported++;
          }

          client.release();
          console.log(`Imported ${imported} financial journal entries`);
          resolve(imported);
        } catch (error) {
          client.release();
          reject(error);
        }
      })
      .on('error', reject);
  });
}

export async function importBuildings(filePath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const rows: any[] = [];

    fs.createReadStream(filePath)
      .pipe(csvParser())
      .on('data', (row) => rows.push(row))
      .on('end', async () => {
        const client = await pool.connect();
        try {
          let imported = 0;

          for (const row of rows) {
            const location = parsePolygon(row.location);
            const units = parseArray(row.units);

            await client.query(
              `INSERT INTO buildings (building_id, location, building_type, max_occupancy, units)
               VALUES ($1, ${location}, $2, $3, ${units})
               ON CONFLICT (building_id) DO NOTHING`,
              [
                parseInt(row.buildingId),
                row.buildingType || null,
                row.maxOccupancy ? parseInt(row.maxOccupancy) : null
              ]
            );
            imported++;
          }

          client.release();
          console.log(`Imported ${imported} buildings`);
          resolve(imported);
        } catch (error) {
          client.release();
          reject(error);
        }
      })
      .on('error', reject);
  });
}

export async function importGenericAttributes(
  filePath: string,
  tableName: string
): Promise<number> {
  return new Promise((resolve, reject) => {
    const rows: any[] = [];

    fs.createReadStream(filePath)
      .pipe(csvParser())
      .on('data', (row) => rows.push(row))
      .on('end', async () => {
        const client = await pool.connect();
        try {
          let imported = 0;

          // Auto-detect columns from first row
          if (rows.length === 0) {
            client.release();
            resolve(0);
            return;
          }

          const columns = Object.keys(rows[0]);
          const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');

          for (const row of rows) {
            const values = columns.map(col => {
              const value = row[col];
              if (value === '' || value === null) return null;
              // Try to parse as number if possible
              const num = parseFloat(value);
              if (!isNaN(num) && value.trim() !== '') return num;
              // Handle booleans
              if (value.toUpperCase() === 'TRUE') return true;
              if (value.toUpperCase() === 'FALSE') return false;
              return value;
            });

            await client.query(
              `INSERT INTO ${tableName} (${columns.join(', ')})
               VALUES (${placeholders})
               ON CONFLICT DO NOTHING`,
              values
            );
            imported++;
          }

          client.release();
          console.log(`Imported ${imported} records into ${tableName}`);
          resolve(imported);
        } catch (error) {
          client.release();
          reject(error);
        }
      })
      .on('error', reject);
  });
}
