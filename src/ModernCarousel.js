import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ChevronLeft, ChevronRight, Maximize2, X, Instagram, Heart, Share2, Play, Pause } from 'lucide-react';
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
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  // Load media data from Firestore
  useEffect(() => {
    const loadMediaFromFirestore = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const mediaQuery = query(
          collection(db, 'media'),
          orderBy('createdAt', 'desc')
        );
        
        const querySnapshot = await getDocs(mediaQuery);
        const mediaData = [];
        
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          mediaData.push({
            id: doc.id,
            url: data.url,
            type: data.type || 'image',
            instagramUrl: data.instagramUrl || '',
            title: data.title || '',
            description: data.description || '',
            createdAt: data.createdAt,
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

  // Auto-play functionality
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
      setTimeout(() => setIsTransitioning(false), 600);
    }, 5000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPlaying, images.length]);

  // Video management with performance optimization
  useEffect(() => {
    videoRefsMap.current.forEach((videoElement, mediaId) => {
      if (videoElement) {
        const mediaIndex = images.findIndex(img => img.id === mediaId);
        if (Math.abs(mediaIndex - currentIndex) <= 1) {
          // Only play videos that are visible or adjacent
          if (videoElement.paused) {
            videoElement.play().catch(console.error);
          }
        } else {
          videoElement.pause();
        }
      }
    });
  }, [currentIndex, images]);

  // Cleanup
  useEffect(() => {
    const currentVideoRefsMap = videoRefsMap.current;
    
    return () => {
      currentVideoRefsMap.forEach(video => {
        if (video) {
          video.pause();
        }
      });
    };
  }, []);

  const goToSlide = useCallback((index) => {
    if (isTransitioning || index === currentIndex || index < 0 || index >= images.length) return;
    
    setIsTransitioning(true);
    setCurrentIndex(index);
    
    setTimeout(() => setIsTransitioning(false), 600);
  }, [isTransitioning, currentIndex, images.length]);

  const goToPrevious = useCallback(() => {
    if (isTransitioning) return;
    const newIndex = (currentIndex - 1 + images.length) % images.length;
    goToSlide(newIndex);
  }, [currentIndex, images.length, isTransitioning, goToSlide]);

  const goToNext = useCallback(() => {
    if (isTransitioning) return;
    const newIndex = (currentIndex + 1) % images.length;
    goToSlide(newIndex);
  }, [currentIndex, images.length, isTransitioning, goToSlide]);

  const openLightbox = (index) => {
    setLightboxIndex(index);
    setShowLightbox(true);
    setIsPlaying(false);
    // Prevent body scroll when lightbox is open
    document.body.style.overflow = 'hidden';
  };

  const closeLightbox = () => {
    setShowLightbox(false);
    setIsPlaying(true);
    // Restore body scroll
    document.body.style.overflow = 'unset';
  };

  const openInstagram = (url) => {
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
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
          title: image.title || 'Image partagée',
          text: image.description || 'Découvrez cette image',
          url: image.instagramUrl || window.location.href,
        });
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.log('Error sharing:', err);
          fallbackShare(image);
        }
      }
    } else {
      fallbackShare(image);
    }
  };

  const fallbackShare = (image) => {
    const url = image.instagramUrl || window.location.href;
    navigator.clipboard?.writeText(url).then(() => {
      // You could show a toast notification here
      console.log('URL copied to clipboard');
    }).catch(() => {
      // Fallback for very old browsers
      const textArea = document.createElement('textarea');
      textArea.value = url;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    });
  };

  const setVideoRef = useCallback((element, mediaId) => {
    if (element) {
      videoRefsMap.current.set(mediaId, element);
    } else {
      videoRefsMap.current.delete(mediaId);
    }
  }, []);

  // Touch/swipe handling
  const handleTouchStart = (e) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    
    const distance = touchStartX.current - touchEndX.current;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      goToNext();
    } else if (isRightSwipe) {
      goToPrevious();
    }

    touchStartX.current = 0;
    touchEndX.current = 0;
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (showLightbox) {
        switch (e.key) {
          case 'ArrowLeft':
            setLightboxIndex((prev) => (prev - 1 + images.length) % images.length);
            break;
          case 'ArrowRight':
            setLightboxIndex((prev) => (prev + 1) % images.length);
            break;
          case 'Escape':
            closeLightbox();
            break;
          default:
            break;
        }
        return;
      }
      
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
  }, [goToPrevious, goToNext, isPlaying, showLightbox, images.length]);

  // Render media content
  const renderMedia = (media, isCenter = false, isLightbox = false) => {
    const className = isLightbox ? 'lightbox-image' : 'slide-image';
    
    if (media.type === 'video') {
      return (
        <video
          ref={!isLightbox ? (el) => setVideoRef(el, media.id) : null}
          src={media.url}
          className={className}
          controls={isCenter || isLightbox}
          muted={!isLightbox}
          loop
          autoPlay={!isLightbox}
          playsInline
          preload={isCenter ? 'auto' : 'metadata'}
          onLoadedData={(e) => {
            if (!isLightbox && isCenter) {
              e.target.play().catch(console.error);
            }
          }}
          onError={(e) => {
            console.error('Video loading error:', e);
          }}
        />
      );
    } else {
      return (
        <img
          src={media.url}
          alt={media.title || `Média ${media.id}`}
          className={className}
          loading={isCenter ? 'eager' : 'lazy'}
          onError={(e) => {
            console.error('Image loading error:', e);
            e.target.style.display = 'none';
          }}
        />
      );
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="carousel-container">
        <div className="carousel-loading">
          <div className="spinner"></div>
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

  const progressPercentage = images.length > 0 ? ((currentIndex + 1) / images.length) * 100 : 0;

  return (
    <>
      <div 
        className="carousel-container" 
        ref={carouselRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="carousel-wrapper">
          {/* Dynamic background */}
          <div 
            className="carousel-background"
            style={{
              backgroundImage: `url(${images[currentIndex]?.url})`
            }}
          />

          {/* Carousel Content */}
          <div className="carousel-content">
            {/* Navigation Buttons */}
            <button
              className="carousel-nav carousel-nav-left"
              onClick={goToPrevious}
              disabled={isTransitioning}
              aria-label="Média précédent"
            >
              <ChevronLeft size={24} />
            </button>

            <button
              className="carousel-nav carousel-nav-right"
              onClick={goToNext}
              disabled={isTransitioning}
              aria-label="Média suivant"
            >
              <ChevronRight size={24} />
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
                              <Heart size={16} fill={liked.has(media.id) ? 'currentColor' : 'none'} />
                            </button>

                            <button
                              className="action-btn share-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                shareImage(media);
                              }}
                              title="Partager"
                            >
                              <Share2 size={16} />
                            </button>
                            
                            <button
                              className="action-btn fullscreen-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                openLightbox(index);
                              }}
                              title="Plein écran"
                            >
                              <Maximize2 size={16} />
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
                                <Instagram size={16} />
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

            {/* Enhanced Controls */}
            <div className="carousel-controls">
              <div className="controls-left">
                <button
                  className={`control-btn play-pause ${isPlaying ? 'playing' : 'paused'}`}
                  onClick={() => setIsPlaying(!isPlaying)}
                  title={isPlaying ? 'Pause' : 'Play'}
                >
                  {isPlaying ? <Pause size={16} /> : <Play size={16} />}
                </button>

                <div className="carousel-counter">
                  <span className="current">{currentIndex + 1}</span>
                  <span className="separator">/</span>
                  <span className="total">{images.length}</span>
                </div>
              </div>

              <div className="carousel-progress">
                <div className="progress-track">
                  <div 
                    className="progress-bar" 
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
              </div>

              <div className="controls-right">
                <span className="image-title">
                  {images[currentIndex]?.title || `Média ${currentIndex + 1}`}
                </span>
              </div>
            </div>
          </div>

          {/* Thumbnails */}
          <div className="carousel-thumbnails">
            <div className="thumbnails-track">
              {images.map((media, index) => (
                <button
                  key={media.id}
                  className={`thumbnail ${index === currentIndex ? 'active' : ''}`}
                  onClick={() => goToSlide(index)}
                  title={media.title || `Média ${index + 1}`}
                >
                  {media.type === 'video' ? (
                    <video 
                      src={media.url} 
                      className="thumbnail-image"
                      muted 
                      preload="metadata"
                    />
                  ) : (
                    <img 
                      src={media.url} 
                      alt={`Miniature ${index + 1}`}
                      className="thumbnail-image"
                      loading="lazy"
                    />
                  )}
                  <div className="thumbnail-overlay">
                    <span className="thumbnail-number">{index + 1}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>


{showLightbox && (
  <div className="lightbox-overlay" onClick={closeLightbox}>
    <div className="lightbox-container" onClick={(e) => e.stopPropagation()}>
      
      {/* Fixed Close Button */}
      <button
        className="lightbox-close"
        onClick={closeLightbox}
        title="Fermer"
      >
        <X size={20} />
      </button>

      {/* Main Content Area */}
      <div className="lightbox-content">
        <button
          className="lightbox-nav lightbox-nav-left"
          onClick={() => setLightboxIndex((prev) => (prev - 1 + images.length) % images.length)}
          title="Média précédent"
        >
          <ChevronLeft size={24} />
        </button>

        <div className="lightbox-image-wrapper">
          {renderMedia(images[lightboxIndex], false, true)}
        </div>

        <button
          className="lightbox-nav lightbox-nav-right"
          onClick={() => setLightboxIndex((prev) => (prev + 1) % images.length)}
          title="Média suivant"
        >
          <ChevronRight size={24} />
        </button>
      </div>

      {/* Fixed Info Panel */}
      {(images[lightboxIndex]?.title || images[lightboxIndex]?.description || images[lightboxIndex]?.instagramUrl) && (
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
                <Instagram size={16} />
                Instagram
              </button>
            )}
            
            <button
              className="lightbox-share"
              onClick={() => shareImage(images[lightboxIndex])}
            >
              <Share2 size={16} />
              Partager
            </button>
          </div>
        </div>
      )}

      {/* Fixed Thumbnails 
      <div className="lightbox-thumbnails">
        {images.map((media, index) => (
          <button
            key={media.id}
            className={`lightbox-thumbnail ${index === lightboxIndex ? 'active' : ''}`}
            onClick={() => setLightboxIndex(index)}
            title={media.title || `Média ${index + 1}`}
          >
            {media.type === 'video' ? (
              <video 
                src={media.url} 
                muted 
                preload="metadata"
              />
            ) : (
              <img 
                src={media.url} 
                alt={`Miniature ${index + 1}`}
                loading="lazy"
              />
            )}
          </button>
        ))}
      </div>
      */}
    </div>
  </div>
)}
    </>
  );
};

export default ModernCarousel;