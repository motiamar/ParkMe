// Geocoding via Nominatim (OpenStreetMap) — free, no API key needed.
// Converts a text address into { lat, lng } coordinates.
// Returns null when the query produces no results.
export async function geocodeAddress(query) {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`;
  const res = await fetch(url, { headers: { 'Accept-Language': 'he,en' } });
  if (!res.ok) throw new Error('geocode request failed');
  const data = await res.json();
  if (data.length === 0) return null;
  return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
}
