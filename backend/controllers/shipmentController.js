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
    console.log("Fetching distributor shipments...");
    
    const shipments = await Shipment.find({ 
      'participants.participantId': req.user._id,
      'participants.type': 'distributor'
    })
    .populate({
      path: 'participants.participantId',
      select: 'name email',
      model: 'User'
    })
    .populate({
      path: 'drugs',
      select: 'name batch status batchBarcode expiryDate manufacturer',
      populate: {
        path: 'manufacturer',
        select: 'name'
      }
    })
    .sort({ createdAt: -1 });

    // Transform the data to make it easier to work with in the frontend
    const transformedShipments = shipments.map(shipment => {
      const manufacturerParticipant = shipment.participants.find(p => p.type === 'manufacturer');
      const distributorParticipant = shipment.participants.find(p => p.type === 'distributor');
      
      return {
        ...shipment.toObject(),
        manufacturer: manufacturerParticipant?.participantId,
        distributor: distributorParticipant?.participantId
      };
    });

    res.json(transformedShipments);
  } catch (error) {
    console.error('Error fetching shipments:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Accept shipment
export const acceptShipment = async (req, res) => {
  try {
    const shipment = await Shipment.findOne({
      _id: req.params.id,
      'participants.participantId': req.user._id,
      'participants.type': 'distributor',
      status: { $in: ['processing', 'in-transit'] }
    });

    if (!shipment) {
      return res.status(404).json({ message: 'Shipment not found or cannot be accepted' });
    }

    // Update shipment status and participant status
    shipment.status = 'delivered';
    shipment.actualDelivery = new Date();
    shipment.currentLocation = 'distributor';
    
    // Update distributor participant status
    const distributorParticipant = shipment.participants.find(
      p => p.type === 'distributor'
    );
    if (distributorParticipant) {
      distributorParticipant.status = 'completed';
      distributorParticipant.actualArrival = new Date();
    }

    await shipment.save();

    // Update drug statuses and current holder
    await Drug.updateMany(
      { _id: { $in: shipment.drugs } },
      { 
        $set: { 
          status: 'in-stock with distributor',
          currentHolder: 'distributor',
          distributor: req.user._id
        },
        $push: {
          'unitBarcodes.$[].history': {
            holderType: 'distributor',
            holderId: req.user._id,
            status: 'in-stock',
            date: new Date()
          }
        }
      }
    );

    // Update each unit barcode in the drugs
    for (const drugId of shipment.drugs) {
      const drug = await Drug.findById(drugId);
      if (drug) {
        const updatedUnitBarcodes = drug.unitBarcodes.map(unit => ({
          ...unit.toObject(),
          status: 'in-stock',
          currentHolder: 'distributor',
          distributor: req.user._id,
          history: [
            ...(unit.history || []),
            {
              holderType: 'distributor',
              holderId: req.user._id,
              status: 'in-stock',
              date: new Date()
            }
          ]
        }));

        await Drug.updateOne(
          { _id: drugId },
          { $set: { unitBarcodes: updatedUnitBarcodes } }
        );
      }
    }
    
    res.json({ 
      message: 'Shipment accepted successfully', 
      shipment 
    });
  } catch (error) {
    console.error('Error accepting shipment:', error);
    res.status(500).json({ 
      message: 'Server error',
      details: error.message 
    });
  }
};

// Reject shipment
export const rejectShipment = async (req, res) => {
  try {
    const shipment = await Shipment.findOne({
      _id: req.params.id,
      'participants.participantId': req.user._id,
      'participants.type': 'distributor',
      status: { $in: ['processing', 'in-transit'] }
    });

    if (!shipment) {
      return res.status(404).json({ message: 'Shipment not found or cannot be rejected' });
    }

    shipment.status = 'cancelled';
    
    // Update distributor participant status
    const distributorParticipant = shipment.participants.find(
      p => p.type === 'distributor'
    );
    if (distributorParticipant) {
      distributorParticipant.status = 'cancelled';
    }

    await shipment.save();

    // Update drug statuses back to manufacturer
    await Drug.updateMany(
      { _id: { $in: shipment.drugs } },
      { 
        $set: { 
          status: 'in-stock',
          currentHolder: 'manufacturer',
          distributor: null,
          'unitBarcodes.$[].status': 'in-stock',
          'unitBarcodes.$[].currentHolder': 'manufacturer'
        } 
      }
    );

    res.json({ message: 'Shipment rejected successfully', shipment });
  } catch (error) {
    console.error('Error rejecting shipment:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Add new functions for wholesaler, retailer, and pharmacy
// Update createShipmentToWholesaler
export const createShipmentToWholesaler = async (req, res) => {
  try {
    const { drugIds, wholesalerId } = req.body;
    const distributorId = req.user._id;

    if (!drugIds || !wholesalerId) {
      return res.status(400).json({ error: 'Missing required fields: drugIds or wholesalerId' });
    }

    if (!Array.isArray(drugIds) || drugIds.length === 0) {
      return res.status(400).json({ error: 'drugIds must be a non-empty array' });
    }

    // Validate drugs belong to distributor and are in stock
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

    // Get drug details for unit barcodes
    const drugDetails = await Drug.find({ _id: { $in: drugIds } });

    // Generate tracking number
    const trackingNumber = `SH-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // Create shipment
    const shipment = new Shipment({
      trackingNumber,
      drugs: drugIds,
      shippedUnits: drugDetails.flatMap(drug => 
        drug.unitBarcodes.map(unit => ({
          barcode: unit.barcode,
          drugId: drug._id
        }))
      ),
      participants: [
        {
          type: 'distributor',
          participantId: distributorId,
          status: 'completed',
          actualDeparture: new Date()
        },
        {
          type: 'wholesaler',
          participantId: wholesalerId,
          status: 'pending'
        }
      ],
      currentLocation: 'in-transit',
      status: 'processing',
      distributor: distributorId,
      wholesaler: wholesalerId,
      createdBy: distributorId
    });

    await shipment.save();

    // Update drug statuses
    await Drug.updateMany(
      { _id: { $in: drugIds } },
      { 
        $set: { 
          status: 'shipped to wholesaler',
          currentHolder: 'in-transit',
          wholesaler: wholesalerId,
          'unitBarcodes.$[].status': 'shipped',
          'unitBarcodes.$[].currentHolder': 'in-transit'
        } 
      }
    );

    res.json({ success: true, shipment });
  } catch (error) {
    console.error('Shipment creation error:', error);
    res.status(500).json({ error: 'Failed to create shipment', details: error.message });
  }
};

// Update createShipmentToRetailer
export const createShipmentToRetailer = async (req, res) => {
  try {
    const { drugIds, retailerId } = req.body;
    const distributorId = req.user._id;

    if (!drugIds || !retailerId) {
      return res.status(400).json({ error: 'Missing required fields: drugIds or retailerId' });
    }

    // Validate drugs belong to distributor and are in stock
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
        )
      });
    }

    // Generate tracking number
    const trackingNumber = `SH-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // Create shipment
    const shipment = new Shipment({
      trackingNumber,
      drugs: drugIds,
      shippedUnits: drugs.flatMap(drug => 
        drug.unitBarcodes.map(unit => ({
          barcode: unit.barcode,
          drugId: drug._id
        }))
      ),
      participants: [
        {
          type: 'distributor',
          participantId: distributorId,
          status: 'completed',
          actualDeparture: new Date()
        },
        {
          type: 'retailer',
          participantId: retailerId,
          status: 'pending'
        }
      ],
      currentLocation: 'in-transit',
      status: 'processing',
      distributor: distributorId,
      retailer: retailerId,
      createdBy: distributorId
    });

    await shipment.save();

    // Update drug statuses
    await Drug.updateMany(
      { _id: { $in: drugIds } },
      { 
        $set: { 
          status: 'shipped to retailer',
          currentHolder: 'in-transit',
          retailer: retailerId,
          'unitBarcodes.$[].status': 'shipped',
          'unitBarcodes.$[].currentHolder': 'in-transit'
        } 
      }
    );

    res.json({ success: true, shipment });
  } catch (error) {
    console.error('Shipment creation error:', error);
    res.status(500).json({ error: 'Failed to create shipment', details: error.message });
  }
};

// Update createShipmentToPharmacy
export const createShipmentToPharmacy = async (req, res) => {
  try {
    const { drugIds, pharmacyId } = req.body;
    const distributorId = req.user._id;

    if (!drugIds || !pharmacyId) {
      return res.status(400).json({ error: 'Missing required fields: drugIds or pharmacyId' });
    }

    // Validate drugs belong to distributor and are in stock
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
        )
      });
    }

    // Generate tracking number
    const trackingNumber = `SH-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // Create shipment
    const shipment = new Shipment({
      trackingNumber,
      drugs: drugIds,
      shippedUnits: drugs.flatMap(drug => 
        drug.unitBarcodes.map(unit => ({
          barcode: unit.barcode,
          drugId: drug._id
        }))
      ),
      participants: [
        {
          type: 'distributor',
          participantId: distributorId,
          status: 'completed',
          actualDeparture: new Date()
        },
        {
          type: 'pharmacy',
          participantId: pharmacyId,
          status: 'pending'
        }
      ],
      currentLocation: 'in-transit',
      status: 'processing',
      distributor: distributorId,
      pharmacy: pharmacyId,
      createdBy: distributorId
    });

    await shipment.save();

    // Update drug statuses
    await Drug.updateMany(
      { _id: { $in: drugIds } },
      { 
        $set: { 
          status: 'shipped to pharmacy',
          currentHolder: 'in-transit',
          pharmacy: pharmacyId,
          'unitBarcodes.$[].status': 'shipped',
          'unitBarcodes.$[].currentHolder': 'in-transit'
        } 
      }
    );

    res.json({ success: true, shipment });
  } catch (error) {
    console.error('Shipment creation error:', error);
    res.status(500).json({ error: 'Failed to create shipment', details: error.message });
  }
};


// Accept shipment for wholesaler
export const acceptWholesalerShipment = async (req, res) => {
  try {
    const shipment = await Shipment.findOne({
      _id: req.params.id,
      'participants.participantId': req.user._id,
      'participants.type': 'wholesaler',
      status: { $in: ['processing', 'in-transit'] }
    });

    if (!shipment) {
      return res.status(404).json({ message: 'Shipment not found or cannot be accepted' });
    }

    // Update shipment status
    shipment.status = 'delivered';
    shipment.actualDelivery = new Date();
    shipment.currentLocation = 'wholesaler';
    
    // Update wholesaler participant status
    const wholesalerParticipant = shipment.participants.find(
      p => p.type === 'wholesaler'
    );
    if (wholesalerParticipant) {
      wholesalerParticipant.status = 'completed';
      wholesalerParticipant.actualArrival = new Date();
    }

    await shipment.save();

    // Update drug statuses
    await Drug.updateMany(
      { _id: { $in: shipment.drugs } },
      { 
        $set: { 
          status: 'in-stock with wholesaler',
          currentHolder: 'wholesaler',
          wholesaler: req.user._id,
          'unitBarcodes.$[].status': 'in-stock',
          'unitBarcodes.$[].currentHolder': 'wholesaler'
        } 
      }
    );
    
    res.json({ message: 'Shipment accepted successfully', shipment });
  } catch (error) {
    console.error('Error accepting shipment:', error);
    res.status(500).json({ message: 'Server error', details: error.message });
  }
};

// Accept shipment for retailer
export const acceptRetailerShipment = async (req, res) => {
  try {
    const shipment = await Shipment.findOne({
      _id: req.params.id,
      'participants.participantId': req.user._id,
      'participants.type': 'retailer',
      status: { $in: ['processing', 'in-transit'] }
    });

    if (!shipment) {
      return res.status(404).json({ message: 'Shipment not found or cannot be accepted' });
    }

    // Update shipment status
    shipment.status = 'delivered';
    shipment.actualDelivery = new Date();
    shipment.currentLocation = 'retailer';
    
    // Update retailer participant status
    const retailerParticipant = shipment.participants.find(
      p => p.type === 'retailer'
    );
    if (retailerParticipant) {
      retailerParticipant.status = 'completed';
      retailerParticipant.actualArrival = new Date();
    }

    await shipment.save();

    // Update drug statuses
    await Drug.updateMany(
      { _id: { $in: shipment.drugs } },
      { 
        $set: { 
          status: 'in-stock with retailer',
          currentHolder: 'retailer',
          retailer: req.user._id,
          'unitBarcodes.$[].status': 'in-stock',
          'unitBarcodes.$[].currentHolder': 'retailer'
        } 
      }
    );
    
    res.json({ message: 'Shipment accepted successfully', shipment });
  } catch (error) {
    console.error('Error accepting shipment:', error);
    res.status(500).json({ message: 'Server error', details: error.message });
  }
};

// Accept shipment for pharmacy
export const acceptPharmacyShipment = async (req, res) => {
  try {
    const shipment = await Shipment.findOne({
      _id: req.params.id,
      'participants.participantId': req.user._id,
      'participants.type': 'pharmacy',
      status: { $in: ['processing', 'in-transit'] }
    });

    if (!shipment) {
      return res.status(404).json({ message: 'Shipment not found or cannot be accepted' });
    }

    // Update shipment status
    shipment.status = 'delivered';
    shipment.actualDelivery = new Date();
    shipment.currentLocation = 'pharmacy';
    
    // Update pharmacy participant status
    const pharmacyParticipant = shipment.participants.find(
      p => p.type === 'pharmacy'
    );
    if (pharmacyParticipant) {
      pharmacyParticipant.status = 'completed';
      pharmacyParticipant.actualArrival = new Date();
    }

    await shipment.save();

    // Update drug statuses
    await Drug.updateMany(
      { _id: { $in: shipment.drugs } },
      { 
        $set: { 
          status: 'in-stock with pharmacy',
          currentHolder: 'pharmacy',
          pharmacy: req.user._id,
          'unitBarcodes.$[].status': 'in-stock',
          'unitBarcodes.$[].currentHolder': 'pharmacy'
        } 
      }
    );
    
    res.json({ message: 'Shipment accepted successfully', shipment });
  } catch (error) {
    console.error('Error accepting shipment:', error);
    res.status(500).json({ message: 'Server error', details: error.message });
  }
};

// Reject shipment for wholesaler
export const rejectWholesalerShipment = async (req, res) => {
  try {
    const shipment = await Shipment.findOne({
      _id: req.params.id,
      'participants.participantId': req.user._id,
      'participants.type': 'wholesaler',
      status: { $in: ['processing', 'in-transit'] }
    });

    if (!shipment) {
      return res.status(404).json({ message: 'Shipment not found or cannot be rejected' });
    }

    shipment.status = 'cancelled';
    
    // Update wholesaler participant status
    const wholesalerParticipant = shipment.participants.find(
      p => p.type === 'wholesaler'
    );
    if (wholesalerParticipant) {
      wholesalerParticipant.status = 'cancelled';
    }

    await shipment.save();

    // Update drug statuses back to distributor
    await Drug.updateMany(
      { _id: { $in: shipment.drugs } },
      { 
        $set: { 
          status: 'in-stock with distributor',
          currentHolder: 'distributor',
          wholesaler: null,
          'unitBarcodes.$[].status': 'in-stock',
          'unitBarcodes.$[].currentHolder': 'distributor'
        } 
      }
    );

    res.json({ message: 'Shipment rejected successfully', shipment });
  } catch (error) {
    console.error('Error rejecting shipment:', error);
    res.status(500).json({ message: 'Server error', details: error.message });
  }
};

// Reject shipment for retailer
export const rejectRetailerShipment = async (req, res) => {
  try {
    const shipment = await Shipment.findOne({
      _id: req.params.id,
      'participants.participantId': req.user._id,
      'participants.type': 'retailer',
      status: { $in: ['processing', 'in-transit'] }
    });

    if (!shipment) {
      return res.status(404).json({ message: 'Shipment not found or cannot be rejected' });
    }

    shipment.status = 'cancelled';
    
    // Update retailer participant status
    const retailerParticipant = shipment.participants.find(
      p => p.type === 'retailer'
    );
    if (retailerParticipant) {
      retailerParticipant.status = 'cancelled';
    }

    await shipment.save();

    // Update drug statuses back to distributor
    await Drug.updateMany(
      { _id: { $in: shipment.drugs } },
      { 
        $set: { 
          status: 'in-stock with distributor',
          currentHolder: 'distributor',
          retailer: null,
          'unitBarcodes.$[].status': 'in-stock',
          'unitBarcodes.$[].currentHolder': 'distributor'
        } 
      }
    );

    res.json({ message: 'Shipment rejected successfully', shipment });
  } catch (error) {
    console.error('Error rejecting shipment:', error);
    res.status(500).json({ message: 'Server error', details: error.message });
  }
};

// Reject shipment for pharmacy
export const rejectPharmacyShipment = async (req, res) => {
  try {
    const shipment = await Shipment.findOne({
      _id: req.params.id,
      'participants.participantId': req.user._id,
      'participants.type': 'pharmacy',
      status: { $in: ['processing', 'in-transit'] }
    });

    if (!shipment) {
      return res.status(404).json({ message: 'Shipment not found or cannot be rejected' });
    }

    shipment.status = 'cancelled';
    
    // Update pharmacy participant status
    const pharmacyParticipant = shipment.participants.find(
      p => p.type === 'pharmacy'
    );
    if (pharmacyParticipant) {
      pharmacyParticipant.status = 'cancelled';
    }

    await shipment.save();

    // Update drug statuses back to distributor
    await Drug.updateMany(
      { _id: { $in: shipment.drugs } },
      { 
        $set: { 
          status: 'in-stock with distributor',
          currentHolder: 'distributor',
          pharmacy: null,
          'unitBarcodes.$[].status': 'in-stock',
          'unitBarcodes.$[].currentHolder': 'distributor'
        } 
      }
    );

    res.json({ message: 'Shipment rejected successfully', shipment });
  } catch (error) {
    console.error('Error rejecting shipment:', error);
    res.status(500).json({ message: 'Server error', details: error.message });
  }
};