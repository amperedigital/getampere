/// <reference types="@cloudflare/workers-types" />

export interface Env {
  D1_DB: D1Database;
  API_KEY: string;
  USE_DO_CACHE?: string;
  MEMORY_CACHE?: DurableObjectNamespace;
  SUBJECT_SALT?: string; // add
  DEBUG?: string;        // optional
  TWILIO_ACCOUNT_SID?: string;
  TWILIO_AUTH_TOKEN?: string;
  TWILIO_FROM_NUMBER?: string;
  ELEVENLABS_TWILIO_STREAM_URL?: string;
  ELEVENLABS_LATENCY_PROFILE?: string;
  TOOL_LATENCY_FILLER_MS?: string;
  ELEVENLABS_CUSTOM_LLM_PARAMS?: string;
  ELEVENLABS_CUSTOM_LLM_MODEL?: string;
  ELEVENLABS_CUSTOM_LLM_TEMPERATURE?: string;
  ELEVENLABS_CUSTOM_LLM_MAX_TOKENS?: string;
  ELEVENLABS_CUSTOM_LLM_REASONING_EFFORT?: string;
  ELEVENLABS_FIRST_MESSAGE?: string;
  ELEVENLABS_CONVERSATION_OVERRIDE?: string;
  ELEVENLABS_INIT_PAYLOAD_MODE?: string;
  ELEVENLABS_INIT_WEBHOOK_SECRET?: string;
  ELEVENLABS_WEBHOOK_SECRET?: string;
  SMTP2GO_API_KEY?: string;
  SMTP2GO_FROM_EMAIL?: string;
  AI?: any;
}
type Json = Record<string, unknown>;
type IncomingFact = {
  fact: string;
  confidence?: number;
  fact_type?: string | null;
};

type FactPolicy = {
  fact_type: string;
  enabled: boolean;
  max_per_subject: number;
  keywords: string[];
  regex?: string | null;
};

type FactPolicyMap = Record<string, FactPolicy>;

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest("SHA-256", data);
  const bytes = new Uint8Array(hash);
  let hex = "";
  for (const b of bytes) hex += b.toString(16).padStart(2, "0");
  return hex;
}

function normalizeE164(input: string): string {
  const s = String(input || "");
  // keep digits and a leading '+'
  const cleaned = s.replace(/[^\d+]/g, "");
  if (cleaned.startsWith("+")) return cleaned;
  return "+" + cleaned.replace(/^\+/, "");
}

let subjectLinkTableSupported: boolean | null = null;

function isMissingSubjectLinksTable(err: any) {
  return String(err?.message || "").includes("no such table: subject_links");
}

async function getCanonicalSubjectId(env: Env, workspaceId: string, subjectId: string): Promise<string> {
  if (!workspaceId || !subjectId || subjectLinkTableSupported === false) return subjectId;
  let current = subjectId;
  const visited = new Set<string>();
  while (current && !visited.has(current)) {
    visited.add(current);
    try {
      const row = await env.D1_DB
        .prepare(
          "SELECT primary_subject_id FROM subject_links WHERE workspace_id = ? AND alias_subject_id = ?"
        )
        .bind(workspaceId, current)
        .first<{ primary_subject_id: string }>();

      // DEBUG LOG LINK
      if (row?.primary_subject_id && row.primary_subject_id !== current) {
        console.log(`LINK_LOOKUP: ${current} -> ${row.primary_subject_id}`);
      }

      if (!row?.primary_subject_id || row.primary_subject_id === current) {
        if (subjectLinkTableSupported === null) subjectLinkTableSupported = true;
        break;
      }
      current = row.primary_subject_id;
    } catch (err: any) {
      if (isMissingSubjectLinksTable(err)) {
        subjectLinkTableSupported = false;
        return subjectId;
      }
      console.log("subject_link_lookup_error", err?.message || err);
      return subjectId;
    }
  }
  return current || subjectId;
}

async function phoneSubjectId(env: Env, workspaceId: string, phoneRaw: string): Promise<string> {
  // v2.989: Use stricter normalization to reject +10000000000 placeholder
  const e164 = normalizeIdentityPhone(phoneRaw);
  if (!e164) return "";
  const salt = (env.SUBJECT_SALT || "").toString();
  if (!salt) {
    return getCanonicalSubjectId(env, workspaceId, "hash:" + e164);
  }
  const hex = await sha256Hex(`${salt}|${e164}`);
  return getCanonicalSubjectId(env, workspaceId, "hash:" + hex);
}

async function resolveSubjectId(env: Env, workspaceId: string, body: any): Promise<string> {
  const explicit = safeString(body?.subject_id ?? "", 256).trim();
  if (explicit) {
    const resolved = await getCanonicalSubjectId(env, workspaceId, explicit);
    // console.log(`RESOLVE subject_id=${explicit} -> ${resolved}`);
    return resolved;
  }

  const visitorId = safeString(body?.visitor_id ?? "", 128).trim();
  if (visitorId) {
    const resolved = await getCanonicalSubjectId(env, workspaceId, visitorId);
    // console.log(`RESOLVE visitor_id=${visitorId} -> ${resolved}`);
    // v2.910: Auto-anchor session to this identity
    const sessionId = safeString(body?.session_id ?? body?.call_id ?? "", 64).trim();
    if (sessionId && resolved) {
      await seedSessionIdentity(env, workspaceId, sessionId, resolved);
    }
    return resolved;
  }

  const emailRaw = safeString(body?.email ?? "", 128).trim().toLowerCase();
  if (emailRaw) {
    const resolved = await getCanonicalSubjectId(env, workspaceId, emailRaw);
    // console.log(`RESOLVE email=${emailRaw} -> ${resolved}`);
    // v2.910: Auto-anchor session to this identity
    const sessionId = safeString(body?.session_id ?? body?.call_id ?? "", 64).trim();
    if (sessionId && resolved) {
      await seedSessionIdentity(env, workspaceId, sessionId, resolved);
    }
    return resolved;
  }

  // v2.910: Check session identity anchor. 
  // If the session was already identified (e.g. via bootstrap cookie), use that anchor 
  // before falling back to potentially placeholder phone numbers.
  const sessionId = safeString(body?.session_id ?? body?.call_id ?? "", 64).trim();
  if (sessionId) {
    const session = await fetchSessionIdentityData(env, workspaceId, sessionId);
    if (session.found && session.subject_id) {
      // console.log(`RESOLVE session_anchor=${sessionId} -> ${session.subject_id}`);
      return session.subject_id;
    }
  }

  const e164Raw = safeString(body?.subject_e164 ?? "", 64).trim();
  if (e164Raw) {
    const resolved = await phoneSubjectId(env, workspaceId, e164Raw);
    if (resolved) {
      // console.log(`RESOLVE subject_e164=${e164Raw} -> ${resolved}`);
      return resolved;
    }
  }

  return "";
}

//helper function to limit facts
function safeString(x: any, max = 512): string {
  const s = (x ?? "").toString();
  return s.length > max ? s.slice(0, max) : s;
}
function safeNumber(x: any, dflt = 0, min = -Infinity, max = Infinity): number {
  const n = Number(x);
  if (!Number.isFinite(n)) return dflt;
  return Math.max(min, Math.min(max, n));
}
function clampArray<T>(arr: any, maxLen = 20): T[] {
  const a = Array.isArray(arr) ? arr : [];
  return a.slice(0, maxLen);
}
function normalizeChannelMode(input: any): "voice" | "chat" | "" {
  const mode = (input ?? "").toString().trim().toLowerCase();
  if (mode === "voice" || mode === "chat") return mode;
  return "";
}

function getToolLatencyThreshold(env: Env): number {
  const raw = Number(env.TOOL_LATENCY_FILLER_MS ?? "");
  if (Number.isFinite(raw) && raw > 0) return raw;
  return DEFAULT_TOOL_LATENCY_FILLER_MS;
}

function buildLatencyHint(startedAt: number, env: Env) {
  const duration = Math.max(0, nowMs() - startedAt);
  const threshold = getToolLatencyThreshold(env);
  return {
    duration_ms: duration,
    filler_threshold_ms: threshold,
    needs_filler: duration >= threshold
  };
}

const OTP_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes
const VERIFIED_SESSION_TTL_MS = 15 * 60 * 1000; // 15 minutes of trusted recall
const MAX_OTP_ATTEMPTS = 5;
const DEFAULT_TOOL_LATENCY_FILLER_MS = 200;
const KB_SENTENCE_LIMIT = 2;
const KB_CHAR_LIMIT = 320;
const SENSITIVE_FACT_TYPES = new Set([
  "budget",
  "family_detail",
  "pet_details",
  "hobby_detail",
  "vehicle_detail",
  "address_detail",
  "payment_history"
]);

const DEFAULT_CUSTOM_LLM_MODEL = "gpt-5.1";
const DEFAULT_CUSTOM_LLM_TEMPERATURE = 0.75;
const DEFAULT_CUSTOM_LLM_REASONING_EFFORT = "medium";

type VerificationState = {
  level: "none" | "pending" | "verified" | "expired" | "locked";
  verified_until?: number | null;
};

type WorkspaceChannelConfig = {
  twilio_account_sid?: string | null;
  twilio_auth_token?: string | null;
  twilio_from_number?: string | null;
  sms_enabled?: number | null;
  email_enabled?: number | null;
};
type SessionContextRow = {
  channel_mode: string | null;
  verified_subject?: string | null;
  handoff_reason?: string | null;
};

type SendResult = {
  ok: boolean;
  error?: string;
  status?: number;
};

const DEFAULT_TIMEZONE = "America/New_York";
const STATE_TIMEZONE_MAP: Record<string, string> = {
  AL: "America/Chicago",
  AK: "America/Anchorage",
  AZ: "America/Phoenix",
  AR: "America/Chicago",
  CA: "America/Los_Angeles",
  CO: "America/Denver",
  CT: "America/New_York",
  DE: "America/New_York",
  DC: "America/New_York",
  FL: "America/New_York",
  GA: "America/New_York",
  HI: "Pacific/Honolulu",
  ID: "America/Boise",
  IL: "America/Chicago",
  IN: "America/New_York",
  IA: "America/Chicago",
  KS: "America/Chicago",
  KY: "America/New_York",
  LA: "America/Chicago",
  ME: "America/New_York",
  MD: "America/New_York",
  MA: "America/New_York",
  MI: "America/Detroit",
  MN: "America/Chicago",
  MS: "America/Chicago",
  MO: "America/Chicago",
  MT: "America/Denver",
  NE: "America/Chicago",
  NV: "America/Los_Angeles",
  NH: "America/New_York",
  NJ: "America/New_York",
  NM: "America/Denver",
  NY: "America/New_York",
  NC: "America/New_York",
  ND: "America/Chicago",
  OH: "America/New_York",
  OK: "America/Chicago",
  OR: "America/Los_Angeles",
  PA: "America/New_York",
  RI: "America/New_York",
  SC: "America/New_York",
  SD: "America/Chicago",
  TN: "America/Chicago",
  TX: "America/Chicago",
  UT: "America/Denver",
  VT: "America/New_York",
  VA: "America/New_York",
  WA: "America/Los_Angeles",
  WV: "America/New_York",
  WI: "America/Chicago",
  WY: "America/Denver"
};

const COUNTRY_TIMEZONE_MAP: Record<string, string> = {
  US: DEFAULT_TIMEZONE,
  CA: "America/Toronto",
  MX: "America/Mexico_City",
  GB: "Europe/London",
  UK: "Europe/London",
  AU: "Australia/Sydney"
};

function isVerified(state: VerificationState) {
  return state.level === "verified";
}

function isValidTimezone(timeZone: string): boolean {
  if (!timeZone) return false;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone }).format(new Date());
    return true;
  } catch (_) {
    return false;
  }
}

function formatLocalIso(date: Date, timeZone: string): string {
  try {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false
    });
    const parts = formatter.formatToParts(date);
    const lookup = (type: Intl.DateTimeFormatPartTypes) =>
      parts.find((p) => p.type === type)?.value || "";
    const year = lookup("year").padStart(4, "0");
    const month = lookup("month").padStart(2, "0");
    const day = lookup("day").padStart(2, "0");
    const hour = lookup("hour").padStart(2, "0");
    const minute = lookup("minute").padStart(2, "0");
    const second = lookup("second").padStart(2, "0");
    if (year && month && day && hour && minute && second) {
      return `${year}-${month}-${day}T${hour}:${minute}:${second}`;
    }
  } catch (_) {
    // ignore and fall through
  }
  return date.toISOString();
}

function deriveTimeGreeting(date: Date, timeZone: string): string {
  try {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone,
      hour: "2-digit",
      hour12: false
    });
    const hourStr = formatter.format(date);
    const hour = parseInt(hourStr, 10);
    if (!Number.isNaN(hour)) {
      if (hour >= 5 && hour < 12) return "Good morning";
      if (hour >= 12 && hour < 17) return "Good afternoon";
      if (hour >= 17 || hour < 5) return "Good evening";
    }
  } catch (_) {
    // ignore formatter errors
  }
  const hour = date.getUTCHours();
  if (hour >= 5 && hour < 12) return "Good morning";
  if (hour >= 12 && hour < 17) return "Good afternoon";
  if (hour >= 17 || hour < 5) return "Good evening";
  return "Hello";
}

function deriveTimezoneFromHints(
  callerTimezone: string,
  callerCountry: string,
  callerState: string
): string {
  if (callerTimezone && isValidTimezone(callerTimezone)) return callerTimezone;
  const upperCountry = (callerCountry || "").trim().toUpperCase();
  if (upperCountry && COUNTRY_TIMEZONE_MAP[upperCountry]) {
    return COUNTRY_TIMEZONE_MAP[upperCountry];
  }
  if (upperCountry === "US") {
    const upperState = (callerState || "").trim().toUpperCase();
    if (upperState && STATE_TIMEZONE_MAP[upperState]) {
      return STATE_TIMEZONE_MAP[upperState];
    }
  }
  return DEFAULT_TIMEZONE;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}


const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, HEAD, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, x-api-key, x-workspace-id",
};

export default {
  async fetch(req: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    if (req.method === "OPTIONS") {
      return new Response(null, { headers: CORS_HEADERS });
    }

    try {
      const url = new URL(req.url);
      const path = url.pathname;
      const isVisualizer = path === "/memory/visualizer";

      // Allow GET / for health checks
      if (req.method === "GET" && path === "/") {
        return json({ status: "ok", service: "memory-api" });
      }

      if (req.method !== "POST" && !isVisualizer) return json({ error: "use POST" }, 405);

      const headerWorkspace = req.headers.get("x-workspace-id");
      const urlWorkspace = url.searchParams.get("workspace"); // Allow query override for sockets
      const isElevenLabsInit = path === "/elevenlabs/init";
      const isTwilioVoice = path === "/twilio/voice";
      const isElevenLabsTranscript = path === "/integrations/elevenlabs/transcript";
      const isGreetingWeb = path === "/greeting/web";

      let workspaceId = headerWorkspace ?? urlWorkspace ?? (isElevenLabsInit || isTwilioVoice ? "emily" : "emily");

      // SANITIZE: Remove any accidental query string leakage or whitespace
      // This ensures "default?workspace=default" becomes "default"
      if (workspaceId.includes("?")) {
        workspaceId = workspaceId.split("?")[0];
      }
      workspaceId = workspaceId.trim();

      if (!isVisualizer) {
        console.log("REQ " + path + " ws=" + workspaceId + (headerWorkspace ? "" : " (fallback)"));
      }

      // Basic multi-tenant auth: x-workspace-id + x-api-key
      if (!isElevenLabsInit && !isTwilioVoice && !isVisualizer && !isElevenLabsTranscript && !isGreetingWeb) {
        const apiKey = req.headers.get("x-api-key") ?? "";
        const ok = await auth(env, workspaceId, apiKey);
        if (!ok) return json({ error: "unauthorized" }, 401);
      }

      if (isVisualizer) {
        if (!env.MEMORY_CACHE) return json({ error: "no_cache_binding" }, 500);
        console.log(`[Worker] Handing off visualizer req to DO. Upgrade: ${req.headers.get("Upgrade")}`);
        const id = env.MEMORY_CACHE.idFromName("viz:" + workspaceId);
        const stub = env.MEMORY_CACHE.get(id);
        return stub.fetch(req);
      }

      const bodyText = await req.text();
      let body: any = {};
      if (!isTwilioVoice) {
        if (bodyText) {
          try {
            body = JSON.parse(bodyText);
          } catch (err: any) {
            console.log("invalid_json_payload", err?.message || err);
            return json({ error: "invalid_json" }, 400);
          }
        }
      }

      if (path === "/twilio/voice") return twilioVoiceHandler(req, env, workspaceId, bodyText);
      if (path === "/elevenlabs/init") return elevenLabsInitHandler(req, env, workspaceId, bodyText);
      if (path === "/greeting/web") return webGreetingHandler(env, workspaceId, body);
      if (path === "/identity/preload") return preloadSession(env, workspaceId, body);

      if (url.pathname === "/memory/bootstrap") return bootstrap(env, workspaceId, body, ctx);
      if (url.pathname === "/memory/query") return query(env, workspaceId, body, ctx);
      if (url.pathname === "/memory/upsert") return upsert(env, workspaceId, body, ctx);
      if (url.pathname === "/memory/transcript") return ingestTranscript(env, workspaceId, body, ctx);
      if (url.pathname === "/integrations/elevenlabs/transcript") return elevenLabsWebhook(env, workspaceId, bodyText, req.headers);
      if (url.pathname === "/identity/passthrough") return identityPassthrough(env, workspaceId, body);
      if (url.pathname === "/identity/session") return getSessionIdentity(env, workspaceId, body);
      if (url.pathname === "/identity/validate") return identityValidate(env, workspaceId, body, ctx);
      if (url.pathname === "/auth/request-otp") return requestOtp(env, workspaceId, body, ctx);
      if (url.pathname === "/auth/verify-otp") return verifyOtp(env, workspaceId, body, ctx);
      if (url.pathname === "/context/set") return setContext(env, workspaceId, body);
      if (url.pathname === "/handoff/dispatch") return handoffDispatch(env, workspaceId, body);

      return json({ error: "not found" }, 404);
    } catch (e: any) {
      return json({ error: e?.message ?? "server error" }, 500);
    }
  }
};

async function auth(env: Env, workspaceId: string, providedKey: string) {
  // If a workspace key exists in DB, require it; else fall back to global API_KEY
  const row = await env.D1_DB
    .prepare("SELECT secret FROM api_keys WHERE workspace_id = ?")
    .bind(workspaceId)
    .first<{ secret: string }>();
  if (row?.secret) return timingSafeEqual(providedKey, row.secret);
  return timingSafeEqual(providedKey, env.API_KEY || "");
}

function timingSafeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let res = 0;
  for (let i = 0; i < a.length; i++) res |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return res === 0 && a.length > 0;
}

function nowMs() { return Date.now(); }
function json(obj: Json, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: {
      "content-type": "application/json",
      ...CORS_HEADERS
    }
  });
}

