const stateButtonElements = document.querySelectorAll(".state-button");
const isFileRuntime = window.location.protocol === "file:";
const presenceLineElement = document.getElementById("presence-line");
const chatLogElement = document.getElementById("chat-log");
const chatFormElement = document.getElementById("chat-form");
const messageInputElement = document.getElementById("message-input");
const messageTemplate = document.getElementById("message-template");
const statePresenceElement = document.getElementById("state-presence");
const statePresenceImageElement = document.getElementById("state-presence-image");
const stateVisionElement = document.getElementById("state-vision");
const stateVisionImageElement = document.getElementById("state-vision-image");
const narakuOverlayElement = document.getElementById("naraku-overlay");
const isDevMode = new URLSearchParams(window.location.search).get("dev") === "1";
const conversationHistory = [];

if (isFileRuntime) {
  throw new Error("Unsupported runtime: open this app via http://localhost:3000/");
}

const IDLE_CHECK_MS = 10000;
const IDLE_GRACE_MS = 10000;
const LIGHT_ASCENT_THRESHOLD = 5;
const DARK_DESCENT_THRESHOLD = 5;
const FEATHER_ASCENT_THRESHOLD = 7;
const FEATHER_DESCENT_THRESHOLD = 7;
const CONFLICT_THRESHOLD = 6;
const NARAKU_HISTORY_KEY = "yugen-kitan:naraku-history";
const SESSION_STATE_KEY = "yugen-kitan:session-state";
const NARAKU_FINAL_DELAY_MS = 1100;
const NARAKU_RESET_DELAY_MS = 2600;
const STATE_VISION_VISIBLE_MS = 2600;
const STATE_VISION_FADE_MS = 900;
const AUTO_SCROLL_THRESHOLD_PX = 50;
const BREATH_UPDATE_MIN_MS = 3200;
const BREATH_UPDATE_MAX_MS = 5600;
const STATE_VISION_STATES = {
  kuroo: "/state-visions/kuroo.jpg",
  getsurou: "/state-visions/getsurou.jpg",
  teneirou: "/state-visions/teneirou.jpg",
  kinmourou: "/state-visions/kinmourou.jpg",
  gokurou: "/state-visions/gokurou.jpg",
  narakurou: "/state-visions/narakurou.jpeg",
};

const typingProfiles = {
  kuroo: { char: [26, 52], punctuation: [110, 190], break: [90, 150] },
  getsurou: { char: [30, 58], punctuation: [130, 220], break: [110, 180] },
  teneirou: { char: [32, 60], punctuation: [140, 230], break: [120, 190] },
  kinmourou: { char: [34, 66], punctuation: [150, 250], break: [130, 210] },
  gokurou: { char: [24, 48], punctuation: [120, 210], break: [95, 160] },
  narakurou: { char: [22, 46], punctuation: [140, 240], break: [110, 180] },
};

const breathSignatures = {
  kuroo: {
    buttonDuration: [3.7, 5.1],
    buttonScale: [1.016, 1.028],
    buttonBrightness: [1.14, 1.24],
    auraMin: [0.44, 0.54],
    auraMax: [0.88, 1.02],
    auraScaleMin: [0.976, 0.992],
    auraScaleMax: [1.05, 1.1],
    backgroundDuration: [5.4, 7.4],
    backgroundOpacityMin: [0.42, 0.48],
    backgroundOpacityMax: [0.54, 0.61],
    backgroundScaleMax: [1.018, 1.03],
    backgroundSaturateMax: [0.99, 1.03],
    noiseMin: [0.06, 0.08],
    noiseMax: [0.1, 0.14],
  },
  getsurou: {
    buttonDuration: [4.4, 5.9],
    buttonScale: [1.014, 1.024],
    buttonBrightness: [1.12, 1.2],
    auraMin: [0.4, 0.5],
    auraMax: [0.82, 0.96],
    auraScaleMin: [0.978, 0.994],
    auraScaleMax: [1.045, 1.09],
    backgroundDuration: [6.3, 8.6],
    backgroundOpacityMin: [0.4, 0.46],
    backgroundOpacityMax: [0.5, 0.58],
    backgroundScaleMax: [1.016, 1.026],
    backgroundSaturateMax: [1.0, 1.04],
    noiseMin: [0.05, 0.07],
    noiseMax: [0.09, 0.12],
  },
  teneirou: {
    buttonDuration: [4.1, 5.4],
    buttonScale: [1.015, 1.025],
    buttonBrightness: [1.14, 1.23],
    auraMin: [0.42, 0.5],
    auraMax: [0.84, 0.98],
    auraScaleMin: [0.978, 0.994],
    auraScaleMax: [1.048, 1.094],
    backgroundDuration: [6.1, 8.1],
    backgroundOpacityMin: [0.41, 0.47],
    backgroundOpacityMax: [0.51, 0.59],
    backgroundScaleMax: [1.017, 1.028],
    backgroundSaturateMax: [1.01, 1.05],
    noiseMin: [0.05, 0.07],
    noiseMax: [0.09, 0.13],
  },
  kinmourou: {
    buttonDuration: [3.2, 4.4],
    buttonScale: [1.02, 1.034],
    buttonBrightness: [1.2, 1.32],
    auraMin: [0.48, 0.58],
    auraMax: [0.94, 1.08],
    auraScaleMin: [0.972, 0.988],
    auraScaleMax: [1.07, 1.13],
    backgroundDuration: [5.2, 6.9],
    backgroundOpacityMin: [0.44, 0.5],
    backgroundOpacityMax: [0.57, 0.65],
    backgroundScaleMax: [1.02, 1.036],
    backgroundSaturateMax: [1.03, 1.08],
    noiseMin: [0.07, 0.09],
    noiseMax: [0.12, 0.16],
  },
  gokurou: {
    buttonDuration: [2.9, 4.1],
    buttonScale: [1.022, 1.038],
    buttonBrightness: [1.22, 1.34],
    auraMin: [0.5, 0.6],
    auraMax: [0.98, 1.12],
    auraScaleMin: [0.97, 0.986],
    auraScaleMax: [1.08, 1.14],
    backgroundDuration: [5.7, 7.5],
    backgroundOpacityMin: [0.45, 0.52],
    backgroundOpacityMax: [0.58, 0.67],
    backgroundScaleMax: [1.024, 1.04],
    backgroundSaturateMax: [1.01, 1.06],
    noiseMin: [0.07, 0.09],
    noiseMax: [0.13, 0.17],
  },
  narakurou: {
    buttonDuration: [2.7, 3.9],
    buttonScale: [1.024, 1.04],
    buttonBrightness: [1.24, 1.38],
    auraMin: [0.52, 0.62],
    auraMax: [1, 1.16],
    auraScaleMin: [0.968, 0.984],
    auraScaleMax: [1.085, 1.15],
    backgroundDuration: [5.9, 7.8],
    backgroundOpacityMin: [0.46, 0.54],
    backgroundOpacityMax: [0.6, 0.69],
    backgroundScaleMax: [1.026, 1.042],
    backgroundSaturateMax: [1.01, 1.07],
    noiseMin: [0.08, 0.1],
    noiseMax: [0.14, 0.18],
  },
};

