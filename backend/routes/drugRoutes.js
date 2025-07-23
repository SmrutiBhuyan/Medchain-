import express from 'express';
import { createDrug, getDrugsByManufacturer, getDrugByBarcode} from '../controllers/drugController.js';
import upload from '../middleware/uploadMiddleware.js';
import { uploadCSV } from '../controllers/uploadController.js';
import { getDistributorDrugs } from '../controllers/drugController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/create', createDrug);
router.post('/upload-csv', upload.single('csvFile'), uploadCSV);
router.get('/manufacturer/:manufacturerId', getDrugsByManufacturer);
router.get('/barcode/:barcode', getDrugByBarcode);
router.get('/distributor', protect, getDistributorDrugs);

export default router;