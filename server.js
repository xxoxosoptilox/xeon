const path = require("node:path");
const fs = require("node:fs");
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
const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID || "";
const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET || "";
const PUBLIC_URL = String(process.env.PUBLIC_URL || `http://localhost:${port}`).replace(/\/+$/, "");
const DISCORD_REDIRECT_URI = `${PUBLIC_URL}/api/discord/callback`;
const DISCORD_STATE_TTL_MS = 10 * 60 * 1000;

function signDiscordState(userId) {
  const payload = `${userId}:${Date.now()}`;
  const sig = crypto.createHmac("sha256", DISCORD_CLIENT_SECRET).update(payload).digest("hex");
  return `${payload}:${sig}`;
}

function verifyDiscordState(state) {
  const parts = String(state || "").split(":");
  if (parts.length !== 3) return null;
  const [userId, ts, sig] = parts;
  const payload = `${userId}:${ts}`;
  const expected = crypto.createHmac("sha256", DISCORD_CLIENT_SECRET).update(payload).digest("hex");
  if (sig !== expected) return null;
  if (Date.now() - Number(ts) > DISCORD_STATE_TTL_MS) return null;
  return userId;
}

const PUBLIC_FILES = new Set([
  "style.css",
  "script.js",
  "xedra.png",
  "noFilter.png",
  "Firefly_RemoveBackground.png",
  "Firefly_Gemini_Flash_remove_the_backround_284772-removebg-preview.png",
  "login-bg.jpg",
  "favicon.ico"
]);

app.use(cors());
app.use(express.json());

// Only ever serve the whitelist below. Serving the whole project folder would
// expose server.js, package.json, and any .env file that lands in this directory.
app.use(async (request, response, next) => {
  if (request.method !== "GET") {
    return next();
  }
  if (request.path === "/" || request.path === "/index.html") {
    return response.sendFile(path.join(__dirname, "index.html"));
  }
  if (request.path.startsWith("/assets/")) {
    let fileName;
    try {
      fileName = path.basename(decodeURIComponent(request.path));
    } catch {
      return next();
    }
    if (/^[A-Za-z0-9_-]+\.(png|jpe?g|webp|gif)$/i.test(fileName)) {
      return serveAssetWithFallback(response, next, fileName);
    }
    return next();
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

const USER_COLUMNS = `u.id, u.username, u.birthday::text AS birthday, u.gender, u.blurb, u.preferences, u.robux, u.discord_id, u.discord_username, u.created_at`;
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
    isAdmin: isAdminUsername(row.username),
    discordId: row.discord_id || "",
    discordUsername: row.discord_username || "",
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
  await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS discord_id TEXT NOT NULL DEFAULT ''`);
  await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS discord_username TEXT NOT NULL DEFAULT ''`);
  await pool.query(`CREATE UNIQUE INDEX IF NOT EXISTS users_username_lower_key ON users (lower(username))`);
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
  await pool.query(`CREATE TABLE IF NOT EXISTS catalog_items (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    category TEXT NOT NULL DEFAULT 'accessories',
    genre TEXT NOT NULL DEFAULT '',
    creator_name TEXT NOT NULL DEFAULT '',
    creator_type TEXT NOT NULL DEFAULT 'user',
    currency TEXT NOT NULL DEFAULT 'robux',
    price INTEGER NOT NULL DEFAULT 0,
    is_limited BOOLEAN NOT NULL DEFAULT false,
    is_limited_unique BOOLEAN NOT NULL DEFAULT false,
    is_new BOOLEAN NOT NULL DEFAULT false,
    is_featured BOOLEAN NOT NULL DEFAULT false,
    is_available BOOLEAN NOT NULL DEFAULT true,
    sales_count INTEGER NOT NULL DEFAULT 0,
    thumbnail_url TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`);
  await pool.query(`ALTER TABLE catalog_items ADD COLUMN IF NOT EXISTS rap INTEGER NOT NULL DEFAULT 0`);
  await pool.query(`ALTER TABLE catalog_items ADD COLUMN IF NOT EXISTS stock INTEGER`);
  await pool.query(`ALTER TABLE catalog_items ADD COLUMN IF NOT EXISTS source_asset_id BIGINT`);
  await pool.query(`ALTER TABLE catalog_items ADD COLUMN IF NOT EXISTS remote_thumbnail_url TEXT NOT NULL DEFAULT ''`);
  await pool.query(`ALTER TABLE catalog_items ADD COLUMN IF NOT EXISTS accepted BOOLEAN NOT NULL DEFAULT false`);
  await pool.query(`CREATE TABLE IF NOT EXISTS asset_imports (
    code SERIAL PRIMARY KEY,
    asset_id BIGINT NOT NULL,
    data JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    catalog_item_id INTEGER REFERENCES catalog_items(id) ON DELETE SET NULL
  )`);
  await pool.query(`CREATE TABLE IF NOT EXISTS item_ownership (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    catalog_item_id INTEGER NOT NULL REFERENCES catalog_items(id) ON DELETE CASCADE,
    price_paid INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`);
  await pool.query(`CREATE TABLE IF NOT EXISTS creations (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    kind TEXT NOT NULL,
    filename TEXT NOT NULL,
    size INTEGER NOT NULL DEFAULT 0,
    data BYTEA NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`);
  await pool.query(`ALTER TABLE creations ADD COLUMN IF NOT EXISTS accepted BOOLEAN NOT NULL DEFAULT false`);
  await pool.query(`ALTER TABLE creations ADD COLUMN IF NOT EXISTS name TEXT NOT NULL DEFAULT ''`);
  await pool.query(`ALTER TABLE creations ADD COLUMN IF NOT EXISTS description TEXT NOT NULL DEFAULT ''`);
  await pool.query(`ALTER TABLE creations ADD COLUMN IF NOT EXISTS allow_comments BOOLEAN NOT NULL DEFAULT false`);
  await pool.query(`ALTER TABLE creations ADD COLUMN IF NOT EXISTS allow_access BOOLEAN NOT NULL DEFAULT true`);
  await pool.query(`ALTER TABLE creations ADD COLUMN IF NOT EXISTS voice_chat BOOLEAN NOT NULL DEFAULT false`);
  await pool.query(`ALTER TABLE creations ADD COLUMN IF NOT EXISTS genre TEXT NOT NULL DEFAULT 'All'`);
  await pool.query(`ALTER TABLE creations ADD COLUMN IF NOT EXISTS icon BYTEA`);
  await pool.query(`ALTER TABLE creations ADD COLUMN IF NOT EXISTS icon_type TEXT NOT NULL DEFAULT ''`);
  await pool.query(`ALTER TABLE creations ADD COLUMN IF NOT EXISTS thumbnail BYTEA`);
  await pool.query(`ALTER TABLE creations ADD COLUMN IF NOT EXISTS thumbnail_type TEXT NOT NULL DEFAULT ''`);
  await pool.query(`ALTER TABLE creations ADD COLUMN IF NOT EXISTS max_visitors INTEGER NOT NULL DEFAULT 10`);
  await pool.query(`ALTER TABLE creations ADD COLUMN IF NOT EXISTS year INTEGER NOT NULL DEFAULT 2021`);
  await pool.query(`ALTER TABLE creations ADD COLUMN IF NOT EXISTS rig_type TEXT NOT NULL DEFAULT 'R6'`);
}

const ADMIN_USERNAMES = new Set(["marsargo", "3ymarr", "x_x", "roblox", "builderman", "acia", "tiffany"]);

function isAdminUsername(username) {
  return ADMIN_USERNAMES.has(String(username || "").trim().toLowerCase());
}

async function requireAdmin(request, response, next) {
  if (!isAdminUsername(request.user.username)) {
    return response.status(403).json({ error: "You do not have access to the admin panel." });
  }
  return next();
}

async function fetchWithTimeout(url, options = {}, timeoutMs = 15000) {
  const response = await fetch(url, {
    ...options,
    headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)", ...(options.headers || {}) },
    signal: AbortSignal.timeout(timeoutMs)
  });
  if (!response.ok) {
    throw new Error(`Request to ${url} failed with status ${response.status}`);
  }
  return response;
}

const ASSETS_DIR = path.join(__dirname, "assets");

async function saveAssetImage(assetId, url) {
  if (!/^https?:\/\//i.test(url || "")) {
    return null;
  }
  fs.mkdirSync(ASSETS_DIR, { recursive: true });
  const response = await fetchWithTimeout(url, {}, 30000);
  const buffer = Buffer.from(await response.arrayBuffer());
  if (!buffer.length) {
    return null;
  }
  const type = response.headers.get("content-type") || "";
  const ext = type.includes("jpeg") ? "jpg" : type.includes("webp") ? "webp" : type.includes("gif") ? "gif" : "png";
  const fileName = `${assetId}.${ext}`;
  await fs.promises.writeFile(path.join(ASSETS_DIR, fileName), buffer);
  return `/assets/${fileName}`;
}

async function fetchRobloxThumbnailUrl(assetId) {
  const result = await fetchWithTimeout(
    `https://thumbnails.roblox.com/v1/assets?assetIds=${assetId}&size=420x420&format=Png&isCircular=false`
  );
  const payload = await result.json();
  const entry = payload && Array.isArray(payload.data) ? payload.data[0] : null;
  return entry && entry.imageUrl ? entry.imageUrl : "";
}

// Hosting platforms wipe files written at runtime whenever they restart, so a
// missing local photo falls back to the original Roblox CDN copy.
async function serveAssetWithFallback(response, next, fileName) {
  const localPath = path.join(ASSETS_DIR, fileName);
  if (fs.existsSync(localPath)) {
    return response.sendFile(localPath);
  }
  const assetId = Number.parseInt(fileName.split(".")[0], 10);
  if (Number.isInteger(assetId)) {
    try {
      const stored = await pool.query(
        "SELECT remote_thumbnail_url FROM catalog_items WHERE source_asset_id = $1 AND remote_thumbnail_url <> '' LIMIT 1",
        [assetId]
      );
      let url = stored.rows[0] ? stored.rows[0].remote_thumbnail_url : "";
      if (!url) {
        url = await fetchRobloxThumbnailUrl(assetId);
        if (url) {
          await pool.query("UPDATE catalog_items SET remote_thumbnail_url = $1 WHERE source_asset_id = $2", [url, assetId]);
        }
      }
      if (url) {
        return response.redirect(302, url);
      }
    } catch (error) {
      console.error("Asset fallback failed:", error.message);
    }
  }
  return next();
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

const CATALOG_CATEGORY_VALUES = new Set(["featured", "community", "collectibles", "clothing", "body_parts", "gear", "accessories"]);

function catalogString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function escapeLikePattern(value) {
  return value.replace(/[!%_]/g, (character) => `!${character}`);
}

function normalizeCatalogItem(row) {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    genre: row.genre,
    creatorName: row.creator_name,
    creatorType: row.creator_type,
    currency: row.currency,
    price: row.price,
    isLimited: row.is_limited,
    isLimitedUnique: row.is_limited_unique,
    isNew: row.is_new,
    isFeatured: row.is_featured,
    isAvailable: row.is_available,
    salesCount: row.sales_count,
    thumbnailUrl: row.thumbnail_url,
    createdAt: row.created_at
  };
}