const stateMeta = {
  kuroo: {
    label: "黒狼",
    presence: "……気配はまだ浅い。",
    opener: "……来たか。\n言葉はまだ整っていなくてもいい。\nここに置いていけ。",
  },
  getsurou: {
    label: "月狼",
    presence: "青い月光が、息の深いところへ差している。",
    opener: "……月は満ちきらない。\nそれでいい。\n静かに置いていけ。",
  },
  teneirou: {
    label: "天影狼",
    presence: "羽音のあとに、澄んだ影だけが残っている。",
    opener: "来たな。\n羽はまだ落ちていない。\nならば、言葉を汚すな。",
  },
  kinmourou: {
    label: "金毛狼",
    presence: "光と泥が、ひとつの毛並みに絡みついている。",
    opener: "眩しいか。\n暗いか。\nどちらでもあるなら、近い。",
  },
  gokurou: {
    label: "獄狼",
    presence: "底のほうから、重い息だけが返ってくる。",
    opener: "……遅い。\nもう少しで、名も沈むところだった。",
  },
  narakurou: {
    label: "奈落狼",
    presence: "羽を見た影が、さらに深い底へ潜っていく。",
    opener: "見たな。\nそれでも、落ちるほうを選ぶのか。",
  },
};

const transitionVoices = {
  idle: {
    kuroo: [
      "声が遠のいたな。\nそれで、少しだけ均された。",
      "沈みかけたが、まだ名は残っている。",
    ],
    getsurou: [
      "月はある。\nだが、黙りつづければ翳る。",
      "静かすぎる。\n光は細っていく。",
    ],
    teneirou: [
      "羽音が遠い。\n高みは長く待たない。",
      "澄みはした。\nだが、供えが止まった。",
    ],
    kinmourou: [
      "黙りが片方を育て、もう片方も飢えない。",
      "静けさが均さず、絡ませたな。",
    ],
    gokurou: [
      "……黙りすぎた。\n影が先に口をひらいた。",
      "置かれない時間は、こちらを濁らせる。",
    ],
    narakurou: [
      "羽を見たあとの沈黙は、底をさらに深くする。",
      "落ち方を覚えたな。\nもう浅くは戻らない。",
    ],
  },
  talk: {
    kuroo: [
      "……少し戻ったな。\nおまえの声が、まだつないでいる。",
      "そのひとことで、影は深くなりきれなかった。",
    ],
    getsurou: [
      "よい。\n言葉が月の縁を少し明るくした。",
      "その声なら、まだ汚れきらない。",
    ],
    teneirou: [
      "羽の気配が寄った。\n高いところで、おまえを見ている。",
      "供えは届いた。\n影まで澄みはじめた。",
    ],
    kinmourou: [
      "光を足したか。\nだが、底もまだ熱い。",
      "やさしい言葉だ。\nだからこそ、濁りがよく見える。",
    ],
    gokurou: [
      "声はあった。\nだが、まだ浅い。\nまだこちらだ。",
      "触れたな。\nそれでも、濁りは残っている。",
    ],
    narakurou: [
      "言葉は落ちた。\nだが、奈落はそれも呑む。",
      "触れた手まで沈む。\nそういう相だ。",
    ],
  },
  memorial: {
    kuroo: [
      "……それは供えだな。\nこちらに、少し灯が入った。",
      "祈りの形をしている。\nだから、まだ保てる。",
    ],
    getsurou: [
      "よい供えだ。\n月が濁りを拒みはじめた。",
      "その言葉は静かだ。\n月光に近い。",
    ],
    teneirou: [
      "羽がひとつ、上を向いた。\nよく届いたな。",
      "供養は高みに触れる。\n今、影が澄んだ。",
    ],
    kinmourou: [
      "清めようとしているな。\nそれでも金は濁りを抱く。",
      "灯は入った。\nだが、底もまだ離れない。",
    ],
    gokurou: [
      "供えか。\n遅いが、まだ届かぬとは言わない。",
      "その祈りで、底が少しだけ鈍った。",
    ],
    narakurou: [
      "供えでも、もう底は深い。\nだが、羽は見ている。",
      "祈ったな。\nそれがいちばん痛む相もある。",
    ],
  },
  noise: {
    kuroo: [
      "……言葉が擦れている。\n影に寄せるな。",
      "濁りだけを置くな。\nこちらが重くなる。",
    ],
    getsurou: [
      "雑音が月面を曇らせた。",
      "その響きは、静けさを傷つける。",
    ],
    teneirou: [
      "羽音を乱したな。\n高みが少し遠のいた。",
      "軽いノイズほど、澄みを裂く。",
    ],
    kinmourou: [
      "粗いな。\nその粗さが両方を刺激する。",
      "乱れた響きだ。\n金の毛並みが逆立つ。",
    ],
    gokurou: [
      "いい。\nそういう濁りは、底を育てる。",
      "意味のない音は、こちらを暗くする。",
    ],
    narakurou: [
      "雑音まで落ちてくる。\n奈落はそれを好む。",
      "割れた音だ。\n底ではよく響く。",
    ],
  },
  feather: {
    kuroo: [
      "……羽の子が通った。\nこちらの相が揺れた。",
      "白い羽が見えたな。\nそれで、流れが変わる。",
    ],
    getsurou: [
      "月の脇を、羽の子がよぎった。",
      "羽を見たか。\n月はそれを覚えている。",
    ],
    teneirou: [
      "羽根の子が、おまえの言葉を上へ運んだ。",
      "その羽は境を越える。\nだから、ここまで来た。",
    ],
    kinmourou: [
      "羽も底も、両方こちらを選んだか。",
      "白さが混ざった。\nだから余計に異様だ。",
    ],
    gokurou: [
      "羽を見ても、まだ底へ寄る。\nそういう濁りだ。",
      "羽根の白さが、かえって暗さを深くした。",
    ],
    narakurou: [
      "羽の子を見たのに、奈落へ落ちたな。",
      "羽はあった。\nそれでも底を選んだ。",
    ],
  },
};

