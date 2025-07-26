import Shipment from '../models/Shipment.js';
import Drug from '../models/Drug.js';
import User from '../models/User.js';


// Update createShipment to handle unit status changes
export const createShipment = async (req, res) => {
  try {
    // Validate request body
       if (!req.body || !req.body.drugs || !req.body.distributorId) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        details: {
          missing: [
            ...(!req.body.drugs ? ['drugs'] : []),
            ...(!req.body.distributorId ? ['distributorId'] : [])
          ]
        }
      });
    }

    const { drugs, distributorId, estimatedDelivery, notes } = req.body;
    const manufacturerId = req.user._id;

    // Validate drugs exist and belong to manufacturer
    const drugCount = await Drug.countDocuments({
      _id: { $in: drugs },
      manufacturer: manufacturerId,
      status: 'in-stock',
      currentHolder: 'manufacturer'
    });
    
    if (drugCount !== drugs.length) {
      return res.status(400).json({ error: 'Some drugs are invalid or not available' });
    }

    // Get drug details for unit barcodes
    const drugDetails = await Drug.find({ _id: { $in: drugs } });

    // Generate tracking number
    const trackingNumber = `SH-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // Create shipment
    const shipment = new Shipment({
      trackingNumber,
      drugs,
      shippedUnits: drugDetails.flatMap(drug => 
        drug.unitBarcodes.map(unit => ({
          barcode: unit.barcode,
          drugId: drug._id
        }))
      ),
      participants: [
        {
          type: 'manufacturer',
          participantId: manufacturerId,
          status: 'completed',
          actualDeparture: new Date()
        },
        {
          type: 'distributor',
          participantId: distributorId,
          status: 'pending'
        }
      ],
      currentLocation: 'in-transit',
      status: 'processing',
      estimatedDelivery: estimatedDelivery ? new Date(estimatedDelivery) : undefined,
      notes,
      createdBy: manufacturerId,
      distributor: distributorId 
    });

    await shipment.save();

    // Update drug statuses
    await Drug.updateMany(
      { _id: { $in: drugs } },
      { 
        $set: { 
          status: 'in-transit',
          currentHolder: 'in-transit',
          distributor: distributorId,
          'unitBarcodes.$[].status': 'in-transit',
          'unitBarcodes.$[].currentHolder': 'in-transit'
        } 
      }
    );

    res.json({
      success: true,
      shipment
    });

  } catch (err) {
    console.error('Shipment creation error:', err);
    res.status(500).json({ 
      error: 'Failed to create shipment',
      details: err.message 
    });
  }
};



//DISTRIBUTOR


// Get shipments for distributor
export const getDistributorShipments = async (req, res) => {
  try {
    const shipments = await Shipment.find({ distributor: req.user._id })
      .populate('manufacturer', 'name email')
      .populate('drugs', 'name batch status barcode expiryDate');
    console.log(shipments);
    
    res.json(shipments);
  } catch (error) {
    console.error('Error fetching shipments:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Accept shipment
export const acceptShipment = async (req, res) => {
  try {
    console.log("Accept drugs endpoint hit...");
    
    const shipment = await Shipment.findOne({
      _id: req.params.id,
      distributor: req.user._id,
      status: { $in: ['processing', 'in-transit'] }
    });

    if (!shipment) {
      return res.status(404).json({ message: 'Shipment not found or cannot be accepted' });
    }

    // Update shipment status first
    shipment.status = 'delivered';
    shipment.actualDelivery = new Date();
    await shipment.save();
    console.log("shipment saved...");

    // Update drug statuses and current holder
    await Drug.updateMany(
      { _id: { $in: shipment.drugs } },
      { 
        $set: { 
          status: 'in-stock with distributor',
          currentHolder: 'distributor',
          distributor: req.user._id
        } 
      }
    );
    
    res.json({ message: 'Shipment accepted successfully', shipment });
  } catch (error) {
    console.error('Error accepting shipment:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Reject shipment
export const rejectShipment = async (req, res) => {
  try {
    const shipment = await Shipment.findOne({
      _id: req.params.id,
      distributor: req.user._id,
      status: { $in: ['processing', 'in-transit'] }
    });

    if (!shipment) {
      return res.status(404).json({ message: 'Shipment not found or cannot be rejected' });
    }

    shipment.status = 'cancelled';
    await shipment.save();

    res.json({ message: 'Shipment rejected successfully', shipment });
  } catch (error) {
    console.error('Error rejecting shipment:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Add new functions for wholesaler, retailer, and pharmacy
export const createShipmentToWholesaler = async (req, res) => {
  try {
    console.log("Creating Shipment to wholesaler");
    
    const { drugIds, wholesalerId } = req.body;
    const distributorId = req.user._id;

    
    if (!drugIds || !wholesalerId) {
      return res.status(400).json({ error: 'Missing required fields: drugIds or wholesalerId' });
    }

    
    if (!Array.isArray(drugIds) || drugIds.length === 0) {
      return res.status(400).json({ error: 'drugIds must be a non-empty array' });
    }

     // Validate drugs belong to distributor
    const invalidDrugs = await Drug.find({
      _id: { $in: drugIds },
      $or: [
        { distributor: { $ne: distributorId } },
        { status: { $ne: 'in-stock with distributor' } }
      ]
    });
    
      if (invalidDrugs.length > 0) {
      return res.status(400).json({ 
        error: 'Some drugs are invalid or not available',
        invalidDrugs: invalidDrugs.map(d => d._id)
      });
    }

    // Create shipment
    const shipment = new Shipment({
      drugs: drugIds,
      distributor: distributorId,
      wholesaler: wholesalerId,
      createdBy: req.user._id,
      status: 'processing',
    });

    await shipment.save();

    // Update drug statuses
    await Drug.updateMany(
      { _id: { $in: drugIds } },
      { 
        $set: { 
          status: 'shipped to wholesaler',
          wholesaler: wholesalerId,
          currentHolder: 'wholesaler'
        } 
      }
    );

    res.json({ success: true, shipment });
  } catch (error) {
    console.error('Shipment creation error:', error);
    res.status(500).json({ error: 'Failed to create shipment' });
  }
};

export const createShipmentToRetailer = async (req, res) => {
  try {
    const { drugIds, retailerId } = req.body;
    const distributorId = req.user._id;

    // Validate drugs belong to distributor and get their details
    const drugs = await Drug.find({
      _id: { $in: drugIds },
      distributor: distributorId,
      status: 'in-stock with distributor'
    });

    if (drugs.length !== drugIds.length) {
      return res.status(400).json({ 
        error: 'Some drugs are invalid or not available',
        invalidDrugs: drugIds.filter(id => 
          !drugs.some(d => d._id.toString() === id.toString())
      )});
    }

    // Create shipment with unit barcodes
    const shipment = new Shipment({
      drugs: drugIds,
      shippedUnits: drugs.flatMap(drug => 
        drug.unitBarcodes.map(barcode => ({
          barcode,
          drugId: drug._id
        })
      )),
      distributor: distributorId,
      retailer: retailerId,
      createdBy: req.user._id,
      status: 'processing',
    });

    await shipment.save();

    // Update drug statuses - only mark shipped units as shipped
    for (const drug of drugs) {
      await Drug.updateOne(
        { _id: drug._id, 'unitBarcodes.barcode': { $in: drug.unitBarcodes } },
        { 
          $set: { 
            'unitBarcodes.$[].status': 'shipped',
            'unitBarcodes.$[].currentHolder': 'retailer',
            status: 'shipped to retailer',
            retailer: retailerId
          } 
        }
      );
    }

    res.json({ success: true, shipment });
  } catch (error) {
    console.error('Shipment creation error:', error);
    res.status(500).json({ error: 'Failed to create shipment' });
  }
};

export const createShipmentToPharmacy = async (req, res) => {
  try {
    const { drugIds, pharmacyId } = req.body;
    const distributorId = req.user._id;

    // Validate drugs belong to distributor
    const drugCount = await Drug.countDocuments({
      _id: { $in: drugIds },
      distributor: distributorId,
      status: 'in-stock with distributor'
    });
    
    if (drugCount !== drugIds.length) {
      return res.status(400).json({ error: 'Some drugs are invalid or not available' });
    }

    // Create shipment
    const shipment = new Shipment({
      drugs: drugIds,
      distributor: distributorId,
      pharmacy: pharmacyId,
      createdBy: req.user._id,
      status: 'processing',
    });

    await shipment.save();

    // Update drug statuses
    await Drug.updateMany(
      { _id: { $in: drugIds } },
      { 
        $set: { 
          status: 'shipped to pharmacy',
          pharmacy: pharmacyId,
          currentHolder: 'pharmacy'
        } 
      }
    );

    res.json({ success: true, shipment });
  } catch (error) {
    console.error('Shipment creation error:', error);
    res.status(500).json({ error: 'Failed to create shipment' });
  }
};