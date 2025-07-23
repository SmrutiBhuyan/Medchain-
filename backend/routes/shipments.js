import express from 'express';
import { createShipment } from '../controllers/shipmentController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// Protect all shipment routes
router.use(protect);

// Only manufacturers can create shipments
router.post(
  '/create',
  authorize('manufacturer'),
  createShipment
);

export default router;