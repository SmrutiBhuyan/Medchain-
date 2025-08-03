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
          distributor: req.user._id,
          'unitBarcodes.$[].status': 'in-stock',
      'unitBarcodes.$[].currentHolder': 'distributor'
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


// Updated createShipmentToWholesaler
export const createShipmentToWholesaler = async (req, res) => {
  try {
    const { drugIds, wholesalerId, unitBarcodes } = req.body;
    const distributorId = req.user._id;

    // Validate input
    if (!drugIds || !wholesalerId || !unitBarcodes) {
      return res.status(400).json({
        error: 'Missing required fields: drugIds, wholesalerId, or unitBarcodes'
      });
    }

    // Get drugs with their unit barcodes
    const drugs = await Drug.find({
      _id: { $in: drugIds },
      distributor: distributorId
    }).populate('manufacturer', 'name');

    // Detailed validation
    const missingDrugs = drugIds.filter(id => 
      !drugs.some(d => d._id.toString() === id.toString())
    );

    if (missingDrugs.length > 0) {
      return res.status(400).json({
        error: 'Some drugs not found or not owned by distributor',
        missingDrugs,
        message: `The following drugs are not available: ${missingDrugs.join(', ')}`
      });
    }

    // Validate barcodes and their status
    const invalidBarcodes = [];
    const validBarcodes = [];
    const unavailableBarcodes = [];

    unitBarcodes.forEach(barcode => {
      const drugWithBarcode = drugs.find(drug => 
        drug.unitBarcodes.some(unit => unit.barcode === barcode)
      );

      if (!drugWithBarcode) {
        invalidBarcodes.push(barcode);
      } else {
        const unit = drugWithBarcode.unitBarcodes.find(u => u.barcode === barcode);
        if (unit.status === 'in-stock' && unit.currentHolder === 'distributor') {
          validBarcodes.push(barcode);
        } else {
          unavailableBarcodes.push({
            barcode,
            status: unit.status,
            currentHolder: unit.currentHolder
          });
        }
      }
    });

    if (invalidBarcodes.length > 0 || unavailableBarcodes.length > 0) {
      return res.status(400).json({
        error: 'Some barcodes cannot be shipped',
        invalidBarcodes,
        unavailableBarcodes,
        validBarcodes,
        message: `${invalidBarcodes.length} barcodes are invalid, ` +
                 `${unavailableBarcodes.length} are not available for shipping`
      });
    }

    // Generate tracking number
    const trackingNumber = `SH-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // Create shipment with only valid units
    const shippedUnits = [];
    const barcodeToDrugMap = new Map();

    drugs.forEach(drug => {
      drug.unitBarcodes.forEach(unit => {
        if (unitBarcodes.includes(unit.barcode)) {
          barcodeToDrugMap.set(unit.barcode, drug);
        }
      });
    });

    unitBarcodes.forEach(barcode => {
      const drug = barcodeToDrugMap.get(barcode);
      shippedUnits.push({
        barcode,
        drugId: drug._id
      });
    });

    // Create shipment
    const shipment = new Shipment({
      trackingNumber,
      drugs: drugIds,
      shippedUnits,
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

    // Update all shipped units using arrayFilters
    await Drug.bulkWrite(drugs.map(drug => {
      const shippedBarcodes = drug.unitBarcodes
        .filter(unit => unitBarcodes.includes(unit.barcode))
        .map(unit => unit.barcode);

      return {
        updateOne: {
          filter: { _id: drug._id },
          update: {
            $set: {
              'unitBarcodes.$[elem].status': 'shipped',
              'unitBarcodes.$[elem].currentHolder': 'in-transit',
              'unitBarcodes.$[elem].wholesaler': wholesalerId
            }
          },
          arrayFilters: [
            { 'elem.barcode': { $in: shippedBarcodes } }
          ]
        }
      };
    }));

    // Update overall drug status if all units are shipped
    for (const drugId of drugIds) {
      const drug = await Drug.findById(drugId);
      const remainingUnits = drug.unitBarcodes.filter(unit => 
        unit.status === 'in-stock' && unit.currentHolder === 'distributor'
      );

      if (remainingUnits.length === 0) {
        await Drug.updateOne(
          { _id: drugId },
          { 
            $set: { 
              status: 'shipped to wholesaler',
              currentHolder: 'in-transit',
              wholesaler: wholesalerId
            } 
          }
        );
      }
    }

    res.json({ 
      success: true, 
      shipment,
      shippedUnits: unitBarcodes.length
    });
  } catch (error) {
    console.error('Shipment creation error:', error);
    res.status(500).json({ 
      error: 'Failed to create shipment', 
      details: error.message 
    });
  }
};

export const createShipmentToRetailer = async (req, res) => {
  try {
    const { drugIds, retailerId, unitBarcodes } = req.body;
    const distributorId = req.user._id;

    // Validate input
    if (!drugIds || !retailerId || !unitBarcodes) {
      return res.status(400).json({
        error: 'Missing required fields: drugIds, retailerId, or unitBarcodes'
      });
    }

    // Get drugs with their unit barcodes
    const drugs = await Drug.find({
      _id: { $in: drugIds },
      distributor: distributorId
    }).populate('manufacturer', 'name');

    // Detailed validation
    const missingDrugs = drugIds.filter(id => 
      !drugs.some(d => d._id.toString() === id.toString())
    );

    if (missingDrugs.length > 0) {
      return res.status(400).json({
        error: 'Some drugs not found or not owned by distributor',
        missingDrugs,
        message: `The following drugs are not available: ${missingDrugs.join(', ')}`
      });
    }

    // Validate barcodes and their status
    const invalidBarcodes = [];
    const validBarcodes = [];
    const unavailableBarcodes = [];

    unitBarcodes.forEach(barcode => {
      const drugWithBarcode = drugs.find(drug => 
        drug.unitBarcodes.some(unit => unit.barcode === barcode)
      );

      if (!drugWithBarcode) {
        invalidBarcodes.push(barcode);
      } else {
        const unit = drugWithBarcode.unitBarcodes.find(u => u.barcode === barcode);
        if (unit.status === 'in-stock' && unit.currentHolder === 'distributor') {
          validBarcodes.push(barcode);
        } else {
          unavailableBarcodes.push({
            barcode,
            status: unit.status,
            currentHolder: unit.currentHolder
          });
        }
      }
    });

    if (invalidBarcodes.length > 0 || unavailableBarcodes.length > 0) {
      return res.status(400).json({
        error: 'Some barcodes cannot be shipped',
        invalidBarcodes,
        unavailableBarcodes,
        validBarcodes,
        message: `${invalidBarcodes.length} barcodes are invalid, ` +
                 `${unavailableBarcodes.length} are not available for shipping`
      });
    }

    // Generate tracking number
    const trackingNumber = `SH-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // Create shipment with only valid units
    const shippedUnits = [];
    const barcodeToDrugMap = new Map();

    drugs.forEach(drug => {
      drug.unitBarcodes.forEach(unit => {
        if (unitBarcodes.includes(unit.barcode)) {
          barcodeToDrugMap.set(unit.barcode, drug);
        }
      });
    });

    unitBarcodes.forEach(barcode => {
      const drug = barcodeToDrugMap.get(barcode);
      shippedUnits.push({
        barcode,
        drugId: drug._id
      });
    });

    const shipment = new Shipment({
      trackingNumber,
      drugs: drugIds,
      shippedUnits,
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

    // Update all shipped units using arrayFilters
    await Drug.bulkWrite(drugs.map(drug => {
      const shippedBarcodes = drug.unitBarcodes
        .filter(unit => unitBarcodes.includes(unit.barcode))
        .map(unit => unit.barcode);

      return {
        updateOne: {
          filter: { _id: drug._id },
          update: {
            $set: {
              'unitBarcodes.$[elem].status': 'shipped',
              'unitBarcodes.$[elem].currentHolder': 'in-transit',
              'unitBarcodes.$[elem].retailer': retailerId
            }
          },
          arrayFilters: [
            { 'elem.barcode': { $in: shippedBarcodes } }
          ]
        }
      };
    }));

    // Update overall drug status if all units are shipped
    for (const drugId of drugIds) {
      const drug = await Drug.findById(drugId);
      const remainingUnits = drug.unitBarcodes.filter(unit => 
        unit.status === 'in-stock' && unit.currentHolder === 'distributor'
      );

      if (remainingUnits.length === 0) {
        await Drug.updateOne(
          { _id: drugId },
          { 
            $set: { 
              status: 'shipped to retailer',
              currentHolder: 'in-transit',
              retailer: retailerId
            } 
          }
        );
      }
    }

    res.json({ 
      success: true, 
      shipment,
      shippedUnits: unitBarcodes.length
    });
  } catch (error) {
    console.error('Shipment creation error:', error);
    res.status(500).json({ 
      error: 'Failed to create shipment', 
      details: error.message 
    });
  }
};

export const createShipmentToPharmacy = async (req, res) => {
  try {
    const { drugIds, pharmacyId, unitBarcodes } = req.body;
    const distributorId = req.user._id;

    // Validate input
    if (!drugIds || !pharmacyId || !unitBarcodes) {
      return res.status(400).json({
        error: 'Missing required fields: drugIds, pharmacyId, or unitBarcodes'
      });
    }

    // Get drugs with their unit barcodes
    const drugs = await Drug.find({
      _id: { $in: drugIds },
      distributor: distributorId
    }).populate('manufacturer', 'name');

    // Detailed validation
    const missingDrugs = drugIds.filter(id => 
      !drugs.some(d => d._id.toString() === id.toString())
    );

    if (missingDrugs.length > 0) {
      return res.status(400).json({
        error: 'Some drugs not found or not owned by distributor',
        missingDrugs,
        message: `The following drugs are not available: ${missingDrugs.join(', ')}`
      });
    }

    // Validate barcodes and their status
    const invalidBarcodes = [];
    const validBarcodes = [];
    const unavailableBarcodes = [];

    unitBarcodes.forEach(barcode => {
      const drugWithBarcode = drugs.find(drug => 
        drug.unitBarcodes.some(unit => unit.barcode === barcode)
      );

      if (!drugWithBarcode) {
        invalidBarcodes.push(barcode);
      } else {
        const unit = drugWithBarcode.unitBarcodes.find(u => u.barcode === barcode);
        if (unit.status === 'in-stock' && unit.currentHolder === 'distributor') {
          validBarcodes.push(barcode);
        } else {
          unavailableBarcodes.push({
            barcode,
            status: unit.status,
            currentHolder: unit.currentHolder
          });
        }
      }
    });

    if (invalidBarcodes.length > 0 || unavailableBarcodes.length > 0) {
      return res.status(400).json({
        error: 'Some barcodes cannot be shipped',
        invalidBarcodes,
        unavailableBarcodes,
        validBarcodes,
        message: `${invalidBarcodes.length} barcodes are invalid, ` +
                 `${unavailableBarcodes.length} are not available for shipping`
      });
    }

    // Generate tracking number
    const trackingNumber = `SH-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // Create shipment with only valid units
    const shippedUnits = [];
    const barcodeToDrugMap = new Map();

    drugs.forEach(drug => {
      drug.unitBarcodes.forEach(unit => {
        if (unitBarcodes.includes(unit.barcode)) {
          barcodeToDrugMap.set(unit.barcode, drug);
        }
      });
    });

    unitBarcodes.forEach(barcode => {
      const drug = barcodeToDrugMap.get(barcode);
      shippedUnits.push({
        barcode,
        drugId: drug._id
      });
    });

    const shipment = new Shipment({
      trackingNumber,
      drugs: drugIds,
      shippedUnits,
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

    // Update all shipped units using arrayFilters
    await Drug.bulkWrite(drugs.map(drug => {
      const shippedBarcodes = drug.unitBarcodes
        .filter(unit => unitBarcodes.includes(unit.barcode))
        .map(unit => unit.barcode);

      return {
        updateOne: {
          filter: { _id: drug._id },
          update: {
            $set: {
              'unitBarcodes.$[elem].status': 'shipped',
              'unitBarcodes.$[elem].currentHolder': 'in-transit',
              'unitBarcodes.$[elem].pharmacy': pharmacyId
            }
          },
          arrayFilters: [
            { 'elem.barcode': { $in: shippedBarcodes } }
          ]
        }
      };
    }));

    // Update overall drug status if all units are shipped
    for (const drugId of drugIds) {
      const drug = await Drug.findById(drugId);
      const remainingUnits = drug.unitBarcodes.filter(unit => 
        unit.status === 'in-stock' && unit.currentHolder === 'distributor'
      );

      if (remainingUnits.length === 0) {
        await Drug.updateOne(
          { _id: drugId },
          { 
            $set: { 
              status: 'shipped to pharmacy',
              currentHolder: 'in-transit',
              pharmacy: pharmacyId
            } 
          }
        );
      }
    }

    res.json({ 
      success: true, 
      shipment,
      shippedUnits: unitBarcodes.length
    });
  } catch (error) {
    console.error('Shipment creation error:', error);
    res.status(500).json({ 
      error: 'Failed to create shipment', 
      details: error.message 
    });
  }
};

export const getWholesalerShipments = async (req, res) => {
  try {
    console.log("Fetching wholesaler shipments...");
    
    const shipments = await Shipment.find({ 
      'participants.participantId': req.user._id,
      'participants.type': 'wholesaler'
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
      const wholesalerParticipant = shipment.participants.find(p => p.type === 'wholesaler');
      
      return {
        ...shipment.toObject(),
        manufacturer: manufacturerParticipant?.participantId,
        wholesaler: wholesalerParticipant?.participantId
      };
    });

    res.json(transformedShipments);
  } catch (error) {
    console.error('Error fetching shipments:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get shipments for pharmacy
export const getPharmacyShipments = async (req, res) => {
  try {
    const shipments = await Shipment.find({ 
      'participants.participantId': req.params.pharmacyId,
      'participants.type': 'pharmacy',
      status: { $in: ['processing', 'in-transit'] }
    })
    .populate({
      path: 'drugs',
      select: 'name batch',
      model: 'Drug'
    })
    .populate({
      path: 'participants.participantId',
      select: 'name',
      model: 'User'
    })
    .sort({ createdAt: -1 });

    res.json(shipments);
  } catch (error) {
    console.error('Error fetching pharmacy shipments:', error);
    res.status(500).json({ message: 'Server error' });
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


export const getRetailerShipments = async (req, res) => {
  try {
    const retailerId = req.params.retailerId;

    // Validate retailerId
    if (!mongoose.Types.ObjectId.isValid(retailerId)) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid retailer ID format'
      });
    }

    // Find shipments where the retailer is a participant
    const shipments = await Shipment.find({
      'participants.type': 'retailer',
      'participants.participantId': retailerId
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
      const distributorParticipant = shipment.participants.find(p => p.type === 'distributor');
      const retailerParticipant = shipment.participants.find(p => p.type === 'retailer');
      
      return {
        ...shipment.toObject(),
        distributor: distributorParticipant?.participantId,
        retailer: retailerParticipant?.participantId
      };
    });

    res.json({
      success: true,
      shipments: transformedShipments
    });
  } catch (error) {
    console.error('Error fetching retailer shipments:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch shipments',
      error: error.message 
    });
  }
};
// Accept shipment for retailer
// ShipmentController.js

// Retailer accepts a shipment
export const acceptShipmentRetailer = async (req, res) => {
  try {
    const shipment = await Shipment.findOne({
      _id: req.params.id,
      'participants.participantId': req.user._id,
      'participants.type': 'retailer',
      status: { $in: ['processing', 'in-transit'] }
    });

    if (!shipment) {
      return res.status(404).json({ 
        success: false,
        message: 'Shipment not found or cannot be accepted' 
      });
    }

    // Update shipment status and participant status
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

    // Update drug statuses and current holder
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

    // Update each unit barcode in the drugs
    for (const drugId of shipment.drugs) {
      const drug = await Drug.findById(drugId);
      if (drug) {
        const updatedUnitBarcodes = drug.unitBarcodes.map(unit => ({
          ...unit.toObject(),
          status: 'in-stock',
          currentHolder: 'retailer',
          retailer: req.user._id,
          history: [
            ...(unit.history || []),
            {
              holderType: 'retailer',
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
      success: true,
      message: 'Shipment accepted successfully', 
      shipment 
    });
  } catch (error) {
    console.error('Error accepting shipment:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error while accepting shipment',
      details: error.message 
    });
  }
};

// Retailer rejects a shipment
export const rejectShipmentRetailer = async (req, res) => {
  try {
    const shipment = await Shipment.findOne({
      _id: req.params.id,
      'participants.participantId': req.user._id,
      'participants.type': 'retailer',
       status: { $in: ['processing', 'in-transit'] }
    });

    if (!shipment) {
      return res.status(404).json({ 
        success: false,
        message: 'Shipment not found or cannot be rejected' 
      });
    }

    // Update shipment status
    shipment.status = 'returned';
    shipment.currentLocation = 'in-transit';
    
    // Update retailer participant status
    const retailerParticipant = shipment.participants.find(
      p => p.type === 'retailer'
    );
    if (retailerParticipant) {
      retailerParticipant.status = 'cancelled';
      retailerParticipant.notes = 'Rejected by retailer';
    }

    await shipment.save();

    // Update drug statuses to reflect return to wholesaler
    await Drug.updateMany(
      { _id: { $in: shipment.drugs } },
      { 
        $set: { 
          status: 'in-stock with wholesaler',
          currentHolder: 'wholesaler',
          retailer: null,
          'unitBarcodes.$[].status': 'in-stock',
          'unitBarcodes.$[].currentHolder': 'wholesaler'
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
          currentHolder: 'wholesaler',
          retailer: null,
          history: [
            ...(unit.history || []),
            {
              holderType: 'wholesaler',
              holderId: drug.wholesaler,
              status: 'returned',
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
      success: true,
      message: 'Shipment rejected and returned to wholesaler', 
      shipment 
    });
  } catch (error) {
    console.error('Error rejecting shipment:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error while rejecting shipment',
      details: error.message 
    });
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



import mongoose from 'mongoose';
const ObjectId = mongoose.Types.ObjectId;

export const acceptPharmacyShipment = async (req, res) => {
  try {
    console.log(req.user._id);
    
    // Find shipment with pharmacy participant matching current user
    const shipment = await Shipment.findOne({
      _id: req.params.shipmentId,
      'participants.type': 'pharmacy',
      'participants.participantId': new ObjectId(req.user._id),
      status: { $in: ['processing', 'in-transit'] }
    }).populate('drugs');

    if (!shipment) {
      return res.status(404).json({ 
        message: 'Shipment not found or not acceptable',
        details: {
          possibleReasons: [
            'Shipment does not exist',
            'User is not the pharmacy participant',
            'Shipment status is not "processing" or "in-transit"'
          ]
        }
      });
    }

    // Update shipment
    shipment.status = 'delivered';
    shipment.currentLocation = 'pharmacy';
    shipment.actualDelivery = new Date();

    // Update pharmacy participant
    const pharmacyParticipant = shipment.participants.find(
      p => p.type === 'pharmacy' && p.participantId.equals(req.user._id)
    );
    if (pharmacyParticipant) {
      pharmacyParticipant.status = 'completed';
      pharmacyParticipant.actualArrival = new Date();
    }

    await shipment.save();

    // Update drugs (your existing logic)
    for (const drugId of shipment.drugs) {
      const drug = await Drug.findById(drugId);
      if (!drug) continue;

      const shippedUnits = shipment.shippedUnits.filter(
        unit => unit.drugId.toString() === drug._id.toString()
      );

      for (const unit of shippedUnits) {
        const unitBarcode = drug.unitBarcodes.find(
          ub => ub.barcode === unit.barcode
        );
        if (unitBarcode) {
          unitBarcode.status = 'in-stock';
          unitBarcode.currentHolder = 'pharmacy';
          unitBarcode.pharmacy = req.user._id;
          unitBarcode.history.push({
            holderType: 'pharmacy',
            holderId: req.user._id,
            status: 'in-stock',
            date: new Date()
          });
        }
      }

      drug.status = shippedUnits.length === drug.unitBarcodes.length 
        ? 'in-stock with pharmacy' 
        : 'shipped to pharmacy';
      await drug.save();
    }

    res.json({ 
      success: true,
      message: 'Shipment accepted successfully'
    });

  } catch (error) {
    console.error('Error accepting shipment:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error',
      error: error.message 
    });
  }
};

export const rejectPharmacyShipment = async (req, res) => {
  try {
    const shipment = await Shipment.findOne({
      _id: req.params.id,
      'participants.participantId': req.user._id,
      'participants.type': 'pharmacy',
      status: { $in: ['processing', 'in-transit'] }
    }).populate('drugs');

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

    // Update each drug and its unit barcodes
    for (const drugId of shipment.drugs) {
      const drug = await Drug.findById(drugId);
      
      if (!drug) continue;

      // Find the shipped units for this drug in the shipment
      const shippedUnits = shipment.shippedUnits.filter(
        unit => unit.drugId.toString() === drug._id.toString()
      );

      // Determine where to return the drugs based on shipment participants
      let returnToType = 'distributor';
      let returnToId = shipment.participants.find(p => p.type === 'distributor')?.participantId;

      // Update each unit barcode
      for (const unit of shippedUnits) {
        const unitBarcode = drug.unitBarcodes.find(
          ub => ub.barcode === unit.barcode
        );
        
        if (unitBarcode) {
          unitBarcode.status = 'in-stock';
          unitBarcode.currentHolder = returnToType;
          
          // Clear downstream participants
          unitBarcode.distributor = returnToType === 'distributor' ? returnToId : null;
          unitBarcode.wholesaler = null;
          unitBarcode.retailer = null;
          unitBarcode.pharmacy = null;
          
          // Add to history
          unitBarcode.history.push({
            holderType: returnToType,
            holderId: returnToId,
            status: 'in-stock',
            date: new Date(),
            notes: 'Returned from rejected shipment'
          });
        }
      }

      // Update drug-level status
      drug.status = `in-stock with ${returnToType}`;
      drug.currentHolder = returnToType;
      
      // Clear downstream participants
      drug.distributor = returnToType === 'distributor' ? returnToId : null;
      drug.wholesaler = null;
      drug.retailer = null;
      drug.pharmacy = null;

      await drug.save();
    }

    res.json({ 
      message: 'Shipment rejected successfully', 
      shipment,
      updatedDrugs: shipment.drugs.length
    });
  } catch (error) {
    console.error('Error rejecting shipment:', error);
    res.status(500).json({ message: 'Server error', details: error.message });
  }
};

// In your shipmentController.js file, add this new controller function:

/**
 * @route GET /api/shipments/manufacturer
 * @desc Get all shipments created by the current manufacturer
 * @access Private (Manufacturer only)
 */
export const getManufacturerShipments = async (req, res) => {
  try {
    const manufacturerId = req.user._id;

    // Find shipments where the manufacturer is a participant and is the creator
    const shipments = await Shipment.find({
      $and: [
        { 'participants.type': 'manufacturer' },
        { 'participants.participantId': manufacturerId },
        { createdBy: manufacturerId }
      ]
    })
      .populate({
        path: 'participants.participantId',
        select: 'name email',
        model: 'User'
      })
      .populate({
        path: 'drugs',
        select: 'name batch batchBarcode',
        model: 'Drug'
      })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      shipments: shipments.map(shipment => ({
        _id: shipment._id,
        trackingNumber: shipment.trackingNumber,
        drugs: shipment.drugs,
        participants: shipment.participants,
        status: shipment.status,
        currentLocation: shipment.currentLocation,
        createdAt: shipment.createdAt,
        estimatedDelivery: shipment.estimatedDelivery,
        actualDelivery: shipment.actualDelivery
      }))
    });
  } catch (error) {
    console.error('Error fetching manufacturer shipments:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch shipments',
      details: error.message
    });
  }
};