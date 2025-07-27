import React, { useState } from 'react';
import { 
  Speedometer2, Truck, Clipboard2Pulse, Diagram3, ExclamationTriangle,
  PersonCircle, Gear, BoxArrowRight, Capsule, ExclamationTriangleFill, ClockFill,
  Funnel, Trash, Printer, Flag, Download, Filter, UpcScan, CheckCircleFill, 
  ShieldCheck, GraphUp, BoxSeam, Link45deg, Search
} from 'react-bootstrap-icons';
import { useAuth } from './AuthContext';
import './PharmacyDashboard.css';

const PharmacyDashboard = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [verificationResult, setVerificationResult] = useState(null);

  const inventoryData = [
    { id: 1, name: 'Amoxicillin 500mg', barcode: '3456789012', batch: 'AMX2023-05', expiry: '2024-06-30', quantity: 12, status: 'in_stock', lowStock: true, manufacturer: 'Sun Pharma' },
    { id: 2, name: 'Lipitor 20mg', barcode: '7890123456', batch: 'LIP2023-03', expiry: '2024-09-15', quantity: 24, status: 'recalled', manufacturer: 'Pfizer' },
    { id: 3, name: 'Ventolin Inhaler', barcode: '1234567890', batch: 'VEN2023-01', expiry: '2023-12-31', quantity: 8, status: 'in_stock', manufacturer: 'GSK' },
    { id: 4, name: 'Metformin 850mg', barcode: '5678901234', batch: 'MET2023-02', expiry: '2025-03-31', quantity: 36, status: 'in_stock', manufacturer: 'Cipla' },
    { id: 5, name: 'Omeprazole 40mg', barcode: '9012345678', batch: 'OME2023-04', expiry: '2024-11-30', quantity: 18, status: 'in_stock', manufacturer: 'Dr. Reddy' },
    { id: 6, name: 'Atorvastatin 10mg', barcode: '2345678901', batch: 'ATO2023-01', expiry: '2024-08-15', quantity: 0, status: 'sold', manufacturer: 'Lupin' }
  ];

  const recallData = [
    { id: 1, drug: 'Lipitor 20mg', batch: 'LIP2023-03', barcode: '7890123456', issued: '2023-05-15', by: 'FDA', severity: 'high' },
    { id: 2, drug: 'Ventolin Inhaler', batch: 'VEN2023-01', barcode: '1234567890', issued: '2023-04-28', by: 'Manufacturer', severity: 'medium' }
  ];

  const supplyChainData = [
    { id: 1, batch: 'AMX2023-05', events: [
      { date: '2023-01-15', location: 'Mumbai', event: 'Manufactured', by: 'Sun Pharma' },
      { date: '2023-01-20', location: 'Pune', event: 'Quality Check', by: 'QC Team' },
      { date: '2023-01-25', location: 'Delhi', event: 'Distributed', by: 'MedDistributors' },
      { date: '2023-02-10', location: 'Your Pharmacy', event: 'Received', by: 'You' }
    ]}
  ];

  const verifyDrug = (barcode) => {
    // Simulate blockchain verification
    const drug = inventoryData.find(item => item.barcode === barcode);
    if (drug) {
      setVerificationResult({
        valid: true,
        drug,
        blockchainData: {
          txHash: '0x89a2...f1c3',
          block: 184532,
          timestamp: '2023-05-10 14:30:22',
          events: supplyChainData.find(sc => sc.batch === drug.batch)?.events || []
        }
      });
    } else {
      setVerificationResult({
        valid: false,
        message: 'Drug not found in blockchain registry - possible counterfeit'
      });
    }
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'in_stock': return <span className="pharma-badge pharma-success">In Stock</span>;
      case 'sold': return <span className="pharma-badge pharma-secondary">Sold Out</span>;
      case 'recalled': return <span className="pharma-badge pharma-danger">Recalled</span>;
      default: return <span className="pharma-badge pharma-light">Unknown</span>;
    }
  };

  return (
    <div className="pharma-dashboard">
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
                      <h3>{inventoryData.length}</h3>
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
                      <h3>{inventoryData.filter(d => new Date(d.expiry) < new Date(Date.now() + 30*24*60*60*1000)).length}</h3>
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
                            <th>Status</th>
                            <th>Quantity</th>
                            <th>Expiry</th>
                          </tr>
                        </thead>
                        <tbody>
                          {inventoryData.slice(0, 5).map(item => (
                            <tr key={item.id}>
                              <td>{item.name}</td>
                              <td>{item.batch}</td>
                              <td>{getStatusBadge(item.status)}</td>
                              <td>{item.quantity}</td>
                              <td>{item.expiry}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
                <div className="pharma-side-panel">
                  <div className="pharma-card">
                    <div className="pharma-card-header">
                      <h5>Critical Alerts</h5>
                    </div>
                    <div className="pharma-card-body pharma-alerts">
                      {recallData.map(alert => (
                        <div key={alert.id} className={`pharma-alert-card pharma-${alert.severity}`}>
                          <div className="pharma-alert-content">
                            <ExclamationTriangleFill className="pharma-icon" />
                            <div>
                              <h6>Drug Recall: {alert.drug}</h6>
                              <p>Batch {alert.batch} | Issued by {alert.by}</p>
                              <small>{alert.issued}</small>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'inventory' && (
            <div className="pharma-inventory-tab">
              <div className="pharma-card">
                <div className="pharma-card-header">
                  <h5>Drug Inventory</h5>
                  <div className="pharma-controls">
                    <div className="pharma-search-box">
                      <Search className="pharma-search-icon" />
                      <input type="text" placeholder="Search inventory..." />
                    </div>
                    <button className="pharma-btn-outline">
                      <Funnel className="pharma-icon" /> Filters
                    </button>
                  </div>
                </div>
                <div className="pharma-card-body">
                  <table className="pharma-data-table">
                    <thead>
                      <tr>
                        <th>Drug Name</th>
                        <th>Batch</th>
                        <th>Manufacturer</th>
                        <th>Expiry Date</th>
                        <th>Quantity</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {inventoryData.map(item => (
                        <tr key={item.id}>
                          <td>
                            {item.name} 
                            {item.lowStock && <span className="pharma-badge pharma-warning">Low stock</span>}
                          </td>
                          <td>{item.batch}</td>
                          <td>{item.manufacturer}</td>
                          <td>{item.expiry}</td>
                          <td>{item.quantity}</td>
                          <td>{getStatusBadge(item.status)}</td>
                          <td className="pharma-actions">
                            <button className="pharma-btn-icon">
                              <ShieldCheck title="Verify" />
                            </button>
                            <button className="pharma-btn-icon">
                              <Link45deg title="Trace" />
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
            <div className="pharma-verify-tab">
              <div className="pharma-card">
                <div className="pharma-card-header">
                  <h5>Drug Verification</h5>
                  <p>Verify authenticity using blockchain records</p>
                </div>
                <div className="pharma-card-body">
                  <div className="pharma-scan-section">
                    <UpcScan className="pharma-icon-lg" />
                    <p>Scan drug barcode to verify authenticity</p>
                    <div className="pharma-input-group">
                      <input 
                        type="text" 
                        placeholder="Enter barcode manually" 
                        onChange={(e) => verifyDrug(e.target.value)}
                      />
                      <button className="pharma-btn-primary">
                        <UpcScan className="pharma-icon" /> Scan
                      </button>
                    </div>
                  </div>

                  {verificationResult && (
                    <div className={`pharma-verification-result ${verificationResult.valid ? 'pharma-valid' : 'pharma-invalid'}`}>
                      <div className="pharma-verification-header">
                        {verificationResult.valid ? (
                          <>
                            <CheckCircleFill className="pharma-icon pharma-success" />
                            <h5>Genuine Product Verified</h5>
                          </>
                        ) : (
                          <>
                            <ExclamationTriangleFill className="pharma-icon pharma-danger" />
                            <h5>Verification Failed</h5>
                          </>
                        )}
                      </div>

                      {verificationResult.valid && (
                        <>
                          <div className="pharma-drug-info">
                            <h6>{verificationResult.drug.name}</h6>
                            <p>Batch: {verificationResult.drug.batch}</p>
                            <p>Manufacturer: {verificationResult.drug.manufacturer}</p>
                            <p>Expiry: {verificationResult.drug.expiry}</p>
                          </div>

                          <div className="pharma-blockchain-info">
                            <h6>Blockchain Verification</h6>
                            <p>Transaction: {verificationResult.blockchainData.txHash}</p>
                            <p>Block: {verificationResult.blockchainData.block}</p>
                            <p>Timestamp: {verificationResult.blockchainData.timestamp}</p>
                          </div>

                          <div className="pharma-supply-chain">
                            <h6>Supply Chain History</h6>
                            <div className="pharma-timeline">
                              {verificationResult.blockchainData.events.map((event, index) => (
                                <div key={index} className="pharma-timeline-event">
                                  <div className="pharma-timeline-dot"></div>
                                  <div className="pharma-timeline-content">
                                    <h6>{event.event}</h6>
                                    <p>{event.date} • {event.location}</p>
                                    <p>By: {event.by}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </>
                      )}

                      {!verificationResult.valid && (
                        <div className="pharma-invalid-message">
                          <p>{verificationResult.message}</p>
                          <button className="pharma-btn-danger">
                            <ExclamationTriangleFill className="pharma-icon" /> Report Counterfeit
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'alerts' && (
            <div className="pharma-alerts-tab">
              <div className="pharma-card">
                <div className="pharma-card-header">
                  <h5>Active Alerts</h5>
                  <div className="pharma-filter-controls">
                    <button className="pharma-btn-outline active">All</button>
                    <button className="pharma-btn-outline">Recalls</button>
                    <button className="pharma-btn-outline">Expiry</button>
                    <button className="pharma-btn-outline">Stock</button>
                  </div>
                </div>
                <div className="pharma-card-body">
                  {recallData.length > 0 ? (
                    <div className="pharma-alerts-list">
                      {recallData.map(alert => (
                        <div key={alert.id} className="pharma-alert-item">
                          <div className="pharma-alert-icon">
                            <ExclamationTriangleFill className={`pharma-icon pharma-${alert.severity}`} />
                          </div>
                          <div className="pharma-alert-details">
                            <h6>Recall Notice: {alert.drug}</h6>
                            <p>Batch: {alert.batch} • Barcode: {alert.barcode}</p>
                            <p>Issued by {alert.by} on {alert.issued}</p>
                            <div className="pharma-alert-actions">
                              <button className="pharma-btn-outline">
                                <Link45deg className="pharma-icon" /> Trace Batch
                              </button>
                              <button className="pharma-btn-outline">
                                <Printer className="pharma-icon" /> Print Notice
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="pharma-no-alerts">
                      <CheckCircleFill className="pharma-icon pharma-success" />
                      <h5>No Active Alerts</h5>
                      <p>Your inventory has no current recalls or warnings</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PharmacyDashboard;