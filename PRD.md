================================================================================
PRODUCT REQUIREMENTS DOCUMENT
GA4 Setup Wizard - Automated Google Analytics 4 Configuration Tool
================================================================================

PROJECT OVERVIEW
================================================================================

Build a desktop/web application that automates the setup of custom GA4 event
tracking by:
1. Collecting client configuration via an interactive form
2. Creating GTM triggers and GA4 event tags automatically via Google APIs
3. Validating the setup
4. Generating documentation (JSON config, next steps guide)

CORE FUNCTIONALITY
================================================================================

The app must automate ALL SEVEN PHASES of the GA4 setup SOP:

PHASE 1: DISCOVERY & PLANNING
- Collect client information via form
- Validate all required fields
- Display configuration summary

PHASE 2-4: GTM AUTOMATION
- Create GTM triggers automatically (via GTM API)
- Create GA4 event tags automatically (via GTM API)
- Verify Google Tag exists (auto-create if missing)
- Publish GTM version to live
- No manual GTM work required

PHASE 5: GA4 SETUP
- Monitor GA4 for custom events (via GA4 Admin API)
- Automatically mark conversion events as key events
- Generate report of key events created

PHASE 6: GOOGLE ADS (OPTIONAL - PHASE 1 OF APP)
- Import conversion actions from GA4 (via Google Ads API)
- Assign to active campaigns
- Verify secondary metrics NOT marked as conversions

PHASE 7: DOCUMENTATION
- Generate JSON config file (downloadable)
- Generate SOP checklist (downloadable)
- Provide next steps documentation

USER INTERFACE FLOW
================================================================================

The app uses a MULTI-STEP WIZARD with progress indication.

SCREEN 1: WELCOME
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Title: "GA4 Setup Wizard"
Subtitle: "Automate custom event tracking in minutes"

Display:
  - Brief description of what the wizard does
  - Requirements (Google account with GTM/GA4 access)
  - Expected time: "~2 minutes for setup, 24-48 hours for data"

Buttons:
  [Get Started] [Learn More]

Status: Step 1 of 5


SCREEN 2: GOOGLE AUTHENTICATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Display:
  "Sign in with Google"
  
  [Google Sign-In Button]
  
  Status: Checking permissions...
  Required Permissions:
    ✓ Google Tag Manager access
    ✓ Google Analytics 4 access
    ✓ Google Ads access (optional)

After auth successful:
  "✓ Authenticated as: user@example.com"
  "✓ Permissions verified"
  [Continue]

Status: Step 2 of 5


SCREEN 3: CLIENT INFORMATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Display form with fields (all required unless marked optional):

CLIENT INFO:
  Client Name *
  ________________________
  
  Website Domain *
  ________________________
  
  Website URL (for testing) *
  ________________________

GTM & GA4 INFO:
  GTM Account ID *
  ________________________
  
  GTM Container ID *
  ________________________
  (Format: GTM-XXXXXX)
  
  GA4 Property ID *
  ________________________
  
  GA4 Measurement ID *
  ________________________
  (Format: G-XXXXXXXXXX)

GOOGLE ADS (Optional - skip if not using):
  Google Ads Account ID (optional)
  ________________________
  (Format: XXX-XXX-XXXX)

Buttons:
  [Previous] [Next] [Cancel]

Validation:
  - Client Name: Required, min 2 characters
  - Website Domain: Required, must contain domain
  - GTM Container ID: Must start with "GTM-"
  - GA4 Measurement ID: Must start with "G-"
  - GA4 Property ID: Must be numeric
  - Google Ads ID: Must be in format XXX-XXX-XXXX if provided

Status: Step 3 of 5


SCREEN 4: EVENT CONFIGURATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Display form with event configuration options:

"What events do you want to track?"

EVENT 1: PHONE CALLS
  ☑ Track phone calls
  
  Phone Number *
  ________________________
  (e.g., "(636) 306-9072" or "1-800-555-0123")
  
  Track as conversion in Google Ads? ◉ Yes ○ No
  
