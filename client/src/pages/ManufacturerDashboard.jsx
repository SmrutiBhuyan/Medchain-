import React, { useState, useEffect, useRef } from 'react';
import { FaPills, FaTachometerAlt, FaPlusCircle, FaCapsules, FaTruck, FaChartLine, FaBell, FaCog, FaChevronDown, FaUpload, FaDownload, FaFilter, FaSearch, FaEye, FaPaperPlane, FaChevronLeft, FaChevronRight, FaFileCsv, FaWallet } from 'react-icons/fa';
import { Bar, Pie, Line } from '@ant-design/charts';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { useAuth } from './AuthContext';
import axios from 'axios';
import './ManufacturerDashboard.css';

const ManufacturerDashboard = () => {
  const { user, logout } = useAuth();  
  const [activeTab, setActiveTab] = useState('drug-creation');
  const [activeSubTab, setActiveSubTab] = useState('bulk');
  const [walletAddress, setWalletAddress] = useState(null);
  const [isConnectingWallet, setIsConnectingWallet] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [inventoryDrugs, setInventoryDrugs] = useState([]);
  const [isLoadingInventory, setIsLoadingInventory] = useState(false);

  const [previewData, setPreviewData] = useState([]);
  const [shipmentDrugs, setShipmentDrugs] = useState([]);
const [selectedDrugs, setSelectedDrugs] = useState([]);
const [distributors, setDistributors] = useState([]);
const [isLoadingShipmentData, setIsLoadingShipmentData] = useState(false);
const [shipmentForm, setShipmentForm] = useState({
  distributor: '',
  deliveryDate: '',
  notes: ''
});
const [dashboardStats, setDashboardStats] = useState({
  totalDrugs: 0,
  activeShipments: 0,
  nearExpiry: 0,
  drugVolume: [],
  shipmentsOverTime: []
});
const [isLoadingStats, setIsLoadingStats] = useState(false);

 
const fetchDashboardStats = async () => {
  setIsLoadingStats(true);
  try {
    const token = localStorage.getItem('token');
    console.log('Token:', token); // Debugging
    
    if (!token) {
      console.error('No authentication token found');
      logout(); // Call logout to clear invalid session
      return;
    }

    const response = await axios.get('http://localhost:5000/api/dashboard/stats', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    if (response.data.success) {
      setDashboardStats(response.data.stats);
    }
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    if (error.response?.status === 401) {
      console.error('Session expired, please log in again');
      logout(); // Call logout when token is invalid
    }
  } finally {
    setIsLoadingStats(false);
  }
};
  const shipmentsData = [
    { id: 'SH-2023-001', drugs: '3 drugs (250 units)', distributor: 'MediDistributors Inc.', status: 'delivered', date: '2023-05-15' },
    { id: 'SH-2023-002', drugs: '2 drugs (180 units)', distributor: 'PharmaChain LLC', status: 'in-transit', date: '2023-06-02' },
    { id: 'SH-2023-003', drugs: '5 drugs (420 units)', distributor: 'HealthPlus Distributors', status: 'processing', date: '2023-06-18' },
    { id: 'SH-2023-004', drugs: '1 drug (75 units)', distributor: 'Global Pharma Logistics', status: 'cancelled', date: '2023-07-05' },
  ];

  const nearExpiryData = [
    { name: 'Amoxicillin 250mg', batch: 'BATCH-2023-003', expiry: '2024-09-04', days: 408, stock: '500 units', status: 'monitor' },
    { name: 'Loratadine 10mg', batch: 'BATCH-2023-006', expiry: '2024-10-15', days: 449, stock: '300 units', status: 'monitor' },
    { name: 'Ciprofloxacin 500mg', batch: 'BATCH-2023-007', expiry: '2024-11-20', days: 485, stock: '200 units', status: 'monitor' },
  ];

  // Form state
  const [drugForm, setDrugForm] = useState({
    name: '',
    batch: '',
    quantity: '',
    mfgDate: '',
    expiryDate: '',
    barcode: ''
  });

  const parseCSV = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        try {
          const csvData = event.target.result;
          const lines = csvData.split('\n').filter(line => line.trim() !== '');
          
          if (lines.length < 2) {
            resolve([]);
            return;
          }
  
          const headers = lines[0].split(',').map(header => 
            header.trim().toLowerCase().replace(/\s+/g, '')
          );
          
          const result = [];
          
          for (let i = 1; i < lines.length; i++) {
            const currentLine = lines[i].split(',');
            const obj = {};
            
            for (let j = 0; j < headers.length; j++) {
              if (currentLine[j]) {
                obj[headers[j]] = currentLine[j].trim();
              }
            }
            
            // Ensure we have all required fields
            if (obj.drugname || obj.name) {
              result.push({
                name: obj.drugname || obj.name,
                batch: obj.batchnumber || obj.batch,
                quantity: obj.quantity,
                mfgDate: obj.manufacturingdate || obj.mfgdate || obj.mfgdate,
                expiryDate: obj.expirydate || obj.expirydate,
                barcode: obj.barcode || ''
              });
            }
          }
          
          resolve(result);
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = (error) => reject(error);
      reader.readAsText(file);
    });
  };
  // File upload state
  const [fileUploadState, setFileUploadState] = useState({
    isDragging: false,
    file: null
  });

  // Barcode Scanner Component
  const BarcodeScanner = ({ onScan }) => {
    const scannerRef = useRef(null);
  
    useEffect(() => {
      const scanner = new Html5QrcodeScanner('barcode-scanner', {
        fps: 10,
        qrbox: 250
      }, false);
  
      scanner.render((decodedText) => {
        onScan(decodedText);
        scanner.clear();
      });
  
      scannerRef.current = scanner;
  
      return () => {
        if (scannerRef.current) {
          scannerRef.current.clear();
        }
      };
    }, [onScan]);
  
    return <div id="barcode-scanner" style={{ width: '100%' }}></div>;
  };

  const handleScan = (barcode) => {
    setDrugForm(prev => ({ ...prev, barcode }));
    setShowScanner(false);
  };

  // Function to connect wallet (simulated)
  const connectWallet = async () => {
    setIsConnectingWallet(true);
    try {
      // In a real app, this would connect to MetaMask or another wallet provider
      // For simulation, we'll use a timeout and mock address
      await new Promise(resolve => setTimeout(resolve, 1000));
      const mockAddress = '0x71C7656EC7ab88b098defB751B7401B5f6d8976F';
      setWalletAddress(mockAddress);
    } catch (error) {
      console.error('Wallet connection error:', error);
    } finally {
      setIsConnectingWallet(false);
    }
  };

  const disconnectWallet = () => {
    setWalletAddress(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setDrugForm(prev => ({ ...prev, [name]: value }));
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setFileUploadState(prev => ({ ...prev, isDragging: true }));
  };

  const handleDragLeave = () => {
    setFileUploadState(prev => ({ ...prev, isDragging: false }));
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setFileUploadState({
      isDragging: false,
      file: e.dataTransfer.files[0]
    });
  };

  const handleFileUpload = async (file) => {
    try {
      const formData = new FormData();
      formData.append('csvFile', file);
      formData.append('manufacturerId', user._id);
  
      const response = await axios.post('http://localhost:5000/api/drugs/upload-csv', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
  
      if (response.data.success) {
        alert(`Successfully imported ${response.data.importedCount} drugs`);
        if (response.data.errorCount > 0) {
          alert(`There were ${response.data.errorCount} errors during import`);
          console.log('Import errors:', response.data.errors);
        }
        setFileUploadState({
          isDragging: false,
          file: null
        });
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert(`Upload failed: ${error.response?.data?.error || error.message}`);
    }
  };

  const handleConfirmUpload = async () => {
    try {
      // Transform data to match backend expectations if needed
      const formattedData = previewData.map(drug => ({
        name: drug.drugname || drug.name,
        batch: drug.batchnumber || drug.batch,
        quantity: drug.quantity,
        mfgDate: drug.manufacturingdate || drug.mfgdate || drug.mfgDate,
        expiryDate: drug.expirydate || drug.expiryDate,
        barcode: drug.barcode
      }));
  
      const response = await axios.post('http://localhost:5000/api/drugs/bulk-create', {
        drugs: formattedData,
        manufacturerId: user._id
      });
  
      if (response.data.success) {
        alert(`Successfully created ${response.data.createdCount} drugs`);
        setPreviewData([]); // Clear preview after successful upload
      }
    } catch (error) {
      console.error('Bulk creation error:', error);
      alert(error.response?.data?.error || 'Failed to create drugs');
    }
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:5000/api/drugs/create', {
        ...drugForm,
        manufacturerId: user._id
      });
  
      if (response.data.success) {
        alert(`Drug ${response.data.drug.name} created successfully!`);
        // Add to preview data
        setPreviewData(prev => [...prev, drugForm]);
        setDrugForm({
          name: '',
          batch: '',
          quantity: '',
          mfgDate: '',
          expiryDate: '',
          barcode: ''
        });
      }
    } catch (error) {
      console.error('Creation error:', error);
      alert(error.response?.data?.error || 'Failed to create drug');
    }
  };
  // Status badge component
  const StatusBadge = ({ status }) => {
    const statusMap = {
      'in-stock': { class: 'status-in-stock', text: 'In Stock' },
      'shipped': { class: 'status-shipped', text: 'Shipped' },
      'recalled': { class: 'status-recalled', text: 'Recalled' },
      'expired': { class: 'status-expired', text: 'Expired' },
      'delivered': { class: 'badge-success', text: 'Delivered' },
      'in-transit': { class: 'badge-primary', text: 'In Transit' },
      'processing': { class: 'badge-warning', text: 'Processing' },
      'cancelled': { class: 'badge-danger', text: 'Cancelled' },
      'monitor': { class: 'badge-warning', text: 'Monitor' }
    };

    return (
      <span className={`status-badge ${statusMap[status]?.class || ''}`}>
        {statusMap[status]?.text || status}
      </span>
    );
  };

  const fetchManufacturerDrugs = async () => {
  setIsLoadingInventory(true);
  try {
    const response = await axios.get(`http://localhost:5000/api/drugs/manufacturer/${user._id}`);
    console.log(response.data.drugs);
    
    setInventoryDrugs(response.data.drugs);
  } catch (error) {
    console.error('Error fetching drugs:', error);
    alert('Failed to load inventory data');
  } finally {
    setIsLoadingInventory(false);
  }
};

