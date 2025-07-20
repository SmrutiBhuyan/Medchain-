import { useState, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';
import JsBarcode from 'jsbarcode';
import './ManufacturerDashboard.css';

const BarcodeDisplay = ({ barcodeNumber }) => {
  const barcodeRef = useRef(null);

  useEffect(() => {
    if (barcodeRef.current && barcodeNumber) {
      JsBarcode(barcodeRef.current, barcodeNumber, {
        format: "CODE128",
        lineColor: "#000",
        width: 2,
        height: 60,
        displayValue: true,
        fontSize: 14,
        margin: 10
      });
    }
  }, [barcodeNumber]);

  return <svg ref={barcodeRef} />;
};

export default function ManufacturerDashboard() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [drugs, setDrugs] = useState([]);
  const [batches, setBatches] = useState([]);
  const [shipments, setShipments] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [distributors, setDistributors] = useState([]);
  
  const [newDrug, setNewDrug] = useState({
    name: '',
    composition: '',
    dosage: '',
    expiryDate: '',
    batchNumber: '',
    manufacturingDate: '',
    image: null
  });

  const [newShipment, setNewShipment] = useState({
    batchId: '',
    quantity: '',
    distributorId: '',
    destination: ''
  });

  // Simulate fetching data
  useEffect(() => {
    setTimeout(() => {
      // Sample drugs with barcodes
      setDrugs([
        { 
          id: 1, 
          name: 'Paracetamol 500mg', 
          composition: 'Paracetamol', 
          batchNumber: 'BATCH001', 
          expiryDate: '2024-12-31', 
          barcode: 'BC10012345',
          manufacturingDate: '2023-01-10'
        },
        { 
          id: 2, 
          name: 'Ibuprofen 200mg', 
          composition: 'Ibuprofen', 
          batchNumber: 'BATCH002', 
          expiryDate: '2025-06-30', 
          barcode: 'BC10023456',
          manufacturingDate: '2023-02-15'
        }
      ]);

      // Sample batches
      setBatches([
        { id: 1, drugId: 1, quantity: 1000, status: 'in_storage', manufacturingDate: '2023-01-15' },
        { id: 2, drugId: 2, quantity: 500, status: 'shipped', manufacturingDate: '2023-02-20' }
      ]);

      // Sample shipments
      setShipments([
        { 
          id: 1, 
          batchId: 2, 
          drugId: 2,
          quantity: 500, 
          distributor: 'Distributor A', 
          distributorId: 'DIST001',
          destination: 'City X', 
          status: 'delivered', 
          date: '2023-03-15',
          trackingNumber: 'TRK1001'
        },
        { 
          id: 2, 
          batchId: 1, 
          drugId: 1,
          quantity: 200, 
          distributor: 'Distributor B', 
          distributorId: 'DIST002',
          destination: 'City Y', 
          status: 'in_transit', 
          date: '2023-04-01',
          trackingNumber: 'TRK1002'
        }
      ]);

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
        },
        { 
          id: 2, 
          type: 'missing_scan', 
          batchId: 2, 
          drugId: 2,
          message: 'Missing scan at Warehouse 3', 
          date: '2023-04-05', 
          status: 'investigating',
          lastScan: 'Warehouse 2',
          missingAt: 'Warehouse 3'
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

  const createDrug = (e) => {
    e.preventDefault();
    const barcodeNumber = `BC${Math.floor(10000000 + Math.random() * 90000000)}`;
    const newDrugWithBarcode = {
      ...newDrug,
      id: drugs.length + 1,
      barcode: barcodeNumber
    };
    setDrugs([...drugs, newDrugWithBarcode]);
    setNewDrug({
      name: '',
      composition: '',
      dosage: '',
      expiryDate: '',
      batchNumber: '',
      manufacturingDate: '',
      image: null
    });
    alert(`Drug created with barcode ${barcodeNumber} and recorded on blockchain`);
  };

  const createShipment = (e) => {
    e.preventDefault();
    const batch = batches.find(b => b.id === newShipment.batchId);
    const drug = drugs.find(d => d.id === batch.drugId);
    const distributor = distributors.find(d => d.id === newShipment.distributorId);
    
    const newShipmentWithDetails = {
      ...newShipment,
      id: shipments.length + 1,
      drugId: batch.drugId,
      date: new Date().toISOString().split('T')[0],
      status: 'in_transit',
      distributor: distributor?.name || 'Unknown',
      trackingNumber: `TRK${Math.floor(1000 + Math.random() * 9000)}`
    };
    
    // Update batch status
    const updatedBatches = batches.map(b => 
      b.id === newShipment.batchId ? { ...b, status: 'shipped' } : b
    );
    
    setBatches(updatedBatches);
    setShipments([...shipments, newShipmentWithDetails]);
    setNewShipment({
      batchId: '',
      quantity: '',
      distributorId: '',
      destination: ''
    });
    alert(`Shipment initiated for ${drug?.name} (${batch.quantity} units) to ${distributor?.name}. Blockchain transaction recorded.`);
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

  const verifyBatch = (batchId) => {
    const batch = batches.find(b => b.id === batchId);
    const drug = drugs.find(d => d.id === batch.drugId);
    alert(`Verifying ${drug?.name} (${drug?.barcode}) on blockchain...\n\nBlockchain verification complete: Authentic batch.`);
  };

  return (
    <div className="manufacturer-dashboard">
      <header className="dashboard-header">
        <div className="header-content">
          <h1>Manufacturer Dashboard</h1>
          <div className="user-info">
            <span>Welcome, {user?.name}</span>
            <span className="wallet-address">Wallet: {user?.walletAddress}</span>
            <button onClick={logout} className="logout-btn">Logout</button>
          </div>
        </div>
      </header>

      <div className="dashboard-container">
        <aside className="sidebar">
          <nav>
            <ul>
              <li className={activeTab === 'dashboard' ? 'active' : ''} onClick={() => setActiveTab('dashboard')}>
                <a href="#dashboard">Dashboard</a>
              </li>
              <li className={activeTab === 'drugs' ? 'active' : ''} onClick={() => setActiveTab('drugs')}>
                <a href="#drugs">Drug Creation</a>
              </li>
              <li className={activeTab === 'batches' ? 'active' : ''} onClick={() => setActiveTab('batches')}>
                <a href="#batches">Batch Management</a>
              </li>
              <li className={activeTab === 'shipments' ? 'active' : ''} onClick={() => setActiveTab('shipments')}>
                <a href="#shipments">Shipments</a>
              </li>
              <li className={activeTab === 'alerts' ? 'active' : ''} onClick={() => setActiveTab('alerts')}>
                <a href="#alerts">Counterfeit Alerts</a>
              </li>
              <li className={activeTab === 'analytics' ? 'active' : ''} onClick={() => setActiveTab('analytics')}>
                <a href="#analytics">Analytics</a>
              </li>
              <li className={activeTab === 'partners' ? 'active' : ''} onClick={() => setActiveTab('partners')}>
                <a href="#partners">Partner Management</a>
              </li>
            </ul>
          </nav>
        </aside>

        <main className="main-content">
          {activeTab === 'dashboard' && (
            <section className="overview-section">
              <h2>Manufacturing Overview</h2>
              <div className="stats-grid">
                <div className="stat-card">
                  <h3>Total Drugs</h3>
                  <p className="stat-value">{drugs.length}</p>
                  <p className="stat-label">Registered in system</p>
                </div>
                <div className="stat-card">
                  <h3>Active Batches</h3>
                  <p className="stat-value">{batches.length}</p>
                  <p className="stat-label">In production/distribution</p>
                </div>
                <div className="stat-card">
                  <h3>Open Shipments</h3>
                  <p className="stat-value">{shipments.filter(s => s.status === 'in_transit').length}</p>
                  <p className="stat-label">In transit to distributors</p>
                </div>
                <div className="stat-card">
                  <h3>Active Alerts</h3>
                  <p className="stat-value">{alerts.length}</p>
                  <p className="stat-label">Requiring attention</p>
                </div>
              </div>

              <div className="recent-activity">
                <h3>Recent Blockchain Transactions</h3>
                <div className="activity-list">
                  {shipments.slice(0, 5).map(shipment => {
                    const drug = drugs.find(d => d.id === shipment.drugId);
                    return (
                      <div key={shipment.id} className="activity-item">
                        <span className="activity-date">{shipment.date}</span>
                        <span className="activity-desc">
                          Shipped {shipment.quantity} units of {drug?.name} ({drug?.barcode}) to {shipment.distributor}
                        </span>
                        <span className={`status-badge ${shipment.status}`}>{shipment.status}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>
          )}

          {activeTab === 'drugs' && (
            <section className="drug-creation-section">
              <div className="form-container">
                <h2>Create New Drug</h2>
                <form onSubmit={createDrug}>
                  <div className="form-group">
                    <label>Drug Name</label>
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
                    <label>Composition</label>
                    <input
                      type="text"
                      name="composition"
                      value={newDrug.composition}
                      onChange={handleDrugInputChange}
                      required
                      placeholder="Active ingredients"
                    />
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Batch Number</label>
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
                      <label>Dosage Form</label>
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
                      <label>Manufacturing Date</label>
                      <input
                        type="date"
                        name="manufacturingDate"
                        value={newDrug.manufacturingDate}
                        onChange={handleDrugInputChange}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Expiry Date</label>
                      <input
                        type="date"
                        name="expiryDate"
                        value={newDrug.expiryDate}
                        onChange={handleDrugInputChange}
                        required
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Packaging Image (for barcode placement)</label>
                    <input
                      type="file"
                      name="image"
                      onChange={handleDrugInputChange}
                      accept="image/*"
                      required
                    />
                  </div>
                  <button type="submit" className="submit-btn">
                    Create Drug & Generate Barcode
                  </button>
                </form>
              </div>

              <div className="drugs-list">
                <h3>Your Drugs</h3>
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Composition</th>
                        <th>Batch</th>
                        <th>Expiry</th>
                        <th>Barcode</th>
                      </tr>
                    </thead>
                    <tbody>
                      {drugs.map(drug => (
                        <tr key={drug.id}>
                          <td>{drug.name}</td>
                          <td>{drug.composition}</td>
                          <td>{drug.batchNumber}</td>
                          <td>{drug.expiryDate}</td>
                          <td className="barcode-cell">
                            <BarcodeDisplay barcodeNumber={drug.barcode} />
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
              <h2>Batch Management</h2>
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
                          <BarcodeDisplay barcodeNumber={drug?.barcode || 'BC00000000'} />
                        </div>
                      </div>
                      <div className="batch-actions">
                        <button 
                          className="action-btn view-btn"
                          onClick={() => verifyBatch(batch.id)}
                        >
                          Verify on Blockchain
                        </button>
                        {batch.status === 'in_storage' && (
                          <button 
                            className="action-btn ship-btn"
                            onClick={() => {
                              setNewShipment(prev => ({ ...prev, batchId: batch.id }));
                              setActiveTab('shipments');
                            }}
                          >
                            Initiate Shipment
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
                <h2>Create New Shipment</h2>
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
                    Create Shipment & Log on Blockchain
                  </button>
                </form>
              </div>

              <div className="shipments-list">
                <h3>Shipment History</h3>
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
                              {drug && <BarcodeDisplay barcodeNumber={drug.barcode} />}
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
                              <button className="action-btn view-btn">Details</button>
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
              <h2>Counterfeit Alerts & Reports</h2>
              <div className="alerts-grid">
                {alerts.map(alert => {
                  const drug = drugs.find(d => d.id === alert.drugId);
                  return (
                    <div key={alert.id} className={`alert-card ${alert.type}`}>
                      <div className="alert-header">
                        <h3>
                          {alert.type === 'counterfeit' && '🚨 Counterfeit Report'}
                          {alert.type === 'missing_scan' && '⚠️ Missing Scan'}
                          {alert.type === 'recall' && '🛑 Active Recall'}
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
                              <BarcodeDisplay barcodeNumber={drug.barcode} />
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
                        <span className={`status-badge ${alert.status}`}>{alert.status}</span>
                        <div className="alert-actions">
                          <button className="action-btn view-btn">Details</button>
                          {alert.type !== 'recall' && (
                            <button 
                              className="action-btn recall-btn"
                              onClick={() => handleRecall(alert.batchId)}
                            >
                              Initiate Recall
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
              <h2>Manufacturing Analytics</h2>
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

          {activeTab === 'partners' && (
            <section className="partners-section">
              <h2>Partner Management</h2>
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Distributor</th>
                      <th>Location</th>
                      <th>Batches Received</th>
                      <th>Last Shipment</th>
                      <th>Trust Score</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {distributors.map(dist => {
                      const distShipments = shipments.filter(s => s.distributorId === dist.id);
                      return (
                        <tr key={dist.id}>
                          <td>{dist.name}</td>
                          <td>{dist.location}</td>
                          <td>{distShipments.length} batches</td>
                          <td>
                            {distShipments.length > 0 
                              ? distShipments[distShipments.length - 1].date 
                              : 'Never'}
                          </td>
                          <td>
                            <div className="trust-meter">
                              <div 
                                className="trust-fill"
                                style={{ 
                                  width: `${dist.trustScore}%`,
                                  backgroundColor: 
                                    dist.trustScore >= 80 ? 'var(--success-color)' :
                                    dist.trustScore >= 60 ? 'var(--warning-color)' :
                                    'var(--danger-color)'
                                }}
                              ></div>
                            </div>
                            <span>{dist.trustScore}%</span>
                          </td>
                          <td>
                            <span className={`status-badge ${
                              dist.trustScore >= 80 ? 'trusted' :
                              dist.trustScore >= 60 ? 'warning' :
                              'danger'
                            }`}>
                              {dist.trustScore >= 80 ? 'Trusted' :
                               dist.trustScore >= 60 ? 'Warning' :
                               'Blacklisted'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}