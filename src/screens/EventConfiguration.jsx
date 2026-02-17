import React, { useState } from 'react';
import { validateEventConfig } from '../utils/validation';
import '../styles/screens.css';

function EventConfiguration({ formData, updateEvent, onPrevious, onNext, onCancel }) {
  const [errors, setErrors] = useState({});

  const handleEventToggle = (eventType) => {
    updateEvent(eventType, 'enabled', !formData.events[eventType].enabled);
  };

  const handleEventChange = (eventType, field, value) => {
    updateEvent(eventType, field, value);
    // Clear error for this field
    if (errors[`${eventType}_${field}`]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[`${eventType}_${field}`];
        return newErrors;
      });
    }
  };

  const handleConversionChange = (eventType) => {
    updateEvent(eventType, 'conversion', !formData.events[eventType].conversion);
  };

  const handleNext = () => {
    const validation = validateEventConfig(formData);
    if (validation.valid) {
      onNext();
    } else {
      setErrors(validation.errors);
    }
  };

  const loadTestData = () => {
    updateEvent('phoneCall', 'enabled', true);
    updateEvent('phoneCall', 'conversion', true);

    updateEvent('thankYouPage', 'enabled', true);
    updateEvent('thankYouPage', 'urlPath', '/thank-you');
    updateEvent('thankYouPage', 'conversion', true);

    updateEvent('ctaClick', 'enabled', true);
    updateEvent('ctaClick', 'buttonTexts', 'get discount, get started, get an estimate, send a message, get a quote');
    updateEvent('ctaClick', 'conversion', false);

    setErrors({});
  };

  return (
    <div className="screen event-config-screen">
      <div className="form-container">
        <h2>Event Configuration</h2>
        <p className="form-description">
          Select which events you want to track
        </p>

        <form className="form">
          {/* Phone Calls */}
          <fieldset className="event-fieldset">
            <legend className="event-legend">
              <input
                type="checkbox"
                id="phoneCall"
                checked={formData.events.phoneCall.enabled}
                onChange={() => handleEventToggle('phoneCall')}
              />
              <label htmlFor="phoneCall">Track Phone Calls</label>
            </legend>

            {formData.events.phoneCall.enabled && (
              <div className="event-fields">
                <p style={{ color: '#8D909B', marginBottom: '16px', fontSize: '14px' }}>
                  Automatically tracks all phone number clicks (tel: links) including dynamic call tracking numbers.
                </p>

                <div className="form-group">
                  <label>Track as conversion in Google Ads?</label>
                  <div className="radio-group">
                    <label className="radio-label">
                      <input
                        type="radio"
                        checked={formData.events.phoneCall.conversion}
                        onChange={() => handleConversionChange('phoneCall')}
                      />
                      Yes
                    </label>
                    <label className="radio-label">
                      <input
                        type="radio"
                        checked={!formData.events.phoneCall.conversion}
                        onChange={() => handleConversionChange('phoneCall')}
                      />
                      No
                    </label>
                  </div>
                </div>
              </div>
            )}
          </fieldset>

          {/* Form Submissions */}
          <fieldset className="event-fieldset">
            <legend className="event-legend">
              <input
                type="checkbox"
                id="thankYouPage"
                checked={formData.events.thankYouPage.enabled}
                onChange={() => handleEventToggle('thankYouPage')}
              />
              <label htmlFor="thankYouPage">Track Form Submissions (Thank You Page)</label>
            </legend>

            {formData.events.thankYouPage.enabled && (
              <div className="event-fields">
                <div className="form-group">
                  <label htmlFor="thankYouPageUrl">Thank You Page URL Path *</label>
                  <input
                    type="text"
                    id="thankYouPageUrl"
                    value={formData.events.thankYouPage.urlPath}
                    onChange={(e) =>
                      handleEventChange('thankYouPage', 'urlPath', e.target.value)
                    }
                    placeholder="e.g., /thank-you/ or /success"
                    className={errors.thankYouPageUrl ? 'input-error' : ''}
                  />
                  {errors.thankYouPageUrl && (
                    <span className="error-text">{errors.thankYouPageUrl}</span>
                  )}
                  <small>The URL path that appears after form submission</small>
                </div>

                <div className="form-group">
                  <label>Track as conversion in Google Ads?</label>
                  <div className="radio-group">
                    <label className="radio-label">
                      <input
                        type="radio"
                        checked={formData.events.thankYouPage.conversion}
                        onChange={() => handleConversionChange('thankYouPage')}
                      />
                      Yes
                    </label>
                    <label className="radio-label">
                      <input
                        type="radio"
                        checked={!formData.events.thankYouPage.conversion}
                        onChange={() => handleConversionChange('thankYouPage')}
                      />
                      No
                    </label>
                  </div>
                </div>
              </div>
            )}
          </fieldset>

          {/* CTA Clicks */}
          <fieldset className="event-fieldset">
            <legend className="event-legend">
              <input
                type="checkbox"
                id="ctaClick"
                checked={formData.events.ctaClick.enabled}
                onChange={() => handleEventToggle('ctaClick')}
              />
              <label htmlFor="ctaClick">Track CTA Button Clicks</label>
            </legend>

            {formData.events.ctaClick.enabled && (
              <div className="event-fields">
                <div className="form-group">
                  <label htmlFor="buttonTexts">CTA Button Text (comma-separated) *</label>
                  <input
                    type="text"
                    id="buttonTexts"
                    value={formData.events.ctaClick.buttonTexts}
                    onChange={(e) =>
                      handleEventChange('ctaClick', 'buttonTexts', e.target.value)
                    }
                    placeholder="e.g., contact us,get a quote,book a call"
                    className={errors.ctaButtonTexts ? 'input-error' : ''}
                  />
                  {errors.ctaButtonTexts && (
                    <span className="error-text">{errors.ctaButtonTexts}</span>
                  )}
                  <small>The exact button text to match (separated by commas)</small>
                </div>

                <div className="form-group">
                  <label>Track as conversion in Google Ads?</label>
                  <div className="radio-group">
                    <label className="radio-label">
                      <input
                        type="radio"
                        checked={formData.events.ctaClick.conversion}
                        onChange={() => handleConversionChange('ctaClick')}
                      />
                      Yes
                    </label>
                    <label className="radio-label">
                      <input
                        type="radio"
                        checked={!formData.events.ctaClick.conversion}
                        onChange={() => handleConversionChange('ctaClick')}
                      />
                      No
                    </label>
                  </div>
                  <small>Note: CTA clicks are secondary metrics by default</small>
                </div>
              </div>
            )}
          </fieldset>

          {errors.events && (
            <div className="form-error">
              <strong>Error:</strong> {errors.events}
            </div>
          )}
        </form>

        <div className="button-group">
          <button className="btn btn-secondary" onClick={onPrevious}>
            Previous
          </button>
          <button className="btn btn-primary" onClick={handleNext}>
            Next
          </button>
          <button className="btn btn-secondary" onClick={loadTestData} style={{ marginLeft: 'auto', marginRight: '0.5rem' }}>
            📋 Load Test Data
          </button>
          <button className="btn btn-ghost" onClick={onCancel}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default EventConfiguration;
