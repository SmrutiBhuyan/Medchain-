import express from "express";
const router = express.Router();    
import Drug from "../models/Drug.js";
import { createDrugOnBlockchain } from "../services/blockchain.js";

router.post("/", async (req, res) => {
    try {
        // First save to MongoDB
        const drug = new Drug(req.body);
        await drug.save();
        
        // Then record on blockchain
        const blockchainResult = await createDrugOnBlockchain(req.body);
        console.log("Blockchain result:", blockchainResult);
        if (!blockchainResult.success) {
            // Rollback MongoDB if blockchain fails
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

// Add similar routes for batches and shipments
export default router;