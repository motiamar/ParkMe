import { getLotName, getLotAddress, formatDrivingTimeLocalized } from '../../utils/parkingFormatters';
import { styles } from './nearbyStyles';

// Single parking lot card rendered inside the list panel.
// Receives only the data it needs — no global state access.
function ParkingLotCard({ lot, isFavorite, onToggleFavorite, onSelect, language, t }) {
  const distKm       = lot.drivingDistanceKm   ?? null;
  const travelMinutes = lot.drivingTimeMinutes  ?? null;

  return (
    <li data-testid="parking-lot-card" style={{ ...styles.card, cursor: 'pointer' }} onClick={() => onSelect(lot)}>

      {/* Top row: name on the text-start side, price + star on the other */}
      <div style={styles.cardTopRow}>
        <p style={{ ...styles.lotName, textAlign: language === 'he' ? 'right' : 'left' }}>
          {getLotName(lot, language)}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <p style={styles.lotPrice}>
            {lot.pricePerHour === 0 ? t.nearby.free : `₪${lot.pricePerHour}${t.nearby.hrSuffix}`}
          </p>
          <button
            style={styles.starBtn}
            onClick={e => { e.stopPropagation(); onToggleFavorite(lot.id); }}
            aria-label={isFavorite ? t.details.removeFavorite : t.details.addFavorite}
          >
            {isFavorite ? '★' : '☆'}
          </button>
        </div>
      </div>

      {/* Address */}
      <p style={{ ...styles.lotAddress, textAlign: language === 'he' ? 'right' : 'left' }}>
        {getLotAddress(lot, language)}
      </p>

      {/* Bottom row: availability badge + distance */}
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

      {/* Estimated travel time */}
      <span style={styles.etaText}>
        {travelMinutes !== null
          ? `⏱ ${formatDrivingTimeLocalized(travelMinutes, t.nearby)}`
          : t.nearby.travelTimeUnavailable}
      </span>
    </li>
  );
}

export default ParkingLotCard;
