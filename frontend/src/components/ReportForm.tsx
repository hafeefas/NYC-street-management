import React, { useState } from 'react';
import type { PotholeReport, ReportResponse } from '../services/311Service';
import { report311Service } from '../services/311Service';

interface ReportFormProps {
  latitude: number;
  longitude: number;
  isVisible: boolean;
  onClose: () => void;
  onSuccess?: (response: ReportResponse) => void;
}

const ReportForm: React.FC<ReportFormProps> = ({ latitude, longitude, isVisible, onClose, onSuccess }) => {
  const [formData, setFormData] = useState<Partial<PotholeReport>>({
    latitude,
    longitude,
    description: '',
    severity: 'medium',
    reporterName: '',
    reporterEmail: '',
    reporterPhone: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.description?.trim()) {
      setMessage({ type: 'error', text: 'Please provide a description of the pothole.' });
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    try {
      const response = await report311Service.submitPotholeReport(formData as PotholeReport);
      
      if (response.success) {
        setMessage({ type: 'success', text: response.message });
        if (onSuccess) onSuccess(response);
        setTimeout(() => onClose(), 2000); // Close form after 2 seconds on success
      } else {
        setMessage({ type: 'error', text: response.message });
      }
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: 'An unexpected error occurred. Please try again.' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div
        className={`slide-in-panel-overlay ${isVisible ? 'visible' : ''}`}
        onClick={onClose}
      />
      <div className={`slide-in-panel ${isVisible ? 'visible' : ''}`}>
        <div className="report-form-header">
          <h2>Submit 311 Report</h2>
          <button onClick={onClose} className="close-button">&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="report-form">
          <div className="form-group">
            <label>Location:</label>
            <p className="location-display">
              {latitude.toFixed(6)}, {longitude.toFixed(6)}
            </p>
          </div>

          <div className="form-group">
            <label htmlFor="description">Description *</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="e.g., Large pothole in the right lane"
              required
              rows={3}
            />
          </div>

          <div className="form-group">
            <label htmlFor="severity">Severity</label>
            <select
              id="severity"
              name="severity"
              value={formData.severity}
              onChange={handleInputChange}
            >
              <option value="low">Low - Minor surface damage</option>
              <option value="medium">Medium - Moderate damage</option>
              <option value="high">High - Severe damage, safety hazard</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="reporterName">Your Name (Optional)</label>
            <input
              type="text"
              id="reporterName"
              name="reporterName"
              value={formData.reporterName}
              onChange={handleInputChange}
              placeholder="Enter your name"
            />
          </div>

          <div className="form-group">
            <label htmlFor="reporterEmail">Email (Optional)</label>
            <input
              type="email"
              id="reporterEmail"
              name="reporterEmail"
              value={formData.reporterEmail}
              onChange={handleInputChange}
              placeholder="Enter your email for updates"
            />
          </div>

          <div className="form-group">
            <label htmlFor="reporterPhone">Phone (Optional)</label>
            <input
              type="tel"
              id="reporterPhone"
              name="reporterPhone"
              value={formData.reporterPhone}
              onChange={handleInputChange}
              placeholder="Enter your phone number"
            />
          </div>

          {message && (
            <div className={`message ${message.type}`}>
              {message.text}
            </div>
          )}
        </form>
        
        <div className="form-actions">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="cancel-button"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="pothole-report-form"
              disabled={isSubmitting}
              className="submit-button"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Report'}
            </button>
          </div>
      </div>
    </>
  );
};

export default ReportForm; 