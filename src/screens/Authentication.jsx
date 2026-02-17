import React, { useState, useEffect } from 'react';
import '../styles/screens.css';

function Authentication({ sessionId, userInfo, isLoading, onContinue }) {
  const [authUrl, setAuthUrl] = useState(null);
  const [loadingMessage, setLoadingMessage] = useState('Verifying permissions...');

  useEffect(() => {
    if (!sessionId) {
      fetchAuthUrl();
    }
  }, [sessionId]);

  const fetchAuthUrl = async () => {
    try {
      const response = await fetch('/api/auth/url');
      const data = await response.json();
      setAuthUrl(data.url);
    } catch (error) {
      console.error('Failed to get auth URL:', error);
    }
  };

  const handleSignIn = () => {
    if (authUrl) {
      window.location.href = authUrl;
    }
  };

  if (!sessionId) {
    return (
      <div className="screen auth-screen">
        <div className="auth-container">
          <h2>Connect Your Google Account</h2>
          <p className="auth-description">
            Sign in with your Google account to authorize access to your GTM and GA4 properties.
          </p>

          <div className="permissions-box">
            <h3>Required Permissions</h3>
            <ul className="permissions-list">
              <li className="permission-item">
                <span className="permission-icon">✓</span>
                <span>Google Tag Manager - Edit access</span>
              </li>
              <li className="permission-item">
                <span className="permission-icon">✓</span>
                <span>Google Analytics 4 - Edit access</span>
              </li>
              <li className="permission-item">
                <span className="permission-icon">✓</span>
                <span>Google Ads (optional)</span>
              </li>
            </ul>
          </div>

          <button
            className="btn btn-primary btn-large auth-button"
            onClick={handleSignIn}
            disabled={!authUrl}
          >
            <span className="google-icon">G</span>
            Sign in with Google
          </button>

          <p className="auth-help-text">
            You'll be redirected to Google to sign in securely. No passwords are stored.
          </p>
        </div>
      </div>
    );
  }

  if (isLoading || !userInfo) {
    return (
      <div className="screen auth-screen">
        <div className="auth-container">
          <h2>Verifying Permissions</h2>
          <div className="loading-spinner">
            <div className="spinner"></div>
          </div>
          <p className="loading-message">{loadingMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="screen auth-screen">
      <div className="auth-container">
        <h2>Authentication Successful</h2>

        <div className="auth-success">
          {userInfo.picture && (
            <img src={userInfo.picture} alt={userInfo.name} className="user-avatar" />
          )}

          <div className="user-info">
            <p className="user-name">{userInfo.name}</p>
            <p className="user-email">{userInfo.email}</p>
          </div>
        </div>

        <div className="permissions-verified">
          <h3>Permissions Verified</h3>
          <ul className="verified-list">
            <li className="verified-item">
              <span className="checkmark">✓</span>
              <span>Google Tag Manager access</span>
            </li>
            <li className="verified-item">
              <span className="checkmark">✓</span>
              <span>Google Analytics 4 access</span>
            </li>
            <li className="verified-item">
              <span className="checkmark">✓</span>
              <span>Google Ads access</span>
            </li>
          </ul>
        </div>

        <button className="btn btn-primary btn-large" onClick={onContinue}>
          Continue to Next Step
        </button>
      </div>
    </div>
  );
}

export default Authentication;
