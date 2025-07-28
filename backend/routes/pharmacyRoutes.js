import express from 'express';
import Drug from '../models/Drug.js';
import User from '../models/User.js';
import axios from 'axios';

const router = express.Router();

// Configuration for geocoding service
const GEOCODING_PROVIDER = 'nominatim'; // or 'google'
const GOOGLE_MAPS_API_KEY = 'YOUR_GOOGLE_MAPS_API_KEY'; // Only needed if using Google

// Helper function to calculate distance using Haversine formula
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Earth radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

// Geocoding function with fallback options
async function geocodeLocation(location) {
  // If it's already in lat,lng format
  if (/^-?\d+\.\d+,-?\d+\.\d+$/.test(location)) {
    return {
      coordinates: location.split(',').map(Number),
      address: location
    };
  }

  try {
    let response;
    
    if (GEOCODING_PROVIDER === 'google') {
      // Using Google Maps Geocoding API
      response = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
        params: {
          address: location,
          key: GOOGLE_MAPS_API_KEY
        }
      });
      
      if (response.data.results && response.data.results.length > 0) {
        const result = response.data.results[0];
        return {
          coordinates: [result.geometry.location.lat, result.geometry.location.lng],
          address: result.formatted_address
        };
      }
    } else {
      // Using OpenStreetMap Nominatim as fallback
      response = await axios.get('https://nominatim.openstreetmap.org/search', {
        params: {
          q: location,
          format: 'json',
          limit: 1
        },
        headers: {
          'User-Agent': 'Your-App-Name' // Required by Nominatim
        }
      });
      
      if (response.data && response.data.length > 0) {
        const result = response.data[0];
        return {
          coordinates: [parseFloat(result.lat), parseFloat(result.lon)],
          address: result.display_name
        };
      }
    }
    
    throw new Error('Location not found');
  } catch (error) {
    console.error('Geocoding error:', error);
    throw new Error('Could not geocode location. Please try a different location or use coordinates (latitude,longitude).');
  }
}

// Find nearest pharmacies for a drug
router.post('/nearest-pharmacies', async (req, res) => {
  try {
    const { drugName, userLocation } = req.body;

    // Geocode the user's location
    const geocoded = await geocodeLocation(userLocation);
    const [userLat, userLng] = geocoded.coordinates;

    // First find all approved pharmacies (retailers)
    const allPharmacies = await User.find({
      role: 'retailer', // or 'pharmacy' depending on your schema
      status: 'approved'
    });

    // Then find drugs that reference these pharmacies in their unitBarcodes
    const drugs = await Drug.find({ 
      name: drugName,
      'unitBarcodes.pharmacy': { 
        $in: allPharmacies.map(p => p._id) 
      },
      'unitBarcodes.status': 'in-stock' // Only include in-stock items
    }).populate({
      path: 'unitBarcodes.pharmacy',
      model: 'User',
      match: { status: 'approved' } // Ensure only approved pharmacies are populated
    });

    if (!drugs || drugs.length === 0) {
      return res.status(404).json({ 
        message: 'Drug not found in any nearby pharmacy' 
      });
    }

    // Get unique pharmacies from all unit barcodes
    const pharmacyMap = new Map();
    drugs.forEach(drug => {
      drug.unitBarcodes.forEach(unit => {
        if (unit.pharmacy && !pharmacyMap.has(unit.pharmacy._id.toString())) {
          // Extract coordinates from pharmacy location
          let pharmacyLat, pharmacyLng;
          try {
            [pharmacyLat, pharmacyLng] = unit.pharmacy.location.split(',').map(Number);
          } catch (e) {
            console.error('Invalid pharmacy location format:', unit.pharmacy.location);
            return; // Skip this pharmacy if location is invalid
          }
          
          const distance = calculateDistance(userLat, userLng, pharmacyLat, pharmacyLng);
          
          pharmacyMap.set(unit.pharmacy._id.toString(), {
            ...unit.pharmacy._doc,
            distance,
            drugName: drugName,
            drugId: drug._id
          });
        }
      });
    });

    const pharmaciesWithDistance = Array.from(pharmacyMap.values());

    if (pharmaciesWithDistance.length === 0) {
      return res.status(404).json({ 
        message: 'No pharmacies found with this drug in stock' 
      });
    }

    // Sort by distance (nearest first)
    pharmaciesWithDistance.sort((a, b) => a.distance - b.distance);

    res.json({
      pharmacies: pharmaciesWithDistance,
      userLocation: geocoded.address,
      coordinates: geocoded.coordinates
    });
  } catch (error) {
    console.error('Error finding nearest pharmacies:', error);
    res.status(500).json({ 
      message: error.message || 'Server error',
      details: error.stack 
    });
  }
});

// Get pharmacy data for map visualization
router.post('/pharmacy-map-data', async (req, res) => {
  try {
    const { drugName, userLocation } = req.body;

    // Geocode the user's location
    const geocoded = await geocodeLocation(userLocation);
    const userCoords = geocoded.coordinates;

    // Find approved pharmacies first
    const allPharmacies = await User.find({
      role: 'retailer',
      status: 'approved'
    });

    // Find drugs that reference these pharmacies
    const drugs = await Drug.find({ 
      name: drugName,
      'unitBarcodes.pharmacy': { 
        $in: allPharmacies.map(p => p._id) 
      },
      'unitBarcodes.status': 'in-stock'
    }).populate({
      path: 'unitBarcodes.pharmacy',
      model: 'User',
      match: { status: 'approved' }
    });

    if (!drugs || drugs.length === 0) {
      return res.status(404).json({ message: 'Drug not found in any pharmacy' });
    }

    // Get unique pharmacies from unit barcodes
    const pharmacyMap = new Map();
    drugs.forEach(drug => {
      drug.unitBarcodes.forEach(unit => {
        if (unit.pharmacy && !pharmacyMap.has(unit.pharmacy._id.toString())) {
          try {
            const coords = unit.pharmacy.location.split(',').map(Number);
            pharmacyMap.set(unit.pharmacy._id.toString(), {
              id: unit.pharmacy._id,
              name: unit.pharmacy.organization || unit.pharmacy.name,
              location: unit.pharmacy.location,
              coordinates: coords,
              address: unit.pharmacy.location,
              phone: unit.pharmacy.phone,
              drugName: drugName,
              drugId: drug._id
            });
          } catch (e) {
            console.error('Invalid pharmacy location:', unit.pharmacy.location);
          }
        }
      });
    });

    const pharmacyData = Array.from(pharmacyMap.values());

    if (pharmacyData.length === 0) {
      return res.status(404).json({ message: 'No pharmacies found with this drug' });
    }

    res.json({
      userLocation: {
        coordinates: userCoords,
        address: geocoded.address
      },
      pharmacies: pharmacyData
    });
  } catch (error) {
    console.error('Error getting map data:', error);
    res.status(500).json({ 
      message: error.message || 'Server error',
      details: error.stack 
    });
  }
});

export default router;