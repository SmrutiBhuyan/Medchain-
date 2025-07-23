import express from 'express';
import { createDrug, getDrugsByManufacturer} from '../controllers/drugController.js';
import upload from '../middleware/uploadMiddleware.js';
import { uploadCSV } from '../controllers/uploadController.js';

const router = express.Router();

router.post('/create', createDrug);
router.post('/upload-csv', upload.single('csvFile'), uploadCSV);
router.get('/manufacturer/:manufacturerId', getDrugsByManufacturer);

export default router;