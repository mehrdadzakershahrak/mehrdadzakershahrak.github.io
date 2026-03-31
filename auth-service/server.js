"use strict";

const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const express = require("express");
const { OAuth2Client } = require("google-auth-library");

loadDotEnv();

const PORT = parseInteger(process.env.PORT, 8787);
const NODE_ENV = process.env.NODE_ENV || "development";
const COOKIE_NAME = process.env.AUTH_COOKIE_NAME || "mdz_session";
const SESSION_SECRET = String(process.env.SESSION_SECRET || "");
const SESSION_TTL_SECONDS = parseInteger(process.env.SESSION_TTL_SECONDS, 60 * 60 * 24 * 14);
const COOKIE_DOMAIN = String(process.env.COOKIE_DOMAIN || "").trim();
const COOKIE_SECURE = parseBoolean(process.env.COOKIE_SECURE, NODE_ENV === "production");
const GOOGLE_CLIENT_ID = String(process.env.GOOGLE_CLIENT_ID || "").trim();
const ALLOWED_ORIGINS = splitCsv(
  process.env.ALLOWED_ORIGINS ||
    "http://127.0.0.1:4000,http://localhost:4000,https://www.mehrdadzaker.com,https://mehrdadzaker.com"
);
const DEMO_CHAT_ENDPOINTS = parseJsonObject(process.env.DEMO_CHAT_ENDPOINTS_JSON || "{}");
const DEMO_CHAT_INCLUDE_USER = parseBoolean(process.env.DEMO_CHAT_INCLUDE_USER, false);
const GOOGLE_ISSUERS = new Set(["accounts.google.com", "https://accounts.google.com"]);
const oauthClient = GOOGLE_CLIENT_ID ? new OAuth2Client(GOOGLE_CLIENT_ID) : null;

if (!SESSION_SECRET) {
  throw new Error("SESSION_SECRET is required.");
}

const app = express();

app.use(express.json({ limit: "64kb" }));
app.use(applyCors);

app.get("/health", function (_req, res) {
  res.json({
    ok: true,
    service: "mehrdadzaker-auth-service",
    hasGoogleClientId: Boolean(GOOGLE_CLIENT_ID),
    allowedOrigins: ALLOWED_ORIGINS,
    configuredDemoIds: Object.keys(DEMO_CHAT_ENDPOINTS),
  });
});

app.get("/auth/session", function (req, res) {
  const session = readSession(req);
  if (!session) {
    return res.json({ authenticated: false });
  }

  return res.json({ authenticated: true });
});

app.post("/auth/google", async function (req, res) {
  try {
    if (!oauthClient) {
      return res.status(500).json({ error: "GOOGLE_CLIENT_ID is not configured on the auth service." });
    }

    const credential = String((req.body && req.body.credential) || "").trim();
    if (!credential) {
      return res.status(400).json({ error: "Missing Google credential." });
    }

    const user = await verifyGoogleCredential(credential);
    const sessionCookie = createSignedSession(user);

    setSessionCookie(res, sessionCookie);
    return res.json({ authenticated: true });
  } catch (error) {
    return res.status(401).json({ error: error.message || "Could not verify Google sign-in." });
  }
});

app.post("/auth/logout", function (_req, res) {
  clearSessionCookie(res);
  res.json({ authenticated: false });
});

