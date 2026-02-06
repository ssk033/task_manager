// Vercel: exports Express app so /, /login, /api/* work. Local dev still uses: npm start (server/index.js)
module.exports = require('./server/app');
