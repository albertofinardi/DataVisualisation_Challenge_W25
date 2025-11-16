import db from '../config/database';
import fs from 'fs';
import path from 'path';

export async function initializeDatabase() {
  try {
    console.log('Initializing database schema...');

    // Read and execute schema SQL
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf-8');

    // Execute schema (better-sqlite3 can handle multiple statements)
    db.exec(schemaSql);

    console.log('Database schema initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}

export async function checkDatabaseConnection() {
  try {
    const result = db.prepare("SELECT datetime('now') as now").get();
    console.log('Database connection successful:', result);
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
}
