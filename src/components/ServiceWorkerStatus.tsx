import React from 'react';
import { useServiceWorker } from '../hooks/useServiceWorker';
import './ServiceWorkerStatus.css';

const ServiceWorkerStatus: React.FC = () => {
  const {
    isSupported,
    isRegistered,
    isUpdateAvailable,
    isOffline,
    error,
    updateServiceWorker,
  } = useServiceWorker();

  if (!isSupported) {
    return (
      <div className="sw-status warning">
        <span>Service Workers no soportados en este navegador</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="sw-status error">
        <span>Error del Service Worker: {error}</span>
      </div>
    );
  }

  return (
    <div className="sw-status-container">
      {/* Indicador de estado offline */}
      {isOffline && (
        <div className="sw-status offline">
          <span>Modo Offline - Usando contenido cacheado</span>
        </div>
      )}

      {/* Notificación de actualización disponible */}
      {isUpdateAvailable && (
        <div className="sw-status update-available">
          <span>Nueva versión disponible</span>
          <button onClick={updateServiceWorker} className="update-button">
            Actualizar
          </button>
        </div>
      )}

      {/* Estado de registro (solo para desarrollo) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="sw-status info">
          <span>{isRegistered ? 'SW Registrado' : 'Registrando SW...'}</span>
        </div>
      )}
    </div>
  );
};

export default ServiceWorkerStatus;
