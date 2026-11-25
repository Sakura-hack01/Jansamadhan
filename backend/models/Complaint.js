const { query } = require('../config/database');
const Department = require('./Department');

const mapComplaint = (row) => {
  if (!row) return null;
  return {
    _id: row.id,
    id: row.id,
    complaintNumber: row.complaint_number,
    title: row.title,
    description: row.description,
    category: row.category,
    subCategory: row.sub_category,
    priority: row.priority,
    status: row.status,
    complainant: row.complainant_obj || row.complainant_id,
    complainantId: row.complainant_id,
    department: row.department_obj || row.department_id,
    departmentId: row.department_id,
    assignedOfficer: row.officer_obj || row.assigned_officer_id || null,
    assignedOfficerId: row.assigned_officer_id || null,
    attachments: Array.isArray(row.attachments) ? row.attachments : [],
    timeline: Array.isArray(row.timeline) ? row.timeline : [],
    location: row.location || {},
    resolutionNote: row.resolution_note,
    rejectionReason: row.rejection_reason,
    escalated: Boolean(row.escalated),
    escalatedAt: row.escalated_at,
    escalatedTo: row.escalated_to_id,
    dueDate: row.due_date,
    resolvedAt: row.resolved_at,
    closedAt: row.closed_at,
    feedback: row.feedback || null,
    isAnonymous: Boolean(row.is_anonymous),
    isPublic: Boolean(row.is_public),
    views: row.views || 0,
    tags: Array.isArray(row.tags) ? row.tags : [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
};

const POPULATED_SELECT = `
  SELECT c.*,
    CASE WHEN cu.id IS NOT NULL THEN json_build_object('_id', cu.id, 'id', cu.id, 'name', cu.name, 'email', cu.email, 'phone', cu.phone, 'avatar', cu.avatar) ELSE NULL END AS complainant_obj,
    CASE WHEN d.id IS NOT NULL THEN json_build_object('_id', d.id, 'id', d.id, 'name', d.name, 'code', d.code, 'email', d.email) ELSE NULL END AS department_obj,
    CASE WHEN ou.id IS NOT NULL THEN json_build_object('_id', ou.id, 'id', ou.id, 'name', ou.name, 'email', ou.email, 'phone', ou.phone) ELSE NULL END AS officer_obj
  FROM complaints c
  LEFT JOIN users cu ON c.complainant_id = cu.id
  LEFT JOIN departments d ON c.department_id = d.id
  LEFT JOIN users ou ON c.assigned_officer_id = ou.id
`;

const SORT_ALLOWLIST = {
  createdAt: 'c.created_at',
  updatedAt: 'c.updated_at',
  priority: 'c.priority',
  status: 'c.status',
};

const Complaint = {
  async create(data) {
    const countRes = await query('SELECT COUNT(*)::int AS cnt FROM complaints');
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const seq = String(countRes.rows[0].cnt + 1).padStart(6, '0');
    const complaintNumber = `JS/${year}/${month}/${seq}`;

    let dueDate = data.dueDate || null;
    if (!dueDate && data.department) {
      const dept = await Department.findById(data.department);
      const days = dept?.resolutionDays || 30;
      const due = new Date();
      due.setDate(due.getDate() + days);
      dueDate = due;
    }

    const { rows } = await query(
      `INSERT INTO complaints (
        complaint_number, title, description, category, sub_category, priority, status,
        complainant_id, department_id, location, tags, is_anonymous, timeline, due_date
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::jsonb,$11::jsonb,$12,$13::jsonb,$14)
      RETURNING id`,
      [
        complaintNumber,
        data.title,
        data.description,
        data.category,
        data.subCategory || null,
        data.priority || 'medium',
        data.status || 'pending',
        data.complainant,
        data.department,
        JSON.stringify(data.location || {}),
        JSON.stringify(data.tags || []),
        Boolean(data.isAnonymous),
        JSON.stringify(data.timeline || []),
        dueDate,
      ]
    );
    return this.findById(rows[0].id);
  },

  async findById(id) {
    const { rows } = await query(`${POPULATED_SELECT} WHERE c.id = $1`, [id]);
    return mapComplaint(rows[0]);
  },

  async findByNumber(complaintNumber) {
    const { rows } = await query(
      `${POPULATED_SELECT} WHERE UPPER(c.complaint_number) = UPPER($1) LIMIT 1`,
      [complaintNumber]
    );
    return mapComplaint(rows[0]);
  },

  async findAll({ role, userId, userDepartment, status, category, priority, department, search, page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' }) {
    const conditions = [];
    const params = [];
    let i = 1;

    if (role === 'user') {
      conditions.push(`c.complainant_id = $${i++}`);
      params.push(userId);
    } else if (role === 'officer') {
      conditions.push(`c.department_id = $${i++}`);
      params.push(userDepartment);
    } else if (department && role === 'admin') {
      conditions.push(`c.department_id = $${i++}`);
      params.push(department);
    }

    if (status) { conditions.push(`c.status = $${i++}`); params.push(status); }
    if (category) { conditions.push(`c.category = $${i++}`); params.push(category); }
    if (priority) { conditions.push(`c.priority = $${i++}`); params.push(priority); }
    if (search) {
      conditions.push(`(c.title ILIKE $${i} OR c.complaint_number ILIKE $${i} OR c.description ILIKE $${i})`);
      params.push(`%${search}%`);
      i++;
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const countRes = await query(`SELECT COUNT(*)::int AS total FROM complaints c ${where}`, params);
    const total = countRes.rows[0].total;

    const orderCol = SORT_ALLOWLIST[sortBy] || 'c.created_at';
    const dir = String(sortOrder).toLowerCase() === 'asc' ? 'ASC' : 'DESC';
    const offset = (Number(page) - 1) * Number(limit);

    const { rows } = await query(
      `${POPULATED_SELECT} ${where} ORDER BY ${orderCol} ${dir} LIMIT $${i++} OFFSET $${i}`,
      [...params, Number(limit), offset]
    );

    return { complaints: rows.map(mapComplaint), total };
  },

  async incrementViews(id) {
    await query('UPDATE complaints SET views = views + 1 WHERE id = $1', [id]);
  },

  async updateStatus(id, { status, resolutionNote, rejectionReason, resolvedAt, closedAt, timelineEntry }) {
    const existing = await this.findById(id);
    if (!existing) return null;
    const timeline = [...existing.timeline, timelineEntry];

    await query(
      `UPDATE complaints SET
        status = $1,
        resolution_note = COALESCE($2, resolution_note),
        rejection_reason = COALESCE($3, rejection_reason),
        resolved_at = COALESCE($4, resolved_at),
        closed_at = COALESCE($5, closed_at),
        timeline = $6::jsonb,
        updated_at = NOW()
      WHERE id = $7`,
      [status, resolutionNote || null, rejectionReason || null, resolvedAt || null, closedAt || null, JSON.stringify(timeline), id]
    );
    return this.findById(id);
  },

  async assignOfficer(id, officerId, timelineEntry) {
    const existing = await this.findById(id);
    if (!existing) return null;
    const timeline = [...existing.timeline, timelineEntry];
    await query(
      `UPDATE complaints SET
        assigned_officer_id = $1,
        status = 'assigned',
        timeline = $2::jsonb,
        updated_at = NOW()
      WHERE id = $3`,
      [officerId, JSON.stringify(timeline), id]
    );
    return this.findById(id);
  },

  async escalate(id, timelineEntry) {
    const existing = await this.findById(id);
    if (!existing) return null;
    const timeline = [...existing.timeline, timelineEntry];
    await query(
      `UPDATE complaints SET
        escalated = TRUE,
        escalated_at = NOW(),
        timeline = $1::jsonb,
        updated_at = NOW()
      WHERE id = $2`,
      [JSON.stringify(timeline), id]
    );
    return this.findById(id);
  },

  async submitFeedback(id, feedback) {
    await query(
      `UPDATE complaints SET
        feedback = $1::jsonb,
        status = 'closed',
        closed_at = NOW(),
        updated_at = NOW()
      WHERE id = $2`,
      [JSON.stringify({ ...feedback, submittedAt: new Date() }), id]
    );
    return this.findById(id);
  },

  async addTimelineEntry(id, timelineEntry) {
    const existing = await this.findById(id);
    if (!existing) return null;
    const timeline = [...existing.timeline, timelineEntry];
    await query('UPDATE complaints SET timeline = $1::jsonb, updated_at = NOW() WHERE id = $2', [
      JSON.stringify(timeline),
      id,
    ]);
    return this.findById(id);
  },

  async deleteById(id) {
    const { rowCount } = await query('DELETE FROM complaints WHERE id = $1', [id]);
    return rowCount > 0;
  },

  async getStats({ role, userId, userDepartment }) {
    const conditions = [];
    const params = [];
    if (role === 'user') { conditions.push('complainant_id = $1'); params.push(userId); }
    if (role === 'officer') { conditions.push('department_id = $1'); params.push(userDepartment); }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const byStatus = (await query(`SELECT status AS "_id", COUNT(*)::int AS count FROM complaints ${where} GROUP BY status`, params)).rows;
    const byCategory = (await query(`SELECT category AS "_id", COUNT(*)::int AS count FROM complaints ${where} GROUP BY category ORDER BY count DESC LIMIT 10`, params)).rows;
    const monthly = (
      await query(
        `SELECT json_build_object('month', EXTRACT(MONTH FROM created_at)::int, 'year', EXTRACT(YEAR FROM created_at)::int) AS "_id",
                COUNT(*)::int AS count
         FROM complaints
         ${where ? `${where} AND` : 'WHERE'} created_at >= NOW() - INTERVAL '1 year'
         GROUP BY EXTRACT(YEAR FROM created_at), EXTRACT(MONTH FROM created_at)
         ORDER BY EXTRACT(YEAR FROM created_at) ASC, EXTRACT(MONTH FROM created_at) ASC`,
        params
      )
    ).rows;
    const totalRes = await query(`SELECT COUNT(*)::int AS total FROM complaints ${where}`, params);
    const avgRes = await query(
      `SELECT AVG(EXTRACT(EPOCH FROM (resolved_at - created_at)) / 86400.0) AS avg_days
       FROM complaints
       ${where ? `${where} AND` : 'WHERE'} status = 'resolved' AND resolved_at IS NOT NULL`,
      params
    );

    return {
      total: totalRes.rows[0].total,
      byStatus,
      byCategory,
      monthly,
      avgResolutionDays: avgRes.rows[0]?.avg_days ? Number(avgRes.rows[0].avg_days).toFixed(1) : 0,
    };
  },
};

module.exports = Complaint;
