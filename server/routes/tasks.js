const express = require('express');
const { pool } = require('../db');

const router = express.Router();

const VALID_STATUSES = ['pending', 'in_progress', 'completed'];

function getUserId(req) {
  const id = req.session?.userId;
  if (!id) throw new Error('Unauthorized');
  return id;
}

// GET /api/tasks - List all tasks for current user
router.get('/', async (req, res) => {
  try {
    const userId = getUserId(req);
    const { status } = req.query;
    let query = 'SELECT id, title, description, status, created_at, updated_at FROM tasks WHERE user_id = $1';
    const params = [userId];
    if (status && VALID_STATUSES.includes(status)) {
      query += ' AND status = $2';
      params.push(status);
    }
    query += ' ORDER BY created_at DESC';
    const result = await pool.query(query, params);
    res.json(Array.isArray(result.rows) ? result.rows : []);
  } catch (err) {
    if (err.message === 'Unauthorized') {
      return res.status(401).json({ error: 'Authentication required' });
    }
    console.error('GET /api/tasks error:', err);
    const message = err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND'
      ? 'Database not reachable. Check DATABASE_URL and run npm run init-db.'
      : (err.message && err.message.includes('user_id') ? 'Database schema outdated. Run: npm run init-db' : 'Failed to fetch tasks');
    res.status(500).json({ error: message });
  }
});

// GET /api/tasks/:id - Get single task
router.get('/:id', async (req, res) => {
  try {
    const userId = getUserId(req);
    const { id } = req.params;
    const result = await pool.query(
      'SELECT id, title, description, status, created_at, updated_at FROM tasks WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    if (err.message === 'Unauthorized') {
      return res.status(401).json({ error: 'Authentication required' });
    }
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch task' });
  }
});

// POST /api/tasks - Create task
router.post('/', async (req, res) => {
  try {
    const userId = getUserId(req);
    const { title, description, status } = req.body;
    if (!title || typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({ error: 'Title is required' });
    }
    const taskStatus = status && VALID_STATUSES.includes(status) ? status : 'pending';
    const result = await pool.query(
      `INSERT INTO tasks (user_id, title, description, status)
       VALUES ($1, $2, $3, $4)
       RETURNING id, title, description, status, created_at, updated_at`,
      [userId, title.trim(), description?.trim() || null, taskStatus]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.message === 'Unauthorized') {
      return res.status(401).json({ error: 'Authentication required' });
    }
    console.error(err);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

// PUT /api/tasks/:id - Update task
router.put('/:id', async (req, res) => {
  try {
    const userId = getUserId(req);
    const { id } = req.params;
    const { title, description, status } = req.body;
    const updates = [];
    const values = [];
    let paramIndex = 1;
    if (title !== undefined) {
      if (typeof title !== 'string' || !title.trim()) {
        return res.status(400).json({ error: 'Title cannot be empty' });
      }
      updates.push(`title = $${paramIndex++}`);
      values.push(title.trim());
    }
    if (description !== undefined) {
      updates.push(`description = $${paramIndex++}`);
      values.push(description?.trim() || null);
    }
    if (status !== undefined) {
      if (!VALID_STATUSES.includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
      }
      updates.push(`status = $${paramIndex++}`);
      values.push(status);
    }
    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }
    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(userId, id);
    const result = await pool.query(
      `UPDATE tasks SET ${updates.join(', ')}
       WHERE user_id = $${paramIndex++} AND id = $${paramIndex}
       RETURNING id, title, description, status, created_at, updated_at`,
      values
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    if (err.message === 'Unauthorized') {
      return res.status(401).json({ error: 'Authentication required' });
    }
    console.error(err);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

// DELETE /api/tasks/:id - Delete task
router.delete('/:id', async (req, res) => {
  try {
    const userId = getUserId(req);
    const { id } = req.params;
    const result = await pool.query('DELETE FROM tasks WHERE id = $1 AND user_id = $2 RETURNING id', [id, userId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }
    res.status(204).send();
  } catch (err) {
    if (err.message === 'Unauthorized') {
      return res.status(401).json({ error: 'Authentication required' });
    }
    console.error(err);
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

module.exports = router;
