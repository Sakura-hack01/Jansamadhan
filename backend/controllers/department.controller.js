const Department = require('../models/Department');

exports.getDepartments = async (req, res, next) => {
  try {
    const departments = await Department.findAllActive();
    res.json({ success: true, data: departments });
  } catch (error) {
    next(error);
  }
};

exports.createDepartment = async (req, res, next) => {
  try {
    const dept = await Department.create(req.body);
    res.status(201).json({ success: true, data: dept });
  } catch (error) {
    next(error);
  }
};

exports.updateDepartment = async (req, res, next) => {
  try {
    const dept = await Department.updateById(req.params.id, req.body);
    if (!dept) return res.status(404).json({ message: 'Department not found.' });
    res.json({ success: true, data: dept });
  } catch (error) {
    next(error);
  }
};

exports.deleteDepartment = async (req, res, next) => {
  try {
    await Department.deleteById(req.params.id);
    res.json({ success: true, message: 'Department deleted.' });
  } catch (error) {
    next(error);
  }
};

exports.seedDepartments = async (req, res, next) => {
  try {
    const created = await Department.seedDefaults();
    res.json({ success: true, data: created, message: 'Departments seeded.' });
  } catch (error) {
    next(error);
  }
};
