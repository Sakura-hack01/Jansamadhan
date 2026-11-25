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
      title,
      description,
      category,
      subCategory,
      priority,
      department,
      location,
      tags,
      isAnonymous,
      complainant: req.user.id,
      timeline: [{
        action: 'Complaint Filed',
        description: 'Complaint registered by citizen',
        performedBy: { _id: req.user.id, name: req.user.name, role: req.user.role },
        performedByRole: 'user',
        timestamp: new Date(),
      }],
    });

    try {
      const { subject, html } = emailTemplates.complaintRegistered(complaint, req.user);
      await sendEmail({ to: req.user.email, subject, html });
    } catch (e) { console.error('Email failed:', e.message); }

    const officers = await User.findOfficersByDepartment(department);
    for (const officer of officers) {
      await Notification.create({
        user: officer.id,
        title: 'New Complaint Received',
        message: `New complaint "${title}" (${complaint.complaintNumber}) has been filed.`,
        type: 'complaint_assigned',
        relatedTo: { model: 'Complaint', id: complaint.id },
      });
    }

    const admins = await User.findByRole('admin');
    for (const admin of admins) {
      await Notification.create({
        user: admin.id,
        title: 'New Complaint',
        message: `${complaint.complaintNumber}: ${title}`,
        type: 'complaint_update',
        relatedTo: { model: 'Complaint', id: complaint.id },
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

    const { complaints, total } = await Complaint.findAll({
      role: req.user.role,
      userId: req.user.id,
      userDepartment: req.user.departmentId,
      status,
      category,
      priority,
      department,
      search,
      page,
      limit,
      sortBy,
      sortOrder,
    });

    res.json({
      success: true,
      data: complaints,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit)),
      },
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
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found.' });
    }

    if (req.user.role === 'user' && complaint.complainantId !== req.user.id) {
      return res.status(403).json({ message: 'Access denied.' });
    }
    if (req.user.role === 'officer' && complaint.departmentId !== req.user.departmentId) {
      return res.status(403).json({ message: 'Access denied.' });
    }

    await Complaint.incrementViews(complaint.id);
    complaint.views += 1;

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
    const complaint = await Complaint.findByNumber(req.params.complaintNumber);
    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found. Please check the complaint number.' });
    }

    const { complainant, complainantId, attachments, ...publicData } = complaint;
    res.json({ success: true, data: publicData });
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
    const existing = await Complaint.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ message: 'Complaint not found.' });
    }

    const updated = await Complaint.updateStatus(req.params.id, {
      status,
      resolutionNote,
      rejectionReason,
      resolvedAt: status === 'resolved' ? new Date() : null,
      closedAt: status === 'closed' ? new Date() : null,
      timelineEntry: {
        action: `Status Changed to ${status.replace('_', ' ').toUpperCase()}`,
        description: resolutionNote || rejectionReason || `Status updated from ${existing.status} to ${status}`,
        performedBy: { _id: req.user.id, name: req.user.name, role: req.user.role },
        performedByRole: req.user.role,
        timestamp: new Date(),
      },
    });

    await Notification.create({
      user: updated.complainantId,
      title: 'Complaint Status Updated',
      message: `Your complaint ${updated.complaintNumber} status: ${status.toUpperCase().replace('_', ' ')}`,
      type: 'complaint_update',
      relatedTo: { model: 'Complaint', id: updated.id },
    });

    try {
      const { subject, html } = emailTemplates.statusUpdate(updated, updated.complainant, status, resolutionNote);
      await sendEmail({ to: updated.complainant.email, subject, html });
    } catch (e) { console.error('Email failed:', e.message); }

    res.json({ success: true, data: updated, message: 'Status updated successfully.' });
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

    const complaint = await Complaint.assignOfficer(req.params.id, officerId, {
      action: 'Complaint Assigned',
      description: `Assigned to ${officer.name}`,
      performedBy: { _id: req.user.id, name: req.user.name, role: req.user.role },
      performedByRole: 'admin',
      timestamp: new Date(),
    });

    if (!complaint) return res.status(404).json({ message: 'Complaint not found.' });

    await Notification.create({
      user: officerId,
      title: 'Complaint Assigned',
      message: `Complaint ${complaint.complaintNumber} has been assigned to you.`,
      type: 'complaint_assigned',
      relatedTo: { model: 'Complaint', id: complaint.id },
    });

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
    const complaint = await Complaint.escalate(req.params.id, {
      action: 'Complaint Escalated',
      description: req.body.reason || 'Complaint escalated due to delay',
      performedBy: { _id: req.user.id, name: req.user.name, role: req.user.role },
      performedByRole: req.user.role,
      timestamp: new Date(),
    });

    if (!complaint) return res.status(404).json({ message: 'Complaint not found.' });
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

    if (complaint.complainantId !== req.user.id) {
      return res.status(403).json({ message: 'Access denied.' });
    }
    if (complaint.status !== 'resolved') {
      return res.status(400).json({ message: 'Can only submit feedback for resolved complaints.' });
    }

    await Complaint.submitFeedback(req.params.id, { rating, comment });
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
    const complaint = await Complaint.addTimelineEntry(req.params.id, {
      action: 'Comment Added',
      description: req.body.comment,
      performedBy: { _id: req.user.id, name: req.user.name, role: req.user.role },
      performedByRole: req.user.role,
      timestamp: new Date(),
    });
    if (!complaint) return res.status(404).json({ message: 'Complaint not found.' });
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
    const deleted = await Complaint.deleteById(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Complaint not found.' });
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
    const data = await Complaint.getStats({
      role: req.user.role,
      userId: req.user.id,
      userDepartment: req.user.departmentId,
    });
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};
