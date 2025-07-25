import { Link } from "react-router-dom";
import { Shield, QrCode, MapPin, Search, Thermometer, Activity, Mic, Play } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import "./Landing.css";
import { useAuth } from "./AuthContext";

export default function Landing() {
  const { user } = useAuth();
  const [showDemo, setShowDemo] = useState(false);
  const [demoProgress, setDemoProgress] = useState(0);
  const videoRef = useRef(null);

  const handlePlayClick = () => {
    setShowDemo(true);
    if (videoRef.current) {
      videoRef.current.play();
    }
  };

  const [stats, setStats] = useState({
    drugsVerified: 0,
    pharmaciesConnected: 0,
    counterfeitsDetected: 0,
    citiesCovered: 0
  });

  // Role-specific content
  const roleBasedContent = {
    manufacturer: {
      welcomeMessage: "Manufacturer Dashboard",
      features: ["Batch Management", "Production Tracking", "Quality Control"],
      description: "Manage your pharmaceutical production and quality control processes"
    },
    distributor: {
      welcomeMessage: "Distribution Network",
      features: ["Shipment Tracking", "Inventory Management", "Route Optimization"],
      description: "Track and optimize your medicine distribution network"
    },
    wholesaler: {
      welcomeMessage: "Wholesale Operations",
      features: ["Bulk Inventory", "Order Management", "Supply Chain"],
      description: "Manage your wholesale pharmaceutical operations"
    },
    retailer: {
      welcomeMessage: "Retail Pharmacy",
      features: ["Sales Tracking", "Inventory", "Customer Management"],
      description: "Manage your retail pharmacy operations"
    },
    pharmacy: {
      welcomeMessage: "Pharmacy Dashboard",
      features: ["Prescriptions", "Inventory", "Patient Records"],
      description: "Manage your pharmacy operations and patient care"
    },
    public: {
      welcomeMessage: "Medicine Verification",
      features: ["Verify Drugs", "Report Counterfeits", "Find Pharmacies"],
      description: "Verify medicines and access healthcare services"
    },
    admin: {
      welcomeMessage: "Admin Dashboard",
      features: ["User Management", "System Monitoring", "Reports"],
      description: "Manage the entire MedChain platform"
    }
  };

  // Animate stats counting
  useEffect(() => {
    const targetStats = {
      drugsVerified: 250000,
      pharmaciesConnected: 5000,
      counterfeitsDetected: 1200,
      citiesCovered: 150
    };

    const duration = 2000;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      setStats({
        drugsVerified: Math.floor(progress * targetStats.drugsVerified),
        pharmaciesConnected: Math.floor(progress * targetStats.pharmaciesConnected),
        counterfeitsDetected: Math.floor(progress * targetStats.counterfeitsDetected),
        citiesCovered: Math.floor(progress * targetStats.citiesCovered)
      });

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    animate();
  }, []);

  // Track video progress
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updateProgress = () => {
      setDemoProgress((video.currentTime / video.duration) * 100);
    };

    video.addEventListener('timeupdate', updateProgress);
    return () => video.removeEventListener('timeupdate', updateProgress);
  }, [showDemo]);

  return (
    <div className="landing-page">
      {user ? (
        /* Role-specific dashboard for logged-in users */
        <section className="role-dashboard">
          <div className="role-dashboard-header">
            <h1>{roleBasedContent[user.role]?.welcomeMessage || "Welcome"}</h1>
            <p className="role-dashboard-description">
              {roleBasedContent[user.role]?.description}
            </p>
          </div>
          
          <div className="role-features-grid">
            {roleBasedContent[user.role]?.features.map((feature, index) => (
              <div key={index} className="role-feature-card">
                <div className="role-feature-icon">
                  {index % 6 === 0 && <Shield className="icon" />}
                  {index % 6 === 1 && <MapPin className="icon" />}
                  {index % 6 === 2 && <QrCode className="icon" />}
                  {index % 6 === 3 && <Thermometer className="icon" />}
                  {index % 6 === 4 && <Activity className="icon" />}
                  {index % 6 === 5 && <Mic className="icon" />}
                </div>
                <h3>{feature}</h3>
                <Link 
                  to={`/${user.role}/${feature.toLowerCase().replace(/\s+/g, '-')}`}
                  className="role-feature-link"
                >
                  Explore →
                </Link>
              </div>
            ))}
          </div>
        </section>
      ) : (
        /* Original landing content for non-logged-in users */
        <>
          {/* Hero Section */}
          <section className="hero-section">
            <div className="hero-bg-pattern"></div>
            <div className="hero-container">
              <div className="hero-content">
                <h1>
                  <span className="hero-title-line">Track Trust.</span>
                  <span className="hero-title-line">Fight Fakes.</span>
                </h1>
                <p className="hero-subtitle">
                  Verify every dose. Track every move. Trust every medicine.
                </p>
                <div className="hero-buttons">
                  <Link to="/verify-drug" className="hero-button primary">
                    <Search className="button-icon" />
                    Verify Drug
                    <span className="button-hover-effect"></span>
                  </Link>
                  <Link to="/emergency-locator" className="hero-button secondary">
                    <MapPin className="button-icon" />
                    Find Medicines
                    <span className="button-hover-effect"></span>
                  </Link>
                </div>
              </div>
              <div className="hero-image">
                <div className="demo-container">
                  <div className="demo-screen">
                    <video 
                      ref={videoRef}
                      className="demo-video" 
                      poster="/images/app-demo-poster.jpg"
                      loop
                      muted
                    >
                      <source src="/videos/medicine-detection-demo.mp4" type="video/mp4" />
                    </video>
                    
                    {!showDemo && (
                      <div className="demo-overlay">
                        <button 
                          className="demo-play-button"
                          onClick={handlePlayClick}
                          aria-label="Play demo"
                        >
                          <Play className="demo-play-icon" />
                        </button>
                      </div>
                    )}
                    
                    {showDemo && (
                      <div className="demo-progress">
                        <div 
                          className="demo-progress-bar" 
                          style={{ width: `${demoProgress}%` }}
                        />
                      </div>
                    )}
                    
                    <div className="demo-preview">
                      <div className="demo-preview-title">
                        {showDemo ? "Medicine Verification Demo" : "See MedChain in Action"}
                      </div>
                      <div className="demo-preview-text">
                        {showDemo 
                          ? "Watch how we detect and verify medicines" 
                          : "Click to see medicine verification demo"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Features Section */}
          <section className="features-section">
            <div className="features-container">
              <div className="features-header">
                <h2>Comprehensive Healthcare Supply Chain</h2>
                <p className="features-subtitle">
                  Our platform ensures drug authenticity, tracks supply chains, and provides real-time stock information for healthcare providers.
                </p>
              </div>
              
              <div className="features-grid">
                <div className="feature-card">
                  <div className="feature-icon primary">
                    <Shield className="icon" />
                    <div className="icon-bg"></div>
                  </div>
                  <h3>Medicine Verification</h3>
                  <p>
                    Instantly verify medicine authenticity with QR codes, batch numbers, and secure logging.
                  </p>
                  <div className="feature-wave"></div>
                </div>
                
                <div className="feature-card">
                  <div className="feature-icon secondary">
                    <MapPin className="icon" />
                    <div className="icon-bg"></div>
                  </div>
                  <h3>Smart Emergency Locator</h3>
                  <p>
                    AI-powered Ant Colony Optimization algorithm finds the best pharmacy recommendations.
                  </p>
                  <div className="feature-wave"></div>
                </div>
                
                <div className="feature-card">
                  <div className="feature-icon purple">
                    <QrCode className="icon" />
                    <div className="icon-bg"></div>
                  </div>
                  <h3>Medicine Tracker</h3>
                  <p>
                    Complete end-to-end drug tracking with secure records and digital verification.
                  </p>
                  <div className="feature-wave"></div>
                </div>

                <div className="feature-card">
                  <div className="feature-icon orange">
                    <Thermometer className="icon" />
                    <div className="icon-bg"></div>
                  </div>
                  <h3>Smart Storage Monitor</h3>
                  <p>
                    Real-time temperature, humidity, and storage condition monitoring with smart sensors.
                  </p>
                  <div className="feature-wave"></div>
                </div>

                <div className="feature-card">
                  <div className="feature-icon blue">
                    <Activity className="icon" />
                    <div className="icon-bg"></div>
                  </div>
                  <h3>Smart Demand Predictor</h3>
                  <p>
                    Machine learning-powered demand prediction to prevent shortages and optimize inventory.
                  </p>
                  <div className="feature-wave"></div>
                </div>

                <div className="feature-card">
                  <div className="feature-icon red">
                    <Mic className="icon" />
                    <div className="icon-bg"></div>
                  </div>
                  <h3>Voice Assistant</h3>
                  <p>
                    Multilingual voice verification system for easy access and rural connectivity.
                  </p>
                  <div className="feature-wave"></div>
                </div>
              </div>
            </div>
          </section>

          {/* Stats Section */}
          <section className="stats-section">
            <div className="stats-container">
              <div className="stats-grid">
                <div className="stat-item">
                  <div className="stat-number primary">{stats.drugsVerified.toLocaleString()}+</div>
                  <div className="stat-label">Drugs Verified</div>
                  <div className="stat-decoration"></div>
                </div>
                <div className="stat-item">
                  <div className="stat-number secondary">{stats.pharmaciesConnected.toLocaleString()}+</div>
                  <div className="stat-label">Pharmacies Connected</div>
                  <div className="stat-decoration"></div>
                </div>
                <div className="stat-item">
                  <div className="stat-number red">{stats.counterfeitsDetected.toLocaleString()}+</div>
                  <div className="stat-label">Counterfeits Detected</div>
                  <div className="stat-decoration"></div>
                </div>
                <div className="stat-item">
                  <div className="stat-number yellow">{stats.citiesCovered}+</div>
                  <div className="stat-label">Cities Covered</div>
                  <div className="stat-decoration"></div>
                </div>
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}