import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/screens.css';

function Success({ formData, setupResults, onSetupAnother, onExit, mode, featuresToAdd, editProjectId }) {
  const navigate = useNavigate();
  const isEditMode = mode === 'edit';
  const handleDownloadReport = async () => {
    try {
      const response = await fetch('/api/download/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config: setupResults, setupResults })
      });
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `silverback-setup-email-${Date.now()}.md`;
      a.click();
    } catch (error) {
      console.error('Failed to download report:', error);
    }
  };

  const eventCount = Object.values(formData.events).filter((e) => e.enabled).length;

  return (
    <div className="screen success-screen">
      <div className="success-container">
        <div className="success-header">
          <span className="success-icon">✓</span>
          <h2>{isEditMode ? 'Features Added!' : 'Setup Complete!'}</h2>
        </div>

        {/* Edit Mode Summary */}
        {isEditMode && (
          <section className="success-section">
            <h3>Added to {formData.clientName}</h3>
            <ul className="success-list">
              {featuresToAdd.includes('google_ads') && (
                <li>
                  <span className="checkmark">✓</span>
                  <span>Google Ads conversion actions created</span>
                </li>
              )}
              {featuresToAdd.includes('enhanced_conversions') && (
                <li>
                  <span className="checkmark">✓</span>
                  <span>Enhanced Conversions enabled</span>
                </li>
              )}
              {setupResults?.conversion_actions_created && setupResults.conversion_actions_created.length > 0 && (
                <li>
                  <span className="checkmark">✓</span>
                  <span>{setupResults.conversion_actions_created.length} conversion actions configured</span>
                </li>
              )}
            </ul>
          </section>
        )}

        {/* Configuration Mismatches Warning */}
        {!isEditMode && setupResults?.configuration_mismatches && setupResults.configuration_mismatches.length > 0 && (
          <section className="success-section warning-section">
            <h3>⚠️ Configuration Mismatches Detected</h3>
            <p className="warning-text">The following triggers already existed with different configurations:</p>
            <div className="mismatch-list">
              {setupResults.configuration_mismatches.map((mismatch, index) => (
                <div key={index} className="mismatch-item">
                  <div className="mismatch-trigger">
                    <strong>{mismatch.triggerName}</strong>
                  </div>
                  <div className="mismatch-details">
                    <div className="mismatch-field">{mismatch.field}</div>
                    <div className="mismatch-values">
                      <div className="existing-value">
                        <span className="label">Existing:</span>
                        <span className="value">{mismatch.existingValue}</span>
                      </div>
                      <div className="attempted-value">
                        <span className="label">Attempted:</span>
                        <span className="value">{mismatch.attemptedValue}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <p className="warning-note">
              The existing triggers were used as-is. To update them, you'll need to manually modify them in GTM.
            </p>
          </section>
        )}

        {/* What Was Created (Create Mode Only) */}
        {!isEditMode && (
          <section className="success-section">
            <h3>What Was Created</h3>
            <ul className="success-list">
              <li>
                <span className="checkmark">✓</span>
                <span>{eventCount} GTM Triggers</span>
              </li>
              <li>
                <span className="checkmark">✓</span>
                <span>{eventCount + 1} GA4 Event Tags</span>
              </li>
              <li>
                <span className="checkmark">✓</span>
                <span>GTM Version 2 published to live</span>
              </li>
              {setupResults?.key_events_marked && setupResults.key_events_marked.length > 0 && (
                <li>
                  <span className="checkmark">✓</span>
                  <span>
                    {setupResults.key_events_marked.filter(e => e.success).length} Key Events marked in GA4
                  </span>
                </li>
              )}
              <li>
                <span className="checkmark">✓</span>
                <span>JSON configuration file generated</span>
              </li>
            </ul>
          </section>
        )}

        {/* Results Summary */}
        <section className="success-section">
          <h3>Results Summary</h3>
          <div className="results-box">
            <div className="result-item">
              <span className="label">Client:</span>
              <span className="value">{formData.clientName}</span>
            </div>
            <div className="result-item">
              <span className="label">Setup Time:</span>
              <span className="value">~12 seconds</span>
            </div>
            <div className="result-item">
              <span className="label">Events Created:</span>
              <span className="value">{eventCount}</span>
            </div>
            <div className="result-item">
              <span className="label">GTM Version:</span>
              <span className="value">2</span>
            </div>
            {setupResults?.key_events_marked && setupResults.key_events_marked.length > 0 && (
              <div className="result-item">
                <span className="label">Key Events Marked:</span>
                <span className="value">
                  {setupResults.key_events_marked.map(e => e.eventName).join(', ')}
                </span>
              </div>
            )}
            <div className="result-item">
              <span className="label">Status:</span>
              <span className="value status-success">✓ All systems go!</span>
            </div>
          </div>
        </section>

        {/* Next Steps */}
        <section className="success-section">
          <h3>Next Steps</h3>
          <ol className="next-steps-list">
            <li>
              <strong>Wait 24-48 hours</strong> for events to appear in GA4
              <br />
              <small>Go to: GA4 Admin &gt; Events &gt; Recent events</small>
            </li>
            <li>
              <strong>Verify Key Events</strong> in GA4 (automatically marked)
              <br />
              <small>In GA4 Admin: Events &gt; Conversions (Key Events)</small>
            </li>
            <li>
              <strong>Import conversions to Google Ads</strong> (check after 24h)
              <br />
              <small>In Google Ads: Tools &gt; Conversions &gt; Import from GA4</small>
            </li>
            <li>
              <strong>Monitor conversion data</strong> in both GA4 and Google Ads
              <br />
              <small>Track performance and adjust as needed</small>
            </li>
          </ol>
        </section>

        {/* Email Template Download */}
        <section className="success-section">
          <h3>Share with Client</h3>
          <div className="download-buttons">
            <button className="btn btn-download" onClick={handleDownloadReport}>
              📧 Download Email Template
            </button>
          </div>
          <p className="download-note">Send this email template to your client with setup details and next steps.</p>
        </section>

        {/* Actions */}
        <div className="button-group">
          {isEditMode ? (
            <>
              <button className="btn btn-primary" onClick={() => navigate(`/project/${editProjectId}`)}>
                View Updated Project
              </button>
              <button className="btn btn-secondary" onClick={() => navigate('/')}>
                Back to Dashboard
              </button>
            </>
          ) : (
            <>
              <button className="btn btn-primary" onClick={() => navigate('/wizard')}>
                Setup Another Client
              </button>
              <button className="btn btn-secondary" onClick={() => navigate('/')}>
                Exit to Dashboard
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default Success;
