const http = require("http");

const host = "127.0.0.1";
const port = 8787;

function requestHasAuthenticatedSession(req) {
  const cookieHeader = req.headers.cookie || "";
  return cookieHeader
    .split(";")
    .map((part) => part.trim())
    .some((part) => part === "mdz_session=authenticated");
}

function writeJson(res, statusCode, payload, origin = "") {
  const body = JSON.stringify(payload);
  if (origin) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Vary", "Origin");
  }
  res.writeHead(statusCode, {
    "Content-Type": "application/json",
    "Content-Length": Buffer.byteLength(body),
    "Access-Control-Allow-Headers": "Content-Type, Accept",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  });
  res.end(body);
}

const server = http.createServer((req, res) => {
  const origin = req.headers.origin || "";
  if (req.method === "OPTIONS") {
    writeJson(res, 204, {}, origin);
    return;
  }

  if (req.url === "/health") {
    writeJson(res, 200, { ok: true }, origin);
    return;
  }

  if (req.url === "/auth/session") {
    writeJson(res, 200, { authenticated: requestHasAuthenticatedSession(req) }, origin);
    return;
  }

  if (req.url === "/auth/logout") {
    writeJson(res, 200, { authenticated: false }, origin);
    return;
  }

  writeJson(res, 404, { error: "Not found." }, origin);
});

server.listen(port, host);
