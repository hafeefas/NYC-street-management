import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Tooltip } from 'react-leaflet';
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

// Type for the raw data coming from your backend API
interface PotholeReportAPI {
  unique_key: string;
  latitude: string;
  longitude: string;
  street_name: string;
  created_date: string;
}

// The app's internal data structure for each map marker
type MarkerData = {
  id: string;
  position: [number, number];
  description: string;
  reportId?: string; // Used to track 311 submission status
};

function App() {
  const [markers, setMarkers] = useState<MarkerData[]>([]);
  const [markerToReport, setMarkerToReport] = useState<MarkerData | null>(null);

  // Fetch pothole data from the backend when the app loads
  useEffect(() => {
    fetch("http://127.0.0.1:8000/api/potholes")
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch');
        return res.json();
      })
      .then((data: PotholeReportAPI[]) => {
        const transformedData = data.map((item) => ({
          id: item.unique_key,
          position: [parseFloat(item.latitude), parseFloat(item.longitude)] as [number, number],
          description: item.street_name
            ? `Pothole at ${item.street_name}`
            : `Pothole reported on ${new Date(item.created_date).toLocaleDateString()}`,
        }));
        setMarkers(transformedData);
      })
      .catch((err) => {
        console.error("Failed to fetch pothole data:", err);
      });
  }, []);

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
    // Keep the form open to show success, user will close it manually
  };

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh' }}>
      <MapContainer center={nycPosition} zoom={13} className="map-container">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {markers.map((marker) => (
          <Marker
            key={marker.id}
            position={marker.position}
            eventHandlers={{
              click: () => {
                setMarkerToReport(marker);
              },
            }}
          >
            <Tooltip>
              <div className="map-tooltip">
                <strong>{marker.description}</strong>
                {marker.reportId && (
                  <p className="tooltip-submitted-status">
                    ✓ Report Submitted
                  </p>
                )}
              </div>
            </Tooltip>
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
