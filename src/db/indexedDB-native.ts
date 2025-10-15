// Native IndexedDB implementation as fallback
interface ActivityEntry {
  id?: number;
  name: string;
  activity: string;
  timestamp: number;
}

const DB_NAME = 'StudentActivityDB';
const DB_VERSION = 1;
const STORE_NAME = 'activities';

let db: IDBDatabase | null = null;

/**
 * Initialize the IndexedDB database using native API
 */
export const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (db) {
      resolve(db);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('Failed to open IndexedDB:', request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      db = request.result;
      console.log('IndexedDB initialized successfully');
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result;

      // Create object store if it doesn't exist
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        const store = database.createObjectStore(STORE_NAME, {
          keyPath: 'id',
          autoIncrement: true,
        });

        // Create index for timestamp-based queries
        store.createIndex('by-timestamp', 'timestamp');
      }
    };
  });
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

    const newEntry: ActivityEntry = {
      ...entry,
      timestamp,
    };

    return new Promise((resolve, reject) => {
      const transaction = database.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.add(newEntry);

      request.onsuccess = () => {
        const id = request.result as number;
        console.log('Entry added successfully with ID:', id);
        resolve(id);
      };

      request.onerror = () => {
        console.error('Failed to add entry:', request.error);
        reject(request.error);
      };
    });
  } catch (error) {
    console.error('Failed to add entry:', error);
    throw error;
  }
};

/**
 * Get all entries from the database
 */
export const getAllEntries = async (): Promise<ActivityEntry[]> => {
  try {
    const database = await initDB();

    return new Promise((resolve, reject) => {
      const transaction = database.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        const entries = request.result as ActivityEntry[];
        // Sort by timestamp (newest first)
        const sortedEntries = entries.sort((a, b) => b.timestamp - a.timestamp);
        resolve(sortedEntries);
      };

      request.onerror = () => {
        console.error('Failed to get entries:', request.error);
        reject(request.error);
      };
    });
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

    return new Promise((resolve, reject) => {
      const transaction = database.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);

      request.onsuccess = () => {
        console.log('Entry deleted successfully');
        resolve();
      };

      request.onerror = () => {
        console.error('Failed to delete entry:', request.error);
        reject(request.error);
      };
    });
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

    return new Promise((resolve, reject) => {
      const transaction = database.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();

      request.onsuccess = () => {
        console.log('All entries cleared successfully');
        resolve();
      };

      request.onerror = () => {
        console.error('Failed to clear entries:', request.error);
        reject(request.error);
      };
    });
  } catch (error) {
    console.error('Failed to clear entries:', error);
    throw error;
  }
};
