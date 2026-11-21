# Gmail and Google Calendar

Each person connects **their own** Gmail and Calendar. There is no shared
mailbox. Tokens are stored encrypted on the server. One user's mailbox, tokens or
review queue are never visible to another user.

## Status

| | |
|---|---|
| Code | Complete: OAuth connect, disconnect and reconnect, token refresh, revocation handling, send email, create meeting, metadata sync, calendar sync, review queue, exclusions, scheduled sync. |
| Active? | **Only after** the Google Cloud steps below **and** `GOOGLE_OAUTH_CLIENT_ID`, `GOOGLE_OAUTH_CLIENT_SECRET`, `TOKEN_ENCRYPTION_KEY` and `SUPABASE_SERVICE_ROLE_KEY` are set. Until then the UI says "awaiting Google Cloud configuration" and everyone logs activity manually. |
| Not yet tested against live Google APIs | The code follows the published Gmail and Calendar REST contracts. It cannot be exercised end-to-end without KiviTronics credentials. Run the checklist at the end of this file after configuring. |

## Scopes: the narrowest set that supports the features

| Connection | Scope | Google classification | Why |
|---|---|---|---|
| both | `openid`, `email` | — | Confirms the connected account is the signed-in person's own Workspace address |
| Gmail | `gmail.send` | Sensitive | Send email from CRM records as the user |
| Gmail | `gmail.metadata` | **Restricted** | Read headers only (From, To, Cc, Subject, Date) to log CRM-related threads. It **cannot** read bodies or attachments. |
| Calendar | `calendar.events` | Sensitive | Read events to log meetings with CRM contacts, and create meetings from CRM records |

Deliberately **not** requested: `gmail.readonly`, `gmail.modify` and
`https://mail.google.com/` (full mailbox access), and `calendar` (settings and
sharing). Message bodies are never synced. For emails *sent from the CRM*, the
CRM keeps the text the user typed, as part of the record.

## Google verification and security assessment

- **Recommended: Internal app.** If the OAuth consent screen's user type is
  **Internal** (the project is owned by the `kivitronicsconsulting.com`
  organisation), only Workspace members can authorise it. Google then does
  **not** require app verification or the annual third-party security assessment
  (CASA), even for restricted scopes such as `gmail.metadata`. This is the
  intended setup.
- **External app (not recommended).** Sensitive scopes need Google's
  verification review. The restricted `gmail.metadata` scope additionally needs
  an annual security assessment by an approved assessor, which has a cost and
  takes weeks. If you must go External, you could drop `gmail.metadata` from
  `src/lib/google/scopes.ts`. You would keep sending, but lose email sync (you
  would log emails manually).
- A Workspace admin may need to allow the app. In **Admin console → Security →
  Access and data control → API controls → App access control**, mark the CRM's
  OAuth client as **Trusted** if third-party app access is restricted.

## Google Cloud steps **[owner]**

1. Use the same project as sign-in (docs/SETUP.md §4a).
2. Go to **APIs & Services → Library** and enable the **Gmail API** and the
   **Google Calendar API**.
3. Go to the **OAuth consent screen**, then **Data access** / **Scopes**, and add
   these exact scopes: `gmail.send`, `gmail.metadata`, `calendar.events`.
4. Make sure the OAuth client has the redirect URI
   `https://crm.kivitronicsconsulting.com/api/integrations/google/callback`. For
   local development, also add `http://localhost:3000/...`.
5. Set these environment variables:
   - `GOOGLE_OAUTH_CLIENT_ID` and `GOOGLE_OAUTH_CLIENT_SECRET`
   - `TOKEN_ENCRYPTION_KEY`, generated with
     `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`
6. Redeploy.

## How it behaves

**Connecting:**
- **Settings → Connect Gmail** (or Calendar) opens Google's consent screen with
  the scopes above.
- The callback is protected by a signed, user-bound, 10-minute `state` value and
  an httpOnly nonce cookie.
- The CRM rejects the connection, and revokes the token, if:
  - the Google account is not the signed-in person's own address; or
  - any requested permission was unticked.

**Tokens:**
- Encrypted with AES-256-GCM and stored in `google_connections`. The browser and
  API roles have no access to that table.
- Access tokens refresh automatically.
- If Google reports `invalid_grant` (the user revoked access, changed their
  password, or an admin removed the app), the connection is marked **Reconnect
  needed**. Settings then shows a Reconnect button.

**Email sync** (gmail.metadata) runs when you click **Sync now**, every 30
minutes via cron, and right after connecting:
- The first sync looks back 30 days; after that it is incremental, using the
  Gmail history API. If the history cursor expires, it does a bounded rescan.
- **Logged automatically** (visible to the team as an activity): messages where
  a participant's email matches a CRM contact.
- **Review queue** (private to the mailbox owner): messages with someone at a CRM
  company's domain who is not yet a contact. The owner either logs each one to a
  company or contact, or ignores it.
- **Ignored and never stored:** everything else, including personal mail,
  newsletters, colleague-only threads and free-mail domains.
- **"Not CRM" on a synced activity** archives it and adds the thread to the
  user's exclusions, so future syncs skip it.
- **Duplicates:** a unique index on (origin, mailbox owner, Gmail message id), so
  re-syncing can't double-log.

**Calendar sync:**
- Covers events from 30 days ago to 60 days ahead.
- Events with CRM contacts as attendees become meeting activities. Time changes
  and cancellations update the existing activity instead of creating a new one.

**Sending:**
- Sends from the user's own Gmail with a plain-text body.
- Header injection is blocked: the subject must be a single line, and addresses
  are validated.
- The sent message is linked to the record it was sent from.

**Creating meetings:**
- Creates the event on the user's primary calendar, optionally emailing invites
  to attendees.
- The meeting is linked to the record it was created from.

**Disconnecting:**
- Revokes the token at Google and deletes the stored tokens.
- Activities already logged stay in the CRM.

## Verification checklist after configuring

1. Connect Gmail. Settings should show *Connected* and the account address.
2. Add a contact whose email you can write from. Exchange an email, then click
   **Sync now**. The thread should appear on the contact's timeline as "Synced
   from Gmail".
3. Email someone at a CRM company's domain who isn't a contact. It should appear
   in **your** review queue only, and not for a teammate.
4. Send an email from a contact page. It should arrive, appear in your Gmail
   *Sent* folder, and show on the timeline.
5. Connect Calendar and create a meeting from an opportunity. The event should
   appear on your calendar. Move it in Google Calendar, then sync: the CRM time
   should update.
6. Revoke the app at <https://myaccount.google.com/permissions> and click **Sync
   now**. Settings should show *Reconnect needed*.
