# GA4 Setup Wizard - Quick Start Guide

## 30-Second Overview

The GA4 Setup Wizard is a complete Node.js + React application that automates GA4 setup. It walks users through 7 screens to collect configuration, then creates GTM triggers/tags automatically.

## What's Included

✓ Express backend with Google OAuth
✓ React frontend with 7 wizard screens
✓ Form validation system
✓ Professional styling (responsive)
✓ File download functionality
✓ Error handling

## Files Created

```
16 new files created:
├── Backend (1 file)
│   └── server.js (18.6 KB)
│
├── Frontend (11 files)
│   ├── src/App.jsx
│   ├── src/index.js
│   ├── src/App.css
│   ├── src/screens/ (8 screen components)
│   ├── src/styles/screens.css
│   └── src/utils/validation.js
│
├── Config (3 files)
│   ├── package.json
│   ├── .env.example
│   └── .gitignore
│
├── Public (1 file)
│   └── public/index.html
│
└── Documentation (2 files)
    ├── README.md (comprehensive guide)
    └── IMPLEMENTATION_SUMMARY.md (detailed overview)
```

## 5-Minute Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Get Google Credentials
1. Go to Google Cloud Console: https://console.cloud.google.com
2. Create new project: "GA4 Setup Wizard"
3. Enable APIs:
   - Google Tag Manager API
   - Google Analytics Admin API
   - Google Ads API
4. Create OAuth 2.0 Desktop credentials
5. Copy Client ID and Secret

### 3. Create .env File
```bash
cp .env.example .env
```

Edit .env:
```env
GOOGLE_CLIENT_ID=your-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-secret
REDIRECT_URI=http://localhost:5000/api/auth/callback
PORT=5000
NODE_ENV=development
```

### 4. Run the App
```bash
npm start
```

App opens at: `http://localhost:3000`

## The 7 Screens

1. **Welcome** - Introduction & requirements
2. **Authentication** - Google OAuth sign-in
3. **Client Information** - GTM/GA4 IDs & client name
4. **Event Configuration** - Select events to track
5. **Review & Create** - Review before creating
6. **Creating** - Real-time progress bar
7. **Success** - Download files & next steps

## User Journey

1. User clicks "Get Started"
2. Signs in with Google
3. Enters client details (GTM/GA4 IDs)
4. Selects which events to track
5. Reviews configuration
6. Clicks "Create Setup"
7. Wizard creates GTM triggers/tags
8. Downloads JSON config and checklist
9. Can set up another client or exit

## What Gets Created

✓ 1-3 GTM Triggers
✓ 1-3 GA4 Event Tags
✓ 1 GTM Version (published)
✓ JSON configuration file
✓ SOP checklist text file

## Environment Variables

| Variable | Required | Example |
|----------|----------|---------|
| GOOGLE_CLIENT_ID | Yes | abc123.apps.googleusercontent.com |
| GOOGLE_CLIENT_SECRET | Yes | secret_key_here |
| REDIRECT_URI | Yes | http://localhost:5000/api/auth/callback |
| PORT | No | 5000 (default) |
| NODE_ENV | No | development (default) |
| DEBUG | No | false (default) |

## API Endpoints

### Auth
- `GET /api/auth/url` - OAuth URL
- `GET /api/auth/callback` - OAuth callback
- `GET /api/auth/user/:sessionId` - User info

### GTM
- `POST /api/gtm/trigger` - Create trigger
- `POST /api/gtm/tag` - Create tag
- `POST /api/gtm/publish` - Publish version

### GA4
- `POST /api/ga4/key-event` - Mark as key event
- `GET /api/ga4/events/:sessionId/:propertyId` - List events

### Downloads
- `POST /api/download/config` - Get JSON
- `POST /api/download/checklist` - Get checklist

## Validation Rules

### Required Fields
- Client Name (min 2 chars)
- Website Domain (valid format)
- Website URL (valid URL)
- GTM Account ID (numeric)
- GTM Container ID (GTM-XXXXXX)
- GA4 Property ID (numeric)
- GA4 Measurement ID (G-XXXXXXXXXX)

### Optional Fields
- Google Ads Account ID (XXX-XXX-XXXX)

### Event Fields
- Phone Number (if phone tracking enabled)
- Thank You URL (if form tracking enabled)
- Button Text (if CTA tracking enabled)

## Troubleshooting

**"Port 5000 already in use"**
→ Change PORT in .env or kill the process

**"OAuth failed"**
→ Check GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env

**"GTM permission denied"**
→ Verify your account has access to the GTM container

**"GA4 permission denied"**
→ Verify your account has access to the GA4 property

## Development

```bash
npm start              # Full stack (backend + frontend)
npm run dev           # Backend only (with nodemon)
npm run client        # Frontend only (hot reload)
npm run client:build  # Build for production
```

## Production Notes

Before deploying:

1. Replace in-memory sessions with database
2. Add HTTPS enforcement
3. Set NODE_ENV=production
4. Remove DEBUG=true
5. Use production OAuth redirect URI
6. Set up error tracking
7. Add rate limiting

## Key Features

✓ Complete multi-step wizard
✓ Form validation with error feedback
✓ Google OAuth 2.0
✓ GTM API integration
✓ GA4 API integration
✓ Configuration generation
✓ File downloads
✓ Responsive design
✓ Error recovery
✓ Progress tracking

## File Sizes

- server.js: 18.6 KB
- package.json: 1.2 KB
- All CSS: ~3 KB
- All components: ~2 KB
- Total: ~25 KB (uncompressed)

## Dependencies

**Backend:**
- express
- google-auth-library
- googleapis
- uuid
- body-parser
- cors
- dotenv

**Frontend:**
- react
- react-dom
- react-router-dom
- axios
- date-fns

## Testing the App

1. Fill out client information (can use fake IDs for testing)
2. Select events to track
3. Review configuration
4. Click "Create Setup"
5. Watch progress bar
6. Download configuration files
7. Try setting up another client

## Support

- README.md - Full documentation
- IMPLEMENTATION_SUMMARY.md - Technical details
- Inline code comments - Implementation notes
- Error messages - User-friendly feedback

## Next Steps

1. Get Google OAuth credentials
2. Create .env with your credentials
3. Run `npm install`
4. Run `npm start`
5. Open http://localhost:3000
6. Test the wizard flow
7. Customize as needed

---

**Ready to go!** Just add your Google credentials and start using.
