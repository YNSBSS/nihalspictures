import React from 'react';
import { Camera, Award, Star, CheckCircle, Phone, ArrowDown,Instagram } from 'lucide-react';
import './ModernHeroSection.css';
const ModernHeroSection = ({ 
  logo, 
  businessInfo, 
  onWhatsAppContact, 
  onCallNow,
  bookingForm 
}) => {

  const scrollToNext = () => {
    const nextSection = document.querySelector('.mnphoto-portfolio-section');
    if (nextSection) {
      nextSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <>
      <section className="elegant-hero-stage">
        {/* Main Content Container */}
        <div className="hero-content-container">
          <div className="content-layout-wrapper">
            
            {/* Premium Brand Section */}
            <div className="premium-brand-showcase">
              <div className="brand-logo-frame">
                <div className="logo-outer-ring">
                  <div className="logo-inner-chamber">
                    <img 
                      src={logo || "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=200&h=200&fit=crop&crop=face"} 
                      alt="Nihal's Pictures" 
                      className="brand-image-core"
                    />
                  </div>
                  <div className="logo-orbit-system">
                    {[...Array(6)].map((_, i) => (
                      <div key={i} className={`orbit-dot dot-${i + 1}`} />
                    ))}
                  </div>
                </div>
              </div>

              <div className="brand-identity-block">
                <h1 className="brand-main-title">
                  <span className="title-primary-text">Nihal's Pictures</span>
                </h1>
                
                <div className="brand-tagline-container">
                  <p className="brand-essence-text">
                    Excellence photographique • Art visuel moderne • Moments éternels
                  </p>
                </div>
              </div>
              <div></div>
            </div>

            {/* Elite Features Showcase */}
            <div className="elite-features-grid">
              <div className="feature-card-elite">
                <div className="feature-icon-chamber">
                  <Award className="feature-symbol" />
                  <div className="icon-aura" />
                </div>
                <div className="feature-details">
                  <h3 className="feature-headline">Photographe Certifié</h3>
                  <p className="feature-description">4+ années d'expérience</p>
                </div>
              </div>

              <div className="feature-card-elite">
                <div className="feature-icon-chamber">
                  <Star className="feature-symbol" />
                  <div className="icon-aura" />
                </div>
                <div className="feature-details">
                  <h3 className="feature-headline">Qualité Premium</h3>
                  <p className="feature-description">Équipement professionnel</p>
                </div>
              </div>

              <div className="feature-card-elite">
                <div className="feature-icon-chamber">
                  <CheckCircle className="feature-symbol" />
                  <div className="icon-aura" />
                </div>
                <div className="feature-details">
                  <h3 className="feature-headline">Service Sur-mesure</h3>
                  <p className="feature-description">À votre écoute 24/7</p>
                </div>
              </div>

              <div className="feature-card-elite">
                <div className="feature-icon-chamber">
                  <Camera className="feature-symbol" />
                  <div className="icon-aura" />
                </div>
                <div className="feature-details">
                  <h3 className="feature-headline">Portfolio Diversifié</h3>
                  <p className="feature-description">Tous types d'événements</p>
                </div>
              </div>
            </div>

            {/* Premium Action Center */}
            <div className="premium-action-center">
              <div className="action-button-group">
                <button 
                  className="action-btnnn action-btn-primary"
                  onClick={onWhatsAppContact}
                >
                  <Instagram className="btn-icon" />
                  <span>Réserver sur Instagrame</span>
                </button>

                <button 
                  className="action-btnnn action-btn-secondary"
                  onClick={onCallNow}
                >
                  <Phone className="btn-icon" />
                  <span>{businessInfo?.phone || "+213 123 456 789"}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Scroll Invitation */}
          <div className="scroll-invitation">
            <button 
              className="scroll-trigger"
              onClick={scrollToNext}
              aria-label="Défiler vers le bas"
            >
              <ArrowDown className="scroll-chevron" />
              <span className="scroll-label">Découvrir nos services</span>
            </button>
          </div>
        </div>
      </section>

      {/* Statistics Showcase */}
      <section className="statistics-showcase">
        <div className="stats-container">
          <div className="stat-display-item">
            <div className="stat-figure">500+</div>
            <div className="stat-description">Clients Satisfaits</div>
          </div>
          <div className="stat-separator" />
          <div className="stat-display-item">
            <div className="stat-figure">50+</div>
            <div className="stat-description">Mariages Immortalisés</div>
          </div>
          <div className="stat-separator" />
          <div className="stat-display-item">
            <div className="stat-figure">1000+</div>
            <div className="stat-description">Photos Professionnelles</div>
          </div>
        </div>
      </section>


    </>
  );
};

export default ModernHeroSection;