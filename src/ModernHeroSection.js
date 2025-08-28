import React, { useState, useEffect } from 'react';
import { Camera, Award, Star, CheckCircle, MessageSquare, Phone, Play, ArrowDown } from 'lucide-react';
import './ModernHeroSection.css';

const ModernHeroSection = ({ 
  logo, 
  businessInfo, 
  onWhatsAppContact, 
  onCallNow,
  bookingForm 
}) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  // Hero slides with different themes
  const heroSlides = [
    {
      title: "Capturer l'Émotion",
      subtitle: "Chaque instant mérite d'être immortalisé avec art et passion",
      theme: "emotion",
      backgroundGradient: "from-purple-900 via-blue-900 to-indigo-900"
    },
    {
      title: "Moments Précieux",
      subtitle: "Votre histoire racontée à travers notre objectif professionnel",
      theme: "moments",
      backgroundGradient: "from-rose-900 via-pink-900 to-purple-900"
    },
    {
      title: "Excellence Créative",
      subtitle: "L'art de la photographie au service de vos souvenirs",
      theme: "creative",
      backgroundGradient: "from-orange-900 via-red-900 to-pink-900"
    }
  ];

  // Auto-slide functionality
  useEffect(() => {
    const slideInterval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 6000);

    return () => clearInterval(slideInterval);
  }, []);

  // Mouse tracking for parallax effects
  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth) * 100,
        y: (e.clientY / window.innerHeight) * 100
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Particle system component
  const ParticleSystem = () => {
    const [particles, setParticles] = useState([]);

    useEffect(() => {
      const generateParticles = () => {
        const newParticles = [];
        for (let i = 0; i < 60; i++) {
          newParticles.push({
            id: i,
            x: Math.random() * 100,
            y: Math.random() * 100,
            size: Math.random() * 4 + 2,
            duration: Math.random() * 15 + 10,
            delay: Math.random() * 5,
            direction: Math.random() > 0.5 ? 1 : -1
          });
        }
        setParticles(newParticles);
      };

      generateParticles();
      const interval = setInterval(generateParticles, 25000);
      return () => clearInterval(interval);
    }, []);

    return (
      <div className="hero-particles">
        {particles.map(particle => (
          <div
            key={particle.id}
            className="particle"
            style={{
              '--x': `${particle.x}%`,
              '--y': `${particle.y}%`,
              '--size': `${particle.size}px`,
              '--duration': `${particle.duration}s`,
              '--delay': `${particle.delay}s`,
              '--direction': particle.direction,
            }}
          />
        ))}
      </div>
    );
  };

  const handleVideoPlay = () => {
    setIsVideoPlaying(!isVideoPlaying);
  };

  const scrollToNext = () => {
    const nextSection = document.querySelector('.mnphoto-portfolio-section');
    if (nextSection) {
      nextSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <>
    <section className="modern-hero-section">
      {/* Dynamic Background */}


      {/* Floating Elements */}
      
      {/* Particle System */}
      <ParticleSystem />

      {/* Main Content */}
      <div className="hero-content">
        <div className="hero-content-wrapper">
          {/* Brand Section */}
          <div className="hero-brand">
            <div className="brand-logo-container">
              <div className="logo-ring">
                <div className="logo-ring-inner">
                  <img 
                    src={logo} 
                    alt="MN-Photography" 
                    className="brand-logo"
                  />
                </div>
              </div>
              <div className="logo-particles">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className={`logo-particle particle-${i + 1}`} />
                ))}
              </div>
            </div>

            <div className="brand-text">
              <h1 className="brand-title">
                <span className="title-main">MN-PHOTOGRAPHY</span>
              </h1>
              
              <div className="brand-subtitle-container">
 
              </div>
            </div>
          </div>

          {/* Features Grid */}
          <div className="hero-features">
            <div className="feature-item">
              <div className="feature-icon-wrapper">
                <Award className="feature-icon" />
                <div className="feature-glow" />
              </div>
              <div className="feature-content">
                <span className="feature-title">Photographe Certifié</span>
                <span className="feature-subtitle">4+ années d'expérience</span>
              </div>
            </div>

            <div className="feature-item">
              <div className="feature-icon-wrapper">
                <Star className="feature-icon" />
                <div className="feature-glow" />
              </div>
              <div className="feature-content">
                <span className="feature-title">Qualité Premium</span>
                <span className="feature-subtitle">Équipement professionnel</span>
              </div>
            </div>

            <div className="feature-item">
              <div className="feature-icon-wrapper">
                <CheckCircle className="feature-icon" />
                <div className="feature-glow" />
              </div>
              <div className="feature-content">
                <span className="feature-title">Service Sur-mesure</span>
                <span className="feature-subtitle">À votre écoute 24/7</span>
              </div>
            </div>

            <div className="feature-item">
              <div className="feature-icon-wrapper">
                <Camera className="feature-icon" />
                <div className="feature-glow" />
              </div>
              <div className="feature-content">
                <span className="feature-title">Portfolio Diversifié</span>
                <span className="feature-subtitle">Tous types d'événements</span>
              </div>
            </div>
          </div>

          {/* Call to Action */}
          <div className="hero-cta">
            <div className="cta-buttons">
              <button 
                className="cta-primary"
                onClick={onWhatsAppContact}
              >
                <MessageSquare className="cta-icon" />
                <span>Réserver sur WhatsApp</span>
                <div className="button-glow" />
              </button>

              <button 
                className="cta-secondary"
                onClick={onCallNow}
              >
                <Phone className="cta-icon" />
                <span>{businessInfo?.phone}</span>
                <div className="button-glow" />
              </button>
            </div>

            {/* Video Play Button */}
            <div className="video-play-section">
              <button 
                className="play-button"
                onClick={handleVideoPlay}
                aria-label="Voir notre portfolio vidéo"
              >
                <Play className="play-icon" />
                <div className="play-ripple" />
              </button>
              <span className="play-text">Découvrir notre travail</span>
            </div>
          </div>

          {/* Slide Indicators */}
          <div className="slide-indicators">
            {heroSlides.map((_, index) => (
              <button
                key={index}
                className={`slide-indicator ${currentSlide === index ? 'active' : ''}`}
                onClick={() => setCurrentSlide(index)}
                aria-label={`Slide ${index + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="scroll-indicator">
          <button 
            className="scroll-arrow"
            onClick={scrollToNext}
            aria-label="Défiler vers le bas"
          >
            <ArrowDown className="scroll-icon" />
            <span className="scroll-text">Découvrir nos services</span>
          </button>
        </div>
      </div>

      
    </section>
    {/* Stats Section */}
      <div className="hero-stats">
        <div className="stat-item">
          <div className="stat-number">500+</div>
          <div className="stat-label">Clients Satisfaits</div>
        </div>
        <div className="stat-divider" />
        <div className="stat-item">
          <div className="stat-number">50+</div>
          <div className="stat-label">Mariages Immortalisés</div>
        </div>
        <div className="stat-divider" />
        <div className="stat-item">
          <div className="stat-number">1000+</div>
          <div className="stat-label">Photos Professionnelles</div>
        </div>
      </div>
      </>
  );
};

export default ModernHeroSection;