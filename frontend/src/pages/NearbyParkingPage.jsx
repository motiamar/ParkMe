import { useState, useEffect } from 'react';

// The backend API URL.
// The .NET backend runs on port 5176 in development (see backend/Properties/launchSettings.json).
// CORS is configured in backend/Program.cs to allow requests from http://localhost:5173.
const API_URL = 'http://localhost:5176/api/parkinglots';

// Results screen — shown after the user grants location permission.
// Fetches all parking lots from the backend and displays them in a simple list.
function NearbyParkingPage({ onNavigate, location }) {

  // parkingLots: the array of parking lot objects returned by the backend.
  //              Starts as an empty array — filled after the fetch succeeds.
  const [parkingLots, setParkingLots] = useState([]);

  // isLoading: true while the HTTP request is in flight.
  //            Used to show a "Loading..." message and hide the list.
  const [isLoading, setIsLoading] = useState(true);

  // error: null when everything is fine.
  //        Set to an error message string if the request fails for any reason
  //        (network down, server error, etc.).
  const [error, setError] = useState(null);

  // useEffect runs the function inside it after the component first appears on screen.
  // The empty array [] as the second argument means "run this only once on mount,
  // not on every re-render."
  useEffect(() => {

    // fetch() is asynchronous, so we define an async helper function inside useEffect.
    // (useEffect itself cannot be marked async directly.)
    async function fetchParkingLots() {
      try {
        // --- Step 1: Send the GET request to the backend ---
        // fetch() returns a Promise that resolves to a Response object.
        // The backend controller (Controllers/ParkingLotsController.cs) handles this route
        // and returns a JSON array read from Data/parkingLots.json.
        const response = await fetch(API_URL);

        // --- Step 2: Check for HTTP errors ---
        // response.ok is true for 2xx status codes (200, 201, etc.).
        // A 404 or 500, for example, would set ok to false — we treat those as errors.
        if (!response.ok) {
          throw new Error(`Server returned status ${response.status}`);
        }

        // --- Step 3: Parse the response body ---
        // response.json() reads the response body and parses it as JSON.
        // The result is a JavaScript array of parking lot objects.
        const data = await response.json();
        setParkingLots(data);

      } catch (err) {
        // Catches both network errors (e.g. backend is not running)
        // and the manual error thrown above for non-OK responses.
        setError(err.message);

      } finally {
        // Always runs after try/catch — whether the request succeeded or failed.
        // Turns off the loading indicator so the UI can show results or an error.
        setIsLoading(false);
      }
    }

    fetchParkingLots();

  }, []); // empty dependency array — run once when the component mounts

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  return (
    <div style={styles.page}>

      {/* --- Header: title, user coordinates, back button --- */}
      <div style={styles.header}>
        <h1 style={styles.title}>Nearby Parking</h1>

        {/* Show the user's coordinates only if they were passed down from the controller */}
        {location && (
          <p style={styles.coords}>
            📍 {location.lat.toFixed(5)}, {location.lng.toFixed(5)}
          </p>
        )}

        {/* Back button — calls the navigation handler passed down from controllers/App.jsx */}
        <button style={styles.backButton} onClick={() => onNavigate('landing')}>
          ← Back
        </button>
      </div>

      {/* --- Loading state: shown while the fetch is in progress --- */}
      {isLoading && (
        <p style={styles.statusText}>Loading parking lots...</p>
      )}

      {/* --- Error state: shown if the fetch failed --- */}
      {!isLoading && error && (
        <div style={styles.errorBox}>
          <p style={styles.errorText}>Could not load parking lots.</p>
          <p style={styles.errorDetail}>{error}</p>
          <p style={styles.errorDetail}>Make sure the backend is running on port 5176.</p>
        </div>
      )}

      {/* --- Empty state: shown if the request succeeded but returned zero items --- */}
      {!isLoading && !error && parkingLots.length === 0 && (
        <p style={styles.statusText}>No parking lots found.</p>
      )}

      {/* --- Success state: render a card for each parking lot --- */}
      {!isLoading && !error && parkingLots.length > 0 && (
        <ul style={styles.list}>
          {parkingLots.map((lot) => (
            // lot.id is the unique key React uses to efficiently update the list.
            // Each property on `lot` matches a field in backend/Models/ParkingLot.cs.
            <li key={lot.id} style={styles.card}>

              {/* Parking lot name — the most prominent field on the card */}
              <p style={styles.lotName}>{lot.name}</p>

              {/* Address */}
              <p style={styles.lotDetail}>📍 {lot.address}</p>

              {/* Price per hour */}
              <p style={styles.lotDetail}>💰 ₪{lot.pricePerHour} / hour</p>

              {/* Available spaces out of total spaces */}
              <p style={styles.lotDetail}>
                🅿️ {lot.availableSpaces} / {lot.totalSpaces} spaces available
              </p>

            </li>
          ))}
        </ul>
      )}

    </div>
  );
}

// -------------------------------------------------------------------------
// Styles — plain JavaScript objects passed to the style prop.
// No CSS file needed; keeps this component self-contained.
// -------------------------------------------------------------------------
const styles = {

  // Outer page wrapper: light grey background, full height, scrollable
  page: {
    minHeight: '100vh',
    backgroundColor: '#f3f4f6',
    padding: '24px 16px',
    boxSizing: 'border-box',
    fontFamily: 'sans-serif',
    maxWidth: '480px',
    margin: '0 auto',
  },

  // Top section containing the title, coordinates, and back button
  header: {
    marginBottom: '24px',
  },

  // Page title
  title: {
    fontSize: '1.8rem',
    fontWeight: '700',
    color: '#111827',
    margin: '0 0 6px 0',
  },

  // Small monospace coordinates line below the title
  coords: {
    fontSize: '0.8rem',
    color: '#9ca3af',
    fontFamily: 'monospace',
    margin: '0 0 14px 0',
  },

  // Outlined back button — secondary, low-emphasis
  backButton: {
    padding: '8px 16px',
    fontSize: '0.9rem',
    cursor: 'pointer',
    borderRadius: '8px',
    border: '1px solid #d1d5db',
    backgroundColor: '#ffffff',
    color: '#374151',
  },

  // Centered grey text used for Loading and Empty states
  statusText: {
    fontSize: '1rem',
    color: '#9ca3af',
    textAlign: 'center',
    marginTop: '60px',
  },

  // Red container shown when the fetch fails
  errorBox: {
    backgroundColor: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: '12px',
    padding: '20px',
    marginTop: '40px',
    textAlign: 'center',
  },

  errorText: {
    fontSize: '1rem',
    fontWeight: '600',
    color: '#dc2626',
    margin: '0 0 8px 0',
  },

  errorDetail: {
    fontSize: '0.85rem',
    color: '#ef4444',
    margin: '4px 0 0 0',
  },

  // Unstyled vertical list of cards
  list: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },

  // White rounded card for a single parking lot
  card: {
    backgroundColor: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: '12px',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },

  // Bold name at the top of each card
  lotName: {
    fontSize: '1.05rem',
    fontWeight: '600',
    color: '#111827',
    margin: 0,
  },

  // Smaller detail lines (address, price, availability)
  lotDetail: {
    fontSize: '0.9rem',
    color: '#6b7280',
    margin: 0,
  },

};

export default NearbyParkingPage;
