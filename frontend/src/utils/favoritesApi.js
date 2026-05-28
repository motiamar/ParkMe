const API_BASE = `${import.meta.env.VITE_API_URL}/api/favorites`;

export async function fetchFavoriteIds(userId) {
  const res = await fetch(`${API_BASE}/${userId}`);
  if (!res.ok) throw new Error(`Failed to fetch favorites: ${res.status}`);
  return res.json(); // number[]
}

export async function addFavorite(userId, parkingLotId) {
  const res = await fetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, parkingLotId }),
  });
  if (!res.ok) throw new Error(`Failed to add favorite: ${res.status}`);
}

export async function removeFavorite(userId, parkingLotId) {
  const res = await fetch(API_BASE, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, parkingLotId }),
  });
  if (!res.ok) throw new Error(`Failed to remove favorite: ${res.status}`);
}
