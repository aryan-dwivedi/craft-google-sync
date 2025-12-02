# Craft Calendar Sync — Project Plan (Supabase Only)

## 1. Vision

Create a reliable bridge between **Google Calendar** (time & scheduling) and **Craft** (notes & planning) so that:

- The **Craft daily note is always an accurate reflection of the user’s calendar**
- Users don’t need to manually copy or reconcile events
- Sync is **near real-time**, event-driven, and transparent

The MVP focuses on **Google → Craft** sync only.

---

## 2. Scope

| Area                       | Included in MVP | Notes / Future Work                 |
| -------------------------- | --------------- | ----------------------------------- |
| Google → Craft sync        | ✅              | Core focus                          |
| Craft → Google sync        | ❌              | Phase 2                             |
| AI daily summaries         | ❌              | Phase 2                             |
| Multi-calendar support     | ✅              | User selects calendars to sync      |
| User preferences (filters) | ❌              | Phase 2                             |
| Mobile app                 | ❌              | Out of scope                        |
| Other calendar providers   | ❌              | Out of scope (Outlook / iCloud etc) |

**MVP Goal:**  
If an event changes in Google Calendar, the corresponding daily note in Craft is **automatically updated** with no user action.

---

## 3. Core Concept

### Event-Driven Sync (No Cron / Polling)

- Use **Google Calendar push notifications** (Watch API)
- Each relevant calendar has an active watch subscription
- When events change, Google notifies a **Supabase Edge Function** via webhook
- The Edge Function updates Craft (create/update/delete event blocks)

---

## 4. Architecture Overview

| Layer         | Technology / Service                      |
| ------------- | ----------------------------------------- |
| Frontend      | Next.js + shadcn/ui                       |
| Auth          | Supabase Auth                             |
| Database      | Supabase Postgres                         |
| Backend Logic | Supabase Edge Functions                   |
| Calendar API  | Google Calendar API + push notifications  |
| Craft API     | Craft API (blocks + daily notes)          |
| AI (Phase 2)  | Provider-agnostic integration placeholder |

---

## 5. Integrations

### 5.1 Google Calendar

**Capabilities:**

- OAuth-based sign-in with Google
- Fetch list of calendars available to the user
- User chooses which calendars to sync
- Use **Watch API** to subscribe for push notifications per calendar

**Push Events to Handle:**

- Event created
- Event updated (time, title, description, meet link, etc.)
- Event canceled / deleted
- Event rescheduled (time change)

---

### 5.2 Craft

**Capabilities:**

- Locate or create the **Daily Note** for a given date
- Insert / update / delete **event blocks** in the daily note
- Maintain metadata mapping:
  - `google_event_id`
  - `craft_block_id`
  - timestamps, meet link, etc.

---

## 6. Craft Daily Note Design

**Example Layout:**

```text
# 2025-03-21 — Daily Note

## Today’s Agenda

09:00–09:30 • Daily Standup
10:30–11:00 • Client Call (Meet)
14:00–15:00 • 1:1 with Manager

## Notes & Tasks

• ...
```

**Event Block Requirements:**

Each event block must store metadata (either in Craft block properties or a mapping table):

- `google_event_id`
- Event start / end time (normalized to user’s timezone)
- Location or Meet link (optional)
- Associated calendar ID (for multi-calendar handling)

**Behavior:**

- Events are **sorted chronologically** under “Today’s Agenda”
- If the daily note doesn’t exist, it is **created on demand**
- If an event moves to a different date, it is **moved to the correct note**

---

## 7. Sync Flow (MVP: Google → Craft)

1. **Event Change in Google**

   - User (or another attendee) creates, edits, or cancels an event.

2. **Webhook from Google**

   - Google sends a push notification to a **Supabase Edge Function** endpoint.
   - Payload includes:
     - Channel ID (watch)
     - Resource ID / sync token (used to fetch actual events)

3. **Supabase Edge Function — Processing**

   - Validate the request (channel ID, signature, etc.)
   - Look up the **user + calendar** from the watch configuration
   - Use the Calendar API to fetch the **actual event data** based on the sync token
   - Normalize event data:
     - Title, start/end time, description
     - Location / meet link
     - Status (`confirmed`, `canceled`)

4. **Craft Update**

   - Find or create the **Daily Note** for the event date
   - **Upsert event block**:
     - If `google_event_id` exists in mapping table → update existing block
     - Otherwise → create a new block and insert mapping
   - If event is deleted / canceled:
     - Behavior (simple for MVP):
       - **Option A (initial)**: remove the block entirely
       - **Option B (configurable later)**: mark as canceled but keep visible

5. **Mapping Table Maintenance**
   - Table stores:
     - `user_id`
     - `calendar_id`
     - `google_event_id`
     - `craft_block_id`
     - `event_date`
   - Ensures:
     - No duplicate blocks
     - Correct behavior when events move across days

---

## 8. User Dashboard (Web App)

### 8.1 Main Sections

1. **Connections**

   - Google status:
     - Connected / Not connected
     - Last token refresh
   - Craft status:
     - Connected / Not connected
   - Actions:
     - Connect / Disconnect accounts

