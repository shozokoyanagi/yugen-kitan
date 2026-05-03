const { generateReply } = require("../lib/chat");

function sendJson(res, statusCode, payload) {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(payload));
}

function normalizeBody(body) {
  if (!body) {
    return {};
  }

  if (typeof body === "string") {
    try {
      return JSON.parse(body);
    } catch {
      return {};
    }
  }

  return typeof body === "object" ? body : {};
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    sendJson(res, 405, { error: "Method not allowed." });
    return;
  }

  try {
    const payload = normalizeBody(req.body);
    const reply = await generateReply({
      message: payload.message,
      state: payload.state,
      history: payload.history,
    });

    sendJson(res, 200, { reply });
  } catch (error) {
    console.error("Vercel chat API error:", error);
    sendJson(res, error.statusCode || 500, { error: error.message || "Failed to generate a reply." });
  }
};
