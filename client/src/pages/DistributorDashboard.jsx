import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { Bar, Line, Pie, Doughnut } from 'react-chartjs-2';
import Chart from 'chart.js/auto';
import axios from 'axios';
import './DistributorDashboard.css';
import { 
  FaCheckCircle, FaTimes, FaSearch, FaQrcode, 
  FaBoxes, FaTruck, FaChartLine, FaReceipt, FaSignOutAlt,
  FaStore, FaClinicMedical, FaPills, FaSpinner, FaRoute

} from 'react-icons/fa';
import DrugVerification from './DrugVerification';
import RouteOptimizer from './RouteOptimizer';

function StatusChip({ label, status }) {
  let className = 'status-chip';
  switch (status) {
    case 'in-stock':
    case 'delivered':
      className += ' success';
      break;
    case 'processing':
    case 'in-transit':
      className += ' warning';
      break;
    case 'received':
      className += ' success';
      break;
    case 'recalled':
    case 'cancelled':
      className += ' error';
      break;
    default:
      className += ' info';
  }
  return <span className={className}>{label}</span>;
}

const DistributorDashboard = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('shipments');
  const [shipments, setShipments] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [selectedShipment, setSelectedShipment] = useState(null);
  const [selectedDrugs, setSelectedDrugs] = useState([]);
  const [selectedRecipient, setSelectedRecipient] = useState('');
  const [recipientType, setRecipientType] = useState('retailer');
  const [searchTerm, setSearchTerm] = useState('');
  const [verificationResult, setVerificationResult] = useState(null);
  const [openModal, setOpenModal] = useState(false);
  const [qrInput, setQrInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [retailers, setRetailers] = useState([]);
  const [wholesalers, setWholesalers] = useState([]);
  const [pharmacies, setPharmacies] = useState([]);
  const navigate = useNavigate();

  // Route Optimization
const [showRouteOptimizer, setShowRouteOptimizer] = useState(false);
const [routeDetails, setRouteDetails] = useState({
  origin: null,
  destination: null
});

// Add this function to handle route optimization
const handleOptimizeRoute = async () => {
  if (!selectedRecipient) {
    alert('Please select a recipient first');
    return;
  }

  try {
    const token = localStorage.getItem('token');
    
    // Get distributor location (current user)
    const distributorResponse = await axios.get('http://localhost:5000/api/users/me', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    // Get recipient location
    let recipientResponse;
    switch (recipientType) {
      case 'retailer':
        recipientResponse = await axios.get(`http://localhost:5000/api/users/${selectedRecipient}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        break;
      case 'wholesaler':
        recipientResponse = await axios.get(`http://localhost:5000/api/users/${selectedRecipient}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        break;
      case 'pharmacy':
        recipientResponse = await axios.get(`http://localhost:5000/api/users/${selectedRecipient}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        break;
      default:
        throw new Error('Invalid recipient type');
    }

    const distributor = distributorResponse.data;
    const recipient = recipientResponse.data;
    
    if (!distributor.pincode || !recipient.pincode) {
      alert('Location information not available for one or both parties');
      return;
    }

    // Construct address strings for geocoding
    const distributorAddress = [
      distributor.location,
      distributor.pincode,
      'India'
    ].filter(Boolean).join(', ');

    const recipientAddress = [
      recipient.location,
      recipient.pincode,
      'India'
    ].filter(Boolean).join(', ');

    setRouteDetails({
      origin: {
        address: distributorAddress,
        lat: null,
        lng: null
      },
      destination: {
        address: recipientAddress,
        lat: null,
        lng: null
      }
    });
    
    setShowRouteOptimizer(true);
  } catch (error) {
    console.error('Error fetching location data:', error);
    alert('Failed to fetch location information');
  }
};

useEffect(() => {
  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Get shipments
      const shipmentsRes = await axios.get('http://localhost:5000/api/shipments/distributor', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setShipments(shipmentsRes.data);
      
      // Get inventory
      const inventoryRes = await axios.get('http://localhost:5000/api/drugs/inventory', {
        headers: { Authorization: `Bearer ${token}` },
        params: { status: 'in-stock' }
      });
      
           // The backend now returns properly formatted items with unit barcodes
      setInventory(inventoryRes.data.items.map(item => ({
        _id: `${item.drugId}-${item.unitBarcode}`,
        name: item.name,
        batch: item.batch,
        barcode: item.unitBarcode, // Now using the actual unit barcode
        batchBarcode: item.batchBarcode,
        expiryDate: item.expiryDate,
        manufacturer: item.manufacturer,
        status: item.status,
        currentHolder: item.currentHolder,
        unitStatus: item.status
      })));

       const retailersRes = await axios.get('http://localhost:5000/api/users/retailers', {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log("Retailers fetched: ", retailersRes);
        setRetailers(retailersRes.data);

        const wholesalersRes = await axios.get('http://localhost:5000/api/users/wholesalers', {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log(wholesalersRes.data);
        
        setWholesalers(wholesalersRes.data);

        const pharmaciesRes = await axios.get('http://localhost:5000/api/users/pharmacies', {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log(pharmaciesRes.data); 
        setPharmacies(pharmaciesRes.data);

      
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };
  
  if (user) {
    fetchData();
  }
}, [user]);

const verifyDrug = async (barcode) => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.get(`http://localhost:5000/api/drugs/verify/${barcode}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (response.data.success) {
      const drug = response.data.drug;
      const expiryDate = new Date(drug.expiryDate);
      const today = new Date();
      const daysLeft = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
      
      return {
        ...drug,
        daysLeft,
        status: drug.unitStatus || drug.status
      };
    } else {
      return { 
        error: response.data.error || 'Drug not found in system' 
      };
    }
  } catch (error) {
    console.error('Verification error:', error);
    return { 
      error: error.response?.data?.error || 'Verification failed' 
    };
  }
};

  const handleReceiveShipment = async (shipmentId) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      await axios.put(
        `http://localhost:5000/api/shipments/${shipmentId}/accept`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      const shipmentsRes = await axios.get('http://localhost:5000/api/shipments/distributor', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setShipments(shipmentsRes.data);
      
      const inventoryRes = await axios.get('http://localhost:5000/api/drugs/inventory', {
        headers: { Authorization: `Bearer ${token}` },
        params: { status: 'in-stock with distributor' } 
      });
      
      if (!inventoryRes.data?.drugs || !Array.isArray(inventoryRes.data.drugs)) {
        console.error('Invalid inventory data format:', inventoryRes.data);
        setInventory([]);
        return;
      }

      const flattenedInventory = inventoryRes.data.drugs.flatMap(drug => {
        if (!drug.unitBarcodes || !Array.isArray(drug.unitBarcodes)) {
          return [];
        }
        return drug.unitBarcodes.map(barcode => ({
          _id: `${drug._id}-${barcode}`,
          name: drug.name,
          batch: drug.batch,
          barcode: barcode,
          batchBarcode: drug.batchBarcode,
          expiryDate: drug.expiryDate,
          manufacturer: drug.manufacturer,
          status: drug.status,
          currentHolder: drug.currentHolder
        }));
      });

      setInventory(flattenedInventory);
      setSelectedShipment(null);
    } catch (error) {
      console.error('Error accepting shipment:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRejectShipment = async (shipmentId) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      await axios.put(
        `http://localhost:5000/api/shipments/${shipmentId}/reject`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      await axios.put(
        `http://localhost:5000/api/drugs/update-from-shipment/${shipmentId}`,
        { status: 'cancelled' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      const shipmentsRes = await axios.get('http://localhost:5000/api/shipments/distributor', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setShipments(shipmentsRes.data);
      setSelectedShipment(null);
    } catch (error) {
      console.error('Error rejecting shipment:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectDrug = (drugId) => {
    setSelectedDrugs(prev => 
      prev.includes(drugId) 
        ? prev.filter(id => id !== drugId) 
        : [...prev, drugId]
    );
  };
const handleShipToRecipient = async () => {
  if (selectedDrugs.length === 0 || !selectedRecipient) {
    alert('Please select both drugs and a recipient');
    return;
  }

  try {
    setLoading(true);
    const token = localStorage.getItem('token');

    // Transform selected drugs into backend-expected format
    const drugPayload = selectedDrugs.map(drugId => {
      const drug = inventory.find(d => d._id === drugId);
      if (!drug) {
        throw new Error(`Drug ${drugId} not found in inventory`);
      }
      return {
        drugId: drug._id.split('-')[0], // Extract just the drug ID part
        unitBarcode: drug.barcode
      };
    });

    // Separate into arrays for backend
    const drugIds = [...new Set(drugPayload.map(d => d.drugId))];
    const unitBarcodes = drugPayload.map(d => d.unitBarcode);

    // Prepare API call based on recipient type
    let endpoint, payload;
    switch (recipientType) {
      case 'wholesaler':
        endpoint = '/api/shipments/to-wholesaler';
        payload = {
          drugIds,
          unitBarcodes,
          wholesalerId: selectedRecipient
        };
        break;
      case 'retailer':
        endpoint = '/api/shipments/to-retailer';
        payload = {
          drugIds,
          unitBarcodes,
          retailerId: selectedRecipient
        };
        break;
      case 'pharmacy':
        endpoint = '/api/shipments/to-pharmacy';
        payload = {
          drugIds,
          unitBarcodes,
          pharmacyId: selectedRecipient
        };
        break;
      default:
        throw new Error('Invalid recipient type');
    }

    // Make API call
    const response = await axios.post(
      `http://localhost:5000${endpoint}`,
      payload,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    // Handle success
    if (response.data.success) {
      // Refresh data
      const [shipmentsRes, inventoryRes] = await Promise.all([
        axios.get('http://localhost:5000/api/shipments/distributor', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get('http://localhost:5000/api/drugs/inventory', {
          headers: { Authorization: `Bearer ${token}` },
          params: { status: 'in-stock' }
        })
      ]);

      setShipments(shipmentsRes.data);
      setInventory(inventoryRes.data.items || []);
      setSelectedDrugs([]);
      setSelectedRecipient('');

      alert(`Successfully shipped ${selectedDrugs.length} items to ${getRecipientName(selectedRecipient)}`);
    } else {
      throw new Error(response.data.error || 'Shipment failed');
    }
  } catch (error) {
    console.error('Shipping error:', error);
    alert(`Shipping failed: ${error.message}`);
  } finally {
    setLoading(false);
  }
};

  const getRecipientName = (recipientId) => {
    let recipient;
    switch (recipientType) {
      case 'retailer':
        recipient = retailers.find(r => r._id === recipientId);
        break;
      case 'wholesaler':
        recipient = wholesalers.find(w => w._id === recipientId);
        break;
      case 'pharmacy':
        recipient = pharmacies.find(p => p._id === recipientId);
        break;
      default:
        return 'Unknown';
    }
    return recipient?.name || 'Unknown';
  };


  const filteredInventory = Array.isArray(inventory) ? 
  inventory.filter(drug => {
    if (!drug) return false;
    const nameMatch = drug.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const barcodeMatch = String(drug.barcode || '').includes(searchTerm);
    const batchBarcodeMatch = String(drug.batchBarcode || '').includes(searchTerm);
    return nameMatch || barcodeMatch || batchBarcodeMatch;
  }) : [];

  const pendingShipments = shipments.filter(s => s.status === 'processing');
  const receivedShipments = shipments.filter(s => s.status === 'delivered');

  const getManufacturerName = (manufacturer) => {
    if (!manufacturer) return 'Unknown';
    if (typeof manufacturer === 'object') return manufacturer.name || 'Unknown';
    return manufacturer;
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <FaSpinner className="spinner-icon" />
        <p>Loading dashboard...</p>
      </div>
    );
  }

 return (
    <div className="distributor-dashboard-container">
      
      {/* Sidebar */}
      <div className="distributor-sidebar" >
        <div className="distributor-sidebar-header">
          <h2>Distributor Dashboard</h2>
          {user && (
            <div className="distributor-user-info">
              <div className="distributor-user-avatar">
                {user.name?.charAt(0).toUpperCase()}
              </div>
              <span>{user.name}</span>
              <button className="distributor-logout-btn" onClick={logout}>
                <FaSignOutAlt />
              </button>
            </div>
          )}
        </div>
        
        <nav className="distributor-sidebar-nav">
          <button 
            className={`distributor-nav-btn ${activeTab === 'shipments' ? 'active' : ''}`}
            onClick={() => setActiveTab('shipments')}
          >
            <FaReceipt className="distributor-nav-icon" />
            <span>Incoming Shipments</span>
          </button>
          
          <button 
            className={`distributor-nav-btn ${activeTab === 'inventory' ? 'active' : ''}`}
            onClick={() => setActiveTab('inventory')}
          >
            <FaBoxes className="distributor-nav-icon" />
            <span>My Inventory</span>
          </button>
          
          <button 
            className={`distributor-nav-btn ${activeTab === 'ship' ? 'active' : ''}`}
            onClick={() => setActiveTab('ship')}
          >
            <FaTruck className="distributor-nav-icon" />
            <span>Ship Products</span>
          </button>
          
          <button 
            className={`distributor-nav-btn ${activeTab === 'verify' ? 'active' : ''}`}
            onClick={() => setActiveTab('verify')}
          >
            <FaQrcode className="distributor-nav-icon" />
            <span>Verify Drug</span>
          </button>
          
          <button 
            className={`distributor-nav-btn ${activeTab === 'analytics' ? 'active' : ''}`}
            onClick={() => setActiveTab('analytics')}
          >
            <FaChartLine className="distributor-nav-icon" />
            <span>Analytics</span>
          </button>
        </nav>
      </div>

      {/* Main Content */}
      <div className="distributor-main-content">
       {activeTab === 'shipments' && (
  <div className="distributor-tab-content">
    <h3>Pending Shipments ({pendingShipments.length})</h3>
    
    {pendingShipments.length > 0 ? (
      <div className="distributor-table-container">
        <table>
          <thead>
            <tr>
              <th>Tracking #</th>
              <th>Manufacturer</th>
              <th>Drug Count</th>
              <th>Date Sent</th>
              <th>Estimated Delivery</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {pendingShipments.map((shipment) => (
              <tr key={shipment._id}>
                <td>{shipment.trackingNumber}</td>
                <td>{shipment.manufacturer?.name || 'Unknown'}</td>
                <td>{shipment.drugs?.length || 0}</td>
                <td>{new Date(shipment.createdAt).toLocaleDateString()}</td>
                <td>
                  {shipment.estimatedDelivery 
                    ? new Date(shipment.estimatedDelivery).toLocaleDateString() 
                    : 'Not specified'}
                </td>
                <td><StatusChip label={shipment.status} status={shipment.status} /></td>
                <td>
                  <button 
                    className="distributor-view-btn"
                    onClick={() => setSelectedShipment(shipment)}
                  >
                    View Details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    ) : (
      <div className="distributor-empty-state">
        No pending shipments at this time
      </div>
    )}

    <h3>Received Shipments ({receivedShipments.length})</h3>
    
    {receivedShipments.length > 0 ? (
      <div className="distributor-table-container">
        <table>
          <thead>
            <tr>
              <th>Tracking #</th>
              <th>Manufacturer</th>
              <th>Drug Count</th>
              <th>Date Received</th>
              <th>Status</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {receivedShipments.map((shipment) => (
              <tr key={shipment._id}>
                <td>{shipment.trackingNumber}</td>
                <td>{shipment.manufacturer?.name || 'Unknown'}</td>
                <td>{shipment.drugs?.length || 0}</td>
                <td>
                  {shipment.actualDelivery 
                    ? new Date(shipment.actualDelivery).toLocaleDateString()
                    : new Date(shipment.updatedAt).toLocaleDateString()}
                </td>
                <td><StatusChip label={shipment.status} status={shipment.status} /></td>
                <td>
                  <button 
                    className="distributor-view-btn"
                    onClick={() => setSelectedShipment(shipment)}
                  >
                    View Details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    ) : (
      <div className="distributor-empty-state">
        No received shipments to display
      </div>
    )}
  </div>
)}
{activeTab === 'inventory' && (
  <div className="distributor-tab-content">
    <div className="distributor-inventory-header">
      <h3>Current Inventory ({inventory.length} units)</h3>
      <div className="distributor-search-box">
        <FaSearch className="distributor-search-icon" />
        <input
          type="text"
          placeholder="Search drugs..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
    </div>
    
    {filteredInventory.length > 0 ? (
      <div className="distributor-table-container">
        <table>
          <thead>
            <tr>
              <th>Drug Name</th>
              <th>Unit Barcode</th>
              <th>Batch Number</th>
              <th>Manufacturer</th>
              <th>Expiry Date</th>
              <th>Unit Status</th>
              <th>Overall Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredInventory.map((drug) => (
              <tr key={drug._id}>
                <td>{drug.name}</td>
                <td>{drug.barcode}</td>
                <td>{drug.batch}</td>
                <td>{getManufacturerName(drug.manufacturer)}</td>
                <td>{new Date(drug.expiryDate).toLocaleDateString()}</td>
                <td><StatusChip label={drug.unitStatus} status={drug.unitStatus} /></td>
                <td><StatusChip label={drug.status} status={drug.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    ) : (
      <div className="distributor-empty-state">
        {inventory.length === 0 ? 'No inventory available' : 'No drugs found matching your search'}
      </div>
    )}
  </div>
)}
        {activeTab === 'ship' && (
          <div className="distributor-tab-content">
            <h3>Ship Products to Recipients</h3>
            
            <div className="distributor-recipient-tabs">
              <button 
                className={`distributor-tab-btn ${recipientType === 'retailer' ? 'active' : ''}`}
                onClick={() => {
                  setRecipientType('retailer');
                  setSelectedRecipient('');
                }}
              >
                <FaStore className="distributor-tab-icon" /> Retailers
              </button>
              <button 
                className={`distributor-tab-btn ${recipientType === 'wholesaler' ? 'active' : ''}`}
                onClick={() => {
                  setRecipientType('wholesaler');
                  setSelectedRecipient('');
                }}
              >
                <FaPills className="distributor-tab-icon" /> Wholesalers
              </button>
              <button 
                className={`distributor-tab-btn ${recipientType === 'pharmacy' ? 'active' : ''}`}
                onClick={() => {
                  setRecipientType('pharmacy');
                  setSelectedRecipient('');
                }}
              >
                <FaClinicMedical className="distributor-tab-icon" /> Pharmacies
              </button>
            </div>
            
            <div className="distributor-ship-grid">
              <div className="distributor-drug-selection">
                <h4>Select Units to Ship</h4>
                
                <div className="distributor-search-box">
  <FaSearch className="distributor-search-icon" />
  <input
    type="text"
    placeholder="Search by name, barcode, batch, or manufacturer..."
    value={searchTerm}
    onChange={(e) => setSearchTerm(e.target.value)}
  />
  {searchTerm && (
    <button 
      className="distributor-clear-search"
      onClick={() => setSearchTerm('')}
    >
      <FaTimes />
    </button>
  )}
</div>
                
                <div className="distributor-drug-list-container">
                  <table className="distributor-drug-list">
                    <thead>
                      <tr>
                        <th></th>
                        <th>Drug Name</th>
                        <th>Unit Barcode</th>
                        <th>Batch Barcode</th>
                        <th>Expiry</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredInventory.map((drug) => (
                        <tr 
                          key={drug._id} 
                          className={selectedDrugs.includes(drug._id) ? 'selected' : ''}
                          onClick={() => handleSelectDrug(drug._id)}
                        >
                          <td>
                            {selectedDrugs.includes(drug._id) ? (
                              <FaCheckCircle className="distributor-selected-icon" />
                            ) : (
                              <FaTimes className="distributor-unselected-icon" />
                            )}
                          </td>
                          <td>{drug.name}</td>
                          <td>{drug.barcode}</td> 
                          <td>{drug.batchBarcode || "No rendering"}</td>
                          <td>{new Date(drug.expiryDate).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              
              <div className="distributor-shipping-details">
                <h4>Shipping Details</h4>
                
                <div className="distributor-form-group">
                  <label>Select {recipientType.charAt(0).toUpperCase() + recipientType.slice(1)}</label>
                  <select
                    value={selectedRecipient}
                    onChange={(e) => setSelectedRecipient(e.target.value)}
                  >
                    <option value="">Select a recipient</option>
                    {recipientType === 'retailer' && retailers.map(retailer => (
                      <option key={retailer._id} value={retailer._id}>
                        {retailer.name} ({retailer.organization})
                      </option>
                    ))}
                    {recipientType === 'wholesaler' && wholesalers.map(wholesaler => (
                      <option key={wholesaler._id} value={wholesaler._id}>
                        {wholesaler.name} ({wholesaler.organization})
                      </option>
                    ))}
                    {recipientType === 'pharmacy' && pharmacies.map(pharmacy => (
                      <option key={pharmacy._id} value={pharmacy._id}>
                        {pharmacy.name} ({pharmacy.organization})
                      </option>
                    ))}
                  </select>
                </div>
                  <button
    className="distributor-route-btn"
    onClick={handleOptimizeRoute}
    disabled={!selectedRecipient}
  >
    <FaRoute className="distributor-btn-icon" />
    Find Best Route
  </button>
                
                <div className="distributor-selection-progress">
                  <span>Selected Drugs: {selectedDrugs.length}</span>
                  <div className="distributor-progress-bar">
                    <div 
                      className="distributor-progress" 
                      style={{ width: `${Math.min(100, (selectedDrugs.length / inventory.length) * 100)}%` }}
                    ></div>
                  </div>
                </div>
                
                <button
                  className="distributor-ship-btn"
                  disabled={selectedDrugs.length === 0 || !selectedRecipient}
                  onClick={handleShipToRecipient}
                >
                  <FaTruck className="distributor-btn-icon" />
                  Confirm Shipment to {recipientType.charAt(0).toUpperCase() + recipientType.slice(1)}
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'verify' && (
           <DrugVerification 
    onVerify={verifyDrug}
    getManufacturerName={getManufacturerName}
  />
        )}

    
{activeTab === 'analytics' && (
  <div className="distributor-analytics-content">
    <div className="distributor-analytics-grid">
      {/* Summary Cards */}
      <div className="distributor-analytics-card">
        <h4>Total Inventory</h4>
        <div className="distributor-analytics-value primary">{inventory.length}</div>
        <small>units in stock</small>
      </div>
      
      <div className="distributor-analytics-card">
        <h4>Near-Expiry Drugs</h4>
        <div className="distributor-analytics-value warning">
          {inventory.filter(d => {
            const expiry = new Date(d.expiryDate);
            const today = new Date();
            const daysLeft = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
            return daysLeft <= 30;
          }).length}
        </div>
        <small>expiring in 30 days</small>
      </div>
      
      <div className="distributor-analytics-card">
        <h4>Active Partners</h4>
        <div className="distributor-analytics-value info">
          {[...retailers, ...wholesalers, ...pharmacies].length}
        </div>
        <small>business connections</small>
      </div>
      
      <div className="distributor-analytics-card">
        <h4>Monthly Shipments</h4>
        <div className="distributor-analytics-value secondary">
          {shipments.filter(s => {
            const shipDate = new Date(s.createdAt);
            const now = new Date();
            return shipDate.getMonth() === now.getMonth() && 
                   shipDate.getFullYear() === now.getFullYear();
          }).length}
        </div>
        <small>this month</small>
      </div>
    </div>

    {/* Main Charts Section */}
    <div className="distributor-charts-container">
      {/* Inventory by Status */}
      <div className="distributor-chart-card">
        <h4>Inventory Status Distribution</h4>
        <div className="distributor-chart-wrapper">
          <Doughnut 
            data={{
              labels: ['In Stock', 'Shipped', 'Delivered', 'Recalled', 'Expired'],
              datasets: [{
                data: [
                  inventory.filter(d => d.status.includes('in-stock')).length,
                  inventory.filter(d => d.status.includes('shipped')).length,
                  inventory.filter(d => d.status === 'delivered').length,
                  inventory.filter(d => d.status === 'recalled').length,
                  inventory.filter(d => d.status === 'expired').length
                ],
                backgroundColor: [
                  '#4BC0C0',
                  '#FFCE56',
                  '#36A2EB',
                  '#FF6384',
                  '#9966FF'
                ],
                borderWidth: 1
              }]
            }}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  position: 'right'
                }
              }
            }}
          />
        </div>
      </div>

      {/* Monthly Shipment Trends */}
      <div className="distributor-chart-card">
        <h4>Monthly Shipment Trends</h4>
        <div className="distributor-chart-wrapper">
          <Line 
            data={{
              labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
              datasets: [
                {
                  label: 'Received Shipments',
                  data: Array(12).fill(0).map((_, i) => 
                    shipments.filter(s => 
                      new Date(s.createdAt).getMonth() === i && 
                      ['delivered', 'received'].includes(s.status)
                    ).length
                  ),
                  borderColor: '#36A2EB',
                  backgroundColor: 'rgba(54, 162, 235, 0.1)',
                  tension: 0.3,
                  fill: true
                },
                {
                  label: 'Sent Shipments',
                  data: Array(12).fill(0).map((_, i) => 
                    shipments.filter(s => 
                      new Date(s.createdAt).getMonth() === i && 
                      s.createdBy === user._id
                    ).length
                  ),
                  borderColor: '#4BC0C0',
                  backgroundColor: 'rgba(75, 192, 192, 0.1)',
                  tension: 0.3,
                  fill: true
                }
              ]
            }}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              scales: {
                y: {
                  beginAtZero: true,
                  title: {
                    display: true,
                    text: 'Number of Shipments'
                  }
                }
              }
            }}
          />
        </div>
      </div>

      {/* Inventory by Manufacturer */}
<div className="distributor-chart-card">
  <h4>Inventory by Manufacturer</h4>
  <div className="distributor-chart-wrapper">
    <Bar 
      data={{
        labels: Array.from(new Set(inventory.map(d => 
          typeof d.manufacturer === 'object' ? d.manufacturer.name : 'Unknown'
          ))).slice(0, 5),
        datasets: [{
          label: 'Units in Stock',
          data: Array.from(new Set(inventory.map(d => 
            typeof d.manufacturer === 'object' ? d.manufacturer.name : 'Unknown'
            ))).map(manu => 
            inventory.filter(d => 
              (typeof d.manufacturer === 'object' ? d.manufacturer.name : 'Unknown') === manu
            ).length
            ).slice(0, 5),
          backgroundColor: '#FF9F40',
          borderColor: '#FF6384',
          borderWidth: 1
        }]
      }}
      options={{
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Number of Units'
            }
          }
        }
      }}
    />
  </div>
</div>

      {/* Partner Distribution */}
      <div className="distributor-chart-card">
        <h4>Partner Distribution</h4>
        <div className="distributor-chart-wrapper">
          <Pie 
            data={{
              labels: ['Retailers', 'Wholesalers', 'Pharmacies'],
              datasets: [{
                data: [retailers.length, wholesalers.length, pharmacies.length],
                backgroundColor: [
                  '#FF6384',
                  '#36A2EB',
                  '#FFCE56'
                ],
                borderWidth: 1
              }]
            }}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  position: 'right'
                }
              }
            }}
          />
        </div>
      </div>

      {/* Expiry Timeline */}
      <div className="distributor-chart-card wide">
        <h4>Drug Expiry Timeline</h4>
        <div className="distributor-chart-wrapper">
          <Bar 
            data={{
              labels: ['<30 days', '30-60 days', '60-90 days', '90-180 days', '>180 days'],
              datasets: [{
                label: 'Units Expiring',
                data: [
                  inventory.filter(d => {
                    const days = Math.ceil((new Date(d.expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
                    return days <= 30;
                  }).length,
                  inventory.filter(d => {
                    const days = Math.ceil((new Date(d.expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
                    return days > 30 && days <= 60;
                  }).length,
                  inventory.filter(d => {
                    const days = Math.ceil((new Date(d.expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
                    return days > 60 && days <= 90;
                  }).length,
                  inventory.filter(d => {
                    const days = Math.ceil((new Date(d.expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
                    return days > 90 && days <= 180;
                  }).length,
                  inventory.filter(d => {
                    const days = Math.ceil((new Date(d.expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
                    return days > 180;
                  }).length
                ],
                backgroundColor: [
                  '#FF6384',
                  '#FF9F40',
                  '#FFCE56',
                  '#4BC0C0',
                  '#36A2EB'
                ],
                borderWidth: 1
              }]
            }}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              scales: {
                y: {
                  beginAtZero: true,
                  title: {
                    display: true,
                    text: 'Number of Units'
                  }
                }
              }
            }}
          />
        </div>
      </div>

      {/* Shipment Status */}
      <div className="distributor-chart-card">
        <h4>Shipment Status</h4>
        <div className="distributor-chart-wrapper">
          <Doughnut 
            data={{
              labels: ['Processing', 'In Transit', 'Delivered', 'Cancelled'],
              datasets: [{
                data: [
                  shipments.filter(s => s.status === 'processing').length,
                  shipments.filter(s => s.status === 'in-transit').length,
                  shipments.filter(s => s.status === 'delivered').length,
                  shipments.filter(s => s.status === 'cancelled').length
                ],
                backgroundColor: [
                  '#FFCE56',
                  '#36A2EB',
                  '#4BC0C0',
                  '#FF6384'
                ],
                borderWidth: 1
              }]
            }}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  position: 'right'
                }
              }
            }}
          />
        </div>
      </div>
    </div>
  </div>
)}

        {/* Shipment Details Modal */}
        {selectedShipment && (
  <div className="distributor-modal-overlay">
    <div className="distributor-modal">
      <h3>Shipment Details: {selectedShipment.trackingNumber}</h3>
      
      <div className="distributor-modal-content">
        <div className="distributor-shipment-info-grid">
          <div>
            <p><strong>Manufacturer:</strong> {selectedShipment.manufacturer?.name || 'Unknown'}</p>
            <p><strong>Date Sent:</strong> {new Date(selectedShipment.createdAt).toLocaleDateString()}</p>
          </div>
          <div>
            <p><strong>Estimated Delivery:</strong> 
              {selectedShipment.estimatedDelivery 
                ? new Date(selectedShipment.estimatedDelivery).toLocaleDateString()
                : 'Not specified'}
            </p>
            {selectedShipment.actualDelivery && (
              <p><strong>Actual Delivery:</strong> {new Date(selectedShipment.actualDelivery).toLocaleDateString()}</p>
            )}
          </div>
        </div>
        
        <p><strong>Status:</strong> 
          <StatusChip label={selectedShipment.status} status={selectedShipment.status} />
        </p>
        
        <h4>Drugs in Shipment ({selectedShipment.drugs?.length || 0})</h4>
        
        <div className="distributor-drug-list-modal">
          <table>
            <thead>
              <tr>
                <th>Drug Name</th>
                <th>Batch</th>
                <th>Expiry Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {selectedShipment.drugs?.map((drug, i) => (
                <tr key={i}>
                  <td>{drug.name}</td>
                  <td>{drug.batch}</td>
                  <td>{new Date(drug.expiryDate).toLocaleDateString()}</td>
                  <td><StatusChip label={drug.status} status={drug.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {selectedShipment.notes && (
          <div className="distributor-shipment-notes">
            <h4>Notes</h4>
            <p>{selectedShipment.notes}</p>
          </div>
        )}
        
        {(selectedShipment.status === 'processing' || selectedShipment.status === 'in-transit') && (
          <div className="distributor-modal-actions">
            <button 
              className="distributor-reject-btn"
              onClick={() => handleRejectShipment(selectedShipment._id)}
            >
              Reject Shipment
            </button>
            <button 
              className="distributor-accept-btn"
              onClick={() => handleReceiveShipment(selectedShipment._id)}
            >
              Accept Shipment
            </button>
          </div>
        )}
      </div>
      
      <button 
        className="distributor-close-modal"
        onClick={() => setSelectedShipment(null)}
      >
        &times;
      </button>
    </div>
  </div>
)}

        {/* Verification Result Modal */}
        {openModal && (
          <div className="distributor-modal-overlay">
            <div className="distributor-modal">
              <h3>Drug Verification Result</h3>
              
              <div className="distributor-modal-content">
                {verificationResult?.error ? (
                  <div className="distributor-verification-error">
                    <FaTimes className="distributor-error-icon" />
                    <h4>{verificationResult.error}</h4>
                    <p>This drug may be counterfeit or not registered in our system.</p>
                  </div>
                ) : verificationResult ? (
                  <>
                    <div className="distributor-verification-success">
                      <FaCheckCircle className="distributor-success-icon" />
                      <h4>Valid Drug Found</h4>
                    </div>
                    
                    <div className="distributor-verification-details">
                      <p><strong>Name:</strong> {verificationResult.name}</p>
                      <p><strong>Barcode:</strong> {verificationResult.barcode}</p>
                      <p><strong>Batch:</strong> {verificationResult.batch}</p>
                      <p><strong>Manufacturer:</strong> {getManufacturerName(verificationResult.manufacturer)}</p>
                      <p><strong>Expiry:</strong> {verificationResult.expiry}</p>
                      <p><strong>Status:</strong> 
                        <StatusChip label={verificationResult.status} status={verificationResult.status} />
                      </p>
                    </div>
                  </>
                ) : null}
              </div>
              
              <button
                className="distributor-close-btn"
                onClick={() => {
                  setOpenModal(false);
                  setVerificationResult(null);
                  setQrInput('');
                }}
              >
                Close
              </button>
            </div>
          </div>
        )}

        {showRouteOptimizer && (
  <RouteOptimizer 
    origin={routeDetails.origin}
    destination={routeDetails.destination}
    onClose={() => setShowRouteOptimizer(false)}
  />
)}
        
      </div>
    </div>
  );
};

export default DistributorDashboard;