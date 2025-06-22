import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import './App.css';
import ReportForm from './components/ReportForm';
import type { ReportResponse } from './services/311Service';
import L from 'leaflet';

// Workaround to fix default icon issues with bundlers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const nycPosition: [number, number] = [40.7128, -74.006];

type MarkerData = {
  id: number;
  position: [number, number];
  description: string;
  severity?: 'low' | 'medium' | 'high';
  reportId?: string; // To track submission status
};

const initialMarkers: MarkerData[] = [
  { id: 1, position: [40.7128, -74.006], description: 'Pothole at Wall St', severity: 'high' },
  { id: 2, position: [40.7306, -73.9352], description: 'Pothole near Queens', severity: 'medium' },
];

function App() {
  const [markers, setMarkers] = useState<MarkerData[]>(initialMarkers);
  const [markerToReport, setMarkerToReport] = useState<MarkerData | null>(null);

  const handleReportSuccess = (response: ReportResponse) => {
    if (markerToReport && response.success && response.reportId) {
      setMarkers(prevMarkers =>
        prevMarkers.map(m =>
          m.id === markerToReport.id
            ? { ...m, reportId: response.reportId }
            : m
        )
      );
    }
    setMarkerToReport(null); // Close the form
  };

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh' }}>
      <MapContainer center={nycPosition} zoom={13} className="map-container">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {markers.map((marker) => (
          <Marker key={marker.id} position={marker.position}>
            <Popup>
              <div className="popup-content">
                <h4>Pothole Details</h4>
                <p>{marker.description}</p>
                {marker.severity && <p>Severity: <strong>{marker.severity.toUpperCase()}</strong></p>}
                
                {marker.reportId ? (
                  <div className="popup-submitted-message">
                    ✓ Report Submitted
                  </div>
                ) : (
                  <button
                    className="popup-report-button"
                    onClick={() => setMarkerToReport(marker)}
                  >
                    Submit 311 Report
                  </button>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {markerToReport && (
        <ReportForm
          isVisible={!!markerToReport}
          latitude={markerToReport.position[0]}
          longitude={markerToReport.position[1]}
          onClose={() => setMarkerToReport(null)}
          onSuccess={handleReportSuccess}
        />
      )}
    </div>
  );
}

export default App;
