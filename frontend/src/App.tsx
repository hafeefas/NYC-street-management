import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const nycPosition: [number, number] = [40.7128, -74.006];

type MarkerData = {
  id: number;
  position: [number, number];
  description: string;
};

const sampleMarkers: MarkerData[] = [
  { id: 1, position: [40.7128, -74.006], description: 'Pothole at Wall St' },
  { id: 2, position: [40.7306, -73.9352], description: 'Pothole near Queens' },
];

function App() {
  const [selectedMarker, setSelectedMarker] = useState<MarkerData | null>(null);

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      {/* Map Section */}
      <MapContainer
        center={nycPosition}
        zoom={12}
        style={{ height: '100%', width: '50%' }}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {sampleMarkers.map((marker) => (
          <Marker
            key={marker.id}
            position={marker.position}
            eventHandlers={{
              click: () => setSelectedMarker(marker),
            }}
          >
            <Popup>{marker.description}</Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Info Panel */}
      <div
        style={{
          width: '50%',
          padding: '1rem',
          backgroundColor: '#f0f0f0',
          overflowY: 'auto',
        }}
      >
        {selectedMarker ? (
          <>
            <h2>Pothole Details</h2>
            <p>
              <strong>ID:</strong> {selectedMarker.id}
            </p>
            <p>
              <strong>Description:</strong> {selectedMarker.description}
            </p>
            <p>
              <strong>Coordinates:</strong> {selectedMarker.position[0].toFixed(5)},{' '}
              {selectedMarker.position[1].toFixed(5)}
            </p>
            <button
              onClick={() => alert('Submit 311 report (simulated)')}
              style={{ marginTop: '1rem', padding: '0.5rem 1rem' }}
            >
              Submit 311 report
            </button>
          </>
        ) : (
          <p>Click on a pothole marker on the map to see details here.</p>
        )}
      </div>
    </div>
  );
}

export default App;
