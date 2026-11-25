const Complaint = require('../models/Complaint');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { sendEmail, emailTemplates } = require('../utils/email');

// @desc    Create complaint
// @route   POST /api/complaints
// @access  Private (User)
exports.createComplaint = async (req, res, next) => {
  try {
    const { title, description, category, subCategory, priority, department, location, tags, isAnonymous } = req.body;

    const complaint = await Complaint.create({
      title, description, category, subCategory, priority,
      department, location, tags, isAnonymous,
      complainant: req.user.id,
      timeline: [{
        action: 'Complaint Filed',
        description: 'Complaint registered by citizen',
        performedBy: req.user.id,
        performedByRole: 'user'
      }]
    });

    await complaint.populate(['department', 'complainant']);

    // Send confirmation email
    try {
      const { subject, html } = emailTemplates.complaintRegistered(complaint, req.user);
      await sendEmail({ to: req.user.email, subject, html });
    } catch (e) { console.error('Email failed:', e.message); }

    // Notify department officers
    const officers = await User.find({ department: department, role: 'officer', isActive: true });
    for (const officer of officers) {
      await Notification.create({
        user: officer._id,
        title: 'New Complaint Received',
        message: `New complaint "${title}" (${complaint.complaintNumber}) has been filed.`,
        type: 'complaint_assigned',
        relatedTo: { model: 'Complaint', id: complaint._id }
      });
    }

    // Notify admin
    const admins = await User.find({ role: 'admin', isActive: true });
    for (const admin of admins) {
      await Notification.create({
        user: admin._id,
        title: 'New Complaint',
        message: `${complaint.complaintNumber}: ${title}`,
        type: 'complaint_update',
        relatedTo: { model: 'Complaint', id: complaint._id }
      });
    }

    res.status(201).json({ success: true, data: complaint, message: `Complaint registered! Reference: ${complaint.complaintNumber}` });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all complaints (role-based)
// @route   GET /api/complaints
// @access  Private
exports.getComplaints = async (req, res, next) => {
  try {
    const { status, category, priority, department, page = 1, limit = 10, search, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    
    let query = {};

    // Role-based filtering
    if (req.user.role === 'user') {
      query.complainant = req.user.id;
    } else if (req.user.role === 'officer') {
      query.department = req.user.department;
    }
    // Admin sees all

    if (status) query.status = status;
    if (category) query.category = category;
    if (priority) query.priority = priority;
    if (department && req.user.role === 'admin') query.department = department;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { complaintNumber: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const total = await Complaint.countDocuments(query);
    const complaints = await Complaint.find(query)
      .populate('complainant', 'name email phone')
      .populate('department', 'name code')
      .populate('assignedOfficer', 'name email')
      .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({
      success: true,
      data: complaints,
      pagination: {
        total, page: Number(page), limit: Number(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single complaint
// @route   GET /api/complaints/:id
// @access  Private
exports.getComplaint = async (req, res, next) => {
  try {
    const complaint = await Complaint.findById(req.params.id)
      .populate('complainant', 'name email phone avatar')
      .populate('department', 'name code email')
      .populate('assignedOfficer', 'name email phone')
      .populate('timeline.performedBy', 'name role');

    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found.' });
    }

    // Access check
    if (req.user.role === 'user' && complaint.complainant._id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied.' });
    }
    if (req.user.role === 'officer' && complaint.department._id.toString() !== req.user.department?.toString()) {
      return res.status(403).json({ message: 'Access denied.' });
    }

    // Increment views
    complaint.views += 1;
    await complaint.save({ validateBeforeSave: false });

    res.json({ success: true, data: complaint });
  } catch (error) {
    next(error);
  }
};

// @desc    Track complaint by number (public)
// @route   GET /api/complaints/track/:complaintNumber
// @access  Public
exports.trackComplaint = async (req, res, next) => {
  try {
    const complaint = await Complaint.findOne({ complaintNumber: req.params.complaintNumber })
      .populate('department', 'name code')
      .populate('assignedOfficer', 'name')
      .select('-complainant -attachments');

    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found. Please check the complaint number.' });
    }

    res.json({ success: true, data: complaint });
  } catch (error) {
    next(error);
  }
};

// @desc    Update complaint status (Officer/Admin)
// @route   PUT /api/complaints/:id/status
// @access  Private (Officer, Admin)
exports.updateStatus = async (req, res, next) => {
  try {
    const { status, resolutionNote, rejectionReason } = req.body;

    const complaint = await Complaint.findById(req.params.id).populate('complainant department');
    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found.' });
    }

    const oldStatus = complaint.status;
    complaint.status = status;
    if (resolutionNote) complaint.resolutionNote = resolutionNote;
    if (rejectionReason) complaint.rejectionReason = rejectionReason;
    if (status === 'resolved') complaint.resolvedAt = new Date();
    if (status === 'closed') complaint.closedAt = new Date();

    complaint.timeline.push({
      action: `Status Changed to ${status.replace('_', ' ').toUpperCase()}`,
      description: resolutionNote || rejectionReason || `Status updated from ${oldStatus} to ${status}`,
      performedBy: req.user.id,
      performedByRole: req.user.role
    });

    await complaint.save();

    // Notify complainant
    await Notification.create({
      user: complaint.complainant._id,
      title: 'Complaint Status Updated',
      message: `Your complaint ${complaint.complaintNumber} status: ${status.toUpperCase().replace('_', ' ')}`,
      type: 'complaint_update',
      relatedTo: { model: 'Complaint', id: complaint._id }
    });

    // Send email
    try {
      const { subject, html } = emailTemplates.statusUpdate(complaint, complaint.complainant, status, resolutionNote);
      await sendEmail({ to: complaint.complainant.email, subject, html });
    } catch (e) { console.error('Email failed:', e.message); }

    res.json({ success: true, data: complaint, message: 'Status updated successfully.' });
  } catch (error) {
    next(error);
  }
};

// @desc    Assign complaint to officer
// @route   PUT /api/complaints/:id/assign
// @access  Private (Admin)
exports.assignComplaint = async (req, res, next) => {
  try {
    const { officerId } = req.body;

    const officer = await User.findById(officerId);
    if (!officer || officer.role !== 'officer') {
      return res.status(400).json({ message: 'Invalid officer.' });
    }

    const complaint = await Complaint.findByIdAndUpdate(
      req.params.id,
      {
        assignedOfficer: officerId,
        status: 'assigned',
        $push: {
          timeline: {
            action: 'Complaint Assigned',
            description: `Assigned to ${officer.name}`,
            performedBy: req.user.id,
            performedByRole: 'admin'
          }
        }
      },
      { new: true }
    ).populate('complainant department assignedOfficer');

    // Notify officer
    await Notification.create({
      user: officerId,
      title: 'Complaint Assigned',
      message: `Complaint ${complaint.complaintNumber} has been assigned to you.`,
      type: 'complaint_assigned',
      relatedTo: { model: 'Complaint', id: complaint._id }
    });

    // Send email to officer
    try {
      const { subject, html } = emailTemplates.complaintAssigned(complaint, officer);
      await sendEmail({ to: officer.email, subject, html });
    } catch (e) { console.error('Email failed:', e.message); }

    res.json({ success: true, data: complaint });
  } catch (error) {
    next(error);
  }
};

// @desc    Escalate complaint
// @route   PUT /api/complaints/:id/escalate
// @access  Private (Admin)
exports.escalateComplaint = async (req, res, next) => {
  try {
    const complaint = await Complaint.findByIdAndUpdate(
      req.params.id,
      {
        escalated: true,
        escalatedAt: new Date(),
        $push: {
          timeline: {
            action: 'Complaint Escalated',
            description: req.body.reason || 'Complaint escalated due to delay',
            performedBy: req.user.id,
            performedByRole: req.user.role
          }
        }
      },
      { new: true }
    );

    res.json({ success: true, data: complaint, message: 'Complaint escalated.' });
  } catch (error) {
    next(error);
  }
};

// @desc    Submit feedback
// @route   POST /api/complaints/:id/feedback
// @access  Private (User)
exports.submitFeedback = async (req, res, next) => {
  try {
    const { rating, comment } = req.body;

    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) return res.status(404).json({ message: 'Complaint not found.' });

    if (complaint.complainant.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied.' });
    }

    if (complaint.status !== 'resolved') {
      return res.status(400).json({ message: 'Can only submit feedback for resolved complaints.' });
    }

    complaint.feedback = { rating, comment };
    complaint.status = 'closed';
    complaint.closedAt = new Date();
    await complaint.save();

    res.json({ success: true, message: 'Feedback submitted. Thank you!' });
  } catch (error) {
    next(error);
  }
};

// @desc    Add comment/note to complaint
// @route   POST /api/complaints/:id/comment
// @access  Private (Officer, Admin)
exports.addComment = async (req, res, next) => {
  try {
    const complaint = await Complaint.findByIdAndUpdate(
      req.params.id,
      {
        $push: {
          timeline: {
            action: 'Comment Added',
            description: req.body.comment,
            performedBy: req.user.id,
            performedByRole: req.user.role
          }
        }
      },
      { new: true }
    ).populate('timeline.performedBy', 'name role');

    res.json({ success: true, data: complaint });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete complaint
// @route   DELETE /api/complaints/:id
// @access  Private (Admin)
exports.deleteComplaint = async (req, res, next) => {
  try {
    const complaint = await Complaint.findByIdAndDelete(req.params.id);
    if (!complaint) return res.status(404).json({ message: 'Complaint not found.' });
    res.json({ success: true, message: 'Complaint deleted.' });
  } catch (error) {
    next(error);
  }
};

// @desc    Get complaint statistics
// @route   GET /api/complaints/stats
// @access  Private
exports.getStats = async (req, res, next) => {
  try {
    let matchQuery = {};
    if (req.user.role === 'user') matchQuery.complainant = req.user._id;
    if (req.user.role === 'officer') matchQuery.department = req.user.department;

    const stats = await Complaint.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const categoryStats = await Complaint.aggregate([
      { $match: matchQuery },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    const monthlyStats = await Complaint.aggregate([
      { $match: { ...matchQuery, createdAt: { $gte: new Date(new Date().setFullYear(new Date().getFullYear() - 1)) } } },
      {
        $group: {
          _id: { month: { $month: '$createdAt' }, year: { $year: '$createdAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    const total = await Complaint.countDocuments(matchQuery);
    const avgResolutionTime = await Complaint.aggregate([
      { $match: { ...matchQuery, status: 'resolved', resolvedAt: { $exists: true } } },
      {
        $group: {
          _id: null,
          avgDays: {
            $avg: {
              $divide: [{ $subtract: ['$resolvedAt', '$createdAt'] }, 1000 * 60 * 60 * 24]
            }
          }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        total,
        byStatus: stats,
        byCategory: categoryStats,
        monthly: monthlyStats,
        avgResolutionDays: avgResolutionTime[0]?.avgDays?.toFixed(1) || 0
      }
    });
  } catch (error) {
    next(error);
  }
};
