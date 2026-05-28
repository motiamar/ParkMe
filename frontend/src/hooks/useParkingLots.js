import { useState, useEffect } from 'react';

const API_URL = `${import.meta.env.VITE_API_URL}/api/parkinglots`;

// Fetches parking lots from the backend whenever selectedSort or user location changes.
// The backend handles all sorting — the hook only builds the URL and stores the result.
export function useParkingLots({ selectedSort, location }) {
  const [parkingLots, setParkingLots] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchParkingLots() {
      setIsLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (selectedSort !== 'default') params.set('sortBy', selectedSort);
        if (location) {
          params.set('userLat', location.lat);
          params.set('userLng', location.lng);
        }
        const url = params.size > 0 ? `${API_URL}?${params}` : API_URL;
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Server returned status ${response.status}`);
        const data = await response.json();
        setParkingLots(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }
    fetchParkingLots();
  // Use primitive lat/lng values (not the location object) to avoid re-fetching
  // when the parent re-renders with a new object reference for the same coordinates.
  }, [selectedSort, location?.lat, location?.lng]);

  return { parkingLots, isLoading, error };
}