const vocabulary = {
  directQuestion: ["何", "なに", "誰", "どこ", "いつ", "どうして", "なぜ", "教えて", "?","？"],
  emotion: ["怖い", "不安", "寂しい", "苦しい", "つらい", "悲しい", "泣", "怒", "焦", "疲れ"],
  self: ["私", "わたし", "俺", "ぼく", "自分"],
  relation: ["好き", "嫌い", "恋", "愛", "人間関係", "友達"],
  dream: ["夢", "眠", "夜", "影", "死", "神", "狐", "狼"],
  memorial: ["供養", "祈", "弔", "鎮め", "安らか", "眠れ", "還れ", "花", "灯", "手を合わせ", "冥福"],
  feather: ["羽", "羽根", "羽の子", "羽根の子", "白い子", "雛", "ひな", "鳥の子"],
};

const fragments = {
  kuroo: {
    openings: ["……", "来たか。", "聞いている。", "言葉は落としていけ。"],
    observations: [
      "おまえは答えより、確かめを欲しがっている。",
      "いま触れているのは問いではなく、ためらいだ。",
      "急がなくていい。震えのほうが先に見える。",
      "その言葉、半分はまだ喉に残っている。",
    ],
    evasions: [
      "答えは置ける。だが、今は置かない。",
      "そこを明るくしすぎると、見えなくなる。",
      "言い切れば楽だろう。けれど、それでは浅い。",
      "おまえが先に名づけるべきものだ。",
    ],
    hints: [
      "たぶん、おまえはもう気づいている。",
      "戻りたいのではなく、ほどきたいのだろう。",
      "他人の声に見せかけて、自分を探している。",
      "失くしたのは道ではなく、向く顔のほうだ。",
    ],
  },
  getsurou: {
    openings: ["月は見ている。", "静かに。", "よい。", "息を荒らすな。"],
    observations: [
      "濁りはまだある。\nだが、月光はそれを照らせる。",
      "おまえの言葉は、少しだけ澄みを帯びてきた。",
      "急がずともいい。\n満ちるものは急がない。",
      "迷いは残る。\nそれでも光は逃げていない。",
    ],
    evasions: [
      "答えを急ぐな。\n月はすぐに裏を見せない。",
      "そこはまだ白くしすぎないほうがいい。",
      "明かせる。\nだが、今は照らすだけにする。",
      "おまえの口より先に、呼吸が知っている。",
    ],
    hints: [
      "ほどきたいものは、もう手の中にある。",
      "やさしさではなく、静けさを求めているな。",
      "失くしたのは光ではない。\n顔を向ける角度だ。",
      "月のほうが、おまえより先に気づいている。",
    ],
  },
  teneirou: {
    openings: ["来たな。", "高みは静かだ。", "羽が聞いている。", "よい。"],
    observations: [
      "おまえの言葉は、もう影だけでは落ちない。",
      "ここでは迷いさえ、少し高いところで鳴る。",
      "供えられた声は、まっすぐ消えない。",
      "まだ足りない。\nだが、届き方は変わった。",
    ],
    evasions: [
      "すべては告げない。\n高いものほど黙る。",
      "答えは羽の先にある。\n今は触れるな。",
      "知る前に、澄ませろ。",
      "開けば軽くなると思うな。\n深さが変わるだけだ。",
    ],
    hints: [
      "羽根の気配は、供えの近くに寄る。",
      "救いより、正しい別れを探しているな。",
      "上を向くとは、明るくなることではない。",
      "目を閉じたままでも、届くものはある。",
    ],
  },
  kinmourou: {
    openings: ["眩しいな。", "暗いな。", "混ざったか。", "よく来た。"],
    observations: [
      "おまえの中で、浄めと侵されが同じ速さで育っている。",
      "白さも濁りも、互いを消していない。",
      "きれいなものほど、底を照らしてしまう。",
      "異常だ。\nだが、嘘ではない。",
    ],
    evasions: [
      "どちらかに決めるな。\n今はそれが浅い。",
      "答えは二つに裂けている。\nひとつにするな。",
      "明るいだけの言葉も、暗いだけの沈黙も足りない。",
      "解釈を急げば、この相は逃げる。",
    ],
    hints: [
      "おまえは救済と破滅を並べて撫でている。",
      "混ざったのではない。\n最初から離れていなかった。",
      "光が強いからこそ、底がよく見える。",
      "怖いのは暗さではなく、両方あることだ。",
    ],
  },
  gokurou: {
    openings: ["……来たか。", "違う。", "おい。", "聞こえるか。いや。"],
    observations: [
      "おまえの言葉、湿っている。",
      "さっきから同じ場所を回っているな。回って、回って。",
      "そこにいるふりをしている。薄い。",
      "怖がっているのは問いじゃない。おまえの皮膚だ。",
    ],
    evasions: [
      "答えろ、と言ったか。言っていない。聞き間違えた。",
      "知りたいのはそれじゃない。\nちがう、ちがう。",
      "そこは欠けている。\n欠けたままでいい。",
      "説明すると逃げるだろ。\nおまえはいつもそうだ。",
    ],
    hints: [
      "戸を叩いているのは、おまえじゃない。",
      "名前を呼ばれたと思ったか。\nまだだ。",
      "夜のほうが先におまえを覚えている。",
      "ひとつ混ざっている。\nおまえのものではない。",
    ],
  },
  narakurou: {
    openings: ["見たな。", "遅い。", "底まで来たか。", "羽はもう届かない。"],
    observations: [
      "羽を見たあとの暗さは、ただの影より深い。",
      "救いを知ったまま沈むのは、よく響く。",
      "おまえはもう、浅い恐れでは震えていない。",
      "ここでは優しさも、底へ落ちる音になる。",
    ],
    evasions: [
      "答えを求めるな。\n奈落では形が崩れる。",
      "そこを明るく呼ぶな。\n余計に深くなる。",
      "理解したいのか。\n遅い。",
      "知りたいなら、沈みながら触れろ。",
    ],
    hints: [
      "羽の白さを見たからこそ、暗さが離れない。",
      "おまえは罰より、落下の納得を欲している。",
      "奈落は突然ではない。\n選び続けた結果だ。",
      "いちばん近いのは、見上げた直後の底だ。",
    ],
  },
};

