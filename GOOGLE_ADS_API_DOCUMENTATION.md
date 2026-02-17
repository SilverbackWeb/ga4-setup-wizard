# GA4 Setup Wizard - Google Ads API Integration Documentation

## Application Overview

**Application Name:** GA4 Setup Wizard
**Purpose:** Automated Google Ads conversion action management and tracking verification
**Developer:** [Your Name/Company]
**Use Case:** B2B SaaS tool for digital marketing agencies and in-house teams

---

## Executive Summary

The GA4 Setup Wizard is a comprehensive web-based platform designed to streamline the setup and management of conversion tracking across Google Tag Manager (GTM), Google Analytics 4 (GA4), and Google Ads. The application solves a critical gap in the Google Ads workflow: ensuring that conversion actions in Google Ads properly correspond to the events being tracked in GA4.

### The Problem We Solve

Many businesses implement GA4 and GTM successfully but neglect to create corresponding conversion actions in Google Ads. This creates several critical issues:

1. **Missing Conversion Data**: Google Ads campaigns can't optimize for conversions that aren't properly configured
2. **Attribution Gaps**: Conversion data tracked in GA4 doesn't flow to Google Ads, limiting campaign optimization
3. **Manual Error-Prone Process**: Manually creating conversion actions is time-consuming and prone to configuration errors
4. **Inconsistency**: Without a unified interface, it's difficult to audit whether all GA4 events have corresponding Google Ads conversions

Our solution automates this process, ensuring consistency and completeness across all tracking platforms.

---

## Detailed Use Cases

### Use Case 1: Initial Setup - New Client Onboarding

**Scenario:** A digital marketing agency is setting up conversion tracking for a new client.

**Flow:**
1. Agency authenticates with their Google Ads account via OAuth
2. Specifies which GA4 events should become Google Ads conversion actions
3. Application automatically creates conversion actions in Google Ads matching the GA4 event configuration
4. All conversion actions are properly categorized (e.g., phone calls, form submissions, purchases)
5. Agency receives a complete audit report showing all created conversions and their mappings

**Business Value:**
- Reduces setup time from 30+ minutes to 5 minutes
- Eliminates manual data entry errors
- Creates documented audit trail for compliance

### Use Case 2: Conversion Tracking Audit

**Scenario:** A client reports conversion data discrepancies between GA4 and Google Ads.

**Flow:**
1. Agency uses application to load existing client project
2. Application displays all configured GA4 events
3. Application shows which events have corresponding Google Ads conversion actions
4. Application highlights gaps (GA4 events without Google Ads conversions or vice versa)
5. Agency can add missing conversion actions or update configurations

**Business Value:**
- Quick diagnosis of tracking gaps
- Prevents lost conversion data in campaigns
- Improves campaign optimization capability

### Use Case 3: Client Account Updates

**Scenario:** A client wants to add new conversion types (e.g., phone calls) to existing tracking setup.

**Flow:**
1. Agency accesses existing client project in application
2. Selects "Add Features" to extend conversion tracking
3. Specifies new event types to track
4. Application creates new conversion actions in Google Ads
5. Updates project configuration with new conversions

**Business Value:**
- Non-destructive updates to existing configurations
- Maintains historical record of all configuration changes
- Enables iterative optimization of conversion tracking

---

## Data Collection and Usage

### What Data We Collect

1. **Google Ads Account Information**
   - Customer ID (account identifier)
   - Conversion action names and IDs
   - Conversion action categories (PHONE_CALL_LEAD, SUBMIT_LEAD_FORM, PURCHASE, etc.)
   - Conversion action status (ENABLED, DISABLED)

2. **Client Configuration Data**
   - Client name and website domain
   - GA4 property IDs and measurement IDs
   - GTM container IDs and account IDs
   - Event type configurations (phone calls, form submissions, CTA clicks)

3. **Operational Data**
   - User email address (OAuth identity)
   - Setup timestamps
   - Configuration change history with user attribution
   - API call logs for debugging and audit purposes

### What Data We DON'T Collect

- Google Ads credentials or passwords
- Customer conversion data (actual conversion events/transactions)
- Customer personal information beyond business contact details
- Sensitive financial or health data
- Any user data beyond what's necessary for conversion action management

### Data Storage

- All data is stored locally on the customer's machine or private server
- No data is transmitted to third-party servers (except Google APIs)
- Configuration history is maintained for audit and rollback purposes
- Data can be exported, deleted, or reset at any time

### Data Usage

- **Primary:** Creating and managing conversion actions in Google Ads
- **Secondary:** Generating audit reports and configuration documentation
- **Internal:** Logging API interactions for debugging and support
- **Compliance:** Maintaining audit trails per Google Ads policies

