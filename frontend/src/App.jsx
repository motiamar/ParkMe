import { useState } from 'react';
import LandingPage from './pages/LandingPage';
import NearbyParkingPage from './pages/NearbyParkingPage';

function App() {
  const [page, setPage] = useState('landing');

  if (page === 'nearby') return <NearbyParkingPage onNavigate={setPage} />;
  return <LandingPage onNavigate={setPage} />;
}

export default App;
