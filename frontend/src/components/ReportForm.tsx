import React, { useState, useEffect } from 'react';
import type { PotholeReport, ReportResponse } from '../services/311Service';
import { report311Service } from '../services/311Service';

// Define the structure of the analysis data from the backend
interface AnalysisData {
  street_view_url: string;
  analysis: {
    potholes_detected: number;
    annotated_image_path?: string;
  };
  error?: string;
}

interface ReportFormProps {
  latitude: number;
  longitude: number;
  isVisible: boolean;
  onClose: () => void;
  onSuccess?: (response: ReportResponse) => void;
}

const ReportForm: React.FC<ReportFormProps> = ({ latitude, longitude, isVisible, onClose, onSuccess }) => {
  const [view, setView] = useState<'analyzing' | 'analysisResult' | 'form'>('analyzing');
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);

  useEffect(() => {
    if (isVisible) {
      setView('analyzing');
      setAnalysisData(null);
      const fetchAnalysis = async () => {
        try {
          const res = await fetch(`http://localhost:8000/api/potholes/analyzer?lat=${latitude}&lng=${longitude}`);
          if (!res.ok) throw new Error('Analysis request failed');
          const data = await res.json();
          setAnalysisData(data);
        } catch (error) {
          setAnalysisData({ error: 'Failed to load analysis.' } as any);
        } finally {
          setView('analysisResult');
        }
      };
      fetchAnalysis();
    }
  }, [isVisible, latitude, longitude]);

  const handleProceedToForm = () => setView('form');
  
  const renderAnalysisResult = () => {
    if (!analysisData) return <p>No analysis data found.</p>;
    if (analysisData.error) return <p className="message error">{analysisData.error}</p>;

    const potholeDetected = analysisData.analysis.potholes_detected > 0;
    const imageUrl = analysisData.analysis.annotated_image_path || analysisData.street_view_url;

    return (
      <div className="analysis-view">
        <img src={imageUrl} alt="Street View of the location" className="analysis-image" />
        <div className={`analysis-result ${potholeDetected ? 'success' : 'error'}`}>
          {potholeDetected
            ? `✓ ${analysisData.analysis.potholes_detected} Pothole(s) Detected`
            : "✗ No Pothole Detected"}
        </div>
        <p className="analysis-info">
          This image was analyzed by Moondream to verify the pothole's presence.
        </p>
        {potholeDetected && (
          <button onClick={handleProceedToForm} className="submit-button">
            Proceed to Report
          </button>
        )}
      </div>
    );
  };
  
  const renderForm = () => (
    <ReportFormContent 
      latitude={latitude} 
      longitude={longitude} 
      onSuccess={(response: ReportResponse) => {
        if (onSuccess) onSuccess(response);
        setTimeout(() => onClose(), 1500); // Auto-close after 1.5s
      }}
    />
  );

  return (
    <>
      <div className={`slide-in-panel-overlay ${isVisible ? 'visible' : ''}`} onClick={onClose} />
      <div className={`slide-in-panel ${isVisible ? 'visible' : ''}`}>
        <div className="report-form-header">
          <h2>{view === 'form' ? 'Submit 311 Report' : 'Pothole Analysis'}</h2>
          <button onClick={onClose} className="close-button">&times;</button>
        </div>
        <div className="report-form">
          {view === 'analyzing' && <div className="loader">Analyzing Location...</div>}
          {view === 'analysisResult' && renderAnalysisResult()}
          {view === 'form' && renderForm()}
        </div>
      </div>
    </>
  );
};

interface ReportFormContentProps {
  latitude: number;
  longitude: number;
  onSuccess: (response: ReportResponse) => void;
}

// Extracted form content with all fields restored
const ReportFormContent: React.FC<ReportFormContentProps> = ({ latitude, longitude, onSuccess }) => {
  const [formData, setFormData] = useState<Partial<PotholeReport>>({ latitude, longitude, description: '', severity: 'medium' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.description?.trim()) return;

    setIsSubmitting(true);
    try {
      const response = await report311Service.submitPotholeReport(formData as PotholeReport);
      if (response.success) {
        setIsSubmitted(true);
        if (onSuccess) onSuccess(response);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} id="pothole-report-form">
      <div className="form-group">
        <label>Location:</label>
        <p className="location-display">{latitude.toFixed(6)}, {longitude.toFixed(6)}</p>
      </div>
      <div className="form-group">
        <label htmlFor="description">Description *</label>
        <textarea id="description" name="description" value={formData.description} onChange={handleInputChange} required rows={3} disabled={isSubmitted} placeholder="e.g., Large pothole in the right lane" />
      </div>
      <div className="form-group">
        <label htmlFor="severity">Severity</label>
        <select id="severity" name="severity" value={formData.severity} onChange={handleInputChange} disabled={isSubmitted}>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
      </div>
      <div className="form-actions">
        <button
          type="submit"
          disabled={isSubmitting || isSubmitted}
          className={`submit-button full-width ${isSubmitted ? 'submitted' : ''}`}
        >
          {isSubmitted ? '✓ Submitted' : isSubmitting ? 'Submitting...' : 'Submit Report'}
        </button>
      </div>
    </form>
  );
};

export default ReportForm; 