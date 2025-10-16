// Native IndexedDB implementation as fallback
interface ActivityEntry {
  id?: number;
  name: string;
  activity: string;
  timestamp: number;
}

const DB_NAME = 'StudentActivityDB';
const DB_VERSION = 2;
const STORE_NAME = 'activities';
const SYNC_STORE_NAME = 'sync-entries';

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

      // Create activities object store if it doesn't exist
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        const store = database.createObjectStore(STORE_NAME, {
          keyPath: 'id',
          autoIncrement: true,
        });

        // Create index for timestamp-based queries
        store.createIndex('by-timestamp', 'timestamp');
      }

      // Create sync-entries object store if it doesn't exist
      if (!database.objectStoreNames.contains(SYNC_STORE_NAME)) {
        const syncStore = database.createObjectStore(SYNC_STORE_NAME, {
          keyPath: 'id',
          autoIncrement: true,
        });

        // Create index for timestamp-based queries
        syncStore.createIndex('by-timestamp', 'timestamp');
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

/**
 * Add entry to sync queue for background sync
 */
export const addToSyncQueue = async (entry: {
  name: string;
  activity: string;
  timestamp: number;
}): Promise<number> => {
  try {
    const database = await initDB();

    return new Promise((resolve, reject) => {
      const transaction = database.transaction([SYNC_STORE_NAME], 'readwrite');
      const store = transaction.objectStore(SYNC_STORE_NAME);
      const request = store.add(entry);

      request.onsuccess = () => {
        const id = request.result as number;
        console.log('Entry added to sync queue with ID:', id);
        resolve(id);
      };

      request.onerror = () => {
        console.error('Failed to add entry to sync queue:', request.error);
        reject(request.error);
      };
    });
  } catch (error) {
    console.error('Failed to add entry to sync queue:', error);
    throw error;
  }
};

/**
 * Get all pending sync entries
 */
export const getPendingSyncEntries = async (): Promise<ActivityEntry[]> => {
  try {
    const database = await initDB();

    return new Promise((resolve, reject) => {
      const transaction = database.transaction([SYNC_STORE_NAME], 'readonly');
      const store = transaction.objectStore(SYNC_STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        const entries = request.result as ActivityEntry[];
        // Sort by timestamp (oldest first for sync)
        const sortedEntries = entries.sort((a, b) => a.timestamp - b.timestamp);
        resolve(sortedEntries);
      };

      request.onerror = () => {
        console.error('Failed to get pending sync entries:', request.error);
        reject(request.error);
      };
    });
  } catch (error) {
    console.error('Failed to get pending sync entries:', error);
    throw error;
  }
};

/**
 * Remove entry from sync queue after successful sync
 */
export const removeFromSyncQueue = async (id: number): Promise<void> => {
  try {
    const database = await initDB();

    return new Promise((resolve, reject) => {
      const transaction = database.transaction([SYNC_STORE_NAME], 'readwrite');
      const store = transaction.objectStore(SYNC_STORE_NAME);
      const request = store.delete(id);

      request.onsuccess = () => {
        console.log('Entry removed from sync queue successfully');
        resolve();
      };

      request.onerror = () => {
        console.error('Failed to remove entry from sync queue:', request.error);
        reject(request.error);
      };
    });
  } catch (error) {
    console.error('Failed to remove entry from sync queue:', error);
    throw error;
  }
};

/**
 * Send a single entry to the server
 */
export const sendToServer = async (entry: {
  name: string;
  activity: string;
  timestamp: number;
}): Promise<void> => {
  try {
    console.log('🔄 Sending entry to server:', entry);

    const serverData = {
      name: entry.name,
      note: entry.activity,
      createdAt: Math.floor(entry.timestamp / 1000), // Convert to Unix timestamp
    };

    const response = await fetch(
      'https://68efdc0eb06cc802829ef743.mockapi.io/api/v1/entries',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(serverData),
      }
    );

    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }

    const serverEntry = await response.json();
    console.log('✅ Entry sent to server successfully:', serverEntry);

    // Update the local entry with the server ID
    const localEntries = await getAllEntries();
    const entryToUpdate = localEntries.find(
      (e) =>
        e.name === entry.name &&
        e.activity === entry.activity &&
        Math.abs(e.timestamp - entry.timestamp) < 1000 // Within 1 second
    );

    if (entryToUpdate) {
      await updateEntryWithServerId(entryToUpdate.id!, serverEntry.id);
      console.log('✅ Local entry updated with server ID:', serverEntry.id);
    }
  } catch (error) {
    console.error('❌ Failed to send entry to server:', error);
    throw error;
  }
};

/**
 * Update a local entry with server ID
 */
const updateEntryWithServerId = async (
  localId: number,
  serverId: number
): Promise<void> => {
  try {
    const database = await initDB();

    return new Promise((resolve, reject) => {
      const transaction = database.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);

      // Get the entry first
      const getRequest = store.get(localId);

      getRequest.onsuccess = () => {
        const entry = getRequest.result;
        if (entry) {
          // Update with server ID
          entry.id = serverId;

          // Delete the old entry and add with new ID
          const deleteRequest = store.delete(localId);

          deleteRequest.onsuccess = () => {
            const addRequest = store.add(entry);

            addRequest.onsuccess = () => {
              console.log('Entry updated with server ID successfully');
              resolve();
            };

            addRequest.onerror = () => {
              console.error('Failed to add updated entry:', addRequest.error);
              reject(addRequest.error);
            };
          };

          deleteRequest.onerror = () => {
            console.error('Failed to delete old entry:', deleteRequest.error);
            reject(deleteRequest.error);
          };
        } else {
          reject(new Error('Entry not found'));
        }
      };

      getRequest.onerror = () => {
        console.error('Failed to get entry for update:', getRequest.error);
        reject(getRequest.error);
      };
    });
  } catch (error) {
    console.error('Failed to update entry with server ID:', error);
    throw error;
  }
};

