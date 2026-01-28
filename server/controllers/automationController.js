const AutomationRule = require('../models/AutomationRule');
const Notification = require('../models/Notification');

// @desc    Get all automation rules
// @route   GET /api/automation
// @access  Private (Admin)
exports.getAutomationRules = async (req, res) => {
  try {
    // Only admins can view automation rules
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view automation rules',
      });
    }
    
    const query = {};
    
    // Filter by category if provided
    if (req.query.category) {
      query.category = req.query.category;
    }
    
    // Filter by active status if provided
    if (req.query.isActive !== undefined) {
      query.isActive = req.query.isActive === 'true';
    }
    
    const rules = await AutomationRule.find(query)
      .populate('createdBy', 'name email')
      .sort({ priority: -1, createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: rules.length,
      data: rules,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching automation rules',
      error: error.message,
    });
  }
};

// @desc    Get single automation rule
// @route   GET /api/automation/:id
// @access  Private (Admin)
exports.getAutomationRule = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view automation rules',
      });
    }
    
    const rule = await AutomationRule.findById(req.params.id)
      .populate('createdBy', 'name email');
    
    if (!rule) {
      return res.status(404).json({
        success: false,
        message: 'Automation rule not found',
      });
    }
    
    res.status(200).json({
      success: true,
      data: rule,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching automation rule',
      error: error.message,
    });
  }
};

// @desc    Create automation rule
// @route   POST /api/automation
// @access  Private (Admin)
exports.createAutomationRule = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to create automation rules',
      });
    }
    
    // Set createdBy from token
    req.body.createdBy = req.user.id;
    
    const rule = await AutomationRule.create(req.body);
    
    res.status(201).json({
      success: true,
      data: rule,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error creating automation rule',
      error: error.message,
    });
  }
};

// @desc    Update automation rule
// @route   PUT /api/automation/:id
// @access  Private (Admin)
exports.updateAutomationRule = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update automation rules',
      });
    }
    
    let rule = await AutomationRule.findById(req.params.id);
    
    if (!rule) {
      return res.status(404).json({
        success: false,
        message: 'Automation rule not found',
      });
    }
    
    rule = await AutomationRule.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    res.status(200).json({
      success: true,
      data: rule,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error updating automation rule',
      error: error.message,
    });
  }
};

// @desc    Delete automation rule
// @route   DELETE /api/automation/:id
// @access  Private (Admin)
exports.deleteAutomationRule = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete automation rules',
      });
    }
    
    const rule = await AutomationRule.findById(req.params.id);
    
    if (!rule) {
      return res.status(404).json({
        success: false,
        message: 'Automation rule not found',
      });
    }
    
    await rule.deleteOne();
    
    res.status(200).json({
      success: true,
      message: 'Automation rule deleted',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting automation rule',
      error: error.message,
    });
  }
};

// @desc    Toggle automation rule active status
// @route   PUT /api/automation/:id/toggle
// @access  Private (Admin)
exports.toggleAutomationRule = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to toggle automation rules',
      });
    }
    
    const rule = await AutomationRule.findById(req.params.id);
    
    if (!rule) {
      return res.status(404).json({
        success: false,
        message: 'Automation rule not found',
      });
    }
    
    rule.isActive = !rule.isActive;
    await rule.save();
    
    res.status(200).json({
      success: true,
      data: rule,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error toggling automation rule',
      error: error.message,
    });
  }
};

// @desc    Execute automation rule manually
// @route   POST /api/automation/:id/execute
// @access  Private (Admin)
exports.executeAutomationRule = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to execute automation rules',
      });
    }
    
    const rule = await AutomationRule.findById(req.params.id);
    
    if (!rule) {
      return res.status(404).json({
        success: false,
        message: 'Automation rule not found',
      });
    }
    
    // Evaluate conditions
    const conditionsMet = rule.evaluateConditions(req.body.data || {});
    
    if (!conditionsMet) {
      return res.status(400).json({
        success: false,
        message: 'Conditions not met for rule execution',
      });
    }
    
    // Execute actions
    const results = [];
    for (const action of rule.actions) {
      try {
        const result = await executeAction(action, req.body.data, req.io);
        results.push({ action: action.type, success: true, result });
      } catch (error) {
        results.push({ action: action.type, success: false, error: error.message });
      }
    }
    
    // Log execution
    const success = results.every(r => r.success);
    await rule.logExecution(success, JSON.stringify(results), success ? null : 'Some actions failed', req.body.data);
    
    res.status(200).json({
      success: true,
      message: 'Automation rule executed',
      results,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error executing automation rule',
      error: error.message,
    });
  }
};

// @desc    Get automation statistics
// @route   GET /api/automation/stats
// @access  Private (Admin)
exports.getAutomationStats = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view automation statistics',
      });
    }
    
    const totalRules = await AutomationRule.countDocuments();
    const activeRules = await AutomationRule.countDocuments({ isActive: true });
    const inactiveRules = totalRules - activeRules;
    
    // Get rules by category
    const rulesByCategory = await AutomationRule.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
        },
      },
    ]);
    
    // Get top performing rules
    const topRules = await AutomationRule.find()
      .sort({ 'executionStats.successfulExecutions': -1 })
      .limit(10)
      .select('name category executionStats');
    
    // Calculate average success rate
    const rules = await AutomationRule.find();
    const successRates = rules.map(r => parseFloat(r.getSuccessRate()) || 0);
    const avgSuccessRate = successRates.length > 0 
      ? (successRates.reduce((a, b) => a + b, 0) / successRates.length).toFixed(2)
      : 0;
    
    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalRules,
          activeRules,
          inactiveRules,
          avgSuccessRate: `${avgSuccessRate}%`,
        },
        rulesByCategory,
        topRules,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching automation statistics',
      error: error.message,
    });
  }
};

// Helper function to execute actions
async function executeAction(action, data, io) {
  switch (action.type) {
    case 'send_notification':
      // Send notification to target users
      const notifications = [];
      if (action.target.users && action.target.users.length > 0) {
        for (const userId of action.target.users) {
          const notification = await Notification.create({
            user: userId,
            type: action.config.get('notificationType') || 'automation',
            title: action.config.get('title') || 'Automated Notification',
            message: action.config.get('message') || '',
          });
          notifications.push(notification);
          
          // Send via Socket.IO if available
          if (io) {
            io.to(userId.toString()).emit('newNotification', notification);
          }
        }
      }
      return `Sent ${notifications.length} notification(s)`;
      
    case 'send_email':
      // Placeholder for email sending
      return 'Email sending not implemented yet';
      
    case 'send_sms':
      // Placeholder for SMS sending
      return 'SMS sending not implemented yet';
      
    case 'update_status':
      // Placeholder for status updates
      return 'Status update not implemented yet';
      
    default:
      return `Action type ${action.type} not implemented`;
  }
}

module.exports = {
  getAutomationRules,
  getAutomationRule,
  createAutomationRule,
  updateAutomationRule,
  deleteAutomationRule,
  toggleAutomationRule,
  executeAutomationRule,
  getAutomationStats,
};
