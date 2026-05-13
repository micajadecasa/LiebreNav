import { initMap } from './modules/map.js';
import { initUI } from './modules/ui.js';
import { loadPreferences, initDB } from './modules/storage.js';

document.addEventListener('DOMContentLoaded', async () => {
    const hideSplash = () => {
        const splash = document.getElementById('splash');
        if (splash) splash.classList.add('fade-out');
    };

    // Seguros de vida
    setTimeout(hideSplash, 4000); 

    try {
        await initDB().catch(() => console.warn('DB off'));
        loadPreferences();
        const map = await initMap('map');
        initUI(map);
        hideSplash();
    } catch (err) {
        console.error('Crash inicial:', err);
        hideSplash();
    }
});
