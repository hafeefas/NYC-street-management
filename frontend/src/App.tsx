import React, { useState, useEffect } from "react";
import { MapContainer } from "react-leaflet/MapContainer";
import { TileLayer } from "react-leaflet/TileLayer";
import { Marker } from "react-leaflet/Marker";
import { Popup } from "react-leaflet/Popup";
import "leaflet/dist/leaflet.css";

type MarkerData = {
  id: string;
  position: [number, number];
  description: string;
  report: PotholeReport;
};

type PotholeReport = {
  created_date: string;
  unique_key: string;
  complaint_type: string;
  descriptor: string;
  latitude: string;
  longitude: string;
  street_name?: string;
};

function App() {
  const [markers, setMarkers] = useState<MarkerData[]>([]);
  const [overlayOpen, setOverlayOpen] = useState(false);
  const [analyzerInfo, setAnalyzerInfo] = useState<object | null>(null);
  const [loadingAnalyzer, setLoadingAnalyzer] = useState(false);
  const [overlayPos, setOverlayPos] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    fetch("http://127.0.0.1:8000/api/potholes")
      .then((res) => res.json())
      .then((data: PotholeReport[]) => {
        const transformed = data.map((item, idx) => ({
          id: item.unique_key ? String(item.unique_key) : String(idx),
          position: [parseFloat(item.latitude), parseFloat(item.longitude)] as [
            number,
            number
          ],
          description: item.street_name
            ? `Pothole at ${item.street_name}`
            : `Pothole reported on ${item.created_date}`,
          report: item,
        }));
        console.log(transformed);
        setMarkers(transformed);
      })
      .catch((err) => {
        console.error("Failed to fetch pothole data:", err);
      });
  }, []);

  // Drag handlers
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (dragging) {
        setOverlayPos({
          x: e.clientX - dragOffset.x,
          y: e.clientY - dragOffset.y,
        });
      }
    };
    const handleMouseUp = () => setDragging(false);
    if (dragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [dragging, dragOffset]);

  // Function to fetch analyzer info
  const handleMarkerClick = async (marker: MarkerData) => {
    setOverlayOpen(true);
    setLoadingAnalyzer(true);
    setAnalyzerInfo(null);
    try {
      const lat = marker.position[0];
      const lng = marker.position[1];
      const res = await fetch(
        `http://127.0.0.1:8000/api/potholes/analyzer?lat=${lat}&lng=${lng}`
      );
      const data = await res.json();
      setAnalyzerInfo(data);
    } catch {
      setAnalyzerInfo({ error: "Failed to fetch analyzer info." });
    } finally {
      setLoadingAnalyzer(false);
    }
  };

  return (
    <>
      {/* Apple Maps-style Side Overlay */}
      {overlayOpen && (
        <div
          style={{
            position: "fixed",
            top: overlayPos.y,
            left: overlayPos.x,
            height: dragging ? "100%" : "60%",
            width: 340,
            background: "rgba(20,30,60,0.85)",
            color: "#fff",
            zIndex: 2000,
            borderTopRightRadius: 20,
            borderBottomRightRadius: 20,
            boxShadow: "2px 0 16px rgba(0,0,0,0.3)",
            padding: "32px 24px 24px 24px",
            display: "flex",
            flexDirection: "column",
            overflowY: "auto",
            cursor: dragging ? "grabbing" : "default",
          }}
        >
          <button
            onClick={() => setOverlayOpen(false)}
            style={{
              position: "absolute",
              top: 16,
              right: 16,
              background: "none",
              border: "none",
              color: "#fff",
              fontSize: 28,
              cursor: "pointer",
            }}
            aria-label="Close panel"
          >
            ×
          </button>
          <h2
            style={{ marginTop: 0, cursor: "grab", userSelect: "none" }}
            onMouseDown={(e) => {
              setDragging(true);
              setDragOffset({
                x: e.clientX - overlayPos.x,
                y: e.clientY - overlayPos.y,
              });
            }}
          >
            Pothole Analyzer
          </h2>
          {loadingAnalyzer && <p>Loading analysis...</p>}
          {analyzerInfo && (
            <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
              {JSON.stringify(analyzerInfo, null, 2)}
            </pre>
          )}
        </div>
      )}
      <MapContainer
        center={[40.7128, -74.006]}
        zoom={12}
        style={{ height: "100vh", width: "100vw" }}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {markers.map((marker) => (
          <Marker
            key={marker.id}
            position={marker.position}
            eventHandlers={{
              click: () => handleMarkerClick(marker),
            }}
          >
            <Popup>
              <div>
                <strong>Pothole Report</strong>
                <br />
                <strong>ID:</strong> {marker.id}
                <br />
                <strong>Street:</strong> {marker.report.street_name || "N/A"}
                <br />
                <strong>Date:</strong> {marker.report.created_date}
                <br />
                <strong>Type:</strong> {marker.report.complaint_type}
                <br />
                <strong>Descriptor:</strong> {marker.report.descriptor}
                <br />
                <strong>Lat:</strong> {marker.position[0].toFixed(5)}
                <br />
                <strong>Lng:</strong> {marker.position[1].toFixed(5)}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </>
  );
}

export default App;
