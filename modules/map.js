let mapInstance = null;
let userMarker = null;
let routeLayerId = 'route';

export function initMap(containerId) {
    const isDark = document.body.classList.contains('dark-mode');
    const styleUrl = isDark 
        ? 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json'
        : 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json';

    mapInstance = new maplibregl.Map({
        container: containerId,
        style: styleUrl,
        center: [-3.7038, 40.4168], // Madrid default
        zoom: parseInt(localStorage.getItem('pref-zoom')) || 12,
        attributionControl: false
    });

    mapInstance.addControl(new maplibregl.NavigationControl(), 'top-right');
    return mapInstance;
}

export function updateMapStyle(isDark) {
    if (!mapInstance) return;
    const styleUrl = isDark 
        ? 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json'
        : 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json';
    mapInstance.setStyle(styleUrl);
}

export function centerOnUser() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
        pos => {
            const coords = [pos.coords.longitude, pos.coords.latitude];
            mapInstance.flyTo({ center: coords, zoom: 15 });
            
            if (userMarker) userMarker.remove();
            
            const el = document.createElement('div');
            el.className = 'user-marker';
            el.style.width = '20px';
            el.style.height = '20px';
            el.style.backgroundColor = '#2196F3';
            el.style.borderRadius = '50%';
            el.style.border = '3px solid white';
            el.style.boxShadow = '0 0 10px rgba(0,0,0,0.5)';
            
            userMarker = new maplibregl.Marker({ element: el })
                .setLngLat(coords)
                .addTo(mapInstance);
        },
        err => console.error('Error getting location', err),
        { enableHighAccuracy: true }
    );
}

export function drawRoute(geojson) {
    if (mapInstance.getSource(routeLayerId)) {
        mapInstance.getSource(routeLayerId).setData(geojson);
    } else {
        mapInstance.addSource(routeLayerId, {
            type: 'geojson',
            data: geojson
        });
        mapInstance.addLayer({
            id: routeLayerId,
            type: 'line',
            source: routeLayerId,
            layout: {
                'line-join': 'round',
                'line-cap': 'round'
            },
            paint: {
                'line-color': '#2196F3',
                'line-width': 5
            }
        });
    }

    const coordinates = geojson.features[0].geometry.coordinates;
    const bounds = coordinates.reduce((bounds, coord) => {
        return bounds.extend(coord);
    }, new maplibregl.LngLatBounds(coordinates[0], coordinates[0]));
    
    mapInstance.fitBounds(bounds, { padding: 50 });
}

export function clearRoute() {
    if (mapInstance.getSource(routeLayerId)) {
        mapInstance.getSource(routeLayerId).setData({ type: 'FeatureCollection', features: [] });
    }
}
