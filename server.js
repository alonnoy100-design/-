const express = require("express");
const http = require("http");
const path = require("path");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

const MAX_PLAYERS = 7;
const rooms = {};

const QUESTION_BANK = {
  "כללי": [
    ["איזה כוח-על היית רוצה לקבל?", "איזה כוח-על הכי מפחיד אותך?"],
    ["לאן היית רוצה לטוס?", "לאן לא היית רוצה לטוס?"],
    ["איזו חיה היית רוצה לגדל?", "איזו חיה הכי מפחידה אותך?"],
    ["איזה אוכל אתה הכי אוהב?", "איזה אוכל אתה לא מוכן לאכול?"],
    ["איזה צבע הכי יפה?", "איזה צבע הכי מכוער?"],
    ["איזה יום בשבוע הכי טוב?", "איזה יום בשבוע הכי גרוע?"],
    ["איזה מקום הכי כיף להיות בו?", "איזה מקום הכי משעמם להיות בו?"],
    ["איזה דבר היית קונה ראשון אם היית עשיר?", "איזה דבר לא היית קונה גם אם היית עשיר?"],
    ["איזה דבר מצחיק אותך תמיד?", "איזה דבר מעצבן אותך תמיד?"],
    ["איזה כישרון היית רוצה?", "איזה כישרון לא שימושי לדעתך?"]
  ],

  "משפחה": [
    ["מי במשפחה הכי מצחיק?", "מי במשפחה הכי רציני?"],
    ["מי הכי מאחר?", "מי תמיד מגיע בזמן?"],
    ["מי הכי טוב במשחקים?", "מי הכי גרוע במשחקים?"],
    ["מי הכי אוהב לאכול?", "מי הכי בררן באוכל?"],
    ["מי הכי מסודר?", "מי הכי מבולגן?"],
    ["מי הכי מצחיק כשהוא כועס?", "מי הכי שקט כשהוא כועס?"],
    ["מי הכי הרבה בטלפון?", "מי הכי פחות בטלפון?"],
    ["מי הכי אוהב לטייל?", "מי הכי אוהב להישאר בבית?"]
  ],

  "גיימינג": [
    ["איזה משחק אתה יכול לשחק שעות?", "איזה משחק משעמם אותך מהר?"],
    ["איזה נשק במשחקים הכי מגניב?", "איזה נשק במשחקים הכי גרוע?"],
    ["איזו דמות ממשחק היית רוצה להיות?", "איזו דמות לא היית רוצה להיות?"],
    ["איזה משחק הכי נוסטלגי?", "איזה משחק הכי אוברייטד?"],
    ["איזה בוס במשחק הכי קשה?", "איזה בוס במשחק הכי קל?"],
    ["איזה משחק היית יוצר?", "איזה משחק לא היית יוצר?"],
    ["איזה סקין הכי יפה?", "איזה סקין הכי מכוער?"],
    ["איזה משחק הכי מתאים לשחק עם חברים?", "איזה משחק הכי מתאים לשחק לבד?"]
  ],

  "רובלוקס": [
    ["איזה משחק רובלוקס הכי טוב?", "איזה משחק רובלוקס הכי משעמם?"],
    ["איזה כוח היית רוצה ברובלוקס?", "איזה כוח היה הורס משחק?"],
    ["איזה אווטאר הכי מגניב?", "איזה אווטאר הכי מוזר?"],
    ["איזה משחק היית יוצר ברובלוקס?", "איזה משחק לא היית יוצר?"],
    ["איזה פריט היית קונה עם רובקס?", "איזה פריט לא היית לובש?"],
    ["איזה גיים פאס הכי שווה?", "איזה גיים פאס הכי מיותר?"],
    ["איזה ז׳אנר רובלוקס הכי כיף?", "איזה ז׳אנר רובלוקס הכי חרוש?"],
    ["איזה דבר הכי כיף בסטודיו?", "איזה דבר הכי קשה בסטודיו?"]
  ],

  "פוקימון": [
    ["איזה פוקימון היית רוצה לתפוס?", "איזה פוקימון לא היית רוצה לפגוש?"],
    ["איזה סוג פוקימון הכי חזק?", "איזה סוג פוקימון הכי חלש?"],
    ["איזה פוקימון הכי חמוד?", "איזה פוקימון הכי מפחיד?"],
    ["איזו מתקפה הכי מגניבה?", "איזו מתקפה הכי גרועה?"],
    ["איזה פוקימון אגדי הכי טוב?", "איזה פוקימון אגדי הכי פחות מעניין?"],
    ["איזה פוקימון היית שם בקבוצה?", "איזה פוקימון לא היית שם בקבוצה?"],
    ["איזה שייני הכי יפה?", "איזה שייני הכי מאכזב?"],
    ["איזה אזור בפוקימון הכי טוב?", "איזה אזור בפוקימון הכי פחות טוב?"]
  ],

  "בית ספר": [
    ["איזה שיעור הכי כיף?", "איזה שיעור הכי קשה?"],
    ["איזה מקצוע הכי קל?", "איזה מקצוע הכי מלחיץ?"],
    ["מה הדבר הכי טוב בהפסקה?", "מה הדבר הכי מעצבן בהפסקה?"],
    ["איזה חוק בית ספר היית משנה?", "איזה חוק בית ספר היית משאיר?"],
    ["איזה טיול שנתי הכי כיף?", "איזה מבחן הכי מלחיץ?"],
    ["איזה מורה הכי מצחיק?", "איזה מורה הכי קשוח?"],
    ["איזה שיעור היית מלמד?", "איזה שיעור לא היית מלמד?"],
    ["מה הכי כיף ביום קצר?", "מה הכי מבאס ביום ארוך?"]
  ],

  "אוכל": [
    ["איזה אוכל הכי טעים?", "איזה אוכל הכי מגעיל?"],
    ["איזו פיצה הכי טובה?", "איזו תוספת לפיצה הכי גרועה?"],
    ["איזה קינוח הכי טוב?", "איזה קינוח לא היית אוכל?"],
    ["איזה משקה הכי טעים?", "איזה משקה הכי מוזר?"],
    ["איזה אוכל מתאים למסיבה?", "איזה אוכל הורס מסיבה?"],
    ["איזה טעם גלידה הכי טוב?", "איזה טעם גלידה הכי מוזר?"],
    ["איזה אוכל היית אוכל כל יום?", "איזה אוכל לא היית אוכל בחיים?"],
    ["איזה חטיף הכי טוב?", "איזה חטיף הכי גרוע?"]
  ],

  "חיות": [
    ["איזו חיה הכי חכמה?", "איזו חיה הכי טיפשה?"],
    ["איזו חיה היית רוצה לגדל?", "איזו חיה לא היית מגדל?"],
    ["איזו חיה הכי יפה?", "איזו חיה הכי מפחידה?"],
    ["איזו חיה הכי מצחיקה?", "איזו חיה הכי רצינית?"],
    ["איזו חיה היית רוצה להיות ליום?", "איזו חיה לא היית רוצה להיות?"],
    ["איזו חיה הכי מהירה?", "איזו חיה הכי עצלנית?"],
    ["איזו חיה מתאימה לגיבור?", "איזו חיה מתאימה לנבל?"],
    ["איזו חיה הכי חמודה?", "איזו חיה הכי מוזרה?"]
  ],

  "סרטים וסדרות": [
    ["איזה סרט היית רואה שוב?", "איזה סרט לא תראה שוב?"],
    ["איזו סדרה הכי טובה?", "איזו סדרה הכי משעממת?"],
    ["איזו דמות הכי מגניבה?", "איזו דמות הכי מעצבנת?"],
    ["איזה נבל הכי טוב?", "איזה נבל הכי חלש?"],
    ["איזה סרט הכי מצחיק?", "איזה סרט הכי מפחיד?"],
    ["איזו סדרה מגיע לה עוד עונה?", "איזו סדרה הייתה צריכה להיגמר?"],
    ["איזה גיבור הכי טוב?", "איזה גיבור הכי אוברייטד?"],
    ["איזה סרט מתאים לחברים?", "איזה סרט לא מתאים לחברים?"]
  ],

  "מוזיקה": [
    ["איזה שיר הכי טוב?", "איזה שיר הכי חרוש?"],
    ["איזה זמר היית פוגש?", "איזה זמר לא היית שומע?"],
    ["איזה כלי נגינה הכי מגניב?", "איזה כלי נגינה הכי קשה?"],
    ["איזה שיר מתאים למסיבה?", "איזה שיר מתאים לשינה?"],
    ["איזה סגנון מוזיקה הכי כיף?", "איזה סגנון מוזיקה פחות מתאים לך?"],
    ["איזה שיר היית שר בקריוקי?", "איזה שיר לא היית שר?"],
    ["איזה זמר הכי מצחיק?", "איזה זמר הכי רציני?"],
    ["איזה שיר תמיד עושה מצב רוח?", "איזה שיר מעצבן אותך?"]
  ],

  "ספורט": [
    ["איזה ספורט הכי כיף?", "איזה ספורט הכי קשה?"],
    ["איזה שחקן הכי טוב?", "איזה שחקן הכי אוברייטד?"],
    ["איזה ספורט היית רוצה לנסות?", "איזה ספורט לא היית מנסה?"],
    ["איזה ספורט הכי מתאים לקיץ?", "איזה ספורט הכי מתאים לחורף?"],
    ["איזה ספורט הכי טוב עם חברים?", "איזה ספורט הכי מסוכן?"],
    ["איזו קבוצה הכי טובה?", "איזו קבוצה הכי מעצבנת?"],
    ["איזה ספורט הכי מהיר?", "איזה ספורט הכי מעייף?"],
    ["איזה ספורט היית רואה בטלוויזיה?", "איזה ספורט לא היית רואה?"]
  ],

  "טיקטוק ואינטרנט": [
    ["איזה טרנד הכי מצחיק?", "איזה טרנד הכי מביך?"],
    ["איזה יוטיובר היית פוגש?", "איזה יוטיובר לא היית רואה?"],
    ["איזה סרטון תמיד מצחיק אותך?", "איזה סרטון מעצבן אותך?"],
    ["איזה אתגר היית עושה?", "איזה אתגר לא היית עושה?"],
    ["איזה אימוג׳י הכי מתאים לך?", "איזה אימוג׳י הכי מוזר?"],
    ["איזה פילטר הכי טוב?", "איזה פילטר הכי גרוע?"],
    ["איזה דבר באינטרנט הכי עוזר?", "איזה דבר באינטרנט הכי מבזבז זמן?"],
    ["איזה מם הכי מצחיק?", "איזה מם כבר נמאס?"]
  ],

  "מדע וחלל": [
    ["לאיזה כוכב היית טס?", "לאיזה כוכב לא היית טס?"],
    ["איזה דבר בחלל הכי מגניב?", "איזה דבר בחלל הכי מפחיד?"],
    ["איזו המצאה עתידית היית רוצה?", "איזו המצאה עתידית מפחידה אותך?"],
    ["איזה רובוט היית רוצה בבית?", "איזה רובוט לא היית רוצה בבית?"],
    ["איזה ניסוי היית עושה?", "איזה ניסוי לא היית עושה?"],
    ["איזה חייזר היית פוגש?", "איזה חייזר לא היית פוגש?"],
    ["איזה כוכב הכי יפה?", "איזה כוכב הכי מוזר?"],
    ["איזה דבר במדע הכי מעניין?", "איזה דבר במדע הכי מסובך?"]
  ],

  "מצחיק": [
    ["איזה שם הכי מצחיק לכלב?", "איזה שם הכי מצחיק למורה?"],
    ["איזה כובע הכי מצחיק?", "איזה בגד הכי מוזר?"],
    ["איזו חיה הכי מצחיקה?", "איזו חיה נראית הכי רצינית?"],
    ["איזה ריקוד הכי מצחיק?", "איזה ריקוד הכי מביך?"],
    ["איזה כוח-על הכי מצחיק?", "איזה כוח-על הכי useless?"],
    ["איזה אוכל נראה מצחיק?", "איזה אוכל נראה מפחיד?"],
    ["איזה משפט הכי מצחיק?", "איזה משפט הכי מוזר?"],
    ["איזה דבר הכי מצחיק לעשות עם חברים?", "איזה דבר הכי מביך לעשות עם חברים?"]
  ]
};

