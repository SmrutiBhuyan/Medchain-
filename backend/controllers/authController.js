import User from "../models/User.js";
import jwt from "jsonwebtoken";
import { uploadFile } from "../utils/fileUpload.js";
import bcrypt from 'bcrypt';


// authController.js
export const register = async (req, res) => {
  try {
    // Handle file uploads first
    const documents = [];
    if (req.files) {
      for (const [key, file] of Object.entries(req.files)) {
        const result = await uploadFile(file);
        documents.push({
          name: req.body[`${key}_name`],
          key,
          url: result.url
        });
      }
    }

    const { name, email, phone, password, role, walletAddress, organization, location } = req.body;
    
    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Set status - auto-approve public users, others need admin approval
    const status = role === 'public' || role === 'admin' ? 'approved' : 'pending';


    // Create user
    const user = new User({
      name,
      email,
      phone,
      password: await bcrypt.hash(password, 10),
      role,
      walletAddress: ['manufacturer', 'distributor', 'pharmacy'].includes(role) ? walletAddress : undefined,
      organization,
      location,
      documents,
      status
    });

    await user.save();

    // Generate token (only for public users who are auto-approved)
    let token = null;
    if (status === 'approved') {
      token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
        expiresIn: "30d",
      });
    }

    res.status(201).json({ 
      token, 
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status
      }
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: error.message });
  }
};
// authController.js
export const login = async (req, res) => {
  try {
    const { email, password, role } = req.body;
    
    // Find user in the User collection with matching email AND role
    const user = await User.findOne({ email, role }).select('password status');
    
    if (!user) {
      return res.status(401).json({ message: "Invalid email, password, or role" });
    }
    
    // Skip status check for admin users
    if (user.role !== 'admin' && user.status !== 'approved') {
      return res.status(403).json({ 
        message: "Your account is pending approval. Please contact administrator."
      });
    }

    console.log("Input password:", password);
console.log("User password from DB:", user.password);
    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email, password, or role" });
    }

    // Rest of the login logic remains the same...
    const token = jwt.sign(
      { userId: user._id, role: user.role }, 
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    const userData = user.toObject();
    delete userData.password;

    res.json({
      token,
      user: userData
    });

  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error during authentication" });
  }
  
};
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-password");
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};