// POST /memory/bootstrap
// { subject_id?: "hash:...", subject_e164?: "+1555...", lang?: "en", query?: "text", agent_id?: "billing", summary?: "text", extracted_facts?: [...] }
async function bootstrap(env: Env, workspaceId: string, body: any, ctx?: ExecutionContext) {
  const subjectId = await resolveSubjectId(env, workspaceId, body);
  console.log("BOOT subject_id=" + subjectId + " ws=" + workspaceId);
  if (!subjectId) return json({ error: "subject_id or subject_e164 required" }, 400);
  const sessionId = safeString(body.session_id ?? body.call_id ?? "", 64);
  const verificationState = await getSessionVerification(env, workspaceId, subjectId, sessionId);
  const verified = verificationState.level === "verified";
  const requestStartedAt = nowMs();

  // Optional inline write (save summary/facts) so chat can "save" via bootstrap
  let writeAck = false;
  const hasSummary = typeof body.summary === "string" && body.summary.trim().length > 0;

  // Accept both "extracted_facts" (objects) and "facts" (strings or objects)
  const fromExtracted = clampArray(body.extracted_facts, 50);
  const fromFacts = clampArray(body.facts, 50);
  const factsInput: any[] = [...fromExtracted, ...fromFacts];
  const agentId = body.agent_id ? String(body.agent_id) : null;
  const q = safeString(body.query ?? "", 128).trim();

  const cacheEligible = shouldUseDoCache(env);
  const isWriteRequest = hasSummary || factsInput.length > 0;
  const cacheKey = buildCacheEntryKey(agentId, q, verificationState.level);

  if (!isWriteRequest && sessionId) {
    const sessionCached = readSessionBootstrapCache(workspaceId, sessionId);
    if (
      sessionCached &&
      sessionCached.subject_id === subjectId &&
      sessionCached.verification_level === verificationState.level
    ) {
      console.log("BOOT session_cache_hit session=" + sessionId);
      return json(sessionCached.payload);
    }
  }

  if (!isWriteRequest && cacheKey) {
    let cached = readLocalBootstrapCache(workspaceId, subjectId, cacheKey);
    if (!cached && cacheEligible) {
      cached = await readBootstrapCache(env, workspaceId, subjectId, cacheKey);
    }
    if (cached) {
      console.log("BOOT cache_hit subject=" + subjectId);
      if (sessionId) {
        writeSessionBootstrapCache(workspaceId, sessionId, {
          subject_id: subjectId,
          verification_level: verificationState.level,
          payload: cached
        });
      }
      return json(cached);
    }
  }

  let wroteFacts = 0;

  if (isWriteRequest) {
    const ts = nowMs();
    const callId = String(body.call_id || `${ts}-${Math.random().toString(16).slice(2)}`);

    await env.D1_DB.prepare(
      "INSERT OR IGNORE INTO calls (id, subject_id, workspace_id, started_at) VALUES (?, ?, ?, ?)"
    ).bind(callId, subjectId, workspaceId, ts).run();

    if (hasSummary) {
      await env.D1_DB.prepare(
        "INSERT INTO call_summaries (call_id, subject_id, workspace_id, summary, created_at) VALUES (?, ?, ?, ?, ?)"
      ).bind(callId, subjectId, workspaceId, String(body.summary), ts).run();
    }

    if (factsInput.length) {
      const policies = await getWorkspaceFactPolicies(env, workspaceId);
      wroteFacts += await persistFacts(
        env,
        workspaceId,
        subjectId,
        agentId,
        deriveIncomingFacts(factsInput),
        policies,
        ts
      );
    }

    writeAck = true;
    console.log("BOOT write_ack=true call_id=" + callId + " facts_written=" + wroteFacts);
    await invalidateBootstrapCache(env, workspaceId, subjectId);
  }

  const initialFactTypeSupport = await ensureFactTypeColumn(env);

  const profileFactsPromise = (async (): Promise<MemorySelectResult> => {
    let expectFactType = initialFactTypeSupport;
    while (true) {
      try {
        const res = await env.D1_DB
          .prepare(`SELECT fact, confidence, updated_at${expectFactType ? ", fact_type" : ""}
                    FROM memories
                    WHERE workspace_id = ? AND subject_id = ?
                    ORDER BY updated_at DESC
                    LIMIT 20`)
          .bind(workspaceId, subjectId)
          .all();
        return { results: res.results ?? [], hasFactTypeColumn: expectFactType };
      } catch (err: any) {
        if (expectFactType && isFactTypeColumnError(err)) {
          disableFactTypeColumnSupport();
          expectFactType = false;
          continue;
        }
        throw err;
      }
    }
  })();

  const summariesPromise = env.D1_DB
    .prepare(`SELECT summary, created_at
              FROM call_summaries
              WHERE workspace_id = ? AND subject_id = ?
              ORDER BY created_at DESC
              LIMIT 3`)
    .bind(workspaceId, subjectId)
    .all();

  const factsPromise = (async (): Promise<MemorySelectResult> => {
    if (!q) return { results: [], hasFactTypeColumn: initialFactTypeSupport };
    const like = `%${q.replace(/[%_]/g, "")}%`;
    let expectFactType = initialFactTypeSupport;
    while (true) {
      try {
        const res = await env.D1_DB
          .prepare(
            `SELECT fact, confidence, updated_at, agent_id${expectFactType ? ", fact_type" : ""}
             FROM memories
             WHERE workspace_id = ?
               AND subject_id = ?
               AND (? = '' OR fact LIKE ?)
               AND (? IS NULL OR agent_id IS NULL OR agent_id = ?)
             ORDER BY updated_at DESC
             LIMIT ?`
          )
          .bind(workspaceId, subjectId, q, like, agentId, agentId, 5)
          .all();
        return { results: res.results ?? [], hasFactTypeColumn: expectFactType };
      } catch (err: any) {
        if (expectFactType && isFactTypeColumnError(err)) {
          disableFactTypeColumnSupport();
          expectFactType = false;
          continue;
        }
        throw err;
      }
    }
  })();

  console.log("BOOT query=" + (q || "<empty>"));

  const [profileFacts, summaries, factsRes] = await Promise.all([
    profileFactsPromise,
    summariesPromise,
    factsPromise
  ]);

  if (env.MEMORY_CACHE) {
    // Broadcast BOOT event to Visualizer
    const id = env.MEMORY_CACHE.idFromName("viz:" + workspaceId);
    const stub = env.MEMORY_CACHE.get(id);

    // v2.994: Broadcast Identity if resolved (Fix for Missing UI Card)
    if (subjectId && (subjectId.startsWith("+") || subjectId.includes("@"))) {
      const parts = subjectId.split("|");
      const idVal = parts[0];
      const name = parts.length > 1 ? parts[1] : null; // optionally pass name if supported

      const idMsg = {
        op: "broadcast",
        message: {
          type: "identity_confirmed",
          phone: idVal.startsWith("+") ? idVal : null,
          email: idVal.includes("@") ? idVal : null,
          name: name,
          source: "bootstrap_lookup"
        }
      };
      // Fire and forget identity broadcast
      stub.fetch("https://viz", { method: "POST", body: JSON.stringify(idMsg) }).catch(e => console.error(`[Viz] BootID Error (${workspaceId}):`, e));
    }

    // Determine what to show
    let broadcastType = "memory_retrieved";
    // If we just wrote new facts, treat it as an insert
    if (isWriteRequest && wroteFacts > 0) {
      broadcastType = "memory_added";
    }

    const p = stub.fetch("https://viz", {
      method: "POST",
      body: JSON.stringify({
        op: "broadcast",
        message: {
          type: broadcastType,
          // Show facts if found, otherwise general profile info
          items: factsRes.results.length > 0
            ? factsRes.results.slice(0, 3).map(f => f.fact)
            : (profileFacts.results.length > 0 ? profileFacts.results.slice(0, 3).map(f => f.fact) : [])
        }
      })
    }).catch(e => console.error(`[Viz] Broadcast Error (${workspaceId}):`, e));
    if (ctx && ctx.waitUntil) ctx.waitUntil(p);
  }

  console.log("BOOT facts_query=" + (factsRes.results?.length || 0) + " facts_profile=" + (profileFacts.results?.length || 0));

  const profileFactRows = trimKnowledgeBaseFacts(
    normalizeFactRows(profileFacts.results ?? [], profileFacts.hasFactTypeColumn)
  );
  const queryFactRows = trimKnowledgeBaseFacts(
    normalizeFactRows(factsRes.results ?? [], factsRes.hasFactTypeColumn)
  );
  const filteredProfile = filterFactsForVerification(profileFactRows, verificationState);
  const filteredQuery = filterFactsForVerification(queryFactRows, verificationState);
  const sanitizedSummaries = sanitizeSummariesForVerification(summaries.results ?? [], verificationState);

  const payload = {
    write_ack: writeAck,
    profile_facts: filteredProfile.facts,
    recent_summaries: sanitizedSummaries,
    facts: filteredQuery.facts,
    protected_facts_available: (filteredProfile.protectedCount + filteredQuery.protectedCount > 0),
    protected_count: filteredProfile.protectedCount + filteredQuery.protectedCount,
    agent_hints: {},
    verification_level: verificationState.level,
    latency_hint: buildLatencyHint(requestStartedAt, env)
  };

  if (!isWriteRequest && cacheKey) {
    writeLocalBootstrapCache(workspaceId, subjectId, cacheKey, payload);
    if (cacheEligible) await writeBootstrapCache(env, workspaceId, subjectId, cacheKey, payload);
  }

  if (!isWriteRequest && sessionId) {
    writeSessionBootstrapCache(workspaceId, sessionId, {
      subject_id: subjectId,
      verification_level: verificationState.level,
      payload
    });
  }

  return json(payload);
}

// POST /memory/query
// { subject_id?: "hash:...", subject_e164?: "+1555...", agent_id?: "billing", query: "text", top_k?: 5 }
async function query(env: Env, workspaceId: string, body: any, ctx?: ExecutionContext) {
  const subjectId = await resolveSubjectId(env, workspaceId, body);
  const agentId = body.agent_id ? String(body.agent_id) : null;
  const q = safeString(body.query ?? "", 128).trim();
  const topK = safeNumber(body.top_k, 5, 1, 20);
  if (!subjectId) return json({ error: "subject_id or subject_e164 required" }, 400);
  const sessionId = safeString(body.session_id ?? body.call_id ?? "", 64);
  const verificationState = await getSessionVerification(env, workspaceId, subjectId, sessionId);
  const requestStartedAt = nowMs();
  console.log("QUERY_START", { workspaceId, subjectId: subjectId.substring(0, 8) + "...", q });

  // v2.875: Broadcast "Searching" EARLY (Visualizer Feedback)
  if (env.MEMORY_CACHE && q) {
    try {
      const id = env.MEMORY_CACHE.idFromName("viz:" + workspaceId);
      const stub = env.MEMORY_CACHE.get(id);
      const p = stub.fetch("https://viz", {
        method: "POST",
        body: JSON.stringify({
          op: "broadcast",
          message: {
            type: "memory_retrieved",  // Re-use retrieved type for extracting visual
            items: [`Searching: "${q}"`]
          }
        })
      }).catch(e => console.error(`[Viz] Query Broadcast Error (${workspaceId}):`, e));
      if (ctx && ctx.waitUntil) ctx.waitUntil(p);
    } catch (e) { /* ignore */ }
  }

  const cacheKey = buildQueryCacheEntryKey(workspaceId, subjectId, agentId, q, topK, verificationState.level);
  const cachedPayload = readLocalQueryCache(workspaceId, subjectId, cacheKey);
  if (cachedPayload) {
    if (env.MEMORY_CACHE) {
      // Broadcast cache hit
      const id = env.MEMORY_CACHE.idFromName("viz:" + workspaceId);
      const stub = env.MEMORY_CACHE.get(id);
      const p = stub.fetch("https://viz", {
        method: "POST",
        body: JSON.stringify({
          op: "broadcast",
          message: { type: "memory_retrieved", items: cachedPayload.facts.slice(0, 3).map(f => f.fact), source: "cache" }
        })
      }).catch(e => console.error(`[Viz] Cache Broadcast Error (${workspaceId}):`, e));
      if (ctx && ctx.waitUntil) ctx.waitUntil(p);
    }
    console.log("QUERY cache_hit subject=" + subjectId);
    return json(cachedPayload);
  }
  // v3.174: Detect broad/generic queries that should return ALL facts, not filter by keyword
  const BROAD_QUERY_PATTERNS = /^(everything|all|anything|what do (you|i) know|tell me about|my (info|profile|data|details|facts)|who am i|recall|remember)/i;
  const effectiveQ = BROAD_QUERY_PATTERNS.test(q) ? "" : q;
  const like = effectiveQ ? `%${effectiveQ.replace(/[%_]/g, "")}%` : "";
  let hasFactTypeColumn = await ensureFactTypeColumn(env);
  let rows: { results: any[] } = { results: [] };
  try {
    rows = await env.D1_DB
      .prepare(
        `SELECT fact, confidence, updated_at, agent_id${hasFactTypeColumn ? ", fact_type" : ""}
         FROM memories
         WHERE workspace_id = ?
           AND subject_id = ?
           AND (? = '' OR fact LIKE ?)
           AND (agent_id IS NULL OR agent_id = ?)
         ORDER BY updated_at DESC
         LIMIT ?`
      )
      .bind(workspaceId, subjectId, effectiveQ, like, agentId, topK)
      .all();
  } catch (err: any) {
    if (hasFactTypeColumn && isFactTypeColumnError(err)) {
      disableFactTypeColumnSupport();
      hasFactTypeColumn = false;
      rows = await env.D1_DB
        .prepare(
          `SELECT fact, confidence, updated_at, agent_id
           FROM memories
           WHERE workspace_id = ?
             AND subject_id = ?
             AND (? = '' OR fact LIKE ?)
             AND (agent_id IS NULL OR agent_id = ?)
           ORDER BY updated_at DESC
           LIMIT ?`
        )
        .bind(workspaceId, subjectId, effectiveQ, like, agentId, topK)
        .all();
    } else {
      throw err;
    }
  }

  const normalizedFacts = normalizeFactRows(rows.results ?? [], hasFactTypeColumn);
  const trimmedFacts = trimKnowledgeBaseFacts(normalizedFacts);
  const filtered = filterFactsForVerification(trimmedFacts, verificationState);
  const payload: QueryCachePayload = {
    facts: filtered.facts,
    snippets: [],
    citations: [],
    verification_level: verificationState.level,
    protected_facts_available: filtered.protectedCount > 0,
    latency_hint: buildLatencyHint(requestStartedAt, env)
  };
  writeLocalQueryCache(workspaceId, subjectId, cacheKey, payload);

  if (env.MEMORY_CACHE) {
    const id = env.MEMORY_CACHE.idFromName("viz:" + workspaceId);
    const stub = env.MEMORY_CACHE.get(id);
    const p = stub.fetch("https://viz", {
      method: "POST",
      body: JSON.stringify({
        op: "broadcast",
        message: { type: "memory_retrieved", items: payload.facts.slice(0, 3).map((f: any) => f.fact) }
      })
    });
    if (ctx && ctx.waitUntil) ctx.waitUntil(p);
  }

  return json(payload);
}

function coerceBooleanFlag(value: any): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (!normalized) return false;
    return normalized === "true" || normalized === "1" || normalized === "yes" || normalized === "y";
  }
  if (typeof value === "number") return value !== 0;
  return false;
}

function isPlainObject(value: any): value is Record<string, any> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function getDefaultCustomLLMBody(env: Env): Record<string, any> {
  const raw = safeString(env.ELEVENLABS_CUSTOM_LLM_PARAMS ?? "", 4096).trim();
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (isPlainObject(parsed)) return parsed;
    } catch (err: any) {
      console.log("init_custom_llm_params_parse_error", err?.message || err);
    }
  }

  const body: Record<string, any> = {};
  const model = safeString(env.ELEVENLABS_CUSTOM_LLM_MODEL ?? "", 128).trim();
  body.model = model || DEFAULT_CUSTOM_LLM_MODEL;

  const temp = Number(env.ELEVENLABS_CUSTOM_LLM_TEMPERATURE ?? "");
  body.temperature = Number.isFinite(temp) ? temp : DEFAULT_CUSTOM_LLM_TEMPERATURE;

  const maxTokens = Number(env.ELEVENLABS_CUSTOM_LLM_MAX_TOKENS ?? "");
  if (Number.isFinite(maxTokens)) {
    body.max_tokens = maxTokens;
  }

  const reasoning = safeString(env.ELEVENLABS_CUSTOM_LLM_REASONING_EFFORT ?? "", 32).trim();
  body.reasoning_effort = reasoning || DEFAULT_CUSTOM_LLM_REASONING_EFFORT;

  return body;
}

function getConversationOverride(env: Env): Record<string, any> | null {
  const raw = safeString(env.ELEVENLABS_CONVERSATION_OVERRIDE ?? "", 8192).trim();
  const envFirstMessage = safeString(env.ELEVENLABS_FIRST_MESSAGE ?? "", 512).trim();
  if (!raw && !envFirstMessage) return null;

  let parsed: Record<string, any> = {};
  if (raw) {
    try {
      const candidate = JSON.parse(raw);
      if (isPlainObject(candidate)) parsed = candidate;
    } catch (err: any) {
      console.log("init_conversation_override_parse_error", err?.message || err);
    }
  }

  if (parsed.tts && isPlainObject(parsed.tts)) {
    if (Object.prototype.hasOwnProperty.call(parsed.tts, "voice_id")) {
      delete parsed.tts.voice_id;
    }
    if (!Object.keys(parsed.tts).length) {
      delete parsed.tts;
    }
  }

  if (envFirstMessage) {
    if (!parsed.agent || !isPlainObject(parsed.agent)) parsed.agent = {};
    parsed.agent.first_message = envFirstMessage;
  }

  if (parsed.agent && isPlainObject(parsed.agent)) {
    if (isPlainObject(parsed.agent.prompt)) {
      parsed.agent.prompt = { ...(parsed.agent.prompt || {}) };
    }
    if (parsed.agent.prompt && !Object.keys(parsed.agent.prompt).length) {
      delete parsed.agent.prompt;
    }
    if (!Object.keys(parsed.agent).length) {
      delete parsed.agent;
    }
  }

  return Object.keys(parsed).length ? parsed : null;
}

function shouldDeferMemoryUpsert(body: any, summaryText: string, factCount: number): boolean {
  if (!body || typeof body !== "object") return false;
  if (!summaryText || factCount > 0) return false;
  if (coerceBooleanFlag(body.require_sync) || coerceBooleanFlag(body.force_sync)) return false;
  return coerceBooleanFlag(body.defer_logging);
}

// POST /memory/upsert
// { subject_id?: "hash:...", subject_e164?: "+1555...", agent_id?, summary?, extracted_facts?: [...] }
async function upsert(env: Env, workspaceId: string, body: any, ctx?: ExecutionContext) {
  const subjectId = await resolveSubjectId(env, workspaceId, body);
  console.log("UPSERT_START", { workspaceId, subjectId: subjectId ? subjectId.substring(0, 8) + "..." : "null" });
  if (!subjectId) return json({ error: "subject_id or subject_e164 required" }, 400);

  const callId = String(body.call_id || `${nowMs()}-${Math.random().toString(16).slice(2)}`);
  const ts = nowMs();
  const summaryValue = body.summary;
  const normalizedSummary = typeof summaryValue === "string" ? summaryValue.trim() : "";
  const facts = Array.isArray(body.extracted_facts) ? body.extracted_facts : [];
  const deferLogging = shouldDeferMemoryUpsert(body, normalizedSummary, facts.length);

  if (facts.length > 0) {
    console.log("UPSERT_FACTS", { count: facts.length, callId });
  }

  // v2.875: Broadcast "Upserting" EARLY (Visualizer Feedback)
  if (env.MEMORY_CACHE && (facts.length > 0 || summaryValue)) {
    try {
      const vizItems: string[] = [];
      if (facts.length) {
        deriveIncomingFacts(facts).forEach(f => {
          if (f.fact) vizItems.push(f.fact);
        });
      }
      if (summaryValue && !vizItems.length) {
        vizItems.push("Summary: " + String(summaryValue).slice(0, 30) + "...");
      }
      const id = env.MEMORY_CACHE.idFromName("viz:" + workspaceId);
      const stub = env.MEMORY_CACHE.get(id);
      const p = stub.fetch("https://viz", {
        method: "POST",
        body: JSON.stringify({
          op: "broadcast",
          message: { type: "memory_added", items: vizItems }
        })
      });
      if (ctx && ctx.waitUntil) ctx.waitUntil(p);
    } catch (e) { /* ignore */ }
  }

  const performWrite = async () => {
    let touched = false;

    try {
      console.log("DB_WRITE: calls");
      await env.D1_DB.prepare(
        "INSERT OR IGNORE INTO calls (id, subject_id, workspace_id, started_at) VALUES (?, ?, ?, ?)"
      ).bind(callId, subjectId, workspaceId, ts).run();

      if (summaryValue) {
        console.log("DB_WRITE: call_summaries");
        await env.D1_DB.prepare(
          "INSERT INTO call_summaries (call_id, subject_id, workspace_id, summary, created_at) VALUES (?, ?, ?, ?, ?)"
        ).bind(callId, subjectId, workspaceId, String(summaryValue), ts).run();
        touched = true;
      }

      if (facts.length) {
        const agentId = body.agent_id ? String(body.agent_id) : null;
        console.log("DB_WRITE: checking policies");
        const policies = await getWorkspaceFactPolicies(env, workspaceId);
        console.log("DB_WRITE: persistFacts");
        await persistFacts(
          env,
          workspaceId,
          subjectId,
          agentId,
          deriveIncomingFacts(facts),
          policies,
          ts
        );
        touched = true;
      }

      if (touched) await invalidateBootstrapCache(env, workspaceId, subjectId);

      // Broadcast to visualizer
      if (touched && env.MEMORY_CACHE) {
        console.log("DB_BCAST: Starting...");
        const vizItems: string[] = [];
        if (facts.length) {
          deriveIncomingFacts(facts).forEach(f => {
            if (f.fact) vizItems.push(f.fact);
          });
        }
        if (summaryValue && !vizItems.length) {
          vizItems.push("Summary: " + String(summaryValue).slice(0, 30) + "...");
        }

        if (vizItems.length > 0) {
          const id = env.MEMORY_CACHE.idFromName("viz:" + workspaceId);
          const stub = env.MEMORY_CACHE.get(id);
          // Don't await strictly to fast return
          const promise = stub.fetch("https://viz", {
            method: "POST",
            body: JSON.stringify({
              op: "broadcast",
              message: { type: "memory_added", items: vizItems }
            })
          });
          if (ctx && ctx.waitUntil) ctx.waitUntil(promise);
          else await promise;
        }
        console.log("DB_BCAST: Sent");
      }
    } catch (err: any) {
      console.error("DB_WRITE_CRASH", err);
      throw err;
    }
  };

  if (deferLogging && ctx && typeof ctx.waitUntil === "function") {
    ctx.waitUntil(
      performWrite().catch((err) => {
        console.log("deferred_memory_upsert_error", err?.message || err);
      })
    );
    return json({ ok: true, call_id: callId, deferred: true });
  }

  await performWrite();
  return json({ ok: true, call_id: callId, deferred: false });
}

