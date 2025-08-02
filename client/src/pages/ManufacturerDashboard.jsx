import React, { useState, useEffect, useRef } from 'react';
import { FaPills, FaTachometerAlt, FaPlusCircle, FaCapsules, FaTruck, FaChartLine, FaBell, FaCog, FaChevronDown, FaUpload, FaDownload, FaFilter, FaSearch, FaEye, FaPaperPlane, FaChevronLeft, FaChevronRight, FaFileCsv, FaWallet,  FaChartPie, FaCalendarTimes } from 'react-icons/fa';


// For the charts
import { Bar, Pie } from '@ant-design/charts';
import { Html5Qrcode, Html5QrcodeScanner, Html5QrcodeSupportedFormats, Html5QrcodeScanType } from 'html5-qrcode';
import { useAuth } from './AuthContext';
import axios from 'axios';
import './ManufacturerDashboard.css';
import {ethers} from 'ethers';
  // Import ABI correctly
        import DrugTrackingABI from '../abi/DrugTrackingABI.json' with { type: 'json' };
import RouteOptimizer from './RouteOptimizer';


const ManufacturerDashboard = () => {

  const { user, logout } = useAuth();  
  const [activeTab, setActiveTab] = useState('drug-creation');
  const [activeSubTab, setActiveSubTab] = useState('bulk');
  const [showScanner, setShowScanner] = useState(false);
  const [inventoryDrugs, setInventoryDrugs] = useState([]);
  const [isLoadingInventory, setIsLoadingInventory] = useState(false);
  const [scanningStatus, setScanningStatus] = useState('idle'); // 'idle', 'scanning', 'success', 'error'
  const [shipmentsData, setShipmentsData] = useState([]);

  const [showShipmentsModal, setShowShipmentsModal] = useState(false);
const [manufacturerShipments, setManufacturerShipments] = useState([]);
const [isLoadingShipments, setIsLoadingShipments] = useState(false);
const [contract, setContract] = useState(null);
const [isBlockchainReady, setIsBlockchainReady] = useState(false);

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
  drugVolume: [],
  shipmentsOverTime: [],
  statusDistribution: [],
  upcomingExpirations: [],
  topDistributors: []
});
const [isLoadingStats, setIsLoadingStats] = useState(false);

 const [walletAddress, setWalletAddress] = useState(null);
  const [isConnectingWallet, setIsConnectingWallet] = useState(false);
  const [walletError, setWalletError] = useState(null);

  // Route Optimization
  const [showRouteOptimizer, setShowRouteOptimizer] = useState(false);
const [routeDetails, setRouteDetails] = useState({
  origin: null,
  destination: null
});

const [shipmentHistory, setShipmentHistory] = useState([]);
const [isLoadingHistory, setIsLoadingHistory] = useState(false);

