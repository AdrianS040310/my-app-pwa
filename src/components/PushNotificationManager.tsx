import React, { useState, useEffect } from 'react';
import { useFirebaseMessaging } from '../hooks/useFirebaseMessaging';
import VAPIDKeySetup from './VAPIDKeySetup';
import './PushNotificationManager.css';

const PushNotificationManager: React.FC = () => {
  const {
    notificationState,
    registerForNotifications,
    sendTokenToServer,
    showLocalNotification,
  } = useFirebaseMessaging();

  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Efecto para manejar cambios en el estado de notificaciones
  useEffect(() => {
    if (notificationState.error) {
      console.error('Error en notificaciones:', notificationState.error);
    }

    if (notificationState.isRegistered && notificationState.token) {
      console.log('Notificaciones registradas correctamente');
      setSuccessMessage('¡Notificaciones push activadas correctamente!');

      // Limpiar mensaje de éxito después de 5 segundos
      setTimeout(() => setSuccessMessage(null), 5000);
    }
  }, [notificationState]);

  // Manejar registro de notificaciones
  const handleRegisterNotifications = async () => {
    setIsLoading(true);
    setSuccessMessage(null);

    try {
      const token = await registerForNotifications();

      if (token) {
        // Enviar token al servidor (opcional)
        await sendTokenToServer(token);

        setSuccessMessage(
          '¡Registro exitoso! Ahora recibirás notificaciones push.'
        );
      }
    } catch (error) {
      console.error('Error registrando notificaciones:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Probar notificación local
  const handleTestNotification = () => {
    showLocalNotification({
      title: 'Prueba de Notificación',
      body: 'Esta es una notificación de prueba desde tu PWA',
      data: { test: true },
    });
  };

  // Copiar token al portapapeles
  const handleCopyToken = async () => {
    if (notificationState.token) {
      try {
        await navigator.clipboard.writeText(notificationState.token);
        setSuccessMessage('Token copiado al portapapeles');
        setTimeout(() => setSuccessMessage(null), 3000);
      } catch (error) {
        console.error('Error copiando token:', error);
      }
    }
  };

  // Renderizar estado de permisos
  const renderPermissionStatus = () => {
    switch (notificationState.permission) {
      case 'granted':
        return <span className="permission-status granted">✓ Permitido</span>;
      case 'denied':
        return <span className="permission-status denied">✗ Denegado</span>;
      default:
        return (
          <span className="permission-status default">? No solicitado</span>
        );
    }
  };

  // Renderizar soporte de notificaciones
  const renderSupportStatus = () => {
    return notificationState.isSupported ? (
      <span className="support-status supported">✓ Compatible</span>
    ) : (
      <span className="support-status not-supported">✗ No compatible</span>
    );
  };

  return (
    <div className="push-notification-manager">
      <div className="notification-header">
        <h3>🔔 Notificaciones Push</h3>
        <p>
          Gestiona las notificaciones push de tu PWA usando Firebase Cloud
          Messaging
        </p>
      </div>

      <div className="notification-status">
        <div className="status-item">
          <label>Soporte del navegador:</label>
          {renderSupportStatus()}
        </div>

        <div className="status-item">
          <label>Permisos:</label>
          {renderPermissionStatus()}
        </div>

        <div className="status-item">
          <label>Estado de registro:</label>
          {notificationState.isRegistered ? (
            <span className="registration-status registered">✓ Registrado</span>
          ) : (
            <span className="registration-status not-registered">
              ✗ No registrado
            </span>
          )}
        </div>
      </div>

      {notificationState.error && (
        <div className="error-message">
          <strong>Error:</strong> {notificationState.error}
          {/* Mostrar instrucciones de configuración si el error es por VAPID key */}
          {notificationState.error.includes('VAPID key no configurada') && (
            <div className="vapid-setup-container">
              <VAPIDKeySetup />
            </div>
          )}
        </div>
      )}

      {successMessage && (
        <div className="success-message">
          <strong>Éxito:</strong> {successMessage}
        </div>
      )}

      <div className="notification-actions">
        {!notificationState.isRegistered && notificationState.isSupported && (
          <button
            className="btn btn-primary"
            onClick={handleRegisterNotifications}
            disabled={isLoading}
          >
            {isLoading ? 'Registrando...' : 'Activar Notificaciones Push'}
          </button>
        )}

        {notificationState.isRegistered && (
          <div className="registered-actions">
            <button
              className="btn btn-secondary"
              onClick={handleTestNotification}
            >
              Probar Notificación Local
            </button>

            {notificationState.token && (
              <div className="token-section">
                <label>Token FCM:</label>
                <div className="token-container">
                  <code className="token-display">
                    {notificationState.token.substring(0, 50)}...
                  </code>
                  <button
                    className="btn btn-small"
                    onClick={handleCopyToken}
                    title="Copiar token completo"
                  >
                    📋 Copiar
                  </button>
                </div>
                <small>
                  Usa este token para enviar notificaciones desde Firebase
                  Console
                </small>
              </div>
            )}
          </div>
        )}

        {!notificationState.isSupported && (
          <div className="not-supported-message">
            <p>⚠️ Tu navegador no soporta notificaciones push.</p>
            <p>
              Por favor, usa un navegador moderno como Chrome, Firefox o Safari.
            </p>
          </div>
        )}

        {notificationState.permission === 'denied' && (
          <div className="permission-denied-message">
            <p>🚫 Los permisos de notificación han sido denegados.</p>
            <p>Para activar las notificaciones:</p>
            <ol>
              <li>
                Haz clic en el icono de notificaciones en la barra de
                direcciones
              </li>
              <li>Selecciona "Permitir"</li>
              <li>Recarga la página</li>
            </ol>
          </div>
        )}
      </div>

      <div className="notification-info">
        <h4>📋 Instrucciones para pruebas:</h4>
        <ol>
          <li>Activa las notificaciones push usando el botón superior</li>
          <li>Copia el token FCM generado</li>
          <li>Ve a Firebase Console → Cloud Messaging</li>
          <li>Crea una nueva campaña y pega el token</li>
          <li>Envía la notificación de prueba</li>
        </ol>
      </div>
    </div>
  );
};

export default PushNotificationManager;
