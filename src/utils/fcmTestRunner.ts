// Script de prueba para verificar la funcionalidad completa de FCM

import { checkFCMSupport } from './notificationTestHelper';

export interface FCMTestResult {
  step: string;
  success: boolean;
  message: string;
  data?: Record<string, unknown>;
}

export class FCMTestRunner {
  private results: FCMTestResult[] = [];

  /**
   * Ejecuta todas las pruebas de FCM
   */
  async runAllTests(): Promise<FCMTestResult[]> {
    this.results = [];

    console.log('🧪 Iniciando pruebas de FCM...');

    // Paso 1: Verificar soporte del navegador
    await this.testBrowserSupport();

    // Paso 2: Verificar configuración de Firebase
    await this.testFirebaseConfig();

    // Paso 3: Verificar service worker
    await this.testServiceWorker();

    // Paso 4: Verificar permisos
    await this.testPermissions();

    // Paso 5: Verificar registro FCM
    await this.testFCMRegistration();

    // Paso 6: Generar reporte final
    this.generateFinalReport();

    return this.results;
  }

  /**
   * Prueba 1: Verificar soporte del navegador
   */
  private async testBrowserSupport(): Promise<void> {
    const support = checkFCMSupport();

    this.addResult({
      step: 'Soporte del navegador',
      success: support.isSupported,
      message: support.isSupported
        ? 'Navegador compatible con FCM'
        : `Navegador no compatible. Faltan: ${support.missingFeatures.join(', ')}`,
      data: { missingFeatures: support.missingFeatures },
    });
  }

  /**
   * Prueba 2: Verificar configuración de Firebase
   */
  private async testFirebaseConfig(): Promise<void> {
    try {
      // Intentar importar la configuración de Firebase
      const { messaging, VAPID_KEY } = await import('../firebase/config');

      const hasMessaging = !!messaging;
      const hasVapidKey = !!VAPID_KEY;

      this.addResult({
        step: 'Configuración de Firebase',
        success: hasMessaging && hasVapidKey,
        message:
          hasMessaging && hasVapidKey
            ? 'Configuración de Firebase correcta'
            : `Problemas en configuración: ${!hasMessaging ? 'Messaging no disponible' : ''} ${!hasVapidKey ? 'VAPID key no configurada' : ''}`,
        data: { hasMessaging, hasVapidKey },
      });
    } catch (error) {
      this.addResult({
        step: 'Configuración de Firebase',
        success: false,
        message: `Error cargando configuración: ${error instanceof Error ? error.message : 'Error desconocido'}`,
      });
    }
  }

  /**
   * Prueba 3: Verificar service worker
   */
  private async testServiceWorker(): Promise<void> {
    try {
      if (!('serviceWorker' in navigator)) {
        this.addResult({
          step: 'Service Worker',
          success: false,
          message: 'Service Worker no soportado por el navegador',
        });
        return;
      }

      // Verificar que el service worker principal esté registrado
      const mainRegistration = await navigator.serviceWorker.ready;

      // Verificar que el service worker de Firebase messaging esté disponible
      const fcmRegistration = await navigator.serviceWorker.getRegistration(
        '/firebase-messaging-sw.js'
      );

      this.addResult({
        step: 'Service Worker',
        success: !!mainRegistration && !!fcmRegistration,
        message:
          mainRegistration && fcmRegistration
            ? 'Service Workers registrados correctamente'
            : `Service Workers: Principal: ${!!mainRegistration}, FCM: ${!!fcmRegistration}`,
        data: {
          mainSW: !!mainRegistration,
          fcmSW: !!fcmRegistration,
        },
      });
    } catch (error) {
      this.addResult({
        step: 'Service Worker',
        success: false,
        message: `Error verificando Service Worker: ${error instanceof Error ? error.message : 'Error desconocido'}`,
      });
    }
  }

