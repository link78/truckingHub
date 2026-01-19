const pool = require('../config/database');

class Notification {
  /**
   * Create a new notification
   */
  static async create(notificationData) {
    const {
      userId, type, title, message,
      relatedJobId, relatedBidId, relatedUserId
    } = notificationData;

    const query = `
      INSERT INTO notifications (
        user_id, type, title, message,
        related_job_id, related_bid_id, related_user_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;

    const values = [
      userId, type, title, message,
      relatedJobId || null, relatedBidId || null, relatedUserId || null
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  /**
   * Find notification by ID
   */
  static async findById(id) {
    const query = 'SELECT * FROM notifications WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  /**
   * Get user notifications with pagination
   */
  static async findByUser(userId, options = {}) {
    const { limit = 50, offset = 0, unreadOnly = false } = options;

    let query = `
      SELECT n.*,
             j.title as job_title,
             u.first_name as related_user_first_name,
             u.last_name as related_user_last_name
      FROM notifications n
      LEFT JOIN jobs j ON n.related_job_id = j.id
      LEFT JOIN users u ON n.related_user_id = u.id
      WHERE n.user_id = $1
    `;

    const values = [userId];
    let paramCount = 2;

    if (unreadOnly) {
      query += ` AND n.is_read = FALSE`;
    }

    query += ` ORDER BY n.created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    values.push(limit, offset);

    const result = await pool.query(query, values);
    return result.rows;
  }

  /**
   * Get unread notifications for a user
   */
  static async findUnread(userId, options = {}) {
    return this.findByUser(userId, { ...options, unreadOnly: true });
  }

  /**
   * Mark notification as read
   */
  static async markAsRead(id, userId) {
    const query = `
      UPDATE notifications 
      SET is_read = TRUE, read_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND user_id = $2
      RETURNING *
    `;
    const result = await pool.query(query, [id, userId]);
    return result.rows[0];
  }

  /**
   * Mark multiple notifications as read
   */
  static async markMultipleAsRead(ids, userId) {
    const query = `
      UPDATE notifications 
      SET is_read = TRUE, read_at = CURRENT_TIMESTAMP
      WHERE id = ANY($1) AND user_id = $2
      RETURNING id
    `;
    const result = await pool.query(query, [ids, userId]);
    return result.rows;
  }

  /**
   * Mark all notifications as read for a user
   */
  static async markAllAsRead(userId) {
    const query = `
      UPDATE notifications 
      SET is_read = TRUE, read_at = CURRENT_TIMESTAMP
      WHERE user_id = $1 AND is_read = FALSE
      RETURNING id
    `;
    const result = await pool.query(query, [userId]);
    return result.rows;
  }

  /**
   * Get unread count for a user
   */
  static async getUnreadCount(userId) {
    const query = `
      SELECT COUNT(*) as unread_count
      FROM notifications
      WHERE user_id = $1 AND is_read = FALSE
    `;
    const result = await pool.query(query, [userId]);
    return parseInt(result.rows[0].unread_count);
  }

  /**
   * Delete notification
   */
  static async delete(id, userId) {
    const query = 'DELETE FROM notifications WHERE id = $1 AND user_id = $2 RETURNING id';
    const result = await pool.query(query, [id, userId]);
    return result.rows[0];
  }

  /**
   * Delete all notifications for a user
   */
  static async deleteAll(userId) {
    const query = 'DELETE FROM notifications WHERE user_id = $1 RETURNING id';
    const result = await pool.query(query, [userId]);
    return result.rows;
  }

  /**
   * Delete old read notifications (cleanup)
   */
  static async deleteOldRead(daysOld = 30) {
    const query = `
      DELETE FROM notifications 
      WHERE is_read = TRUE 
        AND read_at < CURRENT_TIMESTAMP - INTERVAL '${daysOld} days'
      RETURNING id
    `;
    const result = await pool.query(query);
    return result.rows.length;
  }
}

module.exports = Notification;
