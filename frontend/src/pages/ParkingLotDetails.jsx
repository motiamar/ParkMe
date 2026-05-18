// Estimates city driving time from a straight-line distance in km.
// distanceKm comes from the Haversine formula (GPS coordinates) — it is shorter
// than the real road distance, so we use a modest 20 km/h to compensate.
// 20 km/h gives realistic Tel Aviv city-driving estimates without a road factor:
//   1 km → 3 min  |  5 km → 15 min  |  10 km → 30 min  |  15 km → 45 min
// This is MVP demo data — real driving time needs a routing API (future task).
// Same formula is used in NearbyParkingPage for the card list.
function calcDrivingTime(distanceKm) {
  const minutes = Math.max(1, Math.ceil((distanceKm / 20) * 60));
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h} hr ${m} min` : `${h} hr`;
}

// ParkingLotDetails
// Full-screen detail view for a single parking lot.
//
// Props:
//   lot    – the parking lot object as returned by the backend API
//   onBack – callback to return to the list (clears selectedLot in NearbyParkingPage)
function ParkingLotDetails({ lot, onBack }) {

  // Price display
  const isFree    = lot.pricePerHour === 0;
  const priceText = isFree ? 'FREE' : `₪${lot.pricePerHour}`;

  // Distance and driving time come from lot.distance (set by the backend when
  // userLat/userLng are sent). Show "Not available" if coordinates were not provided.
  // drivingTimeMinutes is a demo estimate — real routing requires a future integration.
  const distText        = lot.distance != null ? `${lot.distance.toFixed(1)} km` : 'Not available';
  const drivingTimeText = lot.distance != null ? calcDrivingTime(lot.distance)   : 'Not available';

  // Availability label + colour based on occupancy ratio
  let availText  = 'Not available';
  let availColor = '#374151';
  if (lot.availableSpaces != null) {
    if (lot.availableSpaces === 0) {
      availText  = 'Full';
      availColor = '#dc2626';
    } else if (lot.totalSpaces && lot.availableSpaces / lot.totalSpaces < 0.25) {
      availText  = 'Low';
      availColor = '#d97706';
    } else {
      availText  = 'Available';
      availColor = '#16a34a';
    }
  }

  return (
    <div style={styles.screen}>
      {/* Max-width wrapper keeps the layout phone-sized on wide screens */}
      <div style={styles.wrapper}>

        {/* ================================================================
            IMAGE AREA
            Shows lot.imageUrl when it exists, otherwise a dark placeholder
            that resembles a parking garage photo.
            The back button is layered on top with absolute positioning.
            ================================================================ */}
        <div style={styles.imageArea}>
          {lot.imageUrl ? (
            <img src={lot.imageUrl} alt={lot.name} style={styles.image} />
          ) : (
            <div style={styles.imagePlaceholder} />
          )}

          {/* Back button — calls onBack which sets selectedLot to null in
              NearbyParkingPage, returning the user to the parking list */}
          <button onClick={onBack} style={styles.backBtn} aria-label="Back">
            ‹
          </button>
        </div>

        {/* ================================================================
            CONTENT PANEL
            White rounded sheet that slides up over the bottom of the image.
            ================================================================ */}
        <div style={styles.content}>

          {/* Name (left) + price block (right) */}
          <div style={styles.header}>
            <h1 style={styles.name}>{lot.name}</h1>
            <div style={styles.priceBlock}>
              <span style={{ ...styles.price, color: isFree ? '#16a34a' : '#2563eb' }}>
                {priceText}
              </span>
              {!isFree && <span style={styles.perHour}>per hour</span>}
            </div>
          </div>

          {/* Address */}
          <p style={styles.address}>⊙ {lot.address}</p>

          {/* 2×2 information grid */}
          <div style={styles.infoGrid}>

            <div style={styles.infoBox}>
              <span style={styles.infoLabel}>AVAILABILITY</span>
              <span style={{ ...styles.infoValue, color: availColor }}>{availText}</span>
            </div>

            <div style={styles.infoBox}>
              <span style={styles.infoLabel}>TYPE</span>
              {/* 'type' is not yet a field in the backend model — show fallback.
                  When it is added, lot.type will appear automatically. */}
              <span style={styles.infoValue}>{lot.type ?? 'Not available'}</span>
            </div>

            <div style={styles.infoBox}>
              <span style={styles.infoLabel}>DISTANCE</span>
              <span style={styles.infoValue}>{distText}</span>
            </div>

            <div style={styles.infoBox}>
              <span style={styles.infoLabel}>DRIVING TIME</span>
              {/* Demo estimate based on ~15 km/h city speed.
                  Real driving time needs a routing API — see TODO on Start Navigation. */}
              <span style={styles.infoValue}>{drivingTimeText}</span>
            </div>

          </div>

          {/* Features — section is hidden entirely when the field is absent.
              'features' is not in the current backend model; this is ready
              for when it is added. */}
          {lot.features && lot.features.length > 0 && (
            <div style={styles.featuresSection}>
              <h3 style={styles.featuresTitle}>Features</h3>
              <div style={styles.featuresList}>
                {lot.features.map((f, i) => (
                  <span key={i} style={styles.featureTag}>✓ {f}</span>
                ))}
              </div>
            </div>
          )}

          {/* Navigation buttons — open the lot's coordinates in Google Maps or Waze.
              Using <a> instead of <button> so the browser/OS handles the deep link:
              on mobile, tapping "Google Maps" opens the app if installed, otherwise
              the website. Same for Waze. target="_blank" opens a new tab on desktop. */}
          <div style={styles.navRow}>
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${lot.latitude},${lot.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              style={styles.googleBtn}
            >
              Google Maps
            </a>
            <a
              href={`https://waze.com/ul?ll=${lot.latitude},${lot.longitude}&navigate=yes`}
              target="_blank"
              rel="noopener noreferrer"
              style={styles.wazeBtn}
            >
              Waze
            </a>
          </div>

        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = {

  // Full-screen scroll container
  screen: {
    minHeight: '100vh',
    backgroundColor: '#f3f4f6',
    overflowY: 'auto',
  },

  // Centers content and caps width for desktop — feels like a phone app
  wrapper: {
    maxWidth: 480,
    margin: '0 auto',
    position: 'relative',
    backgroundColor: '#ffffff',
    minHeight: '100vh',
  },

  // Dark image band at the top — relative so back button can be positioned inside
  imageArea: {
    position: 'relative',
    height: '40vh',
    backgroundColor: '#111111',
    overflow: 'hidden',
  },

  image: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },

  // Dark gradient placeholder shown when lot.imageUrl is null
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    background: 'linear-gradient(160deg, #1c1c1c 0%, #2a2a2a 60%, #111111 100%)',
  },

  // White circle with a left-arrow glyph, layered over the image
  backBtn: {
    position: 'absolute',
    top: 16,
    left: 16,
    width: 38,
    height: 38,
    borderRadius: '50%',
    backgroundColor: '#ffffff',
    border: 'none',
    fontSize: '1.4rem',
    lineHeight: '1',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
    zIndex: 10,
    paddingBottom: 2, // optical centre for the ‹ glyph
  },

  // White rounded sheet — overlaps image by 24 px via negative margin
  content: {
    backgroundColor: '#ffffff',
    borderRadius: '24px 24px 0 0',
    marginTop: -24,
    padding: '28px 20px 40px',
    position: 'relative',
  },

  // Name left, price block right
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 6,
  },

  name: {
    fontSize: '1.35rem',
    fontWeight: '800',
    color: '#111827',
    margin: 0,
    flex: 1,
    lineHeight: 1.25,
  },

  priceBlock: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
  },

  price: {
    fontSize: '1.2rem',
    fontWeight: '800',
    lineHeight: 1,
  },

  perHour: {
    fontSize: '0.75rem',
    color: '#9ca3af',
    marginTop: 2,
  },

  address: {
    fontSize: '0.9rem',
    color: '#6b7280',
    margin: '0 0 20px 0',
  },

  // 2-column grid for the info boxes
  infoGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 10,
    marginBottom: 24,
  },

  infoBox: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: '12px 14px',
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },

  infoLabel: {
    fontSize: '0.7rem',
    fontWeight: '600',
    color: '#9ca3af',
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
  },

  infoValue: {
    fontSize: '1rem',
    fontWeight: '700',
    color: '#111827',
  },

  featuresSection: {
    marginBottom: 24,
  },

  featuresTitle: {
    fontSize: '1rem',
    fontWeight: '700',
    color: '#111827',
    margin: '0 0 10px 0',
  },

  featuresList: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
  },

  featureTag: {
    backgroundColor: '#eff6ff',
    color: '#2563eb',
    fontSize: '0.85rem',
    fontWeight: '500',
    padding: '6px 14px',
    borderRadius: 999,
    border: '1px solid #bfdbfe',
  },

  // Side-by-side row for the two navigation buttons
  navRow: {
    display: 'flex',
    gap: 10,
    marginTop: 8,
  },

  // Google Maps button — blue
  googleBtn: {
    flex: 1,
    padding: '15px 0',
    backgroundColor: '#2563eb',
    color: '#ffffff',
    fontSize: '0.95rem',
    fontWeight: '700',
    textAlign: 'center',
    borderRadius: 14,
    textDecoration: 'none',
    display: 'block',
  },

  // Waze button — Waze brand cyan
  wazeBtn: {
    flex: 1,
    padding: '15px 0',
    backgroundColor: '#00b4d8',
    color: '#ffffff',
    fontSize: '0.95rem',
    fontWeight: '700',
    textAlign: 'center',
    borderRadius: 14,
    textDecoration: 'none',
    display: 'block',
  },
};

export default ParkingLotDetails;
