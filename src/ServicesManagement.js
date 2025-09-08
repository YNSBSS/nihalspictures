import React, { useState, useEffect } from 'react';
import { Camera, Search, Plus, Edit, Trash2, X, Clock, DollarSign, FileText, Save, AlertCircle, CheckCircle, RefreshCw, Upload } from 'lucide-react';
import { collection, onSnapshot, query, orderBy, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from './firebaseConfig';
import './ServicesManagement.css';

const ServicesManagement = () => {
  const [services, setServices] = useState([]);
  const [filteredServices, setFilteredServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [deletingService, setDeletingService] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [serviceForm, setServiceForm] = useState({
    name: '',
    serviceNumber: '',
    duration: '',
    price: '',
    description: '',
    features: [''],
    category: '',
    imageUrl: '',
    isActive: true
  });

  // Cloudinary configuration
  // Cloudinary configuration
  const CLOUDINARY_CLOUD_NAME = 'dn2bxcems';
  const CLOUDINARY_UPLOAD_PRESET = 'services_upload';

  // Load services from Firestore
  useEffect(() => {
    const loadServices = () => {
      try {
        const servicesRef = collection(db, 'servicePackages');
        const servicesQuery = query(servicesRef, orderBy('serviceNumber', 'asc'));

        const unsubscribe = onSnapshot(servicesQuery, (snapshot) => {
          const servicesData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate?.() || new Date(),
            updatedAt: doc.data().updatedAt?.toDate?.() || new Date()
          }));

          setServices(servicesData);
          setFilteredServices(servicesData);
          setLoading(false);
        });

        return unsubscribe;
      } catch (error) {
        console.error('Error loading services:', error);
        setLoading(false);
      }
    };

    const unsubscribe = loadServices();
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Filter services based on search
  useEffect(() => {
    let filtered = services;

    if (searchTerm) {
      filtered = filtered.filter(service =>
        service.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        service.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        service.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        service.serviceNumber?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredServices(filtered);
  }, [services, searchTerm]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setServiceForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleFeatureChange = (index, value) => {
    const newFeatures = [...serviceForm.features];
    newFeatures[index] = value;
    setServiceForm(prev => ({
      ...prev,
      features: newFeatures
    }));
  };

  const addFeature = () => {
    setServiceForm(prev => ({
      ...prev,
      features: [...prev.features, '']
    }));
  };

  const removeFeature = (index) => {
    const newFeatures = serviceForm.features.filter((_, i) => i !== index);
    setServiceForm(prev => ({
      ...prev,
      features: newFeatures.length > 0 ? newFeatures : ['']
    }));
  };

  // Handle image upload to Cloudinary
  const handleImageUpload = async (file) => {
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file.');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('Image size should be less than 10MB.');
      return;
    }

    setUploadingImage(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
      formData.append('folder', 'services');

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );


      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();

      setServiceForm(prev => ({
        ...prev,
        imageUrl: data.secure_url
      }));

    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image. Please try again.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleImageUpload(file);
    }
  };

  const openAddModal = () => {
    setEditingService(null);
    setServiceForm({
      name: '',
      serviceNumber: '',
      duration: '',
      price: '',
      description: '',
      features: [''],
      category: '',
      imageUrl: '',
      isActive: true
    });
    setShowServiceModal(true);
  };

  const openEditModal = (service) => {
    setEditingService(service);
    setServiceForm({
      name: service.name || '',
      serviceNumber: service.serviceNumber || '',
      duration: service.duration || '',
      price: service.price || '',
      description: service.description || '',
      features: service.features && service.features.length > 0 ? service.features : [''],
      category: service.category || '',
      imageUrl: service.imageUrl || '',
      isActive: service.isActive !== false
    });
    setShowServiceModal(true);
  };

  const handleSubmit = async () => {
    // Validate required fields
    if (!serviceForm.name || !serviceForm.serviceNumber || !serviceForm.duration || !serviceForm.price) {
      alert('Please fill in all required fields (Name, Service Number, Duration, Price).');
      return;
    }

    // Validate price is a number
    const price = parseFloat(serviceForm.price);
    if (isNaN(price) || price <= 0) {
      alert('Please enter a valid price.');
      return;
    }

    // Check if service number already exists (for new services or when editing and changing the number)
    const existingService = services.find(service =>
      service.serviceNumber === serviceForm.serviceNumber &&
      (!editingService || service.id !== editingService.id)
    );

    if (existingService) {
      alert('Service number already exists. Please choose a different number.');
      return;
    }

    setSubmitting(true);

    try {
      // Filter out empty features
      const features = serviceForm.features.filter(feature => feature.trim() !== '');

      const serviceData = {
        name: serviceForm.name.trim(),
        serviceNumber: serviceForm.serviceNumber.trim(),
        duration: serviceForm.duration.trim(),
        price: price,
        description: serviceForm.description.trim(),
        features: features,
        category: serviceForm.category.trim(),
        imageUrl: serviceForm.imageUrl,
        isActive: serviceForm.isActive,
        updatedAt: new Date()
      };

      if (editingService) {
        // Update existing service
        const serviceRef = doc(db, 'servicePackages', editingService.id);
        await updateDoc(serviceRef, serviceData);
      } else {
        // Add new service
        serviceData.createdAt = new Date();
        await addDoc(collection(db, 'servicePackages'), serviceData);
      }

      setShowServiceModal(false);
      setEditingService(null);
      setServiceForm({
        name: '',
        serviceNumber: '',
        duration: '',
        price: '',
        description: '',
        features: [''],
        category: '',
        imageUrl: '',
        isActive: true
      });
    } catch (error) {
      console.error('Error saving service:', error);
      alert('Error saving service. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingService) return;

    try {
      await deleteDoc(doc(db, 'servicePackages', deletingService.id));
      setShowDeleteModal(false);
      setDeletingService(null);
    } catch (error) {
      console.error('Error deleting service:', error);
      alert('Error deleting service. Please try again.');
    }
  };

  const toggleServiceStatus = async (service) => {
    try {
      const serviceRef = doc(db, 'servicePackages', service.id);
      await updateDoc(serviceRef, {
        isActive: !service.isActive,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Error updating service status:', error);
      alert('Error updating service status. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="sm-loading-container">
        <div className="sm-loading-spinner"></div>
        <span className="sm-loading-text">Loading services...</span>
      </div>
    );
  }

  return (
    <div className="sm-main-container">
      {/* Header */}
      <div className="sm-header">
        <div className="sm-header-content">
          <h1 className="sm-header-title">Services Management</h1>
          <p className="sm-header-subtitle">Manage your photography service packages and pricing</p>
        </div>
        <div className="sm-header-actions">
          <button onClick={() => window.location.reload()} className="sm-btn sm-btn-secondary">
            <RefreshCw className="sm-btn-icon" />
            Refresh
          </button>
          <button onClick={openAddModal} className="sm-btn sm-btn-primary">
            <Plus className="sm-btn-icon" />
            Add Service
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="sm-search-container">
        <div className="sm-search-wrapper">
          <div className="sm-search-input-container">
            <Search className="sm-search-icon" />
            <input
              type="text"
              placeholder="Search services..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="sm-search-input"
            />
          </div>
          <div className="sm-search-counter">
            {filteredServices.length} of {services.length} services
          </div>
        </div>
      </div>

      {/* Services Grid */}
      <div className="sm-services-grid">
        {filteredServices.length === 0 ? (
          <div className="sm-empty-state">
            <Camera className="sm-empty-state-icon" />
            <h3 className="sm-empty-state-title">No Services Found</h3>
            <p className="sm-empty-state-description">
              {searchTerm ? 'No services match your search criteria.' : 'Get started by adding your first service package.'}
            </p>
            {!searchTerm && (
              <button onClick={openAddModal} className="sm-btn sm-btn-primary">
                <Plus className="sm-btn-icon" />
                Add First Service
              </button>
            )}
          </div>
        ) : (
          filteredServices.map((service) => (
            <div key={service.id} className="sm-service-card">
              <div className="sm-service-card-content">
                {/* Service Image */}
                {service.imageUrl && (
                  <div className="sm-service-image-container">
                    <img
                      src={service.imageUrl}
                      alt={service.name}
                      className="sm-service-image"
                    />
                  </div>
                )}

                {/* Service Header */}
                <div className="sm-service-header">
                  <div className="sm-service-header-info">
                    <div className="sm-service-title-row">
                      <h3 className="sm-service-title">{service.name}</h3>
                      <span className={`sm-status-badge ${service.isActive !== false ? 'sm-status-active' : 'sm-status-inactive'}`}>
                        {service.isActive !== false ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <p className="sm-service-number">#{service.serviceNumber}</p>
                    {service.category && (
                      <p className="sm-service-category">{service.category}</p>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="sm-service-actions">
                    <button
                      onClick={() => toggleServiceStatus(service)}
                      className={`sm-action-btn ${service.isActive !== false ? 'sm-action-btn-danger' : 'sm-action-btn-success'}`}
                      title={service.isActive !== false ? 'Deactivate service' : 'Activate service'}
                    >
                      {service.isActive !== false ? <X className="sm-action-icon" /> : <CheckCircle className="sm-action-icon" />}
                    </button>
                    <button
                      onClick={() => openEditModal(service)}
                      className="sm-action-btn sm-action-btn-edit"
                      title="Edit service"
                    >
                      <Edit className="sm-action-icon" />
                    </button>
                    <button
                      onClick={() => {
                        setDeletingService(service);
                        setShowDeleteModal(true);
                      }}
                      className="sm-action-btn sm-action-btn-delete"
                      title="Delete service"
                    >
                      <Trash2 className="sm-action-icon" />
                    </button>
                  </div>
                </div>

                {/* Service Details */}
                <div className="sm-service-details">
                  <div className="sm-service-detail-item">
                    <Clock className="sm-detail-icon" />
                    <span className="sm-detail-text">{service.duration}</span>
                  </div>

                  <div className="sm-service-price-item">
                    <DollarSign className="sm-detail-icon" />
                    <span className="sm-service-price">DZD {service.price?.toLocaleString()}</span>
                  </div>

                  {service.description && (
                    <div className="sm-service-description-item">
                      <FileText className="sm-detail-icon" />
                      <p className="sm-service-description">{service.description}</p>
                    </div>
                  )}

                  {service.features && service.features.length > 0 && (
                    <div className="sm-service-features">
                      <p className="sm-features-title">Features:</p>
                      <ul className="sm-features-list">
                        {service.features.slice(0, 3).map((feature, index) => (
                          <li key={index} className="sm-feature-item">
                            <span className="sm-feature-bullet"></span>
                            {feature}
                          </li>
                        ))}
                        {service.features.length > 3 && (
                          <li className="sm-feature-more">
                            +{service.features.length - 3} more features
                          </li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Timestamps */}
                <div className="sm-service-footer">
                  <p className="sm-service-timestamp">
                    Updated {service.updatedAt?.toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Service Modal */}
      {showServiceModal && (
        <div className="sm-modal-overlay">
          <div className="sm-modal-container">
            <div className="sm-modal-content">
              <div className="sm-modal-header">
                <h2 className="sm-modal-title">
                  {editingService ? 'Edit Service' : 'Add New Service'}
                </h2>
                <button
                  onClick={() => setShowServiceModal(false)}
                  className="sm-modal-close"
                  disabled={submitting}
                >
                  <X className="sm-modal-close-icon" />
                </button>
              </div>

              <div className="sm-modal-form">
                {/* Service Image Upload */}
                <div className="sm-form-group">
                  <label className="sm-form-label">Service Image</label>
                  <div className="sm-image-upload-container">
                    {serviceForm.imageUrl ? (
                      <div className="sm-image-preview-container">
                        <img
                          src={serviceForm.imageUrl}
                          alt="Service preview"
                          className="sm-image-preview"
                        />
                        <button
                          type="button"
                          onClick={() => setServiceForm(prev => ({ ...prev, imageUrl: '' }))}
                          className="sm-image-remove-btn"
                          disabled={submitting}
                        >
                          <X className="sm-image-remove-icon" />
                        </button>
                      </div>
                    ) : (
                      <div className="sm-image-upload-zone">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileSelect}
                          className="sm-image-upload-input"
                          disabled={submitting || uploadingImage}
                          id="image-upload"
                        />
                        <label htmlFor="image-upload" className="sm-image-upload-label">
                          {uploadingImage ? (
                            <>
                              <div className="sm-upload-spinner"></div>
                              <span>Uploading...</span>
                            </>
                          ) : (
                            <>
                              <Upload className="sm-upload-icon" />
                              <span>Click to upload image</span>
                              <small>PNG, JPG, GIF up to 10MB</small>
                            </>
                          )}
                        </label>
                      </div>
                    )}
                  </div>
                </div>

                {/* Service Name and Number */}
                <div className="sm-form-row">
                  <div className="sm-form-group">
                    <label className="sm-form-label">Service Name *</label>
                    <input
                      type="text"
                      name="name"
                      value={serviceForm.name}
                      onChange={handleInputChange}
                      placeholder="e.g., Wedding Photography Package"
                      className="sm-form-input"
                      disabled={submitting}
                      required
                    />
                  </div>

                  <div className="sm-form-group">
                    <label className="sm-form-label">Service Number *</label>
                    <input
                      type="text"
                      name="serviceNumber"
                      value={serviceForm.serviceNumber}
                      onChange={handleInputChange}
                      placeholder="e.g., S001"
                      className="sm-form-input"
                      disabled={submitting}
                      required
                    />
                  </div>
                </div>

                {/* Category and Status */}
                <div className="sm-form-row">
                  <div className="sm-form-group">
                    <label className="sm-form-label">Category</label>
                    <input
                      type="text"
                      name="category"
                      value={serviceForm.category}
                      onChange={handleInputChange}
                      placeholder="e.g., Wedding Photography"
                      className="sm-form-input"
                      disabled={submitting}
                    />
                  </div>

                  <div className="sm-form-checkbox-wrapper">
                    <div className="sm-form-checkbox-container">
                      <label className="sm-checkbox-label">
                        <input
                          type="checkbox"
                          name="isActive"
                          checked={serviceForm.isActive}
                          onChange={handleInputChange}
                          className="sm-checkbox"
                          disabled={submitting}
                        />
                        <span className="sm-checkbox-text">Service is active</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Duration and Price */}
                <div className="sm-form-row">
                  <div className="sm-form-group">
                    <label className="sm-form-label">Duration *</label>
                    <input
                      type="text"
                      name="duration"
                      value={serviceForm.duration}
                      onChange={handleInputChange}
                      placeholder="e.g., 2-3 hours"
                      className="sm-form-input"
                      disabled={submitting}
                      required
                    />
                  </div>

                  <div className="sm-form-group">
                    <label className="sm-form-label">Price (DZD) *</label>
                    <input
                      type="number"
                      name="price"
                      value={serviceForm.price}
                      onChange={handleInputChange}
                      placeholder="25000"
                      min="0"
                      step="1000"
                      className="sm-form-input"
                      disabled={submitting}
                      required
                    />
                  </div>
                </div>

                {/* Description */}
                <div className="sm-form-group">
                  <label className="sm-form-label">Description</label>
                  <textarea
                    name="description"
                    value={serviceForm.description}
                    onChange={handleInputChange}
                    rows={3}
                    placeholder="Describe what's included in this service package..."
                    className="sm-form-textarea"
                    disabled={submitting}
                  />
                </div>

                {/* Features */}
                <div className="sm-form-group">
                  <label className="sm-form-label">Features</label>
                  <div className="sm-features-form">
                    {serviceForm.features.map((feature, index) => (
                      <div key={index} className="sm-feature-input-row">
                        <input
                          type="text"
                          value={feature}
                          onChange={(e) => handleFeatureChange(index, e.target.value)}
                          placeholder="e.g., Professional editing included"
                          className="sm-feature-input"
                          disabled={submitting}
                        />
                        {serviceForm.features.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeFeature(index)}
                            className="sm-feature-remove-btn"
                            disabled={submitting}
                          >
                            <X className="sm-feature-remove-icon" />
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={addFeature}
                      className="sm-add-feature-btn"
                      disabled={submitting}
                    >
                      + Add Feature
                    </button>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="sm-modal-actions">
                  <button
                    onClick={() => setShowServiceModal(false)}
                    className="sm-btn sm-btn-cancel"
                    disabled={submitting}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmit}
                    className="sm-btn sm-btn-submit"
                    disabled={submitting || uploadingImage}
                  >
                    {submitting ? (
                      <>
                        <div className="sm-btn-loading-spinner"></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="sm-btn-icon" />
                        {editingService ? 'Update Service' : 'Create Service'}
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
      {showDeleteModal && deletingService && (
        <div className="sm-modal-overlay">
          <div className="sm-delete-modal-container">
            <div className="sm-modal-content">
              <div className="sm-modal-header">
                <h2 className="sm-modal-title">Delete Service</h2>
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="sm-modal-close"
                >
                  <X className="sm-modal-close-icon" />
                </button>
              </div>

              <div className="sm-delete-modal-body">
                <AlertCircle className="sm-delete-warning-icon" />
                <div className="sm-delete-warning-content">
                  <p className="sm-delete-warning-title">
                    Delete "{deletingService.name}"?
                  </p>
                  <p className="sm-delete-warning-text">
                    This action cannot be undone. The service will be permanently removed from your system.
                  </p>
                </div>
              </div>

              <div className="sm-modal-actions">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="sm-btn sm-btn-cancel"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="sm-btn sm-btn-danger"
                >
                  Delete Service
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServicesManagement;