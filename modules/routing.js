let currentRouteData = null;

export async function getRoute(origin, destination, transport) {
    let profile = 'driving';
    if (transport === 'cycling' || transport === 'motorcycle') profile = 'bike';
    if (transport === 'walking') profile = 'foot';

    const coords = `${origin.lng},${origin.lat};${destination.lng},${destination.lat}`;
    const url = `https://router.project-osrm.org/route/v1/${profile}/${coords}?overview=full&geometries=geojson&steps=true`;

    try {
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.code !== 'Ok') throw new Error('Route not found');

        currentRouteData = data.routes[0];
        
        const geojson = {
            type: 'FeatureCollection',
            features: [{
                type: 'Feature',
                properties: {},
                geometry: currentRouteData.geometry
            }]
        };

        return {
            geojson,
            distance: currentRouteData.distance, // in meters
            duration: currentRouteData.duration, // in seconds
            steps: currentRouteData.legs[0].steps,
            raw: data
        };
    } catch (e) {
        console.error('Routing error:', e);
        return null;
    }
}
