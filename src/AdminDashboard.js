import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Calendar, Camera, Users, Settings, Menu, X, Bell, TrendingUp, BarChart3, Clock, CheckCircle, AlertCircle, XCircle, LogOut } from 'lucide-react';
import { collection, onSnapshot, query, where, orderBy } from 'firebase/firestore';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { auth, db } from './firebaseConfig';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import BookingsManagement from './BookingsManagement';
import ServicesManagement from './ServicesManagement';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [dashboardStats, setDashboardStats] = useState({
    totalBookings: 0,
    pendingBookings: 0,
    confirmedBookings: 0,
    totalRevenue: 0,
    monthlyRevenue: 0,
    recentBookings: [],
    monthlyData: [],
    statusData: []
  });

  // Check screen size
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) {
        setSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Load dashboard stats
  useEffect(() => {
    if (!user) return;

    const loadDashboardStats = () => {
      try {
        const bookingsRef = collection(db, 'bookings');
        const bookingsQuery = query(bookingsRef, orderBy('createdAt', 'desc'));

        const unsubscribe = onSnapshot(bookingsQuery, (snapshot) => {
          const bookings = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          
          const currentMonth = new Date().getMonth();
          const currentYear = new Date().getFullYear();
          
          // Generate monthly data for the last 6 months
          const monthlyData = [];
          const statusCounts = { booked: 0, pending: 0, cancelled: 0 };
          
          for (let i = 5; i >= 0; i--) {
            const month = new Date(currentYear, currentMonth - i, 1);
            const monthBookings = bookings.filter(b => {
              const bookingDate = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
              return bookingDate.getMonth() === month.getMonth() && 
                     bookingDate.getFullYear() === month.getFullYear();
            });
            
            monthlyData.push({
              month: month.toLocaleDateString('en-US', { month: 'short' }),
              bookings: monthBookings.length,
              revenue: monthBookings.filter(b => b.status === 'booked').reduce((sum, b) => sum + (b.servicePrice || 0), 0)
            });
          }

          // Count status for pie chart
          bookings.forEach(booking => {
            if (statusCounts[booking.status] !== undefined) {
              statusCounts[booking.status]++;
            }
          });

          const statusData = [
            { name: 'booked', value: statusCounts.booked, color: '#10b981' },
            { name: 'Pending', value: statusCounts.pending, color: '#f59e0b' },
            { name: 'Cancelled', value: statusCounts.cancelled, color: '#ef4444' }
          ];
          
          const stats = {
            totalBookings: bookings.length,
            pendingBookings: bookings.filter(b => b.status === 'pending').length,
            confirmedBookings: bookings.filter(b => b.status === 'booked').length,
            totalRevenue: bookings.filter(b => b.status === 'booked').reduce((sum, b) => sum + (b.servicePrice || 0), 0),
            monthlyRevenue: bookings.filter(b => {
              const bookingDate = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
              return bookingDate.getMonth() === currentMonth && 
                     bookingDate.getFullYear() === currentYear &&
                     b.status === 'booked';
            }).reduce((sum, b) => sum + (b.servicePrice || 0), 0),
            recentBookings: bookings.slice(0, 5),
            monthlyData,
            statusData
          };

          setDashboardStats(stats);
        });

        return unsubscribe;
      } catch (error) {
        console.error('Error loading dashboard stats:', error);
      }
    };

    const unsubscribe = loadDashboardStats();
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [user]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthLoading(true);
    
    try {
      await signInWithEmailAndPassword(auth, loginData.email, loginData.password);
    } catch (error) {
      console.error('Login error:', error);
      alert('Login failed. Please check your credentials.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const sidebarItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'bookings', label: 'Bookings', icon: Calendar },
    { id: 'services', label: 'Services', icon: Camera },
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return 'status-confirmed';
      case 'pending': return 'status-pending';
      case 'cancelled': return 'status-cancelled';
      default: return 'status-default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'confirmed': return <CheckCircle className="status-icon" />;
      case 'pending': return <AlertCircle className="status-icon" />;
      case 'cancelled': return <XCircle className="status-icon" />;
      default: return <Clock className="status-icon" />;
    }
  };

  // Login form
  if (loading) {
    return (
      <div className="auth-container">
        <div className="auth-loading">
          <div className="loading-spinner"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <Camera className="auth-icon" />
            <h1>MN-PHOTO Admin</h1>
            <p>Sign in to access the dashboard</p>
          </div>
          
          <form onSubmit={handleLogin} className="auth-form">
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                value={loginData.email}
                onChange={(e) => setLoginData({...loginData, email: e.target.value})}
                placeholder="admin@mnphoto.com"
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                value={loginData.password}
                onChange={(e) => setLoginData({...loginData, password: e.target.value})}
                placeholder="Enter your password"
                required
              />
            </div>
            
            <button type="submit" disabled={authLoading} className="auth-button">
              {authLoading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'bookings': return <BookingsManagement />;
      case 'services': return <ServicesManagement />;
      default:
        return (
          <div className="dashboard-content">
            <div className="dashboard-header">
              <div>
                
                <h1 className="dashboard-title">Dashboard Overview</h1>
                <p className="dashboard-subtitle">Welcome back! Here's what's happening with your photography business.</p>
              </div>
              <div className="header-actions">
                <div className="notifications">
                  <Bell className="notification-icon" />
                  {dashboardStats.pendingBookings > 0 && (
                    <span className="notification-badge">{dashboardStats.pendingBookings}</span>
                  )}
                </div>
                
                <button onClick={handleLogout} className="logout-button">
                  <LogOut className="logout-icon" />
                  <span>Logout</span>
                </button>
              </div>
            </div>

            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-header">
                  <div className="stat-content">
                    <p className="stat-label">Total Bookings</p>
                    <p className="stat-value">{dashboardStats.totalBookings}</p>
                  </div>
                  <div className="stat-icon bg-blue">
                    <Calendar className="icon-blue" />
                  </div>
                </div>
                <p className="stat-description">All time bookings</p>
              </div>

              <div className="stat-card">
                <div className="stat-header">
                  <div className="stat-content">
                    <p className="stat-label">Pending</p>
                    <p className="stat-value text-yellow">{dashboardStats.pendingBookings}</p>
                  </div>
                  <div className="stat-icon bg-yellow">
                    <AlertCircle className="icon-yellow" />
                  </div>
                </div>
                <p className="stat-description">Awaiting confirmation</p>
              </div>

              <div className="stat-card">
                <div className="stat-header">
                  <div className="stat-content">
                    <p className="stat-label">Confirmed</p>
                    <p className="stat-value text-green">{dashboardStats.confirmedBookings}</p>
                  </div>
                  <div className="stat-icon bg-green">
                    <CheckCircle className="icon-green" />
                  </div>
                </div>
                <p className="stat-description">Ready to shoot</p>
              </div>

              <div className="stat-card">
                <div className="stat-header">
                  <div className="stat-content">
                    <p className="stat-label">Monthly Revenue</p>
                    <p className="stat-value text-green">DZD {dashboardStats.monthlyRevenue.toLocaleString()}</p>
                  </div>
                  <div className="stat-icon bg-green">
                    <TrendingUp className="icon-green" />
                  </div>
                </div>
                <p className="stat-description">This month's earnings</p>
              </div>
            </div>

            <div className="charts-grid">
              <div className="chart-card">
                <div className="chart-header">
                  <h3 className="chart-title">Bookings & Revenue Trend</h3>
                  <BarChart3 className="chart-icon" />
                </div>
                <div className="chart-container">
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={dashboardStats.monthlyData}>
                      <defs>
                        <linearGradient id="colorBookings" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
                      <YAxis stroke="#64748b" fontSize={12} />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: '#ffffff',
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="bookings"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorBookings)"
                        name="Bookings"
                      />
                      <Line
                        type="monotone"
                        dataKey="revenue"
                        stroke="#10b981"
                        strokeWidth={2}
                        name="Revenue (DZD)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="chart-card">
                <div className="chart-header">
                  <h3 className="chart-title">Booking Status Distribution</h3>
                  <TrendingUp className="chart-icon" />
                </div>
                <div className="chart-container">
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={dashboardStats.statusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {dashboardStats.statusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: '#ffffff',
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="pie-legend">
                    {dashboardStats.statusData.map((entry, index) => (
                      <div key={index} className="legend-item">
                        <div className="legend-color" style={{ backgroundColor: entry.color }}></div>
                        <span className="legend-text">{entry.name}: {entry.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="recent-bookings">
              <div className="bookings-header">
                <h3 className="bookings-title">Recent Bookings</h3>
              </div>
              <div className="bookings-list">
                {dashboardStats.recentBookings.length === 0 ? (
                  <div className="empty-state">No bookings yet</div>
                ) : (
                  dashboardStats.recentBookings.map((booking) => (
                    <div key={booking.id} className="booking-item">
                      <div className="booking-content">
                        <div className="booking-avatar">
                          <div className="avatar-icon">
                            <Camera className="icon-blue" />
                          </div>
                        </div>
                        <div className="booking-details">
                          <h4 className="booking-name">{booking.fullName}</h4>
                          <p className="booking-service">{booking.serviceName}</p>
                          <p className="booking-time">{booking.date} at {booking.timeSlot}</p>
                        </div>
                      </div>
                      <div className="booking-meta">
                        <span className="booking-price">DZD {booking.servicePrice?.toLocaleString()}</span>
                        <span className={`status-badge ${getStatusColor(booking.status)}`}>
                          {getStatusIcon(booking.status)}
                          <span className="status-text">{booking.status}</span>
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="quick-actions">
              <h3 className="actions-title">Quick Actions</h3>
              <div className="actions-grid">
                <button onClick={() => setActiveTab('bookings')} className="action-button">
                  <Calendar className="action-icon icon-blue" />
                  <div className="action-content">
                    <p className="action-title">Manage Bookings</p>
                    <p className="action-description">View and update bookings</p>
                  </div>
                </button>
                <button onClick={() => setActiveTab('services')} className="action-button">
                  <Camera className="action-icon icon-green" />
                  <div className="action-content">
                    <p className="action-title">Service Packages</p>
                    <p className="action-description">Edit pricing and services</p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="admin-container">
        { (
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="sidebar-toggle">
              {sidebarOpen ? <X className="toggle-icon" /> : <Menu className="toggle-icon" />}
            </button>
          )}
      <div 
        className={`sidebar ${sidebarOpen ? 'sidebar-open' : 'sidebar-collapsed'}`}
        onMouseEnter={() => !isMobile && setSidebarOpen(true)}
        onMouseLeave={() => !isMobile && setSidebarOpen(false)}
      >
        <div className="sidebar-header">
          {sidebarOpen && (
            <div className="brand">
              <Camera className="brand-icon" />
              <span className="brand-name">MN-PHOTO</span>
            </div>
          )}
          {isMobile && (
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="sidebar-toggle">
              {sidebarOpen ? <X className="toggle-icon" /> : <Menu className="toggle-icon" />}
            </button>
          )}
        </div>

        <nav className="sidebar-nav">
          {sidebarItems.map((item) => {
            const IconComponent = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`nav-item ${activeTab === item.id ? 'nav-item-active' : ''}`}
                title={!sidebarOpen ? item.label : ''}
              >
                <IconComponent className="nav-icon" />
                {sidebarOpen && <span className="nav-label">{item.label}</span>}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="main-content">
        <div className="content-wrapper">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;