import { useState } from 'react';

// Welcome screen shown on app launch — handles location permission flow
function LandingPage({ onNavigate, onFindParking, language, t }) {
  // errorMessage: shown below the button if location is denied or unavailable
  // isLoading: disables the button while the browser is waiting for a location response
  const [errorMessage, setErrorMessage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Triggered only when the user clicks "Find Parking" — never on page load
  function handleClick() {
    setErrorMessage(null);

    // Guard: some older browsers don't support geolocation at all
    if (!navigator.geolocation) {
      setErrorMessage(t.landing.unsupported);
      return;
    }

    setIsLoading(true);

    navigator.geolocation.getCurrentPosition(
      // Success: pass coordinates up to the controller, which navigates to the next screen
      (position) => {
        setIsLoading(false);
        onFindParking({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      // Failure: stay on this screen and show a friendly message
      (error) => {
        setIsLoading(false);
        if (error.code === error.PERMISSION_DENIED) {
          setErrorMessage(t.landing.permissionDenied);
        } else {
          setErrorMessage(t.landing.locationError);
        }
      },
      { timeout: 10000 }
    );
  }

  return (
    // Full-screen white background — centers the card vertically and horizontally
    <div dir={language === 'he' ? 'rtl' : 'ltr'} style={styles.screen}>
      {/* Content card — constrained to mobile width (max 360px) */}
      <div style={styles.card}>
        {/* Blue rounded icon box with car emoji — no icon library needed */}
        <div style={styles.iconBox}>
          <span style={styles.iconEmoji}>🚗</span>
        </div>

        {/* App name */}
        <h1 style={styles.title}>ParkMe</h1>

        {/* Tagline */}
        <p style={styles.subtitle}>{t.landing.subtitle}</p>

        {/* Main CTA — merges disabled style when loading */}
        <button
          style={{ ...styles.button, ...(isLoading ? styles.buttonDisabled : {}) }}
          onClick={handleClick}
          disabled={isLoading}
        >
          {isLoading ? t.landing.loading : t.landing.title}
        </button>

        {/* Error shown only after a failed or denied location request */}
        {errorMessage && <p style={styles.error}>{errorMessage}</p>}
      </div>
    </div>
  );
}

// --- Styles ---

const styles = {
  // Outer wrapper: full viewport, white, centers the card
  screen: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    backgroundColor: '#ffffff',
    padding: '24px',
    boxSizing: 'border-box',
  },

  // Inner column: stacks all elements centered, capped at mobile width
  card: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    width: '100%',
    maxWidth: '360px',
    gap: '20px',
  },

  // Blue rounded square that holds the app icon
  iconBox: {
    width: '88px',
    height: '88px',
    backgroundColor: '#2563eb',
    borderRadius: '22px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '8px',
  },

  // Car emoji sized to fit the icon box
  iconEmoji: {
    fontSize: '2.4rem',
    lineHeight: 1,
  },

  // Large bold app name
  title: {
    fontSize: '2.6rem',
    fontWeight: '700',
    color: '#111827',
    margin: 0,
    letterSpacing: '-0.5px',
  },

  // Muted tagline below the title
  subtitle: {
    fontSize: '1rem',
    color: '#6b7280',
    margin: 0,
    textAlign: 'center',
    lineHeight: '1.6',
    maxWidth: '280px',
  },

  // Full-width blue CTA button
  button: {
    width: '100%',
    padding: '16px',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
    borderRadius: '12px',
    border: 'none',
    backgroundColor: '#2563eb',
    color: '#ffffff',
    marginTop: '8px',
    transition: 'opacity 0.15s',
  },

  // Applied on top of button while location is being fetched
  buttonDisabled: {
    opacity: 0.6,
    cursor: 'not-allowed',
  },

  // Red error text shown below the button on failure
  error: {
    color: '#dc2626',
    fontSize: '0.9rem',
    margin: 0,
    textAlign: 'center',
    lineHeight: '1.5',
    maxWidth: '300px',
  },
};

export default LandingPage;
