import { useEffect, useState } from 'react';
import LandingPage from '../pages/LandingPage';
import NearbyParkingPage from '../pages/NearbyParkingPage';

const translations = {
  he: {
    toggleLanguage: 'English',
    landing: {
      title: 'חפש חניה',
      loading: 'מאתר מיקום...',
      subtitle: 'מצא חניונים קרובים בקלות ותחסוך זמן בדרך.',
      unsupported: 'הדפדפן שלך אינו תומך באיתור מיקום.',
      permissionDenied: 'נדרשת הרשאת מיקום כדי למצוא חניה קרובה. יש לאשר אותה ולנסות שוב.',
      locationError: 'לא ניתן לקבל את המיקום שלך. אנא נסה שוב.',
    },
    nearby: {
      title: 'חניונים קרובים',
      default: 'ברירת מחדל',
      closest: 'הכי קרוב',
      cheapest: 'הכי זול',
      favorites: 'מועדפים',
      noFavorites: 'אין חניונים מועדפים עדיין',
      loading: 'טוען חניונים...',
      loadError: 'לא ניתן לטעון חניונים.',
      backendHint: 'ודא שהשרת רץ על פורט 5176.',
      empty: 'לא נמצאו חניונים.',
      mapUnavailable: 'המיקום אינו זמין - לא ניתן להציג את המפה',
      free: 'חינם',
      hrSuffix: '/שעה',
      perHour: 'לשעה',
      full: 'מלא',
      spaces: 'מקומות',
      distanceUnavailable: 'מרחק לא זמין',
      travelTimeUnavailable: 'זמן נסיעה לא זמין',
      minShort: 'דק',
      hrShort: 'שעה',
    },
    details: {
      free: 'חינם',
      perHour: 'לשעה',
      distanceUnavailable: 'מרחק לא זמין',
      travelTimeUnavailable: 'זמן נסיעה לא זמין',
      notAvailable: 'לא זמין',
      full: 'מלא',
      low: 'מעט מקומות',
      available: 'פנוי',
      availability: 'זמינות',
      type: 'סוג',
      distance: 'מרחק',
      drivingTime: 'זמן נסיעה',
      features: 'מאפיינים',
      back: 'חזור',
      addFavorite: 'הוסף למועדפים',
      removeFavorite: 'הסר מהמועדפים',
    },
    textSize: {
      small: 'גודל טקסט: קטן',
      medium: 'גודל טקסט: בינוני',
      large: 'גודל טקסט: גדול',
    },
  },
  en: {
    toggleLanguage: 'עברית',
    landing: {
      title: 'Find Parking',
      loading: 'Getting location...',
      subtitle: 'Find nearby parking easily and save time on the move.',
      unsupported: 'Geolocation is not supported by your browser.',
      permissionDenied: 'Location permission is required to find nearby parking. Please allow it and try again.',
      locationError: 'Could not get your location. Please try again.',
    },
    nearby: {
      title: 'Nearby Parking',
      default: 'Default',
      closest: 'Closest',
      cheapest: 'Cheapest',
      favorites: 'Favorites',
      noFavorites: 'No favorite parking lots yet',
      loading: 'Loading parking lots...',
      loadError: 'Could not load parking lots.',
      backendHint: 'Make sure the backend is running on port 5176.',
      empty: 'No parking lots found.',
      mapUnavailable: 'Location unavailable - cannot show map',
      free: 'FREE',
      hrSuffix: '/hr',
      perHour: 'per hour',
      full: 'Full',
      spaces: 'spaces',
      distanceUnavailable: 'Distance unavailable',
      travelTimeUnavailable: 'Travel time unavailable',
      minShort: 'min',
      hrShort: 'hr',
    },
    details: {
      free: 'FREE',
      perHour: 'per hour',
      distanceUnavailable: 'Distance unavailable',
      travelTimeUnavailable: 'Travel time unavailable',
      notAvailable: 'Not available',
      full: 'Full',
      low: 'Low',
      available: 'Available',
      availability: 'AVAILABILITY',
      type: 'TYPE',
      distance: 'DISTANCE',
      drivingTime: 'DRIVING TIME',
      features: 'Features',
      back: 'Back',
      addFavorite: 'Add to favorites',
      removeFavorite: 'Remove from favorites',
    },
    textSize: {
      small: 'Text size: small',
      medium: 'Text size: medium',
      large: 'Text size: large',
    },
  },
};

// Root controller — owns app-wide state and decides which page to render.
// Pages do not navigate themselves; they call the handlers passed down as props.
function App() {
  // page: tracks which screen is currently active ('landing' or 'nearby')
  // location: stores the user's { lat, lng } after permission is granted
  const [page, setPage] = useState('landing');
  const [location, setLocation] = useState(null);
  const [language, setLanguage] = useState('he');

  useEffect(() => {
    document.documentElement.dir = language === 'he' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language]);

  const t = translations[language];

  function toggleLanguage() {
    setLanguage((current) => (current === 'he' ? 'en' : 'he'));
  }

  // Called by LandingPage when location permission is approved.
  // Saves the coordinates and switches to the results screen.
  function handleFindParking(coords) {
    setLocation(coords);
    setPage('nearby');
  }

  // Render the active page, passing down only the props each page needs
  return (
    <div dir={language === 'he' ? 'rtl' : 'ltr'} style={styles.shell}>
      {page === 'nearby' ? (
        <NearbyParkingPage
          onNavigate={setPage}
          location={location}
          language={language}
          t={t}
          onToggleLanguage={toggleLanguage}
        />
      ) : (
        <LandingPage
          onNavigate={setPage}
          onFindParking={handleFindParking}
          language={language}
          t={t}
        />
      )}
    </div>
  );
}

const styles = {
  shell: {
    minHeight: '100vh',
  },
};

export default App;
