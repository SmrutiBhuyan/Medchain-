import mongoose from "mongoose";

const drugSchema = new mongoose.Schema({
  name: { type: String, required: true },
  composition: { type: String, required: true },
  dosage: { type: String, required: true },
  expiryDate: { type: Date, required: true },
  batchNumber: { type: String, required: true },
  manufacturingDate: { type: Date, required: true },
  image: { type: String }, // Store image path or URL if needed
  existingBarcode: { type: String },
  barcodeType: { type: String },
  barcode: { type: String, required: true, unique: true },
  manufacturer: { type: String, required: true },
  distributor: { type: String },
  retailer: { type: String },
  currentHolder: { type: String },
}, {
  timestamps: true
});

const Drug = mongoose.model("Drug", drugSchema);

export default Drug;