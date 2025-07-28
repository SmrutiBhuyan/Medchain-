// utils/predictionUtils.js
import SalesRecord from '../models/SalesRecord.js';

// Calculate moving average of daily sales for a drug
export async function calculateMovingAverage(drug, pharmacyId, windowSize = 30) {
  try {
    // Get sales records for this drug at this pharmacy
    const salesRecords = await SalesRecord.find({
      drug: drug._id,
      pharmacy: pharmacyId,
      saleDate: { $gte: new Date(Date.now() - windowSize * 24 * 60 * 60 * 1000) }
    }).sort({ saleDate: -1 });
    
    if (salesRecords.length === 0) {
      // Default to 1 unit/day if no sales history
      return 1;
    }
    
    // Calculate total units sold and number of days with sales
    const totalUnits = salesRecords.reduce((sum, record) => sum + record.quantity, 0);
    const uniqueDays = new Set(salesRecords.map(r => r.saleDate.toISOString().split('T')[0])).size;
    
    // Return average daily usage
    return totalUnits / Math.max(uniqueDays, 1);
  } catch (error) {
    console.error('Error calculating moving average:', error);
    return 1; // Fallback value
  }
}

// Seasonal adjustment factors (could be stored in DB)
export function getSeasonalFactor(drugCategory, month) {
  const seasonalFactors = {
    'Antihistamines': [1.2, 1.3, 1.5, 1.4, 1.2, 1.0, 0.8, 0.7, 0.8, 1.0, 1.1, 1.2], // Higher in spring
    'Cold/Flu': [1.4, 1.5, 1.3, 1.0, 0.7, 0.6, 0.5, 0.5, 0.7, 1.0, 1.3, 1.4], // Higher in winter
    'default': [1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0]
  };
  
  const factors = seasonalFactors[drugCategory] || seasonalFactors.default;
  return factors[month];
}

