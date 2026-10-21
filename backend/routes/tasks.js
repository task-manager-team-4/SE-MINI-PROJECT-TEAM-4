
import { Router } from 'express';
import pool from '../db.js';
import authenticateToken from '../middleware/auth.js';

const router = Router();

// All task routes require a valid login
router.use(authenticateToken);

// Create a task
router.post('/', async (req, res) => {
  try {
    const { title, description = '', priority = 'Medium', deadline = null } = req.body;

    if (
      typeof title !== 'string' ||
      !title.trim() ||
      title.trim().length > 200 ||
      typeof description !== 'string' ||
      !['Low', 'Medium', 'High'].includes(priority) ||
      (deadline !== null &&
        (typeof deadline !== 'string' || Number.isNaN(Date.parse(deadline))))
    ) {
      return res.status(400).json({ error: 'Invalid task input.' });
    }

    const result = await pool.query(
      `INSERT INTO tasks (user_id, title, description, priority, deadline)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [req.user.id, title.trim(), description.trim(), priority, deadline]
    );

    return res.status(201).json({
      message: 'Task created successfully.',
      task: result.rows[0],
    });
  } catch (error) {
    console.error('Create task error:', error.message);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// List only the logged-in user's tasks
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM tasks WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    );

    return res.json({ tasks: result.rows });
  } catch (error) {
    console.error('Fetch tasks error:', error.message);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// Update a task's status
router.put('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const taskId = Number(req.params.id);

    if (!Number.isInteger(taskId) || taskId < 1) {
      return res.status(400).json({ error: 'Invalid task ID.' });
    }

    if (!['Pending', 'In Progress', 'Completed'].includes(status)) {
      return res.status(400).json({ error: 'Invalid task status.' });
    }

    const result = await pool.query(
      `UPDATE tasks
       SET status = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2 AND user_id = $3
       RETURNING *`,
      [status, taskId, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found.' });
    }

    return res.json({
      message: 'Task status updated successfully.',
      task: result.rows[0],
    });
  } catch (error) {
    console.error('Update status error:', error.message);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

export default router;
