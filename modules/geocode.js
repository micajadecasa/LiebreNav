export async function searchLocation(query) {
    if (!query) return [];
    try {
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`;
        const response = await fetch(url);
        return await response.json();
    } catch (e) {
        console.error('Geocoding error:', e);
        return [];
    }
}
