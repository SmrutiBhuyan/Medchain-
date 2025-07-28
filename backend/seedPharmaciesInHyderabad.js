import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from './models/User.js'; // Assuming this is your User model path

dotenv.config();

const seedHyderabadPharmacies = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    // Clear existing pharmacies in Hyderabad area
    await User.deleteMany({ 
      role: 'pharmacy',
      location: { $regex: /Hyderabad|Gachibowli|Madhapur|Kondapur|HITEC City/i }
    });

    const password = await bcrypt.hash('pharmacy@123', 10);

    // Coordinates for Infosys DC, Hyderabad (approx)
    const infosysDCLocation = {
      latitude: 17.4474,
      longitude: 78.3762
    };

    // Function to generate nearby coordinates
    const generateNearbyCoordinates = (baseLat, baseLng, radiusKm = 2) => {
      // Convert radius from km to degrees
      const radiusInDegrees = radiusKm / 111.32;
      
      // Generate random angle
      const angle = Math.random() * Math.PI * 2;
      
      // Generate random radius
      const randomRadius = Math.random() * radiusInDegrees;
      
      // Calculate new coordinates
      const newLat = baseLat + randomRadius * Math.cos(angle);
      const newLng = baseLng + randomRadius * Math.sin(angle);
      
      return { latitude: newLat, longitude: newLng };
    };

    // 50 Pharmacies near Infosys DC, Hyderabad
    const pharmacies = [
      {
        name: 'Apollo Pharmacy - Gachibowli',
        email: 'gachibowli@apollopharmacy.com',
        phone: '9876543001',
        password,
        role: 'pharmacy',
        organization: 'Apollo Pharmacy',
        location: 'Shop No. 5-9-30/1, Gachibowli Main Road, Near ICICI Bank, Hyderabad, Telangana 500032',
        status: 'approved',
        documents: [{ 
          name: 'Drug License TS/PH/2020/1234', 
          url: 'https://medchain-docs.com/hyd-pharma-1.pdf' 
        }],
        coordinates: generateNearbyCoordinates(infosysDCLocation.latitude, infosysDCLocation.longitude)
      },
      {
        name: 'MedPlus - Madhapur',
        email: 'madhapur@medplus.com',
        phone: '9876543002',
        password,
        role: 'pharmacy',
        organization: 'MedPlus Health Services',
        location: 'H.No. 1-98/1/1, Ground Floor, Madhapur Main Road, Near HITEC City Metro Station, Hyderabad, Telangana 500081',
        status: 'approved',
        documents: [{ 
          name: 'Drug License TS/DRUG/4567', 
          url: 'https://medchain-docs.com/hyd-pharma-2.pdf' 
        }],
        coordinates: generateNearbyCoordinates(infosysDCLocation.latitude, infosysDCLocation.longitude)
      },
      {
        name: 'Wellness Forever - Kondapur',
        email: 'kondapur@wellnessforever.com',
        phone: '9876543003',
        password,
        role: 'pharmacy',
        organization: 'Wellness Forever Medicare Ltd',
        location: 'Shop No. 12, Ground Floor, Sri Sairam Residency, Kondapur Main Road, Hyderabad, Telangana 500084',
        status: 'approved',
        documents: [{ 
          name: 'Retail Drug License TS/RDL/7890', 
          url: 'https://medchain-docs.com/hyd-pharma-3.pdf' 
        }],
        coordinates: generateNearbyCoordinates(infosysDCLocation.latitude, infosysDCLocation.longitude)
      },
      {
        name: 'HealthPlus - HITEC City',
        email: 'hiteccity@healthplus.com',
        phone: '9876543004',
        password,
        role: 'pharmacy',
        organization: 'HealthPlus Retail Chain',
        location: 'Plot No. 34, Ground Floor, Cyber Towers, HITEC City, Hyderabad, Telangana 500081',
        status: 'approved',
        documents: [{ 
          name: 'GST Registration Certificate', 
          url: 'https://medchain-docs.com/hyd-pharma-4.pdf' 
        }],
        coordinates: generateNearbyCoordinates(infosysDCLocation.latitude, infosysDCLocation.longitude)
      },
      {
        name: 'Guardian Pharmacy - Gachibowli',
        email: 'gachibowli@guardianpharmacy.com',
        phone: '9876543005',
        password,
        role: 'pharmacy',
        organization: 'Guardian Healthcare Services',
        location: 'Shop No. 15-20, Ground Floor, Gachibowli X Roads, Hyderabad, Telangana 500032',
        status: 'approved',
        documents: [{ 
          name: 'Schedule H License TS/SCHH/2021', 
          url: 'https://medchain-docs.com/hyd-pharma-5.pdf' 
        }],
        coordinates: generateNearbyCoordinates(infosysDCLocation.latitude, infosysDCLocation.longitude)
      },
      {
        name: 'Medicover Pharmacy - Madhapur',
        email: 'madhapur@medicover.com',
        phone: '9876543006',
        password,
        role: 'pharmacy',
        organization: 'Medicover Hospitals',
        location: 'H.No. 2-45/1, Madhapur Main Road, Near Durgam Cheruvu, Hyderabad, Telangana 500081',
        status: 'approved',
        documents: [{ 
          name: 'Hospital Pharmacy License TS/HP/3456', 
          url: 'https://medchain-docs.com/hyd-pharma-6.pdf' 
        }],
        coordinates: generateNearbyCoordinates(infosysDCLocation.latitude, infosysDCLocation.longitude)
      },
      {
        name: 'Trust Pharmacy - Kondapur',
        email: 'kondapur@trustpharmacy.com',
        phone: '9876543007',
        password,
        role: 'pharmacy',
        organization: 'Trust Healthcare',
        location: 'Shop No. 8-2-293/82/A, Road No. 1, Jubilee Hills, Kondapur, Hyderabad, Telangana 500084',
        status: 'approved',
        documents: [{ 
          name: 'Narcotics License TS/NRC/2020', 
          url: 'https://medchain-docs.com/hyd-pharma-7.pdf' 
        }],
        coordinates: generateNearbyCoordinates(infosysDCLocation.latitude, infosysDCLocation.longitude)
      },
      {
        name: 'LifeCare Pharmacy - HITEC City',
        email: 'hiteccity@lifecare.com',
        phone: '9876543008',
        password,
        role: 'pharmacy',
        organization: 'LifeCare Medical Services',
        location: 'Plot No. 56, Ground Floor, Cyber Gateway, HITEC City, Hyderabad, Telangana 500081',
        status: 'approved',
        documents: [{ 
          name: 'Psychotropic License TS/PSY/2021', 
          url: 'https://medchain-docs.com/hyd-pharma-8.pdf' 
        }],
        coordinates: generateNearbyCoordinates(infosysDCLocation.latitude, infosysDCLocation.longitude)
      },
      {
        name: 'Prime Medicals - Gachibowli',
        email: 'gachibowli@primemedicals.com',
        phone: '9876543009',
        password,
        role: 'pharmacy',
        organization: 'Prime Medical Retail',
        location: 'Shop No. 12-34, Gachibowli Main Road, Near Wipro Circle, Hyderabad, Telangana 500032',
        status: 'approved',
        documents: [{ 
          name: 'Blood Bank License TS/BLD/4567', 
          url: 'https://medchain-docs.com/hyd-pharma-9.pdf' 
        }],
        coordinates: generateNearbyCoordinates(infosysDCLocation.latitude, infosysDCLocation.longitude)
      },
      {
        name: 'City Medicos - Madhapur',
        email: 'madhapur@citymedicos.com',
        phone: '9876543010',
        password,
        role: 'pharmacy',
        organization: 'City Medicos Retail',
        location: 'H.No. 3-78/2, Madhapur Main Road, Near Inorbit Mall, Hyderabad, Telangana 500081',
        status: 'approved',
        documents: [{ 
          name: 'Vaccine Storage License TS/VAC/2021', 
          url: 'https://medchain-docs.com/hyd-pharma-10.pdf' 
        }],
        coordinates: generateNearbyCoordinates(infosysDCLocation.latitude, infosysDCLocation.longitude)
      },
      // Additional 40 pharmacies...
      {
        name: '24x7 Pharmacy - Gachibowli',
        email: 'gachibowli@24x7pharmacy.com',
        phone: '9876543011',
        password,
        role: 'pharmacy',
        organization: '24x7 Healthcare',
        location: 'Shop No. 45, Ground Floor, Gachibowli X Roads, Near Infosys Gate 2, Hyderabad, Telangana 500032',
        status: 'approved',
        documents: [{ 
          name: '24x7 Operation License', 
          url: 'https://medchain-docs.com/hyd-pharma-11.pdf' 
        }],
        coordinates: generateNearbyCoordinates(infosysDCLocation.latitude, infosysDCLocation.longitude)
      },
      {
        name: 'MedZone - Kondapur',
        email: 'kondapur@medzone.com',
        phone: '9876543012',
        password,
        role: 'pharmacy',
        organization: 'MedZone Healthcare',
        location: 'H.No. 8-3-228/1, Road No. 3, Jubilee Hills, Kondapur, Hyderabad, Telangana 500084',
        status: 'approved',
        documents: [{ 
          name: 'Schedule X License TS/SCHX/7890', 
          url: 'https://medchain-docs.com/hyd-pharma-12.pdf' 
        }],
        coordinates: generateNearbyCoordinates(infosysDCLocation.latitude, infosysDCLocation.longitude)
      },
      {
        name: 'HealthMart - HITEC City',
        email: 'hiteccity@healthmart.com',
        phone: '9876543013',
        password,
        role: 'pharmacy',
        organization: 'HealthMart Retail',
        location: 'Plot No. 67, Ground Floor, Cyber Pearl, HITEC City, Hyderabad, Telangana 500081',
        status: 'approved',
        documents: [{ 
          name: 'Bio-Medical Waste License TS/BMW/2020', 
          url: 'https://medchain-docs.com/hyd-pharma-13.pdf' 
        }],
        coordinates: generateNearbyCoordinates(infosysDCLocation.latitude, infosysDCLocation.longitude)
      },
      {
        name: 'CarePlus Pharmacy - Gachibowli',
        email: 'gachibowli@careplus.com',
        phone: '9876543014',
        password,
        role: 'pharmacy',
        organization: 'CarePlus Healthcare',
        location: 'Shop No. 23-45, Gachibowli Main Road, Near DLF Building, Hyderabad, Telangana 500032',
        status: 'approved',
        documents: [{ 
          name: 'First Aid Certification', 
          url: 'https://medchain-docs.com/hyd-pharma-14.pdf' 
        }],
        coordinates: generateNearbyCoordinates(infosysDCLocation.latitude, infosysDCLocation.longitude)
      },
      {
        name: 'MediQuick - Madhapur',
        email: 'madhapur@mediquick.com',
        phone: '9876543015',
        password,
        role: 'pharmacy',
        organization: 'MediQuick Services',
        location: 'H.No. 4-56/2, Madhapur Main Road, Near Cyberabad Police Commissionerate, Hyderabad, Telangana 500081',
        status: 'approved',
        documents: [{ 
          name: 'Emergency Medicine License', 
          url: 'https://medchain-docs.com/hyd-pharma-15.pdf' 
        }],
        coordinates: generateNearbyCoordinates(infosysDCLocation.latitude, infosysDCLocation.longitude)
      },
      {
        name: 'PharmaEasy - Kondapur',
        email: 'kondapur@pharmaeasy.com',
        phone: '9876543016',
        password,
        role: 'pharmacy',
        organization: 'PharmaEasy Retail',
        location: 'Shop No. 9-3-329/1, Road No. 5, Jubilee Hills, Kondapur, Hyderabad, Telangana 500084',
        status: 'approved',
        documents: [{ 
          name: 'Online Pharmacy License', 
          url: 'https://medchain-docs.com/hyd-pharma-16.pdf' 
        }],
        coordinates: generateNearbyCoordinates(infosysDCLocation.latitude, infosysDCLocation.longitude)
      },
      {
        name: 'MedLife - HITEC City',
        email: 'hiteccity@medlife.com',
        phone: '9876543017',
        password,
        role: 'pharmacy',
        organization: 'MedLife Healthcare',
        location: 'Plot No. 78, Ground Floor, Cyber Towers, HITEC City, Hyderabad, Telangana 500081',
        status: 'approved',
        documents: [{ 
          name: 'Home Delivery License', 
          url: 'https://medchain-docs.com/hyd-pharma-17.pdf' 
        }],
        coordinates: generateNearbyCoordinates(infosysDCLocation.latitude, infosysDCLocation.longitude)
      },
      {
        name: 'Netmeds - Gachibowli',
        email: 'gachibowli@netmeds.com',
        phone: '9876543018',
        password,
        role: 'pharmacy',
        organization: 'Netmeds Marketplace',
        location: 'Shop No. 34-56, Gachibowli X Roads, Near TCS Building, Hyderabad, Telangana 500032',
        status: 'approved',
        documents: [{ 
          name: 'E-Pharmacy License', 
          url: 'https://medchain-docs.com/hyd-pharma-18.pdf' 
        }],
        coordinates: generateNearbyCoordinates(infosysDCLocation.latitude, infosysDCLocation.longitude)
      },
      {
        name: '1mg Pharmacy - Madhapur',
        email: 'madhapur@1mg.com',
        phone: '9876543019',
        password,
        role: 'pharmacy',
        organization: '1mg Technologies',
        location: 'H.No. 5-67/3, Madhapur Main Road, Near Google Office, Hyderabad, Telangana 500081',
        status: 'approved',
        documents: [{ 
          name: 'Digital Pharmacy License', 
          url: 'https://medchain-docs.com/hyd-pharma-19.pdf' 
        }],
        coordinates: generateNearbyCoordinates(infosysDCLocation.latitude, infosysDCLocation.longitude)
      },
      {
        name: 'Practo Pharmacy - Kondapur',
        email: 'kondapur@practo.com',
        phone: '9876543020',
        password,
        role: 'pharmacy',
        organization: 'Practo Technologies',
        location: 'Shop No. 10-4-430/1, Road No. 7, Jubilee Hills, Kondapur, Hyderabad, Telangana 500084',
        status: 'approved',
        documents: [{ 
          name: 'Telemedicine License', 
          url: 'https://medchain-docs.com/hyd-pharma-20.pdf' 
        }],
        coordinates: generateNearbyCoordinates(infosysDCLocation.latitude, infosysDCLocation.longitude)
      },
      // 30 more pharmacies...
      {
        name: 'Krishna Medicals - Gachibowli',
        email: 'gachibowli@krishnamedicals.com',
        phone: '9876543021',
        password,
        role: 'pharmacy',
        organization: 'Krishna Medical Stores',
        location: 'Shop No. 12-34, Gachibowli Main Road, Near Wipro Circle, Hyderabad, Telangana 500032',
        status: 'approved',
        documents: [{ 
          name: 'Generic Medicine License', 
          url: 'https://medchain-docs.com/hyd-pharma-21.pdf' 
        }],
        coordinates: generateNearbyCoordinates(infosysDCLocation.latitude, infosysDCLocation.longitude)
      },
      {
        name: 'Sri Sai Pharma - Madhapur',
        email: 'madhapur@srisaipharma.com',
        phone: '9876543022',
        password,
        role: 'pharmacy',
        organization: 'Sri Sai Medicals',
        location: 'H.No. 6-78/4, Madhapur Main Road, Near Dell Office, Hyderabad, Telangana 500081',
        status: 'approved',
        documents: [{ 
          name: 'Ayurvedic Medicine License', 
          url: 'https://medchain-docs.com/hyd-pharma-22.pdf' 
        }],
        coordinates: generateNearbyCoordinates(infosysDCLocation.latitude, infosysDCLocation.longitude)
      },
      {
        name: 'Vinayaka Medicals - Kondapur',
        email: 'kondapur@vinayakamedicals.com',
        phone: '9876543023',
        password,
        role: 'pharmacy',
        organization: 'Vinayaka Pharma',
        location: 'Shop No. 11-5-531/1, Road No. 9, Jubilee Hills, Kondapur, Hyderabad, Telangana 500084',
        status: 'approved',
        documents: [{ 
          name: 'Homeopathic License', 
          url: 'https://medchain-docs.com/hyd-pharma-23.pdf' 
        }],
        coordinates: generateNearbyCoordinates(infosysDCLocation.latitude, infosysDCLocation.longitude)
      },
      {
        name: 'Lakshmi Pharma - HITEC City',
        email: 'hiteccity@lakshmipharma.com',
        phone: '9876543024',
        password,
        role: 'pharmacy',
        organization: 'Lakshmi Medicals',
        location: 'Plot No. 89, Ground Floor, Cyber Gateway, HITEC City, Hyderabad, Telangana 500081',
        status: 'approved',
        documents: [{ 
          name: 'Siddha Medicine License', 
          url: 'https://medchain-docs.com/hyd-pharma-24.pdf' 
        }],
        coordinates: generateNearbyCoordinates(infosysDCLocation.latitude, infosysDCLocation.longitude)
      },
      {
        name: 'Ganesh Medicals - Gachibowli',
        email: 'gachibowli@ganeshmedicals.com',
        phone: '9876543025',
        password,
        role: 'pharmacy',
        organization: 'Ganesh Pharma',
        location: 'Shop No. 45-67, Gachibowli X Roads, Near Microsoft Building, Hyderabad, Telangana 500032',
        status: 'approved',
        documents: [{ 
          name: 'Unani Medicine License', 
          url: 'https://medchain-docs.com/hyd-pharma-25.pdf' 
        }],
        coordinates: generateNearbyCoordinates(infosysDCLocation.latitude, infosysDCLocation.longitude)
      },
      {
        name: 'Balaji Pharma - Madhapur',
        email: 'madhapur@balajipharma.com',
        phone: '9876543026',
        password,
        role: 'pharmacy',
        organization: 'Balaji Medicals',
        location: 'H.No. 7-89/5, Madhapur Main Road, Near Amazon Office, Hyderabad, Telangana 500081',
        status: 'approved',
        documents: [{ 
          name: 'Nutritional Supplements License', 
          url: 'https://medchain-docs.com/hyd-pharma-26.pdf' 
        }],
        coordinates: generateNearbyCoordinates(infosysDCLocation.latitude, infosysDCLocation.longitude)
      },
      {
        name: 'Sai Baba Medicals - Kondapur',
        email: 'kondapur@saibabamedicals.com',
        phone: '9876543027',
        password,
        role: 'pharmacy',
        organization: 'Sai Baba Pharma',
        location: 'Shop No. 12-6-632/1, Road No. 11, Jubilee Hills, Kondapur, Hyderabad, Telangana 500084',
        status: 'approved',
        documents: [{ 
          name: 'Medical Equipment License', 
          url: 'https://medchain-docs.com/hyd-pharma-27.pdf' 
        }],
        coordinates: generateNearbyCoordinates(infosysDCLocation.latitude, infosysDCLocation.longitude)
      },
      {
        name: 'Venkateswara Medicals - HITEC City',
        email: 'hiteccity@venkateswaramedicals.com',
        phone: '9876543028',
        password,
        role: 'pharmacy',
        organization: 'Venkateswara Pharma',
        location: 'Plot No. 90, Ground Floor, Cyber Pearl, HITEC City, Hyderabad, Telangana 500081',
        status: 'approved',
        documents: [{ 
          name: 'Surgical Items License', 
          url: 'https://medchain-docs.com/hyd-pharma-28.pdf' 
        }],
        coordinates: generateNearbyCoordinates(infosysDCLocation.latitude, infosysDCLocation.longitude)
      },
      {
        name: 'Shiva Pharma - Gachibowli',
        email: 'gachibowli@shivapharma.com',
        phone: '9876543029',
        password,
        role: 'pharmacy',
        organization: 'Shiva Medicals',
        location: 'Shop No. 56-78, Gachibowli X Roads, Near Infosys Gate 1, Hyderabad, Telangana 500032',
        status: 'approved',
        documents: [{ 
          name: 'Diagnostic Equipment License', 
          url: 'https://medchain-docs.com/hyd-pharma-29.pdf' 
        }],
        coordinates: generateNearbyCoordinates(infosysDCLocation.latitude, infosysDCLocation.longitude)
      },
      {
        name: 'Parvathi Medicals - Madhapur',
        email: 'madhapur@parvathimedical.com',
        phone: '9876543030',
        password,
        role: 'pharmacy',
        organization: 'Parvathi Pharma',
        location: 'H.No. 8-90/6, Madhapur Main Road, Near Facebook Office, Hyderabad, Telangana 500081',
        status: 'approved',
        documents: [{ 
          name: 'Disposable Items License', 
          url: 'https://medchain-docs.com/hyd-pharma-30.pdf' 
        }],
        coordinates: generateNearbyCoordinates(infosysDCLocation.latitude, infosysDCLocation.longitude)
      },
      // 20 more pharmacies...
      {
        name: 'Vijaya Medicals - Kondapur',
        email: 'kondapur@vijayamedicals.com',
        phone: '9876543031',
        password,
        role: 'pharmacy',
        organization: 'Vijaya Pharma',
        location: 'Shop No. 13-7-733/1, Road No. 13, Jubilee Hills, Kondapur, Hyderabad, Telangana 500084',
        status: 'approved',
        documents: [{ 
          name: 'Orthopedic Items License', 
          url: 'https://medchain-docs.com/hyd-pharma-31.pdf' 
        }],
        coordinates: generateNearbyCoordinates(infosysDCLocation.latitude, infosysDCLocation.longitude)
      },
      {
        name: 'Anjaneya Medicals - HITEC City',
        email: 'hiteccity@anjaneyamedicals.com',
        phone: '9876543032',
        password,
        role: 'pharmacy',
        organization: 'Anjaneya Pharma',
        location: 'Plot No. 101, Ground Floor, Cyber Towers, HITEC City, Hyderabad, Telangana 500081',
        status: 'approved',
        documents: [{ 
          name: 'Dental Items License', 
          url: 'https://medchain-docs.com/hyd-pharma-32.pdf' 
        }],
        coordinates: generateNearbyCoordinates(infosysDCLocation.latitude, infosysDCLocation.longitude)
      },
      {
        name: 'Hanuman Medicals - Gachibowli',
        email: 'gachibowli@hanumanmedicals.com',
        phone: '9876543033',
        password,
        role: 'pharmacy',
        organization: 'Hanuman Pharma',
        location: 'Shop No. 67-89, Gachibowli X Roads, Near TCS Building, Hyderabad, Telangana 500032',
        status: 'approved',
        documents: [{ 
          name: 'Ophthalmic Items License', 
          url: 'https://medchain-docs.com/hyd-pharma-33.pdf' 
        }],
        coordinates: generateNearbyCoordinates(infosysDCLocation.latitude, infosysDCLocation.longitude)
      },
      {
        name: 'Rama Medicals - Madhapur',
        email: 'madhapur@ramamedicals.com',
        phone: '9876543034',
        password,
        role: 'pharmacy',
        organization: 'Rama Pharma',
        location: 'H.No. 9-01/7, Madhapur Main Road, Near Oracle Office, Hyderabad, Telangana 500081',
        status: 'approved',
        documents: [{ 
          name: 'ENT Items License', 
          url: 'https://medchain-docs.com/hyd-pharma-34.pdf' 
        }],
        coordinates: generateNearbyCoordinates(infosysDCLocation.latitude, infosysDCLocation.longitude)
      },
      {
        name: 'Krishna Medicals - Kondapur',
        email: 'kondapur@krishnamedicals.com',
        phone: '9876543035',
        password,
        role: 'pharmacy',
        organization: 'Krishna Pharma',
        location: 'Shop No. 14-8-834/1, Road No. 15, Jubilee Hills, Kondapur, Hyderabad, Telangana 500084',
        status: 'approved',
        documents: [{ 
          name: 'Veterinary Items License', 
          url: 'https://medchain-docs.com/hyd-pharma-35.pdf' 
        }],
        coordinates: generateNearbyCoordinates(infosysDCLocation.latitude, infosysDCLocation.longitude)
      },
      {
        name: 'Govinda Medicals - HITEC City',
        email: 'hiteccity@govindamedicals.com',
        phone: '9876543036',
        password,
        role: 'pharmacy',
        organization: 'Govinda Pharma',
        location: 'Plot No. 112, Ground Floor, Cyber Gateway, HITEC City, Hyderabad, Telangana 500081',
        status: 'approved',
        documents: [{ 
          name: 'Physiotherapy Items License', 
          url: 'https://medchain-docs.com/hyd-pharma-36.pdf' 
        }],
        coordinates: generateNearbyCoordinates(infosysDCLocation.latitude, infosysDCLocation.longitude)
      },
      {
        name: 'Gopal Medicals - Gachibowli',
        email: 'gachibowli@gopalmedicals.com',
        phone: '9876543037',
        password,
        role: 'pharmacy',
        organization: 'Gopal Pharma',
        location: 'Shop No. 78-90, Gachibowli X Roads, Near Wipro Circle, Hyderabad, Telangana 500032',
        status: 'approved',
        documents: [{ 
          name: 'Laboratory Items License', 
          url: 'https://medchain-docs.com/hyd-pharma-37.pdf' 
        }],
        coordinates: generateNearbyCoordinates(infosysDCLocation.latitude, infosysDCLocation.longitude)
      },
      {
        name: 'Radha Medicals - Madhapur',
        email: 'madhapur@radhamedicals.com',
        phone: '9876543038',
        password,
        role: 'pharmacy',
        organization: 'Radha Pharma',
        location: 'H.No. 10-12/8, Madhapur Main Road, Near Google Office, Hyderabad, Telangana 500081',
        status: 'approved',
        documents: [{ 
          name: 'Hospital Furniture License', 
          url: 'https://medchain-docs.com/hyd-pharma-38.pdf' 
        }],
        coordinates: generateNearbyCoordinates(infosysDCLocation.latitude, infosysDCLocation.longitude)
      },
      {
        name: 'Sita Medicals - Kondapur',
        email: 'kondapur@sitamedicals.com',
        phone: '9876543039',
        password,
        role: 'pharmacy',
        organization: 'Sita Pharma',
        location: 'Shop No. 15-9-935/1, Road No. 17, Jubilee Hills, Kondapur, Hyderabad, Telangana 500084',
        status: 'approved',
        documents: [{ 
          name: 'Patient Care Items License', 
          url: 'https://medchain-docs.com/hyd-pharma-39.pdf' 
        }],
        coordinates: generateNearbyCoordinates(infosysDCLocation.latitude, infosysDCLocation.longitude)
      },
      {
        name: 'Laxmi Medicals - HITEC City',
        email: 'hiteccity@laxmimedical.com',
        phone: '9876543040',
        password,
        role: 'pharmacy',
        organization: 'Laxmi Pharma',
        location: 'Plot No. 123, Ground Floor, Cyber Pearl, HITEC City, Hyderabad, Telangana 500081',
        status: 'approved',
        documents: [{ 
          name: 'First Aid Items License', 
          url: 'https://medchain-docs.com/hyd-pharma-40.pdf' 
        }],
        coordinates: generateNearbyCoordinates(infosysDCLocation.latitude, infosysDCLocation.longitude)
      },
      // 10 more pharmacies...
      {
        name: 'Sarswathi Medicals - Gachibowli',
        email: 'gachibowli@sarswathimedical.com',
        phone: '9876543041',
        password,
        role: 'pharmacy',
        organization: 'Sarswathi Pharma',
        location: 'Shop No. 89-01, Gachibowli X Roads, Near Infosys Gate 2, Hyderabad, Telangana 500032',
        status: 'approved',
        documents: [{ 
          name: 'Maternity Items License', 
          url: 'https://medchain-docs.com/hyd-pharma-41.pdf' 
        }],
        coordinates: generateNearbyCoordinates(infosysDCLocation.latitude, infosysDCLocation.longitude)
      },
      {
        name: 'Ganga Medicals - Madhapur',
        email: 'madhapur@gangamedicals.com',
        phone: '9876543042',
        password,
        role: 'pharmacy',
        organization: 'Ganga Pharma',
        location: 'H.No. 11-23/9, Madhapur Main Road, Near Dell Office, Hyderabad, Telangana 500081',
        status: 'approved',
        documents: [{ 
          name: 'Neonatal Items License', 
          url: 'https://medchain-docs.com/hyd-pharma-42.pdf' 
        }],
        coordinates: generateNearbyCoordinates(infosysDCLocation.latitude, infosysDCLocation.longitude)
      },
      {
        name: 'Yamuna Medicals - Kondapur',
        email: 'kondapur@yamunamedicals.com',
        phone: '9876543043',
        password,
        role: 'pharmacy',
        organization: 'Yamuna Pharma',
        location: 'Shop No. 16-10-1036/1, Road No. 19, Jubilee Hills, Kondapur, Hyderabad, Telangana 500084',
        status: 'approved',
        documents: [{ 
          name: 'Pediatric Items License', 
          url: 'https://medchain-docs.com/hyd-pharma-43.pdf' 
        }],
        coordinates: generateNearbyCoordinates(infosysDCLocation.latitude, infosysDCLocation.longitude)
      },
      {
        name: 'Narmada Medicals - HITEC City',
        email: 'hiteccity@narmadamedical.com',
        phone: '9876543044',
        password,
        role: 'pharmacy',
        organization: 'Narmada Pharma',
        location: 'Plot No. 134, Ground Floor, Cyber Towers, HITEC City, Hyderabad, Telangana 500081',
        status: 'approved',
        documents: [{ 
          name: 'Geriatric Items License', 
          url: 'https://medchain-docs.com/hyd-pharma-44.pdf' 
        }],
        coordinates: generateNearbyCoordinates(infosysDCLocation.latitude, infosysDCLocation.longitude)
      },
      {
        name: 'Godavari Medicals - Gachibowli',
        email: 'gachibowli@godavarimedical.com',
        phone: '9876543045',
        password,
        role: 'pharmacy',
        organization: 'Godavari Pharma',
        location: 'Shop No. 90-12, Gachibowli X Roads, Near Microsoft Building, Hyderabad, Telangana 500032',
        status: 'approved',
        documents: [{ 
          name: 'Critical Care Items License', 
          url: 'https://medchain-docs.com/hyd-pharma-45.pdf' 
        }],
        coordinates: generateNearbyCoordinates(infosysDCLocation.latitude, infosysDCLocation.longitude)
      },
      {
        name: 'Kaveri Medicals - Madhapur',
        email: 'madhapur@kaverimedical.com',
        phone: '9876543046',
        password,
        role: 'pharmacy',
        organization: 'Kaveri Pharma',
        location: 'H.No. 12-34/10, Madhapur Main Road, Near Amazon Office, Hyderabad, Telangana 500081',
        status: 'approved',
        documents: [{ 
          name: 'Emergency Care Items License', 
          url: 'https://medchain-docs.com/hyd-pharma-46.pdf' 
        }],
        coordinates: generateNearbyCoordinates(infosysDCLocation.latitude, infosysDCLocation.longitude)
      },
      {
        name: 'Tungabhadra Medicals - Kondapur',
        email: 'kondapur@tungabhadramedical.com',
        phone: '9876543047',
        password,
        role: 'pharmacy',
        organization: 'Tungabhadra Pharma',
        location: 'Shop No. 17-11-1137/1, Road No. 21, Jubilee Hills, Kondapur, Hyderabad, Telangana 500084',
        status: 'approved',
        documents: [{ 
          name: 'Ambulance Equipment License', 
          url: 'https://medchain-docs.com/hyd-pharma-47.pdf' 
        }],
        coordinates: generateNearbyCoordinates(infosysDCLocation.latitude, infosysDCLocation.longitude)
      },
      {
        name: 'Bhima Medicals - HITEC City',
        email: 'hiteccity@bhimamedical.com',
        phone: '9876543048',
        password,
        role: 'pharmacy',
        organization: 'Bhima Pharma',
        location: 'Plot No. 145, Ground Floor, Cyber Gateway, HITEC City, Hyderabad, Telangana 500081',
        status: 'approved',
        documents: [{ 
          name: 'Disaster Management Items License', 
          url: 'https://medchain-docs.com/hyd-pharma-48.pdf' 
        }],
        coordinates: generateNearbyCoordinates(infosysDCLocation.latitude, infosysDCLocation.longitude)
      },
      {
        name: 'Krishnaveni Medicals - Gachibowli',
        email: 'gachibowli@krishnavenimedical.com',
        phone: '9876543049',
        password,
        role: 'pharmacy',
        organization: 'Krishnaveni Pharma',
        location: 'Shop No. 01-23, Gachibowli X Roads, Near TCS Building, Hyderabad, Telangana 500032',
        status: 'approved',
        documents: [{ 
          name: 'Pandemic Management Items License', 
          url: 'https://medchain-docs.com/hyd-pharma-49.pdf' 
        }],
        coordinates: generateNearbyCoordinates(infosysDCLocation.latitude, infosysDCLocation.longitude)
      },
      {
        name: 'Pampa Medicals - Madhapur',
        email: 'madhapur@pampamedical.com',
        phone: '9876543050',
        password,
        role: 'pharmacy',
        organization: 'Pampa Pharma',
        location: 'H.No. 13-45/11, Madhapur Main Road, Near Facebook Office, Hyderabad, Telangana 500081',
        status: 'approved',
        documents: [{ 
          name: 'Quarantine Items License', 
          url: 'https://medchain-docs.com/hyd-pharma-50.pdf' 
        }],
        coordinates: generateNearbyCoordinates(infosysDCLocation.latitude, infosysDCLocation.longitude)
      }
    ];

    await User.insertMany(pharmacies);
    console.log('✅ 50 Pharmacies near Infosys DC, Hyderabad seeded successfully!');
    process.exit();
  } catch (err) {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  }
};

seedHyderabadPharmacies();