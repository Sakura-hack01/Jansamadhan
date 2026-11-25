const Delivery = require('../models/Delivery');
const Notification = require('../models/Notification');
const User = require('../models/User');

// @desc    Create delivery request
// @route   POST /api/delivery
// @access  Private (User)
exports.createDelivery = async (req, res, next) => {
  try {
    const { serviceType, items, deliveryAddress, department, priority, specialInstructions } = req.body;
    const totalAmount = items?.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 1), 0) || 0;

    const delivery = await Delivery.create({
      user: req.user.id,
      serviceType,
      items,
      deliveryAddress,
      department,
      priority,
      specialInstructions,
      totalAmount,
      timeline: [{ status: 'requested', description: 'Delivery request submitted by citizen', timestamp: new Date() }],
    });

    const admins = await User.findByRole('admin');
    for (const admin of admins) {
      await Notification.create({
        user: admin.id,
        title: 'New Delivery Request',
        message: `${delivery.orderNumber}: ${serviceType} requested by ${req.user.name}`,
        type: 'delivery_update',
        relatedTo: { model: 'Delivery', id: delivery.id },
      });
    }

    res.status(201).json({
      success: true,
      data: delivery,
      message: `Delivery requested! Order: ${delivery.orderNumber}`,
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
    const { deliveries, total } = await Delivery.findAll({
      role: req.user.role,
      userId: req.user.id,
      status,
      serviceType,
      search,
      page,
      limit,
    });

    res.json({
      success: true,
      data: deliveries,
      pagination: { total, page: Number(page), pages: Math.ceil(total / Number(limit)) },
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
    const delivery = await Delivery.findById(req.params.id);
    if (!delivery) return res.status(404).json({ message: 'Delivery not found.' });

    if (req.user.role === 'user' && delivery.userId !== req.user.id) {
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
    const delivery = await Delivery.findByOrderNumber(req.params.orderNumber);
    if (!delivery) return res.status(404).json({ message: 'Order not found.' });

    const { user, userId, ...publicData } = delivery;
    res.json({ success: true, data: publicData });
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

    const delivery = await Delivery.updateStatus(req.params.id, {
      status,
      trackingId,
      assignedAgent,
      deliveredAt: status === 'delivered' ? new Date() : null,
      timelineEntry: {
        status,
        description: description || `Status updated to ${status}`,
        location,
        timestamp: new Date(),
      },
    });
    if (!delivery) return res.status(404).json({ message: 'Delivery not found.' });

    await Notification.create({
      user: delivery.userId,
      title: 'Delivery Update',
      message: `Order ${delivery.orderNumber}: ${status.replace('_', ' ').toUpperCase()}`,
      type: 'delivery_update',
      relatedTo: { model: 'Delivery', id: delivery.id },
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

    if (delivery.userId !== req.user.id) {
      return res.status(403).json({ message: 'Access denied.' });
    }

    await Delivery.rate(req.params.id, { score, comment });
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
    const data = await Delivery.getStats();
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};
