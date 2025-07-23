import Drug from '../models/Drug.js';
import Shipment from '../models/Shipment.js';
import User from '../models/User.js';

export const getDashboardStats = async (req, res) => {
  try {
    // Verify the user is authenticated
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const manufacturerId = req.user._id;
    const { days = 30 } = req.query; // Default to 30 days if not specified
    
    // Calculate date ranges based on the days parameter
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));
    
    const endDate = new Date();
    const expiryThreshold = new Date();
    expiryThreshold.setDate(expiryThreshold.getDate() + 30);

    // Get all stats in parallel for better performance
    const [
      totalDrugs,
      activeShipments,
      nearExpiry,
      recalledBatches,
      drugVolume,
      shipmentsOverTime,
      statusDistribution,
      upcomingExpirations,
      topDistributors
    ] = await Promise.all([
      // Total drugs count
      Drug.countDocuments({ manufacturer: manufacturerId }),
      
      // Active shipments (status: processing or in-transit)
      Shipment.countDocuments({
        manufacturer: manufacturerId,
        status: { $in: ['processing', 'in-transit'] }
      }),
      
      // Near expiry drugs (expiring in next 30 days)
      Drug.countDocuments({
        manufacturer: manufacturerId,
        expiryDate: { 
          $gte: new Date(), 
          $lte: expiryThreshold 
        }
      }),
      
      // Recalled batches
      Drug.countDocuments({
        manufacturer: manufacturerId,
        status: 'recalled'
      }),
      
      // Drug volume by drug name (not batch)
      Drug.aggregate([
        { $match: { 
          manufacturer: manufacturerId,
          createdAt: { $gte: startDate }
        }},
        { $group: { 
          _id: "$name", 
          totalQuantity: { $sum: "$quantity" },
          drugName: { $first: "$name" }
        }},
        { $sort: { totalQuantity: -1 } },
        { $limit: 10 },
        { $project: {
          drugName: "$_id",
          totalQuantity: 1,
          _id: 0
        }}
      ]),
      
      // Shipments over time
      Shipment.aggregate([
        { 
          $match: { 
            manufacturer: manufacturerId,
            createdAt: { $gte: startDate }
          } 
        },
        {
          $group: {
            _id: { 
              $dateToString: { 
                format: days <= 30 ? "%Y-%m-%d" : "%Y-%m-%W", 
                date: "$createdAt" 
              } 
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } },
        { $project: {
          date: "$_id",
          count: 1,
          _id: 0
        }}
      ]),
      
      // Status distribution
      Drug.aggregate([
        { $match: { manufacturer: manufacturerId } },
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 }
          }
        },
        { $project: {
          status: "$_id",
          count: 1,
          _id: 0
        }}
      ]),
      
      // Upcoming expirations (top 10 soonest to expire)
      Drug.aggregate([
        { 
          $match: { 
            manufacturer: manufacturerId,
            expiryDate: { $gte: new Date() }
          } 
        },
        { $sort: { expiryDate: 1 } },
        { $limit: 10 },
        { $project: {
          name: 1,
          batch: 1,
          expiryDate: 1,
          quantity: 1,
          daysLeft: {
            $divide: [
              { $subtract: ["$expiryDate", new Date()] },
              1000 * 60 * 60 * 24 // Convert to days
            ]
          }
        }},
        { $project: {
          name: 1,
          batch: 1,
          expiryDate: { $dateToString: { format: "%Y-%m-%d", date: "$expiryDate" } },
          daysLeft: { $floor: "$daysLeft" },
          quantity: 1
        }}
      ]),
      
      // Top distributors
      Shipment.aggregate([
        { $match: { manufacturer: manufacturerId } },
        { $group: {
          _id: "$distributor",
          count: { $sum: 1 }
        }},
        { $sort: { count: -1 } },
        { $limit: 5 },
        { $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "distributorInfo"
        }},
        { $unwind: "$distributorInfo" },
        { $project: {
          distributorId: "$_id",
          distributorName: "$distributorInfo.organization",
          count: 1,
          _id: 0
        }}
      ])
    ]);

    res.json({
      success: true,
      stats: {
        totalDrugs,
        activeShipments,
        nearExpiry,
        recalledBatches,
        drugVolume,
        shipmentsOverTime,
        statusDistribution,
        upcomingExpirations,
        topDistributors
      }
    });
    
  } catch (err) {
    console.error('Error getting dashboard stats:', err);
    res.status(500).json({ 
      success: false,
      error: 'Failed to get dashboard stats',
      details: err.message 
    });
  }
};