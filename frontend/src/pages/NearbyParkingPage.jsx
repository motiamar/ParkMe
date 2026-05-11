import { useState, useEffect, useRef } from 'react';

// Leaflet map library — free, open-source, no API key required.
// Circle + CircleMarker are used instead of the default Marker to avoid a known
// Leaflet + Vite asset-path bug with the default marker icon images.
import { MapContainer, TileLayer, CircleMarker, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

// Backend API URL — reads parking lots from Data/parkingLots.json via ParkingLotService.
// CORS in backend/Program.cs allows http://localhost:5173.
const API_URL = 'http://localhost:5176/api/parkinglots';

// The two snap positions for the draggable panel (% of viewport height from the top).
// PEEK   = panel is small, most of the map is visible.
// HALF   = panel covers roughly half the screen (default on load).
const SNAP_PEEK = 47;
const SNAP_HALF = 15;

// NearbyParkingPage
// Layout: real Leaflet map (top) + draggable scrollable parking list panel (bottom).
// Back button removed as of Task 70.
function NearbyParkingPage({ location }) {

  // Parking data from the backend
  const [parkingLots, setParkingLots] = useState([]);
  const [isLoading, setIsLoading]     = useState(true);
  const [error, setError]             = useState(null);

  // panelTop: how far from the top of the screen the panel starts (in vh units).
  // Lower value = panel higher up = more list visible, less map visible.
  const [panelTop, setPanelTop]       = useState(SNAP_PEEK);

  // isDragging: true only while the user holds the handle.
  // Used to disable the CSS transition so dragging feels instant.
  const [isDragging, setIsDragging]   = useState(false);

  // dragRef stores drag state that must NOT trigger re-renders on every pixel moved.
  // Using a ref avoids creating a new render on every pointermove.
  const dragRef = useRef({ active: false, startY: 0, startTop: SNAP_PEEK });

  // ---- Fetch parking lots from the backend once on mount ----
  useEffect(() => {
    async function fetchParkingLots() {
      try {
        // GET /api/parkinglots → Controllers/ParkingLotsController.cs
        // → ParkingLotService.GetAllAsync() → Data/parkingLots.json
        const response = await fetch(API_URL);
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
  }, []);

  // ---- Drag handlers — attached only to the handle bar ----
  // setPointerCapture ensures we keep receiving pointermove/pointerup even
  // if the pointer leaves the handle element during a fast drag.

  function handlePointerDown(e) {
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = { active: true, startY: e.clientY, startTop: panelTop };
    setIsDragging(true);
  }

  function handlePointerMove(e) {
    if (!dragRef.current.active) return;
    // Convert pixel delta to viewport-height units
    const deltaVh = ((e.clientY - dragRef.current.startY) / window.innerHeight) * 100;
    // Clamp so the panel cannot go fully off-screen in either direction
    const newTop = Math.max(8, Math.min(78, dragRef.current.startTop + deltaVh));
    setPanelTop(newTop);
  }

  function handlePointerUp() {
    if (!dragRef.current.active) return;
    dragRef.current.active = false;
    setIsDragging(false);
    // Snap to the nearest snap position on release
    const mid = (SNAP_PEEK + SNAP_HALF) / 2;
    setPanelTop(prev => (prev < mid ? SNAP_HALF : SNAP_PEEK));
  }

  // Convert location prop to the [lat, lng] array Leaflet expects
  const userPosition = location ? [location.lat, location.lng] : null;

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  return (
    <div style={styles.screen}>

      {/* ==============================================================
          MAP AREA
          Covers the top 60% of the screen.
          Shows a real OpenStreetMap map centered on the user's location.

          Only the user's GPS dot is shown right now.
          TODO (future sprint): Add a <Marker> or <CircleMarker> for each
          parking lot using lot.latitude / lot.longitude from the API data.
          ============================================================== */}
      <div style={styles.mapArea}>
        {userPosition ? (
          <MapContainer
            center={userPosition}
            zoom={16}
            style={{ width: '100%', height: '100%' }}
            zoomControl={false}        // hide +/- buttons — keeps the UI clean
            attributionControl={false} // hide © watermark for a cleaner look
          >
            {/* CartoDB Voyager tiles — free, no API key, modern Waze-like style.
                Much cleaner and more colourful than the default OpenStreetMap tiles. */}
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            />

            {/* Accuracy ring — translucent blue circle showing GPS uncertainty radius */}
            <Circle
              center={userPosition}
              radius={40}
              pathOptions={{
                color: '#2563eb',
                weight: 0,
                fillColor: '#2563eb',
                fillOpacity: 0.15,
              }}
            />

            {/* User location dot — solid blue with white border, like Google Maps / Waze */}
            <CircleMarker
              center={userPosition}
              radius={9}
              pathOptions={{
                color: '#ffffff',
                weight: 3,
                fillColor: '#2563eb',
                fillOpacity: 1,
              }}
            />
          </MapContainer>
        ) : (
          // Fallback when no coordinates were passed (e.g. permission denied)
          <div style={styles.noMapFallback}>
            <p style={styles.noLocationText}>Location unavailable — cannot show map</p>
          </div>
        )}
      </div>

      {/* ==============================================================
          PARKING LIST PANEL
          Absolutely positioned white sheet that slides up over the map.
          - `top` is driven by panelTop state so dragging moves it.
          - `overflow-y: auto` makes only the CONTENT scroll, not the page.
          - The CSS transition is disabled while dragging so it tracks
            the finger/mouse instantly, then re-enables for the snap animation.
          ============================================================== */}
      <div
        style={{
          ...styles.panel,
          top: `${panelTop}vh`,
          // Smooth snap when releasing; no transition while actively dragging
          transition: isDragging ? 'none' : 'top 0.3s ease',
        }}
      >
        {/* Drag handle — the ONLY element that initiates a drag.
            Keeping drag events here (not on the whole panel) means the
            list below can still scroll normally with touch or mouse. */}
        <div
          style={styles.dragHandle}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        />

        <h2 style={styles.panelTitle}>Nearby Parking</h2>

        {/* TODO (future sprint): Add sort buttons here — Cheapest / Closest / Balanced.
            The parkingLots array will need to be sorted before the .map() call below. */}

        {/* ---- Loading state ---- */}
        {isLoading && (
          <p style={styles.statusText}>Loading parking lots...</p>
        )}

        {/* ---- Error state ---- */}
        {!isLoading && error && (
          <div style={styles.errorBox}>
            <p style={styles.errorText}>Could not load parking lots.</p>
            <p style={styles.errorDetail}>{error}</p>
            <p style={styles.errorDetail}>Make sure the backend is running on port 5176.</p>
          </div>
        )}

        {/* ---- Empty state ---- */}
        {!isLoading && !error && parkingLots.length === 0 && (
          <p style={styles.statusText}>No parking lots found.</p>
        )}

        {/* ---- Success state: one card per parking lot ---- */}
        {!isLoading && !error && parkingLots.length > 0 && (
          <ul style={styles.list}>
            {parkingLots.map((lot) => (
              <li key={lot.id} style={styles.card}>

                {/* Top row: bold name on left, coloured price on right */}
                <div style={styles.cardTopRow}>
                  <p style={styles.lotName}>{lot.name}</p>
                  <p style={styles.lotPrice}>
                    {lot.pricePerHour === 0 ? 'FREE' : `₪${lot.pricePerHour}/hr`}
                  </p>
                </div>

                {/* Address */}
                <p style={styles.lotAddress}>{lot.address}</p>

                {/* Availability badge — green when spaces remain, red when full */}
                <div style={styles.cardBottomRow}>
                  <span style={{
                    ...styles.badge,
                    backgroundColor: lot.availableSpaces === 0 ? '#fef2f2' : '#f0fdf4',
                    color:           lot.availableSpaces === 0 ? '#dc2626' : '#16a34a',
                  }}>
                    {lot.availableSpaces === 0
                      ? 'Full'
                      : `${lot.availableSpaces} / ${lot.totalSpaces} spaces`}
                  </span>
                </div>

              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

// -------------------------------------------------------------------------
// Styles
// -------------------------------------------------------------------------
const styles = {

  // Root container: fixed viewport size, no scroll — children use absolute positioning
  screen: {
    position: 'relative',
    height: '100vh',
    overflow: 'hidden',
    fontFamily: 'sans-serif',
    backgroundColor: '#e0e7ff',
  },

  // Map fills the top 60% of the screen; the panel overlaps it from below.
  // zIndex: 0 keeps the map behind the panel (Leaflet internally uses z-index ~400
  // for its own layers, but the map container itself must be lower than the panel).
  mapArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '60%',
    zIndex: 0,
  },

  // Shown when location is null (no coordinates available)
  noMapFallback: {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#dbeafe',
  },

  noLocationText: {
    fontSize: '0.9rem',
    color: '#60a5fa',
  },

  // White sliding panel — top is controlled by panelTop state.
  // zIndex: 1000 guarantees it always renders above the Leaflet map container,
  // which creates its own stacking context and would otherwise cover the panel.
  panel: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#ffffff',
    borderRadius: '24px 24px 0 0',
    boxShadow: '0 -6px 24px rgba(0,0,0,0.13)',
    overflowY: 'auto',
    padding: '10px 16px 32px',
    boxSizing: 'border-box',
    zIndex: 1000,
  },

  // Drag handle bar — this is the only element that fires drag events.
  // touchAction: none prevents the browser's default scroll gesture from
  // interfering with the custom drag while pressing the handle.
  dragHandle: {
    width: 40,
    height: 5,
    backgroundColor: '#d1d5db',
    borderRadius: 3,
    margin: '0 auto 14px',
    cursor: 'grab',
    touchAction: 'none',
    userSelect: 'none',
  },

  panelTitle: {
    fontSize: '1.15rem',
    fontWeight: '700',
    color: '#111827',
    margin: '0 0 14px 0',
  },

  statusText: {
    fontSize: '0.95rem',
    color: '#9ca3af',
    textAlign: 'center',
    marginTop: '24px',
  },

  errorBox: {
    backgroundColor: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: '12px',
    padding: '16px',
    textAlign: 'center',
    marginTop: '16px',
  },

  errorText: {
    fontSize: '0.95rem',
    fontWeight: '600',
    color: '#dc2626',
    margin: '0 0 6px 0',
  },

  errorDetail: {
    fontSize: '0.82rem',
    color: '#ef4444',
    margin: '3px 0 0 0',
  },

  list: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },

  card: {
    backgroundColor: '#ffffff',
    border: '1px solid #f3f4f6',
    borderRadius: '14px',
    padding: '14px',
    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
    display: 'flex',
    flexDirection: 'column',
    gap: '5px',
  },

  cardTopRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '8px',
  },

  lotName: {
    fontSize: '1rem',
    fontWeight: '700',
    color: '#111827',
    margin: 0,
    flex: 1,
  },

  lotPrice: {
    fontSize: '0.95rem',
    fontWeight: '700',
    color: '#2563eb',
    margin: 0,
    whiteSpace: 'nowrap',
  },

  lotAddress: {
    fontSize: '0.85rem',
    color: '#6b7280',
    margin: 0,
  },

  cardBottomRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginTop: '4px',
  },

  badge: {
    fontSize: '0.78rem',
    fontWeight: '600',
    padding: '3px 10px',
    borderRadius: '999px',
  },
};

export default NearbyParkingPage;