/**
 * Delete an entry from the server
 */
export const deleteFromServer = async (serverId: number): Promise<void> => {
  try {
    console.log('🔄 Deleting entry from server:', serverId);

    const response = await fetch(
      `https://68efdc0eb06cc802829ef743.mockapi.io/api/v1/entries/${serverId}`,
      {
        method: 'DELETE',
      }
    );

    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }

    console.log('✅ Entry deleted from server successfully');
  } catch (error) {
    console.error('❌ Failed to delete entry from server:', error);
    throw error;
  }
};

/**
 * Add entry deletion to sync queue for offline deletion
 */
export const addDeletionToSyncQueue = async (
  serverId: number
): Promise<number> => {
  try {
    const database = await initDB();

    return new Promise((resolve, reject) => {
      const transaction = database.transaction([SYNC_STORE_NAME], 'readwrite');
      const store = transaction.objectStore(SYNC_STORE_NAME);

      const deletionEntry = {
        type: 'delete',
        serverId: serverId,
        timestamp: Date.now(),
      };

      const request = store.add(deletionEntry);

      request.onsuccess = () => {
        const id = request.result as number;
        console.log('Deletion added to sync queue with ID:', id);
        resolve(id);
      };

      request.onerror = () => {
        console.error('Failed to add deletion to sync queue:', request.error);
        reject(request.error);
      };
    });
  } catch (error) {
    console.error('Failed to add deletion to sync queue:', error);
    throw error;
  }
};

/**
 * Fetch entries from server and merge with local data
 */
export const syncFromServer = async (): Promise<ActivityEntry[]> => {
  try {
    console.log('🔄 Fetching entries from server...');

    const response = await fetch(
      'https://68efdc0eb06cc802829ef743.mockapi.io/api/v1/entries'
    );

    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }

    const serverEntries = await response.json();
    console.log('📊 Server entries received:', serverEntries);

    // Convert server entries to local format
    const convertedEntries: ActivityEntry[] = serverEntries.map(
      (serverEntry: any) => ({
        id: serverEntry.id,
        name: serverEntry.name,
        activity: serverEntry.note,
        timestamp: serverEntry.createdAt * 1000, // Convert Unix timestamp to milliseconds
      })
    );

    // Get existing local entries
    const localEntries = await getAllEntries();
    console.log('📊 Local entries:', localEntries);

    // Merge entries (server entries take precedence for conflicts)
    const mergedEntries = mergeEntries(localEntries, convertedEntries);
    console.log('📊 Merged entries:', mergedEntries);

    // Clear local storage and add merged entries preserving original IDs
    await clearAllEntries();

    // Add merged entries back to local storage preserving their IDs
    await addMergedEntries(mergedEntries);

    console.log('✅ Successfully synced from server');
    return mergedEntries;
  } catch (error) {
    console.error('❌ Failed to sync from server:', error);
    // Return local entries if server sync fails
    return getAllEntries();
  }
};

/**
 * Add merged entries to database preserving their original IDs
 */
const addMergedEntries = async (entries: ActivityEntry[]): Promise<void> => {
  try {
    const database = await initDB();

    return new Promise((resolve) => {
      const transaction = database.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);

      let completed = 0;
      const total = entries.length;

      if (total === 0) {
        resolve();
        return;
      }

      entries.forEach((entry) => {
        // Use the original entry with its ID preserved
        const entryToAdd = {
          id: entry.id, // Preserve original ID
          name: entry.name,
          activity: entry.activity,
          timestamp: entry.timestamp,
        };

        const request = store.add(entryToAdd);

        request.onsuccess = () => {
          completed++;
          if (completed === total) {
            console.log(`✅ Successfully added ${total} merged entries`);
            resolve();
          }
        };

        request.onerror = () => {
          console.error('Failed to add merged entry:', request.error);
          completed++;
          if (completed === total) {
            resolve(); // Still resolve to continue with other entries
          }
        };
      });
    });
  } catch (error) {
    console.error('Failed to add merged entries:', error);
    throw error;
  }
};

/**
 * Merge local and server entries, giving priority to server data
 */
const mergeEntries = (
  localEntries: ActivityEntry[],
  serverEntries: ActivityEntry[]
): ActivityEntry[] => {
  const merged = new Map<number, ActivityEntry>();

  // Add local entries first (including those without server IDs)
  localEntries.forEach((entry, index) => {
    if (entry.id) {
      merged.set(entry.id, entry);
    } else {
      // For local entries without ID, use a temporary negative ID
      merged.set(-(index + 1), entry);
    }
  });

  // Override with server entries (server data takes precedence)
  serverEntries.forEach((entry) => {
    if (entry.id) {
      merged.set(entry.id, entry);
    }
  });

  // Convert back to array and sort by timestamp
  return Array.from(merged.values()).sort((a, b) => b.timestamp - a.timestamp);
};
