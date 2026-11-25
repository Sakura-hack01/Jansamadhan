const { query } = require('../config/database');

const mapSetting = (row) => {
  if (!row) return null;
  return {
    _id: row.id,
    id: row.id,
    key: row.key,
    value: row.value,
    description: row.description,
    category: row.category,
    isPublic: row.is_public,
    updatedBy: row.updated_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
};

const Settings = {
  async findAll({ publicOnly = false } = {}) {
    const where = publicOnly ? 'WHERE is_public = TRUE' : '';
    const { rows } = await query(`SELECT * FROM settings ${where}`);
    return rows.map(mapSetting);
  },

  async upsert({ key, value, description = null, category = 'general', isPublic = false, updatedBy = null }) {
    const { rows } = await query(
      `INSERT INTO settings (key, value, description, category, is_public, updated_by)
       VALUES ($1, $2::jsonb, $3, $4, $5, $6)
       ON CONFLICT (key) DO UPDATE SET
         value = EXCLUDED.value,
         description = COALESCE(EXCLUDED.description, settings.description),
         category = COALESCE(EXCLUDED.category, settings.category),
         is_public = COALESCE(EXCLUDED.is_public, settings.is_public),
         updated_by = EXCLUDED.updated_by,
         updated_at = NOW()
       RETURNING *`,
      [key, JSON.stringify(value), description, category, isPublic, updatedBy]
    );
    return mapSetting(rows[0]);
  },
};

module.exports = Settings;
