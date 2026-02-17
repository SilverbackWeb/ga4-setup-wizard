import React, { useState } from 'react';
import { validateClientInfo } from '../utils/validation';
import '../styles/screens.css';

function ClientInformation({ formData, updateFormData, onPrevious, onNext, onCancel }) {
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    updateFormData(name, value);
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleNext = () => {
    const validation = validateClientInfo(formData);
    if (validation.valid) {
      onNext();
    } else {
      setErrors(validation.errors);
    }
  };

  const loadTestData = () => {
    const testData = {
      clientName: 'Wentzville Deck Builders',
      website: 'wentzvilledeckbuilders.com',
      websiteUrl: 'https://wentzvilledeckbuilders.com',
      gtmAccountId: '6333547159',
      gtmContainerId: 'GTM-WLJR8K96',
      ga4PropertyId: '517329255',
      ga4MeasurementId: 'G-QY1KP9FWFC',
      googleAdsAccountId: ''
    };

    Object.keys(testData).forEach(key => {
      updateFormData(key, testData[key]);
    });
    setErrors({});
  };

  return (
    <div className="screen client-info-screen">
      <div className="form-container">
        <h2>Client Information</h2>
        <p className="form-description">
          Enter your client details and Google Tag Manager/Analytics configuration
        </p>

        <form className="form">
          <fieldset>
            <legend>Client Info</legend>

            <div className="form-group">
              <label htmlFor="clientName">Client Name *</label>
              <input
                type="text"
                id="clientName"
                name="clientName"
                value={formData.clientName}
                onChange={handleChange}
                placeholder="e.g., Siding Express"
                className={errors.clientName ? 'input-error' : ''}
              />
              {errors.clientName && <span className="error-text">{errors.clientName}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="website">Website Domain *</label>
              <input
                type="text"
                id="website"
                name="website"
                value={formData.website}
                onChange={handleChange}
                placeholder="e.g., sidingexpress.com"
                className={errors.website ? 'input-error' : ''}
              />
              {errors.website && <span className="error-text">{errors.website}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="websiteUrl">Website URL (for testing) *</label>
              <input
                type="url"
                id="websiteUrl"
                name="websiteUrl"
                value={formData.websiteUrl}
                onChange={handleChange}
                placeholder="e.g., https://www.sidingexpress.com"
                className={errors.websiteUrl ? 'input-error' : ''}
              />
              {errors.websiteUrl && <span className="error-text">{errors.websiteUrl}</span>}
            </div>
          </fieldset>

          <fieldset>
            <legend>GTM & GA4 Info</legend>

            <div className="form-group">
              <label htmlFor="gtmAccountId">GTM Account ID *</label>
              <input
                type="text"
                id="gtmAccountId"
                name="gtmAccountId"
                value={formData.gtmAccountId}
                onChange={handleChange}
                placeholder="e.g., 6330173520"
                className={errors.gtmAccountId ? 'input-error' : ''}
              />
              {errors.gtmAccountId && <span className="error-text">{errors.gtmAccountId}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="gtmContainerId">GTM Container ID *</label>
              <input
                type="text"
                id="gtmContainerId"
                name="gtmContainerId"
                value={formData.gtmContainerId}
                onChange={handleChange}
                placeholder="e.g., GTM-XXXXXX"
                className={errors.gtmContainerId ? 'input-error' : ''}
              />
              {errors.gtmContainerId && <span className="error-text">{errors.gtmContainerId}</span>}
              <small>Format: GTM-XXXXXX</small>
            </div>

            <div className="form-group">
              <label htmlFor="ga4PropertyId">GA4 Property ID *</label>
              <input
                type="text"
                id="ga4PropertyId"
                name="ga4PropertyId"
                value={formData.ga4PropertyId}
                onChange={handleChange}
                placeholder="e.g., 517329255"
                className={errors.ga4PropertyId ? 'input-error' : ''}
              />
              {errors.ga4PropertyId && <span className="error-text">{errors.ga4PropertyId}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="ga4MeasurementId">GA4 Measurement ID *</label>
              <input
                type="text"
                id="ga4MeasurementId"
                name="ga4MeasurementId"
                value={formData.ga4MeasurementId}
                onChange={handleChange}
                placeholder="e.g., G-XXXXXXXXXX"
                className={errors.ga4MeasurementId ? 'input-error' : ''}
              />
              {errors.ga4MeasurementId && <span className="error-text">{errors.ga4MeasurementId}</span>}
              <small>Format: G-XXXXXXXXXX</small>
            </div>
          </fieldset>

          <fieldset>
            <legend>Google Ads (Optional)</legend>

            <div className="form-group">
              <label htmlFor="googleAdsAccountId">Google Ads Account ID</label>
              <input
                type="text"
                id="googleAdsAccountId"
                name="googleAdsAccountId"
                value={formData.googleAdsAccountId}
                onChange={handleChange}
                placeholder="e.g., XXX-XXX-XXXX"
                className={errors.googleAdsAccountId ? 'input-error' : ''}
              />
              {errors.googleAdsAccountId && <span className="error-text">{errors.googleAdsAccountId}</span>}
              <small>Format: XXX-XXX-XXXX (optional)</small>
            </div>
          </fieldset>
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

export default ClientInformation;
