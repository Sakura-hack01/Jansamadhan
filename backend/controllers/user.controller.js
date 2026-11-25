const User = require('../models/User');

// @desc    Get all users
// @route   GET /api/users
// @access  Private (Admin)
exports.getUsers = async (req, res, next) => {
  try {
    const { role, isActive, page = 1, limit = 20, search } = req.query;
    const { users, total } = await User.findAll({ role, isActive, page, limit, search });
    res.json({
      success: true,
      data: users,
      pagination: { total, page: Number(page), pages: Math.ceil(total / Number(limit)) },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Private (Admin)
exports.getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found.' });
    res.json({ success: true, data: user.toObject() });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
exports.updateProfile = async (req, res, next) => {
  try {
    const { name, phone, address, avatar } = req.body;
    const user = await User.updateProfile(req.user.id, { name, phone, address, avatar });
    res.json({ success: true, data: user.toObject(), message: 'Profile updated.' });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user (Admin)
// @route   PUT /api/users/:id
// @access  Private (Admin)
exports.updateUser = async (req, res, next) => {
  try {
    const { role, department, isActive } = req.body;
    const existing = await User.findById(req.params.id);
    if (!existing) return res.status(404).json({ message: 'User not found.' });

    const user = await User.adminUpdate(req.params.id, { role, department, isActive });
    res.json({ success: true, data: user.toObject(), message: 'User updated.' });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private (Admin)
exports.deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found.' });

    if (user.role === 'admin') {
      return res.status(400).json({ message: 'Cannot delete admin user.' });
    }

    await User.deleteById(req.params.id);
    res.json({ success: true, message: 'User deleted.' });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user stats
// @route   GET /api/users/stats
// @access  Private (Admin)
exports.getUserStats = async (req, res, next) => {
  try {
    const data = await User.getStats();
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

// @desc    Get officers by department
// @route   GET /api/users/officers/:departmentId
// @access  Private (Admin)
exports.getOfficersByDepartment = async (req, res, next) => {
  try {
    const officers = await User.findOfficersByDepartment(req.params.departmentId);
    res.json({ success: true, data: officers });
  } catch (error) {
    next(error);
  }
};
