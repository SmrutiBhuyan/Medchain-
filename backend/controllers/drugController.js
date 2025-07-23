import Drug from '../models/Drug.js';
import { generateBarcode } from '../utils/barcodeGenerator.js';

export const createDrug = async (req, res) => {
  try {
    const { name, batch, quantity, mfgDate, expiryDate, barcode, manufacturerId } = req.body;

    if (!name || !batch || !quantity || !mfgDate || !expiryDate || !manufacturerId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const existingDrug = await Drug.findOne({ name, batch });
    if (existingDrug) {
      return res.status(400).json({ error: 'Drug with this name and batch already exists' });
    }

    const finalBarcode = barcode || generateBarcode(name, batch);

    const drug = new Drug({
      name,
      batch,
      quantity: parseInt(quantity),
      mfgDate: new Date(mfgDate),
      expiryDate: new Date(expiryDate),
      barcode: finalBarcode,
      manufacturer: manufacturerId,
      status: 'in-stock'
    });

    await drug.save();

    res.json({
      success: true,
      drug: drug
    });
  } catch (err) {
    console.error('Drug creation error:', err);
    res.status(500).json({ error: 'Failed to create drug' });
  }
};


export const getDrugsByManufacturer = async (req, res) => {
  try {
    const { manufacturerId } = req.params;
    
    // Verify manufacturerId is valid
    if (!manufacturerId) {
      return res.status(400).json({ error: 'Manufacturer ID is required' });
    }

    const drugs = await Drug.find({ manufacturer: manufacturerId })
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      drugs
    });
  } catch (err) {
    console.error('Error fetching manufacturer drugs:', err);
    res.status(500).json({ error: 'Failed to fetch drugs' });
  }
};