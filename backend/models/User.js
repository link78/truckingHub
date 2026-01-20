const pool = require('../config/database');
const bcrypt = require('bcrypt');

const SALT_ROUNDS = 10;

class User {
  /**
   * Create a new user
   */
  static async create(userData) {
    const {
      email, password, firstName, lastName, phone, companyName, roleId,
      addressLine1, addressLine2, city, state, zipCode, country,
      licenseNumber, licenseExpiry, insurancePolicy, insuranceExpiry,
      truckType, truckCapacity
    } = userData;

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const query = `
      INSERT INTO users (
        email, password_hash, first_name, last_name, phone, company_name, role_id,
        address_line1, address_line2, city, state, zip_code, country,
        license_number, license_expiry, insurance_policy, insurance_expiry,
        truck_type, truck_capacity
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
      RETURNING id, email, first_name, last_name, phone, company_name, role_id, 
                is_verified, is_active, average_rating, total_ratings, created_at
    `;

    const values = [
      email, passwordHash, firstName, lastName, phone, companyName, roleId,
      addressLine1, addressLine2, city, state, zipCode, country || 'USA',
      licenseNumber, licenseExpiry, insurancePolicy, insuranceExpiry,
      truckType, truckCapacity
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  /**
   * Find user by ID
   */
  static async findById(id) {
    const query = `
      SELECT u.*, r.name as role_name
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      WHERE u.id = $1
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  /**
   * Find user by email
   */
  static async findByEmail(email) {
    const query = `
      SELECT u.*, r.name as role_name
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      WHERE u.email = $1
    `;
    const result = await pool.query(query, [email]);
    return result.rows[0];
  }

  /**
   * Find all users with optional filtering
   */
  static async findAll(filters = {}) {
    let query = `
      SELECT u.id, u.email, u.first_name, u.last_name, u.phone, u.company_name,
             u.city, u.state, u.is_verified, u.is_active, u.average_rating, 
             u.total_ratings, u.created_at, r.name as role_name
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      WHERE 1=1
    `;
    const values = [];
    let paramCount = 1;

    if (filters.roleId) {
      query += ` AND u.role_id = $${paramCount}`;
      values.push(filters.roleId);
      paramCount++;
    }

    if (filters.isActive !== undefined) {
      query += ` AND u.is_active = $${paramCount}`;
      values.push(filters.isActive);
      paramCount++;
    }

    if (filters.isVerified !== undefined) {
      query += ` AND u.is_verified = $${paramCount}`;
      values.push(filters.isVerified);
      paramCount++;
    }

    query += ' ORDER BY u.created_at DESC';

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
    return result.rows;
  }

  /**
   * Update user profile
   */
  static async update(id, updateData) {
    const allowedFields = [
      'first_name', 'last_name', 'phone', 'company_name',
      'address_line1', 'address_line2', 'city', 'state', 'zip_code', 'country',
      'license_number', 'license_expiry', 'insurance_policy', 'insurance_expiry',
      'truck_type', 'truck_capacity', 'is_verified', 'is_active',
      'email_verified', 'phone_verified'
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

    values.push(id);
    const query = `
      UPDATE users 
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING id, email, first_name, last_name, phone, company_name, 
                is_verified, is_active, average_rating, total_ratings, updated_at
    `;

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  /**
   * Verify password
   */
  static async verifyPassword(email, password) {
    const user = await this.findByEmail(email);
    if (!user) {
      return null;
    }

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return null;
    }

    // Update last login
    await pool.query(
      'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
      [user.id]
    );

    // Remove password hash from returned user
    delete user.password_hash;
    return user;
  }

  /**
   * Update password
   */
  static async updatePassword(id, newPassword) {
    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    const query = 'UPDATE users SET password_hash = $1 WHERE id = $2 RETURNING id';
    const result = await pool.query(query, [passwordHash, id]);
    return result.rows[0];
  }

  /**
   * Activate user
   */
  static async activate(id) {
    const query = 'UPDATE users SET is_active = TRUE WHERE id = $1 RETURNING id, is_active';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  /**
   * Deactivate user
   */
  static async deactivate(id) {
    const query = 'UPDATE users SET is_active = FALSE WHERE id = $1 RETURNING id, is_active';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  /**
   * Get user rating statistics
   */
  static async getRatingStats(id) {
    const query = `
      SELECT 
        u.average_rating,
        u.total_ratings,
        COUNT(CASE WHEN r.overall_rating = 5 THEN 1 END) as five_star,
        COUNT(CASE WHEN r.overall_rating = 4 THEN 1 END) as four_star,
        COUNT(CASE WHEN r.overall_rating = 3 THEN 1 END) as three_star,
        COUNT(CASE WHEN r.overall_rating = 2 THEN 1 END) as two_star,
        COUNT(CASE WHEN r.overall_rating = 1 THEN 1 END) as one_star,
        AVG(r.communication_rating) as avg_communication,
        AVG(r.professionalism_rating) as avg_professionalism,
        AVG(r.timeliness_rating) as avg_timeliness
      FROM users u
      LEFT JOIN ratings r ON u.id = r.rated_user_id
      WHERE u.id = $1
      GROUP BY u.id, u.average_rating, u.total_ratings
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  /**
   * Delete user (soft delete by deactivating)
   */
  static async delete(id) {
    return this.deactivate(id);
  }
}

module.exports = User;
