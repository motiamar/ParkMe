import { useState, useEffect, useRef } from 'react';
import ParkingLotDetails from './ParkingLotDetails';
import TextSizeSelector from './TextSizeSelector';
import { getOrCreateUserId } from '../utils/userId';
import { fetchFavoriteIds, addFavorite, removeFavorite } from '../utils/favoritesApi';

// Leaflet map library — free, open-source, no API key required.
// Circle + CircleMarker are used for the user location dot to avoid a known
// Leaflet + Vite asset-path bug with the default marker icon images.
// Parking lot markers use Marker + divIcon (HTML-based) for the same reason —
// divIcon renders inline HTML instead of loading image files from disk.
import { MapContainer, TileLayer, CircleMarker, Circle, Marker, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Custom parking lot marker icon — a green circle with "P" and a downward pointer.
// Using divIcon avoids the Leaflet + Vite default-icon asset-path bug entirely.
// iconAnchor [13, 34] places the tip of the triangle at the lot's exact coordinates.
//
// Visual difference from user marker:
//   User location  → blue filled CircleMarker (like Google Maps / Waze GPS dot)
//   Parking lot    → green "P" pin (circle + triangle pointer, standard map-pin style)
const parkingIcon = L.divIcon({
  className: '',
  html: `<div style="display:flex;flex-direction:column;align-items:center;">
           <div style="width:26px;height:26px;background:#16a34a;border:3px solid #fff;
                       border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,0.35);
                       display:flex;align-items:center;justify-content:center;
                       font-family:sans-serif;font-weight:800;font-size:13px;color:#fff;">P</div>
           <div style="width:0;height:0;border-left:6px solid transparent;
                       border-right:6px solid transparent;border-top:8px solid #16a34a;"></div>
         </div>`,
  iconSize:    [26, 34],
  iconAnchor:  [13, 34],  // tip of the triangle sits exactly on the coordinate
  popupAnchor: [0, -36],
});

// Classic teardrop pin shown at the geocoded search location.
// SVG path: circle merged into a downward-pointing shape, same style as Google Maps.
// iconAnchor [16, 42] places the very tip of the pin on the exact coordinate.
const searchLocationIcon = L.divIcon({
  className: '',
  html: `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="42" viewBox="0 0 32 42">
           <path d="M16 0C7.163 0 0 7.163 0 16c0 10.5 16 26 16 26S32 26.5 32 16C32 7.163 24.837 0 16 0z"
                 fill="#16a34a" stroke="#ffffff" stroke-width="2"/>
           <circle cx="16" cy="15" r="7" fill="#ffffff"/>
         </svg>`,
  iconSize:    [32, 42],
  iconAnchor:  [16, 42],
  popupAnchor: [0, -44],
});

// ---- Geocoding via Nominatim (OpenStreetMap) — free, no API key needed ----
// Converts a text address/location into {lat, lng} coordinates.
// Returns null when the address produces no results.
async function geocodeAddress(query) {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`;
  const res = await fetch(url, { headers: { 'Accept-Language': 'he,en' } });
  if (!res.ok) throw new Error('geocode request failed');
  const data = await res.json();
  if (data.length === 0) return null;
  return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
}

// ---- MapCenterController — imperatively repositions the Leaflet map ----
// Must live inside <MapContainer> to access the map instance via useMap().
// Uses a string key built from the coordinates so the effect only fires when
// the actual lat/lng values change — not on every render (which would happen
// if the center array were used directly, since a new array is created each render).
function MapCenterController({ center }) {
  const map = useMap();
  const prevKey = useRef(null);

  useEffect(() => {
    if (!center) return;
    const key = `${center[0]},${center[1]}`;
    if (key === prevKey.current) return;   // same coordinates — skip flyTo
    prevKey.current = key;
    map.flyTo(center, 16, { animate: true, duration: 0.8 });
  }, [center, map]);

  return null;
}

// Backend API URL — reads parking lots from Data/parkingLots.json via ParkingLotService.
// CORS in backend/Program.cs allows http://localhost:5173.
const API_URL = 'http://localhost:5176/api/parkinglots';

// The two snap positions for the draggable panel (% of viewport height from the top).
// PEEK   = panel is small, most of the map is visible.
// HALF   = panel covers roughly half the screen (default on load).
const SNAP_PEEK = 62;
const SNAP_HALF = 15;

function formatDrivingTimeLocalized(minutes, labels) {
  if (minutes < 60) return `${minutes} ${labels.minShort}`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes > 0
    ? `${hours} ${labels.hrShort} ${remainingMinutes} ${labels.minShort}`
    : `${hours} ${labels.hrShort}`;
}

function getLotName(lot, language) {
  return language === 'he' ? lot.nameHe : lot.nameEn;
}

function getLotAddress(lot, language) {
  return language === 'he' ? lot.addressHe : lot.addressEn;
}

// NearbyParkingPage
// Layout: real Leaflet map (top) + draggable scrollable parking list panel (bottom).
// Back button removed as of Task 70.
function NearbyParkingPage({ location, language, t, onToggleLanguage }) {

  // selectedLot: the parking lot the user tapped on.
  // When set, ParkingLotDetails is shown instead of the list.
  // Cleared (back to null) when the user presses Back in the details view.
  const [selectedLot, setSelectedLot] = useState(null);

  // Parking data from the backend
  const [parkingLots, setParkingLots] = useState([]);
  const [isLoading, setIsLoading]     = useState(true);
  const [error, setError]             = useState(null);

  // selectedSort drives which query parameter is sent to the backend.
  // 'default'  → no sortBy param  → backend returns lots in file order
  // 'distance' → ?sortBy=distance → backend sorts closest-first (Haversine)
  // 'price'    → ?sortBy=price    → backend sorts cheapest-first
  // To add more options later, add another value here and a button in the UI below.
  const [selectedSort, setSelectedSort] = useState('default');

  const [favoriteIds, setFavoriteIds] = useState(new Set());

  // showFavoritesOnly: when true, only lots whose id is in favoriteIds are shown.
  // Filtering is done client-side against the already-loaded favoriteIds Set.
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  // panelTop: how far from the top of the screen the panel starts (in vh units).
  // Lower value = panel higher up = more list visible, less map visible.
  const [panelTop, setPanelTop]       = useState(SNAP_PEEK);

  // isDragging: true only while the user holds the handle.
  // Used to disable the CSS transition so dragging feels instant.
  const [isDragging, setIsDragging]   = useState(false);

  // settingsOpen: controls visibility of the settings side panel.
  const [settingsOpen, setSettingsOpen] = useState(false);

  // searchQuery: current text typed in the map search input
  const [searchQuery, setSearchQuery] = useState('');
  // searchedLocation: [lat, lng] after a successful geocode; null = use user position
  const [searchedLocation, setSearchedLocation] = useState(null);
  // searchError: shown below the search bar when an address cannot be found
  const [searchError, setSearchError] = useState(null);

  // dragRef stores drag state that must NOT trigger re-renders on every pixel moved.
  // Using a ref avoids creating a new render on every pointermove.
  const dragRef = useRef({ active: false, startY: 0, startTop: SNAP_PEEK });

  // ---- Load the current user's favorite IDs once on mount ----
  useEffect(() => {
    async function loadFavorites() {
      try {
        const userId = getOrCreateUserId();
        const ids = await fetchFavoriteIds(userId);
        setFavoriteIds(new Set(ids));
      } catch {
        // favorites unavailable — star states stay empty, not a fatal error
      }
    }
    loadFavorites();
  }, []);

  // ---- Toggle favorite for a parking lot ----
  // Optimistic update: flip the local Set immediately, then sync with the backend.
  // On error, the Set is reverted so the UI stays consistent with the server.
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

  // ---- Fetch parking lots from the backend whenever selectedSort changes ----
  // The backend does the sorting — the frontend only builds the URL and passes
  // the sort option as a query parameter. No .sort() is called here.
  useEffect(() => {
    async function fetchParkingLots() {
      // Reset state at the start of each fetch so stale data isn't shown.
      setIsLoading(true);
      setError(null);
      try {
        // Build the request URL.
        // userLat/userLng are always sent when available so the backend can
        // attach lot.distance to every response — the frontend never recalculates it.
        // sortBy is only added when the user has picked a non-default sort option.
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
  // Re-fetch when sort changes or when user coordinates first become available.
  // Using primitive lat/lng values (not the location object) avoids re-renders
  // caused by a new object reference with the same coordinates.
  }, [selectedSort, location?.lat, location?.lng]);

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
    const newTop = Math.max(8, Math.min(86, dragRef.current.startTop + deltaVh));
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

  // ---- Search submit: geocode the typed address then fly the map there ----
  async function handleSearch() {
    const q = searchQuery.trim();
    if (!q) return;
    setSearchError(null);
    try {
      const coords = await geocodeAddress(q);
      if (!coords) {
        setSearchError(t.nearby.searchNotFound);
        return;
      }
      setSearchedLocation([coords.lat, coords.lng]);
    } catch {
      setSearchError(t.nearby.searchError);
    }
  }

  // ---- Clear search: reset input and return map center to user's GPS location ----
  function clearSearch() {
    setSearchQuery('');
    setSearchedLocation(null);
    setSearchError(null);
  }

  // Convert location prop to the [lat, lng] array Leaflet expects
  const userPosition = location ? [location.lat, location.lng] : null;

  // mapCenter: what the map should be centered on.
  // Follows searchedLocation when the user has searched; falls back to GPS position.
  const mapCenter = searchedLocation ?? userPosition;

  // Apply the favorites filter client-side.
  // The backend already sorted parkingLots by the selected sort option;
  // we just narrow the result down to lots the user has starred.
  const displayedLots = showFavoritesOnly
    ? parkingLots.filter(lot => favoriteIds.has(lot.id))
    : parkingLots;

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  // If a card was tapped, show the details view instead of the list.
  // onBack clears selectedLot, which returns to the normal list.
  if (selectedLot) {
    return (
      <ParkingLotDetails
        lot={selectedLot}
        onBack={() => setSelectedLot(null)}
        isFavorite={favoriteIds.has(selectedLot.id)}
        onToggleFavorite={toggleFavorite}
        language={language}
        t={t}
      />
    );
  }

  return (
    <div dir={language === 'he' ? 'rtl' : 'ltr'} style={styles.screen}>

      {/* Gear button — fixed in the top-left corner above the map */}
      <button
        style={styles.gearBtn}
        onClick={() => setSettingsOpen(o => !o)}
        aria-label={language === 'he' ? 'הגדרות' : 'Settings'}
      >
        <svg
          width="26" height="26"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#1f2937"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      </button>

      {/* Settings side panel + backdrop */}
      {settingsOpen && (
        <>
          <div style={styles.settingsBackdrop} onClick={() => setSettingsOpen(false)} />
          <div style={styles.settingsPanel}>
            <div style={styles.settingsPanelHeader}>
              <span style={styles.settingsPanelTitle}>
                {language === 'he' ? 'הגדרות' : 'Settings'}
              </span>
              <button
                style={styles.settingsCloseBtn}
                onClick={() => setSettingsOpen(false)}
                aria-label={language === 'he' ? 'סגור' : 'Close'}
              >
                ✕
              </button>
            </div>

            {/* Language section */}
            <div style={styles.settingsSection}>
              <p style={styles.settingsSectionLabel}>
                {language === 'he' ? 'שפה' : 'Language'}
              </p>
              <div style={styles.settingsBtnGroup}>
                <button
                  style={language === 'he' ? styles.settingsBtnActive : styles.settingsBtn}
                  onClick={() => { if (language !== 'he') onToggleLanguage(); }}
                >
                  עברית
                </button>
                <button
                  style={language === 'en' ? styles.settingsBtnActive : styles.settingsBtn}
                  onClick={() => { if (language !== 'en') onToggleLanguage(); }}
                >
                  English
                </button>
              </div>
            </div>

            {/* Text size section */}
            <div style={styles.settingsSection}>
              <p style={styles.settingsSectionLabel}>
                {language === 'he' ? 'גודל טקסט' : 'Text Size'}
              </p>
              <TextSizeSelector labels={t.textSize} />
            </div>
          </div>
        </>
      )}

      {/* Search bar — sits above the map, to the right of the gear button.
          dir="ltr" on the wrapper gives consistent physical left/right layout
          regardless of the app RTL setting; the input itself uses dir="rtl"
          so Hebrew placeholder and text are right-aligned inside it. */}
      <div style={styles.searchBarWrapper}>
        <div style={styles.searchBar} dir="ltr">
          {/* X clear button — appears on the left once text has been entered */}
          {searchQuery.length > 0 && (
            <button
              style={styles.searchClearBtn}
              onClick={clearSearch}
              aria-label="נקה חיפוש"
            >
              ✕
            </button>
          )}

          {/* Text input — dir="rtl" so Hebrew placeholder is right-aligned */}
          <input
            dir={language === 'he' ? 'rtl' : 'ltr'}
            style={styles.searchInput}
            type="text"
            value={searchQuery}
            placeholder={t.nearby.searchPlaceholder}
            onChange={e => setSearchQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
          />

          {/* Magnifying-glass search button on the right */}
          <button
            style={styles.searchSubmitBtn}
            onClick={handleSearch}
            aria-label="חפש"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
              stroke="#6b7280" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="7" />
              <line x1="16.5" y1="16.5" x2="22" y2="22" />
            </svg>
          </button>
        </div>

        {/* Geocoding error message shown below the bar */}
        {searchError && (
          <p style={styles.searchError}>{searchError}</p>
        )}
      </div>

      {/* ==============================================================
          MAP AREA
          Covers the top 60% of the screen.
          Shows a real CartoDB map centered on the user's location.

          Displays:
            • Blue dot  — user's current GPS position
            • Green "P" pins — each nearby parking lot (lat/lng from API)

          Lots without valid coordinates are skipped without crashing.
          Clicking a pin opens the same ParkingLotDetails view as the list.
          ============================================================== */}
      <div style={styles.mapArea}>
        {userPosition ? (
          <MapContainer
            center={mapCenter ?? userPosition}
            zoom={16}
            style={{ width: '100%', height: '100%' }}
            zoomControl={false}        // hide +/- buttons — keeps the UI clean
            attributionControl={false} // hide © watermark for a cleaner look
          >
            {/* Moves the map whenever mapCenter changes (search or clear) */}
            <MapCenterController center={mapCenter} />

            {/* Green teardrop pin at the geocoded search result */}
            {searchedLocation && (
              <Marker position={searchedLocation} icon={searchLocationIcon} />
            )}

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

            {/* User location dot — solid blue with white border, like Google Maps / Waze.
                Visually distinct from parking lot markers (blue vs. green, dot vs. pin). */}
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

            {/* ── Parking lot markers ──────────────────────────────────────────
                One green "P" pin is rendered for each parking lot that has valid
                latitude and longitude coordinates from the backend API.

                Lots without coordinates are silently skipped — the filter below
                ensures we never pass NaN/null to Leaflet, which would crash the map.
                Only parking lots with coordinates can be shown on the map.

                Clicking a pin sets selectedLot, which causes NearbyParkingPage to
                render ParkingLotDetails — the same view opened by tapping a list card.

                TODO (future task): replace setSelectedLot with a navigation trigger
                once real routing (Google Maps / Waze) is connected. ──────────── */}
            {parkingLots
              .filter(lot =>
                lot.latitude  != null && !isNaN(lot.latitude) &&
                lot.longitude != null && !isNaN(lot.longitude)
              )
              .map(lot => (
                <Marker
                  key={lot.id}
                  position={[lot.latitude, lot.longitude]}
                  icon={parkingIcon}
                  eventHandlers={{
                    // Clicking a marker opens the same details card as clicking
                    // a parking lot card in the list below.
                    click: () => setSelectedLot(lot),
                  }}
                >
                  {/* Tooltip shows the lot name on hover / tap for quick identification */}
                  <Tooltip direction="top" offset={[0, -36]} opacity={0.95}>
                    {getLotName(lot, language)}
                  </Tooltip>
                </Marker>
              ))
            }
          </MapContainer>
        ) : (
          // Fallback when no coordinates were passed (e.g. permission denied)
          <div style={styles.noMapFallback}>
            <p style={{ ...styles.noLocationText, textAlign: language === 'he' ? 'right' : 'center' }}>{t.nearby.mapUnavailable}</p>
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
        {/* ── Sticky header — never scrolls away ─────────────────────────
            Contains the drag handle, title, and sort buttons.
            flexShrink:0 ensures it stays at the top as content grows. */}
        <div style={styles.panelStickyHeader}>
          <div
            style={styles.dragHandle}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
          />

          <div style={styles.panelHeaderRow}>
            <h2 style={{ ...styles.panelTitle, textAlign: language === 'he' ? 'right' : 'left' }}>{t.nearby.title}</h2>
          </div>

          {/* Sort + filter buttons — one row, identical visual style */}
          <div style={styles.sortRow}>
            {[
              { label: t.nearby.default,  value: 'default'  },
              { label: t.nearby.closest,  value: 'distance' },
              { label: t.nearby.cheapest, value: 'price'    },
            ].map(({ label, value }) => (
              <button
                key={value}
                onClick={() => setSelectedSort(value)}
                style={selectedSort === value ? styles.sortBtnActive : styles.sortBtn}
              >
                {label}
              </button>
            ))}

            {/* Favorites filter — toggles showFavoritesOnly; sort still applies */}
            <button
              onClick={() => setShowFavoritesOnly(prev => !prev)}
              style={showFavoritesOnly ? styles.sortBtnActive : styles.sortBtn}
            >
              {t.nearby.favorites}
            </button>
          </div>
        </div>

        {/* ── Scrollable content area ──────────────────────────────────── */}
        <div style={styles.panelScrollable}>

          {/* ---- Loading state ---- */}
          {isLoading && (
            <p style={{ ...styles.statusText, textAlign: language === 'he' ? 'right' : 'center' }}>{t.nearby.loading}</p>
          )}

          {/* ---- Error state ---- */}
          {!isLoading && error && (
            <div style={styles.errorBox}>
              <p style={{ ...styles.errorText, textAlign: language === 'he' ? 'right' : 'center' }}>{t.nearby.loadError}</p>
              <p style={styles.errorDetail}>{error}</p>
              <p style={styles.errorDetail}>{t.nearby.backendHint}</p>
            </div>
          )}

          {/* ---- Empty state (no lots from backend) ---- */}
          {!isLoading && !error && parkingLots.length === 0 && (
            <p style={{ ...styles.statusText, textAlign: language === 'he' ? 'right' : 'center' }}>{t.nearby.empty}</p>
          )}

          {/* ---- Favorites empty state (filter active but no matches) ---- */}
          {!isLoading && !error && parkingLots.length > 0 && displayedLots.length === 0 && (
            <p style={{ ...styles.statusText, textAlign: language === 'he' ? 'right' : 'center' }}>{t.nearby.noFavorites}</p>
          )}

          {/* ---- Success state: one card per displayed parking lot ---- */}
          {!isLoading && !error && displayedLots.length > 0 && (
            <ul style={styles.list}>
              {displayedLots.map((lot) => {
                const distKm = lot.drivingDistanceKm ?? null;
                const travelMinutes = lot.drivingTimeMinutes ?? null;

                return (
                  <li
                    key={lot.id}
                    style={{ ...styles.card, cursor: 'pointer' }}
                    onClick={() => setSelectedLot(lot)}
                  >
                    {/* Top row: bold name on left, price + star on right */}
                    <div style={styles.cardTopRow}>
                      <p style={{ ...styles.lotName, textAlign: language === 'he' ? 'right' : 'left' }}>{getLotName(lot, language)}</p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <p style={styles.lotPrice}>
                          {lot.pricePerHour === 0 ? t.nearby.free : `₪${lot.pricePerHour}${t.nearby.hrSuffix}`}
                        </p>
                        <button
                          style={styles.starBtn}
                          onClick={(e) => { e.stopPropagation(); toggleFavorite(lot.id); }}
                          aria-label={favoriteIds.has(lot.id) ? t.details.removeFavorite : t.details.addFavorite}
                        >
                          {favoriteIds.has(lot.id) ? '★' : '☆'}
                        </button>
                      </div>
                    </div>

                    {/* Address */}
                    <p style={{ ...styles.lotAddress, textAlign: language === 'he' ? 'right' : 'left' }}>{getLotAddress(lot, language)}</p>

                    {/* Bottom row: availability badge (left) + distance (right) */}
                    <div style={styles.cardBottomRow}>
                      <span style={{
                        ...styles.badge,
                        backgroundColor: lot.availableSpaces === 0 ? '#fef2f2' : '#f0fdf4',
                        color:           lot.availableSpaces === 0 ? '#dc2626' : '#16a34a',
                      }}>
                        {lot.availableSpaces === 0
                          ? t.nearby.full
                          : `${lot.availableSpaces} / ${lot.totalSpaces} ${t.nearby.spaces}`}
                      </span>

                      <span style={styles.distanceText}>
                        {distKm !== null ? `↗ ${distKm.toFixed(1)} km` : t.nearby.distanceUnavailable}
                      </span>
                    </div>

                    <span style={styles.etaText}>
                      {travelMinutes !== null ? `⏱ ${formatDrivingTimeLocalized(travelMinutes, t.nearby)}` : t.nearby.travelTimeUnavailable}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
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
    bottom: 0,
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
    boxSizing: 'border-box',
    zIndex: 1000,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },

  // Sticky top section — drag handle + title + sort buttons never scroll away
  panelStickyHeader: {
    flexShrink: 0,
    padding: '10px 16px 0',
  },

  // Scrollable area below the sticky header
  panelScrollable: {
    flex: 1,
    overflowY: 'auto',
    padding: '0 16px 32px',
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

  // Row that holds the panel title (left) and the text-size selector (right)
  panelHeaderRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '12px',
    flexWrap: 'wrap',
    marginBottom: '14px',
  },

  panelTitle: {
    fontSize: '1.15rem',
    fontWeight: '700',
    color: '#111827',
    margin: 0,
  },

  // Row that holds the three sort buttons
  sortRow: {
    display: 'flex',
    gap: '8px',
    marginBottom: '14px',
  },

  // Inactive sort button — subtle gray pill
  sortBtn: {
    flex: 1,
    padding: '8px 0',
    border: '1px solid #e5e7eb',
    borderRadius: '999px',
    backgroundColor: '#f9fafb',
    color: '#6b7280',
    fontSize: '0.88rem',
    fontWeight: '500',
    cursor: 'pointer',
  },

  // Active sort button — white pill with blue border and text
  sortBtnActive: {
    flex: 1,
    padding: '8px 0',
    border: '1.5px solid #2563eb',
    borderRadius: '999px',
    backgroundColor: '#ffffff',
    color: '#2563eb',
    fontSize: '0.88rem',
    fontWeight: '700',
    cursor: 'pointer',
    boxShadow: '0 1px 4px rgba(37,99,235,0.10)',
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
    justifyContent: 'space-between', // badge on left, distance on right
    gap: '8px',
    marginTop: '4px',
  },

  // "↗ 1.2 km" — straight-line distance from user to this lot
  distanceText: {
    fontSize: '0.82rem',
    color: '#6b7280',
    whiteSpace: 'nowrap',
  },

  // "⏱ 3 min" — estimated travel time based on distance at ~5 km/h
  etaText: {
    fontSize: '0.82rem',
    color: '#6b7280',
    marginTop: '2px',
  },

  badge: {
    fontSize: '0.78rem',
    fontWeight: '600',
    padding: '3px 10px',
    borderRadius: '999px',
  },

  starBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '1.3rem',
    color: '#f59e0b',
    padding: '0 2px',
    lineHeight: 1,
    flexShrink: 0,
  },

  // Wrapper that positions the search bar to the right of the gear button
  searchBarWrapper: {
    position: 'absolute',
    top: '12px',
    left: '62px',   // gear button is 40px wide + 12px margin + 10px gap
    right: '12px',
    zIndex: 1050,
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },

  // The pill-shaped search bar itself
  searchBar: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: '999px',
    border: '1px solid rgba(0,0,0,0.12)',
    boxShadow: '0 2px 8px rgba(0,0,0,0.14)',
    overflow: 'hidden',
    height: '40px',
  },

  // Text input — grows to fill remaining space
  searchInput: {
    flex: 1,
    border: 'none',
    outline: 'none',
    background: 'transparent',
    fontSize: '0.9rem',
    color: '#111827',
    padding: '0 8px',
    minWidth: 0,
  },

  // Magnifying-glass button on the right
  searchSubmitBtn: {
    flexShrink: 0,
    width: '40px',
    height: '40px',
    border: 'none',
    background: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
  },

  // X clear button on the left — only shown when input has text
  searchClearBtn: {
    flexShrink: 0,
    width: '36px',
    height: '36px',
    border: 'none',
    background: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.8rem',
    color: '#9ca3af',
    padding: 0,
  },

  // Error text shown below the search bar
  searchError: {
    margin: 0,
    fontSize: '0.8rem',
    color: '#dc2626',
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: '8px',
    padding: '4px 10px',
    alignSelf: 'flex-start',
    boxShadow: '0 1px 4px rgba(0,0,0,0.10)',
  },

  // Gear / settings button — floats above the map in the top-left corner
  gearBtn: {
    position: 'absolute',
    top: '12px',
    left: '12px',
    zIndex: 1100,
    width: '40px',
    height: '40px',
    border: 'none',
    background: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
  },

  // Semi-transparent backdrop — closes the panel on click
  settingsBackdrop: {
    position: 'absolute',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.28)',
    zIndex: 1200,
  },

  // Side panel that slides in from the left
  settingsPanel: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: '260px',
    maxWidth: '80vw',
    backgroundColor: '#ffffff',
    zIndex: 1300,
    boxShadow: '4px 0 24px rgba(0,0,0,0.15)',
    padding: '20px 16px',
    boxSizing: 'border-box',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '28px',
  },

  // Header row inside the panel: title + close button
  settingsPanelHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  settingsPanelTitle: {
    fontSize: '1.05rem',
    fontWeight: '700',
    color: '#111827',
  },

  settingsCloseBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '1rem',
    color: '#6b7280',
    padding: '4px',
    lineHeight: 1,
    borderRadius: '6px',
  },

  // One section inside the panel (language or text-size)
  settingsSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },

  settingsSectionLabel: {
    fontSize: '0.78rem',
    fontWeight: '600',
    color: '#9ca3af',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    margin: 0,
  },

  // Group of side-by-side language / option buttons
  settingsBtnGroup: {
    display: 'flex',
    gap: '8px',
  },

  settingsBtn: {
    flex: 1,
    padding: '9px 0',
    border: '1px solid #e5e7eb',
    borderRadius: '10px',
    backgroundColor: '#f9fafb',
    color: '#374151',
    fontSize: '0.9rem',
    fontWeight: '500',
    cursor: 'pointer',
  },

  settingsBtnActive: {
    flex: 1,
    padding: '9px 0',
    border: '1.5px solid #2563eb',
    borderRadius: '10px',
    backgroundColor: '#eff6ff',
    color: '#2563eb',
    fontSize: '0.9rem',
    fontWeight: '700',
    cursor: 'pointer',
    boxShadow: '0 1px 4px rgba(37,99,235,0.12)',
  },
};

export default NearbyParkingPage;