EVENT 2: FORM SUBMISSIONS (THANK YOU PAGE)
  ☑ Track form submissions
  
  Thank You Page URL Path *
  ________________________
  (e.g., "/thank-you/" or "/success")
  
  Track as conversion in Google Ads? ◉ Yes ○ No

EVENT 3: CTA BUTTON CLICKS
  ☑ Track CTA button clicks
  
  CTA Button Text (comma-separated) *
  ________________________
  (e.g., "contact us,get a quote,book a call")
  
  Track as conversion in Google Ads? ◉ Yes ○ No
  
  Note: Secondary metric - not counted as conversion by default
        But you can enable it as conversion if needed

At least 1 event must be selected.

Buttons:
  [Previous] [Next] [Cancel]

Status: Step 4 of 5


SCREEN 5: REVIEW & CREATE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Display summary of what will be created:

"Review Your Configuration"

CLIENT SUMMARY:
  Client: Siding Express
  Domain: sidingexpress.com
  GTM Container: GTM-MQGPSKWK
  GA4 Property: 517329255
  Measurement ID: G-JMHSV38KLX

EVENTS TO CREATE:
  ✓ call_now_click (Conversion: YES)
    - Trigger: Click Text contains "(636) 306-9072"
    - Event: call_now_click
    - GA4 Key Event: YES
    - Google Ads Conversion: YES
  
  ✓ thank_you_page (Conversion: YES)
    - Trigger: Page URL contains "/thank-you/"
    - Event: thank_you_page
    - GA4 Key Event: YES
    - Google Ads Conversion: YES
  
  ✓ cta_click (Conversion: NO)
    - Trigger: Click Text contains "contact us", "get a quote", "book a call"
    - Event: cta_click
    - GA4 Key Event: NO
    - Google Ads Conversion: NO

GTM CHANGES:
  - 3 triggers will be created
  - 4 tags will be created (3 event tags + 1 Google tag)
  - 1 GTM version will be published to live

TIMELINE:
  ⚡ Setup: ~2 minutes (automated)
  ⏳ GA4 Data: 24-48 hours
  ⏳ Ads Conversions: 24-48 hours after GA4 data appears

Buttons:
  [Edit] [Create Setup] [Cancel]

Status: Step 5 of 5


SCREEN 6: CREATING (PROGRESS SCREEN)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Display progress as setup runs:

"Setting Up Your GA4 Tracking..."

Progress Bar: [████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░] 30%

Current Step:
  ⏳ Verifying Google APIs access...

Detailed Log (scrollable):
  ✓ [14:32:15] Authenticated successfully
  ✓ [14:32:16] Connected to GTM API
  ✓ [14:32:17] Verified GA4 access
  ⏳ [14:32:18] Creating triggers...
  
DO NOT allow user to close or click anything during this phase.
Show cancel button only in first 5 seconds (if they want to abort).


SCREEN 7: SUCCESS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Display success message and results:

"✓ Setup Complete!"

WHAT WAS CREATED:
  ✓ 3 GTM Triggers (Call Now, Thank You Page, CTA Clicks)
  ✓ 4 GA4 Event Tags (3 custom + 1 Google Tag)
  ✓ GTM Version 2 published to live
  ✓ JSON configuration file generated

RESULTS SUMMARY:
  Client: Siding Express
  Setup Time: 2 minutes 34 seconds
  Events Created: 3
  GTM Version: 2
  Status: ✓ All systems go!

NEXT STEPS:
  1. Events will appear in GA4 in 24-48 hours
  2. Mark conversion events as key events (automated if possible)
  3. Import conversions to Google Ads (check after 24h)
  4. Monitor conversion data

DOWNLOADS:
  [📥 Download JSON Config]
  [📥 Download SOP Checklist]
  [📥 Download GTM Export]

ACTIONS:
  [Setup Another Client] [Exit]


SCREEN 8: ERROR HANDLING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
If error occurs, display:

"⚠️ Setup Failed"

ERROR MESSAGE: [Specific error - see below]
Error Code: [ERROR_CODE_001]
Timestamp: [2025-01-09 14:32:45]

WHAT FAILED:
  ✓ Authenticated successfully
  ✓ Connected to GTM API
  ✓ Verified GA4 access
  ✗ Failed to create trigger: Already exists

