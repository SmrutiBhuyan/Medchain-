import React, { useState, useEffect } from 'react';
import { LoadScript, GoogleMap, DirectionsService, DirectionsRenderer } from '@react-google-maps/api';
import { AdvancedMarker } from '@vis.gl/react-google-maps';
import './RouteOptimizer.css';

// Define libraries array outside component to prevent re-creation
const LIBRARIES = ['places', 'marker'];

const RouteOptimizer = ({ 
  origin, 
  destination, 
  onClose,
}) => {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const [response, setResponse] = useState(null);
  const [distance, setDistance] = useState('');
  const [duration, setDuration] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [originCoords, setOriginCoords] = useState(null);
  const [destCoords, setDestCoords] = useState(null);
  const [geocodingStatus, setGeocodingStatus] = useState('Geocoding addresses...');
  const [scriptLoaded, setScriptLoaded] = useState(false);

  const containerStyle = {
    width: '100%',
    height: '400px'
  };

  // Geocode addresses to get coordinates
  useEffect(() => {
    if (!scriptLoaded) return;

    const geocodeAddress = async (address) => {
      try {
        const geocoder = new window.google.maps.Geocoder();
        return new Promise((resolve, reject) => {
          geocoder.geocode({ address }, (results, status) => {
            if (status === 'OK') {
              resolve({
                lat: results[0].geometry.location.lat(),
                lng: results[0].geometry.location.lng(),
                formattedAddress: results[0].formatted_address
              });
            } else {
              reject(new Error(`Geocoding failed: ${status}`));
            }
          });
        });
      } catch (err) {
        throw err;
      }
    };

    const geocodeBothAddresses = async () => {
      try {
        setGeocodingStatus('Geocoding origin address...');
        const originResult = await geocodeAddress(origin.address);
        setOriginCoords(originResult);

        setGeocodingStatus('Geocoding destination address...');
        const destResult = await geocodeAddress(destination.address);
        setDestCoords(destResult);

        setGeocodingStatus('Geocoding complete');
        return true;
      } catch (error) {
        setError(`Failed to geocode addresses: ${error.message}`);
        setLoading(false);
        return false;
      }
    };

    if (origin && destination) {
      geocodeBothAddresses();
    }
  }, [origin, destination, scriptLoaded]);

  const directionsCallback = (result, status) => {
    if (status === 'OK') {
      setResponse(result);
      setDistance(result.routes[0].legs[0].distance.text);
      setDuration(result.routes[0].legs[0].duration.text);
      setLoading(false);
    } else if (status === 'ZERO_RESULTS') {
      setError('No route could be found between the origin and destination');
      setLoading(false);
    } else {
      setError('Error fetching directions. Please try again.');
      setLoading(false);
    }
  };

  return (
    <LoadScript
      googleMapsApiKey={apiKey}
      libraries={LIBRARIES} // Using the constant defined outside component
      onLoad={() => setScriptLoaded(true)}
      onError={() => setError('Failed to load Google Maps API')}
    >
      <div className="route-optimizer-modal">
        <div className="route-optimizer-content">
          <div className="route-optimizer-header">
            <h3>Route Optimization</h3>
            <button onClick={onClose} className="close-btn">&times;</button>
          </div>
          
          <div className="route-info">
            <div>
              <strong>From:</strong> {originCoords?.formattedAddress || origin.address}
            </div>
            <div>
              <strong>To:</strong> {destCoords?.formattedAddress || destination.address}
            </div>
          </div>

          {loading && (
            <div className="loading">
              {geocodingStatus}
              {originCoords && destCoords && 'Calculating best route...'}
            </div>
          )}
          
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          {!error && scriptLoaded && originCoords && destCoords && (
            <div className="route-details">
              {distance && duration && (
                <div className="route-stats">
                  <div><strong>Distance:</strong> {distance}</div>
                  <div><strong>Estimated Time:</strong> {duration}</div>
                </div>
              )}
              
              <div className="map-container">
                <GoogleMap
                  mapContainerStyle={containerStyle}
                  center={originCoords}
                  zoom={7}
                >
                  <>
                    <AdvancedMarker position={originCoords} title="Origin">
                      <div style={{ color: 'white', background: 'blue', padding: '4px 8px', borderRadius: '50%' }}>
                        O
                      </div>
                    </AdvancedMarker>
                    <AdvancedMarker position={destCoords} title="Destination">
                      <div style={{ color: 'white', background: 'red', padding: '4px 8px', borderRadius: '50%' }}>
                        D
                      </div>
                    </AdvancedMarker>
                    <DirectionsService
                      options={{
                        destination: destCoords,
                        origin: originCoords,
                        travelMode: 'DRIVING',
                        provideRouteAlternatives: true
                      }}
                      callback={directionsCallback}
                    />
                    
                    {response && (
                      <DirectionsRenderer
                        options={{
                          directions: response,
                          suppressMarkers: true
                        }}
                      />
                    )}
                  </>
                </GoogleMap>
              </div>
            </div>
          )}
        </div>
      </div>
    </LoadScript>
  );
};

export default RouteOptimizer;