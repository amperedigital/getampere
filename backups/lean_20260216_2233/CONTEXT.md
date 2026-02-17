# Resume Capsule

Project Health: ~98% complete. Core memory live, DO cache deployed, identity flow hardened, and ElevenLabs Transcript Automation (Workspace Global) + HMAC security verified end-to-end.

Project: Cloudflare Worker memory-api
Worker URL: https://memory-api.tight-butterfly-7b71.workers.dev
Workspace(s): emily
D1 DB: memory_db (uuid: 4040c1fe-25e5-44ad-8b85-7fe14540a839)

## ElevenLabs Transcript & Intelligence Fixes (2026-02-09) [v2.943-2.945]
The previous "Agent Blindness" regarding situational briefing was caused by a broken feedback loop. The following fixes restore intelligence by securing the transcript ingestion pipeline.

- **Global Webhook Automation**:
  - **Inherent Problem**: Most agents had no post-call webhook configured, meaning transcripts never reached the backend to generate briefings.
  - **Solution**: Set `post_call_webhook_id` (`2d479404411f444a9a5e969c76c7023c`) at the **ElevenLabs Workspace Level** and within `elevenlabs-global-config.json`. Any agent (new or old) now automatically routes transcripts to our backend.
- **Webhook Security (HMAC-SHA256)**:
  - **Inherent Problem**: Incoming transcripts were unprotected and vulnerable to spoofing.
  - **Solution**: Implemented signature verification in `elevenLabsWebhook` using the `xi-signature` header and the `ELEVENLABS_WEBHOOK_SECRET`.
- **Authentication Bypass**:
  - **Inherent Problem**: The path `/integrations/elevenlabs/transcript` was being blocked by the standard `x-api-key` check (returning 401), preventing ElevenLabs from delivering data.
  - **Solution**: Specifically exempted the transcript path from standard auth in the main fetch handler, relying instead on the HMAC signature as the primary security layer.
- **Identity Resolution (Visitor ID)**:
  - **Inherent Problem**: Nomenclature discrepancy between `visitorId` (camelCase) and `visitor_id` (underscore). Additionally, the webhook handler didn't recognize web-sessions (which lack phone numbers) as valid for ingestion.
  - **Solution**: Standardized strictly on `visitor_id` (underscore) throughout `resolveSubjectId` and upgraded the webhook ingest to recognize and validate `visitor_id` as a primary subject identifier.
- **Prompt Priority (Briefing Visibility)**:
  - **Inherent Problem**: Situational briefing tags were often buried at the bottom of 40k+ character prompts, causing LLM attention drift.
  - **Solution**: Moved `{{situational_briefing}}` to the absolute top of all agent prompts. The agent now sees the "Last Sentiment" and "Last Outcome" before reading its own personality instructions.

## Dual-Modality Identity System (Architectural Source of Truth)
- **Unified Logic**: The system treats Phone and Web channels with identical architectural logic.
- **Modality-Specific Identifiers**:
  - **Phone Mode**: Automatically utilizes the `system__caller_id` (e164 phone number) as the primary user identifier (`subject_id`).
  - **Web Mode**: Automatically utilizes the `visitor_id` (cookie-injected UUID) as the primary user identifier (`subject_id`).
- **Persistence Policy**: The system interchangeability uses these IDs for all memory, bootstrap, and transcript lookups. In the web demo environment, the system strictly relies on the cookie/UUID and **never** requests redundant personal information like email or phone.

## Current Focus (2025-11-20)
- **ElevenLabs Router Reliability**: Fix the "Failed to evaluate expression" errors in agent handoffs. Bisect and simplify conditions to ensure robust routing.
- **Chapter 4: Rich Transcript Intelligence**:
  - Implement LLM post-processing for call transcripts to extract richer summaries and sentiments.
  - Store structured outcomes (e.g., "Interested", "Not Interested", "Needs Follow-up") alongside facts.
