import React, { useState, useEffect } from 'react';
import { 
  Container, Row, Col, Form, Button, Card, 
  ListGroup, Alert, Spinner, Table, Badge
} from 'react-bootstrap';
import axios from 'axios';
import { 
  GeoAlt as LocationIcon, 
  InfoCircle, 
  ChevronDown, 
  ChevronUp,
  ExclamationTriangleFill,
  CheckCircleFill,
  Clipboard2Pulse,
  Capsule,
  Thermometer
} from 'react-bootstrap-icons';
import { useNavigate } from 'react-router-dom';
import './DiseaseInventoryChecker.css';

const DiseaseInventoryChecker = ({ inventory }) => {
  const navigate = useNavigate();
  const [diseaseData, setDiseaseData] = useState([]);
  const [outbreakReports, setOutbreakReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [locationMethod, setLocationMethod] = useState('state');
  const [selectedState, setSelectedState] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [localOutbreaks, setLocalOutbreaks] = useState([]);
  const [requiredMedications, setRequiredMedications] = useState([]);
  const [inventoryAssessment, setInventoryAssessment] = useState({});
  const [activeAccordion, setActiveAccordion] = useState(['0']);

  const toggleAccordion = (key) => {
    setActiveAccordion(prev => 
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  // Fetch disease and outbreak data
  useEffect(() => {
    const fetchEpidemicData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const [diseasesResponse, outbreaksResponse] = await Promise.all([
          axios.get('http://localhost:5000/api/diseases'),
          axios.get('http://localhost:5000/api/outbreaks')
        ]);
        
        setDiseaseData(diseasesResponse.data || []);
        setOutbreakReports(outbreaksResponse.data || []);
      } catch (err) {
        console.error('Data fetch error:', err);
        setError(err.message || 'Failed to load epidemic data');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchEpidemicData();
  }, []);

  const analyzeLocalEpidemic = async (e) => {
    e.preventDefault();
    
    if (isLoading) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      let outbreaks = [];
      
      if (locationMethod === 'state') {
        if (!selectedState) throw new Error('Please select a state');
        outbreaks = outbreakReports.filter(report => 
          report.state?.toLowerCase() === selectedState.toLowerCase()
        );
      } else {
        if (!latitude || !longitude) throw new Error('Please enter both latitude and longitude');
        const response = await axios.post('/api/outbreaks/nearby', {
          latitude,
          longitude,
          radius: 20
        });
        outbreaks = response?.data || [];
      }
      
      setLocalOutbreaks(outbreaks);
      
      if (outbreaks.length > 0) {
        // Identify top diseases in area
        const diseaseFrequency = outbreaks.reduce((counts, outbreak) => {
          if (outbreak.disease) {
            counts[outbreak.disease] = (counts[outbreak.disease] || 0) + (outbreak.cases || 0);
          }
          return counts;
        }, {});
        
        const prevalentDiseases = Object.entries(diseaseFrequency)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(item => item[0]);
        
        // Find medications for these diseases
        const medications = new Set();
        prevalentDiseases.forEach(disease => {
          const diseaseInfo = diseaseData.find(d => 
            d.disease && d.medicines && 
            d.disease.toLowerCase() === disease.toLowerCase()
          );
          if (diseaseInfo) {
            diseaseInfo.medicines.forEach(med => medications.add(med));
          }
        });
        
        setRequiredMedications(Array.from(medications));
        
        // Assess inventory status
        const assessment = {};
        const localInventory = locationMethod === 'state' 
          ? (Array.isArray(inventory) ? inventory.filter(item => 
              item.state?.toLowerCase() === selectedState.toLowerCase()
            ) : [])
          : (Array.isArray(inventory) ? inventory : []);
        
        medications.forEach(med => {
          const item = localInventory.find(i => 
            i.name && i.name.toLowerCase() === med.toLowerCase()
          );
          assessment[med] = {
            sufficient: item && item.quantity >= 10, // Changed threshold to 10
            stock: item?.quantity || 0,
            critical: item && item.quantity < 5 // Critical if less than 5
          };
        });
        
        setInventoryAssessment(assessment);
      }
    } catch (err) {
      console.error('Analysis error:', err);
      setError(err.message || 'Failed to analyze local epidemic data');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && !outbreakReports.length) {
    return (
      <Container className="my-5 text-center">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
        <p className="mt-3">Loading epidemic preparedness data...</p>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="my-5">
        <Alert variant="danger">
          <h4>Error Loading Data</h4>
          <p>{error}</p>
          <Button variant="primary" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </Alert>
      </Container>
    );
  }

  return (
    <Container fluid className="epidemic-preparedness-container">
      <Card className="mb-4 guide-card shadow-sm">
        <Card.Body>
          <div className="d-flex align-items-center mb-3">
            <InfoCircle size={24} className="me-2 text-primary" />
            <h4 className="mb-0">Pharmacist's Outbreak Preparedness Guide</h4>
          </div>
          
          <div className="accordion-wrapper">
            <div 
              className={`accordion-item ${activeAccordion.includes('0') ? 'active' : ''}`}
              onClick={() => toggleAccordion('0')}
            >
              <div className="accordion-header">
                <h5>How to Use This Tool</h5>
                {activeAccordion.includes('0') ? <ChevronUp /> : <ChevronDown />}
              </div>
              {activeAccordion.includes('0') && (
                <div className="accordion-content">
                  <ol>
                    <li><strong>Set Your Location</strong> - Select your state or enter GPS coordinates</li>
                    <li><strong>Click "Analyze Local Situation"</strong> - Check for active outbreaks</li>
                    <li><strong>Review Results</strong> - See critical medications and inventory status</li>
                    <li><strong>Take Action</strong> - Adjust orders for medications with low stock</li>
                  </ol>
                </div>
              )}
            </div>
            
            <div 
              className={`accordion-item ${activeAccordion.includes('1') ? 'active' : ''}`}
              onClick={() => toggleAccordion('1')}
            >
              <div className="accordion-header">
                <h5>Why This Matters</h5>
                {activeAccordion.includes('1') ? <ChevronUp /> : <ChevronDown />}
              </div>
              {activeAccordion.includes('1') && (
                <div className="accordion-content">
                  <p>This tool helps you stay ahead of medication demand during outbreaks and prevent stockouts.</p>
                </div>
              )}
            </div>
          </div>
        </Card.Body>
      </Card>

      <h2 className="my-4 dashboard-title">
        <LocationIcon className="me-2" />
        Epidemic Preparedness Dashboard
      </h2>

      <Row>
        <Col lg={4}>
          <Card className="mb-4 location-card shadow-sm">
            <Card.Header className="bg-primary text-white">
              <h5><LocationIcon className="me-2" /> Location Settings</h5>
            </Card.Header>
            <Card.Body>
              <Form onSubmit={analyzeLocalEpidemic}>
                <Form.Group className="mb-3">
                  <Form.Label>Location Method:</Form.Label>
                  <div>
                    <Form.Check
                      inline
                      type="radio"
                      label="By State"
                      name="locationMethod"
                      id="state-method"
                      checked={locationMethod === 'state'}
                      onChange={() => setLocationMethod('state')}
                    />
                    <Form.Check
                      inline
                      type="radio"
                      label="By GPS"
                      name="locationMethod"
                      id="gps-method"
                      checked={locationMethod === 'gps'}
                      onChange={() => setLocationMethod('gps')}
                    />
                  </div>
                </Form.Group>
                
                {locationMethod === 'state' ? (
                  <Form.Group className="mb-3">
                    <Form.Label>Select State</Form.Label>
                    <Form.Select
                      value={selectedState}
                      onChange={(e) => setSelectedState(e.target.value)}
                      required
                      disabled={!outbreakReports.length}
                    >
                      <option value="">Select a state</option>
                      {[...new Set(outbreakReports.map(report => report.state))].map((state, index) => (
                        state && <option key={index} value={state}>{state}</option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                ) : (
                  <>
                    <Form.Group className="mb-3">
                      <Form.Label>Latitude</Form.Label>
                      <Form.Control
                        type="number"
                        step="0.000001"
                        value={latitude}
                        onChange={(e) => setLatitude(e.target.value)}
                        required
                        placeholder="e.g., 40.7128"
                      />
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label>Longitude</Form.Label>
                      <Form.Control
                        type="number"
                        step="0.000001"
                        value={longitude}
                        onChange={(e) => setLongitude(e.target.value)}
                        required
                        placeholder="e.g., -74.0060"
                      />
                    </Form.Group>
                  </>
                )}
                
                <Button 
                  variant="primary" 
                  type="submit" 
                  disabled={isLoading}
                  className="w-100 mt-3"
                >
                  {isLoading ? (
                    <>
                      <Spinner animation="border" size="sm" className="me-2" />
                      Analyzing...
                    </>
                  ) : (
                    'Analyze Local Situation'
                  )}
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={8}>
          {localOutbreaks.length > 0 ? (
            <>
              <Card className="mb-4 shadow-sm">
                <Card.Header className="bg-danger text-white">
                  <h5><ExclamationTriangleFill className="me-2" /> Active Outbreaks in Your Area</h5>
                </Card.Header>
                <Card.Body>
                  <div className="table-responsive">
                    <Table striped bordered hover>
                      <thead className="table-dark">
                        <tr>
                          <th>Disease</th>
                          <th>Location</th>
                          <th>Cases</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {localOutbreaks.slice(0, 5).map((outbreak, index) => (
                          <tr key={index}>
                            <td>
                              <Thermometer className="me-2 text-danger" />
                              <strong>{outbreak.disease || 'Unknown'}</strong>
                            </td>
                            <td>
                              {outbreak.district ? `${outbreak.district}, ` : ''}
                              {outbreak.state || 'N/A'}
                            </td>
                            <td className="text-center">
                              <Badge bg="danger">{outbreak.cases || '0'}</Badge>
                            </td>
                            <td>
                              <Badge bg={outbreak.status === 'contained' ? 'success' : 'warning'}>
                                {outbreak.status || 'active'}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                </Card.Body>
              </Card>

              <Row>
                <Col md={6}>
                  <Card className="mb-4 shadow-sm h-100">
                    <Card.Header className="bg-info text-white">
                      <h5><Capsule className="me-2" /> Critical Medications Needed</h5>
                    </Card.Header>
                    <Card.Body>
                      {requiredMedications.length > 0 ? (
                        <ListGroup variant="flush">
                          {requiredMedications.map((med, index) => (
                            <ListGroup.Item key={index} className="d-flex align-items-center">
                              <div className="me-auto">
                                <Clipboard2Pulse className="me-2 text-info" />
                                {med}
                              </div>
                              {inventoryAssessment[med]?.critical ? (
                                <Badge bg="danger">Critical</Badge>
                              ) : inventoryAssessment[med]?.sufficient ? (
                                <Badge bg="success">In Stock</Badge>
                              ) : (
                                <Badge bg="warning">Low Stock</Badge>
                              )}
                            </ListGroup.Item>
                          ))}
                        </ListGroup>
                      ) : (
                        <Alert variant="info" className="mb-0">
                          No critical medications identified
                        </Alert>
                      )}
                    </Card.Body>
                  </Card>
                </Col>

                <Col md={6}>
                  <Card className="mb-4 shadow-sm h-100">
                    <Card.Header className="bg-warning text-dark">
                      <h5><Clipboard2Pulse className="me-2" /> Inventory Status</h5>
                    </Card.Header>
                    <Card.Body>
                      {requiredMedications.length > 0 ? (
                        <div className="inventory-status-cards">
                          {requiredMedications.map((med, index) => {
                            const stock = inventoryAssessment[med]?.stock || 0;
                            const isCritical = inventoryAssessment[med]?.critical;
                            const isLow = !inventoryAssessment[med]?.sufficient && !isCritical;
                            
                            return (
                              <Card 
                                key={index} 
                                className={`mb-3 ${isCritical ? 'border-danger' : isLow ? 'border-warning' : 'border-success'}`}
                              >
                                <Card.Body>
                                  <div className="d-flex justify-content-between align-items-center">
                                    <div>
                                      <h6 className="mb-1">{med}</h6>
                                      <small className="text-muted">Current stock</small>
                                    </div>
                                    <div className="text-end">
                                      <h4 className={`mb-0 ${isCritical ? 'text-danger' : isLow ? 'text-warning' : 'text-success'}`}>
                                        {stock}
                                      </h4>
                                      {isCritical ? (
                                        <small className="text-danger">
                                          <ExclamationTriangleFill className="me-1" />
                                          Critical level!
                                        </small>
                                      ) : isLow ? (
                                        <small className="text-warning">
                                          <ExclamationTriangleFill className="me-1" />
                                          Low stock
                                        </small>
                                      ) : (
                                        <small className="text-success">
                                          <CheckCircleFill className="me-1" />
                                          Sufficient
                                        </small>
                                      )}
                                    </div>
                                  </div>
                                  {isCritical && (
                                    <Alert variant="danger" className="mt-2 mb-0 p-2">
                                      <ExclamationTriangleFill className="me-2" />
                                      <strong>Urgent restock needed!</strong> Only {stock} units remaining.
                                    </Alert>
                                  )}
                                  {isLow && (
                                    <Alert variant="warning" className="mt-2 mb-0 p-2">
                                      <ExclamationTriangleFill className="me-2" />
                                      Consider restocking soon. Only {stock} units remaining.
                                    </Alert>
                                  )}
                                </Card.Body>
                              </Card>
                            );
                          })}
                        </div>
                      ) : (
                        <Alert variant="info" className="mb-0">
                          No inventory assessment available
                        </Alert>
                      )}
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            </>
          ) : (
            !isLoading && (
              <Card className="shadow-sm">
                <Card.Body className="text-center py-5">
                  <ExclamationTriangleFill size={48} className="text-warning mb-3" />
                  <h4>
                    {localOutbreaks.length === 0 && outbreakReports.length > 0
                      ? 'No outbreaks detected in this area'
                      : 'No outbreak reports available'}
                  </h4>
                  <p className="text-muted">
                    Try adjusting your location settings or check back later for updates.
                  </p>
                </Card.Body>
              </Card>
            )
          )}
        </Col>
      </Row>
    </Container>
  );
};

export default DiseaseInventoryChecker;