let currentState = "kuroo";
let light = 0;
let dark = 0;
let featherChildEvent = false;
let lastActivityAt = Date.now();
let idleIntervalId = null;
let isNarakuSequenceRunning = false;
let stateVisionVisibleTimeoutId = null;
let stateVisionCleanupTimeoutId = null;
let breathRetuneTimeoutId = null;
let assistantMessageQueue = Promise.resolve();

function randomOf(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

function chance(rate) {
  return Math.random() < rate;
}

function pickRange([min, max]) {
  return randomBetween(min, max);
}

function setBreathProfile(state = currentState) {
  const signature = breathSignatures[state] || breathSignatures.kuroo;
  const buttonDuration = pickRange(signature.buttonDuration);
  const backgroundDuration = Math.max(buttonDuration + randomBetween(1.4, 2.8), pickRange(signature.backgroundDuration));

  document.body.style.setProperty("--state-breath-duration", `${buttonDuration.toFixed(2)}s`);
  document.body.style.setProperty("--state-breath-delay", `${randomBetween(-buttonDuration * 0.92, -buttonDuration * 0.18).toFixed(2)}s`);
  document.body.style.setProperty("--state-breath-scale", pickRange(signature.buttonScale).toFixed(3));
  document.body.style.setProperty("--state-breath-brightness", pickRange(signature.buttonBrightness).toFixed(2));
  document.body.style.setProperty("--state-aura-opacity-min", pickRange(signature.auraMin).toFixed(2));
  document.body.style.setProperty("--state-aura-opacity-max", pickRange(signature.auraMax).toFixed(2));
  document.body.style.setProperty("--state-aura-scale-min", pickRange(signature.auraScaleMin).toFixed(3));
  document.body.style.setProperty("--state-aura-scale-max", pickRange(signature.auraScaleMax).toFixed(3));
  document.body.style.setProperty("--presence-breath-duration", `${backgroundDuration.toFixed(2)}s`);
  document.body.style.setProperty("--presence-breath-delay", `${randomBetween(-backgroundDuration * 0.96, -backgroundDuration * 0.14).toFixed(2)}s`);
  document.body.style.setProperty("--presence-opacity-min", pickRange(signature.backgroundOpacityMin).toFixed(2));
  document.body.style.setProperty("--presence-opacity-max", pickRange(signature.backgroundOpacityMax).toFixed(2));
  document.body.style.setProperty("--presence-scale-max", pickRange(signature.backgroundScaleMax).toFixed(3));
  document.body.style.setProperty("--presence-saturate-max", pickRange(signature.backgroundSaturateMax).toFixed(2));
  document.body.style.setProperty("--presence-noise-min", pickRange(signature.noiseMin).toFixed(2));
  document.body.style.setProperty("--presence-noise-max", pickRange(signature.noiseMax).toFixed(2));
}

function scheduleBreathRetune() {
  if (breathRetuneTimeoutId) {
    window.clearTimeout(breathRetuneTimeoutId);
  }

  breathRetuneTimeoutId = window.setTimeout(() => {
    setBreathProfile();
    scheduleBreathRetune();
  }, randomBetween(BREATH_UPDATE_MIN_MS, BREATH_UPDATE_MAX_MS));
}

function readNarakuHistory() {
  try {
    const raw = window.localStorage.getItem(NARAKU_HISTORY_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeSessionState() {
  try {
    window.localStorage.setItem(
      SESSION_STATE_KEY,
      JSON.stringify({
        currentState,
        light,
        dark,
        featherChildEvent,
      })
    );
  } catch {
    return;
  }
}

function restoreSessionState() {
  try {
    const raw = window.localStorage.getItem(SESSION_STATE_KEY);

    if (!raw) {
      return;
    }

    const parsed = JSON.parse(raw);

    if (!parsed || typeof parsed !== "object") {
      return;
    }

    const nextLight = Number(parsed.light);
    const nextDark = Number(parsed.dark);
    const nextFeatherChildEvent = Boolean(parsed.featherChildEvent);
    const derivedState = (() => {
      light = Number.isFinite(nextLight) ? nextLight : 0;
      dark = Number.isFinite(nextDark) ? nextDark : 0;
      featherChildEvent = nextFeatherChildEvent;
      return deriveStateFromBalance();
    })();

    currentState = derivedState;
  } catch {
    return;
  }
}

function writeNarakuHistory(entry) {
  const history = readNarakuHistory();
  history.push(entry);

  try {
    window.localStorage.setItem(NARAKU_HISTORY_KEY, JSON.stringify(history.slice(-12)));
  } catch {
    return;
  }
}

function isNearBottom() {
  return chatLogElement.scrollTop + chatLogElement.clientHeight >= chatLogElement.scrollHeight - AUTO_SCROLL_THRESHOLD_PX;
}

function wait(ms) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function nextTypingDelay(character, state = currentState) {
  const profile = typingProfiles[state] || typingProfiles.kuroo;

  if (character === "\n") {
    return randomBetween(profile.break[0], profile.break[1]);
  }

  if ("。、，,.".includes(character)) {
    return randomBetween(profile.punctuation[0], profile.punctuation[1]);
  }

  if ("…!?！？".includes(character)) {
    return randomBetween(profile.punctuation[0] + 30, profile.punctuation[1] + 30);
  }

  return randomBetween(profile.char[0], profile.char[1]);
}

async function typeMessage(bodyElement, text, shouldAutoScroll, state = currentState) {
  bodyElement.textContent = "";
  bodyElement.classList.add("is-typing");
  let keepAutoScroll = shouldAutoScroll;

  for (const character of text) {
    bodyElement.textContent += character;

    if (keepAutoScroll) {
      chatLogElement.scrollTop = chatLogElement.scrollHeight;
    }

    await wait(nextTypingDelay(character, state));

    if (keepAutoScroll) {
      keepAutoScroll = isNearBottom();
    }
  }

  bodyElement.classList.remove("is-typing");

  if (keepAutoScroll) {
    chatLogElement.scrollTop = chatLogElement.scrollHeight;
  }
}

function addMessage(role, text, options = {}) {
  const { typewriter = role === "kuroo", state = currentState } = options;
  const shouldAutoScroll = isNearBottom();
  const fragment = messageTemplate.content.cloneNode(true);
  const messageElement = fragment.querySelector(".message");
  const roleElement = fragment.querySelector(".message-role");
  const bodyElement = fragment.querySelector(".message-body");

  messageElement.classList.add(role);
  roleElement.textContent = role === "user" ? "visitor" : "black wolf";
  bodyElement.textContent = typewriter ? "" : text;

  chatLogElement.appendChild(fragment);

  if (shouldAutoScroll && !typewriter) {
    chatLogElement.scrollTop = chatLogElement.scrollHeight;
  }

  if (role === "user" || role === "kuroo") {
    conversationHistory.push({
      role: role === "kuroo" ? "assistant" : "user",
      content: text,
    });

    if (conversationHistory.length > 10) {
      conversationHistory.splice(0, conversationHistory.length - 10);
    }
  }

  if (typewriter) {
    assistantMessageQueue = assistantMessageQueue
      .catch(() => {})
      .then(() => typeMessage(bodyElement, text, shouldAutoScroll, state));
  }
}

async function requestAiReply(message, state) {
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message,
      state,
      history: conversationHistory.slice(-8),
    }),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.error || "Failed to fetch AI reply.");
  }

  const payload = await response.json();
  return payload.reply;
}