- **Go-High-Level (GHL) Integration**: Scaffold contact lookup/creation and note-logging. Notes now include **Agent Identity** (e.g., `[Sales Advisor]`) for better traceability.
- **Latency Guardrails**: Implement `needs_filler` logic to trigger micro-filler responses ("One moment...", "Let me check that for you") during backend-heavy tool calls.
- Canonical subject IDs:
  - Voice calls: store personal facts under `<phone>|<preferred name>` (e.g., `+15551234567|Jordan`). Keep phone/email/website facts on the bare phone (`+15551234567`) and map any salted hashes or legacy IDs to the canonical entry via `subject_links`.
  - Chat/web flows: store personal facts under `<email>|<preferred name>` (e.g., `alex@example.com|Alex`). When callers also provide a phone, save it as a contact fact on that same record rather than creating a parallel phone subject.
  - Always add `subject_links` rows so historical identifiers (hashed phones, raw emails) resolve to the canonical record; delete the legacy rows once the copy succeeds so we don’t see duplicates in `memories`.
  - Fact taxonomy: contact details + websites + conversation/kb summaries are tagged as non-sensitive (`contact_phone`, `contact_email`, `website`, `conversation_recap`, `kb_summary`), while personal items (`family_detail`, `pet_details`, `hobby_detail`, `vehicle_detail`, `address_detail`, `payment_history`, `budget`) stay gated behind OTP.
- OTP policy baseline:
  - Phones/emails that the caller just confirmed on the live channel are treated as low-risk metadata—agents can restate them immediately once identity_validate succeeds.
  - OTP only triggers when the caller wants sensitive stored facts (addresses, budgets, payment history, transcripts, family info, etc.) or requests a transcript summary; KB answers and contact metadata never require it.
  - Codes always go to the opposite channel (voice call → email OTP, chat/email → SMS OTP), include the active `session_id`, and after `auth_verify_otp` succeeds the agent reruns `memory_bootstrap` with that `session_id` to surface the newly unlocked data.

## Voice Router Notes (2025-11-18 update)
- Twilio calls are routed to `/twilio/voice` on this Worker. The handler normalizes the caller, stores timezone metadata via `identity_passthrough`, seeds `session_context`, and responds with the `<Connect><Stream>` TwiML that points to the ElevenLabs stream URL defined in `ELEVENLABS_TWILIO_STREAM_URL`.
- `/elevenlabs/init` now returns the full schema support requested (dynamic variables, `custom_llm_extra_body`, optional `conversation_config_override`, and `user_id`). ElevenLabs refuses any override unless the agent UI explicitly enables it, so turn on the “Overrides” toggles for **System prompt, First message, Agent language, Voice, Voice speed, Voice stability, Voice similarity**, and “Custom LLM extra body.” Without those switches, ElevenLabs responds with “Override for field '…' is not allowed by config.”
- Set the new worker secrets before deploying so `/elevenlabs/init` can hydrate the payload:
  - `ELEVENLABS_CUSTOM_LLM_PARAMS` (JSON blob) or individual vars `ELEVENLABS_CUSTOM_LLM_MODEL`, `ELEVENLABS_CUSTOM_LLM_TEMPERATURE`, `ELEVENLABS_CUSTOM_LLM_MAX_TOKENS`, `ELEVENLABS_CUSTOM_LLM_REASONING_EFFORT`.
  - `ELEVENLABS_CONVERSATION_OVERRIDE` (JSON) for prompt/first-message overrides; the worker auto-strips disallowed fields (like `voice_id` or `first_message`) if the UI toggle isn’t enabled.