async function ingestTranscript(env: Env, workspaceId: string, body: any, ctx?: ExecutionContext) {
  const subjectId = await resolveSubjectId(env, workspaceId, body);
  if (!subjectId) return json({ error: "subject_id or subject_e164 required" }, 400);

  const transcript = safeString(body.transcript ?? "", 20000).trim();
  if (!transcript) return json({ error: "transcript text required" }, 400);

  const agentId = body.agent_id ? String(body.agent_id) : null;
  const callId = String(body.call_id || `${nowMs()}-${Math.random().toString(16).slice(2)}`);
  const ts = nowMs();
  const policies = await getWorkspaceFactPolicies(env, workspaceId);

  await env.D1_DB.prepare(
    "INSERT OR IGNORE INTO calls (id, subject_id, workspace_id, started_at, transcript) VALUES (?, ?, ?, ?, ?)"
  ).bind(callId, subjectId, workspaceId, ts, transcript).run();

  const providedSummary = safeString(body.summary ?? "", 2000).trim();
  let summary = providedSummary || summarizeTranscript(transcript);
  let richIntel: any = null;

  if (!providedSummary && env.AI) {
    richIntel = await processRichTranscriptIntelligence(env, transcript);
    if (richIntel?.summary) summary = richIntel.summary;
  }

  if (summary) {
    await env.D1_DB.prepare(
      "INSERT INTO call_summaries (call_id, subject_id, workspace_id, summary, created_at, sentiment, structured_outcome, action_items) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
    ).bind(
      callId,
      subjectId,
      workspaceId,
      summary,
      ts,
      richIntel?.sentiment_label || null,
      richIntel?.outcome || null,
      richIntel?.action_items ? JSON.stringify(richIntel.action_items) : null
    ).run();
  }

  const manualFacts = deriveIncomingFacts(clampArray(body.extracted_facts, 100));
  const autoFacts = body.auto_extract === false ? [] : extractFactsFromTranscript(transcript, policies);

  // v3.014: Post-Call Name Injection via Auditing Agent
  if (richIntel?.user_name) {
    console.log(`[Auditing Agent] Extracted Name: ${richIntel.user_name}`);
    autoFacts.push({
      fact: `Name: ${richIntel.user_name}`,
      fact_type: "general",
      confidence: 0.95
    });
  }

  const combinedFacts = dedupeIncomingFacts([...manualFacts, ...autoFacts]);
  const factsWritten = await persistFacts(
    env,
    workspaceId,
    subjectId,
    null,
    combinedFacts,
    policies,
    ts
  );

  if (summary || factsWritten) await invalidateBootstrapCache(env, workspaceId, subjectId);

  if (env.MEMORY_CACHE) {
    const id = env.MEMORY_CACHE.idFromName("viz:" + workspaceId);
    const stub = env.MEMORY_CACHE.get(id);

    // Broadcast Summary (v2.981: Ensure visibility even without facts)
    if (summary) {
      const pSummary = stub.fetch("https://viz", {
        method: "POST",
        body: JSON.stringify({
          op: "broadcast",
          message: {
            type: "call_summary",
            summary: summary,
            call_id: callId
          }
        })
      });
      if (ctx && ctx.waitUntil) ctx.waitUntil(pSummary);
    }

    // Broadcast Facts (if any)
    if (factsWritten) {
      const factsStr = combinedFacts.slice(0, 3).map((f: any) => typeof f === 'string' ? f : f.fact);
      const pFacts = stub.fetch("https://viz", {
        method: "POST",
        body: JSON.stringify({
          op: "broadcast",
          message: { type: "memory_added", items: factsStr }
        })
      });
      if (ctx && ctx.waitUntil) ctx.waitUntil(pFacts);
    }
  }

  if (ctx && ctx.waitUntil) {
    const contact: CRMContact = {
      phone: body.subject_e164 || null,
      email: body.email || null,
      firstName: body.first_name || null,
      lastName: body.last_name || null
    };
    const agentName = getAgentName(agentId);
    const crmNote = `[${agentName}] Call Summary: ${summary}\n\nOutcome: ${richIntel?.outcome || 'N/A'}\nSentiment: ${richIntel?.sentiment_label || 'N/A'}`;
    ctx.waitUntil(syncCallToCRM(env, workspaceId, contact, crmNote));
  }

  return json({
    ok: true,
    call_id: callId,
    summary,
    facts_written: factsWritten,
    auto_facts_generated: autoFacts.length
  });
}

async function logAudit(env: Env, path: string, body: string, headers: any, status: number) {
  try {
    await env.D1_DB.prepare(
      "INSERT INTO audit_logs (path, body, headers, status, created_at) VALUES (?, ?, ?, ?, ?)"
    ).bind(path, body, JSON.stringify(headers), status, Date.now()).run();
  } catch (e) {
    console.error("Audit log failed", e);
  }
}

async function elevenLabsWebhook(env: Env, workspaceId: string, bodyText: string, headers: Headers) {
  // v2.966: Webhook Security - use raw bodyText for HMAC to ensure bit-perfect match
  const secret = env.ELEVENLABS_WEBHOOK_SECRET || "";
  let body: any = {};

  try {
    body = JSON.parse(bodyText);
  } catch (err) {
    console.error("DEBUG: Webhook body is not valid JSON");
    return json({ error: "invalid_json" }, 400);
  }

  if (secret) {
    // Check both potential headers
    const signatureHeader = headers.get("elevenlabs-signature") || headers.get("xi-signature") || "";
    if (!signatureHeader) {
      console.error("DEBUG: Webhook signature header missing");
      await logAudit(env, "/integrations/elevenlabs/transcript", bodyText, Object.fromEntries(headers), 401);
      return json({ error: "signature_missing" }, 401);
    }

    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    const cryptoKey = await crypto.subtle.importKey(
      "raw", keyData, { name: "HMAC", hash: "SHA-256" },
      false, ["verify"]
    );

    let isValid = false;

    // Case 1: Timestamped format (Standard ElevenLabs)
    // Format: t=1770762332,v0=08ac58...
    if (signatureHeader.includes("t=") && signatureHeader.includes("v0=")) {
      const parts = signatureHeader.split(",");
      const t = parts.find(p => p.trim().startsWith("t="))?.split("=")[1];
      const v0 = parts.find(p => p.trim().startsWith("v0="))?.split("=")[1];

      if (t && v0) {
        // Create the payload exactly as ElevenLabs does: <timestamp>.<bodyText>
        const signedPayload = encoder.encode(`${t}.${bodyText}`);
        try {
          const sigBytes = new Uint8Array(v0.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));
          isValid = await crypto.subtle.verify("HMAC", cryptoKey, sigBytes, signedPayload);
        } catch (e) {
          isValid = false;
        }
      }
    }
    // Case 2: Legacy/Alternative Hex format
    else {
      const bodyData = encoder.encode(bodyText);
      try {
        const sigBytes = new Uint8Array(signatureHeader.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));
        isValid = await crypto.subtle.verify("HMAC", cryptoKey, sigBytes, bodyData);
      } catch (e) {
        isValid = false;
      }
    }

    if (!isValid) {
      console.error("DEBUG: Webhook signature invalid for header:", signatureHeader);
      await logAudit(env, "/integrations/elevenlabs/transcript", bodyText, Object.fromEntries(headers), 401);
      return json({ error: "signature_invalid" }, 401);
    }
    console.log("DEBUG: Webhook signature verified successfully");
  }

  // v2.968/v2.969: Log full JSON for better debugging in Cloudflare logs
  const bodyParsed = (typeof body === 'object' && body !== null) ? body : {};
  const data = bodyParsed.data || {};

  try {
    console.log("DEBUG: Webhook Body JSON:", JSON.stringify(bodyParsed, null, 2));
  } catch (e) {
    console.log("DEBUG: Webhook Body Text:", bodyText);
  }

  const metadata = (bodyParsed.metadata && typeof bodyParsed.metadata === "object") ? bodyParsed.metadata :
    (bodyParsed.custom_metadata && typeof bodyParsed.custom_metadata === "object") ? bodyParsed.custom_metadata :
      (data.custom_metadata && typeof data.custom_metadata === "object") ? data.custom_metadata : {};

  // Robust transcript extraction (Handles root transcript, data.transcript, and array turning)
  let transcript = "";
  const rawTranscript = data.transcript || bodyParsed.transcript || bodyParsed.transcription || bodyParsed.text || metadata.text || "";

  if (typeof rawTranscript === "string") {
    transcript = rawTranscript;
  } else if (Array.isArray(rawTranscript)) {
    // v2.969: "Clean Handoff" mapping - strip metric noise from turns
    transcript = rawTranscript.map((u: any) => {
      const role = u.role || u.speaker || "unknown";
      const text = u.message || u.text || u.content || "";
      if (!text) return null;
      return `${role}: ${text}`;
    }).filter(Boolean).join("\n");
  }

  transcript = safeString(transcript, 60000).trim();

  if (!transcript) {
    console.error("DEBUG: Webhook failed - transcript text empty");
    return json({ error: "text (transcript) required" }, 400);
  }

  // Identity Extraction
  const clientData = data.conversation_initiation_client_data || {};
  const dynVars = clientData.dynamic_variables || {};

  const subjectId = safeString(bodyParsed.subject_id ?? metadata.subject_id ?? data.user_id ?? dynVars.subject_id ?? "", 256).trim();
  const subjectPhone = safeString(bodyParsed.subject_e164 ?? metadata.subject_e164 ?? metadata.phone ?? metadata.subject_phone ?? dynVars.subject_e164 ?? dynVars.system__caller_id ?? "", 64).trim();
  const visitorId = safeString(bodyParsed.visitor_id ?? metadata.visitor_id ?? dynVars.visitor_id ?? "", 128).trim();

  if (!subjectId && !subjectPhone && !visitorId) {
    console.error("DEBUG: Webhook failed - no subject identification found in body, data, or nested dynamic_variables");
    await logAudit(env, "/integrations/elevenlabs/transcript", bodyText, Object.fromEntries(headers), 400);
    return json({ error: "subject_id, subject_e164, or visitor_id required" }, 400);
  }

  // Summary Extraction (Prefer ElevenLabs Analysis Summary if available)
  const analysis = bodyParsed.analysis || {};
  const summary = safeString(bodyParsed.summary ?? analysis.transcript_summary ?? metadata.summary ?? "", 2000).trim();

  const payload: Record<string, any> = {
    subject_id: subjectId,
    subject_e164: subjectPhone,
    visitor_id: visitorId,
    transcript,
    call_id: bodyParsed.call_id ?? metadata.call_id ?? bodyParsed.conversation_id ?? data.conversation_id ?? bodyParsed.transcription_id ?? metadata.transcription_id,
    agent_id: bodyParsed.agent_id ?? data.agent_id ?? metadata.agent_id ?? null,
    summary: summary,
    extracted_facts: Array.isArray(bodyParsed.extracted_facts)
      ? bodyParsed.extracted_facts
      : Array.isArray(metadata.extracted_facts) ? metadata.extracted_facts : [],
  };

  if (bodyParsed.auto_extract === false || metadata.auto_extract === false) payload.auto_extract = false;
  if (bodyParsed.language_code || metadata.language_code) payload.language_code = bodyParsed.language_code ?? metadata.language_code;
  if (bodyParsed.language_probability || metadata.language_probability) payload.language_probability = bodyParsed.language_probability ?? metadata.language_probability;

  console.log(`DEBUG: Webhook Ingesting Transcript for call_id=${payload.call_id} (Sync v2.969)`);
  const res = await ingestTranscript(env, workspaceId, payload);

  // v2.974: Log success after successful ingestion
  if (res.status === 200) {
    await logAudit(env, "/integrations/elevenlabs/transcript", bodyText, Object.fromEntries(headers), 200);
  } else {
    await logAudit(env, "/integrations/elevenlabs/transcript", bodyText, Object.fromEntries(headers), res.status);
  }

  return res;
}

type SessionContextUpdateInput = {
  channel_mode?: string | null;
  verified_subject?: string | null;
  handoff_reason?: string | null;
};

async function applySessionContextUpdate(
  env: Env,
  workspaceId: string,
  sessionId: string,
  updates: SessionContextUpdateInput
) {
  let existing: SessionContextRow | null = null;
  const cached = readSessionContextCache(workspaceId, sessionId);
  if (cached) {
    existing = {
      channel_mode: cached.channel_mode,
      verified_subject: cached.verified_subject,
      handoff_reason: cached.handoff_reason
    };
  } else {
    const row = await env.D1_DB
      .prepare(
        "SELECT channel_mode, verified_subject, handoff_reason FROM session_context WHERE workspace_id = ? AND session_id = ?"
      )
      .bind(workspaceId, sessionId)
      .first<SessionContextRow>();
    if (row) existing = row;
  }

  const channelProvided = Object.prototype.hasOwnProperty.call(updates, "channel_mode");
  const requestedMode = channelProvided ? normalizeChannelMode(updates.channel_mode ?? "") : "";
  const nextMode = channelProvided
    ? requestedMode || existing?.channel_mode || "chat"
    : existing?.channel_mode || "chat";

  const verifiedProvided = Object.prototype.hasOwnProperty.call(updates, "verified_subject");
  const nextVerified = verifiedProvided
    ? (() => {
      const raw = updates.verified_subject;
      if (raw === null) return null;
      const val = safeString(raw ?? "", 256).trim();
      return val || null;
    })()
    : existing?.verified_subject ?? null;

  const handoffProvided = Object.prototype.hasOwnProperty.call(updates, "handoff_reason");
  const nextHandoff = handoffProvided
    ? (() => {
      const raw = updates.handoff_reason;
      if (raw === null) return null;
      const val = safeString(raw ?? "", 256).trim();
      return val || null;
    })()
    : existing?.handoff_reason ?? null;

  if (!existing && !channelProvided && !verifiedProvided && !handoffProvided) {
    const context = {
      channel_mode: nextMode,
      verified_subject: nextVerified,
      handoff_reason: nextHandoff
    };
    writeSessionContextCache(workspaceId, sessionId, context);
    return { context, changed: false };
  }

  const noChange =
    existing &&
    (existing.channel_mode || "chat") === nextMode &&
    (existing.verified_subject ?? null) === nextVerified &&
    (existing.handoff_reason ?? null) === nextHandoff;

  if (noChange) {
    return {
      context: {
        channel_mode: nextMode,
        verified_subject: nextVerified,
        handoff_reason: nextHandoff
      },
      changed: false
    };
  }

  await env.D1_DB.prepare(
    `INSERT INTO session_context (
        workspace_id, session_id, channel_mode, verified_subject, handoff_reason, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(workspace_id, session_id) DO UPDATE SET
        channel_mode = excluded.channel_mode,
        verified_subject = excluded.verified_subject,
        handoff_reason = excluded.handoff_reason,
        updated_at = excluded.updated_at`
  ).bind(workspaceId, sessionId, nextMode, nextVerified, nextHandoff, nowMs()).run();

  const context = {
    channel_mode: nextMode,
    verified_subject: nextVerified,
    handoff_reason: nextHandoff
  };

  writeSessionContextCache(workspaceId, sessionId, context);

  return { context, changed: true };
}

async function setContext(env: Env, workspaceId: string, body: any) {
  const sessionId = safeString(body.session_id ?? body.call_id ?? body.conversation_id ?? "", 128).trim();
  if (!sessionId) return json({ error: "session_id required" }, 400);

  const updates: SessionContextUpdateInput = {};
  if (Object.prototype.hasOwnProperty.call(body, "channel_mode")) {
    updates.channel_mode =
      body.channel_mode === null ? null : safeString(body.channel_mode ?? "", 32);
  }
  if (Object.prototype.hasOwnProperty.call(body, "verified_subject")) {
    updates.verified_subject =
      body.verified_subject === null ? null : safeString(body.verified_subject ?? "", 256).trim();
  }
  if (Object.prototype.hasOwnProperty.call(body, "handoff_reason")) {
    updates.handoff_reason =
      body.handoff_reason === null ? null : safeString(body.handoff_reason ?? "", 256).trim();
  }

  const { context } = await applySessionContextUpdate(env, workspaceId, sessionId, updates);

  return json({
    ok: true,
    session_id: sessionId,
    context
  });
}

async function handoffDispatch(env: Env, workspaceId: string, body: any) {
  const sessionId = safeString(body.session_id ?? body.call_id ?? body.conversation_id ?? "", 128).trim();
  if (!sessionId) return json({ error: "session_id required" }, 400);

  const rawReason = Object.prototype.hasOwnProperty.call(body, "handoff_reason")
    ? body.handoff_reason
    : body.reason;
  const handoffReason = safeString(rawReason ?? "", 256).trim();
  if (!handoffReason) return json({ error: "handoff_reason required" }, 400);

  // v2.875: Broadcast Handoff
  if (env.MEMORY_CACHE) {
    try {
      const id = env.MEMORY_CACHE.idFromName("viz:" + workspaceId);
      const stub = env.MEMORY_CACHE.get(id);
      const p = stub.fetch("https://viz", {
        method: "POST",
        body: JSON.stringify({
          op: "broadcast",
          message: { type: "handoff", reason: handoffReason }
        })
      });
      // ctx is not passed to handoffDispatch, so we just run it without await if possible or just catch
      p.catch(e => console.error("BROADCAST_ERR", e));
    } catch (e) { /* ignore */ }
  }

  const updates: SessionContextUpdateInput = {
    handoff_reason: handoffReason
  };
  if (Object.prototype.hasOwnProperty.call(body, "channel_mode")) {
    updates.channel_mode =
      body.channel_mode === null ? null : safeString(body.channel_mode ?? "", 32);
  }
  if (Object.prototype.hasOwnProperty.call(body, "verified_subject")) {
    updates.verified_subject =
      body.verified_subject === null ? null : safeString(body.verified_subject ?? "", 256).trim();
  }

  const { context } = await applySessionContextUpdate(env, workspaceId, sessionId, updates);

  const transferPayload: Record<string, any> = {
    session_id: sessionId,
    channel_mode: context.channel_mode,
    verified_subject: context.verified_subject,
    handoff_reason: context.handoff_reason || handoffReason
  };

  if (body.transfer_payload && typeof body.transfer_payload === "object") {
    Object.assign(transferPayload, body.transfer_payload);
  }
  if (body.transfer_metadata && typeof body.transfer_metadata === "object") {
    transferPayload.metadata = body.transfer_metadata;
  }

  return json({
    ok: true,
    session_id: sessionId,
    context,
    transfer: transferPayload
  });
}

