export async function searchLocation(query) {
    if (!query) return [];
    try {
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`;
        const res = await fetch(url);
        return await res.json();
    } catch (e) {
        console.error('Nominatim Error:', e);
        return [];
    }
}
