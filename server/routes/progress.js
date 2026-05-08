const express = require('express');
const { db } = require('../database');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

router.get('/', authMiddleware, async (req, res) => {
  try {
    const result = await db.execute({
      sql: 'SELECT * FROM game_progress WHERE user_id = ?',
      args: [req.userId]
    });

    const progress = result.rows[0];
    if (!progress) {
      return res.json({
        success: true,
        data: {
          level1_score: 0,
          level2_score: 0,
          level3_score: 0,
          total_score: 0,
          level1_completed: 0,
          level2_completed: 0,
          level3_completed: 0
        }
      });
    }

    res.json({ success: true, data: progress });
  } catch (err) {
    console.error('获取进度错误:', err);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
});

router.post('/', authMiddleware, async (req, res) => {
  const {
    level1_score,
    level2_score,
    level3_score,
    level1_completed,
    level2_completed,
    level3_completed
  } = req.body;

  const total_score = (level1_score || 0) + (level2_score || 0) + (level3_score || 0);

  try {
    const existing = await db.execute({
      sql: 'SELECT id FROM game_progress WHERE user_id = ?',
      args: [req.userId]
    });

    if (existing.rows.length > 0) {
      await db.execute({
        sql: `UPDATE game_progress SET
          level1_score = ?,
          level2_score = ?,
          level3_score = ?,
          total_score = ?,
          level1_completed = ?,
          level2_completed = ?,
          level3_completed = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE user_id = ?`,
        args: [
          level1_score || 0,
          level2_score || 0,
          level3_score || 0,
          total_score,
          level1_completed ? 1 : 0,
          level2_completed ? 1 : 0,
          level3_completed ? 1 : 0,
          req.userId
        ]
      });
    } else {
      await db.execute({
        sql: `INSERT INTO game_progress
        (user_id, level1_score, level2_score, level3_score, total_score,
         level1_completed, level2_completed, level3_completed)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          req.userId,
          level1_score || 0,
          level2_score || 0,
          level3_score || 0,
          total_score,
          level1_completed ? 1 : 0,
          level2_completed ? 1 : 0,
          level3_completed ? 1 : 0
        ]
      });
    }

    res.json({ success: true, message: '进度保存成功', data: { total_score } });
  } catch (err) {
    console.error('保存进度错误:', err);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
});

module.exports = router;