app.get("/api/catalog", requireAuth, async (request, response) => {
  const clauses = [];
  const values = [];
  const add = (clause, value) => {
    if (value === undefined) {
      clauses.push(clause);
      return;
    }
    values.push(value);
    clauses.push(clause.replace("$$", `$${values.length}`));
  };

  const category = catalogString(request.query.category) || "all";
  if (category === "featured") {
    add("is_featured = true");
  } else if (category.startsWith("featured_")) {
    add("is_featured = true AND category = $$", category.slice("featured_".length));
  } else if (CATALOG_CATEGORY_VALUES.has(category)) {
    add("category = $$", category);
  }

  const genre = catalogString(request.query.genre);
  if (genre) {
    add("genre = $$", genre);
  }

  const creatorType = catalogString(request.query.creatorType);
  if (creatorType === "user" || creatorType === "group") {
    add("creator_type = $$", creatorType);
  }

  const creator = catalogString(request.query.creator);
  if (creator) {
    add("creator_name ILIKE $$ ESCAPE '!'", `%${escapeLikePattern(creator)}%`);
  }

  const currency = catalogString(request.query.currency);
  if (currency === "robux" || currency === "tickets") {
    add("currency = $$", currency);
  }

  if (request.query.free === "1" || request.query.free === "true") {
    add("price = 0");
  }
  const minPrice = Number(request.query.minPrice);
  if (Number.isFinite(minPrice) && minPrice >= 0) {
    add("price >= $$", Math.floor(minPrice));
  }
  const maxPrice = Number(request.query.maxPrice);
  if (Number.isFinite(maxPrice) && maxPrice >= 0) {
    add("price <= $$", Math.floor(maxPrice));
  }

  const query = catalogString(request.query.q);
  if (query) {
    add("name ILIKE $$ ESCAPE '!'", `%${escapeLikePattern(query)}%`);
  }

  if (request.query.includeUnavailable !== "1" && request.query.includeUnavailable !== "true") {
    add("is_available = true");
  }

  add("accepted = true");

  const sort = catalogString(request.query.sort);
  const orderBy = {
    price_asc: "price ASC, name ASC",
    price_desc: "price DESC, name ASC",
    newest: "created_at DESC",
    bestsellers: "sales_count DESC, name ASC"
  }[sort] || "is_featured DESC, sales_count DESC, name ASC";

  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  try {
    const result = await pool.query(
      `SELECT id, name, category, genre, creator_name, creator_type, currency, price,
         is_limited, is_limited_unique, is_new, is_featured, is_available, sales_count,
         thumbnail_url, created_at, COUNT(*) OVER() AS total
       FROM catalog_items ${where} ORDER BY ${orderBy} LIMIT 50`,
      values
    );
    const total = result.rows.length ? Number(result.rows[0].total) : 0;
    return response.json({ items: result.rows.map(normalizeCatalogItem), total });
  } catch (error) {
    console.error(error);
    return response.status(500).json({ error: "Could not load the catalog." });
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

function parseAssetId(input) {
  const text = String(input || "").trim();
  const patterns = [
    /rolimons\.com\/item\/(\d+)/i,
    /roblox\.com\/[^/\s]*catalog\/(\d+)/i,
    /roblox\.com\/library\/(\d+)/i,
    /\/items\/(\d+)/i
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return match[1];
    }
  }
  return /^\d+$/.test(text) ? text : null;
}

app.post("/api/admin/import", requireAuth, requireAdmin, async (request, response) => {
  const assetId = parseAssetId(request.body && request.body.asset);
  if (!assetId) {
    return response.status(400).json({ error: "Enter a Rolimons item link or an asset ID." });
  }

  const data = {
    assetId,
    name: "",
    description: "",
    creatorName: "",
    creatorType: "user",
    isLimited: false,
    isLimitedUnique: false,
    price: 0,
    rap: 0,
    value: 0,
    stock: null,
    thumbnailUrl: "",
    sources: { rolimons: false, roblox: false, thumbnail: false }
  };

  try {
    const result = await fetchWithTimeout("https://api.rolimons.com/items/v1/itemdetails");
    const payload = await result.json();
    const entry = payload && payload.items ? payload.items[assetId] : null;
    if (entry) {
      data.sources.rolimons = true;
      if (Array.isArray(entry)) {
        // [name, acronym, rap, value, defaultValue, demand, trend, projected, hyped, rare]; -1 means "not available"
        data.name = entry[0] || data.name;
        data.rap = Math.max(Number(entry[2]) || 0, 0);
        data.value = Math.max(Number(entry[3]) || 0, 0);
      } else if (typeof entry === "object") {
        data.name = entry.name || data.name;
        data.rap = Math.max(Number(entry.rap) || 0, 0);
        data.value = Math.max(Number(entry.value) || 0, 0);
      }
    }
  } catch (error) {
    console.error("Rolimons lookup failed:", error.message);
  }

  try {
    const result = await fetchWithTimeout(`https://economy.roblox.com/v2/assets/${assetId}/details`);
    const details = await result.json();
    if (details && details.AssetId) {
      data.sources.roblox = true;
      data.name = details.Name || data.name;
      data.description = details.Description || "";
      data.creatorName = (details.Creator && details.Creator.Name) || "";
      data.creatorType = details.Creator && String(details.Creator.CreatorType).toLowerCase() === "group" ? "group" : "user";
      data.isLimited = Boolean(details.IsLimited);
      data.isLimitedUnique = Boolean(details.IsLimitedUnique);
      data.price = Number(details.PriceInRobux) || 0;
      if (details.Remaining !== null && details.Remaining !== undefined) {
        data.stock = Number(details.Remaining);
      }
    }
  } catch (error) {
    console.error("Roblox catalog lookup failed:", error.message);
  }

  try {
    const result = await fetchWithTimeout(
      `https://thumbnails.roblox.com/v1/assets?assetIds=${assetId}&size=420x420&format=Png&isCircular=false`
    );
    const payload = await result.json();
    const entry = payload && Array.isArray(payload.data) ? payload.data[0] : null;
    if (entry && entry.imageUrl) {
      data.sources.thumbnail = true;
      data.thumbnailUrl = entry.imageUrl;
    }
  } catch (error) {
    console.error("Thumbnail lookup failed:", error.message);
  }

  if (data.stock === null) {
    try {
      const result = await fetchWithTimeout(`https://www.rolimons.com/item/${assetId}`, {}, 25000);
      const html = await result.text();
      const match = html.match(/"stock":\s*(-?\d+|null)/);
      if (match && match[1] !== "null" && Number(match[1]) >= 0) {
        data.stock = Number(match[1]);
      }
    } catch (error) {
      console.error("Rolimons stock lookup failed:", error.message);
    }
  }

  if (!data.name) {
    data.name = `Asset ${assetId}`;
  }

  try {
    const result = await pool.query(
      "INSERT INTO asset_imports (asset_id, data) VALUES ($1, $2) RETURNING code",
      [assetId, JSON.stringify(data)]
    );
    return response.status(201).json({ code: result.rows[0].code, data });
  } catch (error) {
    console.error(error);
    return response.status(500).json({ error: "Could not save the import." });
  }
});

const ASSET_CATEGORY_VALUES = new Set(["not_limited", "limited", "limited_unique"]);

app.post("/api/admin/update-asset", requireAuth, requireAdmin, async (request, response) => {
  const body = request.body || {};
  const code = Number(body.code);
  if (!Number.isInteger(code) || code < 1 || code > 2147483647) {
    return response.status(400).json({ error: "Enter the import code you received (the small number from the import step, not the asset ID)." });
  }
  const category = String(body.category || "");
  if (!ASSET_CATEGORY_VALUES.has(category)) {
    return response.status(400).json({ error: "Pick a category: Not Limited, Limited, or Limited Unique." });
  }
  const price = Number(body.price);
  if (!Number.isFinite(price) || price < 0) {
    return response.status(400).json({ error: "Robux price must be 0 or more." });
  }
  const rap = Number(body.rap);
  if (!Number.isFinite(rap) || rap < 0) {
    return response.status(400).json({ error: "RAP must be 0 or more." });
  }
  let stock = null;
  const rawStock = body.stock;
  if (rawStock !== "" && rawStock !== null && rawStock !== undefined) {
    stock = Number(rawStock);
    if (!Number.isInteger(stock) || stock < 0) {
      return response.status(400).json({ error: "Stock must be a whole number, or left empty for unlimited." });
    }
  }

  try {
    const importResult = await pool.query("SELECT * FROM asset_imports WHERE code = $1", [code]);
    const importRow = importResult.rows[0];
    if (!importRow) {
      return response.status(404).json({ error: "No import found with that code." });
    }

    const data = importRow.data || {};
    const isLimited = category !== "not_limited";
    const isLimitedUnique = category === "limited_unique";
    const values = [
      data.name || `Asset ${importRow.asset_id}`,
      data.description || "",
      isLimited ? "collectibles" : "accessories",
      data.creatorName || "",
      data.creatorType === "group" ? "group" : "user",
      Math.floor(price),
      Math.floor(rap),
      stock,
      isLimited,
      isLimitedUnique,
      stock === null || stock > 0,
      data.thumbnailUrl || "",
      importRow.asset_id,
      data.thumbnailUrl || ""
    ];
    // Codes never expire: re-submitting one refreshes the item it already made.
    const itemResult = importRow.catalog_item_id
      ? await pool.query(
          `UPDATE catalog_items SET
             name = $1, description = $2, category = $3, creator_name = $4, creator_type = $5,
             currency = 'robux', price = $6, rap = $7, stock = $8, is_limited = $9,
             is_limited_unique = $10, is_available = $11,
             thumbnail_url = COALESCE(NULLIF($12, ''), thumbnail_url),
             source_asset_id = $13,
             remote_thumbnail_url = COALESCE(NULLIF($14, ''), remote_thumbnail_url)
           WHERE id = $15 RETURNING *`,
          [...values, importRow.catalog_item_id]
        )
      : await pool.query(
          `INSERT INTO catalog_items
             (name, description, category, creator_name, creator_type, currency, price, rap, stock,
              is_limited, is_limited_unique, is_new, is_available, thumbnail_url, source_asset_id, remote_thumbnail_url)
           VALUES ($1, $2, $3, $4, $5, 'robux', $6, $7, $8, $9, $10, true, $11, $12, $13, $14)
           RETURNING *`,
          values
        );
    await pool.query("UPDATE asset_imports SET catalog_item_id = $1 WHERE code = $2", [itemResult.rows[0].id, code]);
    const row = itemResult.rows[0];
    let thumbnailUrl = row.thumbnail_url;
    if (thumbnailUrl.startsWith("http")) {
      try {
        const localUrl = await saveAssetImage(importRow.asset_id, thumbnailUrl);
        if (localUrl) {
          thumbnailUrl = localUrl;
          await pool.query("UPDATE catalog_items SET thumbnail_url = $1 WHERE id = $2", [localUrl, row.id]);
        }
      } catch (error) {
        console.error("Asset image download failed:", error.message);
      }
    }
    return response.status(201).json({
      item: { ...normalizeCatalogItem(row), thumbnailUrl, description: row.description, rap: row.rap, stock: row.stock }
    });
  } catch (error) {
    console.error(error);
    return response.status(500).json({ error: "Could not create the catalog item." });
  }
});

app.get("/api/discord/connect", requireAuth, async (request, response) => {
  if (!DISCORD_CLIENT_ID || !DISCORD_CLIENT_SECRET) {
    return response.status(400).json({ error: "Discord linking is not configured on this server yet." });
  }
  const state = signDiscordState(request.user.id);
  const url = new URL("https://discord.com/oauth2/authorize");
  url.searchParams.set("client_id", DISCORD_CLIENT_ID);
  url.searchParams.set("redirect_uri", DISCORD_REDIRECT_URI);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "identify");
  url.searchParams.set("state", state);
  return response.redirect(302, url.toString());
});

app.get("/api/discord/callback", async (request, response) => {
  const { code, state } = request.query;
  const userId = verifyDiscordState(state);
  if (!userId) {
    console.error("Discord callback: invalid state", { state: String(state || "").slice(0, 20) });
    return response.redirect(302, "/?discord=error");
  }
  try {
    const tokenResponse = await fetch("https://discord.com/api/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: DISCORD_CLIENT_ID,
        client_secret: DISCORD_CLIENT_SECRET,
        grant_type: "authorization_code",
        code: String(code || ""),
        redirect_uri: DISCORD_REDIRECT_URI
      }).toString()
    });
    const tokenPayload = await tokenResponse.json();
    if (!tokenResponse.ok || !tokenPayload.access_token) {
      console.error("Discord token exchange failed:", tokenResponse.status, JSON.stringify(tokenPayload).slice(0, 200));
      if (tokenResponse.status === 429) {
        return response.redirect(302, "/?discord=ratelimit");
      }
      return response.redirect(302, "/?discord=error");
    }
    const discordResponse = await fetch("https://discord.com/api/users/@me", {
      headers: { Authorization: `Bearer ${tokenPayload.access_token}` }
    });
    const discordUser = await discordResponse.json();
    if (!discordResponse.ok || !discordUser.id) {
      console.error("Discord user fetch failed:", discordResponse.status, JSON.stringify(discordUser).slice(0, 200));
      return response.redirect(302, "/?discord=error");
    }
    await pool.query("UPDATE users SET discord_id = $1, discord_username = $2 WHERE id = $3", [
      String(discordUser.id),
      discordUser.global_name || discordUser.username || "",
      userId
    ]);
    console.log("Discord linked successfully for user", userId, "discord:", discordUser.id);
    return response.redirect(302, "/?discord=linked");
  } catch (error) {
    console.error("Discord link failed:", error.message);
    return response.redirect(302, "/?discord=error");
  }
});

