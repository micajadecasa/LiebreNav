import { mapInstance, drawRoute, clearRoute, updateUserMarker } from './map.js';
import { searchLocation } from './geocode.js';
import { getRoute } from './routing.js';
import { startNavTracking, stopNavTracking } from './navigation.js';
import { savePreferences, saveRouteBackend, getRoutesBackend } from './storage.js';
import { formatDistance, formatTime } from './utils.js';
import { toggleMute } from './voice.js';

let points = []; // Array of {lat, lng, name}
let currentRouteDetails = null;

export function initUI(map) {
    // Hide Splash
    setTimeout(() => {
        document.getElementById('splash').classList.add('fade-out');
    }, 1500);

    // Sidebar
    document.getElementById('btn-menu').addEventListener('click', () => {
        document.getElementById('sidebar').classList.remove('hidden');
    });
    document.getElementById('close-menu').addEventListener('click', () => {
        document.getElementById('sidebar').classList.add('hidden');
    });

    // Preferences
    document.querySelectorAll('.preferences input, .preferences select').forEach(el => {
        el.addEventListener('change', e => {
            const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
            savePreferences(e.target.id, val);
            showBanner(`Ajuste actualizado: ${e.target.id.replace('pref-', '')}`);
        });
    });

    // Search & Waypoints
    const searchInput = document.getElementById('search-input');
    const searchResults = document.getElementById('search-results');
    const btnAddWaypoint = document.getElementById('btn-add-waypoint');

    let searchTimeout;
    searchInput.addEventListener('input', e => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(async () => {
            const results = await searchLocation(e.target.value);
            searchResults.innerHTML = '';
            if (results.length > 0) {
                searchResults.classList.remove('hidden');
                results.forEach(res => {
                    const li = document.createElement('li');
                    li.textContent = res.display_name;
                    li.addEventListener('click', () => {
                        const point = { lat: parseFloat(res.lat), lng: parseFloat(res.lon), name: res.display_name };
                        handleSelectResult(point);
                    });
                    searchResults.appendChild(li);
                });
            } else {
                searchResults.classList.add('hidden');
            }
        }, 500);
    });

    function handleSelectResult(point) {
        searchResults.classList.add('hidden');
        searchInput.value = point.name;
        
        // Marker temporal con rebote
        const el = document.createElement('div');
        el.className = 'material-symbols-outlined';
        el.style.color = '#f44336';
        el.style.fontSize = '32px';
        el.textContent = 'location_on';
        el.style.animation = 'bounce 0.5s ease infinite alternate';

        const marker = new maplibregl.Marker({ element: el })
            .setLngLat([point.lng, point.lat])
            .addTo(mapInstance);

        mapInstance.flyTo({ center: [point.lng, point.lat], zoom: 16 });
        
        // Si no hay puntos, este es el destino inicial
        if (points.length === 0) {
            // Conseguir origen primero
            navigator.geolocation.getCurrentPosition(pos => {
                points = [
                    { lat: pos.coords.latitude, lng: pos.coords.longitude, name: 'Mi ubicación' },
                    point
                ];
                calculateAndShowRoute();
            });
        } else {
            // Reemplazar destino o añadir waypoint?
            // Para LiebreNav 3.0, el buscador principal busca el DESTINO si no hay ruta, 
            // o añade waypoint si ya hay algo.
            points[points.length - 1] = point; 
            calculateAndShowRoute();
        }
    }

    btnAddWaypoint.addEventListener('click', () => {
        if (points.length < 2) {
            showBanner('Busca un destino primero');
            return;
        }
        // Lógica para añadir punto intermedio
        showBanner('Selecciona punto intermedio en el mapa o busca');
        // Por simplificación en esta versión, añadiríamos al array antes del destino
    });

    // Navigation Controls
    document.getElementById('btn-location').addEventListener('click', () => {
        navigator.geolocation.getCurrentPosition(pos => {
            mapInstance.flyTo({ center: [pos.coords.longitude, pos.coords.latitude], zoom: 17, speed: 1.5 });
            updateUserMarker(pos.coords.longitude, pos.coords.latitude);
            if (navigator.vibrate) navigator.vibrate(50);
        });
    });

    document.getElementById('btn-start-nav').addEventListener('click', () => {
        document.getElementById('nav-hud').classList.remove('hidden');
        document.getElementById('bottom-panel').classList.add('hidden');
        document.getElementById('top-bar').classList.add('hidden');
        startNavTracking(currentRouteDetails);
        if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
    });

    document.getElementById('btn-stop-nav').addEventListener('click', () => {
        document.getElementById('nav-hud').classList.add('hidden');
        document.getElementById('top-bar').classList.remove('hidden');
        stopNavTracking();
    });

    document.getElementById('btn-close-route').addEventListener('click', () => {
        points = [];
        clearRoute();
        document.getElementById('bottom-panel').classList.add('hidden');
        searchInput.value = '';
    });
}

async function calculateAndShowRoute() {
    if (points.length < 2) return;
    showBanner('Calculando ruta...');
    const transport = document.getElementById('pref-transport').value;
    const route = await getRoute(points, transport);
    if (route) {
        currentRouteDetails = route;
        drawRoute(route.geojson);
        document.getElementById('route-distance').textContent = formatDistance(route.distance);
        document.getElementById('route-time').textContent = formatTime(route.duration);
        document.getElementById('bottom-panel').classList.remove('hidden');
        showBanner('Ruta lista');
    }
}

export function showBanner(text) {
    const banner = document.getElementById('status-banner');
    document.getElementById('status-text').textContent = text;
    banner.classList.remove('hidden');
    setTimeout(() => { banner.classList.add('hidden'); }, 3000);
}

function closeModals() {
    document.getElementById('modal-overlay').classList.add('hidden');
}
