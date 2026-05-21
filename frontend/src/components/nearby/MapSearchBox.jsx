import { styles } from './nearbyStyles';

// Search bar overlaid on the map.
// Layout uses dir="ltr" so the magnifying-glass is always physically on the right
// and the X is on the left, regardless of the app RTL/LTR setting.
// The <input> itself uses dir based on language so Hebrew text is right-aligned.
function MapSearchBox({ searchQuery, setSearchQuery, onSearch, onClear, searchError, language, t }) {
  return (
    <div style={styles.searchBarWrapper}>
      <div style={styles.searchBar} dir="ltr">

        {/* X clear button — appears on the left once the user has typed something */}
        {searchQuery.length > 0 && (
          <button
            style={styles.searchClearBtn}
            onClick={onClear}
            aria-label={language === 'he' ? 'נקה חיפוש' : 'Clear search'}
          >
            ✕
          </button>
        )}

        {/* Text input — dir follows language so Hebrew placeholder is right-aligned */}
        <input
          dir={language === 'he' ? 'rtl' : 'ltr'}
          style={styles.searchInput}
          type="text"
          value={searchQuery}
          placeholder={t.nearby.searchPlaceholder}
          onChange={e => setSearchQuery(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && onSearch()}
        />

        {/* Magnifying-glass button on the right */}
        <button
          style={styles.searchSubmitBtn}
          onClick={onSearch}
          aria-label={language === 'he' ? 'חפש' : 'Search'}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
            stroke="#6b7280" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="7" />
            <line x1="16.5" y1="16.5" x2="22" y2="22" />
          </svg>
        </button>
      </div>

      {/* Geocoding error shown below the bar */}
      {searchError && (
        <p style={styles.searchError}>{searchError}</p>
      )}
    </div>
  );
}

export default MapSearchBox;
