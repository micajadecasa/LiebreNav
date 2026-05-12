const APP_SCRIPT_URL = 'YOUR_APPS_SCRIPT_URL_HERE'; 
let db = null;

export function initDB() {
    return new Promise((resolve) => {
        try {
            const req = indexedDB.open('LiebreNavDB', 1);
            req.onupgradeneeded = e => {
                const _db = e.target.result;
                if (!_db.objectStoreNames.contains('routes')) {
                    _db.createObjectStore('routes', { keyPath: 'id' });
                }
            };
            req.onsuccess = e => { 
                db = e.target.result; 
                resolve(); 
            };
            req.onerror = e => { 
                console.warn('IndexedDB no disponible');
                resolve(); 
            };
        } catch (e) {
            resolve();
        }
    });
}

export function loadPreferences() {
    try {
        if (localStorage.getItem('pref-dark-mode') === 'true') {
            document.body.classList.add('dark-mode');
            document.getElementById('pref-dark-mode').checked = true;
        }
        const voice = document.getElementById('pref-voice');
        if (voice) voice.checked = localStorage.getItem('pref-voice') !== 'false';
        
        const transport = document.getElementById('pref-transport');
        if (transport) transport.value = localStorage.getItem('pref-transport') || 'driving';
    } catch (e) { console.warn('Prefs error'); }
}

export function savePreferences(key, value) {
    localStorage.setItem(key, value);
    if (key === 'pref-dark-mode') {
        document.body.classList.toggle('dark-mode', value === 'true');
    }
}

export async function saveRouteBackend(routeObj) {
    try {
        await fetch(APP_SCRIPT_URL + '?action=save', {
            method: 'POST',
            mode: 'no-cors',
            body: JSON.stringify(routeObj)
        });
        if (db) {
            const tx = db.transaction('routes', 'readwrite');
            tx.objectStore('routes').put(routeObj);
        }
        return true;
    } catch (e) { return false; }
}

export async function getRoutesBackend() {
    try {
        const res = await fetch(APP_SCRIPT_URL + '?action=list');
        const data = await res.json();
        return data;
    } catch (e) {
        return new Promise((resolve) => {
            if (!db) return resolve([]);
            const tx = db.transaction('routes', 'readonly');
            const req = tx.objectStore('routes').getAll();
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => resolve([]);
        });
    }
}
