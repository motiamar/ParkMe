import ParkingFilters from './ParkingFilters';
import ParkingLotCard from './ParkingLotCard';
import { styles } from './nearbyStyles';

// Draggable bottom sheet that holds the parking list.
// The sticky header (drag handle + title + filters) never scrolls away.
// Only the card list scrolls inside panelScrollable.
function ParkingListPanel({
  panelTop,
  isDragging,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  displayedLots,
  parkingLots,
  isLoading,
  error,
  selectedSort,
  onSortChange,
  showFavoritesOnly,
  onToggleFavoritesOnly,
  favoriteIds,
  onToggleFavorite,
  onSelectLot,
  language,
  t,
}) {
  return (
    <div style={{
      ...styles.panel,
      top: `${panelTop}vh`,
      transition: isDragging ? 'none' : 'top 0.3s ease',
    }}>

      {/* ── Sticky header — drag handle + title + sort/filter buttons ── */}
      <div style={styles.panelStickyHeader}>
        <div
          style={styles.dragHandle}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        />
        <div style={styles.panelHeaderRow}>
          <h2 style={{ ...styles.panelTitle, textAlign: language === 'he' ? 'right' : 'left' }}>
            {t.nearby.title}
          </h2>
        </div>
        <ParkingFilters
          selectedSort={selectedSort}
          onSortChange={onSortChange}
          showFavoritesOnly={showFavoritesOnly}
          onToggleFavoritesOnly={onToggleFavoritesOnly}
          t={t}
        />
      </div>

      {/* ── Scrollable content area ── */}
      <div style={styles.panelScrollable}>

        {isLoading && (
          <p style={{ ...styles.statusText, textAlign: language === 'he' ? 'right' : 'center' }}>
            {t.nearby.loading}
          </p>
        )}

        {!isLoading && error && (
          <div style={styles.errorBox}>
            <p style={{ ...styles.errorText, textAlign: language === 'he' ? 'right' : 'center' }}>
              {t.nearby.loadError}
            </p>
            <p style={styles.errorDetail}>{error}</p>
            <p style={styles.errorDetail}>{t.nearby.backendHint}</p>
          </div>
        )}

        {/* No lots at all from the backend */}
        {!isLoading && !error && parkingLots.length === 0 && (
          <p style={{ ...styles.statusText, textAlign: language === 'he' ? 'right' : 'center' }}>
            {t.nearby.empty}
          </p>
        )}

        {/* Lots exist but none match the favorites filter */}
        {!isLoading && !error && parkingLots.length > 0 && displayedLots.length === 0 && (
          <p style={{ ...styles.statusText, textAlign: language === 'he' ? 'right' : 'center' }}>
            {t.nearby.noFavorites}
          </p>
        )}

        {!isLoading && !error && displayedLots.length > 0 && (
          <ul style={styles.list}>
            {displayedLots.map(lot => (
              <ParkingLotCard
                key={lot.id}
                lot={lot}
                isFavorite={favoriteIds.has(lot.id)}
                onToggleFavorite={onToggleFavorite}
                onSelect={onSelectLot}
                language={language}
                t={t}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default ParkingListPanel;
