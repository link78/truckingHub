const { query } = require('../config/database');

/**
 * User Model
 * Handles all database operations related to users
 */
class User {
  /**
   * Create a new user
   * @param {Object} userData - User data
   * @returns {Object} Created user
   */
  static async create(userData) {
    const {
      name,
      email,
      password_hash,
      phone,
      role,
      company_name,
      city,
      state,
      country,
      bio,
      profile_picture_url,
    } = userData;

    const sql = `
      INSERT INTO users (
        name, email, password_hash, phone, role, 
        company_name, city, state, country, bio, profile_picture_url
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING id, name, email, phone, role, company_name, city, state, 
                country, bio, profile_picture_url, verified, average_rating, 
                total_ratings, created_at, updated_at
    `;

    const values = [
      name,
      email,
      password_hash,
      phone || null,
      role,
      company_name || null,
      city || null,
      state || null,
      country || null,
      bio || null,
      profile_picture_url || null,
    ];

    const result = await query(sql, values);
    return result.rows[0];
  }

  /**
   * Find user by email
   * @param {string} email - User email
   * @returns {Object|null} User object or null
   */
  static async findByEmail(email) {
    const sql = `
      SELECT id, name, email, password_hash, phone, role, company_name, 
             city, state, country, bio, profile_picture_url, verified, 
             verification_token, verification_token_expiry, average_rating, 
             total_ratings, last_login, created_at, updated_at
      FROM users
      WHERE email = $1
    `;

    const result = await query(sql, [email]);
    return result.rows[0] || null;
  }

  /**
   * Find user by ID
   * @param {string} userId - User ID (UUID)
   * @returns {Object|null} User object or null
   */
  static async findById(userId) {
    const sql = `
      SELECT id, name, email, phone, role, company_name, city, state, 
             country, bio, profile_picture_url, verified, average_rating, 
             total_ratings, last_login, created_at, updated_at
      FROM users
      WHERE id = $1
    `;

    const result = await query(sql, [userId]);
    return result.rows[0] || null;
  }

  /**
   * Update user profile
   * @param {string} userId - User ID
   * @param {Object} updates - Fields to update
   * @returns {Object} Updated user
   */
  static async updateProfile(userId, updates) {
    const allowedFields = [
      'name',
      'phone',
      'company_name',
      'city',
      'state',
      'country',
      'bio',
      'profile_picture_url',
    ];

    const updateFields = [];
    const values = [];
    let paramCount = 1;

    Object.keys(updates).forEach((key) => {
      if (allowedFields.includes(key) && updates[key] !== undefined) {
        updateFields.push(`${key} = $${paramCount}`);
        values.push(updates[key]);
        paramCount++;
      }
    });

    if (updateFields.length === 0) {
      throw new Error('No valid fields to update');
    }

    values.push(userId);

    const sql = `
      UPDATE users
      SET ${updateFields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING id, name, email, phone, role, company_name, city, state, 
                country, bio, profile_picture_url, verified, average_rating, 
                total_ratings, created_at, updated_at
    `;

    const result = await query(sql, values);
    return result.rows[0];
  }

  /**
   * Update user password
   * @param {string} userId - User ID
   * @param {string} newPasswordHash - New password hash
   * @returns {boolean} Success status
   */
  static async updatePassword(userId, newPasswordHash) {
    const sql = `
      UPDATE users
      SET password_hash = $1
      WHERE id = $2
    `;

    await query(sql, [newPasswordHash, userId]);
    return true;
  }

  /**
   * Update last login timestamp
   * @param {string} userId - User ID
   */
  static async updateLastLogin(userId) {
    const sql = `
      UPDATE users
      SET last_login = CURRENT_TIMESTAMP
      WHERE id = $1
    `;

    await query(sql, [userId]);
  }

  /**
   * Set email verification token
   * @param {string} userId - User ID
   * @param {string} token - Verification token
   * @param {Date} expiry - Token expiry date
   */
  static async setVerificationToken(userId, token, expiry) {
    const sql = `
      UPDATE users
      SET verification_token = $1, verification_token_expiry = $2
      WHERE id = $3
    `;

    await query(sql, [token, expiry, userId]);
  }

  /**
   * Verify user email
   * @param {string} token - Verification token
   * @returns {Object|null} User object or null
   */
  static async verifyEmail(token) {
    const sql = `
      UPDATE users
      SET verified = true, verification_token = NULL, verification_token_expiry = NULL
      WHERE verification_token = $1 
        AND verification_token_expiry > CURRENT_TIMESTAMP
      RETURNING id, name, email, phone, role, company_name, city, state, 
                country, bio, profile_picture_url, verified, average_rating, 
                total_ratings, created_at, updated_at
    `;

    const result = await query(sql, [token]);
    return result.rows[0] || null;
  }

  /**
   * Get user by verification token
   * @param {string} token - Verification token
   * @returns {Object|null} User object or null
   */
  static async findByVerificationToken(token) {
    const sql = `
      SELECT id, name, email, verified, verification_token_expiry
      FROM users
      WHERE verification_token = $1
    `;

    const result = await query(sql, [token]);
    return result.rows[0] || null;
  }
}

module.exports = User;
