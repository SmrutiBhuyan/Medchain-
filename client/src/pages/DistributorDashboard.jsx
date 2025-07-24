import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, 
  Paper, Button, TextField, Select, MenuItem, FormControl, 
  InputLabel, Typography, Box, Modal, Card, CardContent,
  Chip, Grid, LinearProgress, IconButton, Avatar, AppBar, Toolbar,
  CircularProgress, Tabs, Tab 
} from '@mui/material';
import { 
  CheckCircle, Cancel, Search, QrCodeScanner, 
  Inventory, LocalShipping, Analytics, Receipt, Logout,
  Store, LocalHospital, MedicalServices
} from '@mui/icons-material';
import { styled } from '@mui/system';
import './DistributorDashboard.css';
import { useTheme } from '@mui/material/styles';
import { useAuth } from './AuthContext';
import axios from 'axios';

const mockRetailers = [
  { id: 'RET-001', name: 'City Pharmacy' },
  { id: 'RET-002', name: 'MediMart' },
  { id: 'RET-003', name: 'HealthFirst' },
];

const mockWholesalers = [
  { id: 'WHO-001', name: 'Prime Wholesalers' },
  { id: 'WHO-002', name: 'MedSupply Co' },
];

const mockPharmacies = [
  { id: 'PHA-001', name: 'City Pharmacy' },
  { id: 'PHA-002', name: '24/7 Meds' },
];

const DashboardCard = styled(Card)(({ theme }) => ({
  borderRadius: '12px',
  boxShadow: '0 4px 20px 0 rgba(0,0,0,0.12)',
  transition: 'transform 0.3s ease-in-out',
  '&:hover': {
    transform: 'translateY(-5px)',
  },
}));