SUGGESTED SOLUTION:
  The trigger "Call Now Button Click" already exists in your GTM container.
  
  Options:
    [Use Existing Trigger] [Create with Different Name] [Cancel]

ACTIONS:
  [Retry] [View Full Logs] [Contact Support] [Exit]


TECHNICAL REQUIREMENTS
================================================================================

TECHNOLOGY STACK:
  - Frontend: React.js or Vue.js
  - Backend: Node.js (required for API calls)
  - Authentication: Google OAuth 2.0
  - APIs: GTM API, GA4 Admin API, Google Ads API
  - Storage: Local JSON files (no database)
  - Package Manager: npm/yarn

REQUIRED DEPENDENCIES:
  - express (web server)
  - react (UI framework)
  - axios (HTTP requests)
  - @google-cloud/tagmanager (GTM API)
  - @google-analytics/admin (GA4 API)
  - google-ads-api (Google Ads API)
  - oauth2-client (Google OAuth)
  - body-parser (request parsing)
  - dotenv (environment variables)

GOOGLE API SETUP:
  1. User must enable these APIs in Google Cloud Console:
     - Tag Manager API
     - Google Analytics Admin API
     - Google Ads API
  
  2. User must create OAuth 2.0 credentials:
     - Application type: Desktop
     - Authorized redirect URIs: http://localhost:3000/auth/callback
  
  3. User must provide their credentials (client ID, client secret)
     - App prompts for these at first startup
     - Stores securely in .env file

OAUTH FLOW:
  1. User clicks "Sign in with Google"
  2. Browser opens Google login page
  3. User authenticates and grants permissions
  4. Callback returns access token
  5. App uses token to call APIs
  6. Token refreshed automatically when needed

DATA STRUCTURES
================================================================================

CLIENT CONFIGURATION INPUT:
{
  "clientName": "Siding Express",
  "website": "sidingexpress.com",
  "websiteUrl": "https://www.sidingexpress.com",
  "gtmAccountId": "6330173520",
  "gtmContainerId": "238610460",
  "ga4PropertyId": "517329255",
  "ga4MeasurementId": "G-JMHSV38KLX",
  "googleAdsAccountId": "204-128-1925",
  "events": {
    "phoneCall": {
      "enabled": true,
      "phoneNumber": "(636) 306-9072",
      "conversion": true
    },
    "thankYouPage": {
      "enabled": true,
      "urlPath": "/thank-you/",
      "conversion": true
    },
    "ctaClick": {
      "enabled": true,
      "buttonTexts": ["contact us", "get a quote", "book a call"],
      "conversion": false
    }
  }
}

GENERATED JSON CONFIG OUTPUT (saved to desktop):
{
  "project": {
    "name": "GA4 Conversion Tracking Setup",
    "version": "1.0",
    "created_date": "2025-01-09T14:32:15Z",
    "client": "Siding Express"
  },
  "client_info": {
    "name": "Siding Express",
    "domain": "sidingexpress.com",
    "gtm_container_id": "GTM-MQGPSKWK",
    "ga4_property_id": "517329255",
    "ga4_measurement_id": "G-JMHSV38KLX",
    "google_ads_account": "204-128-1925"
  },
  "setup_results": {
    "triggers_created": [
      {
        "name": "Call Now Button Click",
        "type": "Click - All Elements",
        "condition": "Click Text contains (636) 306-9072"
      },
      {
        "name": "Thank You Page View",
        "type": "Page View",
        "condition": "Page URL contains /thank-you/"
      },
      {
        "name": "CTA – Link Clicks",
        "type": "Click - All Elements",
        "conditions": ["contact us", "get a quote", "book a call"]
      }
    ],
    "tags_created": [
      {
        "name": "GA4 – Event – call_now_click",
        "type": "GA4 Event",
        "event_name": "call_now_click",
        "measurement_id": "G-JMHSV38KLX",
        "trigger": "Call Now Button Click"
      },
      {
        "name": "GA4 – Event – thank_you_page",
        "type": "GA4 Event",
        "event_name": "thank_you_page",
        "measurement_id": "G-JMHSV38KLX",
        "trigger": "Thank You Page View"
      },
      {
        "name": "GA4 – Event – cta_click",
        "type": "GA4 Event",
        "event_name": "cta_click",
        "measurement_id": "G-JMHSV38KLX",
        "trigger": "CTA – Link Clicks"
      }
    ],
    "gtm_version": {
      "version_number": 2,
      "name": "Siding Express - GA4 Event Tracking Setup",
      "published_date": "2025-01-09T14:32:15Z"
    }
  },
  "event_classification": {
    "call_now_click": {
      "in_ga4": true,
      "key_event": true,
      "in_ads": true,
      "reason": "Primary conversion - phone initiated"
    },
    "thank_you_page": {
      "in_ga4": true,
      "key_event": true,
      "in_ads": true,
      "reason": "Primary conversion - form submitted"
    },
    "cta_click": {
      "in_ga4": true,
      "key_event": false,
      "in_ads": false,
      "reason": "Secondary metric - analytics only"
    }
  },
  "next_steps": [
    "Wait 24-48 hours for events to appear in GA4",
    "Check GA4 Admin > Events > Recent events for data",
    "Mark conversion events as key events (auto-done if possible)",
    "Import conversions to Google Ads after key events created",
    "Monitor conversion data in Google Ads"
  ]
}

