import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';

// Must be rendered inside <MapContainer> to access the Leaflet map instance.
// Compares coordinates by value (not reference) so flyTo only fires when the
// actual lat/lng changes — preventing the map from shaking on every re-render.
function MapCenterController({ center }) {
  const map = useMap();
  const prevKey = useRef(null);

  useEffect(() => {
    if (!center) return;
    const key = `${center[0]},${center[1]}`;
    if (key === prevKey.current) return;
    prevKey.current = key;
    map.flyTo(center, 16, { animate: true, duration: 0.8 });
  }, [center, map]);

  return null;
}

export default MapCenterController;
