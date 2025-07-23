import Shipment from '../models/Shipment.js';
import Drug from '../models/Drug.js';
import User from '../models/User.js';


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


