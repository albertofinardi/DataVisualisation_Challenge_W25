import Database from 'better-sqlite3';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

// Use a persistent database file path
const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../../data/vast_challenge.db');

// Create database connection with better-sqlite3
const db: Database.Database = new Database(DB_PATH);

// Load SpatiaLite extension
try {
  // Try common SpatiaLite library paths
  const spatialitePaths = [
    '/usr/lib/mod_spatialite.so',           // Alpine Linux
    '/usr/local/lib/mod_spatialite.so',     // Common
    '/usr/lib/x86_64-linux-gnu/mod_spatialite.so', // Debian/Ubuntu
    'mod_spatialite',                        // Generic
  ];

  let loaded = false;
  for (const libPath of spatialitePaths) {
    try {
      db.loadExtension(libPath);
      console.log(`SpatiaLite extension loaded from: ${libPath}`);
      loaded = true;
      break;
    } catch (err) {
      // Try next path
      console.debug(`Failed to load SpatiaLite from ${libPath}`);
    }
  }

  if (!loaded) {
    console.error('ERROR: Could not load SpatiaLite extension. Spatial features will not be available.');
    console.error('Make sure libspatialite is installed in the container.');
  }
} catch (error) {
  console.error('Error loading SpatiaLite:', error);
}

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Set performance optimizations
db.pragma('journal_mode = WAL');
db.pragma('synchronous = NORMAL');
db.pragma('cache_size = 10000');
db.pragma('temp_store = MEMORY');

console.log('Database connected successfully at:', DB_PATH);

// Graceful shutdown
process.on('exit', () => db.close());
process.on('SIGHUP', () => process.exit(128 + 1));
process.on('SIGINT', () => process.exit(128 + 2));
process.on('SIGTERM', () => process.exit(128 + 15));

export default db;