API INTEGRATION DETAILS
================================================================================

GOOGLE TAG MANAGER API:

1. Create Trigger:
   POST /accounts/{accountId}/containers/{containerId}/workspaces/{workspaceId}/triggers
   
   Request body:
   {
     "name": "Call Now Button Click",
     "type": "click",
     "filter": {
       "type": "contains",
       "parameter": "click_text",
       "value": "(636) 306-9072"
     }
   }

2. Create Tag:
   POST /accounts/{accountId}/containers/{containerId}/workspaces/{workspaceId}/tags
   
   Request body:
   {
     "name": "GA4 – Event – call_now_click",
     "type": "gaawe",  // GA4 Event tag type
     "parameter": [
       {
         "type": "template",
         "key": "eventName",
         "value": "call_now_click"
       },
       {
         "type": "template",
         "key": "measurementId",
         "value": "G-JMHSV38KLX"
       }
     ],
     "firingTriggerId": ["trigger_id_from_step_1"]
   }

3. Publish Version:
   POST /accounts/{accountId}/containers/{containerId}/versions:publish
   
   Request body:
   {
     "path": "accounts/{accountId}/containers/{containerId}/versions/{versionId}",
     "changesSummary": "GA4 Event Tracking Setup"
   }

GOOGLE ANALYTICS 4 ADMIN API:

1. Create Custom Event:
   POST /properties/{propertyId}/customEvents
   
   Note: May not be directly creatable via API - verify with GA4 docs
   
2. Mark as Key Event:
   PATCH /properties/{propertyId}/keyEvents/{keyEventId}:reorder

3. List Recent Events:
   GET /properties/{propertyId}/events:queryData

GOOGLE ADS API:

1. Create Conversion Action:
   POST /customers/{customerId}/conversionActions
   
   2. List Conversion Actions:
   GET /customers/{customerId}/conversionActions

ERROR HANDLING
================================================================================

VALIDATION ERRORS:
- Client Name: "Client name required (min 2 characters)"
- GTM Container ID: "Invalid format - must be GTM-XXXXXX"
- GA4 Measurement ID: "Invalid format - must be G-XXXXXXXXXX"
- Phone Number: "Invalid phone format"
- Thank You URL: "URL path required (e.g., /thank-you/)"

API ERRORS:
- Authentication Failed: "Please sign in with your Google account"
- GTM Permission Denied: "You don't have access to this GTM container"
- GA4 Permission Denied: "You don't have access to this GA4 property"
- Trigger Already Exists: "Trigger with this name already exists - retry with different name"
- Tag Creation Failed: "Failed to create tag - check GTM logs"
- Measurement ID Mismatch: "Measurement ID doesn't match GA4 property"