function StatusChip({ label, status, ...props }) {
  const theme = useTheme();
  let bg;
  switch (status) {
    case 'in-stock':
    case 'delivered':
      bg = theme.palette.success.light;
      break;
    case 'processing':
    case 'in-transit':
      bg = theme.palette.warning.light;
      break;
    case 'received':
      bg = theme.palette.success.light;
      break;
    case 'recalled':
    case 'cancelled':
      bg = theme.palette.error.light;
      break;
    default:
      bg = theme.palette.info.light;
  }
  return (
    <Chip
      label={label}
      sx={{
        backgroundColor: bg,
        color: '#fff',
        fontWeight: 'bold',
      }}
      {...props}
    />
  );
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
        
        // Fetch shipments for this distributor
        const shipmentsRes = await axios.get('http://localhost:5000/api/shipments/distributor', {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log(shipmentsRes.data);
        
        setShipments(shipmentsRes.data);
        
        // Fetch inventory for this distributor
        const inventoryRes = await axios.get('http://localhost:5000/api/drugs/inventory', {
          headers: { Authorization: `Bearer ${token}` },
          params: { status: 'in-stock with distributor' } 
        });
        console.log(inventoryRes.data);
        
        // Check if response has drugs array
        if (!inventoryRes.data?.drugs || !Array.isArray(inventoryRes.data.drugs)) {
          console.error('Invalid inventory data format:', inventoryRes.data);
          setInventory([]);
        } else {
          // Flatten the batch data into individual units
          const flattenedInventory = inventoryRes.data.drugs.flatMap(drug => {
            if (!drug.unitBarcodes || !Array.isArray(drug.unitBarcodes)) {
              console.warn('Drug missing unitBarcodes:', drug);
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

          console.log('Flattened inventory:', flattenedInventory);
          setInventory(flattenedInventory);
        }
        
        // Fetch recipients
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
      
      // Update shipment status
      await axios.put(
        `http://localhost:5000/api/shipments/${shipmentId}/accept`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Refresh data
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
      
      // Update shipment status
      await axios.put(
        `http://localhost:5000/api/shipments/${shipmentId}/reject`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Update drug statuses
      await axios.put(
        `http://localhost:5000/api/drugs/update-from-shipment/${shipmentId}`,
        { status: 'cancelled' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Refresh shipments
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
      
      // Get the drugs to be shipped
      const drugsToShip = inventory.filter(drug => selectedDrugs.includes(drug._id));
      
      // Create shipment
      const shipmentData = {
        recipientId: selectedRecipient,
        recipientType: recipientType,
        drugs: drugsToShip.map(drug => ({
          drugId: drug._id,
          name: drug.name,
          batch: drug.batch,
          barcode: drug.barcode,
          batchBarcode: drug.batchBarcode
        })),
        status: 'processing'
      };
      
      await axios.post('http://localhost:5000/api/shipments', shipmentData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Update inventory locally
      setInventory(inventory.filter(drug => !selectedDrugs.includes(drug._id)));
      setSelectedDrugs([]);
      setSelectedRecipient('');
      
      alert(`Successfully shipped ${selectedDrugs.length} drugs to ${getRecipientName(selectedRecipient)}`);
    } catch (error) {
      console.error('Error creating shipment:', error);
      alert('Failed to create shipment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getRecipientName = (recipientId) => {
    let recipient;
    switch (recipientType) {
      case 'retailer':
        recipient = retailers.find(r => r._id === recipientId) || 
                   mockRetailers.find(r => r.id === recipientId);
        break;
      case 'wholesaler':
        recipient = wholesalers.find(w => w._id === recipientId) || 
                   mockWholesalers.find(w => w.id === recipientId);
        break;
      case 'pharmacy':
        recipient = pharmacies.find(p => p._id === recipientId) || 
                   mockPharmacies.find(p => p.id === recipientId);
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
      const barcodeMatch = drug.barcode?.includes(searchTerm);
      const batchBarcodeMatch = drug.batchBarcode?.includes(searchTerm);
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
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 0 }}>
      {/* AppBar with user info and logout button */}
      <AppBar 
        position="static" 
        sx={{ 
          backgroundColor: '#fff', 
          color: 'text.primary',
          boxShadow: 'none',
          borderBottom: '1px solid rgba(0, 0, 0, 0.12)',
          mb: 3
        }}
      >
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
            Distributor Dashboard
          </Typography>
          
          {user && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'primary.main', width: 40, height: 40 }}>
                {user.name?.charAt(0).toUpperCase()}
              </Avatar>
              <Typography variant="subtitle1">
                {user.name}
              </Typography>
              <IconButton 
                onClick={logout}
                sx={{ 
                  color: 'error.main',
                  '&:hover': {
                    backgroundColor: 'rgba(244, 67, 54, 0.08)'
                  }
                }}
              >
                <Logout />
              </IconButton>
            </Box>
          )}
        </Toolbar>
      </AppBar>

      <Box sx={{ px: 3 }}>
        {/* Navigation Tabs */}
        <Box sx={{ 
          display: 'flex', 
          gap: 2, 
          mb: 4,
          '& .MuiButton-root': {
            borderRadius: '8px',
            textTransform: 'none',
            fontWeight: '600',
            px: 3,
            py: 1
          }
        }}>
          <Button
            variant={activeTab === 'shipments' ? 'contained' : 'outlined'}
            startIcon={<Receipt />}
            onClick={() => setActiveTab('shipments')}
          >
            Incoming Shipments
          </Button>
          <Button
            variant={activeTab === 'inventory' ? 'contained' : 'outlined'}
            startIcon={<Inventory />}
            onClick={() => setActiveTab('inventory')}
          >
            My Inventory
          </Button>
          <Button
            variant={activeTab === 'ship' ? 'contained' : 'outlined'}
            startIcon={<LocalShipping />}
            onClick={() => setActiveTab('ship')}
          >
            Ship Products
          </Button>
          <Button
            variant={activeTab === 'verify' ? 'contained' : 'outlined'}
            startIcon={<QrCodeScanner />}
            onClick={() => setActiveTab('verify')}
          >
            Verify Drug
          </Button>
          <Button
            variant={activeTab === 'analytics' ? 'contained' : 'outlined'}
            startIcon={<Analytics />}
            onClick={() => setActiveTab('analytics')}
          >
            Analytics
          </Button>
        </Box>

        {/* Main Content Area */}
        {activeTab === 'shipments' && (
          <Box>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', mb: 2 }}>
              Pending Shipments ({pendingShipments.length})
            </Typography>
            
            {pendingShipments.length > 0 ? (
              <TableContainer component={Paper} sx={{ mb: 4 }}>
                <Table>
                  <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                    <TableRow>
                      <TableCell>Shipment ID</TableCell>
                      <TableCell>Manufacturer</TableCell>
                      <TableCell>Drug Count</TableCell>
                      <TableCell>Date Sent</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {pendingShipments.map((shipment) => (
                      <TableRow key={shipment._id} hover>
                        <TableCell>{shipment.trackingNumber}</TableCell>
                        <TableCell>
                          {getManufacturerName(shipment.manufacturer)}
                        </TableCell>
                        <TableCell>{shipment.drugs?.length || 0}</TableCell>
                        <TableCell>{new Date(shipment.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <StatusChip label={shipment.status} status={shipment.status} size="small" />
                        </TableCell>
                        <TableCell>
                          <Button 
                            variant="outlined" 
                            size="small" 
                            onClick={() => setSelectedShipment(shipment)}
                            sx={{ mr: 1 }}
                          >
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Box sx={{ p: 3, textAlign: 'center', backgroundColor: '#f9f9f9', borderRadius: 2 }}>
                <Typography variant="body1" color="textSecondary">
                  No pending shipments at this time
                </Typography>
              </Box>
            )}

            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', mb: 2 }}>
              Received Shipments ({receivedShipments.length})
            </Typography>
            
            {receivedShipments.length > 0 ? (
              <TableContainer component={Paper}>
                <Table>
                  <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                    <TableRow>
                      <TableCell>Shipment ID</TableCell>
                      <TableCell>Manufacturer</TableCell>
                      <TableCell>Drug Count</TableCell>
                      <TableCell>Date Received</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {receivedShipments.map((shipment) => (
                      <TableRow key={shipment._id} hover>
                        <TableCell>{shipment._id}</TableCell>
                        <TableCell>
                          {getManufacturerName(shipment.manufacturer)}
                        </TableCell>
                        <TableCell>{shipment.drugs?.length || 0}</TableCell>
                        <TableCell>{new Date(shipment.actualDelivery || shipment.updatedAt).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <StatusChip label={shipment.status} status={shipment.status} size="small" />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Box sx={{ p: 3, textAlign: 'center', backgroundColor: '#f9f9f9', borderRadius: 2 }}>
                <Typography variant="body1" color="textSecondary">
                  No received shipments to display
                </Typography>
              </Box>
            )}
          </Box>
        )}

        {activeTab === 'inventory' && (
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                Current Inventory ({inventory.length} units)
              </Typography>
              <TextField
                variant="outlined"
                size="small"
                placeholder="Search drugs..."
                InputProps={{
                  startAdornment: <Search sx={{ color: 'action.active', mr: 1 }} />,
                }}
                onChange={(e) => setSearchTerm(e.target.value)}
                sx={{ width: 300 }}
              />
            </Box>
            
            <TableContainer component={Paper}>
              <Table>
                <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                  <TableRow>
                    <TableCell>Drug Name</TableCell>
                    <TableCell>Unit Barcode</TableCell>
                    <TableCell>Batch Number</TableCell>
                    <TableCell>Manufacturer</TableCell>
                    <TableCell>Expiry Date</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredInventory.map((drug) => (
                    <TableRow key={drug._id}>
                      <TableCell>{drug.name}</TableCell>
                      <TableCell>{drug.barcode}</TableCell>
                      <TableCell>{drug.batch}</TableCell>
                      <TableCell>{getManufacturerName(drug.manufacturer)}</TableCell>
                      <TableCell>{new Date(drug.expiryDate).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <StatusChip label={drug.status} status={drug.status} size="small" />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            
            {filteredInventory.length === 0 && (
              <Box sx={{ p: 3, textAlign: 'center', backgroundColor: '#f9f9f9', borderRadius: 2, mt: 2 }}>
                <Typography variant="body1" color="textSecondary">
                  {inventory.length === 0 ? 'No inventory available' : 'No drugs found matching your search'}
                </Typography>
              </Box>
            )}
          </Box>
        )}

        {activeTab === 'ship' && (
          <Box>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
              Ship Products to Recipients
            </Typography>
            
            <Box sx={{ mb: 3 }}>
              <Tabs 
                value={recipientType} 
                onChange={(e, newValue) => {
                  setRecipientType(newValue);
                  setSelectedRecipient('');
                }}
                sx={{ mb: 2 }}
              >
                <Tab 
                  value="retailer" 
                  label="Retailers" 
                  icon={<Store fontSize="small" />} 
                  iconPosition="start" 
                />
                <Tab 
                  value="wholesaler" 
                  label="Wholesalers" 
                  icon={<MedicalServices fontSize="small" />} 
                  iconPosition="start" 
                />
                <Tab 
                  value="pharmacy" 
                  label="Pharmacies" 
                  icon={<LocalHospital fontSize="small" />} 
                  iconPosition="start" 
                />
              </Tabs>
            </Box>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={8}>
                <DashboardCard>
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold', mb: 2 }}>
                      Select Drugs to Ship
                    </Typography>
                    
                    <TextField
                      variant="outlined"
                      size="small"
                      placeholder="Search drugs..."
                      InputProps={{
                        startAdornment: <Search sx={{ color: 'action.active', mr: 1 }} />,
                      }}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      sx={{ width: '100%', mb: 2 }}
                    />
                    
                    <Box sx={{ maxHeight: '400px', overflow: 'auto' }}>
                      <TableContainer>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell padding="checkbox"></TableCell>
                              <TableCell>Drug Name</TableCell>
                              <TableCell>Barcode</TableCell>
                              <TableCell>Expiry</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {filteredInventory.map((drug) => (
                              <TableRow 
                                key={drug._id} 
                                hover 
                                selected={selectedDrugs.includes(drug._id)}
                                onClick={() => handleSelectDrug(drug._id)}
                                sx={{ cursor: 'pointer' }}
                              >
                                <TableCell padding="checkbox">
                                  {selectedDrugs.includes(drug._id) ? (
                                    <CheckCircle color="primary" />
                                  ) : (
                                    <Cancel color="disabled" />
                                  )}
                                </TableCell>
                                <TableCell>{drug.name}</TableCell>
                                <TableCell>{drug.batchBarcode || "No rendering"}</TableCell>
                                <TableCell>{new Date(drug.expiryDate).toLocaleDateString()}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </Box>
                  </CardContent>
                </DashboardCard>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <DashboardCard>
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold', mb: 2 }}>
                      Shipping Details
                    </Typography>
                    
                    <FormControl fullWidth sx={{ mb: 3 }}>
                      <InputLabel>Select {recipientType.charAt(0).toUpperCase() + recipientType.slice(1)}</InputLabel>
                      <Select
                        value={selectedRecipient}
                        onChange={(e) => setSelectedRecipient(e.target.value)}
                        label={`Select ${recipientType.charAt(0).toUpperCase() + recipientType.slice(1)}`}
                      >
                        {recipientType === 'retailer' && retailers.map(retailer => (
                          <MenuItem key={retailer._id} value={retailer._id}>
                            {retailer.name} ({retailer.organization})
                          </MenuItem>
                        ))}
                        {recipientType === 'wholesaler' && wholesalers.map(wholesaler => (
                          <MenuItem key={wholesaler._id} value={wholesaler._id}>
                            {wholesaler.name} ({wholesaler.organization})
                          </MenuItem>
                        ))}
                        {recipientType === 'pharmacy' && pharmacies.map(pharmacy => (
                          <MenuItem key={pharmacy._id} value={pharmacy._id}>
                            {pharmacy.name} ({pharmacy.organization})
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="body2" color="textSecondary" gutterBottom>
                        Selected Drugs: {selectedDrugs.length}
                      </Typography>
                      <LinearProgress 
                        variant="determinate" 
                        value={Math.min(100, (selectedDrugs.length / inventory.length) * 100)} 
                        sx={{ height: 8, borderRadius: 4 }}
                      />
                    </Box>
                    
                    <Button
                      variant="contained"
                      color="primary"
                      fullWidth
                      size="large"
                      disabled={selectedDrugs.length === 0 || !selectedRecipient}
                      onClick={handleShipToRecipient}
                      startIcon={<LocalShipping />}
                    >
                      Confirm Shipment to {recipientType.charAt(0).toUpperCase() + recipientType.slice(1)}
                    </Button>
                  </CardContent>
                </DashboardCard>
              </Grid>
            </Grid>
          </Box>
        )}

        {activeTab === 'verify' && (
          <Box sx={{ maxWidth: 600, mx: 'auto' }}>
            <DashboardCard>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
                  Verify Drug Authenticity
                </Typography>
                
                <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                  <TextField
                    fullWidth
                    variant="outlined"
                    placeholder="Enter drug barcode or scan QR code"
                    value={qrInput}
                    onChange={(e) => setQrInput(e.target.value)}
                  />
                  <Button 
                    variant="contained" 
                    startIcon={<QrCodeScanner />}
                    onClick={() => alert('QR scanner would open here')}
                  >
                    Scan
                  </Button>
                </Box>
                
                <Button
                  fullWidth
                  variant="contained"
                  color="primary"
                  size="large"
                  disabled={!qrInput}
                  onClick={verifyDrug}
                >
                  Verify Drug
                </Button>
              </CardContent>
            </DashboardCard>
          </Box>
        )}

        {activeTab === 'analytics' && (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <DashboardCard>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Drugs Received This Month
                  </Typography>
                  <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Typography variant="h3" color="primary">
                      245
                    </Typography>
                  </Box>
                </CardContent>
              </DashboardCard>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <DashboardCard>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Near-Expiry Drugs
                  </Typography>
                  <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Typography variant="h3" color="warning.main">
                      18
                    </Typography>
                  </Box>
                </CardContent>
              </DashboardCard>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <DashboardCard>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Retailers Served
                  </Typography>
                  <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Typography variant="h3" color="secondary.main">
                      {retailers.length}
                    </Typography>
                  </Box>
                </CardContent>
              </DashboardCard>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <DashboardCard>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Wholesalers Served
                  </Typography>
                  <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Typography variant="h3" color="info.main">
                      {wholesalers.length}
                    </Typography>
                  </Box>
                </CardContent>
              </DashboardCard>
            </Grid>
          </Grid>
        )}

        {/* Shipment Details Modal */}
        <Modal
          open={!!selectedShipment}
          onClose={() => setSelectedShipment(null)}
        >
          <Box sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 600,
            bgcolor: 'background.paper',
            boxShadow: 24,
            p: 4,
            borderRadius: 2
          }}>
            {selectedShipment && (
              <>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                  Shipment Details: {selectedShipment.trackingNumber}
                </Typography>
                
                <Box sx={{ mb: 3 }}>
                  <Typography variant="body1"><strong>Manufacturer:</strong> {getManufacturerName(selectedShipment.manufacturer)}</Typography>
                  <Typography variant="body1"><strong>Drug Count:</strong> {selectedShipment.drugs?.length || 0}</Typography>
                  <Typography variant="body1"><strong>Date Sent:</strong> {new Date(selectedShipment.createdAt).toLocaleDateString()}</Typography>
                  <Typography variant="body1"><strong>Status:</strong> 
                    <StatusChip label={selectedShipment.status} status={selectedShipment.status} sx={{ ml: 1 }} />
                  </Typography>
                </Box>
                
                <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
                  Drug List
                </Typography>
                
                <Box sx={{ maxHeight: 200, overflow: 'auto', mb: 3, p: 1, border: '1px solid #eee', borderRadius: 1 }}>
                  {selectedShipment.drugs?.map((drug, i) => (
                    <Typography key={i} variant="body2" sx={{ py: 0.5 }}>
                      - {drug.name} (Batch: {drug.batch}, Status: <StatusChip label={drug.status} status={drug.status} size="small" />)
                    </Typography>
                  ))}
                </Box>
                
                {selectedShipment.status === 'processing' || selectedShipment.status === 'in-transit' ? (
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                    <Button 
                      variant="outlined" 
                      color="error"
                      onClick={() => handleRejectShipment(selectedShipment._id)}
                    >
                      Reject Shipment
                    </Button>
                    <Button 
                      variant="contained" 
                      color="primary"
                      onClick={() => handleReceiveShipment(selectedShipment._id)}
                    >
                      Accept Shipment
                    </Button>
                  </Box>
                ) : null}
              </>
            )}
          </Box>
        </Modal>

        {/* Verification Result Modal */}
        <Modal
          open={openModal}
          onClose={() => {
            setOpenModal(false);
            setVerificationResult(null);
            setQrInput('');
          }}
        >
          <Box sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 500,
            bgcolor: 'background.paper',
            boxShadow: 24,
            p: 4,
            borderRadius: 2
          }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
              Drug Verification Result
            </Typography>
            
            {verificationResult?.error ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Cancel color="error" sx={{ fontSize: 60, mb: 2 }} />
                <Typography variant="h6" color="error">
                  {verificationResult.error}
                </Typography>
                <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                  This drug may be counterfeit or not registered in our system.
                </Typography>
              </Box>
            ) : verificationResult ? (
              <>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <CheckCircle color="success" sx={{ fontSize: 40, mr: 2 }} />
                  <Typography variant="h6" color="success.main">
                    Valid Drug Found
                  </Typography>
                </Box>
                
                <Box sx={{ pl: 2 }}>
                  <Typography variant="body1"><strong>Name:</strong> {verificationResult.name}</Typography>
                  <Typography variant="body1"><strong>Barcode:</strong> {verificationResult.barcode}</Typography>
                  <Typography variant="body1"><strong>Batch:</strong> {verificationResult.batch}</Typography>
                  <Typography variant="body1"><strong>Manufacturer:</strong> {getManufacturerName(verificationResult.manufacturer)}</Typography>
                  <Typography variant="body1"><strong>Expiry:</strong> {verificationResult.expiry}</Typography>
                  <Typography variant="body1"><strong>Status:</strong> 
                    <StatusChip label={verificationResult.status} status={verificationResult.status} sx={{ ml: 1 }} />
                  </Typography>
                </Box>
              </>
            ) : null}
            
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
              <Button 
                variant="contained" 
                onClick={() => {
                  setOpenModal(false);
                  setVerificationResult(null);
                  setQrInput('');
                }}
              >
                Close
              </Button>
            </Box>
          </Box>
        </Modal>
      </Box>
    </Box>
  );
};

export default DistributorDashboard;