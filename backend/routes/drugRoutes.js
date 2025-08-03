import express from 'express';
import { createDrug, getDrugsByManufacturer, getDrugByBarcode, getPharmacyInventory, verifyDrugGlobal, getRetailerInventory} from '../controllers/drugController.js';
import upload from '../middleware/uploadMiddleware.js';
import { uploadCSV } from '../controllers/uploadController.js';
import {  getDistributorInventory, verifyDrugsForShipment, verifyDrug } from '../controllers/drugController.js';
import { protect } from '../middleware/authMiddleware.js';
import Drug from '../models/Drug.js';

const router = express.Router();

router.post('/create', createDrug);
router.post('/upload-csv', upload.single('csvFile'), uploadCSV);
router.get('/manufacturer/:manufacturerId', getDrugsByManufacturer);
router.get('/barcode/:barcode', getDrugByBarcode);
router.get('/inventory', protect, getDistributorInventory);
// In your drugs.js routes file
router.post('/verify-shipment', protect, verifyDrugsForShipment);
router.get('/verify/:barcode', protect, verifyDrug);
router.get('/verifyDrug/:barcode', verifyDrugGlobal);
router.get('/pharmacy-inventory/:pharmacyId', getPharmacyInventory)
// In your backend routes
router.put('/mark-sold/:barcode', protect, async (req, res) => {
  try {
    // Find the drug with this unit barcode
    const drug = await Drug.findOne({ 'unitBarcodes.barcode': req.params.barcode });
    
    if (!drug) {
      return res.status(404).json({ message: 'Drug not found' });
    }

    // Find the specific unit barcode
    const unitBarcode = drug.unitBarcodes.find(b => b.barcode === req.params.barcode);
    
    if (!unitBarcode) {
      return res.status(404).json({ message: 'Unit barcode not found' });
    }

    // Update the status to sold
    unitBarcode.status = 'sold';
    unitBarcode.currentHolder = 'pharmacy';
    unitBarcode.history.push({
      holderType: 'pharmacy',
      holderId: req.user._id,
      status: 'sold',
      date: new Date()
    });

    // Save the drug
    await drug.save();

    res.json({ message: 'Drug marked as sold successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/retailer-inventory/:retailerId', protect, getRetailerInventory);

export default router;