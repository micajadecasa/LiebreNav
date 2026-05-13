import { mapInstance, drawRoute, clearRoute, updateUserMarker } from './map.js';
import { searchLocation } from './geocode.js';
import { getRoute } from './routing.js';
import { startNavTracking, stopNavTracking, repeatCurrentInstruction } from './navigation.js';
import { savePreferences, saveRouteBackend, getRoutesBackend } from './storage.js';
import { formatDistance, formatTime } from './utils.js';

let points = []; 
let currentRouteDetails = null;

export function initUI(map) {
    const elements = {
        sidebar: document.getElementById('sidebar'),
        btnMenu: document.getElementById('btn-menu'),
        btnCloseSidebar: document.getElementById('btn-close-sidebar'),
        btnOpenSaved: document.getElementById('btn-open-saved'),
        searchInput: document.getElementById('search-input'),
        searchResults: document.getElementById('search-results'),
        btnAddWaypoint: document.getElementById('btn-add-waypoint'),
        btnLocation: document.getElementById('btn-location'),
        btnNavLocation: document.getElementById('btn-nav-location'), // Nuevo ID
        btnRepeatInstruction: document.getElementById('btn-repeat-instruction'), // Nuevo ID
        btnStartNav: document.getElementById('btn-start-nav'),
        btnStopNav: document.getElementById('btn-stop-nav'),
        btnSaveRoute: document.getElementById('btn-save-route'),
        btnClearRoute: document.getElementById('btn-clear-route'),
        modalOverlay: document.getElementById('modal-overlay'),
        modalSave: document.getElementById('modal-save'),
        modalLoad: document.getElementById('modal-load'),
        btnConfirmSave: document.getElementById('btn-confirm-save'),
        btnCancelSave: document.getElementById('btn-cancel-save'),
        btnCloseLoad: document.getElementById('btn-close-load'),
        prefTransport: document.getElementById('pref-transport')
    };

    // Splash
    setTimeout(() => document.getElementById('splash')?.classList.add('fade-out'), 1500);

    // Sidebar
    elements.btnMenu?.addEventListener('click', () => elements.sidebar.classList.remove('hidden'));
    elements.btnCloseSidebar?.addEventListener('click', () => elements.sidebar.classList.add('hidden'));

    // Búsqueda
    let searchTimeout;
    elements.searchInput?.addEventListener('input', e => {
        clearTimeout(searchTimeout);
        if (!e.target.value) { elements.searchResults.classList.add('hidden'); return; }
        searchTimeout = setTimeout(async () => {
            const results = await searchLocation(e.target.value);
            elements.searchResults.innerHTML = '';
            if (results.length > 0) {
                elements.searchResults.classList.remove('hidden');
                results.forEach(res => {
                    const li = document.createElement('li');
                    li.textContent = res.display_name;
                    li.onclick = () => handleSelectResult(res);
                    elements.searchResults.appendChild(li);
                });
            }
        }, 400);
    });

    async function handleSelectResult(res) {
        const point = { lat: parseFloat(res.lat), lng: parseFloat(res.lon), name: res.display_name };
        elements.searchResults.classList.add('hidden');
        elements.searchInput.value = '';

        if (points.length === 0) {
            navigator.geolocation.getCurrentPosition(pos => {
                points = [{ lat: pos.coords.latitude, lng: pos.coords.longitude, name: 'Mi ubicación' }, point];
                updateWaypointsUI();
                calculateAndShowRoute();
            }, () => {
                points = [point];
                showToast("GPS no disponible");
            });
        } else {
            points.push(point);
            updateWaypointsUI();
            calculateAndShowRoute();
        }
    }

    elements.btnAddWaypoint?.addEventListener('click', () => {
        elements.searchInput.focus();
        showToast("Escribe la parada");
    });

    // Repetir Indicación (Mute btn antiguo)
    elements.btnRepeatInstruction?.addEventListener('click', () => {
        repeatCurrentInstruction();
    });

    // Mi ubicación (HUD y Mapa)
    const centerUser = () => {
        navigator.geolocation.getCurrentPosition(pos => {
            mapInstance.flyTo({ center: [pos.coords.longitude, pos.coords.latitude], zoom: 18, pitch: 70 });
            updateUserMarker(pos.coords.longitude, pos.coords.latitude);
        });
    };
    elements.btnLocation?.addEventListener('click', centerUser);
    elements.btnNavLocation?.addEventListener('click', centerUser);

    // Guardado y Carga
    elements.btnOpenSaved?.addEventListener('click', async () => {
        elements.sidebar.classList.add('hidden');
        elements.modalOverlay.classList.remove('hidden');
        elements.modalLoad.classList.remove('hidden');
        const list = document.getElementById('saved-routes-list');
        list.innerHTML = '<li>Buscando...</li>';
        const routes = await getRoutesBackend();
        list.innerHTML = routes.length ? '' : '<li>Vacío</li>';
        routes.forEach(r => {
            const li = document.createElement('li');
            li.innerHTML = `<span>${r.nombre}</span> <button>CARGAR</button>`;
            li.querySelector('button').onclick = () => {
                closeModals();
                drawRoute(r.ruta_geojson);
                currentRouteDetails = { geojson: r.ruta_geojson, distance: 0, duration: 0, steps: [] };
                document.getElementById('bottom-panel').classList.remove('hidden');
            };
            list.appendChild(li);
        });
    });

    elements.btnSaveRoute?.addEventListener('click', () => {
        elements.modalOverlay.classList.remove('hidden');
        elements.modalSave.classList.remove('hidden');
    });

    elements.btnConfirmSave?.addEventListener('click', async () => {
        const name = document.getElementById('route-name').value || 'Ruta';
        const routeObj = {
            id: crypto.randomUUID(), nombre: name, origen: points[0]?.name, destino: points[points.length-1]?.name,
            waypoints: points.slice(1, -1).map(p => p.name), ruta_geojson: currentRouteDetails.geojson, fecha: new Date().toISOString()
        };
        if (await saveRouteBackend(routeObj)) { showToast("Guardada"); closeModals(); }
    });

    // Navegación
    elements.btnStartNav?.addEventListener('click', () => {
        document.getElementById('nav-hud').classList.remove('hidden');
        document.getElementById('bottom-panel').classList.add('hidden');
        document.getElementById('top-bar').classList.add('hidden');
        startNavTracking(currentRouteDetails);
    });

    elements.btnStopNav?.addEventListener('click', () => {
        document.getElementById('nav-hud').classList.add('hidden');
        document.getElementById('top-bar').classList.remove('hidden');
        stopNavTracking();
    });

    elements.btnClearRoute?.addEventListener('click', () => {
        points = []; updateWaypointsUI(); clearRoute();
        document.getElementById('bottom-panel').classList.add('hidden');
    });

    elements.btnCancelSave?.addEventListener('click', closeModals);
    elements.btnCloseLoad?.addEventListener('click', closeModals);
}

