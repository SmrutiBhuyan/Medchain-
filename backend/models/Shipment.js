import mongoose from "mongoose";

const shipmentSchema = new mongoose.Schema({
    batchId: { type: mongoose.Schema.Types.ObjectId, required: true },
    drugId: { type: mongoose.Schema.Types.ObjectId, required: true },
    quantity: { type: Number, required: true },
    distributor: { type: String, required: true },
    distributorAddress: { type: String, required: true },
    destination: { type: String, required: true },
    status: { type: String, enum: ['in_transit', 'delivered'], default: 'in_transit' },
    date: { type: Date, default: Date.now },
    blockchainTx: { type: String }
}, { timestamps: true });

const Shipment = mongoose.model("Shipment", shipmentSchema);

export default Shipment;