// Add this function to fetch shipment history
const fetchShipmentHistory = async () => {
  setIsLoadingHistory(true);
  try {
    const token = localStorage.getItem('token');
    const response = await axios.get('http://localhost:5000/api/shipments/fetch/manufacturer', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    console.log("Shipment history:", response.data.shipments);
    
    if (response.data.success) {
      setShipmentHistory(response.data.shipments);
    }
  } catch (error) {
    console.error('Error fetching shipment history:', error);
    alert('Failed to load shipment history');
  } finally {
    setIsLoadingHistory(false);
  }
};

// Add this useEffect to fetch history when tab is activated
useEffect(() => {
  if (activeTab === 'history' && user?._id) {
    fetchShipmentHistory();
  }
}, [activeTab, user?._id]);

const handleOptimizeRoute = async () => {
  if (!shipmentForm.distributor) {
    alert('Please select a distributor first');
    return;
  }
  
  try {
    // Get manufacturer location (current user)
    const token = localStorage.getItem('token');
    const manufacturerResponse = await axios.get('http://localhost:5000/api/users/me', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    console.log("Manufacturer Response: ", manufacturerResponse.data);
    
    
    // Get distributor location
    console.log("distributor id:", shipmentForm.distributor)
    const distributorResponse = await axios.get(`http://localhost:5000/api/users/${shipmentForm.distributor}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
      console.log("Distributor Response: ", distributorResponse.data);
    
    
    const manufacturer = manufacturerResponse.data;
    const distributor = distributorResponse.data;
    
    if (!manufacturer.pincode || !distributor.pincode) {
      alert('Location information not available for one or both parties');
      return;
    }

    // Construct address strings for geocoding
    const manufacturerAddress = [
      manufacturer.location,
      manufacturer.pincode,
      'India' // Assuming Indian addresses
    ].filter(Boolean).join(', ');

    const distributorAddress = [
      distributor.location,
      distributor.pincode,
      'India' // Assuming Indian addresses
    ].filter(Boolean).join(', ');

    setRouteDetails({
      origin: {
        address: manufacturerAddress,
        lat: null,
        lng: null
      },
      destination: {
        address: distributorAddress,
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




  // Function to check if MetaMask is installed
const checkMetaMask = () => {
  if (!window.ethereum) {
    setWalletError('MetaMask is not installed');
    return false;
  }
  return true;
};

  // Function to connect wallet (simulated)
  const connectWallet = async () => {
    if (!checkMetaMask()) return;
     setIsConnectingWallet(true);
    try {
    // Request account access
    const accounts = await window.ethereum.request({ 
      method: 'eth_requestAccounts' 
    });
     if (accounts.length > 0) {
      const address = accounts[0];
      setWalletAddress(address);
      // Optionally update the user's wallet address in your backend
      try {
        const token = localStorage.getItem('token');
        await axios.patch(
          'http://localhost:5000/api/users/wallet',
          { walletAddress: address },
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );
      } catch (error) {
        console.error('Error updating wallet address:', error);
      }
    }

    

    } catch (error) {
      console.error('Wallet connection error:', error);
        setWalletError(error.message);
    } finally {
      setIsConnectingWallet(false);
    }
  };

// Function to disconnect wallet
const disconnectWallet = async () => {
  try {
    // Optionally update the backend to remove wallet address
    const token = localStorage.getItem('token');
    await axios.patch(
      'http://localhost:5000/api/users/wallet',
      { walletAddress: null },
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );
    
    setWalletAddress(null);
  } catch (error) {
    console.error('Error disconnecting wallet:', error);
  }
};
  
  // Check for wallet connection on component mount
useEffect(() => {
  const checkWalletConnection = async () => {
    if (checkMetaMask() && window.ethereum.selectedAddress) {
      setWalletAddress(window.ethereum.selectedAddress);
    }
  };
  
  checkWalletConnection();
  
  // Listen for account changes
  if (window.ethereum) {
    window.ethereum.on('accountsChanged', (accounts) => {
      if (accounts.length > 0) {
        setWalletAddress(accounts[0]);
      } else {
        setWalletAddress(null);
      }
    });
  }
  
  return () => {
    if (window.ethereum) {
      window.ethereum.removeListener('accountsChanged', () => {});
    }
  };
}, []);
// / Add this useEffect for blockchain initialization
useEffect(() => {
  const initBlockchain = async () => {
    if (window.ethereum) {
      try {
        // Request account access
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        
      
        
        // Handle cases where ABI might be nested
        const contractABI = Array.isArray(DrugTrackingABI) ? DrugTrackingABI : DrugTrackingABI.abi;
        
        if (!Array.isArray(contractABI)) {
          throw new Error('ABI must be an array');
        }

        const drugTrackingContract = new ethers.Contract(
          import.meta.env.VITE_CONTRACT_ADDRESS,
          contractABI,
          signer
        );
        
        setContract(drugTrackingContract);
        setIsBlockchainReady(true);
      } catch (error) {
        console.error('Error connecting to blockchain:', error);
        setWalletError('Failed to connect to blockchain: ' + error.message);
      }
    } else {
      setWalletError('Please install MetaMask');
    }
  };

  initBlockchain();
}, []);




const UnitBarcodeInput = ({ quantity, barcodes = [], onBarcodesChange }) => {
  const [localBarcodes, setLocalBarcodes] = useState(Array(quantity).fill(''));
  const [scanningIndex, setScanningIndex] = useState(null);
  const [scanningStatus, setScanningStatus] = useState(Array(quantity).fill('idle')); // 'idle', 'scanning', 'success', 'error'
  const inputRefs = useRef([]);

  // Initialize with cleaned barcodes
  useEffect(() => {
    inputRefs.current = inputRefs.current.slice(0, quantity);
    const initialBarcodes = Array(quantity).fill('');
    const cleanedBarcodes = barcodes
      .filter(b => b !== null && b !== undefined)
      .map(b => String(b).trim());
    
    cleanedBarcodes.forEach((barcode, index) => {
      if (index < quantity) {
        initialBarcodes[index] = barcode;
      }
    });
    
    setLocalBarcodes(initialBarcodes);
  }, [quantity, barcodes]);

  const handleBarcodeChange = (index, value) => {
    const newBarcodes = [...localBarcodes];
    newBarcodes[index] = value;
    setLocalBarcodes(newBarcodes);
    
    // Clean the barcodes before sending to parent
    const cleanedBarcodes = newBarcodes.map(b => b.trim());
    onBarcodesChange(cleanedBarcodes);
    
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
      
      // Clean the barcode before sending to parent
      const cleanedBarcode = barcode.trim();
      const cleanedBarcodes = [...localBarcodes];
      cleanedBarcodes[scanningIndex] = cleanedBarcode;
      onBarcodesChange(cleanedBarcodes);
      
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

// Update the drug form state
const [drugForm, setDrugForm] = useState({
  name: '',
  batch: '',
  quantity: '',
  mfgDate: '',
  expiryDate: '',
  batchBarcode: '',
  unitBarcodes: []
})

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
            const unitBarcodes = obj.unitbarcodes 
              ? obj.unitbarcodes.split(',').map(b => b.trim())
              : [];
            
            result.push({
              name: obj.drugname || obj.name,
              batch: obj.batchnumber || obj.batch,
              quantity: obj.quantity,
              mfgDate: obj.manufacturingdate || obj.mfgdate || obj.mfgdate,
              expiryDate: obj.expirydate || obj.expiryDate,
              batchBarcode: obj.batchbarcode || obj.barcode || '',
              unitBarcodes: unitBarcodes
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

 const handleInputChange = (e) => {
    const { name, value } = e.target;
    setDrugForm(prev => ({ ...prev, [name]: value }));
  };

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
  const [isScannerActive, setIsScannerActive] = useState(false);

  // Clean up scanner completely
  const cleanUpScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.clear();
        const scannerElement = document.getElementById('barcode-scanner');
        if (scannerElement) {
          scannerElement.innerHTML = ''; // Clear the DOM element
        }
      } catch (error) {
        console.error('Error cleaning up scanner:', error);
        if (onError) onError('Scanner cleanup failed');
      } finally {
        scannerRef.current = null;
      }
    }
  };

  const handleBarcodeFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Use a temporary scanner instance for file scanning
    const fileScanner = new Html5Qrcode('barcode-scanner-file');
    fileScanner.scanFile(file, false)
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
      })
      .finally(() => {
        fileScanner.clear().catch(console.error);
      });
  };

  useEffect(() => {
    if (isScannerActive) {
      const initializeScanner = async () => {
        // First clean up any existing scanner
        await cleanUpScanner();

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
      };

      initializeScanner();
    }

    return () => {
      // Clean up when component unmounts or when isScannerActive changes
      cleanUpScanner();
    };
  }, [isScannerActive, onScan, onClose, onError]);

  useEffect(() => {
    // Activate scanner when component mounts
    setIsScannerActive(true);

    return () => {
      // Deactivate scanner when component unmounts
      setIsScannerActive(false);
    };
  }, []);

  return (
    <div className="scanner-container">
      {/* Main scanner container - ensure this is empty before initialization */}
      <div id="barcode-scanner" key={Date.now()} style={{ width: '100%' }}></div>
      
      {/* Hidden container for file scanning */}
      <div id="barcode-scanner-file" style={{ display: 'none' }}></div>
      
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
            cleanUpScanner();
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
   console.log('Scanned barcode:', barcode);
  console.log('Current form barcode:', drugForm.batchBarcode);
  setDrugForm(prev => ({ ...prev, batchBarcode: barcode }));
  setShowScanner(false);
  setScanningStatus('success');
};

// Update the barcode input field in the form
<input 
  type="text" 
  className="form-control" 
  placeholder="Enter custom barcode"
  name="batchBarcode"
  value={drugForm.batchBarcode}
  onChange={handleInputChange}
  pattern="[A-Za-z0-9\-]+"
  title="Only letters, numbers and hyphens allowed"
/>

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
  
  // Enhanced barcode validation
  if (drugForm.batchBarcode && !/^[A-Za-z0-9-]+$/.test(drugForm.batchBarcode.trim())) {
    alert('Invalid barcode format. Only letters, numbers and hyphens are allowed.');
    return;
  }

  // Clean unit barcodes
  const cleanedUnitBarcodes = drugForm.unitBarcodes
    .filter(b => b !== null && b !== undefined)
    .map(b => String(b).trim());

  // Validate unit barcodes
  for (const barcode of cleanedUnitBarcodes) {
    if (barcode && !/^[A-Za-z0-9-]+$/.test(barcode)) {
      alert(`Invalid unit barcode format: ${barcode}. Only letters, numbers and hyphens are allowed.`);
      return;
    }
  }

  try {
    // Prepare unit barcodes array
    const unitBarcodesData = [];
    const quantityInt = parseInt(drugForm.quantity);
    
    // Use provided barcodes or generate new ones
    for (let i = 0; i < quantityInt; i++) {
      unitBarcodesData.push({
        barcode: cleanedUnitBarcodes[i] || generateBarcode(drugForm.name, drugForm.batch, i+1),
        status: 'in-stock',
        manufacturer: user._id,
        currentHolder: 'manufacturer'
      });
    }
    
    // First record on blockchain
    if (isBlockchainReady && contract) {
      // Convert dates to Unix timestamps (seconds since epoch)
      const mfgTimestamp = Math.floor(new Date(drugForm.mfgDate).getTime() / 1000);
      const expiryTimestamp = Math.floor(new Date(drugForm.expiryDate).getTime() / 1000);
      
      // Determine final batch barcode
      const finalBatchBarcode = drugForm.batchBarcode.trim() || generateBarcode(drugForm.name, drugForm.batch);
      
      console.log('Creating drug on blockchain with params:', {
        name: drugForm.name.trim(),
        batch: drugForm.batch.trim(),
        quantity: quantityInt,
        mfgDate: mfgTimestamp,
        expiryDate: expiryTimestamp,
        batchBarcode: finalBatchBarcode
      });

      // Call the blockchain contract
      const tx = await contract.createDrug(
        drugForm.name.trim(),
        drugForm.batch.trim(),
        quantityInt,
        mfgTimestamp,
        expiryTimestamp,
        finalBatchBarcode
      );
      
      console.log('Transaction sent, waiting for confirmation...');
      
      // Wait for the transaction to be mined
      const receipt = await tx.wait();
      console.log('Transaction receipt:', receipt);
      
      // Check if the transaction was successful
      if (receipt.status === 1) {
        console.log('Drug successfully recorded on blockchain');
        
        // Now save to database
        const response = await axios.post('http://localhost:5000/api/drugs/create', {
          name: drugForm.name.trim(),
          batch: drugForm.batch.trim(),
          quantity: quantityInt,
          mfgDate: drugForm.mfgDate,
          expiryDate: drugForm.expiryDate,
          batchBarcode: finalBatchBarcode,
          unitBarcodes: unitBarcodesData.map(u => u.barcode),
          manufacturerId: user._id,
          txHash: receipt.transactionHash // Save transaction hash for reference
        });

        if (response.data.success) {
          alert(`Drug ${response.data.drug.name} created successfully on blockchain and database`);
          setDrugForm({
            name: '',
            batch: '',
            quantity: '',
            mfgDate: '',
            expiryDate: '',
            batchBarcode: '',
            unitBarcodes: []
          });
          if (activeTab === 'inventory') {
            fetchManufacturerDrugs();
          }
        }
      } else {
        console.warn('Transaction failed');
        throw new Error('Blockchain transaction failed');
      }
    } else {
      // If blockchain not ready, just save to database
      const response = await axios.post('http://localhost:5000/api/drugs/create', {
        name: drugForm.name.trim(),
        batch: drugForm.batch.trim(),
        quantity: quantityInt,
        mfgDate: drugForm.mfgDate,
        expiryDate: drugForm.expiryDate,
        batchBarcode: drugForm.batchBarcode.trim() || generateBarcode(drugForm.name, drugForm.batch),
        unitBarcodes: unitBarcodesData.map(u => u.barcode),
        manufacturerId: user._id
      });

      if (response.data.success) {
        alert(`Drug ${response.data.drug.name} created successfully (database only - blockchain not connected)`);
        setDrugForm({
          name: '',
          batch: '',
          quantity: '',
          mfgDate: '',
          expiryDate: '',
          batchBarcode: '',
          unitBarcodes: []
        });
        if (activeTab === 'inventory') {
          fetchManufacturerDrugs();
        }
      }
    }
  } catch (error) {
    console.error('Drug creation error:', error);
    if (error.response?.data?.error) {
      alert(`Error: ${error.response.data.error}`);
    } else {
      alert(`Failed to create drug: ${error.message}`);
    }
  }
};
  // Status badge component
  const StatusBadge = ({ status }) => {
    const statusMap = {
      'in-stock': { class: 'status-in-stock', text: 'In Stock' },
      'shipped': { class: 'status-shipped', text: 'Shipped' },
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
    console.log("inventory data: ",response.data.drugs);
    
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
    console.log("distributor: ",distributorsResponse.data.distributors);
    
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

    const token = localStorage.getItem('token');
    const response = await axios.post(
      'http://localhost:5000/api/shipments/create',
      {
        drugs: selectedDrugs,
        distributorId: shipmentForm.distributor,
        estimatedDelivery: shipmentForm.deliveryDate || undefined,
        notes: shipmentForm.notes || undefined
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      }
    );

    if (response.data.success) {
      alert('Shipment created successfully!');
      setSelectedDrugs([]);
      setShipmentForm({
        distributor: '',
        deliveryDate: '',
        notes: ''
      });
      // Refresh data
      fetchShipmentData();
      fetchManufacturerShipments();
    }
  } catch (error) {
    console.error('Shipment creation error:', error);
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
  <div className="manufacturer-dashboard">
    {/* Sidebar */}
    <div className="manufacturer-sidebar">
      <div className="manufacturer-logo">
        <FaPills />
        <h1>Medchain</h1>
      </div>
      <div className="manufacturer-nav-menu">
        <a href="#" className={`manufacturer-nav-item ${activeTab === 'dashboard' ? 'manufacturer-active' : ''}`} onClick={() => setActiveTab('dashboard')}>
          <FaTachometerAlt />
          <span>Dashboard</span>
        </a>
        <a href="#" className={`manufacturer-nav-item ${activeTab === 'drug-creation' ? 'manufacturer-active' : ''}`} onClick={() => setActiveTab('drug-creation')}>
          <FaPlusCircle />
          <span>Create Drugs</span>
        </a>
        <a href="#" className={`manufacturer-nav-item ${activeTab === 'inventory' ? 'manufacturer-active' : ''}`} onClick={() => setActiveTab('inventory')}>
          <FaCapsules />
          <span>Inventory</span>
        </a>
        <a href="#" className={`manufacturer-nav-item ${activeTab === 'shipment' ? 'manufacturer-active' : ''}`} onClick={() => setActiveTab('shipment')}>
          <FaTruck />
          <span>Shipments</span>
        </a>
        <a href="#" className={`manufacturer-nav-item ${activeTab === 'analytics' ? 'manufacturer-active' : ''}`} onClick={() => setActiveTab('analytics')}>
          <FaChartLine />
          <span>Analytics</span>
        </a>
        <a href="#" className={`manufacturer-nav-item ${activeTab === 'settings' ? 'manufacturer-active' : ''}`} onClick={() => setActiveTab('settings')}>
          <FaCog />
          <span>Profile</span>
        </a>
      </div>
    </div>

    {/* Main Content */}
    <div className="manufacturer-main-content">
      <div className="manufacturer-header">
        <h1 className="manufacturer-page-title">Manufacturer Dashboard</h1>
        <div className="manufacturer-user-profile">
          <div className="manufacturer-user-avatar">
            {user?.name?.split(' ').map(n => n[0]).join('')}
          </div>
          <span>{user?.name || 'User'}</span>
          {/* Wallet connection status */}
          {walletAddress ? (
            <div className="manufacturer-wallet-connected">
              <span className="manufacturer-wallet-address">
                {walletAddress}
              </span>
              <button
                onClick={disconnectWallet}
                className="manufacturer-btn manufacturer-btn-small manufacturer-btn-outline"
                style={{ marginLeft: '10px' }}
              >
                Disconnect
              </button>
            </div>
          ) : (
            <button
              onClick={connectWallet}
              className="manufacturer-btn manufacturer-btn-small manufacturer-btn-primary"
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
           {walletError && (
    <div className="manufacturer-wallet-error">
      {walletError}
    </div>
  )}
          <button
            onClick={() => logout()}
            className="manufacturer-btn manufacturer-btn-small manufacturer-btn-danger"
            style={{ marginLeft: '10px' }}
          >
            Logout
          </button>
          <FaChevronDown />
        </div>
      </div>

      {/* Stats Cards - Only shown on dashboard tab */}
      {activeTab === 'dashboard' && (
        <div className="manufacturer-grid1">
          <div className="manufacturer-stats-card">
            <div className="manufacturer-icon manufacturer-primary">
              <FaCapsules />
            </div>
            <h3>{inventoryDrugs.length}</h3>
            <p>Total Drugs</p>
          </div>
          <div className="manufacturer-stats-card manufacturer-clickable"
            onClick={() => {
              setShowShipmentsModal(true);
              fetchManufacturerShipments();
            }}>
            <div className="manufacturer-icon manufacturer-success">
              <FaTruck />
            </div>
            <h3>{shipmentHistory.length}</h3>
            <p>Total Shipments</p>
          </div>
          <div className="manufacturer-stats-card">
            <div className="manufacturer-icon manufacturer-warning">
              <FaBell />
            </div>
            <h3>{isLoadingStats ? '...' : dashboardStats.nearExpiry}</h3>
            <p>Near Expiry</p>
          </div>
        </div>
      )}
      {/* Tabs for Main Sections */}
      <div className="manufacturer-tabs">
        <div className={`manufacturer-tab ${activeTab === 'drug-creation' ? 'manufacturer-active' : ''}`} onClick={() => setActiveTab('drug-creation')}>Drug Creation</div>
        <div className={`manufacturer-tab ${activeTab === 'inventory' ? 'manufacturer-active' : ''}`} onClick={() => setActiveTab('inventory')}>Your Drugs</div>
        <div className={`manufacturer-tab ${activeTab === 'shipment' ? 'manufacturer-active' : ''}`} onClick={() => setActiveTab('shipment')}>Create Shipment</div>
        <div className={`manufacturer-tab ${activeTab === 'history' ? 'manufacturer-active' : ''}`} onClick={() => setActiveTab('history')}>Shipment History</div>
        <div className={`manufacturer-tab ${activeTab === 'analytics' ? 'manufacturer-active' : ''}`} onClick={() => setActiveTab('analytics')}>Analytics</div>
      </div>

      {/* Drug Creation Tab */}
      {activeTab === 'drug-creation' && (
        <>
          <div className="manufacturer-card">
            <div className="manufacturer-card-header">
              <h2 className="manufacturer-card-title">Create New Drugs</h2>
            </div>
            <div className="manufacturer-tabs">
              <div className={`manufacturer-tab ${activeSubTab === 'bulk' ? 'manufacturer-active' : ''}`} onClick={() => setActiveSubTab('bulk')}>Bulk Upload</div>
              <div className={`manufacturer-tab ${activeSubTab === 'manual' ? 'manufacturer-active' : ''}`} onClick={() => setActiveSubTab('manual')}>Manual Entry</div>
            </div>

            {activeSubTab === 'bulk' && (
              <div className="manufacturer-tab-subcontent manufacturer-active" id="bulk">
                <div
                  className={`manufacturer-file-upload ${fileUploadState.isDragging ? 'manufacturer-dragging' : ''}`}
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
                    className="manufacturer-btn manufacturer-btn-primary"
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
                    <div className="manufacturer-file-info">
                      <p>Selected file: {fileUploadState.file.name}</p>
                      <button
                        className="manufacturer-btn manufacturer-btn-primary"
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
              <div className="manufacturer-tab-subcontent manufacturer-active" id="manual">
                <form onSubmit={handleManualSubmit}>
                  <div className="manufacturer-form-group">
                    <label className="manufacturer-form-label">Drug Name*</label>
                    <input
                      type="text"
                      className="manufacturer-form-control"
                      placeholder="Enter drug name"
                      name="name"
                      value={drugForm.name}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="manufacturer-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                    <div className="manufacturer-form-group">
                      <label className="manufacturer-form-label">Batch Number*</label>
                      <input
                        type="text"
                        className="manufacturer-form-control"
                        placeholder="Enter batch number"
                        name="batch"
                        value={drugForm.batch}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="manufacturer-form-group">
                      <label className="manufacturer-form-label">Quantity*</label>
                      <input
                        type="number"
                        className="manufacturer-form-control"
                        placeholder="Enter quantity"
                        name="quantity"
                        value={drugForm.quantity}
                        onChange={handleInputChange}
                        min="1"
                        required
                      />
                    </div>
                  </div>
                  <div className="manufacturer-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                    <div className="manufacturer-form-group">
                      <label className="manufacturer-form-label">Manufacturing Date*</label>
                      <input
                        type="date"
                        className="manufacturer-form-control"
                        name="mfgDate"
                        value={drugForm.mfgDate}
                        onChange={handleInputChange}
                        max={new Date().toISOString().split('T')[0]}
                        required
                      />
                    </div>
                    <div className="manufacturer-form-group">
                      <label className="manufacturer-form-label">Expiry Date*</label>
                      <input
                        type="date"
                        className="manufacturer-form-control"
                        name="expiryDate"
                        value={drugForm.expiryDate}
                        onChange={handleInputChange}
                        min={drugForm.mfgDate || new Date().toISOString().split('T')[0]}
                        required
                      />
                    </div>
                  </div>
                  <div className="manufacturer-form-group">
                    <label className="manufacturer-form-label">Barcode (leave blank for auto-generation)</label>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <input
                        type="text"
                        className="manufacturer-form-control"
                        placeholder="Enter custom barcode"
                        name="batchBarcode"
                        value={drugForm.batchBarcode}
                        onChange={handleInputChange}
                        pattern="[A-Za-z0-9\-]+"
                        title="Only letters, numbers and hyphens allowed"
                      />
                      <button
                        type="button"
                        className={`manufacturer-btn ${scanningStatus === 'scanning' ? 'manufacturer-btn-warning' : 'manufacturer-btn-outline'}`}
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
                      <div className="manufacturer-scanner-modal">
                        <div className="manufacturer-scanner-modal-content">
                          <div className="manufacturer-scanner-modal-header">
                            <h3>Scan Barcode</h3>
                            <button
                              className="manufacturer-btn manufacturer-btn-close"
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
                              setDrugForm(prev => ({ ...prev, batchBarcode: barcode }));
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

                    <small className="manufacturer-form-text">
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
                  <div className="manufacturer-form-actions">
                    <button
                      type="button"
                      className="manufacturer-btn manufacturer-btn-outline"
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
                      className="manufacturer-btn manufacturer-btn-primary"
                      disabled={!drugForm.name || !drugForm.batch || !drugForm.quantity || !drugForm.mfgDate || !drugForm.expiryDate}
                    >
                      <FaPlusCircle /> Create Drug
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>

          <div className="manufacturer-table-responsive">
            <table>
              <thead>
                <tr>
                  <th>Drug Name</th>
                  <th>Batch No.</th>
                  <th>Quantity</th>
                  <th>Mfg. Date</th>
                  <th>Exp. Date</th>
                  <th>Batch Barcode</th>
                  <th>Unit Barcodes</th>
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
                    <td>{drug.batchBarcode || 'Auto-generate'}</td>
                    <td>
                      {drug.unitBarcodes?.length > 0
                        ? drug.unitBarcodes.join(', ')
                        : 'Auto-generate'}
                    </td>
                  </tr>
                ))}
                {previewData.length === 0 && (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', color: 'var(--gray)' }}>
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
        <div className="manufacturer-card">
          <div className="manufacturer-card-header">
            <h2 className="manufacturer-card-title">Your Drug Inventory</h2>
            <div className="manufacturer-card-actions">
              <button className="manufacturer-btn manufacturer-btn-outline">
                <FaFilter /> Filters
              </button>
              <button className="manufacturer-btn manufacturer-btn-outline">
                <FaDownload /> Export
              </button>
            </div>
          </div>
          <div className="manufacturer-search-bar">
            <input type="text" placeholder="Search drugs..." />
            <button><FaSearch /></button>
          </div>
          <div className="manufacturer-table-responsive">
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
                        <button className="manufacturer-btn manufacturer-btn-outline" style={{ padding: '0.25rem 0.5rem' }}>
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
          <div className="manufacturer-pagination">
            <button><FaChevronLeft /></button>
            <button className="manufacturer-active">1</button>
            <button>2</button>
            <button>3</button>
            <button><FaChevronRight /></button>
          </div>
        </div>
      )}

      {/* Create Shipment Tab */}
      {activeTab === 'shipment' && (
        <div className="manufacturer-card">
          <div className="manufacturer-card-header">
            <h2 className="manufacturer-card-title">Create New Shipment</h2>
          </div>
          <form onSubmit={handleShipmentSubmit}>
            <div className="manufacturer-form-group">
              <label className="manufacturer-form-label">Select Drugs to Ship</label>
              <div className="manufacturer-table-responsive">
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
            <div className="manufacturer-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
              <div className="manufacturer-form-group">
                <label className="manufacturer-form-label">Select Distributor</label>
                <select
                  className="manufacturer-form-control"
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
                 <button 
    type="button" 
    className="manufacturer-btn manufacturer-btn-outline" 
    onClick={handleOptimizeRoute}
    style={{ marginTop: '10px' }}
  >
    Find Best Route
  </button>
              </div>
              <div className="manufacturer-form-group">
                <label className="manufacturer-form-label">Estimated Delivery Date</label>
                <input
                  type="date"
                  className="manufacturer-form-control"
                  name="deliveryDate"
                  value={shipmentForm.deliveryDate}
                  onChange={handleShipmentInputChange}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>
            <div className="manufacturer-form-group">
              <label className="manufacturer-form-label">Shipping Notes</label>
              <textarea
                className="manufacturer-form-control"
                rows="3"
                placeholder="Any special instructions..."
                name="notes"
                value={shipmentForm.notes}
                onChange={handleShipmentInputChange}
              ></textarea>
            </div>
            <div className="manufacturer-card" style={{ backgroundColor: '#f8f9ff', marginTop: '1.5rem' }}>
              <div className="manufacturer-card-header">
                <h3 className="manufacturer-card-title">Shipment Summary</h3>
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
            <button type="submit" className="manufacturer-btn manufacturer-btn-primary" style={{ marginTop: '1.5rem' }}>
              <FaPaperPlane /> Create Shipment
            </button>
          </form>
        </div>
      )}

      {/* Shipment History Tab */}
     {/* // Update the Shipment History tab content to: */}
{activeTab === 'history' && (
  <div className="manufacturer-card">
    <div className="manufacturer-card-header">
      <h2 className="manufacturer-card-title">Shipment History</h2>
      <div className="manufacturer-card-actions">
        <button className="manufacturer-btn manufacturer-btn-outline">
          <FaFilter /> Filters
        </button>
        <button className="manufacturer-btn manufacturer-btn-outline">
          <FaDownload /> Export
        </button>
      </div>
    </div>
    <div className="manufacturer-search-bar">
      <input type="text" placeholder="Search shipments..." />
      <button><FaSearch /></button>
    </div>
    <div className="manufacturer-table-responsive">
      <table>
        <thead>
          <tr>
            <th>Tracking #</th>
            <th>Drugs Count</th>
            <th>Distributor</th>
            <th>Status</th>
            <th>Created At</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {isLoadingHistory ? (
            <tr>
              <td colSpan="6" style={{ textAlign: 'center' }}>
                Loading shipment history...
              </td>
            </tr>
          ) : shipmentHistory.length > 0 ? (
            shipmentHistory.map(shipment => (
              <tr key={shipment._id}>
                <td>{shipment.trackingNumber}</td>
                <td>{shipment.drugs.length}</td>
                <td>
                  {shipment.participants.find(p => p.type === 'distributor')?.participantId?.name || 
                   'Unknown distributor'}
                </td>
                <td><StatusBadge status={shipment.status} /></td>
                <td>{new Date(shipment.createdAt).toLocaleDateString()}</td>
                <td>
                  <button 
                    className="manufacturer-btn manufacturer-btn-outline" 
                    style={{ padding: '0.25rem 0.5rem' }}
                    onClick={() => {
                      // You can implement a view details modal here
                      console.log('View shipment:', shipment._id);
                    }}
                  >
                    <FaEye />
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="6" style={{ textAlign: 'center' }}>
                No shipment history found
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
    <div className="manufacturer-pagination">
      <button><FaChevronLeft /></button>
      <button className="manufacturer-active">1</button>
      <button>2</button>
      <button>3</button>
      <button><FaChevronRight /></button>
    </div>
  </div>
)}


      {/* Analytics Tab */}
<div className={`manufacturer-main-content ${activeTab === 'analytics' ? 'analytics-active' : ''}`}>
{activeTab === 'analytics' && (
  <div className="manufacturer-analytics-container">
    {/* Stats Cards */}
    <div className="manufacturer-grid1">
      <div className="manufacturer-stats-card" style={{ 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        boxShadow: '0 4px 20px rgba(102, 126, 234, 0.3)'
      }}>
        <div className="manufacturer-icon">
          <FaCapsules style={{ color: 'white' }} />
        </div>
        <h3 style={{ color: 'white' }}>
          {isLoadingStats ? '...' : dashboardStats.totalDrugs?.toLocaleString() || 0}
        </h3>
        <p>Total Drugs</p>
      </div>
      
      <div className="manufacturer-stats-card" style={{ 
        background: 'linear-gradient(135deg, #2af598 0%, #009efd 100%)',
        color: 'white',
        boxShadow: '0 4px 20px rgba(42, 245, 152, 0.3)'
      }}>
        <div className="manufacturer-icon">
          <FaTruck style={{ color: 'white' }} />
        </div>
        <h3 style={{ color: 'white' }}>
          {shipmentHistory.length}
        </h3>
        <p>Active Shipments</p>
      </div>
      
      <div className="manufacturer-stats-card" style={{ 
        background: 'linear-gradient(135deg, #ff9a9e 0%, #fad0c4 100%)',
        color: 'white',
        boxShadow: '0 4px 20px rgba(255, 154, 158, 0.3)'
      }}>
        <div className="manufacturer-icon">
          <FaBell style={{ color: 'white' }} />
        </div>
        <h3 style={{ color: 'white' }}>
          {isLoadingStats ? '...' : dashboardStats.nearExpiry || 0}
        </h3>
        <p>Near Expiry</p>
      </div>
      
      <div className="manufacturer-stats-card" style={{ 
        background: 'linear-gradient(135deg, #fbc2eb 0%, #a6c1ee 100%)',
        color: 'white',
        boxShadow: '0 4px 20px rgba(251, 194, 235, 0.3)'
      }}>
        <div className="manufacturer-icon">
          <FaChartLine style={{ color: 'white' }} />
        </div>
        <h3 style={{ color: 'white' }}>
          {10}
        </h3>
        <p>Top Distributors</p>
      </div>
    </div>

    {/* Drug Volume Chart */}
    <div className="manufacturer-card">
      <div className="manufacturer-card-header">
        <h2 className="manufacturer-card-title">Drug Volume by Batch</h2>
        <div className="manufacturer-card-actions">
          <select
            className="manufacturer-form-control"
            onChange={(e) => handleTimeRangeChange('drugVolume', e.target.value)}
          >
            <option value="30">Last 30 Days</option>
            <option value="90">Last 90 Days</option>
            <option value="365">This Year</option>
          </select>
        </div>
      </div>
      <div className="manufacturer-chart-container">
        {dashboardStats.drugVolume?.length > 0 ? (
          <Bar
            data={dashboardStats.drugVolume}
            xField="drugName"
            yField="totalQuantity"
            seriesField="drugName"
            height={350}
            legend={{
              position: 'top-right',
            }}
            xAxis={{
              label: {
                autoRotate: false,
                style: {
                  fill: '#666',
                  fontSize: 12
                }
              },
              line: {
                style: {
                  stroke: '#e0e0e0'
                }
              }
            }}
            yAxis={{
              label: {
                formatter: (v) => `${v} units`,
                style: {
                  fill: '#666',
                  fontSize: 12
                }
              },
              grid: {
                line: {
                  style: {
                    stroke: '#f0f0f0'
                  }
                }
              }
            }}
            tooltip={{
              domStyles: {
                'g2-tooltip': {
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
                  borderRadius: '8px'
                }
              },
              formatter: (datum) => {
                return { name: datum.drugName, value: `${datum.totalQuantity} units` };
              },
            }}
            color={['#1890ff', '#13c2c2', '#52c41a', '#faad14', '#f5222d', '#722ed1']}
            barStyle={{
              radius: [4, 4, 0, 0],
            }}
          />
        ) : (
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            color: '#999'
          }}>
            <FaCapsules size={48} style={{ marginBottom: '1rem', opacity: 0.3 }} />
            <p>No drug volume data available</p>
          </div>
        )}
      </div>
    </div>

    {/* Status Distribution Chart */}
    <div className="manufacturer-card">
      <div className="manufacturer-card-header">
        <h2 className="manufacturer-card-title">Drug Status Distribution</h2>
      </div>
      <div className="manufacturer-chart-container">
        {dashboardStats.statusDistribution?.length > 0 ? (
          <Pie
            data={dashboardStats.statusDistribution}
            angleField="count"
            colorField="status"
            radius={0.8}
            innerRadius={0.5}
            label={{
              type: 'inner',
              offset: '-30%',
              content: ({ percent }) => `${(percent * 100).toFixed(0)}%`,
              style: {
                fontSize: 14,
                textAlign: 'center',
              },
            }}
            interactions={[{ type: 'element-active' }]}
            legend={{
              position: 'right',
              itemName: {
                style: {
                  fill: '#666'
                }
              }
            }}
            color={['#1890ff', '#52c41a', '#faad14', '#f5222d']}
            statistic={{
              title: false,
              content: {
                style: {
                  whiteSpace: 'pre-wrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  fontSize: '18px',
                  color: '#333',
                  fontWeight: 'bold'
                },
                content: 'Status\nBreakdown',
              },
            }}
          />
        ) : (
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            color: '#999'
          }}>
            <FaChartPie size={48} style={{ marginBottom: '1rem', opacity: 0.3 }} />
            <p>No status distribution data</p>
          </div>
        )}
      </div>
    </div>

    {/* Upcoming Expirations Section */}
    <div className="manufacturer-card">
      <div className="manufacturer-card-header">
        <h2 className="manufacturer-card-title">Upcoming Expirations</h2>
      </div>
      <div className="manufacturer-expiration-grid">
        {dashboardStats.upcomingExpirations?.length > 0 ? (
          dashboardStats.upcomingExpirations.map((drug, index) => (
            <div key={index} className="manufacturer-expiration-card">
              <div className="manufacturer-expiration-header">
                <h4>{drug.name}</h4>
                <span className="manufacturer-batch-tag">
                  {drug.batch}
                </span>
              </div>
              
              <div className="manufacturer-expiration-details">
                <div className="manufacturer-expiration-meta">
                  <span>Expires: {new Date(drug.expiryDate).toLocaleDateString()}</span>
                  <span>Quantity: {drug.quantity} units</span>
                </div>
                
                <div className="manufacturer-days-remaining">
                  <div
                    className="manufacturer-days-progress"
                    style={{
                      width: `${100 - (Math.min(30, drug.daysLeft) / 30 * 100)}%`,
                      backgroundColor: drug.daysLeft <= 7 ? '#ff4d4f' : 
                                      drug.daysLeft <= 14 ? '#faad14' : '#52c41a',
                    }}
                  ></div>
                </div>
                
                <div>
                  <span style={{
                    color: drug.daysLeft <= 7 ? '#ff4d4f' : 
                          drug.daysLeft <= 14 ? '#faad14' : '#52c41a',
                    fontWeight: '500'
                  }}>
                    {drug.daysLeft <= 0 ? 'Expired' : `${drug.daysLeft} days remaining`}
                  </span>
                  {drug.daysLeft <= 14 && (
                    <button>
                      Create Alert
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="no-expirations-message">
            <FaCalendarTimes size={48} style={{ opacity: 0.3 }} />
            <p>No upcoming expirations in the next 30 days</p>
          </div>
        )}
      </div>
    </div>
  </div>
)}
</div>

      {/* // Add this modal component near the end of your JSX, before the closing </div>: */}
      {showShipmentsModal && (
        <div className="manufacturer-modal-overlay">
          <div className="manufacturer-modal">
            <div className="manufacturer-modal-header">
              <h2>Your Shipments</h2>
              <button
                className="manufacturer-btn manufacturer-btn-close"
                onClick={() => setShowShipmentsModal(false)}
              >
                &times;
              </button>
            </div>
            <div className="manufacturer-modal-body">
              {isLoadingShipments ? (
                <p>Loading shipments...</p>
              ) : manufacturerShipments.length > 0 ? (
                <div className="manufacturer-table-responsive">
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
                          <td>{shipment.trackingNumber}</td>
                          <td>{shipment.drugs.length} drugs</td>
                          <td>
                            {shipment.participants.find(p => p.type === 'distributor')?.participantId?.name ||
                              'Unknown distributor'}
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
            <div className="manufacturer-modal-footer">
              <button
                className="manufacturer-btn manufacturer-btn-primary"
                onClick={() => setShowShipmentsModal(false)}
              >
                Close
              </button>
            </div>
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

export default ManufacturerDashboard;