// מגדיל את המאגר למאות שאלות דרך שילובים
for (const topic of Object.keys(QUESTION_BANK)) {
  const base = [...QUESTION_BANK[topic]];
  for (let i = 0; i < 3; i++) {
    for (const pair of base) {
      QUESTION_BANK[topic].push([
        pair[0] + " ולמה?",
        pair[1] + " ולמה?"
      ]);
    }
  }
}

function makeCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  do {
    code = "";
    for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  } while (rooms[code]);
  return code;
}

function getPublicRoom(room) {
  return {
    code: room.code,
    hostId: room.hostId,
    phase: room.phase,
    round: room.round,
    settings: room.settings,
    question: room.publicQuestion,
    answers: room.settings.mode === "remote" ? room.answers : {},
    votes: room.votes,
    result: room.result,
    players: Object.values(room.players).map(p => ({
      id: p.id,
      name: p.name,
      score: p.score,
      ready: p.ready
    }))
  };
}

function emitRoom(room) {
  io.to(room.code).emit("roomUpdate", getPublicRoom(room));
}

function pickQuestion(room) {
  let topics = room.settings.topics.length ? room.settings.topics : Object.keys(QUESTION_BANK);
  let pool = [];

  for (const topic of topics) {
    const list = QUESTION_BANK[topic];
    if (!list) continue;
    for (const pair of list) pool.push({ topic, normal: pair[0], liar: pair[1] });
  }

  if (!pool.length) {
    pool = QUESTION_BANK["כללי"].map(pair => ({ topic: "כללי", normal: pair[0], liar: pair[1] }));
  }

  let unused = pool.filter(q => !room.usedQuestions.includes(q.normal + "|" + q.liar));
  if (!unused.length) {
    room.usedQuestions = [];
    unused = pool;
  }

  const q = unused[Math.floor(Math.random() * unused.length)];
  room.usedQuestions.push(q.normal + "|" + q.liar);
  return q;
}

