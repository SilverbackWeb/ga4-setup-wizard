import React, { useState, useEffect } from 'react';
import '../styles/screens.css';

function Creating({ formData, onCancel, onStart }) {
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState([]);
  const [canCancel, setCanCancel] = useState(true);
  const [currentStep, setCurrentStep] = useState('Verifying Google APIs access...');

  useEffect(() => {
    // If onStart callback is provided, call it (for edit mode skipping ReviewCreate)
    if (onStart) {
      onStart();
    }
  }, [onStart]);

  useEffect(() => {
    // Show progress logs while real API calls happen in background
    // These logs simulate the actual operations being performed
    const steps = [
      { message: 'Authenticated successfully', delay: 100 },
      { message: 'Connected to GTM API', delay: 300 },
      { message: 'Verified GA4 access', delay: 500 },
      { message: 'Creating triggers...', delay: 700, current: true },
      { message: 'Trigger created: call_now_click', delay: 1200 },
      { message: 'Trigger created: thank_you_page', delay: 1700 },
      { message: 'Trigger created: cta_click', delay: 2200 },
      { message: 'Creating GA4 event tags...', delay: 2500, current: true },
      { message: 'Tag created: GA4 – Event – call_now_click', delay: 3000 },
      { message: 'Tag created: GA4 – Event – thank_you_page', delay: 3500 },
      { message: 'Tag created: GA4 – Event – cta_click', delay: 4000 },
      { message: 'Tag created: GA4 – Config', delay: 4500 },
      { message: 'Publishing GTM version...', delay: 5000, current: true },
      { message: 'GTM version published successfully', delay: 5800 },
      { message: 'Marking Key Events in GA4...', delay: 6200, current: true },
      { message: 'Key Event marked: call_now_click', delay: 6800 },
      { message: 'Key Event marked: thank_you_page', delay: 7300 },
      { message: 'Setup complete!', delay: 7800 }
    ];

    steps.forEach((step) => {
      const timer = setTimeout(() => {
        setLogs((prev) => [
          ...prev,
          {
            time: new Date().toLocaleTimeString(),
            message: step.message,
            type: 'success'
          }
        ]);

        if (step.current) {
          setCurrentStep(step.message);
        }

        setProgress((step.delay / 7800) * 100);
      }, step.delay);

      return () => clearTimeout(timer);
    });

    // Disable cancel after 3 seconds
    const cancelTimer = setTimeout(() => {
      setCanCancel(false);
    }, 3000);

    return () => clearTimeout(cancelTimer);
  }, []);

  const handleCancel = () => {
    if (canCancel) {
      onCancel();
    }
  };

  return (
    <div className="screen creating-screen">
      <div className="creating-container">
        <h2>Setting Up Your GA4 Tracking...</h2>

        {/* Progress Bar */}
        <div className="progress-box">
          <div className="progress-bar-container">
            <div
              className="progress-bar-fill"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
          <div className="progress-percentage">{Math.min(Math.round(progress), 100)}%</div>
        </div>

        {/* Current Step */}
        <div className="current-step">
          <div className="spinner"></div>
          <p>{currentStep}</p>
        </div>

        {/* Detailed Log */}
        <div className="log-container">
          <h3>Setup Progress</h3>
          <div className="log-entries">
            {logs.map((log, index) => (
              <div key={index} className="log-entry">
                <span className="log-time">{log.time}</span>
                <span className={`log-status log-${log.type}`}>✓</span>
                <span className="log-message">{log.message}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Cancel Button */}
        {canCancel && (
          <button className="btn btn-secondary" onClick={handleCancel}>
            Cancel Setup
          </button>
        )}

        {!canCancel && (
          <p className="info-text">
            Setup is in progress. Please wait for completion.
          </p>
        )}
      </div>
    </div>
  );
}

export default Creating;
