import React, { useState, useEffect } from 'react';
import '../styles/screens.css';

function Testing({ sessionId, formData, triggerIds, tagIds, isLoading, onContinue, onBack }) {
  const [testResults, setTestResults] = useState(null);
  const [testChecklist, setTestChecklist] = useState({
    phoneCall: false,
    thankYouPage: false,
    ctaClick: false
  });
  const [previewUrl, setPreviewUrl] = useState(null);
  const [validationComplete, setValidationComplete] = useState(false);
  const [validationError, setValidationError] = useState(null);

  useEffect(() => {
    if (!validationComplete) {
      validateSetup();
    }
  }, [validationComplete]);

  const validateSetup = async () => {
    try {
      const response = await fetch('/api/gtm/validate-setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          accountId: formData.gtmAccountId,
          containerId: formData.gtmContainerId,
          triggerIds: triggerIds || {},
          tagIds: tagIds || {}
        })
      });

      const data = await response.json();

      if (response.ok) {
        setTestResults(data);
        setPreviewUrl(data.previewUrl);
        setValidationComplete(true);
      } else {
        setValidationError(data.message || 'Failed to validate setup');
        setValidationComplete(true);
      }
    } catch (error) {
      console.error('Validation error:', error);
      setValidationError(error.message);
      setValidationComplete(true);
    }
  };

  const handleChecklist = (eventType) => {
    setTestChecklist(prev => ({
      ...prev,
      [eventType]: !prev[eventType]
    }));
  };

  const enabledEvents = Object.entries(formData.events)
    .filter(([_, config]) => config.enabled)
    .map(([type, _]) => type);

  const allChecklistsComplete = enabledEvents.every(eventType => testChecklist[eventType]);

  if (isLoading || !validationComplete) {
    return (
      <div className="screen testing-screen">
        <div className="testing-container">
          <div className="testing-header">
            <h2>Validating Setup...</h2>
            <p>Checking triggers and tags</p>
          </div>
          <div className="loading-spinner">
            <div className="spinner"></div>
          </div>
        </div>
      </div>
    );
  }

  if (validationError) {
    return (
      <div className="screen testing-screen">
        <div className="testing-container">
          <div className="testing-header">
            <h2>⚠️ Validation Error</h2>
            <p>Unable to validate your setup</p>
          </div>
          <div className="error-message">
            {validationError}
          </div>
          <p style={{ color: '#8D909B', marginBottom: '20px' }}>
            Your setup may still be functional. You can continue and test manually, or go back to review your configuration.
          </p>
          <div className="button-group">
            <button className="btn btn-secondary" onClick={onBack}>
              Back
            </button>
            <button className="btn btn-primary" onClick={() => onContinue()}>
              Continue Anyway
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="screen testing-screen">
      <div className="testing-container">
        <div className="testing-header">
          <h2>Verify Your Setup</h2>
          <p>Test that all triggers and tags are working correctly</p>
        </div>

        {/* Validation Summary */}
        {testResults && (
          <div className="validation-summary">
            <h3>✓ Setup Validation Complete</h3>
            <div className="validation-item">
              <span className="label">Triggers Detected</span>
              <span className="count">{testResults.triggersFound}</span>
            </div>
            <div className="validation-item">
              <span className="label">Tags Detected</span>
              <span className="count">{testResults.tagsFound}</span>
            </div>
            <div className="validation-item">
              <span className="label">Tag-Trigger Associations</span>
              <span className="count">{testResults.associationsFound}</span>
            </div>
          </div>
        )}

        {/* Testing Instructions */}
        <div className="testing-section">
          <h3>How to Test Your Setup</h3>

          <div className="testing-instructions">
            <h4>Step 1: Open GTM Preview Mode</h4>
            {previewUrl ? (
              <div className="preview-url-box">
                <a href={previewUrl} target="_blank" rel="noopener noreferrer">
                  Click here to open GTM Preview →
                </a>
              </div>
            ) : (
              <p>Preview URL will be generated after validation</p>
            )}
            <p style={{ fontSize: '13px', color: '#8D909B', marginTop: '8px' }}>
              This opens Google Tag Manager in preview/debug mode where you can see real-time firing events.
            </p>
          </div>

          <div className="testing-instructions">
            <h4>Step 2: Test Each Event Type</h4>
            <p style={{ marginBottom: '16px' }}>Visit your website and test each enabled event. Confirm in the GTM Preview console that you see the expected event fire:</p>

            <ul className="test-checklist">
              {formData.events.phoneCall.enabled && (
                <li className="checklist-item">
                  <input
                    type="checkbox"
                    checked={testChecklist.phoneCall}
                    onChange={() => handleChecklist('phoneCall')}
                  />
                  <div className="checklist-item-content">
                    <div className="checklist-item-title">📞 Phone Call Trigger</div>
                    <p className="checklist-item-description">
                      Click phone number or call button. In GTM Preview, look for: <code>call_now_click</code>
                    </p>
                  </div>
                </li>
              )}

              {formData.events.thankYouPage.enabled && (
                <li className="checklist-item">
                  <input
                    type="checkbox"
                    checked={testChecklist.thankYouPage}
                    onChange={() => handleChecklist('thankYouPage')}
                  />
                  <div className="checklist-item-content">
                    <div className="checklist-item-title">📄 Thank You Page Trigger</div>
                    <p className="checklist-item-description">
                      Complete an action leading to: <code>{formData.events.thankYouPage.urlPath}</code>. In GTM Preview, look for: <code>thank_you_page</code>
                    </p>
                  </div>
                </li>
              )}

              {formData.events.ctaClick.enabled && (
                <li className="checklist-item">
                  <input
                    type="checkbox"
                    checked={testChecklist.ctaClick}
                    onChange={() => handleChecklist('ctaClick')}
                  />
                  <div className="checklist-item-content">
                    <div className="checklist-item-title">🔘 CTA Button Trigger</div>
                    <p className="checklist-item-description">
                      Click buttons with text containing: <code>{formData.events.ctaClick.buttonTexts}</code>. In GTM Preview, look for: <code>cta_click</code>
                    </p>
                  </div>
                </li>
              )}
            </ul>
          </div>

          <div className="testing-instructions">
            <h4>Step 3: Verify GA4 Tag Firing</h4>
            <p>In the GTM Preview console, confirm that after each trigger fires, a GA4 tag also fires and sends the event to your GA4 property.</p>
          </div>

          <div className="skip-testing-note">
            ⏱️ <strong>Timeline:</strong> Events may take 24-48 hours to appear in GA4. This testing verifies GTM is set up correctly; GA4 data population happens in the background.
          </div>
        </div>

        {/* Action Buttons */}
        <div className="button-group">
          <button className="btn btn-secondary" onClick={onBack}>
            Back
          </button>
          <button
            className="btn btn-primary"
            onClick={() => onContinue()}
            disabled={!allChecklistsComplete}
          >
            {allChecklistsComplete ? '✓ All Tests Confirmed' : 'Complete All Tests to Continue'}
          </button>
          <button
            className="btn-skip-testing"
            onClick={() => onContinue()}
          >
            Skip Testing
          </button>
        </div>
      </div>
    </div>
  );
}

export default Testing;
