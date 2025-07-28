// DrugShortagePrediction.jsx
import React, { useState, useEffect } from 'react';
import { ExclamationTriangleFill, ClockFill, CheckCircleFill } from 'react-bootstrap-icons';
import axios from 'axios';
import { useAuth } from './AuthContext';
import './DrugPredictionShortage.css'

const DrugShortagePrediction = () => {
  const { user } = useAuth();
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeHorizon, setTimeHorizon] = useState(30); // Default 30-day prediction

  useEffect(() => {
    if (user && user._id) {
      fetchShortagePredictions();
    }
  }, [user, timeHorizon]);

  const fetchShortagePredictions = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:5000/api/predictions/pharmacy/${user._id}`, {
        params: { days: timeHorizon },
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      setPredictions(response.data);
    } catch (error) {
      console.error('Error fetching predictions:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityBadge = (severity) => {
    switch(severity.toLowerCase()) {
      case 'critical': return <span className="pharma-badge pharma-danger">Critical</span>;
      case 'high': return <span className="pharma-badge pharma-warning">High</span>;
      case 'medium': return <span className="pharma-badge pharma-info">Medium</span>;
      case 'low': return <span className="pharma-badge pharma-secondary">Low</span>;
      default: return <span className="pharma-badge pharma-light">Unknown</span>;
    }
  };

  return (
    <div className="pharma-predictions-tab">
      <div className="pharma-card">
        <div className="pharma-card-header">
          <h5>Drug Shortage Predictions</h5>
          <div className="pharma-filter-controls">
            <select 
              className="pharma-select"
              value={timeHorizon}
              onChange={(e) => setTimeHorizon(Number(e.target.value))}
            >
              <option value={7}>Next 7 Days</option>
              <option value={14}>Next 14 Days</option>
              <option value={30}>Next 30 Days</option>
              <option value={60}>Next 60 Days</option>
            </select>
            <button 
              className="pharma-btn-outline"
              onClick={fetchShortagePredictions}
            >
              Refresh Predictions
            </button>
          </div>
        </div>
        
        <div className="pharma-card-body">
          {loading ? (
            <div className="pharma-loading">Loading predictions...</div>
          ) : predictions.length === 0 ? (
            <div className="pharma-no-alerts">
              <CheckCircleFill className="pharma-icon pharma-success" />
              <h5>No Predicted Shortages</h5>
              <p>Your inventory is well-stocked for the selected time period</p>
            </div>
          ) : (
            <div className="pharma-predictions-list">
              {predictions.map((prediction, index) => (
                <div key={index} className="pharma-prediction-item">
                  <div className="pharma-prediction-icon">
                    <ExclamationTriangleFill className={`pharma-icon pharma-${prediction.severity.toLowerCase()}`} />
                  </div>
                  <div className="pharma-prediction-details">
                    <h6>
                      {prediction.drug.name} 
                      {getSeverityBadge(prediction.severity)}
                    </h6>
                    <p>
                      <strong>Current Stock:</strong> {prediction.currentStock} units • 
                      <strong>Daily Usage:</strong> {prediction.avgDailyUsage.toFixed(1)} units/day • 
                      <strong>Days Remaining:</strong> {prediction.daysRemaining.toFixed(1)}
                    </p>
                    <p>
                      <strong>Predicted Shortage Date:</strong> {new Date(prediction.predictedShortageDate).toLocaleDateString()} • 
                      <strong>Confidence:</strong> {(prediction.confidence * 100).toFixed(1)}%
                    </p>
                    {prediction.expiringSoon && (
                      <div className="pharma-alert pharma-warning">
                        <ClockFill className="pharma-icon" /> 
                        {prediction.expiringSoon} units expiring soon
                      </div>
                    )}
                    <div className="pharma-prediction-actions">
                      <button className="pharma-btn-outline">
                        Place Reorder
                      </button>
                      <button className="pharma-btn-outline">
                        View Alternatives
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DrugShortagePrediction;