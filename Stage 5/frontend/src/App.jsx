import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LoginPage from './LoginPage';
import AdminDashboard from './admin/AdminDashboard';
import CustomerDashboard from './CustomerDashboard';
import StoreDashboard from './StoreDashboard';
import DriverDashboard from './DriverDashboard';




function App() {
  return (
    <BrowserRouter>
      <div className="font-sans">
        <Routes>
          {/* Route par défaut (la racine) = La page de connexion */}
          <Route path="/" element={<LoginPage />} />

          {/* L'espace administrateur */}
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/customer" element={<CustomerDashboard />} />
          <Route path="/driver" element={<DriverDashboard />} />

          <Route path="/store" element={<StoreDashboard />} />


        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;