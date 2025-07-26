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
      return generateBarcode(this.name, this.batch);
    }
  },
   unitBarcodes: [{
    barcode: String,
    status: {
      type: String,
      enum: ['in-stock', 'shipped', 'delivered', 'recalled', 'expired'],
      default: 'in-stock'
    },
    currentHolder: {
      type: String,
      enum: ['manufacturer', 'distributor', 'wholesaler', 'retailer', 'pharmacy'],
      default: 'manufacturer'
    }
  }],
  manufacturer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  distributor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  wholesaler: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  retailer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  pharmacy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
   status: {
    type: String,
    enum: ['in-stock', 'shipped', 'delivered', 'recalled', 'expired', 
           'in-stock with distributor', 'in-stock with wholesaler', 
           'in-stock with retailer', 'in-stock with pharmacy',
           'shipped to wholesaler', 'shipped to retailer', 'shipped to pharmacy'],
    default: 'in-stock'
  },
  currentHolder: {
    type: String,
    enum: ['manufacturer', 'distributor', 'wholesaler', 'retailer', 'pharmacy'],
    default: 'manufacturer'
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
DrugSchema.index({ manufacturer: 1 });
DrugSchema.index({ distributor: 1 });
DrugSchema.index({ wholesaler: 1 });
DrugSchema.index({ retailer: 1 });
DrugSchema.index({ pharmacy: 1 });

export default mongoose.model('Drug', DrugSchema);