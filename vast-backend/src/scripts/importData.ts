import { checkDatabaseConnection } from '../db/init';

async function main() {
  console.log('Starting data import...');

  // Check connection first
  const connected = await checkDatabaseConnection();
  if (!connected) {
    console.error('Failed to connect to database. Please check your configuration.');
    process.exit(1);
  }
}

main();
