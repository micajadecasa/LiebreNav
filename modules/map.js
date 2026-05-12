export let mapInstance = null;
export let userMarker = null;

export function initMap(containerId) {
    return new Promise((resolve) => {
        const isDark = document.body.classList.contains('dark-mode');
        const styleUrl = isDark 
            ? 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json'
            : 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json';

        mapInstance = new maplibregl.Map({
            container: containerId,
            style: styleUrl,
            center: [-3.7038, 40.4168],
            zoom: 12,
            pitch: 45,
            attributionControl: true
        });

        mapInstance.on('load', () => {
            resolve(mapInstance);
        });

        // Fail-safe
        setTimeout(() => resolve(mapInstance), 4000);
    });
}

export function updateUserMarker(lng, lat, heading = 0) {
    if (!userMarker) {
        const el = document.createElement('div');
        el.className = 'user-marker-icon';
        el.style.width = '30px';
        el.style.height = '30px';
        el.style.background = '#2196F3';
        el.style.borderRadius = '50%';
        el.style.border = '2px solid white';
        el.style.boxShadow = '0 0 10px rgba(0,0,0,0.5)';
        
        userMarker = new maplibregl.Marker({ element: el })
            .setLngLat([lng, lat])
            .addTo(mapInstance);
    } else {
        userMarker.setLngLat([lng, lat]);
    }
}

export function drawRoute(geojson) {
    if (!mapInstance || !mapInstance.isStyleLoaded()) return;
    if (mapInstance.getSource('route')) {
        mapInstance.getSource('route').setData(geojson);
    } else {
        mapInstance.addSource('route', { type: 'geojson', data: geojson });
        mapInstance.addLayer({
            id: 'route',
            type: 'line',
            source: 'route',
            layout: { 'line-join': 'round', 'line-cap': 'round' },
            paint: { 'line-color': '#2196F3', 'line-width': 6 }
        });
    }
    const coords = geojson.features[0].geometry.coordinates;
    const bounds = coords.reduce((b, c) => b.extend(c), new maplibregl.LngLatBounds(coords[0], coords[0]));
    mapInstance.fitBounds(bounds, { padding: 50 });
}

export function clearRoute() {
    if (mapInstance.getSource('route')) {
        mapInstance.getSource('route').setData({ type: 'FeatureCollection', features: [] });
    }
}
