import { Router } from 'express';
import { pool } from '../db.js';
import { authRequired } from '../middleware/auth.js';

const router = Router();

// Все маршруты ниже требуют токен
router.use(authRequired);

// Получить задачи текущего пользователя: GET /api/tasks (можно фильтровать ?done=true или ?done=false)
router.get('/', async (req, res) => {
  try {
    const { done } = req.query;

    if (done === 'true' || done === 'false') {
      const isDone = done === 'true';
      const result = await pool.query(
        'SELECT id, title, done, user_id FROM tasks WHERE user_id = $1 AND done = $2 ORDER BY id DESC',
        [req.user.id, isDone]
      );
      return res.json(result.rows);
    }

    const result = await pool.query(
      'SELECT id, title, done, user_id FROM tasks WHERE user_id = $1 ORDER BY id DESC',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка при получении задач' });
  }
});

// Создать задачу: POST /api/tasks
router.post('/', async (req, res) => {
  try {
    const { title } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Название задачи не должно быть пустым' });
    }

    const result = await pool.query(
      'INSERT INTO tasks (user_id, title) VALUES ($1, $2) RETURNING id, title, done, user_id',
      [req.user.id, title.trim()]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка при создании задачи' });
  }
});

// Обновить задачу (название или статус done): PATCH /api/tasks/:id
router.patch('/:id', async (req, res) => {
  try {
    const taskId = Number(req.params.id);
    if (!Number.isInteger(taskId)) {
      return res.status(400).json({ error: 'Некорректный ID задачи' });
    }

    const found = await pool.query('SELECT id, title, done, user_id FROM tasks WHERE id = $1', [taskId]);
    if (found.rows.length === 0) {
      return res.status(404).json({ error: 'Задача не найдена' });
    }

    const task = found.rows[0];
    if (task.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Нет прав на изменение этой задачи' });
    }

    const newTitle = req.body.title !== undefined ? String(req.body.title).trim() : task.title;
    const newDone = req.body.done !== undefined ? Boolean(req.body.done) : task.done;

    if (!newTitle) {
      return res.status(400).json({ error: 'Название задачи не должно быть пустым' });
    }

    const updated = await pool.query(
      'UPDATE tasks SET title = $1, done = $2 WHERE id = $3 RETURNING id, title, done, user_id',
      [newTitle, newDone, taskId]
    );

    res.json(updated.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка при обновлении задачи' });
  }
});

// Удалить задачу: DELETE /api/tasks/:id
router.delete('/:id', async (req, res) => {
  try {
    const taskId = Number(req.params.id);
    if (!Number.isInteger(taskId)) {
      return res.status(400).json({ error: 'Некорректный ID задачи' });
    }

    const found = await pool.query('SELECT id, user_id FROM tasks WHERE id = $1', [taskId]);
    if (found.rows.length === 0) {
      return res.status(404).json({ error: 'Задача не найдена' });
    }

    const task = found.rows[0];
    if (task.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Нет прав на удаление этой задачи' });
    }

    await pool.query('DELETE FROM tasks WHERE id = $1', [taskId]);
    res.json({ deleted: true, id: taskId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка при удалении задачи' });
  }
});

export default router;