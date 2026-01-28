const mongoose = require('mongoose');

const automationRuleSchema = new mongoose.Schema({
  // Rule identification
  name: {
    type: String,
    required: true,
    unique: true,
  },
  
  description: {
    type: String,
    required: true,
  },
  
  // Rule category
  category: {
    type: String,
    required: true,
    enum: [
      'job_matching',
      'notifications',
      'status_updates',
      'document_generation',
      'payment_processing',
      'compliance_alerts',
      'workflow',
      'other',
    ],
  },
  
  // Trigger conditions
  trigger: {
    // Event that triggers the rule
    event: {
      type: String,
      required: true,
      enum: [
        'job_created',
        'job_claimed',
        'job_completed',
        'status_changed',
        'document_uploaded',
        'payment_due',
        'compliance_expiring',
        'time_based',
        'location_based',
        'manual',
      ],
    },
    
    // Conditions that must be met
    conditions: [{
      field: String,
      operator: {
        type: String,
        enum: ['equals', 'not_equals', 'greater_than', 'less_than', 'contains', 'in', 'not_in'],
      },
      value: mongoose.Schema.Types.Mixed,
    }],
    
    // Time-based scheduling (for time_based events)
    schedule: {
      frequency: {
        type: String,
        enum: ['once', 'hourly', 'daily', 'weekly', 'monthly'],
      },
      time: String, // HH:MM format
      dayOfWeek: Number, // 0-6 for weekly
      dayOfMonth: Number, // 1-31 for monthly
    },
  },
  
  // Actions to perform
  actions: [{
    type: {
      type: String,
      required: true,
      enum: [
        'send_notification',
        'send_email',
        'send_sms',
        'update_status',
        'assign_job',
        'generate_document',
        'create_transaction',
        'update_field',
        'call_webhook',
        'run_script',
      ],
    },
    
    // Action configuration
    config: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
    },
    
    // Target users/roles
    target: {
      users: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      }],
      roles: [{
        type: String,
        enum: ['trucker', 'dispatcher', 'shipper', 'service_provider', 'admin'],
      }],
    },
    
    // Delay before executing action
    delay: {
      type: Number, // in minutes
      default: 0,
    },
  }],
  
  // Rule status
  isActive: {
    type: Boolean,
    default: true,
  },
  
  // Priority (higher number = higher priority)
  priority: {
    type: Number,
    default: 0,
  },
  
  // Created by
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  
  // Execution statistics
  executionStats: {
    totalExecutions: {
      type: Number,
      default: 0,
    },
    successfulExecutions: {
      type: Number,
      default: 0,
    },
    failedExecutions: {
      type: Number,
      default: 0,
    },
    lastExecutedAt: Date,
    lastExecutionResult: String,
  },
  
  // Execution history (keep last 10)
  executionHistory: [{
    executedAt: {
      type: Date,
      default: Date.now,
    },
    success: Boolean,
    result: String,
    error: String,
    data: mongoose.Schema.Types.Mixed,
  }],
  
  // Tags for categorization
  tags: [{
    type: String,
  }],
  
  // Notes
  notes: {
    type: String,
  },
}, {
  timestamps: true,
});

// Indexes
automationRuleSchema.index({ category: 1 });
automationRuleSchema.index({ isActive: 1 });
automationRuleSchema.index({ 'trigger.event': 1 });
automationRuleSchema.index({ priority: -1 });

// Method to evaluate if conditions are met
automationRuleSchema.methods.evaluateConditions = function(data) {
  if (!this.trigger.conditions || this.trigger.conditions.length === 0) {
    return true; // No conditions means always execute
  }
  
  return this.trigger.conditions.every(condition => {
    const fieldValue = data[condition.field];
    const conditionValue = condition.value;
    
    switch(condition.operator) {
      case 'equals':
        return fieldValue === conditionValue;
      case 'not_equals':
        return fieldValue !== conditionValue;
      case 'greater_than':
        return fieldValue > conditionValue;
      case 'less_than':
        return fieldValue < conditionValue;
      case 'contains':
        return String(fieldValue).includes(conditionValue);
      case 'in':
        return Array.isArray(conditionValue) && conditionValue.includes(fieldValue);
      case 'not_in':
        return Array.isArray(conditionValue) && !conditionValue.includes(fieldValue);
      default:
        return false;
    }
  });
};

// Method to log execution
automationRuleSchema.methods.logExecution = function(success, result, error = null, data = null) {
  // Update statistics
  this.executionStats.totalExecutions += 1;
  if (success) {
    this.executionStats.successfulExecutions += 1;
  } else {
    this.executionStats.failedExecutions += 1;
  }
  this.executionStats.lastExecutedAt = new Date();
  this.executionStats.lastExecutionResult = success ? 'success' : 'failed';
  
  // Add to history (keep last 10)
  this.executionHistory.push({
    executedAt: new Date(),
    success,
    result,
    error,
    data,
  });
  
  if (this.executionHistory.length > 10) {
    this.executionHistory.shift(); // Remove oldest
  }
  
  return this.save();
};

// Method to get success rate
automationRuleSchema.methods.getSuccessRate = function() {
  if (this.executionStats.totalExecutions === 0) return 0;
  return (this.executionStats.successfulExecutions / this.executionStats.totalExecutions * 100).toFixed(2);
};

// Static method to find rules by event
automationRuleSchema.statics.findByEvent = function(event) {
  return this.find({
    isActive: true,
    'trigger.event': event,
  }).sort({ priority: -1 });
};

module.exports = mongoose.model('AutomationRule', automationRuleSchema);
