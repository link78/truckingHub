const Service = require('../models/Service');

// @desc    Get all services
// @route   GET /api/services
// @access  Public
exports.getServices = async (req, res) => {
  try {
    const { category, isAvailable } = req.query;
    let query = {};

    if (category) {
      query.category = category;
    }

    if (isAvailable !== undefined) {
      query['availability.isAvailable'] = isAvailable === 'true';
    }

    const services = await Service.find(query)
      .populate('provider', 'name email phone company rating')
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      count: services.length,
      data: services,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get single service
// @route   GET /api/services/:id
// @access  Public
exports.getService = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id).populate(
      'provider',
      'name email phone company rating reviewCount'
    );

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found',
      });
    }

    res.status(200).json({
      success: true,
      data: service,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Create service
// @route   POST /api/services
// @access  Private (Service Provider)
exports.createService = async (req, res) => {
  try {
    req.body.provider = req.user.id;

    const service = await Service.create(req.body);

    res.status(201).json({
      success: true,
      data: service,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Update service
// @route   PUT /api/services/:id
// @access  Private (Service Provider owner)
exports.updateService = async (req, res) => {
  try {
    let service = await Service.findById(req.params.id);

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found',
      });
    }

    // Check ownership
    if (service.provider.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to update this service',
      });
    }

    service = await Service.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      data: service,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Delete service
// @route   DELETE /api/services/:id
// @access  Private (Service Provider owner)
exports.deleteService = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found',
      });
    }

    // Check ownership
    if (service.provider.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to delete this service',
      });
    }

    await service.deleteOne();

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
