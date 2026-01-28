const mongoose = require('mongoose');

const complianceRecordSchema = new mongoose.Schema({
  // Reference to user (driver, vehicle owner, etc.)
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  
  // Type of compliance item
  complianceType: {
    type: String,
    required: true,
    enum: [
      'driver_license',
      'medical_certificate',
      'drug_test',
      'background_check',
      'hos_violation',
      'vehicle_inspection',
      'vehicle_registration',
      'insurance_policy',
      'hazmat_certification',
      'cdl_endorsement',
      'permit',
      'maintenance_record',
      'emissions_test',
      'other',
    ],
  },
  
  // Title/description
  title: {
    type: String,
    required: true,
  },
  
  // Detailed description
  description: {
    type: String,
  },
  
  // Status of compliance
  status: {
    type: String,
    required: true,
    enum: ['compliant', 'expiring_soon', 'expired', 'non_compliant', 'pending_review'],
    default: 'pending_review',
  },
  
  // Issue date
  issueDate: {
    type: Date,
    required: true,
  },
  
  // Expiration date
  expirationDate: {
    type: Date,
    required: true,
  },
  
  // Days before expiration to send alert
  alertDaysBefore: {
    type: Number,
    default: 30,
  },
  
  // Reference to related document
  document: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document',
  },
  
  // Related vehicle (if applicable)
  vehicle: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle',
  },
  
  // Issuing authority/agency
  issuingAuthority: {
    type: String,
  },
  
  // Certificate/license number
  certificateNumber: {
    type: String,
  },
  
  // Verification status
  verified: {
    type: Boolean,
    default: false,
  },
  
  // Verified by (admin user)
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  
  // Verification date
  verifiedDate: {
    type: Date,
  },
  
  // Notes
  notes: {
    type: String,
  },
  
  // Alert sent flag
  alertSent: {
    type: Boolean,
    default: false,
  },
  
  // Alert sent date
  alertSentDate: {
    type: Date,
  },
}, {
  timestamps: true,
});

// Index for efficient queries
complianceRecordSchema.index({ user: 1, complianceType: 1 });
complianceRecordSchema.index({ status: 1 });
complianceRecordSchema.index({ expirationDate: 1 });
complianceRecordSchema.index({ vehicle: 1 });

// Virtual for days until expiration
complianceRecordSchema.virtual('daysUntilExpiration').get(function() {
  if (!this.expirationDate) return null;
  const now = new Date();
  const diff = this.expirationDate - now;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
});

// Method to check if expiring soon
complianceRecordSchema.methods.isExpiringSoon = function() {
  const daysUntil = this.daysUntilExpiration;
  return daysUntil !== null && daysUntil <= this.alertDaysBefore && daysUntil > 0;
};

// Method to check if expired
complianceRecordSchema.methods.isExpired = function() {
  const daysUntil = this.daysUntilExpiration;
  return daysUntil !== null && daysUntil < 0;
};

// Update status based on expiration
complianceRecordSchema.methods.updateStatus = function() {
  if (this.isExpired()) {
    this.status = 'expired';
  } else if (this.isExpiringSoon()) {
    this.status = 'expiring_soon';
  } else {
    this.status = 'compliant';
  }
  return this.save();
};

module.exports = mongoose.model('ComplianceRecord', complianceRecordSchema);