app.post("/api/discord/unlink", requireAuth, async (request, response) => {
  try {
    await pool.query("UPDATE users SET discord_id = '', discord_username = '' WHERE id = $1", [request.user.id]);
    return response.json({ ok: true });
  } catch (error) {
    console.error(error);
    return response.status(500).json({ error: "Could not unlink your Discord account." });
  }
});

app.post("/api/admin/delete-item", requireAuth, requireAdmin, async (request, response) => {
  const code = Number((request.body || {}).code);
  if (!Number.isInteger(code) || code < 1 || code > 2147483647) {
    return response.status(400).json({ error: "Enter the import code of the item you want to delete." });
  }
  try {
    const importResult = await pool.query("SELECT catalog_item_id FROM asset_imports WHERE code = $1", [code]);
    const importRow = importResult.rows[0];
    if (!importRow) {
      return response.status(404).json({ error: "No import found with that code." });
    }
    let name = null;
    if (importRow.catalog_item_id) {
      const deleted = await pool.query("DELETE FROM catalog_items WHERE id = $1 RETURNING name", [importRow.catalog_item_id]);
      name = deleted.rows[0] ? deleted.rows[0].name : null;
    }
    await pool.query("DELETE FROM asset_imports WHERE code = $1", [code]);
    return response.json({ ok: true, name });
  } catch (error) {
    console.error(error);
    return response.status(500).json({ error: "Could not delete the item." });
  }
});

