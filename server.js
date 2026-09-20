const path = require("node:path");
const crypto = require("node:crypto");
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const { Pool } = require("pg");
require("dotenv").config();

const app = express();
const port = Number(process.env.PORT || 3000);
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const SESSION_COOKIE = "xedra_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30;
const isProduction = process.env.NODE_ENV === "production" || Boolean(process.env.RENDER);

const PUBLIC_FILES = new Set([
  "style.css",
  "script.js",
  "xedra.png",
  "noFilter.png",
  "Firefly_RemoveBackground.png",
  "Firefly_Gemini_Flash_remove_the_backround_284772-removebg-preview.png"
]);

app.use(cors());
app.use(express.json());

// Only ever serve the whitelist below. Serving the whole project folder would
// expose server.js, package.json, and any .env file that lands in this directory.
app.use((request, response, next) => {
  if (request.method !== "GET") {
    return next();
  }
  if (request.path === "/" || request.path === "/index.html") {
    return response.sendFile(path.join(__dirname, "index.html"));
  }
  let fileName;
  try {
    fileName = path.basename(decodeURIComponent(request.path));
  } catch {
    return next();
  }
  if (PUBLIC_FILES.has(fileName)) {
    return response.sendFile(path.join(__dirname, fileName));
  }
  return next();
});

function readCookie(request, name) {
  const header = request.headers.cookie;
  if (!header) {
    return null;
  }
  for (const part of header.split(";")) {
    const index = part.indexOf("=");
    if (index === -1) {
      continue;
    }
    if (part.slice(0, index).trim() === name) {
      return decodeURIComponent(part.slice(index + 1).trim());
    }
  }
  return null;
}

function setSessionCookie(response, token) {
  const secure = isProduction ? "; Secure" : "";
  response.setHeader(
    "Set-Cookie",
    `${SESSION_COOKIE}=${token}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${SESSION_TTL_SECONDS}${secure}`
  );
}

function clearSessionCookie(response) {
  response.setHeader("Set-Cookie", `${SESSION_COOKIE}=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0`);
}

async function createSession(response, userId) {
  const token = crypto.randomBytes(32).toString("hex");
  await pool.query("INSERT INTO sessions (token, user_id) VALUES ($1, $2)", [token, userId]);
  setSessionCookie(response, token);
}

const USER_COLUMNS = `u.id, u.username, u.birthday::text AS birthday, u.gender, u.blurb, u.preferences, u.robux, u.created_at`;
const USER_SELECT = `SELECT ${USER_COLUMNS} FROM users u`;

function normalizeUser(row) {
  const genderMap = { girl: "female", boy: "male" };
  return {
    id: row.id,
    username: row.username,
    birthday: row.birthday,
    gender: genderMap[row.gender] || row.gender || null,
    blurb: row.blurb || "",
    preferences: row.preferences || {},
    robux: row.robux,
    createdAt: row.created_at
  };
}

async function requireAuth(request, response, next) {
  try {
    const token = readCookie(request, SESSION_COOKIE);
    if (!token) {
      return response.status(401).json({ error: "Not signed in." });
    }
    const result = await pool.query(
      `${USER_SELECT} JOIN sessions s ON s.user_id = u.id WHERE s.token = $1`,
      [token]
    );
    const user = result.rows[0];
    if (!user) {
      return response.status(401).json({ error: "Your session expired. Please log in again." });
    }
    request.sessionToken = token;
    request.user = normalizeUser(user);
    return next();
  } catch (error) {
    console.error(error);
    return response.status(500).json({ error: "Could not verify your session." });
  }
}

