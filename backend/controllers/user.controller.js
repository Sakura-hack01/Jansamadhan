const User = require('../models/User');
const Complaint = require('../models/Complaint');

// @desc    Get all users
// @route   GET /api/users
// @access  Private (Admin)
exports.getUsers = async (req, res, next) => {
  try {
    const { role, isActive, page = 1, limit = 20, search } = req.query;
    let query = {};
    if (role) query.role = role;
    if (isActive !== undefined) query.isActive = isActive === 'true';
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const total = await User.countDocuments(query);
    const users = await User.find(query)
      .populate('department', 'name code')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ success: true, data: users, pagination: { total, page: Number(page), pages: Math.ceil(total / limit) } });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Private (Admin)
exports.getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).populate('department', 'name code');
    if (!user) return res.status(404).json({ message: 'User not found.' });
    res.json({ success: true, data: user });
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
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { name, phone, address, avatar },
      { new: true, runValidators: true }
    ).populate('department', 'name code');

    res.json({ success: true, data: user, message: 'Profile updated.' });
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
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role, department, isActive },
      { new: true, runValidators: true }
    ).populate('department', 'name code');

    if (!user) return res.status(404).json({ message: 'User not found.' });
    res.json({ success: true, data: user, message: 'User updated.' });
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

    await User.findByIdAndDelete(req.params.id);
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
    const total = await User.countDocuments();
    const byRole = await User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } }
    ]);
    const active = await User.countDocuments({ isActive: true });
    const newThisMonth = await User.countDocuments({
      createdAt: { $gte: new Date(new Date().setDate(1)) }
    });

    res.json({ success: true, data: { total, byRole, active, newThisMonth } });
  } catch (error) {
    next(error);
  }
};

// @desc    Get officers by department
// @route   GET /api/users/officers/:departmentId
// @access  Private (Admin)
exports.getOfficersByDepartment = async (req, res, next) => {
  try {
    const officers = await User.find({ 
      department: req.params.departmentId, 
      role: 'officer',
      isActive: true
    }).select('name email phone avatar');
    res.json({ success: true, data: officers });
  } catch (error) {
    next(error);
  }
};