app.post("/api/admin/delete-and-refund", requireAuth, requireAdmin, async (request, response) => {
  const code = Number((request.body || {}).code);
  if (!Number.isInteger(code) || code < 1 || code > 2147483647) {
    return response.status(400).json({ error: "Enter the import code of the item you want to delete." });
  }
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const importResult = await client.query("SELECT catalog_item_id FROM asset_imports WHERE code = $1", [code]);
    const importRow = importResult.rows[0];
    if (!importRow) {
      await client.query("ROLLBACK");
      return response.status(404).json({ error: "No import found with that code." });
    }
    if (!importRow.catalog_item_id) {
      await client.query("ROLLBACK");
      return response.status(400).json({ error: "That code has no item in the catalog, so there is nothing to refund. Use Delete instead." });
    }
    // Locking the item row makes any in-flight purchase wait, so no buyer can be
    // added after the refunds are totalled but before the ownership rows cascade away.
    const itemResult = await client.query("SELECT name FROM catalog_items WHERE id = $1 FOR UPDATE", [importRow.catalog_item_id]);
    const item = itemResult.rows[0];
    if (!item) {
      await client.query("ROLLBACK");
      return response.status(404).json({ error: "The item made from that code is no longer in the catalog." });
    }
    const refundResult = await client.query(
      `UPDATE users u SET robux = u.robux + r.total
       FROM (
         SELECT user_id, SUM(price_paid)::int AS total
         FROM item_ownership WHERE catalog_item_id = $1 GROUP BY user_id
       ) r
       WHERE u.id = r.user_id
       RETURNING u.username, r.total`,
      [importRow.catalog_item_id]
    );
    await client.query("DELETE FROM catalog_items WHERE id = $1", [importRow.catalog_item_id]);
    await client.query("DELETE FROM asset_imports WHERE code = $1", [code]);
    await client.query("COMMIT");
    const totalRobux = refundResult.rows.reduce((sum, row) => sum + row.total, 0);
    return response.json({ ok: true, name: item.name, refunded: refundResult.rows.length, totalRobux });
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    console.error(error);
    return response.status(500).json({ error: "Could not refund and delete the item." });
  } finally {
    client.release();
  }
});

app.get("/api/admin/imports", requireAuth, requireAdmin, async (request, response) => {
  try {
    const result = await pool.query(
      `SELECT i.code, i.asset_id, i.data->>'name' AS name, i.catalog_item_id, i.created_at
       FROM asset_imports i ORDER BY i.code DESC LIMIT 50`
    );
    return response.json({ imports: result.rows });
  } catch (error) {
    console.error(error);
    return response.status(500).json({ error: "Could not load the import codes." });
  }
});

app.get("/api/admin/pending-assets", requireAuth, requireAdmin, async (request, response) => {
  try {
    const catalogResult = await pool.query(
      `SELECT id, name, 'catalog' AS item_type, category, price, created_at
       FROM catalog_items WHERE accepted = false AND creator_type = 'user'`
    );
    const creationResult = await pool.query(
      `SELECT id, COALESCE(NULLIF(filename, ''), 'Unnamed') AS name, kind AS item_type, kind AS category, 0 AS price, created_at
       FROM creations WHERE accepted = false`
    );
    const combined = [
      ...catalogResult.rows.map((row) => ({ ...row, source: "catalog" })),
      ...creationResult.rows.map((row) => ({ ...row, source: "creation" }))
    ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 50);
    return response.json({ assets: combined });
  } catch (error) {
    console.error(error);
    return response.status(500).json({ error: "Could not load pending assets." });
  }
});

app.post("/api/admin/accept-asset", requireAuth, requireAdmin, async (request, response) => {
  const body = request.body || {};
  const id = Number(body.id);
  const source = body.source || "catalog";
  if (!Number.isInteger(id) || id < 1) {
    return response.status(400).json({ error: "A valid asset ID is required." });
  }
  try {
    if (source === "creation") {
      const result = await pool.query(
        `UPDATE creations SET accepted = true WHERE id = $1 RETURNING id, kind, filename`,
        [id]
      );
      if (!result.rows[0]) {
        return response.status(404).json({ error: "Creation not found." });
      }
      return response.json({ ok: true, asset: result.rows[0] });
    }
    const result = await pool.query(
      `UPDATE catalog_items SET accepted = true WHERE id = $1 RETURNING id, name`,
      [id]
    );
    if (!result.rows[0]) {
      return response.status(404).json({ error: "Asset not found." });
    }
    return response.json({ ok: true, asset: result.rows[0] });
  } catch (error) {
    console.error(error);
    return response.status(500).json({ error: "Could not accept the asset." });
  }
});

app.post("/api/admin/reject-asset", requireAuth, requireAdmin, async (request, response) => {
  const body = request.body || {};
  const id = Number(body.id);
  const source = body.source || "catalog";
  if (!Number.isInteger(id) || id < 1) {
    return response.status(400).json({ error: "A valid asset ID is required." });
  }
  try {
    if (source === "creation") {
      const result = await pool.query(
        `DELETE FROM creations WHERE id = $1 AND accepted = false RETURNING id`,
        [id]
      );
      if (!result.rows[0]) {
        return response.status(404).json({ error: "Creation not found or already accepted." });
      }
      return response.json({ ok: true });
    }
    const result = await pool.query(
      `DELETE FROM catalog_items WHERE id = $1 AND accepted = false RETURNING id`,
      [id]
    );
    if (!result.rows[0]) {
      return response.status(404).json({ error: "Asset not found or already accepted." });
    }
    return response.json({ ok: true });
  } catch (error) {
    console.error(error);
    return response.status(500).json({ error: "Could not reject the asset." });
  }
});