function startRound(room) {
  const playerIds = Object.keys(room.players);
  const q = pickQuestion(room);

  room.phase = "answering";
  room.answers = {};
  room.votes = {};
  room.result = null;
  room.readyVotes = {};
  room.currentQuestion = q;
  room.publicQuestion = { topic: q.topic };
  room.liarId = playerIds[Math.floor(Math.random() * playerIds.length)];

  for (const id of playerIds) {
    io.to(id).emit("privateQuestion", {
      question: id === room.liarId ? q.liar : q.normal,
      isLiar: id === room.liarId,
      topic: q.topic,
      round: room.round,
      totalRounds: room.settings.rounds
    });
  }

  emitRoom(room);
}

function finishVoting(room) {
  if (room.phase !== "voting") return;

  room.phase = "results";

  const voteCounts = {};
  for (const targetId of Object.values(room.votes)) {
    voteCounts[targetId] = (voteCounts[targetId] || 0) + 1;
  }

  let mostVotedId = null;
  let maxVotes = -1;

  for (const [id, count] of Object.entries(voteCounts)) {
    if (count > maxVotes) {
      maxVotes = count;
      mostVotedId = id;
    }
  }

  const caught = mostVotedId === room.liarId;

  if (caught) {
    for (const id of Object.keys(room.players)) {
      if (id !== room.liarId) room.players[id].score += 5;
    }
  } else if (room.players[room.liarId]) {
    room.players[room.liarId].score += 5;
  }

  room.result = {
    caught,
    liarId: room.liarId,
    liarName: room.players[room.liarId]?.name || "לא ידוע",
    mostVotedId,
    mostVotedName: room.players[mostVotedId]?.name || "לא נבחר",
    voteCounts
  };

  emitRoom(room);
}

