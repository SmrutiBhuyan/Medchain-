import React, { useState, useEffect, useRef } from 'react';
import { 
  Speedometer2, Truck, Clipboard2Pulse, Diagram3, ExclamationTriangle,
  PersonCircle, Gear, BoxArrowRight, Capsule, ExclamationTriangleFill, ClockFill,
  Funnel, Trash, Printer, Flag, Download, Filter, UpcScan, CheckCircleFill, 
  ShieldCheck, GraphUp, BoxSeam, Link45deg, Search, CheckCircle, XCircle,
  Camera, Mic, QrCodeScan
} from 'react-bootstrap-icons';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  Filler
} from 'chart.js';
import { Bar, Pie, Line, Doughnut } from 'react-chartjs-2';
import { GeoAlt as LocationIcon } from 'react-bootstrap-icons';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  Filler
);
import { useAuth } from './AuthContext';
import DiseaseInventoryChecker from './DiseaseInventoryChecker';
import './PharmacyDashboard.css';
import axios from 'axios';
import { Modal, Button, Toast, OverlayTrigger, Tooltip } from 'react-bootstrap';
import Webcam from 'react-webcam';
import DrugVerificationGlobal from './DrugVerificationGlobal'
import DrugShortagePrediction from './DrugPredictionShortage';

