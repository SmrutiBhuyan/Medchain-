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
 batchBarcode: {
  type: String,
  required: true,
  unique: true,
  trim: true,
  default: function() {
    // Generate a default barcode if none provided
    return generateBarcode(this.name, this.batch);
  }
},
  unitBarcodes: [{
    type: String,
    required: true,
    unique: true,
    trim: true
  }],
  manufacturer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['in-stock', 'shipped', 'delivered', 'recalled', 'expired', 'in-stock with distributor'],
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

// Indexes
DrugSchema.index({ name: 1, batch: 1 }, { unique: true });
DrugSchema.index({ batchBarcode: 1 }, { unique: true });
DrugSchema.index({ unitBarcodes: 1 });

export default mongoose.model('Drug', DrugSchema);