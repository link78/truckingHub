const ComplianceRecord = require('../models/ComplianceRecord');
const User = require('../models/User');
const Vehicle = require('../models/Vehicle');
const Notification = require('../models/Notification');

// @desc    Get all compliance records for user
// @route   GET /api/compliance
// @access  Private
exports.getComplianceRecords = async (req, res) => {
  try {
    const query = { user: req.user.id };
    
    // Filter by status if provided
    if (req.query.status) {
      query.status = req.query.status;
    }
    
    // Filter by type if provided
    if (req.query.complianceType) {
      query.complianceType = req.query.complianceType;
    }
    
    // Filter by vehicle if provided
    if (req.query.vehicle) {
      query.vehicle = req.query.vehicle;
    }
    
    const complianceRecords = await ComplianceRecord.find(query)
      .populate('vehicle', 'vehicleNumber make model')
      .populate('document')
      .sort({ expirationDate: 1 });
    
    res.status(200).json({
      success: true,
      count: complianceRecords.length,
      data: complianceRecords,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching compliance records',
      error: error.message,
    });
  }
};

// @desc    Get single compliance record
// @route   GET /api/compliance/:id
// @access  Private
exports.getComplianceRecord = async (req, res) => {
  try {
    const complianceRecord = await ComplianceRecord.findById(req.params.id)
      .populate('user', 'name email')
      .populate('vehicle')
      .populate('document')
      .populate('verifiedBy', 'name');
    
    if (!complianceRecord) {
      return res.status(404).json({
        success: false,
        message: 'Compliance record not found',
      });
    }
    
    // Check authorization
    if (complianceRecord.user._id.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this compliance record',
      });
    }
    
    res.status(200).json({
      success: true,
      data: complianceRecord,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching compliance record',
      error: error.message,
    });
  }
};

// @desc    Create compliance record
// @route   POST /api/compliance
// @access  Private
exports.createComplianceRecord = async (req, res) => {
  try {
    // Set user from token
    req.body.user = req.user.id;
    
    const complianceRecord = await ComplianceRecord.create(req.body);
    
    // Update status based on expiration
    await complianceRecord.updateStatus();
    
    res.status(201).json({
      success: true,
      data: complianceRecord,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error creating compliance record',
      error: error.message,
    });
  }
};

// @desc    Update compliance record
// @route   PUT /api/compliance/:id
// @access  Private
exports.updateComplianceRecord = async (req, res) => {
  try {
    let complianceRecord = await ComplianceRecord.findById(req.params.id);
    
    if (!complianceRecord) {
      return res.status(404).json({
        success: false,
        message: 'Compliance record not found',
      });
    }
    
    // Check authorization
    if (complianceRecord.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this compliance record',
      });
    }
    
    complianceRecord = await ComplianceRecord.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    // Update status based on expiration
    await complianceRecord.updateStatus();
    
    res.status(200).json({
      success: true,
      data: complianceRecord,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error updating compliance record',
      error: error.message,
    });
  }
};

// @desc    Delete compliance record
// @route   DELETE /api/compliance/:id
// @access  Private
exports.deleteComplianceRecord = async (req, res) => {
  try {
    const complianceRecord = await ComplianceRecord.findById(req.params.id);
    
    if (!complianceRecord) {
      return res.status(404).json({
        success: false,
        message: 'Compliance record not found',
      });
    }
    
    // Check authorization
    if (complianceRecord.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this compliance record',
      });
    }
    
    await complianceRecord.deleteOne();
    
    res.status(200).json({
      success: true,
      message: 'Compliance record deleted',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting compliance record',
      error: error.message,
    });
  }
};

// @desc    Get compliance dashboard summary
// @route   GET /api/compliance/dashboard/summary
// @access  Private
exports.getComplianceSummary = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get counts by status
    const compliant = await ComplianceRecord.countDocuments({ user: userId, status: 'compliant' });
    const expiringSoon = await ComplianceRecord.countDocuments({ user: userId, status: 'expiring_soon' });
    const expired = await ComplianceRecord.countDocuments({ user: userId, status: 'expired' });
    const nonCompliant = await ComplianceRecord.countDocuments({ user: userId, status: 'non_compliant' });
    
    // Get expiring items (next 30 days)
    const expiringItems = await ComplianceRecord.find({
      user: userId,
      status: 'expiring_soon',
    })
      .sort({ expirationDate: 1 })
      .limit(10)
      .populate('vehicle', 'vehicleNumber');
    
    // Get expired items
    const expiredItems = await ComplianceRecord.find({
      user: userId,
      status: 'expired',
    })
      .sort({ expirationDate: -1 })
      .limit(10)
      .populate('vehicle', 'vehicleNumber');
    
    // Calculate compliance score (percentage of compliant items)
    const total = compliant + expiringSoon + expired + nonCompliant;
    const complianceScore = total > 0 ? Math.round((compliant / total) * 100) : 100;
    
    res.status(200).json({
      success: true,
      data: {
        summary: {
          compliant,
          expiringSoon,
          expired,
          nonCompliant,
          total,
          complianceScore,
        },
        expiringItems,
        expiredItems,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching compliance summary',
      error: error.message,
    });
  }
};

// @desc    Check and update all compliance statuses (cron job)
// @route   POST /api/compliance/check-all
// @access  Private (Admin only)
exports.checkAllCompliance = async (req, res) => {
  try {
    // Only admins can run this
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to perform this action',
      });
    }
    
    const records = await ComplianceRecord.find({});
    let updated = 0;
    let alertsSent = 0;
    
    for (const record of records) {
      const oldStatus = record.status;
      await record.updateStatus();
      
      if (oldStatus !== record.status) {
        updated++;
        
        // Send notification if status changed to expiring_soon or expired
        if (record.status === 'expiring_soon' || record.status === 'expired') {
          if (!record.alertSent) {
            await Notification.create({
              user: record.user,
              type: 'compliance_alert',
              title: `Compliance Alert: ${record.title}`,
              message: `Your ${record.complianceType.replace(/_/g, ' ')} is ${record.status.replace(/_/g, ' ')}`,
              relatedCompliance: record._id,
            });
            
            record.alertSent = true;
            record.alertSentDate = new Date();
            await record.save();
            alertsSent++;
          }
        }
      }
    }
    
    res.status(200).json({
      success: true,
      message: `Checked ${records.length} records, updated ${updated}, sent ${alertsSent} alerts`,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error checking compliance',
      error: error.message,
    });
  }
};

// @desc    Verify compliance record (Admin only)
// @route   PUT /api/compliance/:id/verify
// @access  Private (Admin)
exports.verifyComplianceRecord = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to verify compliance records',
      });
    }
    
    const complianceRecord = await ComplianceRecord.findById(req.params.id);
    
    if (!complianceRecord) {
      return res.status(404).json({
        success: false,
        message: 'Compliance record not found',
      });
    }
    
    complianceRecord.verified = true;
    complianceRecord.verifiedBy = req.user.id;
    complianceRecord.verifiedDate = new Date();
    
    if (req.body.notes) {
      complianceRecord.notes = req.body.notes;
    }
    
    await complianceRecord.save();
    
    res.status(200).json({
      success: true,
      data: complianceRecord,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error verifying compliance record',
      error: error.message,
    });
  }
};
