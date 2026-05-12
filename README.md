# Liebre Nav

Un GPS web móvil completamente libre, construido con HTML5, CSS3, JS Vanilla, MapLibre GL JS, Nominatim y OSRM.

## Despliegue en GitHub Pages
1. Sube todo el contenido de la carpeta `/gps-libre/` (excepto `backend.gs`) a un repositorio en GitHub.
2. Ve a los **Settings** del repositorio > **Pages**.
3. Selecciona la rama `main` y guarda.

## Configuración del Backend (Google Apps Script)
1. Ve a [Google Sheets](https://sheets.google.com) y crea una nueva hoja.
2. Ve a **Extensiones > Apps Script**.
3. Pega el contenido de `backend.gs`.
4. Haz clic en **Implementar > Nueva implementación**.
5. Selecciona tipo **Aplicación web**.
6. En **Acceso**, selecciona **Cualquier persona**.
7. Copia la URL de la aplicación web y pégala en `/modules/storage.js` en la variable `APP_SCRIPT_URL`.

## Uso
- Permite la geolocalización en el navegador.
- Busca un destino usando el buscador superior.
- Selecciona el tipo de transporte en el menú.
- ¡Navega de forma libre!
