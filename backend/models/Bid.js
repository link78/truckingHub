const pool = require('../config/database');
const { BID_STATUS, JOB_STATUS } = require('../config/constants');

class Bid {
  /**
   * Create a new bid
   */
  static async create(bidData) {
    const {
      jobId, truckerId, bidAmount, currency,
      proposedPickupDate, proposedDeliveryDate, message
    } = bidData;

    const query = `
      INSERT INTO bids (
        job_id, trucker_id, bid_amount, currency,
        proposed_pickup_date, proposed_delivery_date, message, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;

    const values = [
      jobId, truckerId, bidAmount, currency || 'USD',
      proposedPickupDate, proposedDeliveryDate, message, BID_STATUS.PENDING
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  /**
   * Find bid by ID
   */
  static async findById(id) {
    const query = `
      SELECT b.*, 
             u.first_name as trucker_first_name, u.last_name as trucker_last_name,
             u.company_name as trucker_company, u.average_rating as trucker_rating,
             j.title as job_title, j.status as job_status
      FROM bids b
      LEFT JOIN users u ON b.trucker_id = u.id
      LEFT JOIN jobs j ON b.job_id = j.id
      WHERE b.id = $1
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  /**
   * Find all bids with filters
   */
  static async findAll(filters = {}) {
    let query = `
      SELECT b.*, 
             u.first_name as trucker_first_name, u.last_name as trucker_last_name,
             u.company_name as trucker_company, u.average_rating as trucker_rating,
             j.title as job_title, j.status as job_status
      FROM bids b
      LEFT JOIN users u ON b.trucker_id = u.id
      LEFT JOIN jobs j ON b.job_id = j.id
      WHERE 1=1
    `;
    const values = [];
    let paramCount = 1;

    if (filters.jobId) {
      query += ` AND b.job_id = $${paramCount}`;
      values.push(filters.jobId);
      paramCount++;
    }

    if (filters.truckerId) {
      query += ` AND b.trucker_id = $${paramCount}`;
      values.push(filters.truckerId);
      paramCount++;
    }

    if (filters.status) {
      query += ` AND b.status = $${paramCount}`;
      values.push(filters.status);
      paramCount++;
    }

    query += ' ORDER BY b.created_at DESC';

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
   * Find bids by job ID
   */
  static async findByJob(jobId, filters = {}) {
    return this.findAll({ ...filters, jobId });
  }

  /**
   * Find bids by trucker ID
   */
  static async findByTrucker(truckerId, filters = {}) {
    return this.findAll({ ...filters, truckerId });
  }

  /**
   * Find pending bids
   */
  static async findPending(filters = {}) {
    return this.findAll({ ...filters, status: BID_STATUS.PENDING });
  }

  /**
   * Update bid
   */
  static async update(id, updateData) {
    const allowedFields = [
      'bid_amount', 'proposed_pickup_date', 'proposed_delivery_date', 'message'
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
      UPDATE bids 
      SET ${updates.join(', ')}
      WHERE id = $${paramCount} AND status = $${paramCount + 1}
      RETURNING *
    `;
    values.push(BID_STATUS.PENDING);

    const result = await pool.query(query, values);
    if (result.rows.length === 0) {
      throw new Error('Bid not found or cannot be updated');
    }
    return result.rows[0];
  }

  /**
   * Accept bid (with transaction to update job)
   */
  static async accept(id) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Get bid details
      const bidQuery = 'SELECT * FROM bids WHERE id = $1 AND status = $2';
      const bidResult = await client.query(bidQuery, [id, BID_STATUS.PENDING]);
      
      if (bidResult.rows.length === 0) {
        throw new Error('Bid not found or already processed');
      }

      const bid = bidResult.rows[0];

      // Update bid status
      const updateBidQuery = `
        UPDATE bids 
        SET status = $1, responded_at = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING *
      `;
      const updatedBid = await client.query(updateBidQuery, [BID_STATUS.ACCEPTED, id]);

      // Assign job to trucker
      const updateJobQuery = `
        UPDATE jobs 
        SET assigned_to = $1, status = $2
        WHERE id = $3 AND status = $4
      `;
      await client.query(updateJobQuery, [
        bid.trucker_id,
        JOB_STATUS.ASSIGNED,
        bid.job_id,
        JOB_STATUS.OPEN
      ]);

      // Reject all other bids for this job
      const rejectOthersQuery = `
        UPDATE bids 
        SET status = $1, responded_at = CURRENT_TIMESTAMP
        WHERE job_id = $2 AND id != $3 AND status = $4
      `;
      await client.query(rejectOthersQuery, [
        BID_STATUS.REJECTED,
        bid.job_id,
        id,
        BID_STATUS.PENDING
      ]);

      await client.query('COMMIT');
      return updatedBid.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Reject bid
   */
  static async reject(id) {
    const query = `
      UPDATE bids 
      SET status = $1, responded_at = CURRENT_TIMESTAMP
      WHERE id = $2 AND status = $3
      RETURNING *
    `;
    const result = await pool.query(query, [BID_STATUS.REJECTED, id, BID_STATUS.PENDING]);
    if (result.rows.length === 0) {
      throw new Error('Bid not found or already processed');
    }
    return result.rows[0];
  }

  /**
   * Withdraw bid
   */
  static async withdraw(id, truckerId) {
    const query = `
      UPDATE bids 
      SET status = $1
      WHERE id = $2 AND trucker_id = $3 AND status = $4
      RETURNING *
    `;
    const result = await pool.query(query, [
      BID_STATUS.WITHDRAWN,
      id,
      truckerId,
      BID_STATUS.PENDING
    ]);
    if (result.rows.length === 0) {
      throw new Error('Bid not found, unauthorized, or cannot be withdrawn');
    }
    return result.rows[0];
  }

  /**
   * Get bid statistics
   */
  static async getStats(userId = null, userType = null) {
    let query = `
      SELECT 
        COUNT(*) as total_bids,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_bids,
        COUNT(CASE WHEN status = 'accepted' THEN 1 END) as accepted_bids,
        COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_bids,
        COUNT(CASE WHEN status = 'withdrawn' THEN 1 END) as withdrawn_bids,
        AVG(bid_amount) as avg_bid_amount
      FROM bids
    `;

    const values = [];
    if (userId && userType === 'trucker') {
      query += ' WHERE trucker_id = $1';
      values.push(userId);
    } else if (userId && userType === 'poster') {
      query += ' WHERE job_id IN (SELECT id FROM jobs WHERE posted_by = $1)';
      values.push(userId);
    }

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  /**
   * Delete bid
   */
  static async delete(id) {
    const query = 'DELETE FROM bids WHERE id = $1 RETURNING id';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }
}

module.exports = Bid;
