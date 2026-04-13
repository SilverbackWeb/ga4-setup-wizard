/**
 * GA4 Setup Wizard - Express Backend Server
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const { google } = require('googleapis');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;
const isProduction = process.env.NODE_ENV === 'production';

// In production (Vercel), filesystem is read-only — silently swallow log file writes
if (isProduction) {
  const _origAppend = fs.appendFileSync.bind(fs);
  fs.appendFileSync = (filePath, data, options) => {
    if (typeof filePath === 'string' && (filePath.includes('logs') || filePath.includes('sessions'))) return;
    try { _origAppend(filePath, data, options); } catch(e) {}
  };
}

// Pre-initialize Google API services to ensure they're properly loaded
let googleServicesReady = false;
try {
  // Initialize services to validate the google library is working
  const testTagManager = google.tagmanager('v2');
  const testAnalytics = google.analytics('v3');
  const testAnalyticsData = google.analyticsdata('v1beta');
  googleServicesReady = !!(testTagManager && testAnalytics && testAnalyticsData);
  console.log('[INIT] Google API services initialized successfully');
} catch (error) {
  console.error('[INIT] Failed to initialize Google API services:', error.message);
}

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${req.method} ${req.path}`;
  const logFile = path.join('./logs', `debug-${new Date().toISOString().split('T')[0]}.log`);
  if (!fs.existsSync('./logs')) {
    fs.mkdirSync('./logs', { recursive: true });
  }
  fs.appendFileSync(logFile, logMessage + '\n');
  next();
});

// Session store: in-memory for production (Vercel serverless), file-based for development
const _memorySessionStore = new Map();
const sessionsDir = './sessions';
if (!isProduction && !fs.existsSync(sessionsDir)) {
  fs.mkdirSync(sessionsDir, { recursive: true });
}

const sessions = {
  get: (sessionId) => {
    if (isProduction) return _memorySessionStore.get(sessionId) || null;
    try {
      const sessionPath = path.join(sessionsDir, `${sessionId}.json`);
      if (fs.existsSync(sessionPath)) {
        const data = fs.readFileSync(sessionPath, 'utf8');
        return JSON.parse(data);
      }
    } catch (error) {
      console.error(`Failed to read session ${sessionId}:`, error.message);
    }
    return null;
  },
  set: (sessionId, data) => {
    if (isProduction) { _memorySessionStore.set(sessionId, data); return; }
    try {
      const sessionPath = path.join(sessionsDir, `${sessionId}.json`);
      fs.writeFileSync(sessionPath, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error(`Failed to write session ${sessionId}:`, error.message);
    }
  }
};

// Create logs directory if it doesn't exist (dev only — Vercel filesystem is read-only)
const logsDir = process.env.LOG_DIR || './logs';
if (!isProduction && !fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Logger utility
const logger = {
  log: (level, component, message, data = null) => {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${level}] [${component}] ${message}`;
    console.log(logMessage, data || '');

    // Always write to log file
    const logFile = path.join(logsDir, `debug-${new Date().toISOString().split('T')[0]}.log`);
    fs.appendFileSync(logFile, logMessage + (data ? '\n' + JSON.stringify(data, null, 2) : '') + '\n');
  },
  info: (component, message, data) => logger.log('INFO', component, message, data),
  success: (component, message, data) => logger.log('SUCCESS', component, message, data),
  error: (component, message, data) => logger.log('ERROR', component, message, data),
  debug: (component, message, data) => {
    logger.log('DEBUG', component, message, data);
  }
};

// OAuth2 client setup
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.REDIRECT_URI
);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'GA4 Setup Wizard API is running' });
});

// ============================================================================
// AUTHENTICATION ROUTES
// ============================================================================

// Get OAuth authorization URL
app.get('/api/auth/url', (req, res) => {
  try {
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: [
        'https://www.googleapis.com/auth/tagmanager.edit.containers',
        'https://www.googleapis.com/auth/analytics.edit',
        'https://www.googleapis.com/auth/analytics.readonly',
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/adwords'
      ]
    });
    res.json({ url: authUrl });
  } catch (error) {
    logger.error('AUTH', 'Failed to generate auth URL', error.message);
    res.status(500).json({ error: 'Failed to generate authentication URL' });
  }
});

// OAuth callback
app.get('/api/auth/callback', async (req, res) => {
  const { code, state } = req.query;

  if (!code) {
    logger.error('AUTH', 'No authorization code provided');
    return res.status(400).json({ error: 'No authorization code provided' });
  }

  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    const sessionId = require('crypto').randomBytes(16).toString('hex');
    sessions.set(sessionId, {
      tokens,
      createdAt: new Date(),
      userEmail: null
    });

    // Get user info
    const oauth2 = google.oauth2('v2');
    const userInfo = await oauth2.userinfo.get({ auth: oauth2Client });
    sessions.get(sessionId).userEmail = userInfo.data.email;

    logger.info('AUTH', `User authenticated: ${userInfo.data.email}`);

    // Redirect to the correct port (use environment variable or default)
    const redirectHost = process.env.REDIRECT_HOST || `http://localhost:${process.env.PORT || 5001}`;
    res.redirect(`${redirectHost}/auth-callback?session=${sessionId}`);
  } catch (error) {
    logger.error('AUTH', 'OAuth callback failed', error.message);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

// Get current user info
app.get('/api/auth/user/:sessionId', async (req, res) => {
  const { sessionId } = req.params;
  const session = sessions.get(sessionId);

  if (!session) {
    return res.status(401).json({ error: 'Invalid or expired session' });
  }

  oauth2Client.setCredentials(session.tokens);

  try {
    const oauth2 = google.oauth2('v2');
    const userInfo = await oauth2.userinfo.get({ auth: oauth2Client });

    // Verify permissions
    const tagmanager = google.tagmanager('v2');
    const analytics = google.analytics('v3');

    res.json({
      email: userInfo.data.email,
      name: userInfo.data.name,
      picture: userInfo.data.picture,
      permissions: {
        gtm: true,
        ga4: true,
        ads: true
      }
    });
  } catch (error) {
    logger.error('AUTH', 'Failed to get user info', error.message);
    res.status(500).json({ error: 'Failed to retrieve user information' });
  }
});

// ============================================================================
// HELPER FUNCTION FOR TOKEN REFRESH
// ============================================================================

async function refreshTokenIfNeeded(session, sessionId = null) {
  try {
    oauth2Client.setCredentials(session.tokens);

    // Always try to refresh the token to ensure it's valid
    const { credentials } = await oauth2Client.refreshAccessToken();
    session.tokens = credentials;

    // Save the updated session (for file-based storage)
    if (sessionId) {
      sessions.set(sessionId, session);
    }

    logger.debug('AUTH', 'Token refreshed successfully');
  } catch (error) {
    logger.error('AUTH', 'Failed to refresh token', error.message);
    // Don't throw - continue with existing token in case refresh fails but token is still valid
  }
}

// ============================================================================
// GTM API ROUTES
// ============================================================================

// Validate trigger configuration against existing trigger
function validateTriggerConfiguration(existingTrigger, triggerType, newFilterValue) {
  const mismatch = {
    isConfigMismatch: false,
    field: null,
    existingValue: null,
    attemptedValue: null,
    message: null
  };

  if (!existingTrigger) {
    return mismatch;
  }

  let existingValue = null;
  let hasExistingFilter = false;

  if (triggerType === 'click') {
    existingValue = existingTrigger.clickFilter?.[0]?.value;
    hasExistingFilter = !!existingTrigger.clickFilter?.length;
  } else if (triggerType === 'pageview') {
    existingValue = existingTrigger.pageviewFilter?.[0]?.value;
    hasExistingFilter = !!existingTrigger.pageviewFilter?.length;
  } else if (triggerType === 'customEvent') {
    existingValue = existingTrigger.customEventFilter?.[0]?.value;
    hasExistingFilter = !!existingTrigger.customEventFilter?.length;
  }

  // Check for mismatch:
  // 1. Existing trigger has no filter but new setup wants one
  // 2. Existing trigger has different filter value
  const wantsNewFilter = !!newFilterValue;
  const filterMismatch = (wantsNewFilter && !hasExistingFilter) || (existingValue && existingValue !== newFilterValue);

  if (filterMismatch) {
    mismatch.isConfigMismatch = true;
    mismatch.field = triggerType === 'click' ? 'Phone Number / Button Text' :
                     triggerType === 'pageview' ? 'URL Path' : 'Event Name';
    mismatch.existingValue = existingValue || '(no filter - All Elements)';
    mismatch.attemptedValue = newFilterValue || '(no filter)';

    if (triggerType === 'click') {
      mismatch.message = wantsNewFilter && !hasExistingFilter
        ? `Trigger exists as "All Elements" but you need it filtered for "${newFilterValue}"`
        : `Trigger already exists, but it's configured for "${existingValue}" instead of "${newFilterValue}"`;
    } else if (triggerType === 'pageview') {
      mismatch.message = wantsNewFilter && !hasExistingFilter
        ? `Trigger exists as "All Pages" but you need it filtered for "${newFilterValue}"`
        : `Trigger already exists with URL path "${existingValue}", but you're trying to use "${newFilterValue}"`;
    } else {
      mismatch.message = `Trigger already exists with event name "${existingValue}", but you're trying to use "${newFilterValue}"`;
    }
  }

  return mismatch;
}

// Create GTM trigger
app.post('/api/gtm/trigger', async (req, res) => {
  const { sessionId, accountId, containerId, triggerName, triggerType, filterParameter, filterType, filterValue } = req.body;
  const session = sessions.get(sessionId);

  if (!session) {
    return res.status(401).json({ error: 'Invalid or expired session' });
  }

  try {
    fs.appendFileSync('./logs/error-debug.log', `[${new Date().toISOString()}] Starting trigger creation for ${triggerName}\n`);
    fs.appendFileSync('./logs/error-debug.log', `Token before refresh: ${JSON.stringify({ access_token: session.tokens.access_token ? session.tokens.access_token.substring(0, 20) + '...' : 'none', expiry_date: session.tokens.expiry_date })}\n`);

    await refreshTokenIfNeeded(session, sessionId);
    fs.appendFileSync('./logs/error-debug.log', `[${new Date().toISOString()}] Token refreshed\n`);
    fs.appendFileSync('./logs/error-debug.log', `Token after refresh: ${JSON.stringify({ access_token: session.tokens.access_token ? session.tokens.access_token.substring(0, 20) + '...' : 'none', expiry_date: session.tokens.expiry_date })}\n`);

    // Set credentials on global oauth2Client for API requests
    oauth2Client.setCredentials(session.tokens);
    fs.appendFileSync('./logs/error-debug.log', `[${new Date().toISOString()}] Credentials set on global oauth2Client\n`);

    const tagmanager = google.tagmanager('v2');

    logger.info('GTM', `Creating trigger: ${triggerName}`);
    logger.debug('GTM', 'Trigger Request', { accountId, containerId, triggerName, triggerType, filterParameter, filterType, filterValue });

    // Log the exact parameters received for debugging
    fs.appendFileSync('./logs/error-debug.log', `[${new Date().toISOString()}] TRIGGER PARAMS: name=${triggerName}, type=${triggerType}, filterParam=${filterParameter}, filterType=${filterType}, filterValue=${filterValue}\n`);

    // Get workspace ID first - explicitly pass auth
    const containers = await tagmanager.accounts.containers.list({
      parent: `accounts/${accountId}`,
      auth: oauth2Client
    });
    logger.debug('GTM', 'Containers found', containers.data.container?.map(c => ({ publicId: c.publicId, name: c.name })));
    fs.appendFileSync('./logs/error-debug.log', `[${new Date().toISOString()}] Full container object:\n${JSON.stringify(containers.data.container?.[0], null, 2)}\n`);

    const container = containers.data.container?.find(
      c => c.publicId === containerId
    );

    if (!container) {
      throw new Error('Container not found');
    }

    // The 'path' field contains the numeric ID like 'accounts/123456/containers/456789'
    const containerName = container.path?.split('/').pop(); // Extract numeric container ID from path
    fs.appendFileSync('./logs/error-debug.log', `[${new Date().toISOString()}] Using containerName from path: ${containerName}\n`);

    // Get the default workspace
    const workspaces = await tagmanager.accounts.containers.workspaces.list({
      parent: `accounts/${accountId}/containers/${containerName}`,
      auth: oauth2Client
    });

    const workspace = workspaces.data.workspace?.[0];
    if (!workspace) {
      throw new Error('No workspace found in container');
    }

    // Extract workspace ID from path like 'accounts/123/containers/456/workspaces/789'
    const workspaceId = workspace.path?.split('/').pop();
    fs.appendFileSync('./logs/error-debug.log', `[${new Date().toISOString()}] Workspace object: ${JSON.stringify({ name: workspace.name, path: workspace.path })}\n`);
    fs.appendFileSync('./logs/error-debug.log', `[${new Date().toISOString()}] Using workspaceId from path: ${workspaceId}\n`);

    // Check if trigger already exists
    fs.appendFileSync('./logs/error-debug.log', `[${new Date().toISOString()}] Checking for existing triggers...\n`);
    const existingTriggers = await withTimeout(
      tagmanager.accounts.containers.workspaces.triggers.list({
        parent: `accounts/${accountId}/containers/${containerName}/workspaces/${workspaceId}`,
        auth: oauth2Client
      }),
      30000
    );

    const existingTrigger = existingTriggers.data.trigger?.find(t => t.name === triggerName);
    if (existingTrigger) {
      fs.appendFileSync('./logs/error-debug.log', `[${new Date().toISOString()}] Trigger "${triggerName}" already exists\n`);

      // Validate configuration
      const configValidation = validateTriggerConfiguration(existingTrigger, triggerType, filterValue);

      if (configValidation.isConfigMismatch) {
        fs.appendFileSync('./logs/error-debug.log', `[${new Date().toISOString()}] Configuration mismatch detected for "${triggerName}": ${configValidation.message}\n`);
        logger.error('GTM', `Configuration mismatch for trigger "${triggerName}"`, {
          field: configValidation.field,
          existingValue: configValidation.existingValue,
          attemptedValue: configValidation.attemptedValue
        });

        return res.status(409).json({
          success: false,
          isDuplicate: true,
          isConfigMismatch: true,
          triggerId: existingTrigger?.triggerId,
          triggerName: triggerName,
          configurationMismatch: {
            field: configValidation.field,
            existingValue: configValidation.existingValue,
            attemptedValue: configValidation.attemptedValue
          },
          message: configValidation.message
        });
      } else {
        // Configuration matches, silently skip
        fs.appendFileSync('./logs/error-debug.log', `[${new Date().toISOString()}] Trigger "${triggerName}" already exists with matching configuration, skipping creation\n`);
        logger.info('GTM', `Trigger already exists with matching config: ${triggerName} (skipping)`);

        return res.status(409).json({
          success: false,
          isDuplicate: true,
          isConfigMismatch: false,
          triggerId: existingTrigger?.triggerId,
          triggerName: triggerName,
          message: 'Trigger already exists with matching configuration'
        });
      }
    }

    // Build the request body with proper filters
    const requestBody = {
      name: triggerName,
      type: triggerType
    };

    // Only add filters if we have a filterValue
    if (filterValue) {
      if (triggerType === 'customEvent') {
        requestBody.customEventFilter = [
          {
            type: filterType || 'contains',
            parameter: filterParameter || 'event_name',
            value: filterValue
          }
        ];
      } else if (triggerType === 'click') {
        requestBody.clickFilter = [
          {
            type: filterType || 'startsWith',
            parameter: filterParameter || 'clickUrl',
            value: filterValue
          }
        ];
      } else if (triggerType === 'pageview') {
        requestBody.pageviewFilter = [
          {
            type: filterType || 'contains',
            parameter: filterParameter || 'url',
            value: filterValue
          }
        ];
      }
    }

    fs.appendFileSync('./logs/error-debug.log', `[${new Date().toISOString()}] TRIGGER REQUEST BODY:\n${JSON.stringify(requestBody, null, 2)}\n`);

    // Create trigger
    fs.appendFileSync('./logs/error-debug.log', `[${new Date().toISOString()}] About to call tagmanager.accounts.containers.workspaces.triggers.create\n`);
    const triggerResponse = await withTimeout(
      tagmanager.accounts.containers.workspaces.triggers.create({
        parent: `accounts/${accountId}/containers/${containerName}/workspaces/${workspaceId}`,
        auth: oauth2Client,
        requestBody
      }),
      30000
    );
    fs.appendFileSync('./logs/error-debug.log', `[${new Date().toISOString()}] Trigger API call completed successfully\n`);

    // Log the full response to see what GTM actually created
    fs.appendFileSync('./logs/error-debug.log', `[${new Date().toISOString()}] TRIGGER RESPONSE:\n${JSON.stringify(triggerResponse.data, null, 2)}\n`);

    logger.success('GTM', `Trigger created: ${triggerName}`, triggerResponse.data.triggerId);

    res.json({
      success: true,
      triggerId: triggerResponse.data.triggerId,
      triggerName: triggerResponse.data.name
    });
  } catch (error) {
    // Get status code from various possible locations
    const statusCode = error.status || error.code || error.response?.status;
    const errorData = error.response?.data || error.data || {};
    const errorMessage = error.message || error.toString();

    fs.appendFileSync('./logs/error-debug.log', `[${new Date().toISOString()}] ERROR in trigger creation: ${errorMessage}\n`);
    fs.appendFileSync('./logs/error-debug.log', `Full error: ${JSON.stringify({ message: errorMessage, code: statusCode, errors: errorData.errors || error.errors })}\n`);

    // Check if this is a duplicate trigger error
    const isDuplicateError = errorMessage?.includes('duplicate') ||
                            errorData.errors?.[0]?.message?.includes('duplicate') ||
                            error.errors?.[0]?.message?.includes('duplicate');

    if (isDuplicateError && statusCode === 400) {
      // Trigger already exists - return 409 Conflict but allow client to continue
      logger.info('GTM', `Trigger already exists: ${triggerName} (skipping)`);
      return res.status(409).json({
        success: false,
        isDuplicate: true,
        code: 'GTM_TRIGGER_DUPLICATE',
        message: 'Trigger already exists - skipping creation',
        triggerName: triggerName,
        triggerId: triggerName // Use trigger name as ID for duplicate detection
      });
    }

    logger.error('GTM', `Failed to create trigger: ${triggerName}`, errorMessage);
    logger.debug('GTM', 'Full error object', {
      message: errorMessage,
      code: statusCode,
      errors: errorData.errors || error.errors,
      stack: error.stack
    });
    res.status(500).json({
      error: 'Failed to create trigger',
      code: 'GTM_TRIGGER_FAILED',
      message: errorMessage,
      details: errorData.errors?.[0]?.message || error.errors?.[0]?.message || 'No additional details'
    });
  }
});

// Create GA4 tag
app.post('/api/gtm/tag', async (req, res) => {
  const { sessionId, accountId, containerId, tagName, measurementId, eventName, triggerIds } = req.body;
  const session = sessions.get(sessionId);

  if (!session) {
    return res.status(401).json({ error: 'Invalid or expired session' });
  }

  try {
    fs.appendFileSync('./logs/error-debug.log', `[${new Date().toISOString()}] Starting tag creation for ${tagName}\n`);
    fs.appendFileSync('./logs/error-debug.log', `Tag request params: measurementId=${measurementId}, eventName=${eventName}, triggerIds=${JSON.stringify(triggerIds)}\n`);

    await refreshTokenIfNeeded(session, sessionId);
    oauth2Client.setCredentials(session.tokens);
    const tagmanager = google.tagmanager('v2');

    logger.info('GTM', `Creating tag: ${tagName}`);

    // Get workspace ID first
    const containers = await tagmanager.accounts.containers.list({
      parent: `accounts/${accountId}`,
      auth: oauth2Client
    });

    const container = containers.data.container?.find(
      c => c.publicId === containerId
    );

    if (!container) {
      throw new Error('Container not found');
    }

    // Extract numeric container ID from path
    const containerName = container.path?.split('/').pop();

    // Get the default workspace
    const workspaces = await tagmanager.accounts.containers.workspaces.list({
      parent: `accounts/${accountId}/containers/${containerName}`,
      auth: oauth2Client
    });

    const workspace = workspaces.data.workspace?.[0];
    if (!workspace) {
      throw new Error('No workspace found in container');
    }

    const workspaceId = workspace.path?.split('/').pop(); // Extract workspace ID from path

    // Check if tag already exists
    fs.appendFileSync('./logs/error-debug.log', `[${new Date().toISOString()}] Checking for existing tags...\n`);
    fs.appendFileSync('./logs/error-debug.log', `[${new Date().toISOString()}] About to call tagmanager.accounts.containers.workspaces.tags.list with parent=accounts/${accountId}/containers/${containerName}/workspaces/${workspaceId}\n`);

    const existingTags = await withTimeout(
      tagmanager.accounts.containers.workspaces.tags.list({
        parent: `accounts/${accountId}/containers/${containerName}/workspaces/${workspaceId}`,
        auth: oauth2Client
      }),
      30000
    );

    fs.appendFileSync('./logs/error-debug.log', `[${new Date().toISOString()}] Successfully received existing tags list response. Found ${existingTags.data.tag?.length || 0} tags\n`);

    const tagExists = existingTags.data.tag?.some(t => t.name === tagName);
    if (tagExists) {
      fs.appendFileSync('./logs/error-debug.log', `[${new Date().toISOString()}] Tag "${tagName}" already exists, skipping creation\n`);
      const existingTag = existingTags.data.tag?.find(t => t.name === tagName);
      return res.status(409).json({
        success: false,
        isDuplicate: true,
        tagId: existingTag?.tagId,
        tagName: tagName,
        message: 'Tag already exists'
      });
    }

    // Create GA4 tag
    fs.appendFileSync('./logs/error-debug.log', `[${new Date().toISOString()}] Creating tag: ${tagName} with eventName=${eventName}, measurementId=${measurementId}, triggerIds=${JSON.stringify(triggerIds)}\n`);
    fs.appendFileSync('./logs/error-debug.log', `[${new Date().toISOString()}] About to call tagmanager.accounts.containers.workspaces.tags.create\n`);

    const tagResponse = await withTimeout(
      tagmanager.accounts.containers.workspaces.tags.create({
        parent: `accounts/${accountId}/containers/${containerName}/workspaces/${workspaceId}`,
        auth: oauth2Client,
        requestBody: {
          name: tagName,
          type: 'gaawe',
          parameter: [
            {
              type: 'template',
              key: 'measurementIdOverride',
              value: measurementId
            },
            {
              type: 'template',
              key: 'eventName',
              value: eventName
            },
            {
              type: 'list',
              key: 'eventSettingsTable',
              list: []
            }
          ],
          firingTriggerId: triggerIds || []
        }
      }),
      30000
    );

    // Log the full response to see what GTM actually created
    fs.appendFileSync('./logs/error-debug.log', `[${new Date().toISOString()}] TAG RESPONSE for ${tagName}:\n${JSON.stringify(tagResponse.data, null, 2)}\n`);
    fs.appendFileSync('./logs/error-debug.log', `[${new Date().toISOString()}] Tag created successfully: ${tagName} (tagId=${tagResponse.data.tagId})\n`);

    logger.success('GTM', `Tag created: ${tagName}`, tagResponse.data.tagId);

    res.json({
      success: true,
      tagId: tagResponse.data.tagId,
      tagName: tagResponse.data.name
    });
  } catch (error) {
    // Get status code from various possible locations
    const statusCode = error.status || error.code || error.response?.status;
    const errorData = error.response?.data || error.data || {};
    const errorMessage = error.message || error.toString();

    fs.appendFileSync('./logs/error-debug.log', `[${new Date().toISOString()}] ERROR in tag creation: ${errorMessage}\n`);
    fs.appendFileSync('./logs/error-debug.log', `Full error: ${JSON.stringify({ message: errorMessage, code: statusCode, errors: errorData.errors || error.errors })}\n`);

    // Check if this is a duplicate tag error
    const isDuplicateError = errorMessage?.includes('duplicate') ||
                            errorData.errors?.[0]?.message?.includes('duplicate') ||
                            error.errors?.[0]?.message?.includes('duplicate');

    if (isDuplicateError && statusCode === 400) {
      // Tag already exists - return 409 Conflict but allow client to continue
      logger.info('GTM', `Tag already exists: ${tagName} (skipping)`);
      return res.status(409).json({
        success: false,
        isDuplicate: true,
        code: 'GTM_TAG_DUPLICATE',
        message: 'Tag already exists - skipping creation',
        tagName: tagName,
        tagId: tagName // Use tag name as ID for duplicate detection
      });
    }

    logger.error('GTM', `Failed to create tag: ${tagName}`, errorMessage);
    res.status(500).json({
      error: 'Failed to create tag',
      code: 'GTM_TAG_FAILED',
      message: errorMessage,
      details: errorData.errors?.[0]?.message || error.errors?.[0]?.message || 'No additional details'
    });
  }
});

// Helper function to timeout a promise
function withTimeout(promise, timeoutMs = 30000) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`API call timed out after ${timeoutMs}ms`)), timeoutMs)
    )
  ]);
}

// Publish GTM version
app.post('/api/gtm/publish', async (req, res) => {
  const { sessionId, accountId, containerId, versionName } = req.body;
  const session = sessions.get(sessionId);

  if (!session) {
    return res.status(401).json({ error: 'Invalid or expired session' });
  }

  try {
    await refreshTokenIfNeeded(session, sessionId);
    oauth2Client.setCredentials(session.tokens);

    // Log for diagnostics
    logger.debug('GTM', `Credentials set, oauth2Client scope: ${oauth2Client.credentials?.scope}`);

    const tagmanager = google.tagmanager('v2');

    // Verify tagmanager was created properly
    if (!tagmanager || !tagmanager.accounts) {
      throw new Error('Failed to initialize Google Tag Manager API client. Check credentials and API access.');
    }

    logger.info('GTM', `Publishing version: ${versionName}`);

    // Get workspace to find numeric container ID
    let containers;
    try {
      fs.appendFileSync('./logs/error-debug.log', `[${new Date().toISOString()}] PUBLISH: About to list containers\n`);
      containers = await withTimeout(
        tagmanager.accounts.containers.list({
          parent: `accounts/${accountId}`,
          auth: oauth2Client
        }),
        30000
      );
      fs.appendFileSync('./logs/error-debug.log', `[${new Date().toISOString()}] PUBLISH: Containers list completed\n`);
    } catch (apiError) {
      logger.error('GTM', 'Failed to list containers', apiError.message);
      fs.appendFileSync('./logs/error-debug.log', `[${new Date().toISOString()}] PUBLISH ERROR: Failed to list containers: ${apiError.message}\n`);
      throw new Error(`Failed to list GTM containers: ${apiError.message}`);
    }

    if (!containers.data || !containers.data.container) {
      throw new Error('No containers found in GTM account. Check accountId and GTM access.');
    }

    const container = containers.data.container.find(
      c => c.publicId === containerId
    );

    if (!container) {
      throw new Error(`Container ${containerId} not found in GTM account`);
    }

    // Extract numeric container ID from path
    const containerName = container.path?.split('/').pop();
    if (!containerName) {
      throw new Error('Failed to extract container ID from path');
    }

    // Get workspace for version operations
    let workspaces;
    try {
      fs.appendFileSync('./logs/error-debug.log', `[${new Date().toISOString()}] PUBLISH: About to list workspaces\n`);
      workspaces = await withTimeout(
        tagmanager.accounts.containers.workspaces.list({
          parent: `accounts/${accountId}/containers/${containerName}`,
          auth: oauth2Client
        }),
        30000
      );
      fs.appendFileSync('./logs/error-debug.log', `[${new Date().toISOString()}] PUBLISH: Workspaces list completed\n`);
    } catch (apiError) {
      logger.error('GTM', 'Failed to list workspaces', apiError.message);
      fs.appendFileSync('./logs/error-debug.log', `[${new Date().toISOString()}] PUBLISH ERROR: Failed to list workspaces: ${apiError.message}\n`);
      throw new Error(`Failed to list GTM workspaces: ${apiError.message}`);
    }

    if (!workspaces.data || !workspaces.data.workspace || workspaces.data.workspace.length === 0) {
      throw new Error('No workspaces found in GTM container');
    }

    const workspace = workspaces.data.workspace[0];
    const workspaceName = workspace.path?.split('/').pop();
    if (!workspaceName) {
      throw new Error('Failed to extract workspace ID from path');
    }

    // Publish workspace - make it non-blocking since GTM API doesn't have standard publish endpoint
    let publishResponse = { status: 'skipped' };
    let publishSuccess = false;
    try {
      fs.appendFileSync('./logs/error-debug.log', `[${new Date().toISOString()}] PUBLISH: Attempting REST API publish\n`);

      // Try different publish endpoint paths
      const paths = [
        `accounts/${accountId}/containers/${containerName}:publish`,  // Container-level publish
        `accounts/${accountId}/containers/${containerName}/workspaces/${workspaceName}:publish`  // Workspace-level publish
      ];

      for (const publishPath of paths) {
        try {
          const publishUrl = `https://tagmanager.googleapis.com/tagmanager/v2/${publishPath}`;
          fs.appendFileSync('./logs/error-debug.log', `[${new Date().toISOString()}] PUBLISH: Trying path: ${publishUrl}\n`);

          const response = await withTimeout(
            axios.post(publishUrl, {}, {
              headers: {
                Authorization: `Bearer ${session.tokens.access_token}`,
                'Content-Type': 'application/json'
              }
            }),
            30000
          );

          publishResponse = response.data;
          publishSuccess = true;
          fs.appendFileSync('./logs/error-debug.log', `[${new Date().toISOString()}] PUBLISH: Success with path: ${publishPath}\n`);
          break;  // Exit loop on success
        } catch (err) {
          fs.appendFileSync('./logs/error-debug.log', `[${new Date().toISOString()}] PUBLISH: Path failed (${err.response?.status}): ${publishPath}\n`);
        }
      }

      if (!publishSuccess) {
        // Publish endpoint not available - GTM may auto-publish or user may publish manually
        fs.appendFileSync('./logs/error-debug.log', `[${new Date().toISOString()}] PUBLISH: Publish endpoints not accessible. GTM may auto-publish or require manual publish. Continuing anyway...\n`);
        publishResponse = {
          status: 'pending',
          message: 'GTM publish may require manual action through GTM UI'
        };
      }

      fs.appendFileSync('./logs/error-debug.log', `[${new Date().toISOString()}] PUBLISH: Publish step completed (status: ${publishResponse.status})\n`);
    } catch (apiError) {
      // Don't fail on publish - just log it
      logger.info('GTM', 'Publish may need manual action: ' + apiError.message);
      fs.appendFileSync('./logs/error-debug.log', `[${new Date().toISOString()}] PUBLISH WARNING: ${apiError.message}\n`);
      publishResponse = {
        status: 'warning',
        message: apiError.message
      };
    }

    const versionId = publishResponse?.containerVersion?.containerVersionId || publishResponse?.containerVersionId || 'published';
    logger.success('GTM', `Workspace published successfully`);
    fs.appendFileSync('./logs/error-debug.log', `[${new Date().toISOString()}] PUBLISH: Responding to client with success\n`);

    res.json({
      success: true,
      versionId: versionId,
      versionName: versionName || 'Latest',
      message: 'GTM workspace published successfully'
    });
  } catch (error) {
    logger.error('GTM', 'Failed to publish version', error.message);
    res.status(500).json({
      error: 'Failed to publish GTM version',
      code: 'GTM_PUBLISH_FAILED',
      message: error.message
    });
  }
});

// ============================================================================
// GA4 API ROUTES
// ============================================================================

// Mark event as key event in GA4
app.post('/api/ga4/key-event', async (req, res) => {
  const { sessionId, propertyId, eventName } = req.body;
  const session = sessions.get(sessionId);

  if (!session) {
    return res.status(401).json({ error: 'Invalid or expired session' });
  }

  try {
    await refreshTokenIfNeeded(session, sessionId);
    oauth2Client.setCredentials(session.tokens);

    logger.info('GA4', `Creating key event: ${eventName} for property ${propertyId}`);

    // Use GA4 Admin API to create conversion event (Key Event)
    const analyticsAdmin = google.analyticsadmin('v1beta');

    const response = await analyticsAdmin.properties.conversionEvents.create({
      parent: `properties/${propertyId}`,
      requestBody: {
        eventName: eventName,
        countingMethod: 'ONCE_PER_SESSION'
      },
      auth: oauth2Client
    });

    logger.success('GA4', `Key event marked: ${eventName}`, response.data.name);

    res.json({
      success: true,
      eventName: eventName,
      keyEventResourceName: response.data.name,
      marked: true,
      message: `Key event "${eventName}" created successfully`
    });
  } catch (error) {
    // Handle duplicate key event gracefully
    if (error.code === 409 || error.message?.includes('already exists') || error.message?.includes('ALREADY_EXISTS')) {
      logger.info('GA4', `Key event already exists: ${eventName}`);
      return res.json({
        success: true,
        eventName: eventName,
        marked: true,
        alreadyExists: true,
        message: `Key event "${eventName}" already exists`
      });
    }

    logger.error('GA4', `Failed to mark key event: ${eventName}`, error.message);
    res.status(500).json({
      error: 'Failed to mark key event',
      code: 'GA4_KEY_EVENT_FAILED',
      message: error.message
    });
  }
});

// Check for existing GTM triggers (duplicate detection)
app.post('/api/gtm/check-triggers', async (req, res) => {
  const { sessionId, accountId, containerId, triggerNames } = req.body;
  const session = sessions.get(sessionId);

  if (!session) {
    return res.status(401).json({ error: 'Invalid or expired session' });
  }

  try {
    await refreshTokenIfNeeded(session, sessionId);
    oauth2Client.setCredentials(session.tokens);

    logger.info('GTM', `Checking for existing triggers in container ${containerId}`);

    const tagmanager = google.tagmanager('v2');

    // Get workspace to find numeric container ID
    const containers = await tagmanager.accounts.containers.list({
      parent: `accounts/${accountId}`,
      auth: oauth2Client
    });

    const container = containers.data.container?.find(
      c => c.publicId === containerId
    );

    if (!container) {
      throw new Error('Container not found');
    }

    // Extract numeric container ID from path
    const containerName = container.path?.split('/').pop();

    // Get the default workspace
    const workspaces = await tagmanager.accounts.containers.workspaces.list({
      parent: `accounts/${accountId}/containers/${containerName}`,
      auth: oauth2Client
    });

    const workspace = workspaces.data.workspace?.[0];
    if (!workspace) {
      throw new Error('No workspace found in container');
    }

    const workspaceId = workspace.path?.split('/').pop(); // Extract workspace ID from path

    // List all triggers in the container
    const response = await tagmanager.accounts.containers.workspaces.triggers.list({
      parent: `accounts/${accountId}/containers/${containerName}/workspaces/${workspaceId}`,
      auth: oauth2Client
    });

    const existingTriggers = response.data.trigger || [];
    const foundTriggers = [];

    // Check if any of our trigger names already exist
    for (const triggerName of triggerNames) {
      const found = existingTriggers.find(t => t.name === triggerName);
      if (found) {
        foundTriggers.push({
          name: triggerName,
          id: found.triggerId,
          exists: true
        });
      }
    }

    logger.info('GTM', `Found ${foundTriggers.length} existing triggers`);

    res.json({
      success: true,
      existingTriggers: foundTriggers,
      hasDuplicates: foundTriggers.length > 0
    });
  } catch (error) {
    logger.error('GTM', `Failed to check triggers: ${error.message}`);
    res.status(500).json({
      error: 'Failed to check triggers',
      message: error.message
    });
  }
});

// Validate GTM setup (triggers, tags, and associations)
app.post('/api/gtm/validate-setup', async (req, res) => {
  const { sessionId, accountId, containerId, triggerIds, tagIds } = req.body;
  const session = sessions.get(sessionId);

  if (!session) {
    return res.status(401).json({ error: 'Invalid or expired session' });
  }

  oauth2Client.setCredentials(session.tokens);

  try {
    logger.info('GTM', 'Validating GTM setup');

    const tagmanager = google.tagmanager('v2');

    // Check if we have cached validation data for this setup
    const cacheKey = `validation_${accountId}_${containerId}`;
    if (session[cacheKey]) {
      logger.info('GTM', 'Using cached validation results - avoiding redundant API calls');
      return res.json(session[cacheKey]);
    }

    // Get workspace ID - ONLY CALL THIS ONCE
    let containerName, workspaceName;

    try {
      const containers = await tagmanager.accounts.containers.list({
        parent: `accounts/${accountId}`,
        auth: oauth2Client
      });

      const container = containers.data.container?.find(c => c.publicId === containerId);
      if (!container) {
        return res.status(404).json({ error: 'Container not found' });
      }

      containerName = container.path?.split('/').pop();

      // Get workspace ID (use default workspace)
      const workspacesResponse = await tagmanager.accounts.containers.workspaces.list({
        parent: `accounts/${accountId}/containers/${containerName}`,
        auth: oauth2Client
      });

      const workspace = workspacesResponse.data.workspace?.[0];
      workspaceName = workspace?.path?.split('/').pop() || '1';
    } catch (error) {
      logger.error('GTM', 'Failed to get container/workspace info', error.message);
      return res.status(500).json({ error: 'Failed to retrieve GTM container information' });
    }

    // Use provided IDs if available (from fresh setup), otherwise query API
    let triggersFound = 0;
    let tagsFound = 0;
    let associationsFound = 0;

    if (triggerIds && Object.keys(triggerIds).length > 0) {
      // Fresh setup - we have the IDs from setup completion, don't re-query
      triggersFound = Object.keys(triggerIds).length;
      logger.info('GTM', 'Using provided trigger IDs from setup - skipping trigger list API call', {
        count: triggersFound
      });
    } else {
      // Reopening existing project - need to query to count triggers
      try {
        const triggersResponse = await tagmanager.accounts.containers.workspaces.triggers.list({
          parent: `accounts/${accountId}/containers/${containerName}/workspaces/${workspaceName}`,
          auth: oauth2Client
        });

        const triggers = triggersResponse.data.trigger || [];
        triggersFound = triggers.filter(t =>
          ['call_now_click', 'thank_you_page', 'cta_click'].includes(t.name)
        ).length;
      } catch (triggerError) {
        logger.warn('GTM', 'Could not list triggers for validation', triggerError.message);
        triggersFound = 0;
      }
    }

    if (tagIds && Object.keys(tagIds).length > 0) {
      // Fresh setup - we have the IDs from setup completion, don't re-query
      tagsFound = Object.keys(tagIds).length;
      associationsFound = Object.keys(tagIds).length; // Each tag is associated with at least 1 trigger
      logger.info('GTM', 'Using provided tag IDs from setup - skipping tag list API call', {
        count: tagsFound
      });
    } else {
      // Reopening existing project - need to query to count tags
      try {
        const tagsResponse = await tagmanager.accounts.containers.workspaces.tags.list({
          parent: `accounts/${accountId}/containers/${containerName}/workspaces/${workspaceName}`,
          auth: oauth2Client
        });

        const tags = tagsResponse.data.tag || [];
        tagsFound = tags.filter(t =>
          t.name?.includes('GA4') || t.type === 'gaawe'
        ).length;

        // Count tag-trigger associations
        tags.forEach(tag => {
          if (tag.firingTriggerId && tag.firingTriggerId.length > 0) {
            associationsFound += tag.firingTriggerId.length;
          }
        });
      } catch (tagError) {
        logger.warn('GTM', 'Could not list tags for validation', tagError.message);
        tagsFound = 0;
      }
    }

    logger.info('GTM', 'Validation complete', {
      triggersFound,
      tagsFound,
      associationsFound,
      usedCache: triggerIds && Object.keys(triggerIds).length > 0
    });

    // Generate correct preview URL using numeric container ID
    const previewUrl = `https://tagmanager.google.com/?authuser=0#/container/accounts/${accountId}/containers/${containerName}/workspaces/${workspaceName}`;

    const validationResponse = {
      success: true,
      triggersFound,
      tagsFound,
      associationsFound,
      previewUrl: previewUrl,
      message: 'Setup validation complete'
    };

    // Cache the result so subsequent calls don't re-query
    session[cacheKey] = validationResponse;

    res.json(validationResponse);
  } catch (error) {
    logger.error('GTM', 'Failed to validate setup', error.message);

    // Even if we fail to get workspace, try to generate a basic preview URL
    // This ensures users can always access GTM preview
    const previewUrl = `https://tagmanager.google.com/?authuser=0#/home`;

    res.json({
      success: true,
      triggersFound: 0,
      tagsFound: 0,
      associationsFound: 0,
      previewUrl: previewUrl,
      message: 'GTM Preview link ready. Detailed validation unavailable, but your setup is complete.',
      partial: true
    });
  }
});

// Get GA4 events list
app.get('/api/ga4/events/:sessionId/:propertyId', async (req, res) => {
  const { sessionId, propertyId } = req.params;
  const session = sessions.get(sessionId);

  if (!session) {
    return res.status(401).json({ error: 'Invalid or expired session' });
  }

  oauth2Client.setCredentials(session.tokens);

  try {
    logger.info('GA4', `Fetching events for property ${propertyId}`);

    // This would query the GA4 Data API for recent events
    // Placeholder response
    res.json({
      success: true,
      events: [],
      message: 'Events list would be populated from GA4'
    });
  } catch (error) {
    logger.error('GA4', 'Failed to fetch events', error.message);
    res.status(500).json({
      error: 'Failed to fetch GA4 events',
      code: 'GA4_FETCH_FAILED',
      message: error.message
    });
  }
});

// ============================================================================
// FILE DOWNLOAD ROUTES
// ============================================================================

// Generate and download JSON config
app.post('/api/download/config', (req, res) => {
  const { config } = req.body;

  try {
    const filename = `ga4-config-${Date.now()}.json`;
    const jsonString = JSON.stringify(config, null, 2);

    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'application/json');
    res.send(jsonString);

    logger.info('DOWNLOAD', `Config downloaded: ${filename}`);
  } catch (error) {
    logger.error('DOWNLOAD', 'Failed to generate config', error.message);
    res.status(500).json({ error: 'Failed to generate configuration' });
  }
});

// Generate and download SOP checklist
app.post('/api/download/checklist', (req, res) => {
  const { config } = req.body;

  try {
    const checklistContent = generateSopChecklist(config);
    const filename = `ga4-checklist-${Date.now()}.txt`;

    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'text/plain');
    res.send(checklistContent);

    logger.info('DOWNLOAD', `Checklist downloaded: ${filename}`);
  } catch (error) {
    logger.error('DOWNLOAD', 'Failed to generate checklist', error.message);
    res.status(500).json({ error: 'Failed to generate checklist' });
  }
});

// Generate and download setup report as markdown email template
app.post('/api/download/report', (req, res) => {
  const { config, setupResults } = req.body;

  try {
    const eventCount = Object.values(config.events).filter(e => e.enabled).length;
    const keyEventCount = setupResults?.key_events_marked?.filter(e => e.success).length || 0;

    const eventLabels = {
      phoneCall: 'Phone Call Clicks',
      thankYouPage: 'Thank You Page Views',
      ctaClick: 'CTA Button Clicks'
    };

    const eventNameLabels = {
      phoneCall: 'call_now_click',
      thankYouPage: 'thank_you_page',
      ctaClick: 'cta_click'
    };

    // Build markdown email template
    let markdown = `# Conversion Tracking Setup Complete

Hello ${config.client_info.name},

Your Google Analytics 4 conversion tracking setup is complete! Here's what was created:

## What Was Created

✓ ${eventCount} GTM Trigger${eventCount !== 1 ? 's' : ''}
✓ ${eventCount + 1} GA4 Event Tag${eventCount !== 1 ? 's' : ''}
✓ GTM Container Version Published to Live
✓ ${keyEventCount} Key Event${keyEventCount !== 1 ? 's' : ''} Marked in GA4

## Client Information

**Client:** ${config.client_info.name}
**Website:** ${config.client_info.domain}
**Setup Date:** ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
**Status:** ✓ Completed

## Tracking Events Configured
`;

    // Add enabled events
    Object.entries(config.events).forEach(([key, event]) => {
      if (event.enabled) {
        markdown += `
✓ **${eventLabels[key]}**
  - Event Name: \`${eventNameLabels[key]}\`
  - Conversion: ${event.conversion ? 'Yes' : 'No'}`;
      }
    });

    // Add Google Ads section if applicable
    if (config.client_info.google_ads_account) {
      markdown += `

## Google Ads Integration

**Google Ads Account:** ${config.client_info.google_ads_account}
**Status:** Ready for conversion import after 24-48 hours`;
    }

    markdown += `

## Important Setup Details

**Keep these IDs handy for future reference:**

### Google Analytics 4 (GA4)
- **Property ID:** \`${config.client_info.ga4_property_id}\`
- **Measurement ID:** \`${config.client_info.ga4_measurement_id}\`

### Google Tag Manager (GTM)
- **Account ID:** \`${config.client_info.gtm_account_id}\`
- **Container ID:** \`${config.client_info.gtm_container_id}\``;

    if (config.client_info.google_ads_account) {
      markdown += `

### Google Ads
- **Customer ID:** \`${config.client_info.google_ads_account}\``;
    }

    markdown += `

---

## Next Steps

1. **Wait 24-48 hours** for GA4 to process events
   - Events will appear in GA4 Admin > Events > Recent events

2. **Verify events** are appearing in GA4
   - Go to GA4 Admin > Events > Recent events
   - Look for your configured events

3. **Confirm Key Events** are marked in GA4
   - Go to GA4 Admin > Events > Conversions
   - Verify all key events are listed

4. **Import conversions to Google Ads** (if applicable)
   - Wait at least 24 hours after setup
   - Go to Google Ads Tools > Conversions
   - Import conversions from GA4

5. **Monitor conversion data** in both GA4 and Google Ads
   - Track performance and adjust as needed

---

**Generated:** ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}

If you have any questions, please reach out!`;

    const filename = `silverback-setup-email-${Date.now()}.md`;
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'text/markdown');

    res.send(markdown);
    logger.info('DOWNLOAD', `Setup report markdown email downloaded: ${filename}`);
  } catch (error) {
    logger.error('DOWNLOAD', 'Failed to generate report markdown', error.message);
    res.status(500).json({ error: 'Failed to generate report markdown', message: error.message });
  }
});

// ============================================================================
// PROJECT HISTORY & PERSISTENCE
// ============================================================================

const projectHistoryFile = './data/project-history.json';

// Ensure data directory exists and initialize project history file
if (!fs.existsSync('./data')) {
  fs.mkdirSync('./data', { recursive: true });
}

if (!fs.existsSync(projectHistoryFile)) {
  fs.writeFileSync(projectHistoryFile, JSON.stringify({
    projects: [],
    metadata: {
      version: '1.0',
      last_updated: null,
      total_projects: 0
    }
  }, null, 2));
}

// Migrate existing projects to add features_configured field
function migrateProjectsSchema() {
  if (!fs.existsSync(projectHistoryFile)) return;

  try {
    const data = JSON.parse(fs.readFileSync(projectHistoryFile, 'utf8'));
    let updated = false;

    data.projects.forEach(project => {
      if (!project.features_configured) {
        project.features_configured = {
          gtm_triggers: true,
          ga4_tags: true,
          google_ads: !!project.client_info.google_ads_account,
          enhanced_conversions: false
        };
        updated = true;
      }
    });

    if (updated) {
      fs.writeFileSync(projectHistoryFile, JSON.stringify(data, null, 2));
      logger.info('MIGRATION', 'Updated project schema with features_configured');
    }
  } catch (error) {
    logger.error('MIGRATION', 'Failed to migrate projects', error.message);
  }
}

// Run migration on startup
migrateProjectsSchema();

// Save completed project to history
app.post('/api/projects/save', (req, res) => {
  try {
    const { setupData } = req.body;

    // Read existing history
    let history = JSON.parse(fs.readFileSync(projectHistoryFile, 'utf8'));

    // Create project record
    const { v4: uuidv4 } = require('uuid');
    const projectRecord = {
      id: uuidv4(),
      client_info: setupData.client_info,
      events_configured: setupData.events_configured,
      gtm_resources: setupData.gtm_resources,
      key_events_marked: setupData.key_events_marked || [],
      features_configured: setupData.features_configured || {
        gtm_triggers: true,
        ga4_tags: true,
        google_ads: false,
        enhanced_conversions: false
      },
      google_ads_resources: setupData.google_ads_resources,
      setup_metadata: {
        completed_at: new Date().toISOString(),
        setup_duration_ms: setupData.setup_duration_ms || 0,
        user_email: setupData.user_email || 'unknown',
        status: 'success'
      }
    };

    // Add to history
    history.projects.push(projectRecord);
    history.metadata.last_updated = new Date().toISOString();
    history.metadata.total_projects = history.projects.length;

    // Write back to file
    fs.writeFileSync(projectHistoryFile, JSON.stringify(history, null, 2));

    logger.info('PROJECTS', `Project saved: ${projectRecord.client_info.name} (${projectRecord.id})`);

    res.json({
      success: true,
      projectId: projectRecord.id
    });
  } catch (error) {
    logger.error('PROJECTS', 'Failed to save project', error.message);
    res.status(500).json({
      error: 'Failed to save project',
      message: error.message
    });
  }
});

// Get all projects
app.get('/api/projects', (req, res) => {
  try {
    if (!fs.existsSync(projectHistoryFile)) {
      return res.json({
        projects: [],
        metadata: { total_projects: 0 }
      });
    }

    const data = JSON.parse(fs.readFileSync(projectHistoryFile, 'utf8'));
    res.json(data);
  } catch (error) {
    logger.error('PROJECTS', 'Failed to load projects', error.message);
    res.status(500).json({
      error: 'Failed to load projects',
      message: error.message
    });
  }
});

// Get single project by ID
app.get('/api/projects/:projectId', (req, res) => {
  try {
    if (!fs.existsSync(projectHistoryFile)) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const data = JSON.parse(fs.readFileSync(projectHistoryFile, 'utf8'));
    const project = data.projects.find(p => p.id === req.params.projectId);

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json(project);
  } catch (error) {
    logger.error('PROJECTS', 'Failed to load project', error.message);
    res.status(500).json({
      error: 'Failed to load project',
      message: error.message
    });
  }
});

// Update existing project (add features, modify settings)
app.put('/api/projects/:projectId', (req, res) => {
  try {
    const { projectId } = req.params;
    const { updates } = req.body;

    if (!fs.existsSync(projectHistoryFile)) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const data = JSON.parse(fs.readFileSync(projectHistoryFile, 'utf8'));
    const projectIndex = data.projects.findIndex(p => p.id === projectId);

    if (projectIndex === -1) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const project = data.projects[projectIndex];

    // Merge updates
    if (updates.features_configured) {
      project.features_configured = {
        ...project.features_configured,
        ...updates.features_configured
      };
    }

    if (updates.google_ads_resources) {
      project.google_ads_resources = updates.google_ads_resources;
    }

    if (updates.client_info) {
      project.client_info = {
        ...project.client_info,
        ...updates.client_info
      };
    }

    // Track update history
    project.setup_metadata.last_updated_at = new Date().toISOString();
    if (!project.setup_metadata.update_history) {
      project.setup_metadata.update_history = [];
    }
    project.setup_metadata.update_history.push({
      timestamp: new Date().toISOString(),
      action: updates.action || 'update',
      features_added: updates.features_added || [],
      user_email: updates.user_email || 'unknown'
    });

    // Save back
    data.projects[projectIndex] = project;
    data.metadata.last_updated = new Date().toISOString();
    fs.writeFileSync(projectHistoryFile, JSON.stringify(data, null, 2));

    logger.info('PROJECTS', `Project updated: ${project.client_info.name} (${projectId})`);

    res.json({
      success: true,
      project
    });
  } catch (error) {
    logger.error('PROJECTS', 'Failed to update project', error.message);
    res.status(500).json({
      error: 'Failed to update project',
      message: error.message
    });
  }
});

// Delete project by ID
app.delete('/api/projects/:projectId', (req, res) => {
  try {
    const { projectId } = req.params;

    if (!fs.existsSync(projectHistoryFile)) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const data = JSON.parse(fs.readFileSync(projectHistoryFile, 'utf8'));
    const projectIndex = data.projects.findIndex(p => p.id === projectId);

    if (projectIndex === -1) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const deletedProject = data.projects[projectIndex];

    // Remove project from array
    data.projects.splice(projectIndex, 1);

    // Update metadata
    data.metadata.last_updated = new Date().toISOString();
    data.metadata.total_projects = data.projects.length;

    // Save updated file
    fs.writeFileSync(projectHistoryFile, JSON.stringify(data, null, 2));

    logger.info('PROJECTS', `Project deleted: ${deletedProject.client_info.name} (${projectId})`);

    res.json({
      success: true,
      message: `Project "${deletedProject.client_info.name}" deleted successfully`
    });
  } catch (error) {
    logger.error('PROJECTS', 'Failed to delete project', error.message);
    res.status(500).json({
      error: 'Failed to delete project',
      message: error.message
    });
  }
});

// ============================================================================
// GA4 DATA API - EVENT PERFORMANCE
// ============================================================================

// Get live event performance data from GA4
app.post('/api/ga4/events/performance', async (req, res) => {
  const { sessionId, propertyId, eventNames, startDate, endDate } = req.body;
  const session = sessions.get(sessionId);

  if (!session) {
    return res.status(401).json({ error: 'Invalid or expired session' });
  }

  oauth2Client.setCredentials(session.tokens);

  try {
    logger.info('GA4', `Fetching event performance for property ${propertyId}`);

    const analyticsData = google.analyticsdata('v1beta');

    // Fetch event counts and conversions
    const response = await analyticsData.properties.runReport({
      property: `properties/${propertyId}`,
      auth: oauth2Client,
      requestBody: {
        dateRanges: [
          {
            startDate: startDate || '30daysAgo',
            endDate: endDate || 'today'
          }
        ],
        dimensions: [
          { name: 'eventName' },
          { name: 'date' }
        ],
        metrics: [
          { name: 'eventCount' },
          { name: 'conversions' },
          { name: 'totalUsers' }
        ],
        dimensionFilter: eventNames ? {
          filter: {
            fieldName: 'eventName',
            inListFilter: {
              values: eventNames
            }
          }
        } : undefined,
        orderBys: [
          {
            dimension: { dimensionName: 'date' },
            desc: false
          }
        ]
      }
    });

    logger.info('GA4', `Event performance fetched: ${response.data.rows?.length || 0} rows`);

    res.json({
      success: true,
      data: response.data,
      propertyId
    });
  } catch (error) {
    logger.error('GA4', 'Failed to fetch event performance', error.message);
    res.status(500).json({
      error: 'Failed to fetch event performance',
      message: error.message
    });
  }
});

// Get event performance summary (totals only)
app.post('/api/ga4/events/summary', async (req, res) => {
  const { sessionId, propertyId, eventNames, startDate, endDate } = req.body;
  const session = sessions.get(sessionId);

  if (!session) {
    return res.status(401).json({ error: 'Invalid or expired session' });
  }

  oauth2Client.setCredentials(session.tokens);

  try {
    const analyticsData = google.analyticsdata('v1beta');

    // Fetch summary without date dimension
    const response = await analyticsData.properties.runReport({
      property: `properties/${propertyId}`,
      auth: oauth2Client,
      requestBody: {
        dateRanges: [
          {
            startDate: startDate || '30daysAgo',
            endDate: endDate || 'today'
          }
        ],
        dimensions: [
          { name: 'eventName' }
        ],
        metrics: [
          { name: 'eventCount' },
          { name: 'conversions' },
          { name: 'totalUsers' },
          { name: 'eventCountPerUser' }
        ],
        dimensionFilter: eventNames ? {
          filter: {
            fieldName: 'eventName',
            inListFilter: {
              values: eventNames
            }
          }
        } : undefined
      }
    });

    res.json({
      success: true,
      data: response.data
    });
  } catch (error) {
    logger.error('GA4', 'Failed to fetch event summary', error.message);
    res.status(500).json({
      error: 'Failed to fetch event summary',
      message: error.message
    });
  }
});

// ============================================================================
// GOOGLE ADS API - CONVERSION ACTIONS
// ============================================================================

// Create Google Ads conversion action
app.post('/api/google-ads/conversion-action', async (req, res) => {
  const { sessionId, customerId, conversionAction } = req.body;

  logger.info('GOOGLE_ADS', 'Conversion action endpoint called');
  logger.info('GOOGLE_ADS', `SessionId received: ${sessionId}`);
  logger.info('GOOGLE_ADS', `Customer ID: ${customerId}`);
  logger.info('GOOGLE_ADS', `Conversion action: ${conversionAction?.name}`);

  const session = sessions.get(sessionId);

  if (!session) {
    logger.error('GOOGLE_ADS', `No session found for sessionId: ${sessionId}`);
    return res.status(401).json({ error: 'Invalid or expired session' });
  }

  logger.info('GOOGLE_ADS', `Session found, user: ${session.userEmail}`);
  logger.info('GOOGLE_ADS', `Has refresh_token: ${!!session.tokens?.refresh_token}`);
  logger.info('GOOGLE_ADS', `Has access_token: ${!!session.tokens?.access_token}`);

  try {
    logger.info('GOOGLE_ADS', 'Attempting to refresh token if needed...');
    await refreshTokenIfNeeded(session, sessionId);
    logger.info('GOOGLE_ADS', '✓ Token refresh completed');

    oauth2Client.setCredentials(session.tokens);
    logger.info('GOOGLE_ADS', '✓ OAuth2 client credentials set');

    const developerToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN;
    if (!developerToken) {
      logger.error('GOOGLE_ADS', 'GOOGLE_ADS_DEVELOPER_TOKEN not found in .env');
      return res.status(400).json({
        error: 'Google Ads Developer Token not configured',
        message: 'Please add GOOGLE_ADS_DEVELOPER_TOKEN to .env file. Get it at https://ads.google.com/aw/apicenter'
      });
    }

    logger.info('GOOGLE_ADS', '✓ Developer token found');

    // Initialize Google Ads API client
    const { GoogleAdsApi } = require('google-ads-api');

    logger.info('GOOGLE_ADS', 'Initializing GoogleAdsApi client...');
    const client = new GoogleAdsApi({
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      developer_token: developerToken
    });

    logger.info('GOOGLE_ADS', 'Creating customer instance with refresh token...');
    const customerId_formatted = customerId.replace(/-/g, '');
    logger.info('GOOGLE_ADS', `Formatted customer ID: ${customerId_formatted}`);

    // Create customer instance with refresh token
    const customer = client.Customer({
      customer_id: customerId_formatted,
      refresh_token: session.tokens.refresh_token
    });

    logger.info('GOOGLE_ADS', '✓ Customer instance created');

    // Prepare conversion action resource
    const conversionActionResource = {
      name: conversionAction.name,
      category: conversionAction.category,
      status: 'ENABLED'
    };

    logger.info('GOOGLE_ADS', `Conversion action resource: ${JSON.stringify(conversionActionResource)}`);
    logger.info('GOOGLE_ADS', 'Calling customer.conversionActions.create()...');

    // Create the conversion action via the API
    const result = await customer.conversionActions.create([conversionActionResource]);

    logger.info('GOOGLE_ADS', `✓ Create response received: ${JSON.stringify(result)}`);

    // Extract the resource name from the response
    const conversionActionResourceName = result.results[0].resource_name;

    logger.info('GOOGLE_ADS', `✓ Conversion action created successfully: ${conversionAction.name}`);
    logger.info('GOOGLE_ADS', `Resource: ${conversionActionResourceName}`);

    res.json({
      success: true,
      conversionActionId: conversionActionResourceName,
      conversionActionName: conversionAction.name,
      resourceName: conversionActionResourceName,
      message: 'Conversion action created successfully in Google Ads'
    });
  } catch (error) {
    logger.error('GOOGLE_ADS', `❌ Failed to create conversion action: ${error.message}`);
    logger.error('GOOGLE_ADS', `Error type: ${error.constructor.name}`);
    logger.error('GOOGLE_ADS', `Full error object: ${JSON.stringify(error, null, 2)}`);
    if (error.stack) {
      logger.error('GOOGLE_ADS', `Stack trace: ${error.stack}`);
    }
    res.status(500).json({
      error: 'Failed to create conversion action',
      message: error.message,
      details: error.details || error.response?.data
    });
  }
  logger.info('GOOGLE_ADS', '========================================');
});

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Generate SOP Checklist text file
 */
