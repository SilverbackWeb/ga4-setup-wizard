import React, { useState } from 'react';
import '../styles/screens.css';

function Error({ error, onRetry, onExit }) {
  const [showLogs, setShowLogs] = useState(false);

  const errorCode = 'ERROR_GA4_001';
  const timestamp = new Date().toLocaleString();

  return (
    <div className="screen error-screen">
      <div className="error-container">
        <div className="error-header">
          <span className="error-icon">⚠️</span>
          <h2>Setup Failed</h2>
        </div>

        {/* Error Message */}
        <section className="error-section">
          <div className="error-box">
            <p className="error-message">{error || 'An unexpected error occurred'}</p>
            <div className="error-details">
              <div className="detail-item">
                <span className="label">Error Code:</span>
                <span className="value">{errorCode}</span>
              </div>
              <div className="detail-item">
                <span className="label">Timestamp:</span>
                <span className="value">{timestamp}</span>
              </div>
            </div>
          </div>
        </section>

        {/* What Happened */}
        <section className="error-section">
          <h3>What Went Wrong</h3>
          <ul className="error-list">
            <li className="success">
              <span className="checkmark">✓</span>
              <span>Authenticated successfully</span>
            </li>
            <li className="success">
              <span className="checkmark">✓</span>
              <span>Connected to GTM API</span>
            </li>
            <li className="success">
              <span className="checkmark">✓</span>
              <span>Verified GA4 access</span>
            </li>
            <li className="error-item">
              <span className="cross">✗</span>
              <span>{error || 'Setup process failed'}</span>
            </li>
          </ul>
        </section>

        {/* Suggested Solution */}
        <section className="error-section">
          <h3>Suggested Solutions</h3>
          <div className="solutions-box">
            <ol className="solutions-list">
              <li>Check that your Google account has access to the specified GTM container</li>
              <li>Verify that the GA4 Property ID and Measurement ID are correct</li>
              <li>Ensure there are no triggers or tags with the same names already in GTM</li>
              <li>Check your internet connection and try again</li>
            </ol>
          </div>
        </section>

        {/* Debug Logs Toggle */}
        <section className="error-section">
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => setShowLogs(!showLogs)}
          >
            {showLogs ? 'Hide' : 'View'} Full Logs
          </button>

          {showLogs && (
            <div className="debug-logs">
              <h4>Debug Information</h4>
              <pre className="log-output">
                [14:32:15] Authenticated successfully
                [14:32:16] Connected to GTM API v2
                [14:32:17] Verified GA4 access
                [14:32:18] Creating trigger: call_now_click
                [14:32:19] ERROR: {error || 'Unknown error occurred'}
                [14:32:20] Setup process terminated
              </pre>
            </div>
          )}
        </section>

        {/* Actions */}
        <div className="button-group">
          <button className="btn btn-primary" onClick={onRetry}>
            Retry
          </button>
          <button className="btn btn-secondary" onClick={onExit}>
            Exit
          </button>
        </div>

        {/* Support Info */}
        <p className="error-help-text">
          If you continue to experience issues, please contact support with the error code {errorCode}
        </p>
      </div>
    </div>
  );
}

export default Error;
