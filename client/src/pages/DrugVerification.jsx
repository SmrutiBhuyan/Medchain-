import React, { useState, useRef, useEffect } from 'react';
import { FaQrcode, FaCheckCircle, FaTimes, FaUpload } from 'react-icons/fa';
import { Html5Qrcode, Html5QrcodeScanner, Html5QrcodeSupportedFormats, Html5QrcodeScanType } from 'html5-qrcode';

const DrugVerification = ({ onVerify, getManufacturerName }) => {
  const [qrInput, setQrInput] = useState('');
  const [scanningStatus, setScanningStatus] = useState('idle'); // 'idle', 'scanning', 'success', 'error'
  const [showScanner, setShowScanner] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleStartScan = () => {
    setScanningStatus('scanning');
    setShowScanner(true);
  };

  const handleScan = (barcode) => {
    setQrInput(barcode);
    setShowScanner(false);
    setScanningStatus('success');
  };

  const handleScanError = () => {
    setScanningStatus('error');
    setTimeout(() => {
      setScanningStatus('idle');
    }, 2000);
  };

  const verifyDrug = async () => {
    try {
      setIsLoading(true);
      const result = await onVerify(qrInput);
      setVerificationResult(result);
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
            if (onClose) onClose();
          } else {
            alert('Invalid barcode format. Only letters, numbers and hyphens are allowed.');
          }
        })
        .catch(err => {
          console.error('File scan error:', err);
          if (onError) onError(err.message);
          alert('Failed to scan the file. Please try another image.');
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
            if (onClose) onClose();
          }).catch(err => {
            console.error('Failed to clear scanner', err);
            if (onError) onError('Scanner cleanup failed');
          });
        } else {
          if (onError) onError('Invalid format');
          alert('Invalid barcode format. Only letters, numbers and hyphens are allowed.');
        }
      };

      const errorCallback = (error) => {
        if (!error.message.includes('No MultiFormat Readers')) {
          console.warn('QR code scan error', error);
          if (onError) onError(error.message);
        }
      };

      scanner.render(successCallback, errorCallback);

      return () => {
        if (scannerRef.current) {
          scannerRef.current.clear().catch(error => {
            console.error('Failed to clear scanner', error);
            if (onError) onError('Scanner cleanup failed');
          });
        }
      };
    }, [onScan, onClose, onError]);

    return (
      <div className="scanner-container">
        <div id="barcode-scanner" style={{ width: '100%' }}></div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '10px' }}>
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
              if (onClose) onClose();
            }}
          >
            Close Scanner
          </button>
        </div>
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
            onChange={(e) => setQrInput(e.target.value)}
          />
          <button 
            className={`scan-btn ${scanningStatus === 'scanning' ? 'scanning' : 
                        scanningStatus === 'success' ? 'success' : 
                        scanningStatus === 'error' ? 'error' : ''}`}
            onClick={handleStartScan}
            disabled={scanningStatus !== 'idle'}
          >
            {scanningStatus === 'scanning' ? (
              <span>Scanning...</span>
            ) : scanningStatus === 'success' ? (
              <span>✓ Scanned!</span>
            ) : scanningStatus === 'error' ? (
              <span>Scan Failed</span>
            ) : (
              <>
                <FaQrcode /> Scan
              </>
            )}
          </button>
        </div>
        
        <button
          className="verify-btn"
          disabled={!qrInput || isLoading}
          onClick={verifyDrug}
        >
          {isLoading ? 'Verifying...' : 'Verify Drug'}
        </button>
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
          <div className={`modal verification-modal ${verificationResult?.error ? 'error' : 'success'}`}>
            <div className="verification-icon">
              {verificationResult?.error ? (
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
              {verificationResult?.error ? 
                "Drug Verification Failed" : 
                "Drug Verified Successfully"}
            </h3>
            
            <div className="verification-content">
              {verificationResult?.error ? (
                <>
                  <p className="error-message">
                    This drug could not be verified in our system. It may be counterfeit or not properly registered.
                  </p>
                  <div className="recommendation">
                    <h4>Recommendation:</h4>
                    <p>Do not distribute or sell this product. Please contact the manufacturer for further verification.</p>
                  </div>
                </>
              ) : verificationResult ? (
                <>
                  <div className="verification-details-grid">
                    <div className="detail-item">
                      <span className="detail-label">Drug Name:</span>
                      <span className="detail-value">{verificationResult.name}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Barcode:</span>
                      <span className="detail-value">{verificationResult.barcode}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Batch Number:</span>
                      <span className="detail-value">{verificationResult.batch}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Manufacturer:</span>
                      <span className="detail-value">{getManufacturerName(verificationResult.manufacturer)}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Expiry Date:</span>
                      <span className="detail-value">{new Date(verificationResult.expiryDate).toLocaleDateString()}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Current Status:</span>
                      <span className="detail-value">
                        <span className={`status-chip ${verificationResult.status}`}>
                          {verificationResult.status}
                        </span>
                      </span>
                    </div>
                  </div>
                  
                  <div className="verification-message">
                    <h4>Verification Message:</h4>
                    <p>
                      This drug has been successfully verified in our blockchain system. 
                      It has a valid chain of custody from manufacturer to distributor.
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
                </>
              ) : null}
            </div>
            
            <button
              className="close-btn"
              onClick={() => {
                setVerificationResult(null);
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