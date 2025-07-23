import mongoose from 'mongoose';

const shipmentSchema = new mongoose.Schema({
  drugs: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Drug',
    required: true
  }],
  manufacturer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  distributor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  estimatedDelivery: {
    type: Date
  },
  actualDelivery: {
    type: Date
  },
  notes: {
    type: String
  },
  status: {
    type: String,
    enum: ['processing', 'in-transit', 'delivered', 'cancelled'],
    default: 'processing'
  },
  trackingNumber: {
    type: String
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Add indexes for better query performance
shipmentSchema.index({ manufacturer: 1, status: 1 });
shipmentSchema.index({ distributor: 1, status: 1 });
shipmentSchema.index({ drugs: 1 });

const Shipment = mongoose.model('Shipment', shipmentSchema);

export default Shipment;