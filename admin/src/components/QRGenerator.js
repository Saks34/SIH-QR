import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode.react';
import { generateQRToken } from '../services/api';

const QRGenerator = () => {
  const [qrToken, setQrToken] = useState('');
  const [timeLeft, setTimeLeft] = useState(30);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isActive, setIsActive] = useState(false);
  // Session/socket not used with simple generate-qr endpoint

  const startQRGeneration = () => {
    if (!isActive) {
      generateNewToken();
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    let interval = null;
    
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(timeLeft => timeLeft - 1);
      }, 1000);
    } else if (isActive && timeLeft === 0) {
      // Auto-fetch a fresh token when expired
      generateNewToken();
    }

    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  const generateNewToken = async () => {
    try {
      setIsGenerating(true);
      const response = await generateQRToken(); // { success, token, expiresAt }
      if (!response?.token) {
        throw new Error('Invalid server response');
      }
      setQrToken(response.token);
      // Compute remaining seconds from expiresAt, fallback to 60s
      let remaining = 60;
      if (response.expiresAt) {
        const expiryMs = new Date(response.expiresAt).getTime();
        const nowMs = Date.now();
        remaining = Math.max(0, Math.ceil((expiryMs - nowMs) / 1000));
      }
      setTimeLeft(remaining || 60);
      setIsActive(true);
    } catch (error) {
      console.error('Error generating QR token:', error);
      alert('Error generating QR token. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const stopQRGeneration = () => {
    setIsActive(false);
    setQrToken('');
    setTimeLeft(30);
  };

  return (
    <div className="qr-generator">
      <div className="qr-generator-header">
        <h1 className="qr-generator-title">QR Code Generator</h1>
        <p className="qr-generator-subtitle">
          Generate QR codes for student attendance marking
        </p>
      </div>

      <div className="qr-container">
        {qrToken ? (
          <>
            <QRCode
              value={qrToken}
              size={256}
              level="M"
              includeMargin={true}
            />
            
            <div className="qr-info">
              <p><strong>Token:</strong></p>
              <p className="qr-token">{qrToken}</p>
              <p className="qr-timer">
                Auto-refresh in: {formatTime(timeLeft)}
              </p>
            </div>
          </>
        ) : (
          <div className="qr-placeholder">
            <div className="qr-placeholder-icon">📱</div>
            <p>Click "Start QR Generation" to begin</p>
          </div>
        )}
      </div>

      <div className="controls">
        {!isActive ? (
          <button
            className="control-btn primary"
            onClick={startQRGeneration}
            disabled={isGenerating}
          >
            {isGenerating ? 'Generating...' : 'Start QR Generation'}
          </button>
        ) : (
          <button
            className="control-btn secondary"
            onClick={stopQRGeneration}
          >
            Stop Generation
          </button>
        )}
      </div>

      <div className="qr-instructions">
        <h3>Instructions for Students:</h3>
        <ol>
          <li>Open the Student App on your mobile device</li>
          <li>Go to "Mark Attendance" section</li>
          <li>Tap "Scan QR Code" button</li>
          <li>Point your camera at this QR code</li>
          <li>Wait for confirmation message</li>
        </ol>
        
        <div className="qr-features">
          <h4>Features:</h4>
          <ul>
            <li>✅ QR codes auto-refresh every 30 seconds</li>
            <li>✅ Each QR code has a unique token</li>
            <li>✅ Tokens expire after 60 seconds for security</li>
            <li>✅ One attendance per student per session</li>
            <li>✅ Real-time attendance tracking</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default QRGenerator;
