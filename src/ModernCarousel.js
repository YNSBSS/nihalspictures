import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ChevronLeft, ChevronRight, Maximize2, X, Instagram, Heart, Share2 } from 'lucide-react';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from './firebaseConfig'; // Import your Firebase config
import './ModernCarousel.css';

const ModernCarousel = () => {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [showLightbox, setShowLightbox] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [liked, setLiked] = useState(new Set());
  const carouselRef = useRef(null);
  const intervalRef = useRef(null);
  const videoRefsMap = useRef(new Map());

  // Load media data from Firestore
  useEffect(() => {
    const loadMediaFromFirestore = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Query the collection - adjust collection name as needed
        const mediaQuery = query(
          collection(db, 'media'), // Change 'media' to your collection name
          orderBy('createdAt', 'desc') // Order by creation date, adjust field name as needed
        );
        
        const querySnapshot = await getDocs(mediaQuery);
        const mediaData = [];
        
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          mediaData.push({
            id: doc.id,
            url: data.url, // URL field in your Firestore document
            type: data.type || 'image', // 'image' or 'video' - defaults to image if not specified
            instagramUrl: data.instagramUrl || '',
            title: data.title || '',
            description: data.description || '',
            createdAt: data.createdAt,
            // Add any other fields you have in your Firestore documents
          });
        });
        
        setImages(mediaData);
      } catch (err) {
        console.error('Error loading media from Firestore:', err);
        setError('Erreur lors du chargement des médias');
      } finally {
        setLoading(false);
      }
    };

    loadMediaFromFirestore();
  }, []);

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

  // Manage video playback
  useEffect(() => {
    // Play all videos when they should be playing
    videoRefsMap.current.forEach((videoElement, mediaId) => {
      if (videoElement && videoElement.paused) {
        videoElement.play().catch(console.error);
      }
    });
  }, [currentIndex]);

  // Cleanup video refs on unmount - FIXED
  useEffect(() => {
    // Capture the current value of the ref
    const currentVideoRefsMap = videoRefsMap.current;
    
    return () => {
      // Use the captured value in the cleanup function
      currentVideoRefsMap.forEach(video => {
        if (video) {
          video.pause();
        }
      });
    };
  }, []);

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

  // Fixed video ref callback to prevent infinite loops
  const setVideoRef = useCallback((element, mediaId) => {
    if (element) {
      videoRefsMap.current.set(mediaId, element);
    } else {
      videoRefsMap.current.delete(mediaId);
    }
  }, []);

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

  // Render media content (image or video)
  const renderMedia = (media, isCenter = false, isLightbox = false) => {
    const className = isLightbox ? 'lightbox-image' : 'slide-image';
    
    if (media.type === 'video') {
      return (
        <video
          ref={!isLightbox ? (el) => setVideoRef(el, media.id) : null}
          src={media.url}
          className={className}
          controls={isCenter || isLightbox}
          muted={true} // Always muted for autoplay to work
          loop={true} // Always loop
          autoPlay={true} // Always autoplay
          playsInline
          loading="lazy"
          onLoadedData={(e) => {
            // Ensure video starts playing when loaded
            if (!isLightbox) {
              e.target.play().catch(console.error);
            }
          }}
        />
      );
    } else {
      return (
        <img
          src={media.url}
          alt={media.title || `Media ${media.id}`}
          className={className}
          loading="lazy"
        />
      );
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="carousel-container">
        <div className="carousel-empty">
          <p>Chargement des médias...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="carousel-container">
        <div className="carousel-empty">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  // Empty state
  if (images.length === 0) {
    return (
      <div className="carousel-container">
        <div className="carousel-empty">
          <p>Aucun média disponible</p>
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
              aria-label="Média précédent"
            >
              <ChevronLeft size={28} />
              <span className="nav-label">Précédent</span>
            </button>

            <button
              className="carousel-nav carousel-nav-right"
              onClick={goToNext}
              disabled={isTransitioning}
              aria-label="Média suivant"
            >
              <ChevronRight size={28} />
              <span className="nav-label">Suivant</span>
            </button>

            {/* 3D Carousel Track */}
            <div className="carousel-3d-container">
              <div className="carousel-3d-track">
                {images.map((media, index) => (
                  <div
                    key={media.id}
                    className={`carousel-3d-slide ${getSlideClass(index)} ${isTransitioning ? 'transitioning' : ''}`}
                    onClick={() => index === currentIndex ? openLightbox(index) : goToSlide(index)}
                  >
                    <div className="slide-inner">
                      {renderMedia(media, index === currentIndex)}
                      
                      {/* Overlay for center slide */}
                      {index === currentIndex && (
                        <div className="slide-overlay">
                          <div className="slide-info">
                            {media.title && (
                              <h3 className="slide-title">{media.title}</h3>
                            )}
                            {media.description && (
                              <p className="slide-description">{media.description}</p>
                            )}
                          </div>
                          
                          <div className="slide-actions">
                            <button
                              className={`action-btn like-btn ${liked.has(media.id) ? 'liked' : ''}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleLike(media.id);
                              }}
                              title="J'aime"
                            >
                              <Heart fill={liked.has(media.id) ? 'currentColor' : 'none'} />
                            </button>

                            <button
                              className="action-btn share-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                shareImage(media);
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
                            
                            {media.instagramUrl && (
                              <button
                                className="action-btn instagram-btn"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openInstagram(media.instagramUrl);
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
                title="Média précédent"
              >
                <ChevronLeft />
              </button>

              <div className="lightbox-image-wrapper">
                {renderMedia(images[lightboxIndex], false, true)}
              </div>

              <button
                className="lightbox-nav lightbox-nav-right"
                onClick={() => setLightboxIndex((prev) => (prev + 1) % images.length)}
                title="Média suivant"
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
              {images.map((media, index) => (
                <button
                  key={media.id}
                  className={`lightbox-thumbnail ${index === lightboxIndex ? 'active' : ''}`}
                  onClick={() => setLightboxIndex(index)}
                  title={media.title || `Média ${index + 1}`}
                >
                  {media.type === 'video' ? (
                    <video src={media.url} muted />
                  ) : (
                    <img src={media.url} alt={`Miniature ${index + 1}`} />
                  )}
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