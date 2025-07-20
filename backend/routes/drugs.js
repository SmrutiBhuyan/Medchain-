import express from "express";
const router = express.Router();    
import Drug from "../models/Drug.js";
import { verifyDrugOnBlockchain, createDrugOnBlockchain } from "../services/blockchain.js";


// Get drugs by manufacturer
router.get('/manufacturer/:manufacturerId', async(req,res)=>{
    try{
        const drugs = await Drug.find({manufacturer: req.params.manufacturerId});
        res.json(drugs);

    }catch(error){
        res.status(500).json({error:error.message});
    }
});

//create Drug
router.post("/", async (req, res) => {
    console.log("req.body:", req.body);
    console.log("req.files:", req.files);
    try {
        // Handle both JSON and FormData
        const drugData = req.body;
        
        // If image was uploaded, handle it
        if (req.files?.image) {
            drugData.image = req.files.image.name;
            // Here you would typically save the file to storage
        }

        const drug = new Drug(drugData);
        await drug.save();
        
        // Then record on blockchain
        const blockchainResult = await createDrugOnBlockchain({
            name: drug.name,
            batchNumber: drug.batchNumber,
            manufacturingDate: drug.manufacturingDate,
            expiryDate: drug.expiryDate,
            barcode: drug.barcode
        });
        
        if (!blockchainResult.success) {
            await Drug.findByIdAndDelete(drug._id);
            return res.status(500).json({ 
                error: "Blockchain transaction failed",
                details: blockchainResult.error
            });
        }
        
        res.status(201).json({
            drug,
            blockchainTx: blockchainResult.txHash
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Verify Drug
router.get('/verify/:barcode', async (req, res) => {
    try {
        const barcode = req.params.barcode;
        
        // First check blockchain
        const blockchainResult = await verifyDrugOnBlockchain(barcode);
        
        if (blockchainResult.found) {
            return res.json({
                source: 'blockchain',
                status: 'authentic',
                drug: blockchainResult.drug
            });
        }
        
        // If not found on blockchain, check database
        const dbDrug = await Drug.findOne({ barcode });
        
        if (dbDrug) {
            return res.json({
                source: 'database',
                status: 'authentic',
                drug: {
                    name: dbDrug.name,
                    batchNumber: dbDrug.batchNumber,
                    manufacturingDate: dbDrug.manufacturingDate,
                    expiryDate: dbDrug.expiryDate,
                    barcode: dbDrug.barcode,
                    composition: dbDrug.composition,
                    dosage: dbDrug.dosage,
                    manufacturer: dbDrug.manufacturer,
                    currentHolder: dbDrug.currentHolder
                }
            });
        }
        
        // If not found anywhere
        res.json({
            status: 'not_found',
            message: 'Product not found in system'
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Add similar routes for batches and shipments
export default router;