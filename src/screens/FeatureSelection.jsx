import React, { useState } from 'react';
import '../styles/screens.css';

function FeatureSelection({ project, onContinue, onBack }) {
  const [selectedFeatures, setSelectedFeatures] = useState({
    google_ads: false,
    enhanced_conversions: false
  });

  const availableFeatures = [
    {
      key: 'google_ads',
      label: 'Google Ads Conversion Tracking',
      description: 'Create conversion actions in Google Ads for your events',
      disabled: project.features_configured?.google_ads,
      icon: '📊'
    },
    {
      key: 'enhanced_conversions',
      label: 'Google Ads Enhanced Conversions',
      description: 'Send hashed user data to improve conversion accuracy',
      disabled: project.features_configured?.enhanced_conversions,
      icon: '🔒'
    }
  ];

  const handleToggle = (featureKey) => {
    setSelectedFeatures(prev => ({
      ...prev,
      [featureKey]: !prev[featureKey]
    }));
  };

  const handleContinue = () => {
    const features = Object.keys(selectedFeatures).filter(key => selectedFeatures[key]);
    if (features.length === 0) {
      alert('Please select at least one feature to add');
      return;
    }
    onContinue(features);
  };

  return (
    <div className="screen feature-selection-screen">
      <div className="feature-selection-container">
        <h2>Add Features to {project.client_info.name}</h2>
        <p className="subtitle">Select which features you'd like to add to this project:</p>

        <div className="features-list">
          {availableFeatures.map(feature => (
            <div
              key={feature.key}
              className={`feature-option ${feature.disabled ? 'disabled' : ''} ${selectedFeatures[feature.key] ? 'selected' : ''}`}
              onClick={() => !feature.disabled && handleToggle(feature.key)}
            >
              <div className="feature-icon">{feature.icon}</div>
              <div className="feature-info">
                <h3>{feature.label}</h3>
                <p>{feature.description}</p>
                {feature.disabled && <span className="already-configured">Already configured</span>}
              </div>
              <input
                type="checkbox"
                checked={selectedFeatures[feature.key]}
                disabled={feature.disabled}
                readOnly
              />
            </div>
          ))}
        </div>

        <div className="button-group">
          <button className="btn btn-secondary" onClick={onBack}>
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={handleContinue}
            disabled={Object.values(selectedFeatures).every(v => !v)}
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}

export default FeatureSelection;
