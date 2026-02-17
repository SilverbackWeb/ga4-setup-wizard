/**
 * Validation utilities for GA4 Setup Wizard
 */

const PHONE_REGEX = /^[\d\s\-().+]+$/;
const GTM_CONTAINER_REGEX = /^GTM-[A-Z0-9]+$/;
const GA4_MEASUREMENT_REGEX = /^G-[A-Z0-9]+$/;
const GOOGLE_ADS_REGEX = /^\d{3}-\d{3}-\d{4}$/;
const URL_DOMAIN_REGEX = /^(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i;
const URL_PATH_REGEX = /^\/[a-zA-Z0-9\-._~:/?#[\]@!$&'()*+,;=]*\/?$/;

/**
 * Validates a client name
 */
export const validateClientName = (name) => {
  if (!name || typeof name !== 'string') {
    return {
      valid: false,
      error: 'Client name is required'
    };
  }
  if (name.trim().length < 2) {
    return {
      valid: false,
      error: 'Client name must be at least 2 characters'
    };
  }
  if (name.length > 100) {
    return {
      valid: false,
      error: 'Client name must be less than 100 characters'
    };
  }
  return { valid: true };
};

/**
 * Validates a website domain
 */
export const validateWebsiteDomain = (domain) => {
  if (!domain || typeof domain !== 'string') {
    return {
      valid: false,
      error: 'Website domain is required'
    };
  }
  if (!URL_DOMAIN_REGEX.test(domain)) {
    return {
      valid: false,
      error: 'Invalid domain format (e.g., example.com)'
    };
  }
  return { valid: true };
};

/**
 * Validates a website URL
 */
export const validateWebsiteUrl = (url) => {
  if (!url || typeof url !== 'string') {
    return {
      valid: false,
      error: 'Website URL is required'
    };
  }

  // Auto-prepend https:// if no protocol is provided
  let urlToValidate = url;
  if (!url.match(/^https?:\/\//i)) {
    urlToValidate = `https://${url}`;
  }

  try {
    new URL(urlToValidate);
  } catch {
    return {
      valid: false,
      error: 'Invalid URL format (e.g., https://example.com)'
    };
  }
  return { valid: true };
};

/**
 * Validates a GTM Account ID
 */
export const validateGTMAccountId = (accountId) => {
  if (!accountId || typeof accountId !== 'string') {
    return {
      valid: false,
      error: 'GTM Account ID is required'
    };
  }
  if (!/^\d+$/.test(accountId)) {
    return {
      valid: false,
      error: 'GTM Account ID must be numeric'
    };
  }
  return { valid: true };
};

/**
 * Validates a GTM Container ID
 */
export const validateGTMContainerId = (containerId) => {
  if (!containerId || typeof containerId !== 'string') {
    return {
      valid: false,
      error: 'GTM Container ID is required'
    };
  }
  if (!GTM_CONTAINER_REGEX.test(containerId)) {
    return {
      valid: false,
      error: 'Invalid GTM Container ID format (must be GTM-XXXXXX)'
    };
  }
  return { valid: true };
};

/**
 * Validates a GA4 Property ID
 */
export const validateGA4PropertyId = (propertyId) => {
  if (!propertyId || typeof propertyId !== 'string') {
    return {
      valid: false,
      error: 'GA4 Property ID is required'
    };
  }
  if (!/^\d+$/.test(propertyId)) {
    return {
      valid: false,
      error: 'GA4 Property ID must be numeric'
    };
  }
  return { valid: true };
};

/**
 * Validates a GA4 Measurement ID
 */
export const validateGA4MeasurementId = (measurementId) => {
  if (!measurementId || typeof measurementId !== 'string') {
    return {
      valid: false,
      error: 'GA4 Measurement ID is required'
    };
  }
  if (!GA4_MEASUREMENT_REGEX.test(measurementId)) {
    return {
      valid: false,
      error: 'Invalid GA4 Measurement ID format (must be G-XXXXXXXXXX)'
    };
  }
  return { valid: true };
};

/**
 * Validates a Google Ads Account ID (optional)
 */
export const validateGoogleAdsAccountId = (accountId) => {
  if (!accountId) {
    // Optional field
    return { valid: true };
  }
  if (typeof accountId !== 'string') {
    return {
      valid: false,
      error: 'Google Ads Account ID must be a string'
    };
  }
  if (!GOOGLE_ADS_REGEX.test(accountId)) {
    return {
      valid: false,
      error: 'Invalid Google Ads Account ID format (must be XXX-XXX-XXXX)'
    };
  }
  return { valid: true };
};

/**
 * Validates a phone number
 */
export const validatePhoneNumber = (phoneNumber) => {
  if (!phoneNumber || typeof phoneNumber !== 'string') {
    return {
      valid: false,
      error: 'Phone number is required'
    };
  }
  // Remove common formatting characters (but keep letters for vanity numbers)
  const cleaned = phoneNumber.replace(/[\s\-().]/g, '');
  // Allow phone numbers with digits and letters (vanity numbers like 1-800-FLOWERS)
  // Must have at least 7 characters (digits or letters)
  if (!/^[\d+A-Za-z]{7,}$/.test(cleaned)) {
    return {
      valid: false,
      error: 'Invalid phone number format (e.g., (636) 306-9072, 1-800-555-0123, or 314-530-DECK)'
    };
  }
  return { valid: true };
};

/**
 * Validates a thank you page URL path
 */
export const validateThankYouPageUrl = (urlPath) => {
  if (!urlPath || typeof urlPath !== 'string') {
    return {
      valid: false,
      error: 'Thank you page URL path is required'
    };
  }
  if (!urlPath.startsWith('/')) {
    return {
      valid: false,
      error: 'URL path must start with "/" (e.g., /thank-you/ or /success)'
    };
  }
  if (!URL_PATH_REGEX.test(urlPath)) {
    return {
      valid: false,
      error: 'Invalid URL path format'
    };
  }
  return { valid: true };
};

/**
 * Validates CTA button texts (comma-separated)
 */
export const validateCtaButtonTexts = (textString) => {
  if (!textString || typeof textString !== 'string') {
    return {
      valid: false,
      error: 'CTA button text(s) are required'
    };
  }
  const texts = textString
    .split(',')
    .map(t => t.trim())
    .filter(t => t.length > 0);

  if (texts.length === 0) {
    return {
      valid: false,
      error: 'At least one CTA button text is required'
    };
  }

  return { valid: true, parsedTexts: texts };
};

/**
 * Validates at least one event is selected
 */
export const validateEventsSelected = (events) => {
  const hasPhoneCall = events?.phoneCall?.enabled;
  const hasThankYouPage = events?.thankYouPage?.enabled;
  const hasCtaClick = events?.ctaClick?.enabled;

  if (!hasPhoneCall && !hasThankYouPage && !hasCtaClick) {
    return {
      valid: false,
      error: 'At least one event must be selected'
    };
  }

  return { valid: true };
};

/**
 * Validates entire client information form
 */
export const validateClientInfo = (formData) => {
  const errors = {};

  // Client name
  const clientNameValidation = validateClientName(formData.clientName);
  if (!clientNameValidation.valid) {
    errors.clientName = clientNameValidation.error;
  }

  // Website domain
  const domainValidation = validateWebsiteDomain(formData.website);
  if (!domainValidation.valid) {
    errors.website = domainValidation.error;
  }

  // Website URL
  const urlValidation = validateWebsiteUrl(formData.websiteUrl);
  if (!urlValidation.valid) {
    errors.websiteUrl = urlValidation.error;
  }

  // GTM Account ID
  const gtmAccountValidation = validateGTMAccountId(formData.gtmAccountId);
  if (!gtmAccountValidation.valid) {
    errors.gtmAccountId = gtmAccountValidation.error;
  }

  // GTM Container ID
  const gtmContainerValidation = validateGTMContainerId(formData.gtmContainerId);
  if (!gtmContainerValidation.valid) {
    errors.gtmContainerId = gtmContainerValidation.error;
  }

  // GA4 Property ID
  const ga4PropertyValidation = validateGA4PropertyId(formData.ga4PropertyId);
  if (!ga4PropertyValidation.valid) {
    errors.ga4PropertyId = ga4PropertyValidation.error;
  }

  // GA4 Measurement ID
  const ga4MeasurementValidation = validateGA4MeasurementId(formData.ga4MeasurementId);
  if (!ga4MeasurementValidation.valid) {
    errors.ga4MeasurementId = ga4MeasurementValidation.error;
  }

  // Google Ads Account ID (optional)
  if (formData.googleAdsAccountId) {
    const adsValidation = validateGoogleAdsAccountId(formData.googleAdsAccountId);
    if (!adsValidation.valid) {
      errors.googleAdsAccountId = adsValidation.error;
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors
  };
};

/**
 * Validates entire event configuration form
 */
export const validateEventConfig = (formData) => {
  const errors = {};

  // At least one event selected
  const eventsValidation = validateEventsSelected(formData.events);
  if (!eventsValidation.valid) {
    errors.events = eventsValidation.error;
  }

  // Thank you page validation
  if (formData.events?.thankYouPage?.enabled) {
    const urlValidation = validateThankYouPageUrl(formData.events.thankYouPage.urlPath);
    if (!urlValidation.valid) {
      errors.thankYouPageUrl = urlValidation.error;
    }
  }

  // CTA click validation
  if (formData.events?.ctaClick?.enabled) {
    const ctaValidation = validateCtaButtonTexts(formData.events.ctaClick.buttonTexts);
    if (!ctaValidation.valid) {
      errors.ctaButtonTexts = ctaValidation.error;
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors
  };
};
