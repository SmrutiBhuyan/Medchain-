import React, { useState, useRef, useEffect } from 'react';
import { FaQrcode, FaCheckCircle, FaTimes, FaUpload, FaExclamationTriangle } from 'react-icons/fa';
import { Html5Qrcode, Html5QrcodeScanner, Html5QrcodeSupportedFormats, Html5QrcodeScanType } from 'html5-qrcode';
import './DrugVerification.css';

const DrugVerification = ({ onVerify, getManufacturerName }) => {
  const [qrInput, setQrInput] = useState('');
  const [scanningStatus, setScanningStatus] = useState('idle');
  const [showScanner, setShowScanner] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

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

  const verifyDrug = async () => {
    if (!qrInput.trim()) {
      setError('Please enter or scan a barcode');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setVerificationResult(null);
      
      const result = await onVerify(qrInput.trim());
      
      if (result.error) {
        setError(result.message || 'Verification failed');
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

      const html5QrCode = new Html5Qrcode('barcode-scanner');
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

      const scanner = new Html5QrcodeScanner('barcode-scanner', config, false);
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
      <div className="scanner-container">
        <div id="barcode-scanner" style={{ width: '100%' }}></div>
        <div className="scanner-controls">
          <button 
            className="btn btn-primary"
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
            className="btn btn-danger" 
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
    if (!verificationResult) return null;

    return (
      <div className="verification-details-grid">
        <div className="detail-item">
          <span className="detail-label">Drug Name:</span>
          <span className="detail-value">{verificationResult.name}</span>
        </div>
        <div className="detail-item">
          <span className="detail-label">Barcode:</span>
          <span className="detail-value">{verificationResult.barcode || verificationResult.batchBarcode}</span>
        </div>
        <div className="detail-item">
          <span className="detail-label">Batch Number:</span>
          <span className="detail-value">{verificationResult.batch}</span>
        </div>
        <div className="detail-item">
          <span className="detail-label">Manufacturer:</span>
          <span className="detail-value">
            {getManufacturerName(verificationResult.manufacturer)}
          </span>
        </div>
        <div className="detail-item">
          <span className="detail-label">Manufacturing Date:</span>
          <span className="detail-value">
            {new Date(verificationResult.mfgDate).toLocaleDateString()}
          </span>
        </div>
        <div className="detail-item">
          <span className="detail-label">Expiry Date:</span>
          <span className="detail-value">
            {new Date(verificationResult.expiryDate).toLocaleDateString()}
          </span>
        </div>
        <div className="detail-item">
          <span className="detail-label">Current Status:</span>
          <span className="detail-value">
            <span className={`status-chip ${verificationResult.status?.replace(/\s+/g, '-')}`}>
              {verificationResult.status}
            </span>
          </span>
        </div>
        
        {showDetails && verificationResult.blockchainData && (
          <>
            <div className="detail-item">
              <span className="detail-label">Blockchain Tx:</span>
              <span className="detail-value">
                {verificationResult.blockchainData.txHash}
              </span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Verification Time:</span>
              <span className="detail-value">
                {new Date(verificationResult.blockchainData.timestamp).toLocaleString()}
              </span>
            </div>
            {verificationResult.supplyChain && verificationResult.supplyChain.length > 0 && (
              <div className="detail-item full-width">
                <span className="detail-label">Supply Chain:</span>
                <div className="supply-chain">
                  {verificationResult.supplyChain.map((event, index) => (
                    <div key={index} className="supply-chain-event">
                      <span className="event-type">{event.holderType}</span>
                      <span className="event-date">{new Date(event.date).toLocaleDateString()}</span>
                      <span className="event-status">{event.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    );
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
            className={`scan-btn ${scanningStatus}`}
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
          <div className="error-message">
            <FaExclamationTriangle /> {error}
          </div>
        )}
      </div>

      {showScanner && (
        <div className="scanner-modal">
          <div className="scanner-modal-content">
            <div className="scanner-modal-header">
              <h3>Scan Drug Barcode</h3>
              <button 
                className="btn btn-close" 
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
        <div className="modal-overlay">
          <div className={`modal verification-modal ${verificationResult.error ? 'error' : 'success'}`}>
            <div className="verification-icon">
              {verificationResult.error ? (
                <div className="icon-circle error">
                  <FaTimes />
                </div>
              ) : (
                <div className="icon-circle success">
                  <FaCheckCircle />
                </div>
              )}
            </div>
            
            <h3>
              {verificationResult.error ? 
                "Drug Verification Failed" : 
                "Drug Verified Successfully"}
            </h3>
            
            <div className="verification-content">
              {verificationResult.error ? (
                <>
                  <p className="error-message">
                    {verificationResult.message || 'This drug could not be verified in our system.'}
                  </p>
                  <div className="recommendation">
                    <h4>Recommendation:</h4>
                    <p>Do not distribute or sell this product. Please contact the manufacturer for further verification.</p>
                  </div>
                </>
              ) : (
                <>
                  {renderVerificationDetails()}
                  
                  <div className="verification-message">
                    <h4>Verification Message:</h4>
                    <p>
                      {verificationResult.blockchainData ? 
                        "This drug has been successfully verified in our blockchain system." : 
                        "This drug has been verified in our system."}
                    </p>
                  </div>
                  
                  {verificationResult.daysLeft <= 30 && (
                    <div className="expiry-warning">
                      <h4>⚠️ Expiry Notice:</h4>
                      <p>
                        This drug will expire in {verificationResult.daysLeft} days. 
                        Please prioritize its distribution.
                      </p>
                    </div>
                  )}

                  <button
                    className="toggle-details-btn"
                    onClick={() => setShowDetails(!showDetails)}
                  >
                    {showDetails ? 'Hide Details' : 'Show Full Details'}
                  </button>
                </>
              )}
            </div>
            
            <button
              className="close-btn"
              onClick={() => {
                setVerificationResult(null);
                setShowDetails(false);
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

export default DrugVerification;