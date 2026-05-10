// Placeholder results screen shown after the user grants location permission
function NearbyParkingPage({ onNavigate, location }) {
  // Log received coordinates to the console during development
  if (location) {
    console.log('User location received:', location);
  }

  return (
    // Full-screen centered column layout
    <div style={styles.container}>
      {/* Placeholder text — will be replaced with real parking results in a future sprint */}
      <p style={styles.text}>Nearby parking results will appear here.</p>

      {/* Shows the user's coordinates for verification — only renders if location was passed */}
      {location && (
        <p style={styles.coords}>
          📍 Lat: {location.lat.toFixed(6)}, Lng: {location.lng.toFixed(6)}
        </p>
      )}

      {/* Back button — navigates back to the welcome screen */}
      <button style={styles.back} onClick={() => onNavigate('landing')}>
        Back
      </button>
    </div>
  );
}

// --- Styles ---

const styles = {
  // Full-viewport centered column
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    gap: '24px',
  },

  // Main placeholder message
  text: {
    fontSize: '1.2rem',
    color: '#333',
  },

  // Coordinates displayed in monospace for readability
  coords: {
    fontSize: '0.95rem',
    color: '#2563eb',
    fontFamily: 'monospace',
  },

  // Outlined back button — secondary action, no fill
  back: {
    padding: '10px 24px',
    fontSize: '1rem',
    cursor: 'pointer',
    borderRadius: '8px',
    border: '1px solid #ccc',
    backgroundColor: '#fff',
  },
};

export default NearbyParkingPage;
