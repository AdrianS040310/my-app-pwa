import { openDB, type DBSchema, type IDBPDatabase } from 'idb';

// Define the schema for our database
interface StudentActivityDB extends DBSchema {
  activities: {
    key: number;
    value: {
      id?: number;
      name: string;
      activity: string;
      timestamp: number;
    };
    indexes: { 'by-timestamp': number };
  };
}

// Database configuration
const DB_NAME = 'StudentActivityDB';
const DB_VERSION = 1;
const STORE_NAME = 'activities';

let db: IDBPDatabase<StudentActivityDB> | null = null;

/**
 * Initialize the IndexedDB database
 */
export const initDB = async (): Promise<IDBPDatabase<StudentActivityDB>> => {
  if (db) {
    return db;
  }

  try {
    db = await openDB<StudentActivityDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Create object store if it doesn't exist
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, {
            keyPath: 'id',
            autoIncrement: true,
          });

          // Create index for timestamp-based queries
          store.createIndex('by-timestamp', 'timestamp');
        }
      },
    });

    console.log('IndexedDB initialized successfully');
    return db;
  } catch (error) {
    console.error('Failed to initialize IndexedDB:', error);
    throw error;
  }
};

/**
 * Add a new entry to the database
 */
export const addEntry = async (entry: {
  name: string;
  activity: string;
}): Promise<number> => {
  try {
    const database = await initDB();
    const timestamp = Date.now();

    const newEntry = {
      ...entry,
      timestamp,
    };

    const id = await database.add(STORE_NAME, newEntry);
    console.log('Entry added successfully with ID:', id);
    return id;
  } catch (error) {
    console.error('Failed to add entry:', error);
    throw error;
  }
};

/**
 * Get all entries from the database
 */
export const getAllEntries = async (): Promise<
  Array<{
    id: number;
    name: string;
    activity: string;
    timestamp: number;
  }>
> => {
  try {
    const database = await initDB();
    const entries = await database.getAll(STORE_NAME);

    // Sort by timestamp (newest first) and filter out entries without ID
    return entries
      .filter(
        (entry): entry is typeof entry & { id: number } =>
          entry.id !== undefined
      )
      .sort((a, b) => b.timestamp - a.timestamp);
  } catch (error) {
    console.error('Failed to get entries:', error);
    throw error;
  }
};

/**
 * Delete an entry by ID
 */
export const deleteEntry = async (id: number): Promise<void> => {
  try {
    const database = await initDB();
    await database.delete(STORE_NAME, id);
    console.log('Entry deleted successfully');
  } catch (error) {
    console.error('Failed to delete entry:', error);
    throw error;
  }
};

/**
 * Clear all entries from the database
 */
export const clearAllEntries = async (): Promise<void> => {
  try {
    const database = await initDB();
    await database.clear(STORE_NAME);
    console.log('All entries cleared successfully');
  } catch (error) {
    console.error('Failed to clear entries:', error);
    throw error;
  }
};