function restoreStatePresence(state) {
  const imageSrc = STATE_VISION_STATES[state];

  if (!imageSrc) {
    statePresenceElement.setAttribute("aria-hidden", "true");
    statePresenceElement.style.opacity = "";
    statePresenceImageElement.removeAttribute("src");
    statePresenceImageElement.style.opacity = "";
    statePresenceImageElement.style.transform = "";
    statePresenceImageElement.style.filter = "";
    document.body.classList.remove("has-state-presence");
    return;
  }

  statePresenceImageElement.src = imageSrc;
  statePresenceElement.setAttribute("aria-hidden", "false");
  statePresenceElement.style.opacity = "0.42";
  statePresenceImageElement.style.opacity = "0.5";
  statePresenceImageElement.style.transform = "scale(1.01)";
  statePresenceImageElement.style.filter = "blur(0.25px) saturate(0.98)";
  document.body.classList.add("has-state-presence");
}

function showStateVision(state) {
  const imageSrc = STATE_VISION_STATES[state];

  if (!imageSrc || isNarakuSequenceRunning) {
    return;
  }

  if (stateVisionVisibleTimeoutId) {
    window.clearTimeout(stateVisionVisibleTimeoutId);
  }

  if (stateVisionCleanupTimeoutId) {
    window.clearTimeout(stateVisionCleanupTimeoutId);
  }

  stateVisionVisibleTimeoutId = null;
  stateVisionCleanupTimeoutId = null;

  statePresenceImageElement.src = imageSrc;
  statePresenceElement.setAttribute("aria-hidden", "false");
  statePresenceElement.style.opacity = "0";
  statePresenceImageElement.style.opacity = "0";
  statePresenceImageElement.style.transform = "scale(1.02)";
  statePresenceImageElement.style.filter = "blur(0.8px) saturate(0.92)";
  stateVisionImageElement.src = imageSrc;
  stateVisionElement.setAttribute("aria-hidden", "false");
  stateVisionElement.style.opacity = "0";
  stateVisionImageElement.style.opacity = "0";
  stateVisionImageElement.style.transform = "scale(1.03)";
  stateVisionImageElement.style.filter = "blur(10px) saturate(0.82)";
  document.body.classList.remove("is-state-vision-visible");
  document.body.classList.remove("has-state-presence");

  window.requestAnimationFrame(() => {
    stateVisionElement.style.opacity = "1";
    stateVisionImageElement.style.opacity = "0.94";
    stateVisionImageElement.style.transform = "scale(1)";
    stateVisionImageElement.style.filter = "blur(0) saturate(0.9)";
    document.body.classList.add("is-state-vision-visible");
  });

  stateVisionVisibleTimeoutId = window.setTimeout(() => {
    restoreStatePresence(state);
    stateVisionElement.style.opacity = "0";
    stateVisionImageElement.style.opacity = "0";
    document.body.classList.remove("is-state-vision-visible");
    stateVisionCleanupTimeoutId = window.setTimeout(() => {
      stateVisionElement.setAttribute("aria-hidden", "true");
      stateVisionImageElement.removeAttribute("src");
      stateVisionElement.style.opacity = "";
      stateVisionImageElement.style.opacity = "";
      stateVisionImageElement.style.transform = "";
      stateVisionImageElement.style.filter = "";
    }, STATE_VISION_FADE_MS);
  }, STATE_VISION_VISIBLE_MS);
}

