import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from './firebaseConfig';
import { Calendar, ChevronLeft, ChevronRight, Clock, Users, MapPin, X, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import './AvailabilityCalendar.css';

const AvailabilityCalendar = () => {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
    const [selectedDate, setSelectedDate] = useState(null);
    const [showDayModal, setShowDayModal] = useState(false);
    const [dayBookings, setDayBookings] = useState([]);
    const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'

    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const statusConfig = {
        'Requested': { label: 'Requested', color: '#f59e0b', icon: AlertCircle },
        'confirmed': { label: 'Confirmed', color: '#3b82f6', icon: CheckCircle },
        'in-progress': { label: 'In Progress', color: '#8b5cf6', icon: Clock },
        'completed': { label: 'Completed', color: '#10b981', icon: CheckCircle },
        'cancelled': { label: 'Cancelled', color: '#ef4444', icon: XCircle }
    };

    // Load bookings data
    useEffect(() => {
        const loadBookings = () => {
            try {
                const bookingsRef = collection(db, 'bookings');
                const bookingsQuery = query(bookingsRef, orderBy('date', 'asc'));

                const unsubscribe = onSnapshot(bookingsQuery, (snapshot) => {
                    const bookingsData = snapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data(),
                        createdAt: doc.data().createdAt?.toDate?.() || new Date(doc.data().createdAt),
                        updatedAt: doc.data().updatedAt?.toDate?.() || new Date(doc.data().updatedAt)
                    }));

                    setBookings(bookingsData);
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

    // Get bookings for a specific date
    const getBookingsForDate = (date) => {
        // Normalize the date to avoid timezone issues
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const dateString = `${year}-${month}-${day}`;

        return bookings.filter(booking => booking.date === dateString);
    };

    // Get availability status for a date
    const getAvailabilityStatus = (date) => {
        const dayBookings = getBookingsForDate(date);

        if (dayBookings.length === 0) {
            return { status: 'available', count: 0, bookings: [] };
        }

        const activeBookings = dayBookings.filter(booking =>
            booking.status !== 'cancelled' && booking.status !== 'completed'
        );

        if (activeBookings.length === 0) {
            return { status: 'free', count: dayBookings.length, bookings: dayBookings };
        }

        const hasConfirmed = activeBookings.some(booking =>
            booking.status === 'confirmed' || booking.status === 'in-progress'
        );

        if (hasConfirmed) {
            return { status: 'busy', count: dayBookings.length, bookings: dayBookings };
        }

        return { status: 'pending', count: dayBookings.length, bookings: dayBookings };
    };

    // Generate calendar days for a month
    const generateCalendarDays = (year, month) => {
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const startDate = new Date(firstDay);
        const endDate = new Date(lastDay);

        // Start from the beginning of the week
        startDate.setDate(startDate.getDate() - startDate.getDay());

        // End at the end of the week
        endDate.setDate(endDate.getDate() + (6 - endDate.getDay()));

        const days = [];
        const currentDate = new Date(startDate);

        while (currentDate <= endDate) {
            // Create date string in YYYY-MM-DD format to match your booking dates
            const dateForComparison = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());

            days.push({
                date: new Date(currentDate),
                isCurrentMonth: currentDate.getMonth() === month,
                isToday: currentDate.toDateString() === new Date().toDateString(),
                isPast: currentDate < new Date().setHours(0, 0, 0, 0),
                availability: getAvailabilityStatus(dateForComparison) // Use the normalized date
            });
            currentDate.setDate(currentDate.getDate() + 1);
        }

        return days;
    };

    // Handle day click
    const handleDayClick = (day) => {
        if (day.availability.count > 0) {
            setSelectedDate(day.date);
            setDayBookings(day.availability.bookings);
            setShowDayModal(true);
        }
    };

    // Get status color class
    const getStatusColorClass = (status) => {
        switch (status) {
            case 'available': return 'ac-day-available';
            case 'free': return 'ac-day-free';
            case 'pending': return 'ac-day-pending';
            case 'busy': return 'ac-day-busy';
            default: return 'ac-day-available';
        }
    };

    if (loading) {
        return (
            <div className="ac-loading-container">
                <div className="ac-loading-spinner"></div>
                <span className="ac-loading-text">Loading calendar...</span>
            </div>
        );
    }

    return (
        <div className="ac-main-container">
            {/* Header */}
            <div className="ac-header-section">
                <div className="ac-header-content">
                    <h1 className="ac-main-title">Availability Calendar</h1>
                    <p className="ac-main-subtitle">View photographer availability and bookings across the year</p>
                </div>
                <div className="ac-header-controls">
                    <div className="ac-year-navigation">
                        <button
                            onClick={() => setCurrentYear(currentYear - 1)}
                            className="ac-nav-button"
                        >
                            <ChevronLeft className="ac-nav-icon" />
                        </button>
                        <span className="ac-year-display">{currentYear}</span>
                        <button
                            onClick={() => setCurrentYear(currentYear + 1)}
                            className="ac-nav-button"
                        >
                            <ChevronRight className="ac-nav-icon" />
                        </button>
                    </div>
                    <div className="ac-view-toggle">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`ac-view-button ${viewMode === 'grid' ? 'ac-view-active' : ''}`}
                        >
                            Grid
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`ac-view-button ${viewMode === 'list' ? 'ac-view-active' : ''}`}
                        >
                            List
                        </button>
                    </div>
                </div>
            </div>

            {/* Legend */}
            <div className="ac-legend-container">
                <div className="ac-legend-item">
                    <div className="ac-legend-color ac-legend-available"></div>
                    <span className="ac-legend-text">Available</span>
                </div>
                <div className="ac-legend-item">
                    <div className="ac-legend-color ac-legend-pending"></div>
                    <span className="ac-legend-text">Pending Bookings</span>
                </div>
                <div className="ac-legend-item">
                    <div className="ac-legend-color ac-legend-busy"></div>
                    <span className="ac-legend-text">Busy (Confirmed)</span>
                </div>
                <div className="ac-legend-item">
                    <div className="ac-legend-color ac-legend-free"></div>
                    <span className="ac-legend-text">Free (Completed/Cancelled)</span>
                </div>
            </div>

            {/* Calendar Grid */}
            {viewMode === 'grid' ? (
                <div className="ac-calendar-grid">
                    {months.map((monthName, monthIndex) => {
                        const days = generateCalendarDays(currentYear, monthIndex);

                        return (
                            <div key={monthIndex} className="ac-month-container">
                                <div className="ac-month-header">
                                    <h3 className="ac-month-title">{monthName} {currentYear}</h3>
                                </div>

                                <div className="ac-calendar-wrapper">
                                    <div className="ac-weekdays-header">
                                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                                            <div key={day} className="ac-weekday">{day}</div>
                                        ))}
                                    </div>

                                    <div className="ac-days-grid">
                                        {days.map((day, dayIndex) => (
                                            <div
                                                key={dayIndex}
                                                onClick={() => handleDayClick(day)}
                                                className={`ac-day ${getStatusColorClass(day.availability.status)} 
                          ${!day.isCurrentMonth ? 'ac-day-other-month' : ''} 
                          ${day.isToday ? 'ac-day-today' : ''} 
                          ${day.isPast ? 'ac-day-past' : ''} 
                          ${day.availability.count > 0 ? 'ac-day-clickable' : ''}`}
                                            >
                                                <span className="ac-day-number">{day.date.getDate()}</span>
                                                {day.availability.count > 0 && (
                                                    <div className="ac-booking-indicator">
                                                        <span className="ac-booking-count">{day.availability.count}</span>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                /* List View */
                <div className="ac-list-view">
                    {months.map((monthName, monthIndex) => {
                        const monthBookings = bookings.filter(booking => {
                            const bookingDate = new Date(booking.date);
                            return bookingDate.getFullYear() === currentYear && bookingDate.getMonth() === monthIndex;
                        });

                        if (monthBookings.length === 0) return null;

                        return (
                            <div key={monthIndex} className="ac-month-list-container">
                                <div className="ac-month-list-header">
                                    <h3 className="ac-month-list-title">{monthName} {currentYear}</h3>
                                    <span className="ac-month-booking-count">{monthBookings.length} bookings</span>
                                </div>

                                <div className="ac-bookings-list">
                                    {monthBookings.map(booking => {
                                        const statusInfo = statusConfig[booking.status] || statusConfig['Requested'];
                                        const StatusIcon = statusInfo.icon;

                                        return (
                                            <div key={booking.id} className="ac-booking-list-item">
                                                <div className="ac-booking-date-section">
                                                    <div className="ac-booking-date">
                                                        {new Date(booking.date).toLocaleDateString('en-US', {
                                                            day: 'numeric',
                                                            month: 'short'
                                                        })}
                                                    </div>
                                                    <div className="ac-booking-time">{booking.time}</div>
                                                </div>

                                                <div className="ac-booking-details-section">
                                                    <div className="ac-booking-client">
                                                        {booking.firstName} {booking.lastName}
                                                    </div>
                                                    <div className="ac-booking-service">{booking.packName}</div>
                                                    <div className="ac-booking-location">
                                                        <MapPin className="ac-location-icon" size={12} />
                                                        {booking.wilaya}
                                                    </div>
                                                </div>

                                                <div className="ac-booking-status-section">
                                                    <div
                                                        className="ac-booking-status"
                                                        style={{ backgroundColor: statusInfo.color, color: 'white' }}
                                                    >
                                                        <StatusIcon className="ac-status-icon" size={14} />
                                                        {statusInfo.label}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Day Details Modal */}
            {showDayModal && selectedDate && (
                <div className="ac-modal-overlay">
                    <div className="ac-day-modal">
                        <div className="ac-modal-header">
                            <h2 className="ac-modal-title">
                                Bookings for {selectedDate.toLocaleDateString('en-US', {
                                    weekday: 'long',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                })}
                            </h2>
                            <button onClick={() => setShowDayModal(false)} className="ac-close-btn">
                                <X className="ac-close-icon" />
                            </button>
                        </div>

                        <div className="ac-modal-body">
                            <div className="ac-day-bookings-list">
                                {dayBookings.map(booking => {
                                    const statusInfo = statusConfig[booking.status] || statusConfig['Requested'];
                                    const StatusIcon = statusInfo.icon;

                                    return (
                                        <div key={booking.id} className="ac-day-booking-item">
                                            <div className="ac-day-booking-header">
                                                <div className="ac-day-booking-client">
                                                    <div className="ac-client-name">
                                                        {booking.firstName} {booking.lastName}
                                                    </div>
                                                    <div className="ac-client-email">{booking.email}</div>
                                                </div>
                                                <div
                                                    className="ac-day-booking-status"
                                                    style={{ backgroundColor: statusInfo.color, color: 'white' }}
                                                >
                                                    <StatusIcon className="ac-status-icon" size={14} />
                                                    {statusInfo.label}
                                                </div>
                                            </div>

                                            <div className="ac-day-booking-details">
                                                <div className="ac-booking-detail-row">
                                                    <Clock className="ac-detail-icon" size={14} />
                                                    <span>{booking.time}</span>
                                                </div>
                                                <div className="ac-booking-detail-row">
                                                    <Calendar className="ac-detail-icon" size={14} />
                                                    <span>{booking.packName}</span>
                                                </div>
                                                <div className="ac-booking-detail-row">
                                                    <MapPin className="ac-detail-icon" size={14} />
                                                    <span>{booking.wilaya} - {booking.addressDetails}</span>
                                                </div>
                                                {booking.salleName && (
                                                    <div className="ac-booking-detail-row">
                                                        <Users className="ac-detail-icon" size={14} />
                                                        <span>{booking.salleName}</span>
                                                    </div>
                                                )}
                                                {booking.totalPrice && (
                                                    <div className="ac-booking-detail-row">
                                                        <span className="ac-price-label">Total: DZD {booking.totalPrice.toLocaleString()}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="ac-modal-footer">
                            <button onClick={() => setShowDayModal(false)} className="ac-modal-close-btn">
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AvailabilityCalendar;