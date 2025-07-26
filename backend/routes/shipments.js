import express from 'express';
import { createShipment,   getDistributorShipments,
  acceptShipment,
  rejectShipment, createShipmentToRetailer, createShipmentToWholesaler, createShipmentToPharmacy} from '../controllers/shipmentController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';
import Shipment from '../models/Shipment.js';

const router = express.Router();

// Protect all shipment routes
router.use(protect);

// Only manufacturers can create shipments
router.post(
  '/create',
  authorize('manufacturer'),
  createShipment
);
router.get('/distributor', protect, getDistributorShipments);
router.put('/:id/accept', protect, acceptShipment);
router.put('/:id/reject', protect, rejectShipment);
// In your shipment routes file
router.get('/manufacturer', protect, authorize('manufacturer'), async (req, res) => {
  try {
    const shipments = await Shipment.find({ manufacturer: req.user.id })
      .populate('distributor', 'name organization')
      .populate('drugs', 'name batch quantity')
      .sort({ createdAt: -1 });
      
    res.json({
      success: true,
      shipments
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});
// In your routes file
router.post('/to-wholesaler', protect, createShipmentToWholesaler);
router.post('/to-retailer', protect, createShipmentToRetailer);
router.post('/to-pharmacy', protect,createShipmentToPharmacy);

export default router;