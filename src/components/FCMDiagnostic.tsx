import React, { useState } from 'react';
import { FCMTestRunner } from '../utils/fcmTestRunner';
import type { FCMTestResult } from '../utils/fcmTestRunner';
import './FCMDiagnostic.css';

const FCMDiagnostic: React.FC = () => {
  const [testResults, setTestResults] = useState<FCMTestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const runDiagnostics = async () => {
    setIsRunning(true);
    setTestResults([]);

    try {
      const testRunner = new FCMTestRunner();
      const results = await testRunner.runAllTests();
      setTestResults(results);
    } catch (error) {
      console.error('Error ejecutando diagnósticos:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const getSummary = () => {
    if (testResults.length === 0) return { passed: 0, total: 0, percentage: 0 };

    const passed = testResults.filter((r) => r.success).length;
    const total = testResults.length;

    return {
      passed,
      total,
      percentage: Math.round((passed / total) * 100),
    };
  };

  const summary = getSummary();

  return (
    <div className="fcm-diagnostic">
      <div className="diagnostic-header">
        <h3>🔍 Diagnóstico FCM</h3>
        <p>
          Herramienta de diagnóstico para verificar la configuración de Firebase
          Cloud Messaging
        </p>

        <button
          className="btn btn-primary"
          onClick={runDiagnostics}
          disabled={isRunning}
        >
          {isRunning ? 'Ejecutando diagnósticos...' : 'Ejecutar Diagnósticos'}
        </button>
      </div>

      {testResults.length > 0 && (
        <div className="diagnostic-results">
          <div className="summary-card">
            <h4>📊 Resumen de Diagnósticos</h4>
            <div className="summary-stats">
              <div className="stat">
                <span className="stat-number">{summary.passed}</span>
                <span className="stat-label">Exitosas</span>
              </div>
              <div className="stat">
                <span className="stat-number">
                  {summary.total - summary.passed}
                </span>
                <span className="stat-label">Fallidas</span>
              </div>
              <div className="stat">
                <span className="stat-number">{summary.percentage}%</span>
                <span className="stat-label">Porcentaje</span>
              </div>
            </div>

            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${summary.percentage}%` }}
              ></div>
            </div>
          </div>

          <div className="results-list">
            <div className="results-header">
              <h4>📋 Resultados Detallados</h4>
              <button
                className="btn btn-small"
                onClick={() => setShowDetails(!showDetails)}
              >
                {showDetails ? 'Ocultar detalles' : 'Mostrar detalles'}
              </button>
            </div>

            {testResults.map((result, index) => (
              <div
                key={index}
                className={`result-item ${result.success ? 'success' : 'error'}`}
              >
                <div className="result-header">
                  <span className="result-icon">
                    {result.success ? '✅' : '❌'}
                  </span>
                  <span className="result-step">{result.step}</span>
                  <span className="result-status">
                    {result.success ? 'Éxito' : 'Error'}
                  </span>
                </div>

                <div className="result-message">{result.message}</div>

                {showDetails && result.data && (
                  <div className="result-data">
                    <strong>Datos adicionales:</strong>
                    <pre>{JSON.stringify(result.data, null, 2)}</pre>
                  </div>
                )}
              </div>
            ))}
          </div>

          {summary.percentage === 100 ? (
            <div className="success-banner">
              <h4>🎉 ¡Todos los diagnósticos pasaron!</h4>
              <p>
                Tu configuración de FCM está lista para usar notificaciones
                push.
              </p>
            </div>
          ) : (
            <div className="warning-banner">
              <h4>⚠️ Algunos diagnósticos fallaron</h4>
              <p>
                Revisa los errores arriba y consulta la guía de configuración.
              </p>
              <a
                href="/PUSH_NOTIFICATIONS_GUIDE.md"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary"
              >
                📖 Ver Guía de Configuración
              </a>
            </div>
          )}
        </div>
      )}

      <div className="diagnostic-info">
        <h4>💡 Información del Diagnóstico</h4>
        <ul>
          <li>
            <strong>Verificación de navegador:</strong> Comprueba si el
            navegador soporta FCM
          </li>
          <li>
            <strong>Configuración Firebase:</strong> Verifica que la
            configuración esté correcta
          </li>
          <li>
            <strong>Service Workers:</strong> Comprueba que los SW estén
            registrados
          </li>
          <li>
            <strong>Permisos:</strong> Verifica el estado de los permisos de
            notificación
          </li>
          <li>
            <strong>Registro FCM:</strong> Comprueba que se pueda registrar para
            notificaciones
          </li>
        </ul>
      </div>
    </div>
  );
};

export default FCMDiagnostic;
