import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

// Import components
import PhotographyBookingSystem from './PhotographyBookingSystem';
import AdminDashboard from './AdminDashboard';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<PhotographyBookingSystem />} />

          {/* Redirect /home to main page */}
          <Route path="/home" element={<Navigate to="/" replace />} />

          {/* Admin Routes (commented for now) */}
          <Route path="/admin" element={<AdminDashboard />} />


          {/* Catch-all route - redirect to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
