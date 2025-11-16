import { checkDatabaseConnection } from '../db/init';
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

async function main() {
  console.log('Starting data import...');

  // Check connection
  const connected = await checkDatabaseConnection();
  if (!connected) {
    console.error('Failed to connect to database');
    process.exit(1);
  }

  const dataPath = '/app/data/Datasets';

  try {
    // Import attributes
    console.log('\n=== Importing Attributes ===');
    await importParticipants(path.join(dataPath, 'Attributes/Participants.csv'));
    await importBuildings(path.join(dataPath, 'Attributes/Buildings.csv'));
    await importGenericAttributes(path.join(dataPath, 'Attributes/Apartments.csv'), 'apartments');
    await importGenericAttributes(path.join(dataPath, 'Attributes/Employers.csv'), 'employers');
    await importGenericAttributes(path.join(dataPath, 'Attributes/Jobs.csv'), 'jobs');
    await importGenericAttributes(path.join(dataPath, 'Attributes/Pubs.csv'), 'pubs');
    await importGenericAttributes(path.join(dataPath, 'Attributes/Restaurants.csv'), 'restaurants');
    await importGenericAttributes(path.join(dataPath, 'Attributes/Schools.csv'), 'schools');

    // Import journals
    console.log('\n=== Importing Journals ===');
    await importCheckinJournal(path.join(dataPath, 'Journals/CheckinJournal.csv'));
    await importFinancialJournal(path.join(dataPath, 'Journals/Financial Journal.csv'));
    await importGenericAttributes(path.join(dataPath, 'Journals/SocialNetwork.csv'), 'social_network');
    await importGenericAttributes(path.join(dataPath, 'Journals/TravelJournal.csv'), 'travel_journal');

    // Import activity logs
    console.log('\n=== Importing Activity Logs ===');
    const activityLogsPath = path.join(dataPath, 'Activity Logs');
    const logFiles = fs.readdirSync(activityLogsPath).filter(f => f.endsWith('.csv'));

    for (const file of logFiles) {
      await importParticipantStatusLogs(path.join(activityLogsPath, file));
    }

    console.log('\n=== Import Complete ===');
  } catch (error) {
    console.error('Import error:', error);
    process.exit(1);
  }
}

main();
