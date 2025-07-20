import { useState } from 'react'
import './App.css'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Landing from './pages/landing';
import RoleSelectionPage from './pages/Role-selection'
import { AuthProvider } from './pages/AuthContext';
import Login from './pages/LoginPage';
import ShowForm from './pages/ShowForm';
import PendingApproval from './pages/PendingApproval';
import AdminDashboard from './pages/AdminDashboard';
import Layout from './Layout';
import ManufacturerDashboard from './pages/ManufacturerDashboard'
function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route element={<Layout/>}>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/select-role" element={<RoleSelectionPage />} />
          <Route path="/register/:role" element={<ShowForm />} />
          <Route path="/pending-approval" element={<PendingApproval />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          </Route>
          <Route path="/manufacturer/dashboard" element={<ManufacturerDashboard />} />
        </Routes>
     
      </AuthProvider>
    </Router>
  )
}

export default App