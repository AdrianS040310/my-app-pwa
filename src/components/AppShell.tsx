import React, { useState, useEffect } from 'react';
import SplashScreen from './SplashScreen';
import HomeScreen from './HomeScreen';
import './AppShell.css';

const AppShell: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAppReady, setIsAppReady] = useState(false);

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

  // Registrar Service Worker si está disponible
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((registration) => {
            console.log('SW registered: ', registration);
          })
          .catch((registrationError) => {
            console.log('SW registration failed: ', registrationError);
          });
      });
    }
  }, []);

  return (
    <div className="app-shell">
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
