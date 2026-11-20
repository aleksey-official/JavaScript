import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../src/app.js';
import { pool, createTables } from '../src/db.js';

describe('API Менеджера задач', () => {
  const testEmail = `test_${Date.now()}@example.com`;
  const testPassword = 'password123';
  let token = '';
  let createdTaskId = null;

  before(async () => {
    await createTables();
  });

  after(async () => {
    await pool.query('DELETE FROM users WHERE email = $1', [testEmail]);
    await pool.end();
  });

  it('1. GET /api/ping отвечает 200 OK', async () => {
    const res = await request(app).get('/api/ping');
    assert.equal(res.status, 200);
    assert.equal(res.body.ok, true);
  });

  it('2. GET /api/tasks без токена возвращает 401', async () => {
    const res = await request(app).get('/api/tasks');
    assert.equal(res.status, 401);
  });

  it('3. POST /api/auth/register регистрирует пользователя и выдаёт токен', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: testEmail, password: testPassword });

    assert.equal(res.status, 201);
    assert.equal(res.body.user.email, testEmail);
    assert.ok(res.body.token);
    token = res.body.token;
  });

  it('4. POST /api/tasks создаёт задачу авторизованному пользователю', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Тестовая задача' });

    assert.equal(res.status, 201);
    assert.equal(res.body.title, 'Тестовая задача');
    assert.equal(res.body.done, false);
    createdTaskId = res.body.id;
  });

  it('5. PATCH /api/tasks/:id меняет статус задачи на выполнена', async () => {
    const res = await request(app)
      .patch(`/api/tasks/${createdTaskId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ done: true });

    assert.equal(res.status, 200);
    assert.equal(res.body.done, true);
  });

  it('6. DELETE /api/tasks/:id удаляет задачу', async () => {
    const res = await request(app)
      .delete(`/api/tasks/${createdTaskId}`)
      .set('Authorization', `Bearer ${token}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.deleted, true);
  });
});