async function identityPassthrough(env: Env, workspaceId: string, body: any) {
  const sessionId = safeString(body.session_id ?? body.call_id ?? body.conversation_id ?? "", 128).trim();
  if (!sessionId) return json({ error: "session_id required" }, 400);

  const channelMode = normalizeChannelMode(body.channel_mode) || "chat";
  const phoneInput = safeString(
    body.subject_e164 ?? body.phone ?? body.system_caller_id ?? body.system__caller_id ?? "",
    64
  ).trim();
  const emailInput = safeString(body.email ?? "", 160).trim().toLowerCase();

  const phoneDetails = phoneInput ? validatePhoneInput(phoneInput) : null;
  const emailDetails = emailInput ? validateEmailInput(emailInput) : null;

  if (!phoneDetails?.valid && !emailDetails?.valid) {
    return json(
      {
        error: "valid phone or email required",
        subject_e164_valid: phoneDetails?.valid ?? false,
        subject_e164_reason: phoneDetails?.reason,
        email_valid: emailDetails?.valid ?? false,
        email_reason: emailDetails?.reason,
        email_suggestion: emailDetails?.suggestion
      },
      400
    );
  }

  const normalizedPhone = phoneDetails?.normalized || "";
  const normalizedEmail = emailDetails?.normalized || "";
  const subjectId = normalizedPhone
    ? await phoneSubjectId(env, workspaceId, normalizedPhone)
    : normalizedEmail;

  if (!subjectId) return json({ error: "unable to derive subject_id" }, 400);

  // Broadcast identity passthrough
  if (env.MEMORY_CACHE) {
    const id = env.MEMORY_CACHE.idFromName("viz:" + workspaceId);
    const stub = env.MEMORY_CACHE.get(id);
    const msg = {
      op: "broadcast",
      message: {
        type: "identity_confirmed",
        email: normalizedEmail || null,
        phone: normalizedPhone || null,
        source: "passthrough"
      }
    };
    stub.fetch("https://viz", { method: "POST", body: JSON.stringify(msg) }).catch(e => console.log("viz_err", e));
  }

  const metadataObject: Json | null =
    body.metadata && typeof body.metadata === "object" ? (body.metadata as Json) : null;
  let metadataJson: string | null = null;
  if (metadataObject) {
    try {
      const serialized = JSON.stringify(metadataObject);
      if (serialized.length <= 8000) metadataJson = serialized;
    } catch (_) {
      metadataJson = null;
    }
  }

  const now = nowMs();
  await env.D1_DB.prepare(
    `INSERT INTO session_identity (
        workspace_id, session_id, channel_mode, subject_e164, email, subject_id, metadata, created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(workspace_id, session_id) DO UPDATE SET
        channel_mode = excluded.channel_mode,
        subject_e164 = excluded.subject_e164,
        email = excluded.email,
        subject_id = excluded.subject_id,
        metadata = excluded.metadata,
        updated_at = excluded.updated_at`
  ).bind(
    workspaceId,
    sessionId,
    channelMode,
    normalizedPhone || null,
    normalizedEmail || null,
    subjectId,
    metadataJson,
    now,
    now
  ).run();

  // Seed the session_context row so downstream agents inherit the channel immediately.
  try {
    await env.D1_DB.prepare(
      `INSERT INTO session_context (workspace_id, session_id, channel_mode, verified_subject, handoff_reason, updated_at)
       VALUES (?, ?, ?, NULL, NULL, ?)
       ON CONFLICT(workspace_id, session_id) DO UPDATE SET
         channel_mode = excluded.channel_mode,
         updated_at = excluded.updated_at`
    ).bind(workspaceId, sessionId, channelMode, now).run();
  } catch (err: any) {
    console.log("session_context_seed_error", err?.message || err);
  }

  writeSessionIdentityCache(workspaceId, sessionId, {
    channel_mode: channelMode,
    subject_e164: normalizedPhone || null,
    email: normalizedEmail || null,
    subject_id: subjectId,
    metadata: metadataObject,
    updated_at: now
  });

  return json({
    ok: true,
    session_id: sessionId,
    channel_mode: channelMode,
    subject_id: subjectId,
    subject_e164: normalizedPhone || null,
    email: normalizedEmail || null,
    metadata: metadataObject,
    validation: {
      subject_e164_valid: phoneDetails?.valid ?? false,
      subject_e164_reason: phoneDetails?.reason,
      email_valid: emailDetails?.valid ?? false,
      email_reason: emailDetails?.reason,
      email_suggestion: emailDetails?.suggestion
    }
  });
}

async function getSessionIdentity(env: Env, workspaceId: string, body: any) {
  const sessionId = safeString(body.session_id ?? body.call_id ?? body.conversation_id ?? "", 128).trim();
  if (!sessionId) return json({ error: "session_id required" }, 400);

  const data = await fetchSessionIdentityData(env, workspaceId, sessionId);
  return json(data);
}

async function preloadSession(env: Env, workspaceId: string, body: any) {
  const sessionId = safeString(body.session_id ?? body.call_id ?? body.conversation_id ?? "", 128).trim();
  if (!sessionId) return json({ error: "session_id required" }, 400);

  const session = await fetchSessionIdentityData(env, workspaceId, sessionId);
  if (!session.found) return json({ session, memory: null });

  const subjectId = session.subject_id;
  if (!subjectId) {
    return json({ session, memory: null });
  }

  const bootstrapBody: any = {
    subject_id: subjectId,
    session_id: sessionId
  };
  if (body.agent_id) bootstrapBody.agent_id = body.agent_id;
  if (body.query) bootstrapBody.query = body.query;
  if (body.top_k) bootstrapBody.top_k = body.top_k;

  const bootstrapResponse = await bootstrap(env, workspaceId, bootstrapBody);
  if (!bootstrapResponse.ok) {
    return bootstrapResponse;
  }
  const memoryPayload = await bootstrapResponse.json();
  return json({ session, memory: memoryPayload });
}

// v3.166: Lightweight web greeting endpoint.
// The ElevenLabs init webhook only fires for phone/SIP calls.
// For web SDK sessions, the frontend calls this endpoint before starting
// the conversation to get a personalized greeting.
async function webGreetingHandler(env: Env, workspaceId: string, body: any) {
  const _start = Date.now();
  const visitorId = safeString(body?.visitor_id ?? "", 128).trim();
  const timeGreeting = safeString(body?.time_greeting ?? "", 32).trim() || deriveTimeGreeting(new Date(), DEFAULT_TIMEZONE);

  if (!visitorId) {
    console.log("WEB_GREETING: no visitor_id, returning generic");
    const generic = `${timeGreeting}, this is Emily with Ampere AI. How can I help you today?`;
    return json({ dynamic_greeting: generic, visitor_status: "new", name: null });
  }

  try {
    // Check DO cache first for fast response
    const cacheKey = `init_greeting:${visitorId}`;
    if (shouldUseDoCache(env)) {
      try {
        const stub = getCacheStub(env, workspaceId, visitorId);
        const cacheRes = await stub.fetch(new Request("https://cache/", {
          method: "POST",
          body: JSON.stringify({ op: "get", key: cacheKey })
        }));
        const cacheData = await cacheRes.json() as any;
        if (cacheData.hit && cacheData.payload) {
          console.log(`WEB_GREETING: cache hit for ${visitorId} (${Date.now() - _start}ms)`);
          return json({
            dynamic_greeting: cacheData.payload.dynamic_greeting,
            situational_briefing: cacheData.payload.briefing || "",
            visitor_status: cacheData.payload.visitor_status,
            name: cacheData.payload.name
          });
        }
      } catch (_) { /* cache miss */ }
    }

    // D1 path: resolve canonical ID + get greeting data
    let lookupId = await getCanonicalSubjectId(env, workspaceId, visitorId);

    // v3.170: subject_links stores primary_subject_id as "+14168922443|Andrew Crowe"
    // and call_summaries/memories are stored under that SAME full canonical ID.
    // We extract the embedded name for greeting construction but keep the full ID for queries.
    let embeddedName: string | null = null;
    if (lookupId.includes("|")) {
      const parts = lookupId.split("|");
      // DO NOT overwrite lookupId — call_summaries use the full canonical form
      embeddedName = parts.slice(1).join("|").trim() || null; // "Andrew Crowe"
    }

    const briefingData = await getLatestBriefing(env, workspaceId, lookupId, timeGreeting);

    // If getLatestBriefing didn't find a name in memories, use the name embedded
    // in the subject_links entry (e.g. from a prior phone call identification)
    if (!briefingData.name && embeddedName) {
      const firstName = embeddedName.split(" ")[0];
      briefingData.name = firstName;
      briefingData.visitor_status = `returning:${firstName}`;
      // Rebuild greeting with the name
      const namedGreetings = [
        `${timeGreeting}, ${firstName}! Good to have you back. What can I help with?`,
        `${timeGreeting}, ${firstName}. Welcome back — what are we working on today?`,
        `Hey ${firstName}, ${timeGreeting.toLowerCase()}! Great to hear from you again. What's on your mind?`
      ];
      briefingData.dynamic_greeting = namedGreetings[Math.floor(Math.random() * namedGreetings.length)];
    }

    console.log(`WEB_GREETING: resolved ${visitorId} -> ${lookupId}, embedded=${embeddedName}, name=${briefingData.name}, status=${briefingData.visitor_status} (${Date.now() - _start}ms)`);

    // Cache for next time
    if (shouldUseDoCache(env)) {
      try {
        const stub = getCacheStub(env, workspaceId, visitorId);
        stub.fetch(new Request("https://cache/", {
          method: "POST",
          body: JSON.stringify({
            op: "put",
            key: cacheKey,
            payload: {
              briefing: briefingData.briefing,
              dynamic_greeting: briefingData.dynamic_greeting,
              name: briefingData.name,
              visitor_status: briefingData.visitor_status
            }
          })
        })).catch(() => { });
      } catch (_) { /* ignore */ }
    }

    return json({
      dynamic_greeting: briefingData.dynamic_greeting,
      situational_briefing: briefingData.briefing || "",
      visitor_status: briefingData.visitor_status,
      name: briefingData.name
    });
  } catch (err: any) {
    console.log("WEB_GREETING_ERROR", err?.message || err);
    const fallback = `${timeGreeting}, this is Emily with Ampere AI. How can I help you today?`;
    return json({ dynamic_greeting: fallback, visitor_status: "new", name: null });
  }
}

async function elevenLabsInitHandler(
  req: Request,
  env: Env,
  workspaceId: string,
  bodyText: string
) {
  const secret = env.ELEVENLABS_INIT_WEBHOOK_SECRET || "";
  if (!secret) {
    return json({ error: "init_webhook_secret_missing" }, 500);
  }

  const providedSecret = safeString(
    req.headers.get("X-ElevenLabs-Init-Secret") ??
    req.headers.get("x-elevenlabs-init-secret") ??
    req.headers.get("ElevenLabs_Init_Webhook_Secret") ??
    req.headers.get("elevenlabs_init_webhook_secret") ??
    "",
    256
  );
  if (!providedSecret || !timingSafeEqual(providedSecret, secret)) {
    return json({ error: "init_secret_invalid" }, 401);
  }

  const body = bodyText ? JSON.parse(bodyText) : {};
  const _initStart = Date.now();

  // v3.165: Diagnostic — log what ElevenLabs actually sends us
  console.log("INIT_WEBHOOK_BODY_KEYS", Object.keys(body).join(","));
  if (body.conversation_initiation_client_data) {
    console.log("INIT_NESTED_CLIENT_DATA_KEYS", Object.keys(body.conversation_initiation_client_data).join(","));
  }
  if (body.dynamic_variables) {
    console.log("INIT_TOP_LEVEL_DYN_VARS", JSON.stringify(body.dynamic_variables).slice(0, 500));
  }
  if (body.conversation_initiation_client_data?.dynamic_variables) {
    console.log("INIT_NESTED_DYN_VARS", JSON.stringify(body.conversation_initiation_client_data.dynamic_variables).slice(0, 500));
  }

  const initMode = safeString(env.ELEVENLABS_INIT_PAYLOAD_MODE ?? "", 16).toLowerCase();
  if (initMode === "minimal") {
    return json({
      type: "conversation_initiation_client_data",
      dynamic_variables: {}
    });
  }
  if (body.type && body.type !== "conversation_initiation_client_data_request") {
    console.log("Unexpected elevenlabs init type", body.type);
  }
  const sessionId = safeString(
    body.session_id ?? body.call_sid ?? body.call_id ?? body.conversation_id ?? "",
    128
  ).trim();
  const providedTimezone = safeString(
    body.timezone ?? body.system__timezone ?? body.caller_timezone ?? "",
    128
  );
  let timezone = providedTimezone && isValidTimezone(providedTimezone) ? providedTimezone : "";
  let timeGreeting: string | null = null;

  const callerIdRaw = safeString(
    body.system__caller_id ?? body.caller_id ?? body.from ?? "",
    64
  ).trim();
  const calledNumberRaw = safeString(
    body.system__called_number ?? body.called_number ?? body.to ?? "",
    64
  ).trim();
  const providedChannelMode = safeString(
    body.channel_mode ?? body.system__channel_mode ?? "",
    16
  );
  const inferredChannelMode = callerIdRaw ? "voice" : "chat";
  const channelMode = normalizeChannelMode(providedChannelMode) || inferredChannelMode;

  // v3.164: Only check session_identity for voice (timezone enrichment from prior calls).
  // Web visitors always push timezone from the client.
  if (sessionId && callerIdRaw) {
    const row = await env.D1_DB
      .prepare(
        `SELECT metadata
         FROM session_identity
         WHERE workspace_id = ? AND session_id = ?`
      )
      .bind(workspaceId, sessionId)
      .first<{ metadata: string | null }>();

    if (row?.metadata) {
      try {
        const metadata = JSON.parse(row.metadata);
        if (!timezone && metadata?.timezone && isValidTimezone(metadata.timezone)) {
          timezone = metadata.timezone;
        }
        if (!timeGreeting && metadata?.time_greeting) {
          timeGreeting = metadata.time_greeting;
        }
      } catch (_) {
        // ignore malformed metadata
      }
    }
  }

  if (!timezone) timezone = DEFAULT_TIMEZONE;
  const nowUtc = new Date();
  if (!timeGreeting) {
    timeGreeting = deriveTimeGreeting(nowUtc, timezone);
  }
  const systemTimeUtc = nowUtc.toISOString();
  const systemTimeLocal = formatLocalIso(nowUtc, timezone);

  // v3.165: ElevenLabs may send client dynamic_variables in TWO locations:
  //   1. body.dynamic_variables (top-level — older SDK versions / direct webhook)
  //   2. body.conversation_initiation_client_data.dynamic_variables (nested — current SDK)
  // We merge both, giving the nested (more specific) location priority.
  const topLevelDynVars =
    body && typeof body.dynamic_variables === "object" && body.dynamic_variables
      ? body.dynamic_variables
      : {};
  const nestedDynVars =
    body?.conversation_initiation_client_data &&
      typeof body.conversation_initiation_client_data.dynamic_variables === "object" &&
      body.conversation_initiation_client_data.dynamic_variables
      ? body.conversation_initiation_client_data.dynamic_variables
      : {};
  const dynamicVariables = { ...topLevelDynVars, ...nestedDynVars };

  console.log("INIT_RESOLVED_VISITOR_ID", dynamicVariables.visitor_id || "NONE");

  // Ensure caller_id/called_number are always reflected in dynamic vars so the prompt
  // sees an empty string (Web) instead of the literal "{{system__caller_id}}" (Phone/Error)
  if (!dynamicVariables.system__caller_id) {
    dynamicVariables.system__caller_id = callerIdRaw;
  }
  if (!dynamicVariables.system__called_number) {
    dynamicVariables.system__called_number = calledNumberRaw;
  }

  if (timezone && !dynamicVariables.system__timezone) {
    dynamicVariables.system__timezone = timezone;
  }
  if (!dynamicVariables.system__time) {
    dynamicVariables.system__time = systemTimeLocal;
  }
  if (!dynamicVariables.system__time_utc) {
    dynamicVariables.system__time_utc = systemTimeUtc;
  }
  if (timeGreeting) {
    if (!dynamicVariables.user_time_greeting) dynamicVariables.user_time_greeting = timeGreeting;
    if (!dynamicVariables.time_greeting) dynamicVariables.time_greeting = timeGreeting;
  }
  if (!dynamicVariables.channel_mode) {
    dynamicVariables.channel_mode = channelMode;
  }
  if (sessionId && !dynamicVariables.conversation_id) {
    dynamicVariables.conversation_id = sessionId;
  }
  if (!dynamicVariables.latency_profile) {
    dynamicVariables.latency_profile =
      safeString(env.ELEVENLABS_LATENCY_PROFILE ?? "", 32).trim() || "low";
  }
  dynamicVariables.tool_latency_filler_ms = String(getToolLatencyThreshold(env));


  // v3.164: FAST PATH — For web chat, skip the entire identity/session pipeline.
  // Only voice calls (with callerIdRaw) need identityPassthrough + setContext + bootstrap.
  // Web visitors just need: visitor_id → canonical subject → greeting data.
  // This shaves 5-6 sequential D1 queries off the critical path.

  const isVoiceSession = !!callerIdRaw;
  let sessionSnapshot: Awaited<ReturnType<typeof fetchSessionIdentityData>> | null = null;

  if (isVoiceSession && sessionId) {
    // Voice-only pipeline: identity passthrough + context setup + enrichment
    // Run identityPassthrough and setContext in parallel (they're independent)
    const [,] = await Promise.all([
      identityPassthrough(env, workspaceId, {
        session_id: sessionId,
        channel_mode: channelMode,
        subject_e164: callerIdRaw,
        metadata: {
          timezone,
          system_time_local: systemTimeLocal,
          system_time_utc: systemTimeUtc,
          time_greeting: timeGreeting,
          user_time_greeting: timeGreeting,
          ...(calledNumberRaw ? { called_number: calledNumberRaw } : {})
        }
      }).catch((err: any) => console.log("identity_passthrough_init_error", err?.message || err)),

      setContext(env, workspaceId, {
        session_id: sessionId,
        channel_mode: channelMode,
        verified_subject: null,
        handoff_reason: null
      }).catch((err: any) => console.log("init_set_context_error", err?.message || err))
    ]);

    // Now fetch session data + bootstrap
    try {
      sessionSnapshot = await fetchSessionIdentityData(env, workspaceId, sessionId);
      if (sessionSnapshot.found && sessionSnapshot.subject_id) {
        const bootstrapRes = await bootstrap(env, workspaceId, {
          subject_id: sessionSnapshot.subject_id,
          session_id: sessionId
        });
        if (!bootstrapRes.ok) {
          console.log("init_bootstrap_status", bootstrapRes.status);
        }
      }
    } catch (err: any) {
      console.log("init_enrichment_error", err?.message || err);
    }
  }

  // --- Greeting / Briefing Lookup (both channels) ---
  // Resolve the canonical subject ID for this visitor
  const rawLookupId = sessionSnapshot?.subject_id || dynamicVariables.visitor_id || callerIdRaw;
  let lookupId = rawLookupId;

  console.log(
    "INIT_LOOKUP_TRACE",
    `sessionSnapshot_sid=${sessionSnapshot?.subject_id || "NONE"}`,
    `dv_visitor_id=${dynamicVariables.visitor_id || "NONE"}`,
    `callerIdRaw=${callerIdRaw || "NONE"}`,
    `rawLookupId=${rawLookupId || "NONE"}`
  );

  if (lookupId) {
    // Check DO cache first for greeting data (sub-ms if warm)
    const cacheKey = `init_greeting:${lookupId}`;
    let cachedGreeting: { briefing: string; dynamic_greeting: string; name: string | null; visitor_status: string } | null = null;

    if (shouldUseDoCache(env)) {
      try {
        const stub = getCacheStub(env, workspaceId, lookupId);
        const cacheRes = await stub.fetch(new Request("https://cache/", {
          method: "POST",
          body: JSON.stringify({ op: "get", key: cacheKey })
        }));
        const cacheData = await cacheRes.json() as any;
        if (cacheData.hit && cacheData.payload) {
          cachedGreeting = cacheData.payload;
          console.log("init_greeting_cache_hit", lookupId);
        }
      } catch (_) {
        // Cache miss or error, fall through to D1
      }
    }

    if (cachedGreeting) {
      dynamicVariables.situational_briefing = cachedGreeting.briefing;
      dynamicVariables.visitor_status = cachedGreeting.visitor_status;
      dynamicVariables.dynamic_greeting = cachedGreeting.dynamic_greeting;
      if (cachedGreeting.name) {
        dynamicVariables.user_name = cachedGreeting.name;
      }
    } else {
      // D1 path: resolve canonical ID + get greeting data
      lookupId = await getCanonicalSubjectId(env, workspaceId, lookupId);

      // v3.170: subject_links stores the full canonical form "+14168922443|Name"
      // and call_summaries use that same full form. Keep it intact for queries.
      let embeddedName: string | null = null;
      if (lookupId.includes("|")) {
        const parts = lookupId.split("|");
        // DO NOT overwrite lookupId — call_summaries use the full canonical form
        embeddedName = parts.slice(1).join("|").trim() || null;
      }

      const briefingData = await getLatestBriefing(env, workspaceId, lookupId, timeGreeting || "Hello");

      // Fall back to embedded name from subject_links if memories has no name
      if (!briefingData.name && embeddedName) {
        const firstName = embeddedName.split(" ")[0];
        briefingData.name = firstName;
        briefingData.visitor_status = `returning:${firstName}`;
        const tg = timeGreeting || "Hello";
        const namedGreetings = [
          `${tg}, ${firstName}! Good to have you back. What can I help with?`,
          `${tg}, ${firstName}. Welcome back — what are we working on today?`,
          `Hey ${firstName}, ${tg.toLowerCase()}! Great to hear from you again. What's on your mind?`
        ];
        briefingData.dynamic_greeting = namedGreetings[Math.floor(Math.random() * namedGreetings.length)];
      }

      dynamicVariables.situational_briefing = briefingData.briefing;
      dynamicVariables.visitor_status = briefingData.visitor_status;
      dynamicVariables.dynamic_greeting = briefingData.dynamic_greeting;
      if (briefingData.name) {
        dynamicVariables.user_name = briefingData.name;
      }

      // Cache the greeting data in DO for fast repeat lookups (TTL managed by DO)
      if (shouldUseDoCache(env)) {
        try {
          const stub = getCacheStub(env, workspaceId, rawLookupId!);
          stub.fetch(new Request("https://cache/", {
            method: "POST",
            body: JSON.stringify({
              op: "put",
              key: cacheKey,
              payload: {
                briefing: briefingData.briefing,
                dynamic_greeting: briefingData.dynamic_greeting,
                name: briefingData.name,
                visitor_status: briefingData.visitor_status
              }
            })
          })).catch(() => { }); // fire-and-forget
        } catch (_) {
          // ignore cache write errors
        }
      }
    }
  } else {
    dynamicVariables.situational_briefing = "";
    dynamicVariables.visitor_status = "new";
    const newGreetings = [
      `${timeGreeting || "Hello"}, this is Emily with Ampere AI. What can I help you with today?`,
      `${timeGreeting || "Hello"}! Emily here from Ampere AI. How can I help?`,
      `${timeGreeting || "Hello"}, you've reached Emily at Ampere AI. What can I do for you?`
    ];
    dynamicVariables.dynamic_greeting = newGreetings[Math.floor(Math.random() * newGreetings.length)];
  }

  const customExtraBody = isPlainObject(body?.custom_llm_extra_body)
    ? { ...getDefaultCustomLLMBody(env), ...body.custom_llm_extra_body }
    : { ...getDefaultCustomLLMBody(env) };
  const existingExtraDynamic =
    isPlainObject(customExtraBody.dynamic_variables) ? customExtraBody.dynamic_variables : {};
  customExtraBody.dynamic_variables = {
    ...existingExtraDynamic,
    ...dynamicVariables
  };

  const responsePayload: Record<string, any> = {
    type: "conversation_initiation_client_data",
    dynamic_variables: dynamicVariables,
    custom_llm_extra_body: customExtraBody
  };

  const conversationOverride = getConversationOverride(env);
  if (conversationOverride && Object.keys(conversationOverride).length) {
    responsePayload.conversation_config_override = conversationOverride;
  }

  const userId = safeString(
    sessionSnapshot?.subject_id ?? callerIdRaw ?? sessionId ?? "",
    256
  ).trim();
  if (userId) {
    responsePayload.user_id = userId;
  }

  // v3.161: Removed duplicate v2.983 briefing block — getLatestBriefing() already handles
  // situational_briefing, dynamic_greeting, visitor_status, and user_name in a single query.

  const initElapsed = Date.now() - _initStart;
  try {
    console.log(
      "elevenlabs_init_response",
      `elapsed=${initElapsed}ms`,
      `path=${isVoiceSession ? "voice" : "web"}`,
      `dynamic_greeting=${dynamicVariables.dynamic_greeting?.substring(0, 60) || "MISSING"}`,
      `visitor_status=${dynamicVariables.visitor_status || "MISSING"}`,
      `user_name=${dynamicVariables.user_name || "NONE"}`,
      JSON.stringify(responsePayload).slice(0, 2000)
    );
  } catch (_) {
    // ignore logging issues
  }
  return json(responsePayload);
}

