import { useState } from 'react'
// import './App.css'
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing';
import RoleSelectionPage from './pages/Role-selection'
import { AuthProvider } from './pages/AuthContext';
import Login from './pages/LoginPage';
import ShowForm from './pages/ShowForm';
import PendingApproval from './pages/PendingApproval';
import AdminDashboard from './pages/AdminDashboard';
import Layout from './Layout';
import ManufacturerDashboard from './pages/ManufacturerDashboard'
import DistributorDashboard from './pages/DistributorDashboard.jsx'
import WholesalerDashboard from './pages/WholesalerDashboard.jsx';
import RetailerDashboard from './pages/RetailerDashboard.jsx';
import PharmacyDashboard from './pages/PharmacyDashboard.jsx';
import PublicDrugDashboard from './pages/PublicDrugDashboard.jsx';
import DrugVerificationGlobal from './pages/DrugVerificationGlobal.jsx';
import ReportCounterfeit from './pages/Report.jsx';

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
          <Route path="/verify-drug" element={<DrugVerificationGlobal/>}/>

          </Route>
          <Route path="/manufacturer/dashboard" element={<ManufacturerDashboard />} />
          <Route path="/distributor/dashboard" element={<DistributorDashboard/>}/>
          <Route path="/wholesaler/dashboard" element={<WholesalerDashboard/>}/>
          <Route path="/retailer/dashboard" element={<RetailerDashboard/>}/>
          <Route path="/pharmacy/dashboard" element={<PharmacyDashboard/>}/>
          <Route path="/public/dashboard" element={<PublicDrugDashboard/>}/>
          <Route path="/report-counterfeit" element={<ReportCounterfeit/>}/>
        </Routes>
     
      </AuthProvider>
    </Router>
  )
}

export default App