import express from 'express';
import { createDrug, getDrugsByManufacturer, getDrugByBarcode} from '../controllers/drugController.js';
import upload from '../middleware/uploadMiddleware.js';
import { uploadCSV } from '../controllers/uploadController.js';
import {  getDistributorInventory, verifyDrugsForShipment, verifyDrug } from '../controllers/drugController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/create', createDrug);
router.post('/upload-csv', upload.single('csvFile'), uploadCSV);
router.get('/manufacturer/:manufacturerId', getDrugsByManufacturer);
router.get('/barcode/:barcode', getDrugByBarcode);
router.get('/inventory', protect, getDistributorInventory);
// In your drugs.js routes file
router.post('/verify-shipment', protect, verifyDrugsForShipment);
router.get('/verify/:barcode', protect, verifyDrug);

export default router;