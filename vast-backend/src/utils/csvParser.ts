import fs from 'fs';
import csvParser from 'csv-parser';
import db from '../config/database';

// Set to true to only import first 10 rows for testing
const TEST_MODE = false;
const TEST_LIMIT = 10;

interface ParticipantRow {
  participantId: string;
  householdSize: string;
  haveKids: string;
  age: string;
  educationLevel: string;
  interestGroup: string;
  joviality: string;
}

interface BuildingRow {
  buildingId: string;
  location: string; // POLYGON WKT
  buildingType: string;
  maxOccupancy: string;
  units: string; // JSON array like "[481,498,534]"
}

interface ParticipantStatusLogRow {
  timestamp: string;
  currentLocation: string; // POINT WKT
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
/*
interface ApartmentRow {
  apartmentId: string;
  rentalCost: string;
  maxOccupancy: string; // Note: CSV has trailing space
  numberOfRooms: string;
  location: string; // POINT WKT
  buildingId: string;
}

interface EmployerRow {
  employerId: string;
  location: string; // POINT WKT
  buildingId: string;
}

interface JobRow {
  jobId: string;
  employerId: string;
  hourlyRate: string;
  startTime: string;
  endTime: string;
  daysToWork: string; // JSON array like "[Monday,Tuesday,...]"
  educationRequirement: string;
}

interface PubRow {
  pubId: string;
  hourlyCost: string;
  maxOccupancy: string;
  location: string; // POINT WKT
  buildingId: string;
}

interface RestaurantRow {
  restaurantId: string;
  foodCost: string;
  maxOccupancy: string;
  location: string; // POINT WKT
  buildingId: string;
}

interface SchoolRow {
  schoolId: string;
  monthlyCost: string;
  maxEnrollment: string;
  location: string; // POINT WKT
  buildingId: string;
}

interface TravelJournalRow {
  participantId: string;
  travelStartTime: string;
  travelStartLocationId: string;
  travelEndTime: string;
  travelEndLocationId: string;
  purpose: string;
  checkInTime: string;
  checkOutTime: string;
  startingBalance: string;
  endingBalance: string;
}

interface SocialNetworkRow {
  timestamp: string;
  participantIdFrom: string;
  participantIdTo: string;
}
*/
export async function importParticipants(filePath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const rows: ParticipantRow[] = [];
    let rowCount = 0;

    fs.createReadStream(filePath)
      .pipe(csvParser())
      .on('data', (row) => {
        if (!TEST_MODE || rowCount < TEST_LIMIT) {
          rows.push(row);
          rowCount++;
        }
      })
      .on('end', async () => {
        try {
          let imported = 0;
          const stmt = db.prepare(
            `INSERT INTO participants (participantId, householdSize, haveKids, age, educationLevel, interestGroup, joviality)
             VALUES (?, ?, ?, ?, ?, ?, ?)
             ON CONFLICT (participantId) DO NOTHING`
          );

          const insertMany = db.transaction((rows: ParticipantRow[]) => {
            for (const row of rows) {
              stmt.run(
                parseInt(row.participantId),
                parseInt(row.householdSize),
                row.haveKids.toUpperCase() === 'TRUE' ? 1 : 0,
                parseInt(row.age),
                row.educationLevel,
                row.interestGroup,
                parseFloat(row.joviality)
              );
              imported++;
            }
          });

          insertMany(rows);
          console.log(`Imported ${imported} participants${TEST_MODE ? ' (TEST MODE - limited to ' + TEST_LIMIT + ' rows)' : ''}`);
          resolve(imported);
        } catch (error) {
          reject(error);
        }
      })
      .on('error', reject);
  });
}

