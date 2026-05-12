const APP_SCRIPT_URL = 'YOUR_APPS_SCRIPT_URL_HERE'; 
let db;

export function initDB() {
    return new Promise((resolve, reject) => {
        const req = indexedDB.open('LiebreNavDB', 1);
        req.onupgradeneeded = e => {
            db = e.target.result;
            if (!db.objectStoreNames.contains('routes')) {
                db.createObjectStore('routes', { keyPath: 'id' });
            }
        };
        req.onsuccess = e => { db = e.target.result; resolve(); };
        req.onerror = e => reject(e);
    });
}

export function loadPreferences() {
    if (localStorage.getItem('pref-dark-mode') === 'true') {
        document.body.classList.add('dark-mode');
        document.getElementById('pref-dark-mode').checked = true;
    }
    document.getElementById('pref-voice').checked = localStorage.getItem('pref-voice') !== 'false';
    document.getElementById('pref-vibration').checked = localStorage.getItem('pref-vibration') !== 'false';
    document.getElementById('pref-transport').value = localStorage.getItem('pref-transport') || 'driving';
}

export function savePreferences(key, value) {
    localStorage.setItem(key, value);
    if (key === 'pref-dark-mode') {
        document.body.classList.toggle('dark-mode', value === 'true');
    }
}

export async function saveRouteBackend(routeObj) {
    try {
        const res = await fetch(APP_SCRIPT_URL + '?action=save', {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(routeObj)
        });
        
        const tx = db.transaction('routes', 'readwrite');
        tx.objectStore('routes').put(routeObj);
        return true;
    } catch (e) {
        console.error('Error saving:', e);
        return false;
    }
}

export async function getRoutesBackend() {
    try {
        const res = await fetch(APP_SCRIPT_URL + '?action=list');
        const data = await res.json();
        const tx = db.transaction('routes', 'readwrite');
        data.forEach(r => tx.objectStore('routes').put(r));
        return data;
    } catch (e) {
        console.error('Offline fallback');
        return new Promise((resolve) => {
            const tx = db.transaction('routes', 'readonly');
            const req = tx.objectStore('routes').getAll();
            req.onsuccess = () => resolve(req.result);
        });
    }
}
