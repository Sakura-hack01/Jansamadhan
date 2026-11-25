const Department = require('../models/Department');

exports.getDepartments = async (req, res, next) => {
  try {
    const departments = await Department.find({ isActive: true })
      .populate('headOfficer', 'name email')
      .sort({ name: 1 });
    res.json({ success: true, data: departments });
  } catch (error) { next(error); }
};

exports.createDepartment = async (req, res, next) => {
  try {
    const dept = await Department.create(req.body);
    res.status(201).json({ success: true, data: dept });
  } catch (error) { next(error); }
};

exports.updateDepartment = async (req, res, next) => {
  try {
    const dept = await Department.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!dept) return res.status(404).json({ message: 'Department not found.' });
    res.json({ success: true, data: dept });
  } catch (error) { next(error); }
};

exports.deleteDepartment = async (req, res, next) => {
  try {
    await Department.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Department deleted.' });
  } catch (error) { next(error); }
};

exports.seedDepartments = async (req, res, next) => {
  try {
    const departments = [
      { name: 'Ministry of Finance', code: 'MOF', email: 'finance@gov.in', category: 'central', resolutionDays: 30, color: '#1e40af' },
      { name: 'Ministry of Health', code: 'MOH', email: 'health@gov.in', category: 'central', resolutionDays: 15, color: '#16a34a' },
      { name: 'Ministry of Education', code: 'MOE', email: 'education@gov.in', category: 'central', resolutionDays: 30, color: '#9333ea' },
      { name: 'Municipal Corporation', code: 'MCD', email: 'mcd@gov.in', category: 'local', resolutionDays: 21, color: '#ea580c' },
      { name: 'Police Department', code: 'POL', email: 'police@gov.in', category: 'state', resolutionDays: 7, color: '#0f172a' },
      { name: 'Revenue Department', code: 'REV', email: 'revenue@gov.in', category: 'state', resolutionDays: 30, color: '#b45309' },
      { name: 'Water Department', code: 'WAT', email: 'water@gov.in', category: 'local', resolutionDays: 14, color: '#0284c7' },
      { name: 'Electricity Board', code: 'ELEC', email: 'electricity@gov.in', category: 'state', resolutionDays: 7, color: '#ca8a04' },
      { name: 'Transport Department', code: 'TRANS', email: 'transport@gov.in', category: 'state', resolutionDays: 21, color: '#0f766e' },
      { name: 'Social Welfare', code: 'SW', email: 'socialwelfare@gov.in', category: 'state', resolutionDays: 30, color: '#db2777' },
    ];

    await Department.deleteMany({});
    const created = await Department.insertMany(departments);
    res.json({ success: true, data: created, message: 'Departments seeded.' });
  } catch (error) { next(error); }
};
