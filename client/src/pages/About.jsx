import { useEffect } from 'react';
import { Users, ShieldCheck, Activity, Globe, Award, HeartPulse } from 'lucide-react';
import './About.css';

export default function About() {
  useEffect(() => {
    const animateOnScroll = () => {
      const elements = document.querySelectorAll('.animate-fade-up');
      elements.forEach(el => {
        const elementPosition = el.getBoundingClientRect().top;
        const windowHeight = window.innerHeight;
        if (elementPosition < windowHeight - 100) {
          el.classList.add('fade-up-active');
        }
      });
    };

    window.addEventListener('scroll', animateOnScroll);
    animateOnScroll(); // Trigger on initial load
    return () => window.removeEventListener('scroll', animateOnScroll);
  }, []);

  return (
    <div className="about-page">
      {/* Hero Section */}
      <section className="about-hero">
        <div className="hero-content">
          <h1 className="hero-title">
            <span className="title-gradient">Redefining Trust</span> in Medicine
          </h1>
          <p className="hero-subtitle">
            We're building the world's most reliable pharmaceutical verification network,
            connecting manufacturers, pharmacies and patients through blockchain-powered transparency.
          </p>
          <div className="hero-stats">
            <div className="stat-card">
              <Users className="stat-icon" />
              <div>
                <span className="stat-number">5000+</span>
                <span className="stat-label">Pharmacies</span>
              </div>
            </div>
            <div className="stat-card">
              <ShieldCheck className="stat-icon" />
              <div>
                <span className="stat-number">250K+</span>
                <span className="stat-label">Verified Drugs</span>
              </div>
            </div>
            <div className="stat-card">
              <Globe className="stat-icon" />
              <div>
                <span className="stat-number">150+</span>
                <span className="stat-label">Cities</span>
              </div>
            </div>
          </div>
        </div>
        <div className="hero-pattern"></div>
      </section>

      {/* Mission Section */}
      <section className="mission-section">
        <div className="mission-content animate-fade-up">
          <h2 className="section-title">
            Our <span className="text-primary">Mission</span>
          </h2>
          <p className="mission-text">
            To eliminate counterfeit medicines by creating an unforgeable digital identity for every
            pharmaceutical product, from manufacturing to patient delivery.
          </p>
          <div className="mission-highlights">
            <div className="highlight-card">
              <div className="highlight-icon">
                <Activity className="icon" />
              </div>
              <h3>Real-Time Tracking</h3>
              <p>Monitor drugs through every step of the supply chain</p>
            </div>
            <div className="highlight-card">
              <div className="highlight-icon">
                <HeartPulse className="icon" />
              </div>
              <h3>Patient Safety</h3>
              <p>Ensure every dose is authentic and effective</p>
            </div>
            <div className="highlight-card">
              <div className="highlight-icon">
                <Award className="icon" />
              </div>
              <h3>Industry Standards</h3>
              <p>Compliant with global pharmaceutical regulations</p>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="values-section">
        <div className="values-content animate-fade-up">
          <h2 className="section-title">
            Our <span className="text-accent">Core Values</span>
          </h2>
          <div className="values-grid">
            <div className="value-card">
              <div className="value-number">01</div>
              <h3>Transparency</h3>
              <p>
                We believe every stakeholder deserves complete visibility into medicine provenance
              </p>
            </div>
            <div className="value-card">
              <div className="value-number">02</div>
              <h3>Integrity</h3>
              <p>
                Uncompromising commitment to truth in every data point we record
              </p>
            </div>
            <div className="value-card">
              <div className="value-number">03</div>
              <h3>Innovation</h3>
              <p>
                Continuously advancing our technology to stay ahead of counterfeiters
              </p>
            </div>
            <div className="value-card">
              <div className="value-number">04</div>
              <h3>Impact</h3>
              <p>
                Measuring success by lives saved, not just profits made
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}