app.get("/api/catalog/by-code/:code", requireAuth, async (request, response) => {
  const code = Number(request.params.code);
  if (!Number.isInteger(code) || code < 1 || code > 2147483647) {
    return response.status(400).json({ error: "Enter a valid item code." });
  }
  try {
    const result = await pool.query("SELECT catalog_item_id FROM asset_imports WHERE code = $1", [code]);
    const itemId = result.rows[0] ? result.rows[0].catalog_item_id : null;
    if (!itemId) {
      return response.status(404).json({ error: "No item matches that code." });
    }
    return response.json({ itemId });
  } catch (error) {
    console.error(error);
    return response.status(500).json({ error: "Could not look up that code." });
  }
});

app.get("/api/catalog/:id", requireAuth, async (request, response) => {
  const id = Number(request.params.id);
  if (!Number.isInteger(id) || id < 1) {
    return response.status(400).json({ error: "A valid item is required." });
  }
  try {
    const result = await pool.query(
      `SELECT id, name, description, category, genre, creator_name, creator_type, currency, price,
         rap, stock, is_limited, is_limited_unique, is_new, is_featured, is_available, sales_count,
         thumbnail_url, source_asset_id, created_at
       FROM catalog_items WHERE id = $1`,
      [id]
    );
    const row = result.rows[0];
    if (!row) {
      return response.status(404).json({ error: "Item not found." });
    }
    const ownedResult = await pool.query(
      "SELECT 1 FROM item_ownership WHERE user_id = $1 AND catalog_item_id = $2",
      [request.user.id, id]
    );
    return response.json({
      item: {
        ...normalizeCatalogItem(row),
        description: row.description,
        rap: row.rap,
        stock: row.stock,
        sourceAssetId: row.source_asset_id,
        isOwned: Boolean(ownedResult.rows[0])
      }
    });
  } catch (error) {
    console.error(error);
    return response.status(500).json({ error: "Could not load the item." });
  }
});

const UPLOAD_KINDS = {
  place: [".rbxl"],
  model: [".rbxm"],
  audio: [".ogg", ".mp3"]
};
const UPLOAD_LIMIT_BYTES = 25 * 1024 * 1024;

function sanitizeFileName(value) {
  const base = path.basename(String(value || "").replace(/\\/g, "/")).slice(0, 120);
  return base.replace(/[^A-Za-z0-9 ._()\[\}-]/g, "_").replace(/^\.+/, "") || "creation";
}

app.post("/api/create/upload", requireAuth, (request, response, next) => {
  express.raw({ type: () => true, limit: UPLOAD_LIMIT_BYTES })(request, response, (error) => {
    if (error) {
      return response.status(413).json({ error: `The file must be smaller than ${Math.round(UPLOAD_LIMIT_BYTES / 1048576)} MB.` });
    }
    return next();
  });
}, async (request, response) => {
  const kind = String((request.query || {}).kind || "");
  const allowed = UPLOAD_KINDS[kind];
  if (!allowed) {
    return response.status(400).json({ error: "That kind of creation cannot be uploaded." });
  }
  const fileName = sanitizeFileName((request.query || {}).name);
  const ext = path.extname(fileName).toLowerCase();
  if (!allowed.includes(ext)) {
    return response.status(400).json({ error: `A ${kind} file must end in ${allowed.join(" or ")}.` });
  }
  if (!Buffer.isBuffer(request.body) || request.body.length === 0) {
    return response.status(400).json({ error: "No file was received." });
  }
  try {
    const result = await pool.query(
      `INSERT INTO creations (user_id, kind, filename, size, data, accepted)
       VALUES ($1, $2, $3, $4, $5, false)
       RETURNING id, kind, filename, size, created_at`,
      [request.user.id, kind, fileName, request.body.length, request.body]
    );
    return response.json({ ok: true, creation: result.rows[0] });
  } catch (error) {
    console.error(error);
    return response.status(500).json({ error: "Could not save the file." });
  }
});

const CREATION_FIELDS = `id, kind, filename, size, name, description, allow_comments, allow_access, voice_chat, genre, icon_type, thumbnail_type, max_visitors, year, rig_type, created_at`;

app.get("/api/create/mine", requireAuth, async (request, response) => {
  try {
    const result = await pool.query(
      `SELECT ${CREATION_FIELDS}
       FROM creations WHERE user_id = $1 ORDER BY id DESC LIMIT 100`,
      [request.user.id]
    );
    return response.json({ creations: result.rows });
  } catch (error) {
    console.error(error);
    return response.status(500).json({ error: "Could not load your creations." });
  }
});

app.get("/api/create/recommended", async (request, response) => {
  try {
    const result = await pool.query(
      `SELECT id, name, icon_type, created_at
       FROM creations WHERE kind = 'place' AND accepted = true
       ORDER BY created_at DESC LIMIT 20`
    );
    return response.json({ creations: result.rows });
  } catch (error) {
    console.error(error);
    return response.status(500).json({ error: "Could not load recommended games." });
  }
});

function settingText(value, limit) {
  const text = typeof value === "string" ? value.trim() : "";
  return text.slice(0, limit);
}

app.put("/api/create/:id", requireAuth, async (request, response) => {
  const id = Number(request.params.id);
  if (!Number.isInteger(id) || id < 1) {
    return response.status(400).json({ error: "A valid creation is required." });
  }
  const body = request.body || {};
  const name = settingText(body.name, 100);
  if (!name) {
    return response.status(400).json({ error: "A game needs a name." });
  }
  const description = settingText(body.description, 1000);
  const genre = settingText(body.genre, 40) || "All";

  try {
    const ownerResult = await pool.query("SELECT user_id, kind FROM creations WHERE id = $1", [id]);
    const owner = ownerResult.rows[0];
    if (!owner) {
      return response.status(404).json({ error: "That creation no longer exists." });
    }
    if (owner.user_id !== request.user.id && !isAdminUsername(request.user.username)) {
      return response.status(403).json({ error: "That creation belongs to someone else." });
    }
    if (owner.kind !== "place") {
      return response.status(400).json({ error: "Only games have basic settings." });
    }
    const result = await pool.query(
      `UPDATE creations
       SET name = $1, description = $2, allow_comments = $3, allow_access = $4, voice_chat = $5, genre = $6
       WHERE id = $7
       RETURNING ${CREATION_FIELDS}`,
      [name, description, Boolean(body.allowComments), Boolean(body.allowAccess), Boolean(body.voiceChat), genre, id]
    );
    return response.json({ ok: true, creation: result.rows[0] });
  } catch (error) {
    console.error(error);
    return response.status(500).json({ error: "Could not save the settings." });
  }
});

