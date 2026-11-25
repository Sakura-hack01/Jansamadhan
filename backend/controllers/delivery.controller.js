const Delivery = require('../models/Delivery');
const Notification = require('../models/Notification');
const User = require('../models/User');

// @desc    Create delivery request
// @route   POST /api/delivery
// @access  Private (User)
exports.createDelivery = async (req, res, next) => {
  try {
    const { serviceType, items, deliveryAddress, department, priority, specialInstructions } = req.body;

    const totalAmount = items?.reduce((sum, item) => sum + (item.price * item.quantity), 0) || 0;

    const delivery = await Delivery.create({
      user: req.user.id,
      serviceType, items, deliveryAddress, department,
      priority, specialInstructions, totalAmount,
      timeline: [{ status: 'requested', description: 'Delivery request submitted by citizen' }]
    });

    await delivery.populate(['user', 'department']);

    // Notify admins
    const admins = await User.find({ role: 'admin', isActive: true });
    for (const admin of admins) {
      await Notification.create({
        user: admin._id,
        title: 'New Delivery Request',
        message: `${delivery.orderNumber}: ${serviceType} requested by ${req.user.name}`,
        type: 'delivery_update',
        relatedTo: { model: 'Delivery', id: delivery._id }
      });
    }

    res.status(201).json({ 
      success: true, 
      data: delivery, 
      message: `Delivery requested! Order: ${delivery.orderNumber}` 
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get deliveries (role-based)
// @route   GET /api/delivery
// @access  Private
exports.getDeliveries = async (req, res, next) => {
  try {
    const { status, serviceType, page = 1, limit = 10, search } = req.query;
    let query = {};

    if (req.user.role === 'user') query.user = req.user.id;
    if (status) query.status = status;
    if (serviceType) query.serviceType = serviceType;
    if (search) {
      query.$or = [
        { orderNumber: { $regex: search, $options: 'i' } }
      ];
    }

    const total = await Delivery.countDocuments(query);
    const deliveries = await Delivery.find(query)
      .populate('user', 'name email phone')
      .populate('department', 'name')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({
      success: true, data: deliveries,
      pagination: { total, page: Number(page), pages: Math.ceil(total / limit) }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single delivery
// @route   GET /api/delivery/:id
// @access  Private
exports.getDelivery = async (req, res, next) => {
  try {
    const delivery = await Delivery.findById(req.params.id)
      .populate('user', 'name email phone')
      .populate('department', 'name code');

    if (!delivery) return res.status(404).json({ message: 'Delivery not found.' });

    if (req.user.role === 'user' && delivery.user._id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied.' });
    }

    res.json({ success: true, data: delivery });
  } catch (error) {
    next(error);
  }
};

// @desc    Track delivery by order number
// @route   GET /api/delivery/track/:orderNumber
// @access  Public
exports.trackDelivery = async (req, res, next) => {
  try {
    const delivery = await Delivery.findOne({ orderNumber: req.params.orderNumber })
      .populate('department', 'name')
      .select('-user');

    if (!delivery) return res.status(404).json({ message: 'Order not found.' });

    res.json({ success: true, data: delivery });
  } catch (error) {
    next(error);
  }
};

// @desc    Update delivery status
// @route   PUT /api/delivery/:id/status
// @access  Private (Admin, Officer)
exports.updateDeliveryStatus = async (req, res, next) => {
  try {
    const { status, trackingId, assignedAgent, description, location } = req.body;

    const delivery = await Delivery.findById(req.params.id).populate('user');
    if (!delivery) return res.status(404).json({ message: 'Delivery not found.' });

    delivery.status = status;
    if (trackingId) delivery.trackingId = trackingId;
    if (assignedAgent) delivery.assignedAgent = assignedAgent;
    if (status === 'delivered') delivery.deliveredAt = new Date();

    delivery.timeline.push({ status, description: description || `Status updated to ${status}`, location });
    await delivery.save();

    // Notify user
    await Notification.create({
      user: delivery.user._id,
      title: 'Delivery Update',
      message: `Order ${delivery.orderNumber}: ${status.replace('_', ' ').toUpperCase()}`,
      type: 'delivery_update',
      relatedTo: { model: 'Delivery', id: delivery._id }
    });

    res.json({ success: true, data: delivery });
  } catch (error) {
    next(error);
  }
};

// @desc    Rate delivery
// @route   POST /api/delivery/:id/rate
// @access  Private (User)
exports.rateDelivery = async (req, res, next) => {
  try {
    const { score, comment } = req.body;
    const delivery = await Delivery.findById(req.params.id);
    if (!delivery) return res.status(404).json({ message: 'Delivery not found.' });

    if (delivery.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied.' });
    }

    delivery.rating = { score, comment };
    await delivery.save();

    res.json({ success: true, message: 'Thank you for your feedback!' });
  } catch (error) {
    next(error);
  }
};

// @desc    Get delivery stats
// @route   GET /api/delivery/stats
// @access  Private (Admin)
exports.getDeliveryStats = async (req, res, next) => {
  try {
    const total = await Delivery.countDocuments();
    const byStatus = await Delivery.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    const byType = await Delivery.aggregate([
      { $group: { _id: '$serviceType', count: { $sum: 1 } } }
    ]);

    res.json({ success: true, data: { total, byStatus, byType } });
  } catch (error) {
    next(error);
  }
};