export async function importParticipantStatusLogs(filePath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const rows: ParticipantStatusLogRow[] = [];
    let rowCount = 0;

    fs.createReadStream(filePath)
      .pipe(csvParser())
      .on('data', (row) => {
        if (!TEST_MODE || rowCount < TEST_LIMIT) {
          rows.push(row);
          rowCount++;
        }
      })
      .on('end', async () => {
        try {
          let imported = 0;
          const stmt = db.prepare(
            `INSERT INTO participant_status_logs
             (timestamp, currentLocation, participantId, currentMode, hungerStatus,
              sleepStatus, apartmentId, availableBalance, jobId, financialStatus,
              dailyFoodBudget, weeklyExtraBudget)
             VALUES (?, GeomFromText(?, 4326), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
          );

          const insertMany = db.transaction((rows: ParticipantStatusLogRow[]) => {
            for (const row of rows) {
              stmt.run(
                row.timestamp,
                row.currentLocation || null,
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
              );
              imported++;
            }
          });

          insertMany(rows);
          const fileName = filePath.split('/').pop();
          console.log(`Imported ${imported} status logs from ${fileName}${TEST_MODE ? ' (TEST MODE)' : ''}`);
          resolve(imported);
        } catch (error) {
          reject(error);
        }
      })
      .on('error', reject);
  });
}

export async function importCheckinJournal(filePath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const rows: CheckinJournalRow[] = [];
    let rowCount = 0;

    fs.createReadStream(filePath)
      .pipe(csvParser())
      .on('data', (row) => {
        if (!TEST_MODE || rowCount < TEST_LIMIT) {
          rows.push(row);
          rowCount++;
        }
      })
      .on('end', async () => {
        try {
          let imported = 0;
          const stmt = db.prepare(
            `INSERT INTO checkin_journal (participantId, timestamp, venueId, venueType)
             VALUES (?, ?, ?, ?)`
          );

          const insertMany = db.transaction((rows: CheckinJournalRow[]) => {
            for (const row of rows) {
              stmt.run(
                parseInt(row.participantId),
                row.timestamp,
                row.venueId ? parseInt(row.venueId) : null,
                row.venueType
              );
              imported++;
            }
          });

          insertMany(rows);
          console.log(`Imported ${imported} checkin journal entries${TEST_MODE ? ' (TEST MODE)' : ''}`);
          resolve(imported);
        } catch (error) {
          reject(error);
        }
      })
      .on('error', reject);
  });
}

export async function importFinancialJournal(filePath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const rows: FinancialJournalRow[] = [];
    let rowCount = 0;

    fs.createReadStream(filePath)
      .pipe(csvParser())
      .on('data', (row) => {
        if (!TEST_MODE || rowCount < TEST_LIMIT) {
          rows.push(row);
          rowCount++;
        }
      })
      .on('end', async () => {
        try {
          let imported = 0;
          const stmt = db.prepare(
            `INSERT INTO financial_journal (participantId, timestamp, category, amount)
             VALUES (?, ?, ?, ?)`
          );

          const insertMany = db.transaction((rows: FinancialJournalRow[]) => {
            for (const row of rows) {
              stmt.run(
                parseInt(row.participantId),
                row.timestamp,
                row.category,
                parseFloat(row.amount)
              );
              imported++;
            }
          });

          insertMany(rows);
          console.log(`Imported ${imported} financial journal entries${TEST_MODE ? ' (TEST MODE)' : ''}`);
          resolve(imported);
        } catch (error) {
          reject(error);
        }
      })
      .on('error', reject);
  });
}

export async function importBuildings(filePath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const rows: BuildingRow[] = [];
    let rowCount = 0;

    fs.createReadStream(filePath)
      .pipe(csvParser())
      .on('data', (row) => {
        if (!TEST_MODE || rowCount < TEST_LIMIT) {
          rows.push(row);
          rowCount++;
        }
      })
      .on('end', async () => {
        try {
          let imported = 0;
          const buildingStmt = db.prepare(
            `INSERT INTO buildings (buildingId, buildingType, maxOccupancy, location)
             VALUES (?, ?, ?, GeomFromText(?, 4326))
             ON CONFLICT (buildingId) DO NOTHING`
          );

          const unitStmt = db.prepare(
            `INSERT INTO buildingUnits (buildingId, unitId)
             VALUES (?, ?)
             ON CONFLICT DO NOTHING`
          );

          const insertMany = db.transaction((rows: BuildingRow[]) => {
            for (const row of rows) {
              // Insert building with geometry
              buildingStmt.run(
                parseInt(row.buildingId),
                row.buildingType || null,
                row.maxOccupancy ? parseInt(row.maxOccupancy) : null,
                row.location || null
              );

              // Parse and insert building units
              if (row.units) {
                try {
                  // Parse array like "[481,498,534,652,818]"
                  const unitsArray = JSON.parse(row.units);
                  for (const unitId of unitsArray) {
                    unitStmt.run(parseInt(row.buildingId), parseInt(unitId));
                  }
                } catch (e) {
                  console.warn(`Failed to parse units for building ${row.buildingId}:`, row.units);
                }
              }

              imported++;
            }
          });

          insertMany(rows);
          console.log(`Imported ${imported} buildings with units${TEST_MODE ? ' (TEST MODE)' : ''}`);
          resolve(imported);
        } catch (error) {
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
    let rowCount = 0;

    fs.createReadStream(filePath)
      .pipe(csvParser())
      .on('data', (row) => {
        if (!TEST_MODE || rowCount < TEST_LIMIT) {
          rows.push(row);
          rowCount++;
        }
      })
      .on('end', async () => {
        try {
          let imported = 0;

          // Auto-detect columns from first row
          if (rows.length === 0) {
            resolve(0);
            return;
          }

          const columns = Object.keys(rows[0]);

          // Determine if this table has location column (POINT geometry)
          const hasLocation = columns.includes('location');
          const isJobsTable = tableName === 'jobs';

          // Build SQL statement
          let sql: string;
          if (hasLocation) {
            // Replace location with GeomFromText for spatial data
            const sqlColumns = columns.map(col => col === 'location' ? 'location' : col);
            const placeholders = columns.map(col =>
              col === 'location' ? 'GeomFromText(?, 4326)' : '?'
            ).join(', ');
            sql = `INSERT INTO ${tableName} (${sqlColumns.join(', ')}) VALUES (${placeholders}) ON CONFLICT DO NOTHING`;
          } else if (isJobsTable) {
            // For jobs, add boolean columns for days
            const allColumns = [...columns, 'worksMonday', 'worksTuesday', 'worksWednesday', 'worksThursday', 'worksFriday', 'worksSaturday', 'worksSunday'];
            const placeholders = allColumns.map(() => '?').join(', ');
            sql = `INSERT INTO ${tableName} (${allColumns.join(', ')}) VALUES (${placeholders}) ON CONFLICT DO NOTHING`;
          } else {
            const placeholders = columns.map(() => '?').join(', ');
            sql = `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders}) ON CONFLICT DO NOTHING`;
          }

          const stmt = db.prepare(sql);

          const insertMany = db.transaction((rows: any[]) => {
            for (const row of rows) {
              const values = columns.map(col => {
                const value = row[col];
                if (value === '' || value === null) return null;
                // Don't parse location as number - keep as WKT string
                if (col === 'location') return value;
                // Try to parse as number if possible
                const num = parseFloat(value);
                if (!isNaN(num) && value.trim() !== '') return num;
                // Handle booleans
                if (value.toUpperCase() === 'TRUE') return 1;
                if (value.toUpperCase() === 'FALSE') return 0;
                return value;
              });

              // For jobs table, parse daysToWork and add boolean values
              if (isJobsTable) {
                const daysToWork = row.daysToWork || '';
                values.push(
                  daysToWork.includes('Monday') ? 1 : 0,
                  daysToWork.includes('Tuesday') ? 1 : 0,
                  daysToWork.includes('Wednesday') ? 1 : 0,
                  daysToWork.includes('Thursday') ? 1 : 0,
                  daysToWork.includes('Friday') ? 1 : 0,
                  daysToWork.includes('Saturday') ? 1 : 0,
                  daysToWork.includes('Sunday') ? 1 : 0
                );
              }

              stmt.run(...values);
              imported++;
            }
          });

          insertMany(rows);
          console.log(`Imported ${imported} records into ${tableName}${TEST_MODE ? ' (TEST MODE)' : ''}`);
          resolve(imported);
        } catch (error) {
          reject(error);
        }
      })
      .on('error', reject);
  });
}
