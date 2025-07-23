import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Button, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Paper, TextField, 
  Select, MenuItem, FormControl, InputLabel, Card, CardContent,
  Grid, Modal, Chip, LinearProgress, IconButton, Tabs, Tab, useTheme
} from '@mui/material';
import { 
  CheckCircle, Cancel, Search, QrCodeScanner, 
  Inventory, LocalShipping, Analytics, Receipt, 
  History, FilterList
} from '@mui/icons-material';
import { styled } from '@mui/system';

// Mock data
const mockIncomingShipments = [
  { id: 'WSH-1001', sender: 'MediDistributors', senderType: 'distributor', drugCount: 250, dateSent: '2023-06-10', status: 'pending' },
  { id: 'WSH-1002', sender: 'PharmaCorp', senderType: 'manufacturer', drugCount: 180, dateSent: '2023-06-12', status: 'pending' },
  { id: 'WSH-1003', sender: 'HealthPlus', senderType: 'manufacturer', drugCount: 120, dateSent: '2023-06-05', status: 'received' },
];

const mockInventory = [
  { id: 'WDRG-001', name: 'Paracetamol 500mg', barcode: '8901234567890', batch: 'B20230501', manufacturer: 'PharmaCorp', expiry: '2024-06-30', status: 'in_stock' },
  { id: 'WDRG-002', name: 'Ibuprofen 400mg', barcode: '8901234567891', batch: 'B20230502', manufacturer: 'MediLife', expiry: '2024-07-15', status: 'in_stock' },
  { id: 'WDRG-003', name: 'Amoxicillin 250mg', barcode: '8901234567892', batch: 'B20230503', manufacturer: 'HealthPlus', expiry: '2024-05-30', status: 'in_stock' },
  { id: 'WDRG-004', name: 'Cetirizine 10mg', barcode: '8901234567893', batch: 'B20230504', manufacturer: 'PharmaCorp', expiry: '2024-08-20', status: 'recalled' },
];

const mockRetailers = [
  { id: 'RET-001', name: 'City Pharmacy' },
  { id: 'RET-002', name: 'MediMart' },
  { id: 'RET-003', name: 'HealthFirst' },
];

const mockShipmentHistory = [
  { id: 'OUT-1001', retailer: 'City Pharmacy', drugCount: 50, dateSent: '2023-05-20', status: 'delivered' },
  { id: 'OUT-1002', retailer: 'MediMart', drugCount: 75, dateSent: '2023-05-25', status: 'delivered' },
  { id: 'OUT-1003', retailer: 'HealthFirst', drugCount: 60, dateSent: '2023-06-01', status: 'in_transit' },
];

// Styled components
const DashboardCard = styled(Card)(({ theme }) => ({
  borderRadius: '12px',
  boxShadow: '0 4px 20px 0 rgba(0,0,0,0.12)',
  transition: 'transform 0.3s ease-in-out',
  '&:hover': {
    transform: 'translateY(-5px)',
  },
}));

// Remove the styled StatusChip and replace with a function component
function StatusChip({ label, status, ...props }) {
  const theme = useTheme();
  let bg;
  switch (status) {
    case 'in_stock':
      bg = theme.palette.success.light;
      break;
    case 'pending':
      bg = theme.palette.warning.light;
      break;
    case 'received':
      bg = theme.palette.success.light;
      break;
    case 'recalled':
      bg = theme.palette.error.light;
      break;
    case 'in_transit':
      bg = theme.palette.info.light;
      break;
    case 'delivered':
      bg = theme.palette.success.light;
      break;
    default:
      bg = theme.palette.grey[300];
  }
  return (
    <Chip
      label={label}
      sx={{
        backgroundColor: bg,
        color: '#fff',
        fontWeight: 'bold',
        fontSize: '0.75rem',
      }}
      {...props}
    />
  );
}

