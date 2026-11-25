const Settings = require('../models/Settings');

exports.getSettings = async (req, res, next) => {
  try {
    const settings = await Settings.findAll({ publicOnly: req.user.role !== 'admin' });
    const settingsObj = settings.reduce((acc, s) => ({ ...acc, [s.key]: s.value }), {});
    res.json({ success: true, data: settingsObj });
  } catch (error) {
    next(error);
  }
};

exports.updateSetting = async (req, res, next) => {
  try {
    const { key, value, description, category, isPublic } = req.body;
    const setting = await Settings.upsert({
      key,
      value,
      description,
      category,
      isPublic,
      updatedBy: req.user.id,
    });
    res.json({ success: true, data: setting });
  } catch (error) {
    next(error);
  }
};

exports.bulkUpdateSettings = async (req, res, next) => {
  try {
    const { settings } = req.body;
    for (const s of settings || []) {
      await Settings.upsert({ ...s, updatedBy: req.user.id });
    }
    res.json({ success: true, message: 'Settings updated.' });
  } catch (error) {
    next(error);
  }
};

exports.initDefaultSettings = async (req, res, next) => {
  try {
    const defaults = [
      { key: 'site_name', value: 'JanSamadhan', category: 'general', isPublic: true },
      { key: 'site_tagline', value: 'Government Grievance Redressal Portal', category: 'general', isPublic: true },
      { key: 'default_sla_days', value: 30, category: 'complaint', isPublic: false },
      { key: 'max_attachments', value: 5, category: 'complaint', isPublic: true },
      { key: 'max_file_size_mb', value: 10, category: 'complaint', isPublic: true },
      { key: 'email_notifications', value: true, category: 'notification', isPublic: false },
      { key: 'maintenance_mode', value: false, category: 'general', isPublic: true },
      { key: 'allow_anonymous_complaints', value: true, category: 'complaint', isPublic: true },
    ];

    for (const s of defaults) {
      await Settings.upsert({ ...s, updatedBy: req.user.id });
    }

    res.json({ success: true, message: 'Default settings initialized.' });
  } catch (error) {
    next(error);
  }
};
