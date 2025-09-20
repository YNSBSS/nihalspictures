import React, { useState } from 'react';
import { Clock, CheckCircle, X, Heart, Users, Award, Sparkles } from 'lucide-react';

const PackageCards = ({ servicePackages, onSelectPackage, logo }) => {
  const [expandedPackage, setExpandedPackage] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  // Helper function to sort packages by service number (treating as number)
  const sortPackagesByServiceNumber = (packages) => {
    return packages.sort((a, b) => {
      const numA = parseInt(a.serviceNumber) || 0;
      const numB = parseInt(b.serviceNumber) || 0;
      return numA - numB;
    });
  };

  // Filter packages by category and sort by service number
  const mariagePackages = sortPackagesByServiceNumber(
    servicePackages.filter(pkg => 
      pkg.category === 'mariage' && pkg.isActive !== false
    )
  );

  const getPackagesByCategory = (category) => {
    return sortPackagesByServiceNumber(
      servicePackages.filter(pkg => 
        pkg.category === category && pkg.isActive !== false
      )
    );
  };

  // Get first package image for each category
  const getCategoryImage = (category) => {
    const packages = getPackagesByCategory(category);
    return packages.length > 0 ? packages[0].imageUrl : logo;
  };

  // Get available categories (excluding mariage since it's displayed by default)
  const otherCategories = [...new Set(
    servicePackages
      .filter(pkg => pkg.category !== 'mariage' && pkg.isActive !== false)
      .map(pkg => pkg.category)
  )];

  const getCategoryDisplayName = (category) => {
    const categoryNames = {
      'fiancaille': 'Fiançaille',
      'soutenance': 'Soutenance',
      'autres': 'Autres'
    };
    return categoryNames[category] || category;
  };

  const getCategoryIcon = (category) => {
    const categoryIcons = {
      'fiancaille': Heart,
      'soutenance': Award,
      'autres': Sparkles
    };
    const IconComponent = categoryIcons[category] || Users;
    return <IconComponent className="mnphoto-duration-icon" />;
  };

  const handleCategoryClick = (category) => {
    setSelectedCategory(category);
    setShowCategoryModal(true);
  };

  const closeCategoryModal = () => {
    setShowCategoryModal(false);
    setSelectedCategory(null);
  };

  const togglePackageDetails = (packageId) => {
    setExpandedPackage(expandedPackage === packageId ? null : packageId);
  };

  const formatFeatures = (features) => {
    if (!features || !Array.isArray(features)) return [];
    
    // Process all features, not just the first one
    const allFeatures = [];
    features.forEach(featureString => {
      if (typeof featureString === 'string') {
        const splitFeatures = featureString.split('•').map(feature => feature.trim()).filter(feature => feature);
        allFeatures.push(...splitFeatures);
      }
    });
    
    return allFeatures;
  };

  const PackageCard = ({ pkg, isModal = false }) => (
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
        <h3 className="mnphoto-service-name">{pkg.category} - {pkg.name}</h3>
        <div className="mnphoto-service-duration">
          <Clock className="mnphoto-duration-icon" />
          <span>{pkg.duration}</span>
        </div>

        {/* Transport fees subtitle */}
        <p className="mnphoto-transport-note" style={{
          fontSize: '0.85rem',
          color: '#7C6F65',
          fontStyle: 'italic',
          margin: '0.5rem 0',
          opacity: 0.8
        }}>
          * Frais de transport non inclus
        </p>

        {/* Show features when expanded */}
        {expandedPackage === pkg.id && pkg.features && (
          <div className="mnphoto-service-features" style={{ marginTop: '1rem' }}>
            {/* Always show description */}
            <p className="mnphoto-service-description">{pkg.description}</p>
            <h4>Inclus dans ce pack :</h4>
            <ul className="mnphoto-features-list">
              {formatFeatures(pkg.features).map((feature, index) => (
                <li key={index} className="mnphoto-feature-item">
                  <CheckCircle className="mnphoto-feature-icon" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
          <button
            className="mnphoto-service-select-btn"
            onClick={() => togglePackageDetails(pkg.id)}
            style={{ flex: 1 }}
          >
            {expandedPackage === pkg.id ? 'Masquer les détails' : 'En savoir plus sur ce pack'}
          </button>
        </div>
      </div>
    </div>
  );

  const CategoryCard = ({ category }) => (
    <div 
      className="mnphoto-service-card" 
      style={{ cursor: 'pointer' }}
      onClick={() => handleCategoryClick(category)}
    >
      <div className="mnphoto-service-image">
        <img
          src={getCategoryImage(category)}
          alt={getCategoryDisplayName(category)}
          className="mnphoto-service-img"
          style={{ filter: 'brightness(0.7)' }}
        />
        <div className="mnphoto-service-overlay" style={{
          background: 'linear-gradient(135deg, rgba(154, 155, 115, 0.9) 0%, rgba(124, 111, 101, 0.9) 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{ color: '#FBF9F6', fontSize: '3rem' }}>
            {getCategoryIcon(category)}
          </div>
        </div>
      </div>
      <div className="mnphoto-service-content">
        <h3 className="mnphoto-service-name">{getCategoryDisplayName(category)}</h3>
        <div className="mnphoto-service-duration">
          <Users className="mnphoto-duration-icon" />
          <span>{getPackagesByCategory(category).length} pack(s) disponible(s)</span>
        </div>
        <p className="mnphoto-service-description">
          Découvrez nos packages spécialisés pour {getCategoryDisplayName(category).toLowerCase()}
        </p>

        <button
          className="mnphoto-service-select-btn"
          onClick={(e) => {
            e.stopPropagation();
            handleCategoryClick(category);
          }}
        >
          Voir les packages
        </button>
      </div>
    </div>
  );

  return (
    <>
      <div className="mnphoto-services-grid">
        {/* Display mariage packages first */}
        {mariagePackages.map(pkg => (
          <PackageCard key={pkg.id} pkg={pkg} />
        ))}

        {/* Display other categories as cards */}
        {otherCategories.map(category => (
          <CategoryCard key={category} category={category} />
        ))}
      </div>

      {/* Category Modal */}
      {showCategoryModal && selectedCategory && (
        <div 
          className="modal-overlay" 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(124, 111, 101, 0.8)',
            backdropFilter: 'blur(10px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem'
          }}
          onClick={closeCategoryModal}
        >
          <div 
            className="modal-content"
            style={{
              backgroundColor: '#FBF9F6',
              borderRadius: '24px',
              border: '2px solid rgba(227, 178, 60, 0.2)',
              maxWidth: '90vw',
              width: '100%',
              minHeight: '100vh',
              overflow: 'auto',
              position: 'relative',
              boxShadow: '0 25px 50px rgba(124, 111, 101, 0.35)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{
              padding: '2rem',
              borderBottom: '1px solid rgba(227, 178, 60, 0.2)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h2 style={{
                fontSize: '2rem',
                fontWeight: '700',
                background: 'linear-gradient(135deg, #7C6F65 0%, #C47452 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                margin: 0
              }}>
                Packages {getCategoryDisplayName(selectedCategory)}
              </h2>
              <button
                onClick={closeCategoryModal}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#7C6F65',
                  padding: '0.5rem',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <X size={24} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '2rem' }}>
              <div className="mnphoto-services-grid">
                {getPackagesByCategory(selectedCategory).map(pkg => (
                  <PackageCard key={pkg.id} pkg={pkg} isModal={true} />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PackageCards;