const Settings = require('../models/Settings');

exports.getSettings = async (req, res, next) => {
  try {
    const query = req.user.role === 'admin' ? {} : { isPublic: true };
    const settings = await Settings.find(query);
    const settingsObj = settings.reduce((acc, s) => ({ ...acc, [s.key]: s.value }), {});
    res.json({ success: true, data: settingsObj });
  } catch (error) { next(error); }
};

exports.updateSetting = async (req, res, next) => {
  try {
    const { key, value, description, category, isPublic } = req.body;
    const setting = await Settings.findOneAndUpdate(
      { key },
      { key, value, description, category, isPublic, updatedBy: req.user.id },
      { upsert: true, new: true }
    );
    res.json({ success: true, data: setting });
  } catch (error) { next(error); }
};

exports.bulkUpdateSettings = async (req, res, next) => {
  try {
    const { settings } = req.body;
    const ops = settings.map(s => ({
      updateOne: {
        filter: { key: s.key },
        update: { ...s, updatedBy: req.user.id },
        upsert: true
      }
    }));
    await Settings.bulkWrite(ops);
    res.json({ success: true, message: 'Settings updated.' });
  } catch (error) { next(error); }
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
      await Settings.findOneAndUpdate({ key: s.key }, s, { upsert: true });
    }

    res.json({ success: true, message: 'Default settings initialized.' });
  } catch (error) { next(error); }
};
