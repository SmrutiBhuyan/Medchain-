import React, { useState, useEffect } from 'react';
import { 
  Container, Row, Col, Form, Button, Card, 
  ListGroup, Alert, Spinner, Table, Breadcrumb, Accordion
} from 'react-bootstrap';
import axios from 'axios';
import { GeoAlt as LocationIcon, InfoCircle } from 'react-bootstrap-icons';
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
        
        if (!Array.isArray(diseasesResponse?.data)) {
          throw new Error('Invalid disease data format from API');
        }
        if (!Array.isArray(outbreaksResponse?.data)) {
          throw new Error('Invalid outbreak data format from API');
        }
        
        setDiseaseData(diseasesResponse.data);
        setOutbreakReports(outbreaksResponse.data);
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
        if (!selectedState) {
          throw new Error('Please select a state');
        }
        outbreaks = outbreakReports.filter(report => 
          report.state?.toLowerCase() === selectedState.toLowerCase()
        );
      } else {
        if (!latitude || !longitude) {
          throw new Error('Please enter both latitude and longitude');
        }
        const response = await axios.post('/api/outbreaks/nearby', {
          latitude,
          longitude,
          radius: 20
        });
        outbreaks = Array.isArray(response?.data) ? response.data : [];
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
            sufficient: item && item.quantity > 20,
            stock: item?.quantity || 0
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
 <Card className="mb-4 bg-light">
        <Card.Body>
          <div className="d-flex align-items-center mb-3">
            <InfoCircle size={24} className="me-2 text-primary" />
            <h4 className="mb-0">Pharmacist's Outbreak Preparedness Guide</h4>
          </div>
          
          <Accordion defaultActiveKey="0">
            <Accordion.Item eventKey="0">
              <Accordion.Header>How to Use This Tool</Accordion.Header>
              <Accordion.Body>
                <ol>
                  <li><strong>Set Your Location</strong> - Select your state or enter GPS coordinates to analyze local disease outbreaks</li>
                  <li><strong>Click "Analyze Local Situation"</strong> - The system will check for active outbreaks in your area</li>
                  <li><strong>Review Results</strong>:
                    <ul>
                      <li>Active Outbreaks table shows current disease threats</li>
                      <li>Critical Medications list identifies drugs you may need</li>
                      <li>Inventory Assessment highlights stock levels (green = sufficient, red = low)</li>
                    </ul>
                  </li>
                  <li><strong>Take Action</strong> - Adjust orders for medications marked in red to prepare for potential increased demand</li>
                </ol>
              </Accordion.Body>
            </Accordion.Item>
            
            <Accordion.Item eventKey="1">
              <Accordion.Header>Why This Matters</Accordion.Header>
              <Accordion.Body>
                <p>This tool helps you:</p>
                <ul>
                  <li>Stay ahead of medication demand during outbreaks</li>
                  <li>Prevent stockouts of critical treatments</li>
                  <li>Support community health during epidemics</li>
                  <li>Make data-driven inventory decisions</li>
                </ul>
                <p className="mb-0"><strong>Recommended:</strong> Check weekly for updates and before placing large orders.</p>
              </Accordion.Body>
            </Accordion.Item>
          </Accordion>
        </Card.Body>
      </Card>
      <h2 className="my-4">
        <LocationIcon className="me-2" />
        Epidemic Preparedness Dashboard
      </h2>

      <Row>
        <Col lg={4}>
          <Card className="mb-4">
            <Card.Header>
              <h5>📍 Location Settings</h5>
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
                      label="By GPS Coordinates"
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
                      {outbreakReports.map((report, index) => (
                        report.state && (
                          <option key={`${report.state}-${index}`} value={report.state}>
                            {report.state}
                          </option>
                        )
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
                
                <Button variant="primary" type="submit" disabled={isLoading}>
                  {isLoading ? 'Analyzing...' : 'Analyze Local Situation'}
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={8}>
          {localOutbreaks.length > 0 ? (
            <>
              <Card className="mb-4">
                <Card.Header className="bg-warning text-dark">
                  <h5>🦠 Active Outbreaks in Your Area</h5>
                </Card.Header>
                <Card.Body>
                  <div className="table-responsive">
                    <Table striped bordered hover size="sm">
                      <thead>
                        <tr>
                          <th>State</th>
                          <th>District</th>
                          <th>Disease</th>
                          <th>Cases</th>
                          <th>Deaths</th>
                        </tr>
                      </thead>
                      <tbody>
                        {localOutbreaks.map((outbreak, index) => (
                          <tr key={index}>
                            <td>{outbreak.state || 'N/A'}</td>
                            <td>{outbreak.district || 'N/A'}</td>
                            <td>{outbreak.disease || 'N/A'}</td>
                            <td>{outbreak.cases || '0'}</td>
                            <td>{outbreak.deaths || '0'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                </Card.Body>
              </Card>

              <Row>
                <Col md={6}>
                  <Card className="mb-4">
                    <Card.Header className="bg-primary text-white">
                      <h5>💊 Critical Medications Needed</h5>
                    </Card.Header>
                    <Card.Body>
                      {requiredMedications.length > 0 ? (
                        <ListGroup variant="flush">
                          {requiredMedications.map((med, index) => (
                            <ListGroup.Item key={index}>
                              {med}
                            </ListGroup.Item>
                          ))}
                        </ListGroup>
                      ) : (
                        <Alert variant="info">No critical medications identified</Alert>
                      )}
                    </Card.Body>
                  </Card>
                </Col>

                <Col md={6}>
                  <Card className="mb-4">
                    <Card.Header className="bg-info text-white">
                      <h5>📊 Inventory Assessment</h5>
                    </Card.Header>
                    <Card.Body>
                      {requiredMedications.length > 0 ? (
                        <ListGroup variant="flush">
                          {requiredMedications.map((med, index) => (
                            <ListGroup.Item key={index}>
                              <div className="d-flex justify-content-between align-items-center">
                                <span>{med}</span>
                                {inventoryAssessment[med]?.sufficient ? (
                                  <span className="badge bg-success">
                                    Stock: {inventoryAssessment[med].stock}
                                  </span>
                                ) : (
                                  <span className="badge bg-danger">
                                    {inventoryAssessment[med]?.stock || 0} left
                                  </span>
                                )}
                              </div>
                            </ListGroup.Item>
                          ))}
                        </ListGroup>
                      ) : (
                        <Alert variant="info">No inventory assessment available</Alert>
                      )}
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            </>
          ) : (
            !isLoading && (
              <Alert variant="warning">
                {localOutbreaks.length === 0 && outbreakReports.length > 0
                  ? 'No outbreaks detected in this area. Try another location.'
                  : 'No outbreak reports available for analysis.'}
              </Alert>
            )
          )}
        </Col>
      </Row>
    </Container>
  );
};

export default DiseaseInventoryChecker;