const PharmacyDashboard = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [verificationResult, setVerificationResult] = useState(null);
  const [shipments, setShipments] = useState([]);
  const [loadingShipments, setLoadingShipments] = useState(false);
  const [selectedShipment, setSelectedShipment] = useState(null);
  const [showShipmentModal, setShowShipmentModal] = useState(false);
  const [expandedShipmentId, setExpandedShipmentId] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [scannedDrug, setScannedDrug] = useState(null);
  const [showScanner, setShowScanner] = useState(false);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastVariant, setToastVariant] = useState('success');
  const webcamRef = useRef(null);
  const [showDiseaseChecker, setShowDiseaseChecker] = useState(false); 

  const recallData = [
    { id: 1, drug: 'Lipitor 20mg', batch: 'LIP2023-03', barcode: '7890123456', issued: '2023-05-15', by: 'FDA', severity: 'high' },
    { id: 2, drug: 'Ventolin Inhaler', batch: 'VEN2023-01', barcode: '1234567890', issued: '2023-04-28', by: 'Manufacturer', severity: 'medium' }
  ];
  // Fetch inventory and shipments when their tabs are active
  useEffect(() => {
    if (activeTab === 'inventory' && user) {
      fetchInventory();
    }
    if (activeTab === 'shipments' && user) {
      fetchShipments();
    }
  }, [activeTab, user]);

 const fetchInventory = async () => {
  try {
    const response = await axios.get(`http://localhost:5000/api/drugs/pharmacy-inventory/${user._id}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    });
    console.log("pharmacy inventory",response.data);
    
    setInventory(response.data);
  } catch (error) {
    console.error('Error fetching inventory:', error);
    showNotification('Failed to load inventory', 'danger');
  }
};
  const fetchShipments = async () => {
    try {
      setLoadingShipments(true);
      const response = await axios.get(`http://localhost:5000/api/shipments/pharmacy/${user._id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      console.log("Shipments found:",response.data);
      
      setShipments(response.data);
    } catch (error) {
      console.error('Error fetching shipments:', error);
      showNotification('Failed to load shipments', 'danger');
    } finally {
      setLoadingShipments(false); 
    }
  };

// Accept shipment
const handleAcceptShipment = async (shipmentId) => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.put(
      `http://localhost:5000/api/shipments/accept/pharmacy/${shipmentId}`,
      {},
      { 
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (response.data.success) {
      fetchShipments();
      showNotification(response.data.message, 'success');
    } else {
      showNotification(response.data.message, 'warning');
    }

  } catch (error) {
    console.error('Accept error:', error.response?.data || error.message);
    showNotification(
      error.response?.data?.message || 'Failed to accept shipment',
      'danger'
    );
  }
};

// Reject shipment
const handleRejectShipment = async (shipmentId) => {
  try {
        const token = localStorage.getItem('token');
    await axios.put(
      `http://localhost:5000/api/shipments/reject/pharmacy/${shipmentId}`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );
    fetchShipments(); // Refresh the shipment list
    showNotification('Shipment rejected successfully', 'success');
  } catch (error) {
    console.error('Error rejecting shipment:', error);
    showNotification(error.response?.data?.message || 'Failed to reject shipment', 'danger');
  }
};

  const handleViewShipment = (shipment) => {
    setSelectedShipment(shipment);
    setShowShipmentModal(true);
  };

  // FIX: Renamed handleCloseModal to handleCloseShipmentModal for clarity and consistency
  const handleCloseShipmentModal = () => {
    setShowShipmentModal(false);
    setSelectedShipment(null);
  };

  const toggleShipmentDetails = (shipmentId) => {
    setExpandedShipmentId(expandedShipmentId === shipmentId ? null : shipmentId);
  };

  // Barcode scanning functions
  const handleBarcodeScan = async (barcode) => {
    try {
      const response = await axios.get(`http://localhost:5000/api/drugs/unit/${barcode}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      setScannedDrug(response.data);
      setBarcodeInput('');
      setShowScanner(false);
      
      // Auto-speak important alerts
      if (response.data.status === 'recalled') {
        speak(`Warning! ${response.data.name} batch ${response.data.batch} has been recalled.`);
      } else if (new Date(response.data.expiryDate) < new Date()) {
        speak(`Alert! ${response.data.name} has expired. Please discard.`);
      } else if (response.data.quantity <= 2) {
        speak(`Low stock. Only ${response.data.quantity} ${response.data.name} remaining.`);
      }
    } catch (error) {
      console.error('Error fetching drug by barcode:', error);
      showNotification('Drug not found in inventory', 'danger');
      setScannedDrug(null);
    }
  };

  const handleManualBarcodeInput = (e) => {
    if (e.key === 'Enter' && barcodeInput.trim()) {
      handleBarcodeScan(barcodeInput.trim());
    }
  };

  const captureBarcode = () => {
    const imageSrc = webcamRef.current.getScreenshot();
    // In a real app, you would use a barcode scanning library here
    // For demo purposes, we'll just simulate a scan after 1 second
    setTimeout(() => {
      handleBarcodeScan('DEMO123'); // Replace with actual barcode from image
    }, 1000);
  };

const markDrugAsSold = async (barcode) => {
  try {
    await axios.put(
      `http://localhost:5000/api/drugs/mark-sold/${barcode}`,
      {},
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      }
    );
    showNotification('Drug marked as sold', 'success');
    fetchInventory(); // Refresh the inventory
  } catch (error) {
    console.error('Error marking drug as sold:', error);
    showNotification('Failed to mark drug as sold', 'danger');
  }
};

  const reportDrugAsExpired = async () => {
    try {
      await axios.put(
        `http://localhost:5000/api/drugs/report-expired/${scannedDrug.barcode}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      showNotification(`${scannedDrug.name} reported as expired`, 'success');
      setScannedDrug(null);
      fetchInventory();
    } catch (error) {
      console.error('Error reporting drug as expired:', error);
      showNotification('Failed to report drug as expired', 'danger');
    }
  };

  const removeRecalledDrug = async () => {
    try {
      await axios.put(
        `http://localhost:5000/api/drugs/mark-recalled/${scannedDrug.barcode}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      showNotification(`${scannedDrug.name} removed due to recall`, 'success');
      setScannedDrug(null);
      fetchInventory();
    } catch (error) {
      console.error('Error removing recalled drug:', error);
      showNotification('Failed to remove recalled drug', 'danger');
    }
  };

  const speak = (text) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

  const showNotification = (message, variant) => {
    setToastMessage(message);
    setToastVariant(variant);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

const getStatusBadge = (status) => {
  switch(status) {
    case 'in_stock': return <span className="pharma-badge pharma-success">In Stock</span>;
    case 'sold': return <span className="pharma-badge pharma-secondary">Sold</span>;
    case 'recalled': return <span className="pharma-badge pharma-danger">Recalled</span>;
    case 'expired': return <span className="pharma-badge pharma-warning">Expired</span>;
    default: return <span className="pharma-badge pharma-light">Unknown</span>;
  }
};

  const getDrugStatus = (drug) => {
  if (drug.status === 'recalled') return 'recalled';
  if (new Date(drug.expiryDate) < new Date()) return 'expired';
  if (drug.unitBarcodes?.some(b => b.barcode === drug.barcode && b.status === 'sold')) return 'sold';
  return drug.status;
};
  

  return (
    <div className="pharma-dashboard">
      <Toast 
        show={showToast} 
        onClose={() => setShowToast(false)} 
        delay={3000} 
        autohide
        className={`pharma-toast pharma-toast-${toastVariant}`}
      >
        <Toast.Body>{toastMessage}</Toast.Body>
      </Toast>
      <div className="pharma-sidebar">
        <div className="pharma-sidebar-content">
          <h4 className="pharma-sidebar-title"><Capsule className="pharma-icon" />MedChain</h4>
          <div className="pharma-tabs-container">
            <div 
              className={`pharma-tab-item ${activeTab === 'dashboard' ? 'pharma-active' : ''}`}
              onClick={() => setActiveTab('dashboard')}
            >
              <Speedometer2 className="pharma-icon" /> Dashboard
            </div>
            <div 
              className={`pharma-tab-item ${activeTab === 'shipments' ? 'pharma-active' : ''}`}
              onClick={() => setActiveTab('shipments')}
            >
              <Truck className="pharma-icon" /> Receive Shipments
            </div>
            <div 
              className={`pharma-tab-item ${activeTab === 'inventory' ? 'pharma-active' : ''}`}
              onClick={() => setActiveTab('inventory')}
            >
              <Clipboard2Pulse className="pharma-icon" /> Inventory
            </div>
            <div 
              className={`pharma-tab-item ${activeTab === 'verify' ? 'pharma-active' : ''}`}
              onClick={() => setActiveTab('verify')}
            >
              <ShieldCheck className="pharma-icon" /> Verify Drug
            </div>
            <div 
              className={`pharma-tab-item ${activeTab === 'alerts' ? 'pharma-active' : ''}`}
              onClick={() => setActiveTab('alerts')}
            >
              <ExclamationTriangle className="pharma-icon" /> Alerts
            </div>
            <div 
  className={`pharma-tab-item ${activeTab === 'stockPlanner' ? 'pharma-active' : ''}`}
  onClick={() => setActiveTab('stockPlanner')}
>
  <LocationIcon className="pharma-icon" /> Stock Planner
</div>
          
            <div 
              className={`pharma-tab-item ${activeTab === 'analytics' ? 'pharma-active' : ''}`}
              onClick={() => setActiveTab('analytics')}
            >
              <GraphUp className="pharma-icon" /> Analytics
            </div>
          </div>
        </div>
      </div>

      <div className="pharma-main-content">
        <div className="pharma-header">
  <h3>MedChain Pharmacy Portal</h3>
  <div className="pharma-header-controls">
    <div className="pharma-search-box">
      <Search className="pharma-search-icon" />
      <input type="text" placeholder="Search..." />
    </div>
    <div className="pharma-dropdown">
      <button className="pharma-dropdown-toggle">
        <PersonCircle className="pharma-icon" /> {user?.name || 'Pharmacist'}
      </button>
      <div className="pharma-dropdown-menu">
        <a href="#"><PersonCircle className="pharma-icon" /> Profile</a>
        <a href="#"><Gear className="pharma-icon" /> Settings</a>
        <div className="pharma-divider"></div>
        <a href="#" onClick={(e) => { e.preventDefault(); logout(); }}>
          <BoxArrowRight className="pharma-icon" /> Logout
        </a>
      </div>
    </div>
  </div>
</div>

        <div className="pharma-tab-content">
          {activeTab === 'dashboard' && (
            <div className="pharma-dashboard-tab">
              <div className="pharma-stats-row">
                <div className="pharma-stat-card">
                  <div className="pharma-stat-content">
                    <div>
                      <h6>Total Inventory</h6>
                      <h3>{inventory.length}</h3>
                      <p>Drug batches</p>
                    </div>
                    <div className="pharma-icon-bg pharma-primary">
                      <BoxSeam className="pharma-icon pharma-primary" />
                    </div>
                  </div>
                </div>
                <div className="pharma-stat-card">
                  <div className="pharma-stat-content">
                    <div>
                      <h6>Active Alerts</h6>
                      <h3>{recallData.length}</h3>
                      <p>Recalls & warnings</p>
                    </div>
                    <div className="pharma-icon-bg pharma-warning">
                      <ExclamationTriangleFill className="pharma-icon pharma-warning" />
                    </div>
                  </div>
                </div>
                <div className="pharma-stat-card">
                  <div className="pharma-stat-content">
                    <div>
                      <h6>Expiring Soon</h6>
                      <h3>{inventory.filter(d => new Date(d.expiry) < new Date(Date.now() + 30*24*60*60*1000)).length}</h3>
                      <p>Within 30 days</p>
                    </div>
                    <div className="pharma-icon-bg pharma-danger">
                      <ClockFill className="pharma-icon pharma-danger" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="pharma-content-row">
                <div className="pharma-main-panel">
                  <div className="pharma-card">
                    <div className="pharma-card-header">
                      <h5>Recent Inventory Activity</h5>
                    </div>
                    <div className="pharma-card-body">
         <table className="pharma-data-table">
  <thead>
    <tr>
      <th>Drug Name</th>
      <th>Batch</th>
      <th>Barcode</th>
      <th>Manufacturer</th>
      <th>Expiry Date</th>
      <th>Quantity</th>
      <th>Status</th>
      <th>Actions</th>
    </tr>
  </thead>
  <tbody>
    {inventory.map(item => (
      <tr key={item._id} className={getDrugStatus(item)}>
        <td>
          {item.name} 
          {item.quantity <= 2 && <span className="pharma-badge pharma-warning">Low stock</span>}
        </td>
        <td>{item.batch}</td>
        <td>
          <OverlayTrigger
            placement="top"
            overlay={<Tooltip>Click to scan this barcode</Tooltip>}
          >
            <span 
              className="pharma-barcode"
              onClick={() => handleBarcodeScan(item.barcode)}
            >
              {item.barcode}
            </span>
          </OverlayTrigger>
        </td>
        <td>{item.manufacturer?.name || 'Unknown'}</td>
        <td>{new Date(item.expiryDate).toLocaleDateString()}</td>
        <td>{item.quantity}</td>
        <td>{getStatusBadge(getDrugStatus(item))}</td>
        <td className="pharma-actions">
          <button 
            className="pharma-btn-icon"
            onClick={() => handleBarcodeScan(item.barcode)}
            title="Scan this item"
          >
            <QrCodeScan />
          </button>
          <button 
            className="pharma-btn-icon"
            onClick={() => {
              setActiveTab('verify');
              verifyDrug(item.barcode);
            }}
            title="Verify on blockchain"
          >
            <ShieldCheck />
            
          </button>
            <button 
              className="pharma-btn-icon"
              onClick={() => markDrugAsSold(item.barcode)}
              title="Mark as sold"
            >
              <CheckCircle />
            </button>
       
        </td>
      </tr>
    ))}
  </tbody>
</table>
                    </div>
                  </div>
                </div>
                <div className="pharma-side-panel">
                  <DrugShortagePrediction/>
                </div>
              </div>
            </div>
          )}
{activeTab === 'shipments' && (
  <div className="pharma-shipments-tab">
    <div className="pharma-card">
      <div className="pharma-card-header">
        <h5>Incoming Shipments</h5>
      </div>
      <div className="pharma-card-body">
        {loadingShipments ? (
          <div className="pharma-loading">Loading shipments...</div>
        ) : shipments.length === 0 ? (
          <div className="pharma-no-data">
            <p>No shipments pending acceptance</p>
          </div>
        ) : (
          <div className="shipment-container">
            {/* Shipments List */}
            <table className="pharma-data-table">
              <thead>
                <tr>
                  <th>Tracking Number</th>
                  <th>Drugs</th>
                  <th>From</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {shipments.map(shipment => (
                  <React.Fragment key={shipment._id}>
                    <tr>
                                <td>{shipment.trackingNumber}</td>
                                <td>
                                  {shipment.drugs?.map(drug => (
                                    <div key={drug._id} className="pharma-drug-item">
                                      {drug.name} (Batch: {drug.batch})
                                    </div>
                                  ))}
                                </td>
                                <td>
                                  {shipment.participants?.find(p => p.type === 'distributor')?.participantId?.name || 'Distributor'}
                                </td>
                                <td>
                                  <span className={`pharma-badge ${
                                    shipment.status === 'processing' ? 'pharma-warning' :
                                    shipment.status === 'in-transit' ? 'pharma-info' :
                                    shipment.status === 'delivered' ? 'pharma-success' :
                                    'pharma-secondary'
                                  }`}>
                                    {shipment.status}
                                  </span>
                                </td>
                                <td className="pharma-actions">
                                  <button 
                                    className="pharma-btn pharma-btn-outline pharma-btn-sm"
                                    onClick={() => handleViewShipment(shipment)}
                                  >
                                    View
                                  </button>
                                  {shipment.status === 'in-transit' && (
                                    <div className="pharma-shipment-actions">
                                      <button 
                                        className="pharma-btn pharma-btn-success pharma-btn-sm"
                                        onClick={() => handleAcceptShipment(shipment._id)}
                                      >
                                        Accept
                                      </button>
                                      <button 
                                        className="pharma-btn pharma-btn-danger pharma-btn-sm"
                                        onClick={() => handleRejectShipment(shipment._id)}
                                      >
                                        Reject
                                      </button>
                                    </div>
                                  )}
                                </td>
                              </tr>
                    
                    {/* Expanded Details */}
                    {selectedShipment?._id === shipment._id && (
                      <tr className="shipment-details-row">
                        <td colSpan="5">
                          <div className="pharma-shipment-details">
                            <div className="pharma-shipment-info">
                              <div>
                                <strong>Status:</strong> 
                                <span className={`pharma-badge ${
                                  shipment.status === 'processing' ? 'pharma-warning' :
                                  shipment.status === 'in-transit' ? 'pharma-info' :
                                  shipment.status === 'delivered' ? 'pharma-success' :
                                  'pharma-secondary'
                                }`}>
                                  {shipment.status}
                                </span>
                              </div>
                              <div>
                                <strong>From:</strong> 
                                {shipment.participants?.find(p => p.type === 'distributor')?.participantId?.name || 'Distributor'}
                              </div>
                              {shipment.estimatedDelivery && (
                                <div>
                                  <strong>Estimated Delivery:</strong> 
                                  {new Date(shipment.estimatedDelivery).toLocaleDateString()}
                                </div>
                              )}
                              {shipment.actualDelivery && (
                                <div>
                                  <strong>Delivered On:</strong> 
                                  {new Date(shipment.actualDelivery).toLocaleDateString()}
                                </div>
                              )}
                            </div>

                            <div className="pharma-shipment-drugs">
                              <h5>Drugs in Shipment</h5>
                              <table className="pharma-data-table">
                                <thead>
                                  <tr>
                                    <th>Name</th>
                                    <th>Batch</th>
                                    <th>Manufacturer</th>
                                    <th>Expiry</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {shipment.drugs?.map(drug => (
                                    <tr key={drug._id}>
                                      <td>{drug.name}</td>
                                      <td>{drug.batch}</td>
                                      <td>{drug.manufacturer?.name || 'Unknown'}</td>
                                      <td>{drug.expiryDate || 'N/A'}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>

                            <div className="pharma-shipment-timeline">
                              <h5>Shipment Timeline</h5>
                              <div className="pharma-timeline">
                                {shipment.participants?.map((participant, index) => (
                                  <div key={index} className="pharma-timeline-event">
                                    <div className="pharma-timeline-dot"></div>
                                    <div className="pharma-timeline-content">
                                      <h6>{participant.type}</h6>
                                      <p>
                                        {participant.actualArrival 
                                          ? `Arrived: ${new Date(participant.actualArrival).toLocaleString()}`
                                          : participant.expectedArrival 
                                            ? `Expected: ${new Date(participant.expectedArrival).toLocaleString()}`
                                            : 'Pending'
                                        }
                                      </p>
                                      <p>Status: {participant.status}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  </div>
)}
         {activeTab === 'inventory' && (
            <div className="pharma-inventory-tab">
              <div className="pharma-card">
                <div className="pharma-card-header">
                  <h5>Drug Inventory Management</h5>
                  <div className="pharma-controls">
                    <div className="pharma-scan-controls">
                      <button 
                        className="pharma-btn-primary"
                        onClick={() => setShowScanner(!showScanner)}
                      >
                        <Camera className="pharma-icon" /> {showScanner ? 'Close Scanner' : 'Open Scanner'}
                      </button>
                      <div className="pharma-input-group">
                        <input 
                          type="text" 
                          placeholder="Enter barcode manually" 
                          value={barcodeInput}
                          onChange={(e) => setBarcodeInput(e.target.value)}
                          onKeyPress={handleManualBarcodeInput}
                        />
                        <button 
                          className="pharma-btn-primary"
                          onClick={() => handleBarcodeScan(barcodeInput)}
                        >
                          <QrCodeScan className="pharma-icon" /> Scan
                        </button>
                      </div>
                    </div>
                    <button className="pharma-btn-outline">
                      <Funnel className="pharma-icon" /> Filters
                    </button>
                  </div>
                </div>

                {showScanner && (
                  <div className="pharma-scanner-container">
                    <Webcam
                      audio={false}
                      ref={webcamRef}
                      screenshotFormat="image/jpeg"
                      className="pharma-scanner"
                    />
                    <button 
                      className="pharma-btn-primary pharma-scan-button"
                      onClick={captureBarcode}
                    >
                      <QrCodeScan className="pharma-icon" /> Capture Barcode
                    </button>
                  </div>
                )}

                {scannedDrug && (
                  <div className={`pharma-scanned-drug ${getDrugStatus(scannedDrug)}`}>
                    <div className="pharma-scanned-drug-header">
                      <h5>{scannedDrug.name}</h5>
                      {getStatusBadge(getDrugStatus(scannedDrug))}
                      <button 
                        className="pharma-btn-icon pharma-close-btn"
                        onClick={() => setScannedDrug(null)}
                      >
                        &times;
                      </button>
                    </div>
                    <div className="pharma-scanned-drug-details">
                      <p><strong>Batch:</strong> {scannedDrug.batch}</p>
                      <p><strong>Barcode:</strong> {scannedDrug.barcode}</p>
                      <p><strong>Manufacturer:</strong> {scannedDrug.manufacturer?.name || 'Unknown'}</p>
                      <p><strong>Expiry:</strong> {new Date(scannedDrug.expiryDate).toLocaleDateString()}</p>
                      <p><strong>Quantity:</strong> {scannedDrug.quantity}</p>
                      {scannedDrug.status === 'recalled' && (
                        <div className="pharma-alert pharma-danger">
                          <ExclamationTriangleFill className="pharma-icon" /> 
                          This drug has been recalled. Please remove from inventory.
                        </div>
                      )}
                      {new Date(scannedDrug.expiryDate) < new Date() && (
                        <div className="pharma-alert pharma-warning">
                          <ExclamationTriangleFill className="pharma-icon" /> 
                          This drug has expired. Please discard.
                        </div>
                      )}
                      {scannedDrug.quantity <= 2 && (
                        <div className="pharma-alert pharma-info">
                          <ExclamationTriangleFill className="pharma-icon" /> 
                          Low stock. Only {scannedDrug.quantity} remaining.
                        </div>
                      )}
                    </div>
                    <div className="pharma-scanned-drug-actions">
                      {getDrugStatus(scannedDrug) === 'recalled' ? (
                        <button 
                          className="pharma-btn pharma-btn-danger"
                          onClick={removeRecalledDrug}
                        >
                          <Trash className="pharma-icon" /> Remove Recalled Drug
                        </button>
                      ) : getDrugStatus(scannedDrug) === 'expired' ? (
                        <button 
                          className="pharma-btn pharma-btn-warning"
                          onClick={reportDrugAsExpired}
                        >
                          <ExclamationTriangleFill className="pharma-icon" /> Report Expired
                        </button>
                      ) : (
                        <button 
                          className="pharma-btn pharma-btn-success"
                          onClick={markDrugAsSold}
                        >
                          <CheckCircleFill className="pharma-icon" /> Mark as Sold
                        </button>
                      )}
                      <button 
                        className="pharma-btn pharma-btn-outline"
                        onClick={() => {
                          setActiveTab('verify');
                          verifyDrug(scannedDrug.barcode);
                        }}
                      >
                        <ShieldCheck className="pharma-icon" /> Verify
                      </button>
                    </div>
                  </div>
                )}

                <div className="pharma-card-body">
                  <table className="pharma-data-table">
                    <thead>
                      <tr>
                        <th>Drug Name</th>
                        <th>Batch</th>
                        <th>Barcode</th>
                        <th>Manufacturer</th>
                        <th>Expiry Date</th>
                        <th>Quantity</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {inventory.map(item => (
                        <tr key={item._id} className={getDrugStatus(item)}>
                          <td>
                            {item.name} 
                            {item.quantity <= 2 && <span className="pharma-badge pharma-warning">Low stock</span>}
                          </td>
                          <td>{item.batch}</td>
                          <td>
                            <OverlayTrigger
                              placement="top"
                              overlay={<Tooltip>Click to scan this barcode</Tooltip>}
                            >
                              <span 
                                className="pharma-barcode"
                                onClick={() => handleBarcodeScan(item.barcode)}
                              >
                                {item.barcode}
                              </span>
                            </OverlayTrigger>
                          </td>
                          <td>{item.manufacturer?.name || 'Unknown'}</td>
                          <td>{new Date(item.expiryDate).toLocaleDateString()}</td>
                          <td>{item.quantity}</td>
                          <td>{getStatusBadge(getDrugStatus(item))}</td>
                          <td className="pharma-actions">
                            <button 
                              className="pharma-btn-icon"
                              onClick={() => handleBarcodeScan(item.barcode)}
                              title="Scan this item"
                            >
                              <QrCodeScan />
                            </button>
                            <button 
                              className="pharma-btn-icon"
                              onClick={() => {
                                setActiveTab('verify');
                                verifyDrug(item.barcode);
                              }}
                              title="Verify on blockchain"
                            >
                              <ShieldCheck />
                            </button>
                             {/* Add the Mark as Sold button here */}
  <button 
    className="pharma-btn-icon"
    onClick={() => markDrugAsSold(item.barcode)}
    title="Mark as sold"
  >
    <CheckCircle />
  </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
         {activeTab === 'verify' && (
  <DrugVerificationGlobal 
    
    getManufacturerName={(manufacturerId) => {
      // You might want to implement this function to get manufacturer names
      // For now returning the ID as a fallback
      return manufacturerId || 'Unknown Manufacturer';
    }}
  />
)}

          {activeTab === 'alerts' && (
           <DrugShortagePrediction/>
          )}
           {/* Shipment Details Modal */}
          {showShipmentModal && (
            <div className='modal' tabIndex="-1" style={{display:'block'}}>
              <div className="modal-dialog modal-lg">
                <div className="modal-content">
                  <Modal.Header closeButton>
                <Modal.Title>Shipment Details - {selectedShipment.trackingNumber}</Modal.Title>
              </Modal.Header>
              <Modal.Body>
                <div className="pharma-shipment-details">
                  <div className="pharma-shipment-info">
                    <div>
                      <strong>Status:</strong> 
                      <span className={`pharma-badge ${
                        selectedShipment.status === 'processing' ? 'pharma-warning' :
                        selectedShipment.status === 'in-transit' ? 'pharma-info' :
                        selectedShipment.status === 'delivered' ? 'pharma-success' :
                        'pharma-secondary'
                      }`}>
                        {selectedShipment.status}
                      </span>
                    </div>
                    <div>
                      <strong>From:</strong> 
                      {selectedShipment.participants?.find(p => p.type === 'distributor')?.participantId?.name || 'Distributor'}
                    </div>
                    {selectedShipment.estimatedDelivery && (
                      <div>
                        <strong>Estimated Delivery:</strong> 
                        {new Date(selectedShipment.estimatedDelivery).toLocaleDateString()}
                      </div>
                    )}
                    {selectedShipment.actualDelivery && (
                      <div>
                        <strong>Delivered On:</strong> 
                        {new Date(selectedShipment.actualDelivery).toLocaleDateString()}
                      </div>
                    )}
                  </div>

                  <div className="pharma-shipment-drugs">
                    <h5>Drugs in Shipment</h5>
                    <table className="pharma-data-table">
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Batch</th>
                          <th>Manufacturer</th>
                          <th>Expiry</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedShipment.drugs?.map(drug => (
                          <tr key={drug._id}>
                            <td>{drug.name}</td>
                            <td>{drug.batch}</td>
                            <td>{drug.manufacturer?.name || 'Unknown'}</td>
                            <td>{drug.expiryDate || 'N/A'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="pharma-shipment-timeline">
                    <h5>Shipment Timeline</h5>
                    <div className="pharma-timeline">
                      {selectedShipment.participants?.map((participant, index) => (
                        <div key={index} className="pharma-timeline-event">
                          <div className="pharma-timeline-dot"></div>
                          <div className="pharma-timeline-content">
                            <h6>{participant.type}</h6>
                            <p>
                              {participant.actualArrival 
                                ? `Arrived: ${new Date(participant.actualArrival).toLocaleString()}`
                                : participant.expectedArrival 
                                  ? `Expected: ${new Date(participant.expectedArrival).toLocaleString()}`
                                  : 'Pending'
                              }
                            </p>
                            <p>Status: {participant.status}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </Modal.Body>
              <Modal.Footer>
                {selectedShipment.status === 'processing' && (
                  <>
                    <Button variant="success" onClick={() => handleAcceptShipment(selectedShipment._id)}>
                      <CheckCircle /> Accept Shipment
                    </Button>
                    <Button variant="danger" onClick={() => handleRejectShipment(selectedShipment._id)}>
                      <XCircle /> Reject Shipment
                    </Button>
                  </>
                )}
                <Button variant="secondary" onClick={handleCloseShipmentModal}> {/* FIX APPLIED HERE */}
                  Close
                </Button>
              </Modal.Footer>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'analytics' && (
  <div className="pharma-analytics-tab">
    <div className="pharma-analytics-row">
      {/* Status Distribution Pie Chart */}
      <div className="pharma-card pharma-chart-card">
        <div className="pharma-card-header">
          <h5>Drug Status Distribution</h5>
        </div>
        <div className="pharma-card-body">
          <Doughnut 
            data={{
              labels: ['In Stock', 'Sold Out', 'Recalled', 'Expired'],
              datasets: [{
                data: [
                  inventory.filter(d => getDrugStatus(d) === 'in_stock').length,
                  inventory.filter(d => getDrugStatus(d) === 'sold').length,
                  inventory.filter(d => getDrugStatus(d) === 'recalled').length,
                  inventory.filter(d => getDrugStatus(d) === 'expired').length
                ],
                backgroundColor: [
                  '#4e73df',  // Blue for in stock
                  '#1cc88a',  // Green for sold
                  '#e74a3b',  // Red for recalled
                  '#f6c23e'   // Yellow for expired
                ],
                borderColor: '#fff',
                borderWidth: 2,
                hoverOffset: 10
              }]
            }}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  position: 'right',
                },
                tooltip: {
                  callbacks: {
                    label: function(context) {
                      const label = context.label || '';
                      const value = context.raw || 0;
                      const total = context.dataset.data.reduce((a, b) => a + b, 0);
                      const percentage = Math.round((value / total) * 100);
                      return `${label}: ${value} (${percentage}%)`;
                    }
                  }
                }
              },
              cutout: '70%'
            }}
          />
        </div>
      </div>

      {/* Expiry Timeline Chart */}
      <div className="pharma-card pharma-chart-card">
        <div className="pharma-card-header">
          <h5>Drugs Expiring in Next 6 Months</h5>
        </div>
        <div className="pharma-card-body">
          <Bar
            data={{
              labels: Array.from({ length: 6 }, (_, i) => {
                const date = new Date();
                date.setMonth(date.getMonth() + i);
                return date.toLocaleString('default', { month: 'short' });
              }),
              datasets: [{
                label: 'Drugs Expiring',
                data: Array.from({ length: 6 }, (_, i) => {
                  const date = new Date();
                  const startMonth = new Date(date.getFullYear(), date.getMonth() + i, 1);
                  const endMonth = new Date(date.getFullYear(), date.getMonth() + i + 1, 0);
                  return inventory.filter(d => {
                    const expiryDate = new Date(d.expiryDate);
                    return expiryDate >= startMonth && expiryDate <= endMonth;
                  }).length;
                }),
                backgroundColor: [
                  '#36b9cc',
                  '#1cc88a',
                  '#6f42c1',
                  '#e83e8c',
                  '#fd7e14',
                  '#20c997'
                ],
                borderRadius: 4,
              }]
            }}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  display: false
                }
              },
              scales: {
                y: {
                  beginAtZero: true,
                  grid: {
                    display: false
                  },
                  title: {
                    display: true,
                    text: 'Number of Drugs',
                    color: '#6c757d'
                  }
                },
                x: {
                  grid: {
                    display: false
                  },
                  title: {
                    display: true,
                    text: 'Month',
                    color: '#6c757d'
                  }
                }
              }
            }}
          />
        </div>
      </div>
    </div>

    <div className="pharma-analytics-row">
      {/* Manufacturer Distribution */}
      <div className="pharma-card pharma-chart-card">
        <div className="pharma-card-header">
          <h5>Top Manufacturers</h5>
        </div>
        <div className="pharma-card-body">
          <Bar
            data={{
              labels: [...new Set(inventory.map(d => d.manufacturer?.name || 'Unknown'))]
                .slice(0, 5),
              datasets: [{
                label: 'Drug Count',
                data: [...new Set(inventory.map(d => d.manufacturer?.name || 'Unknown'))]
                  .map(manufacturer => 
                    inventory.filter(d => (d.manufacturer?.name || 'Unknown') === manufacturer).length
                  )
                  .slice(0, 5),
                backgroundColor: [
                  '#4e73df',
                  '#1cc88a',
                  '#36b9cc',
                  '#f6c23e',
                  '#e74a3b'
                ],
                borderColor: '#fff',
                borderWidth: 1
              }]
            }}
            options={{
              indexAxis: 'y',
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  display: false
                }
              },
              scales: {
                x: {
                  beginAtZero: true,
                  grid: {
                    display: false
                  },
                  title: {
                    display: true,
                    text: 'Number of Drugs',
                    color: '#6c757d'
                  }
                },
                y: {
                  grid: {
                    display: false
                  },
                  title: {
                    display: true,
                    text: 'Manufacturer',
                    color: '#6c757d'
                  }
                }
              }
            }}
          />
        </div>
      </div>

      {/* Stock Status Over Time */}
      <div className="pharma-card pharma-chart-card">
        <div className="pharma-card-header">
          <h5>Stock Levels Trend</h5>
        </div>
        <div className="pharma-card-body">
          <Line
            data={{
              labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
              datasets: [
                {
                  label: 'In Stock',
                  data: Array(12).fill(0).map((_, i) => 
                    Math.floor(Math.random() * 100) + 50 // Replace with actual data
                  ),
                  borderColor: '#4e73df',
                  backgroundColor: 'rgba(78, 115, 223, 0.1)',
                  tension: 0.4,
                  fill: true
                },
                {
                  label: 'Low Stock',
                  data: Array(12).fill(0).map((_, i) => 
                    Math.floor(Math.random() * 20) + 5 // Replace with actual data
                  ),
                  borderColor: '#f6c23e',
                  backgroundColor: 'rgba(246, 194, 62, 0.1)',
                  tension: 0.4,
                  fill: true
                },
                {
                  label: 'Expired',
                  data: Array(12).fill(0).map((_, i) => 
                    Math.floor(Math.random() * 15) // Replace with actual data
                  ),
                  borderColor: '#e74a3b',
                  backgroundColor: 'rgba(231, 74, 59, 0.1)',
                  tension: 0.4,
                  fill: true
                }
              ]
            }}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  position: 'top',
                }
              },
              interaction: {
                intersect: false,
                mode: 'index',
              },
              scales: {
                y: {
                  beginAtZero: true,
                  grid: {
                    display: false
                  },
                  title: {
                    display: true,
                    text: 'Number of Drugs',
                    color: '#6c757d'
                  }
                },
                x: {
                  grid: {
                    display: false
                  },
                  title: {
                    display: true,
                    text: 'Month',
                    color: '#6c757d'
                  }
                }
              }
            }}
          />
        </div>
      </div>
    </div>

    {/* Key Metrics Cards */}
    <div className="pharma-analytics-row">
      <div className="pharma-card pharma-stats-card">
        <div className="pharma-card-header">
          <h5>Inventory Health Metrics</h5>
        </div>
        <div className="pharma-card-body">
          <div className="pharma-stats-grid">
            <div className="pharma-stat-item">
              <div className="pharma-stat-value">{inventory.length}</div>
              <div className="pharma-stat-label">Total Drugs</div>
              <div className="pharma-stat-icon">
                <Capsule className="pharma-icon pharma-primary" />
              </div>
            </div>
            <div className="pharma-stat-item">
              <div className="pharma-stat-value">
                {inventory.filter(d => getDrugStatus(d) === 'in_stock').length}
              </div>
              <div className="pharma-stat-label">In Stock</div>
              <div className="pharma-stat-icon">
                <CheckCircleFill className="pharma-icon pharma-success" />
              </div>
            </div>
            <div className="pharma-stat-item">
              <div className="pharma-stat-value">
                {inventory.filter(d => getDrugStatus(d) === 'expired').length}
              </div>
              <div className="pharma-stat-label">Expired</div>
              <div className="pharma-stat-icon">
                <ExclamationTriangleFill className="pharma-icon pharma-warning" />
              </div>
            </div>
            <div className="pharma-stat-item">
              <div className="pharma-stat-value">
                {inventory.filter(d => getDrugStatus(d) === 'recalled').length}
              </div>
              <div className="pharma-stat-label">Recalled</div>
              <div className="pharma-stat-icon">
                <ExclamationTriangleFill className="pharma-icon pharma-danger" />
              </div>
            </div>
            <div className="pharma-stat-item">
              <div className="pharma-stat-value">
                {inventory.filter(d => d.quantity <= 2).length}
              </div>
              <div className="pharma-stat-label">Low Stock</div>
              <div className="pharma-stat-icon">
                <ClockFill className="pharma-icon pharma-info" />
              </div>
            </div>
            <div className="pharma-stat-item">
              <div className="pharma-stat-value">
                {inventory.length > 0 
                  ? Math.round(inventory.reduce((sum, d) => sum + d.quantity, 0) / inventory.length * 10) / 10
                  : 0}
              </div>
              <div className="pharma-stat-label">Avg. Quantity</div>
              <div className="pharma-stat-icon">
                <Clipboard2Pulse className="pharma-icon pharma-secondary" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
)}


{activeTab === 'stockPlanner' && (
  <div className="pharma-stock-planner-tab">
    <DiseaseInventoryChecker 
      className="disease-inventory-component" inventory={inventory} 
      onClose={() => setActiveTab('dashboard')} 
    />
  </div>
)}
        </div>
      </div>
    </div>
  );
};

export default PharmacyDashboard;