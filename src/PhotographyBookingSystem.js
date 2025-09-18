import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, } from 'firebase/firestore';
import {
  Camera, User, Phone, MessageSquare, Clock, MapPin, Plus, Minus,
  CheckCircle, Instagram, Facebook, Twitter, Heart, Users, Award,
  Sparkles, Zap, AlertCircle, X  // Add AlertCircle and X
} from 'lucide-react';
import nihalsvideo from './assets/nihalsvideo.mp4'; // Replace with your actual video file path
import { db } from './firebaseConfig';
import logo from './logo.jpg';
import ModernCarousel from './ModernCarousel';
import './PhotographyBookingSystem.css';
import ModernHeroSection from './ModernHeroSection';
import nihalnobcg from './nihalnobcg.png';
import useVisitorCounter from './useVisitorCounter';

const Toast = ({ toast, onRemove }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    const timer1 = setTimeout(() => setIsVisible(true), 10);
    const timer2 = setTimeout(() => {
      setIsLeaving(true);
      setTimeout(() => onRemove(toast.id), 300);
    }, toast.duration || 5000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [toast.id, toast.duration, onRemove]);

  const handleRemove = () => {
    setIsLeaving(true);
    setTimeout(() => onRemove(toast.id), 300);
  };

  const getToastStyle = () => {
    return {
      transform: isVisible ? 'translateX(0) scale(1)' : 'translateX(100%) scale(0.8)',
      opacity: isLeaving ? 0 : (isVisible ? 1 : 0),
    };
  };

  const getIcon = () => {
    const iconSize = 20;
    
    switch (toast.type) {
      case 'success':
        return <CheckCircle size={iconSize} className="toast-icon toast-icon-success" />;
      case 'error':
        return <AlertCircle size={iconSize} className="toast-icon toast-icon-error" />;
      case 'warning':
        return <AlertCircle size={iconSize} className="toast-icon toast-icon-warning" />;
      case 'info':
        return <Heart size={iconSize} className="toast-icon toast-icon-info" />;
      default:
        return <Sparkles size={iconSize} className="toast-icon toast-icon-info" />;
    }
  };

  const getToastClass = () => {
    const baseClass = 'toast';
    const typeClass = `toast-${toast.type}`;
    return `${baseClass} ${typeClass}`;
  };

  return (
    <div 
      className={getToastClass()}
      style={getToastStyle()}
    >
      <div className="toast-content">
        {getIcon()}
        <div className="toast-text">
          {toast.title && (
            <div className="toast-title">
              {toast.title}
              {toast.type === 'success' && <Sparkles size={16} className="toast-sparkle" />}
            </div>
          )}
          <div className="toast-message">
            {toast.message}
          </div>
        </div>
        <button
          onClick={handleRemove}
          className="toast-close"
          aria-label="Fermer la notification"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
};

// Toast Container Component (no changes needed)
const ToastContainer = ({ toasts, onRemoveToast }) => {
  if (!toasts.length) return null;

  return (
    <div className="toast-container">
      <div>
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            toast={toast}
            onRemove={onRemoveToast}
          />
        ))}
      </div>
    </div>
  );
};

// Fixed useToast hook with proper character encoding:
const useToast = () => {
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = 'info', title = null, duration = 5000) => {
    const id = Date.now() + Math.random();
    const toast = { id, message, type, title, duration };
    
    setToasts(prev => [...prev, toast]);
    return id;
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const showSuccess = (message, title = "Succès ✨") => {
    return addToast(message, 'success', title);
  };

  const showError = (message, title = "Oups! 😔") => {
    return addToast(message, 'error', title, 7000);
  };

  const showWarning = (message, title = "Attention ⚠️") => {
    return addToast(message, 'warning', title);
  };

  const showInfo = (message, title = "Information 💝") => {
    return addToast(message, 'info', title);
  };

  return {
    toasts,
    removeToast,
    showSuccess,
    showError,
    showWarning,
    showInfo
  };
};

