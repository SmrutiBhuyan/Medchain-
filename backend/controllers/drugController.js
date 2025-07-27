import Drug from '../models/Drug.js';
import { generateBarcode } from '../utils/barcodeGenerator.js';
import { NotFoundError, ValidationError } from '../errrors/index.js';

// Helper function to validate barcode format
// Helper function to validate barcode format
const isValidBarcode = (barcode) => {
  try {
    if (barcode === undefined || barcode === null) return false;
    const strBarcode = String(barcode); // Convert to string if it isn't already
    return /^[A-Za-z0-9-]+$/.test(strBarcode.trim());
  } catch (e) {
    return false;
  }
};

// Enhanced createDrug controller
export const createDrug = async (req, res) => {
  try {
    console.log('Raw unitBarcodes:', req.body.unitBarcodes);
    if (req.body.unitBarcodes && Array.isArray(req.body.unitBarcodes)) {
      console.log('First barcode type:', typeof req.body.unitBarcodes[0]);
    }
    console.log("Creating drug with data ", req.body);
    
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

    if (batchBarcode) {
      const barcodeInUse = await Drug.findOne({ 
        batchBarcode: { $regex: new RegExp(`^${batchBarcode}$`, 'i') }
      });
      
      if (barcodeInUse) {
        return res.status(400).json({ 
          error: `Barcode '${batchBarcode}' is already in use`,
          conflictingDrug: {
            id: barcodeInUse._id,
            name: barcodeInUse.name,
            batch: barcodeInUse.batch,
            barcode: barcodeInUse.batchBarcode
          }
        });
      }
    }

    // Generate batch barcode if not provided
    const finalBatchBarcode = batchBarcode && isValidBarcode(batchBarcode) 
      ? batchBarcode 
      : generateBarcode(name, batch);

    // Check if barcode is already in use (only if provided)
    if (batchBarcode) {
      const barcodeInUse = await Drug.findOne({ batchBarcode: finalBatchBarcode });
      if (barcodeInUse) {
        console.log('Conflicting drug:', barcodeInUse);
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
        console.log('Validating barcode:', barcode, 'Type:', typeof barcode);
        if (barcode && !isValidBarcode(barcode)) {
          console.log('Invalid barcode details:', {
            barcode,
            stringVersion: String(barcode),
            isValid: /^[A-Za-z0-9-]+$/.test(String(barcode).trim())
          });
          return res.status(400).json({ error: `Invalid unit barcode format: ${barcode}` });
        }

        processedUnitBarcodes.push({
          barcode: barcode || generateBarcode(name, batch, Math.random().toString(36).substring(2, 8)),
          status: 'in-stock',
          currentHolder: 'manufacturer',
          manufacturer: manufacturerId
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

    console.log("Saving drug data...");
    
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
      details: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
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
    const { status } = req.query;
    const distributorId = req.user._id;

    // Build the base query
    const query = { 
      'unitBarcodes.currentHolder': 'distributor',
      'unitBarcodes.distributor': distributorId,
      'unitBarcodes.status': 'in-stock'
    };

    // Add status filter if provided
    if (status) {
      query['unitBarcodes.status'] = status;
    }

    // Find drugs with matching unit barcodes
    const drugs = await Drug.find(query)
      .populate('manufacturer', 'name organization')
      .populate('distributor', 'name organization')
      .select('name batch quantity mfgDate expiryDate batchBarcode unitBarcodes manufacturer distributor status currentHolder')
      .sort({ createdAt: -1 });

    // Transform the data to include both drug and unit information
    const inventoryItems = drugs.flatMap(drug => {
      return drug.unitBarcodes
        .filter(unit => 
          unit.currentHolder === 'distributor' && 
          unit.distributor && 
          unit.distributor.toString() === distributorId.toString() &&
          (status ? unit.status === status : unit.status === 'in-stock')
        )
        .map(unit => ({
          drugId: drug._id,
          name: drug.name,
          batch: drug.batch,
          batchBarcode: drug.batchBarcode,
          unitBarcode: unit.barcode,
          expiryDate: drug.expiryDate,
          manufacturer: drug.manufacturer,
          distributor: drug.distributor,
          status: unit.status,
          currentHolder: unit.currentHolder
        }));
    });


    res.json({
      success: true,
      count: inventoryItems.length,
      items: inventoryItems
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

// Helper function to calculate days until expiry
const getDaysUntilExpiry = (expiryDate) => {
  const today = new Date();
  const expiry = new Date(expiryDate);
  const diffTime = expiry - today;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
};

export const verifyDrug = async (req, res) => {
  try {
    const { barcode } = req.params;

    if (!barcode) {
      throw new ValidationError('Barcode is required');
    }

    // First try to find by unit barcode
    let drug = await Drug.findOne({ 
      'unitBarcodes.barcode': barcode 
    }).populate('manufacturer distributor wholesaler retailer pharmacy');

    // If not found as unit barcode, try batch barcode
    if (!drug) {
      drug = await Drug.findOne({ 
        batchBarcode: barcode 
      }).populate('manufacturer distributor wholesaler retailer pharmacy');
    }

    if (!drug) {
      throw new NotFoundError('Drug not found in system');
    }

    // Find the specific unit if this was a unit barcode
    let unit = null;
    if (drug.unitBarcodes) {
      unit = drug.unitBarcodes.find(u => u.barcode === barcode);
    }

    const responseData = {
      _id: drug._id,
      name: drug.name,
      batch: drug.batch,
      barcode: unit ? unit.barcode : drug.batchBarcode,
      batchBarcode: drug.batchBarcode,
      mfgDate: drug.mfgDate,
      expiryDate: drug.expiryDate,
      daysLeft: getDaysUntilExpiry(drug.expiryDate),
      status: unit ? unit.status : drug.status,
      manufacturer: drug.manufacturer,
      distributor: drug.distributor,
      wholesaler: drug.wholesaler,
      retailer: drug.retailer,
      pharmacy: drug.pharmacy,
      currentHolder: unit ? unit.currentHolder : drug.currentHolder,
      isUnit: !!unit
    };

    res.json({
      success: true,
      drug: responseData
    });

  } catch (error) {
    console.error('Drug verification error:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message || 'Drug verification failed'
    });
  }
};
