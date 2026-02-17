# GA4 Setup Wizard

Automated Google Analytics 4 Configuration Tool that streamlines the setup of custom event tracking in minutes, without any manual work in Google Tag Manager or Google Analytics.

## Overview

The GA4 Setup Wizard automates all seven phases of the GA4 setup process:

1. **Discovery & Planning** - Collect client information via interactive form
2. **GTM Automation** - Create triggers and tags automatically
3. **GA4 Setup** - Configure custom events
4. **Google Ads Integration** - Import conversion actions
5. **Documentation** - Generate configuration files and checklists

## Technology Stack

- **Frontend**: React 18.x with React Router
- **Backend**: Node.js + Express
- **Authentication**: Google OAuth 2.0
- **APIs**: Google Tag Manager, Google Analytics 4, Google Ads
- **Package Manager**: npm

## Features

✓ Interactive multi-step wizard interface
✓ Google OAuth 2.0 authentication
✓ Automatic GTM trigger creation
✓ Automatic GA4 event tag creation
✓ GTM version publishing
✓ Configuration validation
✓ JSON config file generation
✓ SOP checklist generation
✓ Comprehensive error handling
✓ Real-time setup progress logging

## Prerequisites

Before running the GA4 Setup Wizard, you need:

1. **Node.js** (v14 or higher)
2. **npm** or **yarn**
3. **Google account** with GTM/GA4 access
4. **Google Cloud Console credentials**:
   - OAuth 2.0 Client ID (Desktop)
   - Client Secret

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Get Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project called "GA4 Setup Wizard"
3. Enable these APIs:
   - Google Tag Manager API
   - Google Analytics Admin API
   - Google Ads API
4. Create OAuth 2.0 credentials (Desktop application)
5. Copy your Client ID and Client Secret

### 3. Create .env File

```bash
cp .env.example .env
```

Edit `.env` with your credentials:

```env
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
REDIRECT_URI=http://localhost:5000/api/auth/callback
PORT=5000
NODE_ENV=development
```

### 4. Start the Application

```bash
npm start
```

The app opens at `http://localhost:3000`

## Application Structure

```
GA4-Setup-Wizard/
├── server.js                    # Express backend
├── package.json                 # Dependencies
├── .env.example                 # Credentials template
├── README.md                    # This file
├── public/
│   └── index.html              # HTML entry point
└── src/
    ├── index.js                # React entry point
    ├── App.jsx                 # Main component
    ├── App.css                 # Global styles
    ├── utils/
    │   └── validation.js       # Input validation
    ├── screens/                # 7 wizard screens
    │   ├── Welcome.jsx
    │   ├── Authentication.jsx
    │   ├── ClientInformation.jsx
    │   ├── EventConfiguration.jsx
    │   ├── ReviewCreate.jsx
    │   ├── Creating.jsx
    │   ├── Success.jsx
    │   └── Error.jsx
    └── styles/
        └── screens.css         # Screen styles
```

## The 7 Wizard Screens

**Screen 1: Welcome** - Introduction and requirements
**Screen 2: Authentication** - Google OAuth sign-in
**Screen 3: Client Information** - GTM/GA4 IDs and client details
**Screen 4: Event Configuration** - Select events to track (phone calls, form submissions, CTA clicks)
**Screen 5: Review & Create** - Verify configuration before creating
**Screen 6: Creating** - Real-time progress of setup
**Screen 7: Success** - Download files and next steps

## What Gets Created

✓ GTM Triggers (up to 3):
  - Phone call trigger
  - Thank you page trigger
  - CTA button trigger

✓ GA4 Event Tags (up to 3):
  - Custom event tags for each trigger
  - Connected to the specified triggers

✓ GTM Version:
  - Published to live container

✓ Configuration Files:
  - JSON config (downloadable)
  - SOP checklist (downloadable)

## API Endpoints

### Authentication
- `GET /api/auth/url` - Get OAuth URL
- `GET /api/auth/callback` - OAuth callback
- `GET /api/auth/user/:sessionId` - Get user info

