const Document = require('../models/Document');
const crypto = require('crypto');

// @desc    Get all documents for user
// @route   GET /api/documents
// @access  Private
exports.getDocuments = async (req, res) => {
  try {
    const query = { user: req.user.id };
    
    // Filter by document type if provided
    if (req.query.documentType) {
      query.documentType = req.query.documentType;
    }
    
    // Filter by status if provided
    if (req.query.status) {
      query.status = req.query.status;
    }
    
    // Filter by job if provided
    if (req.query.job) {
      query.job = req.query.job;
    }
    
    // Filter by vehicle if provided
    if (req.query.vehicle) {
      query.vehicle = req.query.vehicle;
    }
    
    const documents = await Document.find(query)
      .populate('job', 'title jobId')
      .populate('vehicle', 'vehicleNumber make model')
      .populate('reviewedBy', 'name')
      .sort({ uploadDate: -1 });
    
    res.status(200).json({
      success: true,
      count: documents.length,
      data: documents,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching documents',
      error: error.message,
    });
  }
};

// @desc    Get single document
// @route   GET /api/documents/:id
// @access  Private
exports.getDocument = async (req, res) => {
  try {
    const document = await Document.findById(req.params.id)
      .populate('user', 'name email')
      .populate('job', 'title jobId')
      .populate('vehicle', 'vehicleNumber')
      .populate('reviewedBy', 'name');
    
    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found',
      });
    }
    
    // Check authorization
    const isOwner = document.user._id.toString() === req.user.id;
    const isShared = document.sharedWith.some(userId => userId.toString() === req.user.id);
    const isPublic = document.visibility === 'public';
    const isAdmin = req.user.role === 'admin';
    
    if (!isOwner && !isShared && !isPublic && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this document',
      });
    }
    
    res.status(200).json({
      success: true,
      data: document,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching document',
      error: error.message,
    });
  }
};

// @desc    Upload/Create document
// @route   POST /api/documents
// @access  Private
exports.createDocument = async (req, res) => {
  try {
    // Set user from token
    req.body.user = req.user.id;
    
    // Calculate checksum if fileData is provided
    if (req.body.fileData) {
      req.body.checksum = crypto
        .createHash('sha256')
        .update(req.body.fileData)
        .digest('hex');
    }
    
    const document = await Document.create(req.body);
    
    res.status(201).json({
      success: true,
      data: document,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error creating document',
      error: error.message,
    });
  }
};

// @desc    Update document
// @route   PUT /api/documents/:id
// @access  Private
exports.updateDocument = async (req, res) => {
  try {
    let document = await Document.findById(req.params.id);
    
    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found',
      });
    }
    
    // Check authorization
    if (document.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this document',
      });
    }
    
    // If updating fileData, recalculate checksum
    if (req.body.fileData) {
      req.body.checksum = crypto
        .createHash('sha256')
        .update(req.body.fileData)
        .digest('hex');
      
      // Increment version
      req.body.version = document.version + 1;
      req.body.previousVersion = document._id;
    }
    
    document = await Document.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    res.status(200).json({
      success: true,
      data: document,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error updating document',
      error: error.message,
    });
  }
};

// @desc    Delete document
// @route   DELETE /api/documents/:id
// @access  Private
exports.deleteDocument = async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);
    
    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found',
      });
    }
    
    // Check authorization
    if (document.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this document',
      });
    }
    
    await document.deleteOne();
    
    res.status(200).json({
      success: true,
      message: 'Document deleted',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting document',
      error: error.message,
    });
  }
};

// @desc    Download document
// @route   GET /api/documents/:id/download
// @access  Private
exports.downloadDocument = async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);
    
    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found',
      });
    }
    
    // Check authorization
    const isOwner = document.user.toString() === req.user.id;
    const isShared = document.sharedWith.some(userId => userId.toString() === req.user.id);
    const isPublic = document.visibility === 'public';
    const isAdmin = req.user.role === 'admin';
    
    if (!isOwner && !isShared && !isPublic && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to download this document',
      });
    }
    
    // Increment download count
    await document.incrementDownloadCount();
    
    // Return file data or path
    res.status(200).json({
      success: true,
      data: {
        fileName: document.fileName,
        mimeType: document.mimeType,
        fileSize: document.fileSize,
        filePath: document.filePath,
        fileData: document.fileData,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error downloading document',
      error: error.message,
    });
  }
};

// @desc    Review document (Admin/Dispatcher)
// @route   PUT /api/documents/:id/review
// @access  Private
exports.reviewDocument = async (req, res) => {
  try {
    // Only admins and dispatchers can review
    if (req.user.role !== 'admin' && req.user.role !== 'dispatcher') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to review documents',
      });
    }
    
    const document = await Document.findById(req.params.id);
    
    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found',
      });
    }
    
    document.status = req.body.status || 'approved';
    document.reviewedBy = req.user.id;
    document.reviewDate = new Date();
    document.reviewNotes = req.body.reviewNotes;
    
    await document.save();
    
    res.status(200).json({
      success: true,
      data: document,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error reviewing document',
      error: error.message,
    });
  }
};

// @desc    Share document with users
// @route   PUT /api/documents/:id/share
// @access  Private
exports.shareDocument = async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);
    
    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found',
      });
    }
    
    // Check authorization - only owner can share
    if (document.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to share this document',
      });
    }
    
    // Add users to sharedWith array
    if (req.body.userIds && Array.isArray(req.body.userIds)) {
      req.body.userIds.forEach(userId => {
        if (!document.sharedWith.includes(userId)) {
          document.sharedWith.push(userId);
        }
      });
    }
    
    // Update visibility if provided
    if (req.body.visibility) {
      document.visibility = req.body.visibility;
    }
    
    await document.save();
    
    res.status(200).json({
      success: true,
      data: document,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error sharing document',
      error: error.message,
    });
  }
};

// @desc    Get documents for a job
// @route   GET /api/documents/job/:jobId
// @access  Private
exports.getJobDocuments = async (req, res) => {
  try {
    const documents = await Document.find({ job: req.params.jobId })
      .populate('user', 'name email')
      .sort({ uploadDate: -1 });
    
    res.status(200).json({
      success: true,
      count: documents.length,
      data: documents,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching job documents',
      error: error.message,
    });
  }
};

// @desc    Get documents for a vehicle
// @route   GET /api/documents/vehicle/:vehicleId
// @access  Private
exports.getVehicleDocuments = async (req, res) => {
  try {
    const documents = await Document.find({ vehicle: req.params.vehicleId })
      .populate('user', 'name email')
      .sort({ uploadDate: -1 });
    
    res.status(200).json({
      success: true,
      count: documents.length,
      data: documents,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching vehicle documents',
      error: error.message,
    });
  }
};
