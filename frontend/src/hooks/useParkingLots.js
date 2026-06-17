import { useState, useEffect, useCallback } from 'react';

const API_URL = `${import.meta.env.VITE_API_URL}/api/parkinglots`;
const PAGE_SIZE = 20;

// Fetches parking lots from the backend, accumulating pages for "load more".
// Resets to page 1 whenever selectedSort or user location changes.
export function useParkingLots({ selectedSort, location }) {
  const [parkingLots, setParkingLots] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Reset to page 1 when sort or location changes.
  // The fetch effect below will run again because these same deps are listed there.
  useEffect(() => {
    setPage(1);
    setParkingLots([]);
    setTotalCount(0);
  }, [selectedSort, location?.lat, location?.lng]);

  useEffect(() => {
    let cancelled = false;

    async function fetchPage() {
      if (page === 1) setIsLoading(true);
      else setIsLoadingMore(true);
      setError(null);

      try {
        const params = new URLSearchParams();
        if (selectedSort !== 'default') params.set('sortBy', selectedSort);
        if (location) {
          params.set('userLat', location.lat);
          params.set('userLng', location.lng);
        }
        params.set('page', page);
        params.set('pageSize', PAGE_SIZE);

        const response = await fetch(`${API_URL}?${params}`);
        if (!response.ok) throw new Error(`Server returned status ${response.status}`);
        const data = await response.json();

        if (cancelled) return;

        // Support both the new paginated shape { items, totalCount } and a plain array
        // so the frontend degrades gracefully if the backend isn't deployed yet.
        const items = Array.isArray(data) ? data : (data.items ?? []);
        const count = Array.isArray(data) ? items.length : (data.totalCount ?? items.length);

        setParkingLots(prev => page === 1 ? items : [...prev, ...items]);
        setTotalCount(count);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) {
          setIsLoading(false);
          setIsLoadingMore(false);
        }
      }
    }

    fetchPage();
    return () => { cancelled = true; };
  // page is intentionally listed: incrementing it (via loadMore) triggers the next fetch.
  // When sort/location change, the effect above resets page to 1, which retriggers this one.
  }, [page, selectedSort, location?.lat, location?.lng]);

  const hasMore = parkingLots.length < totalCount;

  const loadMore = useCallback(() => {
    if (!isLoadingMore && !isLoading && hasMore) setPage(p => p + 1);
  }, [isLoadingMore, isLoading, hasMore]);

  return { parkingLots, isLoading, isLoadingMore, error, hasMore, loadMore };
}
