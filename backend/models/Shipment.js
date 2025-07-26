import mongoose from 'mongoose';

const shipmentSchema = new mongoose.Schema({
  trackingNumber: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  drugs: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Drug',
    required: true
  }],
  shippedUnits: [{
    barcode: {
      type: String,
      required: true
    },
    drugId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Drug',
      required: true
    }
  }],
  // Flexible supply chain participants
  participants: [{
    type: {
      type: String,
      enum: ['manufacturer', 'distributor', 'wholesaler', 'retailer', 'pharmacy', 'consumer'],
      required: true
    },
    participantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    expectedArrival: Date,
    actualArrival: Date,
    expectedDeparture: Date,
    actualDeparture: Date,
    notes: String,
    status: {
      type: String,
      enum: ['pending', 'in-process', 'completed', 'cancelled','in-transit'],
      default: 'pending'
    }
  }],
  // Current location in the supply chain
  currentLocation: {
    type: String,
    enum: ['manufacturer', 'distributor', 'wholesaler', 'retailer', 'pharmacy', 'consumer', 'in-transit'],
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
    enum: ['processing', 'in-transit', 'delivered', 'cancelled', 'returned'],
    default: 'processing'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Indexes for better query performance
shipmentSchema.index({ trackingNumber: 1 });
shipmentSchema.index({ status: 1 });
shipmentSchema.index({ currentLocation: 1 });
shipmentSchema.index({ 'participants.participantId': 1 });
shipmentSchema.index({ 'participants.type': 1 });
shipmentSchema.index({ drugs: 1 });
shipmentSchema.index({ createdBy: 1 });

const Shipment = mongoose.model('Shipment', shipmentSchema);

export default Shipment;