  /**
   * Prueba 4: Verificar permisos de notificación
   */
  private async testPermissions(): Promise<void> {
    const permission = Notification.permission;

    this.addResult({
      step: 'Permisos de notificación',
      success: permission === 'granted',
      message:
        permission === 'granted'
          ? 'Permisos de notificación otorgados'
          : `Permisos de notificación: ${permission}`,
      data: { permission },
    });
  }

  /**
   * Prueba 5: Verificar registro FCM
   */
  private async testFCMRegistration(): Promise<void> {
    try {
      if (Notification.permission !== 'granted') {
        this.addResult({
          step: 'Registro FCM',
          success: false,
          message: 'No se puede registrar FCM sin permisos de notificación',
        });
        return;
      }

      // Intentar obtener token FCM (sin hacer el registro completo)
      const { VAPID_KEY } = await import('../firebase/config');

      if (!VAPID_KEY) {
        this.addResult({
          step: 'Registro FCM',
          success: false,
          message: 'VAPID key no configurada - no se puede obtener token FCM',
        });
        return;
      }

      // Verificar que el service worker de FCM esté registrado
      const registration = await navigator.serviceWorker.getRegistration(
        '/firebase-messaging-sw.js'
      );

      this.addResult({
        step: 'Registro FCM',
        success: !!registration,
        message: registration
          ? 'Listo para obtener token FCM'
          : 'Service Worker de FCM no registrado',
        data: { fcmSWRegistered: !!registration },
      });
    } catch (error) {
      this.addResult({
        step: 'Registro FCM',
        success: false,
        message: `Error verificando registro FCM: ${error instanceof Error ? error.message : 'Error desconocido'}`,
      });
    }
  }

  /**
   * Genera reporte final
   */
  private generateFinalReport(): void {
    const successCount = this.results.filter((r) => r.success).length;
    const totalCount = this.results.length;
    const allPassed = successCount === totalCount;

    this.addResult({
      step: 'Reporte Final',
      success: allPassed,
      message: `Pruebas completadas: ${successCount}/${totalCount} exitosas`,
      data: {
        passed: successCount,
        total: totalCount,
        results: this.results,
      },
    });

    console.log('📊 Reporte de Pruebas FCM:');
    console.log(`✅ Exitosas: ${successCount}`);
    console.log(`❌ Fallidas: ${totalCount - successCount}`);
    console.log(
      `📈 Porcentaje: ${Math.round((successCount / totalCount) * 100)}%`
    );
  }

  /**
   * Agrega un resultado a la lista
   */
  private addResult(result: FCMTestResult): void {
    this.results.push(result);
    console.log(
      `${result.success ? '✅' : '❌'} ${result.step}: ${result.message}`
    );
  }

  /**
   * Obtiene el resumen de las pruebas
   */
  getSummary(): { passed: number; total: number; percentage: number } {
    const passed = this.results.filter((r) => r.success).length;
    const total = this.results.length;

    return {
      passed,
      total,
      percentage: total > 0 ? Math.round((passed / total) * 100) : 0,
    };
  }

  /**
   * Obtiene todas las pruebas fallidas
   */
  getFailedTests(): FCMTestResult[] {
    return this.results.filter((r) => !r.success);
  }

  /**
   * Obtiene todas las pruebas exitosas
   */
  getPassedTests(): FCMTestResult[] {
    return this.results.filter((r) => r.success);
  }
}

/**
 * Función de conveniencia para ejecutar las pruebas
 */
export const runFCMTests = async (): Promise<FCMTestResult[]> => {
  const testRunner = new FCMTestRunner();
  return await testRunner.runAllTests();
};

/**
 * Función para mostrar las pruebas en la consola
 */
export const logFCMTestResults = async (): Promise<void> => {
  console.log('🔔 Iniciando diagnóstico de FCM...\n');

  const results = await runFCMTests();

  console.log('\n📋 Resumen detallado:');
  results.forEach((result, index) => {
    console.log(`${index + 1}. ${result.success ? '✅' : '❌'} ${result.step}`);
    console.log(`   ${result.message}`);
    if (result.data) {
      console.log(`   Datos:`, result.data);
    }
    console.log('');
  });
};
