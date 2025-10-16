# Mi PWA - Aplicación Web Progresiva

Una aplicación web progresiva moderna construida con React, TypeScript, Vite y Firebase, que incluye notificaciones push, funcionalidad offline y estrategias de caché avanzadas.

## 🚀 Características Principales

- **PWA Completa**: Instalable, funciona offline, splash screen
- **Notificaciones Push**: Integración con Firebase Cloud Messaging
- **Estrategias de Caché**: Cache First, Network First, Stale While Revalidate
- **Sincronización Offline**: Background sync con IndexedDB
- **Service Worker**: Gestión avanzada de caché y actualizaciones
- **TypeScript**: Tipado estático para mejor desarrollo

## 📋 Prerrequisitos

- Node.js (versión 16 o superior)
- npm o yarn
- Navegador moderno con soporte para Service Workers

## 🛠️ Instalación y Ejecución Local

### 1. Clonar e instalar dependencias

```bash
# Instalar dependencias
npm install
```

### 2. Configurar Firebase (Opcional)

Si quieres usar las notificaciones push, necesitas configurar Firebase:

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Crea un nuevo proyecto o usa uno existente
3. Habilita Cloud Messaging
4. Actualiza la configuración en `src/firebase/config.ts` con tus credenciales

### 3. Ejecutar en modo desarrollo

```bash
# Servidor de desarrollo
npm run dev

# La aplicación estará disponible en http://localhost:5173
```

### 4. Construir para producción

```bash
# Construir la aplicación
npm run build

# Previsualizar la build de producción
npm run preview
```

## 🔧 Scripts Disponibles

- `npm run dev` - Ejecuta el servidor de desarrollo
- `npm run build` - Construye la aplicación para producción
- `npm run preview` - Previsualiza la build de producción
- `npm run lint` - Ejecuta el linter ESLint

## 📱 Estrategias de Caché Implementadas

### 1. Cache First Strategy
**Archivos del App Shell y recursos estáticos**
- Se sirve desde caché primero
- Si no está en caché, se obtiene de la red y se guarda
- Ideal para: HTML, CSS, JS, imágenes, fuentes

### 2. Network First Strategy
**Solicitudes dinámicas y APIs**
- Intenta la red primero
- Si falla, sirve desde caché
- Ideal para: APIs, datos dinámicos, formularios

### 3. Stale While Revalidate Strategy
**Contenido que puede estar desactualizado**
- Sirve caché inmediatamente si está disponible
- Actualiza en segundo plano
- Ideal para: contenido que cambia frecuentemente

## 🗂️ Estructura de Caché

La aplicación utiliza tres tipos de caché:

- **App Shell Cache**: Archivos críticos de la aplicación
- **Static Cache**: Recursos estáticos (imágenes, fuentes, etc.)
- **Runtime Cache**: Contenido dinámico y APIs

## 🔄 Funcionalidades Offline

- **Background Sync**: Sincronización automática cuando vuelve la conexión
- **IndexedDB**: Almacenamiento local para datos offline
- **Service Worker**: Intercepta requests y maneja caché
- **Fallback Pages**: Páginas de respaldo cuando no hay conexión

## 🔔 Notificaciones Push

- **Firebase Cloud Messaging**: Gestión de notificaciones
- **VAPID Keys**: Autenticación para notificaciones
- **Background Notifications**: Notificaciones cuando la app está cerrada
- **Action Buttons**: Botones de acción en las notificaciones

## 📊 Monitoreo y Debugging

- **Service Worker Status**: Componente para verificar estado del SW
- **Cache Management**: Herramientas para gestionar caché
- **FCM Diagnostics**: Diagnóstico de notificaciones push
- **Console Logs**: Logs detallados para debugging

## 🌐 Despliegue

Para desplegar en producción:

1. Ejecuta `npm run build`
2. Sube los archivos de la carpeta `dist/` a tu servidor
3. Asegúrate de que el servidor sirva `index.html` para todas las rutas (SPA)
4. Configura HTTPS (requerido para Service Workers)

## 🔧 Configuración Adicional

### Workbox
La aplicación usa Workbox CLI para generar el Service Worker:
```bash
# Generar Service Worker con Workbox
npx workbox generateSW workbox-config.js
```

### PWA Manifest
El archivo `public/manifest.json` contiene la configuración de la PWA:
- Nombre y descripción
- Iconos en diferentes tamaños
- Modo de visualización
- Colores de tema

## 📝 Notas de Desarrollo

- La aplicación está optimizada para móviles y escritorio
- Soporte completo para instalación como PWA
- Gestión automática de actualizaciones del Service Worker
- Limpieza automática de caché antiguo (7 días)
