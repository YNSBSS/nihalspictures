import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ChevronLeft, ChevronRight, Maximize2, X, Instagram, Heart, Share2 } from 'lucide-react';
import './ModernCarousel.css';
import pic1 from './assets/pic1.jpg';
import pic2 from './assets/pic2.jpg';
import pic3 from './assets/pic3.jpg';
import pic4 from './assets/pic4.jpg';
import pic5 from './assets/pic5.jpg';
import pic6 from './assets/pic6.jpg';
/*
import pic7 from './assets/pic7.jpg';
import pic8 from './assets/pic8.jpg';
import pic9 from './assets/pic9.jpg';
import pic10 from './assets/pic10.jpg';
import pic11 from './assets/pic11.jpg';
import pic12 from './assets/pic12.jpg';*/
// Fallback images - replace with your actual images


const ModernCarousel = () => {
  const fallbackImages = [
  {
    id: '1',
    url: pic1,
    instagramUrl: 'https://www.instagram.com/p/DMTgEcSsMWJ/?img_index=1',
    title: 'Portrait Professionnel',
    description: 'Séance photo portrait en studio avec éclairage professionnel'
  },
  {
    id: '2', 
    url: pic2,
    instagramUrl: 'https://www.instagram.com/p/DMAVTV8MQvZ/?img_index=1',
    title: 'Photographie de Mariage',
    description: 'Moments précieux capturés lors d\'une cérémonie de mariage'
  },
  {
    id: '3',
    url: pic3,
    instagramUrl: 'https://www.instagram.com/p/DMAUfo4MgMI/?img_index=1',
    title: 'Séance Couple',
    description: 'Séance photo romantique en extérieur au coucher du soleil'
  },
  {
    id: '4',
    url: pic4,
    instagramUrl: 'https://www.instagram.com/p/DMAUMKXsE0o/?img_index=1', 
    title: 'Photographie Événementielle',
    description: 'Couverture photo complète d\'événements spéciaux'
  },
  {
    id: '5',
    url: pic5,
    instagramUrl: 'https://www.instagram.com/p/DIJHhY1MGos/',
    title: 'Session Famille',
    description: 'Moments familiaux authentiques capturés naturellement'
  },
  {
    id: '6',
    url: pic6,
    instagramUrl: 'https://www.instagram.com/p/DIJHhY1MGos/',
    title: 'Portrait Corporate',
    description: 'Photos professionnelles pour entreprises'
  }
];
const images = fallbackImages;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [showLightbox, setShowLightbox] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [liked, setLiked] = useState(new Set());
  const carouselRef = useRef(null);
  const intervalRef = useRef(null);

  // Auto-play functionality with smooth transitions
const currentIndexRef = useRef(0);

useEffect(() => {
  currentIndexRef.current = currentIndex;
});

useEffect(() => {
  if (!isPlaying || images.length === 0) {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    return;
  }

  intervalRef.current = setInterval(() => {
    const newIndex = (currentIndexRef.current + 1) % images.length;
    setCurrentIndex(newIndex);
    setIsTransitioning(true);
    setTimeout(() => setIsTransitioning(false), 800);
  }, 5000);

  return () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  };
}, [isPlaying, images.length]);
  const goToSlide = useCallback((index, direction = 'next') => {
    if (isTransitioning || index === currentIndex) return;
    
    setIsTransitioning(true);
    setCurrentIndex(index);
    
    setTimeout(() => setIsTransitioning(false), 800);
  }, [isTransitioning, currentIndex]);

  const goToPrevious = useCallback(() => {
    if (isTransitioning) return;
    const newIndex = (currentIndex - 1 + images.length) % images.length;
    goToSlide(newIndex, 'prev');
  }, [currentIndex, images.length, isTransitioning, goToSlide]);

  const goToNext = useCallback(() => {
    if (isTransitioning) return;
    const newIndex = (currentIndex + 1) % images.length;
    goToSlide(newIndex, 'next');
  }, [currentIndex, images.length, isTransitioning, goToSlide]);

  const openLightbox = (index) => {
    setLightboxIndex(index);
    setShowLightbox(true);
    setIsPlaying(false);
  };

  const closeLightbox = () => {
    setShowLightbox(false);
    setIsPlaying(true);
  };

  const openInstagram = (url) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const toggleLike = (imageId) => {
    setLiked(prev => {
      const newLiked = new Set(prev);
      if (newLiked.has(imageId)) {
        newLiked.delete(imageId);
      } else {
        newLiked.add(imageId);
      }
      return newLiked;
    });
  };

  const shareImage = async (image) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: image.title,
          text: image.description,
          url: image.instagramUrl || window.location.href,
        });
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      // Fallback to clipboard
      navigator.clipboard.writeText(image.instagramUrl || window.location.href);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (showLightbox) return;
      
      switch (e.key) {
        case 'ArrowLeft':
          goToPrevious();
          break;
        case 'ArrowRight':
          goToNext();
          break;
        case ' ':
          e.preventDefault();
          setIsPlaying(!isPlaying);
          break;
        case 'Escape':
          if (showLightbox) closeLightbox();
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [goToPrevious, goToNext, isPlaying, showLightbox]);



  if (images.length === 0) {
    return (
      <div className="carousel-container">
        <div className="carousel-empty">
          <p>Aucune image disponible</p>
        </div>
      </div>
    );
  }

  const getSlideClass = (index) => {
    const total = images.length;
    let position = index - currentIndex;
    
    if (position < -total / 2) position += total;
    if (position > total / 2) position -= total;
    
    if (position === 0) return 'slide-center';
    if (position === 1) return 'slide-right-1';
    if (position === -1) return 'slide-left-1';
    if (position === 2) return 'slide-right-2';
    if (position === -2) return 'slide-left-2';
    return position > 0 ? 'slide-far-right' : 'slide-far-left';
  };

  return (
    <>
      <div className="carousel-container" ref={carouselRef}>
        <div className="carousel-wrapper">
          {/* Background with dynamic blur */}
          <div 
            className="carousel-background"
            style={{
              backgroundImage: `url(${images[currentIndex]?.url})`
            }}
          />

          {/* 3D Carousel Content */}
          <div className="carousel-content">
            {/* Enhanced Navigation Buttons */}
            <button
              className="carousel-nav carousel-nav-left"
              onClick={goToPrevious}
              disabled={isTransitioning}
              aria-label="Image précédente"
            >
              <ChevronLeft size={28} />
              <span className="nav-label">Précédent</span>
            </button>

            <button
              className="carousel-nav carousel-nav-right"
              onClick={goToNext}
              disabled={isTransitioning}
              aria-label="Image suivante"
            >
              <ChevronRight size={28} />
              <span className="nav-label">Suivant</span>
            </button>

            {/* 3D Carousel Track */}
            <div className="carousel-3d-container">
              <div className="carousel-3d-track">
                {images.map((image, index) => (
                  <div
                    key={image.id}
                    className={`carousel-3d-slide ${getSlideClass(index)} ${isTransitioning ? 'transitioning' : ''}`}
                    onClick={() => index === currentIndex ? openLightbox(index) : goToSlide(index)}
                  >
                    <div className="slide-inner">
                      <img
                        src={image.url}
                        alt={image.title || `Image ${index + 1}`}
                        className="slide-image"
                        loading="lazy"
                      />
                      
                      {/* Overlay for center slide */}
                      {index === currentIndex && (
                        <div className="slide-overlay">
                          <div className="slide-info">
                            {image.title && (
                              <h3 className="slide-title">{image.title}</h3>
                            )}
                            {image.description && (
                              <p className="slide-description">{image.description}</p>
                            )}
                          </div>
                          
                          <div className="slide-actions">
                            <button
                              className={`action-btn like-btn ${liked.has(image.id) ? 'liked' : ''}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleLike(image.id);
                              }}
                              title="J'aime"
                            >
                              <Heart fill={liked.has(image.id) ? 'currentColor' : 'none'} />
                            </button>

                            <button
                              className="action-btn share-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                shareImage(image);
                              }}
                              title="Partager"
                            >
                              <Share2 />
                            </button>
                            
                            <button
                              className="action-btn fullscreen-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                openLightbox(index);
                              }}
                              title="Plein écran"
                            >
                              <Maximize2 />
                            </button>
                            
                            {image.instagramUrl && (
                              <button
                                className="action-btn instagram-btn"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openInstagram(image.instagramUrl);
                                }}
                                title="Voir sur Instagram"
                              >
                                <Instagram />
                              </button>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Slide indicator for non-center slides */}
                      {index !== currentIndex && (
                        <div className="slide-indicator">
                          <span>{index + 1}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Modern Thumbnail Navigation 
            <div className="carousel-thumbnails">
              <div className="thumbnails-track">
                {images.map((image, index) => (
                  <button
                    key={image.id}
                    className={`thumbnail ${index === currentIndex ? 'active' : ''}`}
                    onClick={() => goToSlide(index)}
                    disabled={isTransitioning}
                    title={image.title || `Image ${index + 1}`}
                  >
                    <img
                      src={image.url}
                      alt={`Miniature ${index + 1}`}
                      className="thumbnail-image"
                    />
                    <div className="thumbnail-overlay">
                      <span className="thumbnail-number">{index + 1}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
*/}
            {/* Enhanced Controls 
            <div className="carousel-controls">
              <div className="controls-left">
                <button
                  className={`control-btn play-pause ${isPlaying ? 'playing' : 'paused'}`}
                  onClick={() => setIsPlaying(!isPlaying)}
                  title={isPlaying ? 'Pause' : 'Lecture'}
                >
                  {isPlaying ? <Pause /> : <Play />}
                </button>
                
                
              </div>

              <div className="carousel-progress">
                <div className="progress-track">
                  <div 
                    className="progress-bar"
                    style={{
                      width: `${((currentIndex + 1) / images.length) * 100}%`
                    }}
                  />
                </div>
              </div>

              <div className="controls-right">
                <div className="image-title">
                  {images[currentIndex]?.title || `Image ${currentIndex + 1}`}
                </div>
              </div>
            </div>
            */}
          </div>
        </div>
      </div>

      {/* Enhanced Lightbox Modal */}
      {showLightbox && (
        <div className="lightbox-overlay" onClick={closeLightbox}>
          <div className="lightbox-container" onClick={(e) => e.stopPropagation()}>
            <button
              className="lightbox-close"
              onClick={closeLightbox}
              title="Fermer"
            >
              <X />
            </button>

            <div className="lightbox-content">
              <button
                className="lightbox-nav lightbox-nav-left"
                onClick={() => setLightboxIndex((prev) => (prev - 1 + images.length) % images.length)}
                title="Image précédente"
              >
                <ChevronLeft />
              </button>

              <div className="lightbox-image-wrapper">
                <img
                  src={images[lightboxIndex]?.url}
                  alt={images[lightboxIndex]?.title}
                  className="lightbox-image"
                />
              </div>

              <button
                className="lightbox-nav lightbox-nav-right"
                onClick={() => setLightboxIndex((prev) => (prev + 1) % images.length)}
                title="Image suivante"
              >
                <ChevronRight />
              </button>
            </div>

            {/* Lightbox Info Panel */}
            <div className="lightbox-info">
              <div className="info-content">
                {images[lightboxIndex]?.title && (
                  <h3>{images[lightboxIndex].title}</h3>
                )}
                {images[lightboxIndex]?.description && (
                  <p>{images[lightboxIndex].description}</p>
                )}
              </div>
              
              <div className="info-actions">
                {images[lightboxIndex]?.instagramUrl && (
                  <button
                    className="lightbox-instagram"
                    onClick={() => openInstagram(images[lightboxIndex].instagramUrl)}
                  >
                    <Instagram />
                    Instagram
                  </button>
                )}
                
                <button
                  className="lightbox-share"
                  onClick={() => shareImage(images[lightboxIndex])}
                >
                  <Share2 />
                  Partager
                </button>
              </div>
            </div>

            {/* Lightbox Thumbnails */}
            <div className="lightbox-thumbnails">
              {images.map((image, index) => (
                <button
                  key={image.id}
                  className={`lightbox-thumbnail ${index === lightboxIndex ? 'active' : ''}`}
                  onClick={() => setLightboxIndex(index)}
                  title={image.title || `Image ${index + 1}`}
                >
                  <img src={image.url} alt={`Miniature ${index + 1}`} />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ModernCarousel;