useEffect(() => {
  console.log("Inside inventory");  
  if (activeTab === 'inventory' && user?._id) {
    fetchManufacturerDrugs();
  }
}, [activeTab, user?._id]);


const fetchShipmentData = async () => {
  setIsLoadingShipmentData(true);
  try {
    // Fetch manufacturer's drugs
    const drugsResponse = await axios.get(`http://localhost:5000/api/drugs/manufacturer/${user._id}?status=in-stock`);
    setShipmentDrugs(drugsResponse.data.drugs);
    
    // Fetch distributors
    const distributorsResponse = await axios.get('http://localhost:5000/api/users/distributors');
    setDistributors(distributorsResponse.data.distributors);
  } catch (error) {
    console.error('Error fetching shipment data:', error);
    alert('Failed to load shipment data');
  } finally {
    setIsLoadingShipmentData(false);
  }
};

const handleShipmentInputChange = (e) => {
  const { name, value } = e.target;
  setShipmentForm(prev => ({ ...prev, [name]: value }));
};

const handleDrugSelection = (drugId, isSelected) => {
  setSelectedDrugs(prev => 
    isSelected 
      ? [...prev, drugId] 
      : prev.filter(id => id !== drugId)
  );
};

const handleShipmentSubmit = async (e) => {
  e.preventDefault();
  try {
    if (selectedDrugs.length === 0) {
      alert('Please select at least one drug to ship');
      return;
    }

    if (!shipmentForm.distributor) {
      alert('Please select a distributor');
      return;
    }

    const config = {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    };

    const requestBody = {
      drugs: selectedDrugs,
      distributorId: shipmentForm.distributor,
      manufacturerId: user._id,
      estimatedDelivery: shipmentForm.deliveryDate,
      notes: shipmentForm.notes
    };

    console.log('Sending shipment request:', requestBody); // Add this for debugging

    const response = await axios.post(
      'http://localhost:5000/api/shipments/create',
      requestBody,
      config
    );

    if (response.data.success) {
      alert('Shipment created successfully!');
      // Reset form
      setSelectedDrugs([]);
      setShipmentForm({
        distributor: '',
        deliveryDate: '',
        notes: ''
      });
      // Refresh data
      fetchShipmentData();
    }
  } catch (error) {
    console.error('Shipment creation error:', error);
    console.error('Error response:', error.response); // Add this for debugging
    alert(error.response?.data?.error || 'Failed to create shipment');
  }
};
// Call this when shipment tab is activated
useEffect(() => {
  if (activeTab === 'shipment' && user?._id) {
    fetchShipmentData();
  }
}, [activeTab, user?._id]);

