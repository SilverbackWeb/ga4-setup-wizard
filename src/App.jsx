import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import './App.css';

// Screen Components
import Welcome from './screens/Welcome';
import Authentication from './screens/Authentication';
import ClientInformation from './screens/ClientInformation';
import EventConfiguration from './screens/EventConfiguration';
import ReviewCreate from './screens/ReviewCreate';
import Creating from './screens/Creating';
import Testing from './screens/Testing';
import Success from './screens/Success';
import ErrorScreen from './screens/Error';
import Dashboard from './screens/Dashboard';
import ProjectDetail from './screens/ProjectDetail';
import FeatureSelection from './screens/FeatureSelection';
import { useParams } from 'react-router-dom';

// Wrapper component to show Testing screen for an existing project
function TestingWrapper({ sessionId }) {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadProject = async () => {
      try {
        const response = await fetch(`/api/projects/${projectId}`);
        const data = await response.json();
        setProject(data);
      } catch (error) {
        console.error('Failed to load project for testing:', error);
        navigate(`/project/${projectId}`);
      } finally {
        setIsLoading(false);
      }
    };
    loadProject();
  }, [projectId, navigate]);

  if (isLoading) {
    return <div className="screen"><div className="testing-container"><div className="testing-header"><h2>Loading project...</h2></div><div className="loading-spinner"><div className="spinner"></div></div></div></div>;
  }

  if (!project) {
    return null;
  }

  // Reconstruct formData from project
  const formData = {
    clientName: project.client_info.name,
    website: project.client_info.domain,
    gtmAccountId: project.client_info.gtm_account_id,
    gtmContainerId: project.client_info.gtm_container_id,
    ga4PropertyId: project.client_info.ga4_property_id,
    ga4MeasurementId: project.client_info.ga4_measurement_id,
    googleAdsAccountId: project.client_info.google_ads_account || '',
    events: {
      phoneCall: project.events_configured.find(e => e.type === 'phoneCall') || { enabled: false },
      thankYouPage: project.events_configured.find(e => e.type === 'thankYouPage') || { enabled: false },
      ctaClick: project.events_configured.find(e => e.type === 'ctaClick') || { enabled: false }
    }
  };

  // Extract trigger and tag IDs from GTM resources
  const triggerIds = {};
  const tagIds = {};

  if (project.gtm_resources?.triggers) {
    project.gtm_resources.triggers.forEach(trigger => {
      const eventType = trigger.name.replace('_', '');
      if (trigger.name === 'call_now_click') triggerIds.phoneCall = trigger.triggerId;
      if (trigger.name === 'thank_you_page') triggerIds.thankYouPage = trigger.triggerId;
      if (trigger.name === 'cta_click') triggerIds.ctaClick = trigger.triggerId;
    });
  }

  if (project.gtm_resources?.tags) {
    project.gtm_resources.tags.forEach(tag => {
      if (tag.name.includes('call_now_click')) tagIds.phoneCall = tag.tagId;
      if (tag.name.includes('thank_you_page')) tagIds.thankYouPage = tag.tagId;
      if (tag.name.includes('cta_click')) tagIds.ctaClick = tag.tagId;
    });
  }

  return (
    <Testing
      sessionId={sessionId}
      formData={formData}
      triggerIds={triggerIds}
      tagIds={tagIds}
      isLoading={false}
      onContinue={() => navigate(`/project/${projectId}`)}
      onBack={() => navigate(`/project/${projectId}`)}
    />
  );
}

// Wrapper component to extract projectId from URL params for edit mode
function WizardFlowWrapper({ initialSessionId, mode }) {
  const { projectId } = useParams();
  const location = useLocation();
  // Get sessionId from location state (passed via navigate), fall back to initialSessionId
  const sessionIdFromState = location.state?.sessionId || initialSessionId;
  return <WizardFlow initialSessionId={sessionIdFromState} mode={mode} projectId={projectId} />;
}

