import React, { useState } from 'react';
import axios from 'axios';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './PharmacyFinder.css';

// Fix for default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Utility function for rate limiting
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

const PharmacyFinder = () => {
  const [drugName, setDrugName] = useState('');
  const [pincode, setPincode] = useState('');
  const [pharmacies, setPharmacies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mapCenter, setMapCenter] = useState([20.5937, 78.9629]);
  const [zoom, setZoom] = useState(5);

  const geocodePharmacy = async (pharmacy) => {
    try {
      // Try with full address first
      let geoResponse = await axios.get('https://nominatim.openstreetmap.org/search', {
        params: {
          q: `${pharmacy.name}, ${pharmacy.location}, ${pharmacy.pincode}, India`,
          format: 'json',
          limit: 1,
          addressdetails: 1
        }
      });

      // Fallback to just pincode if needed
      if (!geoResponse.data?.length) {
        geoResponse = await axios.get('https://nominatim.openstreetmap.org/search', {
          params: {
            postalcode: pharmacy.pincode,
            country: 'India',
            format: 'json',
            limit: 1
          }
        });
      }

      return geoResponse.data?.[0] || null;
    } catch (e) {
      console.error('Geocoding failed:', e);
      return null;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setPharmacies([]);

    try {
      if (!pincode.trim() || !/^\d{6}$/.test(pincode)) {
        throw new Error('Please enter a valid 6-digit Indian pincode');
      }

      // Geocode the pincode to get coordinates
      const geocodeResponse = await axios.get('https://nominatim.openstreetmap.org/search', {
        params: {
          postalcode: pincode,
          country: 'India',
          format: 'json',
          limit: 1
        }
      });

      if (!geocodeResponse.data || geocodeResponse.data.length === 0) {
        throw new Error('Could not find location for this pincode');
      }

      const location = geocodeResponse.data[0];
      const coordinates = [parseFloat(location.lat), parseFloat(location.lon)];
      setMapCenter(coordinates);
      setZoom(13);

      // Find pharmacies
      const response = await axios.post('http://localhost:5000/api/pharmacies/nearest-pharmacies', {
        drugName,
        userLocation: pincode.trim()
      });

      if (!response.data.pharmacies || response.data.pharmacies.length === 0) {
        throw new Error('No pharmacies found with this drug in your area');
      }

      // Geocode pharmacies with delay between requests
      const pharmaciesWithCoords = await Promise.all(
        response.data.pharmacies.map(async (pharmacy, index) => {
          await delay(index * 1000); // 1 second between requests
          const result = await geocodePharmacy(pharmacy);
          return result ? {
            ...pharmacy,
            coordinates: [parseFloat(result.lat), parseFloat(result.lon)]
          } : null;
        })
      );

      const validPharmacies = pharmaciesWithCoords.filter(p => p !== null);

      if (validPharmacies.length === 0) {
        // Fallback - show pharmacies without precise locations
        setPharmacies(response.data.pharmacies.map(p => ({
          ...p,
          coordinates: coordinates // Use search center as fallback
        })));
        setError('Showing nearby pharmacies - exact locations unavailable');
      } else {
        setPharmacies(validPharmacies);
      }

    } catch (err) {
      console.error('Search error:', err);
      setError(err.response?.data?.message || err.message || 'Failed to find pharmacies');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="medicine-finder-container">
      <h1>Find Pharmacies by Pincode</h1>

      <form onSubmit={handleSubmit}>
        <div className="input-group">
          <label htmlFor="drugName">Drug Name</label>
          <input
            id="drugName"
            type="text"
            value={drugName}
            onChange={(e) => setDrugName(e.target.value)}
            required
          />
        </div>

        <div className="input-group">
          <label htmlFor="pincode">6-digit Pincode</label>
          <input
            id="pincode"
            type="text"
            pattern="[0-9]{6}"
            maxLength="6"
            value={pincode}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, '').slice(0, 6);
              setPincode(val);
            }}
            required
            placeholder="e.g., 500088"
          />
        </div>

        <button type="submit" disabled={loading}>
          {loading ? 'Searching...' : 'Find Pharmacies'}
        </button>
      </form>

      {error && <div className="error-message">{error}</div>}

      <div className="map-and-list-container">
        <div className="map-container">
          <MapContainer center={mapCenter} zoom={zoom} style={{ height: '500px', width: '100%' }}>
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />

            <Marker position={mapCenter}>
              <Popup>Search Center: {pincode}</Popup>
            </Marker>

            {pharmacies.map((pharmacy) => (
              <Marker key={pharmacy._id} position={pharmacy.coordinates}>
                <Popup>
                  <div>
                    <h3>{pharmacy.organization || pharmacy.name}</h3>
                    <p>{pharmacy.location}</p>
                    <p>Pincode: {pharmacy.pincode}</p>
                    <p>Phone: {pharmacy.phone}</p>
                    <p>Available Drug: {pharmacy.drugName}</p>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>

        {pharmacies.length > 0 && (
          <div className="pharmacy-list">
            <h2>Pharmacies in Pincode: {pincode}</h2>
            <div className="pharmacy-cards">
              {pharmacies.map((pharmacy) => (
                <div key={pharmacy._id} className="pharmacy-card">
                  <h3>{pharmacy.organization || pharmacy.name}</h3>
                  <p><strong>Address:</strong> {pharmacy.location}</p>
                  <p><strong>Pincode:</strong> {pharmacy.pincode}</p>
                  <p><strong>Phone:</strong> {pharmacy.phone}</p>
                  <p><strong>Available Drug:</strong> {pharmacy.drugName}</p>
                  {pharmacy.manufacturer && (
                    <p><strong>Manufacturer:</strong> {pharmacy.manufacturer.organization || pharmacy.manufacturer.name}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PharmacyFinder;