async function twilioVoiceHandler(
  req: Request,
  env: Env,
  defaultWorkspaceId: string,
  rawBody: string
) {
  const streamUrl = env.ELEVENLABS_TWILIO_STREAM_URL || "";
  if (!streamUrl) {
    const offline = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say>Sorry, our AI agent is offline right now.</Say>
</Response>`;
    return new Response(offline, {
      status: 200,
      headers: { "content-type": "text/xml; charset=utf-8" }
    });
  }

  const url = new URL(req.url);
  const form = rawBody ? new URLSearchParams(rawBody) : new URLSearchParams();
  let workspaceId =
    safeString(
      form.get("WorkspaceId") || form.get("workspace_id") || url.searchParams.get("workspace_id") || "",
      64
    ).trim() || defaultWorkspaceId || "emily";

  const callSid = safeString(form.get("CallSid") || form.get("CallSid[]") || "", 128).trim() ||
    safeString(form.get("ConversationSid") || "", 128).trim() ||
    crypto.randomUUID();
  const fromRaw = safeString(form.get("From") || form.get("Caller") || "", 64);
  const toRaw = safeString(form.get("To") || form.get("Called") || "", 64);
  const normalizedCaller = fromRaw ? normalizeIdentityPhone(fromRaw) : "";
  const normalizedCalled = toRaw ? normalizeIdentityPhone(toRaw) : "";
  const callerCountry = safeString(form.get("CallerCountry") || "", 8);
  const callerState = safeString(form.get("CallerState") || "", 8);
  const callerTimezone = safeString(form.get("CallerTimeZone") || "", 64);
  const timezone = deriveTimezoneFromHints(callerTimezone, callerCountry, callerState);
  const now = new Date();
  const systemTimeUtc = now.toISOString();
  const systemTimeLocal = formatLocalIso(now, timezone);
  const timeGreeting = deriveTimeGreeting(now, timezone);

  const metadata: Record<string, any> = {
    timezone,
    system_time_local: systemTimeLocal,
    system_time_utc: systemTimeUtc,
    time_greeting: timeGreeting
  };
  if (callerCountry) metadata.caller_country = callerCountry;
  if (callerState) metadata.caller_state = callerState;
  if (normalizedCalled || toRaw) metadata.called_number = normalizedCalled || toRaw;

  if (normalizedCaller) {
    try {
      await identityPassthrough(env, workspaceId, {
        session_id: callSid,
        subject_e164: normalizedCaller,
        channel_mode: "voice",
        metadata
      });
    } catch (err: any) {
      console.log("twilio_identity_passthrough_error", err?.message || err);
    }
  }

  try {
    await setContext(env, workspaceId, {
      session_id: callSid,
      channel_mode: "voice"
    });
  } catch (err: any) {
    console.log("twilio_set_context_error", err?.message || err);
  }

  const latencyProfile = safeString(env.ELEVENLABS_LATENCY_PROFILE ?? "", 64).trim() || "low";
  const fillerThresholdMs = getToolLatencyThreshold(env);

  const baseParameters = [
    { name: "session_id", value: callSid },
    { name: "workspace_id", value: workspaceId },
    { name: "caller_id", value: normalizedCaller || fromRaw || "" },
    { name: "called_number", value: normalizedCalled || toRaw || "" },
    { name: "timezone", value: timezone },
    { name: "time_greeting", value: timeGreeting },
    { name: "system_time", value: systemTimeLocal },
    { name: "latency_profile", value: latencyProfile },
    { name: "filler_latency_ms", value: fillerThresholdMs.toString() }
  ].filter((entry) => entry.value);

  const parameterTuples = baseParameters;

  // v2.982: SITUATIONAL BRIEFING INJECTION
  // Find the LAST call summary for this caller to give the agent "warm start" context.
  if (normalizedCaller) {
    try {
      // Resolve subject_id first (handles aliases)
      const subjectId = await phoneSubjectId(env, workspaceId, normalizedCaller);
      if (subjectId) {
        const lastSummary = await env.D1_DB.prepare(
          `SELECT summary, sentiment, structured_outcome, created_at 
             FROM call_summaries 
             WHERE workspace_id = ? AND subject_id = ? 
             ORDER BY created_at DESC LIMIT 1`
        ).bind(workspaceId, subjectId).first<any>();

        if (lastSummary) {
          const dateStr = new Date(lastSummary.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" });

          let briefing = `LAST INTERACTION (${dateStr}):\n`;
          briefing += `SUMMARY: ${lastSummary.summary}\n`;
          if (lastSummary.sentiment) briefing += `SENTIMENT: ${lastSummary.sentiment}\n`;
          if (lastSummary.structured_outcome) briefing += `OUTCOME: ${lastSummary.structured_outcome}`;

          parameterTuples.push({ name: "situational_briefing", value: briefing });
          console.log(`[Briefing] Injected for ${normalizedCaller}: ${briefing.replace(/\n/g, " | ")}`);

          // v3.010: Inject VERIFIED IDENTITY (Name Only) to skip validation
          // We check the 'phone_metadata' table or 'memory_facts' to see if we have a name.
          // For now, simpler: we check if the subjectId starts with '+'. If so, we can query memory_facts for "Name".
          try {
            // Quick lookup for Name fact
            const nameFact = await env.D1_DB.prepare(
              "SELECT fact FROM memories WHERE workspace_id = ? AND subject_id = ? AND fact LIKE 'Name:%' LIMIT 1"
            ).bind(workspaceId, subjectId).first<any>();

            // v3.018: Inject Visit Count for "Frequent User" logic
            const visitCount = await env.D1_DB.prepare(
              "SELECT COUNT(*) as count FROM calls WHERE workspace_id = ? AND subject_id = ?"
            ).bind(workspaceId, subjectId).first<number>("count") || 0;

            let identityPreview = "";
            let freqTag = visitCount > 5 ? " [FREQUENT USER]" : "";

            if (nameFact) {
              identityPreview = `VERIFIED_NAME: ${nameFact.fact.replace('Name:', '').trim()}${freqTag}`;
            } else {
              // Formatting fallback
              identityPreview = `VERIFIED_ID: ${subjectId}${freqTag}`;
            }

            // We inject this so the agent knows they are ALREADY verified.
            parameterTuples.push({ name: "verified_identity_preview", value: identityPreview });
            console.log(`[Identity] Injected preview: ${identityPreview} (Visits: ${visitCount})`);
          } catch (e) { console.warn("Failed to inject identity preview", e); }
        }
      }
    } catch (err) {
      console.error("Error injecting situational_briefing", err);
    }
  }

  const parametersXml = parameterTuples
    .map(
      (entry) =>
        `      <Parameter name="${escapeXml(entry.name)}" value="${escapeXml(entry.value)}"/>`
    )
    .join("\n");

  const parameterBlock = parameterTuples.length
    ? `\n${parametersXml}\n    `
    : "";

  const trackAttr = streamUrl.includes("/convai/")
    ? ' track="inbound_track"'
    : "";

  const streamXml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Connect>
    <Stream url="${escapeXml(streamUrl)}"${trackAttr}>${parameterBlock}</Stream>
  </Connect>
</Response>`;

  return new Response(streamXml, {
    status: 200,
    headers: { "content-type": "text/xml; charset=utf-8" }
  });
}

async function identityValidate(env: Env, workspaceId: string, body: any, ctx?: ExecutionContext) {
  console.log("IDENTITY validate body=" + JSON.stringify(body || {}));
  const providedPhone = safeString(body.subject_e164 ?? "", 64).trim();
  const fallbackPhone =
    safeString(
      body.system_caller_id ??
      body.system__caller_id ??
      body.fallback_subject_e164 ??
      "",
      64
    ).trim();
  const phoneRaw = providedPhone || fallbackPhone;
  const emailRaw = safeString(body.email ?? "", 128).trim();
  const visitorIdRaw = safeString(body.visitor_id ?? "", 128).trim(); // v2.800: Cookie Logic

  if (!phoneRaw && !emailRaw && !visitorIdRaw) {
    return json({ error: "subject_e164, email, or visitor_id required" }, 400);
  }
  const payload: Record<string, any> = {
    valid: true
  };

  // Visitor ID Logic (Cookie)
  if (visitorIdRaw) {
    // Basic UUID validator or length check
    if (visitorIdRaw.length > 10) {
      payload.visitor_id_input = visitorIdRaw;
      // In the future, we could validate against a KV store of known visitors
      // For now, we accept it as a valid "Key" to unlock memory
      payload.valid = true;

      // FALLBACK: If no phone/email, treat Visitor ID as the Subject ID
      if (!phoneRaw && !emailRaw) {
        payload.subject_id = visitorIdRaw;
        // Also populate subject_e164 with a placeholder if strictly needed by Agent, 
        // but prefer explicit 'subject_id' key.
        // payload.subject_e164 = visitorIdRaw; 
      }
    } else {
      payload.visitor_id_valid = false;
      payload.visitor_id_reason = "Too short";
      if (!phoneRaw && !emailRaw) payload.valid = false;
    }
  }

  if (phoneRaw) {
    const phone = validatePhoneInput(phoneRaw);
    payload.subject_e164_input = phone.input;
    payload.subject_e164_normalized = phone.normalized || "";
    payload.subject_e164_valid = phone.valid;
    if (!phone.valid && phone.reason) payload.subject_e164_reason = phone.reason;
    payload.valid &&= phone.valid;
  }
  if (emailRaw) {
    const email = validateEmailInput(emailRaw);
    payload.email_input = email.input;
    payload.email_normalized = email.normalized || "";
    payload.email_valid = email.valid;
    if (!email.valid && email.reason) payload.email_reason = email.reason;
    payload.valid &&= email.valid;
    if (email.suggestion) payload.email_suggestion = email.suggestion;
  }

  // v2.798: Broadcast identity confirmation to frontend for Cookie Logic
  if (payload.valid && env.MEMORY_CACHE) {
    const id = env.MEMORY_CACHE.idFromName("viz:" + workspaceId);
    const stub = env.MEMORY_CACHE.get(id);
    const msg = {
      op: "broadcast",
      message: {
        type: "identity_confirmed",
        email: payload.email_normalized || null,
        phone: payload.subject_e164_normalized || null,
        visitor_id: payload.visitor_id_input || null
      }
    };
    const p = stub.fetch("https://viz", { method: "POST", body: JSON.stringify(msg) }).catch(e => console.error(`[Viz] Identity Broadcast Error (${workspaceId}):`, e));
    if (ctx && ctx.waitUntil) ctx.waitUntil(p);
  }

  return json(payload);
}

function generateOtpCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function hashVerificationCode(code: string, env: Env) {
  const salt = env.SUBJECT_SALT || "otp";
  return sha256Hex(`${code}|${salt}`);
}

async function sendVerificationMessage(
  env: Env,
  workspaceId: string,
  channel: string,
  contact: string,
  code: string
): Promise<SendResult> {
  if (channel === "sms") {
    return sendSmsOtp(env, workspaceId, contact, code);
  }
  if (channel === "email") {
    return sendEmailOtp(env, workspaceId, contact, code);
  }
  return { ok: false, error: "unsupported_channel", status: 400 };
}

async function requestOtp(env: Env, workspaceId: string, body: any, ctx?: ExecutionContext) {
  const subjectId = await resolveSubjectId(env, workspaceId, body);
  if (!subjectId) return json({ error: "subject_id or subject_e164 required" }, 400);
  const sessionId = safeString(body.session_id ?? body.call_id ?? "", 64);
  if (!sessionId) return json({ error: "session_id required" }, 400);

  // DEBUG: Specific OTP Request
  console.log(`[OTP] Request for Subject=${subjectId} Session=${sessionId} Body=`, JSON.stringify(body));

  // Try to resolve contact from args OR session identity

  let sendEmail = safeString(body.send_to_email ?? "", 160).toLowerCase();
  let sendPhoneRaw = safeString(body.send_to_e164 ?? "", 64);

  if (!sendEmail && !sendPhoneRaw) {
    const sessionIdentity = await fetchSessionIdentityData(env, workspaceId, sessionId);
    if (sessionIdentity.found) {
      if (sessionIdentity.email) sendEmail = sessionIdentity.email;
      if (sessionIdentity.subject_e164) sendPhoneRaw = sessionIdentity.subject_e164;
    }
  }

  const sendPhone = sendPhoneRaw ? normalizeIdentityPhone(sendPhoneRaw) : "";

  // v2.874: Force strict email validation before sending OTP
  if (sendEmail) {
    const v = validateEmailInput(sendEmail);
    if (!v.valid) return json({ error: "invalid_email_format", details: v.reason }, 400);
    sendEmail = v.normalized || sendEmail;
  }

  if (!sendEmail && !sendPhone) {
    return json({ error: "send_to_email or send_to_e164 required" }, 400);
  }
  const channel = sendEmail ? "email" : "sms";
  const contact = sendEmail || sendPhone;
  const code = generateOtpCode();
  const sendResult = await sendVerificationMessage(env, workspaceId, channel, contact, code);
  if (!sendResult.ok) {
    const status = sendResult.status ?? 400;
    return json({ error: sendResult.error || "otp_send_failed" }, status);
  }

  const codeHash = await hashVerificationCode(code, env);
  const now = nowMs();
  const expiresAt = now + OTP_EXPIRY_MS;

  // v2.873: Broadcast "Auth Request" EARLY so Visualizer lights up even if DB lags
  if (env.MEMORY_CACHE) {
    try {
      const id = env.MEMORY_CACHE.idFromName("viz:" + workspaceId);
      const stub = env.MEMORY_CACHE.get(id);
      const p = stub.fetch("https://viz", {
        method: "POST",
        body: JSON.stringify({
          op: "broadcast",
          message: { type: "auth_req", channel, contact }
        })
      }).catch(e => console.error(`[Viz] AuthReq Broadcast Error (${workspaceId}):`, e));
      if (ctx && ctx.waitUntil) ctx.waitUntil(p);
    } catch (e) { /* ignore */ }
  }

  console.log(`[OTP DEBUG] Inserting D1: Workspace=${workspaceId} Session=${sessionId} Subject=${subjectId} Channel=${channel} Contact=${contact} CodeHash=${codeHash} Expires=${expiresAt} Now=${now}`);

  try {
    await env.D1_DB.prepare(
      `INSERT INTO session_verifications
         (workspace_id, session_id, subject_id, channel, contact, code_hash, expires_at, verified_at, verified_until, verification_level, attempt_count, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, NULL, NULL, 'pending', 0, ?)
       ON CONFLICT(workspace_id, session_id) DO UPDATE SET
         subject_id = excluded.subject_id,
         channel = excluded.channel,
         contact = excluded.contact,
         code_hash = excluded.code_hash,
         expires_at = excluded.expires_at,
         verified_at = NULL,
         verified_until = NULL,
         verification_level = 'pending',
         attempt_count = 0`
    ).bind(workspaceId, sessionId, subjectId, channel, contact, codeHash, expiresAt, now).run();
  } catch (d1Error: any) {
    console.error(`[OTP DEBUG] D1 Insert FAILED: ${d1Error?.message || d1Error}`, d1Error);
    throw d1Error;
  }

  const payload: Record<string, any> = {
    ok: true,
    delivery: channel,
    expires_in_ms: OTP_EXPIRY_MS,
    verification_level: "pending"
  };
  if (env.DEBUG) payload.debug_code = code;

  writeSessionVerificationCache(workspaceId, sessionId, {
    subject_id: subjectId,
    state: { level: "pending" }
  });

  if (env.MEMORY_CACHE) {
    try {
      const id = env.MEMORY_CACHE.idFromName("viz:" + workspaceId);
      const stub = env.MEMORY_CACHE.get(id);
      const p = stub.fetch("https://viz", {
        method: "POST",
        body: JSON.stringify({
          op: "broadcast",
          message: { type: "auth_req", channel, contact }
        })
      }).catch(e => console.error(`[Viz] AuthReq2 Broadcast Error (${workspaceId}):`, e));
      if (ctx && ctx.waitUntil) ctx.waitUntil(p);
    } catch (e) { /* ignore */ }
  }

  return json(payload);
}

async function verifyOtp(env: Env, workspaceId: string, body: any, ctx?: ExecutionContext) {
  const subjectId = await resolveSubjectId(env, workspaceId, body);
  if (!subjectId) return json({ error: "subject_id or subject_e164 required" }, 400);
  const sessionId = safeString(body.session_id ?? body.call_id ?? "", 64);
  if (!sessionId) return json({ error: "session_id required" }, 400);
  const code = safeString(body.code ?? body.otp ?? "", 16);
  if (!code) return json({ error: "code required" }, 400);
  const now = nowMs();
  const row = await env.D1_DB.prepare(
    `SELECT subject_id, code_hash, expires_at, attempt_count, verification_level, channel, contact
     FROM session_verifications
     WHERE workspace_id = ? AND session_id = ?`
  ).bind(workspaceId, sessionId).first<any>();
  if (!row || row.subject_id !== subjectId) {
    invalidateSessionVerificationCache(workspaceId, sessionId);
    return json({ error: "verification_not_started" }, 400);
  }
  if (row.verification_level === "locked") {
    invalidateSessionVerificationCache(workspaceId, sessionId);
    return json({ error: "too_many_attempts", verification_level: "locked" }, 429);
  }
  if (!row.code_hash || Number(row.expires_at) < now) {
    await env.D1_DB.prepare(
      "UPDATE session_verifications SET verification_level = 'expired', code_hash = NULL WHERE workspace_id = ? AND session_id = ?"
    ).bind(workspaceId, sessionId).run();
    invalidateSessionVerificationCache(workspaceId, sessionId);
    return json({ error: "code_expired", verification_level: "expired" }, 400);
  }
  const incomingHash = await hashVerificationCode(code, env);
  if (incomingHash !== row.code_hash) {
    const attempts = Number(row.attempt_count) + 1;
    const locked = attempts >= MAX_OTP_ATTEMPTS;
    await env.D1_DB.prepare(
      "UPDATE session_verifications SET attempt_count = ?, verification_level = ? WHERE workspace_id = ? AND session_id = ?"
    ).bind(attempts, locked ? "locked" : "pending", workspaceId, sessionId).run();
    invalidateSessionVerificationCache(workspaceId, sessionId);

    if (env.MEMORY_CACHE) {
      try {
        const id = env.MEMORY_CACHE.idFromName("viz:" + workspaceId);
        const stub = env.MEMORY_CACHE.get(id);
        const p = stub.fetch("https://viz", {
          method: "POST",
          body: JSON.stringify({
            op: "broadcast",
            message: { type: "auth_fail", reason: locked ? "locked" : "invalid" }
          })
        }).catch(e => console.error(`[Viz] AuthFail Broadcast Error (${workspaceId}):`, e));
        if (ctx && ctx.waitUntil) ctx.waitUntil(p);
      } catch (e) { /* ignore */ }
    }

    return json({ error: locked ? "too_many_attempts" : "invalid_code", verification_level: locked ? "locked" : "pending" }, 400);
  }

  const verifiedUntil = now + VERIFIED_SESSION_TTL_MS;
  await env.D1_DB.prepare(
    `UPDATE session_verifications
        SET code_hash = NULL,
            verification_level = 'verified',
            verified_at = ?,
            verified_until = ?,
            expires_at = ?,
            attempt_count = 0
      WHERE workspace_id = ? AND session_id = ?`
  ).bind(now, verifiedUntil, now, workspaceId, sessionId).run();

  if (row.channel && row.contact) {
    const aliasSubjectId = await deriveContactSubjectId(env, workspaceId, row.channel, row.contact);
    if (aliasSubjectId) await linkSubjectIds(env, workspaceId, subjectId, aliasSubjectId);
  }

  const state: VerificationState = { level: "verified", verified_until: verifiedUntil };
  writeSessionVerificationCache(workspaceId, sessionId, { subject_id: subjectId, state });

  if (env.MEMORY_CACHE) {
    try {
      const id = env.MEMORY_CACHE.idFromName("viz:" + workspaceId);
      const stub = env.MEMORY_CACHE.get(id);
      const p = stub.fetch("https://viz", {
        method: "POST",
        body: JSON.stringify({
          op: "broadcast",
          message: { type: "auth_verify", contact: row.contact }
        })
      }).catch(e => console.error(`[Viz] AuthVerify Broadcast Error (${workspaceId}):`, e));
      if (ctx && ctx.waitUntil) ctx.waitUntil(p);
    } catch (e) { /* ignore */ }
  }

  // Auto-bootstrap to return unlocked facts immediately
  const bootstrapRes = await bootstrap(env, workspaceId, { subject_id: subjectId, session_id: sessionId });
  const memoryData = bootstrapRes.ok ? await bootstrapRes.json() : {};

  return json({
    ok: true,
    verification_level: "verified",
    verified_until: verifiedUntil,
    memory: memoryData // Return fresh memory context
  });
}
async function getSessionVerification(
  env: Env,
  workspaceId: string,
  subjectId: string,
  sessionId: string
): Promise<VerificationState> {
  if (!sessionId) return { level: "none" };
  const cached = readSessionVerificationCache(workspaceId, sessionId);
  if (cached && cached.subject_id === subjectId) {
    return cached.state;
  }
  try {
    const row = await env.D1_DB.prepare(
      `SELECT subject_id, verification_level, expires_at, verified_until
       FROM session_verifications
       WHERE workspace_id = ? AND session_id = ?`
    ).bind(workspaceId, sessionId).first<any>();
    if (!row) {
      writeSessionVerificationCache(workspaceId, sessionId, {
        subject_id: subjectId,
        state: { level: "none" }
      });
      return { level: "none" };
    }
    if (row.subject_id !== subjectId) {
      writeSessionVerificationCache(workspaceId, sessionId, {
        subject_id: row.subject_id || "",
        state: { level: "none" }
      });
      return { level: "none" };
    }
    const now = nowMs();
    const level: VerificationState["level"] = (row.verification_level as any) || "pending";
    const verifiedUntil = Number(row.verified_until) || null;
    const expiresAt = Number(row.expires_at) || 0;
    if (level === "verified" && verifiedUntil && verifiedUntil > now) {
      const state: VerificationState = { level: "verified", verified_until: verifiedUntil };
      writeSessionVerificationCache(workspaceId, sessionId, { subject_id: subjectId, state });
      return state;
    }
    if (level === "verified" && verifiedUntil && verifiedUntil <= now) {
      await env.D1_DB.prepare(
        "UPDATE session_verifications SET verification_level = 'expired', code_hash = NULL WHERE workspace_id = ? AND session_id = ?"
      ).bind(workspaceId, sessionId).run();
      const state: VerificationState = { level: "expired" };
      writeSessionVerificationCache(workspaceId, sessionId, { subject_id: subjectId, state });
      return state;
    }
    if (expiresAt && expiresAt <= now) {
      if (level !== "expired") {
        await env.D1_DB.prepare(
          "UPDATE session_verifications SET verification_level = 'expired', code_hash = NULL WHERE workspace_id = ? AND session_id = ?"
        ).bind(workspaceId, sessionId).run();
      }
      const state: VerificationState = { level: "expired" };
      writeSessionVerificationCache(workspaceId, sessionId, { subject_id: subjectId, state });
      return state;
    }
    const state: VerificationState = { level };
    writeSessionVerificationCache(workspaceId, sessionId, { subject_id: subjectId, state });
    return state;
  } catch (err: any) {
    console.log("verification_lookup_error", err?.message || err);
    return { level: "none" };
  }
}

type BootstrapCachePayload = {
  write_ack: boolean;
  profile_facts: any[];
  recent_summaries: any[];
  facts: any[];
  agent_hints: Json;
  verification_level?: string;
};

type QueryCachePayload = {
  facts: any[];
  snippets: any[];
  citations: any[];
  verification_level?: string;
  protected_facts_available?: boolean;
  latency_hint?: {
    duration_ms: number;
    filler_threshold_ms: number;
    needs_filler: boolean;
  };
};

type MemorySelectResult = {
  results: any[];
  hasFactTypeColumn: boolean;
};

type CacheEntry<T> = {
  payload: T;
  cachedAt: number;
};

type CacheBucket = Record<string, CacheEntry<BootstrapCachePayload>>;

const CACHE_TTL_MS = 30 * 1000;
const CACHE_STORAGE_KEY = "entries";
const LOCAL_BOOTSTRAP_CACHE_TTL_MS = 30 * 1000;
const LOCAL_QUERY_CACHE_TTL_MS = 30 * 1000;
const SESSION_CACHE_TTL_MS = 30 * 1000;

const localBootstrapCache = new Map<string, Map<string, CacheEntry<BootstrapCachePayload>>>();
const localQueryCache = new Map<string, CacheEntry<QueryCachePayload>>();
const localQuerySubjectIndex = new Map<string, Set<string>>();
const sessionIdentityCache = new Map<string, CacheEntry<SessionIdentityCachePayload>>();
const sessionContextCache = new Map<string, CacheEntry<SessionContextCachePayload>>();
const sessionVerificationCache = new Map<string, CacheEntry<SessionVerificationCachePayload>>();
const sessionBootstrapCache = new Map<string, CacheEntry<SessionBootstrapCachePayload>>();

type SessionIdentityCachePayload = {
  channel_mode: string | null;
  subject_e164: string | null;
  email: string | null;
  subject_id: string | null;
  metadata: Json | null;
  updated_at: number | null;
};

type SessionContextCachePayload = {
  channel_mode: string | null;
  verified_subject: string | null;
  handoff_reason: string | null;
};

type SessionVerificationCachePayload = {
  subject_id: string;
  state: VerificationState;
};

type SessionBootstrapCachePayload = {
  subject_id: string;
  verification_level: string;
  payload: BootstrapCachePayload;
};

function sessionCacheKey(workspaceId: string, sessionId: string) {
  return `${workspaceId}::${sessionId}`;
}

function readSessionIdentityCache(workspaceId: string, sessionId: string) {
  const key = sessionCacheKey(workspaceId, sessionId);
  const entry = sessionIdentityCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.cachedAt > SESSION_CACHE_TTL_MS) {
    sessionIdentityCache.delete(key);
    return null;
  }
  return entry.payload;
}

