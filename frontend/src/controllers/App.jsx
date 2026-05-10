import { useState } from 'react';
import LandingPage from '../pages/LandingPage';
import NearbyParkingPage from '../pages/NearbyParkingPage';

// Root controller — owns app-wide state and decides which page to render.
// Pages do not navigate themselves; they call the handlers passed down as props.
function App() {
  // page: tracks which screen is currently active ('landing' or 'nearby')
  // location: stores the user's { lat, lng } after permission is granted
  const [page, setPage] = useState('landing');
  const [location, setLocation] = useState(null);

  // Called by LandingPage when location permission is approved.
  // Saves the coordinates and switches to the results screen.
  function handleFindParking(coords) {
    setLocation(coords);
    setPage('nearby');
  }

  // Render the active page, passing down only the props each page needs
  if (page === 'nearby') return <NearbyParkingPage onNavigate={setPage} location={location} />;
  return <LandingPage onNavigate={setPage} onFindParking={handleFindParking} />;
}

export default App;
