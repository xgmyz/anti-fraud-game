const express = require('express');
const { db } = require('../database');
const { authMiddleware, JWT_SECRET } = require('../middleware/auth');
const jwt = require('jsonwebtoken');

const router = express.Router();

router.get('/', async (req, res) => {
  const { type = 'global', limit = 50 } = req.query;

  try {
    let records;
    if (type === 'personal' && req.headers.authorization) {
      const token = req.headers.authorization.slice(7);
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const result = await db.execute({
          sql: `SELECT l.*, u.nickname, u.username
          FROM leaderboard l
          JOIN users u ON l.user_id = u.id
          WHERE l.user_id = ?
          ORDER BY l.total_score DESC, l.recorded_at ASC
          LIMIT ?`,
          args: [decoded.userId, parseInt(limit) || 50]
        });
        records = result.rows;
      } catch {
        records = [];
      }
    } else {
      const result = await db.execute({
        sql: `SELECT l.*, u.nickname, u.username
        FROM leaderboard l
        JOIN users u ON l.user_id = u.id
        ORDER BY l.total_score DESC, l.recorded_at ASC
        LIMIT ?`,
        args: [parseInt(limit) || 50]
      });
      records = result.rows;
    }

    res.json({ success: true, data: { records } });
  } catch (err) {
    console.error('获取排行榜错误:', err);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
});

router.post('/', authMiddleware, async (req, res) => {
  const { total_score, total_time, difficulty } = req.body;

  if (total_score === undefined || total_score === null) {
    return res.status(400).json({ success: false, message: '分数不能为空' });
  }

  try {
    const result = await db.execute({
      sql: `INSERT INTO leaderboard (user_id, total_score, total_time, difficulty)
      VALUES (?, ?, ?, ?)`,
      args: [
        req.userId,
        total_score,
        total_time || 0,
        difficulty || 'medium'
      ]
    });

    const recordResult = await db.execute({
      sql: `SELECT l.*, u.nickname, u.username
      FROM leaderboard l
      JOIN users u ON l.user_id = u.id
      WHERE l.id = ?`,
      args: [result.lastInsertRowid]
    });

    res.json({ success: true, message: '分数提交成功', data: { record: recordResult.rows[0] } });
  } catch (err) {
    console.error('提交排行榜错误:', err);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
});

module.exports = router;
