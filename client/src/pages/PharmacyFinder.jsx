import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './PharmacyFinder.css';

// Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <div className="medicine-finder-text-red-500 p-4">Map failed to load. Please try again.</div>;
    }

    return this.props.children; 
  }
}

// Fix for default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const PharmacyFinder = () => {
  const [drugName, setDrugName] = useState('');
  const [userLocation, setUserLocation] = useState('');
  const [pharmacies, setPharmacies] = useState([]);
  const [mapData, setMapData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [useCurrentLocation, setUseCurrentLocation] = useState(false);
  const [mapCenter, setMapCenter] = useState([20.5937, 78.9629]); // Default to India center
  const [zoom, setZoom] = useState(5);

  // Get current location if enabled
  useEffect(() => {
    if (useCurrentLocation && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation(`${latitude},${longitude}`);
          setMapCenter([latitude, longitude]);
          setZoom(13);
        },
        (err) => {
          setError('Could not get your location. Please enter manually.');
          setUseCurrentLocation(false);
        }
      );
    }
  }, [useCurrentLocation]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      if (!userLocation.trim()) {
        throw new Error('Please enter a location');
      }

      const [pharmaciesResponse, mapResponse] = await Promise.all([
        axios.post('http://localhost:5000/api/pharmacies/nearest-pharmacies', {
          drugName,
          userLocation: userLocation.trim()
        }),
        axios.post('http://localhost:5000/api/pharmacies/pharmacy-map-data', {
          drugName,
          userLocation: userLocation.trim()
        })
      ]);

      // Validate response data
      if (!mapResponse.data?.userLocation?.coordinates || 
          !Array.isArray(mapResponse.data.userLocation.coordinates) ||
          mapResponse.data.userLocation.coordinates.length !== 2 ||
          mapResponse.data.userLocation.coordinates.some(isNaN)) {
        throw new Error('Invalid location coordinates received');
      }

      setPharmacies(pharmaciesResponse.data?.pharmacies || []);
      setMapData(mapResponse.data);
      setMapCenter(mapResponse.data.userLocation.coordinates);
      setZoom(13);
      
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to find pharmacies');
      setPharmacies([]);
      setMapData(null);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to validate coordinates
  const isValidCoordinates = (coords) => {
    return Array.isArray(coords) && 
           coords.length === 2 && 
           !coords.some(isNaN) &&
           coords[0] >= -90 && coords[0] <= 90 && 
           coords[1] >= -180 && coords[1] <= 180;
  };

  return (
    <div className="medicine-finder-container medicine-finder-mx-auto medicine-finder-p-4">
      <h1 className="medicine-finder-text-2xl medicine-finder-font-bold medicine-finder-mb-4">Find Nearest Pharmacy</h1>
      
      <form onSubmit={handleSubmit} className="medicine-finder-mb-6">
        <div className="medicine-finder-mb-4">
          <label className="medicine-finder-block medicine-finder-text-gray-700 medicine-finder-mb-2" htmlFor="drugName">
            Drug Name
          </label>
          <input
            id="drugName"
            type="text"
            className="medicine-finder-w-full medicine-finder-p-2 medicine-finder-border medicine-finder-rounded"
            value={drugName}
            onChange={(e) => setDrugName(e.target.value)}
            required
          />
        </div>
        
        <div className="medicine-finder-mb-4">
          <label className="medicine-finder-block medicine-finder-text-gray-700 medicine-finder-mb-2" htmlFor="location">
            Your Location (e.g., "Mumbai" or "18.612224,73.8164736")
          </label>
          <input
            id="location"
            type="text"
            className="medicine-finder-w-full medicine-finder-p-2 medicine-finder-border medicine-finder-rounded"
            value={userLocation}
            onChange={(e) => setUserLocation(e.target.value)}
            disabled={useCurrentLocation}
            required
            placeholder="e.g., Mumbai or 28.6139,77.2090"
          />
          <div className="medicine-finder-mt-2">
            <label className="medicine-finder-inline-flex medicine-finder-items-center">
              <input
                type="checkbox"
                className="medicine-finder-form-checkbox"
                checked={useCurrentLocation}
                onChange={(e) => setUseCurrentLocation(e.target.checked)}
              />
              <span className="medicine-finder-ml-2">Use my current location</span>
            </label>
          </div>
        </div>
        
        <button
          type="submit"
          className="medicine-finder-bg-blue-500 medicine-finder-text-white medicine-finder-px-4 medicine-finder-py-2 medicine-finder-rounded hover:medicine-finder-bg-blue-600"
          disabled={loading}
        >
          {loading ? 'Searching...' : 'Find Pharmacies'}
        </button>
      </form>
      
      {error && <div className="medicine-finder-text-red-500 medicine-finder-mb-4">{error}</div>}
      
      {/* Map Section */}
      {mapData && isValidCoordinates(mapData.userLocation?.coordinates) && (
        <div className="medicine-finder-mt-8">
          <h2 className="medicine-finder-text-xl medicine-finder-font-semibold medicine-finder-mb-3">Pharmacy Locations</h2>
          <div className="medicine-finder-h-96 medicine-finder-w-full medicine-finder-rounded-lg medicine-finder-overflow-hidden medicine-finder-border medicine-finder-border-gray-300">
            <ErrorBoundary>
              <MapContainer 
                center={mapCenter} 
                zoom={zoom} 
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                
                {/* User Location Marker */}
                <Marker position={mapData.userLocation.coordinates}>
                  <Popup>Your Location</Popup>
                </Marker>
                
                {/* Pharmacy Markers - Only render valid coordinates */}
                {mapData.pharmacies
                  .filter(pharmacy => isValidCoordinates(pharmacy.coordinates))
                  .map(pharmacy => (
                    <Marker 
                      key={pharmacy.id} 
                      position={pharmacy.coordinates}
                    >
                      <Popup>
                        <div>
                          <h3 className="medicine-finder-font-bold">{pharmacy.name}</h3>
                          <p>{pharmacy.address}</p>
                          <p>Phone: {pharmacy.phone}</p>
                        </div>
                      </Popup>
                    </Marker>
                  ))}
                
                {/* Lines connecting user to pharmacies */}
                {mapData.pharmacies
                  .filter(pharmacy => isValidCoordinates(pharmacy.coordinates))
                  .map(pharmacy => (
                    <Polyline
                      key={pharmacy.id}
                      positions={[
                        mapData.userLocation.coordinates,
                        pharmacy.coordinates
                      ]}
                      color="blue"
                      weight={2}
                    />
                  ))}
              </MapContainer>
            </ErrorBoundary>
          </div>
        </div>
      )}
      
      {/* Pharmacy List Section */}
      {pharmacies.length > 0 && (
        <div className="medicine-finder-mt-8">
          <h2 className="medicine-finder-text-xl medicine-finder-font-semibold medicine-finder-mb-3">Nearby Pharmacies</h2>
          <div className="medicine-finder-space-y-4">
            {pharmacies.map((pharmacy) => (
              <div key={pharmacy._id} className="medicine-finder-p-4 medicine-finder-border medicine-finder-rounded medicine-finder-shadow">
                <h3 className="medicine-finder-font-bold">{pharmacy.organization || pharmacy.name}</h3>
                <p>{pharmacy.location}</p>
                <p className="medicine-finder-text-gray-600">
                  Distance: {(pharmacy.distance / 1000).toFixed(2)} km
                </p>
                <p className="medicine-finder-text-gray-600">Phone: {pharmacy.phone}</p>
                {pharmacy.walletAddress && (
                  <p className="medicine-finder-text-sm medicine-finder-text-gray-500">
                    Wallet: {pharmacy.walletAddress}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PharmacyFinder;