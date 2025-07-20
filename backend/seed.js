import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from './models/User.js'; // Adjust path if needed

dotenv.config();

const seedUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    // Clear old manufacturer entries (optional)
    await User.deleteMany({ role: 'manufacturer' });

    const hashedPassword = await bcrypt.hash('manu@123', 10);

    const manufacturers = [];

    for (let i = 1; i <= 10; i++) {
      manufacturers.push({
        name: `Manufacturer ${i}`,
        email: `manu${i}@medchain.com`,
        phone: `99999999${i}`,
        password: hashedPassword,
        role: 'manufacturer',
        walletAddress: `0xFAKEWALLET${i}`,
        organization: `Org ${i}`,
        location: `City ${i}`,
        status: i <= 5 ? 'approved' : 'pending',
        documents: [],
      });
    }

    await User.insertMany(manufacturers);
    console.log('✅ Manufacturers seeded successfully!');
    process.exit();
  } catch (err) {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  }
};

seedUsers();
