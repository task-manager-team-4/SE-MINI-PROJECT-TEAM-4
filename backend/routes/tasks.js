
import { Router } from 'express';
import pool from '../db.js';
import authenticateToken from '../middleware/auth.js';

const router = Router();

// All task routes require a valid login.
router.use(authenticateToken);

// Check whether the logged-in user owns or is assigned to a task.
async function canAccessTask(taskId, userId) {
  const result = await pool.query(
    `SELECT id
     FROM tasks
     WHERE id = $1
       AND (user_id = $2 OR assignee_id = $2)`,
    [taskId, userId]
  );

  return result.rows.length > 0;
}

// Create a task. The creator becomes its owner.
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

// List registered users for task assignment.
router.get('/users', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, email FROM users ORDER BY email ASC'
    );

    return res.json({ users: result.rows });
  } catch (error) {
    console.error('Fetch users error:', error.message);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// List tasks owned by or assigned to the logged-in user.
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT t.*,
              owner.email AS owner_email,
              assignee.email AS assignee_email
       FROM tasks t
       JOIN users owner ON owner.id = t.user_id
       LEFT JOIN users assignee ON assignee.id = t.assignee_id
       WHERE t.user_id = $1 OR t.assignee_id = $1
       ORDER BY t.created_at DESC`,
      [req.user.id]
    );

    return res.json({ tasks: result.rows });
  } catch (error) {
    console.error('Fetch tasks error:', error.message);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// Edit task details. The owner or assignee may edit.
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

    if (!Number.isInteger(taskId) || taskId < 1) {
      return res.status(400).json({ error: 'Invalid task ID.' });
    }

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

    const result = await pool.query(
      `UPDATE tasks
       SET title = $1,
           description = $2,
           priority = $3,
           deadline = $4,
           status = $5,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $6
         AND (user_id = $7 OR assignee_id = $7)
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
      return res.status(404).json({ error: 'Task not found or access denied.' });
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

// Update status. The owner or assignee may update it.
router.put('/:id/status', async (req, res) => {
  try {
    const taskId = Number(req.params.id);
    const { status } = req.body;

    if (!Number.isInteger(taskId) || taskId < 1) {
      return res.status(400).json({ error: 'Invalid task ID.' });
    }

    if (!['Pending', 'In Progress', 'Completed'].includes(status)) {
      return res.status(400).json({ error: 'Invalid task status.' });
    }

    const result = await pool.query(
      `UPDATE tasks
       SET status = $1,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
         AND (user_id = $3 OR assignee_id = $3)
       RETURNING *`,
      [status, taskId, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found or access denied.' });
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

// Delete task. The owner or assignee may delete it.
router.delete('/:id', async (req, res) => {
  try {
    const taskId = Number(req.params.id);

    if (!Number.isInteger(taskId) || taskId < 1) {
      return res.status(400).json({ error: 'Invalid task ID.' });
    }

    const result = await pool.query(
      `DELETE FROM tasks
       WHERE id = $1
         AND (user_id = $2 OR assignee_id = $2)
       RETURNING id`,
      [taskId, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found or access denied.' });
    }

    return res.json({
      message: 'Task deleted successfully.',
      taskId: result.rows[0].id,
    });
  } catch (error) {
    console.error('Delete task error:', error.message);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// Assign a task to a registered user. Only the owner can reassign it.
router.put('/:id/assign', async (req, res) => {
  try {
    const taskId = Number(req.params.id);
    const { assigneeId } = req.body;

    if (!Number.isInteger(taskId) || taskId < 1) {
      return res.status(400).json({ error: 'Invalid task ID.' });
    }

    if (!Number.isInteger(assigneeId) || assigneeId < 1) {
      return res.status(400).json({ error: 'Invalid assignee ID.' });
    }

    const userResult = await pool.query(
      'SELECT id, email FROM users WHERE id = $1',
      [assigneeId]
    );

    if (userResult.rows.length === 0) {
      return res.status(400).json({
        error: 'Selected assignee does not exist.',
      });
    }

    const taskResult = await pool.query(
      `UPDATE tasks
       SET assignee_id = $1,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $2 AND user_id = $3
       RETURNING *`,
      [assigneeId, taskId, req.user.id]
    );

    if (taskResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Task not found or only the owner can assign it.',
      });
    }

    return res.json({
      message: 'Task assigned successfully.',
      task: {
        ...taskResult.rows[0],
        assignee_email: userResult.rows[0].email,
      },
    });
  } catch (error) {
    console.error('Assign task error:', error.message);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

export default router;
