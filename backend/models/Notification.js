const { query } = require('../config/database');

const mapNotif = (row) => {
  if (!row) return null;
  return {
    _id: row.id,
    id: row.id,
    user: row.user_id,
    title: row.title,
    message: row.message,
    type: row.type,
    relatedTo: row.related_to,
    isRead: row.is_read,
    readAt: row.read_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
};

const Notification = {
  async create({ user, title, message, type = 'system', relatedTo = null }) {
    const { rows } = await query(
      `INSERT INTO notifications (user_id, title, message, type, related_to)
       VALUES ($1, $2, $3, $4, $5::jsonb) RETURNING *`,
      [user, title, message, type, relatedTo ? JSON.stringify(relatedTo) : null]
    );
    return mapNotif(rows[0]);
  },

  async findByUser(userId, { page = 1, limit = 20, unreadOnly = false }) {
    const unreadClause = unreadOnly ? 'AND is_read = FALSE' : '';
    const countRes = await query(
      `SELECT COUNT(*)::int AS total FROM notifications WHERE user_id = $1 ${unreadClause}`,
      [userId]
    );
    const unreadRes = await query(
      `SELECT COUNT(*)::int AS cnt FROM notifications WHERE user_id = $1 AND is_read = FALSE`,
      [userId]
    );
    const offset = (Number(page) - 1) * Number(limit);
    const { rows } = await query(
      `SELECT * FROM notifications WHERE user_id = $1 ${unreadClause} ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
      [userId, Number(limit), offset]
    );
    return {
      notifications: rows.map(mapNotif),
      total: countRes.rows[0].total,
      unreadCount: unreadRes.rows[0].cnt,
    };
  },

  async markAsRead(id) {
    await query('UPDATE notifications SET is_read = TRUE, read_at = NOW(), updated_at = NOW() WHERE id = $1', [id]);
  },

  async markAllAsRead(userId) {
    await query(
      'UPDATE notifications SET is_read = TRUE, read_at = NOW(), updated_at = NOW() WHERE user_id = $1 AND is_read = FALSE',
      [userId]
    );
  },

  async deleteById(id) {
    await query('DELETE FROM notifications WHERE id = $1', [id]);
  },
};

module.exports = Notification;
