import { useState, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';
import './ManufacturerDashboard.css';
import { connectWallet, verifyDrug } from '../utils/Blockchain';
import BarcodeScannerComponent from "react-qr-barcode-scanner";

// Dynamic import for JsBarcode
let JsBarcode;
if (typeof window !== 'undefined') {
  import('jsbarcode').then(module => {
    JsBarcode = module.default;
  });
}

const BarcodeDisplay = ({ value, format = "CODE128" }) => {
  const barcodeRef = useRef(null);

  useEffect(() => {
    if (barcodeRef.current && value && JsBarcode) {
      try {
        JsBarcode(barcodeRef.current, value, {
          format,
          lineColor: "#2c3e50",
          width: 2,
          height: 60,
          displayValue: true,
          fontSize: 14,
          margin: 10,
          background: "transparent"
        });
      } catch (error) {
        console.error("Barcode generation error:", error);
      }
    }
  }, [value, format]);

  return <svg ref={barcodeRef} className="barcode-svg" />;
};

export default function ManufacturerDashboard() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [barcodeOption, setBarcodeOption] = useState('generate');
  const [drugs, setDrugs] = useState([]);
  const [batches, setBatches] = useState([]);
  const [shipments, setShipments] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [distributors, setDistributors] = useState([]);
  const [isScanning, setIsScanning] = useState(false);
  const [scannedBarcode, setScannedBarcode] = useState('');
  const [scanResult, setScanResult] = useState(null);
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  
  const [newDrug, setNewDrug] = useState({
    name: '',
    composition: '',
    dosage: '',
    expiryDate: '',
    batchNumber: '',
    manufacturingDate: '',
    image: null,
    existingBarcode: '',
    barcodeType: 'GS1'
  });

  const [newShipment, setNewShipment] = useState({
    batchId: '',
    quantity: '',
    distributorId: '',
    destination: ''
  });

  const startScanner = () => {
    setIsScanning(true);
    setScannedBarcode('');
    setScanResult(null);
  };

  const stopScanner = () => {
    setIsScanning(false);
  };

  const handleScan = (err, result) => {
    if (result) {
      const code = result.text;
      setScannedBarcode(code);
      verifyScannedBarcode(code);
      stopScanner();
    }
  };

 const verifyScannedBarcode = async (barcode) => {
    try {
        const response = await fetch(`http://localhost:5000/api/drugs/verify/${barcode}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        const result = await response.json();
        
        if (result.status === 'authentic') {
            const drug = result.drug;
            setScanResult({
                type: 'success',
                source: result.source,
                message: result.source === 'blockchain' 
                    ? 'Valid MedChain product found on blockchain' 
                    : 'Valid product found in MedChain database',
                drug: {
                    ...drug,
                    expiryDate: result.source === 'blockchain' 
                        ? new Date(drug.expiryDate * 1000).toISOString().split('T')[0]
                        : drug.expiryDate
                }
            });
        } else {
            setScanResult({
                type: 'error',
                message: 'Product not found in MedChain system'
            });
        }
    } catch (error) {
        console.error("Verification error:", error);
        setScanResult({
            type: 'error',
            message: 'Error verifying product'
        });
    }
};


const connectWalletHandler = async () => {
    try {
        const address = await connectWallet();
        setWalletAddress(address);
        setWalletConnected(true);
        alert(`Wallet connected: ${address}`);
    } catch (error) {
        console.error("Wallet connection error:", error);
        alert(`Wallet connection failed: ${error.message}`);
    }
};

  const handleUseScannedBarcode = () => {
    if (scannedBarcode) {
      setNewDrug(prev => ({
        ...prev,
        existingBarcode: scannedBarcode,
        barcodeOption: 'existing'
      }));
      setBarcodeOption('existing');
      stopScanner();
    }
  };

  useEffect(() => {
    const checkWalletConnection = async () => {
        if (window.ethereum) {
            try {
                const accounts = await window.ethereum.request({ method: 'eth_accounts' });
                if (accounts.length > 0) {
                    setWalletAddress(accounts[0]);
                    setWalletConnected(true);
                }
            } catch (error) {
                console.error("Error checking wallet connection:", error);
            }
        }
    };
    
    checkWalletConnection();
}, []);

  // Simulate fetching data
  useEffect(() => {
    setTimeout(() => {
      // Sample alerts
      setAlerts([
        { 
          id: 1, 
          type: 'counterfeit', 
          batchId: 1, 
          drugId: 1,
          message: 'Possible counterfeit reported from Pharmacy Z', 
          date: '2023-03-28', 
          status: 'pending',
          reporter: 'Pharmacy Z',
          location: 'City X'
        }
      ]);

      // Sample distributors
      setDistributors([
        { id: 'DIST001', name: 'Distributor A', location: 'City X', trustScore: 95 },
        { id: 'DIST002', name: 'Distributor B', location: 'City Y', trustScore: 75 },
        { id: 'DIST003', name: 'Distributor C', location: 'City Z', trustScore: 40 }
      ]);
    }, 500);
  }, []);

  const handleDrugInputChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'image') {
      setNewDrug({ ...newDrug, image: files[0] });
    } else {
      setNewDrug({ ...newDrug, [name]: value });
    }
  };

  const handleShipmentInputChange = (e) => {
    const { name, value } = e.target;
    setNewShipment({ ...newShipment, [name]: value });
  };

const createDrug = async (e) => {
    e.preventDefault();
    
    if (!walletConnected) {
        alert("Please connect your wallet first");
        return;
    }

    if (!user || !user._id) {
        alert("User information is missing. Please log in again.");
        return;
    }

    try {
        let newDrugWithBarcode;
        let barcode;
        
        if (barcodeOption === 'generate') {
            barcode = `MC${Math.floor(10000000 + Math.random() * 90000000)}`;
            newDrugWithBarcode = {
                ...newDrug,
                barcode,  // Removed manual id assignment
                barcodeOption: 'generate',
                barcodeType: 'MedChain',
            
            };
        } else {
            barcode = newDrug.existingBarcode;
            newDrugWithBarcode = {
                ...newDrug,
                barcode,  // Removed manual id assignment
                barcodeOption: 'existing',
                barcodeType: newDrug.barcodeType,
               
            };
        }
        
        const formData = new FormData();
        // Add all drug data to formData
        Object.entries(newDrugWithBarcode).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                formData.append(key, value);
            }
        });
        // Add image file if exists
        if (newDrug.image) {
            formData.append('image', newDrug.image);
        }
        // Add manufacturer
        formData.append('manufacturer', user._id);
        console.log(formData);
        
        const response = await fetch('http://localhost:5000/api/drugs', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: formData
        });
        
        if (!response.ok) {
            throw new Error('Failed to save drug to database');
        }
        
        const savedDrug = await response.json();
        console.log(savedDrug);
        
        
        // Update UI
        setDrugs([...drugs, savedDrug]);
        setNewDrug({
            name: '',
            composition: '',
            dosage: '',
            expiryDate: '',
            batchNumber: '',
            manufacturingDate: '',
            image: null,
            existingBarcode: '',
            barcodeType: 'GS1'
        });
        
        alert(`Drug created successfully with barcode: ${barcode}`);
    } catch (error) {
        console.error("Error creating drug:", error);
        alert(`Failed to create drug: ${error.message}`);
    }
};
const createShipment = async (e) => {
  e.preventDefault();
  
  if (!walletConnected) {
      alert("Please connect your wallet first");
      return;
  }

  try {
      const batch = batches.find(b => b.id === newShipment.batchId);
      const drug = drugs.find(d => d.id === batch.drugId);
      const distributor = distributors.find(d => d.id === newShipment.distributorId);
      
      // First update the drug with distributor info
      const updateResponse = await fetch(`http://localhost:5000/api/drugs/${drug._id}`, {
          method: 'PUT',
          headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
              distributor: distributor.name,
              currentHolder: distributor.name
          })
      });
      
      if (!updateResponse.ok) {
          throw new Error('Failed to update drug with distributor info');
      }
      
              // Then create shipment on blockchain
              const blockchainResult = await createShipment({
                batchId:batch.id,
                quantity: newShipment.quantity,
                 distributorAddress: distributor.blockchainAddress,
                destination: newShipment.destination
              })

              if (!blockchainResult.success) {
            throw new Error('Blockchain transaction failed');
        }

      const shipmentResponse = await fetch('http://localhost:5000/api/shipments', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
              ...newShipment,
              drugId: drug._id,
              distributorAddress: distributor.blockchainAddress,
              blockchainTx: blockchainResult.txHash
          })
      });
      
      if (!shipmentResponse.ok) {
             throw new Error('Failed to create shipment in database');
      }
      
      const savedShipment = await shipmentResponse.json();
      
      // Update UI
      const updatedDrugs = drugs.map(d => 
          d._id === drug._id ? { ...d, distributor: distributor.name, currentHolder: distributor.name } : d
      );
      
      const updatedBatches = batches.map(b => 
          b.id === newShipment.batchId ? { ...b, status: 'shipped' } : b
      );
      
      setDrugs(updatedDrugs);
      setBatches(updatedBatches);
      setShipments([...shipments, savedShipment]);
      setNewShipment({
          batchId: '',
          quantity: '',
          distributorId: '',
          destination: ''
      });
      
      alert(`Shipment created successfully! Transaction hash: ${blockchainResult.txHash}...Shipment initiated for ${drug?.name} to ${distributor?.name}.`);
  } catch (error) {
      console.error("Error creating shipment:", error);
      alert(`Failed to create shipment: ${error.message}`);
  }
};

  const handleRecall = (batchId) => {
    const batch = batches.find(b => b.id === batchId);
    const drug = drugs.find(d => d.id === batch.drugId);
    
    if (confirm(`Initiate recall for ${drug?.name} (Batch ${batchId})? This will notify all supply chain partners.`)) {
      const updatedAlerts = [...alerts, {
        id: alerts.length + 1,
        type: 'recall',
        batchId,
        drugId: drug.id,
        message: `Recall initiated for ${drug.name} (Batch ${batchId})`,
        date: new Date().toISOString().split('T')[0],
        status: 'active',
        initiatedBy: user.name
      }];
      
      setAlerts(updatedAlerts);
      alert(`Recall initiated for ${drug?.name} (Batch ${batchId}). Blockchain alert sent to all partners.`);
    }
  };

  const verifyBatch = async (batchId) => {
    try {
        const batch = batches.find(b => b.id === batchId);
        const drug = drugs.find(d => d.id === batch.drugId);
        
        if (!drug) {
            throw new Error("Drug not found");
        }

        const result = await verifyDrug(drug.barcode);
        
        if (result) {
            alert(`Verifying ${drug?.name} (${drug?.barcode}) on blockchain...\n\n` +
                  `Blockchain verification complete:\n` +
                  `- Drug: ${result.name}\n` +
                  `- Batch: ${result.batchNumber}\n` +
                  `- Status: Authentic`);
        } else {
            alert("Batch not found on blockchain");
        }
    } catch (error) {
        console.error("Verification error:", error);
        alert(`Failed to verify batch on blockchain: ${error.message}`);
    }
};


