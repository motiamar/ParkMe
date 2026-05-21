import { MapContainer, TileLayer, CircleMarker, Circle, Marker, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

import MapCenterController from './MapCenterController';
import { parkingIcon, searchLocationIcon } from '../../utils/mapIcons';
import { getLotName } from '../../utils/parkingFormatters';
import { styles } from './nearbyStyles';

// Renders the Leaflet map with:
//   • User GPS dot + accuracy ring
//   • Green "P" pins for every parking lot that has coordinates
//   • Teardrop search-result pin (when searchedLocation is set)
//   • MapCenterController to fly the map on center changes
function ParkingMap({ userPosition, mapCenter, parkingLots, searchedLocation, onSelectLot, language, t }) {
  if (!userPosition) {
    return (
      <div style={styles.noMapFallback}>
        <p style={{ ...styles.noLocationText, textAlign: language === 'he' ? 'right' : 'center' }}>
          {t.nearby.mapUnavailable}
        </p>
      </div>
    );
  }

  return (
    <MapContainer
      center={mapCenter ?? userPosition}
      zoom={16}
      style={{ width: '100%', height: '100%' }}
      zoomControl={false}
      attributionControl={false}
    >
      {/* Moves the map whenever mapCenter changes (search or clear) */}
      <MapCenterController center={mapCenter} />

      {/* CartoDB Voyager — free, no API key, modern Waze-like style */}
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
      />

      {/* Accuracy ring — translucent blue circle around the user dot */}
      <Circle
        center={userPosition}
        radius={40}
        pathOptions={{ color: '#2563eb', weight: 0, fillColor: '#2563eb', fillOpacity: 0.15 }}
      />

      {/* User location dot — solid blue with white border */}
      <CircleMarker
        center={userPosition}
        radius={9}
        pathOptions={{ color: '#ffffff', weight: 3, fillColor: '#2563eb', fillOpacity: 1 }}
      />

      {/* Green teardrop pin at the geocoded search result */}
      {searchedLocation && (
        <Marker position={searchedLocation} icon={searchLocationIcon} />
      )}

      {/* One green "P" pin per parking lot that has valid coordinates */}
      {parkingLots
        .filter(lot =>
          lot.latitude  != null && !isNaN(lot.latitude) &&
          lot.longitude != null && !isNaN(lot.longitude)
        )
        .map(lot => (
          <Marker
            key={lot.id}
            position={[lot.latitude, lot.longitude]}
            icon={parkingIcon}
            eventHandlers={{ click: () => onSelectLot(lot) }}
          >
            <Tooltip direction="top" offset={[0, -36]} opacity={0.95}>
              {getLotName(lot, language)}
            </Tooltip>
          </Marker>
        ))
      }
    </MapContainer>
  );
}

export default ParkingMap;
