import React, { useState, useEffect } from 'react';
import { Save, Plus, Trash2, Edit3, TrendingUp, Users, Camera, Heart, AlertCircle, CheckCircle } from 'lucide-react';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from './firebaseConfig';

const StatsManagement = () => {
  const [stats, setStats] = useState([
    { id: 'clients', label: 'Clients Satisfaits', value: 500, suffix: '+', icon: 'users' },
    { id: 'weddings', label: 'Mariages Immortalisés', value: 50, suffix: '+', icon: 'heart' },
    { id: 'photos', label: 'Photos Professionnelles', value: 1000, suffix: '+', icon: 'camera' }
  ]);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [editingIndex, setEditingIndex] = useState(-1);

  // Icon mapping
  const iconMap = {
    users: Users,
    heart: Heart,
    camera: Camera,
    trending: TrendingUp
  };

  // Load stats from Firebase
  useEffect(() => {
    const loadStats = () => {
      try {
        const statsDoc = doc(db, 'siteSettings', 'heroStats');
        
        const unsubscribe = onSnapshot(statsDoc, (doc) => {
          if (doc.exists()) {
            const data = doc.data();
            if (data.stats && Array.isArray(data.stats)) {
              setStats(data.stats);
            }
          }
          setLoading(false);
        }, (error) => {
          console.error('Error loading stats:', error);
          setLoading(false);
          showMessage('error', 'Erreur lors du chargement des statistiques');
        });

        return unsubscribe;
      } catch (error) {
        console.error('Error setting up stats listener:', error);
        setLoading(false);
        showMessage('error', 'Erreur lors de la configuration du listener');
      }
    };

    const unsubscribe = loadStats();
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const statsDoc = doc(db, 'siteSettings', 'heroStats');
      await setDoc(statsDoc, {
        stats: stats,
        updatedAt: new Date()
      });
      
      showMessage('success', 'Statistiques mises à jour avec succès !');
      setEditingIndex(-1);
    } catch (error) {
      console.error('Error saving stats:', error);
      showMessage('error', 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const handleStatChange = (index, field, value) => {
    const newStats = [...stats];
    if (field === 'value') {
      newStats[index][field] = parseInt(value) || 0;
    } else {
      newStats[index][field] = value;
    }
    setStats(newStats);
  };

  const addNewStat = () => {
    const newStat = {
      id: `stat_${Date.now()}`,
      label: 'Nouvelle Statistique',
      value: 0,
      suffix: '+',
      icon: 'trending'
    };
    setStats([...stats, newStat]);
    setEditingIndex(stats.length);
  };

  const removeStat = (index) => {
    if (stats.length > 1) {
      const newStats = stats.filter((_, i) => i !== index);
      setStats(newStats);
      if (editingIndex === index) {
        setEditingIndex(-1);
      }
    } else {
      showMessage('error', 'Vous devez garder au moins une statistique');
    }
  };

  const getIconComponent = (iconName) => {
    const IconComponent = iconMap[iconName] || TrendingUp;
    return <IconComponent className="stat-icon" />;
  };

  if (loading) {
    return (
      <div className="stats-loading">
        <div className="loading-spinner"></div>
        <p>Chargement des statistiques...</p>
      </div>
    );
  }

  return (
    <div className="stats-management">
      <div className="stats-header">
        <div className="header-content">
          <h1 className="stats-title">Gestion des Statistiques</h1>
          <p className="stats-subtitle">
            Modifiez les statistiques affichées dans la section héro de votre site
          </p>
        </div>
        
        <div className="header-actions">
          <button 
            className="btn-add-stat"
            onClick={addNewStat}
            disabled={stats.length >= 6}
          >
            <Plus className="btn-icon" />
            Ajouter une statistique
          </button>
          
          <button 
            className="btn-save-stats"
            onClick={handleSave}
            disabled={saving}
          >
            <Save className="btn-icon" />
            {saving ? 'Sauvegarde...' : 'Sauvegarder'}
          </button>
        </div>
      </div>

      {message.text && (
        <div className={`message ${message.type}`}>
          {message.type === 'success' ? 
            <CheckCircle className="message-icon" /> : 
            <AlertCircle className="message-icon" />
          }
          {message.text}
        </div>
      )}

      <div className="stats-preview">
        <h3 className="preview-title">Aperçu</h3>
        <div className="preview-stats-grid">
          {stats.map((stat, index) => (
            <div key={stat.id} className="preview-stat-card">
              <div className="preview-stat-icon">
                {getIconComponent(stat.icon)}
              </div>
              <div className="preview-stat-value">
                {stat.value.toLocaleString()}{stat.suffix}
              </div>
              <div className="preview-stat-label">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="stats-editor">
        <h3 className="editor-title">Configuration des Statistiques</h3>
        
        <div className="stats-list">
          {stats.map((stat, index) => (
            <div key={stat.id} className="stat-editor-card">
              <div className="stat-header">
                <div className="stat-info">
                  <div className="stat-icon-preview">
                    {getIconComponent(stat.icon)}
                  </div>
                  <div className="stat-details">
                    <h4>{stat.label}</h4>
                    <span className="stat-value-display">
                      {stat.value.toLocaleString()}{stat.suffix}
                    </span>
                  </div>
                </div>
                
                <div className="stat-actions">
                  <button
                    className="btn-edit"
                    onClick={() => setEditingIndex(editingIndex === index ? -1 : index)}
                  >
                    <Edit3 className="btn-icon" />
                  </button>
                  
                  {stats.length > 1 && (
                    <button
                      className="btn-delete"
                      onClick={() => removeStat(index)}
                    >
                      <Trash2 className="btn-icon" />
                    </button>
                  )}
                </div>
              </div>

              {editingIndex === index && (
                <div className="stat-editor-form">
                  <div className="form-row">
                    <div className="form-group">
                      <label>Libellé</label>
                      <input
                        type="text"
                        value={stat.label}
                        onChange={(e) => handleStatChange(index, 'label', e.target.value)}
                        placeholder="Ex: Clients Satisfaits"
                      />
                    </div>
                    
                    <div className="form-group">
                      <label>Valeur</label>
                      <input
                        type="number"
                        value={stat.value}
                        onChange={(e) => handleStatChange(index, 'value', e.target.value)}
                        min="0"
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Suffixe</label>
                      <select
                        value={stat.suffix}
                        onChange={(e) => handleStatChange(index, 'suffix', e.target.value)}
                      >
                        <option value="+">+</option>
                        <option value="K">K</option>
                        <option value="M">M</option>
                        <option value="%">%</option>
                        <option value="">Aucun</option>
                      </select>
                    </div>
                    
                    <div className="form-group">
                      <label>Icône</label>
                      <select
                        value={stat.icon}
                        onChange={(e) => handleStatChange(index, 'icon', e.target.value)}
                      >
                        <option value="users">👥 Utilisateurs</option>
                        <option value="heart">❤️ Cœur</option>
                        <option value="camera">📸 Caméra</option>
                        <option value="trending">📈 Tendance</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        .stats-management {
          padding: 24px;
          background: #f8fafc;
          min-height: 100vh;
        }

        .stats-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 32px;
          padding-bottom: 24px;
          border-bottom: 1px solid #e2e8f0;
        }

        .header-content h1 {
          font-size: 28px;
          font-weight: 700;
          color: #1e293b;
          margin: 0 0 8px 0;
        }

        .header-content p {
          color: #64748b;
          margin: 0;
        }

        .header-actions {
          display: flex;
          gap: 12px;
        }

        .btn-add-stat, .btn-save-stats {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 20px;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-add-stat {
          background: #f1f5f9;
          color: #475569;
        }

        .btn-add-stat:hover {
          background: #e2e8f0;
        }

        .btn-save-stats {
          background: #3b82f6;
          color: white;
        }

        .btn-save-stats:hover {
          background: #2563eb;
        }

        .btn-save-stats:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .message {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 16px;
          border-radius: 8px;
          margin-bottom: 24px;
        }

        .message.success {
          background: #f0fdf4;
          color: #166534;
          border: 1px solid #bbf7d0;
        }

        .message.error {
          background: #fef2f2;
          color: #dc2626;
          border: 1px solid #fecaca;
        }

        .stats-preview {
          background: white;
          padding: 24px;
          border-radius: 12px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          margin-bottom: 32px;
        }

        .preview-title {
          font-size: 18px;
          font-weight: 600;
          color: #1e293b;
          margin: 0 0 16px 0;
        }

        .preview-stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
        }

        .preview-stat-card {
          background: #f8fafc;
          padding: 20px;
          border-radius: 8px;
          text-align: center;
          border: 2px solid #e2e8f0;
        }

        .preview-stat-icon {
          color: #3b82f6;
          margin-bottom: 12px;
        }

        .preview-stat-value {
          font-size: 28px;
          font-weight: 700;
          color: #1e293b;
          margin-bottom: 4px;
        }

        .preview-stat-label {
          color: #64748b;
          font-size: 14px;
        }

        .stats-editor {
          background: white;
          padding: 24px;
          border-radius: 12px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .editor-title {
          font-size: 18px;
          font-weight: 600;
          color: #1e293b;
          margin: 0 0 20px 0;
        }

        .stat-editor-card {
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          margin-bottom: 16px;
          overflow: hidden;
        }

        .stat-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px;
          background: #f8fafc;
        }

        .stat-info {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .stat-icon-preview {
          color: #3b82f6;
        }

        .stat-details h4 {
          margin: 0 0 4px 0;
          color: #1e293b;
        }

        .stat-value-display {
          color: #64748b;
          font-size: 14px;
        }

        .stat-actions {
          display: flex;
          gap: 8px;
        }

        .btn-edit, .btn-delete {
          padding: 8px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          display: flex;
          align-items: center;
          transition: all 0.2s;
        }

        .btn-edit {
          background: #f1f5f9;
          color: #475569;
        }

        .btn-edit:hover {
          background: #e2e8f0;
        }

        .btn-delete {
          background: #fef2f2;
          color: #dc2626;
        }

        .btn-delete:hover {
          background: #fee2e2;
        }

        .stat-editor-form {
          padding: 16px;
          background: white;
          border-top: 1px solid #e2e8f0;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin-bottom: 16px;
        }

        .form-group label {
          display: block;
          margin-bottom: 4px;
          color: #374151;
          font-weight: 500;
          font-size: 14px;
        }

        .form-group input, .form-group select {
          width: 100%;
          padding: 8px 12px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 14px;
        }

        .form-group input:focus, .form-group select:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .stats-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 48px;
          color: #64748b;
        }

        .loading-spinner {
          width: 32px;
          height: 32px;
          border: 3px solid #e2e8f0;
          border-top: 3px solid #3b82f6;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 16px;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .btn-icon, .stat-icon, .message-icon {
          width: 18px;
          height: 18px;
        }

        @media (max-width: 768px) {
          .stats-header {
            flex-direction: column;
            gap: 16px;
          }

          .header-actions {
            width: 100%;
            justify-content: stretch;
          }

          .btn-add-stat, .btn-save-stats {
            flex: 1;
          }

          .form-row {
            grid-template-columns: 1fr;
          }

          .preview-stats-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default StatsManagement;