### GTM
- `POST /api/gtm/trigger` - Create trigger
- `POST /api/gtm/tag` - Create tag
- `POST /api/gtm/publish` - Publish version

### GA4
- `POST /api/ga4/key-event` - Mark as key event
- `GET /api/ga4/events/:sessionId/:propertyId` - List events

### Downloads
- `POST /api/download/config` - JSON config
- `POST /api/download/checklist` - SOP checklist

## Environment Variables

```env
# Google OAuth
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
REDIRECT_URI=http://localhost:5000/api/auth/callback

# Server
PORT=5000
NODE_ENV=development
DEBUG=false

# Logging
LOG_LEVEL=info
LOG_DIR=./logs

# APIs
GTM_API_VERSION=v2
GA4_API_VERSION=v1beta
```

## Validation Rules

**Client Information:**
- Client Name: Required, min 2 chars
- Website Domain: Valid domain format
- Website URL: Valid HTTP/HTTPS URL
- GTM Account ID: Numeric
- GTM Container ID: Format GTM-XXXXXX
- GA4 Property ID: Numeric
- GA4 Measurement ID: Format G-XXXXXXXXXX
- Google Ads ID: Format XXX-XXX-XXXX (optional)

**Events:**
- Phone Number: Valid format
- Thank You URL: Start with "/" 
- CTA Text: At least one required
- At least 1 event: Must be selected

## Logging

Logs are stored in `./logs/` directory:

```
[2025-01-09T14:32:15Z] [INFO] [GTM] Creating trigger: call_now_click
[2025-01-09T14:32:16Z] [SUCCESS] [GTM] Trigger created successfully
```

Enable debug mode: `DEBUG=true` in `.env`

## Troubleshooting

**OAuth Issues:**
- Verify GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env
- Check redirect URI matches Google Cloud Console

**GTM Permission Errors:**
- Verify your account has GTM container access
- Check GTM Account ID and Container ID are correct
- Ensure OAuth scopes include GTM edit

**GA4 Permission Errors:**
- Verify your account has GA4 property access
- Check Property ID and Measurement ID are correct
- Ensure OAuth scopes include GA4 edit

**Port Already in Use:**
- Change PORT in .env to 5001
- Or: `lsof -ti:5000 | xargs kill -9`

**Events Not Showing:**
- Wait 24-48 hours for GA4 to process
- Verify GTM is published to live
- Check Measurement ID matches exactly
- Review GTM preview mode

## Performance

- Setup Time: ~10 seconds
- GA4 Visibility: 24-48 hours
- Ads Sync: 24-48 hours after GA4

## Security

1. OAuth tokens stored in memory (use session store in production)
2. .env never committed to git
3. Use HTTPS in production
4. Configure CORS for your domain

## Deployment

### Heroku

```bash
heroku create ga4-setup-wizard
heroku config:set GOOGLE_CLIENT_ID=your-id
heroku config:set GOOGLE_CLIENT_SECRET=your-secret
heroku config:set REDIRECT_URI=https://your-app.herokuapp.com/api/auth/callback
git push heroku main
```

### Docker

```bash
docker build -t ga4-setup-wizard .
docker run -p 5000:5000 --env-file .env ga4-setup-wizard
```

## Development

**Debug Mode:**
```env
DEBUG=true
```

**React Development:**
```bash
npm run client
```

**Backend Development:**
```bash
npm run dev
```

**Monitor Logs:**
```bash
tail -f logs/*.log
```

## Success Criteria

✓ Collects all required info
✓ Validates all inputs
✓ Authenticates with OAuth
✓ Creates GTM triggers
✓ Creates GA4 tags
✓ Publishes GTM version
✓ Generates config JSON
✓ Downloads files
✓ Shows clear errors
✓ Completes in <3 minutes
✓ Zero manual work needed
✓ Multiple client support
✓ Offline documentation

## License

MIT

## Version

1.0.0 (2025-01-09)

---

**Built for GA4 professionals**
