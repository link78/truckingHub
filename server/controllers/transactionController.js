const Transaction = require('../models/Transaction');
const User = require('../models/User');
const Notification = require('../models/Notification');

// @desc    Create a transaction
// @route   POST /api/transactions
// @access  Private
exports.createTransaction = async (req, res) => {
  try {
    const { job, payee, amount, type, paymentMethod, notes } = req.body;

    const transaction = await Transaction.create({
      job,
      payer: req.user.id,
      payee,
      amount,
      type,
      paymentMethod,
      notes,
      status: 'pending',
    });

    res.status(201).json({
      success: true,
      data: transaction,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get all transactions for user
// @route   GET /api/transactions
// @access  Private
exports.getTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find({
      $or: [{ payer: req.user.id }, { payee: req.user.id }],
    })
      .populate('job', 'title')
      .populate('payer', 'name company')
      .populate('payee', 'name company')
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      count: transactions.length,
      data: transactions,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get single transaction
// @route   GET /api/transactions/:id
// @access  Private
exports.getTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id)
      .populate('job', 'title')
      .populate('payer', 'name email company')
      .populate('payee', 'name email company');

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found',
      });
    }

    // Check authorization
    if (
      transaction.payer.toString() !== req.user.id &&
      transaction.payee.toString() !== req.user.id &&
      req.user.role !== 'admin'
    ) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to view this transaction',
      });
    }

    res.status(200).json({
      success: true,
      data: transaction,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Update transaction status
// @route   PUT /api/transactions/:id/status
// @access  Private (Admin or Payer)
exports.updateTransactionStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const transaction = await Transaction.findById(req.params.id);

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found',
      });
    }

    // Check authorization
    if (
      transaction.payer.toString() !== req.user.id &&
      req.user.role !== 'admin'
    ) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to update this transaction',
      });
    }

    transaction.status = status;
    await transaction.save();

    // If completed, update payee's total earnings
    if (status === 'completed') {
      await User.findByIdAndUpdate(transaction.payee, {
        $inc: { totalEarnings: transaction.amount },
      });

      // Notify payee
      await Notification.create({
        recipient: transaction.payee,
        sender: req.user.id,
        type: 'payment_received',
        title: 'Payment Received',
        message: `You received a payment of $${transaction.amount}`,
        link: `/transactions/${transaction._id}`,
      });
    }

    res.status(200).json({
      success: true,
      data: transaction,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
