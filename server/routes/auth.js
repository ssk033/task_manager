const express = require('express');
const bcrypt = require('bcryptjs');
const { pool } = require('../db');

const router = express.Router();

const SALT_ROUNDS = 10;

router.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || typeof username !== 'string' || !username.trim()) {
      return res.status(400).json({ error: 'Username is required' });
    }
    if (!password || typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }
    const name = username.trim().toLowerCase();
    if (name.length < 2) {
      return res.status(400).json({ error: 'Username must be at least 2 characters' });
    }
    const password_hash = await bcrypt.hash(password, SALT_ROUNDS);
    const result = await pool.query(
      'INSERT INTO users (username, password_hash) VALUES ($1, $2) RETURNING id, username, created_at',
      [name, password_hash]
    );
    const user = result.rows[0];
    req.session.userId = user.id;
    req.session.username = user.username;
    res.status(201).json({ id: user.id, username: user.username });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Username already taken' });
    }
    if (err.code === '42P01') {
      return res.status(500).json({ error: 'Database table missing. Run: npm run init-db' });
    }
    if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
      return res.status(500).json({ error: 'Database not reachable. Check DATABASE_URL in .env' });
    }
    console.error('Register error:', err);
    const msg = process.env.NODE_ENV === 'production' ? 'Registration failed' : (err.message || 'Registration failed');
    res.status(500).json({ error: msg });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }
    const result = await pool.query(
      'SELECT id, username, password_hash FROM users WHERE username = $1',
      [String(username).trim().toLowerCase()]
    );
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }
    const user = result.rows[0];
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }
    req.session.userId = user.id;
    req.session.username = user.username;
    res.json({ id: user.id, username: user.username });
  } catch (err) {
    if (err.code === '42P01') {
      return res.status(500).json({ error: 'Database table missing. Run: npm run init-db' });
    }
    if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
      return res.status(500).json({ error: 'Database not reachable. Set DATABASE_URL on Vercel.' });
    }
    console.error('Login error:', err);
    const hint = process.env.NODE_ENV === 'production'
      ? ' Set DATABASE_URL + SESSION_SECRET on Vercel and run npm run init-db once.'
      : '';
    res.status(500).json({ error: 'Login failed.' + hint });
  }
});

router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) return res.status(500).json({ error: 'Logout failed' });
    res.clearCookie('connect.sid');
    res.status(204).send();
  });
});

router.get('/me', (req, res) => {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  res.json({ id: req.session.userId, username: req.session.username });
});

module.exports = router;
