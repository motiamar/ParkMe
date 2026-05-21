import { useState, useEffect } from 'react';
import { getOrCreateUserId } from '../utils/userId';
import { fetchFavoriteIds, addFavorite, removeFavorite } from '../utils/favoritesApi';

// Manages the current user's favorite parking lot IDs.
// Loads from the backend on mount and keeps local state in sync optimistically.
export function useFavorites() {
  const [favoriteIds, setFavoriteIds] = useState(new Set());

  useEffect(() => {
    async function load() {
      try {
        const userId = getOrCreateUserId();
        const ids = await fetchFavoriteIds(userId);
        setFavoriteIds(new Set(ids));
      } catch {
        // favorites unavailable — star states stay empty, not a fatal error
      }
    }
    load();
  }, []);

  // Optimistic toggle: flip local state immediately, then sync with the backend.
  // On error the local state is reverted so it stays consistent with the server.
  async function toggleFavorite(lotId) {
    const userId = getOrCreateUserId();
    const isFav = favoriteIds.has(lotId);

    setFavoriteIds(prev => {
      const next = new Set(prev);
      if (isFav) next.delete(lotId); else next.add(lotId);
      return next;
    });

    try {
      if (isFav) await removeFavorite(userId, lotId);
      else await addFavorite(userId, lotId);
    } catch {
      setFavoriteIds(prev => {
        const next = new Set(prev);
        if (isFav) next.add(lotId); else next.delete(lotId);
        return next;
      });
    }
  }

  return { favoriteIds, toggleFavorite };
}