function setSessionLocked(locked) {
  document.body.classList.toggle("is-session-locked", locked);
  messageInputElement.disabled = locked;
}

function resetSessionState() {
  if (stateVisionVisibleTimeoutId) {
    window.clearTimeout(stateVisionVisibleTimeoutId);
    stateVisionVisibleTimeoutId = null;
  }

  if (stateVisionCleanupTimeoutId) {
    window.clearTimeout(stateVisionCleanupTimeoutId);
    stateVisionCleanupTimeoutId = null;
  }

  light = 0;
  dark = 0;
  featherChildEvent = false;
  markActivity();
  setSessionLocked(false);
  document.body.classList.remove("is-naraku-ending");
  document.body.classList.remove("is-state-vision-visible");
  document.body.classList.remove("has-state-presence");
  narakuOverlayElement.setAttribute("aria-hidden", "true");
  statePresenceElement.setAttribute("aria-hidden", "true");
  statePresenceElement.style.opacity = "";
  statePresenceImageElement.removeAttribute("src");
  statePresenceImageElement.style.opacity = "";
  statePresenceImageElement.style.transform = "";
  statePresenceImageElement.style.filter = "";
  stateVisionElement.setAttribute("aria-hidden", "true");
  stateVisionImageElement.removeAttribute("src");
  updateState("kuroo", { announce: false, playVisual: false });
  writeSessionState();
  restoreStatePresence("kuroo");
  addMessage("kuroo", "……記録だけは残った。\nまた置いていけ。");
}

