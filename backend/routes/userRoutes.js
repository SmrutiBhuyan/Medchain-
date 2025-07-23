import express from 'express'
import User from '../models/User.js';
const router = express.Router();

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
export default router;
