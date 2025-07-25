import React, { useState, useEffect, useRef } from 'react';
import { FaPills, FaTachometerAlt, FaPlusCircle, FaCapsules, FaTruck, FaChartLine, FaBell, FaCog, FaChevronDown, FaUpload, FaDownload, FaFilter, FaSearch, FaEye, FaPaperPlane, FaChevronLeft, FaChevronRight, FaFileCsv, FaWallet } from 'react-icons/fa';
import { Bar } from '@ant-design/charts';
import { Html5Qrcode, Html5QrcodeScanner, Html5QrcodeSupportedFormats, Html5QrcodeScanType } from 'html5-qrcode';
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
  const [scanningStatus, setScanningStatus] = useState('idle'); // 'idle', 'scanning', 'success', 'error'
  const [shipmentsData, setShipmentsData] = useState([]);

  const [showShipmentsModal, setShowShipmentsModal] = useState(false);
const [manufacturerShipments, setManufacturerShipments] = useState([]);
const [isLoadingShipments, setIsLoadingShipments] = useState(false);


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
// Add default values to dashboardStats state
const [dashboardStats, setDashboardStats] = useState({
  totalDrugs: 0,
  activeShipments: 0,
  nearExpiry: 0,
  recalledBatches: 0,
  drugVolume: [],
  shipmentsOverTime: [],
  statusDistribution: [],
  upcomingExpirations: [],
  topDistributors: []
});
const [isLoadingStats, setIsLoadingStats] = useState(false);

