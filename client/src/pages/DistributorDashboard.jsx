import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import axios from 'axios';
import './DistributorDashboard.css';
import { 
  FaCheckCircle, FaTimes, FaSearch, FaQrcode, 
  FaBoxes, FaTruck, FaChartLine, FaReceipt, FaSignOutAlt,
  FaStore, FaClinicMedical, FaPills, FaSpinner
} from 'react-icons/fa';

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
        params: { status: 'in-stock with distributor' }
      });
      
      // Flatten the inventory data
      const flattenedInventory = inventoryRes.data.drugs.flatMap(drug => {
        if (!drug.unitBarcodes || !Array.isArray(drug.unitBarcodes)) {
          return [];
        }
        return drug.unitBarcodes.map(unit => ({
          _id: `${drug._id}-${unit.barcode}`,
          name: drug.name,
          batch: drug.batch,
          barcode: unit.barcode,
          batchBarcode: drug.batchBarcode,
          expiryDate: drug.expiryDate,
          manufacturer: drug.manufacturer,
          status: drug.status,
          currentHolder: drug.currentHolder,
          unitStatus: unit.status
        }));
      });

      setInventory(flattenedInventory);

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
    if (selectedDrugs.length === 0 || !selectedRecipient) return;
    
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const drugData = selectedDrugs.map(id => {
        const [drugId, barcode] = id.split('-');
        return { drugId, barcode };
      });
      
      const drugIds = [...new Set(drugData.map(d => d.drugId))];
      
      let endpoint;
      let payload = { 
        drugIds,
        unitBarcodes: drugData.map(d => d.barcode) 
      };
      
      switch (recipientType) {
        case 'wholesaler':
          endpoint = '/api/shipments/to-wholesaler';
          payload.wholesalerId = selectedRecipient;
          break;
        case 'retailer':
          endpoint = '/api/shipments/to-retailer';
          payload.retailerId = selectedRecipient;
          break;
        case 'pharmacy':
          endpoint = '/api/shipments/to-pharmacy';
          payload.pharmacyId = selectedRecipient;
          break;
        default:
          throw new Error('Invalid recipient type');
      }
      
      const response = await axios.post(`http://localhost:5000${endpoint}`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setInventory(prev => prev.filter(drug => !selectedDrugs.includes(drug._id)));
      setSelectedDrugs([]);
      setSelectedRecipient('');
      
      alert(`Successfully shipped ${selectedDrugs.length} units to ${getRecipientName(selectedRecipient)}`);
    } catch (error) {
      console.error('Error creating shipment:', error);
      const errorMsg = error.response?.data?.error || 'Failed to create shipment';
      alert(`Error: ${errorMsg}`);
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

  const verifyDrug = () => {
    const foundDrug = inventory.find(drug => 
      drug.barcode === qrInput || 
      drug.batchBarcode === qrInput
    );
    
    setVerificationResult(foundDrug || { error: 'Drug not found in system' });
    setOpenModal(true);
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
    <div className="dashboard-container">
      {/* Sidebar */}
      <div className="sidebar" >
        <div className="sidebar-header">
          <h2>Distributor Dashboard</h2>
          {user && (
            <div className="user-info">
              <div className="user-avatar">
                {user.name?.charAt(0).toUpperCase()}
              </div>
              <span>{user.name}</span>
              <button className="logout-btn" onClick={logout}>
                <FaSignOutAlt />
              </button>
            </div>
          )}
        </div>
        
        <nav className="sidebar-nav">
          <button 
            className={`nav-btn ${activeTab === 'shipments' ? 'active' : ''}`}
            onClick={() => setActiveTab('shipments')}
          >
            <FaReceipt className="nav-icon" />
            <span>Incoming Shipments</span>
          </button>
          
          <button 
            className={`nav-btn ${activeTab === 'inventory' ? 'active' : ''}`}
            onClick={() => setActiveTab('inventory')}
          >
            <FaBoxes className="nav-icon" />
            <span>My Inventory</span>
          </button>
          
          <button 
            className={`nav-btn ${activeTab === 'ship' ? 'active' : ''}`}
            onClick={() => setActiveTab('ship')}
          >
            <FaTruck className="nav-icon" />
            <span>Ship Products</span>
          </button>
          
          <button 
            className={`nav-btn ${activeTab === 'verify' ? 'active' : ''}`}
            onClick={() => setActiveTab('verify')}
          >
            <FaQrcode className="nav-icon" />
            <span>Verify Drug</span>
          </button>
          
          <button 
            className={`nav-btn ${activeTab === 'analytics' ? 'active' : ''}`}
            onClick={() => setActiveTab('analytics')}
          >
            <FaChartLine className="nav-icon" />
            <span>Analytics</span>
          </button>
        </nav>
      </div>

      {/* Main Content */}
      <div className="main-content">
       {activeTab === 'shipments' && (
  <div className="tab-content">
    <h3>Pending Shipments ({pendingShipments.length})</h3>
    
    {pendingShipments.length > 0 ? (
      <div className="table-container">
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
                    className="view-btn"
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
      <div className="empty-state">
        No pending shipments at this time
      </div>
    )}

    <h3>Received Shipments ({receivedShipments.length})</h3>
    
    {receivedShipments.length > 0 ? (
      <div className="table-container">
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
                    className="view-btn"
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
      <div className="empty-state">
        No received shipments to display
      </div>
    )}
  </div>
)}
{activeTab === 'inventory' && (
  <div className="tab-content">
    <div className="inventory-header">
      <h3>Current Inventory ({inventory.length} units)</h3>
      <div className="search-box">
        <FaSearch className="search-icon" />
        <input
          type="text"
          placeholder="Search drugs..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
    </div>
    
    {filteredInventory.length > 0 ? (
      <div className="table-container">
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
      <div className="empty-state">
        {inventory.length === 0 ? 'No inventory available' : 'No drugs found matching your search'}
      </div>
    )}
  </div>
)}
        {activeTab === 'ship' && (
          <div className="tab-content">
            <h3>Ship Products to Recipients</h3>
            
            <div className="recipient-tabs">
              <button 
                className={`tab-btn ${recipientType === 'retailer' ? 'active' : ''}`}
                onClick={() => {
                  setRecipientType('retailer');
                  setSelectedRecipient('');
                }}
              >
                <FaStore className="tab-icon" /> Retailers
              </button>
              <button 
                className={`tab-btn ${recipientType === 'wholesaler' ? 'active' : ''}`}
                onClick={() => {
                  setRecipientType('wholesaler');
                  setSelectedRecipient('');
                }}
              >
                <FaPills className="tab-icon" /> Wholesalers
              </button>
              <button 
                className={`tab-btn ${recipientType === 'pharmacy' ? 'active' : ''}`}
                onClick={() => {
                  setRecipientType('pharmacy');
                  setSelectedRecipient('');
                }}
              >
                <FaClinicMedical className="tab-icon" /> Pharmacies
              </button>
            </div>
            
            <div className="ship-grid">
              <div className="drug-selection">
                <h4>Select Drugs to Ship</h4>
                
                <div className="search-box">
  <FaSearch className="search-icon" />
  <input
    type="text"
    placeholder="Search by name, barcode, batch, or manufacturer..."
    value={searchTerm}
    onChange={(e) => setSearchTerm(e.target.value)}
  />
  {searchTerm && (
    <button 
      className="clear-search"
      onClick={() => setSearchTerm('')}
    >
      <FaTimes />
    </button>
  )}
</div>
                
                <div className="drug-list-container">
                  <table className="drug-list">
                    <thead>
                      <tr>
                        <th></th>
                        <th>Drug Name</th>
                        <th>Barcode</th>
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
                              <FaCheckCircle className="selected-icon" />
                            ) : (
                              <FaTimes className="unselected-icon" />
                            )}
                          </td>
                          <td>{drug.name}</td>
                          <td>{drug.batchBarcode || "No rendering"}</td>
                          <td>{new Date(drug.expiryDate).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              
              <div className="shipping-details">
                <h4>Shipping Details</h4>
                
                <div className="form-group">
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
                
                <div className="selection-progress">
                  <span>Selected Drugs: {selectedDrugs.length}</span>
                  <div className="progress-bar">
                    <div 
                      className="progress" 
                      style={{ width: `${Math.min(100, (selectedDrugs.length / inventory.length) * 100)}%` }}
                    ></div>
                  </div>
                </div>
                
                <button
                  className="ship-btn"
                  disabled={selectedDrugs.length === 0 || !selectedRecipient}
                  onClick={handleShipToRecipient}
                >
                  <FaTruck className="btn-icon" />
                  Confirm Shipment to {recipientType.charAt(0).toUpperCase() + recipientType.slice(1)}
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'verify' && (
          <div className="verify-tab">
            <div className="verify-card">
              <h3>Verify Drug Authenticity</h3>
              
              <div className="verify-input">
                <input
                  type="text"
                  placeholder="Enter drug barcode or scan QR code"
                  value={qrInput}
                  onChange={(e) => setQrInput(e.target.value)}
                />
                <button 
                  className="scan-btn"
                  onClick={() => alert('QR scanner would open here')}
                >
                  <FaQrcode /> Scan
                </button>
              </div>
              
              <button
                className="verify-btn"
                disabled={!qrInput}
                onClick={verifyDrug}
              >
                Verify Drug
              </button>
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="analytics-grid">
            <div className="analytics-card">
              <h4>Drugs Received This Month</h4>
              <div className="analytics-value">245</div>
            </div>
            
            <div className="analytics-card">
              <h4>Near-Expiry Drugs</h4>
              <div className="analytics-value warning">18</div>
            </div>
            
            <div className="analytics-card">
              <h4>Retailers Served</h4>
              <div className="analytics-value secondary">{retailers.length}</div>
            </div>
            
            <div className="analytics-card">
              <h4>Wholesalers Served</h4>
              <div className="analytics-value info">{wholesalers.length}</div>
            </div>
          </div>
        )}

        {/* Shipment Details Modal */}
        {selectedShipment && (
  <div className="modal-overlay">
    <div className="modal">
      <h3>Shipment Details: {selectedShipment.trackingNumber}</h3>
      
      <div className="modal-content">
        <div className="shipment-info-grid">
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
        
        <div className="drug-list-modal">
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
          <div className="shipment-notes">
            <h4>Notes</h4>
            <p>{selectedShipment.notes}</p>
          </div>
        )}
        
        {(selectedShipment.status === 'processing' || selectedShipment.status === 'in-transit') && (
          <div className="modal-actions">
            <button 
              className="reject-btn"
              onClick={() => handleRejectShipment(selectedShipment._id)}
            >
              Reject Shipment
            </button>
            <button 
              className="accept-btn"
              onClick={() => handleReceiveShipment(selectedShipment._id)}
            >
              Accept Shipment
            </button>
          </div>
        )}
      </div>
      
      <button 
        className="close-modal"
        onClick={() => setSelectedShipment(null)}
      >
        &times;
      </button>
    </div>
  </div>
)}

        {/* Verification Result Modal */}
        {openModal && (
          <div className="modal-overlay">
            <div className="modal">
              <h3>Drug Verification Result</h3>
              
              <div className="modal-content">
                {verificationResult?.error ? (
                  <div className="verification-error">
                    <FaTimes className="error-icon" />
                    <h4>{verificationResult.error}</h4>
                    <p>This drug may be counterfeit or not registered in our system.</p>
                  </div>
                ) : verificationResult ? (
                  <>
                    <div className="verification-success">
                      <FaCheckCircle className="success-icon" />
                      <h4>Valid Drug Found</h4>
                    </div>
                    
                    <div className="verification-details">
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
                className="close-btn"
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
      </div>
    </div>
  );
};

export default DistributorDashboard;