- ElevenLabs is still returning “Invalid message received” before the greeting even plays, even though `/elevenlabs/init` now responds with the exact payload they requested (dynamic variables + custom LLM body + overrides). Latest log: `elevenlabs_init_response {"type":"conversation_initiation_client_data", ...}` for conversation `CA9ce7229c7890c3926ec0436f435a45ed` (2025-11-19 18:08:47Z). We’ve enabled every override toggle (system prompt, first message, language, LLM, voice, voice speed/stability/similarity, text only, custom LLM extra body) and provided the payload to support; they’re investigating why the runtime still rejects it.
- 2025-11-17: ElevenLabs is skipping the Conversation Initiation Client Data Webhook entirely on inbound calls (first webhook we see is `identity_validate`). Support ticket includes the `/elevenlabs/init` handler code plus call IDs `conv_01HFSMABCD123XYZ456` (09:42:11 UTC) and `conv_01HFSSL5PQ789JKL321` (10:04:58 UTC); we followed up with full repro logs per their request.
- 2025-11-17 (22:37 UTC) call log:
  - Front Door greeted, ran `identity_validate` + `memory_bootstrap`, then routed pricing → Sales Advisor via `set_context` (no init webhook fired; first log was identity call).
  - Sales Advisor answered with the concise pricing rundown (“$16/day inbound/outbound, $32/day bundle, 7-day trial, 30-day guarantee, no fees”). Caller asked for a follow-up sentence, so we added the new prompt rule: every pricing turn must immediately end with a conversational question (“Inbound, outbound, or bundle?”).
- ElevenLabs now requires the greeting sentence, the baseline `set_context → {…}` payload, and `conversation_id = {{system__conversation_id}}` assignment to live inside the same opening reply—no standalone inline action blocks.
- Every endpoint except `/elevenlabs/init` now enforces `x-api-key: 15bf5f77-01d1-4e72-b1f7-0587fb4d4e4c`, so keep that header consistent across tool configs and any new endpoints.
- Prompt safety rule: only reference `{{ }}` dynamic variables that ElevenLabs already defines (system vars like `{{system__conversation_id}}` or explicitly declared builder variables with placeholders); inline helpers (`{{#if}}`, undeclared handles, etc.) cause the greeting turn to fail and are banned.
- ElevenLabs system variables available in every prompt: `system__agent_id`, `system__current_agent_id`, `system__caller_id`, `system__called_number`, `system__call_duration_secs`, `system__time_utc`, `system__time`, `system__timezone`, `system__conversation_id`, `system__call_sid`. Any other dynamic variable must have a placeholder defined in the UI before use.

Secrets (never paste values):
- SUBJECT_SALT (hashing enabled)
- API keys per workspace (table `api_keys`)
- ElevenLabs tool secret: eapSrmrvgvjRRQBwjNUP (used by all tools)
- TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN / TWILIO_FROM_NUMBER (SMS fallback)
- SMTP2GO_API_KEY / SMTP2GO_FROM_EMAIL (email fallback)

Endpoints live:
- POST /memory/bootstrap    (read/write; subject_e164 hashing; query; write_ack)
- POST /memory/query        (facts by LIKE; agent filter tolerant)
- POST /memory/upsert       (summary + extracted_facts; INSERT OR IGNORE)
- POST /memory/transcript   (ingest transcript → auto summary + fact extraction + DO invalidation)
- POST /integrations/elevenlabs/transcript (webhook wrapper that normalizes ElevenLabs payloads before /memory/transcript)
- POST /identity/passthrough  (pre-chat/voice identifier seed → stores normalized phone/email per session)
- POST /identity/session      (fetch the primed identifier + metadata for any session_id)
- POST /identity/validate
- POST /auth/request-otp    (cross-channel code sender with hashed storage + 10m TTL)
- POST /auth/verify-otp     (confirms codes, unlocks session verification)
- POST /tools/calendar/availability  (D1 slots; capacity/booked/available)
- POST /tools/calendar/book          (D1 bookings)
- (Planned) /aftercall/outcome, /events/log (for dashboard)