const UnitBarcodeInput = ({ quantity, barcodes = [], onBarcodesChange }) => {
  const [localBarcodes, setLocalBarcodes] = useState(Array(quantity).fill(''));
  const [scanningIndex, setScanningIndex] = useState(null);
  const [scanningStatus, setScanningStatus] = useState(Array(quantity).fill('idle')); // 'idle', 'scanning', 'success', 'error'
  const inputRefs = useRef([]);

  // Initialize localBarcodes with any provided barcodes
  useEffect(() => {
    inputRefs.current = inputRefs.current.slice(0, quantity);
    const initialBarcodes = Array(quantity).fill('');
    if (barcodes && barcodes.length > 0) {
      barcodes.forEach((barcode, index) => {
        if (index < quantity) {
          initialBarcodes[index] = barcode;
        }
      });
    }
    setLocalBarcodes(initialBarcodes);
  }, [quantity, barcodes]);

  const handleBarcodeChange = (index, value) => {
    const newBarcodes = [...localBarcodes];
    newBarcodes[index] = value;
    setLocalBarcodes(newBarcodes);
    onBarcodesChange(newBarcodes);
    
    // Auto-focus next input if not last one and value entered
    if (value && index < quantity - 1) {
      setTimeout(() => {
        inputRefs.current[index + 1]?.focus();
      }, 10);
    }
  };

  const handleScanSuccess = (barcode) => {
    if (scanningIndex !== null) {
      const newBarcodes = [...localBarcodes];
      newBarcodes[scanningIndex] = barcode;
      setLocalBarcodes(newBarcodes);
      onBarcodesChange(newBarcodes);
      
      // Update scanning status
      const newStatus = [...scanningStatus];
      newStatus[scanningIndex] = 'success';
      setScanningStatus(newStatus);
      
      // Reset status after delay
      setTimeout(() => {
        const resetStatus = [...scanningStatus];
        resetStatus[scanningIndex] = 'idle';
        setScanningStatus(resetStatus);
        setScanningIndex(null);
      }, 1000);
    }
  };

  const handleStartScan = (index) => {
    const newStatus = [...scanningStatus];
    newStatus[index] = 'scanning';
    setScanningStatus(newStatus);
    setScanningIndex(index);
  };

  const handleScanError = () => {
    if (scanningIndex !== null) {
      const newStatus = [...scanningStatus];
      newStatus[scanningIndex] = 'error';
      setScanningStatus(newStatus);
      
      setTimeout(() => {
        const resetStatus = [...scanningStatus];
        resetStatus[scanningIndex] = 'idle';
        setScanningStatus(resetStatus);
        setScanningIndex(null);
      }, 2000);
    }
  };

  return (
    <div className="unit-barcodes-container">
      <h4>Unit Barcodes</h4>
      <div className="unit-barcodes-grid">
        {localBarcodes.map((barcode, index) => (
          <div key={index} className="unit-barcode-input">
            <label>Unit {index + 1}</label>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <input
                ref={el => inputRefs.current[index] = el}
                type="text"
                value={barcode}
                onChange={(e) => handleBarcodeChange(index, e.target.value)}
                placeholder="Leave blank for auto-generation"
                pattern="[A-Za-z0-9\-]+"
                title="Only letters, numbers and hyphens allowed"
                disabled={scanningStatus[index] === 'scanning'}
              />
              <button
                type="button"
                className={`btn ${scanningStatus[index] === 'scanning' ? 'btn-warning' : 
                          scanningStatus[index] === 'success' ? 'btn-success' : 
                          scanningStatus[index] === 'error' ? 'btn-danger' : 'btn-outline'}`}
                onClick={() => handleStartScan(index)}
                disabled={scanningStatus[index] !== 'idle'}
                style={{ whiteSpace: 'nowrap' }}
              >
                {scanningStatus[index] === 'scanning' ? (
                  <span>Scanning...</span>
                ) : scanningStatus[index] === 'success' ? (
                  <span>✓ Scanned!</span>
                ) : scanningStatus[index] === 'error' ? (
                  <span>Scan Failed</span>
                ) : (
                  <span>Scan</span>
                )}
              </button>
            </div>
            {scanningIndex === index && (
              <div className="scanner-modal">
                <div className="scanner-modal-content">
                  <div className="scanner-modal-header">
                    <h3>Scan Unit {index + 1} Barcode</h3>
                    <button 
                      className="btn btn-close" 
                      onClick={() => {
                        const newStatus = [...scanningStatus];
                        newStatus[index] = 'idle';
                        setScanningStatus(newStatus);
                        setScanningIndex(null);
                      }}
                    >
                      &times;
                    </button>
                  </div>
                  <BarcodeScanner 
                    onScan={handleScanSuccess}
                    onClose={() => {
                      const newStatus = [...scanningStatus];
                      newStatus[index] = 'idle';
                      setScanningStatus(newStatus);
                      setScanningIndex(null);
                    }}
                    onError={handleScanError}
                  />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};


const handleStartScan = () => {
  setScanningStatus('scanning');
  setShowScanner(true);
};

 const handleScanSuccess = (barcode) => {
    if (scanningIndex !== null) {
      const newBarcodes = [...localBarcodes];
      newBarcodes[scanningIndex] = barcode;
      setLocalBarcodes(newBarcodes);
      onBarcodesChange(newBarcodes); // Update parent state immediately
      
      // Update scanning status
      const newStatus = [...scanningStatus];
      newStatus[scanningIndex] = 'success';
      setScanningStatus(newStatus);
      
      // Reset status after delay
      setTimeout(() => {
        const resetStatus = [...scanningStatus];
        resetStatus[scanningIndex] = 'idle';
        setScanningStatus(resetStatus);
        setScanningIndex(null);
      }, 1000);
    }
  };


const handleScanError = () => {
  setScanningStatus('error');
  setTimeout(() => {
    setScanningStatus('idle');
  }, 2000);
};


// Add this function to fetch manufacturer shipments
const fetchManufacturerShipments = async () => {
  setIsLoadingShipments(true);
  try {
    const token = localStorage.getItem('token');
    const response = await axios.get('http://localhost:5000/api/shipments/manufacturer', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    if (response.data.success) {
      setManufacturerShipments(response.data.shipments);
    }
  } catch (error) {
    console.error('Error fetching shipments:', error);
  } finally {
    setIsLoadingShipments(false);
  }
};

 
const fetchDashboardStats = async () => {
  setIsLoadingStats(true);
  try {
    const token = localStorage.getItem('token');
    
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
    console.log('Dashboard stats response:', response.data);
    if (response.data.success) {
           setDashboardStats({
        totalDrugs: response.data.stats.totalDrugs || 0,
        activeShipments: response.data.stats.activeShipments || 0,
        nearExpiry: response.data.stats.nearExpiry || 0,
        recalledBatches: response.data.stats.recalledBatches || 0,
        drugVolume: response.data.stats.drugVolume || [],
        shipmentsOverTime: response.data.stats.shipmentsOverTime || [],
        statusDistribution: response.data.stats.statusDistribution || [],
        upcomingExpirations: response.data.stats.upcomingExpirations || [],
        topDistributors: response.data.stats.topDistributors || []
      });

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
 

 // In the drugForm state, add unitBarcodes:
const [drugForm, setDrugForm] = useState({
  name: '',
  batch: '',
  quantity: '',
  mfgDate: '',
  expiryDate: '',
  barcode: '',
  unitBarcodes: []
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

  // Add to your component's state
const [timeRanges, setTimeRanges] = useState({
  drugVolume: '30',
  drugDistribution: '30',
  shipments: '30'
});

// Add this function to your component
const handleTimeRangeChange = async (chartType, days) => {
  setTimeRanges(prev => ({ ...prev, [chartType]: days }));
  
  try {
    const token = localStorage.getItem('token');
    const response = await axios.get(`http://localhost:5000/api/dashboard/stats?days=${days}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    if (response.data.success) {
      setDashboardStats(response.data.stats);
    }
  } catch (error) {
    console.error('Error fetching filtered stats:', error);
  }
};
  // File upload state
  const [fileUploadState, setFileUploadState] = useState({
    isDragging: false,
    file: null
  });

  // Barcode Scanner Component
 const BarcodeScanner = ({ onScan, onClose, onError }) => {
  const scannerRef = useRef(null);
  const fileInputRef = useRef(null);

  const handleBarcodeFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const html5QrCode = new Html5Qrcode('barcode-scanner');
    html5QrCode.scanFile(file, false)
      .then(decodedText => {
        if (/^[A-Za-z0-9-]+$/.test(decodedText)) {
          onScan(decodedText);
          if (onClose) onClose();
        } else {
          alert('Invalid barcode format. Only letters, numbers and hyphens are allowed.');
        }
      })
      .catch(err => {
        console.error('File scan error:', err);
        if (onError) onError(err.message);
        alert('Failed to scan the file. Please try another image.');
      });
  };

  useEffect(() => {
    const config = {
      fps: 10,
      qrbox: 250,
      formatsToSupport: [
        Html5QrcodeSupportedFormats.CODE_39,
        Html5QrcodeSupportedFormats.UPC_A,
        Html5QrcodeSupportedFormats.UPC_E,
        Html5QrcodeSupportedFormats.EAN_8,
        Html5QrcodeSupportedFormats.EAN_13,
        Html5QrcodeSupportedFormats.CODE_128,
        Html5QrcodeSupportedFormats.CODE_39,
        Html5QrcodeSupportedFormats.CODE_93,
        Html5QrcodeSupportedFormats.ITF
      ],
      rememberLastUsedCamera: true,
      supportedScanTypes: [
        Html5QrcodeScanType.SCAN_TYPE_CAMERA,
        Html5QrcodeScanType.SCAN_TYPE_FILE
      ]
    };

    const scanner = new Html5QrcodeScanner('barcode-scanner', config, false);
    scannerRef.current = scanner;

    const successCallback = (decodedText) => {
      if (/^[A-Za-z0-9-]+$/.test(decodedText)) {
        scanner.clear().then(() => {
          onScan(decodedText);
          if (onClose) onClose();
        }).catch(err => {
          console.error('Failed to clear scanner', err);
          if (onError) onError('Scanner cleanup failed');
        });
      } else {
        if (onError) onError('Invalid format');
        alert('Invalid barcode format. Only letters, numbers and hyphens are allowed.');
      }
    };

    const errorCallback = (error) => {
      if (!error.message.includes('No MultiFormat Readers')) {
        console.warn('QR code scan error', error);
        if (onError) onError(error.message);
      }
    };

    scanner.render(successCallback, errorCallback);

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(error => {
          console.error('Failed to clear scanner', error);
          if (onError) onError('Scanner cleanup failed');
        });
      }
    };
  }, [onScan, onClose, onError]);

  return (
    <div className="scanner-container">
      <div id="barcode-scanner" style={{ width: '100%' }}></div>
      <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '10px' }}>
        <button 
          className="btn btn-primary"
          onClick={() => fileInputRef.current.click()}
        >
          <FaUpload /> Scan from Image
        </button>
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleBarcodeFileUpload}
        />
        <button 
          className="btn btn-danger" 
          onClick={() => {
            if (scannerRef.current) {
              scannerRef.current.clear().catch(console.error);
            }
            if (onClose) onClose();
          }}
        >
          Close Scanner
        </button>
      </div>
    </div>
  );
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

   const handleBarcodeFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const html5QrCode = new Html5Qrcode('barcode-scanner');
    html5QrCode.scanFile(file, false)
      .then(decodedText => {
        if (/^[A-Za-z0-9-]+$/.test(decodedText)) {
          onScan(decodedText);
          if (onClose) onClose();
        } else {
          alert('Invalid barcode format. Only letters, numbers and hyphens are allowed.');
        }
      })
      .catch(err => {
        console.error('File scan error:', err);
        if (onError) onError(err.message);
        alert('Failed to scan the file. Please try another image.');
      });
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

 // Update the manual submission handler:
const handleManualSubmit = async (e) => {
  e.preventDefault();
  
  // Validate barcode format
  if (drugForm.barcode && !/^[A-Za-z0-9-]+$/.test(drugForm.barcode)) {
    alert('Invalid barcode format. Only letters, numbers and hyphens are allowed.');
    return;
  }

  try {
    const response = await axios.post('http://localhost:5000/api/drugs/create', {
      name: drugForm.name,
      batch: drugForm.batch,
      quantity: parseInt(drugForm.quantity),
      mfgDate: drugForm.mfgDate,
      expiryDate: drugForm.expiryDate,
      batchBarcode: drugForm.barcode,
      unitBarcodes: drugForm.unitBarcodes,
      manufacturerId: user._id
    }, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (response.data.success) {
      alert(`Drug ${response.data.drug.name} created successfully with ${response.data.drug.quantity} units`);
      setPreviewData(prev => [...prev, drugForm]);
      setDrugForm({
        name: '',
        batch: '',
        quantity: '',
        mfgDate: '',
        expiryDate: '',
        barcode: '',
        unitBarcodes: []
      });
    }
  } catch (error) {
    console.error('Creation error:', error);
    if (error.response?.data?.error?.includes('barcode')) {
      alert('Barcode must be unique. Please enter a different barcode or leave blank for auto-generation.');
    } else {
      alert(error.response?.data?.error || 'Failed to create drug');
    }
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
  <div className="grid1">
    <div className="stats-card">
      <div className="icon primary">
        <FaCapsules />
      </div>
      <h3>{isLoadingStats ? '...' : dashboardStats.totalDrugs.toLocaleString()}</h3>
      <p>Total Drugs</p>
    </div>
    <div className="stats-card clickable"
     onClick={() => {
    setShowShipmentsModal(true);
    fetchManufacturerShipments();
  }}>
      <div className="icon success">
        <FaTruck />
      </div>
      <h3>{isLoadingStats ? '...' : dashboardStats.activeShipments}</h3>
      <p>Total Shipments</p>
   
   
   
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
      <small>CSV template: 
Drug Name, Batch Number, Quantity, Manufacturing Date, Expiry Date, Batch Barcode, Unit Barcodes

For Unit Barcodes:
- Leave blank to auto-generate
- Or provide comma-separated list of barcodes (must match quantity)
Example: "ABC-123-456,ABC-123-457,ABC-123-458"CSV template: Drug Name, Batch Number, Quantity, Manufacturing Date, Expiry Date</small>
      
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
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <input 
  type="text" 
  className="form-control" 
  placeholder="Enter custom barcode"
  name="barcode"
  value={drugForm.barcode}
  onChange={handleInputChange}
  pattern="[A-Za-z0-9\-]+"
  title="Only letters, numbers and hyphens allowed"
/>
         <button 
  type="button" 
  className={`btn ${scanningStatus === 'scanning' ? 'btn-warning' : 'btn-outline'}`}
  onClick={handleStartScan}
  disabled={scanningStatus !== 'idle'}
  style={{ whiteSpace: 'nowrap' }}
>
  {scanningStatus === 'scanning' ? (
    <span>Scanning...</span>
  ) : scanningStatus === 'success' ? (
    <span>✓ Scanned!</span>
  ) : scanningStatus === 'error' ? (
    <span>Scan Failed</span>
  ) : (
    <span>Scan Barcode</span>
  )}
</button>
        </div>
      {showScanner && (
  <div className="scanner-modal">
    <div className="scanner-modal-content">
      <div className="scanner-modal-header">
        <h3>Scan Barcode</h3>
        <button 
          className="btn btn-close" 
          onClick={() => {
            setShowScanner(false);
            setScanningStatus('idle');
          }}
        >
          &times;
        </button>
      </div>
      <BarcodeScanner 
  onScan={(barcode) => {
    setDrugForm(prev => ({ ...prev, barcode }));
    setShowScanner(false);
    setScanningStatus('success');
  }}
  onClose={() => {
    setShowScanner(false);
    setScanningStatus('idle');
  }}
  onError={(error) => {
    console.error('Scanner error:', error);
    setScanningStatus('error');
  }}
/>
    </div>
  </div>
)}

        <small className="form-text">
          Barcode must be unique. If left blank, a barcode will be automatically generated.
        </small>
  {parseInt(drugForm.quantity) > 0 && (
  <UnitBarcodeInput 
  quantity={parseInt(drugForm.quantity)} 
  barcodes={drugForm.unitBarcodes || []}
  onBarcodesChange={(barcodes) => setDrugForm(prev => ({ ...prev, unitBarcodes: barcodes }))}
/>
)}s
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
    {/* Stats Cards */}
    <div className="grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
      <div className="stats-card">
        <div className="icon primary">
          <FaCapsules />
        </div>
        <h3>{isLoadingStats ? '...' : dashboardStats.totalDrugs?.toLocaleString() || 0}</h3>
        <p>Total Drugs</p>
      </div>
      <div className="stats-card">
        <div className="icon success">
          <FaTruck />
        </div>
        <h3>{isLoadingStats ? '...' : dashboardStats.activeShipments || 0}</h3>
        <p>Active Shipments</p>
      </div>
      <div className="stats-card">
        <div className="icon warning">
          <FaBell />
        </div>
        <h3>{isLoadingStats ? '...' : dashboardStats.nearExpiry || 0}</h3>
        <p>Near Expiry</p>
      </div>
      <div className="stats-card">
        <div className="icon danger">
          <FaBell />
        </div>
        <h3>{isLoadingStats ? '...' : dashboardStats.recalledBatches || 0}</h3>
        <p>Recalled Batches</p>
      </div>
    </div>

    {/* Main Charts */}
    <div className="grid" style={{ gridTemplateColumns: '2fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
      {/* Drug Volume Chart */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Drug Volume by Batch</h2>
          <div className="card-actions">
            <select 
              className="form-control" 
              style={{ width: 'auto', display: 'inline-block' }}
              onChange={(e) => handleTimeRangeChange('drugVolume', e.target.value)}
            >
              <option value="30">Last 30 Days</option>
              <option value="90">Last 90 Days</option>
              <option value="365">This Year</option>
            </select>
          </div>
        </div>
        <div className="chart-container" style={{ height: '400px' }}>
          {dashboardStats.drugVolume && dashboardStats.drugVolume?.length > 0 ? (
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
              tooltip={{
                formatter: (datum) => {
                  return { name: datum.drugName, value: `${datum.totalQuantity} units` };
                },
              }}
              color={['#1890ff', '#13c2c2', '#52c41a', '#faad14', '#f5222d']}
            />
          ) : (
            <p style={{ color: 'var(--gray)', textAlign: 'center', padding: '2rem' }}>
              No drug volume data available
            </p>
          )}
        </div>
      </div>

      {/* Drug Distribution Pie Chart */}
    </div>

    {/* Shipments Over Time Line Chart */}
     <div className="card">
      <div className="card-header">
        <h2 className="card-title">Shipments Timeline</h2>
        <div className="card-actions">
          <select 
            className="form-control" 
            style={{ width: 'auto', display: 'inline-block' }}
            onChange={(e) => handleTimeRangeChange('shipments', e.target.value)}
          >
            <option value="30">Last 30 Days</option>
            <option value="90">Last 90 Days</option>
            <option value="365">This Year</option>
          </select>
        </div>
      </div>
      <div className="chart-container" style={{ padding: '1.5rem' }}>
        {dashboardStats.shipmentsOverTime?.length > 0 ? (
          <div className="timeline-container">
            {dashboardStats.shipmentsOverTime.map((item, index) => (
              <div key={index} className="timeline-item">
                <div className="timeline-date">{item.date}</div>
                <div className="timeline-bar">
                  <div 
                    className="timeline-progress" 
                    style={{ width: `${Math.min(100, (item.count / Math.max(...dashboardStats.shipmentsOverTime.map(i => i.count))) * 100)}%` }}
                  ></div>
                </div>
                <div className="timeline-count">{item.count} shipments</div>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: 'var(--gray)', textAlign: 'center', padding: '2rem' }}>
            No shipment data available
          </p>
        )}
      </div>
      {/* Upcoming Expirations */}
    <div className="card">
      <div className="card-header">
        <h2 className="card-title">Upcoming Expirations</h2>
      </div>
      <div className="chart-container" style={{ padding: '1.5rem' }}>
        {dashboardStats.upcomingExpirations?.length > 0 ? (
          <div className="expiration-grid">
            {dashboardStats.upcomingExpirations.map((drug, index) => (
              <div key={index} className="expiration-card">
                <div className="expiration-header">
                  <h4>{drug.name}</h4>
                  <span className="batch-tag">{drug.batch}</span>
                </div>
                <div className="expiration-details">
                  <div className="expiration-meta">
                    <span>Expires: {drug.expiryDate}</span>
                    <span>Quantity: {drug.quantity} units</span>
                  </div>
                  <div className="days-remaining">
                    <div 
                      className="days-progress" 
                      style={{ 
                        width: `${100 - (Math.min(30, drug.daysLeft) / 30) * 100}%`,
                        backgroundColor: drug.daysLeft <= 7 ? '#f5222d' : drug.daysLeft <= 14 ? '#faad14' : '#52c41a'
                      }}
                    ></div>
                    <span>{drug.daysLeft} days remaining</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: 'var(--gray)', textAlign: 'center', padding: '2rem' }}>
            No upcoming expirations
          </p>
        )}
      </div>
    </div>
    </div>
    
    
  </>
)}


{/* // Add this modal component near the end of your JSX, before the closing </div>: */}
{showShipmentsModal && (
  <div className="modal-overlay">
    <div className="modal">
      <div className="modal-header">
        <h2>Your Shipments</h2>
        <button 
          className="btn btn-close" 
          onClick={() => setShowShipmentsModal(false)}
        >
          &times;
        </button>
      </div>
      <div className="modal-body">
        {isLoadingShipments ? (
          <p>Loading shipments...</p>
        ) : manufacturerShipments.length > 0 ? (
          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>Shipment ID</th>
                  <th>Drugs Count</th>
                  <th>Distributor</th>
                  <th>Status</th>
                  <th>Created At</th>
                  <th>Estimated Delivery</th>
                </tr>
              </thead>
              <tbody>
                {manufacturerShipments.map(shipment => (
                  <tr key={shipment._id}>
                    <td>{shipment.trackingNumber || shipment._id}</td>
                    <td>{shipment.drugs.length} drugs</td>
                    <td>
                      {shipment.distributor?.organization || 
                       shipment.distributor?.name || 
                       'Unknown'}
                    </td>
                    <td><StatusBadge status={shipment.status} /></td>
                    <td>{new Date(shipment.createdAt).toLocaleDateString()}</td>
                    <td>
                      {shipment.estimatedDelivery 
                        ? new Date(shipment.estimatedDelivery).toLocaleDateString() 
                        : 'Not specified'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p>No shipments found</p>
        )}
      </div>
      <div className="modal-footer">
        <button 
          className="btn btn-primary"
          onClick={() => setShowShipmentsModal(false)}
        >
          Close
        </button>
      </div>
    </div>
  </div>
)}



      </div>
      
    </div>
    
  );
};

export default ManufacturerDashboard;