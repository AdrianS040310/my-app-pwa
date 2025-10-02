import { useEffect, useState } from 'react';

interface ServiceWorkerState {
  isSupported: boolean;
  isRegistered: boolean;
  isUpdateAvailable: boolean;
  isOffline: boolean;
  registration: ServiceWorkerRegistration | null;
}

export const useServiceWorker = () => {
  const [swState, setSwState] = useState<ServiceWorkerState>({
    isSupported: 'serviceWorker' in navigator,
    isRegistered: false,
    isUpdateAvailable: false,
    isOffline: !navigator.onLine,
    registration: null,
  });

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const registerServiceWorker = async () => {
      if (!swState.isSupported) {
        console.log('[SW Hook] Service Workers no soportados');
        return;
      }

      try {
        console.log('[SW Hook] Registrando Service Worker...');

        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
          updateViaCache: 'none', // Evitar cache del SW file
        });

        setSwState((prev) => ({
          ...prev,
          isRegistered: true,
          registration,
        }));

        console.log('[SW Hook] Service Worker registrado:', registration);

        // Manejar actualizaciones
        const handleUpdateFound = () => {
          const newWorker = registration.installing;
          if (newWorker) {
            console.log('[SW Hook] Nueva versión encontrada');

            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed') {
                if (navigator.serviceWorker.controller) {
                  // Hay un SW anterior, nueva versión disponible
                  console.log('[SW Hook] Nueva versión disponible');
                  setSwState((prev) => ({ ...prev, isUpdateAvailable: true }));
                } else {
                  // Primera instalación
                  console.log(
                    '[SW Hook] Service Worker instalado por primera vez'
                  );
                }
              }
            });
          }
        };

        registration.addEventListener('updatefound', handleUpdateFound);

        // Verificar si hay actualización esperando
        if (registration.waiting) {
          setSwState((prev) => ({ ...prev, isUpdateAvailable: true }));
        }

        // Manejar cambios de controlador
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          console.log('[SW Hook] Nuevo SW tomó control');
          window.location.reload();
        });

        // Verificar actualizaciones periódicamente
        setInterval(() => {
          registration.update();
        }, 60000); // Cada minuto
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Error desconocido';
        console.error('[SW Hook] Error registrando SW:', errorMessage);
        setError(errorMessage);
      }
    };

    // Manejar estado online/offline
    const handleOnline = () =>
      setSwState((prev) => ({ ...prev, isOffline: false }));
    const handleOffline = () =>
      setSwState((prev) => ({ ...prev, isOffline: true }));

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Registrar SW cuando la página esté lista
    if (document.readyState === 'loading') {
      window.addEventListener('load', registerServiceWorker);
    } else {
      registerServiceWorker();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('load', registerServiceWorker);
    };
  }, [swState.isSupported]);

  // Función para forzar actualización del SW
  const updateServiceWorker = () => {
    if (swState.registration?.waiting) {
      swState.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      setSwState((prev) => ({ ...prev, isUpdateAvailable: false }));
    }
  };

  // Función para obtener información del cache
  const getCacheInfo = async (): Promise<{
    size: number;
    caches: string[];
  }> => {
    if (!swState.isSupported) {
      return { size: 0, caches: [] };
    }

    try {
      const cacheNames = await caches.keys();
      let totalSize = 0;

      for (const cacheName of cacheNames) {
        const cache = await caches.open(cacheName);
        const requests = await cache.keys();
        totalSize += requests.length;
      }

      return {
        size: totalSize,
        caches: cacheNames,
      };
    } catch (err) {
      console.error('[SW Hook] Error obteniendo info del cache:', err);
      return { size: 0, caches: [] };
    }
  };

  // Función para limpiar todos los caches
  const clearAllCaches = async (): Promise<boolean> => {
    if (!swState.isSupported) {
      return false;
    }

    try {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map((cacheName) => caches.delete(cacheName))
      );
      console.log('[SW Hook] Todos los caches eliminados');
      return true;
    } catch (err) {
      console.error('[SW Hook] Error limpiando caches:', err);
      return false;
    }
  };

  return {
    ...swState,
    error,
    updateServiceWorker,
    getCacheInfo,
    clearAllCaches,
  };
};
