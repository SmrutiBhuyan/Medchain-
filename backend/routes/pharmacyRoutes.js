import express from 'express';
import Drug from '../models/Drug.js';
import User from '../models/User.js';

const router = express.Router();

// Find nearest pharmacies for a drug
router.post('/nearest-pharmacies', async (req, res) => {
  try {
    const { drugName, userLocation } = req.body;

    // Validate pincode
    if (!/^\d{6}$/.test(userLocation)) {
      return res.status(400).json({ 
        message: 'Please enter a valid 6-digit Indian pincode' 
      });
    }

    // Find all approved pharmacies with matching pincode
    const pharmaciesWithPincode = await User.find({
      role: { $in: ['retailer', 'pharmacy'] },
      status: 'approved',
      pincode: userLocation
    });

    if (pharmaciesWithPincode.length === 0) {
      return res.status(404).json({ 
        message: 'No pharmacies found in this pincode area' 
      });
    }

    // Find drugs that are in stock at these pharmacies
    const drugs = await Drug.find({ 
      name: { $regex: new RegExp(drugName, 'i') },
      'unitBarcodes.pharmacy': { 
        $in: pharmaciesWithPincode.map(p => p._id) 
      },
      'unitBarcodes.status': 'in-stock'
    })
    .populate({
      path: 'unitBarcodes.pharmacy',
      model: 'User',
      match: { 
        status: 'approved',
        pincode: userLocation 
      }
    })
    .populate('manufacturer');

    if (!drugs || drugs.length === 0) {
      return res.status(404).json({ 
        message: 'Drug not found in any pharmacy in this pincode area' 
      });
    }

    // Get unique pharmacies with drug info
    const pharmacyMap = new Map();
    drugs.forEach(drug => {
      drug.unitBarcodes.forEach(unit => {
        if (unit.pharmacy && !pharmacyMap.has(unit.pharmacy._id.toString())) {
          pharmacyMap.set(unit.pharmacy._id.toString(), {
            ...unit.pharmacy._doc,
            drugName: drug.name,
            drugId: drug._id,
            manufacturer: drug.manufacturer
          });
        }
      });
    });

    const pharmaciesWithDrug = Array.from(pharmacyMap.values());

    res.json({
      pharmacies: pharmaciesWithDrug,
      userPincode: userLocation
    });
  } catch (error) {
    console.error('Error finding nearest pharmacies:', error);
    res.status(500).json({ 
      message: error.message || 'Server error'
    });
  }
});

export default router;