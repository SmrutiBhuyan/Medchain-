import express from 'express'
import User from '../models/User.js';
const router = express.Router();
import { getRetailers, getWholesalers, getPharmacies } from '../controllers/userController.js';
import { protect } from '../middleware/authMiddleware.js';

// Get all pending users
router.get('/pending', async (req, res) => {
  try {
    const pendingUsers = await User.find({ status: 'pending' }).select('-password');
    res.json(pendingUsers);
  } catch (err) {
    console.error('Error fetching pending users:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/users/:id/approve
router.put('/:id/approve', async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { status: 'approved' },
      { new: true }
    ).select('-password');

    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ message: 'User approved', user });
  } catch (err) {
    console.error('Approve error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/users/:id/reject
router.put('/:id/reject', async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { status: 'rejected' },
      { new: true }
    ).select('-password');

    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ message: 'User rejected', user });
  } catch (err) {
    console.error('Reject error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// In your user routes file (e.g., routes/userRoutes.js)
router.patch('/wallet', protect, async (req, res) => {
  try {
    // Validate wallet address format
    if (req.body.walletAddress && !/^0x[a-fA-F0-9]{40}$/.test(req.body.walletAddress)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid Ethereum wallet address format' 
      });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id, // Make sure authMiddleware is setting req.user
      { walletAddress: req.body.walletAddress || null },
      { new: true, runValidators: true }
    ).select('-password'); // Don't return the password

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    res.json({ success: true, user });
  } catch (error) {
    console.error('Wallet update error:', error);
    res.status(500).json({ success: false, error: 'Server error while updating wallet' });
  }
});

export const getDistributors = async (req, res) => {
  try {
    const distributors = await User.find({ role: 'distributor', status: 'approved' })
      .select('name organization email phone walletAddress');
    
    res.json({
      success: true,
      distributors
    });
  } catch (err) {
    console.error('Error fetching distributors:', err);
    res.status(500).json({ error: 'Failed to fetch distributors' });
  }
};
router.get('/distributors', getDistributors);
router.get('/retailers', protect, getRetailers);
// Get all wholesalers
router.get('/wholesalers', protect, getWholesalers);

// Get all pharmacies
router.get('/pharmacies', protect, getPharmacies);

export default router;
