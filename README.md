# LiebreNav 2.0

GPS web móvil 100% software libre, optimizado para smartphones con navegación avanzada, voz, vibración, modo offline y backend propio en Google Sheets.

## Despliegue en GitHub Pages
1. Sube el contenido de `/LiebreNav/` a GitHub.
2. Ve a **Settings > Pages** y activa el despliegue desde la rama `main`.

## Backend (Google Apps Script)
1. Crea un Google Sheet y abre **Extensiones > Apps Script**.
2. Copia el contenido de `backend.gs`.
3. Dale a **Implementar > Nueva implementación > Aplicación web** (acceso para "Cualquier persona").
4. Copia la URL generada y pégala en `modules/storage.js` en la variable `APP_SCRIPT_URL`.

## Características V2.0
- **Navegación real**: Seguimiento con `watchPosition`, rotación de mapa automática.
- **Offline First**: Service Worker + IndexedDB.
- **APIs Web**: Share API, Vibration API, Speech API.
- **Múltiples perfiles**: Coche, Bici, Caminar (vía OSRM).
