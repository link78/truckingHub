const Job = require('../models/Job');
const Notification = require('../models/Notification');
const User = require('../models/User');

// @desc    Get all jobs
// @route   GET /api/jobs
// @access  Private
exports.getJobs = async (req, res) => {
  try {
    const { status, role } = req.query;
    let query = {};

    // Filter by status
    if (status) {
      query.status = status;
    }

    // Role-based filtering
    if (req.user.role === 'trucker') {
      // Truckers see available jobs or their assigned jobs
      query.$or = [
        { status: 'available' },
        { assignedTo: req.user.id },
      ];
    } else if (req.user.role === 'dispatcher' || req.user.role === 'shipper') {
      // Dispatchers and shippers see their own posted jobs
      query.postedBy = req.user.id;
    }

    const jobs = await Job.find(query)
      .populate('postedBy', 'name email company role')
      .populate('assignedTo', 'name email phone rating')
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      count: jobs.length,
      data: jobs,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get single job
// @route   GET /api/jobs/:id
// @access  Private
exports.getJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id)
      .populate('postedBy', 'name email company role phone')
      .populate('assignedTo', 'name email phone rating truckInfo')
      .populate('bids.trucker', 'name rating company');

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found',
      });
    }

    res.status(200).json({
      success: true,
      data: job,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Create new job
// @route   POST /api/jobs
// @access  Private (Dispatcher, Shipper)
exports.createJob = async (req, res) => {
  try {
    req.body.postedBy = req.user.id;
    req.body.postedByRole = req.user.role;

    const job = await Job.create(req.body);

    // Get Socket.IO instance
    const io = req.app.get('io');

    // Create notification for available truckers (simplified - in production, match based on criteria)
    const truckers = await User.find({ role: 'trucker', isActive: true });
    
    const notifications = truckers.map((trucker) => ({
      recipient: trucker._id,
      sender: req.user.id,
      type: 'job_posted',
      title: 'New Job Available',
      message: `A new job "${job.title}" has been posted`,
      relatedJob: job._id,
      link: `/jobs/${job._id}`,
    }));

    await Notification.insertMany(notifications);

    // Emit real-time notifications to all truckers
    if (io) {
      truckers.forEach((trucker) => {
        io.to(trucker._id.toString()).emit('newNotification', {
          type: 'job_posted',
          title: 'New Job Available',
          message: `A new job "${job.title}" has been posted`,
          relatedJob: job._id,
          link: `/jobs/${job._id}`,
          createdAt: new Date(),
        });
      });

      // Broadcast new job posted event
      io.emit('newJobPosted', { jobId: job._id, title: job.title });
    }

    res.status(201).json({
      success: true,
      data: job,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Update job
// @route   PUT /api/jobs/:id
// @access  Private
exports.updateJob = async (req, res) => {
  try {
    let job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found',
      });
    }

    // Make sure user is job owner or admin
    if (job.postedBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to update this job',
      });
    }

    job = await Job.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      data: job,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Delete job
// @route   DELETE /api/jobs/:id
// @access  Private
exports.deleteJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found',
      });
    }

    // Make sure user is job owner or admin
    if (job.postedBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to delete this job',
      });
    }

    await job.deleteOne();

    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Claim a job (trucker)
