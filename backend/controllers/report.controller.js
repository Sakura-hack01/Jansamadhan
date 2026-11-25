const Complaint = require('../models/Complaint');
const User = require('../models/User');
const Delivery = require('../models/Delivery');
const Department = require('../models/Department');

// @desc    Get summary report
// @route   GET /api/reports/summary
// @access  Private (Admin)
exports.getSummaryReport = async (req, res, next) => {
  try {
    const { startDate, endDate, department } = req.query;
    let dateFilter = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
      if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
    }

    let complaintFilter = { ...dateFilter };
    if (department) complaintFilter.department = department;

    const totalComplaints = await Complaint.countDocuments(complaintFilter);
    const totalUsers = await User.countDocuments({ role: 'user' });
    const totalOfficers = await User.countDocuments({ role: 'officer' });
    const totalDeliveries = await Delivery.countDocuments(dateFilter);

    const complaintsByStatus = await Complaint.aggregate([
      { $match: complaintFilter },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    const complaintsByDept = await Complaint.aggregate([
      { $match: complaintFilter },
      { $group: { _id: '$department', count: { $sum: 1 } } },
      { $lookup: { from: 'departments', localField: '_id', foreignField: '_id', as: 'dept' } },
      { $unwind: '$dept' },
      { $project: { name: '$dept.name', count: 1 } },
      { $sort: { count: -1 } }
    ]);

    const avgResolution = await Complaint.aggregate([
      { $match: { ...complaintFilter, status: 'resolved', resolvedAt: { $exists: true } } },
      {
        $group: {
          _id: null,
          avgDays: {
            $avg: {
              $divide: [{ $subtract: ['$resolvedAt', '$createdAt'] }, 86400000]
            }
          }
        }
      }
    ]);

    const complaintTrend = await Complaint.aggregate([
      { $match: { ...complaintFilter, createdAt: { $gte: new Date(new Date() - 30 * 86400000) } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const priorityBreakdown = await Complaint.aggregate([
      { $match: complaintFilter },
      { $group: { _id: '$priority', count: { $sum: 1 } } }
    ]);

    res.json({
      success: true,
      data: {
        overview: { totalComplaints, totalUsers, totalOfficers, totalDeliveries },
        complaintsByStatus,
        complaintsByDept,
        avgResolutionDays: avgResolution[0]?.avgDays?.toFixed(1) || 0,
        complaintTrend,
        priorityBreakdown
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get department-wise report
// @route   GET /api/reports/departments
// @access  Private (Admin)
exports.getDepartmentReport = async (req, res, next) => {
  try {
    const report = await Department.aggregate([
      {
        $lookup: {
          from: 'complaints',
          localField: '_id',
          foreignField: 'department',
          as: 'complaints'
        }
      },
      {
        $project: {
          name: 1,
          code: 1,
          total: { $size: '$complaints' },
          pending: {
            $size: { $filter: { input: '$complaints', as: 'c', cond: { $eq: ['$$c.status', 'pending'] } } }
          },
          resolved: {
            $size: { $filter: { input: '$complaints', as: 'c', cond: { $eq: ['$$c.status', 'resolved'] } } }
          },
          inProgress: {
            $size: { $filter: { input: '$complaints', as: 'c', cond: { $eq: ['$$c.status', 'in_progress'] } } }
          }
        }
      },
      { $sort: { total: -1 } }
    ]);

    res.json({ success: true, data: report });
  } catch (error) {
    next(error);
  }
};

// @desc    Get officer performance report
// @route   GET /api/reports/officers
// @access  Private (Admin)
exports.getOfficerReport = async (req, res, next) => {
  try {
    const report = await User.aggregate([
      { $match: { role: 'officer' } },
      {
        $lookup: {
          from: 'complaints',
          localField: '_id',
          foreignField: 'assignedOfficer',
          as: 'assigned'
        }
      },
      {
        $project: {
          name: 1,
          email: 1,
          department: 1,
          totalAssigned: { $size: '$assigned' },
          resolved: {
            $size: { $filter: { input: '$assigned', as: 'c', cond: { $eq: ['$$c.status', 'resolved'] } } }
          },
          pending: {
            $size: { $filter: { input: '$assigned', as: 'c', cond: { $in: ['$$c.status', ['pending', 'assigned', 'in_progress']] } } }
          }
        }
      },
      { $sort: { resolved: -1 } }
    ]);

    res.json({ success: true, data: report });
  } catch (error) {
    next(error);
  }
};