2. **Calendars to Sync**

   - List of user’s Google calendars
   - Checkboxes / switches for which ones to sync
   - Persisted in Supabase

3. **Agenda Preview**

   - Show **“Today’s Agenda”** as it would appear in Craft for the current day
   - Data from Google directly (not Craft) for fast preview
   - Helps debug before touching real notes

4. **Activity Log**
   - For support & transparency:
     - Last successful sync time
     - Webhook events received (type, calendar, timestamp)
     - Errors (e.g. token expiration, invalid watch)

---

## 9. Data Model (High-Level)

**Tables (Supabase Postgres, simplified):**

- `users`

  - `id`
  - Google OAuth tokens (access + refresh)
  - Craft API credentials

- `calendars`

  - `id`
  - `user_id`
  - `google_calendar_id`
  - `is_enabled` (for sync)
  - Watch channel data (resource ID, expiration, etc.)

- `event_mappings`

  - `id`
  - `user_id`
  - `google_calendar_id`
  - `google_event_id`
  - `craft_block_id`
  - `event_date`

- `sync_logs`
  - `id`
  - `user_id`
  - `type` (webhook, refresh, error)
  - `details` (JSON)
  - `created_at`

---

## 10. Milestones & Deliverables

| Milestone | Name                     | Deliverables                                                              |
| --------- | ------------------------ | ------------------------------------------------------------------------- |
| M1        | Foundations              | Next.js app scaffold, Supabase Auth, basic onboarding flow                |
| M2        | Google OAuth & Calendars | Google login, fetch user calendars, persist calendar mapping in DB        |
| M3        | Webhook Integration      | Setup Watch API, receive & validate notifications via Edge Functions      |
| M4        | Craft Event Injection    | Craft API integration, upsert event blocks, event_mappings table in place |
| M5        | MVP Polish               | Agenda preview, activity log, error surfacing, basic UX polish            |

---

## 11. Testing Strategy

### 11.1 Test Coverage

**Google Webhooks**

- Event created → new block in correct daily note
- Event updated:
  - Time change → block moves to correct time (and date if needed)
  - Title / description change → block updates
- Event deleted / canceled → block removed (or clearly marked)

**Craft Logic**

- Daily note:
  - Created when missing
  - Not duplicated
- Event ordering:
  - Events sorted by start time
  - Multi-day events handled consistently (for MVP: show only when active on that day)
- Mapping:
  - No duplicate blocks when repeated webhooks arrive
  - Correct behavior if event moves to another day (remove from old note, add to new one)

**Resilience**

- Expired Google tokens → refresh via `refresh_token`
- Expired watch channels → automatic re-subscription
- Invalid or malicious webhook → rejected gracefully
- Deleted calendars → stop syncing and surface error in dashboard

### 11.2 Testing Environment

- Use **sandbox / test calendars** for integration tests
- Optionally, a separate Craft workspace / space for testing
- Logging enabled in Supabase for all webhook calls

---

## 12. Risks & Mitigations

| Risk                                | Impact                          | Mitigation                                                 |
| ----------------------------------- | ------------------------------- | ---------------------------------------------------------- |
| Craft API rate limits               | Missed / delayed updates        | Batch writes, debounce bursts, exponential backoff         |
| Google webhook expiration           | Calendar stops syncing silently | Auto-renew watch channels, monitor expirations             |
| OAuth token expiry                  | Failed API calls                | Background token refresh using `refresh_token`             |
| Conflicting edits (Craft vs Google) | Data mismatch / user confusion  | MVP: treat Google as source of truth; Phase 2: conflict UI |
| Craft API changes                   | Integration breaks              | Encapsulate Craft calls, versioned adapter layer           |

---

## 13. Phase 2 Enhancements (Post-MVP)

Not part of MVP implementation, but important to keep in mind:

1. **Craft → Google Editing**

   - Create or edit events from our UI → sync back to Google
   - Bi-directional conflict handling

2. **AI Features**

   - Daily briefing (“Here’s your day in 3 bullets”)
   - Weekly recap (“Key events, themes, people you met”)

3. **User Preferences & Filters**

   - Include / exclude events by:
     - Calendar
     - Keywords (e.g., hide “Focus”, “Travel”)
     - Time ranges (e.g., hide events before 8am)
   - Show attendees / meeting owner badges in Craft

4. **Additional Providers**
   - Outlook / Microsoft 365
   - iCloud
   - Notion (as an alternate note destination)

---

## 14. Guiding Principles

- **Zero manual duplication**  
  Users should never feel they have to maintain both Craft and Google manually.

- **Accurate & trustworthy**  
  Craft daily notes should be a mirror of the calendar — users can rely on it.

- **Transparent & recoverable**  
  Clear logs and status so issues are visible and debuggable.

- **Webhook-first architecture**  
  No cron jobs or polling for sync; event-driven for scalability and efficiency.

- **User-owned data**  
  No unexpected sharing across users; each user controls their own connections and content.
