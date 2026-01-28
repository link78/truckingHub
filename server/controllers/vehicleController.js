const Vehicle = require('../models/Vehicle');
const ComplianceRecord = require('../models/ComplianceRecord');

// @desc    Get all vehicles for user
// @route   GET /api/vehicles
// @access  Private
exports.getVehicles = async (req, res) => {
  try {
    const query = { owner: req.user.id };
    
    // Filter by status if provided
    if (req.query.status) {
      query.status = req.query.status;
    }
    
    // Filter by availability
    if (req.query.isAvailable !== undefined) {
      query.isAvailable = req.query.isAvailable === 'true';
    }
    
    // Filter by vehicle type
    if (req.query.vehicleType) {
      query.vehicleType = req.query.vehicleType;
    }
    
    const vehicles = await Vehicle.find(query)
      .populate('documents')
      .populate('complianceRecords')
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: vehicles.length,
      data: vehicles,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching vehicles',
      error: error.message,
    });
  }
};

// @desc    Get single vehicle
// @route   GET /api/vehicles/:id
// @access  Private
exports.getVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id)
      .populate('owner', 'name email phone')
      .populate('documents')
      .populate('complianceRecords');
    
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found',
      });
    }
    
    // Check authorization
    if (vehicle.owner._id.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this vehicle',
      });
    }
    
    // Get compliance status
    const complianceStatus = vehicle.getComplianceStatus();
    
    res.status(200).json({
      success: true,
      data: {
        ...vehicle.toObject(),
        complianceStatus,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching vehicle',
      error: error.message,
    });
  }
};

// @desc    Create vehicle
// @route   POST /api/vehicles
// @access  Private
exports.createVehicle = async (req, res) => {
  try {
    // Set owner from token
    req.body.owner = req.user.id;
    
    const vehicle = await Vehicle.create(req.body);
    
    res.status(201).json({
      success: true,
      data: vehicle,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error creating vehicle',
      error: error.message,
    });
  }
};

// @desc    Update vehicle
// @route   PUT /api/vehicles/:id
// @access  Private
exports.updateVehicle = async (req, res) => {
  try {
    let vehicle = await Vehicle.findById(req.params.id);
    
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found',
      });
    }
    
    // Check authorization
    if (vehicle.owner.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this vehicle',
      });
    }
    
    vehicle = await Vehicle.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    res.status(200).json({
      success: true,
      data: vehicle,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error updating vehicle',
      error: error.message,
    });
  }
};

// @desc    Delete vehicle
// @route   DELETE /api/vehicles/:id
// @access  Private
exports.deleteVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found',
      });
    }
    
    // Check authorization
    if (vehicle.owner.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this vehicle',
      });
    }
    
    await vehicle.deleteOne();
    
    res.status(200).json({
      success: true,
      message: 'Vehicle deleted',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting vehicle',
      error: error.message,
    });
  }
};

// @desc    Get vehicle compliance status
// @route   GET /api/vehicles/:id/compliance
// @access  Private
exports.getVehicleCompliance = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found',
      });
    }
    
    // Check authorization
    if (vehicle.owner.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this vehicle',
      });
    }
    
    // Get compliance status
    const complianceStatus = vehicle.getComplianceStatus();
    
    // Get compliance records
    const complianceRecords = await ComplianceRecord.find({ vehicle: vehicle._id });
    
    res.status(200).json({
      success: true,
      data: {
        vehicle: {
          id: vehicle._id,
          vehicleNumber: vehicle.vehicleNumber,
          make: vehicle.make,
          model: vehicle.model,
        },
        complianceStatus,
        complianceRecords,
        alerts: {
          registrationExpiringSoon: vehicle.isRegistrationExpiringSoon(),
          insuranceExpiringSoon: vehicle.isInsuranceExpiringSoon(),
          maintenanceDue: vehicle.isMaintenanceDue(),
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching vehicle compliance',
      error: error.message,
    });
  }
};

// @desc    Update vehicle location
// @route   PUT /api/vehicles/:id/location
// @access  Private
exports.updateVehicleLocation = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found',
      });
    }
    
    // Check authorization
    if (vehicle.owner.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this vehicle',
      });
    }
    
    vehicle.currentLocation = {
      latitude: req.body.latitude,
      longitude: req.body.longitude,
      address: req.body.address,
      updatedAt: new Date(),
    };
    
    await vehicle.save();
    
    res.status(200).json({
      success: true,
      data: vehicle.currentLocation,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error updating vehicle location',
      error: error.message,
    });
  }
};

// @desc    Get available vehicles for job matching
// @route   GET /api/vehicles/available
// @access  Private
exports.getAvailableVehicles = async (req, res) => {
  try {
    const vehicles = await Vehicle.find({
      isAvailable: true,
      status: 'active',
    })
      .populate('owner', 'name email phone rating')
      .select('-documents -complianceRecords');
    
    // Filter by type if provided
    let filteredVehicles = vehicles;
    if (req.query.vehicleType) {
      filteredVehicles = vehicles.filter(v => v.vehicleType === req.query.vehicleType);
    }
    
    // Check compliance for each vehicle
    const vehiclesWithCompliance = filteredVehicles.map(vehicle => {
      const compliance = vehicle.getComplianceStatus();
      return {
        ...vehicle.toObject(),
        isCompliant: compliance.isCompliant,
      };
    });
    
    // Only return compliant vehicles
    const compliantVehicles = vehiclesWithCompliance.filter(v => v.isCompliant);
    
    res.status(200).json({
      success: true,
      count: compliantVehicles.length,
      data: compliantVehicles,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching available vehicles',
      error: error.message,
    });
  }
};
