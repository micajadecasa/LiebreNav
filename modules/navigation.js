import { mapInstance } from './map.js';
import { calculateDistance, formatDistance } from './utils.js';
import { speak } from './voice.js';

let watchId = null;
let currentSteps = [];
let stepIndex = 0;
let totalDistance = 0;
let distanceCovered = 0;

export function startNavTracking(routeDetails) {
    if (!navigator.geolocation) return;
    currentSteps = routeDetails.steps;
    totalDistance = routeDetails.distance;
    stepIndex = 0;
    distanceCovered = 0;

    speak("Iniciando navegación. Sigue la ruta trazada.");

    watchId = navigator.geolocation.watchPosition(
        pos => processNav(pos),
        err => console.error(err),
        { enableHighAccuracy: true, maximumAge: 0 }
    );
}

export function stopNavTracking() {
    if (watchId) navigator.geolocation.clearWatch(watchId);
    watchId = null;
    mapInstance.setPitch(0);
    mapInstance.setBearing(0);
}

function processNav(pos) {
    const { latitude, longitude, heading, speed } = pos.coords;
    
    // Rotate and Pitch
    if (heading !== null) {
        mapInstance.easeTo({ bearing: heading, pitch: 60, center: [longitude, latitude], duration: 1000 });
    }

    // Progress Bar
    if (currentSteps[stepIndex]) {
        const step = currentSteps[stepIndex];
        const distToStep = calculateDistance(latitude, longitude, step.maneuver.location[1], step.maneuver.location[0]);
        
        document.getElementById('nav-text').textContent = step.maneuver.instruction;
        document.getElementById('nav-dist-next').textContent = formatDistance(distToStep);
        
        // Progress (Visual simplification)
        const progress = Math.min(100, (stepIndex / currentSteps.length) * 100);
        document.getElementById('nav-progress-bar').style.width = `${progress}%`;

        if (distToStep < 25) {
            stepIndex++;
            if (stepIndex < currentSteps.length) {
                speak(currentSteps[stepIndex].maneuver.instruction);
                if (localStorage.getItem('pref-vibration') === 'true' && navigator.vibrate) {
                    navigator.vibrate([200, 100, 200]);
                }
            } else {
                speak("Has llegado a tu destino. Gracias por usar LiebreNav.");
                if (navigator.vibrate) navigator.vibrate(500);
            }
        }
    }

    document.getElementById('nav-speed').innerHTML = `${Math.round((speed || 0) * 3.6)} <small>km/h</small>`;
}
