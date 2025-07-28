// models/SalesRecord.js
import mongoose from 'mongoose';

const SalesRecordSchema = new mongoose.Schema({
  drug: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Drug',
    required: true
  },
  pharmacy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  saleDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  batch: {
    type: String,
    required: true
  },
  unitBarcode: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  }
}, {
  timestamps: true
});

// Indexes for faster querying
SalesRecordSchema.index({ drug: 1 });
SalesRecordSchema.index({ pharmacy: 1 });
SalesRecordSchema.index({ saleDate: -1 });
SalesRecordSchema.index({ drug: 1, pharmacy: 1, saleDate: -1 });

const SalesRecord = mongoose.model('SalesRecord', SalesRecordSchema);
export default SalesRecord;