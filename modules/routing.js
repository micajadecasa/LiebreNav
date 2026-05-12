export async function getRoute(points, transport) {
    let profile = 'driving';
    if (transport === 'cycling') profile = 'cycling';
    if (transport === 'walking') profile = 'foot';
    if (transport === 'driving' || transport === 'motorcycle') profile = 'driving';

    // Format: lng,lat;lng,lat;...
    const coordsStr = points.map(p => `${p.lng},${p.lat}`).join(';');
    const url = `https://router.project-osrm.org/route/v1/${profile}/${coordsStr}?overview=full&geometries=geojson&steps=true`;

    try {
        const res = await fetch(url);
        const data = await res.json();
        
        if (data.code !== 'Ok') throw new Error('OSRM Error');

        const route = data.routes[0];
        return {
            geojson: {
                type: 'FeatureCollection',
                features: [{ type: 'Feature', geometry: route.geometry, properties: {} }]
            },
            distance: route.distance,
            duration: route.duration,
            steps: route.legs.flatMap(leg => leg.steps), // Merge steps from all legs (waypoints)
            raw: data
        };
    } catch (e) {
        console.error('Routing Error:', e);
        return null;
    }
}
