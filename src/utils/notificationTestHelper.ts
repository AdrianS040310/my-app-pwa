// Utilidades para pruebas de notificaciones push con Firebase

export interface TestNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  data?: Record<string, any>;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
}

/**
 * Genera un payload de prueba para enviar notificaciones desde Firebase Console
 */
export const generateTestPayload = (): TestNotificationPayload => {
  return {
    title: "¡Hola desde Firebase! 🔔",
    body: "Esta es una notificación de prueba enviada desde Firebase Cloud Messaging",
    icon: "/icons/MyPWA-144x144.webp",
    badge: "/icons/MyPWA-74x74.webp",
    data: {
      url: "/",
      timestamp: Date.now(),
      source: "firebase-test"
    },
    actions: [
      {
        action: "open",
        title: "Abrir App",
        icon: "/icons/MyPWA-74x74.webp"
      }
    ]
  };
};

/**
 * Valida que un token FCM tenga el formato correcto
 */
export const isValidFCMToken = (token: string): boolean => {
  // Un token FCM típico tiene más de 100 caracteres y contiene caracteres alfanuméricos y algunos símbolos
  return Boolean(token && token.length > 100 && /^[A-Za-z0-9_-]+$/.test(token));
};

/**
 * Formatea un token FCM para mostrar solo una parte (útil para UI)
 */
export const formatTokenForDisplay = (token: string, maxLength: number = 50): string => {
  if (!token) return '';
  
  if (token.length <= maxLength) return token;
  
  return `${token.substring(0, maxLength)}...`;
};

/**
 * Genera un enlace directo a Firebase Console para enviar mensajes
 */
export const getFirebaseConsoleLink = (projectId: string): string => {
  return `https://console.firebase.google.com/project/${projectId}/messaging`;
};

/**
 * Simula el envío de una notificación de prueba (para desarrollo)
 */
export const simulateNotification = (
  payload: TestNotificationPayload,
  onSuccess?: () => void,
  onError?: (error: Error) => void
): void => {
  try {
    if (Notification.permission !== 'granted') {
      throw new Error('Permisos de notificación no otorgados');
    }

    const notification = new Notification(payload.title, {
      body: payload.body,
      icon: payload.icon,
      badge: payload.badge,
      tag: 'test-notification',
      data: payload.data,
      requireInteraction: true,
    });

    notification.onclick = () => {
      window.focus();
      notification.close();
      
      // Simular navegación si hay URL en los datos
      if (payload.data?.url) {
        window.location.href = payload.data.url;
      }
    };

    notification.onshow = () => {
      console.log('Notificación de prueba mostrada');
      onSuccess?.();
    };

    notification.onerror = (error) => {
      console.error('Error mostrando notificación de prueba:', error);
      onError?.(new Error('Error mostrando notificación'));
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    onError?.(new Error(errorMessage));
  }
};

/**
 * Verifica si el navegador soporta todas las características necesarias para FCM
 */
export const checkFCMSupport = (): {
  isSupported: boolean;
  missingFeatures: string[];
} => {
  const missingFeatures: string[] = [];

  if (!('Notification' in window)) {
    missingFeatures.push('Notifications API');
  }

  if (!('serviceWorker' in navigator)) {
    missingFeatures.push('Service Worker');
  }

  if (!('PushManager' in window)) {
    missingFeatures.push('Push Manager');
  }

  if (!('navigator' in window) || !navigator.serviceWorker) {
    missingFeatures.push('Service Worker Registration');
  }

  if (!window.indexedDB) {
    missingFeatures.push('IndexedDB');
  }

  return {
    isSupported: missingFeatures.length === 0,
    missingFeatures,
  };
};

/**
 * Genera un resumen del estado de las notificaciones
 */
export const generateNotificationStatusReport = (
  isSupported: boolean,
  permission: NotificationPermission,
  token: string | null,
  isRegistered: boolean
): string => {
  let report = "📊 Reporte de Estado de Notificaciones Push\n\n";
  
  report += `🔧 Soporte del navegador: ${isSupported ? '✅ Compatible' : '❌ No compatible'}\n`;
  report += `🔑 Permisos: ${permission === 'granted' ? '✅ Otorgados' : permission === 'denied' ? '❌ Denegados' : '⚠️ No solicitados'}\n`;
  report += `🎫 Token FCM: ${token ? '✅ Disponible' : '❌ No disponible'}\n`;
  report += `📱 Estado de registro: ${isRegistered ? '✅ Registrado' : '❌ No registrado'}\n\n`;

  if (isSupported && permission === 'granted' && token && isRegistered) {
    report += "🎉 ¡Todo está configurado correctamente para recibir notificaciones push!";
  } else {
    report += "⚠️ Hay problemas que necesitan ser resueltos:";
    
    if (!isSupported) report += "\n- El navegador no soporta notificaciones push";
    if (permission !== 'granted') report += `\n- Permisos: ${permission}`;
    if (!token) report += "\n- No se pudo obtener el token FCM";
    if (!isRegistered) report += "\n- No se pudo registrar para notificaciones";
  }

  return report;
};