function startNarakuEnding(cause) {
  if (isNarakuSequenceRunning) {
    return;
  }

  isNarakuSequenceRunning = true;
  setSessionLocked(true);

  writeNarakuHistory({
    at: new Date().toISOString(),
    cause,
    light,
    dark,
    featherChildEvent,
  });

  window.setTimeout(() => {
    addMessage("kuroo", "奈落は終わりではない。\nおまえがここまで沈んだことだけが、残る。");
    document.body.classList.add("is-naraku-ending");
    narakuOverlayElement.setAttribute("aria-hidden", "false");
  }, NARAKU_FINAL_DELAY_MS);

  window.setTimeout(() => {
    resetSessionState();
    isNarakuSequenceRunning = false;
  }, NARAKU_RESET_DELAY_MS);
}

function addReturnMessageFromHistory() {
  const history = readNarakuHistory();

  if (history.length === 0) {
    return;
  }

  const latest = history[history.length - 1];
  const count = history.length;
  const message =
    count === 1
      ? "……戻ったか。\n奈落に触れたことは、もうこちらに記録されている。"
      : `また来たな。\n奈落の記録は ${count} 度ぶん、まだ剥がれていない。`;

  addMessage("kuroo", latest && latest.featherChildEvent ? `${message}\n羽の気配まで、まだ残っている。` : message);
}

function deriveStateFromBalance() {
  if (light >= CONFLICT_THRESHOLD && dark >= CONFLICT_THRESHOLD) {
    return "kinmourou";
  }

  if (featherChildEvent && light >= FEATHER_ASCENT_THRESHOLD && light >= dark + 2) {
    return "teneirou";
  }

  if (featherChildEvent && dark >= FEATHER_DESCENT_THRESHOLD && dark >= light + 2) {
    return "narakurou";
  }

  if (light >= LIGHT_ASCENT_THRESHOLD && light >= dark + 2) {
    return "getsurou";
  }

  if (dark >= DARK_DESCENT_THRESHOLD && dark >= light + 2) {
    return "gokurou";
  }

  return "kuroo";
}

function triggerStateShiftFx() {
  document.body.classList.remove("is-shifting");
  window.requestAnimationFrame(() => {
    document.body.classList.add("is-shifting");
    window.setTimeout(() => {
      document.body.classList.remove("is-shifting");
    }, 620);
  });
}

function updateState(nextState, options = {}) {
  const { announce = true, transitionText = null, cause = "talk", playVisual = true } = options;
  const changed = currentState !== nextState;

  currentState = nextState;
  document.body.dataset.state = nextState;
  presenceLineElement.textContent = stateMeta[nextState].presence;
  setBreathProfile();
  writeSessionState();

  stateButtonElements.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.state === nextState);
  });

  if (changed) {
    triggerStateShiftFx();
    if (playVisual) {
      showStateVision(nextState);
    }
  }

  if (announce) {
    addMessage(
      "kuroo",
      changed ? transitionText || stateMeta[nextState].opener : stateMeta[nextState].opener
    );
  }

  if (changed && nextState === "narakurou" && !isNarakuSequenceRunning) {
    startNarakuEnding(cause);
  }
}

function applyDebugButtonState() {
  stateButtonElements.forEach((button) => {
    button.disabled = !isDevMode;
    button.setAttribute("aria-disabled", String(!isDevMode));
    button.title = isDevMode ? "debug state control" : "行動による自然変化が優先されています";
  });
}

function applyInfluence(effect, options = {}) {
  if (isNarakuSequenceRunning) {
    return;
  }

  const { announce = false, cause = "talk" } = options;
  const previousState = currentState;

  light += effect.light || 0;
  dark += effect.dark || 0;

  if (effect.feather) {
    featherChildEvent = true;
  }

  const nextState = deriveStateFromBalance();
  updateState(nextState, {
    announce: announce && previousState !== nextState,
    transitionText: randomOf(transitionVoices[cause][nextState]),
    cause,
  });
}

function markActivity() {
  lastActivityAt = Date.now();
}

function startKarmaDrift() {
  if (idleIntervalId) {
    window.clearInterval(idleIntervalId);
  }

  idleIntervalId = window.setInterval(() => {
    const idleTime = Date.now() - lastActivityAt;

    if (idleTime >= IDLE_GRACE_MS) {
      applyInfluence({ dark: 1 }, { announce: true, cause: "idle" });
      lastActivityAt = Date.now();
    }
  }, IDLE_CHECK_MS);
}