---

## API Endpoints and Scope Usage

### OAuth Scopes Required

```
https://www.googleapis.com/auth/adwords
https://www.googleapis.com/auth/tagmanager.edit.containers
https://www.googleapis.com/auth/analytics.edit
https://www.googleapis.com/auth/userinfo.email
https://www.googleapis.com/auth/userinfo.profile
```

### Google Ads API Usage

#### Endpoint 1: Create Conversion Action
**Method:** POST `/api/google-ads/conversion-action`

**Purpose:** Create a new conversion action in Google Ads that corresponds to a GA4 event

**Request Parameters:**
```json
{
  "sessionId": "user-session-id",
  "customerId": "123456789",  // Google Ads customer ID
  "conversionAction": {
    "name": "Client Name - Event Type",
    "category": "PHONE_CALL_LEAD|SUBMIT_LEAD_FORM|CONTACT|PURCHASE"
  }
}
```

**API Resource Used:** `ConversionActionService.create()`
**Rate Limiting:** 1 call per conversion action creation (typically 1-5 per setup)

#### Endpoint 2: List Existing Conversion Actions
**Method:** GET `/api/google-ads/conversion-actions/:customerId`

**Purpose:** Retrieve existing conversion actions to audit current configuration and prevent duplicates

**Query Parameters:**
```
sessionId: user-session-id
customerId: 123456789
```

**API Resource Used:** `ConversionActionService.list()`
**Rate Limiting:** 1 call per audit operation

### API Call Frequency and Volume

**Typical Usage:**
- New client setup: 3-5 conversion actions created
- Monthly active users: 10-50 agency accounts
- Monthly API calls: ~500-5,000 conversion action creates
- Monthly audit calls: ~100-500 list operations

**Peak Usage:**
- Agency onboarding new clients: 10-20 conversions per day
- Client conversion optimization: 5-10 conversions per day

**Estimated Annual API Calls:** 10,000-50,000 calls

---

## Security and Privacy

### Authentication

- **OAuth 2.0 Flow:** Uses official Google OAuth for user authentication
- **Token Management:** Access tokens stored securely in HTTP-only sessions
- **Token Refresh:** Automatic refresh before expiration
- **No Credential Storage:** Never stores user passwords or API keys directly
- **Scope Limitation:** Only requests minimum necessary scopes

### Data Protection

- **Encryption in Transit:** All API calls use HTTPS/TLS 1.2+
- **Encryption at Rest:** Configuration data encrypted when stored
- **Access Control:** Users can only access their own Google Ads accounts
- **Audit Logging:** All API interactions logged for security review
- **Error Handling:** Sensitive errors logged internally, generic errors shown to users

### Privacy Compliance

- **GDPR Compliance:** Supports data deletion and export per GDPR requirements
- **CCPA Compliance:** User data can be deleted on request
- **Google Terms of Service:** Fully compliant with Google Ads and Google APIs terms
- **No Data Sharing:** Zero third-party data sharing or sales
- **User Control:** Users have full control over when data is collected and how long it's retained

---

## Data Deletion and Retention

### Data Retention Policy

- **Active Projects:** Retained while customer is using the application
- **Inactive Projects:** Retained for 12 months after last modification
- **Deleted Projects:** Permanently deleted after 30-day grace period
- **API Logs:** Retained for 90 days for debugging, then deleted

### User Deletion

Users can request complete data deletion at any time:
- All project configurations deleted
- All conversion action history deleted
- All user preferences deleted
- No backup copies retained

### Data Export

Users can export their configuration data at any time in JSON format for:
- Backup purposes
- Migration to other tools
- Compliance audits
- Documentation

---

## Compliance and Standards

### Google Ads Policy Compliance

- Complies with Google Ads API Terms of Service
- Complies with Google Ads advertising policies
- Does not manipulate conversion data or metrics
- Does not artificially inflate conversion numbers
- Maintains transparent relationship between GA4 and Google Ads conversions

### Industry Standards

- Follows OWASP API security guidelines
- Implements secure OAuth token handling per OAuth 2.0 spec
- Complies with RESTful API best practices
- Follows Google's API design standards

### Audit and Monitoring

- API calls are logged and auditable
- Configuration changes are timestamped and attributed to users
- All conversions created are tracked with creation timestamp
- Deletion and modification history maintained

---

## Technical Architecture

### Frontend
- React.js web application
- OAuth-based Google authentication
- Secure session management via localStorage

### Backend
- Node.js/Express.js server
- File-based project storage (optionally cloud-based)
- Direct Google Ads API integration
- JWT-based session management

