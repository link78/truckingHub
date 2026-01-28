const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema({
  // Vehicle owner/operator
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  
  // Basic vehicle information
  vehicleNumber: {
    type: String,
    required: true,
    unique: true,
  },
  
  make: {
    type: String,
    required: true,
  },
  
  model: {
    type: String,
    required: true,
  },
  
  year: {
    type: Number,
    required: true,
    min: 1900,
    max: new Date().getFullYear() + 1,
  },
  
  vin: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
  },
  
  // Vehicle type
  vehicleType: {
    type: String,
    required: true,
    enum: [
      'tractor',
      'trailer',
      'box_truck',
      'flatbed',
      'refrigerated',
      'tanker',
      'dump_truck',
      'other',
    ],
  },
  
  // Specifications
  capacity: {
    weight: {
      type: Number, // in pounds
    },
    volume: {
      type: Number, // in cubic feet
    },
  },
  
  dimensions: {
    length: Number, // in feet
    width: Number,
    height: Number,
  },
  
  // License and registration
  licensePlate: {
    type: String,
    required: true,
    uppercase: true,
  },
  
  licensePlateState: {
    type: String,
    required: true,
    uppercase: true,
  },
  
  registrationNumber: {
    type: String,
  },
  
  registrationExpiration: {
    type: Date,
    required: true,
  },
  
  // DOT information
  dotNumber: {
    type: String,
  },
  
  lastDotInspection: {
    type: Date,
  },
  
  nextDotInspectionDue: {
    type: Date,
  },
  
  dotInspectionStatus: {
    type: String,
    enum: ['passed', 'failed', 'pending', 'overdue'],
  },
  
  // Insurance
  insuranceProvider: {
    type: String,
    required: true,
  },
  
  insurancePolicyNumber: {
    type: String,
    required: true,
  },
  
  insuranceExpiration: {
    type: Date,
    required: true,
  },
  
  insuranceAmount: {
    type: Number,
  },
  
  // Operational status
  status: {
    type: String,
    enum: ['active', 'inactive', 'maintenance', 'out_of_service', 'retired'],
    default: 'active',
  },
  
  // Current location (for GPS tracking)
  currentLocation: {
    latitude: Number,
    longitude: Number,
    address: String,
    updatedAt: Date,
  },
  
  // Maintenance
  lastMaintenanceDate: {
    type: Date,
  },
  
  nextMaintenanceDue: {
    type: Date,
  },
  
  maintenanceMileageInterval: {
    type: Number, // miles between maintenance
    default: 10000,
  },
  
  currentMileage: {
    type: Number,
    default: 0,
  },
  
  // Fuel
  fuelType: {
    type: String,
    enum: ['diesel', 'gasoline', 'electric', 'hybrid', 'cng', 'other'],
  },
  
  fuelCapacity: {
    type: Number, // in gallons
  },
  
  avgFuelEconomy: {
    type: Number, // MPG
  },
  
  // Emissions
  emissionsTestDate: {
    type: Date,
  },
  
  emissionsTestExpiration: {
    type: Date,
  },
  
  emissionsCompliant: {
    type: Boolean,
    default: true,
  },
  
  // Features and equipment
  features: [{
    type: String,
    enum: [
      'gps',
      'eld',
      'refrigeration',
      'lift_gate',
      'air_ride',
      'sleeper_cab',
      'apu',
      'dashcam',
      'other',
    ],
  }],
  
  // Notes
  notes: {
    type: String,
  },
  
  // Photos
  photos: [{
    url: String,
    description: String,
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
  }],
  
  // Documents
  documents: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document',
  }],
  
  // Compliance records
  complianceRecords: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ComplianceRecord',
  }],
  
  // Availability
  isAvailable: {
    type: Boolean,
    default: true,
  },
  
  availableFrom: {
    type: Date,
  },
  
  availableUntil: {
    type: Date,
  },
}, {
  timestamps: true,
});

// Indexes
vehicleSchema.index({ owner: 1 });
vehicleSchema.index({ vehicleNumber: 1 });
vehicleSchema.index({ vin: 1 });
vehicleSchema.index({ licensePlate: 1 });
vehicleSchema.index({ status: 1 });
vehicleSchema.index({ isAvailable: 1 });

// Virtual for vehicle full name
vehicleSchema.virtual('fullName').get(function() {
  return `${this.year} ${this.make} ${this.model} (${this.vehicleNumber})`;
});

// Method to check if registration is expiring soon
vehicleSchema.methods.isRegistrationExpiringSoon = function(days = 30) {
  if (!this.registrationExpiration) return false;
  const daysUntil = Math.ceil((this.registrationExpiration - new Date()) / (1000 * 60 * 60 * 24));
  return daysUntil <= days && daysUntil > 0;
};

// Method to check if insurance is expiring soon
vehicleSchema.methods.isInsuranceExpiringSoon = function(days = 30) {
  if (!this.insuranceExpiration) return false;
  const daysUntil = Math.ceil((this.insuranceExpiration - new Date()) / (1000 * 60 * 60 * 24));
  return daysUntil <= days && daysUntil > 0;
};

// Method to check if maintenance is due
vehicleSchema.methods.isMaintenanceDue = function() {
  if (this.nextMaintenanceDue && new Date() >= this.nextMaintenanceDue) {
    return true;
  }
  if (this.lastMaintenanceDate && this.currentMileage) {
    const lastMaintMileage = this.currentMileage - this.maintenanceMileageInterval;
    return this.currentMileage >= lastMaintMileage + this.maintenanceMileageInterval;
  }
  return false;
};

// Method to check overall compliance status
vehicleSchema.methods.getComplianceStatus = function() {
  const now = new Date();
  const issues = [];
  
  if (this.registrationExpiration && now > this.registrationExpiration) {
    issues.push('Registration expired');
  }
  if (this.insuranceExpiration && now > this.insuranceExpiration) {
    issues.push('Insurance expired');
  }
  if (this.nextDotInspectionDue && now > this.nextDotInspectionDue) {
    issues.push('DOT inspection overdue');
  }
  if (this.emissionsTestExpiration && now > this.emissionsTestExpiration) {
    issues.push('Emissions test expired');
  }
  if (!this.emissionsCompliant) {
    issues.push('Not emissions compliant');
  }
  
  return {
    isCompliant: issues.length === 0,
    issues: issues,
  };
};

module.exports = mongoose.model('Vehicle', vehicleSchema);