Tables / Indexes:
- calls, call_summaries
- memories (UNIQUE: workspace_id, subject_id, agent_id, fact) + fact_type column for filtering
- api_keys
- session_identity (workspace_id/session_id PK; stores normalized contact + metadata for each live session)
- workspace_fact_policies (per-workspace fact taxonomy + keywords)
- session_verifications (workspace_id, session_id PK; stores hashed code, secondary contact, status, TTL)
- workspace_channels (per-workspace Twilio credentials + enable flags for SMS/email)
- slots (UNIQUE: workspace_id, slot_start, slot_end)
- bookings (idx on workspace_id, slot_start, slot_end)
- calendar_configs
- call_outcomes, events

Flags:
- USE_DO_CACHE=false
- DEBUG=true

Known working tests:
- subject_e164=+15551230007 → “Query memory for evening via bootstrap” returns 1 fact
- D1 slots seeded for emily (tomorrow UTC): 10:00, 10:30, 14:00, 15:00
- Booking marks that slot available=0

Since last session:
- Durable Object cache wired up and deployed; caching guard toggled via USE_DO_CACHE.
- Front-door prompt now enforces identity capture, immediate memory_upsert, and recall logic.
- ElevenLabs tool configs updated to use the correct secret and allow identity_validate/memory_upsert/memory_query in chat; added auth_request_otp + auth_verify_otp webhook configs so Emily can run the full OTP flow natively.
- Added `/integrations/elevenlabs/transcript` webhook so ElevenLabs can POST transcripts directly; Worker normalizes payloads, calls `/memory/transcript`, and facts appear instantly.
- Transcript ingestion now stores facts globally (agent_id NULL) and bootstrap/query fallback logic handles environments that haven’t added the `fact_type` column yet.
- Conversation initiation webhook now preloads `time_greeting`, `caller_name`, and `conversation_hint` so Emily’s first follow-up can be personalized before any extra tool calls.
- Added session-level verification: /auth/request-otp + /auth/verify-otp, 10-minute TTL codes, verification_level gating in bootstrap/query, and partial fact filtering until the session is verified.
- Cloned the full identity/OTP/memory control prompt into every ElevenLabs persona (demo guide, onboarding coach, sales advisor, technical specialist) so all agents can validate identifiers, send/verify OTPs, and read/write memories the same way as the front-door agent.
- Added a `defer_logging` flag on `memory_upsert` so handoff breadcrumbs or other summary-only logs can be enqueued asynchronously (facts/identity writes still run synchronously) and routing transfers no longer stall on D1 latency.
- Softened first-turn behavior so Emily answers pleasantries first and only requests contact info once the caller shares a need, keeping conversations less abrupt while still gating memory/Kb actions behind identity confirmation.
- Added explicit name-handling rules so agents immediately greet with the stored name (and confirm the caller’s preferred form) plus routing safeguards that keep conversations from bouncing between chains unless the topic truly changes.
- Added chat-mode guardrails so Emily never assumes a phone number when `system__caller_id` is empty and always re-confirms identifiers each session before referencing prior data.
- Added `channel_mode` propagation: whichever agent detects the current channel (voice vs. chat) now passes that flag through the silent JSON context so downstream specialists honor the same verification rules without guessing.
- Expanded the name-usage logic so chat sessions always collect a preferred first name post-ID and voice calls with confirmed caller IDs can immediately personalize and reference verified history once memory_bootstrap succeeds.
- Added shared-number handling: voice calls now confirm which person is using the line, offer stored contact choices, and create per-person subject_ids (`<phone>|<name>`) so multiple callers on a single number maintain distinct histories.
- Locked down recall flow: agents must finish the identifier step before answering KB questions, and memory_bootstrap is now mandatory immediately after identity_validate so stored names/email are available before the conversation continues.
- Strengthened personalization: every new session now explicitly asks permission before using a stored name, and agents only surface stored facts when they add value to the current turn (no reciting history just because it exists).
- Added fact-fallback guidance so person-level contacts automatically check the household-level phone/email record before claiming data is missing, and clarified that the front-door agent must finish identity+bootstrap before routing to avoid the “bouncing pause” loop you observed.
- Refined formatting rules so voice replies read phone numbers as “area code ###, number ### ####” (no “plus”) while chat/web responses use `(###) ###-####`, and ensured Emily always preloads both person- and household-level facts immediately after identity confirmation.
- OTP workflow tightened: any request to recall stored info (email, website, past notes) now forces Emily to gather the opposite-channel contact, send/verify an OTP, and only then quote the saved fact, so sensitive data is never exposed prematurely.
- Added Twilio OTP delivery scaffold: worker now looks up per-workspace channel credentials (workspace_channels table) with fallback to global env secrets, and calls Twilio's Messages API for SMS codes.
- Added SMTP2GO email delivery so phone-verified callers can receive OTPs via email; uses global SMTP2GO secrets unless a workspace disables email in `workspace_channels`.
- Per-workspace API keys supported via `api_keys` (emily workspace seeded) so each client agent authenticates with its own secret.
- ElevenLabs tool schema quirk: a request-body field can be either `value_type: "dynamic_variable"` or `value_type: "llm_prompt"`—never both on the same property—so whenever we need a dynamic value (e.g., session_id), wire it via an assignment/dynamic_variable and leave the rest as plain LLM prompts.
- Calendar availability/booking (D1 mode) still working.
- Privacy guardrail: never seed prompts, examples, or lexicons with the real operator’s personal details (names, phone numbers, emails). Use neutral placeholders like “Jordan” or `(555) 123-4567` whenever you need a sample value in docs, prompts, or test data.

