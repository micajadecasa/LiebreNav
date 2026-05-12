import { mapInstance } from './map.js';
import { calculateDistance, formatDistance } from './utils.js';
import { speak } from './voice.js';

let watchId = null;
let currentSteps = [];
let stepIndex = 0;
let totalDistance = 0;

export function startNavTracking(routeDetails) {
    if (!navigator.geolocation) return;
    currentSteps = routeDetails.steps;
    totalDistance = routeDetails.distance;
    stepIndex = 0;

    speak("Navegación iniciada.");

    watchId = navigator.geolocation.watchPosition(
        pos => processNav(pos),
        err => console.error(err),
        { enableHighAccuracy: true, frequency: 1000 }
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
    const spdKmH = Math.round((speed || 0) * 3.6);
    
    // Auto-Rotate & Pitch
    mapInstance.easeTo({
        center: [longitude, latitude],
        bearing: heading !== null ? heading : mapInstance.getBearing(),
        pitch: 60,
        zoom: spdKmH > 60 ? 14 : 17,
        duration: 1000
    });

    document.getElementById('nav-speed').innerHTML = `${spdKmH} <small>km/h</small>`;
    document.getElementById('nav-dist-total').innerHTML = formatDistance(totalDistance);

    if (currentSteps[stepIndex]) {
        const step = currentSteps[stepIndex];
        const distToStep = calculateDistance(latitude, longitude, step.maneuver.location[1], step.maneuver.location[0]);
        
        document.getElementById('nav-text').textContent = step.maneuver.instruction;
        document.getElementById('nav-dist-next').textContent = formatDistance(distToStep);
        
        // Progress bar
        const progress = (stepIndex / currentSteps.length) * 100;
        document.getElementById('nav-progress-bar').style.width = `${progress}%`;

        // Instrucción por voz y vibración
        if (distToStep < 150 && distToStep > 130) {
            speak(`En 150 metros, ${step.maneuver.instruction}`);
            if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
        }

        if (distToStep < 20) {
            stepIndex++;
            if (stepIndex >= currentSteps.length) {
                speak("Has llegado a tu destino.");
                stopNavTracking();
            }
        }
    }
}
