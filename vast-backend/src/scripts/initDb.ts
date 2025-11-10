import { initializeDatabase, checkDatabaseConnection } from '../db/init';

async function main() {
  console.log('Starting database initialization...');

  // Check connection first
  const connected = await checkDatabaseConnection();
  if (!connected) {
    console.error('Failed to connect to database. Please check your configuration.');
    process.exit(1);
  }

  try {
    await initializeDatabase();
    console.log('Database initialization completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Database initialization failed:', error);
    process.exit(1);
  }
}

main();
