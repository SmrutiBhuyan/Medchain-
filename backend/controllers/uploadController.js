import Drug from '../models/Drug.js';
import { generateBarcode } from '../utils/barcodeGenerator.js';
import fs from 'fs';
import csvParser from 'csv-parser';

export const uploadCSV = async (req, res) => {
  try {
    console.log('Upload request received');
    console.log('Files:', req.file);
    console.log('Body:', req.body);

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const results = [];
    const errors = [];
    
    fs.createReadStream(req.file.path)
      .pipe(csvParser())
      .on('data', (data) => results.push(data))
      .on('end', async () => {
        const processedDrugs = [];
        
        for (const drugData of results) {
          try {
            if (!drugData.name || !drugData.batch || !drugData.quantity || 
                !drugData.mfgDate || !drugData.expiryDate) {
              errors.push({
                row: drugData,
                error: 'Missing required fields'
              });
              continue;
            }

            const existingDrug = await Drug.findOne({ 
              name: drugData.name, 
              batch: drugData.batch 
            });
            
            if (existingDrug) {
              errors.push({
                row: drugData,
                error: 'Duplicate drug (same name and batch)'
              });
              continue;
            }

            if (!drugData.barcode) {
              drugData.barcode = generateBarcode(drugData.name, drugData.batch);
            }

            const drug = new Drug({
              name: drugData.name,
              batch: drugData.batch,
              quantity: parseInt(drugData.quantity),
              mfgDate: new Date(drugData.mfgDate),
              expiryDate: new Date(drugData.expiryDate),
              barcode: drugData.barcode,
              manufacturer: req.body.manufacturerId,
              status: 'in-stock'
            });

            processedDrugs.push(drug);
          } catch (err) {
            errors.push({
              row: drugData,
              error: err.message
            });
          }
        }

        await Drug.insertMany(processedDrugs);
        fs.unlinkSync(req.file.path);
        
        res.json({
          success: true,
          importedCount: processedDrugs.length,
          errorCount: errors.length,
          errors: errors
        });
      });
  } catch (err) {
    console.error('CSV upload error:', err);
    res.status(500).json({ error: 'Failed to process CSV file' });
  }
};