import { initMap } from './modules/map.js';
import { initUI } from './modules/ui.js';
import { loadPreferences } from './modules/storage.js';

document.addEventListener('DOMContentLoaded', () => {
    // Register Service Worker
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js').catch(err => {
            console.error('Service Worker registration failed:', err);
        });
    }

    loadPreferences();
    const map = initMap('map');
    initUI(map);
});
