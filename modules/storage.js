import { updateMapStyle } from './map.js';

const APP_SCRIPT_URL = 'YOUR_APPS_SCRIPT_URL_HERE'; // Reemplazar al desplegar

export function loadPreferences() {
    const isDark = localStorage.getItem('pref-dark-mode') === 'true';
    if (isDark) {
        document.body.classList.add('dark-mode');
        document.getElementById('pref-dark-mode').checked = true;
    }

    const voice = localStorage.getItem('pref-voice') !== 'false';
    document.getElementById('pref-voice').checked = voice;
    if(voice) localStorage.setItem('pref-voice', 'true');

    const transport = localStorage.getItem('pref-transport') || 'driving';
    document.getElementById('pref-transport').value = transport;
}

export function savePreferences(key, value) {
    localStorage.setItem(key, value);
    if (key === 'pref-dark-mode') {
        if (value === 'true') document.body.classList.add('dark-mode');
        else document.body.classList.remove('dark-mode');
        updateMapStyle(value === 'true');
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
        return true;
    } catch (e) {
        console.error(e);
        return false;
    }
}

export async function getRoutesBackend() {
    try {
        const res = await fetch(APP_SCRIPT_URL + '?action=list');
        return await res.json();
    } catch (e) {
        console.error(e);
        return [];
    }
}
