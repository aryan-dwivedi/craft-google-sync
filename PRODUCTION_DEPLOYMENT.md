# Production Deployment Guide - Vercel & Supabase

Complete step-by-step guide to deploy Craft Sync to production.

## Prerequisites

- [ ] GitHub repository created
- [ ] Vercel account
- [ ] Supabase project created
- [ ] Google OAuth credentials (production)
- [ ] Domain name (optional but recommended)

## Part 1: Supabase Setup

### 1.1 Create Production Project

```bash
# Login to Supabase
supabase login

# Link to your production project
supabase link --project-ref your-project-ref
```

Or create via dashboard:
1. Go to [supabase.com](https://supabase.com)
2. Click "New Project"
3. Name: "craft-sync-production"
4. Generate strong database password
5. Select region closest to users

### 1.2 Run Migrations

```bash
# Push schema to production
supabase db push

# Or run migrations individually
supabase migration up
```

Verify in Supabase Dashboard → Database → Tables:
- ✅ calendars
- ✅ event_mappings
- ✅ sync_logs
- ✅ user_settings

### 1.3 Configure Auth

**In Supabase Dashboard → Authentication → Providers:**

1. **Enable Google OAuth**:
   - Enable Google provider
   - Add production Client ID
   - Add production Client Secret
   - Authorized redirect URLs:
     ```
     https://your-project.supabase.co/auth/v1/callback
     https://your-domain.com/auth/callback
     ```

2. **Site URL**:
   ```
   https://your-domain.com
   ```

3. **Redirect URLs** (whitelist):
   ```
   https://your-domain.com/auth/callback
   https://your-domain.com/onboarding
   https://your-domain.com/dashboard
   ```

### 1.4 Deploy Edge Function

```bash
# Navigate to edge function
cd supabase/functions

# Deploy google-calendar-webhook
supabase functions deploy google-calendar-webhook

# Set environment variables
supabase secrets set APP_URL=https://your-domain.com
```

Verify deployment:
```bash
supabase functions list
```

### 1.5 Get Production Keys

From Supabase Dashboard → Project Settings → API:

```bash
# Save these for Vercel
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...  # ⚠️ Keep secret!
```

## Part 2: Google Cloud Setup

### 2.1 Create Production OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select your project (or create new)
3. **APIs & Services** → **Credentials**
4. Click **Create Credentials** → **OAuth 2.0 Client ID**

**Configure:**
- Application type: **Web application**
- Name: "Craft Sync Production"
- Authorized JavaScript origins:
  ```
  https://your-domain.com
  https://your-project.supabase.co
  ```
- Authorized redirect URIs:
  ```
  https://your-project.supabase.co/auth/v1/callback
  https://your-domain.com/auth/callback
  ```

5. **Download JSON** or copy:
   - Client ID
   - Client Secret

### 2.2 Enable Required APIs

Enable these APIs in Google Cloud Console:
- ✅ Google Calendar API
- ✅ Google+ API (for user info)

## Part 3: Vercel Deployment

### 3.1 Connect Repository

1. Go to [vercel.com](https://vercel.com)
2. Click **Add New** → **Project**
3. Import your GitHub repository
4. Framework Preset: **Next.js** (auto-detected)

### 3.2 Configure Environment Variables

In Vercel Project Settings → Environment Variables, add:

```env
# Supabase (from Part 1.5)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# Google OAuth (from Part 2.1)
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxx

# App URLs
NEXT_PUBLIC_APP_URL=https://your-domain.com
APP_URL=https://your-domain.com
```

**Important**: Add these to **Production**, **Preview**, and **Development** environments.

### 3.3 Configure Build Settings

```bash
# Build Command (default)
npm run build

# Output Directory (default)
.next

# Install Command (default)
npm install

# Development Command (default)
npm run dev
```

### 3.4 Deploy

Click **Deploy**

Wait for build to complete (~2-3 minutes)

### 3.5 Configure Domain (Optional)

In Vercel → Project → Settings → Domains:

1. Add custom domain: `your-domain.com`
2. Follow DNS instructions:
   ```
   Type: A
   Name: @
   Value: 76.76.21.21

   Type: CNAME
   Name: www
   Value: cname.vercel-dns.com
   ```
3. Wait for DNS propagation (up to 48 hours, usually ~1 hour)

### 3.6 Set Up Cron Job for Token Refresh

In Vercel → Project → Settings → Cron Jobs:

**Or** add `vercel.json` in project root:

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

Commit and push:
```bash
git add vercel.json
git commit -m "Add token refresh cron job"
git push
```

## Part 4: Final Configuration

### 4.1 Update Sitemap & Robots

Update `public/sitemap.xml`:
```xml
<loc>https://your-domain.com</loc>
```

Update `public/robots.txt`:
```
Sitemap: https://your-domain.com/sitemap.xml
```

### 4.2 Update Metadata

Update `src/app/layout.tsx`:
```typescript
metadataBase: new URL("https://your-domain.com")
```

### 4.3 Deploy Changes

```bash
git add .
git commit -m "Update production URLs"
git push
```

Vercel will automatically redeploy.

## Part 5: Verification

### 5.1 Test OAuth Flow

1. Go to `https://your-domain.com`
2. Click "Get Started"
3. Complete Google OAuth
4. Complete onboarding
5. Verify dashboard loads

### 5.2 Test Calendar Sync

1. Add a test event in Google Calendar
2. In dashboard, click "Sync Now"
3. Verify event appears in Craft

### 5.3 Test Webhook

1. Create/update event in Google Calendar
2. Check Vercel logs for webhook hit:
   ```bash
   vercel logs --follow
   ```
3. Verify event syncs automatically

### 5.4 Test Token Refresh

Wait 1 hour, or trigger manually:
```bash
curl -X POST https://your-domain.com/api/refresh-tokens
```

Check response for successful refresh.

## Part 6: Monitoring & Analytics

### 6.1 Set Up Vercel Analytics

In Vercel → Project → Analytics:
- Enable Web Analytics
- Enable Speed Insights

### 6.2 Set Up Error Tracking (Optional)

**Sentry Integration:**
```bash
npx @sentry/wizard@latest -i nextjs

# Add to vercel.json
{
  "env": {
    "SENTRY_DSN": "@sentry-dsn"
  }
}
```

### 6.3 Set Up Uptime Monitoring

Use services like:
- [UptimeRobot](https://uptimerobot.com) (Free)
- [Better Uptime](https://betteruptime.com)
- Vercel's built-in monitoring

Configure:
- URL: `https://your-domain.com`
- Check interval: 5 minutes
- Alert email

## Part 7: SEO & Production Readiness

### 7.1 Submit to Google Search Console

1. Go to [Google Search Console](https://search.google.com/search-console)
2. Add property: `https://your-domain.com`
3. Verify ownership (DNS or HTML file)
4. Submit sitemap: `https://your-domain.com/sitemap.xml`

### 7.2 Create Icon Images

Use [Favicon Generator](https://realfavicongenerator.net/):
1. Upload your SVG icon
2. Generate all sizes
3. Download package
4. Replace files in `/public`:
   - favicon.ico
   - icon-192.png
   - icon-512.png
   - apple-icon.png

### 7.3 Create OG Image

Create `/public/og-image.png` (1200x630px):
- Use Figma/Canva
- Include logo and tagline
- Export as PNG

Or use [OG Image Generator](https://og-image.vercel.app/)

### 7.4 Test SEO

Run these checks:
- ✅ [Lighthouse](https://pagespeed.web.dev/)
- ✅ [Meta Tags Preview](https://metatags.io/)
- ✅ [Twitter Card Validator](https://cards-dev.twitter.com/validator)
- ✅ [Facebook Debugger](https://developers.facebook.com/tools/debug/)

Target scores:
- Performance: > 90
- Accessibility: > 90
- Best Practices: > 90
- SEO: 100

## Part 8: Security Checklist

- [ ] Environment variables secured in Vercel
- [ ] Service role key never exposed to client
- [ ] CORS configured correctly
- [ ] RLS policies enabled on all tables
- [ ] OAuth redirect URLs whitelisted
- [ ] Webhook endpoints secured
- [ ] Rate limiting considered
- [ ] HTTPS enforced (automatic with Vercel)

## Part 9: Troubleshooting

### OAuth Errors

**Error**: "redirect_uri_mismatch"
- Check Google Cloud Console redirect URIs
- Ensure exact match including protocol (https://)
- Check Supabase Auth settings

**Error**: "invalid_client"
- Verify GOOGLE_CLIENT_ID and SECRET in Vercel
- Check they match Google Cloud Console

### Webhook Not Working

**Symptoms**: Events not syncing automatically
- Check Supabase edge function logs:
  ```bash
  supabase functions logs google-calendar-webhook
  ```
- Verify APP_URL is set correctly
- Check Vercel logs for /api/sync hits
- Ensure calendar has valid watch set up

### Token Expired

**Symptoms**: "401 Unauthorized" errors
- Check token_expiry in database
- Manually trigger refresh:
  ```bash
  curl -X POST https://your-domain.com/api/refresh-tokens
  ```
- Verify SUPABASE_SERVICE_ROLE_KEY is set

### Database Connection Issues

- Check Supabase project status
- Verify connection string
- Check RLS policies aren't too restrictive

## Part 10: Rollback Plan

If deployment fails:

### Rollback Vercel
```bash
# List deployments
vercel ls

# Rollback to previous
vercel rollback [deployment-url]
```

### Rollback Database
```bash
# Rollback last migration
supabase db reset

# Or restore from backup in Supabase Dashboard
```

## Success Checklist

- [ ] Supabase project created and configured
- [ ] Migrations applied successfully
- [ ] Auth providers configured
- [ ] Edge function deployed
- [ ] Google OAuth credentials created (production)
- [ ] Vercel project deployed
- [ ] Environment variables set
- [ ] Custom domain configured (optional)
- [ ] Cron job for token refresh active
- [ ] OAuth flow tested and working
- [ ] Calendar sync tested and working
- [ ] Webhooks tested and working
- [ ] Icon images created
- [ ] OG image created
- [ ] Submitted to Google Search Console
- [ ] SEO score > 90
- [ ] Monitoring set up
- [ ] Error tracking configured (optional)

## Support & Resources

**Documentation:**
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Vercel Docs](https://vercel.com/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Google OAuth Guide](https://developers.google.com/identity/protocols/oauth2)

**Community:**
- [Next.js Discord](https://nextjs.org/discord)
- [Supabase Discord](https://discord.supabase.com)
- [Vercel Community](https://github.com/vercel/vercel/discussions)

## Post-Deployment

After successful deployment:

1. **Announce Launch** 🚀
   - Share on social media
   - Post on Product Hunt
   - Share in relevant communities

2. **Monitor First Week**
   - Check error logs daily
   - Monitor user signups
   - Watch for OAuth issues
   - Track sync success rate

3. **Gather Feedback**
   - Add feedback form
   - Monitor support requests
   - Track feature requests

4. **Iterate**
   - Fix critical bugs immediately
   - Plan feature updates
   - Improve documentation

Congratulations on your deployment! 🎉
