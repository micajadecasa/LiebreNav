import { initMap } from './modules/map.js';
import { initUI } from './modules/ui.js';
import { loadPreferences, initDB } from './modules/storage.js';

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Quitar splash por tiempo máximo (Fail-safe total)
    const hideSplash = () => {
        const splash = document.getElementById('splash');
        if (splash) splash.classList.add('fade-out');
    };
    setTimeout(hideSplash, 3500); 

    // 2. Registro de Service Worker (Opcional)
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js').catch(err => console.warn('SW:', err));
    }

    try {
        // 3. Inicializar DB con catch para evitar bloqueos
        await initDB().catch(e => console.warn('DB Error:', e));
        
        loadPreferences();

        // 4. Inicializar Mapa con timeout interno
        const map = await initMap('map');
        
        // 5. Cargar UI
        initUI(map);
        
        // 6. Quitar splash inmediatamente si todo ha cargado bien
        hideSplash();

    } catch (err) {
        console.error('Error crítico en arranque:', err);
        hideSplash(); // Quitar splash incluso si hay error para ver qué pasa
    }
});
