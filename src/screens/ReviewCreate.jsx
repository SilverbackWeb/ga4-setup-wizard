import React, { useState } from 'react';
import '../styles/screens.css';

function ReviewCreate({ formData, sessionId, mode = 'create', editProject = null, featuresToAdd = [], onPrevious, onCreateSetup, onCancel, onEdit }) {
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);
  const [existingTriggers, setExistingTriggers] = useState([]);
  const [isCheckingDuplicates, setIsCheckingDuplicates] = useState(false);

  const isEditMode = mode === 'edit' && editProject;
  const isAddingGoogleAds = isEditMode && featuresToAdd.includes('google_ads');

  const getEventLabel = (eventType) => {
    const labels = {
      phoneCall: 'call_now_click',
      thankYouPage: 'thank_you_page',
      ctaClick: 'cta_click'
    };
    return labels[eventType];
  };

  const getEventDescription = (eventType) => {
    const descriptions = {
      phoneCall: `Click URL starts with "tel:" (tracks all phone links)`,
      thankYouPage: `Page URL contains "${formData.events.thankYouPage.urlPath}"`,
      ctaClick: `Click Text contains multiple values`
    };
    return descriptions[eventType];
  };

  const getConversionBadge = (conversion) => {
    return conversion ? (
      <span className="badge badge-conversion">Conversion: YES</span>
    ) : (
      <span className="badge badge-metric">Conversion: NO</span>
    );
  };

  const handleCreateClick = async () => {
    // In edit mode, skip duplicate checking since GTM triggers already exist
    if (isEditMode) {
      onCreateSetup();
      return;
    }

    setIsCheckingDuplicates(true);

    // Get trigger names we're about to create
    const triggerNames = [];
    const eventNameMapping = {
      phoneCall: 'call_now_click',
      thankYouPage: 'thank_you_page',
      ctaClick: 'cta_click'
    };

    for (const [eventType, eventConfig] of Object.entries(formData.events)) {
      if (eventConfig.enabled) {
        triggerNames.push(eventNameMapping[eventType]);
      }
    }

    try {
      // Check for existing triggers
      const response = await fetch('/api/gtm/check-triggers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          accountId: formData.gtmAccountId,
          containerId: formData.gtmContainerId,
          triggerNames
        })
      });

      const result = await response.json();

      if (result.hasDuplicates) {
        setExistingTriggers(result.existingTriggers);
        setShowDuplicateWarning(true);
      } else {
        // No duplicates, proceed with setup
        onCreateSetup();
      }
    } catch (error) {
      console.error('Failed to check for duplicates:', error);
      // On error, proceed anyway (graceful degradation)
      onCreateSetup();
    } finally {
      setIsCheckingDuplicates(false);
    }
  };

  const handleContinueAnyway = () => {
    setShowDuplicateWarning(false);
    onCreateSetup();
  };

  const handleCancelSetup = () => {
    setShowDuplicateWarning(false);
  };

  return (
    <div className="screen review-screen">
      <div className="review-container">
        <h2>{isEditMode ? 'Review Features to Add' : 'Review Your Configuration'}</h2>
        {isAddingGoogleAds && (
          <p className="subtitle">You're about to add Google Ads conversion tracking to {formData.clientName}</p>
        )}

        {/* Client Summary */}
        <section className="review-section">
          <h3>Client Summary</h3>
          <div className="summary-box">
            <div className="summary-item">
              <span className="label">Client:</span>
              <span className="value">{formData.clientName}</span>
            </div>
            <div className="summary-item">
              <span className="label">Domain:</span>
              <span className="value">{formData.website}</span>
            </div>
            <div className="summary-item">
              <span className="label">GTM Container:</span>
              <span className="value">{formData.gtmContainerId}</span>
            </div>
            <div className="summary-item">
              <span className="label">GA4 Property:</span>
              <span className="value">{formData.ga4PropertyId}</span>
            </div>
            <div className="summary-item">
              <span className="label">Measurement ID:</span>
              <span className="value">{formData.ga4MeasurementId}</span>
            </div>
            {formData.googleAdsAccountId && (
              <div className="summary-item">
                <span className="label">Google Ads Account:</span>
                <span className="value">{formData.googleAdsAccountId}</span>
              </div>
            )}
          </div>
        </section>

        {/* Events to Create */}
        <section className="review-section">
          <h3>Events to Create</h3>
          <div className="events-list">
            {formData.events.phoneCall.enabled && (
              <div className="event-card">
                <div className="event-header">
                  <span className="event-icon">✓</span>
                  <span className="event-name">{getEventLabel('phoneCall')}</span>
                  {getConversionBadge(formData.events.phoneCall.conversion)}
                </div>
                <div className="event-details">
                  <p>
                    <strong>Trigger:</strong> {getEventDescription('phoneCall')}
                  </p>
                  <p>
                    <strong>Event Name:</strong> {getEventLabel('phoneCall')}
                  </p>
                  <p>
                    <strong>GA4 Key Event:</strong>{' '}
                    {formData.events.phoneCall.conversion ? 'YES' : 'NO'}
                  </p>
                  <p>
                    <strong>Google Ads Conversion:</strong>{' '}
                    {formData.events.phoneCall.conversion ? 'YES' : 'NO'}
                  </p>
                </div>
              </div>
            )}

            {formData.events.thankYouPage.enabled && (
              <div className="event-card">
                <div className="event-header">
                  <span className="event-icon">✓</span>
                  <span className="event-name">{getEventLabel('thankYouPage')}</span>
                  {getConversionBadge(formData.events.thankYouPage.conversion)}
                </div>
                <div className="event-details">
                  <p>
                    <strong>Trigger:</strong> {getEventDescription('thankYouPage')}
                  </p>
                  <p>
                    <strong>Event Name:</strong> {getEventLabel('thankYouPage')}
                  </p>
                  <p>
                    <strong>GA4 Key Event:</strong>{' '}
                    {formData.events.thankYouPage.conversion ? 'YES' : 'NO'}
                  </p>
                  <p>
                    <strong>Google Ads Conversion:</strong>{' '}
                    {formData.events.thankYouPage.conversion ? 'YES' : 'NO'}
                  </p>
                </div>
              </div>
            )}

            {formData.events.ctaClick.enabled && (
              <div className="event-card">
                <div className="event-header">
                  <span className="event-icon">✓</span>
                  <span className="event-name">{getEventLabel('ctaClick')}</span>
                  {getConversionBadge(formData.events.ctaClick.conversion)}
                </div>
                <div className="event-details">
                  <p>
                    <strong>Trigger:</strong> Click Text contains multiple values
                  </p>
                  <p>
                    <strong>Event Name:</strong> {getEventLabel('ctaClick')}
                  </p>
                  <p>
                    <strong>GA4 Key Event:</strong>{' '}
                    {formData.events.ctaClick.conversion ? 'YES' : 'NO'}
                  </p>
                  <p>
                    <strong>Google Ads Conversion:</strong>{' '}
                    {formData.events.ctaClick.conversion ? 'YES' : 'NO'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* GTM Changes - Only show in create mode */}
        {!isEditMode && (
          <section className="review-section">
            <h3>GTM Changes</h3>
            <div className="gtm-changes">
              <p>
                <strong>Triggers to create:</strong>{' '}
                {Object.values(formData.events).filter((e) => e.enabled).length}
              </p>
              <p>
                <strong>Tags to create:</strong>{' '}
                {Object.values(formData.events).filter((e) => e.enabled).length + 1}
              </p>
              <p>
                <strong>GTM version to publish:</strong> 1
              </p>
            </div>
          </section>
        )}

        {/* Google Ads Features - Show in edit mode if adding Google Ads */}
        {isAddingGoogleAds && (
          <section className="review-section">
            <h3>Google Ads Configuration</h3>
            <div className="google-ads-changes">
              <p>
                <strong>Google Ads Account:</strong> {formData.googleAdsAccountId}
              </p>
              <p>
                <strong>Conversion actions to create:</strong>{' '}
                {Object.values(formData.events).filter((e) => e.enabled).length}
              </p>
            </div>
          </section>
        )}

        {/* Timeline */}
        <section className="review-section">
          <h3>Timeline</h3>
          <div className="timeline">
            <div className="timeline-item">
              <span className="icon">⚡</span>
              <div className="content">
                <strong>Setup:</strong> ~2 minutes (automated)
              </div>
            </div>
            <div className="timeline-item">
              <span className="icon">⏳</span>
              <div className="content">
                <strong>GA4 Data:</strong> 24-48 hours
              </div>
            </div>
            <div className="timeline-item">
              <span className="icon">⏳</span>
              <div className="content">
                <strong>Ads Conversions:</strong> 24-48 hours after GA4 data appears
              </div>
            </div>
          </div>
        </section>

        <div className="button-group">
          <button className="btn btn-secondary" onClick={onPrevious}>
            Previous
          </button>
          <button
            className="btn btn-primary btn-large"
            onClick={handleCreateClick}
            disabled={isCheckingDuplicates}
          >
            {isCheckingDuplicates ? 'Checking...' : isEditMode ? 'Add Features' : 'Create Setup'}
          </button>
          <button className="btn btn-tertiary" onClick={onEdit}>
            Edit
          </button>
          <button className="btn btn-ghost" onClick={onCancel}>
            Cancel
          </button>
        </div>

        {/* Duplicate Warning Modal */}
        {showDuplicateWarning && (
          <div className="modal-overlay">
            <div className="modal duplicate-warning-modal">
              <div className="modal-header">
                <span className="warning-icon">⚠️</span>
                <h3>Duplicate Setup Detected</h3>
              </div>

              <div className="modal-body">
                <p>
                  The following triggers already exist in this GTM container:
                </p>
                <ul className="existing-triggers-list">
                  {existingTriggers.map((trigger, index) => (
                    <li key={index}>
                      <span className="trigger-name">{trigger.name}</span>
                      <span className="trigger-id">ID: {trigger.id}</span>
                    </li>
                  ))}
                </ul>
                <p className="warning-text">
                  <strong>If you continue</strong>, new triggers with the same names will be created,
                  which may cause duplicate tracking in Google Analytics.
                </p>
                <p className="recommendation">
                  <strong>Recommendation:</strong> Cancel and check your GTM container.
                  If you previously ran this wizard, you may not need to run it again.
                </p>
              </div>

              <div className="modal-actions">
                <button
                  className="btn btn-secondary"
                  onClick={handleCancelSetup}
                >
                  Cancel Setup
                </button>
                <button
                  className="btn btn-warning"
                  onClick={handleContinueAnyway}
                >
                  Continue Anyway
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ReviewCreate;
