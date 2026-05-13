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

    speak("Iniciando navegación profesional.");

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

// Nueva función para repetir la instrucción actual
export function repeatCurrentInstruction() {
    if (currentSteps[stepIndex]) {
        const instr = currentSteps[stepIndex].maneuver.instruction;
        speak(instr);
    } else {
        speak("Continúa por la ruta.");
    }
}

function processNav(pos) {
    const { latitude, longitude, heading, speed } = pos.coords;
    const spdKmH = Math.round((speed || 0) * 3.6);
    
    // Vista 3D PRO: Zoom cerca e inclinación fuerte para visión de ruta
    mapInstance.easeTo({
        center: [longitude, latitude],
        bearing: heading !== null ? heading : mapInstance.getBearing(),
        pitch: 70, // Inclinación fuerte para 3D
        zoom: spdKmH > 50 ? 16 : 18.5, // Zoom dinámico más cercano
        duration: 1000
    });

    document.getElementById('nav-speed').innerHTML = `${spdKmH} <small>km/h</small>`;
    
    if (currentSteps[stepIndex]) {
        const step = currentSteps[stepIndex];
        const distToStep = calculateDistance(latitude, longitude, step.maneuver.location[1], step.maneuver.location[0]);
        
        document.getElementById('nav-text').textContent = step.maneuver.instruction;
        document.getElementById('nav-dist-next').textContent = formatDistance(distToStep);
        
        const progress = (stepIndex / currentSteps.length) * 100;
        document.getElementById('nav-progress-bar').style.width = `${progress}%`;

        // Avisos vocales automáticos
        if (distToStep < 200 && distToStep > 180) {
            speak(`En 200 metros, ${step.maneuver.instruction}`);
        }

        if (distToStep < 30) {
            stepIndex++;
            if (stepIndex < currentSteps.length) {
                speak(currentSteps[stepIndex].maneuver.instruction);
            } else {
                speak("Has llegado a tu destino.");
                stopNavTracking();
            }
        }
    }
}
