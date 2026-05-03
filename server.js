const http = require("http");
const fs = require("fs");
const path = require("path");
const { generateReply } = require("./lib/chat");

const port = process.env.PORT || 3000;
const host = process.env.HOST || "0.0.0.0";
const publicDir = path.join(__dirname, "public");

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(payload));
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";

    req.on("data", (chunk) => {
      body += chunk;

      if (body.length > 1_000_000) {
        reject(new Error("Request body too large"));
        req.destroy();
      }
    });

    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (error) {
        reject(error);
      }
    });

    req.on("error", reject);
  });
}

async function handleChat(req, res) {
  try {
    const payload = await readJsonBody(req);
    const reply = await generateReply({
      message: payload.message,
      state: payload.state,
      history: payload.history,
    });

    sendJson(res, 200, { reply });
  } catch (error) {
    console.error("Chat API error:", error);
    sendJson(res, error.statusCode || 500, { error: error.message || "Failed to generate a reply." });
  }
}

function sendFile(filePath, res) {
  fs.readFile(filePath, (error, data) => {
    if (error) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Not found");
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, {
      "Content-Type": mimeTypes[ext] || "application/octet-stream",
    });
    res.end(data);
  });
}

function resolvePublicFile(requestPath) {
  if (requestPath === "/") {
    return path.join(publicDir, "index.html");
  }

  if (requestPath === "/yugen-kitan" || requestPath === "/yugen-kitan/") {
    return path.join(publicDir, "yugen-kitan.html");
  }

  const normalizedPath = path.normalize(requestPath).replace(/^(\.\.[/\\])+/, "");
  const directPath = path.join(publicDir, normalizedPath);

  if (path.extname(directPath)) {
    return directPath;
  }

  return path.join(directPath, "index.html");
}

const server = http.createServer((req, res) => {
  const requestUrl = new URL(req.url, `http://${req.headers.host || "localhost"}`);

  if (req.method === "POST" && requestUrl.pathname === "/api/chat") {
    handleChat(req, res);
    return;
  }

  const filePath = resolvePublicFile(requestUrl.pathname);

  if (!filePath.startsWith(publicDir)) {
    res.writeHead(403, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Forbidden");
    return;
  }

  sendFile(filePath, res);
});

server.listen(port, host, () => {
  console.log(`Kuroo prototype is listening on http://${host}:${port}`);
});