NETWORK ERRORS:
- Connection Timeout: "Network timeout - check your internet connection"
- API Rate Limit: "Too many requests - please wait and retry"
- Invalid Token: "Authentication expired - please sign in again"

For each error:
1. Display clear error message
2. Show error code for debugging
3. Suggest next steps (retry, edit, cancel)
4. Log full error to console for debugging
5. Provide option to view detailed logs

DEPLOYMENT & USAGE
================================================================================

INSTALLATION STEPS FOR USER:
1. Download app (from GitHub or distribution)
2. Extract to folder
3. Open terminal in app folder
4. Run: npm install
5. Create .env file with Google OAuth credentials
6. Run: npm start
7. App opens in browser at http://localhost:3000

FIRST TIME SETUP:
1. App opens to welcome screen
2. User clicks "Get Started"
3. Prompts for Google OAuth credentials (client ID, secret)
4. User signs in with Google
5. App saves credentials securely
6. User proceeds to form

CREDENTIALS STORAGE:
- Stored in .env file (not uploaded to git)
- Format:
  GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
  GOOGLE_CLIENT_SECRET=xxx
  REDIRECT_URI=http://localhost:3000/auth/callback

USAGE:
1. User fills out form
2. Reviews configuration
3. Clicks "Create Setup"
4. App creates everything automatically
5. Downloads JSON config and SOP checklist
6. User follows next steps (wait for data, mark key events, etc.)

REQUIREMENTS FOR USER TO RUN APP:
- Node.js installed
- Google account with GTM/GA4 access
- OAuth credentials from Google Cloud Console (3 mins to set up)
- Internet connection

MONITORING & LOGGING
================================================================================

LOG FILE LOCATION:
  ~/.ga4-wizard/logs/[YYYY-MM-DD].log

WHAT TO LOG:
  [TIMESTAMP] [LEVEL] [COMPONENT] Message
  
  Examples:
  2025-01-09 14:32:15 INFO GTM Connected to GTM API
  2025-01-09 14:32:16 INFO GTM Creating trigger: Call Now Button Click
  2025-01-09 14:32:17 ✓ GTM Trigger created successfully
  2025-01-09 14:32:18 ERROR GTM Failed to create tag: Permission denied

LEVELS:
  - INFO: Normal operation
  - SUCCESS (✓): Action completed
  - WARNING: Potential issue
  - ERROR: Failed action
  - DEBUG: Detailed info for troubleshooting

DEBUG MODE:
  - Enable with env variable: DEBUG=true
  - Logs API requests/responses in full
  - Logs access tokens (masked)
  - Saves to separate debug log

KEY METRICS TO TRACK:
  - Setup completion time
  - Success/failure rate
  - Most common errors
  - API response times
  - Number of clients set up

SUCCESS CRITERIA
================================================================================

The app is successful if it:

✓ Collects all required client information via form
✓ Validates all inputs before submission
✓ Authenticates with Google OAuth
✓ Creates all 3 GTM triggers automatically
✓ Creates all 4 GA4 event tags automatically
✓ Verifies Google Tag exists (or creates it)
✓ Publishes GTM version to live
✓ Generates JSON config file
✓ Downloads files successfully
✓ Provides clear error messages if anything fails
✓ Takes < 3 minutes to complete from form start to finish
✓ Requires ZERO manual work in GTM/GA4
✓ Allows user to set up multiple clients without restarting
✓ Provides offline documentation (SOP checklist, JSON config)

The app should feel like:
"I answered a few questions and the tool did everything. I didn't have to touch GTM at all."

ADDITIONAL FEATURES (FUTURE ENHANCEMENTS)
================================================================================

Phase 2:
  - Monitor GA4 for custom events automatically
  - Alert when events are detected
  - Auto-mark key events in GA4
  - Send email notifications

Phase 3:
  - Google Ads integration
  - Auto-import conversions
  - Auto-assign to campaigns
  - Conversion tracking dashboard

Phase 4:
  - Multi-user support
  - Client management database
  - Historical tracking of setups
  - Analytics on setup performance

Phase 5:
  - Mobile app version
  - API for programmatic use
  - Integration with other tools
  - Custom event templates

================================================================================
END OF PRD
================================================================================