import Shipment from '../models/Shipment.js';
import Drug from '../models/Drug.js';


export const createShipment = async (req, res) => {
  try {
    console.log('Create shipment endpoint hit');
    console.log('Request body:', req.body);
    console.log('User:', req.user); // Add this to check the authenticated user

    // Validate request body
    if (!req.body || !req.body.drugs || !req.body.distributorId || !req.body.manufacturerId) {
      return res.status(400).json({ error: 'Missing required fields in request body' });
    }

    const { drugs, distributorId, manufacturerId, estimatedDelivery, notes } = req.body;

    // Validate drugs exist and belong to manufacturer
    const drugCount = await Drug.countDocuments({
      _id: { $in: drugs },
      manufacturer: manufacturerId,
      status: 'in-stock'
    });
    
    if (drugCount !== drugs.length) {
      return res.status(400).json({ error: 'Some drugs are invalid or not available' });
    }

    // Create shipment with createdBy field
    const shipment = new Shipment({
      drugs,
      distributor: distributorId,
      manufacturer: manufacturerId,
      createdBy: req.user._id, // Add this line
      estimatedDelivery: estimatedDelivery ? new Date(estimatedDelivery) : undefined,
      notes,
      status: 'processing'
    });

    await shipment.save();

    // Update drug statuses
    await Drug.updateMany(
      { _id: { $in: drugs } },
      { $set: { status: 'shipped' } }
    );

    res.json({
      success: true,
      shipment
    });
  } catch (err) {
    console.error('Shipment creation error:', err);
    res.status(500).json({ error: 'Failed to create shipment' });
  }
};