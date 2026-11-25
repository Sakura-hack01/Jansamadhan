const { query } = require('../config/database');

const mapDept = (row) => {
  if (!row) return null;
  return {
    _id: row.id,
    id: row.id,
    name: row.name,
    code: row.code,
    description: row.description,
    email: row.email,
    phone: row.phone,
    headOfficer: row.head_officer_obj || row.head_officer_id || null,
    isActive: row.is_active,
    category: row.category,
    resolutionDays: row.resolution_days,
    icon: row.icon,
    color: row.color,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
};

const DEFAULT_DEPARTMENTS = [
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

let seededDepts = false;

const Department = {
  async ensureSeeded() {
    if (seededDepts) return;
    const { rows } = await query('SELECT COUNT(*)::int AS cnt FROM departments');
    if (rows[0].cnt === 0) {
      for (const d of DEFAULT_DEPARTMENTS) {
        await query(
          `INSERT INTO departments (name, code, email, category, resolution_days, color)
           VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (code) DO NOTHING`,
          [d.name, d.code, d.email, d.category, d.resolutionDays, d.color]
        );
      }
    }
    seededDepts = true;
  },

  async findAllActive() {
    await this.ensureSeeded();
    const { rows } = await query(`
      SELECT d.*,
        CASE WHEN u.id IS NOT NULL THEN json_build_object('_id', u.id, 'id', u.id, 'name', u.name, 'email', u.email) ELSE NULL END AS head_officer_obj
      FROM departments d
      LEFT JOIN users u ON d.head_officer_id = u.id
      WHERE d.is_active = TRUE
      ORDER BY d.name ASC
    `);
    return rows.map(mapDept);
  },

  async findById(id) {
    const { rows } = await query('SELECT * FROM departments WHERE id = $1', [id]);
    return mapDept(rows[0]);
  },

  async create(data) {
    const { rows } = await query(
      `INSERT INTO departments (name, code, description, email, phone, head_officer_id, category, resolution_days, icon, color)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [
        data.name,
        String(data.code || '').toUpperCase(),
        data.description || null,
        data.email,
        data.phone || null,
        data.headOfficer || null,
        data.category || 'central',
        Number(data.resolutionDays) || 30,
        data.icon || null,
        data.color || '#000080',
      ]
    );
    return mapDept(rows[0]);
  },

  async updateById(id, data) {
    const { rows } = await query(
      `UPDATE departments SET
        name = COALESCE($1, name),
        code = COALESCE($2, code),
        description = COALESCE($3, description),
        email = COALESCE($4, email),
        phone = COALESCE($5, phone),
        category = COALESCE($6, category),
        resolution_days = COALESCE($7, resolution_days),
        is_active = COALESCE($8, is_active),
        updated_at = NOW()
      WHERE id = $9 RETURNING *`,
      [
        data.name,
        data.code ? String(data.code).toUpperCase() : null,
        data.description,
        data.email,
        data.phone,
        data.category,
        data.resolutionDays !== undefined ? Number(data.resolutionDays) : null,
        data.isActive,
        id,
      ]
    );
    return mapDept(rows[0]);
  },

  async deleteById(id) {
    await query('DELETE FROM departments WHERE id = $1', [id]);
  },

  async seedDefaults() {
    await query('DELETE FROM departments');
    const created = [];
    for (const d of DEFAULT_DEPARTMENTS) {
      created.push(await this.create(d));
    }
    seededDepts = true;
    return created;
  },
};

module.exports = Department;