### Integration Points
- Google OAuth 2.0 for authentication
- Google Ads API v14 for conversion action management
- Google Tag Manager API for event configuration
- Google Analytics 4 API for property validation

### No Data Intermediaries
- Application communicates directly with Google APIs
- No proxy servers or data intermediaries
- No data stored on third-party cloud services (by default)

---

## Troubleshooting and Support

### Common Issues and Resolution

1. **Conversion Action Creation Fails**
   - Verify Google Ads account has API access enabled
   - Check customer ID format (remove dashes: "123-456-7890" → "1234567890")
   - Ensure adequate permissions in Google Ads account

2. **Missing Conversion Actions**
   - Verify GA4 events are properly configured
   - Check conversion action naming conventions
   - Review audit log for creation status

3. **Token Expiration**
   - Automatic refresh handles most cases
   - Manual re-authentication available in UI
   - Session timeout: 1 hour of inactivity

### Logging and Debugging

- All API interactions logged with timestamps
- Error messages capture API responses for diagnosis
- Configuration changes logged with user attribution
- Export logs available for support tickets

---

## Future Enhancements

### Planned Features

1. **Enhanced Conversions Integration**
   - Automatic hashed user data transmission to Google Ads
   - Improved conversion accuracy through first-party data

2. **Server-Side Tagging**
   - Support for Google Cloud conversion tracking
   - Improved data privacy and accuracy

3. **Multi-Account Management**
   - Manage multiple Google Ads accounts from single interface
   - Cross-account reporting and auditing

4. **Real-Time Conversion Monitoring**
   - Dashboard showing real-time conversion status
   - Alerts for conversion tracking issues

5. **API Expansion**
   - Support for additional conversion types
   - Custom conversion attribute mapping

---

## Conclusion

The GA4 Setup Wizard represents a responsible, secure, and valuable addition to the Google Ads ecosystem. By automating conversion action creation and maintenance, we help businesses ensure their conversion tracking is complete, accurate, and optimized for campaign performance.

We are committed to:
- Protecting user privacy and data security
- Following all Google Ads policies and guidelines
- Providing transparent data handling practices
- Supporting users with comprehensive documentation and support

---

## Contact Information

**Developer:** [Your Name]
**Support Email:** [Your Support Email]
**Company:** [Your Company Name]
**Website:** [Your Website]

**For API Access Request:**
Contact Google Cloud Console at: https://console.cloud.google.com/

---

## Appendices

### Appendix A: Sample API Requests and Responses

**Create Conversion Action Request:**
```json
{
  "sessionId": "abc123def456",
  "customerId": "1234567890",
  "conversionAction": {
    "name": "Big Decks - Phone Call Click",
    "category": "PHONE_CALL_LEAD"
  }
}
```

**Create Conversion Action Response:**
```json
{
  "success": true,
  "conversionActionId": "9876543210",
  "conversionActionName": "Big Decks - Phone Call Click",
  "resourceName": "customers/1234567890/conversionActions/9876543210"
}
```

### Appendix B: Conversion Action Categories

| Category | Use Case | Example |
|----------|----------|---------|
| PHONE_CALL_LEAD | Phone call tracking | "Click to call" button |
| SUBMIT_LEAD_FORM | Form submission tracking | Contact form, lead capture |
| CONTACT | General contact action | Chat initiations, email submissions |
| PURCHASE | E-commerce transactions | Product purchases |
| SUBSCRIBE | Subscription sign-ups | Newsletter, membership |
| PAGE_VIEW | Specific page visit | Thank you page, confirmation page |

### Appendix C: Data Schema

**Project Configuration:**
```json
{
  "id": "uuid",
  "client_info": {
    "name": "Client Name",
    "domain": "example.com",
    "ga4_property_id": "123456",
    "gtm_container_id": "GTM-XXXXX",
    "google_ads_account": "1234567890"
  },
  "features_configured": {
    "gtm_triggers": true,
    "ga4_tags": true,
    "google_ads": true,
    "enhanced_conversions": false
  },
  "google_ads_resources": {
    "conversion_actions": [
      {
        "id": "9876543210",
        "name": "Client Name - Event Type",
        "category": "PHONE_CALL_LEAD",
        "created_at": "2025-01-13T10:30:00Z"
      }
    ]
  },
  "setup_metadata": {
    "completed_at": "2025-01-13T10:30:00Z",
    "last_updated_at": "2025-01-13T14:45:00Z",
    "user_email": "user@example.com"
  }
}
```

---

**Document Version:** 1.0
**Last Updated:** January 2025
**Status:** Ready for Google Ads API Application