useEffect(() => {
  if (activeTab === 'dashboard' && user?._id) {
    fetchDashboardStats();
  }
}, [activeTab, user?._id]);

  return (
    <div className="dashboard">
      {/* Sidebar */}
      <div className="sidebar">
        <div className="logo">
          <FaPills />
          <h1>PharmaTrack</h1>
        </div>
        <div className="nav-menu">
          <a href="#" className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
            <FaTachometerAlt />
            <span>Dashboard</span>
          </a>
          <a href="#" className={`nav-item ${activeTab === 'drug-creation' ? 'active' : ''}`} onClick={() => setActiveTab('drug-creation')}>
            <FaPlusCircle />
            <span>Create Drugs</span>
          </a>
          <a href="#" className={`nav-item ${activeTab === 'inventory' ? 'active' : ''}`} onClick={() => setActiveTab('inventory')}>
            <FaCapsules />
            <span>Your Drugs</span>
          </a>
          <a href="#" className={`nav-item ${activeTab === 'shipment' ? 'active' : ''}`} onClick={() => setActiveTab('shipment')}>
            <FaTruck />
            <span>Shipments</span>
          </a>
          <a href="#" className={`nav-item ${activeTab === 'analytics' ? 'active' : ''}`} onClick={() => setActiveTab('analytics')}>
            <FaChartLine />
            <span>Analytics</span>
          </a>
          <a href="#" className={`nav-item ${activeTab === 'recalls' ? 'active' : ''}`} onClick={() => setActiveTab('recalls')}>
            <FaBell />
            <span>Recalls</span>
          </a>
          <a href="#" className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>
            <FaCog />
            <span>Settings</span>
          </a>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        <div className="header">
          <h1 className="page-title">Manufacturer Dashboard</h1>
          <div className="user-profile">
            <div className="user-avatar">
              {user?.name?.split(' ').map(n => n[0]).join('')}
            </div>
            <span>{user?.name || 'User'}</span>
            {/* Wallet connection status */}
            {walletAddress ? (
              <div className="wallet-connected">
                <span className="wallet-address">
                  {`${walletAddress.substring(0, 6)}...${walletAddress.substring(walletAddress.length - 4)}`}
                </span>
                <button 
                  onClick={disconnectWallet}
                  className="btn btn-small btn-outline"
                  style={{ marginLeft: '10px' }}
                >
                  Disconnect
                </button>
              </div>
            ) : (
              <button 
                onClick={connectWallet}
                className="btn btn-small btn-primary"
                disabled={isConnectingWallet}
                style={{ marginLeft: '10px' }}
              >
                {isConnectingWallet ? 'Connecting...' : (
                  <>
                    <FaWallet /> Connect Wallet
                  </>
                )}
              </button>
            )}
             <button 
    onClick={() => logout()}
    className="btn btn-small btn-danger"
    style={{ marginLeft: '10px' }}
  >
    Logout
  </button>
            <FaChevronDown />
          </div>
        </div>

        {/* Stats Cards - Only shown on dashboard tab */}
       {activeTab === 'dashboard' && (
  <div className="grid">
    <div className="stats-card">
      <div className="icon primary">
        <FaCapsules />
      </div>
      <h3>{isLoadingStats ? '...' : dashboardStats.totalDrugs.toLocaleString()}</h3>
      <p>Total Drugs</p>
    </div>
    <div className="stats-card">
      <div className="icon success">
        <FaTruck />
      </div>
      <h3>{isLoadingStats ? '...' : dashboardStats.activeShipments}</h3>
      <p>Active Shipments</p>
    </div>
    <div className="stats-card">
      <div className="icon warning">
        <FaBell />
      </div>
      <h3>{isLoadingStats ? '...' : dashboardStats.nearExpiry}</h3>
      <p>Near Expiry</p>
    </div>
    <div className="stats-card">
      <div className="icon danger">
        <FaBell />
      </div>
      <h3>0</h3> {/* Placeholder for recalled batches */}
      <p>Recalled Batches</p>
    </div>
  </div>
)}
        {/* Tabs for Main Sections */}
        <div className="tabs">
          <div className={`tab ${activeTab === 'drug-creation' ? 'active' : ''}`} onClick={() => setActiveTab('drug-creation')}>Drug Creation</div>
          <div className={`tab ${activeTab === 'inventory' ? 'active' : ''}`} onClick={() => setActiveTab('inventory')}>Your Drugs</div>
          <div className={`tab ${activeTab === 'shipment' ? 'active' : ''}`} onClick={() => setActiveTab('shipment')}>Create Shipment</div>
          <div className={`tab ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>Shipment History</div>
          <div className={`tab ${activeTab === 'analytics' ? 'active' : ''}`} onClick={() => setActiveTab('analytics')}>Analytics</div>
        </div>

        {/* Drug Creation Tab */}
        {activeTab === 'drug-creation' && (
          <>
            <div className="card">
              <div className="card-header">
                <h2 className="card-title">Create New Drugs</h2>
              </div>
              <div className="tabs">
                <div className={`tab ${activeSubTab === 'bulk' ? 'active' : ''}`} onClick={() => setActiveSubTab('bulk')}>Bulk Upload</div>
                <div className={`tab ${activeSubTab === 'manual' ? 'active' : ''}`} onClick={() => setActiveSubTab('manual')}>Manual Entry</div>
              </div>
              
              {activeSubTab === 'bulk' && (
  <div className="tab-subcontent active" id="bulk">
    <div 
      className={`file-upload ${fileUploadState.isDragging ? 'dragging' : ''}`} 
      id="csv-upload"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => document.getElementById('csv-file-input').click()}
    >
      <FaFileCsv />
      <p>Drag & drop your CSV file here</p>
      <p>or</p>
      <input
  type="file"
  id="csv-file-input"
  accept=".csv"
  style={{ display: 'none' }}
  onChange={async (e) => {
    if (e.target.files.length > 0) {
      const file = e.target.files[0];
      setFileUploadState({
        isDragging: false,
        file
      });
      
      try {
        const parsedData = await parseCSV(file);
        setPreviewData(parsedData);
      } catch (error) {
        console.error('Error parsing CSV:', error);
        alert('Error parsing CSV file. Please check the format.');
      }
    }
  }}
/>
      <button 
        className="btn btn-primary"
        onClick={(e) => {
          e.stopPropagation();
          document.getElementById('csv-file-input').click();
        }}
      >
        <FaUpload /> Browse Files
      </button>
      <small>CSV template: Drug Name, Batch Number, Quantity, Manufacturing Date, Expiry Date</small>
      
      {fileUploadState.file && (
  <div className="file-info">
    <p>Selected file: {fileUploadState.file.name}</p>
    <button 
      className="btn btn-primary"
      onClick={() => handleFileUpload(fileUploadState.file)}
    >
      Upload File
    </button>
  </div>
)}
    </div>
  </div>
)}
              {activeSubTab === 'manual' && (
                <div className="tab-subcontent active" id="manual">
                  <form onSubmit={handleManualSubmit}>
                    <div className="form-group">
                      <label className="form-label">Drug Name*</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        placeholder="Enter drug name"
                        name="name"
                        value={drugForm.name}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                      <div className="form-group">
                        <label className="form-label">Batch Number*</label>
                        <input 
                          type="text" 
                          className="form-control" 
                          placeholder="Enter batch number"
                          name="batch"
                          value={drugForm.batch}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Quantity*</label>
                        <input 
                          type="number" 
                          className="form-control" 
                          placeholder="Enter quantity"
                          name="quantity"
                          value={drugForm.quantity}
                          onChange={handleInputChange}
                          min="1"
                          required
                        />
                      </div>
                    </div>
                    <div className="grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                      <div className="form-group">
                        <label className="form-label">Manufacturing Date*</label>
                        <input 
                          type="date" 
                          className="form-control"
                          name="mfgDate"
                          value={drugForm.mfgDate}
                          onChange={handleInputChange}
                          max={new Date().toISOString().split('T')[0]}
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Expiry Date*</label>
                        <input 
                          type="date" 
                          className="form-control"
                          name="expiryDate"
                          value={drugForm.expiryDate}
                          onChange={handleInputChange}
                          min={drugForm.mfgDate || new Date().toISOString().split('T')[0]}
                          required
                        />
                      </div>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Barcode (leave blank for auto-generation)</label>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <input 
                          type="text" 
                          className="form-control" 
                          placeholder="Enter custom barcode"
                          name="barcode"
                          value={drugForm.barcode}
                          onChange={handleInputChange}
                          pattern="[A-Za-z0-9-]+"
                          title="Only letters, numbers and hyphens allowed"
                        />
                        <button 
                          type="button" 
                          className="btn btn-outline"
                          onClick={() => setShowScanner(!showScanner)}
                        >
                          {showScanner ? 'Cancel Scan' : 'Scan Barcode'}
                        </button>
                      </div>
                      {showScanner && <BarcodeScanner onScan={handleScan} />}
                    </div>
                    <div className="form-actions">
                      <button 
                        type="button" 
                        className="btn btn-outline"
                        onClick={() => setDrugForm({
                          name: '',
                          batch: '',
                          quantity: '',
                          mfgDate: '',
                          expiryDate: '',
                          barcode: ''
                        })}
                      >
                        Clear
                      </button>
                      <button 
                        type="submit" 
                        className="btn btn-primary"
                        disabled={!drugForm.name || !drugForm.batch || !drugForm.quantity || !drugForm.mfgDate || !drugForm.expiryDate}
                      >
                        <FaPlusCircle /> Create Drug
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>

            <div className="table-responsive">
  <table>
    <thead>
      <tr>
        <th>Drug Name</th>
        <th>Batch No.</th>
        <th>Quantity</th>
        <th>Mfg. Date</th>
        <th>Exp. Date</th>
        <th>Barcode</th>
      </tr>
    </thead>
    <tbody>
      {previewData.map((drug, index) => (
        <tr key={index}>
          <td>{drug.name || 'N/A'}</td>
          <td>{drug.batch || 'N/A'}</td>
          <td>{drug.quantity || 'N/A'}</td>
          <td>{drug.mfgDate || 'N/A'}</td>
          <td>{drug.expiryDate || 'N/A'}</td>
          <td>{drug.barcode || 'Auto-generate'}</td>
        </tr>
      ))}
      {previewData.length === 0 && (
        <tr>
          <td colSpan="6" style={{ textAlign: 'center', color: 'var(--gray)' }}>
            No drugs to preview. Add drugs manually or upload a CSV file.
          </td>
        </tr>
      )}
    </tbody>
  </table>
</div>
          </>
        )}

        {/* Inventory Tab */}
        {activeTab === 'inventory' && (
  <div className="card">
    <div className="card-header">
      <h2 className="card-title">Your Drug Inventory</h2>
      <div className="card-actions">
        <button className="btn btn-outline">
          <FaFilter /> Filters
        </button>
        <button className="btn btn-outline">
          <FaDownload /> Export
        </button>
      </div>
    </div>
    <div className="search-bar">
      <input type="text" placeholder="Search drugs..." />
      <button><FaSearch /></button>
    </div>
    <div className="table-responsive">
      <table>
        <thead>
          <tr>
            <th>Drug Name</th>
            <th>Barcode</th>
            <th>Batch No.</th>
            <th>Status</th>
            <th>Expiry Date</th>
            <th>Current Holder</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {isLoadingInventory ? (
            <tr>
              <td colSpan="7" style={{ textAlign: 'center' }}>
                Loading inventory...
              </td>
            </tr>
          ) : inventoryDrugs.length > 0 ? (
            inventoryDrugs.map(drug => (
              <tr key={drug._id}>
                <td>{drug.name}</td>
                <td>{drug.barcode}</td>
                <td>{drug.batch}</td>
                <td><StatusBadge status={drug.status} /></td>
                <td>{new Date(drug.expiryDate).toLocaleDateString()}</td>
                <td>{drug.currentHolder || 'Your Facility'}</td>
                <td>
                  <button className="btn btn-outline" style={{ padding: '0.25rem 0.5rem' }}>
                    <FaEye />
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="7" style={{ textAlign: 'center' }}>
                No drugs found in your inventory
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
    <div className="pagination">
      <button><FaChevronLeft /></button>
      <button className="active">1</button>
      <button>2</button>
      <button>3</button>
      <button><FaChevronRight /></button>
    </div>
  </div>
)}

        {/* Create Shipment Tab */}
        {activeTab === 'shipment' && (
  <div className="card">
    <div className="card-header">
      <h2 className="card-title">Create New Shipment</h2>
    </div>
    <form onSubmit={handleShipmentSubmit}>
      <div className="form-group">
        <label className="form-label">Select Drugs to Ship</label>
        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th width="50px"></th>
                <th>Drug Name</th>
                <th>Batch No.</th>
                <th>Barcode</th>
                <th>Expiry Date</th>
                <th>Current Stock</th>
              </tr>
            </thead>
            <tbody>
              {isLoadingShipmentData ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center' }}>
                    Loading drugs...
                  </td>
                </tr>
              ) : shipmentDrugs.length > 0 ? (
                shipmentDrugs.map(drug => (
                  <tr key={drug._id}>
                    <td>
                      <input 
                        type="checkbox" 
                        checked={selectedDrugs.includes(drug._id)}
                        onChange={(e) => handleDrugSelection(drug._id, e.target.checked)}
                      />
                    </td>
                    <td>{drug.name}</td>
                    <td>{drug.batch}</td>
                    <td>{drug.barcode}</td>
                    <td>{new Date(drug.expiryDate).toLocaleDateString()}</td>
                    <td>{drug.quantity} units</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center' }}>
                    No drugs available for shipment
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      <div className="grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
        <div className="form-group">
          <label className="form-label">Select Distributor</label>
          <select 
            className="form-control"
            name="distributor"
            value={shipmentForm.distributor}
            onChange={handleShipmentInputChange}
            required
          >
            <option value="">-- Select Distributor --</option>
            {distributors.map(distributor => (
              <option key={distributor._id} value={distributor._id}>
                {distributor.organization || distributor.name}
              </option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Estimated Delivery Date</label>
          <input 
            type="date" 
            className="form-control" 
            name="deliveryDate"
            value={shipmentForm.deliveryDate}
            onChange={handleShipmentInputChange}
            min={new Date().toISOString().split('T')[0]}
          />
        </div>
      </div>
      <div className="form-group">
        <label className="form-label">Shipping Notes</label>
        <textarea 
          className="form-control" 
          rows="3" 
          placeholder="Any special instructions..."
          name="notes"
          value={shipmentForm.notes}
          onChange={handleShipmentInputChange}
        ></textarea>
      </div>
      <div className="card" style={{ backgroundColor: '#f8f9ff', marginTop: '1.5rem' }}>
        <div className="card-header">
          <h3 className="card-title">Shipment Summary</h3>
        </div>
        <div style={{ padding: '1rem' }}>
          <p><strong>Selected Drugs:</strong> {selectedDrugs.length}</p>
          <p><strong>Total Units:</strong> {
            shipmentDrugs
              .filter(drug => selectedDrugs.includes(drug._id))
              .reduce((sum, drug) => sum + drug.quantity, 0)
          }</p>
          <p><strong>Distributor:</strong> {
            shipmentForm.distributor 
              ? distributors.find(d => d._id === shipmentForm.distributor)?.organization 
              : 'Not selected'
          }</p>
        </div>
      </div>
      <button type="submit" className="btn btn-primary" style={{ marginTop: '1.5rem' }}>
        <FaPaperPlane /> Create Shipment
      </button>
    </form>
  </div>
)}

        {/* Shipment History Tab */}
        {activeTab === 'history' && (
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Shipment History</h2>
              <div className="card-actions">
                <button className="btn btn-outline">
                  <FaFilter /> Filters
                </button>
                <button className="btn btn-outline">
                  <FaDownload /> Export
                </button>
              </div>
            </div>
            <div className="search-bar">
              <input type="text" placeholder="Search shipments..." />
              <button><FaSearch /></button>
            </div>
            <div className="table-responsive">
              <table>
                <thead>
                  <tr>
                    <th>Shipment ID</th>
                    <th>Drugs Included</th>
                    <th>Distributor</th>
                    <th>Status</th>
                    <th>Date Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {shipmentsData.map(shipment => (
                    <tr key={shipment.id}>
                      <td>{shipment.id}</td>
                      <td>{shipment.drugs}</td>
                      <td>{shipment.distributor}</td>
                      <td><StatusBadge status={shipment.status} /></td>
                      <td>{shipment.date}</td>
                      <td>
                        <button className="btn btn-outline" style={{ padding: '0.25rem 0.5rem' }}>
                          <FaEye />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="pagination">
              <button><FaChevronLeft /></button>
              <button className="active">1</button>
              <button>2</button>
              <button>3</button>
              <button><FaChevronRight /></button>
            </div>
          </div>
        )}

        {/* Analytics Tab */}
  {/* Analytics Tab */}
{activeTab === 'analytics' && (
  <>
    <div className="grid" style={{ gridTemplateColumns: '2fr 1fr' }}>
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Drug Volume by Batch</h2>
          <div className="card-actions">
            <select className="form-control" style={{ width: 'auto', display: 'inline-block' }}>
              <option>Last 30 Days</option>
              <option>Last 90 Days</option>
              <option>This Year</option>
            </select>
          </div>
        </div>
        <div className="chart-container">
          {dashboardStats.drugVolume && dashboardStats.drugVolume.length > 0 ? (
            <Bar
              data={dashboardStats.drugVolume}
              xField="drugName"
              yField="totalQuantity"
              seriesField="drugName"
              height={400}
              legend={{
                position: 'top-right',
              }}
              xAxis={{
                label: {
                  autoRotate: false,
                },
              }}
              yAxis={{
                label: {
                  formatter: (v) => `${v} units`,
                },
              }}
            />
          ) : (
            <p style={{ color: 'var(--gray)', textAlign: 'center', padding: '2rem' }}>
              No drug volume data available
            </p>
          )}
        </div>
      </div>
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Drug Types Distribution</h2>
        </div>
        <div className="chart-container">
          {dashboardStats.drugVolume && dashboardStats.drugVolume.length > 0 ? (
            <Pie
              data={dashboardStats.drugVolume}
              angleField="totalQuantity"
              colorField="drugName"
              radius={0.8}
              height={400}
              label={{
                type: 'outer',
                content: '{name}: {percentage}',
              }}
              legend={{
                position: 'bottom',
              }}
              interactions={[
                {
                  type: 'element-active',
                },
              ]}
            />
          ) : (
            <p style={{ color: 'var(--gray)', textAlign: 'center', padding: '2rem' }}>
              No drug type data available
            </p>
          )}
        </div>
      </div>
    </div>
    <div className="card">
      <div className="card-header">
        <h2 className="card-title">Shipments Over Time</h2>
        <div className="card-actions">
          <select className="form-control" style={{ width: 'auto', display: 'inline-block' }}>
            <option>Last 30 Days</option>
            <option>Last 90 Days</option>
            <option>This Year</option>
          </select>
        </div>
      </div>
      <div className="chart-container">
        {dashboardStats.shipmentsOverTime && dashboardStats.shipmentsOverTime.length > 0 ? (
          <Line
            data={dashboardStats.shipmentsOverTime}
            xField="_id"
            yField="count"
            height={400}
            point={{
              size: 5,
              shape: 'diamond',
            }}
            xAxis={{
              label: {
                autoRotate: false,
              },
            }}
            yAxis={{
              label: {
                formatter: (v) => `${v} shipments`,
              },
            }}
            tooltip={{
              formatter: (datum) => {
                return { name: 'Shipments', value: datum.count };
              },
            }}
          />
        ) : (
          <p style={{ color: 'var(--gray)', textAlign: 'center', padding: '2rem' }}>
            No shipment data available
          </p>
        )}
      </div>
    </div>
  </>
)}

      </div>
    </div>
  );
};

export default ManufacturerDashboard;