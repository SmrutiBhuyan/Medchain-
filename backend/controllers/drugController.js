import Drug from '../models/Drug.js';
import { generateBarcode } from '../utils/barcodeGenerator.js';

// Helper function to validate barcode format
const isValidBarcode = (barcode) => {
  return /^[A-Za-z0-9-]+$/.test(barcode);
};

// Enhanced createDrug controller
export const createDrug = async (req, res) => {
  try {
    const { 
      name, 
      batch, 
      quantity, 
      mfgDate, 
      expiryDate, 
      batchBarcode, 
      manufacturerId, 
      unitBarcodes 
    } = req.body;

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

    // Generate batch barcode if not provided
    const finalBatchBarcode = batchBarcode && isValidBarcode(batchBarcode) 
      ? batchBarcode 
      : generateBarcode(name, batch);

    // Check if barcode is already in use (only if provided)
    if (batchBarcode) {
      const barcodeInUse = await Drug.findOne({ batchBarcode: finalBatchBarcode });
      if (barcodeInUse) {
        return res.status(400).json({ 
          error: 'Barcode already in use by another drug',
          conflictingDrug: barcodeInUse 
        });
      }
    }

    // Process unit barcodes
    const processedUnitBarcodes = [];
    const quantityInt = parseInt(quantity);
    
    if (unitBarcodes && Array.isArray(unitBarcodes) && unitBarcodes.length > 0) {
      // Validate provided unit barcodes
      if (unitBarcodes.length !== quantityInt) {
        return res.status(400).json({ error: 'Number of unit barcodes must match quantity' });
      }

      for (const barcode of unitBarcodes) {
        if (barcode && !isValidBarcode(barcode)) {
          return res.status(400).json({ error: `Invalid unit barcode format: ${barcode}` });
        }

        processedUnitBarcodes.push({
          barcode: barcode || generateBarcode(name, batch, Math.random().toString(36).substring(2, 8)),
          status: 'in-stock',
          currentHolder: 'manufacturer'
        });
      }
    } else {
      // Auto-generate unit barcodes
      for (let i = 1; i <= quantityInt; i++) {
        processedUnitBarcodes.push({
          barcode: generateBarcode(name, batch, i),
          status: 'in-stock',
          manufacturer: manufacturerId,
          currentHolder: 'manufacturer'
        });
      }
    }

    // Create new drug
    const drug = new Drug({
      name,
      batch,
      quantity: quantityInt,
      mfgDate: manufacturingDate,
      expiryDate: expirationDate,
      batchBarcode: finalBatchBarcode,
      unitBarcodes: processedUnitBarcodes,
      manufacturer: manufacturerId,
      status: 'in-stock',
      currentHolder: 'manufacturer'
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

// In your drugController.js
export const verifyDrugsForShipment = async (req, res) => {
  try {
    const { drugIds } = req.body;
    const manufacturerId = req.user._id;

    const invalidDrugs = await Drug.find({
      _id: { $in: drugIds },
      $or: [
        { manufacturer: { $ne: manufacturerId } },
        { status: { $ne: 'in-stock' } },
        { currentHolder: { $ne: 'manufacturer' } }
      ]
    });

    if (invalidDrugs.length > 0) {
      return res.json({
        allValid: false,
        message: `${invalidDrugs.length} drugs cannot be shipped`,
        invalidDrugs: invalidDrugs.map(d => d._id)
      });
    }

    res.json({ allValid: true });
  } catch (error) {
    console.error('Verification error:', error);
    res.status(500).json({ error: 'Verification failed' });
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

// Get distributor's inventory
export const getDistributorInventory = async (req, res) => {
  try {
    console.log("Fetching Inventory...");
    
    const { status } = req.query;
    const distributorId = req.user._id;

    // Build the base query
    const query = { 
      'unitBarcodes.currentHolder': 'distributor',
      'unitBarcodes.distributor': distributorId
    };

    // Add status filter if provided
    if (status) {
      query.status = status;
    }

    // Find drugs with matching unit barcodes
    const drugs = await Drug.find(query)
      .populate('manufacturer', 'name organization')
      .populate('distributor', 'name organization')
      .select('name batch quantity mfgDate expiryDate batchBarcode unitBarcodes manufacturer distributor status currentHolder')
      .sort({ createdAt: -1 });

    // Filter the unitBarcodes to only include those belonging to this distributor
    const filteredDrugs = drugs.map(drug => {
      const filteredUnits = drug.unitBarcodes.filter(unit => 
        unit.currentHolder === 'distributor' && 
        unit.distributor && 
        unit.distributor.toString() === distributorId.toString()
      );
      
      return {
        ...drug.toObject(),
        unitBarcodes: filteredUnits,
        quantity: filteredUnits.length // Update quantity to reflect actual units
      };
    }).filter(drug => drug.unitBarcodes.length > 0); // Only include drugs with matching units

    res.json({
      success: true,
      count: filteredDrugs.length,
      drugs: filteredDrugs
    });
  } catch (error) {
    console.error('Error fetching distributor drugs:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error',
      error: error.message 
    });
  }
};