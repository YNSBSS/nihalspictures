import React, { useState, useEffect } from 'react';
import { Camera, X, User, Mail, Phone, MessageSquare, Clock, MapPin, Plus, Minus, Star, Award, CheckCircle, Instagram, Facebook, Twitter } from 'lucide-react';
import { collection, getDocs, addDoc, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from './firebaseConfig';
import logo from './logo.jpg';
import ModernCarousel from './ModernCarousel';
import './PhotographyBookingSystem.css';
import ModernHeroSection from './ModernHeroSection';

const PhotographyBookingSystem = () => {
  const [servicePackages, setServicePackages] = useState([]);
  const [bookingForm, setBookingForm] = useState({
    firstName: '',
    lastName: '',
    phoneNumbers: [''],
    wilaya: '',
    addressDetails: '',
    packName: '',
    date: '',
    time: '',
    email: '',
    remarks: '',
    status: 'Requested'
  });
  const [submitting, setSubmitting] = useState(false);

  // Business contact information
  const businessInfo = {
    phone: '+213 552 49 33 48',
    whatsapp: '213552493348'
  };

  // Wilaya options
  const wilayaOptions = [
    'ALGER',
    'TIPAZA', 
    'BOUMERDES',
    'BLIDA',
    'TIZI OUZOU'
  ];

  // Dynamic Hero Elements Component
  const DynamicHeroElements = () => {
    const [shapes, setShapes] = useState([]);
    const [particles, setParticles] = useState([]);

    useEffect(() => {
      // Generate floating shapes
      const generateShapes = () => {
        const newShapes = [];
        for (let i = 0; i < 8; i++) {
          const shapeTypes = ['circle', 'triangle', 'square'];
          const shapeType = shapeTypes[Math.floor(Math.random() * shapeTypes.length)];
          const size = Math.random() * 60 + 40;
          const duration = Math.random() * 10 + 10;
          const delay = Math.random() * 15;
          
          newShapes.push({
            id: i,
            type: shapeType,
            size,
            duration,
            delay,
            left: Math.random() * 100,
          });
        }
        setShapes(newShapes);
      };

      // Generate particles
      const generateParticles = () => {
        const newParticles = [];
        for (let i = 0; i < 50; i++) {
          const duration = Math.random() * 8 + 8;
          const delay = Math.random() * 20;
          const startX = Math.random() * 100;
          const endX = startX + (Math.random() - 0.5) * 40;
          
          newParticles.push({
            id: i,
            duration,
            delay,
            startX,
            endX,
            left: Math.random() * 100,
          });
        }
        setParticles(newParticles);
      };

      generateShapes();
      generateParticles();

      // Regenerate shapes periodically for more dynamic effect
      const shapesInterval = setInterval(generateShapes, 30000);
      const particlesInterval = setInterval(generateParticles, 25000);

      return () => {
        clearInterval(shapesInterval);
        clearInterval(particlesInterval);
      };
    }, []);

    return (
      <>
        {/* Floating Geometric Shapes */}
        <div className="mnphoto-hero-shapes">
          {shapes.map(shape => (
            <div
              key={shape.id}
              className={`mnphoto-shape mnphoto-shape-${shape.type}`}
              style={{
                '--size': `${shape.size}px`,
                '--duration': `${shape.duration}s`,
                left: `${shape.left}%`,
                animationDelay: `${shape.delay}s`,
              }}
            />
          ))}
        </div>

        {/* Particle System */}
        <div className="mnphoto-particles">
          {particles.map(particle => (
            <div
              key={particle.id}
              className="mnphoto-particle"
              style={{
                '--duration': `${particle.duration}s`,
                '--start-x': `${particle.startX}vw`,
                '--end-x': `${particle.endX}vw`,
                left: `${particle.left}%`,
                animationDelay: `${particle.delay}s`,
              }}
            />
          ))}
        </div>
      </>
    );
  };

  // Load service packages from Firestore
  useEffect(() => {
    const loadServicePackages = async () => {
      try {
        const packagesRef = collection(db, 'servicePackages');
        const packagesSnapshot = await getDocs(packagesRef);
        const packages = packagesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setServicePackages(packages.length > 0 ? packages : fallbackPackages);
      } catch (error) {
        console.error('Erreur lors du chargement des forfaits:', error);
        setServicePackages(fallbackPackages);
      }
    };

    const fallbackPackages = [
      { 
        id: 'portrait', 
        name: 'Séance Portrait', 
        duration: '1-2 heures', 
        price: 15000,
        description: 'Séance photo portrait professionnelle en studio ou extérieur',
        image: logo
      },
      { 
        id: 'wedding', 
        name: 'Photographie de Mariage', 
        duration: '6-8 heures', 
        price: 80000,
        description: 'Couverture complète de votre journée de mariage',
        image: logo
      },
      { 
        id: 'event', 
        name: 'Photographie d\'Événement', 
        duration: '3-5 heures', 
        price: 40000,
        description: 'Couverture photo pour vos événements spéciaux',
        image: logo
      },
      { 
        id: 'product', 
        name: 'Photographie de Produit', 
        duration: '2-3 heures', 
        price: 25000,
        description: 'Photos professionnelles pour vos produits',
        image: logo
      },
      { 
        id: 'family', 
        name: 'Séance Familiale', 
        duration: '1-2 heures', 
        price: 20000,
        description: 'Séance photo familiale dans un cadre naturel',
        image: logo
      }
    ];

    loadServicePackages();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setBookingForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePhoneChange = (index, value) => {
    const newPhoneNumbers = [...bookingForm.phoneNumbers];
    newPhoneNumbers[index] = value;
    setBookingForm(prev => ({
      ...prev,
      phoneNumbers: newPhoneNumbers
    }));
  };

  const addPhoneNumber = () => {
    setBookingForm(prev => ({
      ...prev,
      phoneNumbers: [...prev.phoneNumbers, '']
    }));
  };

  const removePhoneNumber = (index) => {
    if (bookingForm.phoneNumbers.length > 1) {
      const newPhoneNumbers = bookingForm.phoneNumbers.filter((_, i) => i !== index);
      setBookingForm(prev => ({
        ...prev,
        phoneNumbers: newPhoneNumbers
      }));
    }
  };

  const handleBookingSubmit = async () => {
    const requiredFields = ['firstName', 'lastName', 'wilaya', 'addressDetails', 'packName', 'date', 'time', 'email'];
    const phoneValid = bookingForm.phoneNumbers[0].trim() !== '';
    
    if (!phoneValid || requiredFields.some(field => !bookingForm[field].trim())) {
      alert('Veuillez remplir tous les champs obligatoires.');
      return;
    }

    setSubmitting(true);

    try {
      const bookingData = {
        ...bookingForm,
        phoneNumbers: bookingForm.phoneNumbers.filter(phone => phone.trim() !== ''),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await addDoc(collection(db, 'bookings'), bookingData);
      alert('Demande de réservation soumise avec succès ! Nous vous contacterons dans les 24 heures pour confirmer votre séance.');
      
      setBookingForm({
        firstName: '',
        lastName: '',
        phoneNumbers: [''],
        wilaya: '',
        addressDetails: '',
        packName: '',
        date: '',
        time: '',
        email: '',
        remarks: '',
        status: 'En attente'
      });
    } catch (error) {
      console.error('Erreur lors de la soumission:', error);
      alert('Erreur lors de la soumission de la réservation. Veuillez réessayer ou nous contacter directement.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleWhatsAppContact = () => {
    const message = encodeURIComponent(
      `Bonjour ! Je suis intéressé(e) par une séance photo.\n\n` +
      `Forfait: ${bookingForm.packName || 'À discuter'}\n` +
      `Date souhaitée: ${bookingForm.date || 'À discuter'}\n` +
      `Heure: ${bookingForm.time || 'À discuter'}\n` +
      `Nom: ${bookingForm.firstName} ${bookingForm.lastName}\n\n` +
      `Veuillez me contacter pour discuter des détails et confirmer la disponibilité.`
    );
    
    window.open(`https://wa.me/${businessInfo.whatsapp}?text=${message}`, '_blank');
  };

  const handleCallNow = () => {
    window.open(`tel:${businessInfo.phone}`, '_self');
  };

  return (
    <div className="mnphoto-page-wrapper">
      {/* Enhanced Hero Section */}
<ModernHeroSection 
  logo={logo}
  businessInfo={businessInfo}
  onWhatsAppContact={handleWhatsAppContact}
  onCallNow={handleCallNow}
  bookingForm={bookingForm}
/>
      {/* Portfolio Carousel */}
      <section className="mnphoto-portfolio-section">
        <div className="mnphoto-section-container">
          <h2 className="mnphoto-section-title">Notre Portfolio</h2>
          <ModernCarousel />
        </div>
      </section>

      {/* Services Section */}
      <section className="mnphoto-services-section">
        <div className="mnphoto-section-container">
          <h2 className="mnphoto-section-title">Nos Services</h2>
          <div className="mnphoto-services-grid">
            {servicePackages.map(pkg => (
              <div key={pkg.id} className="mnphoto-service-card">
                <div className="mnphoto-service-image">
                  <img 
                    src={pkg.image || logo} 
                    alt={pkg.name}
                    className="mnphoto-service-img"
                  />
                  <div className="mnphoto-service-overlay">
                    <div className="mnphoto-service-price">
                      {pkg.price?.toLocaleString()} DZD
                    </div>
                  </div>
                </div>
                <div className="mnphoto-service-content">
                  <h3 className="mnphoto-service-name">{pkg.name}</h3>
                  <div className="mnphoto-service-duration">
                    <Clock className="mnphoto-duration-icon" />
                    <span>{pkg.duration}</span>
                  </div>
                  <p className="mnphoto-service-description">{pkg.description}</p>
                  <button 
                    className="mnphoto-service-select-btn"
                    onClick={() => setBookingForm(prev => ({ ...prev, packName: pkg.name }))}
                  >
                    Choisir ce forfait
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Enhanced Booking Form Section */}
      <section className="mnphoto-booking-section">
        <div className="mnphoto-section-container">
          <div className="mnphoto-booking-header">
            <h2 className="mnphoto-section-title">Réservez Votre Séance</h2>
            <p className="mnphoto-booking-subtitle">Remplissez le formulaire ci-dessous pour faire votre demande</p>
          </div>
          
          <div className="mnphoto-booking-form-card">
            <div className="mnphoto-booking-form">
              {/* Personal Information Section */}
              <div className="mnphoto-form-section">
                <h3 className="mnphoto-form-section-title">
                  <User className="mnphoto-section-icon" />
                  Informations Personnelles
                </h3>
                
                <div className="mnphoto-form-grid">
                  <div className="mnphoto-form-group">
                    <label className="mnphoto-form-label">Prénom</label>
                    <input
                      type="text"
                      name="firstName"
                      value={bookingForm.firstName}
                      onChange={handleInputChange}
                      className="mnphoto-form-input"
                      placeholder="Votre prénom"
                      disabled={submitting}
                      required
                    />
                  </div>

                  <div className="mnphoto-form-group">
                    <label className="mnphoto-form-label">Nom de famille</label>
                    <input
                      type="text"
                      name="lastName"
                      value={bookingForm.lastName}
                      onChange={handleInputChange}
                      className="mnphoto-form-input"
                      placeholder="Votre nom de famille"
                      disabled={submitting}
                      required
                    />
                  </div>

                  <div className="mnphoto-form-group">
                    <label className="mnphoto-form-label">Email</label>
                    <input
                      type="email"
                      name="email"
                      value={bookingForm.email}
                      onChange={handleInputChange}
                      className="mnphoto-form-input"
                      placeholder="votre.email@exemple.com"
                      disabled={submitting}
                      required
                    />
                  </div>

                  <div className="mnphoto-form-group mnphoto-phone-group">
                    <label className="mnphoto-form-label">Numéro(s) de téléphone</label>
                    {bookingForm.phoneNumbers.map((phone, index) => (
                      <div key={index} className="mnphoto-phone-input-wrapper">
                        <input
                          type="tel"
                          value={phone}
                          onChange={(e) => handlePhoneChange(index, e.target.value)}
                          className="mnphoto-form-input"
                          placeholder={index === 0 ? "+213 XXX XXX XXX (Principal)" : "+213 XXX XXX XXX (Optionnel)"}
                          disabled={submitting}
                          required={index === 0}
                        />
                        <div className="mnphoto-phone-actions">
                          {index === bookingForm.phoneNumbers.length - 1 && (
                            <button
                              type="button"
                              className="mnphoto-phone-action-btn mnphoto-add-phone"
                              onClick={addPhoneNumber}
                              disabled={submitting}
                              title="Ajouter un numéro"
                            >
                              <Plus className="mnphoto-phone-icon" />
                            </button>
                          )}
                          {bookingForm.phoneNumbers.length > 1 && (
                            <button
                              type="button"
                              className="mnphoto-phone-action-btn mnphoto-remove-phone"
                              onClick={() => removePhoneNumber(index)}
                              disabled={submitting}
                              title="Supprimer ce numéro"
                            >
                              <Minus className="mnphoto-phone-icon" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Location Section */}
              <div className="mnphoto-form-section">
                <h3 className="mnphoto-form-section-title">
                  <MapPin className="mnphoto-section-icon" />
                  Localisation
                </h3>
                
                <div className="mnphoto-form-grid">
                  <div className="mnphoto-form-group">
                    <label className="mnphoto-form-label">Wilaya</label>
                    <select
                      name="wilaya"
                      value={bookingForm.wilaya}
                      onChange={handleInputChange}
                      className="mnphoto-form-select"
                      disabled={submitting}
                      required
                    >
                      <option value="">Sélectionnez votre wilaya</option>
                      {wilayaOptions.map(wilaya => (
                        <option key={wilaya} value={wilaya}>{wilaya}</option>
                      ))}
                    </select>
                  </div>

                  <div className="mnphoto-form-group mnphoto-full-width">
                    <label className="mnphoto-form-label">Adresse détaillée</label>
                    <input
                      type="text"
                      name="addressDetails"
                      value={bookingForm.addressDetails}
                      onChange={handleInputChange}
                      className="mnphoto-form-input"
                      placeholder="Adresse complète (rue, quartier, commune...)"
                      disabled={submitting}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Session Details Section */}
              <div className="mnphoto-form-section">
                <h3 className="mnphoto-form-section-title">
                  <Camera className="mnphoto-section-icon" />
                  Détails de la Séance
                </h3>
                
                <div className="mnphoto-form-grid">
                  <div className="mnphoto-form-group">
                    <label className="mnphoto-form-label">Forfait souhaité</label>
                    <input
                      type="text"
                      name="packName"
                      value={bookingForm.packName}
                      onChange={handleInputChange}
                      className="mnphoto-form-input"
                      placeholder="Nom du forfait"
                      disabled={submitting}
                      required
                    />
                  </div>

                  <div className="mnphoto-form-group">
                    <label className="mnphoto-form-label">Date souhaitée</label>
                    <input
                      type="date"
                      name="date"
                      value={bookingForm.date}
                      onChange={handleInputChange}
                      className="mnphoto-form-input"
                      min={new Date().toISOString().split('T')[0]}
                      disabled={submitting}
                      required
                    />
                  </div>

                  <div className="mnphoto-form-group">
                    <label className="mnphoto-form-label">Heure souhaitée</label>
                    <input
                      type="time"
                      name="time"
                      value={bookingForm.time}
                      onChange={handleInputChange}
                      className="mnphoto-form-input"
                      disabled={submitting}
                      required
                    />
                  </div>

                  <div className="mnphoto-form-group mnphoto-full-width">
                    <label className="mnphoto-form-label" style={{marginBottom: '0.75rem'}}>
                      Remarques <span style={{color: '#64748b', fontWeight: '400'}}>(optionnel)</span>
                    </label>
                    <textarea
                      name="remarks"
                      value={bookingForm.remarks}
                      onChange={handleInputChange}
                      rows={4}
                      className="mnphoto-form-textarea"
                      placeholder="Détails supplémentaires, demandes spéciales, style souhaité..."
                      disabled={submitting}
                    />
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              <div className="mnphoto-form-actions">
                <button
                  type="button"
                  className="mnphoto-submit-btn"
                  onClick={handleBookingSubmit}
                  disabled={submitting}
                >
                  {submitting ? 'Envoi en cours...' : 'Envoyer la demande'}
                </button>
              </div>

              {/* Form Footer */}
              <div className="mnphoto-form-footer">
                <div className="mnphoto-disclaimer">
                  <strong>Note importante :</strong> Il s'agit d'une demande de réservation. 
                  Nous vous contacterons dans les 24 heures pour confirmer la disponibilité 
                  et finaliser tous les détails de votre séance photo.
                </div>
                
                <div className="mnphoto-alternative-contact">
                  <p>Vous préférez nous contacter directement ?</p>
                  <div className="mnphoto-contact-buttons">
                    <button 
                      type="button"
                      className="mnphoto-contact-btn mnphoto-whatsapp-contact"
                      onClick={handleWhatsAppContact}
                      disabled={submitting}
                    >
                      <MessageSquare className="mnphoto-btn-icon" />
                      WhatsApp
                    </button>
                    <button 
                      type="button"
                      className="mnphoto-contact-btn mnphoto-call-contact"
                      onClick={handleCallNow}
                      disabled={submitting}
                    >
                      <Phone className="mnphoto-btn-icon" />
                      Appeler maintenant
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mnphoto-footer">
        <div className="mnphoto-footer-content">
          <div className="mnphoto-footer-brand">
            <img src={logo} alt="MN-Photography" className="mnphoto-footer-logo" />
            <h3>MN-PHOTOGRAPHY</h3>
            <p>Votre photographe professionnel en Algérie. Nous immortalisons vos moments les plus précieux avec créativité et passion.</p>
          </div>
          
          <div className="mnphoto-footer-contact">
            <h4>Contact</h4>
            <div className="mnphoto-footer-contact-item">
              <Phone className="mnphoto-footer-icon" />
              <span>{businessInfo.phone}</span>
            </div>
            <div className="mnphoto-footer-contact-item">
              <MessageSquare className="mnphoto-footer-icon" />
              <span>WhatsApp disponible 24h/7j</span>
            </div>
            <div className="mnphoto-footer-contact-item">
              <MapPin className="mnphoto-footer-icon" />
              <span>Alger et régions avoisinantes</span>
            </div>
          </div>
          
          <div className="mnphoto-footer-social">
            <h4>Suivez-nous</h4>
            <div className="mnphoto-social-links">
              <a href="#" className="mnphoto-social-link" aria-label="Instagram">
                <Instagram className="mnphoto-social-icon" />
              </a>
              <a href="#" className="mnphoto-social-link" aria-label="Facebook">
                <Facebook className="mnphoto-social-icon" />
              </a>
              <a href="#" className="mnphoto-social-link" aria-label="Twitter">
                <Twitter className="mnphoto-social-icon" />
              </a>
            </div>
          </div>
        </div>
        
        <div className="mnphoto-footer-bottom">
          <p>&copy; 2025 MN-Photography. Tous droits réservés. | Designed with ❤️ for capturing memories</p>
        </div>
      </footer>
    </div>
  );
};

export default PhotographyBookingSystem;