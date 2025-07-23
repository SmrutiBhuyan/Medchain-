import Drug from '../models/Drug.js';
import Shipment from '../models/Shipment.js';

export const getDashboardStats = async (req, res) => {
  try {
       // Verify the user is authenticated
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const manufacturerId = req.user._id;
    
    // Total drugs
    const totalDrugs = await Drug.countDocuments({ manufacturer: manufacturerId });
    
    // Active shipments (status: processing or in-transit)
    const activeShipments = await Shipment.countDocuments({
      manufacturer: manufacturerId,
      status: { $in: ['processing', 'in-transit'] }
    });
    
    // Near expiry drugs (expiring in next 30 days)
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    
    const nearExpiry = await Drug.countDocuments({
      manufacturer: manufacturerId,
      expiryDate: { 
        $gte: new Date(), 
        $lte: thirtyDaysFromNow 
      }
    });
    
    // Drug volume by batch (for analytics)
    const drugVolume = await Drug.aggregate([
      { $match: { manufacturer: manufacturerId } },
      { $group: { 
        _id: "$batch", 
        totalQuantity: { $sum: "$quantity" },
        drugName: { $first: "$name" }
      }},
      { $sort: { totalQuantity: -1 } },
      { $limit: 10 }
    ]);
    
    // Shipments over time (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const shipmentsOverTime = await Shipment.aggregate([
      { 
        $match: { 
          manufacturer: manufacturerId,
          createdAt: { $gte: thirtyDaysAgo }
        } 
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    res.json({
      success: true,
      stats: {
        totalDrugs,
        activeShipments,
        nearExpiry,
        drugVolume,
        shipmentsOverTime
      }
    });
    
  } catch (err) {
    console.error('Error getting dashboard stats:', err);
    res.status(500).json({ error: 'Failed to get dashboard stats' });
  }
};