const WholesalerDashboard = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [shipments, setShipments] = useState(mockIncomingShipments);
  const [inventory, setInventory] = useState(mockInventory);
  const [selectedShipment, setSelectedShipment] = useState(null);
  const [selectedDrugs, setSelectedDrugs] = useState([]);
  const [selectedRetailer, setSelectedRetailer] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [verificationResult, setVerificationResult] = useState(null);
  const [openModal, setOpenModal] = useState(false);
  const [qrInput, setQrInput] = useState('');
  const [filterManufacturer, setFilterManufacturer] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [shipmentHistory, setShipmentHistory] = useState(mockShipmentHistory);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleReceiveShipment = (shipmentId) => {
    // Update shipment status
    setShipments(shipments.map(shipment => 
      shipment.id === shipmentId ? { ...shipment, status: 'received' } : shipment
    ));
    
    // Add drugs to inventory - in real app this would come from shipment details
    const newDrugs = Array(5).fill().map((_, i) => ({
      id: `WDRG-${Math.floor(Math.random() * 10000)}`,
      name: ['Paracetamol', 'Ibuprofen', 'Amoxicillin', 'Cetirizine', 'Omeprazole'][Math.floor(Math.random() * 5)],
      barcode: `890${Math.floor(Math.random() * 10000000000)}`,
      batch: `B2023${Math.floor(Math.random() * 1000)}`,
      manufacturer: ['PharmaCorp', 'MediLife', 'HealthPlus'][Math.floor(Math.random() * 3)],
      expiry: `2024-${Math.floor(Math.random() * 12) + 1}-${Math.floor(Math.random() * 28) + 1}`,
      status: 'in_stock'
    }));
    
    setInventory([...inventory, ...newDrugs]);
    setSelectedShipment(null);
  };

  const handleRejectShipment = (shipmentId) => {
    setShipments(shipments.filter(shipment => shipment.id !== shipmentId));
    setSelectedShipment(null);
  };

  const handleSelectDrug = (drugId) => {
    setSelectedDrugs(prev => 
      prev.includes(drugId) 
        ? prev.filter(id => id !== drugId) 
        : [...prev, drugId]
    );
  };

  const handleShipToRetailer = () => {
    if (selectedDrugs.length === 0 || !selectedRetailer) return;
    
    // Create new shipment record
    const newShipment = {
      id: `OUT-${Math.floor(1000 + Math.random() * 9000)}`,
      retailer: mockRetailers.find(r => r.id === selectedRetailer).name,
      drugCount: selectedDrugs.length,
      dateSent: new Date().toISOString().split('T')[0],
      status: 'in_transit'
    };
    
    setShipmentHistory([newShipment, ...shipmentHistory]);
    setInventory(inventory.filter(drug => !selectedDrugs.includes(drug.id)));
    setSelectedDrugs([]);
    setSelectedRetailer('');
  };

  const verifyDrug = () => {
    const foundDrug = inventory.find(drug => drug.barcode === qrInput);
    setVerificationResult(foundDrug || { error: 'Drug not found in system' });
    setOpenModal(true);
  };

  const filteredInventory = inventory.filter(drug => {
    const matchesSearch = drug.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         drug.barcode.includes(searchTerm);
    const matchesManufacturer = filterManufacturer === 'all' || drug.manufacturer === filterManufacturer;
    const matchesStatus = filterStatus === 'all' || drug.status === filterStatus;
    return matchesSearch && matchesManufacturer && matchesStatus;
  });

  const pendingShipments = shipments.filter(s => s.status === 'pending');
  const receivedShipments = shipments.filter(s => s.status === 'received');

  const manufacturers = [...new Set(inventory.map(drug => drug.manufacturer))];
  const statusOptions = [...new Set(inventory.map(drug => drug.status))];

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', mb: 2 }}>
        Wholesaler Dashboard
      </Typography>
      
      <Tabs value={activeTab} onChange={handleTabChange} sx={{ mb: 3 }}>
        <Tab label="Incoming Shipments" icon={<Receipt />} iconPosition="start" />
        <Tab label="My Inventory" icon={<Inventory />} iconPosition="start" />
        <Tab label="Ship to Retailer" icon={<LocalShipping />} iconPosition="start" />
        <Tab label="Verification" icon={<QrCodeScanner />} iconPosition="start" />
        <Tab label="Shipment History" icon={<History />} iconPosition="start" />
        <Tab label="Analytics" icon={<Analytics />} iconPosition="start" />
      </Tabs>
      
      {activeTab === 0 && (
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
                    <TableCell>Sender</TableCell>
                    <TableCell>Sender Type</TableCell>
                    <TableCell>Drug Count</TableCell>
                    <TableCell>Date Sent</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pendingShipments.map((shipment) => (
                    <TableRow key={shipment.id}>
                      <TableCell>{shipment.id}</TableCell>
                      <TableCell>{shipment.sender}</TableCell>
                      <TableCell>
                        <Chip 
                          label={shipment.senderType} 
                          color={shipment.senderType === 'manufacturer' ? 'primary' : 'secondary'} 
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{shipment.drugCount}</TableCell>
                      <TableCell>{shipment.dateSent}</TableCell>
                      <TableCell>
                        <StatusChip label={shipment.status} status={shipment.status} />
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
            <DashboardCard sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="body1" color="textSecondary">
                No pending shipments at this time
              </Typography>
            </DashboardCard>
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
                    <TableCell>Sender</TableCell>
                    <TableCell>Sender Type</TableCell>
                    <TableCell>Drug Count</TableCell>
                    <TableCell>Date Sent</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {receivedShipments.map((shipment) => (
                    <TableRow key={shipment.id}>
                      <TableCell>{shipment.id}</TableCell>
                      <TableCell>{shipment.sender}</TableCell>
                      <TableCell>
                        <Chip 
                          label={shipment.senderType} 
                          color={shipment.senderType === 'manufacturer' ? 'primary' : 'secondary'} 
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{shipment.drugCount}</TableCell>
                      <TableCell>{shipment.dateSent}</TableCell>
                      <TableCell>
                        <StatusChip label={shipment.status} status={shipment.status} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <DashboardCard sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="body1" color="textSecondary">
                No received shipments to display
              </Typography>
            </DashboardCard>
          )}
        </Box>
      )}

      {activeTab === 1 && (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              Current Inventory ({inventory.length} drugs)
            </Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
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
              <Button variant="outlined" startIcon={<FilterList />}>
                Filters
              </Button>
            </Box>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
            <FormControl size="small" sx={{ minWidth: 180 }}>
              <InputLabel>Manufacturer</InputLabel>
              <Select
                value={filterManufacturer}
                onChange={(e) => setFilterManufacturer(e.target.value)}
                label="Manufacturer"
              >
                <MenuItem value="all">All Manufacturers</MenuItem>
                {manufacturers.map(m => (
                  <MenuItem key={m} value={m}>{m}</MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <FormControl size="small" sx={{ minWidth: 180 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                label="Status"
              >
                <MenuItem value="all">All Statuses</MenuItem>
                {statusOptions.map(s => (
                  <MenuItem key={s} value={s}>{s.replace('_', ' ')}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
          
          <TableContainer component={Paper}>
            <Table>
              <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                <TableRow>
                  <TableCell>Drug Name</TableCell>
                  <TableCell>Barcode</TableCell>
                  <TableCell>Batch Number</TableCell>
                  <TableCell>Manufacturer</TableCell>
                  <TableCell>Expiry Date</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Current Holder</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredInventory.map((drug) => (
                  <TableRow key={drug.id}>
                    <TableCell>{drug.name}</TableCell>
                    <TableCell>{drug.barcode}</TableCell>
                    <TableCell>{drug.batch}</TableCell>
                    <TableCell>{drug.manufacturer}</TableCell>
                    <TableCell>{drug.expiry}</TableCell>
                    <TableCell>
                      <StatusChip label={drug.status} status={drug.status} />
                    </TableCell>
                    <TableCell>
                      <Chip label="You" color="info" size="small" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          
          {filteredInventory.length === 0 && (
            <DashboardCard sx={{ p: 3, textAlign: 'center', mt: 2 }}>
              <Typography variant="body1" color="textSecondary">
                No drugs found matching your criteria
              </Typography>
            </DashboardCard>
          )}
        </Box>
      )}

      {activeTab === 2 && (
        <Box>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
            Ship Drugs to Retailer
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <DashboardCard>
                <CardContent>
                  <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold', mb: 2 }}>
                    Select Drugs to Ship ({selectedDrugs.length} selected)
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
                            <TableCell>Manufacturer</TableCell>
                            <TableCell>Expiry</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {filteredInventory.map((drug) => (
                            <TableRow 
                              key={drug.id} 
                              hover 
                              selected={selectedDrugs.includes(drug.id)}
                              onClick={() => handleSelectDrug(drug.id)}
                              sx={{ cursor: 'pointer' }}
                            >
                              <TableCell padding="checkbox">
                                {selectedDrugs.includes(drug.id) ? (
                                  <CheckCircle color="primary" />
                                ) : (
                                  <Cancel color="disabled" />
                                )}
                              </TableCell>
                              <TableCell>{drug.name}</TableCell>
                              <TableCell>{drug.barcode}</TableCell>
                              <TableCell>{drug.manufacturer}</TableCell>
                              <TableCell>{drug.expiry}</TableCell>
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
                    <InputLabel>Select Retailer</InputLabel>
                    <Select
                      value={selectedRetailer}
                      onChange={(e) => setSelectedRetailer(e.target.value)}
                      label="Select Retailer"
                    >
                      {mockRetailers.map(retailer => (
                        <MenuItem key={retailer.id} value={retailer.id}>
                          {retailer.name}
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
                    disabled={selectedDrugs.length === 0 || !selectedRetailer}
                    onClick={handleShipToRetailer}
                    startIcon={<LocalShipping />}
                  >
                    Confirm Shipment
                  </Button>
                </CardContent>
              </DashboardCard>
            </Grid>
          </Grid>
        </Box>
      )}

      {activeTab === 3 && (
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

      {activeTab === 4 && (
        <Box>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
            Shipment History
          </Typography>
          
          <TableContainer component={Paper}>
            <Table>
              <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                <TableRow>
                  <TableCell>Shipment ID</TableCell>
                  <TableCell>Retailer</TableCell>
                  <TableCell>Drug Count</TableCell>
                  <TableCell>Date Sent</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {shipmentHistory.map((shipment) => (
                  <TableRow key={shipment.id}>
                    <TableCell>{shipment.id}</TableCell>
                    <TableCell>{shipment.retailer}</TableCell>
                    <TableCell>{shipment.drugCount}</TableCell>
                    <TableCell>{shipment.dateSent}</TableCell>
                    <TableCell>
                      <StatusChip label={shipment.status} status={shipment.status} />
                    </TableCell>
                    <TableCell>
                      <Button size="small">View Details</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {activeTab === 5 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <DashboardCard>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Shipments to Retailers (Last 6 Months)
                </Typography>
                <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Typography variant="h3" color="primary">
                    42
                  </Typography>
                </Box>
              </CardContent>
            </DashboardCard>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <DashboardCard>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Near-Expiry Drugs (Next 3 Months)
                </Typography>
                <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Typography variant="h3" color="warning.main">
                    {inventory.filter(d => {
                      const expiryDate = new Date(d.expiry);
                      const threeMonthsFromNow = new Date();
                      threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);
                      return expiryDate <= threeMonthsFromNow;
                    }).length}
                  </Typography>
                </Box>
              </CardContent>
            </DashboardCard>
          </Grid>
          
          <Grid item xs={12}>
            <DashboardCard>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Stock Over Time
                </Typography>
                <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Typography variant="body1" color="textSecondary">
                    Stock trend visualization would appear here
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
                Shipment Details: {selectedShipment.id}
              </Typography>
              
              <Box sx={{ mb: 3 }}>
                <Typography variant="body1"><strong>Sender:</strong> {selectedShipment.sender}</Typography>
                <Typography variant="body1"><strong>Sender Type:</strong> 
                  <Chip 
                    label={selectedShipment.senderType} 
                    color={selectedShipment.senderType === 'manufacturer' ? 'primary' : 'secondary'} 
                    size="small" 
                    sx={{ ml: 1 }}
                  />
                </Typography>
                <Typography variant="body1"><strong>Drug Count:</strong> {selectedShipment.drugCount}</Typography>
                <Typography variant="body1"><strong>Date Sent:</strong> {selectedShipment.dateSent}</Typography>
                <Typography variant="body1"><strong>Status:</strong> 
                  <StatusChip label={selectedShipment.status} status={selectedShipment.status} sx={{ ml: 1 }} />
                </Typography>
              </Box>
              
              <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
                Drug List (Sample)
              </Typography>
              
              <Box sx={{ maxHeight: 200, overflow: 'auto', mb: 3, p: 1, border: '1px solid #eee', borderRadius: 1 }}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <Typography key={i} variant="body2" sx={{ py: 0.5 }}>
                    - {['Paracetamol', 'Ibuprofen', 'Amoxicillin', 'Cetirizine', 'Omeprazole'][i]} (Batch: B20230{i+1})
                  </Typography>
                ))}
              </Box>
              
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                <Button 
                  variant="outlined" 
                  color="error"
                  onClick={() => handleRejectShipment(selectedShipment.id)}
                >
                  Reject Shipment
                </Button>
                <Button 
                  variant="contained" 
                  color="primary"
                  onClick={() => handleReceiveShipment(selectedShipment.id)}
                >
                  Accept Shipment
                </Button>
              </Box>
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
                <Typography variant="body1"><strong>Manufacturer:</strong> {verificationResult.manufacturer}</Typography>
                <Typography variant="body1"><strong>Expiry:</strong> {verificationResult.expiry}</Typography>
                <Typography variant="body1"><strong>Status:</strong> 
                  <StatusChip label={verificationResult.status} status={verificationResult.status} sx={{ ml: 1 }} />
                </Typography>
                <Typography variant="body1"><strong>Current Holder:</strong> 
                  <Chip label="You (Wholesaler)" color="info" size="small" sx={{ ml: 1 }} />
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
  );
};

export default WholesalerDashboard;