// @route   POST /api/jobs/:id/claim
// @access  Private (Trucker)
exports.claimJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found',
      });
    }

    if (job.status !== 'available') {
      return res.status(400).json({
        success: false,
        message: 'Job is not available',
      });
    }

    job.assignedTo = req.user.id;
    job.status = 'claimed';
    job.statusHistory.push({
      status: 'claimed',
      updatedBy: req.user.id,
      notes: 'Job claimed by trucker',
    });

    await job.save();

    // Get Socket.IO instance
    const io = req.app.get('io');

    // Notify job poster
    await Notification.create({
      recipient: job.postedBy,
      sender: req.user.id,
      type: 'job_claimed',
      title: 'Job Claimed',
      message: `Your job "${job.title}" has been claimed`,
      relatedJob: job._id,
      link: `/jobs/${job._id}`,
    });

    // Emit real-time notification to job poster
    if (io) {
      io.to(job.postedBy.toString()).emit('newNotification', {
        type: 'job_claimed',
        title: 'Job Claimed',
        message: `Your job "${job.title}" has been claimed`,
        relatedJob: job._id,
        link: `/jobs/${job._id}`,
        createdAt: new Date(),
      });

      // Emit status update to job room
      io.to(`job_${job._id}`).emit('statusUpdated', {
        jobId: job._id.toString(),
        status: 'claimed',
        updatedBy: req.user.id,
      });
    }

    res.status(200).json({
      success: true,
      data: job,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Update job status
// @route   PUT /api/jobs/:id/status
// @access  Private
exports.updateJobStatus = async (req, res) => {
  try {
    const { status, notes } = req.body;

    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found',
      });
    }

    // Check authorization
    const isAuthorized =
      job.assignedTo?.toString() === req.user.id ||
      job.postedBy.toString() === req.user.id ||
      req.user.role === 'admin';

    if (!isAuthorized) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to update this job status',
      });
    }

    job.status = status;
    job.statusHistory.push({
      status,
      updatedBy: req.user.id,
      notes,
    });

    await job.save();

    // Get Socket.IO instance
    const io = req.app.get('io');

    // Notify relevant parties
    const notifyUsers = [job.postedBy];
    if (job.assignedTo && job.assignedTo.toString() !== req.user.id) {
      notifyUsers.push(job.assignedTo);
    }

    const notifications = notifyUsers.map((userId) => ({
      recipient: userId,
      sender: req.user.id,
      type: 'job_status_update',
      title: 'Job Status Updated',
      message: `Job "${job.title}" status updated to ${status}`,
      relatedJob: job._id,
      link: `/jobs/${job._id}`,
    }));

    await Notification.insertMany(notifications);

    // Emit real-time notifications and status updates
    if (io) {
      // Send notifications to relevant users
      notifyUsers.forEach((userId) => {
        io.to(userId.toString()).emit('newNotification', {
          type: 'job_status_update',
          title: 'Job Status Updated',
          message: `Job "${job.title}" status updated to ${status}`,
          relatedJob: job._id,
          link: `/jobs/${job._id}`,
          createdAt: new Date(),
        });
      });

      // Emit status update to job room and broadcast
      io.to(`job_${job._id}`).emit('statusUpdated', {
        jobId: job._id.toString(),
        status: status,
        updatedBy: req.user.id,
      });
    }

    res.status(200).json({
      success: true,
      data: job,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Place bid on job
// @route   POST /api/jobs/:id/bid
// @access  Private (Trucker)
exports.placeBid = async (req, res) => {
  try {
    const { amount, message } = req.body;

    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found',
      });
    }

    if (job.status !== 'available') {
      return res.status(400).json({
        success: false,
        message: 'Job is not available for bidding',
      });
    }

    // Check if user already bid
    const existingBid = job.bids.find(
      (bid) => bid.trucker.toString() === req.user.id
    );

    if (existingBid) {
      return res.status(400).json({
        success: false,
        message: 'You have already placed a bid on this job',
      });
    }

    job.bids.push({
      trucker: req.user.id,
      amount,
      message,
    });

    await job.save();

    // Get Socket.IO instance
    const io = req.app.get('io');

    // Notify job poster
    await Notification.create({
      recipient: job.postedBy,
      sender: req.user.id,
      type: 'new_message',
      title: 'New Bid Received',
      message: `New bid of $${amount} received for "${job.title}"`,
      relatedJob: job._id,
      link: `/jobs/${job._id}`,
    });

    // Emit real-time notification to job poster
    if (io) {
      io.to(job.postedBy.toString()).emit('newNotification', {
        type: 'new_message',
        title: 'New Bid Received',
        message: `New bid of $${amount} received for "${job.title}"`,
        relatedJob: job._id,
        link: `/jobs/${job._id}`,
        createdAt: new Date(),
      });

      // Emit new bid event to job room
      io.to(`job_${job._id}`).emit('newBid', {
        jobId: job._id.toString(),
        amount,
        trucker: req.user.id,
      });
    }

    res.status(200).json({
      success: true,
      data: job,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