async function migrate() {
  await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS blurb TEXT NOT NULL DEFAULT ''`);
  await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS preferences JSONB NOT NULL DEFAULT '{}'::jsonb`);
  await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS robux INTEGER NOT NULL DEFAULT 500`);
  await pool.query(`CREATE TABLE IF NOT EXISTS sessions (
    token TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`);
  await pool.query(`CREATE INDEX IF NOT EXISTS sessions_user_id_idx ON sessions (user_id)`);
  await pool.query(`CREATE TABLE IF NOT EXISTS friend_requests (
    id SERIAL PRIMARY KEY,
    requester_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    addressee_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (requester_id, addressee_id)
  )`);
  await pool.query(`CREATE TABLE IF NOT EXISTS friendships (
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    friend_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, friend_id)
  )`);
  await pool.query(`CREATE TABLE IF NOT EXISTS follows (
    follower_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    followee_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (follower_id, followee_id)
  )`);
}

app.post("/api/signup", async (request, response) => {
  const { username, password, birthday, gender } = request.body;

  if (!username || !password || !birthday) {
    return response.status(400).json({ error: "Username, password, and birthday are required." });
  }
  if (username.trim().length < 3 || !/^[A-Za-z0-9_]+$/.test(username.trim())) {
    return response.status(400).json({ error: "Username must be 3+ characters using only letters, numbers, or underscores." });
  }
  if (password.length < 8) {
    return response.status(400).json({ error: "Password must be at least 8 characters." });
  }

  try {
    const passwordHash = await bcrypt.hash(password, 12);
    const result = await pool.query(
      `INSERT INTO users (username, password_hash, birthday, gender)
       VALUES ($1, $2, $3, $4)
       RETURNING id, username, birthday, gender, created_at, robux`,
      [username.trim(), passwordHash, birthday, gender || null]
    );
    await createSession(response, result.rows[0].id);
    return response.status(201).json({ user: normalizeUser(result.rows[0]) });
  } catch (error) {
    if (error.code === "23505") {
      return response.status(409).json({ error: "That username is already taken." });
    }
    console.error(error);
    return response.status(500).json({ error: "Could not create the account." });
  }
});

app.post("/api/login", async (request, response) => {
  const { username, password } = request.body;

  if (!username || !password) {
    return response.status(400).json({ error: "Username and password are required." });
  }

  try {
    const result = await pool.query(
      `SELECT ${USER_COLUMNS}, u.password_hash FROM users u WHERE u.username = $1`,
      [username.trim()]
    );
    const user = result.rows[0];
    const passwordMatches = user && await bcrypt.compare(password, user.password_hash);

    if (!passwordMatches) {
      return response.status(401).json({ error: "Invalid username or password." });
    }
    await pool.query("UPDATE users SET robux = 500 WHERE id = $1", [user.id]);
    await createSession(response, user.id);
    const fullUser = await pool.query(`${USER_SELECT} WHERE u.id = $1`, [user.id]);
    return response.json({ user: normalizeUser(fullUser.rows[0]) });
  } catch (error) {
    console.error(error);
    return response.status(500).json({ error: "Could not log in." });
  }
});

app.post("/api/logout", async (request, response) => {
  try {
    const token = readCookie(request, SESSION_COOKIE);
    if (token) {
      await pool.query("DELETE FROM sessions WHERE token = $1", [token]);
    }
    clearSessionCookie(response);
    return response.json({ ok: true });
  } catch (error) {
    console.error(error);
    return response.status(500).json({ error: "Could not log out." });
  }
});

app.get("/api/me", requireAuth, (request, response) => {
  return response.json({ user: request.user });
});

app.put("/api/me", requireAuth, async (request, response) => {
  const { blurb, birthday, gender, preferences } = request.body || {};
  const updates = [];
  const values = [];
  let index = 1;

  if (typeof blurb === "string") {
    updates.push(`blurb = $${index++}`);
    values.push(blurb.slice(0, 1000));
  }
  if (typeof birthday === "string" && /^\d{4}-\d{2}-\d{2}$/.test(birthday)) {
    updates.push(`birthday = $${index++}`);
    values.push(birthday);
  }
  if (gender === null || gender === "male" || gender === "female") {
    updates.push(`gender = $${index++}`);
    values.push(gender);
  }
  if (preferences && typeof preferences === "object" && !Array.isArray(preferences)) {
    updates.push(`preferences = preferences || $${index++}::jsonb`);
    values.push(JSON.stringify(preferences));
  }

  if (!updates.length) {
    return response.status(400).json({ error: "Nothing to update." });
  }

  try {
    values.push(request.user.id);
    await pool.query(`UPDATE users SET ${updates.join(", ")} WHERE id = $${index}`, values);
    const result = await pool.query(`${USER_SELECT} WHERE u.id = $1`, [request.user.id]);
    return response.json({ user: normalizeUser(result.rows[0]) });
  } catch (error) {
    console.error(error);
    return response.status(500).json({ error: "Could not save your settings." });
  }
});

app.get("/api/users/search", requireAuth, async (request, response) => {
  const query = typeof request.query.q === "string" ? request.query.q.trim() : "";
  if (!query) {
    return response.json({ users: [] });
  }
  try {
    const escaped = query.replace(/[\\%_]/g, (character) => `\\${character}`);
    const result = await pool.query(
      `SELECT u.id, u.username,
          EXISTS(SELECT 1 FROM friendships f WHERE f.user_id = $2 AND f.friend_id = u.id) AS is_friend,
          EXISTS(SELECT 1 FROM friend_requests r WHERE r.requester_id = $2 AND r.addressee_id = u.id) AS request_sent,
          EXISTS(SELECT 1 FROM follows fl WHERE fl.follower_id = $2 AND fl.followee_id = u.id) AS is_following
        FROM users u
        WHERE u.username ILIKE $1 ESCAPE '\\' AND u.id <> $2
        ORDER BY u.username LIMIT 20`,
      [`%${escaped}%`, request.user.id]
    );
    return response.json({ users: result.rows });
  } catch (error) {
    console.error(error);
    return response.status(500).json({ error: "Could not search players." });
  }
});

app.get("/api/friends", requireAuth, async (request, response) => {
  const me = request.user.id;
  try {
    const incoming = await pool.query(
      `SELECT fr.id AS request_id, u.id, u.username, fr.created_at
       FROM friend_requests fr JOIN users u ON u.id = fr.requester_id
       WHERE fr.addressee_id = $1 ORDER BY fr.created_at DESC`,
      [me]
    );
    const friends = await pool.query(
      `SELECT u.id, u.username, f.created_at AS friend_since
       FROM friendships f JOIN users u ON u.id = f.friend_id
       WHERE f.user_id = $1 ORDER BY u.username`,
      [me]
    );
    const followers = await pool.query(
      `SELECT u.id, u.username, fo.created_at,
         EXISTS(SELECT 1 FROM follows fl WHERE fl.follower_id = $1 AND fl.followee_id = u.id) AS following_back,
         EXISTS(SELECT 1 FROM friendships fr WHERE fr.user_id = $1 AND fr.friend_id = u.id) AS is_friend
       FROM follows fo JOIN users u ON u.id = fo.follower_id
       WHERE fo.followee_id = $1 ORDER BY fo.created_at DESC`,
      [me]
    );
    const following = await pool.query(
      `SELECT u.id, u.username, fo.created_at
       FROM follows fo JOIN users u ON u.id = fo.followee_id
       WHERE fo.follower_id = $1 ORDER BY fo.created_at DESC`,
      [me]
    );
    return response.json({
      requests: incoming.rows,
      friends: friends.rows,
      followers: followers.rows,
      following: following.rows
    });
  } catch (error) {
    console.error(error);
    return response.status(500).json({ error: "Could not load friends." });
  }
});

app.post("/api/friends/requests", requireAuth, async (request, response) => {
  const targetId = Number(request.body && request.body.userId);
  const me = request.user.id;
  if (!Number.isInteger(targetId)) {
    return response.status(400).json({ error: "A valid user is required." });
  }
  if (targetId === me) {
    return response.status(400).json({ error: "You cannot add yourself as a friend." });
  }
  try {
    const target = await pool.query("SELECT id FROM users WHERE id = $1", [targetId]);
    if (!target.rows[0]) {
      return response.status(404).json({ error: "User not found." });
    }
    const alreadyFriends = await pool.query(
      "SELECT 1 FROM friendships WHERE user_id = $1 AND friend_id = $2",
      [me, targetId]
    );
    if (alreadyFriends.rows[0]) {
      return response.status(409).json({ error: "You are already friends with this user." });
    }
    const alreadyRequested = await pool.query(
      "SELECT 1 FROM friend_requests WHERE requester_id = $1 AND addressee_id = $2",
      [me, targetId]
    );
    if (alreadyRequested.rows[0]) {
      return response.status(409).json({ error: "Friend request already sent." });
    }
    const reverseRequest = await pool.query(
      "SELECT 1 FROM friend_requests WHERE requester_id = $1 AND addressee_id = $2",
      [targetId, me]
    );
    if (reverseRequest.rows[0]) {
      return response.status(409).json({ error: "This user already sent you a request. Check your Friend Requests." });
    }
    await pool.query(
      "INSERT INTO friend_requests (requester_id, addressee_id) VALUES ($1, $2)",
      [me, targetId]
    );
    return response.status(201).json({ ok: true });
  } catch (error) {
    console.error(error);
    return response.status(500).json({ error: "Could not send the friend request." });
  }
});

async function respondToFriendRequest(request, response, accept) {
  const requestId = Number(request.params.id);
  const me = request.user.id;
  if (!Number.isInteger(requestId)) {
    return response.status(400).json({ error: "A valid request is required." });
  }
  try {
    const result = await pool.query(
      "DELETE FROM friend_requests WHERE id = $1 AND addressee_id = $2 RETURNING requester_id",
      [requestId, me]
    );
    const row = result.rows[0];
    if (!row) {
      return response.status(404).json({ error: "Request not found." });
    }
    if (accept) {
      await pool.query(
        "INSERT INTO friendships (user_id, friend_id) VALUES ($1, $2), ($2, $1) ON CONFLICT DO NOTHING",
        [me, row.requester_id]
      );
    }
    return response.json({ ok: true });
  } catch (error) {
    console.error(error);
    return response.status(500).json({ error: accept ? "Could not accept the request." : "Could not decline the request." });
  }
}

app.post("/api/friends/requests/:id/accept", requireAuth, (request, response) => {
  return respondToFriendRequest(request, response, true);
});

app.post("/api/friends/requests/:id/decline", requireAuth, (request, response) => {
  return respondToFriendRequest(request, response, false);
});

app.post("/api/follows", requireAuth, async (request, response) => {
  const targetId = Number(request.body && request.body.userId);
  const me = request.user.id;
  if (!Number.isInteger(targetId)) {
    return response.status(400).json({ error: "A valid user is required." });
  }
  if (targetId === me) {
    return response.status(400).json({ error: "You cannot follow yourself." });
  }
  try {
    const target = await pool.query("SELECT id FROM users WHERE id = $1", [targetId]);
    if (!target.rows[0]) {
      return response.status(404).json({ error: "User not found." });
    }
    await pool.query(
      "INSERT INTO follows (follower_id, followee_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
      [me, targetId]
    );
    return response.status(201).json({ ok: true });
  } catch (error) {
    console.error(error);
    return response.status(500).json({ error: "Could not follow this user." });
  }
});

app.delete("/api/friends/:userId", requireAuth, async (request, response) => {
  const targetId = Number(request.params.userId);
  if (!Number.isInteger(targetId)) {
    return response.status(400).json({ error: "A valid user is required." });
  }
  try {
    await pool.query(
      "DELETE FROM friendships WHERE (user_id = $1 AND friend_id = $2) OR (user_id = $2 AND friend_id = $1)",
      [request.user.id, targetId]
    );
    return response.json({ ok: true });
  } catch (error) {
    console.error(error);
    return response.status(500).json({ error: "Could not unfriend this user." });
  }
});

app.delete("/api/follows/:userId", requireAuth, async (request, response) => {
  const targetId = Number(request.params.userId);
  if (!Number.isInteger(targetId)) {
    return response.status(400).json({ error: "A valid user is required." });
  }
  try {
    await pool.query(
      "DELETE FROM follows WHERE follower_id = $1 AND followee_id = $2",
      [request.user.id, targetId]
    );
    return response.json({ ok: true });
  } catch (error) {
    console.error(error);
    return response.status(500).json({ error: "Could not unfollow this user." });
  }
});

app.put("/api/me/username", requireAuth, async (request, response) => {
  const { newUsername, password } = request.body || {};
  const username = typeof newUsername === "string" ? newUsername.trim() : "";

  if (username.length < 3 || !/^[A-Za-z0-9_]+$/.test(username)) {
    return response.status(400).json({ error: "Username must be 3+ characters using only letters, numbers, or underscores." });
  }
  if (typeof password !== "string" || !password) {
    return response.status(400).json({ error: "Confirm your password to change your username." });
  }

  try {
    const hashResult = await pool.query("SELECT password_hash FROM users WHERE id = $1", [request.user.id]);
    const passwordMatches = await bcrypt.compare(password, hashResult.rows[0].password_hash);
    if (!passwordMatches) {
      return response.status(401).json({ error: "Password is incorrect." });
    }
    const result = await pool.query(
      "UPDATE users SET username = $1 WHERE id = $2 RETURNING id, username",
      [username, request.user.id]
    );
    return response.json({ user: result.rows[0] });
  } catch (error) {
    if (error.code === "23505") {
      return response.status(409).json({ error: "That username is already taken." });
    }
    console.error(error);
    return response.status(500).json({ error: "Could not change your username." });
  }
});

app.put("/api/me/password", requireAuth, async (request, response) => {
  const { currentPassword, newPassword } = request.body || {};

  if (typeof newPassword !== "string" || newPassword.length < 8) {
    return response.status(400).json({ error: "New password must be at least 8 characters." });
  }

  try {
    const hashResult = await pool.query("SELECT password_hash FROM users WHERE id = $1", [request.user.id]);
    const passwordMatches = await bcrypt.compare(currentPassword || "", hashResult.rows[0].password_hash);
    if (!passwordMatches) {
      return response.status(401).json({ error: "Current password is incorrect." });
    }
    const newHash = await bcrypt.hash(newPassword, 12);
    await pool.query("UPDATE users SET password_hash = $1 WHERE id = $2", [newHash, request.user.id]);
    await pool.query("DELETE FROM sessions WHERE user_id = $1 AND token <> $2", [request.user.id, request.sessionToken]);
    return response.json({ ok: true });
  } catch (error) {
    console.error(error);
    return response.status(500).json({ error: "Could not change your password." });
  }
});

migrate()
  .then(() => {
    app.listen(port, () => {
      console.log(`Xedra server running at http://localhost:${port}`);
    });
  })
  .catch((error) => {
    console.error("Database migration failed:", error);
    process.exit(1);
  });
