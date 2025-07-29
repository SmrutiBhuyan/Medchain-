import Drug from '../models/Drug.js';
import { generateBarcode } from '../utils/barcodeGenerator.js';
import fs from 'fs';
import csvParser from 'csv-parser';
import { ethers } from 'ethers'
import { readFileSync } from 'fs';
import DrugTrackingABI from '../contracts/DrugTrackingABI.json' assert { type: 'json' };
import { config } from "dotenv";
config();


// / Initialize blockchain connection
const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_URL);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
const drugTrackingContract = new ethers.Contract(
  process.env.CONTRACT_ADDRESS,
  DrugTrackingABI.abi,
  wallet
);

export const uploadCSV = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const results = [];
    const errors = [];
     const blockchainErrors = [];
    
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

            // Save to blockchain
            try {
              const tx = await drugTrackingContract.createDrug(
                drugData.name,
                drugData.batch,
                quantity,
                Math.floor(new Date(drugData.mfgDate).getTime() / 1000), // Convert to Unix timestamp
                Math.floor(new Date(drugData.expiryDate).getTime() / 1000), // Convert to Unix timestamp
                batchBarcode
              );
              
              await tx.wait();
              console.log(`Drug ${batchBarcode} recorded on blockchain`);
            } catch (blockchainError) {
              console.error('Blockchain error:', blockchainError);
              blockchainErrors.push({
                row: drugData,
                error: 'Failed to record on blockchain: ' + blockchainError.message
              });
            }


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
          blockchainErrorCount: blockchainErrors.length,
          errors: errors,
          blockchainErrors: blockchainErrors
        });
      });
  } catch (err) {
    console.error('CSV upload error:', err);
    res.status(500).json({ error: 'Failed to process CSV file' });
  }
};