app.post("/api/demo-chat", async function (req, res) {
  const session = readSession(req);
  if (!session) {
    return res.status(401).json({ error: "Authentication required." });
  }

  const demoId = String((req.body && req.body.demo_id) || "").trim();
  const message = String((req.body && req.body.message) || "").trim();
  const pageContext = req.body && typeof req.body.pageContext === "object" ? req.body.pageContext : {};

  if (!demoId) {
    return res.status(400).json({ error: "Missing demo_id." });
  }

  if (!message) {
    return res.status(400).json({ error: "Missing message." });
  }

  const upstreamUrl = DEMO_CHAT_ENDPOINTS[demoId];
  if (!upstreamUrl) {
    if (NODE_ENV !== "production") {
      return res.json({
        reply:
          `Local auth is working. No upstream endpoint is configured for "${demoId}" yet.\n\n` +
          `Received message: ${message}`,
      });
    }
    return res.status(503).json({ error: `No upstream endpoint configured for demo_id "${demoId}".` });
  }

  try {
    const upstreamPayload = {
      demo_id: demoId,
      message: message,
      pageContext: pageContext,
    };
    if (DEMO_CHAT_INCLUDE_USER) {
      upstreamPayload.user = session.user;
    }
    const upstreamRes = await fetch(upstreamUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json, text/plain;q=0.9, */*;q=0.8",
      },
      body: JSON.stringify(upstreamPayload),
    });

    const contentType = upstreamRes.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const data = await upstreamRes.json().catch(function () {
        return null;
      });
      return res.status(upstreamRes.status).json(data || { reply: "" });
    }

    const text = await upstreamRes.text().catch(function () {
      return "";
    });
    return res.status(upstreamRes.status).json({ reply: text });
  } catch (error) {
    return res.status(502).json({ error: error.message || "Could not reach demo upstream." });
  }
});

app.use(function (_req, res) {
  res.status(404).json({ error: "Not found." });
});

app.listen(PORT, function () {
  console.log(`Auth service listening on http://127.0.0.1:${PORT}`);
});

function loadDotEnv() {
  const envPath = path.join(__dirname, ".env");
  if (!fs.existsSync(envPath)) return;

  const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const eq = trimmed.indexOf("=");
    if (eq < 0) continue;

    const key = trimmed.slice(0, eq).trim();
    if (!key || process.env[key] !== undefined) continue;

    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
}

function applyCors(req, res, next) {
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Vary", "Origin");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Accept");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  }

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  next();
}

async function verifyGoogleCredential(credential) {
  const ticket = await oauthClient.verifyIdToken({
    idToken: credential,
    audience: GOOGLE_CLIENT_ID,
  });

  const payload = ticket.getPayload();
  if (!payload) {
    throw new Error("Google did not return an ID token payload.");
  }

  if (!GOOGLE_ISSUERS.has(payload.iss)) {
    throw new Error("Unexpected Google token issuer.");
  }

  if (!payload.sub || !payload.email) {
    throw new Error("Google token is missing required identity fields.");
  }

  if (!payload.email_verified) {
    throw new Error("Google account email is not verified.");
  }

  return {
    sub: payload.sub,
    email: payload.email,
    name: payload.name || payload.email,
    picture: payload.picture || "",
  };
}

function createSignedSession(user) {
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    sub: user.sub,
    email: user.email,
    name: user.name,
    picture: user.picture,
    iat: now,
    exp: now + SESSION_TTL_SECONDS,
  };

  const encodedPayload = base64urlEncode(JSON.stringify(payload));
  const signature = signValue(encodedPayload);
  return `${encodedPayload}.${signature}`;
}

function readSession(req) {
  const cookies = parseCookies(req.headers.cookie || "");
  const raw = cookies[COOKIE_NAME];
  if (!raw) return null;

  const dotIndex = raw.lastIndexOf(".");
  if (dotIndex < 1) return null;

  const encodedPayload = raw.slice(0, dotIndex);
  const providedSignature = raw.slice(dotIndex + 1);
  const expectedSignature = signValue(encodedPayload);

  if (!timingSafeEqual(providedSignature, expectedSignature)) {
    return null;
  }

  try {
    const payload = JSON.parse(base64urlDecode(encodedPayload));
    if (!payload || !payload.exp || payload.exp <= Math.floor(Date.now() / 1000)) {
      return null;
    }

    return {
      user: {
        sub: payload.sub,
        email: payload.email,
        name: payload.name,
        picture: payload.picture,
      },
    };
  } catch {
    return null;
  }
}

function setSessionCookie(res, value) {
  res.setHeader("Set-Cookie", serializeCookie(COOKIE_NAME, value, SESSION_TTL_SECONDS));
}

function clearSessionCookie(res) {
  res.setHeader("Set-Cookie", serializeCookie(COOKIE_NAME, "", 0));
}

function serializeCookie(name, value, maxAge) {
  const parts = [
    `${name}=${value}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${Math.max(0, maxAge)}`,
  ];

  if (COOKIE_DOMAIN) parts.push(`Domain=${COOKIE_DOMAIN}`);
  if (COOKIE_SECURE) parts.push("Secure");

  return parts.join("; ");
}

function parseCookies(header) {
  const cookies = {};
  for (const part of String(header).split(";")) {
    const chunk = part.trim();
    if (!chunk) continue;
    const eq = chunk.indexOf("=");
    if (eq < 0) continue;
    cookies[chunk.slice(0, eq)] = chunk.slice(eq + 1);
  }
  return cookies;
}

function signValue(value) {
  return crypto.createHmac("sha256", SESSION_SECRET).update(value).digest("base64url");
}

function timingSafeEqual(a, b) {
  const left = Buffer.from(String(a));
  const right = Buffer.from(String(b));
  if (left.length !== right.length) return false;
  return crypto.timingSafeEqual(left, right);
}

function base64urlEncode(value) {
  return Buffer.from(value).toString("base64url");
}

function base64urlDecode(value) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function splitCsv(value) {
  return String(value)
    .split(",")
    .map(function (item) {
      return item.trim();
    })
    .filter(Boolean);
}

function parseInteger(value, fallback) {
  const parsed = Number.parseInt(String(value || ""), 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function parseBoolean(value, fallback) {
  if (value === undefined || value === null || value === "") return fallback;
  return /^(1|true|yes|on)$/i.test(String(value));
}

function parseJsonObject(value) {
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}
