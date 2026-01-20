const pool = require('../config/database');

class Rating {
  /**
   * Create a new rating
   */
  static async create(ratingData) {
    const {
      jobId, ratedUserId, ratingUserId, overallRating,
      communicationRating, professionalismRating, timelinessRating,
      reviewText, isAnonymous
    } = ratingData;

    const query = `
      INSERT INTO ratings (
        job_id, rated_user_id, rating_user_id, overall_rating,
        communication_rating, professionalism_rating, timeliness_rating,
        review_text, is_anonymous
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;

    const values = [
      jobId, ratedUserId, ratingUserId, overallRating,
      communicationRating || null, professionalismRating || null, timelinessRating || null,
      reviewText || null, isAnonymous || false
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  /**
   * Find rating by ID
   */
  static async findById(id) {
    const query = `
      SELECT r.*,
             j.title as job_title,
             u1.first_name as rated_user_first_name, u1.last_name as rated_user_last_name,
             u1.company_name as rated_user_company,
             u2.first_name as rating_user_first_name, u2.last_name as rating_user_last_name,
             u2.company_name as rating_user_company
      FROM ratings r
      LEFT JOIN jobs j ON r.job_id = j.id
      LEFT JOIN users u1 ON r.rated_user_id = u1.id
      LEFT JOIN users u2 ON r.rating_user_id = u2.id
      WHERE r.id = $1
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  /**
   * Find all ratings with filters
   */
  static async findAll(filters = {}) {
    let query = `
      SELECT r.*,
             j.title as job_title,
             u1.first_name as rated_user_first_name, u1.last_name as rated_user_last_name,
             u1.company_name as rated_user_company
    `;

    // Don't include rating user info if showing only anonymous ratings
    if (!filters.hideRatingUser) {
      query += `,
             u2.first_name as rating_user_first_name, u2.last_name as rating_user_last_name,
             u2.company_name as rating_user_company
      `;
    }

    query += `
      FROM ratings r
      LEFT JOIN jobs j ON r.job_id = j.id
      LEFT JOIN users u1 ON r.rated_user_id = u1.id
    `;

    if (!filters.hideRatingUser) {
      query += ' LEFT JOIN users u2 ON r.rating_user_id = u2.id';
    }

    query += ' WHERE 1=1';

    const values = [];
    let paramCount = 1;

    if (filters.ratedUserId) {
      query += ` AND r.rated_user_id = $${paramCount}`;
      values.push(filters.ratedUserId);
      paramCount++;
    }

    if (filters.ratingUserId) {
      query += ` AND r.rating_user_id = $${paramCount}`;
      values.push(filters.ratingUserId);
      paramCount++;
    }

    if (filters.jobId) {
      query += ` AND r.job_id = $${paramCount}`;
      values.push(filters.jobId);
      paramCount++;
    }

    if (filters.minRating) {
      query += ` AND r.overall_rating >= $${paramCount}`;
      values.push(filters.minRating);
      paramCount++;
    }

    query += ' ORDER BY r.created_at DESC';

    if (filters.limit) {
      query += ` LIMIT $${paramCount}`;
      values.push(filters.limit);
      paramCount++;
    }

    if (filters.offset) {
      query += ` OFFSET $${paramCount}`;
      values.push(filters.offset);
    }

    const result = await pool.query(query, values);
    
    // Hide rating user info for anonymous ratings
    return result.rows.map(row => {
      if (row.is_anonymous) {
        delete row.rating_user_first_name;
        delete row.rating_user_last_name;
        delete row.rating_user_company;
      }
      return row;
    });
  }

  /**
   * Find ratings for a specific user
   */
  static async findByUser(userId, options = {}) {
    return this.findAll({ ...options, ratedUserId: userId });
  }

  /**
   * Find ratings given by a specific user
   */
  static async findByRatingUser(userId, options = {}) {
    return this.findAll({ ...options, ratingUserId: userId });
  }

  /**
   * Find ratings for a specific job
   */
  static async findByJob(jobId, options = {}) {
    return this.findAll({ ...options, jobId });
  }

  /**
   * Update rating
   */
  static async update(id, updateData, ratingUserId) {
    const allowedFields = [
      'overall_rating', 'communication_rating', 'professionalism_rating',
      'timeliness_rating', 'review_text', 'is_anonymous'
    ];

    const updates = [];
    const values = [];
    let paramCount = 1;

    for (const [key, value] of Object.entries(updateData)) {
      const dbField = key.replace(/([A-Z])/g, '_$1').toLowerCase();
      if (allowedFields.includes(dbField)) {
        updates.push(`${dbField} = $${paramCount}`);
        values.push(value);
        paramCount++;
      }
    }

    if (updates.length === 0) {
      throw new Error('No valid fields to update');
    }

    values.push(id, ratingUserId);
    const query = `
      UPDATE ratings 
      SET ${updates.join(', ')}
      WHERE id = $${paramCount} AND rating_user_id = $${paramCount + 1}
      RETURNING *
    `;

    const result = await pool.query(query, values);
    if (result.rows.length === 0) {
      throw new Error('Rating not found or unauthorized');
    }
    return result.rows[0];
  }

  /**
   * Add response to rating (by the rated user)
   */
  static async addResponse(id, ratedUserId, responseText) {
    const query = `
      UPDATE ratings 
      SET response_text = $1, response_date = CURRENT_TIMESTAMP
      WHERE id = $2 AND rated_user_id = $3
      RETURNING *
    `;
    const result = await pool.query(query, [responseText, id, ratedUserId]);
    if (result.rows.length === 0) {
      throw new Error('Rating not found or unauthorized');
    }
    return result.rows[0];
  }

  /**
   * Calculate average rating for a user
   */
  static async getAverageRating(userId) {
    const query = `
      SELECT 
        COALESCE(AVG(overall_rating), 0) as average_rating,
        COUNT(*) as total_ratings,
        AVG(communication_rating) as avg_communication,
        AVG(professionalism_rating) as avg_professionalism,
        AVG(timeliness_rating) as avg_timeliness,
        COUNT(CASE WHEN overall_rating = 5 THEN 1 END) as five_star_count,
        COUNT(CASE WHEN overall_rating = 4 THEN 1 END) as four_star_count,
        COUNT(CASE WHEN overall_rating = 3 THEN 1 END) as three_star_count,
        COUNT(CASE WHEN overall_rating = 2 THEN 1 END) as two_star_count,
        COUNT(CASE WHEN overall_rating = 1 THEN 1 END) as one_star_count
      FROM ratings
      WHERE rated_user_id = $1
    `;
    const result = await pool.query(query, [userId]);
    return result.rows[0];
  }

  /**
   * Delete rating
   */
  static async delete(id, ratingUserId) {
    const query = `
      DELETE FROM ratings 
      WHERE id = $1 AND rating_user_id = $2
      RETURNING id
    `;
    const result = await pool.query(query, [id, ratingUserId]);
    if (result.rows.length === 0) {
      throw new Error('Rating not found or unauthorized');
    }
    return result.rows[0];
  }

  /**
   * Check if user can rate (one rating per user per job)
   */
  static async canRate(jobId, ratedUserId, ratingUserId) {
    const query = `
      SELECT COUNT(*) as count
      FROM ratings
      WHERE job_id = $1 AND rated_user_id = $2 AND rating_user_id = $3
    `;
    const result = await pool.query(query, [jobId, ratedUserId, ratingUserId]);
    return parseInt(result.rows[0].count) === 0;
  }
}

module.exports = Rating;
