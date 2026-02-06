const test = require('node:test');
const assert = require('node:assert');
const request = require('supertest');
const app = require('../server/app');

const BASE = '';
const unique = () => `user_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

test('GET /api/auth/me when not logged in returns 401', async () => {
  const res = await request(app).get(`${BASE}/api/auth/me`);
  assert.strictEqual(res.status, 401);
});

test('GET /api/tasks when not logged in returns 401', async () => {
  const res = await request(app).get(`${BASE}/api/tasks`);
  assert.strictEqual(res.status, 401);
});

test('Register, login, and CRUD tasks', { skip: !process.env.DATABASE_URL }, async () => {
  const agent = request.agent(app);
  const username = unique();
  const password = 'testpass123';

  const reg = await agent.post(`${BASE}/api/auth/register`).send({ username, password });
  assert.strictEqual(reg.status, 201);
  assert.ok(reg.body.username);
  assert.ok(reg.body.id);

  const me = await agent.get(`${BASE}/api/auth/me`);
  assert.strictEqual(me.status, 200);
  assert.strictEqual(me.body.username, username);

  const list0 = await agent.get(`${BASE}/api/tasks`);
  assert.strictEqual(list0.status, 200);
  assert.ok(Array.isArray(list0.body));
  assert.strictEqual(list0.body.length, 0);

  const create = await agent.post(`${BASE}/api/tasks`).send({
    title: 'Test task',
    description: 'Desc',
    status: 'pending',
  });
  assert.strictEqual(create.status, 201);
  assert.strictEqual(create.body.title, 'Test task');
  assert.strictEqual(create.body.status, 'pending');
  const taskId = create.body.id;

  const list1 = await agent.get(`${BASE}/api/tasks`);
  assert.strictEqual(list1.status, 200);
  assert.strictEqual(list1.body.length, 1);
  assert.strictEqual(list1.body[0].id, taskId);

  const getOne = await agent.get(`${BASE}/api/tasks/${taskId}`);
  assert.strictEqual(getOne.status, 200);
  assert.strictEqual(getOne.body.title, 'Test task');

  const update = await agent.put(`${BASE}/api/tasks/${taskId}`).send({
    title: 'Updated',
    status: 'completed',
  });
  assert.strictEqual(update.status, 200);
  assert.strictEqual(update.body.title, 'Updated');
  assert.strictEqual(update.body.status, 'completed');

  const filtered = await agent.get(`${BASE}/api/tasks?status=completed`);
  assert.strictEqual(filtered.status, 200);
  assert.strictEqual(filtered.body.length, 1);

  const del = await agent.delete(`${BASE}/api/tasks/${taskId}`);
  assert.strictEqual(del.status, 204);

  const list2 = await agent.get(`${BASE}/api/tasks`);
  assert.strictEqual(list2.status, 200);
  assert.strictEqual(list2.body.length, 0);
});

test('Login with wrong password returns 401', { skip: !process.env.DATABASE_URL }, async () => {
  const username = unique();
  await request(app).post(`${BASE}/api/auth/register`).send({ username, password: 'pass1234' });
  const res = await request(app).post(`${BASE}/api/auth/login`).send({
    username,
    password: 'wrong',
  });
  assert.strictEqual(res.status, 401);
});

test('POST /api/tasks without title returns 400', { skip: !process.env.DATABASE_URL }, async () => {
  const agent = request.agent(app);
  await agent.post(`${BASE}/api/auth/register`).send({ username: unique(), password: 'pass1234' });
  const res = await agent.post(`${BASE}/api/tasks`).send({ description: 'No title' });
  assert.strictEqual(res.status, 400);
});
