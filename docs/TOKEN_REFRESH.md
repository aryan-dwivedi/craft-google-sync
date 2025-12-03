# Google OAuth Token Refresh System

## Overview

This document explains how the automatic token refresh system works to ensure Google Calendar API access never expires.

## Problem

Google OAuth access tokens expire after 1 hour. Without proper handling:
- Webhooks fail when tokens expire
- Calendar sync stops working
- Users must manually reconnect their Google account

## Solution

We've implemented a comprehensive token refresh system with three layers of protection:

### 1. **Automatic Refresh on API Calls**

When any API call is made to Google Calendar, the system automatically:
- Detects if the token is expired or about to expire
- Uses the refresh token to get a new access token
- Persists the new token to the database
- Continues with the API call seamlessly

**Implementation**: `src/lib/google-auth.ts`

```typescript
// Automatically refreshes tokens when they expire
const oauth2Client = await setupOAuthClientWithRefresh(
  accessToken,
  refreshToken,
  userId,
  calendarId
)
```

### 2. **Database Token Persistence**

All tokens are stored in the database:
- Access token (expires in 1 hour)
- Refresh token (long-lived, used to get new access tokens)
- Token expiry timestamp

**Schema**: `supabase/schema.sql`

```sql
CREATE TABLE calendars (
  access_token text,
  refresh_token text,
  token_expiry timestamp with time zone,
  ...
);
```

### 3. **Proactive Token Refresh**

A scheduled job can proactively refresh tokens before they expire:

**Endpoint**: `POST /api/refresh-tokens`

This endpoint:
- Finds all calendars with tokens expiring in the next hour
- Refreshes them proactively
- Updates the database with new tokens

## Token Flow

### Initial OAuth Flow

```
User clicks "Connect Google Calendar"
  ↓
Google OAuth (with access_type=offline, prompt=consent)
  ↓
Receive: access_token + refresh_token
  ↓
Store both in database + Supabase auth session
  ↓
Token expiry set to +1 hour
```

### Automatic Refresh Flow

```
API call to Google Calendar
  ↓
Google Auth library detects expired/expiring token
  ↓
Automatically uses refresh_token to get new access_token
  ↓
'tokens' event fires
  ↓
New tokens persisted to database
  ↓
API call continues with new token
```

### Proactive Refresh Flow (via Cron)

```
Cron job hits /api/refresh-tokens
  ↓
Query calendars with tokens expiring < 1 hour
  ↓
For each calendar:
  - Call refreshGoogleTokens(refresh_token)
  - Get new access_token
  - Update database
  ↓
Return summary: {refreshed: 5, failed: 0}
```

## Key Files

### Core Token Management
- `src/lib/google-auth.ts` - Token refresh utilities
- `src/utils/supabase/server.ts` - Service client for bypassing RLS

### API Routes
- `src/app/api/sync/route.ts` - Webhook sync with auto-refresh
- `src/app/api/refresh-tokens/route.ts` - Proactive refresh endpoint
- `src/app/auth/callback/route.ts` - OAuth callback with token persistence

### Database
- `supabase/schema.sql` - Calendar table with token fields
- `supabase/migrations/20251203_add_token_expiry.sql` - Add token_expiry column

### Actions
- `src/app/actions/calendar.ts` - Calendar operations with token refresh

## Setup Instructions

### 1. Run Database Migration

```bash
# Apply the token_expiry column migration
supabase db push

# Or run SQL directly:
ALTER TABLE public.calendars
ADD COLUMN IF NOT EXISTS token_expiry timestamp with time zone;
```

### 2. Set Up Cron Job (Optional but Recommended)

To proactively refresh tokens before they expire, set up a cron job:

**Using Vercel Cron:**

Add to `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/refresh-tokens",
      "schedule": "0 * * * *"
    }
  ]
}
```

**Using External Cron Service:**

Configure a service like cron-job.org to hit:
```
POST https://your-app.vercel.app/api/refresh-tokens
```

Schedule: Every hour

### 3. Verify OAuth Configuration

Ensure Google OAuth requests offline access:

`src/components/onboarding/steps/GoogleConnectStep.tsx`:

```typescript
await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    scopes: 'https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/calendar.readonly',
    queryParams: {
      access_type: 'offline',  // ✅ Critical for refresh tokens
      prompt: 'consent',        // ✅ Forces refresh token issuance
    },
  },
})
```

## Testing

### Test Automatic Refresh

1. Wait for a token to expire (1 hour)
2. Create/update a calendar event
3. Check logs - you should see "Google OAuth tokens refreshed"
4. Verify database updated with new token

### Test Proactive Refresh

```bash
# Call the refresh endpoint
curl -X POST https://your-app.vercel.app/api/refresh-tokens

# Expected response:
{
  "message": "Token refresh complete: 3 succeeded, 0 failed",
  "total": 3,
  "refreshed": 3,
  "failed": 0,
  "errors": []
}
```

### Test Token Persistence

1. Complete OAuth flow
2. Check database:
```sql
SELECT
  google_calendar_id,
  access_token IS NOT NULL as has_access_token,
  refresh_token IS NOT NULL as has_refresh_token,
  token_expiry
FROM calendars
WHERE user_id = 'your-user-id';
```

## Monitoring

### Log Messages to Watch

**Success:**
```
Google OAuth tokens refreshed: { hasAccessToken: true, hasRefreshToken: true, expiryDate: 1701234567890 }
Successfully persisted refreshed tokens to database
```

**Warning:**
```
Failed to refresh Google tokens: <error>
No refresh token available. Please reconnect your Google account.
```

### Health Check

```bash
# Check refresh endpoint status
curl https://your-app.vercel.app/api/refresh-tokens

# Response:
{
  "status": "ok",
  "endpoint": "/api/refresh-tokens",
  "description": "Proactively refresh Google OAuth tokens for enabled calendars"
}
```

## Troubleshooting

### Tokens Still Expiring

**Symptom**: Webhooks fail after 1 hour

**Solutions**:
1. Verify `access_type: 'offline'` in OAuth config
2. Check database has `refresh_token` populated
3. Enable debug logging in `google-auth.ts`
4. Run migration to add `token_expiry` column

### No Refresh Token

**Symptom**: `refresh_token` is NULL in database

**Solutions**:
1. Ensure `prompt: 'consent'` in OAuth config
2. User must re-authenticate (revoke and reconnect)
3. Google only issues refresh token on first consent or when forced

### Refresh Fails

**Symptom**: "Failed to refresh Google tokens" in logs

**Solutions**:
1. Check Google API credentials are valid
2. Verify refresh token hasn't been revoked by user
3. Check Google Cloud Console for API errors
4. User may need to reconnect

## Security Considerations

1. **Service Role Key**: Used to bypass RLS for token updates
   - Stored in `SUPABASE_SERVICE_ROLE_KEY` env var
   - Never exposed to client
   - Only used server-side

2. **Token Storage**: Tokens are encrypted at rest in Supabase

3. **RLS Policies**: Regular users can't access other users' tokens

## Future Improvements

- [ ] Add token expiry alerts (email user when refresh fails)
- [ ] Implement token rotation strategy
- [ ] Add metrics dashboard for token refresh success rate
- [ ] Implement graceful degradation when refresh fails
- [ ] Add webhook to notify when user needs to reconnect
