const HOSLog = require('../models/HOSLog');
const User = require('../models/User');
const Notification = require('../models/Notification');

// @desc    Get all HOS logs for user
// @route   GET /api/hos
// @access  Private
exports.getHOSLogs = async (req, res) => {
  try {
    const query = { driver: req.user.id };
    
    // Filter by date range if provided
    if (req.query.startDate || req.query.endDate) {
      query.logDate = {};
      if (req.query.startDate) {
        query.logDate.$gte = new Date(req.query.startDate);
      }
      if (req.query.endDate) {
        query.logDate.$lte = new Date(req.query.endDate);
      }
    }
    
    // Filter by status if provided
    if (req.query.status) {
      query.status = req.query.status;
    }
    
    // Filter by job if provided
    if (req.query.job) {
      query.job = req.query.job;
    }
    
    const hosLogs = await HOSLog.find(query)
      .populate('job', 'title jobId')
      .populate('vehicle', 'vehicleNumber make model')
      .populate('coDriver', 'name')
      .sort({ logDate: -1 });
    
    res.status(200).json({
      success: true,
      count: hosLogs.length,
      data: hosLogs,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching HOS logs',
      error: error.message,
    });
  }
};

// @desc    Get single HOS log
// @route   GET /api/hos/:id
// @access  Private
exports.getHOSLog = async (req, res) => {
  try {
    const hosLog = await HOSLog.findById(req.params.id)
      .populate('driver', 'name email')
      .populate('job', 'title jobId')
      .populate('vehicle', 'vehicleNumber make model')
      .populate('coDriver', 'name')
      .populate('shippingDocuments')
      .populate('reviewedBy', 'name');
    
    if (!hosLog) {
      return res.status(404).json({
        success: false,
        message: 'HOS log not found',
      });
    }
    
    // Check authorization
    if (hosLog.driver._id.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this HOS log',
      });
    }
    
    res.status(200).json({
      success: true,
      data: hosLog,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching HOS log',
      error: error.message,
    });
  }
};

// @desc    Create HOS log
// @route   POST /api/hos
// @access  Private (Trucker)
exports.createHOSLog = async (req, res) => {
  try {
    // Only truckers can create HOS logs
    if (req.user.role !== 'trucker') {
      return res.status(403).json({
        success: false,
        message: 'Only truckers can create HOS logs',
      });
    }
    
    // Set driver from token
    req.body.driver = req.user.id;
    
    const hosLog = await HOSLog.create(req.body);
    
    res.status(201).json({
      success: true,
      data: hosLog,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error creating HOS log',
      error: error.message,
    });
  }
};

// @desc    Update HOS log
// @route   PUT /api/hos/:id
// @access  Private
exports.updateHOSLog = async (req, res) => {
  try {
    let hosLog = await HOSLog.findById(req.params.id);
    
    if (!hosLog) {
      return res.status(404).json({
        success: false,
        message: 'HOS log not found',
      });
    }
    
    // Check authorization
    if (hosLog.driver.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this HOS log',
      });
    }
    
    // Can't update if already certified
    if (hosLog.certified && req.user.role !== 'admin') {
      return res.status(400).json({
        success: false,
        message: 'Cannot update certified HOS log',
      });
    }
    
    hosLog = await HOSLog.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    res.status(200).json({
      success: true,
      data: hosLog,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error updating HOS log',
      error: error.message,
    });
  }
};

// @desc    Delete HOS log
// @route   DELETE /api/hos/:id
// @access  Private
exports.deleteHOSLog = async (req, res) => {
  try {
    const hosLog = await HOSLog.findById(req.params.id);
    
    if (!hosLog) {
      return res.status(404).json({
        success: false,
        message: 'HOS log not found',
      });
    }
    
    // Check authorization
    if (hosLog.driver.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this HOS log',
      });
    }
    
    // Can't delete if certified
    if (hosLog.certified) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete certified HOS log',
      });
    }
    
    await hosLog.deleteOne();
    
    res.status(200).json({
      success: true,
      message: 'HOS log deleted',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting HOS log',
      error: error.message,
    });
  }
};

// @desc    Add duty status entry
// @route   POST /api/hos/:id/status
// @access  Private
exports.addDutyStatus = async (req, res) => {
  try {
    const hosLog = await HOSLog.findById(req.params.id);
    
    if (!hosLog) {
      return res.status(404).json({
        success: false,
        message: 'HOS log not found',
      });
    }
    
    // Check authorization
    if (hosLog.driver.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this HOS log',
      });
    }
    
    // Can't update if certified
    if (hosLog.certified) {
      return res.status(400).json({
        success: false,
        message: 'Cannot update certified HOS log',
      });
    }
    
    await hosLog.addDutyStatusEntry(
      req.body.status,
      req.body.startTime || new Date(),
      req.body.location,
      req.body.notes
    );
    
    res.status(200).json({
      success: true,
      data: hosLog,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error adding duty status',
      error: error.message,
    });
  }
};

