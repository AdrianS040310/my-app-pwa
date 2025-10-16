import React, { useState, useEffect } from 'react';
import {
  addEntry,
  getAllEntries,
  deleteEntry,
  initDB,
  addToSyncQueue,
  syncFromServer,
  sendToServer,
  deleteFromServer,
  addDeletionToSyncQueue,
} from '../db/indexedDB-native';
import './OfflineForm.css';

interface ServiceWorkerWithSync extends ServiceWorkerRegistration {
  sync: {
    register(tag: string): Promise<void>;
  };
}

interface ActivityEntry {
  id?: number;
  name: string;
  activity: string;
  timestamp: number;
}

const OfflineForm: React.FC = () => {
  const [name, setName] = useState('');
  const [activity, setActivity] = useState('');
  const [entries, setEntries] = useState<ActivityEntry[]>([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [swRegistration, setSwRegistration] =
    useState<ServiceWorkerWithSync | null>(null);

  useEffect(() => {
    const initializeData = async () => {
      setIsLoading(true);
      try {
        await initDB();

        // Get service worker registration for background sync
        if (
          'serviceWorker' in navigator &&
          'sync' in window.ServiceWorkerRegistration.prototype
        ) {
          const registration = await navigator.serviceWorker.ready;
          setSwRegistration(registration as ServiceWorkerWithSync);
          console.log(
            'Service Worker registration obtained for background sync'
          );
        } else {
          console.log('Background Sync not supported');
        }

        // Try to sync from server if online, otherwise load local data
        if (navigator.onLine) {
          setIsSyncing(true);
          try {
            console.log('🔄 App opened - syncing from server...');
            const syncedEntries = await syncFromServer();
            setEntries(syncedEntries);
            console.log('✅ Successfully loaded data from server');
          } catch (error) {
            console.error(
              '❌ Failed to sync from server, loading local data:',
              error
            );
            const localEntries = await getAllEntries();
            setEntries(localEntries);
          } finally {
            setIsSyncing(false);
          }
        } else {
          console.log('📱 App opened offline - loading local data');
          const localEntries = await getAllEntries();
          setEntries(localEntries);
        }
      } catch (error) {
        console.error('Failed to initialize data:', error);
        // Fallback to local data
        try {
          const localEntries = await getAllEntries();
          setEntries(localEntries);
        } catch (fallbackError) {
          console.error('Failed to load local data:', fallbackError);
        }
      } finally {
        setIsLoading(false);
      }
    };

    initializeData();
  }, []);

  // Listen for online/offline events and auto-sync when online
  useEffect(() => {
    const handleOnline = async () => {
      setIsOnline(true);
      console.log('App is now online');

      // Sync from server when coming back online
      setIsSyncing(true);
      try {
        console.log('🔄 Connection restored - syncing from server...');
        const syncedEntries = await syncFromServer();
        setEntries(syncedEntries);
        console.log('✅ Successfully synced from server after reconnection');
      } catch (error) {
        console.error(
          '❌ Failed to sync from server after reconnection:',
          error
        );
      } finally {
        setIsSyncing(false);
      }

      // Trigger background sync for pending entries
      if (swRegistration) {
        swRegistration.sync
          .register('sync-entries')
          .then(() => {
            console.log('Auto-sync triggered when coming back online');
          })
          .catch((error) => {
            console.error('Failed to trigger auto-sync:', error);
          });
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      console.log('App is now offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [swRegistration]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !activity.trim()) {
      alert('Por favor, completa todos los campos');
      return;
    }

    setIsSubmitting(true);

    try {
      const id = await addEntry({
        name: name.trim(),
        activity: activity.trim(),
      });

      // Add the new entry to the local state
      const newEntry: ActivityEntry = {
        id: id as number,
        name: name.trim(),
        activity: activity.trim(),
        timestamp: Date.now(),
      };

      setEntries((prevEntries) => [newEntry, ...prevEntries]);

      // Handle sync based on connection status
      if (isOnline) {
        // If online, send immediately to server
        try {
          await sendToServer({
            name: name.trim(),
            activity: activity.trim(),
            timestamp: Date.now(),
          });
          console.log('Entry sent to server immediately');
        } catch (serverError) {
          console.error(
            'Failed to send to server, adding to sync queue:',
            serverError
          );
          // If server fails, add to sync queue as fallback
          if (swRegistration) {
            try {
              await addToSyncQueue({
                name: name.trim(),
                activity: activity.trim(),
                timestamp: Date.now(),
              });
              await swRegistration.sync.register('sync-entries');
              console.log('Entry added to sync queue as fallback');
            } catch (syncError) {
              console.error('Failed to add to sync queue:', syncError);
            }
          }
        }
      } else {
        // If offline, add to sync queue and register background sync
        if (swRegistration) {
          try {
            await addToSyncQueue({
              name: name.trim(),
              activity: activity.trim(),
              timestamp: Date.now(),
            });

            await swRegistration.sync.register('sync-entries');
            console.log('Background sync registered for offline entry');
          } catch (syncError) {
            console.error('Failed to register background sync:', syncError);
          }
        }
      }

      // Clear form
      setName('');
      setActivity('');

      console.log('Entry saved successfully');
    } catch (error) {
      console.error('Failed to save entry:', error);
      alert('Error al guardar la entrada. Por favor, inténtalo de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle entry deletion
  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta entrada?')) {
      return;
    }

    setDeletingId(id);

    try {
      // Find the entry to get its server ID
      const entryToDelete = entries.find((entry) => entry.id === id);
      if (!entryToDelete) {
        throw new Error('Entry not found');
      }

      // Delete from local storage first
      await deleteEntry(id);
      setEntries((prevEntries) =>
        prevEntries.filter((entry) => entry.id !== id)
      );

      // Handle server deletion based on connection status
      if (isOnline && entryToDelete.id && entryToDelete.id > 0) {
        // If online and has server ID, delete from server immediately
        try {
          await deleteFromServer(entryToDelete.id);
          console.log('Entry deleted from server successfully');
        } catch (serverError) {
          console.error(
            'Failed to delete from server, adding to sync queue:',
            serverError
          );
          // If server deletion fails, add to sync queue as fallback
          if (swRegistration) {
            try {
              await addDeletionToSyncQueue(entryToDelete.id);
              await swRegistration.sync.register('sync-entries');
              console.log('Deletion added to sync queue as fallback');
            } catch (syncError) {
              console.error('Failed to add deletion to sync queue:', syncError);
            }
          }
        }
      } else if (!isOnline && entryToDelete.id && entryToDelete.id > 0) {
        // If offline and has server ID, add deletion to sync queue
        if (swRegistration) {
          try {
            await addDeletionToSyncQueue(entryToDelete.id);
            await swRegistration.sync.register('sync-entries');
            console.log('Deletion added to sync queue for offline entry');
          } catch (syncError) {
            console.error('Failed to add deletion to sync queue:', syncError);
          }
        }
      }

      console.log('Entry deleted successfully');
    } catch (error) {
      console.error('Failed to delete entry:', error);
      alert('Error al eliminar la entrada. Por favor, inténtalo de nuevo.');
    } finally {
      setDeletingId(null);
    }
  };

  // Format timestamp for display
  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="offline-form-container">
      {/* Online/Offline Status Indicator */}
      <div className={`status-indicator ${isOnline ? 'online' : 'offline'}`}>
        <div className="status-dot"></div>
        <span className="status-text">
          {isOnline ? '🟢 Online' : '🔴 Offline'}
        </span>
        {!isOnline && (
          <span className="offline-message">
            - Los datos se guardan localmente y se sincronizarán automáticamente
            cuando haya conexión
          </span>
        )}
        {isOnline && (
          <span className="online-message">
            {isSyncing
              ? '🔄 Sincronizando con el servidor...'
              : '- Conectado. La sincronización es automática.'}
          </span>
        )}
      </div>

      {/* Form Section */}
      <div className="form-section">
        <h2 className="form-title">Reporte de Actividades del Alumno</h2>
        <p className="form-description">
          Registra las actividades realizadas. Los datos se guardan localmente y
          persisten incluso sin conexión a internet.
        </p>

        <form onSubmit={handleSubmit} className="activity-form">
          <div className="form-group">
            <label htmlFor="name" className="form-label">
              Nombre del Alumno
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="form-input"
              placeholder="Ingresa el nombre del alumno"
              disabled={isSubmitting}
            />
          </div>

          <div className="form-group">
            <label htmlFor="activity" className="form-label">
              Actividad Realizada
            </label>
            <textarea
              id="activity"
              value={activity}
              onChange={(e) => setActivity(e.target.value)}
              className="form-textarea"
              placeholder="Describe la actividad realizada"
              rows={3}
              disabled={isSubmitting}
            />
          </div>

          <button
            type="submit"
            className="submit-button"
            disabled={isSubmitting || !name.trim() || !activity.trim()}
          >
            {isSubmitting
              ? isOnline
                ? 'Enviando al servidor...'
                : 'Guardando localmente...'
              : 'Guardar Actividad'}
          </button>
        </form>
      </div>

      {/* Entries List Section */}
      <div className="entries-section">
        <div className="entries-header">
          <h3 className="entries-title">
            Actividades Registradas ({entries.length})
          </h3>
        </div>

        {isLoading || isSyncing ? (
          <div className="loading-message">
            {isSyncing
              ? '🔄 Sincronizando con el servidor...'
              : 'Cargando actividades...'}
          </div>
        ) : entries.length === 0 ? (
          <div className="empty-message">
            No hay actividades registradas aún. ¡Agrega la primera!
          </div>
        ) : (
          <div className="entries-list">
            {entries.map((entry) => (
              <div key={entry.id} className="entry-card">
                <div className="entry-header">
                  <h4 className="entry-name">{entry.name}</h4>
                  <span className="entry-timestamp">
                    {formatTimestamp(entry.timestamp)}
                  </span>
                </div>
                <p className="entry-activity">{entry.activity}</p>
                <button
                  onClick={() => handleDelete(entry.id!)}
                  className="delete-button"
                  title="Eliminar entrada"
                  disabled={deletingId === entry.id}
                >
                  {deletingId === entry.id ? '⏳' : '🗑️'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default OfflineForm;
