import React, { useState, useEffect } from 'react';
import {
  addEntry,
  getAllEntries,
  deleteEntry,
  initDB,
} from '../db/indexedDB-native';
import './OfflineForm.css';

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

  useEffect(() => {
    const initializeData = async () => {
      setIsLoading(true);
      try {
        await initDB();
        const allEntries = await getAllEntries();
        setEntries(allEntries);
      } catch (error) {
        console.error('Failed to initialize data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeData();
  }, []);

  // Listen for online/offline events
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      console.log('App is now online');
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
  }, []);

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

    try {
      await deleteEntry(id);
      setEntries((prevEntries) =>
        prevEntries.filter((entry) => entry.id !== id)
      );
      console.log('Entry deleted successfully');
    } catch (error) {
      console.error('Failed to delete entry:', error);
      alert('Error al eliminar la entrada. Por favor, inténtalo de nuevo.');
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
            - Los datos se guardan localmente
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
            {isSubmitting ? 'Guardando...' : 'Guardar Actividad'}
          </button>
        </form>
      </div>

      {/* Entries List Section */}
      <div className="entries-section">
        <h3 className="entries-title">
          Actividades Registradas ({entries.length})
        </h3>

        {isLoading ? (
          <div className="loading-message">Cargando actividades...</div>
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
                >
                  🗑️
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
