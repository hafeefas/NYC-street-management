export interface PotholeReport {
  latitude: number;
  longitude: number;
  description: string;
  severity: 'low' | 'medium' | 'high';
  reporterName?: string;
  reporterEmail?: string;
  reporterPhone?: string;
}

export interface ReportResponse {
  success: boolean;
  reportId?: string;
  message: string;
  error?: string;
}

class Report311Service {
  private baseUrl = 'http://localhost:8000'; //  backend URL

  async submitPotholeReport(report: PotholeReport): Promise<ReportResponse> {
    try {
      // First, verify the pothole exists using your backend analyzer
      const analysisResponse = await fetch(
        `${this.baseUrl}/api/potholes/analyzer?lat=${report.latitude}&lng=${report.longitude}`
      );

      if (!analysisResponse.ok) {
        throw new Error('Failed to analyze location');
      }

      const analysis = await analysisResponse.json();
      
      if (analysis.status === 'failed') {
        return {
          success: false,
          message: 'Unable to verify pothole at this location',
          error: analysis.error
        };
      }

      // If pothole is detected, proceed with 311 submission
      if (analysis.analysis.potholes_detected > 0) {
        // Simulate 311 API call (replace with actual 311 API endpoint)
        const response = await this.submitTo311API(report);
        return response;
      } else {
        return {
          success: false,
          message: 'No pothole detected at this location. Please verify the location and try again.',
        };
      }
    } catch (error) {
      console.error('Error submitting 311 report:', error);
      return {
        success: false,
        message: 'Failed to submit report. Please try again.',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async submitTo311API(report: PotholeReport): Promise<ReportResponse> {
    // This is a simulation of the 311 API call
    // Will have to replace this with the actual 311 API endpoint and format. but we don't actually want to bother
    // 311, so for now we'll just simulate the API call.
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Simulate successful submission (replace with actual API call)
    const mockResponse = {
      reportId: `311-${Date.now()}`,
      status: 'submitted',
      estimatedResolution: '5-7 business days'
    };

    return {
      success: true,
      reportId: mockResponse.reportId,
      message: `Report submitted successfully! Report ID: ${mockResponse.reportId}. Estimated resolution: ${mockResponse.estimatedResolution}`
    };
  }

  // Method to get report status (for future use)
  async getReportStatus(reportId: string): Promise<any> {
    try {
      // Replace with actual 311 API call to check status
      const response = await fetch(`/api/311/status/${reportId}`);
      return await response.json();
    } catch (error) {
      console.error('Error checking report status:', error);
      throw error;
    }
  }
}

export const report311Service = new Report311Service(); 