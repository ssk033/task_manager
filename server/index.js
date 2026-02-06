const app = require('./app');
const port = parseInt(process.env.PORT, 10) || 3000;

function start(p) {
  const server = app.listen(p, () => {
    console.log(`Server running at http://localhost:${server.address().port}`);
  });
  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE' && p === port) {
      console.warn(`Port ${port} in use, trying ${port + 1}...`);
      start(port + 1);
    } else {
      throw err;
    }
  });
}

start(port);