Next TODOs:
- When running schema migrations, execute `scripts/run_sql_migrations.sh` twice (once with default `local`, once with `remote`) so both D1 instances stay in sync.
- Run remote D1 migrations (add `fact_type` column + `workspace_fact_policies` table) so typed facts persist formally instead of via runtime fallback.
- (Optional) finalize DO cache auto-refresh logic when transcripts write new facts.
- Migrate legacy subject_id rows to hashed identifiers so stored emails stop appearing at rest.
- Collect per-client Twilio/email creds (or disable channels) by seeding workspace_channels rows so each client controls SMS/email spend.
- 2025-11-19: Tested ElevenLabs’ guidance to return a “minimal” init payload (`{ type: "conversation_initiation_client_data", dynamic_variables: {} }`) by setting `ELEVENLABS_INIT_PAYLOAD_MODE=minimal`; the platform still failed immediately with “Invalid message received,” proving the issue isn’t tied to our payload shape. We’ve escalated both the full payload and the minimal test to support.

## End-to-End Intelligence Loop (Architectural Flow)
This section defines how a single conversation flows through the system to gain "intelligence" over time.

### 1. Transcript Receipt (`elevenLabsWebhook`)
**File**: `memory-api/src/index.ts`
- **Trigger**: ElevenLabs POSTs to `/integrations/elevenlabs/transcript` after a conversation.
- **Security**: Validates `xi-signature` header using `ELEVENLABS_WEBHOOK_SECRET` (HMAC-SHA256).
- **Extraction**:
    - **Identity**: Prioritizes `subject_id` -> `subject_e164` (Phone) -> `visitor_id` (Web). Fails if none found.
    - **Transcript**: Robustly extracts text from `transcription`, `transcript`, or `text` fields. Flatten array-based turns into a single string.
- **Action**: Calls `ingestTranscript` with the normalized payload.

### 2. Processing & Intelligence (`ingestTranscript`)
**File**: `memory-api/src/index.ts`
- **Database (Raw)**: Inserts raw transcript into `calls` table immediately.
- **Intelligence (LLM)**:
    - Checks if `summary` is already provided.
    - If not, calls `processRichTranscriptIntelligence`.
    - **Model**: `@cf/meta/llama-3-8b-instruct` (Cloudflare Workers AI).
    - **Prompt**: "You are an expert conversation analyst..." asking for JSON with `summary`, `sentiment`, `sentiment_label`, `outcome`, `action_items`.
- **Database (Structured)**:
    - Inserts the generated data into `call_summaries` table.
    - Columns: `summary`, `sentiment` (label), `structured_outcome`, `action_items`.