// @desc    Complete HOS log
// @route   POST /api/hos/:id/complete
// @access  Private
exports.completeHOSLog = async (req, res) => {
  try {
    const hosLog = await HOSLog.findById(req.params.id);
    
    if (!hosLog) {
      return res.status(404).json({
        success: false,
        message: 'HOS log not found',
      });
    }
    
    // Check authorization
    if (hosLog.driver.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to complete this HOS log',
      });
    }
    
    // Set odometer end if provided
    if (req.body.odometerEnd) {
      hosLog.odometer.end = req.body.odometerEnd;
    }
    
    await hosLog.completeLog();
    
    // Send notification if violations detected
    if (hosLog.violations && hosLog.violations.length > 0) {
      await Notification.create({
        user: hosLog.driver,
        type: 'hos_violation',
        title: 'HOS Violations Detected',
        message: `${hosLog.violations.length} violation(s) detected in your HOS log for ${hosLog.logDate.toDateString()}`,
        relatedJob: hosLog.job,
      });
    }
    
    res.status(200).json({
      success: true,
      data: hosLog,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error completing HOS log',
      error: error.message,
    });
  }
};

// @desc    Certify HOS log
// @route   POST /api/hos/:id/certify
// @access  Private
exports.certifyHOSLog = async (req, res) => {
  try {
    const hosLog = await HOSLog.findById(req.params.id);
    
    if (!hosLog) {
      return res.status(404).json({
        success: false,
        message: 'HOS log not found',
      });
    }
    
    // Check authorization
    if (hosLog.driver.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to certify this HOS log',
      });
    }
    
    // Must be completed first
    if (hosLog.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'HOS log must be completed before certification',
      });
    }
    
    hosLog.certified = true;
    hosLog.certifiedAt = new Date();
    hosLog.certificationSignature = req.body.signature;
    hosLog.status = 'approved';
    
    await hosLog.save();
    
    res.status(200).json({
      success: true,
      data: hosLog,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error certifying HOS log',
      error: error.message,
    });
  }
};

// @desc    Get HOS summary for date range
// @route   GET /api/hos/summary
// @access  Private
exports.getHOSSummary = async (req, res) => {
  try {
    const startDate = req.query.startDate ? new Date(req.query.startDate) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const endDate = req.query.endDate ? new Date(req.query.endDate) : new Date();
    
    const hosLogs = await HOSLog.find({
      driver: req.user.id,
      logDate: { $gte: startDate, $lte: endDate },
    }).sort({ logDate: 1 });
    
    // Calculate totals
    let totalDriving = 0;
    let totalOnDuty = 0;
    let totalOffDuty = 0;
    let totalSleeper = 0;
    let totalMiles = 0;
    let violationCount = 0;
    
    hosLogs.forEach(log => {
      totalDriving += log.dailyTotals.driving || 0;
      totalOnDuty += log.dailyTotals.onDutyNotDriving || 0;
      totalOffDuty += log.dailyTotals.offDuty || 0;
      totalSleeper += log.dailyTotals.sleeperBerth || 0;
      totalMiles += log.totalMiles || 0;
      violationCount += log.violations ? log.violations.length : 0;
    });
    
    res.status(200).json({
      success: true,
      data: {
        period: {
          startDate,
          endDate,
          days: hosLogs.length,
        },
        totals: {
          driving: totalDriving.toFixed(2),
          onDuty: totalOnDuty.toFixed(2),
          offDuty: totalOffDuty.toFixed(2),
          sleeper: totalSleeper.toFixed(2),
          miles: totalMiles,
          violations: violationCount,
        },
        logs: hosLogs,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching HOS summary',
      error: error.message,
    });
  }
};

// @desc    Review HOS log (Admin)
// @route   PUT /api/hos/:id/review
// @access  Private (Admin)
exports.reviewHOSLog = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to review HOS logs',
      });
    }
    
    const hosLog = await HOSLog.findById(req.params.id);
    
    if (!hosLog) {
      return res.status(404).json({
        success: false,
        message: 'HOS log not found',
      });
    }
    
    hosLog.status = req.body.status || 'approved';
    hosLog.reviewedBy = req.user.id;
    hosLog.reviewedAt = new Date();
    hosLog.reviewNotes = req.body.reviewNotes;
    
    await hosLog.save();
    
    res.status(200).json({
      success: true,
      data: hosLog,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error reviewing HOS log',
      error: error.message,
    });
  }
};
