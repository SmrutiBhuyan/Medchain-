import Drug from '../models/Drug.js';
import { generateBarcode } from '../utils/barcodeGenerator.js';

// Helper function to validate barcode format
const isValidBarcode = (barcode) => {
  return /^[A-Za-z0-9-]+$/.test(barcode);
};

// Enhanced createDrug controller
export const createDrug = async (req, res) => {
  try {
    const { name, batch, quantity, mfgDate, expiryDate, barcode, manufacturerId, unitBarcodes } = req.body;

    // Validate required fields
    if (!name || !batch || !quantity || !mfgDate || !expiryDate || !manufacturerId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate quantity is a positive number
    if (isNaN(quantity) || parseInt(quantity) <= 0) {
      return res.status(400).json({ error: 'Quantity must be a positive number' });
    }

    // Validate dates
    const manufacturingDate = new Date(mfgDate);
    const expirationDate = new Date(expiryDate);
    
    if (manufacturingDate >= expirationDate) {
      return res.status(400).json({ error: 'Expiry date must be after manufacturing date' });
    }

    // Check if drug with same name and batch already exists
    const existingDrug = await Drug.findOne({ name, batch });
    if (existingDrug) {
      return res.status(400).json({ 
        error: 'Drug with this name and batch already exists',
        existingDrug 
      });
    }

    // Validate barcode if provided
    if (barcode && !isValidBarcode(barcode)) {
      return res.status(400).json({ error: 'Invalid barcode format. Only letters, numbers and hyphens are allowed.' });
    }

    // Check if barcode is already in use
    if (barcode) {
      const barcodeInUse = await Drug.findOne({ batchBarcode: barcode });
      if (barcodeInUse) {
        return res.status(400).json({ 
          error: 'Barcode already in use by another drug',
          conflictingDrug: barcodeInUse 
        });
      }
    }

    // Generate batch barcode if not provided
    const finalBatchBarcode = barcode || generateBarcode(name, batch);

    // Generate unit barcodes if not provided
    let finalUnitBarcodes = [];
    if (unitBarcodes && Array.isArray(unitBarcodes)) {
      if (unitBarcodes.length !== parseInt(quantity)) {
        return res.status(400).json({ error: 'Number of unit barcodes must match quantity' });
      }
      
      // Validate all unit barcodes
      for (const ub of unitBarcodes) {
        if (!isValidBarcode(ub)) {
          return res.status(400).json({ error: `Invalid unit barcode format: ${ub}` });
        }
      }
      
      finalUnitBarcodes = unitBarcodes;
    } else {
      // Auto-generate unit barcodes
      for (let i = 1; i <= quantity; i++) {
        finalUnitBarcodes.push(generateBarcode(name, batch, i));
      }
    }

    // Create new drug
    const drug = new Drug({
      name,
      batch,
      quantity: parseInt(quantity),
      mfgDate: manufacturingDate,
      expiryDate: expirationDate,
      batchBarcode: finalBatchBarcode,
      unitBarcodes: finalUnitBarcodes,
      manufacturer: manufacturerId,
      status: 'in-stock'
    });

    await drug.save();

    res.json({
      success: true,
      drug: drug,
      message: 'Drug created successfully'
    });

  } catch (err) {
    console.error('Drug creation error:', err);
    res.status(500).json({ 
      error: 'Failed to create drug',
      details: err.message 
    });
  }
};

// New controller for barcode lookup
export const getDrugByBarcode = async (req, res) => {
  try {
    const { barcode } = req.params;

    if (!barcode) {
      return res.status(400).json({ error: 'Barcode is required' });
    }

    const drug = await Drug.findOne({ barcode })
      .populate('manufacturer', 'name organization')
      .populate('currentHolder', 'name organization');

    if (!drug) {
      return res.status(404).json({ error: 'Drug not found with this barcode' });
    }

    res.json({
      success: true,
      drug
    });

  } catch (err) {
    console.error('Barcode lookup error:', err);
    res.status(500).json({ 
      error: 'Failed to lookup drug by barcode',
      details: err.message 
    });
  }
};

// Existing getDrugsByManufacturer remains the same
export const getDrugsByManufacturer = async (req, res) => {
  try {
    const { manufacturerId } = req.params;
    
    if (!manufacturerId) {
      return res.status(400).json({ error: 'Manufacturer ID is required' });
    }

    const drugs = await Drug.find({ manufacturer: manufacturerId })
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      drugs
    });
  } catch (err) {
    console.error('Error fetching manufacturer drugs:', err);
    res.status(500).json({ error: 'Failed to fetch drugs' });
  }
};


// Get drugs for distributor
export const getDistributorDrugs = async (req, res) => {
  try {
    const drugs = await Drug.find({ currentHolder: req.user._id });
    res.json(drugs);
  } catch (error) {
    console.error('Error fetching drugs:', error);
    res.status(500).json({ message: 'Server error' });
  }
};