const MAX_VISITORS_OPTIONS = [10, 25, 50, 100, 150, 200];
const RIG_TYPES = ["R6", "R15"];
const VALID_YEARS = new Set(Array.from({ length: 20 }, (_, i) => 2006 + i));

app.put("/api/create/:id/access", requireAuth, async (request, response) => {
  const id = Number(request.params.id);
  if (!Number.isInteger(id) || id < 1) {
    return response.status(400).json({ error: "A valid creation is required." });
  }
  const body = request.body || {};
  const maxVisitors = Number(body.maxVisitors);
  if (!MAX_VISITORS_OPTIONS.includes(maxVisitors)) {
    return response.status(400).json({ error: "Pick a valid maximum visitor count." });
  }
  const year = Number(body.year);
  if (!VALID_YEARS.has(year)) {
    return response.status(400).json({ error: "Pick a valid year." });
  }
  const rigType = String(body.rigType || "").trim();
  if (!RIG_TYPES.includes(rigType)) {
    return response.status(400).json({ error: "Pick a valid rig type." });
  }
  try {
    const ownerResult = await pool.query("SELECT user_id, kind FROM creations WHERE id = $1", [id]);
    const owner = ownerResult.rows[0];
    if (!owner) {
      return response.status(404).json({ error: "That creation no longer exists." });
    }
    if (owner.user_id !== request.user.id && !isAdminUsername(request.user.username)) {
      return response.status(403).json({ error: "That creation belongs to someone else." });
    }
    if (owner.kind !== "place") {
      return response.status(400).json({ error: "Only games have access settings." });
    }
    const result = await pool.query(
      `UPDATE creations SET max_visitors = $1, year = $2, rig_type = $3 WHERE id = $4 RETURNING ${CREATION_FIELDS}`,
      [maxVisitors, year, rigType, id]
    );
    return response.json({ ok: true, creation: result.rows[0] });
  } catch (error) {
    console.error(error);
    return response.status(500).json({ error: "Could not save the access settings." });
  }
});

function rawUpload(handler) {
  return (request, response, next) => {
    express.raw({ type: () => true, limit: UPLOAD_LIMIT_BYTES })(request, response, (error) => {
      if (error) {
        return response.status(413).json({ error: `The file must be smaller than ${Math.round(UPLOAD_LIMIT_BYTES / 1048576)} MB.` });
      }
      return next();
    });
  };
}

app.put("/api/create/:id/upload", requireAuth, rawUpload(), async (request, response) => {
  const id = Number(request.params.id);
  if (!Number.isInteger(id) || id < 1) {
    return response.status(400).json({ error: "A valid creation is required." });
  }
  if (!Buffer.isBuffer(request.body) || request.body.length === 0) {
    return response.status(400).json({ error: "No file was received." });
  }
  const fileName = sanitizeFileName(String((request.query || {}).name || "place.rbxl"));
  const ext = path.extname(fileName).toLowerCase();
  if (ext !== ".rbxl") {
    return response.status(400).json({ error: "A game file must end in .rbxl." });
  }
  try {
    const ownerResult = await pool.query("SELECT user_id, kind FROM creations WHERE id = $1", [id]);
    const owner = ownerResult.rows[0];
    if (!owner) {
      return response.status(404).json({ error: "That creation no longer exists." });
    }
    if (owner.user_id !== request.user.id && !isAdminUsername(request.user.username)) {
      return response.status(403).json({ error: "That creation belongs to someone else." });
    }
    if (owner.kind !== "place") {
      return response.status(400).json({ error: "Only games can be replaced." });
    }
    const result = await pool.query(
      `UPDATE creations SET data = $1, filename = $2, size = $3 WHERE id = $4 RETURNING ${CREATION_FIELDS}`,
      [request.body, fileName, request.body.length, id]
    );
    return response.json({ ok: true, creation: result.rows[0] });
  } catch (error) {
    console.error(error);
    return response.status(500).json({ error: "Could not replace the file." });
  }
});

const ICON_TYPES = new Set(["image/png", "image/jpeg"]);

app.post("/api/create/:id/icon", requireAuth, rawUpload(), async (request, response) => {
  const id = Number(request.params.id);
  if (!Number.isInteger(id) || id < 1) {
    return response.status(400).json({ error: "A valid creation is required." });
  }
  if (!Buffer.isBuffer(request.body) || request.body.length === 0) {
    return response.status(400).json({ error: "No file was received." });
  }
  const contentType = String(request.headers["content-type"] || "").split(";")[0].trim().toLowerCase();
  if (!ICON_TYPES.has(contentType)) {
    return response.status(400).json({ error: "The icon must be a PNG or JPG image." });
  }
  try {
    const ownerResult = await pool.query("SELECT user_id, kind FROM creations WHERE id = $1", [id]);
    const owner = ownerResult.rows[0];
    if (!owner) {
      return response.status(404).json({ error: "That creation no longer exists." });
    }
    if (owner.user_id !== request.user.id && !isAdminUsername(request.user.username)) {
      return response.status(403).json({ error: "That creation belongs to someone else." });
    }
    if (owner.kind !== "place") {
      return response.status(400).json({ error: "Only games can have icons." });
    }
    const ext = contentType === "image/jpeg" ? "jpg" : "png";
    const result = await pool.query(
      `UPDATE creations SET icon = $1, icon_type = $2 WHERE id = $3 RETURNING ${CREATION_FIELDS}`,
      [request.body, ext, id]
    );
    return response.json({ ok: true, creation: result.rows[0] });
  } catch (error) {
    console.error(error);
    return response.status(500).json({ error: "Could not save the icon." });
  }
});

app.get("/api/create/:id/icon", async (request, response) => {
  const id = Number(request.params.id);
  if (!Number.isInteger(id) || id < 1) {
    return response.status(400).end();
  }
  try {
    const result = await pool.query("SELECT icon, icon_type FROM creations WHERE id = $1 AND icon IS NOT NULL AND accepted = true", [id]);
    const row = result.rows[0];
    if (!row) {
      return response.status(404).end();
    }
    response.setHeader("Content-Type", row.icon_type === "jpg" ? "image/jpeg" : "image/png");
    response.setHeader("Content-Length", row.icon.length);
    response.setHeader("Cache-Control", "public, max-age=300");
    return response.end(row.icon);
  } catch (error) {
    console.error(error);
    return response.status(500).end();
  }
});

