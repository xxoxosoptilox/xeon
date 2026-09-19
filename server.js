const path = require("node:path");
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const { Pool } = require("pg");
require("dotenv").config();

const app = express();
const port = Number(process.env.PORT || 3000);
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

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
			 RETURNING id, username, birthday, gender, created_at`,
			[username.trim(), passwordHash, birthday, gender || null]
		);
		return response.status(201).json({ user: result.rows[0] });
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
			"SELECT id, username, password_hash FROM users WHERE username = $1",
			[username.trim()]
		);
		const user = result.rows[0];
		const passwordMatches = user && await bcrypt.compare(password, user.password_hash);

		if (!passwordMatches) {
			return response.status(401).json({ error: "Invalid username or password." });
		}
		return response.json({ user: { id: user.id, username: user.username } });
	} catch (error) {
		console.error(error);
		return response.status(500).json({ error: "Could not log in." });
	}
});

app.listen(port, () => {
	console.log(`Xedra server running at http://localhost:${port}`);
});