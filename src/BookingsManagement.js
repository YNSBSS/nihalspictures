import React, { useState, useEffect, useRef } from 'react';
import { Calendar, Search, Eye, Edit, Trash2, X, Clock, Phone, Mail, MapPin, Camera, DollarSign, Download, RefreshCw, CreditCard, Receipt, ArrowUpDown, Printer, FileText, Building, MessageSquare, Users } from 'lucide-react';
import { collection, onSnapshot, query, orderBy, updateDoc, deleteDoc, doc, addDoc, getDocs, where } from 'firebase/firestore';
import { db } from './firebaseConfig';
import './BookingsManagement.css';
import logo from './logo.jpg';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const BookingsManagement = () => {
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPriceModal, setShowPriceModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showVoucherModal, setShowVoucherModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [deletingBooking, setDeletingBooking] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(null);
  const [bookingPrice, setBookingPrice] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [paymentNote, setPaymentNote] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const voucherRef = useRef(null);

  const statusOptions = [
    { value: 'Requested', label: 'Requested', color: '#f59e0b' },
    { value: 'confirmed', label: 'Confirmed', color: '#3b82f6' },
    { value: 'in-progress', label: 'In Progress', color: '#8b5cf6' },
    { value: 'completed', label: 'Completed', color: '#10b981' },
    { value: 'cancelled', label: 'Cancelled', color: '#ef4444' }
  ];

  const sortOptions = [
    { value: 'createdAt', label: 'Date Created' },
    { value: 'date', label: 'Session Date' },
    { value: 'firstName', label: 'Client Name' },
    { value: 'totalPrice', label: 'Total Price' },
    { value: 'status', label: 'Status' },
    { value: 'wilaya', label: 'Wilaya' },
    { value: 'packName', label: 'Service Package' }
  ];

  useEffect(() => {
    const loadBookings = () => {
      try {
        const bookingsRef = collection(db, 'bookings');
        const bookingsQuery = query(bookingsRef, orderBy('createdAt', 'desc'));

        const unsubscribe = onSnapshot(bookingsQuery, async (snapshot) => {
          const bookingsData = await Promise.all(snapshot.docs.map(async (docSnapshot) => {
            const bookingData = {
              id: docSnapshot.id,
              ...docSnapshot.data(),
              createdAt: docSnapshot.data().createdAt?.toDate?.() || new Date(docSnapshot.data().createdAt),
              updatedAt: docSnapshot.data().updatedAt?.toDate?.() || new Date(docSnapshot.data().updatedAt)
            };

            // Load payments for this booking
            const paymentsRef = collection(db, 'payments');
            const paymentsQuery = query(paymentsRef, where('bookingId', '==', docSnapshot.id), orderBy('createdAt', 'desc'));
            const paymentsSnapshot = await getDocs(paymentsQuery);
            const payments = paymentsSnapshot.docs.map(payDoc => ({
              id: payDoc.id,
              ...payDoc.data(),
              createdAt: payDoc.data().createdAt?.toDate?.() || new Date(payDoc.data().createdAt)
            }));

            const totalPaid = payments.reduce((sum, payment) => sum + (payment.amount || 0), 0);

            return {
              ...bookingData,
              payments,
              totalPaid,
              remainingAmount: (bookingData.totalPrice || 0) - totalPaid,
              paymentStatus: totalPaid === 0 ? 'unpaid' :
                totalPaid >= (bookingData.totalPrice || 0) ? 'paid' : 'partial'
            };
          }));

          setBookings(bookingsData);
          setFilteredBookings(bookingsData);
          setLoading(false);
        });

        return unsubscribe;
      } catch (error) {
        console.error('Error loading bookings:', error);
        setLoading(false);
      }
    };

    const unsubscribe = loadBookings();
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  useEffect(() => {
    let filtered = [...bookings];

    // Search filter - now includes all relevant fields
    if (searchTerm) {
      filtered = filtered.filter(booking =>
        `${booking.firstName} ${booking.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.phoneNumbers?.some(phone => phone.includes(searchTerm)) ||
        booking.packName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.wilaya?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.addressDetails?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.salleName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.remarks?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.husbandFirstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.wifeFirstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.supplements?.some(supplement =>
          supplement.name.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(booking => booking.status === statusFilter);
    }

    // Date filter
    if (dateFilter !== 'all') {
      const today = new Date();
      const filterDate = new Date();

      switch (dateFilter) {
        case 'today':
          filtered = filtered.filter(booking => {
            const bookingDate = new Date(booking.date);
            return bookingDate.toDateString() === today.toDateString();
          });
          break;
        case 'week':
          filterDate.setDate(today.getDate() + 7);
          filtered = filtered.filter(booking => {
            const bookingDate = new Date(booking.date);
            return bookingDate >= today && bookingDate <= filterDate;
          });
          break;
        case 'month':
          filterDate.setMonth(today.getMonth() + 1);
          filtered = filtered.filter(booking => {
            const bookingDate = new Date(booking.date);
            return bookingDate >= today && bookingDate <= filterDate;
          });
          break;
        default:
          break;
      }
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];

      if (sortBy === 'firstName') {
        aValue = `${a.firstName} ${a.lastName}`;
        bValue = `${b.firstName} ${b.lastName}`;
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    setFilteredBookings(filtered);
  }, [bookings, searchTerm, statusFilter, dateFilter, sortBy, sortOrder]);

  const updateBookingStatus = async (bookingId, newStatusValue) => {
    setUpdatingStatus(bookingId);
    try {
      const bookingRef = doc(db, 'bookings', bookingId);
      await updateDoc(bookingRef, {
        status: newStatusValue,
        updatedAt: new Date()
      });
      setShowStatusModal(false);
      setNewStatus('');
    } catch (error) {
      console.error('Error updating booking status:', error);
      alert('Error updating booking status. Please try again.');
    } finally {
      setUpdatingStatus(null);
    }
  };

  const updateBookingPrice = async () => {
    if (!selectedBooking || !bookingPrice || isNaN(bookingPrice)) {
      alert('Please enter a valid price.');
      return;
    }

    try {
      const bookingRef = doc(db, 'bookings', selectedBooking.id);
      await updateDoc(bookingRef, {
        totalPrice: parseFloat(bookingPrice),
        updatedAt: new Date()
      });
      setShowPriceModal(false);
      setBookingPrice('');
    } catch (error) {
      console.error('Error updating booking price:', error);
      alert('Error updating price. Please try again.');
    }
  };

  const addPayment = async () => {
    if (!selectedBooking || !paymentAmount || isNaN(paymentAmount)) {
      alert('Please enter a valid payment amount.');
      return;
    }

    const amount = parseFloat(paymentAmount);
    if (amount <= 0) {
      alert('Payment amount must be greater than 0.');
      return;
    }

    if (amount > selectedBooking.remainingAmount) {
      alert('Payment amount cannot exceed remaining amount.');
      return;
    }

    try {
      await addDoc(collection(db, 'payments'), {
        bookingId: selectedBooking.id,
        amount: amount,
        method: paymentMethod,
        note: paymentNote,
        createdAt: new Date()
      });

      setShowPaymentModal(false);
      setPaymentAmount('');
      setPaymentNote('');
      setPaymentMethod('cash');
    } catch (error) {
      console.error('Error adding payment:', error);
      alert('Error adding payment. Please try again.');
    }
  };

  const deleteBooking = async (bookingId) => {
    try {
      await deleteDoc(doc(db, 'bookings', bookingId));
      setShowDeleteModal(false);
      setDeletingBooking(null);
    } catch (error) {
      console.error('Error deleting booking:', error);
      alert('Error deleting booking. Please try again.');
    }
  };

  const getStatusColor = (status) => {
    const statusConfig = statusOptions.find(s => s.value === status);
    return statusConfig?.color || '#64748b';
  };

  const getPaymentStatusClass = (paymentStatus) => {
    switch (paymentStatus) {
      case 'paid': return 'ebms-payment-paid';
      case 'partial': return 'ebms-payment-partial';
      case 'unpaid': return 'ebms-payment-unpaid';
      default: return 'ebms-payment-unknown';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const exportBookings = () => {
    const csvContent = [
      [
        'Date', 'Time', 'Client Name', 'Husband First Name', 'Wife First Name', 'Email', 'Phone Numbers', 'Wilaya', 'Address Details',
        'Venue/Salle', 'Service', 'Supplements', 'Supplements Total', 'Cortege', 'Status', 'Total Price', 'Paid Amount',
        'Remaining', 'Payment Status', 'Remarks', 'Created At'
      ].join(','),
      ...filteredBookings.map(booking => [
        booking.date,
        booking.time,
        `${booking.firstName} ${booking.lastName}`,
        booking.husbandFirstName || '',
        booking.wifeFirstName || '',
        booking.email,
        booking.phoneNumbers?.join(' | ') || '',
        booking.wilaya || '',
        booking.addressDetails || '',
        booking.salleName || '',
        booking.packName,
        booking.supplements?.map(s => s.name).join(' | ') || '',
        booking.supplementsTotal || 0,
        booking.cortege || '',
        booking.status,
        booking.totalPrice || 0,
        booking.totalPaid || 0,
        booking.remainingAmount || 0,
        booking.paymentStatus,
        `"${booking.remarks || ''}"`,
        booking.createdAt.toLocaleDateString()
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bookings-complete-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const printVoucher = () => {
    const printContent = voucherRef.current;
    const windowPrint = window.open('', '', 'width=800,height=1000');

    windowPrint.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Payment Voucher</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            margin: 0; 
            padding: 5px; 
            background: white;
          }
          /* Copy all voucher styles here */
          .ebms-voucher-container {
            background: white;
            max-width: 900px;
            margin: 0 auto;
            padding: 40px;
            font-family: 'Arial', sans-serif;
            color: #1a202c;
            line-height: 1.6;
          }
          
          .ebms-voucher-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 40px;
            padding-bottom: 20px;
            border-bottom: 3px solid #e2e8f0;
          }
          
          .ebms-voucher-logo {
            display: flex;
            align-items: center;
            gap: 15px;
          }
          
          .ebms-logo-placeholder {
            width: 60px;
            height: 60px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
          }
          
          .ebms-company-info h1 {
            font-size: 24px;
            font-weight: bold;
            color: #1a202c;
            margin: 0;
          }
          
          .ebms-company-tagline {
            color: #64748b;
            font-size: 14px;
            margin: 4px 0 0 0;
          }
          
          .ebms-voucher-number {
            text-align: right;
          }
          
          .ebms-voucher-title {
            font-size: 20px;
            font-weight: bold;
            color: #1a202c;
            margin: 0 0 8px 0;
          }
          
          .ebms-voucher-id {
            font-size: 16px;
            color: #3b82f6;
            font-weight: 600;
            margin: 0;
          }
          
          .ebms-voucher-date {
            color: #64748b;
            font-size: 14px;
            margin: 4px 0 0 0;
          }
          
          .ebms-voucher-content-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 20px;
          }
          
          .ebms-voucher-client,
          .ebms-voucher-service,
          .ebms-voucher-pricing,
          .ebms-voucher-payments {
            margin-bottom: 30px;
            padding: 20px;
            background: #f8fafc;
            border-radius: 8px;
            border-left: 4px solid #3b82f6;
          }
          
          .ebms-section-title {
            font-size: 16px;
            font-weight: bold;
            color: #1a202c;
            margin: 0 0 15px 0;
            text-transform: uppercase;
            letter-spacing: 1px;
          }
          
          .ebms-client-details,
          .ebms-service-details {
            display: grid;
            gap: 8px;
          }
          
          .ebms-client-details p,
          .ebms-service-details p {
            margin: 0;
            color: #374151;
          }
          
          .ebms-client-details strong,
          .ebms-service-details strong {
            color: #1a202c;
            display: inline-block;
            min-width: 80px;
          }
          
          .ebms-status-inline {
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: 600;
            margin-left: 8px;
          }
          
          .ebms-pricing-table {
            display: grid;
            gap: 12px;
          }
          
          .ebms-pricing-row {
            display: flex;
            justify-content: space-between;
            padding: 12px 0;
            border-bottom: 1px solid #e2e8f0;
          }
          
          .ebms-pricing-row:last-child {
            border-bottom: none;
          }
          
          .ebms-remaining-row {
            background: #fee2e2;
            padding: 12px;
            border-radius: 6px;
            border: 1px solid #fecaca;
            font-weight: 600;
          }
          
          .ebms-price-value {
            font-weight: 600;
            color: #1a202c;
          }
          
          .ebms-price-value.ebms-paid {
            color: #059669;
          }
          
          .ebms-price-value.ebms-remaining {
            color: #dc2626;
          }
          
          .ebms-payments-table-compact {
            background: white;
            border-radius: 8px;
            overflow: hidden;
            border: 1px solid #e2e8f0;
          }
          
          .ebms-payment-row-compact {
            padding: 8px 12px;
            border-bottom: 1px solid #f1f5f9;
            background: white;
          }
          
          .ebms-payment-info-compact {
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 12px;
            gap: 8px;
          }
          
          .ebms-payment-amount-compact {
            font-weight: 600;
            color: #059669;
            font-size: 13px;
          }
          
          .ebms-voucher-footer {
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 2px solid #e2e8f0;
          }
          
          .ebms-footer-contact h4 {
            font-size: 14px;
            font-weight: bold;
            margin: 0 0 10px 0;
            color: #1a202c;
          }
          
          .ebms-footer-contact p {
            margin: 4px 0;
            font-size: 13px;
            color: #64748b;
            display: flex;
            align-items: center;
            gap: 6px;
          }
          
          .ebms-footer-signature {
            text-align: center;
          }
          
          .ebms-signature-line {
            border-top: 1px solid #1a202c;
            width: 200px;
            padding-top: 8px;
            font-size: 12px;
            color: #64748b;
          }
          
          .ebms-voucher-terms {
            margin-top: 30px;
            padding-top: 15px;
            border-top: 1px solid #e2e8f0;
            text-align: center;
          }
          
          .ebms-voucher-terms p {
            margin: 0;
            color: #64748b;
          }
          
          @media print {
            body { margin: 0; padding: 10px; }
          }
        </style>
      </head>
      <body>
        ${printContent.innerHTML}
      </body>
    </html>
  `);

    windowPrint.document.close();
    windowPrint.focus();
    windowPrint.print();
    windowPrint.close();
  };

  const downloadVoucherPDF = async () => {
    try {
      // Get the voucher container element
      const element = voucherRef.current;

      // Configure html2canvas options for better quality
      const canvas = await html2canvas(element, {
        scale: 2, // Higher resolution
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: element.scrollWidth,
        height: element.scrollHeight,
        scrollX: 0,
        scrollY: 0
      });

      // Get canvas dimensions
      const imgWidth = 210; // A4 width in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      // Create PDF
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgData = canvas.toDataURL('image/png');

      // Add image to PDF
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);

      // Generate filename with booking ID and date
      const filename = `payment-voucher-${selectedBooking.id.slice(-8).toUpperCase()}-${new Date().toISOString().split('T')[0]}.pdf`;

      // Save the PDF
      pdf.save(filename);

    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="ebms-loading-container">
        <div className="ebms-loading-spinner"></div>
        <span className="ebms-loading-text">Loading bookings...</span>
      </div>
    );
  }

  return (
    <div className="ebms-main-container">
      <div className="ebms-header-section">
        <div className="ebms-header-content">
          <h1 className="ebms-main-title">Enhanced Bookings Management</h1>
          <p className="ebms-main-subtitle">Complete booking management with all form fields and payment tracking</p>
        </div>
        <div className="ebms-header-actions">
          <button onClick={exportBookings} className="ebms-export-btn">
            <Download className="ebms-btn-icon" />
            Export CSV
          </button>
          <button onClick={() => window.location.reload()} className="ebms-refresh-btn">
            <RefreshCw className="ebms-btn-icon" />
            Refresh
          </button>
        </div>
      </div>

      <div className="ebms-filters-container">
        <div className="ebms-filters-grid">
          <div className="ebms-search-wrapper">
            <Search className="ebms-search-icon" />
            <input
              type="text"
              placeholder="Search by name, email, phone, service, location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="ebms-search-input"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="ebms-filter-select"
          >
            <option value="all">All Status</option>
            {statusOptions.map(status => (
              <option key={status.value} value={status.value}>{status.label}</option>
            ))}
          </select>

          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="ebms-filter-select"
          >
            <option value="all">All Dates</option>
            <option value="today">Today</option>
            <option value="week">Next 7 Days</option>
            <option value="month">Next 30 Days</option>
          </select>

          <div className="ebms-sort-controls">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="ebms-sort-select"
            >
              {sortOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="ebms-sort-order-btn"
              title={`Sort ${sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
            >
              <ArrowUpDown className="ebms-sort-icon" />
            </button>
          </div>

          <div className="ebms-results-count">
            Showing {filteredBookings.length} of {bookings.length} bookings
          </div>
        </div>
      </div>

      <div className="ebms-table-container">
        <div className="ebms-table-wrapper">
          <table className="ebms-bookings-table">
            <thead className="ebms-table-header">
              <tr>
                <th className="ebms-table-th">Client</th>
                <th className="ebms-table-th">Location</th>
                <th className="ebms-table-th">Service Details</th>
                <th className="ebms-table-th">Supplements</th>
                <th className="ebms-table-th">Date & Time</th>
                <th className="ebms-table-th">Status</th>
                <th className="ebms-table-th">Pricing</th>
                <th className="ebms-table-th">Payment Status</th>
                <th className="ebms-table-th">Actions</th>
              </tr>
            </thead>
            <tbody className="ebms-table-body">
              {filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan={8} className="ebms-empty-row">
                    No bookings found matching your criteria
                  </td>
                </tr>
              ) : (
                filteredBookings.map((booking) => (
                  <tr key={booking.id} className="ebms-table-row">
                    <td className="ebms-table-cell">
                      <div className="ebms-client-info">
                        <div className="ebms-client-name">{booking.firstName} {booking.lastName}</div>

                        {/* NEW: Show husband and wife names if available */}
                        {(booking.husbandFirstName || booking.wifeFirstName) && (
                          <div className="ebms-couple-names">
                            {booking.husbandFirstName && (
                              <div className="ebms-spouse-name">
                                <span className="ebms-spouse-label">Marié:</span> {booking.husbandFirstName}
                              </div>
                            )}
                            {booking.wifeFirstName && (
                              <div className="ebms-spouse-name">
                                <span className="ebms-spouse-label">Mariée:</span> {booking.wifeFirstName}
                              </div>
                            )}
                          </div>
                        )}

                        <div className="ebms-client-email">{booking.email}</div>
                        <div className="ebms-client-phone">{booking.phoneNumbers?.[0]}</div>
                        {booking.phoneNumbers?.length > 1 && (
                          <div className="ebms-client-phone-extra">
                            +{booking.phoneNumbers.length - 1} more
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="ebms-table-cell">
                      <div className="ebms-location-info">
                        <div className="ebms-wilaya">{booking.wilaya}</div>
                        <div className="ebms-address" title={booking.addressDetails}>
                          {booking.addressDetails?.substring(0, 30)}
                          {booking.addressDetails?.length > 30 && '...'}
                        </div>
                        {booking.salleName && (
                          <div className="ebms-venue">
                            <Building className="ebms-venue-icon" size={12} />
                            {booking.salleName}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="ebms-table-cell">
                      <div className="ebms-service-info">
                        <div className="ebms-service-name">{booking.packName}</div>
                        {booking.cortege && (
                          <div className="ebms-cortege">
                            <Users className="ebms-cortege-icon" size={12} />
                            Cortège: {booking.cortege}
                          </div>
                        )}
                        {booking.remarks && (
                          <div className="ebms-remarks" title={booking.remarks}>
                            <MessageSquare className="ebms-remarks-icon" size={12} />
                            Notes available
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="ebms-table-cell">
                      <div className="ebms-supplements-info">
                        {booking.supplements && booking.supplements.length > 0 ? (
                          <>
                            <div className="ebms-supplements-count">
                              {booking.supplements.length} supplément{booking.supplements.length > 1 ? 's' : ''}
                            </div>
                            <div className="ebms-supplements-total">
                              Total: {booking.supplementsTotal?.toLocaleString() || '0'} DZD
                            </div>
                            <div className="ebms-supplements-preview" title={booking.supplements.map(s => s.name).join(', ')}>
                              {booking.supplements.slice(0, 2).map(supplement => (
                                <div key={supplement.id} className="ebms-supplement-tag">
                                  {supplement.name}
                                </div>
                              ))}
                              {booking.supplements.length > 2 && (
                                <div className="ebms-supplement-more">
                                  +{booking.supplements.length - 2} more
                                </div>
                              )}
                            </div>
                          </>
                        ) : (
                          <div className="ebms-no-supplements">Aucun supplément</div>
                        )}
                      </div>
                    </td>
                    <td className="ebms-table-cell">
                      <div className="ebms-booking-date">{formatDate(booking.date)}</div>
                      <div className="ebms-booking-time">{booking.time}</div>
                    </td>
                    <td className="ebms-table-cell">
                      <span
                        className="ebms-status-badge"
                        style={{ backgroundColor: getStatusColor(booking.status), color: 'white' }}
                      >
                        {statusOptions.find(s => s.value === booking.status)?.label || booking.status}
                      </span>
                    </td>
                    <td className="ebms-table-cell">
                      <div className="ebms-pricing-info">
                        <div className="ebms-total-price">
                          Total: {booking.totalPrice?.toLocaleString() || 'Not Set'} DZD
                        </div>
                        {booking.totalPrice && (
                          <>
                            <div className="ebms-paid-amount">Paid: {booking.totalPaid?.toLocaleString() || '0'} DZD</div>
                            <div className="ebms-remaining-amount">Remaining: {booking.remainingAmount?.toLocaleString() || '0'} DZD</div>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="ebms-table-cell">
                      <span className={`ebms-payment-badge ${getPaymentStatusClass(booking.paymentStatus)}`}>
                        {booking.paymentStatus === 'paid' ? 'Fully Paid' :
                          booking.paymentStatus === 'partial' ? 'Partial Payment' : 'Unpaid'}
                      </span>
                    </td>
                    <td className="ebms-table-cell">
                      <div className="ebms-actions-container">
                        <button
                          onClick={() => {
                            setSelectedBooking(booking);
                            setNewStatus(booking.status);
                            setShowStatusModal(true);
                          }}
                          disabled={updatingStatus === booking.id}
                          className="ebms-action-btn ebms-status-btn"
                          title="Update status"
                        >
                          <Edit className="ebms-action-icon" />
                        </button>

                        <button
                          onClick={() => {
                            setSelectedBooking(booking);
                            setBookingPrice(booking.totalPrice?.toString() || '');
                            setShowPriceModal(true);
                          }}
                          className="ebms-action-btn ebms-price-btn"
                          title="Set/Update price"
                        >
                          <DollarSign className="ebms-action-icon" />
                        </button>

                        {booking.totalPrice && (
                          <button
                            onClick={() => {
                              setSelectedBooking(booking);
                              setShowPaymentModal(true);
                            }}
                            className="ebms-action-btn ebms-payment-btn"
                            title="Add payment"
                          >
                            <CreditCard className="ebms-action-icon" />
                          </button>
                        )}

                        {booking.totalPrice && (
                          <button
                            onClick={() => {
                              setSelectedBooking(booking);
                              setShowVoucherModal(true);
                            }}
                            className="ebms-action-btn ebms-voucher-btn"
                            title="View payment voucher"
                          >
                            <Receipt className="ebms-action-icon" />
                          </button>
                        )}

                        <button
                          onClick={() => {
                            setSelectedBooking(booking);
                            setShowBookingModal(true);
                          }}
                          className="ebms-action-btn ebms-view-btn"
                          title="View details"
                        >
                          <Eye className="ebms-action-icon" />
                        </button>

                        <button
                          onClick={() => {
                            setDeletingBooking(booking);
                            setShowDeleteModal(true);
                          }}
                          className="ebms-action-btn ebms-delete-btn"
                          title="Delete booking"
                        >
                          <Trash2 className="ebms-action-icon" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Status Update Modal */}
      {showStatusModal && selectedBooking && (
        <div className="ebms-modal-overlay">
          <div className="ebms-status-modal">
            <div className="ebms-modal-header">
              <h2 className="ebms-modal-title">Update Booking Status</h2>
              <button onClick={() => setShowStatusModal(false)} className="ebms-close-btn">
                <X className="ebms-close-icon" />
              </button>
            </div>
            <div className="ebms-modal-body">
              <div className="ebms-status-form">
                <div className="ebms-form-group">
                  <label className="ebms-form-label">
                    Current Status for {selectedBooking.firstName} {selectedBooking.lastName}
                  </label>
                  <div className="ebms-status-options">
                    {statusOptions.map(status => (
                      <label key={status.value} className="ebms-status-option">
                        <input
                          type="radio"
                          name="bookingStatus"
                          value={status.value}
                          checked={newStatus === status.value}
                          onChange={(e) => setNewStatus(e.target.value)}
                          className="ebms-status-radio"
                        />
                        <span
                          className="ebms-status-label"
                          style={{ backgroundColor: status.color, color: 'white' }}
                        >
                          {status.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="ebms-form-actions">
                  <button onClick={() => setShowStatusModal(false)} className="ebms-cancel-btn">
                    Cancel
                  </button>
                  <button
                    onClick={() => updateBookingStatus(selectedBooking.id, newStatus)}
                    className="ebms-save-btn"
                    disabled={updatingStatus === selectedBooking.id}
                  >
                    {updatingStatus === selectedBooking.id ? 'Updating...' : 'Update Status'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Voucher Modal */}
      {showVoucherModal && selectedBooking && (
        <div className="ebms-modal-overlay">
          <div className="ebms-voucher-modal">
            <div className="ebms-modal-header">
              <h2 className="ebms-modal-title">Bon de payement</h2>
              <div className="ebms-voucher-actions">
                <button onClick={printVoucher} className="ebms-print-btn">
                  <Printer className="ebms-btn-icon" />
                  Print
                </button>
                <button onClick={downloadVoucherPDF} className="ebms-pdf-btn">
                  <FileText className="ebms-btn-icon" />
                  PDF
                </button>
                <button onClick={() => setShowVoucherModal(false)} className="ebms-close-btn">
                  <X className="ebms-close-icon" />
                </button>
              </div>
            </div>
            <div className="ebms-modal-body">
              <div ref={voucherRef} className="ebms-voucher-container">
                <div className="ebms-voucher-header">
                  <div className="ebms-voucher-logo">
                    <div className="ebms-logo-placeholder">
                      <img src={logo} alt="logo" style={{ width: "70px", borderRadius: "40%" }} />
                    </div>
                    <div className="ebms-company-info">
                      <h1 className="ebms-company-name">Nihal's Pictures</h1>
                      <p className="ebms-company-tagline">Professional Photography Services</p>
                    </div>
                  </div>
                  <div className="ebms-voucher-number">
                    <h2 className="ebms-voucher-title">Bon de payement</h2>
                    <p className="ebms-voucher-id">#{selectedBooking.id.slice(-8).toUpperCase()}</p>
                    <p className="ebms-voucher-date">{new Date().toLocaleDateString()}</p>
                  </div>
                </div>

                {/* Two-column layout for main content */}
                <div className="ebms-voucher-content-grid">
                  <div className="ebms-voucher-left-column">
                    <div className="ebms-voucher-client">
                      <h3 className="ebms-section-title">INFORMATION DU CLIENT</h3>
                      <div className="ebms-client-details">
                        <p><strong>Nom:</strong> {selectedBooking.firstName} {selectedBooking.lastName}</p>

                        {/* NEW: Add couple names to voucher */}
                        {selectedBooking.husbandFirstName && (
                          <p><strong>Marié:</strong> {selectedBooking.husbandFirstName}</p>
                        )}
                        {selectedBooking.wifeFirstName && (
                          <p><strong>Mariée:</strong> {selectedBooking.wifeFirstName}</p>
                        )}

                        <p><strong>Email:</strong> {selectedBooking.email}</p>
                        <p><strong>Téléphone:</strong> {selectedBooking.phoneNumbers?.[0]}</p>
                        {selectedBooking.phoneNumbers?.length > 1 && (
                          <p><strong>Téléphone 2:</strong> {selectedBooking.phoneNumbers?.[1]}</p>
                        )}
                        <p><strong>Wilaya:</strong> {selectedBooking.wilaya}</p>
                        <p><strong>Adresse:</strong> {selectedBooking.addressDetails}</p>
                        {selectedBooking.salleName && (
                          <p><strong>Salle:</strong> {selectedBooking.salleName}</p>
                        )}
                      </div>
                    </div>

                    <div className="ebms-voucher-service">
                      <h3 className="ebms-section-title">SERVICE DETAILS</h3>
                      <div className="ebms-service-details">
                        <p><strong>Service:</strong> {selectedBooking.packName}</p>
                        <p><strong>Date:</strong> {formatDate(selectedBooking.date)}</p>
                        <p><strong>Heure:</strong> {selectedBooking.time}</p>
                        {selectedBooking.cortege && (
                          <p><strong>Cortège:</strong> {selectedBooking.cortege}</p>
                        )}
                        <p><strong>Status:</strong>
                          <span
                            className="ebms-status-inline"
                            style={{ backgroundColor: getStatusColor(selectedBooking.status), color: 'white' }}
                          >
                            {statusOptions.find(s => s.value === selectedBooking.status)?.label || selectedBooking.status}
                          </span>
                        </p>
                        {selectedBooking.remarks && (
                          <p><strong>Notes:</strong> {selectedBooking.remarks}</p>
                        )}
                      </div>
                    </div>
                    {/* Add this after service details in voucher */}
                    {selectedBooking.supplements && selectedBooking.supplements.length > 0 && (
                      <>
                        <p><strong>Suppléments:</strong></p>
                        {selectedBooking.supplements.map(supplement => (
                          <p key={supplement.id} style={{ marginLeft: '15px', fontSize: '14px' }}>
                            • {supplement.name}: {supplement.price?.toLocaleString()} DZD
                          </p>
                        ))}
                        <p><strong>Total Suppléments:</strong> {selectedBooking.supplementsTotal?.toLocaleString()} DZD</p>
                      </>
                    )}
                  </div>

                  <div className="ebms-voucher-right-column">
                    <div className="ebms-voucher-pricing">
                      <h3 className="ebms-section-title">Payement</h3>
                      <div className="ebms-pricing-table">
                        <div className="ebms-pricing-row">
                          <span>Total Service Price:</span>
                          <span className="ebms-price-value">DZD {selectedBooking.totalPrice?.toLocaleString()}</span>
                        </div>
                        <div className="ebms-pricing-row">
                          <span>Total payé:</span>
                          <span className="ebms-price-value ebms-paid">DZD {selectedBooking.totalPaid?.toLocaleString() || '0'}</span>
                        </div>
                        <div className="ebms-pricing-row ebms-remaining-row">
                          <span>Reste a payer:</span>
                          <span className="ebms-price-value ebms-remaining">DZD {selectedBooking.remainingAmount?.toLocaleString() || '0'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="ebms-voucher-payments">
                      <h3 className="ebms-section-title">PAYMENT HISTORY</h3>
                      <div className="ebms-payments-table-compact">
                        {selectedBooking.payments && selectedBooking.payments.length > 0 ? (
                          selectedBooking.payments.slice(0, 3).map((payment, index) => (
                            <div key={payment.id} className="ebms-payment-row-compact">
                              <div className="ebms-payment-info-compact">
                                <span className="ebms-payment-amount-compact">DZD {payment.amount?.toLocaleString()}</span>
                                <span className="ebms-payment-method-compact">{payment.method}</span>
                                <span className="ebms-payment-date-compact">{payment.createdAt?.toLocaleDateString()}</span>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="ebms-no-payments-compact">No payments recorded yet</div>
                        )}
                        {selectedBooking.payments && selectedBooking.payments.length > 3 && (
                          <div className="ebms-more-payments">... and {selectedBooking.payments.length - 3} more payments</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="ebms-voucher-footer">
                  <div className="ebms-footer-contact">
                    <h4>Contact Information</h4>
                    <p><Phone size={12} /> +213 552 49 33 48</p>
                    <p><Mail size={12} /> nihalspictures@gmail.com</p>
                    <p><MapPin size={12} /> Alger, Algeria</p>
                  </div>
                  <div className="ebms-footer-signature">
                    <div className="ebms-signature-line">
                      <span>Signature</span>
                    </div>
                  </div>
                </div>

                <div className="ebms-voucher-terms">
                  <p><small>Ce bon sert de preuve de paiement pour les services de Nihal's Pictures. Veuillez le conserver pour vos dossiers.</small></p>
                </div>
              </div>

              {/* Exit button at bottom */}
              <div className="ebms-voucher-exit-section">
                <button onClick={() => setShowVoucherModal(false)} className="ebms-exit-btn">
                  <X className="ebms-btn-icon" />
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}


      {/* Price Setting Modal */}
      {showPriceModal && selectedBooking && (
        <div className="ebms-modal-overlay">
          <div className="ebms-price-modal">
            <div className="ebms-modal-header">
              <h2 className="ebms-modal-title">Set Booking Price</h2>
              <button onClick={() => setShowPriceModal(false)} className="ebms-close-btn">
                <X className="ebms-close-icon" />
              </button>
            </div>
            <div className="ebms-modal-body">
              <div className="ebms-price-form">
                <div className="ebms-form-group">
                  <label className="ebms-form-label">
                    Total Price for {selectedBooking.firstName} {selectedBooking.lastName}
                  </label>
                  <div className="ebms-price-input-wrapper">
                    <span className="ebms-currency">DZD</span>
                    <input
                      type="number"
                      value={bookingPrice}
                      onChange={(e) => setBookingPrice(e.target.value)}
                      className="ebms-price-input"
                      placeholder="Enter total price"
                      min="0"
                      step="100"
                    />
                  </div>
                </div>
                <div className="ebms-form-actions">
                  <button onClick={() => setShowPriceModal(false)} className="ebms-cancel-btn">
                    Cancel
                  </button>
                  <button onClick={updateBookingPrice} className="ebms-save-btn">
                    Save Price
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && selectedBooking && (
        <div className="ebms-modal-overlay">
          <div className="ebms-payment-modal">
            <div className="ebms-modal-header">
              <h2 className="ebms-modal-title">Add Payment</h2>
              <button onClick={() => setShowPaymentModal(false)} className="ebms-close-btn">
                <X className="ebms-close-icon" />
              </button>
            </div>
            <div className="ebms-modal-body">
              <div className="ebms-payment-summary">
                <div className="ebms-summary-item">
                  <span className="ebms-summary-label">Total Price:</span>
                  <span className="ebms-summary-value">DZD {selectedBooking.totalPrice?.toLocaleString()}</span>
                </div>
                <div className="ebms-summary-item">
                  <span className="ebms-summary-label">Paid So Far:</span>
                  <span className="ebms-summary-value">DZD {selectedBooking.totalPaid?.toLocaleString()}</span>
                </div>
                <div className="ebms-summary-item ebms-remaining">
                  <span className="ebms-summary-label">Remaining:</span>
                  <span className="ebms-summary-value">DZD {selectedBooking.remainingAmount?.toLocaleString()}</span>
                </div>
              </div>

              <div className="ebms-payment-form">
                <div className="ebms-form-group">
                  <label className="ebms-form-label">Payment Amount</label>
                  <div className="ebms-price-input-wrapper">
                    <span className="ebms-currency">DZD</span>
                    <input
                      type="number"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      className="ebms-price-input"
                      placeholder="Enter payment amount"
                      min="0"
                      max={selectedBooking.remainingAmount}
                      step="100"
                    />
                  </div>
                </div>

                <div className="ebms-form-group">
                  <label className="ebms-form-label">Payment Method</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="ebms-form-select"
                  >
                    <option value="cash">Cash</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="check">Check</option>
                    <option value="card">Credit/Debit Card</option>
                    <option value="mobile_payment">Mobile Payment</option>
                  </select>
                </div>

                <div className="ebms-form-group">
                  <label className="ebms-form-label">Note (Optional)</label>
                  <textarea
                    value={paymentNote}
                    onChange={(e) => setPaymentNote(e.target.value)}
                    className="ebms-form-textarea"
                    placeholder="Payment notes, reference number, etc."
                    rows={3}
                  />
                </div>

                <div className="ebms-form-actions">
                  <button onClick={() => setShowPaymentModal(false)} className="ebms-cancel-btn">
                    Cancel
                  </button>
                  <button onClick={addPayment} className="ebms-save-btn">
                    Add Payment
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Booking Details Modal */}
      {showBookingModal && selectedBooking && (
        <div className="ebms-modal-overlay">
          <div className="ebms-booking-modal">
            <div className="ebms-modal-header">
              <h2 className="ebms-modal-title">Complete Booking Details</h2>
              <button onClick={() => setShowBookingModal(false)} className="ebms-close-btn">
                <X className="ebms-close-icon" />
              </button>
            </div>
            <div className="ebms-modal-body">
              <div className="ebms-booking-details-grid">
                <div className="ebms-client-section">
                  <h3 className="ebms-section-title">Client Information</h3>
                  <div className="ebms-client-avatar-row">
                    <div className="ebms-client-avatar">
                      <span className="ebms-avatar-text">
                        {selectedBooking.firstName?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="ebms-client-name-info">
                      <div className="ebms-client-fullname">
                        {selectedBooking.firstName} {selectedBooking.lastName}
                      </div>
                    </div>
                  </div>

                  {/* NEW: Show couple names in modal */}
                  {(selectedBooking.husbandFirstName || selectedBooking.wifeFirstName) && (
                    <div className="ebms-couple-details">
                      {selectedBooking.husbandFirstName && (
                        <div className="ebms-contact-row">
                          <Users className="ebms-contact-icon" />
                          <span className="ebms-contact-text">Marié: {selectedBooking.husbandFirstName}</span>
                        </div>
                      )}
                      {selectedBooking.wifeFirstName && (
                        <div className="ebms-contact-row">
                          <Users className="ebms-contact-icon" />
                          <span className="ebms-contact-text">Mariée: {selectedBooking.wifeFirstName}</span>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="ebms-contact-row">
                    <Mail className="ebms-contact-icon" />
                    <span className="ebms-contact-text">{selectedBooking.email}</span>
                  </div>
                  {selectedBooking.phoneNumbers?.map((phone, index) => (
                    <div key={index} className="ebms-contact-row">
                      <Phone className="ebms-contact-icon" />
                      <span className="ebms-contact-text">{phone}</span>
                    </div>
                  ))}
                </div>

                <div className="ebms-location-section">
                  <h3 className="ebms-section-title">Location Information</h3>
                  <div className="ebms-contact-row">
                    <MapPin className="ebms-contact-icon" />
                    <div className="ebms-location-details">
                      <div className="ebms-wilaya-text">{selectedBooking.wilaya}</div>
                      <div className="ebms-address-text">{selectedBooking.addressDetails}</div>
                      {selectedBooking.salleName && (
                        <div className="ebms-venue-text">
                          <Building className="ebms-venue-icon" size={14} />
                          Venue: {selectedBooking.salleName}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="ebms-booking-section">
                  <h3 className="ebms-section-title">Service & Booking Information</h3>
                  <div className="ebms-booking-row">
                    <Camera className="ebms-booking-icon" />
                    <span className="ebms-booking-text">{selectedBooking.packName}</span>
                  </div>
                  <div className="ebms-booking-row">
                    <Calendar className="ebms-booking-icon" />
                    <span className="ebms-booking-text">{formatDate(selectedBooking.date)}</span>
                  </div>
                  <div className="ebms-booking-row">
                    <Clock className="ebms-booking-icon" />
                    <span className="ebms-booking-text">{selectedBooking.time}</span>
                  </div>
                  {selectedBooking.cortege && (
                    <div className="ebms-booking-row">
                      <Users className="ebms-booking-icon" />
                      <span className="ebms-booking-text">Cortège: {selectedBooking.cortege}</span>
                    </div>
                  )}
                  <div className="ebms-booking-row">
                    <span className="ebms-booking-label">Status:</span>
                    <span
                      className="ebms-status-badge"
                      style={{ backgroundColor: getStatusColor(selectedBooking.status), color: 'white' }}
                    >
                      {statusOptions.find(s => s.value === selectedBooking.status)?.label || selectedBooking.status}
                    </span>
                  </div>
                </div>
                {/* Supplements Section */}
                {selectedBooking.supplements && selectedBooking.supplements.length > 0 && (
                  <div className="ebms-supplements-section">
                    <h3 className="ebms-section-title">Suppléments Sélectionnés</h3>
                    <div className="ebms-supplements-list">
                      {selectedBooking.supplements.map((supplement) => (
                        <div key={supplement.id} className="ebms-supplement-item">
                          <span className="ebms-supplement-name">{supplement.name}</span>
                          <span className="ebms-supplement-price">
                            {supplement.price?.toLocaleString()} DZD
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="ebms-supplements-total-row">
                      <span className="ebms-supplements-total-label">Total Suppléments:</span>
                      <span className="ebms-supplements-total-value">
                        {selectedBooking.supplementsTotal?.toLocaleString()} DZD
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Pricing Section */}
              <div className="ebms-pricing-section">
                <h3 className="ebms-section-title">Pricing & Payments</h3>
                <div className="ebms-pricing-overview">
                  <div className="ebms-price-item">
                    <span className="ebms-price-label">Total Price:</span>
                    <span className="ebms-price-value">
                      DZD {selectedBooking.totalPrice?.toLocaleString() || 'Not Set'}
                    </span>
                  </div>
                  {selectedBooking.totalPrice && (
                    <>
                      <div className="ebms-price-item">
                        <span className="ebms-price-label">Paid So Far:</span>
                        <span className="ebms-price-value ebms-paid">
                          DZD {selectedBooking.totalPaid?.toLocaleString() || '0'}
                        </span>
                      </div>
                      <div className="ebms-price-item">
                        <span className="ebms-price-label">Remaining:</span>
                        <span className="ebms-price-value ebms-remaining">
                          DZD {selectedBooking.remainingAmount?.toLocaleString() || '0'}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Payment History */}
              {selectedBooking.payments && selectedBooking.payments.length > 0 && (
                <div className="ebms-payments-section">
                  <h3 className="ebms-section-title">Payment History</h3>
                  <div className="ebms-payments-list">
                    {selectedBooking.payments.map((payment, index) => (
                      <div key={payment.id} className="ebms-payment-item">
                        <div className="ebms-payment-info">
                          <div className="ebms-payment-amount">
                            DZD {payment.amount?.toLocaleString()}
                          </div>
                          <div className="ebms-payment-method">{payment.method}</div>
                          <div className="ebms-payment-date">
                            {payment.createdAt?.toLocaleDateString()}
                          </div>
                        </div>
                        {payment.note && (
                          <div className="ebms-payment-note">{payment.note}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes Section */}
              {selectedBooking.remarks && (
                <div className="ebms-notes-section">
                  <h3 className="ebms-section-title">Client Notes & Remarks</h3>
                  <div className="ebms-notes-content">
                    <p className="ebms-notes-text">{selectedBooking.remarks}</p>
                  </div>
                </div>
              )}

              {/* Timestamps */}
              <div className="ebms-timestamps-section">
                <div className="ebms-timestamps-grid">
                  <div className="ebms-timestamp-item">
                    <span className="ebms-timestamp-label">Created:</span>
                    {selectedBooking.createdAt?.toLocaleString()}
                  </div>
                  <div className="ebms-timestamp-item">
                    <span className="ebms-timestamp-label">Last Updated:</span>
                    {selectedBooking.updatedAt?.toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="ebms-modal-actions">
                <button onClick={() => setShowBookingModal(false)} className="ebms-cancel-btn">
                  Close
                </button>

                <div className="ebms-modal-action-buttons">
                  <button
                    onClick={() => {
                      setBookingPrice(selectedBooking.totalPrice?.toString() || '');
                      setShowBookingModal(false);
                      setShowPriceModal(true);
                    }}
                    className="ebms-action-secondary-btn"
                  >
                    <DollarSign className="ebms-btn-icon" />
                    Update Price
                  </button>

                  {selectedBooking.totalPrice && selectedBooking.remainingAmount > 0 && (
                    <button
                      onClick={() => {
                        setShowBookingModal(false);
                        setShowPaymentModal(true);
                      }}
                      className="ebms-action-primary-btn"
                    >
                      <CreditCard className="ebms-btn-icon" />
                      Add Payment
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && deletingBooking && (
        <div className="ebms-modal-overlay">
          <div className="ebms-delete-modal">
            <div className="ebms-modal-header">
              <h2 className="ebms-modal-title ebms-delete-title">Delete Booking</h2>
              <button onClick={() => setShowDeleteModal(false)} className="ebms-close-btn">
                <X className="ebms-close-icon" />
              </button>
            </div>
            <div className="ebms-modal-body">
              <p className="ebms-delete-text">
                Are you sure you want to delete the booking for{' '}
                <strong>{deletingBooking.firstName} {deletingBooking.lastName}</strong>?
                This action cannot be undone and will also delete all associated payment records.
              </p>
              <div className="ebms-form-actions">
                <button onClick={() => setShowDeleteModal(false)} className="ebms-cancel-btn">
                  Cancel
                </button>
                <button
                  onClick={() => deleteBooking(deletingBooking.id)}
                  className="ebms-delete-confirm-btn"
                >
                  Delete Booking
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hidden styles for voucher printing */}
      <style className="ebms-voucher-styles" dangerouslySetInnerHTML={{
        __html: `
          @media print {
            .ebms-voucher-container {
              max-width: none !important;
              width: 100% !important;
              margin: 0 !important;
              padding: 20px !important;
              box-shadow: none !important;
            }
          }
          
          .ebms-venue-icon {
            display: inline;
            margin-right: 4px;
            vertical-align: middle;
          }
          
          .ebms-venue-text {
            display: flex;
            align-items: center;
            gap: 4px;
            margin-top: 4px;
            font-size: 13px;
            color: #64748b;
          }
          
          .ebms-cortege-icon, .ebms-remarks-icon {
            margin-right: 4px;
            vertical-align: middle;
          }
          
          .ebms-cortege, .ebms-remarks {
            display: flex;
            align-items: center;
            font-size: 12px;
            color: #64748b;
            margin-top: 4px;
          }
          
          .ebms-wilaya-text {
            font-weight: 600;
            color: #1f2937;
          }
          
          .ebms-address-text {
            color: #6b7280;
            font-size: 13px;
            margin-top: 2px;
          }
        `
      }} />
    </div>
  );
}
export default BookingsManagement;