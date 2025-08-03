import express from 'express';
const router = express.Router();
import Drug from '../models/Drug.js';
import User from '../models/User.js';
import SalesRecord from '../models/SalesRecord.js';

// Get shortage predictions for a pharmacy
router.get('/pharmacy/:pharmacyId', async (req, res) => {
  try {
    const { pharmacyId } = req.params;
    const { days = 30 } = req.query;

    // 1. Get all drugs where currentHolder is this pharmacy
    const drugs = await Drug.find({
      'unitBarcodes.pharmacy': pharmacyId,
      'unitBarcodes.currentHolder': 'pharmacy'
    }).populate('manufacturer', 'name');

    if (!drugs || drugs.length === 0) {
      return res.status(404).json({ message: 'No drugs found for this pharmacy' });
    }

    // 2. Calculate predictions for each drug
    const predictions = await Promise.all(drugs.map(async (drug) => {
      // Find units belonging to this pharmacy
      const pharmacyUnits = drug.unitBarcodes.filter(
        unit => unit.pharmacy?.toString() === pharmacyId && unit.currentHolder === 'pharmacy'
      );
      
      const currentStock = pharmacyUnits.length;
      
      // Calculate average daily usage - handle no sales records case
      let avgDailyUsage;
      let dataQuality = 'good';
      
      try {
        const salesCount = await SalesRecord.countDocuments({
          drug: drug._id,
          pharmacy: pharmacyId
        });
        
        if (salesCount === 0) {
          // No sales records - use conservative default
          avgDailyUsage = 1; // Default to 1 unit/day
          dataQuality = 'low';
        } else {
          // Calculate actual moving average (your existing logic)
          const salesRecords = await SalesRecord.find({
            drug: drug._id,
            pharmacy: pharmacyId,
            saleDate: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
          }).sort({ saleDate: -1 });
          
          const totalUnits = salesRecords.reduce((sum, record) => sum + record.quantity, 0);
          const uniqueDays = new Set(salesRecords.map(r => r.saleDate.toISOString().split('T')[0])).size;
          avgDailyUsage = totalUnits / Math.max(uniqueDays, 1);
        }
      } catch (error) {
        console.error('Error calculating usage:', error);
        avgDailyUsage = 1; // Fallback to default
        dataQuality = 'low';
      }
      
      // Calculate days remaining
      const daysRemaining = currentStock / avgDailyUsage;
      
      // Determine if shortage is predicted
      const predictedShortage = daysRemaining < days;
      const predictedShortageDate = new Date();
      predictedShortageDate.setDate(predictedShortageDate.getDate() + daysRemaining);
      
      // Calculate confidence score (lower confidence if no sales data)
      const confidence = dataQuality === 'low' 
        ? Math.min(0.7, 1 - (daysRemaining / days)) 
        : Math.min(0.95, 1 - (daysRemaining / days));
      
      // Determine severity
      let severity = 'Low';
      if (daysRemaining < 7) severity = 'Critical';
      else if (daysRemaining < 14) severity = 'High';
      else if (daysRemaining < 21) severity = 'Medium';
      
      // Check for expiring soon units
      const now = new Date();
      const expiringSoon = pharmacyUnits.filter(unit => {
        const expiryDate = new Date(unit.expiryDate);
        return (expiryDate - now) < (30 * 24 * 60 * 60 * 1000); // Within 30 days
      }).length;
      
      return {
        drug: {
          _id: drug._id,
          name: drug.name,
          batch: drug.batch,
          manufacturer: drug.manufacturer?.name || 'Unknown'
        },
        currentStock,
        avgDailyUsage,
        daysRemaining,
        predictedShortage,
        predictedShortageDate,
        confidence,
        severity,
        expiringSoon: expiringSoon > 0 ? expiringSoon : null,
        dataQuality,
        warning: dataQuality === 'low' ? 'Insufficient sales data - using conservative estimates' : null
      };
    }));

    // Return all predictions (not just shortages) since stock is low
    res.json(predictions);
  } catch (error) {
    console.error('Error getting predictions:', error);
    res.status(500).json({ message: 'Error generating predictions' });
  }
});

