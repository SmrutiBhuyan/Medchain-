import Drug from '../models/Drug.js';
import { generateBarcode } from '../utils/barcodeGenerator.js';
import fs from 'fs';
import csvParser from 'csv-parser';

export const uploadCSV = async (req, res) => {
  try {
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

            // Generate batch barcode if not provided
            const batchBarcode = drugData.batchBarcode || generateBarcode(drugData.name, drugData.batch);

            // Handle unit barcodes
            let unitBarcodes = [];
            const quantity = parseInt(drugData.quantity);
            
            if (drugData.unitBarcodes) {
              // If unit barcodes are provided as a comma-separated string
              const barcodeArray = drugData.unitBarcodes.split(',').map(b => b.trim());
              
              if (barcodeArray.length !== quantity) {
                errors.push({
                  row: drugData,
                  error: 'Number of unit barcodes must match quantity'
                });
                continue;
              }

              // Create proper unitBarcodes objects
              unitBarcodes = barcodeArray.map(barcode => ({
                barcode: barcode,
                status: 'in-stock',
                manufacturer:req.body.manufacturerId,
                currentHolder: 'manufacturer'
              }));
            } else {
              // Auto-generate unit barcodes
              for (let i = 1; i <= quantity; i++) {
                unitBarcodes.push({
                  barcode: generateBarcode(drugData.name, drugData.batch, i),
                  status: 'in-stock',
                  manufacturer: req.body.manufacturerId,
                  currentHolder: 'manufacturer'
                });
              }
            }

            const drug = new Drug({
              name: drugData.name,
              batch: drugData.batch,
              quantity: quantity,
              mfgDate: new Date(drugData.mfgDate),
              expiryDate: new Date(drugData.expiryDate),
              batchBarcode: batchBarcode,
              unitBarcodes: unitBarcodes,
              manufacturer: req.body.manufacturerId,
              status: 'in-stock',
              currentHolder: 'manufacturer'
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