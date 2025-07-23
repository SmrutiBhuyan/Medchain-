import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Button, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Paper, TextField, 
  Select, MenuItem, FormControl, InputLabel, Card, CardContent,
  Grid, Modal, Chip, LinearProgress, IconButton, Tabs, Tab,
  Alert, Snackbar, Badge
} from '@mui/material';
import { 
  CheckCircle, Cancel, Search, QrCodeScanner, 
  Inventory, PointOfSale, Verified, History, 
  NotificationImportant, Warning, Receipt
} from '@mui/icons-material';
import { styled } from '@mui/system';
import { useTheme } from '@mui/material/styles';

const DashboardCard = styled(Card)(({ theme }) => ({
  borderRadius: '12px',
  boxShadow: '0 4px 20px 0 rgba(0,0,0,0.12)',
  transition: 'transform 0.3s ease-in-out',
  '&:hover': {
    transform: 'translateY(-5px)',
  },
}));

// Mock data
const mockIncomingShipments = [
  { id: 'RSH-1001', sender: 'MediWholesalers', senderType: 'wholesaler', drugCount: 50, dateSent: '2023-06-15', status: 'pending' },
  { id: 'RSH-1002', sender: 'PharmaDist', senderType: 'distributor', drugCount: 30, dateSent: '2023-06-18', status: 'pending' },
  { id: 'RSH-1003', sender: 'HealthPlus', senderType: 'wholesaler', drugCount: 20, dateSent: '2023-06-10', status: 'received' },
];

const mockInventory = [
  { id: 'RDRG-001', name: 'Paracetamol 500mg', barcode: '8901234567890', batch: 'B20230501', manufacturer: 'PharmaCorp', expiry: '2024-06-30', status: 'in_stock' },
  { id: 'RDRG-002', name: 'Ibuprofen 400mg', barcode: '8901234567891', batch: 'B20230502', manufacturer: 'MediLife', expiry: '2024-07-15', status: 'in_stock' },
  { id: 'RDRG-003', name: 'Amoxicillin 250mg', barcode: '8901234567892', batch: 'B20230503', manufacturer: 'HealthPlus', expiry: '2024-05-30', status: 'in_stock' },
  { id: 'RDRG-004', name: 'Cetirizine 10mg', barcode: '8901234567893', batch: 'B20230504', manufacturer: 'PharmaCorp', expiry: '2024-08-20', status: 'sold', patientId: 'PAT-1001' },
];

const mockSalesLog = [
  { id: 'SALE-1001', drugName: 'Cetirizine 10mg', barcode: '8901234567893', batch: 'B20230504', dateSold: '2023-06-05', patientId: 'PAT-1001' },
  { id: 'SALE-1002', drugName: 'Paracetamol 500mg', barcode: '8901234567890', batch: 'B20230501', dateSold: '2023-06-10', patientId: 'PAT-1002' },
];

const mockAlerts = [
  { id: 'ALERT-001', type: 'expiry', message: '5 drugs expiring within 3 months', severity: 'warning' },
  { id: 'ALERT-002', type: 'recall', message: 'Batch B20230503 recalled by manufacturer', severity: 'error' },
];

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
    case 'sold':
      bg = theme.palette.secondary.light;
      break;
    case 'recalled':
      bg = theme.palette.error.light;
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

