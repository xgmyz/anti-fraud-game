const express = require('express');
const bcrypt = require('bcryptjs');
const { db } = require('../database');
const { authMiddleware, generateToken } = require('../middleware/auth');

const router = express.Router();

router.post('/register', async (req, res) => {
  const { username, password, nickname } = req.body;

  if (!username || !password) {
    return res.status(400).json({ success: false, message: '用户名和密码不能为空' });
  }
  if (username.length < 3 || username.length > 20) {
    return res.status(400).json({ success: false, message: '用户名长度为3-20个字符' });
  }
  if (password.length < 6) {
    return res.status(400).json({ success: false, message: '密码长度至少6位' });
  }

  try {
    const existing = await db.execute({
      sql: 'SELECT id FROM users WHERE username = ?',
      args: [username]
    });
    if (existing.rows.length > 0) {
      return res.status(409).json({ success: false, message: '用户名已存在' });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    const result = await db.execute({
      sql: 'INSERT INTO users (username, password, nickname) VALUES (?, ?, ?)',
      args: [username, hashedPassword, nickname || username]
    });

    const user = await db.execute({
      sql: 'SELECT id, username, nickname, created_at FROM users WHERE id = ?',
      args: [result.lastInsertRowid]
    });

    const token = generateToken(user.rows[0]);

    res.json({ success: true, message: '注册成功', data: { user: user.rows[0], token } });
  } catch (err) {
    console.error('注册错误:', err);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
});

router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ success: false, message: '用户名和密码不能为空' });
  }

  try {
    const result = await db.execute({
      sql: 'SELECT * FROM users WHERE username = ?',
      args: [username]
    });
    const user = result.rows[0];
    if (!user) {
      return res.status(401).json({ success: false, message: '用户名或密码错误' });
    }

    const isValid = bcrypt.compareSync(password, user.password);
    if (!isValid) {
      return res.status(401).json({ success: false, message: '用户名或密码错误' });
    }

    const safeUser = {
      id: user.id,
      username: user.username,
      nickname: user.nickname,
      created_at: user.created_at
    };
    const token = generateToken(safeUser);

    res.json({ success: true, message: '登录成功', data: { user: safeUser, token } });
  } catch (err) {
    console.error('登录错误:', err);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
});

router.get('/me', authMiddleware, async (req, res) => {
  try {
    const result = await db.execute({
      sql: 'SELECT id, username, nickname, created_at FROM users WHERE id = ?',
      args: [req.userId]
    });
    const user = result.rows[0];
    if (!user) {
      return res.status(404).json({ success: false, message: '用户不存在' });
    }
    res.json({ success: true, data: { user } });
  } catch (err) {
    console.error('获取用户信息错误:', err);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
});

module.exports = router;
