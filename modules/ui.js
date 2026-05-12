import { mapInstance, drawRoute, clearRoute, updateUserMarker } from './map.js';
import { searchLocation } from './geocode.js';
import { getRoute } from './routing.js';
import { startNavTracking, stopNavTracking } from './navigation.js';
import { savePreferences, saveRouteBackend } from './storage.js';
import { formatDistance, formatTime } from './utils.js';

let points = []; // Array of {lat, lng, name}
let currentRouteDetails = null;

export function initUI(map) {
    // Splash
    setTimeout(() => document.getElementById('splash').classList.add('fade-out'), 1200);

    // Sidebar
    document.getElementById('btn-menu').addEventListener('click', () => document.getElementById('sidebar').classList.remove('hidden'));
    document.getElementById('close-menu').addEventListener('click', () => document.getElementById('sidebar').classList.add('hidden'));

    // Transport Change
    document.getElementById('pref-transport').addEventListener('change', (e) => {
        savePreferences('pref-transport', e.target.value);
        if (points.length >= 2) calculateAndShowRoute();
    });

    // Search Logic
    const searchInput = document.getElementById('search-input');
    const searchResults = document.getElementById('search-results');
    const btnAddStop = document.getElementById('btn-add-stop');
    let searchTimeout;

    searchInput.addEventListener('input', e => {
        clearTimeout(searchTimeout);
        if (!e.target.value) { searchResults.classList.add('hidden'); return; }
        searchTimeout = setTimeout(async () => {
            const results = await searchLocation(e.target.value);
            searchResults.innerHTML = '';
            if (results.length > 0) {
                searchResults.classList.remove('hidden');
                results.forEach(res => {
                    const li = document.createElement('li');
                    li.textContent = res.display_name;
                    li.addEventListener('click', () => handleSelectResult(res));
                    searchResults.appendChild(li);
                });
            }
        }, 400);
    });

    function handleSelectResult(res) {
        const point = { lat: parseFloat(res.lat), lng: parseFloat(res.lon), name: res.display_name };
        searchResults.classList.add('hidden');
        searchInput.value = '';
        
        // Si no hay puntos, el primero es mi ubicación (o el origen buscado)
        if (points.length === 0) {
            navigator.geolocation.getCurrentPosition(pos => {
                points = [
                    { lat: pos.coords.latitude, lng: pos.coords.longitude, name: 'Mi ubicación' },
                    point
                ];
                updateWaypointsUI();
                calculateAndShowRoute();
            });
        } else {
            // Añadir al final (como destino)
            points.push(point);
            updateWaypointsUI();
            calculateAndShowRoute();
        }
    }

    btnAddStop.addEventListener('click', () => {
        searchInput.focus();
        showToast('Busca una parada intermedia');
    });

    // Navigation Controls
    document.getElementById('btn-location').addEventListener('click', () => {
        navigator.geolocation.getCurrentPosition(pos => {
            mapInstance.flyTo({ center: [pos.coords.longitude, pos.coords.latitude], zoom: 17, pitch: 60 });
            updateUserMarker(pos.coords.longitude, pos.coords.latitude);
        });
    });

    document.getElementById('btn-start-nav').addEventListener('click', () => {
        if (!currentRouteDetails) return;
        document.getElementById('nav-hud').classList.remove('hidden');
        document.getElementById('route-panel').classList.add('hidden');
        document.getElementById('search-header').classList.add('hidden');
        startNavTracking(currentRouteDetails);
    });

    document.getElementById('btn-stop-nav').addEventListener('click', () => {
        document.getElementById('nav-hud').classList.add('hidden');
        document.getElementById('search-header').classList.remove('hidden');
        stopNavTracking();
    });

    document.getElementById('btn-clear-route').addEventListener('click', () => {
        points = [];
        updateWaypointsUI();
        clearRoute();
        document.getElementById('route-panel').classList.add('hidden');
    });
}

function updateWaypointsUI() {
    const container = document.getElementById('waypoints-list-ui');
    const btnAdd = document.getElementById('btn-add-stop');
    
    if (points.length < 2) {
        container.classList.add('hidden');
        btnAdd.classList.add('hidden');
        return;
    }

    container.classList.remove('hidden');
    btnAdd.classList.remove('hidden');
    container.innerHTML = '';
    
    // Solo mostramos las paradas intermedias y el destino (quitamos el origen de la lista visual si es "Mi ubicación")
    points.forEach((p, i) => {
        if (i === 0) return; // Ocultar origen de la lista de edición
        const div = document.createElement('div');
        div.className = 'wp-item';
        div.innerHTML = `
            <span class="material-symbols-outlined">${i === points.length - 1 ? 'location_on' : 'more_vert'}</span>
            <span class="wp-name">${p.name.split(',')[0]}</span>
            <span class="material-symbols-outlined remove" onclick="window.removeWaypoint(${i})">cancel</span>
        `;
        container.appendChild(div);
    });
}

// Global para que funcione el onclick
window.removeWaypoint = (index) => {
    points.splice(index, 1);
    updateWaypointsUI();
    if (points.length >= 2) calculateAndShowRoute();
    else clearRoute();
};

async function calculateAndShowRoute() {
    if (points.length < 2) return;
    const transport = document.getElementById('pref-transport').value;
    const route = await getRoute(points, transport);
    if (route) {
        currentRouteDetails = route;
        drawRoute(route.geojson);
        document.getElementById('route-distance').textContent = formatDistance(route.distance);
        document.getElementById('route-time').textContent = formatTime(route.duration);
        document.getElementById('route-panel').classList.remove('hidden');
        document.getElementById('btn-overview').classList.remove('hidden');
    }
}

export function showToast(text) {
    const t = document.getElementById('toast');
    t.textContent = text;
    t.classList.remove('hidden');
    setTimeout(() => t.classList.add('hidden'), 3000);
}
