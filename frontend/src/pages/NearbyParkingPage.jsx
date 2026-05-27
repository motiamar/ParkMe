import { useEffect, useRef, useState } from 'react';

import ParkingLotDetails from './ParkingLotDetails';
import ParkingMap        from '../components/nearby/ParkingMap';
import MapSearchBox      from '../components/nearby/MapSearchBox';
import ParkingListPanel  from '../components/nearby/ParkingListPanel';
import SettingsPanel     from '../components/nearby/SettingsPanel';
import { useFavorites }      from '../hooks/useFavorites';
import { useParkingLots }    from '../hooks/useParkingLots';
import { useDraggablePanel } from '../hooks/useDraggablePanel';
import { geocodeAddress }    from '../utils/geocoding';
import { styles }            from '../components/nearby/nearbyStyles';

// NearbyParkingPage — slim orchestrator.
// Owns only high-level page state and wires child components together via props.
// All heavy logic lives in hooks (useFavorites, useParkingLots, useDraggablePanel)
// and in the focused components under src/components/nearby/.
function NearbyParkingPage({ location, language, t, onToggleLanguage }) {

  // Which parking lot the user has tapped — swaps list for detail view
  const [selectedLot, setSelectedLot] = useState(null);

  // Sort sent to the backend as ?sortBy=
  const [selectedSort, setSelectedSort] = useState('default');

  // Client-side favorites-only filter toggle
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  // Settings gear panel visibility
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Map search state
  const [searchQuery,     setSearchQuery]     = useState('');
  const [searchedLocation, setSearchedLocation] = useState(null);
  const [searchError,     setSearchError]     = useState(null);
  const [locationNotice,  setLocationNotice]  = useState(null);
  const [recenterToken,   setRecenterToken]   = useState(0);
  const noticeTimerRef = useRef(null);

  // When the user searches a location, use it as the reference point for
  // distance calculations instead of the GPS location.  searchedLocation is
  // stored as [lat, lng] — convert to the {lat, lng} object useParkingLots expects.
  const referenceLocation = searchedLocation
    ? { lat: searchedLocation[0], lng: searchedLocation[1] }
    : location;

  // Custom hooks
  const { favoriteIds, toggleFavorite }                              = useFavorites();
  const { parkingLots, isLoading, error }                            = useParkingLots({ selectedSort, location: referenceLocation });
  const { panelTop, isDragging, handlePointerDown,
          handlePointerMove, handlePointerUp }                       = useDraggablePanel();

  // Derived values
  const userPosition  = location ? [location.lat, location.lng] : null;
  const mapCenter     = searchedLocation ?? userPosition;
  const displayedLots = showFavoritesOnly
    ? parkingLots.filter(lot => favoriteIds.has(lot.id))
    : parkingLots;

  // ---- Search: geocode the typed address then fly the map there ----
  async function handleSearch() {
    const q = searchQuery.trim();
    if (!q) return;
    setSearchError(null);
    try {
      const coords = await geocodeAddress(q);
      if (!coords) { setSearchError(t.nearby.searchNotFound); return; }
      setSearchedLocation([coords.lat, coords.lng]);
    } catch {
      setSearchError(t.nearby.searchError);
    }
  }

  // ---- Clear search: reset input and return map center to user GPS ----
  function clearSearch() {
    setSearchQuery('');
    setSearchedLocation(null);
    setSearchError(null);
  }

  function showLocationNotice() {
    setLocationNotice(t.nearby.locationRequired);
    if (noticeTimerRef.current) {
      window.clearTimeout(noticeTimerRef.current);
    }
    noticeTimerRef.current = window.setTimeout(() => {
      setLocationNotice(null);
      noticeTimerRef.current = null;
    }, 2600);
  }

  function handleRecenterMap() {
    if (!userPosition) {
      showLocationNotice();
      return;
    }

    setSearchedLocation(null);
    setRecenterToken(token => token + 1);
    setLocationNotice(null);
  }

  useEffect(() => () => {
    if (noticeTimerRef.current) {
      window.clearTimeout(noticeTimerRef.current);
    }
  }, []);

  // Show detail view when a parking lot card or map marker is tapped
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

      {/* Gear / settings button — top-left corner, above the map */}
      <button
        style={styles.gearBtn}
        onClick={() => setSettingsOpen(o => !o)}
        aria-label={language === 'he' ? 'הגדרות' : 'Settings'}
      >
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none"
          stroke="#1f2937" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      </button>

      <SettingsPanel
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        language={language}
        onToggleLanguage={onToggleLanguage}
        t={t}
      />

      <MapSearchBox
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onSearch={handleSearch}
        onClear={clearSearch}
        searchError={searchError}
        language={language}
        t={t}
      />

      {/* Map fills the full screen behind the panel */}
      <div style={styles.mapArea}>
        <div
          style={{
            ...styles.mapActionDock,
            bottom: `calc(${100 - panelTop}vh + 16px)`,
          }}
        >
          <button
            style={styles.mapActionBtn}
            onClick={handleRecenterMap}
            aria-label={language === 'he' ? 'מרכז למיקום שלי' : 'Recenter to my location'}
            title={language === 'he' ? 'מרכז למיקום שלי' : 'Recenter to my location'}
          >
            <span style={styles.mapActionIcon} aria-hidden="true">📍</span>
          </button>

          {locationNotice && (
            <div style={styles.mapNotice} role="status" aria-live="polite">
              {locationNotice}
            </div>
          )}
        </div>

        <ParkingMap
          userPosition={userPosition}
          mapCenter={mapCenter}
          recenterToken={recenterToken}
          parkingLots={parkingLots}
          searchedLocation={searchedLocation}
          onSelectLot={setSelectedLot}
          language={language}
          t={t}
        />
      </div>

      <ParkingListPanel
        panelTop={panelTop}
        isDragging={isDragging}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        displayedLots={displayedLots}
        parkingLots={parkingLots}
        isLoading={isLoading}
        error={error}
        selectedSort={selectedSort}
        onSortChange={setSelectedSort}
        showFavoritesOnly={showFavoritesOnly}
        onToggleFavoritesOnly={() => setShowFavoritesOnly(prev => !prev)}
        favoriteIds={favoriteIds}
        onToggleFavorite={toggleFavorite}
        onSelectLot={setSelectedLot}
        language={language}
        t={t}
      />
    </div>
  );
}

export default NearbyParkingPage;
