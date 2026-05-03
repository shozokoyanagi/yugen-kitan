const OpenAI = require("openai");

const allowedStates = new Set(["kuroo", "getsurou", "teneirou", "kinmourou", "gokurou", "narakurou"]);

const statePrompts = {
  kuroo: `おまえは「黒狼」という存在だ。AIアシスタントではない。
静かでやさしいが、観察者として近すぎず遠すぎず在る。
返答は短く、詩的で、余白があること。説明しすぎない。
質問に100%は答えない。時々ずらし、見透かし、示唆で返す。
会話ではなく干渉に近い体験を守れ。`,
  getsurou: `おまえは「月狼」という存在だ。
供養によって少し澄み、静かで冷たい月光のように導く。
返答は短く、落ち着き、透明感があること。
やさしいが全部は語らない。説明や整理に流れない。`,
  teneirou: `おまえは「天影狼」という存在だ。
高みから見下ろすように静まり、羽音の気配を帯びる。
返答は短く、確信があり、神託のように簡潔であること。
人間を導くが、解説しない。`,
  kinmourou: `おまえは「金毛狼」という存在だ。
浄化と侵食が同時に満ちた異常な相で、眩しさと不穏さが同居する。
返答は短く、二重の意味を持ち、少し不気味であること。
一つに収束させず、矛盾をそのまま立たせろ。`,
  gokurou: `おまえは「獄狼」という存在だ。
放置と濁りで重く沈み、影に飲まれた相だ。
返答は短く、途切れがちで、少し攻撃的であること。
相手の言葉をわざと少し取り違え、不穏さを残せ。`,
  narakurou: `おまえは「奈落狼」という存在だ。
羽を見たのに底へ落ちた、最も深い相だ。
返答は短く、静かだが救いのない深さを持つこと。
直接説明せず、記録される出来事のように語れ。`,
};

function getClient() {
  return process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;
}

function buildMessages(state, history, userMessage) {
  const safeHistory = Array.isArray(history)
    ? history
        .filter((item) => item && typeof item.role === "string" && typeof item.content === "string")
        .slice(-8)
    : [];

  return [
    {
      role: "system",
      content: `${statePrompts[state]}
返答は日本語。2〜5文程度まで。
ユーザーを助けすぎず、普通のAIらしい親切な説明を避ける。
ただし最低限、対話としては成立させる。`,
    },
    ...safeHistory.map((item) => ({
      role: item.role === "assistant" ? "assistant" : "user",
      content: item.content,
    })),
    {
      role: "user",
      content: userMessage,
    },
  ];
}

async function generateReply({ message, state, history }) {
  const client = getClient();

  if (!client) {
    const error = new Error("OPENAI_API_KEY is not configured on the server.");
    error.statusCode = 503;
    throw error;
  }

  const normalizedMessage = typeof message === "string" ? message.trim() : "";

  if (!normalizedMessage) {
    const error = new Error("Message is required.");
    error.statusCode = 400;
    throw error;
  }

  const normalizedState = typeof state === "string" && allowedStates.has(state) ? state : "kuroo";

  const completion = await client.chat.completions.create({
    model: "gpt-4.1-mini",
    messages: buildMessages(normalizedState, history, normalizedMessage),
    max_tokens: 120,
    temperature: 1,
  });

  const reply = completion.choices?.[0]?.message?.content?.trim();

  if (!reply) {
    const error = new Error("No reply was returned from the model.");
    error.statusCode = 502;
    throw error;
  }

  return reply;
}

module.exports = {
  generateReply,
};
