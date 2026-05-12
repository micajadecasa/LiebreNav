export let mapInstance = null;
export let userMarker = null;
let routeGeojson = null;

export function initMap(containerId) {
    return new Promise((resolve) => {
        const styleUrl = 'https://demotiles.maplibre.org/style.json';

        mapInstance = new maplibregl.Map({
            container: containerId,
            style: styleUrl,
            center: [0, 0],
            zoom: 2,
            attributionControl: false
        });

        mapInstance.addControl(new maplibregl.NavigationControl(), 'top-right');

        mapInstance.on('load', () => {
            resolve(mapInstance);
        });
    });
}

export function drawRoute(geojson) {
    routeGeojson = geojson;
    if (!mapInstance.isStyleLoaded()) return;

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

export function redrawRouteIfExistent() {
    if (routeGeojson) drawRoute(routeGeojson);
}

export function clearRoute() {
    routeGeojson = null;
    if (mapInstance.getSource('route')) {
        mapInstance.getSource('route').setData({ type: 'FeatureCollection', features: [] });
    }
}

export function updateUserMarker(lng, lat, heading = 0) {
    if (!userMarker) {
        const el = document.createElement('div');
        el.className = 'user-marker';
        el.style.width = '24px';
        el.style.height = '24px';
        el.style.backgroundColor = '#2196F3';
        el.style.borderRadius = '50%';
        el.style.border = '3px solid white';
        el.style.boxShadow = '0 0 10px rgba(0,0,0,0.5)';
        
        const arrow = document.createElement('div');
        arrow.innerHTML = '▲';
        arrow.style.color = 'white';
        arrow.style.fontSize = '12px';
        arrow.style.textAlign = 'center';
        arrow.style.marginTop = '1px';
        arrow.style.transform = `rotate(${heading}deg)`;
        el.appendChild(arrow);

        userMarker = new maplibregl.Marker({ element: el })
            .setLngLat([lng, lat])
            .addTo(mapInstance);
    } else {
        userMarker.setLngLat([lng, lat]);
        const arrow = userMarker.getElement().firstChild;
        if(arrow) arrow.style.transform = `rotate(${heading}deg)`;
    }
}
