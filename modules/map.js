export let mapInstance = null;
export let userMarker = null;

export function initMap(containerId) {
    return new Promise((resolve) => {
        const isDark = document.body.classList.contains('dark-mode');
        // Estilo enfocado a navegación
        const styleUrl = isDark 
            ? 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json'
            : 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json';

        mapInstance = new maplibregl.Map({
            container: containerId,
            style: styleUrl,
            center: [-3.7038, 40.4168],
            zoom: 12,
            pitch: 0,
            attributionControl: true
        });

        mapInstance.on('load', () => {
            // Capa de edificios 3D
            if (mapInstance.getSource('carto')) {
                mapInstance.addLayer({
                    'id': '3d-buildings',
                    'source': 'carto',
                    'source-layer': 'building',
                    'type': 'fill-extrusion',
                    'minzoom': 15,
                    'paint': {
                        'fill-extrusion-color': isDark ? '#333' : '#ddd',
                        'fill-extrusion-height': ['get', 'render_height'],
                        'fill-extrusion-opacity': 0.6
                    }
                });
            }
            resolve(mapInstance);
        });
    });
}

export function drawRoute(geojson) {
    if (!mapInstance.isStyleLoaded()) return;

    if (mapInstance.getSource('route')) {
        mapInstance.getSource('route').setData(geojson);
    } else {
        mapInstance.addSource('route', { type: 'geojson', data: geojson });
        // Línea de borde (Sombra/Contorno)
        mapInstance.addLayer({
            id: 'route-outline',
            type: 'line',
            source: 'route',
            paint: { 'line-color': '#000', 'line-width': 10, 'line-opacity': 0.2 }
        });
        // Línea principal azul Apple/Garmin
        mapInstance.addLayer({
            id: 'route',
            type: 'line',
            source: 'route',
            layout: { 'line-join': 'round', 'line-cap': 'round' },
            paint: { 'line-color': '#007AFF', 'line-width': 6 }
        });
    }

    const coords = geojson.features[0].geometry.coordinates;
    const bounds = coords.reduce((b, c) => b.extend(c), new maplibregl.LngLatBounds(coords[0], coords[0]));
    mapInstance.fitBounds(bounds, { padding: 100, speed: 1.5 });
}

export function clearRoute() {
    if (mapInstance.getSource('route')) {
        mapInstance.getSource('route').setData({ type: 'FeatureCollection', features: [] });
    }
}

export function updateUserMarker(lng, lat) {
    if (!userMarker) {
        const el = document.createElement('div');
        el.className = 'user-pos';
        el.style.width = '20px'; el.style.height = '20px';
        el.style.background = '#007AFF'; el.style.border = '3px solid white';
        el.style.borderRadius = '50%'; el.style.boxShadow = '0 0 15px rgba(0,122,255,0.6)';
        
        userMarker = new maplibregl.Marker({ element: el })
            .setLngLat([lng, lat])
            .addTo(mapInstance);
    } else {
        userMarker.setLngLat([lng, lat]);
    }
}
