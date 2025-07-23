import React, { useState } from 'react';
import { 
  Speedometer2, Truck, Clipboard2Pulse, CashStack, Diagram3, ExclamationTriangle, Receipt,
  Search, PersonCircle, Gear, BoxArrowRight, Capsule, ExclamationTriangleFill, ClockFill,
  Funnel, Trash, Printer, Flag, Download, Filter, UpcScan, CashCoin, Diagram3 as TraceIcon,
  ExclamationTriangle as RecallIcon
} from 'react-bootstrap-icons';
import './PharmacyDashboard.css'

const PharmacyDashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [currentSale, setCurrentSale] = useState([
    { id: 1, name: 'Amoxicillin 500mg', price: 24.99, quantity: 1 }
  ]);

  const inventoryData = [
    { id: 1, name: 'Amoxicillin 500mg', barcode: '3456789012', batch: 'AMX2023-05', expiry: '2024-06-30', quantity: 12, status: 'in_stock', lowStock: true },
    { id: 2, name: 'Lipitor 20mg', barcode: '7890123456', batch: 'LIP2023-03', expiry: '2024-09-15', quantity: 24, status: 'recalled' },
    { id: 3, name: 'Ventolin Inhaler', barcode: '1234567890', batch: 'VEN2023-01', expiry: '2023-12-31', quantity: 8, status: 'in_stock' },
    { id: 4, name: 'Metformin 850mg', barcode: '5678901234', batch: 'MET2023-02', expiry: '2025-03-31', quantity: 36, status: 'in_stock' },
    { id: 5, name: 'Omeprazole 40mg', barcode: '9012345678', batch: 'OME2023-04', expiry: '2024-11-30', quantity: 18, status: 'in_stock' },
    { id: 6, name: 'Atorvastatin 10mg', barcode: '2345678901', batch: 'ATO2023-01', expiry: '2024-08-15', quantity: 0, status: 'sold' }
  ];

  const salesData = [
    { id: 'SL-2023-0456', date: '2023-05-20 14:30', name: 'Amoxicillin 500mg', barcode: '3456789012', batch: 'AMX2023-05', patient: 'John Smith', amount: 24.99 },
    { id: 'SL-2023-0455', date: '2023-05-20 13:15', name: 'Lipitor 20mg', barcode: '7890123456', batch: 'LIP2023-02', patient: 'Sarah Johnson', amount: 45.50 },
    { id: 'SL-2023-0454', date: '2023-05-19 11:45', name: 'Ventolin Inhaler', barcode: '1234567890', batch: 'VEN2022-12', patient: 'Michael Brown', amount: 32.75 },
    { id: 'SL-2023-0453', date: '2023-05-18 16:20', name: 'Metformin 850mg', barcode: '5678901234', batch: 'MET2023-01', patient: 'Emily Davis', amount: 12.99 },
    { id: 'SL-2023-0452', date: '2023-05-18 10:05', name: 'Omeprazole 40mg', barcode: '9012345678', batch: 'OME2023-02', patient: 'Robert Wilson', amount: 28.25 }
  ];

  const recallData = [
    { id: 1, drug: 'Lipitor 20mg', batch: 'LIP2023-03', barcode: '7890123456', issued: '2023-05-15', by: 'FDA' },
    { id: 2, drug: 'Ventolin Inhaler', batch: 'VEN2023-01', barcode: '1234567890', issued: '2023-04-28', by: 'Manufacturer' },
    { id: 3, drug: 'Omeprazole 40mg', batch: 'OME2023-01', barcode: '9012345678', issued: '2023-05-01', by: 'FDA' }
  ];

  const calculateSaleTotal = () => {
    const subtotal = currentSale.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const tax = subtotal * 0.07;
    return {
      subtotal: subtotal.toFixed(2),
      tax: tax.toFixed(2),
      total: (subtotal + tax).toFixed(2)
    };
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'in_stock': return <span className="badge success">In Stock</span>;
      case 'sold': return <span className="badge secondary">Sold Out</span>;
      case 'recalled': return <span className="badge danger">Recalled</span>;
      default: return <span className="badge light">Unknown</span>;
    }
  };

  return (
    <div className="pharmacy-dashboard">
      <div className="sidebar">
        <div className="sidebar-content">
          <h4 className="sidebar-title"><Capsule className="icon" /> PharmaTrack</h4>
          <div className="tabs-container">
            <div 
              className={`tab-item ${activeTab === 'dashboard' ? 'active' : ''}`}
              onClick={() => setActiveTab('dashboard')}
            >
              <Speedometer2 className="icon" /> Dashboard
            </div>
            <div 
              className={`tab-item ${activeTab === 'shipments' ? 'active' : ''}`}
              onClick={() => setActiveTab('shipments')}
            >
              <Truck className="icon" /> Receive Shipments
            </div>
            <div 
              className={`tab-item ${activeTab === 'inventory' ? 'active' : ''}`}
              onClick={() => setActiveTab('inventory')}
            >
              <Clipboard2Pulse className="icon" /> My Inventory
            </div>
            <div 
              className={`tab-item ${activeTab === 'sell' ? 'active' : ''}`}
              onClick={() => setActiveTab('sell')}
            >
              <CashStack className="icon" /> Sell Drug
            </div>
            <div 
              className={`tab-item ${activeTab === 'trace' ? 'active' : ''}`}
              onClick={() => setActiveTab('trace')}
            >
              <Diagram3 className="icon" /> Trace Drug
            </div>
            <div 
              className={`tab-item ${activeTab === 'alerts' ? 'active' : ''}`}
              onClick={() => setActiveTab('alerts')}
            >
              <ExclamationTriangle className="icon" /> Alerts
            </div>
            <div 
              className={`tab-item ${activeTab === 'sales' ? 'active' : ''}`}
              onClick={() => setActiveTab('sales')}
            >
              <Receipt className="icon" /> Sales Log
            </div>
          </div>
        </div>
      </div>

      <div className="main-content">
        <div className="header">
          <h3>Pharmacy Dashboard</h3>
          <div className="header-controls">
            <div className="search-box">
              <Search className="search-icon" />
              <input type="text" placeholder="Search..." />
            </div>
            <div className="dropdown">
              <button className="dropdown-toggle">
                <PersonCircle className="icon" /> Pharmacist
              </button>
              <div className="dropdown-menu">
                <a href="#"><PersonCircle className="icon" /> Profile</a>
                <a href="#"><Gear className="icon" /> Settings</a>
                <div className="divider"></div>
                <a href="#"><BoxArrowRight className="icon" /> Logout</a>
              </div>
            </div>
          </div>
        </div>

        <div className="tab-content">
          {activeTab === 'dashboard' && (
            <div className="dashboard-tab">
              <div className="stats-row">
                <div className="stat-card">
                  <div className="stat-content">
                    <div>
                      <h6>Total Inventory</h6>
                      <h3>1,248</h3>
                    </div>
                    <div className="icon-bg primary">
                      <Capsule className="icon primary" />
                    </div>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-content">
                    <div>
                      <h6>Active Alerts</h6>
                      <h3>12</h3>
                    </div>
                    <div className="icon-bg warning">
                      <ExclamationTriangleFill className="icon warning" />
                    </div>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-content">
                    <div>
                      <h6>Today's Sales</h6>
                      <h3>$3,245</h3>
                    </div>
                    <div className="icon-bg success">
                      <CashCoin className="icon success" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="content-row">
                <div className="main-panel">
                  <div className="card">
                    <div className="card-header">
                      <h5>Recent Sales</h5>
                      <button className="btn-outline">View All</button>
                    </div>
                    <div className="card-body">
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>Drug Name</th>
                            <th>Barcode</th>
                            <th>Patient</th>
                            <th>Date</th>
                            <th>Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {salesData.slice(0, 5).map(sale => (
                            <tr key={sale.id}>
                              <td>{sale.name}</td>
                              <td>{sale.barcode}</td>
                              <td>{sale.patient}</td>
                              <td>{sale.date}</td>
                              <td>${sale.amount}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
                <div className="side-panel">
                  <div className="card">
                    <div className="card-header">
                      <h5>Critical Alerts</h5>
                    </div>
                    <div className="card-body alerts">
                      <div className="alert-card recall">
                        <div className="alert-content">
                          <ExclamationTriangleFill className="icon danger" />
                          <div>
                            <h6>Drug Recall</h6>
                            <p>Batch #RX2023-05 of Lipitor 20mg has been recalled</p>
                          </div>
                        </div>
                      </div>
                      <div className="alert-card expiry">
                        <div className="alert-content">
                          <ClockFill className="icon warning" />
                          <div>
                            <h6>Expiring Soon</h6>
                            <p>5 batches expiring in next 30 days</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'inventory' && (
            <div className="inventory-tab">
              <div className="card">
                <div className="card-header">
                  <h5>Drug Inventory</h5>
                  <div className="controls">
                    <div className="search-box">
                      <Search className="search-icon" />
                      <input type="text" placeholder="Search inventory..." />
                    </div>
                    <button className="btn-outline">
                      <Funnel className="icon" /> Filters
                    </button>
                  </div>
                </div>
                <div className="card-body">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Drug Name</th>
                        <th>Barcode</th>
                        <th>Batch</th>
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
                            {item.lowStock && <span className="badge warning">Low stock</span>}
                            {item.status === 'recalled' && <span className="badge danger">Recalled</span>}
                          </td>
                          <td>{item.barcode}</td>
                          <td>{item.batch}</td>
                          <td>{item.expiry}</td>
                          <td>{item.quantity}</td>
                          <td>{getStatusBadge(item.status)}</td>
                          <td className="actions">
                            <button className="btn-icon" disabled={item.status !== 'in_stock'}>
                              <CashCoin />
                            </button>
                            <button className="btn-icon">
                              <TraceIcon />
                            </button>
                            <button className="btn-icon">
                              <RecallIcon />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="pagination">
                    <button disabled>Previous</button>
                    <button className="active">1</button>
                    <button>2</button>
                    <button>3</button>
                    <button>Next</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'sell' && (
            <div className="sell-tab">
              <div className="sell-columns">
                <div className="sell-form">
                  <div className="card">
                    <div className="card-header">
                      <h5>Sell Drug</h5>
                    </div>
                    <div className="card-body">
                      <form>
                        <div className="form-group">
                          <label>Scan Barcode</label>
                          <div className="input-group">
                            <input type="text" placeholder="Scan or enter barcode" />
                            <button className="btn-primary"><UpcScan className="icon" /> Scan</button>
                          </div>
                        </div>

                        <div className="form-group">
                          <label>Drug Information</label>
                          <div className="drug-card">
                            <div className="drug-info">
                              <div>
                                <h6>Amoxicillin 500mg</h6>
                                <p>Barcode: 3456789012</p>
                                <p>Batch: AMX2023-05</p>
                                <p>Expiry: 2024-06-30</p>
                              </div>
                              <div className="drug-status">
                                <span className="badge success">In Stock</span>
                                <p>$24.99</p>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="form-group">
                          <label>Quantity</label>
                          <input type="number" defaultValue={1} min={1} />
                        </div>

                        <div className="form-group">
                          <label>Patient Information (Optional)</label>
                          <input type="text" placeholder="Patient name" />
                          <input type="text" placeholder="Patient ID" />
                        </div>

                        <button className="btn-primary">Complete Sale</button>
                      </form>
                    </div>
                  </div>
                </div>
                <div className="current-sale">
                  <div className="card">
                    <div className="card-header">
                      <h5>Current Sale</h5>
                      <span className="badge primary">{currentSale.length} Item{currentSale.length !== 1 ? 's' : ''}</span>
                    </div>
                    <div className="card-body">
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>Drug</th>
                            <th>Price</th>
                            <th>Qty</th>
                            <th>Total</th>
                            <th></th>
                          </tr>
                        </thead>
                        <tbody>
                          {currentSale.map(item => (
                            <tr key={item.id}>
                              <td>{item.name}</td>
                              <td>${item.price}</td>
                              <td>{item.quantity}</td>
                              <td>${(item.price * item.quantity).toFixed(2)}</td>
                              <td>
                                <button className="btn-icon danger"><Trash /></button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>

                      <div className="sale-totals">
                        <div className="total-row">
                          <span>Subtotal:</span>
                          <span>${calculateSaleTotal().subtotal}</span>
                        </div>
                        <div className="total-row">
                          <span>Tax (7%):</span>
                          <span>${calculateSaleTotal().tax}</span>
                        </div>
                        <div className="total-row bold">
                          <span>Total:</span>
                          <span>${calculateSaleTotal().total}</span>
                        </div>

                        <button className="btn-success">Process Payment</button>
                      </div>
                    </div>
                  </div>
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