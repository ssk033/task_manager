// Vercel serverless – simple handler. Isse check karo ki API deploy hui ya nahi: /api/health
module.exports = function handler(req, res) {
  res.status(200).json({ ok: true });
};