const PhotographyBookingSystem = () => {
  const { toasts, removeToast, showSuccess, showError } = useToast();
  const [servicePackages, setServicePackages] = useState([]);
  const [bookingForm, setBookingForm] = useState({
    firstName: '',
    lastName: '',
    husbandFirstName: '',    // NEW FIELD
    wifeFirstName: '',
    phoneNumbers: [''],
    wilaya: '',
    addressDetails: '',
    packName: '',
    date: '',
    time: '',
    email: '',
    remarks: '',
    cortege: '',
    salleName: '',
    status: 'Requested'
  });
  const [submitting, setSubmitting] = useState(false);
  const { isNewVisitor } = useVisitorCounter();
  if (isNewVisitor) {
    console.log("Bienvenue sur le site de Nihal's Pictures !");
  }
  // Business contact information
  const businessInfo = {
    phone: '0561696809',
    whatsapp: '213561696809'
  };

  // Wilaya options
  const wilayaOptions = [
    'ALGER',
    'TIPAZA',
    'BOUMERDES',
    'BLIDA',
    'TIZI OUZOU'
  ];

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
        console.error('Erreur lors du chargement des packs:', error);
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
    ];

    loadServicePackages();
  }, []);

  // Fixed input change handler with proper event handling
  const handleInputChange = (e) => {
    // Prevent event bubbling that might interfere with key events
    e.stopPropagation();

    const { name, value } = e.target;
    setBookingForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Enhanced phone change handler with proper event handling
  const handlePhoneChange = (index, e) => {
    // Accept either event object or direct value for backward compatibility
    const value = typeof e === 'string' ? e : e.target.value;

    // Stop event propagation if it's an event object
    if (e && e.stopPropagation) {
      e.stopPropagation();
    }

    const newPhoneNumbers = [...bookingForm.phoneNumbers];
    newPhoneNumbers[index] = value;
    setBookingForm(prev => ({
      ...prev,
      phoneNumbers: newPhoneNumbers
    }));
  };

  // Enhanced keyboard event handler to ensure spaces work
  const handleKeyDown = (e) => {
    // Explicitly allow space key and prevent any interference
    if (e.key === ' ' || e.keyCode === 32) {
      // Don't prevent default for space key
      e.stopPropagation();
      return true;
    }

    // Allow all other normal typing keys
    return true;
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
      showError(
        'Veuillez vérifier que tous les champs obligatoires sont bien remplis avant de continuer.',
        'Champs manquants 📝'
      ); return;
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
      showSuccess(
        'Nous vous contacterons dans les 24 heures pour confirmer tous les détails de votre séance photo. Merci pour votre confiance !',
        'Demande envoyée avec succès ! 🎉'
      );
      setBookingForm({
        firstName: '',
        lastName: '',
        husbandFirstName: '',    // NEW FIELD
        wifeFirstName: '',
        phoneNumbers: [''],
        wilaya: '',
        addressDetails: '',
        packName: '',
        date: '',
        time: '',
        email: '',
        remarks: '',
        cortege: '',
        salleName: '',
        status: 'Requested'
      });
    } catch (error) {
      console.error('Erreur lors de la soumission:', error);
      showError(
        'Un problème technique est survenu. Veuillez réessayer dans quelques instants ou nous contacter directement par téléphone.',
        'Erreur technique 😔'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleWhatsAppContact = () => {
    // Build a default Instagram DM link (cannot pass message like WhatsApp)
    const instagramProfile = "https://www.instagram.com/nihal.s_pictures/";

    // Try to open DM link first, fallback to profile
    window.open(instagramProfile, "_blank");
  };


  const handleCallNow = () => {
    window.open(`tel:${businessInfo.phone}`, '_self');
  };

  return (
    <div className="mnphoto-page-wrapper">
      {/* Enhanced Hero Section */}
      <ModernHeroSection
        logo={nihalnobcg}
        businessInfo={businessInfo}
        onWhatsAppContact={handleWhatsAppContact}
        onCallNow={handleCallNow}
        bookingForm={bookingForm}
      />

      {/* Portfolio Carousel */}
      <section className="mnphoto-portfolio-section">
        <div className="mnphoto-section-container">
          <h2 className="mnphoto-section-title">Notre Portfolio</h2>

          <div className="mnphoto-portfolio-intro">
            <div className="mnphoto-video-container">
              <video
                className="mnphoto-portfolio-video"
                controls
                loop
                playsInline
                controlsList="nodownload"
              >
                <source src={nihalsvideo} type="video/mp4" />
                Votre navigateur ne supporte pas les vidéos HTML5.
              </video>

            </div>

            <div className="mnphoto-skills-container">
              <h3 className="mnphoto-skills-title">Notre Expertise</h3>
              <p className="mnphoto-skills-subtitle">
                Des moments uniques capturés avec passion et créativité
              </p>

              <ul className="mnphoto-skills-list">
                <li className="mnphoto-skill-item">
                  <Heart className="mnphoto-skill-icon" />
                  <div>
                    <div className="mnphoto-skill-text">Tout type d'évenement</div>
                    <div className="mnphoto-skill-description">Immortalisons votre jour J avec émotion</div>
                  </div>
                </li>

                <li className="mnphoto-skill-item">
                  <Users className="mnphoto-skill-icon" />
                  <div>
                    <div className="mnphoto-skill-text">Séances Portrait & Famille</div>
                    <div className="mnphoto-skill-description">Des portraits authentiques et naturels</div>
                  </div>
                </li>

                <li className="mnphoto-skill-item">
                  <Award className="mnphoto-skill-icon" />
                  <div>
                    <div className="mnphoto-skill-text">Événements Professionnels</div>
                    <div className="mnphoto-skill-description">Couverture complète de vos événements</div>
                  </div>
                </li>

                <li className="mnphoto-skill-item">
                  <Sparkles className="mnphoto-skill-icon" />
                  <div>
                    <div className="mnphoto-skill-text">Photographie Créative</div>
                    <div className="mnphoto-skill-description">Art et créativité dans chaque cliché</div>
                  </div>
                </li>

                <li className="mnphoto-skill-item">
                  <Zap className="mnphoto-skill-icon" />
                  <div>
                    <div className="mnphoto-skill-text">Retouche Professionnelle</div>
                    <div className="mnphoto-skill-description">Sublimation de vos photos avec expertise</div>
                  </div>
                </li>
              </ul>
            </div>
          </div>
          <ModernCarousel />
        </div>
      </section>

      {/* Services Section */}
      <section className="mnphoto-services-section">
        <div className="mnphoto-section-container">
          <h2 className="mnphoto-section-title">Nos Packs</h2>
          <div className="mnphoto-services-grid">
            {servicePackages.filter(pkg => pkg.isActive !== false).map(pkg => (
              <div key={pkg.id} className="mnphoto-service-card">
                <div className="mnphoto-service-image">
                  <img
                    src={pkg.imageUrl || logo}
                    alt={pkg.name}
                    className="mnphoto-service-img"
                  />
                  <div className="mnphoto-service-overlay">
                    <div className="mnphoto-service-price">
                      {pkg.price?.toLocaleString()} DZD
                    </div>
                    {pkg.serviceNumber && (
                      <div className="mnphoto-service-number">
                        #{pkg.serviceNumber}
                      </div>
                    )}
                  </div>
                </div>
                <div className="mnphoto-service-content">
                  <h3 className="mnphoto-service-name">{pkg.name}</h3>
                  <div className="mnphoto-service-duration">
                    <Clock className="mnphoto-duration-icon" />
                    <span>{pkg.duration}</span>
                  </div>
                  <p className="mnphoto-service-description">{pkg.description}</p>

                  {pkg.features && pkg.features.length > 0 && (
                    <div className="mnphoto-service-features">
                      <h4>Inclus dans ce pack :</h4>
                      <ul className="mnphoto-features-list">
                        {pkg.features.map((feature, index) => (
                          <li key={index} className="mnphoto-feature-item">
                            <CheckCircle className="mnphoto-feature-icon" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <button
                    className="mnphoto-service-select-btn"
                    onClick={() => setBookingForm(prev => ({ ...prev, packName: pkg.name }))}
                  >
                    Choisir ce pack
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
                      onKeyDown={handleKeyDown}
                      className="mnphoto-form-input"
                      placeholder="Votre prénom"
                      disabled={submitting}
                      required
                      autoComplete="given-name"
                    />
                  </div>

                  <div className="mnphoto-form-group">
                    <label className="mnphoto-form-label">Nom de famille</label>
                    <input
                      type="text"
                      name="lastName"
                      value={bookingForm.lastName}
                      onChange={handleInputChange}
                      onKeyDown={handleKeyDown}
                      className="mnphoto-form-input"
                      placeholder="Votre nom de famille"
                      disabled={submitting}
                      required
                      autoComplete="family-name"
                    />
                  </div>

                  <div className="mnphoto-form-group">
                    <label className="mnphoto-form-label">
                      Prénom du marié <span style={{ color: '#64748b', fontWeight: '400' }}>(optionnel)</span>
                    </label>
                    <input
                      type="text"
                      name="husbandFirstName"
                      value={bookingForm.husbandFirstName}
                      onChange={handleInputChange}
                      onKeyDown={handleKeyDown}
                      className="mnphoto-form-input"
                      placeholder="Prénom du marié"
                      disabled={submitting}
                      autoComplete="off"
                    />
                  </div>

                  <div className="mnphoto-form-group">
                    <label className="mnphoto-form-label">
                      Prénom de la mariée <span style={{ color: '#64748b', fontWeight: '400' }}>(optionnel)</span>
                    </label>
                    <input
                      type="text"
                      name="wifeFirstName"
                      value={bookingForm.wifeFirstName}
                      onChange={handleInputChange}
                      onKeyDown={handleKeyDown}
                      className="mnphoto-form-input"
                      placeholder="Prénom de la mariée"
                      disabled={submitting}
                      autoComplete="off"
                    />
                  </div>

                  <div className="mnphoto-form-group ">
                    <label className="mnphoto-form-label">Email</label>
                    <input
                      type="email"
                      name="email"
                      value={bookingForm.email}
                      onChange={handleInputChange}
                      onKeyDown={handleKeyDown}
                      className="mnphoto-form-input"
                      placeholder="votre.email@exemple.com"
                      disabled={submitting}
                      required
                      autoComplete="email"
                    />
                  </div>

                  <div className="mnphoto-form-group mnphoto-phone-group">
                    <label className="mnphoto-form-label">Numéro(s) de téléphone</label>
                    {bookingForm.phoneNumbers.map((phone, index) => (
                      <div key={index} className="mnphoto-phone-input-wrapper">
                        <input
                          type="tel"
                          value={phone}
                          onChange={(e) => handlePhoneChange(index, e)}
                          onKeyDown={handleKeyDown}
                          className="mnphoto-form-input"
                          placeholder={index === 0 ? "+213 XXX XXX XXX (Principal)" : "+213 XXX XXX XXX (Optionnel)"}
                          disabled={submitting}
                          required={index === 0}
                          autoComplete="tel"
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
                      onKeyDown={handleKeyDown}
                      className="mnphoto-form-input"
                      placeholder="Adresse complète (rue, quartier, commune...)"
                      disabled={submitting}
                      required
                      autoComplete="street-address"
                    />
                  </div>
                  <div className="mnphoto-form-group mnphoto-full-width">
                    <label className="mnphoto-form-label">
                      Nom de la salle de mariage <span style={{ color: '#64748b', fontWeight: '400' }}>(optionnel)</span>
                    </label>
                    <input
                      type="text"
                      name="salleName"
                      value={bookingForm.salleName}
                      onChange={handleInputChange}
                      onKeyDown={handleKeyDown}
                      className="mnphoto-form-input"
                      placeholder="Nom de la salle des fêtes ou lieu de réception"
                      disabled={submitting}
                      autoComplete="off"
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
                    <label className="mnphoto-form-label">pack souhaité</label>
                    <input
                      type="text"
                      name="packName"
                      value={bookingForm.packName}
                      onChange={handleInputChange}
                      onKeyDown={handleKeyDown}
                      className="mnphoto-form-input"
                      placeholder="Nom du pack"
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
                    <label className="mnphoto-form-label">Cortège</label>
                    <div className="mnphoto-radio-group">
                      <label className="mnphoto-radio-option">
                        <input
                          type="radio"
                          name="cortege"
                          value="oui"
                          checked={bookingForm.cortege === 'oui'}
                          onChange={handleInputChange}
                          className="mnphoto-radio-input"
                          disabled={submitting}
                        />
                        <span className="mnphoto-radio-custom"></span>
                        <span className="mnphoto-radio-label">Oui</span>
                      </label>
                      <label className="mnphoto-radio-option">
                        <input
                          type="radio"
                          name="cortege"
                          value="non"
                          checked={bookingForm.cortege === 'non'}
                          onChange={handleInputChange}
                          className="mnphoto-radio-input"
                          disabled={submitting}
                        />
                        <span className="mnphoto-radio-custom"></span>
                        <span className="mnphoto-radio-label">Non</span>
                      </label>
                    </div>
                  </div>

                  <div className="mnphoto-form-group mnphoto-full-width">
                    <label className="mnphoto-form-label" style={{ marginBottom: '0.75rem' }}>
                      Remarques <span style={{ color: '#64748b', fontWeight: '400' }}>(optionnel)</span>
                    </label>
                    <textarea
                      name="remarks"
                      value={bookingForm.remarks}
                      onChange={handleInputChange}
                      onKeyDown={handleKeyDown}
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
                      Instagrame
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
            <h3>Nihal's Pictures PHOTOGRAPHY</h3>
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
              <span>Instagrame disponible 24h/7j</span>
            </div>
            <div className="mnphoto-footer-contact-item">
              <MapPin className="mnphoto-footer-icon" />
              <span>Alger et régions avoisinantes</span>
            </div>
          </div>

          <div className="mnphoto-footer-social">
            <h4>Suivez-nous</h4>
            <div className="mnphoto-social-links">
              <a href="https://www.instagram.com/nihal.s_pictures/" className="mnphoto-social-link" aria-label="Instagram">
                <Instagram className="mnphoto-social-icon" />
              </a>
              <a href="https://www.facebook.com/nihals.pictures/" className="mnphoto-social-link" aria-label="Facebook">
                <Facebook className="mnphoto-social-icon" />
              </a>
              <a href="https://www.instagram.com/nihal.s_pictures/" className="mnphoto-social-link" aria-label="Twitter">
                <Twitter className="mnphoto-social-icon" />
              </a>
            </div>
          </div>
        </div>

        <div className="mnphoto-footer-bottom">
          <p>&copy; 2025 Nihal's Pictures Photography. Tous droits réservés. | Designed with ❤️ for capturing memories</p>
        </div>
      </footer>
      <ToastContainer toasts={toasts} onRemoveToast={removeToast} />

    </div>
  );
};

export default PhotographyBookingSystem;