useEffect(() => {
  if (user && user._id) {
    const fetchManufacturerDrugs = async () => {
      console.log("Fetching drugs for user:", user._id);
      try {
        const response = await fetch(`http://localhost:5000/api/drugs/manufacturer/${user._id}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (response.ok) {
          const drugsData = await response.json();
          setDrugs(drugsData);
        }
      } catch (error) {
        console.error("Error fetching drugs:", error);
      }
    };
    fetchManufacturerDrugs();
  }
}, [user]);

  return (
    <div className="manufacturer-dashboard">
      <header className="dashboard-header">
        <div className="header-container">
          <div className="header-left">
            <h1>MedChain Manufacturer Portal</h1>
            {walletConnected ? (
        <p className="wallet-address">Blockchain Wallet: {walletAddress.substring(0, 6)}...{walletAddress.substring(walletAddress.length - 4)}</p>
    ) : (
        <button onClick={connectWalletHandler} className="connect-wallet-btn">
            <i className="fas fa-wallet"></i> Connect Wallet
        </button>
    )}
          </div>
          <div className="header-right">
            <div className="user-info">
              <span className="user-name">{user?.name}</span>
              <span className="user-org">{user?.organization}</span>
            </div>
            <button onClick={logout} className="logout-btn">
              <i className="fas fa-sign-out-alt"></i> Logout
            </button>
          </div>
        </div>
      </header>

      <div className="dashboard-container">
        <aside className="sidebar">
          <div className="sidebar-header">
            <div className="logo-container">
              <div className="logo">MC</div>
              <span>Manufacturer</span>
            </div>
          </div>
          <nav>
            <ul>
              <li className={activeTab === 'dashboard' ? 'active' : ''} onClick={() => setActiveTab('dashboard')}>
                <i className="fas fa-tachometer-alt"></i>
                <span>Dashboard</span>
              </li>
              <li className={activeTab === 'drugs' ? 'active' : ''} onClick={() => setActiveTab('drugs')}>
                <i className="fas fa-pills"></i>
                <span>Drug Creation</span>
              </li>
              <li className={activeTab === 'batches' ? 'active' : ''} onClick={() => setActiveTab('batches')}>
                <i className="fas fa-boxes"></i>
                <span>Batch Management</span>
              </li>
              <li className={activeTab === 'shipments' ? 'active' : ''} onClick={() => setActiveTab('shipments')}>
                <i className="fas fa-truck"></i>
                <span>Shipments</span>
              </li>
              <li className={activeTab === 'alerts' ? 'active' : ''} onClick={() => setActiveTab('alerts')}>
                <i className="fas fa-exclamation-triangle"></i>
                <span>Alerts</span>
              </li>
              <li className={activeTab === 'analytics' ? 'active' : ''} onClick={() => setActiveTab('analytics')}>
                <i className="fas fa-chart-line"></i>
                <span>Analytics</span>
              </li>
            </ul>
          </nav>
        </aside>

        <main className="main-content">
          {activeTab === 'dashboard' && (
            <section className="overview-section">
              <h2 className="section-title">
                <i className="fas fa-tachometer-alt"></i> Manufacturing Overview
              </h2>
              
              <div className="stats-grid">
                <StatCard 
                  icon="pills"
                  value={drugs.length}
                  label="Total Drugs"
                  trend="up"
                  trendValue="12%"
                />
                <StatCard 
                  icon="boxes"
                  value={batches.length}
                  label="Active Batches"
                  trend="down"
                  trendValue="5%"
                />
                <StatCard 
                  icon="truck"
                  value={shipments.filter(s => s.status === 'in_transit').length}
                  label="Open Shipments"
                  trend="up"
                  trendValue="23%"
                />
                <StatCard 
                  icon="exclamation-triangle"
                  value={alerts.length}
                  label="Active Alerts"
                  trend="neutral"
                />
              </div>

              <div className="recent-activity">
                <h3>
                  <i className="fas fa-history"></i> Recent Blockchain Transactions
                </h3>
                <div className="activity-list">
                  {shipments.slice(0, 5).map(shipment => {
                    const drug = drugs.find(d => d.id === shipment.drugId);
                    return (
                      <div key={shipment.id} className="activity-item">
                        <div className="activity-icon">
                          <i className="fas fa-shipping-fast"></i>
                        </div>
                        <div className="activity-details">
                          <span className="activity-date">{shipment.date}</span>
                          <p className="activity-desc">
                            Shipped {shipment.quantity} units of {drug?.name} to {shipment.distributor}
                          </p>
                        </div>
                        <span className={`status-badge ${shipment.status}`}>
                          {shipment.status.replace('_', ' ')}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>
          )}

          {activeTab === 'drugs' && (
            <section className="drug-creation-section">
              <h2 className="section-title">
                <i className="fas fa-pills"></i> Drug Creation
              </h2>
              
              <div className="form-container">
                <form onSubmit={createDrug}>
                  <div className="form-section">
                    <h3>Basic Information</h3>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Drug Name*</label>
                        <input
                          type="text"
                          name="name"
                          value={newDrug.name}
                          onChange={handleDrugInputChange}
                          required
                          placeholder="e.g., Paracetamol 500mg"
                        />
                      </div>
                      <div className="form-group">
                        <label>Composition*</label>
                        <input
                          type="text"
                          name="composition"
                          value={newDrug.composition}
                          onChange={handleDrugInputChange}
                          required
                          placeholder="Active ingredients"
                        />
                      </div>
                    </div>
                    
                    <div className="form-row">
                      <div className="form-group">
                        <label>Batch Number*</label>
                        <input
                          type="text"
                          name="batchNumber"
                          value={newDrug.batchNumber}
                          onChange={handleDrugInputChange}
                          required
                          placeholder="e.g., BATCH001"
                        />
                      </div>
                      <div className="form-group">
                        <label>Dosage Form*</label>
                        <input
                          type="text"
                          name="dosage"
                          value={newDrug.dosage}
                          onChange={handleDrugInputChange}
                          required
                          placeholder="e.g., Tablet, Capsule"
                        />
                      </div>
                    </div>
                    
                    <div className="form-row">
                      <div className="form-group">
                        <label>Manufacturing Date*</label>
                        <input
                          type="date"
                          name="manufacturingDate"
                          value={newDrug.manufacturingDate}
                          onChange={handleDrugInputChange}
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label>Expiry Date*</label>
                        <input
                          type="date"
                          name="expiryDate"
                          value={newDrug.expiryDate}
                          onChange={handleDrugInputChange}
                          required
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="form-section">
                    <h3>Barcode Options</h3>
                    <div className="barcode-options">
                      <div className="option-radio">
                        <input
                          type="radio"
                          id="generate-barcode"
                          name="barcodeOption"
                          checked={barcodeOption === 'generate'}
                          onChange={() => setBarcodeOption('generate')}
                        />
                        <label htmlFor="generate-barcode">
                          <div className="option-content">
                            <i className="fas fa-qrcode"></i>
                            <span>Generate MedChain Barcode</span>
                            <p>We'll create a unique identifier and barcode for this drug</p>
                          </div>
                        </label>
                      </div>
                      
                      <div className="option-radio">
                        <input
                          type="radio"
                          id="existing-barcode"
                          name="barcodeOption"
                          checked={barcodeOption === 'existing'}
                          onChange={() => setBarcodeOption('existing')}
                        />
                        <label htmlFor="existing-barcode">
                          <div className="option-content">
                            <i className="fas fa-barcode"></i>
                            <span>Use Existing Barcode</span>
                            <p>Map to an existing GS1 or manufacturer barcode</p>
                          </div>
                        </label>
                      </div>
                    </div>
                    
                    {barcodeOption === 'existing' && (
                      <div className="form-row">
                        <div className="form-group">
                          <label>Existing Barcode*</label>
                          <div className="barcode-input-group">
                            <input
                              type="text"
                              name="existingBarcode"
                              value={newDrug.existingBarcode}
                              onChange={handleDrugInputChange}
                              required={barcodeOption === 'existing'}
                              placeholder="Enter the existing barcode"
                            />
                            <button 
                              type="button" 
                              className="scan-btn"
                              onClick={startScanner}
                            >
                              <i className="fas fa-camera"></i> Scan
                            </button>
                          </div>
                        </div>
                        <div className="form-group">
                          <label>Barcode Type*</label>
                          <select
                            name="barcodeType"
                            value={newDrug.barcodeType}
                            onChange={handleDrugInputChange}
                            required={barcodeOption === 'existing'}
                          >
                            <option value="GS1">GS1</option>
                            <option value="UPC">UPC</option>
                            <option value="EAN">EAN</option>
                            <option value="OTHER">Other</option>
                          </select>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="form-section">
                    <h3>Packaging Image</h3>
                    <div className="form-group">
                      <label>Upload Packaging Image*</label>
                      <div className="file-upload">
                        <label>
                          <i className="fas fa-cloud-upload-alt"></i>
                          <span>{newDrug.image ? newDrug.image.name : 'Choose file...'}</span>
                          <input
                            type="file"
                            name="image"
                            onChange={handleDrugInputChange}
                            accept="image/*"
                            required
                          />
                        </label>
                      </div>
                    </div>
                  </div>
                  
                  <button type="submit" className="submit-btn">
                    <i className="fas fa-save"></i> Create Drug & Record on Blockchain
                  </button>
                </form>
              </div>

              <div className="drugs-list">
  <h3><i className="fas fa-list"></i> Your Drugs</h3>
  <div className="table-container">
    <table>
      <thead>
        <tr>
          <th>Name</th>
          <th>Batch</th>
          <th>Manufacturer</th>
          <th>Current Holder</th>
          <th>Expiry</th>
          <th>Barcode</th>
          <th>Type</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {drugs.map(drug => (
  <tr key={drug._id || drug.id}>
    <td>{drug.name}</td>
    <td>{drug.batchNumber}</td>
    <td>{drug.manufacturer || user.organization}</td>
    <td>
      {drug.currentHolder || 'Manufacturer'}
      {drug.distributor && ` → ${drug.distributor}`}
      {drug.retailer && ` → ${drug.retailer}`}
    </td>
    <td>{new Date(drug.expiryDate).toLocaleDateString()}</td>
    <td className="barcode-cell">
      <BarcodeDisplay value={drug.barcode} />
    </td>
    <td>
      <span className={`barcode-type ${drug.barcodeOption}`}>
        {drug.barcodeOption === 'generate' ? 'MedChain' : drug.barcodeType}
      </span>
    </td>
    <td>
      <button 
        className="action-btn scan-btn"
        onClick={() => {
          setScannedBarcode(drug.barcode);
          verifyScannedBarcode(drug.barcode);
        }}
      >
        <i className="fas fa-search"></i> Verify
      </button>
      <button 
        className="action-btn track-btn"
        onClick={() => trackSupplyChain(drug._id)}
      >
        <i className="fas fa-truck"></i> Track
      </button>
    </td>
  </tr>
))}

      </tbody>
    </table>
  </div>
</div>
            </section>
          )}

          {activeTab === 'batches' && (
            <section className="batch-section">
              <h2 className="section-title">
                <i className="fas fa-boxes"></i> Batch Management
              </h2>
              <div className="batch-grid">
                {batches.map(batch => {
                  const drug = drugs.find(d => d.id === batch.drugId);
                  return (
                    <div key={batch.id} className="batch-card">
                      <div className="batch-header">
                        <h3>{drug?.name || 'Unknown Drug'}</h3>
                        <span className={`batch-status ${batch.status}`}>{batch.status}</span>
                      </div>
                      <div className="batch-details">
                        <p><strong>Batch ID:</strong> {batch.id}</p>
                        <p><strong>Quantity:</strong> {batch.quantity} units</p>
                        <p><strong>Manufactured:</strong> {batch.manufacturingDate}</p>
                        <div className="batch-barcode">
                          <BarcodeDisplay value={drug?.barcode || 'BC00000000'} />
                          <p className="barcode-type-label">
                            {drug?.barcodeOption === 'generate' ? 'MedChain' : drug?.barcodeType} Barcode
                          </p>
                        </div>
                      </div>
                      <div className="batch-actions">
                        <button 
                          className="action-btn view-btn"
                          onClick={() => verifyBatch(batch.id)}
                        >
                          <i className="fas fa-shield-alt"></i> Verify on Blockchain
                        </button>
                        {batch.status === 'in_storage' && (
                          <button 
                            className="action-btn ship-btn"
                            onClick={() => {
                              setNewShipment(prev => ({ ...prev, batchId: batch.id }));
                              setActiveTab('shipments');
                            }}
                          >
                            <i className="fas fa-truck-loading"></i> Initiate Shipment
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {activeTab === 'shipments' && (
            <section className="shipment-section">
              <div className="shipment-form-container">
                <h2 className="section-title">
                  <i className="fas fa-truck"></i> Create New Shipment
                </h2>
                <form onSubmit={createShipment}>
                  <div className="form-group">
                    <label>Select Batch</label>
                    <select
                      name="batchId"
                      value={newShipment.batchId}
                      onChange={handleShipmentInputChange}
                      required
                    >
                      <option value="">Select a batch</option>
                      {batches
                        .filter(b => b.status === 'in_storage')
                        .map(batch => {
                          const drug = drugs.find(d => d.id === batch.drugId);
                          return (
                            <option key={batch.id} value={batch.id}>
                              Batch {batch.id} ({drug?.name || 'Unknown'}) - {batch.quantity} units
                            </option>
                          );
                        })}
                    </select>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Quantity</label>
                      <input
                        type="number"
                        name="quantity"
                        value={newShipment.quantity}
                        onChange={handleShipmentInputChange}
                        required
                        min="1"
                        placeholder="Units to ship"
                      />
                    </div>
                    <div className="form-group">
                      <label>Distributor</label>
                      <select
                        name="distributorId"
                        value={newShipment.distributorId}
                        onChange={handleShipmentInputChange}
                        required
                      >
                        <option value="">Select distributor</option>
                        {distributors.map(dist => (
                          <option key={dist.id} value={dist.id}>
                            {dist.name} ({dist.location}) - Trust: {dist.trustScore}%
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Destination</label>
                    <input
                      type="text"
                      name="destination"
                      value={newShipment.destination}
                      onChange={handleShipmentInputChange}
                      required
                      placeholder="City, Country"
                    />
                  </div>
                  <button type="submit" className="submit-btn">
                    <i className="fas fa-paper-plane"></i> Create Shipment & Log on Blockchain
                  </button>
                </form>
              </div>

              <div className="shipments-list">
                <h3 className="section-title">
                  <i className="fas fa-history"></i> Shipment History
                </h3>
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Batch</th>
                        <th>Drug</th>
                        <th>Barcode</th>
                        <th>Quantity</th>
                        <th>Distributor</th>
                        <th>Destination</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {shipments.map(shipment => {
                        const batch = batches.find(b => b.id === shipment.batchId);
                        const drug = batch ? drugs.find(d => d.id === batch.drugId) : null;
                        return (
                          <tr key={shipment.id}>
                            <td>{shipment.date}</td>
                            <td>{shipment.batchId}</td>
                            <td>{drug?.name || 'Unknown'}</td>
                            <td className="barcode-cell">
                              {drug && <BarcodeDisplay value={drug.barcode} />}
                            </td>
                            <td>{shipment.quantity}</td>
                            <td>{shipment.distributor}</td>
                            <td>{shipment.destination}</td>
                            <td>
                              <span className={`status-badge ${shipment.status}`}>
                                {shipment.status}
                              </span>
                            </td>
                            <td>
                              <button className="action-btn view-btn">
                                <i className="fas fa-eye"></i> Details
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          )}

          {activeTab === 'alerts' && (
            <section className="alerts-section">
              <h2 className="section-title">
                <i className="fas fa-exclamation-triangle"></i> Counterfeit Alerts & Reports
              </h2>
              <div className="alerts-grid">
                {alerts.map(alert => {
                  const drug = drugs.find(d => d.id === alert.drugId);
                  return (
                    <div key={alert.id} className={`alert-card ${alert.type}`}>
                      <div className="alert-header">
                        <h3>
                          {alert.type === 'counterfeit' && <><i className="fas fa-ban"></i> Counterfeit Report</>}
                          {alert.type === 'missing_scan' && <><i className="fas fa-search-minus"></i> Missing Scan</>}
                          {alert.type === 'recall' && <><i className="fas fa-undo"></i> Active Recall</>}
                        </h3>
                        <span className="alert-date">{alert.date}</span>
                      </div>
                      <div className="alert-body">
                        <p>{alert.message}</p>
                        <div className="alert-details">
                          <p><strong>Drug:</strong> {drug?.name || 'Unknown'}</p>
                          <p><strong>Batch ID:</strong> {alert.batchId}</p>
                          {drug && (
                            <div className="shipment-barcode">
                              <BarcodeDisplay value={drug.barcode} />
                              <p>{drug.barcodeOption === 'generate' ? 'MedChain' : drug.barcodeType} Barcode</p>
                            </div>
                          )}
                          {alert.type === 'counterfeit' && (
                            <p><strong>Reported by:</strong> {alert.reporter} ({alert.location})</p>
                          )}
                          {alert.type === 'missing_scan' && (
                            <p><strong>Last Scan:</strong> {alert.lastScan}</p>
                          )}
                        </div>
                      </div>
                      <div className="alert-footer">
                        <span className={`status-badge ${alert.status}`}>
                          <i className={`fas ${
                            alert.status === 'active' ? 'fa-exclamation-circle' :
                            alert.status === 'pending' ? 'fa-clock' :
                            'fa-search'
                          }`}></i> {alert.status}
                        </span>
                        <div className="alert-actions">
                          <button className="action-btn view-btn">
                            <i className="fas fa-eye"></i> Details
                          </button>
                          {alert.type !== 'recall' && (
                            <button 
                              className="action-btn recall-btn"
                              onClick={() => handleRecall(alert.batchId)}
                            >
                              <i className="fas fa-undo"></i> Initiate Recall
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {activeTab === 'analytics' && (
            <section className="analytics-section">
              <h2 className="section-title">
                <i className="fas fa-chart-line"></i> Manufacturing Analytics
              </h2>
              <div className="analytics-grid">
                <div className="chart-container">
                  <h3>Drug Production</h3>
                  <div className="chart-placeholder">
                    <p>Monthly Production by Drug</p>
                    <div className="bar-chart">
                      {drugs.map(drug => (
                        <div key={drug.id} className="bar-container">
                          <div 
                            className="bar" 
                            style={{ width: `${Math.min(100, Math.random() * 80 + 20)}%` }}
                          >
                            {drug.name}
                            <span className="bar-value">
                              {Math.floor(Math.random() * 1000)} units
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="chart-container">
                  <h3>Shipment Distribution</h3>
                  <div className="chart-placeholder">
                    <p>Geographical Distribution</p>
                    <div className="map-grid">
                      <div className="map-region">North: 35%</div>
                      <div className="map-region">South: 25%</div>
                      <div className="map-region">East: 30%</div>
                      <div className="map-region">West: 10%</div>
                    </div>
                  </div>
                </div>
                <div className="stats-container">
                  <h3>Key Metrics</h3>
                  <div className="metrics-grid">
                    <div className="metric-card">
                      <h4>Total Production</h4>
                      <p>1,500 units</p>
                    </div>
                    <div className="metric-card">
                      <h4>Shipped Last Month</h4>
                      <p>700 units</p>
                    </div>
                    <div className="metric-card">
                      <h4>Counterfeit Reports</h4>
                      <p>{alerts.filter(a => a.type === 'counterfeit').length}</p>
                    </div>
                    <div className="metric-card">
                      <h4>Trusted Partners</h4>
                      <p>{distributors.filter(d => d.trustScore >= 80).length}</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}
        </main>
      </div>

      {/* Barcode Scanner Modal */}
      {isScanning && (
        <div className="scanner-modal">
          <div className="scanner-container">
            <div className="scanner-header">
              <h3>Scan Barcode</h3>
              <button onClick={stopScanner} className="close-btn">
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="scanner-viewport">
              <BarcodeScannerComponent
                width={500}
                height={300}
                onUpdate={handleScan}
              />
            </div>
            <div className="scanner-footer">
              <p>Point your camera at a barcode to scan</p>
              {scannedBarcode && (
                <div className="scan-result">
                  <p>Scanned: <strong>{scannedBarcode}</strong></p>
                  <button 
                    className="submit-btn"
                    onClick={handleUseScannedBarcode}
                  >
                    Use This Barcode
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Scan Result Modal */}
     {/* // Update the Scan Result Modal JSX in your return statement: */}
{scanResult && !isScanning && (
    <div className="scan-result-modal">
        <div className="modal-content">
            <div className="modal-header">
                <h3>
                    {scanResult.type === 'success' ? (
                        <><i className="fas fa-check-circle success-icon"></i> Valid Product</>
                    ) : (
                        <><i className="fas fa-exclamation-circle error-icon"></i> Product Not Found</>
                    )}
                </h3>
                <button onClick={() => setScanResult(null)} className="close-btn">
                    <i className="fas fa-times"></i>
                </button>
            </div>
            <div className="modal-body">
                <p>{scanResult.message}</p>
                
                {scanResult.type === 'success' && scanResult.drug && (
                    <div className="product-details-container">
                        <div className="product-barcode-section">
                            <BarcodeDisplay value={scanResult.drug.barcode} />
                            {scanResult.source === 'blockchain' && (
                                <div className="blockchain-badge">
                                    <i className="fas fa-link"></i> Blockchain Verified
                                </div>
                            )}
                            {scanResult.source === 'database' && (
                                <div className="database-badge">
                                    <i className="fas fa-database"></i> Database Record
                                </div>
                            )}
                        </div>
                        
                        <div className="product-info-section">
                            <h4>Product Information</h4>
                            <div className="info-grid">
                                <div className="info-item">
                                    <span className="info-label">Name:</span>
                                    <span className="info-value">{scanResult.drug.name}</span>
                                </div>
                                <div className="info-item">
                                    <span className="info-label">Batch:</span>
                                    <span className="info-value">{scanResult.drug.batchNumber}</span>
                                </div>
                                <div className="info-item">
                                    <span className="info-label">Manufacturer:</span>
                                    <span className="info-value">{scanResult.drug.manufacturer}</span>
                                </div>
                                <div className="info-item">
                                    <span className="info-label">Current Holder:</span>
                                    <span className="info-value">{scanResult.drug.currentHolder || 'Manufacturer'}</span>
                                </div>
                                <div className="info-item">
                                    <span className="info-label">Composition:</span>
                                    <span className="info-value">{scanResult.drug.composition}</span>
                                </div>
                                <div className="info-item">
                                    <span className="info-label">Dosage:</span>
                                    <span className="info-value">{scanResult.drug.dosage}</span>
                                </div>
                                <div className="info-item">
                                    <span className="info-label">Manufacturing Date:</span>
                                    <span className="info-value">
                                        {new Date(scanResult.drug.manufacturingDate).toLocaleDateString()}
                                    </span>
                                </div>
                                <div className="info-item">
                                    <span className="info-label">Expiry Date:</span>
                                    <span className="info-value">
                                        {new Date(scanResult.drug.expiryDate).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            <div className="modal-footer">
                <button 
                    className="submit-btn"
                    onClick={() => setScanResult(null)}
                >
                    Close
                </button>
                {scanResult.type === 'success' && (
                    <button 
                        className="track-btn"
                        onClick={() => trackSupplyChain(scanResult.drug._id)}
                    >
                        <i className="fas fa-truck"></i> Track Supply Chain
                    </button>
                )}
            </div>
        </div>
    </div>
)}
    </div>
  );
}

const StatCard = ({ icon, value, label, trend, trendValue }) => (
  <div className="stat-card">
    <div className="stat-icon">
      <i className={`fas fa-${icon}`}></i>
    </div>
    <div className="stat-content">
      <p className="stat-value">{value}</p>
      <p className="stat-label">{label}</p>
      {trend && (
        <p className={`stat-trend ${trend}`}>
          <i className={`fas fa-arrow-${trend}`}></i> {trendValue}
        </p>
      )}
    </div>
  </div>
);