### 3. Fact Extraction (Memory)
**File**: `memory-api/src/index.ts`
- **Derivation**: Combines manual `extracted_facts` from the webhook with auto-extracted facts from `extractFactsFromTranscript` (Regex/Rule-based).
- **Persistence**: Calls `persistFacts` to save to `memories` table (D1).
- **Cache**: Invalidates `bootstrap` cache for this subject so next fetch gets fresh data.

### 4. Real-Time Notification (Viz)
**File**: `memory-api/src/index.ts`
- **Mechanism**: Cloudflare Durable Object (`MemoryCacheDO`).
- **Action**: Sends `POST` to `https://viz` (internal stub).
    - **Op**: `broadcast`
    - **Message**: `{ type: "call_summary", summary: ..., call_id: ... }`
- **Frontend Effect**: The `system-link.js` component receives this event and updates the UI "Activity Log" or "Last Call" display.

### 5. CRM Sync (Async)
**File**: `memory-api/src/index.ts`
- **Action**: `ctx.waitUntil(syncCallToCRM(...))`
- **Logic**: Pushes contact details and the generated summary/outcome to GoHighLevel (if configured).

### 6. The Empathy Loop (Next Call Phase 0)
**Context**: The reason for this entire system.
- **Mechanism**: The `situational_briefing` stored in `call_summaries` (Step 2) is retrieved during the *next* session's initialization (Phase B).
- **Injection**: It is passed to the Agent as a dynamic variable `{{situational_briefing}}`.
- **Prompt**: The Agent's System Prompt reads: "CONTEXT: SITUATIONAL BRIEFING {{situational_briefing}}".
- **Result**: The Agent sees "LAST INTERACTION: ... SENTIMENT: Negative" *before* saying hello, allowing it to adapt its tone immediately (Empathy Response).

### Phase D: Infrastructure Synchronization (The Orchestrator)
**Involved**: `publish.sh` & `sync.js`
- **Release**: Running `./scripts/publish.sh` deploys the Worker code and the `wrangler.toml` secrets.
- **Global Sync**: `sync.js` identifies prompt changes and merges the global `post_call_webhook_id` into every agent via the ElevenLabs Manager API.

---

## Chapter 4: Intelligence & Integrations (Next Major Milestone)
- **Rich Transcript Intelligence**:
  - Build transcript post-processing: richer summarization (LLM call), sentiment tags, and structured outcomes stored alongside facts.
  - Automate DO invalidation on fact extraction.
- **GHL CRM Integration**: find/create contact, drop notes, and promote key CRM facts into memory.
- **Per-workspace fact policies**: UI + API for managing taxonomies.
- **Google Calendar mode**: add service-account secrets, per-workspace calendar_config.
- **Admin GUI (Pages app)**: basic dashboard for workspace/memory management.

- **Durable Objects**: Managed via `MemoryCacheDO` for real-time state.

## Automated Logging
To eliminate manual log pasting, run:
```bash
./scripts/observe.sh
```
This pipes `wrangler tail` to `logs/live.log`. The agent can then monitor this file for real-time diagnostics.

## Key Workflows
To avoid breaking frontend logic or ElevenLabs interpolations:
- **Greeting**: Always use `user_time_greeting` (snake_case). Never `timeGreeting` or `userTimeGreeting`.
- **Session IDs**: Always use `session_id`.
- **Subject IDs**: Use `visitor_id` for web and `phone` for voice.

---

## Infrastructure
- All agent configurations are synced from the IDE to the ElevenLabs Dashboard.
- **Worker**: `https://elevenlabs-manager.tight-butterfly-7b71.workers.dev` (proxies `PATCH /v1/convai/agents/{id}`).
- **Mapping**: `elevenlabs-manager/agents.json` links local files to official Agent IDs.
- **Verification (v2.940)**: Successfully synchronized rich intelligence schema and emotion-aware prompts across all core agents.
