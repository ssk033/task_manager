require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const { pool } = require('./db');
const tasksRouter = require('./routes/tasks');
const authRouter = require('./routes/auth');
const { requireAuth } = require('./middleware/auth');

const app = express();

if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

app.use(
  session({
    store: new pgSession({
      pool,
      tableName: 'session',
      createTableIfMissing: true,
    }),
    secret: process.env.SESSION_SECRET || 'todo-list-secret-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    },
  })
);
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

app.use('/api/auth', authRouter);
app.get('/api/health', (req, res) => res.status(200).json({ ok: true }));
app.use('/api/tasks', requireAuth, tasksRouter);

const publicDir = path.join(__dirname, '..', 'public');
app.get('/', (req, res) => res.sendFile(path.join(publicDir, 'index.html')));
app.get('/login', (req, res) => res.sendFile(path.join(publicDir, 'login.html')));
app.get('/api', (req, res) => res.sendFile(path.join(publicDir, 'index.html')));
app.get('/api/login', (req, res) => res.sendFile(path.join(publicDir, 'login.html')));
app.use(express.static(publicDir));

module.exports = app;
