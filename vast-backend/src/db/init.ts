import pool from '../config/database';
import fs from 'fs';
import path from 'path';

export async function initializeDatabase() {
  const client = await pool.connect();

  try {
    console.log('Initializing database schema...');

    // Enable PostGIS extension for geometry types
    await client.query('CREATE EXTENSION IF NOT EXISTS postgis;');

    // Read and execute schema SQL
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf-8');

    await client.query(schemaSql);

    console.log('Database schema initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  } finally {
    client.release();
  }
}

export async function checkDatabaseConnection() {
  try {
    const result = await pool.query('SELECT NOW()');
    console.log('Database connection successful:', result.rows[0]);
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
}