function updateWaypointsUI() {
    const container = document.getElementById('waypoints-container');
    const list = document.getElementById('waypoints-list');
    const btnAdd = document.getElementById('btn-add-waypoint');
    if (points.length < 2) { container.classList.add('hidden'); btnAdd.classList.add('hidden'); return; }
    container.classList.remove('hidden'); btnAdd.classList.remove('hidden');
    list.innerHTML = '';
    points.forEach((p, i) => {
        if (i === 0) return;
        const li = document.createElement('li');
        li.innerHTML = `<span>${p.name.split(',')[0]}</span> <button onclick="window.removeWaypoint(${i})">X</button>`;
        list.appendChild(li);
    });
}

window.removeWaypoint = (index) => {
    points.splice(index, 1); updateWaypointsUI();
    if (points.length >= 2) calculateAndShowRoute();
    else clearRoute();
};

async function calculateAndShowRoute() {
    if (points.length < 2) return;
    const transport = document.getElementById('pref-transport').value;
    const route = await getRoute(points, transport);
    if (route) {
        currentRouteDetails = route; drawRoute(route.geojson);
        document.getElementById('route-time').textContent = formatTime(route.duration);
        document.getElementById('route-distance').textContent = formatDistance(route.distance);
        document.getElementById('bottom-panel').classList.remove('hidden');
    }
}

function closeModals() {
    document.getElementById('modal-overlay').classList.add('hidden');
    document.getElementById('modal-save').classList.add('hidden');
    document.getElementById('modal-load').classList.add('hidden');
}

export function showToast(text) {
    const t = document.getElementById('toast');
    if (t) { t.textContent = text; t.classList.remove('hidden'); setTimeout(() => t.classList.add('hidden'), 3000); }
}