// Wrapper for /wizard route that might have projectIdForEdit in state or localStorage
function WizardScreenWrapper({ initialSessionId }) {
  const location = useLocation();
  const projectIdFromState = location.state?.projectIdForEdit;
  const projectIdFromStorage = localStorage.getItem('projectIdForEdit');
  const projectIdForEdit = projectIdFromState || projectIdFromStorage;

  if (projectIdForEdit) {
    // User clicked "Add Features" and is in edit mode
    // NEVER use the inherited initialSessionId - force fresh authentication
    // Only use sessionId if explicitly stored for edit mode (user with sessionId initiated edit)
    return <WizardFlow initialSessionId={null} mode="create_then_edit" projectId={projectIdForEdit} />;
  }

  return <WizardFlow initialSessionId={initialSessionId} mode="create" />;
}

function WizardFlow({ initialSessionId, mode = 'create', projectId = null }) {
  const navigate = useNavigate();
  // For create_then_edit mode, always require fresh authentication (ignore inherited sessionId)
  // For edit mode, use sessionId if available
  // For create mode, no authentication required
  const sessionIdOrFromStorage = mode === 'create_then_edit' ? localStorage.getItem('sessionId') : (initialSessionId || localStorage.getItem('sessionId'));
  const shouldRequireAuth = (mode === 'edit' || mode === 'create_then_edit') && !sessionIdOrFromStorage;
  // In create_then_edit mode, ALWAYS start at step 1 (Authentication), regardless of other factors
  const initialStep = mode === 'create_then_edit' ? 1 : (shouldRequireAuth ? 1 : 0);
  const [currentStep, setCurrentStep] = useState(initialStep);
  const [sessionId, setSessionId] = useState(sessionIdOrFromStorage || null);
  const [userInfo, setUserInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [editProject, setEditProject] = useState(null);
  const [featuresToAdd, setFeaturesToAdd] = useState([]);
  const [postAuthInEditMode, setPostAuthInEditMode] = useState(false);

  // Form data
  const [formData, setFormData] = useState({
    clientName: '',
    website: '',
    websiteUrl: '',
    gtmAccountId: '',
    gtmContainerId: '',
    ga4PropertyId: '',
    ga4MeasurementId: '',
    googleAdsAccountId: '',
    events: {
      phoneCall: {
        enabled: false,
        conversion: true
      },
      thankYouPage: {
        enabled: false,
        urlPath: '',
        conversion: true
      },
      ctaClick: {
        enabled: false,
        buttonTexts: '',
        conversion: false
      }
    }
  });

  const [setupResults, setSetupResults] = useState(null);
  const [triggerIds, setTriggerIds] = useState({});
  const [tagIds, setTagIds] = useState({});

  // Handle authentication callback
  useEffect(() => {
    // If we have an initial session from OAuth callback, go directly to step 1 (Authentication)
    if (initialSessionId && !userInfo) {
      fetchUserInfo(initialSessionId);
      setCurrentStep(1);
    }
  }, [initialSessionId, userInfo]);

  // Also handle direct OAuth callback (for backward compatibility)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const session = params.get('session');

    if (session && !sessionId) {
      // Mark edit mode BEFORE setting sessionId so it's available in the next effect
      if (mode === 'create_then_edit') {
        setPostAuthInEditMode(true);
      } else {
        setCurrentStep(1);
      }

      setSessionId(session);
      fetchUserInfo(session);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [sessionId, mode]);

  // Load project data if in edit mode or create_then_edit mode
  useEffect(() => {
    if ((mode === 'edit' || (mode === 'create_then_edit' && postAuthInEditMode)) && projectId && sessionId) {
      loadProjectForEdit().then(() => {
        // After project is loaded, go to feature selection
        if (mode === 'create_then_edit') {
          setCurrentStep(1.5); // Go to FeatureSelection (after Authentication)
        }
      });
    }
  }, [mode, projectId, sessionId, postAuthInEditMode]);

  // In create_then_edit mode, auto-skip form steps (2, 3, 4) and jump to Creating (step 5)
  useEffect(() => {
    if (mode === 'create_then_edit' && (currentStep === 2 || currentStep === 3 || currentStep === 4)) {
      setCurrentStep(5); // Skip all form steps, go straight to Creating
    }
  }, [currentStep, mode]);

  const loadProjectForEdit = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/projects/${projectId}`);
      const project = await response.json();
      setEditProject(project);

      // Pre-populate formData from project
      setFormData({
        clientName: project.client_info.name,
        website: project.client_info.domain,
        websiteUrl: project.client_info.domain,
        gtmAccountId: project.client_info.gtm_account_id,
        gtmContainerId: project.client_info.gtm_container_id,
        ga4PropertyId: project.client_info.ga4_property_id,
        ga4MeasurementId: project.client_info.ga4_measurement_id,
        googleAdsAccountId: project.client_info.google_ads_account || '',
        events: {
          phoneCall: project.events_configured.find(e => e.type === 'phoneCall') || { enabled: false, conversion: true },
          thankYouPage: project.events_configured.find(e => e.type === 'thankYouPage') || { enabled: false, urlPath: '', conversion: true },
          ctaClick: project.events_configured.find(e => e.type === 'ctaClick') || { enabled: false, buttonTexts: '', conversion: false }
        }
      });

      // Clear the projectIdForEdit from localStorage after successful load
      localStorage.removeItem('projectIdForEdit');
    } catch (error) {
      console.error('Failed to load project for edit:', error);
      setError('Failed to load project');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserInfo = async (session) => {
    try {
      setIsLoading(true);
      const authTokens = localStorage.getItem('authTokens');
      const tokenParam = authTokens ? `?authTokens=${encodeURIComponent(authTokens)}` : '';
      const response = await fetch(`/api/auth/user/${session}${tokenParam}`);
      if (response.status === 401) {
        // Session expired or invalid - clear it and show login screen
        console.warn('Session invalid or expired, clearing...');
        localStorage.removeItem('sessionId');
        setSessionId(null);
        setUserInfo(null);
        setCurrentStep(1); // Go back to auth screen
        return;
      }
      if (response.ok) {
        const data = await response.json();
        setUserInfo(data);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to verify authentication');
      }
    } catch (err) {
      console.error('Failed to fetch user info:', err);
      setError('Failed to verify authentication. Please sign in again.');
      localStorage.removeItem('sessionId');
      setSessionId(null);
      setCurrentStep(1); // Go back to auth screen
    } finally {
      setIsLoading(false);
    }
  };

  const goToStep = (step) => {
    setCurrentStep(step);
    setError(null);
  };

  const handleNext = () => {
    // In edit mode, skip EventConfiguration (step 3) since events are already configured
    // Check mode prop directly, not editProject state which might not be set yet
    const isEditMode = mode === 'edit' || mode === 'create_then_edit';

    if (currentStep === 2 && isEditMode) {
      // Skip EventConfiguration and go directly to ReviewCreate
      goToStep(4);
    } else if (currentStep < 6) {
      goToStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    // In edit mode, skip back over EventConfiguration (step 3)
    const isEditMode = mode === 'edit' || mode === 'create_then_edit';

    if (currentStep === 4 && isEditMode) {
      // Skip EventConfiguration and go back to ClientInformation
      goToStep(2);
    } else if (currentStep > 0) {
      goToStep(currentStep - 1);
    }
  };

  const updateFormData = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const updateEvent = (eventType, field, value) => {
    setFormData(prev => ({
      ...prev,
      events: {
        ...prev.events,
        [eventType]: {
          ...prev.events[eventType],
          [field]: value
        }
      }
    }));
  };

  const handleSetupStart = async () => {
    try {
      // Get sessionId from state first, fall back to localStorage if null
      const storedSessionId = localStorage.getItem('sessionId');
      const effectiveSessionId = sessionId || storedSessionId;
      // Encoded OAuth tokens for stateless fallback across Vercel serverless instances
      const authTokens = localStorage.getItem('authTokens');

      goToStep(5); // Go to Creating screen
      setIsLoading(true);

      const startTime = new Date().getTime();
      const isEditMode = (mode === 'edit' || mode === 'create_then_edit') && editProject;

      const config = {
        project: {
          name: 'GA4 Conversion Tracking Setup',
          version: '1.0',
          created_date: new Date().toISOString(),
          client: formData.clientName
        },
        client_info: {
          name: formData.clientName,
          domain: formData.website,
          gtm_account_id: formData.gtmAccountId,
          gtm_container_id: formData.gtmContainerId,
          ga4_property_id: formData.ga4PropertyId,
          ga4_measurement_id: formData.ga4MeasurementId,
          google_ads_account: formData.googleAdsAccountId
        },
        events: formData.events,
        setup_time: startTime
      };

      // Define trigger configurations for each event type
      const triggerConfigs = {
        phoneCall: {
          name: 'call_now_click',
          type: 'click',
          filterParameter: 'clickUrl',
          filterType: 'startsWith',
          filterValue: 'tel:'
        },
        thankYouPage: {
          name: 'thank_you_page',
          type: 'pageview',
          filterParameter: 'url',
          filterType: 'contains',
          filterValue: formData.events.thankYouPage.urlPath
        },
        ctaClick: {
          name: 'cta_click',
          type: 'click',
          filterParameter: 'elementText',
          filterType: 'contains',
          filterValue: formData.events.ctaClick.buttonTexts
        }
      };

      const triggersCreated = [];
      const tagsCreated = [];
      const configurationMismatches = [];

      // Declare variables outside the edit mode check for proper scoping
      let keyEventResults = [];
      let versionId = null;

      // Define event name mapping for use across all steps
      const eventNameMapping = {
        phoneCall: 'call_now_click',
        thankYouPage: 'thank_you_page',
        ctaClick: 'cta_click'
      };

      // EDIT MODE: Skip GTM triggers and GA4 tags when in edit mode
      // Only run GTM/GA4 setup for new projects (create mode)
      const shouldSetupGTMAndGA4 = !isEditMode;

      if (shouldSetupGTMAndGA4) {
        // Step 1: Create GTM Triggers (only in create mode)
        for (const [eventType, config] of Object.entries(triggerConfigs)) {
          console.log(`Processing event type: ${eventType}, enabled: ${formData.events[eventType]?.enabled}`);
          if (formData.events[eventType].enabled) {
            try {
              const response = await fetch('/api/gtm/trigger', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  sessionId: effectiveSessionId,
                  authTokens,
                  accountId: formData.gtmAccountId,
                  containerId: formData.gtmContainerId,
                  triggerName: config.name,
                  triggerType: config.type,
                  filterParameter: config.filterParameter,
                  filterType: config.filterType,
                  filterValue: config.filterValue
                })
              });

              // Handle 409 Conflict (duplicate trigger)
              if (response.status === 409) {
                const data = await response.json();

                // Check if it's a configuration mismatch
                if (data.isConfigMismatch) {
                  console.warn(`Configuration mismatch detected for trigger: ${config.name}`, data.configurationMismatch);
                  configurationMismatches.push({
                    triggerName: config.name,
                    eventType,
                    ...data.configurationMismatch,
                    message: data.message
                  });
                  // Still use the existing trigger if configurations match or show warning
                  triggersCreated.push({
                    eventType,
                    triggerId: data.triggerId,
                    triggerName: data.triggerName,
                    isDuplicate: true,
                    isConfigMismatch: true
                  });
                } else {
                  // Configuration matches - silently skip
                  console.log(`Trigger already exists with matching config, skipping: ${config.name}`);
                  triggersCreated.push({
                    eventType,
                    triggerId: data.triggerId,
                    triggerName: data.triggerName,
                    isDuplicate: true,
                    isConfigMismatch: false
                  });
                }
                continue;
              }

              // Check for other error statuses
              if (!response.ok) {
                let errorMessage = `Failed to create trigger: HTTP ${response.status}`;
                try {
                  const errorData = await response.json();
                  errorMessage = errorData.message || errorData.error || errorMessage;
                } catch (e) {
                  // If response isn't JSON, just use the status message
                }
                throw new Error(errorMessage);
              }

              const result = await response.json();

              if (result.success) {
                triggersCreated.push({
                  eventType,
                  triggerId: result.triggerId,
                  triggerName: result.triggerName,
                  isDuplicate: false,
                  isConfigMismatch: false
                });
              } else {
                throw new Error(result.error || 'Failed to create trigger');
              }
            } catch (error) {
              console.error(`Failed to create trigger for ${eventType}:`, error);
              throw error;
            }
          }
        }

        // Step 2: Create GA4 Event Tags
        for (const trigger of triggersCreated) {
          const eventType = trigger.eventType;

          try {
            const response = await fetch('/api/gtm/tag', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                sessionId: effectiveSessionId,
                authTokens,
                accountId: formData.gtmAccountId,
                containerId: formData.gtmContainerId,
                tagName: `GA4 – Event – ${trigger.triggerName}`,
                measurementId: formData.ga4MeasurementId,
                eventName: eventNameMapping[eventType],
                triggerIds: [trigger.triggerId]
              })
            });

            // Handle 409 Conflict (duplicate tag) - skip it but continue
            if (response.status === 409) {
              console.warn(`Tag already exists, skipping: ${trigger.triggerName}`);
              continue;
            }

            // Check for other error statuses
            if (!response.ok) {
              let errorMessage = `Failed to create tag: HTTP ${response.status}`;
              try {
                const errorData = await response.json();
                errorMessage = errorData.message || errorData.error || errorMessage;
              } catch (e) {
                // If response isn't JSON, just use the status message
              }
              throw new Error(errorMessage);
            }

            const result = await response.json();

            if (result.success) {
              tagsCreated.push({
                eventType,
                tagId: result.tagId,
                tagName: result.tagName
              });
            } else {
              throw new Error(result.error || 'Failed to create tag');
            }
          } catch (error) {
            console.error(`Failed to create tag for ${eventType}:`, error);
            throw error;
          }
        }

        // Step 3: Create Config Tag (for collecting all events)
        try {
          const response = await fetch('/api/gtm/tag', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sessionId: effectiveSessionId,
              authTokens,
              accountId: formData.gtmAccountId,
              containerId: formData.gtmContainerId,
              tagName: 'GA4 – Config',
              measurementId: formData.ga4MeasurementId,
              eventName: 'config',
              triggerIds: []
            })
          });

          // Handle 409 Conflict (duplicate config tag) - skip it but continue
          if (response.status === 409) {
            console.warn('Config tag already exists, skipping');
          } else if (!response.ok) {
            let errorMessage = `Failed to create config tag: HTTP ${response.status}`;
            try {
              const errorData = await response.json();
              errorMessage = errorData.message || errorData.error || errorMessage;
            } catch (e) {
              // If response isn't JSON, just use the status message
            }
            throw new Error(errorMessage);
          } else {
            const result = await response.json();
            if (result.success) {
              tagsCreated.push({
                eventType: 'config',
                tagId: result.tagId,
                tagName: result.tagName
              });
            } else {
              throw new Error(result.error || 'Failed to create config tag');
            }
          }
        } catch (error) {
          console.error('Failed to create config tag:', error);
          throw error;
        }

        // Step 4: Publish GTM Version (CRITICAL - must succeed)
        try {
          console.log('[SETUP] Publishing GTM container to live...');
          const response = await fetch('/api/gtm/publish', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sessionId: effectiveSessionId,
              authTokens,
              accountId: formData.gtmAccountId,
              containerId: formData.gtmContainerId,
              versionName: `GA4 Setup - ${formData.clientName} - ${new Date().toISOString().split('T')[0]}`
            })
          });

          if (!response.ok) {
            let errorMessage = `Failed to publish GTM version: HTTP ${response.status}`;
            try {
              const errorData = await response.json();
              errorMessage = errorData.message || errorData.error || errorMessage;
            } catch (e) {
              // If response isn't JSON, just use the status message
            }
            throw new Error(errorMessage);
          }

          const result = await response.json();
          if (result.success) {
            versionId = result.versionId;
            console.log(`[SETUP] ✓ GTM container published successfully (Version ${versionId})`);
          } else {
            throw new Error(result.error || 'Failed to publish version');
          }
        } catch (error) {
          console.error('CRITICAL: Failed to publish GTM version:', error);
          setError(`❌ Critical: GTM container failed to publish. Your triggers and tags are created but NOT LIVE. Error: ${error.message}`);
          goToStep(7); // Error step
          setIsLoading(false);
          throw error;
        }

        // Step 5: Mark Key Events in GA4 (only in create mode)
        for (const [eventType, eventConfig] of Object.entries(formData.events)) {
          if (eventConfig.enabled && eventConfig.conversion) {
            const eventName = eventNameMapping[eventType];

            try {
              const response = await fetch('/api/ga4/key-event', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  sessionId: effectiveSessionId,
                  authTokens,
                  propertyId: formData.ga4PropertyId,
                  eventName
                })
              });

              if (!response.ok) {
                let errorMessage = `Failed to mark key event: HTTP ${response.status}`;
                try {
                  const errorData = await response.json();
                  errorMessage = errorData.message || errorData.error || errorMessage;
                } catch (e) {
                  // If response isn't JSON, just use the status message
                }
                throw new Error(errorMessage);
              }

              const result = await response.json();
              keyEventResults.push({
                eventType,
                eventName,
                ...result
              });
            } catch (error) {
              keyEventResults.push({
                eventType,
                eventName,
                success: false,
                error: error.message
              });
            }
          }
        }
      } else {
        // Edit mode: no key events to mark
        keyEventResults = [];
      }

      // Step 6: Create Google Ads Conversion Actions (if selected in edit mode or if googleAdsAccountId provided in create mode)
      const conversionActionsCreated = [];
      const shouldCreateGoogleAds = isEditMode ? featuresToAdd.includes('google_ads') : !!formData.googleAdsAccountId;

      if (shouldCreateGoogleAds && formData.googleAdsAccountId) {
        const conversionCategoryMapping = {
          phoneCall: 'PHONE_CALL_LEAD',
          thankYouPage: 'SUBMIT_LEAD_FORM',
          ctaClick: 'CONTACT'
        };

        // Create conversion actions for enabled events
        for (const [eventType, eventConfig] of Object.entries(formData.events)) {
          if (eventConfig.enabled) {
            try {
              const response = await fetch('/api/google-ads/conversion-action', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  sessionId: effectiveSessionId,
                  authTokens,
                  customerId: formData.googleAdsAccountId.replace(/-/g, ''),
                  conversionAction: {
                    name: `${formData.clientName} - ${eventNameMapping[eventType]}`,
                    category: conversionCategoryMapping[eventType]
                  }
                })
              });

              if (!response.ok) {
                let errorMessage = `Failed to create Google Ads conversion action: HTTP ${response.status}`;
                try {
                  const errorData = await response.json();
                  errorMessage = errorData.message || errorData.error || errorMessage;
                } catch (e) {
                  // If response isn't JSON, just use the status message
                }
                console.warn(errorMessage);
                // Don't throw - continue with other actions
              } else {
                const result = await response.json();
                if (result.success) {
                  conversionActionsCreated.push({
                    eventType,
                    conversionActionId: result.conversionActionId,
                    conversionActionName: result.conversionActionName
                  });
                  console.log(`Google Ads conversion action created: ${result.conversionActionName}`);
                }
              }
            } catch (error) {
              console.warn(`Failed to create Google Ads conversion action for ${eventType}:`, error.message);
              // Don't throw - continue with other actions
            }
          }
        }
      }

      const enabledEventCount = Object.values(formData.events).filter(e => e.enabled).length;

      const results = {
        ...config,
        triggers_created: triggersCreated.length,
        tags_created: tagsCreated.length,
        version_published: versionId,
        key_events_marked: keyEventResults,
        conversion_actions_created: conversionActionsCreated,
        configuration_mismatches: configurationMismatches.length > 0 ? configurationMismatches : null,
        status: 'success'
      };

      setSetupResults(results);

      // Save project or update existing (edit mode)
      const setupDuration = new Date().getTime() - startTime;
      try {
        if (isEditMode) {
          // UPDATE existing project with new features
          const updates = {
            features_configured: {
              ...editProject.features_configured,
              google_ads: featuresToAdd.includes('google_ads') ? true : editProject.features_configured?.google_ads,
              enhanced_conversions: featuresToAdd.includes('enhanced_conversions') ? true : editProject.features_configured?.enhanced_conversions
            },
            google_ads_resources: conversionActionsCreated.length > 0 ? {
              conversion_actions: conversionActionsCreated
            } : editProject.google_ads_resources,
            client_info: {
              google_ads_account: formData.googleAdsAccountId
            },
            action: 'add_features',
            features_added: featuresToAdd,
            user_email: userInfo?.email
          };

          const response = await fetch(`/api/projects/${editProject.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ updates })
          });

          if (!response.ok) {
            throw new Error('Failed to update project');
          }

          console.log('Project updated successfully');
        } else {
          // CREATE new project
          await fetch('/api/projects/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              setupData: {
                client_info: {
                  name: formData.clientName,
                  domain: formData.website,
                  gtm_account_id: formData.gtmAccountId,
                  gtm_container_id: formData.gtmContainerId,
                  ga4_property_id: formData.ga4PropertyId,
                  ga4_measurement_id: formData.ga4MeasurementId,
                  google_ads_account: formData.googleAdsAccountId
                },
                events_configured: Object.entries(formData.events)
                  .filter(([_, config]) => config.enabled)
                  .map(([type, config]) => ({
                    type,
                    enabled: true,
                    conversion: config.conversion,
                    ...config
                  })),
                features_configured: {
                  gtm_triggers: true,
                  ga4_tags: true,
                  google_ads: conversionActionsCreated.length > 0,
                  enhanced_conversions: false
                },
                google_ads_resources: conversionActionsCreated.length > 0 ? {
                  conversion_actions: conversionActionsCreated
                } : undefined,
                gtm_resources: {
                  triggers_created: triggersCreated.length,
                  tags_created: tagsCreated.length,
                  version_published: versionId || 'unknown'
                },
                key_events_marked: keyEventResults,
                setup_duration_ms: setupDuration,
                user_email: userInfo?.email
              }
            })
          });
        }
      } catch (error) {
        console.error('Failed to save/update project:', error);
        // Don't block success screen if save fails
      }

      // Populate trigger and tag IDs for Testing screen
      const triggerIdsMap = {};
      const tagIdsMap = {};

      triggersCreated.forEach(trigger => {
        triggerIdsMap[trigger.eventType] = trigger.triggerId;
      });

      tagsCreated.forEach(tag => {
        if (tag.eventType !== 'config') {
          tagIdsMap[tag.eventType] = tag.tagId;
        }
      });

      setTriggerIds(triggerIdsMap);
      setTagIds(tagIdsMap);

      goToStep(5.5); // Go to Testing screen
    } catch (err) {
      console.error('Setup failed:', err);
      console.error('Error stack:', err.stack);
      console.error('Error message:', err.message);
      setError(err.message || 'Unknown error occurred');
      goToStep(7); // Go to Error screen
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setCurrentStep(0);
    setFormData({
      clientName: '',
      website: '',
      websiteUrl: '',
      gtmAccountId: '',
      gtmContainerId: '',
      ga4PropertyId: '',
      ga4MeasurementId: '',
      googleAdsAccountId: '',
      events: {
        phoneCall: { enabled: false, conversion: true },
        thankYouPage: { enabled: false, urlPath: '', conversion: true },
        ctaClick: { enabled: false, buttonTexts: '', conversion: false }
      }
    });
    setSetupResults(null);
    setError(null);
  };

  const handleExit = () => {
    navigate('/');
  };

  return (
    <div className="app">
      {/* Progress Bar */}
      <div className="progress-container">
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${((currentStep + 1) / 8) * 100}%` }}
          />
        </div>
        <div className="progress-text">Step {Math.ceil(currentStep + 1)} of 8</div>
      </div>

      {/* Main Content */}
      <div className="app-container">
        {currentStep === 0 && (
          <Welcome onGetStarted={() => goToStep(1)} />
        )}

        {(currentStep === 0.5 || currentStep === 1.5) && (mode === 'edit' || mode === 'create_then_edit') && editProject && (
          <FeatureSelection
            project={editProject}
            onContinue={(features) => {
              setFeaturesToAdd(features);
              // In create_then_edit mode, skip to creating features (step 5)
              // In edit mode, go to client form to allow updating Google Ads account (step 2)
              if (mode === 'create_then_edit') {
                goToStep(5); // Skip straight to Creating (will set up Google Ads)
              } else {
                goToStep(2); // Go to client form
              }
            }}
            onBack={() => navigate(`/project/${projectId}`)}
          />
        )}

        {currentStep === 1 && (
          <Authentication
            sessionId={sessionId}
            userInfo={userInfo}
            isLoading={isLoading}
            onContinue={() => {
              // In create_then_edit mode, wait for project to load (handled in useEffect)
              // In other modes, go directly to ClientInformation
              if (mode !== 'create_then_edit') {
                goToStep(2);
              }
            }}
          />
        )}

        {currentStep === 2 && mode !== 'create_then_edit' && (
          <ClientInformation
            formData={formData}
            updateFormData={updateFormData}
            onPrevious={handlePrevious}
            onNext={handleNext}
            onCancel={handleExit}
          />
        )}

        {currentStep === 3 && mode !== 'create_then_edit' && (
          <EventConfiguration
            formData={formData}
            updateEvent={updateEvent}
            onPrevious={handlePrevious}
            onNext={handleNext}
            onCancel={handleExit}
          />
        )}

        {currentStep === 4 && (
          <ReviewCreate
            formData={formData}
            sessionId={sessionId}
            mode={mode}
            editProject={editProject}
            featuresToAdd={featuresToAdd}
            onPrevious={handlePrevious}
            onCreateSetup={handleSetupStart}
            onCancel={handleExit}
            onEdit={() => goToStep(2)}
          />
        )}

        {currentStep === 5 && (
          <Creating
            formData={formData}
            onCancel={handleExit}
            onStart={mode === 'create_then_edit' ? handleSetupStart : undefined}
          />
        )}

        {currentStep === 5.5 && (
          <Testing
            sessionId={sessionId}
            formData={formData}
            triggerIds={triggerIds}
            tagIds={tagIds}
            isLoading={isLoading}
            onContinue={() => goToStep(6)}
            onBack={() => goToStep(5)}
          />
        )}

        {currentStep === 6 && (
          <Success
            formData={formData}
            setupResults={setupResults}
            onSetupAnother={handleReset}
            onExit={handleExit}
            mode={mode}
            featuresToAdd={featuresToAdd}
            editProjectId={editProject?.id}
          />
        )}

        {currentStep === 7 && (
          <ErrorScreen
            error={error}
            onRetry={() => goToStep(4)}
            onExit={handleExit}
          />
        )}
      </div>
    </div>
  );
}

// Main App component with routing
function App() {
  const navigate = useNavigate();
  const [sessionId, setSessionId] = useState(() => {
    // Try to get sessionId from localStorage on initial load
    return localStorage.getItem('sessionId') || null;
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const session = params.get('session');
    if (session) {
      setSessionId(session);
      localStorage.setItem('sessionId', session);
      window.history.replaceState({}, document.title, window.location.pathname);
      // Redirect to wizard after OAuth callback so WizardFlow can use the session
      navigate('/wizard');
    }
  }, [navigate]);

  // Update localStorage whenever sessionId changes
  useEffect(() => {
    if (sessionId) {
      localStorage.setItem('sessionId', sessionId);
    }
  }, [sessionId]);

  return (
    <Routes>
      <Route path="/" element={<Dashboard sessionId={sessionId} />} />
      <Route path="/project/:projectId" element={<ProjectDetail sessionId={sessionId} />} />
      <Route path="/test/:projectId" element={<TestingWrapper sessionId={sessionId} />} />
      <Route path="/wizard" element={<WizardScreenWrapper initialSessionId={sessionId} />} />
      <Route path="/wizard/edit/:projectId" element={<WizardFlowWrapper initialSessionId={sessionId} mode="edit" />} />
      <Route path="/auth-callback" element={<AuthCallbackHandler />} />
    </Routes>
  );
}

// Simple component to handle OAuth callback and redirect to wizard
function AuthCallbackHandler() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get('session');
    const tokens = params.get('tokens');

    if (sessionId) {
      // Store sessionId and encoded tokens in localStorage for WizardFlow to use
      localStorage.setItem('sessionId', sessionId);
      if (tokens) localStorage.setItem('authTokens', tokens);
      // Redirect to wizard with the session in URL
      window.location.href = `/wizard?session=${sessionId}`;
    } else {
      // No session, redirect to home
      window.location.href = '/';
    }
  }, []);

  return <div>Processing authentication...</div>
}

export default App;
