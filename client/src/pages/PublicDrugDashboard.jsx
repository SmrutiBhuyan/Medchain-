import React, { useState } from 'react';
import { Container, Tab, Nav, Card, Form, Button, Badge, ListGroup, InputGroup, Alert, Modal, Row, Col } from 'react-bootstrap';
import { 
    Search, CheckCircleFill, XCircleFill, InfoCircle, Telephone,
    Capsule, ShieldExclamation, Camera
  } from 'react-bootstrap-icons';
import './PublicDrugDashboard.css'
const PublicDrugDashboard = () => {
  const [activeTab, setActiveTab] = useState('verify');
  const [barcode, setBarcode] = useState('');
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportData, setReportData] = useState({
    barcode: '',
    purchaseLocation: '',
    notes: '',
    image: null
  });

  // Sample drug data
  const drugData = {
    '3456789012': {
      name: 'Amoxicillin 500mg',
      manufacturer: 'Pfizer Inc.',
      expiry: '2024-06-30',
      batch: 'AMX2023-05',
      authentic: true,
      currentHolder: 'HealthyLife Pharmacy',
      supplyChain: [
        { entity: 'Manufacturer', name: 'Pfizer Inc.', verified: true, date: '2023-01-15' },
        { entity: 'Distributor', name: 'MediDistributors Inc.', verified: true, date: '2023-02-20' },
        { entity: 'Wholesaler', name: 'Unknown', verified: false, date: null },
        { entity: 'Pharmacy', name: 'HealthyLife Pharmacy', verified: true, date: '2023-04-05' }
      ],
      recalls: []
    },
    '7890123456': {
      name: 'Lipitor 20mg',
      manufacturer: 'Novartis Pharma',
      expiry: '2024-09-15',
      batch: 'LIP2023-03',
      authentic: true,
      currentHolder: 'City Meds',
      supplyChain: [
        { entity: 'Manufacturer', name: 'Novartis Pharma', verified: true, date: '2023-02-10' },
        { entity: 'Distributor', name: 'Global Pharma Distributors', verified: true, date: '2023-03-15' },
        { entity: 'Wholesaler', name: 'Prime Wholesalers', verified: true, date: '2023-04-22' },
        { entity: 'Pharmacy', name: 'City Meds', verified: true, date: '2023-05-18' }
      ],
      recalls: [
        { id: 1, date: '2023-05-15', reason: 'Potential contamination', by: 'FDA' }
      ]
    }
  };

  const recallList = [
    { id: 1, drug: 'Lipitor 20mg', batch: 'LIP2023-03', date: '2023-05-15', reason: 'Potential contamination' },
    { id: 2, drug: 'Ventolin Inhaler', batch: 'VEN2023-01', date: '2023-04-28', reason: 'Packaging defect' },
    { id: 3, drug: 'Omeprazole 40mg', batch: 'OME2023-01', date: '2023-05-01', reason: 'Labeling error' }
  ];

  const handleVerify = () => {
    // In a real app, this would call an API to verify the barcode
    console.log(`Verifying barcode: ${barcode}`);
  };

  const handleReportSubmit = (e) => {
    e.preventDefault();
    console.log('Submitting report:', reportData);
    setShowReportModal(false);
    // Reset form
    setReportData({
      barcode: '',
      purchaseLocation: '',
      notes: '',
      image: null
    });
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setReportData({ ...reportData, image: URL.createObjectURL(file) });
    }
  };

  const currentDrug = drugData[barcode] || null;

  return (
    <div className="public-drug-dashboard">
      <div className="header bg-primary text-white p-4 text-center">
        <h1><Capsule className="me-2" /> Drug Verification Portal</h1>
        <p className="mb-0">Verify authenticity, check recalls, and report suspicious drugs</p>
      </div>

      <Container className="my-4">
        <Tab.Container activeKey={activeTab} onSelect={setActiveTab}>
          <Nav variant="tabs" className="mb-4">
            <Nav.Item>
              <Nav.Link eventKey="verify"><CheckCircleFill className="me-2" /> Verify Drug</Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey="recalls"><ShieldExclamation className="me-2" /> Recall Notices</Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey="search"><Search className="me-2" /> Drug Info Search</Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey="ivr"><Telephone className="me-2" /> IVR Support</Nav.Link>
            </Nav.Item>
          </Nav>

          <Tab.Content className='mt-3'>
            {/* Verify Drug Tab */}
            <Tab.Pane eventKey="verify">
              <Row className='g-3'>
                <Col md={6} className='pe-3'>
                  <Card>
                    <Card.Header>
                      <h5 className="mb-0">Verify Drug Authenticity</h5>
                    </Card.Header>
                    <Card.Body>
                      <Form.Group className="mb-3">
                        <Form.Label>Enter or Scan Barcode</Form.Label>
                        <InputGroup>
                          <Form.Control 
                            type="text" 
                            placeholder="Enter drug barcode" 
                            value={barcode}
                            onChange={(e) => setBarcode(e.target.value)}
                          />
                          <Button variant="primary" onClick={handleVerify}>
                            Verify
                          </Button>
                        </InputGroup>
                      </Form.Group>

                      {currentDrug && (
                        <Card className="mb-3">
                          <Card.Body>
                            <div className="d-flex justify-content-between align-items-start">
                              <div>
                                <h4>{currentDrug.name}</h4>
                                <p className="mb-1"><strong>Manufacturer:</strong> {currentDrug.manufacturer}</p>
                                <p className="mb-1"><strong>Batch:</strong> {currentDrug.batch}</p>
                                <p className="mb-1"><strong>Expiry:</strong> {currentDrug.expiry}</p>
                                <p className="mb-0"><strong>Current Holder:</strong> {currentDrug.currentHolder}</p>
                              </div>
                              <div>
                                {currentDrug.authentic ? (
                                  <Badge bg="success" className="fs-6">
                                    <CheckCircleFill className="me-1" /> Authentic
                                  </Badge>
                                ) : (
                                  <Badge bg="danger" className="fs-6">
                                    <XCircleFill className="me-1" /> Not Registered
                                  </Badge>
                                )}
                              </div>
                            </div>

                            {currentDrug.recalls.length > 0 && (
                              <Alert variant="danger" className="mt-3">
                                <Alert.Heading>
                                  <ShieldExclamation className="me-2" />
                                  Recall Notice
                                </Alert.Heading>
                                <p>
                                  This drug batch has been recalled on {currentDrug.recalls[0].date} by {currentDrug.recalls[0].by}.
                                  Reason: {currentDrug.recalls[0].reason}
                                </p>
                              </Alert>
                            )}
                          </Card.Body>
                        </Card>
                      )}

                      <Button 
                        variant="outline-danger" 
                        onClick={() => setShowReportModal(true)}
                      >
                        <ShieldExclamation className="me-2" />
                        Report Suspicious Drug
                      </Button>
                    </Card.Body>
                  </Card>
                </Col>

                <Col md={6}>
                  <Card>
                    <Card.Header>
                      <h5 className="mb-0">Supply Chain Traceability</h5>
                    </Card.Header>
                    <Card.Body>
                      {currentDrug ? (
                        <div className="supply-chain">
                          {currentDrug.supplyChain.map((step, index) => (
                            <div 
                              key={index} 
                              className={`chain-step ${step.verified ? 'verified' : 'missing'}`}
                              data-bs-toggle="tooltip" 
                              title={step.verified ? 
                                `Verified on ${step.date}` : 
                                'Missing registration data'}
                            >
                              <div className="step-icon">
                                {step.verified ? <CheckCircleFill /> : <XCircleFill />}
                              </div>
                              <h6>{step.entity}</h6>
                              <p className="small mb-0">{step.name || 'Unknown'}</p>
                              {step.verified ? (
                                <p className="small text-success">Verified: {step.date}</p>
                              ) : (
                                <p className="small text-danger">Not verified</p>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center text-muted py-4">
                          <InfoCircle size={48} className="mb-3" />
                          <p>Enter a drug barcode to view its supply chain</p>
                        </div>
                      )}
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            </Tab.Pane>

            {/* Recall Notices Tab */}
            <Tab.Pane eventKey="recalls">
              <Card>
                <Card.Header>
                  <h5 className="mb-0">Drug Recall Notices</h5>
                </Card.Header>
                <Card.Body>
                  <Form.Group className="mb-4">
                    <Form.Label>Search Recalls by Drug Name or Batch Number</Form.Label>
                    <InputGroup>
                      <Form.Control type="text" placeholder="Enter drug name or batch number" />
                      <Button variant="primary">Search</Button>
                    </InputGroup>
                  </Form.Group>

                  <h5 className="mb-3">Current Recalls</h5>
                  <ListGroup>
                    {recallList.map(recall => (
                      <ListGroup.Item key={recall.id}>
                        <div className="d-flex justify-content-between align-items-start">
                          <div>
                            <h6 className="mb-1">{recall.drug} - Batch #{recall.batch}</h6>
                            <p className="mb-1 small">Recall Date: {recall.date}</p>
                            <p className="mb-0 small">Reason: {recall.reason}</p>
                          </div>
                          <Badge bg="danger">Recalled</Badge>
                        </div>
                      </ListGroup.Item>
                    ))}
                  </ListGroup>
                </Card.Body>
              </Card>
            </Tab.Pane>

            {/* Drug Info Search Tab */}
            <Tab.Pane eventKey="search">
              <Card>
                <Card.Header>
                  <h5 className="mb-0">Drug Information Search</h5>
                </Card.Header>
                <Card.Body>
                  <Form.Group className="mb-4">
                    <Form.Label>Search by Drug Name</Form.Label>
                    <InputGroup>
                      <Form.Control type="text" placeholder="Enter drug name (e.g., Amoxicillin)" />
                      <Button variant="primary">Search</Button>
                    </InputGroup>
                  </Form.Group>

                  <Card className="mb-3">
                    <Card.Body>
                      <h5>Amoxicillin 500mg</h5>
                      <div className="row">
                        <div className="col-md-6">
                          <p className="mb-1"><strong>Latest Batch:</strong> AMX2023-05</p>
                          <p className="mb-1"><strong>Expiry:</strong> 2024-06-30</p>
                        </div>
                        <div className="col-md-6">
                          <p className="mb-1"><strong>Manufacturer:</strong> Pfizer Inc.</p>
                          <p className="mb-1"><strong>Status:</strong> <Badge bg="success">No Active Recalls</Badge></p>
                        </div>
                      </div>
                    </Card.Body>
                  </Card>

                  <Card className="mb-3">
                    <Card.Body>
                      <h5>Lipitor 20mg</h5>
                      <div className="row">
                        <div className="col-md-6">
                          <p className="mb-1"><strong>Latest Batch:</strong> LIP2023-03</p>
                          <p className="mb-1"><strong>Expiry:</strong> 2024-09-15</p>
                        </div>
                        <div className="col-md-6">
                          <p className="mb-1"><strong>Manufacturer:</strong> Novartis Pharma</p>
                          <p className="mb-1"><strong>Status:</strong> <Badge bg="danger">Recalled - Batch LIP2023-03</Badge></p>
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                </Card.Body>
              </Card>
            </Tab.Pane>

            {/* IVR Support Tab */}
            <Tab.Pane eventKey="ivr">
              <Card>
                <Card.Header>
                  <h5 className="mb-0">IVR Calling Support</h5>
                </Card.Header>
                <Card.Body>
                  <div className="text-center py-4">
                    <Telephone size={64} className="text-primary mb-3" />
                    <h3>Toll-Free Verification: 1-800-DRUG-CHK</h3>
                    <p className="lead">(1-800-378-4245)</p>
                    
                    <div className="ivr-instructions mt-5">
                      <h4>How It Works:</h4>
                      <ol className="text-start mx-auto" style={{ maxWidth: '500px' }}>
                        <li className="mb-2">Call the toll-free number</li>
                        <li className="mb-2">Enter the drug's barcode using your keypad</li>
                        <li className="mb-2">Listen to the verification response:</li>
                        <ul>
                          <li>Drug name and manufacturer</li>
                          <li>Authentic / Recalled / Unknown status</li>
                          <li>Expiry date if available</li>
                        </ul>
                      </ol>
                    </div>

                    <div className="mt-5">
                      <h5>IVR Service Providers</h5>
                      <div className="d-flex justify-content-center gap-4 mt-3">
                        <Button variant="outline-primary">Twilio</Button>
                        <Button variant="outline-primary">Exotel</Button>
                        <Button variant="outline-primary">MyOperator</Button>
                      </div>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Tab.Pane>
          </Tab.Content>
        </Tab.Container>
      </Container>

      {/* Report Suspicious Drug Modal */}
      <Modal show={showReportModal} onHide={() => setShowReportModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title><ShieldExclamation className="me-2" /> Report Suspicious Drug</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleReportSubmit}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Drug Barcode</Form.Label>
              <Form.Control 
                type="text" 
                value={reportData.barcode}
                onChange={(e) => setReportData({...reportData, barcode: e.target.value})}
                required 
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Where Purchased</Form.Label>
              <Form.Control 
                type="text" 
                value={reportData.purchaseLocation}
                onChange={(e) => setReportData({...reportData, purchaseLocation: e.target.value})}
                required 
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Upload Image (Optional)</Form.Label>
              <div className="d-flex align-items-center">
                {reportData.image ? (
                  <img 
                    src={reportData.image} 
                    alt="Drug packaging" 
                    className="img-thumbnail me-3" 
                    style={{ width: '100px', height: '100px' }}
                  />
                ) : (
                  <div className="border rounded d-flex align-items-center justify-content-center me-3" 
                    style={{ width: '100px', height: '100px', backgroundColor: '#f8f9fa' }}>
                    <Camera size={32} className="text-muted" />
                  </div>
                )}
                <div>
                  <Form.Control 
                    type="file" 
                    accept="image/*" 
                    onChange={handleImageUpload}
                  />
                  <Form.Text className="text-muted">
                    Photo of packaging helps verification
                  </Form.Text>
                </div>
              </div>
            </Form.Group>

            <Form.Group>
              <Form.Label>Additional Notes</Form.Label>
              <Form.Control 
                as="textarea" 
                rows={3} 
                value={reportData.notes}
                onChange={(e) => setReportData({...reportData, notes: e.target.value})}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowReportModal(false)}>
              Cancel
            </Button>
            <Button variant="danger" type="submit">
              Submit Report
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
};

export default PublicDrugDashboard;