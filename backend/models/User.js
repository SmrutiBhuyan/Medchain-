import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { 
    type: String, 
    required: true, 
    unique: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please fill a valid email address']
  },
  phone: { type: String, required: true },
  password: { type: String, required: true, select: false },
  role: { 
    type: String, 
    required: true, 
    enum: ['admin', 'manufacturer', 'distributor', 'wholesaler', 'retailer', 'pharmacy', 'public'],
    default: 'public'
  },
  walletAddress: { type: String },
  documents: [{
    name: String,
    key: String,
    url: String
  }],
  organization: String,
  location: String,
  status: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected'], 
    default: 'pending' 
  },
  createdAt: { type: Date, default: Date.now },
  lastLogin: { type: Date }
}, {
  timestamps: true
});

// Index for faster querying
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ status: 1 });

const User = mongoose.model("User", userSchema);

export default User;