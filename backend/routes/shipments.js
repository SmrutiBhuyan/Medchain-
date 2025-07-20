import express from 'express';
const router = express.Router();
import Shipment from '../models/Shipment.js';

router.post('/', async(req, res)=>{
    try{
        const shipment = new Shipment(req.body);
        await shipment.save();
        res.status(201).json(shipment);
    }
    catch(error){
        res.status(400).json({error:error.message});
    }
});

router.get("/", async (req, res) => {
    try {
        const shipments = await Shipment.find();
        res.json(shipments);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
