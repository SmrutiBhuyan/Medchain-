import mongoose from 'mongoose';

const DrugSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  batch: {
    type: String,
    required: true,
    trim: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  mfgDate: {
    type: Date,
    required: true
  },
  expiryDate: {
    type: Date,
    required: true,
    validate: {
      validator: function(value) {
        return value > this.mfgDate;
      },
      message: 'Expiry date must be after manufacturing date'
    }
  },
  barcode: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  manufacturer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['in-stock', 'shipped', 'delivered', 'recalled', 'expired'],
    default: 'in-stock'
  },
  currentHolder: {
    type: String,
    default: 'Manufacturer'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

DrugSchema.index({ name: 1, batch: 1 }, { unique: true });
DrugSchema.index({ barcode: 1 }, { unique: true });

export default mongoose.model('Drug', DrugSchema);