import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Calendar, Camera, Menu, X, Bell, TrendingUp, BarChart3, Clock, CheckCircle, AlertCircle, XCircle, LogOut, DollarSign, TrendingDown, Image } from 'lucide-react';
import { collection, onSnapshot, query, where, orderBy } from 'firebase/firestore';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { auth, db } from './firebaseConfig';
import { getDocs } from "firebase/firestore";
import logo from './logo.jpg';
import { Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import BookingsManagement from './BookingsManagement';
import ServicesManagement from './ServicesManagement';
import MediaManagement from './MediaManagement';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [activeTab, setActiveTab] = useState('vue-generale');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [dashboardStats, setDashboardStats] = useState({
    totalBookings: 0,
    pendingBookings: 0,
    confirmedBookings: 0,
    inProgressBookings: 0,
    completedBookings: 0,
    cancelledBookings: 0,
    totalRevenue: 0,
    monthlyRevenue: 0,
    monthlyPending: 0,
    recentBookings: [],
    monthlyData: [],
    statusData: [],
    paymentData: [],
    monthlyAnalytics: []
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

        const unsubscribe = onSnapshot(bookingsQuery, async (snapshot) => {
          const bookings = await Promise.all(snapshot.docs.map(async (docSnapshot) => {
            const bookingData = {
              id: docSnapshot.id,
              ...docSnapshot.data(),
              createdAt: docSnapshot.data().createdAt?.toDate?.() || new Date(docSnapshot.data().createdAt),
              updatedAt: docSnapshot.data().updatedAt?.toDate?.() || new Date(docSnapshot.data().updatedAt)
            };

            // Load payments for each booking
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
          
          const currentMonth = new Date().getMonth();
          const currentYear = new Date().getFullYear();
          
          // Generate monthly data for the last 12 months
          const monthlyData = [];
          const monthlyAnalytics = [];
          
          for (let i = 11; i >= 0; i--) {
            const month = new Date(currentYear, currentMonth - i, 1);
            const monthBookings = bookings.filter(b => {
              const bookingDate = b.createdAt;
              return bookingDate.getMonth() === month.getMonth() && 
                     bookingDate.getFullYear() === month.getFullYear();
            });
            
            const monthRevenue = monthBookings.reduce((sum, b) => sum + (b.totalPaid || 0), 0);
            const monthPending = monthBookings.reduce((sum, b) => sum + (b.remainingAmount || 0), 0);
            const monthTotal = monthBookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0);
            
            monthlyData.push({
              month: month.toLocaleDateString('en-US', { month: 'short' }),
              bookings: monthBookings.length,
              revenue: monthRevenue,
              pending: monthPending
            });

            monthlyAnalytics.push({
              month: month.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }),
              totalBookings: monthBookings.length,
              totalValue: monthTotal,
              paidAmount: monthRevenue,
              pendingAmount: monthPending,
              completionRate: monthTotal > 0 ? ((monthRevenue / monthTotal) * 100).toFixed(1) : 0
            });
          }

          // Count status for updated status system
          const statusCounts = { 
            'Requested': 0, 
            'confirmed': 0, 
            'in-progress': 0, 
            'completed': 0, 
            'cancelled': 0 
          };
          
          bookings.forEach(booking => {
            if (statusCounts[booking.status] !== undefined) {
              statusCounts[booking.status]++;
            }
          });

          const statusData = [
            { name: 'Requested', value: statusCounts['Requested'], color: '#f59e0b' },
            { name: 'Confirmé', value: statusCounts.confirmed, color: '#3b82f6' },
            { name: 'En Cours', value: statusCounts['in-progress'], color: '#8b5cf6' },
            { name: 'Terminé', value: statusCounts.completed, color: '#10b981' },
            { name: 'Annulé', value: statusCounts.cancelled, color: '#ef4444' }
          ];

          // Payment status data
          const paymentCounts = { paid: 0, partial: 0, unpaid: 0 };
          bookings.forEach(booking => {
            if (paymentCounts[booking.paymentStatus] !== undefined) {
              paymentCounts[booking.paymentStatus]++;
            }
          });

          const paymentData = [
            { name: 'Payé', value: paymentCounts.paid, color: '#10b981' },
            { name: 'Partiel', value: paymentCounts.partial, color: '#f59e0b' },
            { name: 'Non Payé', value: paymentCounts.unpaid, color: '#ef4444' }
          ];

          // Current month stats
          const currentMonthBookings = bookings.filter(b => {
            const bookingDate = b.createdAt;
            return bookingDate.getMonth() === currentMonth && 
                   bookingDate.getFullYear() === currentYear;
          });

          const monthlyRevenue = currentMonthBookings.reduce((sum, b) => sum + (b.totalPaid || 0), 0);
          const monthlyPending = currentMonthBookings.reduce((sum, b) => sum + (b.remainingAmount || 0), 0);
          
          const stats = {
            totalBookings: bookings.length,
            pendingBookings: statusCounts['Requested'],
            confirmedBookings: statusCounts.confirmed,
            inProgressBookings: statusCounts['in-progress'],
            completedBookings: statusCounts.completed,
            cancelledBookings: statusCounts.cancelled,
            totalRevenue: bookings.reduce((sum, b) => sum + (b.totalPaid || 0), 0),
            monthlyRevenue: monthlyRevenue,
            monthlyPending: monthlyPending,
            recentBookings: bookings.slice(0, 5),
            monthlyData,
            statusData,
            paymentData,
            monthlyAnalytics: monthlyAnalytics.slice(-6) // Last 6 months for detailed view
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
      alert('Échec de la connexion. Vérifiez vos identifiants.');
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
    { id: 'vue-generale', label: 'Vue Générale', icon: LayoutDashboard },
    { id: 'gestion-reservations', label: 'Gestion Réservations', icon: Calendar },
    { id: 'services-tarifs', label: 'Services & Tarifs', icon: Camera },
    { id: 'gestion-media', label: 'Gestion Médias', icon: Image },
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'Requested': return '#f59e0b';
      case 'confirmed': return '#3b82f6';
      case 'in-progress': return '#8b5cf6';
      case 'completed': return '#10b981';
      case 'cancelled': return '#ef4444';
      default: return '#64748b';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'confirmed': return <CheckCircle className="mn-dash-status-icon" />;
      case 'Requested': return <AlertCircle className="mn-dash-status-icon" />;
      case 'cancelled': return <XCircle className="mn-dash-status-icon" />;
      case 'completed': return <CheckCircle className="mn-dash-status-icon" />;
      case 'in-progress': return <Clock className="mn-dash-status-icon" />;
      default: return <Clock className="mn-dash-status-icon" />;
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'Requested': return 'Requested';
      case 'confirmed': return 'Confirmé';
      case 'in-progress': return 'En Cours';
      case 'completed': return 'Terminé';
      case 'cancelled': return 'Annulé';
      default: return status;
    }
  };

  // Login form
  if (loading) {
    return (
      <div className="mn-dash-auth-container">
        <div className="mn-dash-auth-loading">
          <div className="mn-dash-loading-spinner"></div>
          <p>Chargement...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mn-dash-auth-container">
        <div className="mn-dash-auth-card">
          <div className="mn-dash-auth-header">
              <img src={logo} alt="mn-photo" style={{width:'80px',borderRadius:"40%"}} />
            <h1>Nihal's pictures Admin</h1>
            <p>Connectez-vous pour accéder au tableau de bord</p>
          </div>
          
          <form onSubmit={handleLogin} className="mn-dash-auth-form">
            <div className="mn-dash-form-group">
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
            
            <div className="mn-dash-form-group">
              <label htmlFor="password">Mot de passe</label>
              <input
                id="password"
                type="password"
                value={loginData.password}
                onChange={(e) => setLoginData({...loginData, password: e.target.value})}
                placeholder="Entrez votre mot de passe"
                required
              />
            </div>
            
            <button type="submit" disabled={authLoading} className="mn-dash-auth-button">
              {authLoading ? 'Connexion...' : 'Se Connecter'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'gestion-reservations': return <BookingsManagement />;
      case 'services-tarifs': return <ServicesManagement />;
      case 'gestion-media': return <MediaManagement />;
      default:
        return (
          <div className="mn-dash-content">
            <div className="mn-dash-header">
              <div>
                <h1 className="mn-dash-title">Tableau de Bord - Vue Générale</h1>
                <p className="mn-dash-subtitle">Bienvenue ! Voici un aperçu de votre activité photographique.</p>
              </div>
              <div className="mn-dash-header-actions">
                <div className="mn-dash-notifications">
                  <Bell className="mn-dash-notification-icon" />
                  {dashboardStats.pendingBookings > 0 && (
                    <span className="mn-dash-notification-badge">{dashboardStats.pendingBookings}</span>
                  )}
                </div>
                
                <button onClick={handleLogout} className="mn-dash-logout-button">
                  <LogOut className="mn-dash-logout-icon" />
                  <span>Déconnexion</span>
                </button>
              </div>
            </div>

            <div className="mn-dash-stats-grid">
              <div className="mn-dash-stat-card">
                <div className="mn-dash-stat-header">
                  <div className="mn-dash-stat-content">
                    <p className="mn-dash-stat-label">Total Réservations</p>
                    <p className="mn-dash-stat-value">{dashboardStats.totalBookings}</p>
                  </div>
                  <div className="mn-dash-stat-icon mn-dash-bg-blue">
                    <Calendar className="mn-dash-icon-blue" />
                  </div>
                </div>
                <p className="mn-dash-stat-description">Toutes les réservations</p>
              </div>

              <div className="mn-dash-stat-card">
                <div className="mn-dash-stat-header">
                  <div className="mn-dash-stat-content">
                    <p className="mn-dash-stat-label">Requested</p>
                    <p className="mn-dash-stat-value mn-dash-text-yellow">{dashboardStats.pendingBookings}</p>
                  </div>
                  <div className="mn-dash-stat-icon mn-dash-bg-yellow">
                    <AlertCircle className="mn-dash-icon-yellow" />
                  </div>
                </div>
                <p className="mn-dash-stat-description">À confirmer</p>
              </div>

              <div className="mn-dash-stat-card">
                <div className="mn-dash-stat-header">
                  <div className="mn-dash-stat-content">
                    <p className="mn-dash-stat-label">Terminées</p>
                    <p className="mn-dash-stat-value mn-dash-text-green">{dashboardStats.completedBookings}</p>
                  </div>
                  <div className="mn-dash-stat-icon mn-dash-bg-green">
                    <CheckCircle className="mn-dash-icon-green" />
                  </div>
                </div>
                <p className="mn-dash-stat-description">Sessions terminées</p>
              </div>

              <div className="mn-dash-stat-card">
                <div className="mn-dash-stat-header">
                  <div className="mn-dash-stat-content">
                    <p className="mn-dash-stat-label">Revenus Ce Mois</p>
                    <p className="mn-dash-stat-value mn-dash-text-green">DZD {dashboardStats.monthlyRevenue.toLocaleString()}</p>
                  </div>
                  <div className="mn-dash-stat-icon mn-dash-bg-green">
                    <DollarSign className="mn-dash-icon-green" />
                  </div>
                </div>
                <p className="mn-dash-stat-description">Montant encaissé</p>
              </div>

              <div className="mn-dash-stat-card">
                <div className="mn-dash-stat-header">
                  <div className="mn-dash-stat-content">
                    <p className="mn-dash-stat-label">À Encaisser Ce Mois</p>
                    <p className="mn-dash-stat-value mn-dash-text-red">DZD {dashboardStats.monthlyPending.toLocaleString()}</p>
                  </div>
                  <div className="mn-dash-stat-icon mn-dash-bg-red">
                    <TrendingDown className="mn-dash-icon-red" />
                  </div>
                </div>
                <p className="mn-dash-stat-description">Montant Requested</p>
              </div>

              <div className="mn-dash-stat-card">
                <div className="mn-dash-stat-header">
                  <div className="mn-dash-stat-content">
                    <p className="mn-dash-stat-label">Revenus Totaux</p>
                    <p className="mn-dash-stat-value mn-dash-text-green">DZD {dashboardStats.totalRevenue.toLocaleString()}</p>
                  </div>
                  <div className="mn-dash-stat-icon mn-dash-bg-green">
                    <TrendingUp className="mn-dash-icon-green" />
                  </div>
                </div>
                <p className="mn-dash-stat-description">Revenus totaux encaissés</p>
              </div>
            </div>

            <div className="mn-dash-charts-grid">
              <div className="mn-dash-chart-card">
                <div className="mn-dash-chart-header">
                  <h3 className="mn-dash-chart-title">Évolution Mensuelle - Réservations & Revenus</h3>
                  <BarChart3 className="mn-dash-chart-icon" />
                </div>
                <div className="mn-dash-chart-container">
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
                        <linearGradient id="colorPending" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
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
                        dataKey="revenue"
                        stackId="1"
                        stroke="#10b981"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorRevenue)"
                        name="Revenus Encaissés (DZD)"
                      />
                      <Area
                        type="monotone"
                        dataKey="pending"
                        stackId="2"
                        stroke="#f59e0b"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorPending)"
                        name="À Encaisser (DZD)"
                      />
                      <Line
                        type="monotone"
                        dataKey="bookings"
                        stroke="#3b82f6"
                        strokeWidth={3}
                        name="Réservations"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="mn-dash-chart-card">
                <div className="mn-dash-chart-header">
                  <h3 className="mn-dash-chart-title">Répartition des Statuts</h3>
                  <TrendingUp className="mn-dash-chart-icon" />
                </div>
                <div className="mn-dash-chart-container">
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
                  <div className="mn-dash-pie-legend">
                    {dashboardStats.statusData.map((entry, index) => (
                      <div key={index} className="mn-dash-legend-item">
                        <div className="mn-dash-legend-color" style={{ backgroundColor: entry.color }}></div>
                        <span className="mn-dash-legend-text">{entry.name}: {entry.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Monthly Analytics Section */}
            <div className="mn-dash-monthly-analytics">
              <div className="mn-dash-analytics-header">
                <h3 className="mn-dash-analytics-title">Analyse Mensuelle Détaillée</h3>
              </div>
              <div className="mn-dash-analytics-grid">
                {dashboardStats.monthlyAnalytics.map((month, index) => (
                  <div key={index} className="mn-dash-analytics-card">
                    <div className="mn-dash-analytics-month">{month.month}</div>
                    <div className="mn-dash-analytics-stats">
                      <div className="mn-dash-analytics-row">
                        <span className="mn-dash-analytics-label">Réservations:</span>
                        <span className="mn-dash-analytics-value">{month.totalBookings}</span>
                      </div>
                      <div className="mn-dash-analytics-row">
                        <span className="mn-dash-analytics-label">Valeur totale:</span>
                        <span className="mn-dash-analytics-value">DZD {month.totalValue.toLocaleString()}</span>
                      </div>
                      <div className="mn-dash-analytics-row">
                        <span className="mn-dash-analytics-label">Encaissé:</span>
                        <span className="mn-dash-analytics-value mn-dash-text-green">DZD {month.paidAmount.toLocaleString()}</span>
                      </div>
                      <div className="mn-dash-analytics-row">
                        <span className="mn-dash-analytics-label">Requested:</span>
                        <span className="mn-dash-analytics-value mn-dash-text-red">DZD {month.pendingAmount.toLocaleString()}</span>
                      </div>
                      <div className="mn-dash-analytics-row">
                        <span className="mn-dash-analytics-label">Taux encaissement:</span>
                        <span className="mn-dash-analytics-value">{month.completionRate}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mn-dash-recent-bookings">
              <div className="mn-dash-bookings-header">
                <h3 className="mn-dash-bookings-title">Réservations Récentes</h3>
              </div>
              <div className="mn-dash-bookings-list">
                {dashboardStats.recentBookings.length === 0 ? (
                  <div className="mn-dash-empty-state">Aucune réservation</div>
                ) : (
                  dashboardStats.recentBookings.map((booking) => (
                    <div key={booking.id} className="mn-dash-booking-item">
                      <div className="mn-dash-booking-content">
                        <div className="mn-dash-booking-avatar">
                          <div className="mn-dash-avatar-icon">
                            <Camera className="mn-dash-icon-blue" />
                          </div>
                        </div>
                        <div className="mn-dash-booking-details">
                          <h4 className="mn-dash-booking-name">{booking.firstName} {booking.lastName}</h4>
                          <p className="mn-dash-booking-service">{booking.packName}</p>
                          <p className="mn-dash-booking-time">{new Date(booking.date).toLocaleDateString()} à {booking.time}</p>
                        </div>
                      </div>
                      <div className="mn-dash-booking-meta">
                        <span className="mn-dash-booking-price">DZD {booking.totalPrice?.toLocaleString() || 'Non défini'}</span>
                        <span
                          className="mn-dash-status-badge"
                          style={{ backgroundColor: getStatusColor(booking.status), color: 'white' }}
                        >
                          {getStatusIcon(booking.status)}
                          <span className="mn-dash-status-text">{getStatusLabel(booking.status)}</span>
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="mn-dash-quick-actions">
              <h3 className="mn-dash-actions-title">Actions Rapides</h3>
              <div className="mn-dash-actions-grid">
                <button onClick={() => setActiveTab('gestion-reservations')} className="mn-dash-action-button">
                  <Calendar className="mn-dash-action-icon mn-dash-icon-blue" />
                  <div className="mn-dash-action-content">
                    <p className="mn-dash-action-title">Gérer les Réservations</p>
                    <p className="mn-dash-action-description">Voir et mettre à jour les réservations</p>
                  </div>
                </button>
                <button onClick={() => setActiveTab('services-tarifs')} className="mn-dash-action-button">
                  <Camera className="mn-dash-action-icon mn-dash-icon-green" />
                  <div className="mn-dash-action-content">
                    <p className="mn-dash-action-title">Services & Tarifs</p>
                    <p className="mn-dash-action-description">Modifier les tarifs et services</p>
                  </div>
                </button>
                <button onClick={() => setActiveTab('gestion-media')} className="mn-dash-action-button">
                  <Image className="mn-dash-action-icon mn-dash-icon-purple" />
                  <div className="mn-dash-action-content">
                    <p className="mn-dash-action-title">Gestion Médias</p>
                    <p className="mn-dash-action-description">Gérer les images et vidéos du carousel</p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="mn-dash-admin-container">
      <button onClick={() => setSidebarOpen(!sidebarOpen)} className="mn-dash-sidebar-toggle">
        {sidebarOpen ? <X className="mn-dash-toggle-icon" /> : <Menu className="mn-dash-toggle-icon" />}
      </button>
      
      <div 
        className={`mn-dash-sidebar ${sidebarOpen ? 'mn-dash-sidebar-open' : 'mn-dash-sidebar-collapsed'}`}
        onMouseEnter={() => !isMobile && setSidebarOpen(true)}
        onMouseLeave={() => !isMobile && setSidebarOpen(false)}
      >
        <div className="mn-dash-sidebar-header">
          {sidebarOpen && (
            <div className="mn-dash-brand">
              <img src={logo} alt="mn-photo" style={{width:'80px',borderRadius:"40%"}} />
              <span className="mn-dash-brand-name">MN-PHOTO</span>
            </div>
          )}
          {isMobile && (
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="mn-dash-sidebar-toggle">
              {sidebarOpen ? <X className="mn-dash-toggle-icon" /> : <Menu className="mn-dash-toggle-icon" />}
            </button>
          )}
        </div>

        <nav className="mn-dash-sidebar-nav">
          {sidebarItems.map((item) => {
            const IconComponent = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`mn-dash-nav-item ${activeTab === item.id ? 'mn-dash-nav-item-active' : ''}`}
                title={!sidebarOpen ? item.label : ''}
              >
                <IconComponent className="mn-dash-nav-icon" />
                {sidebarOpen && <span className="mn-dash-nav-label">{item.label}</span>}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="mn-dash-main-content">
        <div className="mn-dash-content-wrapper">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;