import React, { useState, useEffect } from 'react';
import SplashScreen from './SplashScreen';
import HomeScreen from './HomeScreen';
import ServiceWorkerStatus from './ServiceWorkerStatus';
import { useServiceWorker } from '../hooks/useServiceWorker';
import './AppShell.css';

const AppShell: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAppReady, setIsAppReady] = useState(false);

  // Usar hook personalizado para Service Worker
  const {
    isRegistered,
    isUpdateAvailable,
    isOffline,
    error: swError,
  } = useServiceWorker();

  useEffect(() => {
    // Simular carga de recursos críticos
    const initializeApp = async () => {
      try {
        // Simular carga de datos críticos
        await new Promise((resolve) => setTimeout(resolve, 2000));

        // Marcar app como lista
        setIsAppReady(true);

        // Esperar un poco más para mostrar el splash screen
        await new Promise((resolve) => setTimeout(resolve, 500));

        setIsLoading(false);
      } catch (error) {
        console.error('Error initializing app:', error);
        setIsLoading(false);
      }
    };

    initializeApp();
  }, []);

  // Mostrar información del Service Worker en la consola
  useEffect(() => {
    if (isRegistered) {
      console.log('[APP] Service Worker registrado correctamente');
    }
    if (swError) {
      console.error('[APP] Error del Service Worker:', swError);
    }
    if (isOffline) {
      console.log('[APP] Aplicación funcionando offline');
    }
    if (isUpdateAvailable) {
      console.log('[APP] Actualización disponible');
    }
  }, [isRegistered, swError, isOffline, isUpdateAvailable]);

  return (
    <div className="app-shell">
      <ServiceWorkerStatus />
      <SplashScreen isVisible={isLoading} />
      {isAppReady && !isLoading && (
        <div className="app-content">
          <HomeScreen />
        </div>
      )}
    </div>
  );
};

export default AppShell;
