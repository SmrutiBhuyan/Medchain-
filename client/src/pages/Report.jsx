import React, { useState, useEffect } from 'react';
import { 
  FaFlag, 
  FaCheckCircle, 
  FaExclamationTriangle, 
  FaArrowLeft,
  FaUser,
  FaEnvelope,
  FaPhone,
  FaInfoCircle
} from 'react-icons/fa';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';
import './Report.css';

const ReportCounterfeit = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Get drug info from navigation state
  const [drugInfo, setDrugInfo] = useState({
    barcode: '',
    name: 'Unknown Drug'
  });
  
  const [formData, setFormData] = useState({
    reporterName: '',
    reporterEmail: '',
    reporterPhone: '',
    purchaseLocation: '',
    purchaseDate: '',
    additionalDetails: '',
    evidenceType: 'photo',
    reportAnonymously: false
  });
  
  const [submissionStatus, setSubmissionStatus] = useState({
    submitting: false,
    success: false,
    error: null
  });

  // Autofill drug info from navigation state
  useEffect(() => {
    if (location.state) {
      setDrugInfo({
        barcode: location.state.barcode || '',
        name: location.state.drugName || 'Unknown Drug'
      });
    }
  }, [location.state]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.reportAnonymously && !formData.reporterName) {
      setSubmissionStatus({
        submitting: false,
        success: false,
        error: 'Please provide your name or check "Report Anonymously"'
      });
      return;
    }
    
    setSubmissionStatus({
      submitting: true,
      success: false,
      error: null
    });
    
    try {
      const reportData = {
        ...formData,
        drugBarcode: drugInfo.barcode,
        drugName: drugInfo.name,
        reportDate: new Date().toISOString()
      };
      
      // In a real app, you would send this to your backend
      const response = await axios.post('http://localhost:5000/api/reports', reportData);
      
      setSubmissionStatus({
        submitting: false,
        success: true,
        error: null
      });
      
      // Clear form after successful submission
      setFormData({
        reporterName: '',
        reporterEmail: '',
        reporterPhone: '',
        purchaseLocation: '',
        purchaseDate: '',
        additionalDetails: '',
        evidenceType: 'photo',
        reportAnonymously: false
      });
      
    } catch (error) {
      console.error('Report submission error:', error);
      setSubmissionStatus({
        submitting: false,
        success: false,
        error: error.response?.data?.message || 'Failed to submit report. Please try again.'
      });
    }
  };

  return (
    <div className="report-container-body">
        <div className="report-container">
      <div className="report-card">
        <button 
          className="report-back-btn"
          onClick={() => navigate(-1)}
        >
          <FaArrowLeft /> Back to Verification
        </button>
        
        <h2><FaFlag /> Report Suspected Counterfeit Drug</h2>
        
        <div className="report-drug-info">
          <h3>Drug Information (Auto-filled)</h3>
          <div className="report-drug-details">
            <p><strong>Name:</strong> {drugInfo.name}</p>
            <p><strong>Barcode:</strong> {drugInfo.barcode || 'Not available'}</p>
          </div>
        </div>
        
        {submissionStatus.success ? (
          <div className="report-success">
            <div className="report-success-icon">
              <FaCheckCircle />
            </div>
            <h3>Report Submitted Successfully</h3>
            <p>
              Thank you for helping combat counterfeit drugs. Your report has been 
              submitted to the appropriate authorities.
            </p>
            <p>
              <strong>Next Steps:</strong> You may be contacted for additional 
              information. Please preserve the drug packaging as evidence.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="report-form">
            <h3>Reporter Information</h3>
            
            <div className="report-form-group">
              <label htmlFor="reporterName">
                <FaUser /> Your Name {!formData.reportAnonymously && <span className="report-required">*</span>}
              </label>
              <input
                type="text"
                id="reporterName"
                name="reporterName"
                value={formData.reporterName}
                onChange={handleChange}
                disabled={formData.reportAnonymously}
                required={!formData.reportAnonymously}
              />
            </div>
            
            <div className="report-form-group">
              <label>
                <input
                  type="checkbox"
                  name="reportAnonymously"
                  checked={formData.reportAnonymously}
                  onChange={handleChange}
                />
                Report Anonymously
              </label>
              <small className="report-form-hint">
                <FaInfoCircle /> Anonymous reports may limit follow-up options
              </small>
            </div>
            
            <div className="report-form-group">
              <label htmlFor="reporterEmail">
                <FaEnvelope /> Email Address
              </label>
              <input
                type="email"
                id="reporterEmail"
                name="reporterEmail"
                value={formData.reporterEmail}
                onChange={handleChange}
              />
              <small className="report-form-hint">
                Provide if you'd like to receive updates
              </small>
            </div>
            
            <div className="report-form-group">
              <label htmlFor="reporterPhone">
                <FaPhone /> Phone Number
              </label>
              <input
                type="tel"
                id="reporterPhone"
                name="reporterPhone"
                value={formData.reporterPhone}
                onChange={handleChange}
              />
            </div>
            
            <h3>Purchase Information</h3>
            
            <div className="report-form-group">
              <label htmlFor="purchaseLocation">Where did you obtain this drug?</label>
              <input
                type="text"
                id="purchaseLocation"
                name="purchaseLocation"
                value={formData.purchaseLocation}
                onChange={handleChange}
                required
              />
              <small className="report-form-hint">
                Pharmacy name, hospital, online store, etc.
              </small>
            </div>
            
            <div className="report-form-group">
              <label htmlFor="purchaseDate">Approximate Purchase Date</label>
              <input
                type="date"
                id="purchaseDate"
                name="purchaseDate"
                value={formData.purchaseDate}
                onChange={handleChange}
              />
            </div>
            
            <div className="report-form-group">
              <label>Evidence Type</label>
              <div className="report-radio-group">
                <label>
                  <input
                    type="radio"
                    name="evidenceType"
                    value="photo"
                    checked={formData.evidenceType === 'photo'}
                    onChange={handleChange}
                  />
                  Photo Evidence
                </label>
                <label>
                  <input
                    type="radio"
                    name="evidenceType"
                    value="physical"
                    checked={formData.evidenceType === 'physical'}
                    onChange={handleChange}
                  />
                  Physical Sample
                </label>
                <label>
                  <input
                    type="radio"
                    name="evidenceType"
                    value="none"
                    checked={formData.evidenceType === 'none'}
                    onChange={handleChange}
                  />
                  No Evidence
                </label>
              </div>
            </div>
            
            <div className="report-form-group">
              <label htmlFor="additionalDetails">
                Additional Details <span className="report-required">*</span>
              </label>
              <textarea
                id="additionalDetails"
                name="additionalDetails"
                value={formData.additionalDetails}
                onChange={handleChange}
                required
                placeholder="Describe why you believe this drug is counterfeit (appearance, effects, packaging issues, etc.)"
                rows="5"
              />
            </div>
            
            {submissionStatus.error && (
              <div className="report-form-error">
                <FaExclamationTriangle /> {submissionStatus.error}
              </div>
            )}
            
            <div className="report-form-submit">
              <button
                type="submit"
                disabled={submissionStatus.submitting}
                className="report-submit-btn"
              >
                {submissionStatus.submitting ? 'Submitting...' : 'Submit Report'}
              </button>
              <p className="report-form-disclaimer">
                By submitting this report, you acknowledge that this information 
                may be shared with regulatory authorities and the drug manufacturer 
                for investigation purposes.
              </p>
            </div>
          </form>
        )}
      </div>
    </div>
    </div>
  );
};

export default ReportCounterfeit;