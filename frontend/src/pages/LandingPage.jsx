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
    // Full-screen gradient background — centers the card vertically and horizontally
    <div dir={language === 'he' ? 'rtl' : 'ltr'} style={styles.screen}>
      {/* Content card — constrained to mobile width (max 360px) */}
      <div style={styles.card}>
        {/* Glassmorphism icon box with large "P" — parking app logo */}
        <div style={styles.iconBox}>
          <span style={styles.iconLetter}>P</span>
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
  // Outer wrapper: full viewport, blue gradient, centers the card
  screen: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    background: 'linear-gradient(160deg, #0f1f5c 0%, #1d4ed8 65%, #4f86f7 100%)',
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

  // Glassmorphism rounded square — frosted overlay on the blue gradient
  iconBox: {
    width: '110px',
    height: '110px',
    background: 'rgba(255,255,255,0.15)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    borderRadius: '28px',
    border: '1.5px solid rgba(255,255,255,0.3)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 8px 32px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.2)',
    marginBottom: '8px',
  },

  // Large bold "P" — parking app logo lettermark
  iconLetter: {
    fontSize: '3.8rem',
    fontWeight: '800',
    color: '#ffffff',
    lineHeight: 1,
    textShadow: '0 2px 16px rgba(255,255,255,0.4)',
    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    letterSpacing: '-1px',
    userSelect: 'none',
  },

  // Large bold app name — white on gradient
  title: {
    fontSize: '2.6rem',
    fontWeight: '700',
    color: '#ffffff',
    margin: 0,
    letterSpacing: '-0.5px',
  },

  // Tagline — soft white on gradient
  subtitle: {
    fontSize: '1rem',
    color: 'rgba(255,255,255,0.78)',
    margin: 0,
    textAlign: 'center',
    lineHeight: '1.6',
    maxWidth: '280px',
  },

  // Full-width white CTA button — inverted for contrast on blue background
  button: {
    width: '100%',
    padding: '16px',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
    borderRadius: '12px',
    border: 'none',
    backgroundColor: '#ffffff',
    color: '#1d4ed8',
    marginTop: '8px',
    transition: 'opacity 0.15s',
    boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
  },

  // Applied on top of button while location is being fetched
  buttonDisabled: {
    opacity: 0.6,
    cursor: 'not-allowed',
  },

  // Soft red error text visible against the blue gradient
  error: {
    color: '#fca5a5',
    fontSize: '0.9rem',
    margin: 0,
    textAlign: 'center',
    lineHeight: '1.5',
    maxWidth: '300px',
  },
};

export default LandingPage;