const RetailerDashboard = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [shipments, setShipments] = useState(mockIncomingShipments);
  const [inventory, setInventory] = useState(mockInventory);
  const [selectedShipment, setSelectedShipment] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [verificationResult, setVerificationResult] = useState(null);
  const [openModal, setOpenModal] = useState(false);
  const [qrInput, setQrInput] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [salesLog, setSalesLog] = useState(mockSalesLog);
  const [alerts, setAlerts] = useState(mockAlerts);
  const [openAlert, setOpenAlert] = useState(true);
  const [patientId, setPatientId] = useState('');
  const [sellSuccess, setSellSuccess] = useState(false);

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
      id: `RDRG-${Math.floor(Math.random() * 10000)}`,
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

  const verifyDrug = () => {
    const foundDrug = inventory.find(drug => drug.barcode === qrInput);
    setVerificationResult(foundDrug || { error: 'Drug not found in system' });
    setOpenModal(true);
  };

  const sellDrug = () => {
    if (!verificationResult || verificationResult.error) return;
    
    // Mark drug as sold
    setInventory(inventory.map(drug => 
      drug.id === verificationResult.id ? { ...drug, status: 'sold', patientId } : drug
    ));
    
    // Add to sales log
    const newSale = {
      id: `SALE-${Math.floor(1000 + Math.random() * 9000)}`,
      drugName: verificationResult.name,
      barcode: verificationResult.barcode,
      batch: verificationResult.batch,
      dateSold: new Date().toISOString().split('T')[0],
      patientId: patientId || 'N/A'
    };
    
    setSalesLog([newSale, ...salesLog]);
    setSellSuccess(true);
    setOpenModal(false);
    setVerificationResult(null);
    setQrInput('');
    setPatientId('');
  };

  const filteredInventory = inventory.filter(drug => {
    const matchesSearch = drug.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         drug.barcode.includes(searchTerm);
    const matchesStatus = filterStatus === 'all' || drug.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const pendingShipments = shipments.filter(s => s.status === 'pending');
  const receivedShipments = shipments.filter(s => s.status === 'received');
  const statusOptions = [...new Set(inventory.map(drug => drug.status))];

  const checkForAlerts = () => {
    // Check for near expiry drugs
    const nearExpiryCount = inventory.filter(d => {
      const expiryDate = new Date(d.expiry);
      const threeMonthsFromNow = new Date();
      threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);
      return expiryDate <= threeMonthsFromNow && d.status === 'in_stock';
    }).length;

    // Check for recalled batches (in a real app this would come from API)
    const recalledBatches = ['B20230503']; // Example recalled batch
    
    const newAlerts = [];
    
    if (nearExpiryCount > 0) {
      newAlerts.push({
        id: `ALERT-${Math.random()}`,
        type: 'expiry',
        message: `${nearExpiryCount} drugs expiring within 3 months`,
        severity: 'warning'
      });
    }
    
    recalledBatches.forEach(batch => {
      if (inventory.some(d => d.batch === batch && d.status === 'in_stock')) {
        newAlerts.push({
          id: `ALERT-${Math.random()}`,
          type: 'recall',
          message: `Batch ${batch} recalled by manufacturer`,
          severity: 'error'
        });
      }
    });
    
    setAlerts(newAlerts);
  };

  useEffect(() => {
    checkForAlerts();
  }, [inventory]);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', mb: 2 }}>
        Retailer Dashboard
      </Typography>
      
      {/* Alerts */}
      {alerts.length > 0 && openAlert && (
        <Box sx={{ mb: 3 }}>
          {alerts.map(alert => (
            <Alert 
              key={alert.id}
              severity={alert.severity}
              sx={{ mb: 1 }}
              onClose={() => setAlerts(alerts.filter(a => a.id !== alert.id))}
              icon={alert.severity === 'error' ? <Warning /> : <NotificationImportant />}
            >
              {alert.message}
            </Alert>
          ))}
        </Box>
      )}
      
      {/* Success message */}
      <Snackbar
        open={sellSuccess}
        autoHideDuration={3000}
        onClose={() => setSellSuccess(false)}
        message="Drug successfully marked as sold"
      />
      
      <Tabs value={activeTab} onChange={handleTabChange} sx={{ mb: 3 }}>
        <Tab label="Incoming Shipments" icon={<Receipt />} iconPosition="start" />
        <Tab label="Inventory" icon={<Inventory />} iconPosition="start" />
        <Tab label="Sell Drug" icon={<PointOfSale />} iconPosition="start" />
        <Tab label="Drug Lookup" icon={<Verified />} iconPosition="start" />
        <Tab label="Sales Log" icon={<History />} iconPosition="start" />
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
                          color={shipment.senderType === 'wholesaler' ? 'primary' : 'secondary'} 
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
                          color={shipment.senderType === 'wholesaler' ? 'primary' : 'secondary'} 
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
              Current Inventory ({inventory.filter(d => d.status === 'in_stock').length} in stock)
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
                  <TableCell>Actions</TableCell>
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
                      <Button 
                        size="small" 
                        startIcon={<QrCodeScanner />}
                        onClick={() => {
                          setQrInput(drug.barcode);
                          verifyDrug();
                        }}
                      >
                        Verify
                      </Button>
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
        <Box sx={{ maxWidth: 600, mx: 'auto' }}>
          <DashboardCard>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
                Sell Drug to Customer
              </Typography>
              
              <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                <TextField
                  fullWidth
                  variant="outlined"
                  placeholder="Scan drug barcode"
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
                sx={{ mb: 3 }}
              >
                Verify Drug
              </Button>
              
              {verificationResult && !verificationResult.error && (
                <Box sx={{ mt: 3, p: 2, border: '1px solid #eee', borderRadius: 1 }}>
                  <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>
                    Ready to Sell: {verificationResult.name}
                  </Typography>
                  <Typography variant="body2">Batch: {verificationResult.batch}</Typography>
                  <Typography variant="body2">Expiry: {verificationResult.expiry}</Typography>
                  
                  <TextField
                    fullWidth
                    label="Patient ID (Optional)"
                    variant="outlined"
                    size="small"
                    value={patientId}
                    onChange={(e) => setPatientId(e.target.value)}
                    sx={{ mt: 2 }}
                  />
                  
                  <Button
                    fullWidth
                    variant="contained"
                    color="success"
                    size="large"
                    onClick={sellDrug}
                    sx={{ mt: 2 }}
                    startIcon={<PointOfSale />}
                  >
                    Mark as Sold
                  </Button>
                </Box>
              )}
            </CardContent>
          </DashboardCard>
        </Box>
      )}

      {activeTab === 3 && (
        <Box sx={{ maxWidth: 600, mx: 'auto' }}>
          <DashboardCard>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
                Drug Lookup / Scanner
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
                Lookup Drug
              </Button>
            </CardContent>
          </DashboardCard>
        </Box>
      )}

      {activeTab === 4 && (
        <Box>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
            Sales Log ({salesLog.length} transactions)
          </Typography>
          
          <TableContainer component={Paper}>
            <Table>
              <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                <TableRow>
                  <TableCell>Sale ID</TableCell>
                  <TableCell>Drug Name</TableCell>
                  <TableCell>Barcode</TableCell>
                  <TableCell>Batch</TableCell>
                  <TableCell>Date Sold</TableCell>
                  <TableCell>Patient ID</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {salesLog.map((sale) => (
                  <TableRow key={sale.id}>
                    <TableCell>{sale.id}</TableCell>
                    <TableCell>{sale.drugName}</TableCell>
                    <TableCell>{sale.barcode}</TableCell>
                    <TableCell>{sale.batch}</TableCell>
                    <TableCell>{sale.dateSold}</TableCell>
                    <TableCell>{sale.patientId}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
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
                    color={selectedShipment.senderType === 'wholesaler' ? 'primary' : 'secondary'} 
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
                <Box>
                  <Typography variant="h6" color="success.main">
                    Valid Drug Found
                  </Typography>
                  <Typography variant="body2">
                    {verificationResult.name}
                  </Typography>
                </Box>
              </Box>
              
              <Box sx={{ pl: 2, mb: 3 }}>
                <Typography variant="body1"><strong>Barcode:</strong> {verificationResult.barcode}</Typography>
                <Typography variant="body1"><strong>Batch:</strong> {verificationResult.batch}</Typography>
                <Typography variant="body1"><strong>Manufacturer:</strong> {verificationResult.manufacturer}</Typography>
                <Typography variant="body1"><strong>Expiry:</strong> {verificationResult.expiry}</Typography>
                <Typography variant="body1"><strong>Status:</strong> 
                  <StatusChip label={verificationResult.status} status={verificationResult.status} sx={{ ml: 1 }} />
                </Typography>
                <Typography variant="body1"><strong>Current Holder:</strong> 
                  <Chip label="You (Retailer)" color="info" size="small" sx={{ ml: 1 }} />
                </Typography>
              </Box>
              
              {verificationResult.status === 'in_stock' && (
                <>
                  <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>
                    Drug Movement Trace
                  </Typography>
                  <Box sx={{ pl: 2, mb: 3 }}>
                    <Typography variant="body2">1. Manufactured by {verificationResult.manufacturer} on 2023-05-01</Typography>
                    <Typography variant="body2">2. Shipped to MediWholesalers on 2023-05-15</Typography>
                    <Typography variant="body2">3. Received by You on 2023-06-10</Typography>
                  </Box>
                  
                  {activeTab === 2 && (
                    <>
                      <TextField
                        fullWidth
                        label="Patient ID (Optional)"
                        variant="outlined"
                        size="small"
                        value={patientId}
                        onChange={(e) => setPatientId(e.target.value)}
                        sx={{ mb: 2 }}
                      />
                      <Button
                        fullWidth
                        variant="contained"
                        color="success"
                        size="large"
                        onClick={sellDrug}
                        startIcon={<PointOfSale />}
                      >
                        Mark as Sold
                      </Button>
                    </>
                  )}
                </>
              )}
            </>
          ) : null}
          
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
            <Button 
              variant="outlined" 
              onClick={() => {
                setOpenModal(false);
                setVerificationResult(null);
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

export default RetailerDashboard;