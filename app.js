import { initMap } from './modules/map.js';
import { initUI } from './modules/ui.js';
import { loadPreferences, initDB } from './modules/storage.js';

document.addEventListener('DOMContentLoaded', async () => {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js').catch(err => console.error('SW Error:', err));
    }
    
    await initDB();
    loadPreferences();
    const map = await initMap('map');
    initUI(map);
});
