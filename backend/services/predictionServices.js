// predictionService.js
import Drug from '../models/Drug.js';
import Shipment from '../models/Shipment.js';
import User from '../models/User.js';
import axios from 'axios';

// Simple moving average calculation
export const calculateMovingAverage = (data, windowSize) => {
  return data.map((_, index) => {
    const start = Math.max(0, index - windowSize + 1);
    const end = index + 1;
    const window = data.slice(start, end);
    return window.reduce((sum, val) => sum + val, 0) / window.length;
  });
};

// Predict shortages for a pharmacy
// In predictionService.js, update the prediction logic:

export const predictShortages = async (pharmacyId, days = 30, inventoryData) => {
  try {
    const inventory = inventoryData || await Drug.find({ pharmacy: pharmacyId })
      .populate('manufacturer', 'name');

    const predictions = [];
    const now = new Date();

    for (const drug of inventory) {
      // Skip recalled or expired drugs
      if (drug.status === 'recalled' || new Date(drug.expiryDate) < now) {
        continue;
      }

      // Define thresholds based on drug importance
      const isEssential = ['paracetamol', 'insulin', 'antibiotics'].includes(drug.name.toLowerCase());
      const criticalThreshold = isEssential ? 5 : 3;
      const warningThreshold = isEssential ? 10 : 7;

      // Calculate average daily usage (simplified - improve with real data)
      let avgDailyUsage = 1; // Default minimum
      if (drug.history?.length > 0) {
        avgDailyUsage = calculateUsageFromHistory(drug.history);
      }

      // Calculate days remaining
      const daysRemaining = drug.quantity / avgDailyUsage;

      // Determine if we should show a warning
      if (drug.quantity <= warningThreshold) {
        const severity = drug.quantity <= criticalThreshold ? 'critical' : 'high';
        
        predictions.push({
          drug: {
            _id: drug._id,
            name: drug.name,
            batch: drug.batch,
            barcode: drug.barcode
          },
          currentStock: drug.quantity,
          avgDailyUsage,
          daysRemaining,
          predictedShortageDate: new Date(now.getTime() + daysRemaining * 24 * 60 * 60 * 1000),
          severity,
          confidence: 0.8,
          immediateActionRequired: severity === 'critical',
          stockStatus: severity === 'critical' ? 'CRITICALLY LOW' : 'Low Stock'
        });
      }
    }

    // Sort by severity (critical first)
    predictions.sort((a, b) => {
      const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    });

    return predictions;
  } catch (error) {
    console.error('Error in predictShortages:', error);
    throw error;
  }
};

// Helper function to calculate usage from history
function calculateUsageFromHistory(history) {
  // Implement proper calculation based on your history data structure
  return 1; // Default for now
}

// Optional: Integration with disease outbreak data
const getDiseaseOutbreakData = async (region) => {
  try {
    // In a real implementation, this would call a disease surveillance API
    // For demo purposes, we'll return mock data
    return {
      flu: Math.random() * 10,
      covid: Math.random() * 5,
      dengue: Math.random() * 3
    };
  } catch (error) {
    console.error('Error fetching disease data:', error);
    return {};
  }
};