// Get shortage predictions for a retailer
router.get('/retailer/:retailerId', async (req, res) => {
  try {
    const { retailerId } = req.params;
    const { days = 30 } = req.query;

    // 1. Get all drugs where currentHolder is this retailer
    const drugs = await Drug.find({
      'unitBarcodes.retailer': retailerId,
      'unitBarcodes.currentHolder': 'retailer'
    }).populate('manufacturer', 'name');

    if (!drugs || drugs.length === 0) {
      return res.status(404).json({ message: 'No drugs found for this retailer' });
    }

    // 2. Calculate predictions for each drug
    const predictions = await Promise.all(drugs.map(async (drug) => {
      // Find units belonging to this retailer
      const retailerUnits = drug.unitBarcodes.filter(
        unit => unit.retailer?.toString() === retailerId && unit.currentHolder === 'retailer'
      );
      
      const currentStock = retailerUnits.length;
      
      // Calculate average daily usage - handle no sales records case
      let avgDailyUsage;
      let dataQuality = 'good';
      
      try {
        const salesCount = await SalesRecord.countDocuments({
          drug: drug._id,
          retailer: retailerId
        });
        
        if (salesCount === 0) {
          // No sales records - use conservative default
          avgDailyUsage = 1; // Default to 1 unit/day
          dataQuality = 'low';
        } else {
          // Calculate actual moving average
          const salesRecords = await SalesRecord.find({
            drug: drug._id,
            retailer: retailerId,
            saleDate: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
          }).sort({ saleDate: -1 });
          
          const totalUnits = salesRecords.reduce((sum, record) => sum + record.quantity, 0);
          const uniqueDays = new Set(salesRecords.map(r => r.saleDate.toISOString().split('T')[0])).size;
          avgDailyUsage = totalUnits / Math.max(uniqueDays, 1);
        }
      } catch (error) {
        console.error('Error calculating usage:', error);
        avgDailyUsage = 1; // Fallback to default
        dataQuality = 'low';
      }
      
      // Calculate days remaining
      const daysRemaining = currentStock / avgDailyUsage;
      
      // Determine if shortage is predicted
      const predictedShortage = daysRemaining < days;
      const predictedShortageDate = new Date();
      predictedShortageDate.setDate(predictedShortageDate.getDate() + daysRemaining);
      
      // Calculate confidence score (lower confidence if no sales data)
      const confidence = dataQuality === 'low' 
        ? Math.min(0.7, 1 - (daysRemaining / days)) 
        : Math.min(0.95, 1 - (daysRemaining / days));
      
      // Determine severity
      let severity = 'Low';
      if (daysRemaining < 7) severity = 'Critical';
      else if (daysRemaining < 14) severity = 'High';
      else if (daysRemaining < 21) severity = 'Medium';
      
      // Check for expiring soon units
      const now = new Date();
      const expiringSoon = retailerUnits.filter(unit => {
        const expiryDate = new Date(unit.expiryDate);
        return (expiryDate - now) < (30 * 24 * 60 * 60 * 1000); // Within 30 days
      }).length;
      
      return {
        drug: {
          _id: drug._id,
          name: drug.name,
          batch: drug.batch,
          manufacturer: drug.manufacturer?.name || 'Unknown'
        },
        currentStock,
        avgDailyUsage,
        daysRemaining,
        predictedShortage,
        predictedShortageDate,
        confidence,
        severity,
        expiringSoon: expiringSoon > 0 ? expiringSoon : null,
        dataQuality,
        warning: dataQuality === 'low' ? 'Insufficient sales data - using conservative estimates' : null
      };
    }));

    // Return all predictions (not just shortages) since stock is low
    res.json(predictions);
  } catch (error) {
    console.error('Error getting retailer predictions:', error);
    res.status(500).json({ message: 'Error generating retailer predictions' });
  }
});


export default router;