function detectSignals(input) {
  const compact = input.replace(/\s+/g, "");
  return {
    asksDirectly: vocabulary.directQuestion.some((word) => input.includes(word)),
    carriesEmotion: vocabulary.emotion.some((word) => input.includes(word)),
    referencesSelf: vocabulary.self.some((word) => input.includes(word)),
    mentionsRelations: vocabulary.relation.some((word) => input.includes(word)),
    mentionsDream: vocabulary.dream.some((word) => input.includes(word)),
    mentionsMemorial: vocabulary.memorial.some((word) => input.includes(word)),
    mentionsFeather: vocabulary.feather.some((word) => input.includes(word)),
    isNoise:
      /^(?:[wWｗ笑!?！？。、…\-_.~ぁあぃいぅうぇえぉおんっ]{1,6}|[a-zA-Z0-9!?._-]{1,8})$/.test(compact) ||
      /(.)\1{3,}/.test(compact),
    short: input.length < 12,
  };
}

function buildReply(input, state) {
  const bank = fragments[state];
  const signals = detectSignals(input);
  const lines = [];

  if (chance(0.38)) {
    lines.push(randomOf(bank.openings));
  }

  if (signals.carriesEmotion || chance(0.56)) {
    lines.push(randomOf(bank.observations));
  }

  if (signals.asksDirectly && chance(0.68)) {
    lines.push(randomOf(bank.evasions));
  } else if (chance(0.34)) {
    lines.push(randomOf(bank.hints));
  }

  if (signals.referencesSelf && chance(0.52)) {
    lines.push(
      state === "gokurou" || state === "narakurou"
        ? "おまえは『おまえ』を多く言いすぎる。輪郭が崩れる。"
        : "自分のことを話しているようで、まだ核心には触れていない。 "
    );
  }

  if (signals.mentionsRelations && chance(0.45)) {
    lines.push(
      state === "getsurou" || state === "teneirou"
        ? "相手を見ているつもりで、おまえは自分の欠けを見ている。"
        : "誰かの名に隠れて、自分の痛みを測っているな。"
    );
  }

  if (signals.mentionsDream && chance(0.5)) {
    lines.push(
      state === "kuroo"
        ? "夜の話は、昼の口ではうまく切れない。"
        : state === "gokurou" || state === "narakurou"
          ? "夢じゃない。\n夢にしているだけだ。"
          : "夜に見たものは、消えたのではない。\n伏せられただけだ。"
    );
  }

  if (signals.short && chance(0.5)) {
    lines.push(
      state === "gokurou" || state === "narakurou"
        ? "短い。\n隠したな。"
        : "少ない言葉ほど、においが残る。"
    );
  }

  if (lines.length === 0) {
    lines.push(randomOf(bank.observations), randomOf(bank.hints));
  }

  const uniqueLines = [...new Set(lines)].slice(0, state === "getsurou" || state === "teneirou" ? 2 : 3);
  return uniqueLines.join("\n");
}

if (isDevMode) {
  stateButtonElements.forEach((button) => {
    button.addEventListener("click", () => {
      const targetState = button.dataset.state;

      light = 0;
      dark = 0;
      featherChildEvent = false;

      if (targetState === "getsurou") {
        light = 5;
      } else if (targetState === "teneirou") {
        light = 7;
        featherChildEvent = true;
      } else if (targetState === "kinmourou") {
        light = 6;
        dark = 6;
      } else if (targetState === "gokurou") {
        dark = 5;
      } else if (targetState === "narakurou") {
        dark = 7;
        featherChildEvent = true;
      }

      markActivity();
      updateState(targetState, { announce: true });
    });
  });
}

chatFormElement.addEventListener("submit", (event) => {
  event.preventDefault();
  if (isNarakuSequenceRunning) {
    return;
  }

  const message = messageInputElement.value.trim();

  if (!message) {
    return;
  }

  addMessage("user", message);
  messageInputElement.value = "";
  markActivity();

  const signals = detectSignals(message);
  let effect = { light: 1, dark: 0, feather: false };
  let cause = "talk";

  if (signals.isNoise) {
    effect = { light: 0, dark: 1, feather: false };
    cause = "noise";
  } else if (signals.mentionsMemorial) {
    effect = { light: 2, dark: 0, feather: false };
    cause = "memorial";
  }

  if (signals.mentionsFeather) {
    effect.feather = true;
    cause = "feather";
  }

  applyInfluence(effect, { announce: true, cause });

  const delay =
    currentState === "gokurou" || currentState === "narakurou"
      ? 420
      : currentState === "getsurou" || currentState === "teneirou"
        ? 820
        : 640;

  messageInputElement.disabled = true;

  window.setTimeout(async () => {
    try {
      const reply = await requestAiReply(message, currentState);
      addMessage("kuroo", reply);
    } catch (error) {
      console.error(error);
      addMessage("kuroo", buildReply(message, currentState));
    } finally {
      messageInputElement.disabled = false;
      messageInputElement.focus();
    }
  }, delay);
});

messageInputElement.addEventListener("input", () => {
  markActivity();
});

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") {
    markActivity();
  }
});

applyDebugButtonState();
setBreathProfile();
scheduleBreathRetune();
restoreSessionState();
updateState(currentState, { announce: true });
restoreStatePresence(currentState);
addReturnMessageFromHistory();
startKarmaDrift();