function writeSessionIdentityCache(
  workspaceId: string,
  sessionId: string,
  payload: SessionIdentityCachePayload
) {
  const key = sessionCacheKey(workspaceId, sessionId);
  sessionIdentityCache.set(key, { payload, cachedAt: Date.now() });
}

function readSessionContextCache(workspaceId: string, sessionId: string) {
  const key = sessionCacheKey(workspaceId, sessionId);
  const entry = sessionContextCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.cachedAt > SESSION_CACHE_TTL_MS) {
    sessionContextCache.delete(key);
    return null;
  }
  return entry.payload;
}

function writeSessionContextCache(
  workspaceId: string,
  sessionId: string,
  payload: SessionContextCachePayload
) {
  const key = sessionCacheKey(workspaceId, sessionId);
  sessionContextCache.set(key, { payload, cachedAt: Date.now() });
}

function readSessionVerificationCache(workspaceId: string, sessionId: string) {
  const key = sessionCacheKey(workspaceId, sessionId);
  const entry = sessionVerificationCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.cachedAt > SESSION_CACHE_TTL_MS) {
    sessionVerificationCache.delete(key);
    return null;
  }
  return entry.payload;
}

function writeSessionVerificationCache(
  workspaceId: string,
  sessionId: string,
  payload: SessionVerificationCachePayload
) {
  const key = sessionCacheKey(workspaceId, sessionId);
  sessionVerificationCache.set(key, { payload, cachedAt: Date.now() });
}

function invalidateSessionVerificationCache(workspaceId: string, sessionId: string) {
  const key = sessionCacheKey(workspaceId, sessionId);
  sessionVerificationCache.delete(key);
}

function readSessionBootstrapCache(workspaceId: string, sessionId: string) {
  const key = sessionCacheKey(workspaceId, sessionId);
  const entry = sessionBootstrapCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.cachedAt > SESSION_CACHE_TTL_MS) {
    sessionBootstrapCache.delete(key);
    return null;
  }
  return entry.payload;
}

function writeSessionBootstrapCache(
  workspaceId: string,
  sessionId: string,
  payload: SessionBootstrapCachePayload
) {
  const key = sessionCacheKey(workspaceId, sessionId);
  sessionBootstrapCache.set(key, { payload, cachedAt: Date.now() });
}

function invalidateSessionBootstrapCache(workspaceId: string, sessionId: string) {
  const key = sessionCacheKey(workspaceId, sessionId);
  sessionBootstrapCache.delete(key);
}

function extractPreferredNameFromFacts(facts: any[]): string | null {
  if (!Array.isArray(facts)) return null;
  for (const entry of facts) {
    const text = safeString(entry?.fact ?? "", 200);
    if (!text) continue;
    const match =
      text.match(/(?:caller|preferred) name:\s*(.+)$/i) ||
      text.match(/name:\s*(.+)$/i);
    if (match && match[1]) {
      const value = match[1].trim();
      if (value) return truncate(value, 40);
    }
  }
  return null;
}

function extractConversationHint(summaries: any[]): string | null {
  if (!Array.isArray(summaries) || !summaries.length) return null;
  for (const entry of summaries) {
    const summary = safeString(entry?.summary ?? "", 500);
    if (!summary) continue;
    const normalized = summary.replace(/\s+/g, " ").trim();
    if (normalized) return truncate(normalized, 160);
  }
  return null;
}

function truncate(value: string, max: number) {
  if (value.length <= max) return value;
  return value.slice(0, max - 1).trimEnd() + "…";
}

async function seedSessionIdentity(env: Env, workspaceId: string, sessionId: string, subjectId: string) {
  const now = nowMs();
  try {
    await env.D1_DB.prepare(
      `INSERT INTO session_identity (workspace_id, session_id, subject_id, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(workspace_id, session_id) DO UPDATE SET
         subject_id = excluded.subject_id,
         updated_at = excluded.updated_at
       WHERE session_identity.subject_id IS NULL OR session_identity.subject_id = ''`
    ).bind(workspaceId, sessionId, subjectId, now, now).run();

    // Update Cache
    const existing = readSessionIdentityCache(workspaceId, sessionId);
    writeSessionIdentityCache(workspaceId, sessionId, {
      channel_mode: existing?.channel_mode ?? "chat",
      subject_e164: existing?.subject_e164 ?? null,
      email: existing?.email ?? null,
      subject_id: subjectId,
      metadata: existing?.metadata ?? null,
      updated_at: now
    });
  } catch (err: any) {
    console.log("seed_session_identity_error", err?.message || err);
  }
}

async function fetchSessionIdentityData(env: Env, workspaceId: string, sessionId: string) {
  const cached = readSessionIdentityCache(workspaceId, sessionId);
  if (cached) {
    return {
      found: true,
      session_id: sessionId,
      channel_mode: normalizeChannelMode(cached.channel_mode) || "chat",
      subject_id: cached.subject_id,
      subject_e164: cached.subject_e164,
      email: cached.email,
      metadata: cached.metadata,
      updated_at: cached.updated_at
    };
  }

  const row = await env.D1_DB
    .prepare(
      `SELECT channel_mode, subject_e164, email, subject_id, metadata, updated_at
       FROM session_identity
       WHERE workspace_id = ? AND session_id = ?`
    )
    .bind(workspaceId, sessionId)
    .first<{
      channel_mode: string | null;
      subject_e164: string | null;
      email: string | null;
      subject_id: string | null;
      metadata: string | null;
      updated_at: number | null;
    }>();

  if (!row) return { found: false, session_id: sessionId };

  let metadata: Json | null = null;
  if (row.metadata) {
    try {
      metadata = JSON.parse(row.metadata);
    } catch (_) {
      metadata = null;
    }
  }

  const payload = {
    found: true,
    session_id: sessionId,
    channel_mode: normalizeChannelMode(row.channel_mode) || "chat",
    subject_id: row.subject_id,
    subject_e164: row.subject_e164,
    email: row.email,
    metadata,
    updated_at: row.updated_at
  };

  writeSessionIdentityCache(workspaceId, sessionId, {
    channel_mode: row.channel_mode,
    subject_e164: row.subject_e164,
    email: row.email,
    subject_id: row.subject_id,
    metadata,
    updated_at: row.updated_at
  });

  return payload;
}

function shouldUseDoCache(env: Env) {
  return Boolean(env.MEMORY_CACHE) && String(env.USE_DO_CACHE || "").toLowerCase() === "true";
}

function buildCacheEntryKey(agentId: string | null, query: string, verificationLevel: string) {
  const agentPart = agentId && agentId.trim().length ? agentId : "any";
  const qPart = query && query.length ? query : "*";
  const levelPart = verificationLevel || "none";
  return `${agentPart}::${qPart}::${levelPart}`;
}

function cacheSubjectKey(workspaceId: string, subjectId: string) {
  return `${workspaceId}:${subjectId}`;
}

function getCacheStub(env: Env, workspaceId: string, subjectId: string) {
  if (!env.MEMORY_CACHE) throw new Error("MEMORY_CACHE binding missing");
  const id = env.MEMORY_CACHE.idFromName(cacheSubjectKey(workspaceId, subjectId));
  return env.MEMORY_CACHE.get(id);
}

function readLocalBootstrapCache(
  workspaceId: string,
  subjectId: string,
  entryKey: string
): BootstrapCachePayload | null {
  if (!entryKey) return null;
  const subjectKey = cacheSubjectKey(workspaceId, subjectId);
  const bucket = localBootstrapCache.get(subjectKey);
  if (!bucket) return null;
  const entry = bucket.get(entryKey);
  if (!entry) return null;
  if (Date.now() - entry.cachedAt > LOCAL_BOOTSTRAP_CACHE_TTL_MS) {
    bucket.delete(entryKey);
    if (!bucket.size) localBootstrapCache.delete(subjectKey);
    return null;
  }
  return entry.payload;
}

function writeLocalBootstrapCache(
  workspaceId: string,
  subjectId: string,
  entryKey: string,
  payload: BootstrapCachePayload
) {
  if (!entryKey) return;
  const subjectKey = cacheSubjectKey(workspaceId, subjectId);
  let bucket = localBootstrapCache.get(subjectKey);
  if (!bucket) {
    bucket = new Map();
    localBootstrapCache.set(subjectKey, bucket);
  }
  bucket.set(entryKey, { payload, cachedAt: Date.now() });
}

function invalidateLocalBootstrapCache(workspaceId: string, subjectId: string) {
  const subjectKey = cacheSubjectKey(workspaceId, subjectId);
  localBootstrapCache.delete(subjectKey);
}

function buildQueryCacheEntryKey(
  workspaceId: string,
  subjectId: string,
  agentId: string | null,
  query: string,
  topK: number,
  verificationLevel: string
) {
  const subjectKey = cacheSubjectKey(workspaceId, subjectId);
  const agentPart = agentId && agentId.trim().length ? agentId : "any";
  const queryPart = query && query.length ? query : "*";
  const levelPart = verificationLevel || "none";
  return `${subjectKey}::${agentPart}::${queryPart}::${topK}::${levelPart}`;
}

function readLocalQueryCache(
  workspaceId: string,
  subjectId: string,
  cacheKey: string
): QueryCachePayload | null {
  if (!cacheKey) return null;
  const subjectKey = cacheSubjectKey(workspaceId, subjectId);
  const entry = localQueryCache.get(cacheKey);
  if (!entry) return null;
  if (Date.now() - entry.cachedAt > LOCAL_QUERY_CACHE_TTL_MS) {
    localQueryCache.delete(cacheKey);
    const index = localQuerySubjectIndex.get(subjectKey);
    if (index) {
      index.delete(cacheKey);
      if (!index.size) localQuerySubjectIndex.delete(subjectKey);
    }
    return null;
  }
  return entry.payload;
}

function writeLocalQueryCache(
  workspaceId: string,
  subjectId: string,
  cacheKey: string,
  payload: QueryCachePayload
) {
  if (!cacheKey) return;
  const subjectKey = cacheSubjectKey(workspaceId, subjectId);
  localQueryCache.set(cacheKey, { payload, cachedAt: Date.now() });
  let index = localQuerySubjectIndex.get(subjectKey);
  if (!index) {
    index = new Set();
    localQuerySubjectIndex.set(subjectKey, index);
  }
  index.add(cacheKey);
}

function invalidateLocalQueryCache(workspaceId: string, subjectId: string) {
  const subjectKey = cacheSubjectKey(workspaceId, subjectId);
  const keys = localQuerySubjectIndex.get(subjectKey);
  if (!keys) return;
  for (const key of keys) {
    localQueryCache.delete(key);
  }
  localQuerySubjectIndex.delete(subjectKey);
}

async function readBootstrapCache(
  env: Env,
  workspaceId: string,
  subjectId: string,
  entryKey: string
): Promise<BootstrapCachePayload | null> {
  if (!shouldUseDoCache(env) || !entryKey) return null;
  try {
    const stub = getCacheStub(env, workspaceId, subjectId);
    const res = await stub.fetch("https://cache", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ op: "get", key: entryKey })
    });
    if (!res.ok) return null;
    const data = await res.json<any>();
    if (data?.hit && data.payload) return data.payload as BootstrapCachePayload;
  } catch (err: any) {
    console.log("BOOT cache_get_error", err?.message || err);
  }
  return null;
}

async function writeBootstrapCache(
  env: Env,
  workspaceId: string,
  subjectId: string,
  entryKey: string,
  payload: BootstrapCachePayload
) {
  if (!shouldUseDoCache(env) || !entryKey) return;
  try {
    const stub = getCacheStub(env, workspaceId, subjectId);
    await stub.fetch("https://cache", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ op: "put", key: entryKey, payload })
    });
  } catch (err: any) {
    console.log("BOOT cache_put_error", err?.message || err);
  }
}

