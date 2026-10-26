
import { Router } from 'express';
import pool from '../db.js';
import authenticateToken from '../middleware/auth.js';

const router = Router();

// All task routes require a valid login
router.use(authenticateToken);

// Create a task
router.post('/', async (req, res) => {
  try {
    const {
      title,
      description = '',
      priority = 'Medium',
      deadline = null,
    } = req.body;

    if (
      typeof title !== 'string' ||
      !title.trim() ||
      title.trim().length > 200 ||
      typeof description !== 'string' ||
      !['Low', 'Medium', 'High'].includes(priority) ||
      (deadline !== null &&
        (typeof deadline !== 'string' ||
          Number.isNaN(Date.parse(deadline))))
    ) {
      return res.status(400).json({ error: 'Invalid task input.' });
    }

    const result = await pool.query(
      `INSERT INTO tasks (user_id, title, description, priority, deadline)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        req.user.id,
        title.trim(),
        description.trim(),
        priority,
        deadline,
      ]
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

// Edit a task's details (FR-05)
router.put('/:id', async (req, res) => {
  try {
    const taskId = Number(req.params.id);
    const {
      title,
      description = '',
      priority,
      deadline = null,
      status,
    } = req.body;

    // Validate task ID
    if (!Number.isInteger(taskId) || taskId < 1) {
      return res.status(400).json({ error: 'Invalid task ID.' });
    }

    // Validate updated task information
    if (
      typeof title !== 'string' ||
      !title.trim() ||
      title.trim().length > 200 ||
      typeof description !== 'string' ||
      !['Low', 'Medium', 'High'].includes(priority) ||
      !['Pending', 'In Progress', 'Completed'].includes(status) ||
      (deadline !== null &&
        (typeof deadline !== 'string' ||
          Number.isNaN(Date.parse(deadline))))
    ) {
      return res.status(400).json({ error: 'Invalid task input.' });
    }

    // Update only a task belonging to the logged-in user
    const result = await pool.query(
      `UPDATE tasks
       SET title = $1,
           description = $2,
           priority = $3,
           deadline = $4,
           status = $5,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $6 AND user_id = $7
       RETURNING *`,
      [
        title.trim(),
        description.trim(),
        priority,
        deadline,
        status,
        taskId,
        req.user.id,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found.' });
    }

    return res.json({
      message: 'Task updated successfully.',
      task: result.rows[0],
    });
  } catch (error) {
    console.error('Edit task error:', error.message);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// Update a task's status (existing route)
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
