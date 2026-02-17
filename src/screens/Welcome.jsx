import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/screens.css';

function Welcome({ onGetStarted }) {
  const navigate = useNavigate();
  return (
    <div className="screen welcome-screen">
      <div className="welcome-content">
        <div className="welcome-header">
          <h1>GA4 Setup Wizard</h1>
          <p className="subtitle">Automate custom event tracking in minutes</p>
        </div>

        <div className="welcome-description">
          <p>
            This wizard automates the complete setup of custom GA4 event tracking without requiring
            any manual work in Google Tag Manager or Google Analytics.
          </p>

          <div className="requirements-box">
            <h3>What You Need</h3>
            <ul className="requirements-list">
              <li>Google account with GTM access</li>
              <li>Google account with GA4 access</li>
              <li>Google Cloud Console credentials (we'll guide you)</li>
            </ul>
          </div>

          <div className="timeline-box">
            <div className="timeline-item">
              <span className="timeline-icon">⚡</span>
              <div>
                <h4>Setup</h4>
                <p>~2 minutes to complete</p>
              </div>
            </div>
            <div className="timeline-item">
              <span className="timeline-icon">⏳</span>
              <div>
                <h4>Data Collection</h4>
                <p>24-48 hours for events to appear</p>
              </div>
            </div>
          </div>

          <div className="what-we-do-box">
            <h3>What We'll Do</h3>
            <ul className="what-we-do-list">
              <li>✓ Create custom GTM triggers automatically</li>
              <li>✓ Create GA4 event tags automatically</li>
              <li>✓ Publish your GTM configuration live</li>
              <li>✓ Generate detailed documentation</li>
              <li>✓ Provide next steps guide</li>
            </ul>
          </div>
        </div>

        <div className="button-group">
          <button className="btn btn-primary btn-lg" onClick={onGetStarted}>
            Get Started
          </button>
          <button className="btn btn-secondary btn-lg" onClick={() => navigate('/')}>
            View Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}

export default Welcome;