app.post("/api/create/:id/thumbnail", requireAuth, rawUpload(), async (request, response) => {
  const id = Number(request.params.id);
  if (!Number.isInteger(id) || id < 1) {
    return response.status(400).json({ error: "A valid creation is required." });
  }
  if (!Buffer.isBuffer(request.body) || request.body.length === 0) {
    return response.status(400).json({ error: "No file was received." });
  }
  const contentType = String(request.headers["content-type"] || "").split(";")[0].trim().toLowerCase();
  if (!ICON_TYPES.has(contentType)) {
    return response.status(400).json({ error: "The thumbnail must be a PNG or JPG image." });
  }
  try {
    const ownerResult = await pool.query("SELECT user_id, kind FROM creations WHERE id = $1", [id]);
    const owner = ownerResult.rows[0];
    if (!owner) {
      return response.status(404).json({ error: "That creation no longer exists." });
    }
    if (owner.user_id !== request.user.id && !isAdminUsername(request.user.username)) {
      return response.status(403).json({ error: "That creation belongs to someone else." });
    }
    if (owner.kind !== "place") {
      return response.status(400).json({ error: "Only games can have thumbnails." });
    }
    const ext = contentType === "image/jpeg" ? "jpg" : "png";
    const result = await pool.query(
      `UPDATE creations SET thumbnail = $1, thumbnail_type = $2 WHERE id = $3 RETURNING ${CREATION_FIELDS}`,
      [request.body, ext, id]
    );
    return response.json({ ok: true, creation: result.rows[0] });
  } catch (error) {
    console.error(error);
    return response.status(500).json({ error: "Could not save the thumbnail." });
  }
});

app.get("/api/create/:id/thumbnail", async (request, response) => {
  const id = Number(request.params.id);
  if (!Number.isInteger(id) || id < 1) {
    return response.status(400).end();
  }
  try {
    const result = await pool.query("SELECT thumbnail, thumbnail_type FROM creations WHERE id = $1 AND thumbnail IS NOT NULL AND accepted = true", [id]);
    const row = result.rows[0];
    if (!row) {
      return response.status(404).end();
    }
    response.setHeader("Content-Type", row.thumbnail_type === "jpg" ? "image/jpeg" : "image/png");
    response.setHeader("Content-Length", row.thumbnail.length);
    response.setHeader("Cache-Control", "public, max-age=300");
    return response.end(row.thumbnail);
  } catch (error) {
    console.error(error);
    return response.status(500).end();
  }
});

app.get("/api/create/download/:id", requireAuth, async (request, response) => {
  const id = Number(request.params.id);
  if (!Number.isInteger(id) || id < 1) {
    return response.status(400).json({ error: "A valid creation is required." });
  }
  try {
    const result = await pool.query(
      "SELECT user_id, filename, data FROM creations WHERE id = $1",
      [id]
    );
    const row = result.rows[0];
    if (!row) {
      return response.status(404).json({ error: "That creation no longer exists." });
    }
    if (row.user_id !== request.user.id && !isAdminUsername(request.user.username)) {
      return response.status(403).json({ error: "That file belongs to someone else." });
    }
    // Always a download, never rendered: the bytes came from a player and could
    // be anything once the extension was faked.
    response.setHeader("Content-Type", "application/octet-stream");
    response.setHeader("Content-Disposition", `attachment; filename="${row.filename.replace(/["\r\n]/g, "_")}"`);
    response.setHeader("Content-Length", row.data.length);
    return response.end(row.data);
  } catch (error) {
    console.error(error);
    return response.status(500).json({ error: "Could not open the file." });
  }
});

app.post("/api/catalog/:id/purchase", requireAuth, async (request, response) => {
  const id = Number(request.params.id);
  if (!Number.isInteger(id) || id < 1) {
    return response.status(400).json({ error: "A valid item is required." });
  }
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const itemResult = await client.query(
      "SELECT id, name, currency, price, stock, is_available FROM catalog_items WHERE id = $1 FOR UPDATE",
      [id]
    );
    const item = itemResult.rows[0];
    if (!item) {
      await client.query("ROLLBACK");
      return response.status(404).json({ error: "Item not found." });
    }
    if (!item.is_available || (item.stock !== null && item.stock <= 0)) {
      await client.query("ROLLBACK");
      return response.status(400).json({ error: "This item is off sale." });
    }
    const ownedResult = await client.query(
      "SELECT 1 FROM item_ownership WHERE user_id = $1 AND catalog_item_id = $2",
      [request.user.id, id]
    );
    if (ownedResult.rows[0]) {
      await client.query("ROLLBACK");
      return response.status(409).json({ error: "You already own this item." });
    }
    if (item.currency !== "robux") {
      await client.query("ROLLBACK");
      return response.status(400).json({ error: "This item cannot be bought with Robux." });
    }
    const userResult = await client.query("SELECT robux FROM users WHERE id = $1 FOR UPDATE", [request.user.id]);
    if (userResult.rows[0].robux < item.price) {
      await client.query("ROLLBACK");
      return response.status(403).json({ error: "You do not have enough Robux." });
    }

    const newStock = item.stock === null ? null : item.stock - 1;
    const nowOffSale = newStock !== null && newStock <= 0;
    await client.query("UPDATE users SET robux = robux - $1 WHERE id = $2", [item.price, request.user.id]);
    await client.query(
      "UPDATE catalog_items SET sales_count = sales_count + 1, stock = $2, is_available = $3 WHERE id = $1",
      [id, newStock, !nowOffSale]
    );
    await client.query(
      "INSERT INTO item_ownership (user_id, catalog_item_id, price_paid) VALUES ($1, $2, $3)",
      [request.user.id, id, item.price]
    );
    const balanceResult = await client.query("SELECT robux FROM users WHERE id = $1", [request.user.id]);
    await client.query("COMMIT");
    return response.json({
      ok: true,
      robux: balanceResult.rows[0].robux,
      stock: newStock,
      isAvailable: !nowOffSale,
      pricePaid: item.price,
      itemName: item.name
    });
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    console.error(error);
    return response.status(500).json({ error: "Could not complete the purchase." });
  } finally {
    client.release();
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