async function invalidateBootstrapCache(env: Env, workspaceId: string, subjectId: string) {
  invalidateLocalBootstrapCache(workspaceId, subjectId);
  invalidateLocalQueryCache(workspaceId, subjectId);
  if (subjectId) {
    sessionBootstrapCache.forEach((entry, key) => {
      if (entry.payload.subject_id === subjectId && key.startsWith(`${workspaceId}::`)) {
        sessionBootstrapCache.delete(key);
      }
    });
  }
  if (!env.MEMORY_CACHE) return;
  try {
    const stub = getCacheStub(env, workspaceId, subjectId);
    await stub.fetch("https://cache", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ op: "invalidate" })
    });
  } catch (err: any) {
    console.log("BOOT cache_invalidate_error", err?.message || err);
  }
}

async function migrateAliasData(env: Env, workspaceId: string, canonicalId: string, aliasId: string) {
  if (!workspaceId || !canonicalId || !aliasId || canonicalId === aliasId) return;
  const statements = [
    {
      sql: "UPDATE memories SET subject_id = ? WHERE workspace_id = ? AND subject_id = ?",
      args: [canonicalId, workspaceId, aliasId]
    },
    {
      sql: "UPDATE call_summaries SET subject_id = ? WHERE workspace_id = ? AND subject_id = ?",
      args: [canonicalId, workspaceId, aliasId]
    },
    {
      sql: "UPDATE calls SET subject_id = ? WHERE workspace_id = ? AND subject_id = ?",
      args: [canonicalId, workspaceId, aliasId]
    },
    {
      sql: "UPDATE session_verifications SET subject_id = ? WHERE workspace_id = ? AND subject_id = ?",
      args: [canonicalId, workspaceId, aliasId]
    }
  ];
  for (const { sql, args } of statements) {
    try {
      await env.D1_DB.prepare(sql).bind(...args).run();
    } catch (err: any) {
      if (!String(err?.message || "").includes("no such table")) {
        console.log("alias_migrate_error", sql, err?.message || err);
      }
    }
  }
  await invalidateBootstrapCache(env, workspaceId, canonicalId);
  await invalidateBootstrapCache(env, workspaceId, aliasId);
}

function pickCanonicalSubjectId(a: string, b: string) {
  const score = (value: string) => {
    if (!value) return 99;
    if (value.includes("@")) return 0;       // Email: Best
    if (value.startsWith("hash:")) return 1; // Phone Hash: Good
    if (value.startsWith("v-")) return 10;   // Visitor ID: Weak (Ephemeral)
    return 5;                                // Other: Medium
  };
  const scoreA = score(a);
  const scoreB = score(b);
  if (scoreA < scoreB) return a;
  if (scoreB < scoreA) return b;
  return a < b ? a : b;
}

async function linkSubjectIds(env: Env, workspaceId: string, idA?: string | null, idB?: string | null): Promise<string> {
  if (!workspaceId || !idA || !idB || idA === idB || subjectLinkTableSupported === false) {
    return idA || idB || "";
  }
  const [canonicalA, canonicalB] = await Promise.all([
    getCanonicalSubjectId(env, workspaceId, idA),
    getCanonicalSubjectId(env, workspaceId, idB)
  ]);
  if (!canonicalA) return canonicalB || "";
  if (!canonicalB) return canonicalA;
  if (canonicalA === canonicalB) return canonicalA;

  const primary = pickCanonicalSubjectId(canonicalA, canonicalB);
  const alias = primary === canonicalA ? canonicalB : canonicalA;
  try {
    await env.D1_DB.prepare(
      `INSERT INTO subject_links (workspace_id, primary_subject_id, alias_subject_id, created_at)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(workspace_id, alias_subject_id)
       DO UPDATE SET primary_subject_id = excluded.primary_subject_id`
    ).bind(workspaceId, primary, alias, nowMs()).run();
    await migrateAliasData(env, workspaceId, primary, alias);
    if (subjectLinkTableSupported === null) subjectLinkTableSupported = true;
  } catch (err: any) {
    if (isMissingSubjectLinksTable(err)) {
      subjectLinkTableSupported = false;
      return primary;
    }
    console.log("subject_link_upsert_error", err?.message || err);
  }
  return primary;
}

async function deriveContactSubjectId(
  env: Env,
  workspaceId: string,
  channel: string | null,
  contact: string | null
): Promise<string | null> {
  if (!channel || !contact) return null;
  if (channel === "email") return contact.trim().toLowerCase();
  if (channel === "sms") return phoneSubjectId(env, workspaceId, contact);
  return null;
}

export class MemoryCacheDO {
  private state: DurableObjectState;

  constructor(state: DurableObjectState) {
    this.state = state;
  }

  async fetch(request: Request): Promise<Response> {
    try {
      const upgradeHeader = request.headers.get("Upgrade");
      if (upgradeHeader?.toLowerCase() === "websocket") {
        const pair = new WebSocketPair();
        const client = pair[0];
        const server = pair[1];

        // Use Hibernation API to allow sessions to survive DO restarts
        this.state.acceptWebSocket(server);
        console.log(`[MemoryCacheDO] WebSocket Accepted (Hibernation Mode).`);

        return new Response(null, { status: 101, webSocket: client });
      }

      const bodyText = await request.text();
      const body = bodyText ? JSON.parse(bodyText) : {};
      const op: string = body.op || "";
      const key: string = body.key || "";

      if (op === "broadcast") {
        const msg = JSON.stringify(body.message || {});
        const sockets = this.state.getWebSockets();
        let count = 0;
        for (const socket of sockets) {
          try {
            socket.send(msg);
            count++;
          } catch (err) {
            // Sockets are managed by hibernation API
          }
        }
        console.log(`[MemoryCacheDO] Broadcast op (count=${count}/${sockets.length})`);
        return json({ ok: true, count });
      }

      let bucket = (await this.state.storage.get<CacheBucket>(CACHE_STORAGE_KEY)) || {};

      if (op === "get") {
        if (!key || !bucket[key]) return json({ hit: false });
        const entry = bucket[key];
        if (Date.now() - entry.cachedAt > CACHE_TTL_MS) {
          delete bucket[key];
          await this.state.storage.put(CACHE_STORAGE_KEY, bucket);
          return json({ hit: false });
        }
        return json({ hit: true, payload: entry.payload });
      }

      if (op === "put") {
        if (!key || !body.payload) return json({ ok: false }, 400);
        bucket[key] = { payload: body.payload, cachedAt: Date.now() };
        await this.state.storage.put(CACHE_STORAGE_KEY, bucket);
        return json({ ok: true });
      }

      if (op === "invalidate") {
        if (key) {
          if (bucket[key]) {
            delete bucket[key];
            await this.state.storage.put(CACHE_STORAGE_KEY, bucket);
          }
        } else if (Object.keys(bucket).length) {
          await this.state.storage.delete(CACHE_STORAGE_KEY);
          bucket = {};
        }
        return json({ ok: true });
      }

      return json({ error: "unknown op" }, 400);
    } catch (err: any) {
      console.log("[MemoryCacheDO] Error:", err.message, err.stack);
      return json({ error: err?.message || "cache error" }, 500);
    }
  }

  // Mandatory handlers for Hibernation API
  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer) {
    // No incoming messages expected
  }

  async webSocketClose(ws: WebSocket, code: number, reason: string, wasClean: boolean) {
    console.log(`[MemoryCacheDO] WebSocket Closed: ${code} ${reason}`);
  }

  async webSocketError(ws: WebSocket, error: any) {
    console.log(`[MemoryCacheDO] WebSocket Error: ${error}`);
  }
}

function validatePhoneInput(input: string) {
  const normalized = normalizeIdentityPhone(input);
  const valid = /^\+\d{10,15}$/.test(normalized);
  return {
    input,
    normalized: valid ? normalized : undefined,
    valid,
    reason: valid ? undefined : "Please provide the full number including area code (digits only)."
  };
}

function validateEmailInput(input: string) {
  const normalized = input.trim().toLowerCase();
  // v2.874: Disallow commas and enforce stricter characters
  const valid = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/.test(normalized);
  const suggestion = valid ? undefined : suggestEmailCorrection(normalized);
  return {
    input,
    normalized: valid ? normalized : undefined,
    valid,
    reason: valid ? undefined : "Provide a valid email like name@example.com (no commas or spaces).",
    suggestion
  };
}

function suggestEmailCorrection(normalized: string) {
  if (!normalized.includes("@")) return undefined;
  const [local, domain] = normalized.split("@");
  if (!domain) return undefined;
  const known = ["gmail.com", "hotmail.com", "outlook.com", "icloud.com", "yahoo.com", "ampere.io"];
  let best: { domain: string; score: number } | null = null;
  for (const candidate of known) {
    const score = levenshtein(domain, candidate);
    if (score <= 2 && (!best || score < best.score)) best = { domain: candidate, score };
  }
  if (best) return `${local}@${best.domain}`;
  return undefined;
}

function levenshtein(a: string, b: string) {
  const dp = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));
  for (let i = 0; i <= a.length; i++) dp[i][0] = i;
  for (let j = 0; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      if (a[i - 1] === b[j - 1]) dp[i][j] = dp[i - 1][j - 1];
      else dp[i][j] = Math.min(dp[i - 1][j - 1], dp[i - 1][j], dp[i][j - 1]) + 1;
    }
  }
  return dp[a.length][b.length];
}

function normalizeIdentityPhone(input: string) {
  const raw = (input || "").trim();
  if (!raw) return "";

  // v2.911: Exorcise Placeholder Identity.
  // ElevenLabs uses +10000000000 as a placeholder for web calls without a real caller ID.
  // We MUST treat this as empty/anonymous to force the agent to ask for a real number.
  if (raw === "+10000000000" || raw === "10000000000") return "";

  const digits = raw.replace(/\D/g, "");
  if (!digits || digits === "10000000000") return ""; // Extra safety for non-plus version

  const hasPlus = raw.startsWith("+");
  if (hasPlus) return "+" + digits;
  if (digits.length === 10) return "+1" + digits;
  if (digits.length >= 11 && digits.length <= 15) return "+" + digits;
  return "+" + digits;
}

async function getWorkspaceChannelConfig(env: Env, workspaceId: string): Promise<WorkspaceChannelConfig | null> {
  try {
    const row = await env.D1_DB
      .prepare(
        `SELECT twilio_account_sid, twilio_auth_token, twilio_from_number, sms_enabled, email_enabled
         FROM workspace_channels
         WHERE workspace_id = ?`
      )
      .bind(workspaceId)
      .first<WorkspaceChannelConfig>();
    return row ?? null;
  } catch (err: any) {
    if (!String(err?.message || "").includes("no such table")) {
      console.log("workspace_channel_lookup_error", err?.message || err);
    }
    return null;
  }
}

async function resolveTwilioConfig(env: Env, workspaceId: string) {
  const row = await getWorkspaceChannelConfig(env, workspaceId);
  const accountSid = env.TWILIO_ACCOUNT_SID || row?.twilio_account_sid || "";
  const authToken = env.TWILIO_AUTH_TOKEN || row?.twilio_auth_token || "";
  const fromNumber = env.TWILIO_FROM_NUMBER || row?.twilio_from_number || "";
  // If env vars are present, allow SMS regardless of workspace toggle so the operator controls it centrally.
  const smsFlag = row ? Number(row.sms_enabled ?? 0) : null;
  const smsAllowed = env.TWILIO_ACCOUNT_SID && env.TWILIO_FROM_NUMBER ? true : row ? smsFlag === 1 : true;
  if (!smsAllowed) return null;
  if (!accountSid || !authToken || !fromNumber) return null;
  return { accountSid, authToken, fromNumber };
}

async function sendSmsOtp(env: Env, workspaceId: string, to: string, code: string): Promise<SendResult> {
  const config = await resolveTwilioConfig(env, workspaceId);
  if (!config) {
    console.log(`[OTP] SMS Config Missing. EnvVars=${!!env.TWILIO_ACCOUNT_SID}/${!!env.TWILIO_FROM_NUMBER}`);
    return { ok: false, error: "sms_not_configured", status: 503 };
  }
  const params = new URLSearchParams({
    To: to,
    From: config.fromNumber,
    Body: `Your Ampere verification code is ${code}. It expires in 10 minutes.`
  });
  const authHeader = "Basic " + btoa(`${config.accountSid}:${config.authToken}`);
  try {
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${config.accountSid}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: authHeader,
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: params.toString()
      }
    );
    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      console.log("twilio_sms_error", response.status, errorText);
      return { ok: false, error: "sms_send_failed", status: 502 };
    }
    return { ok: true };
  } catch (err: any) {
    console.log("twilio_sms_exception", err?.message || err);
    return { ok: false, error: "sms_send_failed", status: 502 };
  }
}

async function resolveEmailConfig(env: Env, workspaceId: string) {
  const row = await getWorkspaceChannelConfig(env, workspaceId);
  const emailFlag = row ? Number(row.email_enabled ?? 0) : null;
  const emailAllowed = row ? emailFlag === 1 : true;
  const apiKey = env.SMTP2GO_API_KEY || "";
  const fromEmail = env.SMTP2GO_FROM_EMAIL || "";
  if (!emailAllowed) return null;
  if (!apiKey || !fromEmail) return null;
  return { apiKey, fromEmail };
}

async function sendEmailOtp(env: Env, workspaceId: string, to: string, code: string): Promise<SendResult> {
  const config = await resolveEmailConfig(env, workspaceId);
  if (!config) {
    console.log(`[OTP] Email Config Missing. EnvVars=${!!env.SMTP2GO_API_KEY}/${!!env.SMTP2GO_FROM_EMAIL}`);
    return { ok: false, error: "email_not_configured", status: 503 };
  }
  console.log(`[OTP] Sending Email to=${to}`);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
    return { ok: false, error: "invalid_email", status: 400 };
  }
  const subject = "Your Ampere verification code";
  const textBody = `Your Ampere verification code is ${code}. It expires in 10 minutes.`;
  const payload = {
    api_key: config.apiKey,
    sender: config.fromEmail,
    to: [to],
    subject,
    text_body: textBody,
    html_body: `<p>${textBody}</p>`
  };
  try {
    const response = await fetch("https://api.smtp2go.com/v3/email/send", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (!response.ok) {
      const errText = await response.text().catch(() => "");
      console.log("smtp2go_error", response.status, errText);
      return { ok: false, error: "email_send_failed", status: 502 };
    }
    const result = await response.json<any>().catch(() => ({}));
    console.log("[OTP] SMTP2Go Result:", JSON.stringify(result));
    if (result?.data?.succeeded === 1 || result?.data?.messages?.[0]?.status === "success") {
      return { ok: true };
    }
    return { ok: false, error: "email_send_failed", status: 502 };
  } catch (err: any) {
    console.log("smtp2go_exception", err?.message || err);
    return { ok: false, error: "email_send_failed", status: 502 };
  }
}

const DEFAULT_FACT_POLICIES: FactPolicy[] = [
  { fact_type: "contact_phone", enabled: true, max_per_subject: 3, keywords: ["phone", "number", "call back"], regex: null },
  { fact_type: "contact_email", enabled: true, max_per_subject: 3, keywords: ["email", "inbox", "send over"], regex: null },
  { fact_type: "website", enabled: true, max_per_subject: 3, keywords: ["website", "site", "url"], regex: null },
  { fact_type: "conversation_recap", enabled: true, max_per_subject: 5, keywords: ["talked", "discussed", "asked about", "call about", "recap"], regex: null },
  { fact_type: "kb_summary", enabled: true, max_per_subject: 5, keywords: ["feature", "pricing", "plan", "demo outline", "knowledge base"], regex: null },
  { fact_type: "business_focus", enabled: true, max_per_subject: 5, keywords: ["business", "company", "niche", "industry"], regex: null },
  { fact_type: "scheduling_preference", enabled: true, max_per_subject: 5, keywords: ["prefer", "available", "schedule", "morning", "afternoon"], regex: null },
  { fact_type: "integration_interest", enabled: true, max_per_subject: 5, keywords: ["integration", "crm", "twilio", "sip", "api"], regex: null },
  { fact_type: "budget", enabled: true, max_per_subject: 3, keywords: ["budget", "price", "cost", "spend", "$"], regex: null },
  { fact_type: "family_detail", enabled: true, max_per_subject: 3, keywords: ["wife", "husband", "spouse", "partner", "daughter", "son", "kid", "family"], regex: null },
  { fact_type: "pet_details", enabled: true, max_per_subject: 2, keywords: ["dog", "cat", "pet"], regex: null },
  { fact_type: "hobby_detail", enabled: true, max_per_subject: 3, keywords: ["hobby", "enjoy", "love to", "ride", "golf", "ski", "motorcycle"], regex: null },
  { fact_type: "vehicle_detail", enabled: true, max_per_subject: 2, keywords: ["car", "truck", "vehicle", "motorcycle", "bike"], regex: null },
  { fact_type: "address_detail", enabled: true, max_per_subject: 2, keywords: ["address", "street", "road", "avenue", "suite"], regex: null },
  { fact_type: "payment_history", enabled: true, max_per_subject: 3, keywords: ["invoice", "payment", "charged", "card", "paid"], regex: null },
  { fact_type: "general", enabled: true, max_per_subject: 15, keywords: [], regex: null }
];

async function getWorkspaceFactPolicies(env: Env, workspaceId: string): Promise<FactPolicyMap> {
  const defaults = defaultFactPolicyMap();
  try {
    const rows = await env.D1_DB
      .prepare(
        `SELECT fact_type, enabled, max_per_subject, config_json
         FROM workspace_fact_policies
         WHERE workspace_id = ?`
      )
      .bind(workspaceId)
      .all();
    const list = rows.results ?? [];
    if (!list.length) return defaults;
    const merged = { ...defaults } as FactPolicyMap;
    for (const row of list as any[]) {
      const factType = normalizeFactType(row.fact_type) || "general";
      const config = parsePolicyConfig(row.config_json);
      merged[factType] = {
        fact_type: factType,
        enabled: row.enabled !== 0,
        max_per_subject: Number.isFinite(row.max_per_subject) ? Number(row.max_per_subject) : (defaults[factType]?.max_per_subject ?? 10),
        keywords: config.keywords?.length ? config.keywords : defaults[factType]?.keywords ?? [],
        regex: typeof config.regex === "string" ? config.regex : defaults[factType]?.regex ?? null
      };
    }
    return merged;
  } catch (err: any) {
    if ((err?.message || "").includes("no such table")) return defaults;
    console.log("FACT_POLICY fetch_error", err?.message || err);
    return defaults;
  }
}

function defaultFactPolicyMap(): FactPolicyMap {
  return DEFAULT_FACT_POLICIES.reduce((acc, policy) => {
    acc[policy.fact_type] = { ...policy };
    return acc;
  }, {} as FactPolicyMap);
}

function parsePolicyConfig(raw: any): { keywords?: string[]; regex?: string } {
  if (!raw || typeof raw !== "string") return {};
  try {
    const parsed = JSON.parse(raw);
    const keywords = Array.isArray(parsed.keywords)
      ? parsed.keywords.map((k: any) => String(k || "").toLowerCase()).filter(Boolean)
      : undefined;
    const regex = typeof parsed.regex === "string" ? parsed.regex : undefined;
    return { keywords, regex };
  } catch (err) {
    return {};
  }
}

function normalizeFactType(raw?: string | null) {
  const s = (raw || "").trim().toLowerCase();
  if (!s) return null;
  return s.replace(/[^a-z0-9_]+/g, "_");
}

function isFactTypeAllowed(factType: string | null, policies: FactPolicyMap) {
  const key = factType || "general";
  const policy = policies[key];
  if (!policy) return true;
  return policy.enabled;
}