io.on("connection", socket => {
  socket.on("createRoom", (data, callback) => {
    const name = String(data?.name || "שחקן").slice(0, 18).trim() || "שחקן";
    const settings = data?.settings || {};
    const code = makeCode();

    const room = {
      code,
      hostId: socket.id,
      phase: "lobby",
      round: 0,
      players: {},
      answers: {},
      votes: {},
      readyVotes: {},
      result: null,
      currentQuestion: null,
      publicQuestion: null,
      liarId: null,
      usedQuestions: [],
      settings: {
        mode: settings.mode === "near" ? "near" : "remote",
        maxPlayers: Math.min(Math.max(Number(settings.maxPlayers) || 7, 2), MAX_PLAYERS),
        rounds: Math.min(Math.max(Number(settings.rounds) || 7, 3), 30),
        answerSeconds: Math.min(Math.max(Number(settings.answerSeconds) || 45, 15), 180),
        voteSeconds: Math.min(Math.max(Number(settings.voteSeconds) || 30, 10), 90),
        topics: Array.isArray(settings.topics) ? settings.topics.filter(t => QUESTION_BANK[t]) : []
      }
    };

    room.players[socket.id] = {
      id: socket.id,
      name,
      score: 0,
      ready: false
    };

    rooms[code] = room;
    socket.join(code);
    socket.data.roomCode = code;

    callback?.({ ok: true, code, room: getPublicRoom(room) });
    emitRoom(room);
  });

  socket.on("joinRoom", (data, callback) => {
    const code = String(data?.code || "").toUpperCase().trim();
    const name = String(data?.name || "שחקן").slice(0, 18).trim() || "שחקן";
    const room = rooms[code];

    if (!room) return callback?.({ ok: false, error: "לא נמצא חדר עם הקוד הזה" });
    if (room.phase !== "lobby") return callback?.({ ok: false, error: "המשחק כבר התחיל" });
    if (Object.keys(room.players).length >= room.settings.maxPlayers) {
      return callback?.({ ok: false, error: "החדר מלא" });
    }

    room.players[socket.id] = {
      id: socket.id,
      name,
      score: 0,
      ready: false
    };

    socket.join(code);
    socket.data.roomCode = code;

    callback?.({ ok: true, code, room: getPublicRoom(room) });
    emitRoom(room);
  });

  socket.on("setReady", (data, callback) => {
    const room = rooms[data?.code];
    if (!room || !room.players[socket.id]) return;

    room.players[socket.id].ready = !room.players[socket.id].ready;
    emitRoom(room);
    callback?.({ ok: true });
  });

  socket.on("startGame", (data, callback) => {
    const room = rooms[data?.code];
    if (!room || room.hostId !== socket.id) return callback?.({ ok: false, error: "רק המארח יכול להתחיל" });

    const count = Object.keys(room.players).length;
    if (count < 2) return callback?.({ ok: false, error: "צריך לפחות 2 שחקנים" });

    room.round = 1;
    startRound(room);
    callback?.({ ok: true });
  });

  socket.on("sendAnswer", (data, callback) => {
    const room = rooms[data?.code];
    if (!room || room.phase !== "answering" || !room.players[socket.id]) return;

    room.answers[socket.id] = {
      playerId: socket.id,
      name: room.players[socket.id].name,
      text: String(data?.answer || "").slice(0, 300)
    };

    emitRoom(room);
    callback?.({ ok: true });
  });

  socket.on("readyForVoting", (data, callback) => {
    const room = rooms[data?.code];
    if (!room || room.phase !== "answering" || !room.players[socket.id]) return;

    room.readyVotes[socket.id] = true;

    const playersCount = Object.keys(room.players).length;
    const readyCount = Object.keys(room.readyVotes).length;

    if (readyCount >= Math.ceil(playersCount / 2)) {
      room.phase = "voting";
      room.votes = {};
      emitRoom(room);

      clearTimeout(room.voteTimer);
      room.voteTimer = setTimeout(() => finishVoting(room), room.settings.voteSeconds * 1000);
    } else {
      emitRoom(room);
    }

    callback?.({ ok: true });
  });

  socket.on("startVoting", (data, callback) => {
    const room = rooms[data?.code];
    if (!room || room.hostId !== socket.id || room.phase !== "answering") return;

    room.phase = "voting";
    room.votes = {};
    emitRoom(room);

    clearTimeout(room.voteTimer);
    room.voteTimer = setTimeout(() => finishVoting(room), room.settings.voteSeconds * 1000);

    callback?.({ ok: true });
  });

  socket.on("vote", (data, callback) => {
    const room = rooms[data?.code];
    const targetId = data?.targetId;

    if (!room || room.phase !== "voting" || !room.players[socket.id]) return;
    if (!room.players[targetId] || targetId === socket.id) return;

    room.votes[socket.id] = targetId;
    emitRoom(room);

    const playersCount = Object.keys(room.players).length;
    const votesCount = Object.keys(room.votes).length;

    if (votesCount >= playersCount) finishVoting(room);

    callback?.({ ok: true });
  });

  socket.on("nextRound", (data, callback) => {
    const room = rooms[data?.code];
    if (!room || room.hostId !== socket.id || room.phase !== "results") return;

    if (room.round >= room.settings.rounds) {
      room.phase = "finished";
      emitRoom(room);
      return callback?.({ ok: true });
    }

    room.round += 1;
    startRound(room);
    callback?.({ ok: true });
  });

  socket.on("disconnect", () => {
    const code = socket.data.roomCode;
    const room = rooms[code];
    if (!room) return;

    delete room.players[socket.id];
    delete room.answers[socket.id];
    delete room.votes[socket.id];
    delete room.readyVotes[socket.id];

    if (room.hostId === socket.id) {
      room.hostId = Object.keys(room.players)[0];
    }

    if (Object.keys(room.players).length === 0) {
      clearTimeout(room.voteTimer);
      delete rooms[code];
    } else {
      emitRoom(room);
    }
  });
});

server.listen(3000, () => {
  console.log("MiHaShakran full online server running: http://localhost:3000");
});
