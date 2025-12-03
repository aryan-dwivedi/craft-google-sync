# Deployment Checklist - Token Refresh System

## Prerequisites

- [ ] Supabase project set up
- [ ] Google OAuth credentials configured
- [ ] Vercel account (or alternative hosting)

## Database Setup

### 1. Run Migrations

```bash
# Add unique constraint to watch_channel_id
supabase db push

# Or manually run in Supabase SQL Editor:
ALTER TABLE public.calendars
ADD CONSTRAINT calendars_watch_channel_id_key UNIQUE (watch_channel_id);

# Add token_expiry column
ALTER TABLE public.calendars
ADD COLUMN IF NOT EXISTS token_expiry timestamp with time zone;
```

### 2. Verify Schema

Run this query to check:

```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'calendars'
ORDER BY ordinal_position;
```

Should include:
- `access_token` (text)
- `refresh_token` (text)
- `token_expiry` (timestamp with time zone)
- `watch_channel_id` (text, unique)

## Environment Variables

### Required Variables

Add to Vercel (or your hosting platform):

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key  # ⚠️ Keep secret!

# Google OAuth
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_client_secret

# App URL (for webhooks)
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
APP_URL=https://your-app.vercel.app  # For edge function
```

### Supabase Edge Function Secrets

```bash
# Set edge function environment variable
supabase secrets set APP_URL=https://your-app.vercel.app
```

## Deployment Steps

### 1. Deploy Application

```bash
# Commit changes
git add .
git commit -m "Add automatic token refresh system"

# Deploy to Vercel
vercel --prod

# Or push to main if auto-deploy enabled
git push origin main
```

### 2. Set Up Cron Job (Recommended)

**Option A: Vercel Cron**

Create/update `vercel.json`:

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

Commit and redeploy:
```bash
git add vercel.json
git commit -m "Add token refresh cron job"
vercel --prod
```

**Option B: External Cron Service**

Use a service like cron-job.org:
- URL: `https://your-app.vercel.app/api/refresh-tokens`
- Method: POST
- Schedule: `0 * * * *` (every hour)
- Timeout: 60 seconds

### 3. Verify Deployment

Check all endpoints are working:

```bash
# Health check
curl https://your-app.vercel.app/api/refresh-tokens

# Should return:
# {"status":"ok","endpoint":"/api/refresh-tokens",...}

# Check sync endpoint
curl -X POST https://your-app.vercel.app/api/sync \
  -H "Content-Type: application/json" \
  -d '{"channelId":"test"}'

# Should return 404 (expected - no calendar with that ID)
```

## Post-Deployment Testing

### 1. Test OAuth Flow

1. Go to `/onboarding`
2. Complete onboarding
3. Connect Google Calendar
4. Verify in Supabase database:

```sql
SELECT
  google_calendar_id,
  access_token IS NOT NULL as has_access,
  refresh_token IS NOT NULL as has_refresh,
  token_expiry
FROM calendars
WHERE user_id = 'your-user-id';
```

All should be `true` and `token_expiry` should be ~1 hour in future.

### 2. Test Automatic Refresh

Create a test event in Google Calendar and wait for webhook, or:

```bash
# Manually trigger sync
curl -X POST https://your-app.vercel.app/api/sync \
  -H "Content-Type: application/json" \
  -d '{"channelId":"your-channel-id"}'
```

Check logs for "Google OAuth tokens refreshed".

### 3. Test Proactive Refresh

```bash
curl -X POST https://your-app.vercel.app/api/refresh-tokens
```

Expected response:
```json
{
  "message": "Token refresh complete: X succeeded, 0 failed",
  "total": X,
  "refreshed": X,
  "failed": 0,
  "errors": []
}
```

## Monitoring

### Check Logs

**Vercel:**
```bash
vercel logs --follow
```

**Supabase:**
```bash
supabase functions logs google-calendar-webhook
```

### Key Metrics to Monitor

- Token refresh success rate
- Number of 401 errors (token expired)
- Webhook success rate
- Calendar sync failures

### Dashboard Query

Run in Supabase to check token health:

```sql
SELECT
  COUNT(*) as total_calendars,
  COUNT(*) FILTER (WHERE token_expiry > NOW()) as valid_tokens,
  COUNT(*) FILTER (WHERE token_expiry <= NOW()) as expired_tokens,
  COUNT(*) FILTER (WHERE token_expiry IS NULL) as no_expiry_set,
  COUNT(*) FILTER (WHERE refresh_token IS NULL) as no_refresh_token
FROM calendars
WHERE is_enabled = true;
```

## Rollback Plan

If issues occur:

### 1. Disable Cron Job
- In Vercel: Remove from `vercel.json` and redeploy
- External service: Pause the cron job

### 2. Revert Code
```bash
git revert HEAD
git push origin main
```

### 3. Database Rollback (if needed)
```sql
-- If you need to remove token_expiry column
ALTER TABLE calendars DROP COLUMN IF EXISTS token_expiry;
```

## Troubleshooting

### Issue: Tokens not refreshing

**Check:**
1. `SUPABASE_SERVICE_ROLE_KEY` is set correctly
2. Migration ran successfully
3. Google OAuth has `access_type: 'offline'`

**Fix:**
```bash
# Verify environment variables
vercel env ls

# Check migration status
supabase db diff
```

### Issue: 401 Unauthorized errors

**Check:**
1. Tokens exist in database
2. Refresh token is not null
3. OAuth was configured with offline access

**Fix:**
Have users reconnect their Google account:
1. Revoke access in Google Account settings
2. Reconnect through your app

### Issue: Cron job not running

**Check:**
1. Vercel Pro plan (free tier has limited cron)
2. `vercel.json` is in root directory
3. Path is correct: `/api/refresh-tokens`

**Fix:**
```bash
# Check Vercel logs
vercel logs --limit 100

# Test endpoint manually
curl -X POST https://your-app.vercel.app/api/refresh-tokens
```

## Success Criteria

- [ ] Build passes: `npm run build`
- [ ] Migrations applied successfully
- [ ] All environment variables set
- [ ] OAuth flow completes and stores tokens
- [ ] Automatic refresh works on API calls
- [ ] Proactive refresh endpoint works
- [ ] Cron job scheduled and running
- [ ] Webhook sync continues working after 1 hour
- [ ] No 401 errors in logs
- [ ] Token expiry dates updating in database

## Support

For issues or questions:
- Check logs in Vercel and Supabase
- Review `docs/TOKEN_REFRESH.md` for detailed documentation
- File an issue in the repository
