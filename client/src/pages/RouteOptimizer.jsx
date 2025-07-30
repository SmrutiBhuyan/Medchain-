import React, { useState, useEffect } from 'react';
import { LoadScript, GoogleMap, DirectionsService, DirectionsRenderer, TrafficLayer } from '@react-google-maps/api';
import { AdvancedMarker } from '@vis.gl/react-google-maps';
import axios from 'axios';
import './RouteOptimizer.css';

const LIBRARIES = ['places', 'marker', 'visualization'];

const RouteOptimizer = ({ 
  origin, 
  destination, 
  onClose,
}) => {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const weatherApiKey = import.meta.env.VITE_WEATHER_API_KEY;
  const [response, setResponse] = useState(null);
  const [routeInfo, setRouteInfo] = useState({
    distance: '',
    duration: '',
    trafficCondition: '',
    weather: null
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [originCoords, setOriginCoords] = useState(null);
  const [destCoords, setDestCoords] = useState(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [showTraffic, setShowTraffic] = useState(true);
  const [alternateRoutes, setAlternateRoutes] = useState([]);
  const [selectedRouteIndex, setSelectedRouteIndex] = useState(0);

  const containerStyle = {
    width: '100%',
    height: '500px' // Increased height for better visibility
  };

  // Get weather data for a location
  const getWeatherData = async (lat, lng) => {
    try {
      const response = await axios.get(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${weatherApiKey}&units=metric`
      );
      return {
        temp: response.data.main.temp,
        condition: response.data.weather[0].main,
        icon: response.data.weather[0].icon
      };
    } catch (err) {
      console.error('Error fetching weather:', err);
      return null;
    }
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
        setLoading(true);
        setError(null);
        
        // Geocode both addresses
        const [originResult, destResult] = await Promise.all([
          geocodeAddress(origin.address),
          geocodeAddress(destination.address)
        ]);

        setOriginCoords(originResult);
        setDestCoords(destResult);

        // Get weather for both locations
        const [originWeather, destWeather] = await Promise.all([
          getWeatherData(originResult.lat, originResult.lng),
          getWeatherData(destResult.lat, destResult.lng)
        ]);

        setRouteInfo(prev => ({
          ...prev,
          originWeather,
          destWeather
        }));

      } catch (error) {
        setError(`Failed to geocode addresses: ${error.message}`);
        setLoading(false);
      }
    };

    if (origin && destination) {
      geocodeBothAddresses();
    }
  }, [origin, destination, scriptLoaded]);

  const directionsCallback = (result, status) => {
    if (status === 'OK') {
      setResponse(result);
      setAlternateRoutes(result.routes);
      
      // Analyze the primary route
      const primaryRoute = result.routes[0];
      const leg = primaryRoute.legs[0];
      
      // Determine traffic condition
      let trafficCondition = 'Normal';
      if (leg.duration_in_traffic) {
        const trafficRatio = leg.duration_in_traffic.value / leg.duration.value;
        if (trafficRatio > 1.5) trafficCondition = 'Heavy';
        else if (trafficRatio > 1.2) trafficCondition = 'Moderate';
      }

      setRouteInfo(prev => ({
        ...prev,
        distance: leg.distance.text,
        duration: leg.duration.text,
        durationInTraffic: leg.duration_in_traffic?.text || leg.duration.text,
        trafficCondition
      }));

      setLoading(false);
    } else if (status === 'ZERO_RESULTS') {
      setError('No route could be found between the origin and destination');
      setLoading(false);
    } else {
      setError('Error fetching directions. Please try again.');
      setLoading(false);
    }
  };

  const handleRouteSelect = (index) => {
    setSelectedRouteIndex(index);
    setResponse(prev => ({
      ...prev,
      routes: [alternateRoutes[index]]
    }));
  };

  return (
    <LoadScript
      googleMapsApiKey={apiKey}
      libraries={LIBRARIES}
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
            <div className="route-locations">
              <div className="location-card">
                <h4>Origin</h4>
                <p>{originCoords?.formattedAddress || origin.address}</p>
                {routeInfo.originWeather && (
                  <div className="weather-info">
                    <img 
                      src={`https://openweathermap.org/img/wn/${routeInfo.originWeather.icon}.png`} 
                      alt={routeInfo.originWeather.condition}
                    />
                    <span>{routeInfo.originWeather.temp}°C, {routeInfo.originWeather.condition}</span>
                  </div>
                )}
              </div>
              
              <div className="location-card">
                <h4>Destination</h4>
                <p>{destCoords?.formattedAddress || destination.address}</p>
                {routeInfo.destWeather && (
                  <div className="weather-info">
                    <img 
                      src={`https://openweathermap.org/img/wn/${routeInfo.destWeather.icon}.png`} 
                      alt={routeInfo.destWeather.condition}
                    />
                    <span>{routeInfo.destWeather.temp}°C, {routeInfo.destWeather.condition}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {loading && (
            <div className="loading">
              <div className="spinner"></div>
              <p>Calculating optimal route...</p>
            </div>
          )}
          
          {error && (
            <div className="error-message">
              <span className="error-icon">⚠️</span>
              {error}
            </div>
          )}

          {!error && scriptLoaded && originCoords && destCoords && (
            <>
              <div className="route-details">
                <div className="route-stats">
                  <div className="stat-card">
                    <span className="stat-label">Distance</span>
                    <span className="stat-value">{routeInfo.distance}</span>
                  </div>
                  <div className="stat-card">
                    <span className="stat-label">Duration</span>
                    <span className="stat-value">{routeInfo.durationInTraffic}</span>
                  </div>
                  <div className="stat-card">
                    <span className="stat-label">Traffic</span>
                    <span className={`stat-value traffic-${routeInfo.trafficCondition.toLowerCase()}`}>
                      {routeInfo.trafficCondition}
                    </span>
                  </div>
                </div>

                {alternateRoutes.length > 1 && (
                  <div className="alternate-routes">
                    <h4>Alternate Routes:</h4>
                    <div className="route-options">
                      {alternateRoutes.map((route, index) => (
                        <button
                          key={index}
                          className={`route-option ${selectedRouteIndex === index ? 'active' : ''}`}
                          onClick={() => handleRouteSelect(index)}
                        >
                          <span>{route.legs[0].distance.text}</span>
                          <span>{route.legs[0].duration.text}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="map-controls">
                  <button 
                    className={`control-btn ${showTraffic ? 'active' : ''}`}
                    onClick={() => setShowTraffic(!showTraffic)}
                  >
                    {showTraffic ? 'Hide Traffic' : 'Show Traffic'}
                  </button>
                </div>
              </div>
              
              <div className="map-container">
                <GoogleMap
                  mapContainerStyle={containerStyle}
                  center={originCoords}
                  zoom={12}
                  options={{
                    streetViewControl: true,
                    mapTypeControl: true,
                    fullscreenControl: false,
                    styles: [
                      {
                        featureType: "poi",
                        elementType: "labels",
                        stylers: [{ visibility: "off" }]
                      }
                    ]
                  }}
                >
                  <>
                    <AdvancedMarker position={originCoords} title="Origin">
                      <div className="marker origin-marker">
                        <span>O</span>
                      </div>
                    </AdvancedMarker>
                    <AdvancedMarker position={destCoords} title="Destination">
                      <div className="marker dest-marker">
                        <span>D</span>
                      </div>
                    </AdvancedMarker>
                    
                    <DirectionsService
                      options={{
                        destination: destCoords,
                        origin: originCoords,
                        travelMode: 'DRIVING',
                        provideRouteAlternatives: true,
                        drivingOptions: {
                          departureTime: new Date(),
                          trafficModel: 'bestguess'
                        }
                      }}
                      callback={directionsCallback}
                    />
                    
                    {response && (
                      <DirectionsRenderer
                        options={{
                          directions: response,
                          suppressMarkers: true,
                          polylineOptions: {
                            strokeColor: '#4285F4',
                            strokeWeight: 6,
                            strokeOpacity: 0.8
                          }
                        }}
                      />
                    )}
                    
                    {showTraffic && <TrafficLayer />}
                  </>
                </GoogleMap>
              </div>
            </>
          )}
        </div>
      </div>
    </LoadScript>
  );
};

export default RouteOptimizer;