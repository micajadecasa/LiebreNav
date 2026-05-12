export let mapInstance = null;
export let userMarker = null;
let routeGeojson = null;

export function initMap(containerId) {
    return new Promise((resolve) => {
        // Estilos profesionales y detallados de CartoDB (basados en OSM)
        const isDark = document.body.classList.contains('dark-mode');
        const styleUrl = isDark 
            ? 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json'
            : 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json';

        mapInstance = new maplibregl.Map({
            container: containerId,
            style: styleUrl,
            center: [-3.7038, 40.4168], // Madrid por defecto
            zoom: 6,
            pitch: 45, // Inclinación 3D profesional
            bearing: 0,
            attributionControl: true
        });

        // Controles de navegación minimalistas
        mapInstance.addControl(new maplibregl.NavigationControl({
            visualizePitch: true,
            showZoom: true,
            showCompass: true
        }), 'top-right');

        mapInstance.on('load', () => {
            // Añadir edificios 3D si el estilo lo permite (capa fill-extrusion)
            const layers = mapInstance.getStyle().layers;
            const labelLayerId = layers.find(l => l.type === 'symbol' && l.layout['text-field'])?.id;

            if (mapInstance.getSource('openmaptiles') || mapInstance.getSource('carto')) {
                mapInstance.addLayer({
                    'id': '3d-buildings',
                    'source': 'carto', // CartoDB usa el nombre de fuente 'carto'
                    'source-layer': 'building',
                    'type': 'fill-extrusion',
                    'minzoom': 15,
                    'paint': {
                        'fill-extrusion-color': isDark ? '#444' : '#aaa',
                        'fill-extrusion-height': ['get', 'render_height'],
                        'fill-extrusion-base': ['get', 'render_min_height'],
                        'fill-extrusion-opacity': 0.6
                    }
                }, labelLayerId);
            }
            resolve(mapInstance);
        });
    });
}

export function updateUserMarker(lng, lat, heading = 0) {
    const transport = document.getElementById('pref-transport')?.value || 'driving';
    
    // Iconos SVG profesionales por tipo de transporte
    const icons = {
        driving: 'directions_car',
        motorcycle: 'motorcycle',
        cycling: 'directions_bike',
        walking: 'directions_walk'
    };

    if (!userMarker) {
        const el = document.createElement('div');
        el.className = 'user-marker-container';
        el.innerHTML = `
            <div class="user-marker-pulse"></div>
            <div class="user-marker-icon">
                <span class="material-symbols-outlined">${icons[transport]}</span>
                <div class="user-marker-arrow" style="transform: rotate(${heading}deg)"></div>
            </div>
        `;
        
        userMarker = new maplibregl.Marker({ element: el })
            .setLngLat([lng, lat])
            .addTo(mapInstance);
    } else {
        userMarker.setLngLat([lng, lat]);
        const arrow = userMarker.getElement().querySelector('.user-marker-arrow');
        const iconSpan = userMarker.getElement().querySelector('.material-symbols-outlined');
        if (arrow) arrow.style.transform = `rotate(${heading}deg)`;
        if (iconSpan) iconSpan.textContent = icons[transport];
    }
}

export function drawRoute(geojson) {
    routeGeojson = geojson;
    if (!mapInstance || !mapInstance.isStyleLoaded()) return;

    if (mapInstance.getSource('route')) {
        mapInstance.getSource('route').setData(geojson);
    } else {
        mapInstance.addSource('route', { type: 'geojson', data: geojson });
        mapInstance.addLayer({
            id: 'route-case',
            type: 'line',
            source: 'route',
            layout: { 'line-join': 'round', 'line-cap': 'round' },
            paint: { 'line-color': '#1565C0', 'line-width': 10, 'line-opacity': 0.3 }
        });
        mapInstance.addLayer({
            id: 'route',
            type: 'line',
            source: 'route',
            layout: { 'line-join': 'round', 'line-cap': 'round' },
            paint: { 'line-color': '#2196F3', 'line-width': 5 }
        });
    }

    const coords = geojson.features[0].geometry.coordinates;
    const bounds = coords.reduce((b, c) => b.extend(c), new maplibregl.LngLatBounds(coords[0], coords[0]));
    mapInstance.fitBounds(bounds, { padding: 80, speed: 1.2, curve: 1.1 });
}

export function clearRoute() {
    routeGeojson = null;
    if (mapInstance.getSource('route')) {
        mapInstance.getSource('route').setData({ type: 'FeatureCollection', features: [] });
    }
}
