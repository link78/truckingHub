const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  // Document owner
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  
  // Related job (if applicable)
  job: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
  },
  
  // Related vehicle (if applicable)
  vehicle: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle',
  },
  
  // Document type
  documentType: {
    type: String,
    required: true,
    enum: [
      'bill_of_lading',
      'proof_of_delivery',
      'invoice',
      'rate_confirmation',
      'inspection_report',
      'driver_license',
      'medical_certificate',
      'insurance_policy',
      'vehicle_registration',
      'cdl',
      'hazmat_cert',
      'permit',
      'contract',
      'receipt',
      'photo',
      'signature',
      'other',
    ],
  },
  
  // Document title
  title: {
    type: String,
    required: true,
  },
  
  // Description
  description: {
    type: String,
  },
  
  // File information
  fileName: {
    type: String,
    required: true,
  },
  
  fileSize: {
    type: Number,
    required: true,
  },
  
  mimeType: {
    type: String,
    required: true,
  },
  
  // File storage path or URL
  filePath: {
    type: String,
    required: true,
  },
  
  // For documents stored as base64 or text
  fileData: {
    type: String,
  },
  
  // Document status
  status: {
    type: String,
    enum: ['draft', 'pending_review', 'approved', 'rejected', 'archived'],
    default: 'pending_review',
  },
  
  // Upload date
  uploadDate: {
    type: Date,
    default: Date.now,
  },
  
  // Expiration date (for time-sensitive documents)
  expirationDate: {
    type: Date,
  },
  
  // Reviewed by
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  
  // Review date
  reviewDate: {
    type: Date,
  },
  
  // Review notes
  reviewNotes: {
    type: String,
  },
  
  // Tags for categorization
  tags: [{
    type: String,
  }],
  
  // Version control
  version: {
    type: Number,
    default: 1,
  },
  
  // Reference to previous version
  previousVersion: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document',
  },
  
  // Access control
  visibility: {
    type: String,
    enum: ['private', 'shared', 'public'],
    default: 'private',
  },
  
  // Shared with users
  sharedWith: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  
  // Metadata
  metadata: {
    type: Map,
    of: String,
  },
  
  // Checksum for integrity
  checksum: {
    type: String,
  },
  
  // Downloaded count
  downloadCount: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true,
});

// Indexes
documentSchema.index({ user: 1, documentType: 1 });
documentSchema.index({ job: 1 });
documentSchema.index({ vehicle: 1 });
documentSchema.index({ status: 1 });
documentSchema.index({ tags: 1 });

// Virtual for file size in readable format
documentSchema.virtual('fileSizeFormatted').get(function() {
  const bytes = this.fileSize;
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
});

// Method to check if document is expired
documentSchema.methods.isExpired = function() {
  if (!this.expirationDate) return false;
  return new Date() > this.expirationDate;
};

// Method to increment download count
documentSchema.methods.incrementDownloadCount = function() {
  this.downloadCount += 1;
  return this.save();
};

module.exports = mongoose.model('Document', documentSchema);
