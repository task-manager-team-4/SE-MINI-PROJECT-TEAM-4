
import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import pool from './db.js';
import authRoutes from './routes/auth.js';
import taskRoutes from './routes/tasks.js';

const app = express();

app.use(cors());
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'Task Manager API is running!' });
});

app.get('/api/health', async (req, res) => {
  try {
    const result = await pool.query('SELECT current_database()');
    res.json({
      status: 'OK',
      database: result.rows[0].current_database,
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: 'Database connection failed' });
  }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Task Manager API running at http://localhost:${PORT}`);
});

