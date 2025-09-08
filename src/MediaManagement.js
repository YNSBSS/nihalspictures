import React, { useState, useEffect } from 'react';
import { Camera, Search, Plus, Edit, Trash2, X, Clock, FileText, Save, AlertCircle, RefreshCw, Upload, Video, Image, Eye, EyeOff } from 'lucide-react';
import { collection, onSnapshot, query, orderBy, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from './firebaseConfig';
import './MediaManagement.css';

const MediaManagement = () => {
  const [media, setMedia] = useState([]);
  const [filteredMedia, setFilteredMedia] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingMedia, setEditingMedia] = useState(null);
  const [deletingMedia, setDeletingMedia] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [mediaTypeFilter, setMediaTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [mediaForm, setMediaForm] = useState({
    title: '',
    description: '',
    type: 'image',
    url: '',
    instagramUrl: '',
    isActive: true,
    orderIndex: 0
  });

  // Cloudinary configuration
  const CLOUDINARY_CLOUD_NAME = 'dn2bxcems';
  const CLOUDINARY_UPLOAD_PRESET = 'carousel_media'; // Create this preset in Cloudinary

  // Load media from Firestore
  useEffect(() => {
    const loadMedia = () => {
      try {
        const mediaRef = collection(db, 'media');
        const mediaQuery = query(mediaRef, orderBy('createdAt', 'desc'));

        const unsubscribe = onSnapshot(mediaQuery, (snapshot) => {
          const mediaData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate?.() || new Date(),
            updatedAt: doc.data().updatedAt?.toDate?.() || new Date()
          }));
          
          setMedia(mediaData);
          setFilteredMedia(mediaData);
          setLoading(false);
        });

        return unsubscribe;
      } catch (error) {
        console.error('Error loading media:', error);
        setLoading(false);
      }
    };

    const unsubscribe = loadMedia();
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Filter media based on search and filters
  useEffect(() => {
    let filtered = media;

    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (mediaTypeFilter !== 'all') {
      filtered = filtered.filter(item => item.type === mediaTypeFilter);
    }

    if (statusFilter !== 'all') {
      const isActive = statusFilter === 'active';
      filtered = filtered.filter(item => (item.isActive !== false) === isActive);
    }

    setFilteredMedia(filtered);
  }, [media, searchTerm, mediaTypeFilter, statusFilter]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setMediaForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Handle media upload to Cloudinary
// Handle media upload to Cloudinary
const handleMediaUpload = async (file) => {
  if (!file) return;

  // Validate file type
  const isImage = file.type.startsWith('image/');
  const isVideo = file.type.startsWith('video/');

  if (!isImage && !isVideo) {
    alert('Please select a valid image or video file.');
    return;
  }

  // Validate file size
  if (isImage && file.size > 10 * 1024 * 1024) {
    alert('Image size should be less than 10MB.');
    return;
  }
  if (isVideo && file.size > 100 * 1024 * 1024) {
    alert('Video size should be less than 100MB.');
    return;
  }

  setUploading(true);

  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    formData.append('folder', 'carousel');

    // Cloudinary expects the resource type in the URL, not the form data
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/${isVideo ? 'video' : 'image'}/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Upload failed: ${errText}`);
    }

    const data = await response.json();

    setMediaForm((prev) => ({
      ...prev,
      url: data.secure_url,
      type: isVideo ? 'video' : 'image',
    }));
  } catch (error) {
    console.error('Error uploading media:', error);
    alert('Failed to upload media. Please try again.');
  } finally {
    setUploading(false);
  }
};


  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleMediaUpload(file);
    }
  };

  const openAddModal = () => {
    setEditingMedia(null);
    setMediaForm({
      title: '',
      description: '',
      type: 'image',
      url: '',
      instagramUrl: '',
      isActive: true,
      orderIndex: media.length
    });
    setShowMediaModal(true);
  };

  const openEditModal = (mediaItem) => {
    setEditingMedia(mediaItem);
    setMediaForm({
      title: mediaItem.title || '',
      description: mediaItem.description || '',
      type: mediaItem.type || 'image',
      url: mediaItem.url || '',
      instagramUrl: mediaItem.instagramUrl || '',
      isActive: mediaItem.isActive !== false,
      orderIndex: mediaItem.orderIndex || 0
    });
    setShowMediaModal(true);
  };

  const handleSubmit = async () => {
    // Validate required fields
    if (!mediaForm.url) {
      alert('Please upload a media file.');
      return;
    }

    setSubmitting(true);

    try {
      const mediaData = {
        title: mediaForm.title.trim(),
        description: mediaForm.description.trim(),
        type: mediaForm.type,
        url: mediaForm.url,
        instagramUrl: mediaForm.instagramUrl.trim(),
        isActive: mediaForm.isActive,
        orderIndex: parseInt(mediaForm.orderIndex) || 0,
        updatedAt: new Date()
      };

      if (editingMedia) {
        // Update existing media
        const mediaRef = doc(db, 'media', editingMedia.id);
        await updateDoc(mediaRef, mediaData);
      } else {
        // Add new media
        mediaData.createdAt = new Date();
        await addDoc(collection(db, 'media'), mediaData);
      }

      setShowMediaModal(false);
      setEditingMedia(null);
      setMediaForm({
        title: '',
        description: '',
        type: 'image',
        url: '',
        instagramUrl: '',
        isActive: true,
        orderIndex: 0
      });
    } catch (error) {
      console.error('Error saving media:', error);
      alert('Error saving media. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingMedia) return;

    try {
      await deleteDoc(doc(db, 'media', deletingMedia.id));
      setShowDeleteModal(false);
      setDeletingMedia(null);
    } catch (error) {
      console.error('Error deleting media:', error);
      alert('Error deleting media. Please try again.');
    }
  };

  const toggleMediaStatus = async (mediaItem) => {
    try {
      const mediaRef = doc(db, 'media', mediaItem.id);
      await updateDoc(mediaRef, {
        isActive: !mediaItem.isActive,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Error updating media status:', error);
      alert('Error updating media status. Please try again.');
    }
  };

  const renderMediaPreview = (mediaItem, isLarge = false) => {
    const className = isLarge ? 'mm-media-preview-large' : 'mm-media-preview';
    
    if (mediaItem.type === 'video') {
      return (
        <video
          src={mediaItem.url}
          className={className}
          controls={isLarge}
          muted
          loop={!isLarge}
          autoPlay={!isLarge}
          playsInline
        />
      );
    } else {
      return (
        <img
          src={mediaItem.url}
          alt={mediaItem.title || 'Media'}
          className={className}
        />
      );
    }
  };

  if (loading) {
    return (
      <div className="mm-loading-container">
        <div className="mm-loading-spinner"></div>
        <span className="mm-loading-text">Loading media...</span>
      </div>
    );
  }

  return (
    <div className="mm-main-container">
      {/* Header */}
      <div className="mm-header">
        <div className="mm-header-content">
          <h1 className="mm-header-title">Carousel Media Management</h1>
          <p className="mm-header-subtitle">Manage your carousel images and videos</p>
        </div>
        <div className="mm-header-actions">
          <button onClick={() => window.location.reload()} className="mm-btn mm-btn-secondary">
            <RefreshCw className="mm-btn-icon" />
            Refresh
          </button>
          <button onClick={openAddModal} className="mm-btn mm-btn-primary">
            <Plus className="mm-btn-icon" />
            Add Media
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="mm-filters-container">
        <div className="mm-search-wrapper">
          <div className="mm-search-input-container">
            <Search className="mm-search-icon" />
            <input
              type="text"
              placeholder="Search media..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="mm-search-input"
            />
          </div>
        </div>
        
        <div className="mm-filters-wrapper">
          <select
            value={mediaTypeFilter}
            onChange={(e) => setMediaTypeFilter(e.target.value)}
            className="mm-filter-select"
          >
            <option value="all">All Types</option>
            <option value="image">Images</option>
            <option value="video">Videos</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="mm-filter-select"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

          <div className="mm-media-counter">
            {filteredMedia.length} of {media.length} items
          </div>
        </div>
      </div>

      {/* Media Grid */}
      <div className="mm-media-grid">
        {filteredMedia.length === 0 ? (
          <div className="mm-empty-state">
            <Camera className="mm-empty-state-icon" />
            <h3 className="mm-empty-state-title">No Media Found</h3>
            <p className="mm-empty-state-description">
              {searchTerm || mediaTypeFilter !== 'all' || statusFilter !== 'all' 
                ? 'No media matches your search criteria.' 
                : 'Get started by adding your first media item to the carousel.'
              }
            </p>
            {!searchTerm && mediaTypeFilter === 'all' && statusFilter === 'all' && (
              <button onClick={openAddModal} className="mm-btn mm-btn-primary">
                <Plus className="mm-btn-icon" />
                Add First Media
              </button>
            )}
          </div>
        ) : (
          filteredMedia.map((mediaItem) => (
            <div key={mediaItem.id} className="mm-media-card">
              <div className="mm-media-card-content">
                {/* Media Preview */}
                <div className="mm-media-preview-container">
                  {renderMediaPreview(mediaItem)}
                  <div className="mm-media-type-badge">
                    {mediaItem.type === 'video' ? <Video className="mm-type-icon" /> : <Image className="mm-type-icon" />}
                    {mediaItem.type}
                  </div>
                  <div className={`mm-status-overlay ${mediaItem.isActive !== false ? 'mm-status-active' : 'mm-status-inactive'}`}>
                    {mediaItem.isActive !== false ? <Eye className="mm-status-icon" /> : <EyeOff className="mm-status-icon" />}
                  </div>
                </div>

                {/* Media Info */}
                <div className="mm-media-info">
                  <div className="mm-media-header">
                    <h3 className="mm-media-title">
                      {mediaItem.title || `${mediaItem.type === 'video' ? 'Video' : 'Image'} ${mediaItem.id.slice(-6)}`}
                    </h3>
                    <span className={`mm-status-badge ${mediaItem.isActive !== false ? 'mm-status-active' : 'mm-status-inactive'}`}>
                      {mediaItem.isActive !== false ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  {mediaItem.description && (
                    <p className="mm-media-description">{mediaItem.description}</p>
                  )}

                  <div className="mm-media-details">
                    <div className="mm-media-detail-item">
                      <Clock className="mm-detail-icon" />
                      <span className="mm-detail-text">
                        Added {mediaItem.createdAt?.toLocaleDateString()}
                      </span>
                    </div>
                    
                    {mediaItem.instagramUrl && (
                      <div className="mm-media-detail-item">
                        <FileText className="mm-detail-icon" />
                        <span className="mm-detail-text">Instagram linked</span>
                      </div>
                    )}

                    <div className="mm-media-detail-item">
                      <span className="mm-order-badge">Order: {mediaItem.orderIndex || 0}</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="mm-media-actions">
                    <button
                      onClick={() => toggleMediaStatus(mediaItem)}
                      className={`mm-action-btn ${mediaItem.isActive !== false ? 'mm-action-btn-warning' : 'mm-action-btn-success'}`}
                      title={mediaItem.isActive !== false ? 'Hide from carousel' : 'Show in carousel'}
                    >
                      {mediaItem.isActive !== false ? <EyeOff className="mm-action-icon" /> : <Eye className="mm-action-icon" />}
                    </button>
                    <button
                      onClick={() => openEditModal(mediaItem)}
                      className="mm-action-btn mm-action-btn-edit"
                      title="Edit media"
                    >
                      <Edit className="mm-action-icon" />
                    </button>
                    <button
                      onClick={() => {
                        setDeletingMedia(mediaItem);
                        setShowDeleteModal(true);
                      }}
                      className="mm-action-btn mm-action-btn-delete"
                      title="Delete media"
                    >
                      <Trash2 className="mm-action-icon" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Media Modal */}
      {showMediaModal && (
        <div className="mm-modal-overlay">
          <div className="mm-modal-container">
            <div className="mm-modal-content">
              <div className="mm-modal-header">
                <h2 className="mm-modal-title">
                  {editingMedia ? 'Edit Media' : 'Add New Media'}
                </h2>
                <button
                  onClick={() => setShowMediaModal(false)}
                  className="mm-modal-close"
                  disabled={submitting}
                >
                  <X className="mm-modal-close-icon" />
                </button>
              </div>

              <div className="mm-modal-form">
                {/* Media Upload */}
                <div className="mm-form-group">
                  <label className="mm-form-label">Media File *</label>
                  <div className="mm-upload-container">
                    {mediaForm.url ? (
                      <div className="mm-preview-container">
                        {mediaForm.type === 'video' ? (
                          <video
                            src={mediaForm.url}
                            className="mm-upload-preview"
                            controls
                            muted
                          />
                        ) : (
                          <img
                            src={mediaForm.url}
                            alt="Preview"
                            className="mm-upload-preview"
                          />
                        )}
                        <button
                          type="button"
                          onClick={() => setMediaForm(prev => ({ ...prev, url: '', type: 'image' }))}
                          className="mm-preview-remove-btn"
                          disabled={submitting}
                        >
                          <X className="mm-preview-remove-icon" />
                        </button>
                      </div>
                    ) : (
                      <div className="mm-upload-zone">
                        <input
                          type="file"
                          accept="image/*,video/*"
                          onChange={handleFileSelect}
                          className="mm-upload-input"
                          disabled={submitting || uploading}
                          id="media-upload"
                        />
                        <label htmlFor="media-upload" className="mm-upload-label">
                          {uploading ? (
                            <>
                              <div className="mm-upload-spinner"></div>
                              <span>Uploading...</span>
                            </>
                          ) : (
                            <>
                              <Upload className="mm-upload-icon" />
                              <span>Click to upload image or video</span>
                              <small>Images: PNG, JPG, GIF up to 10MB</small>
                              <small>Videos: MP4, MOV, AVI up to 100MB</small>
                            </>
                          )}
                        </label>
                      </div>
                    )}
                  </div>
                </div>

                {/* Title and Instagram URL */}
                <div className="mm-form-row">
                  <div className="mm-form-group">
                    <label className="mm-form-label">Title</label>
                    <input
                      type="text"
                      name="title"
                      value={mediaForm.title}
                      onChange={handleInputChange}
                      placeholder="Enter a title for this media"
                      className="mm-form-input"
                      disabled={submitting}
                    />
                  </div>

                  <div className="mm-form-group">
                    <label className="mm-form-label">Order Index</label>
                    <input
                      type="number"
                      name="orderIndex"
                      value={mediaForm.orderIndex}
                      onChange={handleInputChange}
                      min="0"
                      className="mm-form-input"
                      disabled={submitting}
                    />
                  </div>
                </div>

                {/* Instagram URL */}
                <div className="mm-form-group">
                  <label className="mm-form-label">Instagram URL</label>
                  <input
                    type="url"
                    name="instagramUrl"
                    value={mediaForm.instagramUrl}
                    onChange={handleInputChange}
                    placeholder="https://instagram.com/p/..."
                    className="mm-form-input"
                    disabled={submitting}
                  />
                </div>

                {/* Description */}
                <div className="mm-form-group">
                  <label className="mm-form-label">Description</label>
                  <textarea
                    name="description"
                    value={mediaForm.description}
                    onChange={handleInputChange}
                    rows={3}
                    placeholder="Add a description for this media..."
                    className="mm-form-textarea"
                    disabled={submitting}
                  />
                </div>

                {/* Status */}
                <div className="mm-form-checkbox-wrapper">
                  <div className="mm-form-checkbox-container">
                    <label className="mm-checkbox-label">
                      <input
                        type="checkbox"
                        name="isActive"
                        checked={mediaForm.isActive}
                        onChange={handleInputChange}
                        className="mm-checkbox"
                        disabled={submitting}
                      />
                      <span className="mm-checkbox-text">Show in carousel</span>
                    </label>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="mm-modal-actions">
                  <button
                    onClick={() => setShowMediaModal(false)}
                    className="mm-btn mm-btn-cancel"
                    disabled={submitting}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmit}
                    className="mm-btn mm-btn-submit"
                    disabled={submitting || uploading || !mediaForm.url}
                  >
                    {submitting ? (
                      <>
                        <div className="mm-btn-loading-spinner"></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mm-btn-icon" />
                        {editingMedia ? 'Update Media' : 'Add Media'}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && deletingMedia && (
        <div className="mm-modal-overlay">
          <div className="mm-delete-modal-container">
            <div className="mm-modal-content">
              <div className="mm-modal-header">
                <h2 className="mm-modal-title">Delete Media</h2>
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="mm-modal-close"
                >
                  <X className="mm-modal-close-icon" />
                </button>
              </div>
              
              <div className="mm-delete-modal-body">
                <AlertCircle className="mm-delete-warning-icon" />
                <div className="mm-delete-warning-content">
                  <p className="mm-delete-warning-title">
                    Delete this {deletingMedia.type}?
                  </p>
                  <p className="mm-delete-warning-text">
                    This action cannot be undone. The media will be permanently removed from your carousel.
                  </p>
                  {deletingMedia.title && (
                    <p className="mm-delete-media-title">"{deletingMedia.title}"</p>
                  )}
                </div>
              </div>
              
              <div className="mm-modal-actions">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="mm-btn mm-btn-cancel"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="mm-btn mm-btn-danger"
                >
                  Delete Media
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MediaManagement;