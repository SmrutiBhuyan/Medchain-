import React, { useState, useRef, useEffect } from 'react';
import { 
  FaQrcode, 
  FaCheckCircle, 
  FaTimes, 
  FaUpload, 
  FaExclamationTriangle, 
  FaFlag, 
  FaArrowRight,
  FaIndustry,
  FaTruck,
  FaWarehouse,
  FaStore,
  FaClinicMedical,
  FaQuestion
} from 'react-icons/fa';
import { Html5Qrcode, Html5QrcodeScanner, Html5QrcodeSupportedFormats, Html5QrcodeScanType } from 'html5-qrcode';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './DrugVerificationGlobal.css';

const DrugVerificationGlobal = () => {
  const [qrInput, setQrInput] = useState('');
  const [scanningStatus, setScanningStatus] = useState('idle');
  const [showScanner, setShowScanner] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showReportButton, setShowReportButton] = useState(false);
  const [counterfeitInfo, setCounterfeitInfo] = useState(null);
  const navigate = useNavigate();

  const onVerify = async (barcode) => {
    try {
      const response = await axios.get(`http://localhost:5000/api/drugs/verifyDrug/${barcode}`);
      console.log(response.data);
      
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        // Drug not found in system - likely counterfeit
        return { 
          error: true,
          isCounterfeit: true,
          message: 'This drug was not found in our verification system. It may be counterfeit.',
          barcode: barcode
        };
      }
      return { 
        error: true,
        message: error.response?.data?.error || 'Verification failed'
      };
    }
  };

  const getManufacturerName = (manufacturer) => {
    return manufacturer?.name || 'Unknown Manufacturer';
  };

  const handleStartScan = () => {
    setScanningStatus('scanning');
    setShowScanner(true);
    setError(null);
  };

  const handleScan = (barcode) => {
    if (!barcode) {
      handleScanError('Empty barcode scanned');
      return;
    }
    setQrInput(barcode);
    setShowScanner(false);
    setScanningStatus('success');
    setError(null);
  };

  const handleScanError = (errorMessage = 'Scan failed') => {
    setScanningStatus('error');
    setError(errorMessage);
    setTimeout(() => {
      setScanningStatus('idle');
    }, 2000);
  };

  const handleReportCounterfeit = () => {
    // Show confirmation and redirect after delay
    setCounterfeitInfo({
      message: "Thank you for reporting. You'll be redirected to the report page...",
      barcode: verificationResult.barcode
    });
    
    setTimeout(() => {
      navigate('/report-counterfeit', {
        state: {
          barcode: verificationResult.barcode,
          drugName: verificationResult.name || 'Unknown Drug'
        }
      });
    }, 3000);
  };

  const verifyDrug = async () => {
    if (!qrInput.trim()) {
      setError('Please enter or scan a barcode');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setVerificationResult(null);
      setShowReportButton(false);
      setCounterfeitInfo(null);
      
      const result = await onVerify(qrInput.trim());
      
      if (result.error) {
        setError(result.message || 'Verification failed');
        if (result.isCounterfeit) {
          setVerificationResult(result);
          setShowReportButton(true);
        }
      } else {
        setVerificationResult(result.data || result);
      }
    } catch (err) {
      console.error('Verification error:', err);
      setError(err.message || 'Failed to verify drug');
    } finally {
      setIsLoading(false);
    }
  };

  const BarcodeScanner = ({ onScan, onClose, onError }) => {
    const scannerRef = useRef(null);
    const fileInputRef = useRef(null);

    const handleBarcodeFileUpload = (event) => {
      const file = event.target.files[0];
      if (!file) return;

      const html5QrCode = new Html5Qrcode('verify-barcode-scanner');
      html5QrCode.scanFile(file, false)
        .then(decodedText => {
          if (/^[A-Za-z0-9-]+$/.test(decodedText)) {
            onScan(decodedText);
          } else {
            onError('Invalid barcode format. Only letters, numbers and hyphens are allowed.');
          }
        })
        .catch(err => {
          console.error('File scan error:', err);
          onError(err.message || 'Failed to scan the file');
        });
    };

    useEffect(() => {
      const config = {
        fps: 10,
        qrbox: 250,
        formatsToSupport: [
          Html5QrcodeSupportedFormats.CODE_39,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.CODE_39,
          Html5QrcodeSupportedFormats.CODE_93,
          Html5QrcodeSupportedFormats.ITF
        ],
        rememberLastUsedCamera: true,
        supportedScanTypes: [
          Html5QrcodeScanType.SCAN_TYPE_CAMERA,
          Html5QrcodeScanType.SCAN_TYPE_FILE
        ]
      };

      const scanner = new Html5QrcodeScanner('verify-barcode-scanner', config, false);
      scannerRef.current = scanner;

      const successCallback = (decodedText) => {
        if (/^[A-Za-z0-9-]+$/.test(decodedText)) {
          scanner.clear().then(() => {
            onScan(decodedText);
          }).catch(err => {
            console.error('Failed to clear scanner', err);
            onError('Scanner cleanup failed');
          });
        } else {
          onError('Invalid barcode format');
        }
      };

      const errorCallback = (error) => {
        if (!error.message.includes('No MultiFormat Readers')) {
          console.warn('QR code scan error', error);
          onError(error.message);
        }
      };

      scanner.render(successCallback, errorCallback);

      return () => {
        if (scannerRef.current) {
          scannerRef.current.clear().catch(error => {
            console.error('Failed to clear scanner', error);
          });
        }
      };
    }, [onScan, onError]);

    
    return (
      <div className="verify-scanner-container">
        <div id="verify-barcode-scanner" style={{ width: '100%' }}></div>
        <div className="verify-scanner-controls">
          <button 
            className="verify-btn verify-btn-primary"
            onClick={() => fileInputRef.current.click()}
          >
            <FaUpload /> Scan from Image
          </button>
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleBarcodeFileUpload}
          />
          <button 
            className="verify-btn verify-btn-danger" 
            onClick={() => {
              if (scannerRef.current) {
                scannerRef.current.clear().catch(console.error);
              }
              onClose();
            }}
          >
            Close Scanner
          </button>
        </div>
      </div>
    );
  };

 const renderVerificationDetails = () => {
  if (!verificationResult || !verificationResult.drug) return null;

  const drugData = verificationResult.drug;

  // Helper function to format dates
  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown date';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Get participant info with proper fallbacks
  const getParticipantInfo = (type) => {
    const participant = drugData[type];
    if (!participant) return null;
    
    return {
      name: participant.name || 'Unknown',
      organization: participant.organization || 'Unknown',
      type: type.charAt(0).toUpperCase() + type.slice(1)
    };
  };

  // Get all participants with their info
  const participants = [
    getParticipantInfo('manufacturer'),
    getParticipantInfo('distributor'),
    getParticipantInfo('wholesaler'),
    getParticipantInfo('retailer'),
    getParticipantInfo('pharmacy')
  ].filter(Boolean);

  // Get current holder info
  const currentHolder = drugData.currentHolder 
    ? drugData[drugData.currentHolder]
    : null;

  return (
    <div className="verify-details-container">
      {/* Basic Drug Info */}
      <div className="verify-basic-info">
        <div className="verify-drug-header">
          <h2>{drugData.name || 'Unknown Drug'}</h2>
          <span className={`verify-status-badge ${(drugData.status || '').replace(/\s+/g, '-')}`}>
            {drugData.status || 'Unknown status'}
          </span>
        </div>
        
        <div className="verify-drug-meta">
          <div>
            <span className="verify-meta-label">Batch:</span>
            <span>{drugData.batch || 'Unknown batch'}</span>
          </div>
          <div>
            <span className="verify-meta-label">Barcode:</span>
            <span>{drugData.barcode || drugData.batchBarcode || 'Unknown'}</span>
          </div>
          <div>
            <span className="verify-meta-label">Manufactured:</span>
            <span>{formatDate(drugData.mfgDate)}</span>
          </div>
          <div>
            <span className="verify-meta-label">Expires:</span>
            <span>
              {formatDate(drugData.expiryDate)} 
              {drugData.daysLeft !== undefined ? ` (${drugData.daysLeft} days left)` : ''}
            </span>
          </div>
        </div>
      </div>

      {/* Supply Chain Visualization */}
      <div className="verify-supply-chain-section">
        <h3>Supply Chain Journey</h3>
        
        {drugData.missingLinks?.length > 0 && (
          <div className="verify-missing-links-warning">
            <FaExclamationTriangle />
            <span>Missing supply chain participants: {drugData.missingLinks.join(', ')}</span>
          </div>
        )}

        <div className="verify-timeline">
          {drugData.supplyChain?.length > 0 ? (
            drugData.supplyChain.map((event, index) => (
              <div key={index} className="verify-timeline-event">
                <div className="verify-timeline-point">
                  <div className="verify-timeline-icon">
                    {getChainIcon(event.holderType)}
                  </div>
                </div>
                <div className="verify-timeline-content">
                  <div className="verify-timeline-header">
                    <span className="verify-timeline-title">{event.holderType?.toUpperCase() || 'UNKNOWN'}</span>
                    <span className="verify-timeline-date">{formatDate(event.date)}</span>
                  </div>
                  <div className="verify-timeline-body">
                    <p><strong>{event.holderName || 'Unknown'}</strong> ({event.organization || 'Unknown'})</p>
                    <p>Status: <span className="verify-status-chip">{event.status || 'Unknown'}</span></p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="verify-no-history">
              <p>No detailed supply chain history available</p>
              <div className="verify-simple-chain">
                {participants.map((participant, index) => (
                  <React.Fragment key={participant.type}>
                    <div className="verify-simple-participant">
                      <div className="verify-simple-icon">
                        {getChainIcon(participant.type.toLowerCase())}
                      </div>
                      <div className="verify-simple-info">
                        <strong>{participant.type}</strong>
                        <span>{participant.name}</span>
                        <span>{participant.organization}</span>
                      </div>
                    </div>
                    {index < participants.length - 1 && (
                      <div className="verify-simple-arrow">→</div>
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Current Holder */}
      {drugData.currentHolder && (
        <div className="verify-current-holder">
          <h3>Current Holder</h3>
          <div className="verify-holder-card">
            <div className="verify-holder-icon">
              {getChainIcon(drugData.currentHolder)}
            </div>
            <div className="verify-holder-info">
              <h4>{drugData.currentHolder.toUpperCase()}</h4>
              {currentHolder ? (
                <>
                  <p>{currentHolder.name || 'Unknown'}</p>
                  <p>{currentHolder.organization || 'Unknown'}</p>
                </>
              ) : (
                <p>Information not available</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

  const getChainIcon = (type) => {
    switch(type) {
      case 'manufacturer':
        return <FaIndustry />;
      case 'distributor':
        return <FaTruck />;
      case 'wholesaler':
        return <FaWarehouse />;
      case 'retailer':
        return <FaStore />;
      case 'pharmacy':
        return <FaClinicMedical />;
      default:
        return <FaQuestion />;
    }
  };

  return (
    <div className="verify-tab">
      <div className="verify-card">
        <h3>Verify Drug Authenticity</h3>
        
        <div className="verify-input">
          <input
            type="text"
            placeholder="Enter drug barcode or scan QR code"
            value={qrInput}
            onChange={(e) => {
              setQrInput(e.target.value);
              setError(null);
            }}
            onKeyPress={(e) => e.key === 'Enter' && verifyDrug()}
          />
          <button 
            className={`verify-scan-btn ${scanningStatus}`}
            onClick={handleStartScan}
            disabled={scanningStatus !== 'idle'}
          >
            {scanningStatus === 'scanning' ? 'Scanning...' :
             scanningStatus === 'success' ? '✓ Scanned!' :
             scanningStatus === 'error' ? 'Scan Failed' :
             <><FaQrcode /> Scan</>}
          </button>
        </div>
        
        <button
          className="verify-btn"
          disabled={!qrInput || isLoading}
          onClick={verifyDrug}
        >
          {isLoading ? 'Verifying...' : 'Verify Drug'}
        </button>

        {error && (
          <div className="verify-error-message">
            <FaExclamationTriangle /> {error}
          </div>
        )}
      </div>

      {showScanner && (
        <div className="verify-scanner-modal">
          <div className="verify-scanner-modal-content">
            <div className="verify-scanner-modal-header">
              <h3>Scan Drug Barcode</h3>
              <button 
                className="verify-btn verify-btn-close" 
                onClick={() => {
                  setShowScanner(false);
                  setScanningStatus('idle');
                }}
              >
                &times;
              </button>
            </div>
            <BarcodeScanner 
              onScan={handleScan}
              onClose={() => {
                setShowScanner(false);
                setScanningStatus('idle');
              }}
              onError={handleScanError}
            />
          </div>
        </div>
      )}

      {verificationResult && (
        <div className="verify-modal-overlay">
          <div className={`verify-modal verify-verification-modal ${verificationResult.error ? 'verify-error' : 'verify-success'}`}>
            <div className="verify-verification-icon">
              {verificationResult.error ? (
                <div className="verify-icon-circle verify-error">
                  <FaTimes />
                </div>
              ) : (
                <div className="verify-icon-circle verify-success">
                  <FaCheckCircle />
                </div>
              )}
            </div>
            
            <h3>
              {verificationResult.error ? 
                (verificationResult.isCounterfeit ? "Potential Counterfeit Drug" : "Drug Verification Failed") : 
                "Drug Verified Successfully"}
            </h3>
            
            <div className="verify-verification-content">
              {verificationResult.error ? (
                <>
                  <p className="verify-error-message">
                    {verificationResult.message}
                  </p>
                  
                  {verificationResult.isCounterfeit && (
                    <div className="verify-counterfeit-warning">
                      <h4>⚠️ Counterfeit Drug Warning (India)</h4>
                      <p>This drug could not be verified in our system. In India, counterfeit medicines are a serious issue:</p>
                      <ul>
                        <li>Report suspected counterfeit drugs to CDSCO (Central Drugs Standard Control Organization)</li>
                        <li>Contact the drug manufacturer directly</li>
                        <li>Notify your local FDA office</li>
                        <li>Preserve the packaging as evidence</li>
                      </ul>
                      
                      {counterfeitInfo ? (
                        <div className="verify-report-confirmation">
                          <p>{counterfeitInfo.message}</p>
                          <div className="verify-loading-spinner"></div>
                        </div>
                      ) : (
                        showReportButton && (
                          <button
                            className="verify-report-btn"
                            onClick={handleReportCounterfeit}
                          >
                            <FaFlag /> Report This Drug <FaArrowRight />
                          </button>
                        )
                      )}
                    </div>
                  )}
                  
                  {!verificationResult.isCounterfeit && (
                    <div className="verify-recommendation">
                      <h4>Recommendation:</h4>
                      <p>Do not distribute or sell this product. Please contact the manufacturer for further verification.</p>
                    </div>
                  )}
                </>
              ) : (
                <>
                  {renderVerificationDetails()}
                  
                  <div className="verify-verification-message">
                    <h4>Verification Message:</h4>
                    <p>
                      {verificationResult.blockchainData ? 
                        "This drug has been successfully verified in our blockchain system." : 
                        "This drug has been verified in our system."}
                    </p>
                  </div>
                  
                  {verificationResult.daysLeft <= 30 && (
                    <div className="verify-expiry-warning">
                      <h4>⚠️ Expiry Notice:</h4>
                      <p>
                        This drug will expire in {verificationResult.daysLeft} days. 
                        Please prioritize its distribution.
                      </p>
                    </div>
                  )}

                  <button
                    className="verify-toggle-details-btn"
                    onClick={() => setShowDetails(!showDetails)}
                  >
                    {showDetails ? 'Hide Details' : 'Show Full Details'}
                  </button>
                </>
              )}
            </div>
            
            <button
              className="verify-close-btn"
              onClick={() => {
                setVerificationResult(null);
                setShowDetails(false);
                setShowReportButton(false);
                setCounterfeitInfo(null);
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DrugVerificationGlobal;