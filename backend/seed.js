import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from './models/User.js';

dotenv.config();

const seedAllRoles = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    // Clear existing data for these roles
    await User.deleteMany({ 
      role: { $in: ['retailer', 'wholesaler', 'pharmacy', 'public'] } 
    });

    const password = await bcrypt.hash('default@123', 10);

    // 10 Retailers with detailed addresses
    const retailers = [
      {
        name: 'Metro Medical Stores',
        email: 'sales@metromedical.com',
        phone: '9876543210',
        password,
        role: 'retailer',
        organization: 'Metro Medical Retail Chain',
        location: 'Shop No. 5, Ground Floor, Phoenix Marketcity, Kurla West, Mumbai, Maharashtra 400070',
        status: 'approved',
        documents: [{ 
          name: 'Retail Drug License', 
          url: 'https://medchain-docs.com/retail-1.pdf' 
        }]
      },
      {
        name: 'City Health Mart',
        email: 'info@cityhealth.com',
        phone: '8765432109',
        password,
        role: 'retailer',
        organization: 'City Health Solutions',
        location: 'No. 12, 3rd Cross, Brigade Road, Bengaluru, Karnataka 560001',
        status: 'approved',
        documents: [{ 
          name: 'GST Registration Certificate', 
          url: 'https://medchain-docs.com/retail-2.pdf' 
        }]
      },
      {
        name: 'MediCare Retail',
        email: 'contact@medicare.com',
        phone: '7654321098',
        password,
        role: 'retailer',
        organization: 'MediCare Retail Solutions',
        location: 'Shop No. 8, South Extension Part 1, New Delhi 110049',
        status: 'approved',
        documents: [{ 
          name: 'FSSAI License', 
          url: 'https://medchain-docs.com/retail-3.pdf' 
        }]
      },
      {
        name: 'HealthPlus Medicals',
        email: 'sales@healthplus.com',
        phone: '6543210987',
        password,
        role: 'retailer',
        organization: 'HealthPlus Retail Chain',
        location: 'No. 45, Greams Road, Thousand Lights, Chennai, Tamil Nadu 600006',
        status: 'approved',
        documents: [{ 
          name: 'Shop Establishment Certificate', 
          url: 'https://medchain-docs.com/retail-4.pdf' 
        }]
      },
      {
        name: 'Prime Medical Suppliers',
        email: 'info@primemedical.com',
        phone: '5432109876',
        password,
        role: 'retailer',
        organization: 'Prime Medical Distributors',
        location: 'Shop No. 22, Elante Mall, Industrial Area Phase 1, Chandigarh 160002',
        status: 'approved',
        documents: [{ 
          name: 'Drug License Form 20B', 
          url: 'https://medchain-docs.com/retail-5.pdf' 
        }]
      },
      {
        name: 'Wellness Forever',
        email: 'support@wellnessforever.com',
        phone: '4321098765',
        password,
        role: 'retailer',
        organization: 'Wellness Forever Medicare Ltd',
        location: 'Shop No. 3, Seasons Mall, Magarpatta City, Hadapsar, Pune, Maharashtra 411013',
        status: 'approved',
        documents: [{ 
          name: 'Wholesale Drug License', 
          url: 'https://medchain-docs.com/retail-6.pdf' 
        }]
      },
      {
        name: 'Guardian Pharmacy',
        email: 'help@guardianpharmacy.com',
        phone: '3210987654',
        password,
        role: 'retailer',
        organization: 'Guardian Healthcare Services',
        location: 'No. 15, Jubilee Hills Road No. 36, Hyderabad, Telangana 500033',
        status: 'approved',
        documents: [{ 
          name: 'Partnership Deed', 
          url: 'https://medchain-docs.com/retail-7.pdf' 
        }]
      },
      {
        name: 'MedLife Retail',
        email: 'orders@medlife.com',
        phone: '2109876543',
        password,
        role: 'retailer',
        organization: 'MedLife Retail Ventures',
        location: 'Shop No. 9, Acropolis Mall, Rajdanga Main Road, Kolkata, West Bengal 700107',
        status: 'approved',
        documents: [{ 
          name: 'Trade License', 
          url: 'https://medchain-docs.com/retail-8.pdf' 
        }]
      },
      {
        name: 'Reliance Medical',
        email: 'customercare@reliancedigital.com',
        phone: '1098765432',
        password,
        role: 'retailer',
        organization: 'Reliance Retail Ltd',
        location: 'Ground Floor, Reliance Smart Point, Ambience Mall, Gurugram, Haryana 122001',
        status: 'approved',
        documents: [{ 
          name: 'Corporate Registration', 
          url: 'https://medchain-docs.com/retail-9.pdf' 
        }]
      },
      {
        name: 'Apollo Pharmacy Retail',
        email: 'retail@apollopharmacy.com',
        phone: '0987654321',
        password,
        role: 'retailer',
        organization: 'Apollo Pharmacy Ltd',
        location: 'Shop No. 12, Lulu Mall, Edappally, Kochi, Kerala 682024',
        status: 'approved',
        documents: [{ 
          name: 'PAN Card Copy', 
          url: 'https://medchain-docs.com/retail-10.pdf' 
        }]
      }
    ];

    // 10 Pharmacies with detailed addresses
    const pharmacies = [
      {
        name: 'Apollo Pharmacy - MG Road',
        email: 'mgroad@apollopharmacy.com',
        phone: '9876504321',
        password,
        role: 'pharmacy',
        organization: 'Apollo Pharmacy',
        location: 'No. 56, Ground Floor, Brigade Road, Bengaluru, Karnataka 560001',
        status: 'approved',
        documents: [{ 
          name: 'Pharmacy License No. KA/PH/2020/1234', 
          url: 'https://medchain-docs.com/pharma-1.pdf' 
        }]
      },
      {
        name: 'MedPlus - Andheri East',
        email: 'andheri@medplus.com',
        phone: '8765403219',
        password,
        role: 'pharmacy',
        organization: 'MedPlus Health Services',
        location: 'Shop No. 3, Vijay Nagar Society, Andheri East, Mumbai, Maharashtra 400069',
        status: 'approved',
        documents: [{ 
          name: 'Drug License MH/DRUG/4567', 
          url: 'https://medchain-docs.com/pharma-2.pdf' 
        }]
      },
      {
        name: 'Fortis Pharmacy - Gurgaon',
        email: 'gurgaon@fortispharmacy.com',
        phone: '7654302198',
        password,
        role: 'pharmacy',
        organization: 'Fortis Healthcare',
        location: 'Ground Floor, Fortis Memorial Research Institute, Sector 44, Gurugram, Haryana 122002',
        status: 'approved',
        documents: [{ 
          name: 'Hospital Pharmacy License HR/HP/7890', 
          url: 'https://medchain-docs.com/pharma-3.pdf' 
        }]
      },
      {
        name: 'Max Healthcare Pharmacy',
        email: 'pharmacy@maxhealthcare.com',
        phone: '6543201987',
        password,
        role: 'pharmacy',
        organization: 'Max Healthcare',
        location: '1st Floor, Max Super Speciality Hospital, Saket, New Delhi 110017',
        status: 'approved',
        documents: [{ 
          name: 'Institutional License DL/INST/3456', 
          url: 'https://medchain-docs.com/pharma-4.pdf' 
        }]
      },
      {
        name: 'Manipal Hospital Pharmacy',
        email: 'pharmacy@manipalhospitals.com',
        phone: '5432109876',
        password,
        role: 'pharmacy',
        organization: 'Manipal Health Enterprises',
        location: 'Ground Floor, Manipal Hospital, HAL Airport Road, Bengaluru, Karnataka 560017',
        status: 'approved',
        documents: [{ 
          name: 'Narcotics License KA/NRC/2021', 
          url: 'https://medchain-docs.com/pharma-5.pdf' 
        }]
      },
      {
        name: 'Columbia Asia Pharmacy',
        email: 'pharmacy@columbiaasia.com',
        phone: '4321098765',
        password,
        role: 'pharmacy',
        organization: 'Columbia Asia Hospitals',
        location: 'Ground Floor, Columbia Asia Hospital, Yeshwanthpur, Bengaluru, Karnataka 560022',
        status: 'approved',
        documents: [{ 
          name: 'Psychotropic License KA/PSY/2020', 
          url: 'https://medchain-docs.com/pharma-6.pdf' 
        }]
      },
      {
        name: 'Artemis Hospital Pharmacy',
        email: 'pharmacy@artemishospitals.com',
        phone: '3210987654',
        password,
        role: 'pharmacy',
        organization: 'Artemis Health Services',
        location: 'Sector 51, Gurugram, Haryana 122001',
        status: 'approved',
        documents: [{ 
          name: 'Blood Bank License HR/BLD/4567', 
          url: 'https://medchain-docs.com/pharma-7.pdf' 
        }]
      },
      {
        name: 'Narayana Health Pharmacy',
        email: 'pharmacy@narayanahealth.com',
        phone: '2109876543',
        password,
        role: 'pharmacy',
        organization: 'Narayana Health',
        location: '258/A, Bommasandra Industrial Area, Hosur Road, Bengaluru, Karnataka 560099',
        status: 'approved',
        documents: [{ 
          name: 'Vaccine Storage License KA/VAC/2021', 
          url: 'https://medchain-docs.com/pharma-8.pdf' 
        }]
      },
      {
        name: 'Kokilaben Hospital Pharmacy',
        email: 'pharmacy@kokilabenhospital.com',
        phone: '1098765432',
        password,
        role: 'pharmacy',
        organization: 'Kokilaben Dhirubhai Ambani Hospital',
        location: 'Rao Saheb Achutrao Patwardhan Marg, Four Bungalows, Andheri West, Mumbai, Maharashtra 400053',
        status: 'approved',
        documents: [{ 
          name: 'Schedule X License MH/SCHX/7890', 
          url: 'https://medchain-docs.com/pharma-9.pdf' 
        }]
      },
      {
        name: 'Ruby Hall Clinic Pharmacy',
        email: 'pharmacy@rubyhall.com',
        phone: '0987654321',
        password,
        role: 'pharmacy',
        organization: 'Ruby Hall Clinic',
        location: '40, Sassoon Road, Pune, Maharashtra 411001',
        status: 'approved',
        documents: [{ 
          name: 'Bio-Medical Waste License MH/BMW/2020', 
          url: 'https://medchain-docs.com/pharma-10.pdf' 
        }]
      }
    ];

    await User.insertMany([...retailers, ...pharmacies]);
    console.log('✅ 10 Retailers and 10 Pharmacies seeded successfully with detailed addresses!');
    process.exit();
  } catch (err) {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  }
};

seedAllRoles();