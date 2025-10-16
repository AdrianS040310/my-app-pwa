import { useState, useEffect, useCallback } from 'react';
import { getToken, onMessage, type MessagePayload } from 'firebase/messaging';

export interface NotificationState {
  isSupported: boolean;
  permission: NotificationPermission;
  token: string | null;
  error: string | null;
  isRegistered: boolean;
}

export interface NotificationData {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  data?: Record<string, unknown>;
}

export const useFirebaseMessaging = () => {
  const [notificationState, setNotificationState] = useState<NotificationState>(
    {
      isSupported: false,
      permission: 'default',
      token: null,
      error: null,
      isRegistered: false,
    }
  );

  // Lazy import of Firebase config
  const getFirebaseConfig = async () => {
    const { messaging, VAPID_KEY } = await import('../firebase/config');
    return { messaging, VAPID_KEY };
  };

  // Verificar soporte de notificaciones
  useEffect(() => {
    const checkSupport = () => {
      const isSupported =
        'Notification' in window &&
        'serviceWorker' in navigator &&
        'PushManager' in window;

      setNotificationState((prev) => ({
        ...prev,
        isSupported,
        permission: isSupported ? Notification.permission : 'denied',
      }));
    };

    checkSupport();
  }, []);

  // Solicitar permisos de notificación
  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      if (!notificationState.isSupported) {
        throw new Error(
          'Las notificaciones no son compatibles con este navegador'
        );
      }

      const permission = await Notification.requestPermission();

      setNotificationState((prev) => ({
        ...prev,
        permission,
        error: null,
      }));

      return permission === 'granted';
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Error al solicitar permisos';
      setNotificationState((prev) => ({
        ...prev,
        error: errorMessage,
      }));
      return false;
    }
  }, [notificationState.isSupported]);

  // Obtener token FCM
  const getFCMToken = useCallback(async (): Promise<string | null> => {
    try {
      if (
        !notificationState.isSupported ||
        notificationState.permission !== 'granted'
      ) {
        throw new Error('Permisos de notificación no otorgados');
      }

      // Verificar que el service worker esté registrado
      if (!('serviceWorker' in navigator)) {
        throw new Error('Service Worker no soportado');
      }

      // Verificar que el service worker de Firebase messaging esté registrado
      const swRegistration = await navigator.serviceWorker.getRegistration(
        '/firebase-messaging-sw.js'
      );
      if (!swRegistration) {
        throw new Error('Service Worker de Firebase messaging no encontrado');
      }

      // Import Firebase config dynamically
      const { messaging, VAPID_KEY } = await getFirebaseConfig();

      // Verificar que la VAPID key esté configurada
      if (!VAPID_KEY) {
        throw new Error(
          'VAPID key no configurada. Ve a Firebase Console > Project Settings > Cloud Messaging para obtener tu VAPID key real'
        );
      }

      console.log('Intentando obtener token FCM con:', {
        hasMessaging: !!messaging,
        hasVapidKey: !!VAPID_KEY,
        vapidKeyLength: VAPID_KEY?.length,
        serviceWorkerRegistered: !!swRegistration,
      });

      const token = await getToken(messaging, {
        vapidKey: VAPID_KEY,
        serviceWorkerRegistration: swRegistration,
      });

      if (token) {
        console.log('FCM Token obtenido:', token);
        setNotificationState((prev) => ({
          ...prev,
          token,
          isRegistered: true,
          error: null,
        }));
        return token;
      } else {
        throw new Error('No se pudo obtener el token FCM');
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Error al obtener token FCM';
      console.error('Error obteniendo FCM token:', error);
      setNotificationState((prev) => ({
        ...prev,
        error: errorMessage,
        isRegistered: false,
      }));
      return null;
    }
  }, [notificationState.isSupported, notificationState.permission]);

  // Configurar listener para mensajes en primer plano
  const setupForegroundListener = useCallback(async () => {
    if (!notificationState.isSupported) return;

    const { messaging } = await getFirebaseConfig();
    const unsubscribe = onMessage(messaging, (payload: MessagePayload) => {
      console.log('Mensaje recibido en primer plano:', payload);

      // Mostrar notificación manualmente cuando la app está en primer plano
      if (Notification.permission === 'granted') {
        const notificationTitle =
          payload.notification?.title || 'Nueva notificación';
        const notificationOptions = {
          body: payload.notification?.body || 'Tienes una nueva notificación',
          icon: payload.notification?.icon || '/icons/MyPWA-144x144.webp',
          badge: '/icons/MyPWA-74x74.webp',
          tag: 'foreground-notification',
          requireInteraction: true,
          data: payload.data,
        };

        const notification = new Notification(
          notificationTitle,
          notificationOptions
        );

        notification.onclick = () => {
          window.focus();
          notification.close();
        };
      }
    });

    return unsubscribe;
  }, [notificationState.isSupported]);

  // Registrar para notificaciones push
  const registerForNotifications = useCallback(async (): Promise<
    string | null
  > => {
    try {
      // 1. Solicitar permisos
      const hasPermission = await requestPermission();
      if (!hasPermission) {
        throw new Error('Permisos de notificación denegados');
      }

      // 2. Obtener token FCM
      const token = await getFCMToken();
      if (!token) {
        throw new Error('No se pudo obtener el token FCM');
      }

      // 3. Configurar listener para primer plano
      await setupForegroundListener();

      return token;
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Error al registrar notificaciones';
      setNotificationState((prev) => ({
        ...prev,
        error: errorMessage,
      }));
      return null;
    }
  }, [requestPermission, getFCMToken, setupForegroundListener]);

  // Enviar token al servidor (opcional)
  const sendTokenToServer = useCallback(async (token: string) => {
    try {
      // Aquí puedes implementar la lógica para enviar el token a tu servidor
      console.log('Enviando token al servidor:', token);

      // Ejemplo de implementación:
      // await fetch('/api/register-token', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify({
      //     token,
      //     userId,
      //   }),
      // });
    } catch (error) {
      console.error('Error enviando token al servidor:', error);
    }
  }, []);

  // Mostrar notificación local
  const showLocalNotification = useCallback(
    (notificationData: NotificationData) => {
      if (Notification.permission !== 'granted') {
        console.warn('Permisos de notificación no otorgados');
        return;
      }

      const notification = new Notification(notificationData.title, {
        body: notificationData.body,
        icon: notificationData.icon || '/icons/MyPWA-144x144.webp',
        badge: notificationData.badge || '/icons/MyPWA-74x74.webp',
        tag: 'local-notification',
        data: notificationData.data,
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      return notification;
    },
    []
  );

  return {
    notificationState,
    requestPermission,
    getFCMToken,
    registerForNotifications,
    sendTokenToServer,
    showLocalNotification,
    setupForegroundListener,
  };
};
