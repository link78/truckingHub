const mongoose = require('mongoose');

const hosLogSchema = new mongoose.Schema({
  // Driver reference
  driver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  
  // Related job/trip
  job: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
  },
  
  // Vehicle used
  vehicle: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle',
  },
  
  // Log date
  logDate: {
    type: Date,
    required: true,
    default: Date.now,
  },
  
  // Duty status entries (timeline of status changes)
  dutyStatusEntries: [{
    status: {
      type: String,
      required: true,
      enum: ['off_duty', 'sleeper_berth', 'driving', 'on_duty_not_driving'],
    },
    startTime: {
      type: Date,
      required: true,
    },
    endTime: {
      type: Date,
    },
    duration: {
      type: Number, // in minutes
    },
    location: {
      latitude: Number,
      longitude: Number,
      address: String,
    },
    notes: String,
  }],
  
  // Daily totals (in hours)
  dailyTotals: {
    offDuty: {
      type: Number,
      default: 0,
    },
    sleeperBerth: {
      type: Number,
      default: 0,
    },
    driving: {
      type: Number,
      default: 0,
    },
    onDutyNotDriving: {
      type: Number,
      default: 0,
    },
  },
  
  // Violation flags
  violations: [{
    type: {
      type: String,
      enum: [
        '11_hour_driving_limit',
        '14_hour_limit',
        '60_70_hour_limit',
        '30_minute_break',
        'sleeper_berth',
        'form_manner',
        'other',
      ],
    },
    description: String,
    severity: {
      type: String,
      enum: ['minor', 'major', 'critical'],
      default: 'minor',
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  }],
  
  // Odometer readings
  odometer: {
    start: {
      type: Number,
      required: true,
    },
    end: {
      type: Number,
    },
  },
  
  // Total miles driven
  totalMiles: {
    type: Number,
    default: 0,
  },
  
  // ELD information
  eldProvider: {
    type: String,
  },
  
  eldDeviceId: {
    type: String,
  },
  
  // Certification
  certified: {
    type: Boolean,
    default: false,
  },
  
  certifiedAt: {
    type: Date,
  },
  
  certificationSignature: {
    type: String,
  },
  
  // Shipping documents
  shippingDocuments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document',
  }],
  
  // Trailer numbers
  trailerNumbers: [{
    type: String,
  }],
  
  // Co-driver (if applicable)
  coDriver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  
  // Remarks/notes
  remarks: {
    type: String,
  },
  
  // Status
  status: {
    type: String,
    enum: ['active', 'completed', 'under_review', 'approved', 'flagged'],
    default: 'active',
  },
  
  // Review information
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  
  reviewedAt: {
    type: Date,
  },
  
  reviewNotes: {
    type: String,
  },
}, {
  timestamps: true,
});

// Indexes
hosLogSchema.index({ driver: 1, logDate: -1 });
hosLogSchema.index({ job: 1 });
hosLogSchema.index({ vehicle: 1 });
hosLogSchema.index({ status: 1 });
hosLogSchema.index({ logDate: -1 });

// Method to calculate daily totals
hosLogSchema.methods.calculateDailyTotals = function() {
  const totals = {
    offDuty: 0,
    sleeperBerth: 0,
    driving: 0,
    onDutyNotDriving: 0,
  };
  
  this.dutyStatusEntries.forEach(entry => {
    if (entry.duration) {
      const hours = entry.duration / 60; // Convert minutes to hours
      switch(entry.status) {
        case 'off_duty':
          totals.offDuty += hours;
          break;
        case 'sleeper_berth':
          totals.sleeperBerth += hours;
          break;
        case 'driving':
          totals.driving += hours;
          break;
        case 'on_duty_not_driving':
          totals.onDutyNotDriving += hours;
          break;
      }
    }
  });
  
  this.dailyTotals = totals;
  return totals;
};

// Method to check for violations
hosLogSchema.methods.checkViolations = function() {
  const violations = [];
  const totals = this.dailyTotals;
  
  // 11-hour driving limit
  if (totals.driving > 11) {
    violations.push({
      type: '11_hour_driving_limit',
      description: `Exceeded 11-hour driving limit (${totals.driving.toFixed(2)} hours)`,
      severity: 'major',
    });
  }
  
  // 14-hour limit (driving + on-duty time)
  const onDutyTime = totals.driving + totals.onDutyNotDriving;
  if (onDutyTime > 14) {
    violations.push({
      type: '14_hour_limit',
      description: `Exceeded 14-hour on-duty limit (${onDutyTime.toFixed(2)} hours)`,
      severity: 'major',
    });
  }
  
  // Check for 30-minute break after 8 hours of driving
  let consecutiveDriving = 0;
  let hasRequiredBreak = false;
  
  this.dutyStatusEntries.forEach(entry => {
    if (entry.status === 'driving' && entry.duration) {
      consecutiveDriving += entry.duration;
    } else if ((entry.status === 'off_duty' || entry.status === 'sleeper_berth') && entry.duration >= 30) {
      if (consecutiveDriving >= 480) { // 8 hours in minutes
        hasRequiredBreak = true;
      }
      consecutiveDriving = 0;
    }
  });
  
  if (consecutiveDriving >= 480 && !hasRequiredBreak) {
    violations.push({
      type: '30_minute_break',
      description: 'Missing required 30-minute break after 8 hours of driving',
      severity: 'major',
    });
  }
  
  this.violations = violations;
  return violations;
};

// Method to add duty status entry
hosLogSchema.methods.addDutyStatusEntry = function(status, startTime, location, notes) {
  // End previous entry if exists
  if (this.dutyStatusEntries.length > 0) {
    const lastEntry = this.dutyStatusEntries[this.dutyStatusEntries.length - 1];
    if (!lastEntry.endTime) {
      lastEntry.endTime = startTime;
      lastEntry.duration = Math.round((startTime - lastEntry.startTime) / 60000); // Convert to minutes
    }
  }
  
  // Add new entry
  this.dutyStatusEntries.push({
    status,
    startTime,
    location,
    notes,
  });
  
  return this.save();
};

// Method to complete the log
hosLogSchema.methods.completeLog = function() {
  // End last entry if not ended
  if (this.dutyStatusEntries.length > 0) {
    const lastEntry = this.dutyStatusEntries[this.dutyStatusEntries.length - 1];
    if (!lastEntry.endTime) {
      lastEntry.endTime = new Date();
      lastEntry.duration = Math.round((lastEntry.endTime - lastEntry.startTime) / 60000);
    }
  }
  
  // Calculate totals
  this.calculateDailyTotals();
  
  // Check for violations
  this.checkViolations();
  
  // Calculate total miles
  if (this.odometer.end && this.odometer.start) {
    this.totalMiles = this.odometer.end - this.odometer.start;
  }
  
  // Update status
  this.status = 'completed';
  
  return this.save();
};

module.exports = mongoose.model('HOSLog', hosLogSchema);