async function persistFacts(
  env: Env,
  workspaceId: string,
  subjectId: string,
  agentId: string | null,
  facts: IncomingFact[],
  policies: FactPolicyMap,
  ts: number
): Promise<number> {
  if (!facts.length) return 0;
  let hasFactTypeColumn = await ensureFactTypeColumn(env);
  let wrote = 0;
  const seen = new Set<string>();
  const contactAliases: string[] = []; // v3.176: Collect contact identifiers to auto-link
  for (const f of facts) {
    let factText = safeString(f.fact, 256).trim();
    if (!factText) continue;
    const key = factText.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    const confidence = Number.isFinite(f.confidence) ? Number(f.confidence) : 0.8;
    const inferredType = normalizeFactType(f.fact_type) || inferFactType(factText);
    if (!isFactTypeAllowed(inferredType, policies)) continue;
    try {
      if (hasFactTypeColumn) {
        await env.D1_DB.prepare(
          "INSERT OR IGNORE INTO memories (subject_id, workspace_id, agent_id, fact, confidence, updated_at, fact_type) VALUES (?, ?, ?, ?, ?, ?, ?)"
        ).bind(subjectId, workspaceId, agentId, factText, confidence, ts, inferredType ?? "general").run();
      } else {
        await env.D1_DB.prepare(
          "INSERT OR IGNORE INTO memories (subject_id, workspace_id, agent_id, fact, confidence, updated_at) VALUES (?, ?, ?, ?, ?, ?)"
        ).bind(subjectId, workspaceId, agentId, factText, confidence, ts).run();
      }
    } catch (err: any) {
      if (hasFactTypeColumn && isFactTypeColumnError(err)) {
        disableFactTypeColumnSupport();
        hasFactTypeColumn = false;
        await env.D1_DB.prepare(
          "INSERT OR IGNORE INTO memories (subject_id, workspace_id, agent_id, fact, confidence, updated_at) VALUES (?, ?, ?, ?, ?, ?)"
        ).bind(subjectId, workspaceId, agentId, factText, confidence, ts).run();
      } else {
        throw err;
      }
    }
    wrote++;

    // v3.176: Collect email/phone from contact facts for auto-linking
    if (inferredType === "contact_email") {
      const emailMatch = factText.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi);
      if (emailMatch) {
        for (const email of emailMatch) contactAliases.push(email.toLowerCase());
      }
    }
    if (inferredType === "contact_phone") {
      const phoneMatch = factText.match(/\+?\d[\d\-\s]{9,}/);
      if (phoneMatch) {
        const normalized = normalizeIdentityPhone(phoneMatch[0]);
        if (normalized.length >= 11) contactAliases.push(normalized);
      }
    }
  }

  // v3.176: Auto-link extracted contact identifiers to the canonical subject.
  // This bridges the gap: emails/phones mentioned in calls become lookup keys
  // for future sessions, while facts remain gated behind OTP verification.
  if (contactAliases.length > 0 && subjectId) {
    for (const alias of [...new Set(contactAliases)]) {
      try {
        await linkSubjectIds(env, workspaceId, subjectId, alias);
        console.log(`[AutoLink] ${alias} → ${subjectId.substring(0, 12)}...`);
      } catch (e: any) {
        console.log(`[AutoLink] Failed: ${alias} → ${e?.message || e}`);
      }
    }
  }

  return wrote;
}

function deriveIncomingFacts(input: any[]): IncomingFact[] {
  const facts: IncomingFact[] = [];
  for (const raw of input) {
    if (typeof raw === "string") {
      facts.push({ fact: raw });
      continue;
    }
    if (raw && typeof raw.fact === "string") {
      const fact = safeString(raw.fact, 512);
      const confidence = Number.isFinite(raw.confidence) ? Number(raw.confidence) : undefined;
      const factType = typeof raw.fact_type === "string" ? raw.fact_type : undefined;
      facts.push({ fact, confidence, fact_type: factType });
    }
  }
  return facts;
}

function dedupeIncomingFacts(facts: IncomingFact[]): IncomingFact[] {
  const seen = new Set<string>();
  const deduped: IncomingFact[] = [];
  for (const fact of facts) {
    const key = fact.fact?.trim().toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    deduped.push(fact);
  }
  return deduped;
}

function summarizeTranscript(transcript: string) {
  const sentences = splitTranscriptSentences(transcript);
  if (!sentences.length) return safeString(transcript, 480);
  const summary = sentences.slice(0, 2).join(". ");
  return safeString(summary, 480);
}

async function processRichTranscriptIntelligence(env: Env, transcript: string) {
  if (!env.AI) return null;
  try {
    // v2.994: Stricter JSON prompt + "JSON ONLY" instruction + Markdown stripping
    const systemPrompt = `You are a strict data extraction system. Analyze the transcript and output ONLY valid JSON.
    Do not add conversational filler. Do not use Markdown code blocks.
    Schema:
    {
      "summary": "string (max 200 chars, concise briefing)",
      "sentiment": number (-1 to 1),
      "sentiment_label": "Positive" | "Neutral" | "Negative",
      "outcome": "Interested" | "Follow-up" | "Not-Interested" | "Other",
      "user_name": "string (First Name Last Name) or null",
      "user_contact_info": { "email": "string|null", "phone": "string|null" },
      "action_items": ["string"]
    }`;

    // Run AI Inference
    const response: any = await env.AI.run("@cf/meta/llama-3-8b-instruct", {
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Transcript:\n${transcript}` }
      ]
    });

    let rawText = "";

    // Handle various response shapes from Cloudflare AI
    if (typeof response === 'string') {
      rawText = response;
    } else if (typeof response === 'object') {
      if (typeof response.response === 'string') rawText = response.response;
      else if (Array.isArray(response.response)) rawText = response.response.join("");
      else rawText = JSON.stringify(response);
    }

    // Clean Markdown code blocks (```json ... ```)
    rawText = rawText.replace(/```json/g, "").replace(/```/g, "").trim();

    // Try parsing
    try {
      return JSON.parse(rawText);
    } catch (e) {
      console.warn("DEBUG: AI Intelligence returned non-JSON. Attempting Regex extraction...", rawText.substring(0, 100));
      // Fallback: Extract JSON object from text using Regex (find first { and last })
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          return JSON.parse(jsonMatch[0]);
        } catch (e2) {
          console.error("CRITICAL: Regex extracted invalid JSON.", e2);
        }
      }

      console.error("CRITICAL: Could not parse JSON from AI response. Returning safe default.", rawText);
      // Return safe default to avoid crashing the flow
      return {
        summary: "Analysis unavailable (JSON Parse Error)",
        sentiment: 0,
        sentiment_label: "Neutral",
        outcome: "Other",
        action_items: []
      };
    }

  } catch (err) {
    console.error("AI Intelligence Error:", err);
    return {
      summary: "Analysis failed (AI Error)",
      sentiment: 0,
      sentiment_label: "Neutral",
      outcome: "Other",
      action_items: []
    };
  }
}

function extractFactsFromTranscript(transcript: string, policies: FactPolicyMap): IncomingFact[] {
  const results: IncomingFact[] = [];
  const sentences = splitTranscriptSentences(transcript);
  const seen = new Set<string>();
  const pushFact = (fact: string, factType: string, confidence = 0.78) => {
    const text = safeString(fact, 256).trim();
    if (!text) return;
    const key = `${factType}::${text.toLowerCase()}`;
    if (seen.has(key)) return;
    seen.add(key);
    if (!isFactTypeAllowed(factType, policies)) return;
    results.push({ fact: text, fact_type: factType, confidence });
  };

  if (policies.contact_email?.enabled) {
    const emailMatches = transcript.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi) || [];
    for (const match of emailMatches) pushFact(match, "contact_email", 0.9);
  }

  if (policies.contact_phone?.enabled) {
    const phoneMatches = transcript.match(/\+?\d[\d\-()\s]{9,}/g) || [];
    for (const match of phoneMatches) {
      const normalized = normalizeIdentityPhone(match);
      if (normalized.length >= 11) pushFact(normalized, "contact_phone", 0.85);
    }
  }

  if (policies.website?.enabled) {
    const urlMatches = transcript.match(/https?:\/\/\S+|\b[a-z0-9.-]+\.(?:com|net|org|io|ai|co)\b/gi) || [];
    for (const match of urlMatches) pushFact(match, "website", 0.82);
  }

  if (policies.budget?.enabled) {
    const budgetMatches = transcript.match(/\$\s?\d[\d,]*/g) || [];
    for (const match of budgetMatches) pushFact(`Budget mentioned: ${match}`, "budget", 0.8);
  }

  // v3.175: Removed freeform keyword sentence-grabber. It stored raw transcript
  // sentences (including agent dialogue) as facts with wrong types, creating noise.
  // Structured regex extractions above (email, phone, URL, budget) remain.
  // Freeform fact extraction is handled by:
  //   1. Emily's real-time memory_upsert (LLM-curated, high quality)
  //   2. Workers AI processRichTranscriptIntelligence (post-call name/summary)

  return results.slice(0, 25);
}

function splitTranscriptSentences(text: string): string[] {
  return (text || "")
    .split(/(?:\.|\?|!|\n)+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function inferFactType(fact: string): string {
  const lower = fact.toLowerCase();
  if (/@/.test(fact)) return "contact_email";
  if (/\$\s?\d/.test(fact) || lower.includes("budget")) return "budget";
  if (/https?:\/\//i.test(fact) || /\b[a-z0-9.-]+\.(?:com|net|org|io|ai|co)\b/i.test(fact)) return "website";
  if (/\+?\d[\d\s\-()]{9,}/.test(fact) || lower.includes("phone")) return "contact_phone";
  if (lower.includes("discussed") || lower.includes("talked") || lower.includes("recap") || lower.includes("asked about"))
    return "conversation_recap";
  if (lower.includes("knowledge base") || lower.includes("kb summary") || lower.includes("feature rundown") || lower.includes("demo outline"))
    return "kb_summary";
  if (lower.includes("prefer") || lower.includes("available") || lower.includes("schedule")) return "scheduling_preference";
  if (lower.includes("integration") || lower.includes("crm") || lower.includes("twilio") || lower.includes("sip")) return "integration_interest";
  if (
    lower.includes("wife") ||
    lower.includes("husband") ||
    lower.includes("spouse") ||
    lower.includes("partner") ||
    lower.includes("daughter") ||
    lower.includes("son") ||
    lower.includes("kids") ||
    lower.includes("family")
  )
    return "family_detail";
  if (lower.includes("dog") || lower.includes("cat") || lower.includes("pet")) return "pet_details";
  if (lower.includes("hobby") || lower.includes("enjoy") || lower.includes("love to") || lower.includes("ride") || lower.includes("golf"))
    return "hobby_detail";
  if (lower.includes("car") || lower.includes("truck") || lower.includes("motorcycle") || lower.includes("vehicle") || lower.includes("bike"))
    return "vehicle_detail";
  if (lower.includes("address") || lower.includes("street") || lower.includes("road") || lower.includes("avenue") || lower.includes("suite"))
    return "address_detail";
  if (lower.includes("invoice") || lower.includes("payment") || lower.includes("charged") || lower.includes("card") || lower.includes("paid"))
    return "payment_history";
  if (lower.includes("business") || lower.includes("company") || lower.includes("industry") || lower.includes("niche")) return "business_focus";
  return "general";
}

const FACT_TYPE_SUPPORT_CACHE_KEY = "__memoryFactTypeColumnSupported";

async function ensureFactTypeColumn(env: Env): Promise<boolean> {
  const cached = (globalThis as any)[FACT_TYPE_SUPPORT_CACHE_KEY];
  if (typeof cached === "boolean") return cached;
  try {
    const row = await env.D1_DB
      .prepare("SELECT 1 FROM pragma_table_info('memories') WHERE name = 'fact_type' LIMIT 1")
      .first();
    const hasColumn = Boolean(row);
    (globalThis as any)[FACT_TYPE_SUPPORT_CACHE_KEY] = hasColumn;
    return hasColumn;
  } catch (err: any) {
    console.log("FACT_TYPE detect error", err?.message || err);
    (globalThis as any)[FACT_TYPE_SUPPORT_CACHE_KEY] = false;
    return false;
  }
}

function disableFactTypeColumnSupport() {
  (globalThis as any)[FACT_TYPE_SUPPORT_CACHE_KEY] = false;
}

function isFactTypeColumnError(err: any) {
  const msg = String(err?.message || "");
  return (
    msg.includes("no such column: fact_type") ||
    msg.includes("has no column named fact_type")
  );
}

function normalizeFactRows(rows: any[], hasFactTypeColumn: boolean) {
  if (hasFactTypeColumn) return rows;
  return rows.map((row) => ({ ...row, fact_type: row.fact_type ?? null }));
}

function filterFactsForVerification(rows: any[], verification: VerificationState): { facts: any[], protectedCount: number } {
  if (isVerified(verification)) return { facts: rows, protectedCount: 0 };
  // v3.172: Gate ALL facts behind verification. Conversational context is available
  // via the situational_briefing dynamic variable; stored facts require OTP.
  return { facts: [], protectedCount: rows.length };
}

function sanitizeSummariesForVerification(rows: any[], verification: VerificationState) {
  if (isVerified(verification)) return rows;
  return [];
}

function trimKnowledgeBaseFacts(rows: any[]) {
  return rows.map((row) => {
    const factType = normalizeFactType(row?.fact_type);
    if (factType !== "kb_summary") return row;
    const fact = safeString(row?.fact ?? "", 1024);
    if (!fact) return row;
    const trimmed = trimKnowledgeBaseText(fact);
    if (trimmed === fact) return row;
    return { ...row, fact: trimmed };
  });
}

function trimKnowledgeBaseText(text: string) {
  const normalized = text.trim();
  if (!normalized) return normalized;
  const sentences = normalized
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (!sentences.length) {
    return normalized.length > KB_CHAR_LIMIT ? normalized.slice(0, KB_CHAR_LIMIT).trimEnd() + "…" : normalized;
  }
  const selected: string[] = [];
  for (const sentence of sentences) {
    selected.push(sentence);
    if (selected.length >= KB_SENTENCE_LIMIT) break;
  }
  let result = selected.join(" ");
  if (result.length > KB_CHAR_LIMIT) {
    result = result.slice(0, KB_CHAR_LIMIT).trimEnd();
    if (!/[.!?…]$/.test(result)) result += "…";
  }
  return result;
}

// --- CRM Integration ---

function getAgentName(agentId: string | null): string {
  if (!agentId) return "Unknown Agent";
  const mapping: Record<string, string> = {
    "agent_4501ka281xkpe6e8jzbspgy9qh4d": "Front Door Agent",
    "agent_2201k9db08cge35rswdxczvn7r4a": "Front Door Agent (Prod)",
    "agent_4101k9akdzxsf68tkjw4w882d244": "Sales Advisor",
    "agent_2101k9d53mane36s5evqp36qj4qh": "Technical Specialist",
    "agent_5501k9d6f9n5e9sanbytq6ggz9xa": "Onboarding Coach",
    "agent_1001k9d6se7ee2f9cqt9btjd0mb4": "Demo Guide"
  };
  return mapping[agentId] || `Agent (${agentId.slice(-4)})`;
}

interface CRMConfig {
  workspace_id: string;
  crm_provider: string;
  api_key?: string;
  location_id?: string;
}

interface CRMContact {
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
}

abstract class CRMProvider {
  abstract findOrCreateContact(config: CRMConfig, contact: CRMContact): Promise<string | null>;
  abstract logNote(config: CRMConfig, contactId: string, note: string): Promise<boolean>;
}

class GHLProvider extends CRMProvider {
  async findOrCreateContact(config: CRMConfig, contact: CRMContact): Promise<string | null> {
    if (!config.api_key || !config.location_id) return null;
    try {
      const resp = await fetch(`https://services.leadconnectorhq.com/contacts/upsert`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${config.api_key}`,
          "Content-Type": "application/json",
          "Version": "2021-07-28"
        },
        body: JSON.stringify({
          locationId: config.location_id,
          email: contact.email,
          phone: contact.phone,
          firstName: contact.firstName,
          lastName: contact.lastName
        })
      });
      const result: any = await resp.json();
      return result?.contact?.id || null;
    } catch (err) {
      console.error("GHL Upsert Contact Error:", err);
      return null;
    }
  }

  async logNote(config: CRMConfig, contactId: string, note: string): Promise<boolean> {
    if (!config.api_key) return false;
    try {
      const resp = await fetch(`https://services.leadconnectorhq.com/contacts/${contactId}/notes`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${config.api_key}`,
          "Content-Type": "application/json",
          "Version": "2021-07-28"
        },
        body: JSON.stringify({ body: note })
      });
      return resp.ok;
    } catch (err) {
      console.error("GHL Log Note Error:", err);
      return false;
    }
  }
}

class CRMClient {
  static getProvider(provider: string): CRMProvider | null {
    if (provider === 'ghl') return new GHLProvider();
    return null;
  }
}

async function getWorkspaceCRMConfig(env: Env, workspaceId: string): Promise<CRMConfig | null> {
  try {
    const { results } = await env.D1_DB.prepare(
      "SELECT * FROM workspace_crm_configs WHERE workspace_id = ?"
    ).bind(workspaceId).all();
    return (results[0] as unknown as CRMConfig) || null;
  } catch {
    return null;
  }
}

async function syncCallToCRM(env: Env, workspaceId: string, contact: CRMContact, note: string): Promise<string | null> {
  const config = await getWorkspaceCRMConfig(env, workspaceId);
  if (!config) return null;

  const provider = CRMClient.getProvider(config.crm_provider);
  if (!provider) return null;

  const contactId = await provider.findOrCreateContact(config, contact);
  if (contactId) {
    await provider.logNote(config, contactId, note);
  }
  return contactId;
}

// --- Situational Briefing ---

async function getLatestBriefing(env: Env, workspaceId: string, subjectId: string, timeGreeting: string = "Hello"): Promise<{ briefing: string, greeting: string, dynamic_greeting: string, name: string | null, visitor_status: string }> {
  try {
    // v3.164: Run name + summary queries in PARALLEL for speed
    const [nameRow, summaryRow] = await Promise.all([
      // 1. Look up name directly from memories table
      env.D1_DB.prepare(
        `SELECT fact FROM memories 
         WHERE workspace_id = ? AND subject_id = ? AND fact_type = 'name'
         ORDER BY updated_at DESC LIMIT 1`
      ).bind(workspaceId, subjectId).first<{ fact: string }>(),

      // 2. Look up latest call summary for briefing context
      // v3.168: Removed JOIN on calls table — agent_id doesn't exist on calls,
      // and cs.created_at is sufficient for the timestamp
      env.D1_DB.prepare(
        `SELECT cs.summary, cs.sentiment, cs.structured_outcome, cs.created_at
         FROM call_summaries cs
         WHERE cs.workspace_id = ? AND cs.subject_id = ?
         ORDER BY cs.created_at DESC LIMIT 1`
      ).bind(workspaceId, subjectId).first<{
        summary: string;
        sentiment: string | null;
        structured_outcome: string | null;
        created_at: number;
      }>()
    ]);

    const firstName = nameRow?.fact ? nameRow.fact.split(' ')[0] : null;

    // 3. Check if ANY interaction exists (memories OR call summaries)
    const isReturning = !!nameRow || !!summaryRow;

    if (!isReturning) {
      // Truly new user — no memories, no call history
      const newGreetings = [
        `${timeGreeting}, this is Emily with Ampere AI. What can I help you with today?`,
        `${timeGreeting}! Emily here from Ampere AI. How can I help?`,
        `${timeGreeting}, you've reached Emily at Ampere AI. What can I do for you?`
      ];
      const dynamic_greeting = newGreetings[Math.floor(Math.random() * newGreetings.length)];
      return {
        briefing: "",
        greeting: dynamic_greeting,
        dynamic_greeting,
        name: null,
        visitor_status: "new"
      };
    }

    // Build briefing from call summary (if available)
    let briefing = "";
    if (summaryRow) {
      const dateStr = new Date(summaryRow.created_at).toLocaleString("en-US", { timeZone: "America/New_York" });
      briefing = `[SITUATIONAL BRIEFING]
RECURRING CONTACT DETECTED.
Last Interaction: ${dateStr}.
Last Sentiment: ${summaryRow.sentiment || 'Neutral'}
Last Outcome: ${summaryRow.structured_outcome || 'Unknown'}
Summary of Last Call: ${summaryRow.summary}
---`;
    }

    // Compose dynamic greeting based on context
    let dynamic_greeting: string;
    if (firstName) {
      // Returning user WITH name
      const returningNamedGreetings = [
        `${timeGreeting}, ${firstName}! Good to have you back. What can I help with?`,
        `${timeGreeting}, ${firstName}. Welcome back — what are we working on today?`,
        `Hey ${firstName}, ${timeGreeting.toLowerCase()}! Great to hear from you again. What's on your mind?`
      ];
      dynamic_greeting = returningNamedGreetings[Math.floor(Math.random() * returningNamedGreetings.length)];
    } else {
      // Returning user WITHOUT name (has call history but never gave name)
      const returningAnonGreetings = [
        `${timeGreeting}, this is Emily! I see you've been here before. Who am I speaking with today?`,
        `${timeGreeting}! Emily here — welcome back. I don't have a name on file though. What should I call you?`,
        `${timeGreeting}, welcome back! This is Emily. May I get your name?`
      ];
      dynamic_greeting = returningAnonGreetings[Math.floor(Math.random() * returningAnonGreetings.length)];
    }

    const visitor_status = firstName ? `returning:${firstName}` : "returning";

    return { briefing, greeting: dynamic_greeting, dynamic_greeting, name: firstName, visitor_status };
  } catch (err) {
    console.error("getLatestBriefing error:", err);
    const fallback = `${timeGreeting}, this is Emily with Ampere AI. What can I help with?`;
    return {
      briefing: "",
      greeting: fallback,
      dynamic_greeting: fallback,
      name: null,
      visitor_status: "new"
    };
  }
}
