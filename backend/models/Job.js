const pool = require('../config/database');
const { JOB_STATUS } = require('../config/constants');

class Job {
  /**
   * Create a new job posting
   */
  static async create(jobData) {
    const {
      postedBy, title, description, cargoType, cargoWeight, cargoWeightUnit,
      originAddress, originCity, originState, originZip, originCountry,
      pickupDate, pickupTime,
      destinationAddress, destinationCity, destinationState, destinationZip, destinationCountry,
      deliveryDate, deliveryTime,
      distanceMiles, basePrice, currency, priority,
      specialInstructions, requiresTeamDriver, requiresHazmat
    } = jobData;

    const query = `
      INSERT INTO jobs (
        posted_by, title, description, cargo_type, cargo_weight, cargo_weight_unit,
        origin_address, origin_city, origin_state, origin_zip, origin_country,
        pickup_date, pickup_time,
        destination_address, destination_city, destination_state, destination_zip, destination_country,
        delivery_date, delivery_time,
        distance_miles, base_price, currency, priority,
        special_instructions, requires_team_driver, requires_hazmat, status
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, 
        $21, $22, $23, $24, $25, $26, $27, $28
      )
      RETURNING *
    `;

    const values = [
      postedBy, title, description, cargoType, cargoWeight, cargoWeightUnit || 'lbs',
      originAddress, originCity, originState, originZip, originCountry || 'USA',
      pickupDate, pickupTime || null,
      destinationAddress, destinationCity, destinationState, destinationZip, destinationCountry || 'USA',
      deliveryDate, deliveryTime || null,
      distanceMiles, basePrice, currency || 'USD', priority || 'normal',
      specialInstructions, requiresTeamDriver || false, requiresHazmat || false, JOB_STATUS.OPEN
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  /**
   * Find job by ID
   */
  static async findById(id) {
    const query = `
      SELECT j.*, 
             u1.first_name as poster_first_name, u1.last_name as poster_last_name, 
             u1.company_name as poster_company,
             u2.first_name as assignee_first_name, u2.last_name as assignee_last_name,
             u2.company_name as assignee_company
      FROM jobs j
      LEFT JOIN users u1 ON j.posted_by = u1.id
      LEFT JOIN users u2 ON j.assigned_to = u2.id
      WHERE j.id = $1
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  /**
   * Find all jobs with filters
   */
  static async findAll(filters = {}) {
    let query = `
      SELECT j.*, 
             u1.first_name as poster_first_name, u1.last_name as poster_last_name,
             u1.company_name as poster_company,
             u2.first_name as assignee_first_name, u2.last_name as assignee_last_name
      FROM jobs j
      LEFT JOIN users u1 ON j.posted_by = u1.id
      LEFT JOIN users u2 ON j.assigned_to = u2.id
      WHERE 1=1
    `;
    const values = [];
    let paramCount = 1;

    if (filters.status) {
      query += ` AND j.status = $${paramCount}`;
      values.push(filters.status);
      paramCount++;
    }

    if (filters.postedBy) {
      query += ` AND j.posted_by = $${paramCount}`;
      values.push(filters.postedBy);
      paramCount++;
    }

    if (filters.assignedTo) {
      query += ` AND j.assigned_to = $${paramCount}`;
      values.push(filters.assignedTo);
      paramCount++;
    }

    if (filters.cargoType) {
      query += ` AND j.cargo_type = $${paramCount}`;
      values.push(filters.cargoType);
      paramCount++;
    }

    if (filters.originState) {
      query += ` AND j.origin_state = $${paramCount}`;
      values.push(filters.originState);
      paramCount++;
    }

    if (filters.destinationState) {
      query += ` AND j.destination_state = $${paramCount}`;
      values.push(filters.destinationState);
      paramCount++;
    }

    if (filters.minPrice) {
      query += ` AND j.base_price >= $${paramCount}`;
      values.push(filters.minPrice);
      paramCount++;
    }

    if (filters.maxPrice) {
      query += ` AND j.base_price <= $${paramCount}`;
      values.push(filters.maxPrice);
      paramCount++;
    }

    if (filters.pickupDateFrom) {
      query += ` AND j.pickup_date >= $${paramCount}`;
      values.push(filters.pickupDateFrom);
      paramCount++;
    }

    if (filters.pickupDateTo) {
      query += ` AND j.pickup_date <= $${paramCount}`;
      values.push(filters.pickupDateTo);
      paramCount++;
    }

    query += ' ORDER BY j.created_at DESC';

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
   * Find open jobs
   */
  static async findOpen(filters = {}) {
    return this.findAll({ ...filters, status: JOB_STATUS.OPEN });
  }

  /**
   * Update job
   */
  static async update(id, updateData) {
    const allowedFields = [
      'title', 'description', 'cargo_type', 'cargo_weight', 'cargo_weight_unit',
      'origin_address', 'origin_city', 'origin_state', 'origin_zip',
      'pickup_date', 'pickup_time',
      'destination_address', 'destination_city', 'destination_state', 'destination_zip',
      'delivery_date', 'delivery_time',
      'distance_miles', 'base_price', 'priority',
      'special_instructions', 'requires_team_driver', 'requires_hazmat'
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
      UPDATE jobs 
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  /**
   * Assign job to trucker
   */
  static async assign(jobId, truckerId) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const query = `
        UPDATE jobs 
        SET assigned_to = $1, status = $2
        WHERE id = $3 AND status = $4
        RETURNING *
      `;
      const result = await client.query(query, [
        truckerId,
        JOB_STATUS.ASSIGNED,
        jobId,
        JOB_STATUS.OPEN
      ]);

      if (result.rows.length === 0) {
        throw new Error('Job not found or already assigned');
      }

      await client.query('COMMIT');
      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Update job status
   */
  static async updateStatus(id, status) {
    const query = `
      UPDATE jobs 
      SET status = $1, 
          completed_at = CASE WHEN $1 = 'completed' THEN CURRENT_TIMESTAMP ELSE completed_at END
      WHERE id = $2
      RETURNING *
    `;
    const result = await pool.query(query, [status, id]);
    return result.rows[0];
  }

  /**
   * Start job (change status to in_progress)
   */
  static async start(id) {
    return this.updateStatus(id, JOB_STATUS.IN_PROGRESS);
  }

  /**
   * Complete job
   */
  static async complete(id) {
    return this.updateStatus(id, JOB_STATUS.COMPLETED);
  }

  /**
   * Cancel job
   */
  static async cancel(id) {
    return this.updateStatus(id, JOB_STATUS.CANCELLED);
  }

  /**
   * Get job statistics
   */
  static async getStats(userId = null) {
    let query = `
      SELECT 
        COUNT(*) as total_jobs,
        COUNT(CASE WHEN status = 'open' THEN 1 END) as open_jobs,
        COUNT(CASE WHEN status = 'assigned' THEN 1 END) as assigned_jobs,
        COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress_jobs,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_jobs,
        COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_jobs,
        AVG(base_price) as avg_price
      FROM jobs
    `;

    const values = [];
    if (userId) {
      query += ' WHERE posted_by = $1 OR assigned_to = $1';
      values.push(userId);
    }

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  /**
   * Delete job
   */
  static async delete(id) {
    const query = 'DELETE FROM jobs WHERE id = $1 RETURNING id';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }
}

module.exports = Job;
