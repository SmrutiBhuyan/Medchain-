import User from '../models/User.js';

// Get all retailers
export const getRetailers = async (req, res) => {
  try {
    const retailers = await User.find({ role: 'retailer', status: 'approved' }, 'name email organization');
    res.json(retailers);
  } catch (error) {
    console.error('Error fetching retailers:', error);
    res.status(500).json({ message: 'Server error' });
  }
};