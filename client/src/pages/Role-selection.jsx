import React, { useState } from 'react';
import './Role-selection.css';
import { Building2, Truck, Warehouse, Store, Cross, Users, CheckCircle } from 'lucide-react';
import ShowForm from './ShowForm';

export default function RoleSelectionPage({ user, submitRoleRequest }) {
  const [selectedRole, setSelectedRole] = useState('');
  const [showForm, setShowForm] = useState(false);

  const roleOptions = [
    { id: 'manufacturer', title: 'Manufacturer', description: 'Pharmaceutical companies that produce drugs', icon: Building2, color: 'blue', requirements: ['Valid pharmaceutical manufacturing license', 'Company registration documents', 'Quality assurance certifications', 'Authorized to register drugs on blockchain'] },
    { id: 'distributor', title: 'Distributor', description: 'Primary distribution companies in the supply chain', icon: Truck, color: 'green', requirements: ['Valid distribution license', 'Logistics and warehousing capabilities', 'Supply chain management systems', 'Authorized to add supply chain events'] },
    { id: 'wholesaler', title: 'Wholesaler', description: 'Wholesale drug distributors and suppliers', icon: Warehouse, color: 'purple', requirements: ['Valid wholesale license', 'Bulk storage and distribution facilities', 'B2B pharmaceutical operations', 'Authorized to add supply chain events'] },
    { id: 'retailer', title: 'Retailer', description: 'Retail stores and drug outlets', icon: Store, color: 'orange', requirements: ['Valid retail license', 'Consumer-facing drug sales', 'Inventory management systems', 'Authorized to add supply chain events'] },
    { id: 'pharmacy', title: 'Pharmacy', description: 'Licensed pharmacies and healthcare providers', icon: Cross, color: 'red', requirements: ['Valid pharmacy license', 'Licensed pharmacist on staff', 'Prescription dispensing authorization', 'Authorized to add supply chain events'] },
    { id: 'public', title: 'Public User', description: 'General public users who verify drugs', icon: Users, color: 'gray', requirements: ['No special requirements', 'Can verify drug authenticity', 'Can report counterfeit drugs', 'Earn reward points for contributions'] },
    { id: 'admin', title: 'Administrator', description: 'System administrators with full access', icon: Users, color: 'indigo', requirements: ['System administration rights', 'User management capabilities', 'Full blockchain access', 'Platform oversight and analytics'] }
  ];

  const handleRoleSelect = (roleId) => {
    setSelectedRole(roleId);
    if (roleId === 'public') {
      alert("You now have access to drug verification features as a Public User.");
      submitRoleRequest?.({
        role: 'public',
        organization: 'Public User',
        location: 'General Public',
        walletAddress: '',
        justification: 'Public user - immediate access',
        autoApprove: true
      });
    } else {
      setShowForm(true);
    }
  };

  if (showForm) {
    return <ShowForm role={selectedRole} />;
  }

  return (
    <div className="role-selection-page">
      <h1>Select Your Role</h1>
      <p>Welcome, {user?.email || 'User'}</p>
      <div className="role-grid">
        {roleOptions.map(role => {
          const Icon = role.icon;
          return (
            <div key={role.id} className={`role-card ${role.color}`} onClick={() => handleRoleSelect(role.id)}>
              <div className="role-icon"><Icon size={24} /></div>
              <h3>{role.title}</h3>
              <p>{role.description}</p>
              <ul>
                {role.requirements.map((req, i) => (
                  <li key={i}><CheckCircle size={14} className="check-icon" /> {req}</li>
                ))}
              </ul>
              <button>Select {role.title}</button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
