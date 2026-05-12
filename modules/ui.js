import { centerOnUser, drawRoute, clearRoute } from './map.js';
import { searchLocation } from './geocode.js';
import { getRoute } from './routing.js';
import { savePreferences, saveRouteBackend, getRoutesBackend } from './storage.js';
import { speak } from './voice.js';

let currentOrigin = null;
let currentDestination = null;
let currentRouteDetails = null;
let navInterval = null;

export function initUI(map) {
    // Menu
    document.getElementById('btn-menu').addEventListener('click', () => {
        document.getElementById('sidebar').classList.remove('hidden');
    });
    document.getElementById('close-menu').addEventListener('click', () => {
        document.getElementById('sidebar').classList.add('hidden');
    });

    // Preferences
    document.getElementById('pref-dark-mode').addEventListener('change', (e) => {
        savePreferences('pref-dark-mode', e.target.checked);
    });
    document.getElementById('pref-voice').addEventListener('change', (e) => {
        savePreferences('pref-voice', e.target.checked);
    });
    document.getElementById('pref-transport').addEventListener('change', (e) => {
        savePreferences('pref-transport', e.target.value);
    });

    // Location
    document.getElementById('btn-location').addEventListener('click', centerOnUser);
    setTimeout(centerOnUser, 1000);

    // Search
    let searchTimeout;
    const searchInput = document.getElementById('search-input');
    const searchResults = document.getElementById('search-results');

    searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(async () => {
            const results = await searchLocation(e.target.value);
            searchResults.innerHTML = '';
            if (results.length > 0) {
                searchResults.classList.remove('hidden');
                results.forEach(res => {
                    const li = document.createElement('li');
                    li.textContent = res.display_name;
                    li.addEventListener('click', () => selectDestination(res));
                    searchResults.appendChild(li);
                });
            } else {
                searchResults.classList.add('hidden');
            }
        }, 500);
    });

    // Routing UI Actions
    document.getElementById('btn-close-route').addEventListener('click', () => {
        document.getElementById('bottom-panel').classList.add('hidden');
        document.getElementById('map-controls').classList.remove('shifted');
        clearRoute();
        currentRouteDetails = null;
        searchInput.value = '';
    });

    document.getElementById('btn-start-nav').addEventListener('click', startNavigation);
    document.getElementById('btn-stop-nav').addEventListener('click', stopNavigation);

    // Save Route
    document.getElementById('btn-save-route').addEventListener('click', () => {
        document.getElementById('modal-overlay').classList.remove('hidden');
        document.getElementById('modal-save').classList.remove('hidden');
    });

    document.getElementById('btn-confirm-save').addEventListener('click', async () => {
        if(!currentRouteDetails) return;
        const name = document.getElementById('route-name').value;
        const tags = document.getElementById('route-tags').value.split(',');
        const routeObj = {
            id: crypto.randomUUID(),
            nombre: name,
            origen: JSON.stringify(currentOrigin),
            destino: JSON.stringify(currentDestination),
            waypoints: [],
            ruta_geojson: currentRouteDetails.geojson,
            fecha: new Date().toISOString(),
            etiquetas: tags
        };
        await saveRouteBackend(routeObj);
        closeModals();
        alert('Ruta guardada');
    });

    // Load Routes
    document.getElementById('btn-rutas-guardadas').addEventListener('click', async () => {
        document.getElementById('sidebar').classList.add('hidden');
        document.getElementById('modal-overlay').classList.remove('hidden');
        document.getElementById('modal-load').classList.remove('hidden');
        const list = document.getElementById('saved-routes-list');
        list.innerHTML = '<li>Cargando...</li>';
        
        const routes = await getRoutesBackend();
        list.innerHTML = '';
        routes.forEach(r => {
            const li = document.createElement('li');
            li.innerHTML = `<span>${r.nombre}</span> <button>Cargar</button>`;
            li.querySelector('button').addEventListener('click', () => {
                closeModals();
                drawRoute(r.ruta_geojson);
                document.getElementById('route-distance').textContent = 'Ruta Cargada';
                document.getElementById('route-time').textContent = '';
                document.getElementById('bottom-panel').classList.remove('hidden');
                document.getElementById('map-controls').classList.add('shifted');
            });
            list.appendChild(li);
        });
    });

    // Modals
    document.querySelectorAll('.btn-cancel-modal').forEach(btn => {
        btn.addEventListener('click', closeModals);
    });
}

async function selectDestination(place) {
    document.getElementById('search-results').classList.add('hidden');
    document.getElementById('search-input').value = place.display_name;
    
    currentDestination = { lat: parseFloat(place.lat), lng: parseFloat(place.lon) };
    
    navigator.geolocation.getCurrentPosition(async pos => {
        currentOrigin = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        const transport = document.getElementById('pref-transport').value;
        
        const route = await getRoute(currentOrigin, currentDestination, transport);
        if (route) {
            currentRouteDetails = route;
            drawRoute(route.geojson);
            
            const distKm = (route.distance / 1000).toFixed(1);
            const timeMin = Math.round(route.duration / 60);
            
            document.getElementById('route-distance').textContent = `${distKm} km`;
            document.getElementById('route-time').textContent = `${timeMin} min`;
            
            document.getElementById('bottom-panel').classList.remove('hidden');
            document.getElementById('map-controls').classList.add('shifted');
            document.getElementById('route-summary').classList.remove('hidden');
            document.getElementById('nav-mode').classList.add('hidden');
        }
    });
}

function startNavigation() {
    document.getElementById('route-summary').classList.add('hidden');
    document.getElementById('nav-mode').classList.remove('hidden');
    
    let currentStepIndex = 0;
    const steps = currentRouteDetails.steps;

    const updateNav = () => {
        if (currentStepIndex >= steps.length) {
            stopNavigation();
            speak("Has llegado a tu destino");
            return;
        }

        const step = steps[currentStepIndex];
        const instruction = step.maneuver.instruction || "Continúa";
        document.getElementById('turn-text').textContent = instruction;
        document.getElementById('next-turn-dist').textContent = `${Math.round(step.distance)} m`;
        
        if (!navInterval) {
            speak(instruction);
        }
    };

    updateNav();
    
    navInterval = setInterval(() => {
        currentStepIndex++;
        updateNav();
        if(currentStepIndex < steps.length) speak(steps[currentStepIndex].maneuver.instruction || "Continúa");
    }, 15000);
}

function stopNavigation() {
    document.getElementById('route-summary').classList.remove('hidden');
    document.getElementById('nav-mode').classList.add('hidden');
    clearInterval(navInterval);
    navInterval = null;
}

function closeModals() {
    document.getElementById('modal-overlay').classList.add('hidden');
    document.getElementById('modal-save').classList.add('hidden');
    document.getElementById('modal-load').classList.add('hidden');
}
