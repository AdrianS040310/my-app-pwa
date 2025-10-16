import React, { useState } from 'react';
import './VAPIDKeySetup.css';

const VAPIDKeySetup: React.FC = () => {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Error copiando al portapapeles:', error);
    }
  };

  const firebaseConsoleLink =
    'https://console.firebase.google.com/project/pwa-notificaciones-5be22/settings/cloudmessaging';

  return (
    <div className="vapid-key-setup">
      <div className="setup-header">
        <h3>🔑 Configuración de VAPID Key</h3>
        <p>
          Para que las notificaciones push funcionen, necesitas configurar tu
          VAPID key de Firebase.
        </p>
      </div>

      <div className="setup-steps">
        <div className="step">
          <div className="step-number">1</div>
          <div className="step-content">
            <h4>Abrir Firebase Console</h4>
            <p>Ve a la configuración de Cloud Messaging en Firebase Console</p>
            <a
              href={firebaseConsoleLink}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary"
            >
              🔗 Abrir Firebase Console
            </a>
          </div>
        </div>

        <div className="step">
          <div className="step-number">2</div>
          <div className="step-content">
            <h4>Obtener VAPID Key</h4>
            <p>
              En la sección "Web push certificates", busca tu key pair o genera
              una nueva
            </p>
            <div className="code-block">
              <code>Web push certificates → Key pair</code>
            </div>
          </div>
        </div>

        <div className="step">
          <div className="step-number">3</div>
          <div className="step-content">
            <h4>Copiar la Key</h4>
            <p>
              Copia la key pair completa (debe empezar con algo como
              "BEl62iUYgUiv...")
            </p>
            <div className="key-example">
              <strong>Ejemplo de formato:</strong>
              <code>
                BEl62iUYgUivxIkv69yViEuiBIa40HI8l7zqjfEjHW1OfUQyIXGtr3KxHNgli36UQy4f7ljX9D3ONwzJEWpdaqQ
              </code>
            </div>
          </div>
        </div>

        <div className="step">
          <div className="step-number">4</div>
          <div className="step-content">
            <h4>Configurar en el Código</h4>
            <p>
              Edita el archivo <code>src/firebase/config.ts</code> y reemplaza
              la línea:
            </p>
            <div className="code-block">
              <code>export const VAPID_KEY = "YOUR_VAPID_KEY_HERE";</code>
              <button
                className="copy-btn"
                onClick={() =>
                  copyToClipboard(
                    'export const VAPID_KEY = "YOUR_VAPID_KEY_HERE";'
                  )
                }
              >
                {copied ? '✅ Copiado' : '📋 Copiar'}
              </button>
            </div>
            <p>Con tu VAPID key real:</p>
            <div className="code-block">
              <code>export const VAPID_KEY = "TU_VAPID_KEY_AQUI";</code>
            </div>
          </div>
        </div>

        <div className="step">
          <div className="step-number">5</div>
          <div className="step-content">
            <h4>Reiniciar la Aplicación</h4>
            <p>
              Después de configurar la VAPID key, reinicia el servidor de
              desarrollo:
            </p>
            <div className="code-block">
              <code>Ctrl+C (para detener) → npm run dev (para reiniciar)</code>
            </div>
          </div>
        </div>
      </div>

      <div className="setup-tips">
        <h4>💡 Consejos</h4>
        <ul>
          <li>La VAPID key debe tener al menos 65 caracteres</li>
          <li>No incluyas comillas adicionales al copiar</li>
          <li>Asegúrate de que el proyecto Firebase sea correcto</li>
          <li>
            Si no ves la sección "Web push certificates", haz clic en "Generate
            key pair"
          </li>
        </ul>
      </div>

      <div className="setup-troubleshooting">
        <h4>🔧 Solución de Problemas</h4>
        <div className="troubleshooting-item">
          <strong>Error: "VAPID key no configurada"</strong>
          <p>Sigue los pasos 1-4 para configurar correctamente la VAPID key</p>
        </div>
        <div className="troubleshooting-item">
          <strong>Error: "Service Worker no encontrado"</strong>
          <p>
            Verifica que el archivo <code>public/firebase-messaging-sw.js</code>{' '}
            exista
          </p>
        </div>
        <div className="troubleshooting-item">
          <strong>Error: "Permisos no otorgados"</strong>
          <p>
            Acepta los permisos de notificación cuando el navegador los solicite
          </p>
        </div>
      </div>
    </div>
  );
};

export default VAPIDKeySetup;
