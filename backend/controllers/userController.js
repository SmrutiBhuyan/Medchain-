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

export const getWholesalers = async (req, res) => {
  try {
    // Check if user is authenticated
    console.log("Fetching wholesalers...");
    
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Get all wholesalers with approved status
    const wholesalers = await User.find(
      { 
        role: 'wholesaler',
        status: 'approved' 
      },
      { 
        password: 0, // exclude password
        documents: 0 // exclude documents
      }
    ).sort({ name: 1 });
    
    res.status(200).json(wholesalers);
  } catch (error) {
    console.error('Error fetching wholesalers:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all pharmacies
export const getPharmacies = async (req, res) => {
  try {
    // Check if user is authenticated
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Only allow certain roles to access this endpoint
    const allowedRoles = ['admin', 'distributor', 'wholesaler', 'retailer'];
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    // Get all pharmacies with approved status
    const pharmacies = await User.find(
      { 
        role: 'pharmacy',
        status: 'approved' 
      },
      { 
        password: 0, // exclude password
        documents: 0 // exclude documents
      }
    ).sort({ name: 1 });

    res.status(200).json(pharmacies);
  } catch (error) {
    console.error('Error fetching pharmacies:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};