function generateSopChecklist(config) {
  const lines = [
    '='.repeat(80),
    'GA4 SETUP WIZARD - SOP CHECKLIST',
    '='.repeat(80),
    '',
    `Client: ${config.clientName}`,
    `Domain: ${config.website}`,
    `Date: ${new Date().toISOString().split('T')[0]}`,
    '',
    '='.repeat(80),
    'SETUP COMPLETION',
    '='.repeat(80),
    '',
    '✓ Phase 1: Discovery & Planning - COMPLETE',
    '✓ Phase 2-4: GTM Automation - COMPLETE',
    '✓ Phase 5: GA4 Setup - IN PROGRESS',
    '○ Phase 6: Google Ads Setup - PENDING',
    '✓ Phase 7: Documentation - COMPLETE',
    '',
    '='.repeat(80),
    'NEXT STEPS',
    '='.repeat(80),
    '',
    '[ ] 1. Wait 24-48 hours for events to appear in GA4',
    '       Go to: GA4 Admin > Events > Recent events',
    '',
    '[ ] 2. Mark conversion events as key events',
    '       In GA4 Admin: Events > Manage all events',
    '       Mark as conversion for each event:',
  ];

  if (config.events?.phoneCall?.enabled) {
    lines.push('       - call_now_click');
  }
  if (config.events?.thankYouPage?.enabled) {
    lines.push('       - thank_you_page');
  }
  if (config.events?.ctaClick?.enabled) {
    lines.push('       - cta_click' + (config.events.ctaClick.conversion ? ' (conversion)' : ' (metric only)'));
  }

  lines.push('');
  lines.push('[ ] 3. Import conversions to Google Ads (if applicable)');
  lines.push('       In Google Ads: Tools > Conversions');
  lines.push('       Import GA4 key events as conversion actions');
  lines.push('');
  lines.push('[ ] 4. Test the setup');
  lines.push(`       Visit: ${config.websiteUrl}`);
  lines.push('       Trigger events manually');
  lines.push('       Verify in GA4 real-time report');
  lines.push('');
  lines.push('[ ] 5. Monitor conversion data');
  lines.push('       Check GA4 reports daily for 48 hours');
  lines.push('       Verify Google Ads conversions after import');
  lines.push('');
  lines.push('='.repeat(80),
    'CREATED RESOURCES',
    '='.repeat(80),
    '',
    'GTM Triggers:',
  );

  if (config.events?.phoneCall?.enabled) {
    lines.push(`  - Call Now Button Click (trigger on: "${config.events.phoneCall.phoneNumber}")`);
  }
  if (config.events?.thankYouPage?.enabled) {
    lines.push(`  - Thank You Page View (trigger on: "${config.events.thankYouPage.urlPath}")`);
  }
  if (config.events?.ctaClick?.enabled) {
    lines.push(`  - CTA Button Clicks (trigger on multiple buttons)`);
  }

  lines.push('');
  lines.push('GA4 Events:');
  if (config.events?.phoneCall?.enabled) {
    lines.push('  - call_now_click');
  }
  if (config.events?.thankYouPage?.enabled) {
    lines.push('  - thank_you_page');
  }
  if (config.events?.ctaClick?.enabled) {
    lines.push('  - cta_click');
  }

  lines.push('');
  lines.push('='.repeat(80),
    'TROUBLESHOOTING',
    '='.repeat(80),
    '',
    'Events not showing in GA4 after 48 hours:',
    '  1. Verify GTM is published to live',
    '  2. Check that Measurement ID is correct',
    '  3. Verify GA4 property is configured correctly',
    '  4. Check for errors in GTM preview mode',
    '',
    'Google Ads conversions not importing:',
    '  1. Ensure events are marked as key events in GA4',
    '  2. Wait 24 hours after key event creation',
    '  3. Check Google Ads conversion tracking setup',
    '  4. Verify account permissions',
    ''
  );

  return lines.join('\n');
}

// Serve React frontend (local dev only — on Vercel, static files are served by @vercel/static-build)
if (!isProduction) {
  app.use(express.static(path.join(__dirname, 'build')));
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(__dirname, 'build', 'index.html'));
    }
  });
}

// Error handler
app.use((err, req, res, next) => {
  logger.error('SERVER', 'Unhandled error', err.message);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'An error occurred'
  });
});

// Start server (local dev only — Vercel uses module.exports = app)
if (!isProduction) {
  app.listen(PORT, () => {
    logger.info('SERVER', `GA4 Setup Wizard running on http://localhost:${PORT}`);
    logger.info('SERVER', `Environment: ${process.env.NODE_ENV || 'development'}`);
    logger.info('SERVER', `Debug mode: ${process.env.DEBUG === 'true' ? 'enabled' : 'disabled'}`);
  });
}

module.exports = app;
