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
      role: { $in: ['manufacturer', 'distributor', 'wholesaler', 'retailer', 'pharmacy'] } 
    });

    const password = await bcrypt.hash('default@123', 10);

    // 10 Manufacturers with detailed addresses
    const manufacturers = [
      {
        name: 'Sun Pharmaceutical Industries',
        email: 'contact@sunpharma.com',
        phone: '9876543210',
        password,
        role: 'manufacturer',
        organization: 'Sun Pharma',
        location: 'Survey No. 259/260, Village - Vasai, Taluka - Vasai, District - Palghar, Maharashtra 401208',
        pincode: '401208',
        status: 'approved',
        documents: [{ 
          name: 'Manufacturing License MH/MFG/12345', 
          url: 'https://medchain-docs.com/manufacturer-1.pdf' 
        }]
      },
      {
        name: 'Dr. Reddy\'s Laboratories',
        email: 'info@drreddys.com',
        phone: '8765432109',
        password,
        role: 'manufacturer',
        organization: 'Dr. Reddy\'s',
        location: '8-2-337, Road No. 3, Banjara Hills, Hyderabad, Telangana 500034',
        pincode: '500034',
        status: 'approved',
        documents: [{ 
          name: 'WHO-GMP Certification', 
          url: 'https://medchain-docs.com/manufacturer-2.pdf' 
        }]
      },
      {
        name: 'Cipla Limited',
        email: 'corporate@cipla.com',
        phone: '7654321098',
        password,
        role: 'manufacturer',
        organization: 'Cipla',
        location: 'Cipla House, Peninsula Business Park, Ganpatrao Kadam Marg, Lower Parel, Mumbai, Maharashtra 400013',
        pincode: '400013',
        status: 'approved',
        documents: [{ 
          name: 'USFDA Approval Certificate', 
          url: 'https://medchain-docs.com/manufacturer-3.pdf' 
        }]
      },
      {
        name: 'Lupin Limited',
        email: 'lupin@lupin.com',
        phone: '6543210987',
        password,
        role: 'manufacturer',
        organization: 'Lupin Pharmaceuticals',
        location: '3rd Floor, Kalpataru Inspire, Off Western Express Highway, Santacruz East, Mumbai, Maharashtra 400055',
        pincode: '400055',
        status: 'approved',
        documents: [{ 
          name: 'EU-GMP Certification', 
          url: 'https://medchain-docs.com/manufacturer-4.pdf' 
        }]
      },
      {
        name: 'Aurobindo Pharma',
        email: 'info@aurobindo.com',
        phone: '5432109876',
        password,
        role: 'manufacturer',
        organization: 'Aurobindo Pharma',
        location: 'Plot No. 2, Maitrivihar, Ameerpet, Hyderabad, Telangana 500038',
        pincode: '500038',
        status: 'approved',
        documents: [{ 
          name: 'Schedule M License', 
          url: 'https://medchain-docs.com/manufacturer-5.pdf' 
        }]
      },
      {
        name: 'Torrent Pharmaceuticals',
        email: 'torrent@torrentpharma.com',
        phone: '4321098765',
        password,
        role: 'manufacturer',
        organization: 'Torrent Pharma',
        location: 'Torrent House, Off Ashram Road, Ahmedabad, Gujarat 380009',
        pincode: '380009',
        status: 'approved',
        documents: [{ 
          name: 'TGA Australia Approval', 
          url: 'https://medchain-docs.com/manufacturer-6.pdf' 
        }]
      },
      {
        name: 'Glenmark Pharmaceuticals',
        email: 'glenmark@glenmarkpharma.com',
        phone: '3210987654',
        password,
        role: 'manufacturer',
        organization: 'Glenmark',
        location: 'Glenmark House, B.D. Sawant Marg, Chakala, Andheri East, Mumbai, Maharashtra 400099',
        pincode: '400099',
        status: 'approved',
        documents: [{ 
          name: 'Health Canada Approval', 
          url: 'https://medchain-docs.com/manufacturer-7.pdf' 
        }]
      },
      {
        name: 'Biocon Limited',
        email: 'biocon@biocon.com',
        phone: '2109876543',
        password,
        role: 'manufacturer',
        organization: 'Biocon',
        location: '20th KM, Hosur Road, Electronic City, Bengaluru, Karnataka 560100',
        pincode: '560100',
        status: 'approved',
        documents: [{ 
          name: 'Biosimilar Manufacturing License', 
          url: 'https://medchain-docs.com/manufacturer-8.pdf' 
        }]
      },
      {
        name: 'Cadila Healthcare',
        email: 'zydus@zyduscadila.com',
        phone: '1098765432',
        password,
        role: 'manufacturer',
        organization: 'Zydus Cadila',
        location: 'Zydus Tower, Satellite Cross Roads, Ahmedabad, Gujarat 380015',
        pincode: '380015',
        status: 'approved',
        documents: [{ 
          name: 'ANDA Approvals List', 
          url: 'https://medchain-docs.com/manufacturer-9.pdf' 
        }]
      },
      {
        name: 'Divis Laboratories',
        email: 'divis@divislabs.com',
        phone: '0987654321',
        password,
        role: 'manufacturer',
        organization: 'Divis Labs',
        location: 'Divis Research Centre, 1-72/63, Plot No. 42 & 43, IDA, Jeedimetla, Hyderabad, Telangana 500055',
        pincode: '500055',
        status: 'approved',
        documents: [{ 
          name: 'API Manufacturing License', 
          url: 'https://medchain-docs.com/manufacturer-10.pdf' 
        }]
      }
    ];

    // 10 Distributors with detailed addresses
    const distributors = [
      {
        name: 'MedPlus Distribution',
        email: 'distribution@medplus.com',
        phone: '9876512345',
        password,
        role: 'distributor',
        organization: 'MedPlus Distribution Network',
        location: 'Plot No. 34, Phase II, IDA, Cherlapally, Hyderabad, Telangana 500051',
        pincode: '500051',
        status: 'approved',
        documents: [{ 
          name: 'Distribution License TS/DIST/1234', 
          url: 'https://medchain-docs.com/distributor-1.pdf' 
        }]
      },
      {
        name: 'Apollo Pharmacy Distribution',
        email: 'distribution@apollopharmacy.com',
        phone: '8765123456',
        password,
        role: 'distributor',
        organization: 'Apollo Distribution',
        location: 'Apollo Health City, Jubilee Hills, Hyderabad, Telangana 500033',
        pincode: '500033',
        status: 'approved',
        documents: [{ 
          name: 'Cold Chain Certification', 
          url: 'https://medchain-docs.com/distributor-2.pdf' 
        }]
      },
      {
        name: 'Fortis Healthcare Supply',
        email: 'supply@fortishealthcare.com',
        phone: '7651234567',
        password,
        role: 'distributor',
        organization: 'Fortis Distribution',
        location: 'Sector 62, Phase VIII, Industrial Area, Mohali, Punjab 160062',
        pincode: '160062',
        status: 'approved',
        documents: [{ 
          name: 'Vaccine Distribution License', 
          url: 'https://medchain-docs.com/distributor-3.pdf' 
        }]
      },
      {
        name: 'Max Healthcare Supply Chain',
        email: 'supplychain@maxhealthcare.com',
        phone: '6542345678',
        password,
        role: 'distributor',
        organization: 'Max Distribution',
        location: 'Press Enclave Road, Saket, New Delhi 110017',
        pincode: '110017',
        status: 'approved',
        documents: [{ 
          name: 'Narcotics Distribution License', 
          url: 'https://medchain-docs.com/distributor-4.pdf' 
        }]
      },
      {
        name: 'Manipal Health Enterprises Distribution',
        email: 'distribution@manipalhospitals.com',
        phone: '5433456789',
        password,
        role: 'distributor',
        organization: 'Manipal Distribution',
        location: 'HAL Airport Road, Bengaluru, Karnataka 560017',
        pincode: '560017',
        status: 'approved',
        documents: [{ 
          name: 'Blood Products License', 
          url: 'https://medchain-docs.com/distributor-5.pdf' 
        }]
      },
      {
        name: 'Columbia Asia Supply Chain',
        email: 'supply@columbiaasia.com',
        phone: '4324567890',
        password,
        role: 'distributor',
        organization: 'Columbia Asia Distribution',
        location: 'Yeshwanthpur, Bengaluru, Karnataka 560022',
        pincode: '560022',
        status: 'approved',
        documents: [{ 
          name: 'Medical Device Distribution License', 
          url: 'https://medchain-docs.com/distributor-6.pdf' 
        }]
      },
      {
        name: 'Artemis Hospital Supply',
        email: 'supply@artemishospitals.com',
        phone: '3215678901',
        password,
        role: 'distributor',
        organization: 'Artemis Distribution',
        location: 'Sector 51, Gurugram, Haryana 122001',
        pincode: '122001',
        status: 'approved',
        documents: [{ 
          name: 'Radiopharmaceuticals License', 
          url: 'https://medchain-docs.com/distributor-7.pdf' 
        }]
      },
      {
        name: 'Narayana Health Distribution',
        email: 'distribution@narayanahealth.com',
        phone: '2106789012',
        password,
        role: 'distributor',
        organization: 'Narayana Distribution',
        location: 'Hosur Road, Bengaluru, Karnataka 560099',
        pincode: '560099',
        status: 'approved',
        documents: [{ 
          name: 'Oncology Drugs License', 
          url: 'https://medchain-docs.com/distributor-8.pdf' 
        }]
      },
      {
        name: 'Kokilaben Hospital Supply',
        email: 'supply@kokilabenhospital.com',
        phone: '1097890123',
        password,
        role: 'distributor',
        organization: 'Kokilaben Distribution',
        location: 'Four Bungalows, Andheri West, Mumbai, Maharashtra 400053',
        pincode: '400053',
        status: 'approved',
        documents: [{ 
          name: 'Critical Care Drugs License', 
          url: 'https://medchain-docs.com/distributor-9.pdf' 
        }]
      },
      {
        name: 'Ruby Hall Clinic Distribution',
        email: 'distribution@rubyhall.com',
        phone: '0988901234',
        password,
        role: 'distributor',
        organization: 'Ruby Hall Distribution',
        location: 'Sassoon Road, Pune, Maharashtra 411001',
        pincode: '411001',
        status: 'approved',
        documents: [{ 
          name: 'Vaccine Cold Chain Certification', 
          url: 'https://medchain-docs.com/distributor-10.pdf' 
        }]
      }
    ];

    // 10 Wholesalers with detailed addresses
    const wholesalers = [
      {
        name: 'Prime Medical Wholesalers',
        email: 'sales@primemedical.com',
        phone: '9876501234',
        password,
        role: 'wholesaler',
        organization: 'Prime Medical Wholesale Ltd',
        location: 'Warehouse No. 5, MIDC Industrial Area, Andheri East, Mumbai, Maharashtra 400093',
        pincode: '400093',
        status: 'approved',
        documents: [{ 
          name: 'Wholesale Drug License MH/WDL/12345', 
          url: 'https://medchain-docs.com/wholesale-1.pdf' 
        }]
      },
      {
        name: 'MediCorp Wholesale',
        email: 'orders@medicorp.com',
        phone: '8765401234',
        password,
        role: 'wholesaler',
        organization: 'MediCorp Distributors',
        location: 'Unit No. 12, Pharma City, Jeedimetla, Hyderabad, Telangana 500055',
        pincode: '500055',
        status: 'approved',
        documents: [{ 
          name: 'GST Registration Certificate', 
          url: 'https://medchain-docs.com/wholesale-2.pdf' 
        }]
      },
      {
        name: 'Global Health Suppliers',
        email: 'supply@globalhealth.com',
        phone: '7654301234',
        password,
        role: 'wholesaler',
        organization: 'Global Health Distributors',
        location: 'Plot No. 8, Sector 18, Udyog Vihar, Gurugram, Haryana 122015',
        pincode: '122015',
        status: 'approved',
        documents: [{ 
          name: 'Import-Export Code', 
          url: 'https://medchain-docs.com/wholesale-3.pdf' 
        }]
      },
      {
        name: 'National Pharma Wholesale',
        email: 'info@nationalpharma.com',
        phone: '6543201234',
        password,
        role: 'wholesaler',
        organization: 'National Pharma Distributors',
        location: 'No. 45, Industrial Estate, Perungudi, Chennai, Tamil Nadu 600096',
        pincode: '600096',
        status: 'approved',
        documents: [{ 
          name: 'Wholesale License TN/WDL/67890', 
          url: 'https://medchain-docs.com/wholesale-4.pdf' 
        }]
      },
      {
        name: 'Elite Medical Suppliers',
        email: 'contact@elitemedical.com',
        phone: '5432101234',
        password,
        role: 'wholesaler',
        organization: 'Elite Medical Wholesale',
        location: 'Building No. 22, Peenya Industrial Area, Bengaluru, Karnataka 560058',
        pincode: '560058',
        status: 'approved',
        documents: [{ 
          name: 'Drug License Form 20B', 
          url: 'https://medchain-docs.com/wholesale-5.pdf' 
        }]
      },
      {
        name: 'MediPlus Wholesalers',
        email: 'wholesale@mediplus.com',
        phone: '4321001234',
        password,
        role: 'wholesaler',
        organization: 'MediPlus Distributors',
        location: 'Unit No. 3, Pharma Zone, Sanand Industrial Estate, Ahmedabad, Gujarat 382110',
        pincode: '382110',
        status: 'approved',
        documents: [{ 
          name: 'Schedule H License', 
          url: 'https://medchain-docs.com/wholesale-6.pdf' 
        }]
      },
      {
        name: 'Apex Medical Distributors',
        email: 'distributors@apexmedical.com',
        phone: '3210012345',
        password,
        role: 'wholesaler',
        organization: 'Apex Medical Supplies',
        location: 'Plot No. 8, Sector 5, IMT Manesar, Gurugram, Haryana 122050',
        pincode: '122050',
        status: 'approved',
        documents: [{ 
          name: 'Cold Chain Certificate', 
          url: 'https://medchain-docs.com/wholesale-7.pdf' 
        }]
      },
      {
        name: 'PrimeCare Wholesale',
        email: 'supply@primecare.com',
        phone: '2100123456',
        password,
        role: 'wholesaler',
        organization: 'PrimeCare Medical Distributors',
        location: 'Warehouse No. 9, TTC Industrial Area, Navi Mumbai, Maharashtra 400705',
        pincode: '400705',
        status: 'approved',
        documents: [{ 
          name: 'Narcotics License', 
          url: 'https://medchain-docs.com/wholesale-8.pdf' 
        }]
      },
      {
        name: 'MediLink Distributors',
        email: 'orders@medilink.com',
        phone: '1001234567',
        password,
        role: 'wholesaler',
        organization: 'MediLink Wholesale Network',
        location: 'Unit No. 12, Pharma Park, Pithampur, Indore, Madhya Pradesh 453775',
        pincode: '453775',
        status: 'approved',
        documents: [{ 
          name: 'ISO 9001:2015 Certification', 
          url: 'https://medchain-docs.com/wholesale-9.pdf' 
        }]
      },
      {
        name: 'HealthFirst Wholesale',
        email: 'wholesale@healthfirst.com',
        phone: '0012345678',
        password,
        role: 'wholesaler',
        organization: 'HealthFirst Distributors',
        location: 'Building No. 5, Pharma City, Baddi, Himachal Pradesh 173205',
        pincode: '173205',
        status: 'approved',
        documents: [{ 
          name: 'WHO-GMP Certification', 
          url: 'https://medchain-docs.com/wholesale-10.pdf' 
        }]
      }
    ];

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
        pincode: '400070',
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
        pincode: '560001',
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
        pincode: '110049',
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
        pincode: '600006',
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
        pincode: '160002',
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
        pincode: '411013',
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
        pincode: '500033',
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
        pincode: '700107',
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
        pincode: '122001',
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
        pincode: '682024',
        status: 'approved',
        documents: [{ 
          name: 'PAN Card Copy', 
          url: 'https://medchain-docs.com/retail-10.pdf' 
        }]
      }
    ];

    // 20 Pharmacies (10 all over India and 10 near Hyderabad Infosys DC)
    const pharmacies = [
      // 10 Pharmacies all over India
      {
        name: 'Apollo Pharmacy - MG Road',
        email: 'mgroad@apollopharmacy.com',
        phone: '9876504321',
        password,
        role: 'pharmacy',
        organization: 'Apollo Pharmacy',
        location: 'No. 56, Ground Floor, Brigade Road, Bengaluru, Karnataka 560001',
        pincode: '560001',
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
        pincode: '400069',
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
        pincode: '122002',
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
        pincode: '110017',
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
        pincode: '560017',
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
        pincode: '560022',
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
        pincode: '122001',
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
        pincode: '560099',
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
        pincode: '400053',
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
        pincode: '411001',
        status: 'approved',
        documents: [{ 
          name: 'Bio-Medical Waste License MH/BMW/2020', 
          url: 'https://medchain-docs.com/pharma-10.pdf' 
        }]
      },
      // 10 Pharmacies near Hyderabad Infosys DC (Pocharam area)
      {
        name: 'MedPlus - Pocharam',
        email: 'pocharam@medplus.com',
        phone: '9876512345',
        password,
        role: 'pharmacy',
        organization: 'MedPlus Health Services',
        location: 'Shop No. 5, Pocharam Main Road, Near Infosys DC, Hyderabad, Telangana 500088',
        pincode: '500088',
        status: 'approved',
        documents: [{ 
          name: 'Drug License TS/DRUG/5678', 
          url: 'https://medchain-docs.com/pharma-11.pdf' 
        }]
      },
      {
        name: 'Apollo Pharmacy - Pocharam',
        email: 'pocharam@apollopharmacy.com',
        phone: '8765123456',
        password,
        role: 'pharmacy',
        organization: 'Apollo Pharmacy',
        location: 'Plot No. 12, Infosys Road, Pocharam, Hyderabad, Telangana 500088',
        pincode: '500088',
        status: 'approved',
        documents: [{ 
          name: 'Pharmacy License TS/PH/2021/2345', 
          url: 'https://medchain-docs.com/pharma-12.pdf' 
        }]
      },
      {
        name: 'HealthPlus Medicals - Pocharam',
        email: 'pocharam@healthplus.com',
        phone: '7651234567',
        password,
        role: 'pharmacy',
        organization: 'HealthPlus Retail Chain',
        location: 'Shop No. 8, Infosys Campus Road, Pocharam, Hyderabad, Telangana 500088',
        pincode: '500088',
        status: 'approved',
        documents: [{ 
          name: 'Retail Drug License', 
          url: 'https://medchain-docs.com/pharma-13.pdf' 
        }]
      },
      {
        name: 'Wellness Forever - Pocharam',
        email: 'pocharam@wellnessforever.com',
        phone: '6542345678',
        password,
        role: 'pharmacy',
        organization: 'Wellness Forever Medicare Ltd',
        location: 'Shop No. 15, Pocharam Village, Near Infosys Gate 2, Hyderabad, Telangana 500088',
        pincode: '500088',
        status: 'approved',
        documents: [{ 
          name: 'GST Registration Certificate', 
          url: 'https://medchain-docs.com/pharma-14.pdf' 
        }]
      },
      {
        name: 'Guardian Pharmacy - Pocharam',
        email: 'pocharam@guardianpharmacy.com',
        phone: '5433456789',
        password,
        role: 'pharmacy',
        organization: 'Guardian Healthcare Services',
        location: 'Shop No. 22, Pocharam Main Road, Opposite Infosys DC, Hyderabad, Telangana 500088',
        pincode: '500088',
        status: 'approved',
        documents: [{ 
          name: 'Partnership Deed', 
          url: 'https://medchain-docs.com/pharma-15.pdf' 
        }]
      },
      {
        name: 'City Health Mart - Pocharam',
        email: 'pocharam@cityhealth.com',
        phone: '4324567890',
        password,
        role: 'pharmacy',
        organization: 'City Health Solutions',
        location: 'No. 5, Infosys Back Gate Road, Pocharam, Hyderabad, Telangana 500088',
        pincode: '500088',
        status: 'approved',
        documents: [{ 
          name: 'Shop Establishment Certificate', 
          url: 'https://medchain-docs.com/pharma-16.pdf' 
        }]
      },
      {
        name: 'Prime Medical - Pocharam',
        email: 'pocharam@primemedical.com',
        phone: '3215678901',
        password,
        role: 'pharmacy',
        organization: 'Prime Medical Distributors',
        location: 'Shop No. 3, Pocharam Market, Near Infosys DC, Hyderabad, Telangana 500088',
        pincode: '500088',
        status: 'approved',
        documents: [{ 
          name: 'Drug License Form 20B', 
          url: 'https://medchain-docs.com/pharma-17.pdf' 
        }]
      },
      {
        name: 'MediCare Retail - Pocharam',
        email: 'pocharam@medicare.com',
        phone: '2106789012',
        password,
        role: 'pharmacy',
        organization: 'MediCare Retail Solutions',
        location: 'No. 12, Infosys Employees Colony, Pocharam, Hyderabad, Telangana 500088',
        pincode: '500088',
        status: 'approved',
        documents: [{ 
          name: 'FSSAI License', 
          url: 'https://medchain-docs.com/pharma-18.pdf' 
        }]
      },
      {
        name: 'Reliance Medical - Pocharam',
        email: 'pocharam@reliancedigital.com',
        phone: '1097890123',
        password,
        role: 'pharmacy',
        organization: 'Reliance Retail Ltd',
        location: 'Ground Floor, Reliance Smart Point, Pocharam Main Road, Hyderabad, Telangana 500088',
        pincode: '500088',
        status: 'approved',
        documents: [{ 
          name: 'Corporate Registration', 
          url: 'https://medchain-docs.com/pharma-19.pdf' 
        }]
      },
       {
        name: 'MedLife Retail - Pocharam',
        email: 'pocharam@medlife.com',
        phone: '0988901234',
        password,
        role: 'pharmacy',
        organization: 'MedLife Retail Ventures',
        location: 'Shop No. 9, Pocharam Commercial Complex, Near Infosys, Hyderabad, Telangana 500088',
        pincode: '500088',
        status: 'approved',
        documents: [{ 
          name: 'Trade License', 
          url: 'https://medchain-docs.com/pharma-20.pdf' 
        }]
      }
    ];

    // Insert all users into the database
    await User.insertMany([
      ...manufacturers,
      ...distributors,
      ...wholesalers,
      ...retailers,
      ...pharmacies
    ]);

    console.log('All roles seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

seedAllRoles();