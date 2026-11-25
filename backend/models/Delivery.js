const { query } = require('../config/database');

const mapDelivery = (row) => {
  if (!row) return null;
  return {
    _id: row.id,
    id: row.id,
    orderNumber: row.order_number,
    user: row.user_obj || row.user_id,
    userId: row.user_id,
    serviceType: row.service_type,
    items: Array.isArray(row.items) ? row.items : [],
    totalAmount: Number(row.total_amount || 0),
    deliveryAddress: row.delivery_address || {},
    status: row.status,
    trackingId: row.tracking_id,
    assignedAgent: row.assigned_agent,
    department: row.department_obj || row.department_id,
    departmentId: row.department_id,
    priority: row.priority,
    specialInstructions: row.special_instructions,
    estimatedDelivery: row.estimated_delivery,
    deliveredAt: row.delivered_at,
    proofOfDelivery: row.proof_of_delivery,
    timeline: Array.isArray(row.timeline) ? row.timeline : [],
    rating: row.rating,
    paymentStatus: row.payment_status,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
};

const POPULATED_SELECT = `
  SELECT dl.*,
    CASE WHEN u.id IS NOT NULL THEN json_build_object('_id', u.id, 'id', u.id, 'name', u.name, 'email', u.email, 'phone', u.phone) ELSE NULL END AS user_obj,
    CASE WHEN d.id IS NOT NULL THEN json_build_object('_id', d.id, 'id', d.id, 'name', d.name, 'code', d.code) ELSE NULL END AS department_obj
  FROM deliveries dl
  LEFT JOIN users u ON dl.user_id = u.id
  LEFT JOIN departments d ON dl.department_id = d.id
`;

const Delivery = {
  async create(data) {
    const countRes = await query('SELECT COUNT(*)::int AS cnt FROM deliveries');
    const year = new Date().getFullYear();
    const orderNumber = `DEL/${year}/${String(countRes.rows[0].cnt + 1).padStart(8, '0')}`;

    const { rows } = await query(
      `INSERT INTO deliveries (
        order_number, user_id, service_type, items, total_amount, delivery_address,
        department_id, priority, special_instructions, timeline
      ) VALUES ($1,$2,$3,$4::jsonb,$5,$6::jsonb,$7,$8,$9,$10::jsonb)
      RETURNING id`,
      [
        orderNumber,
        data.user,
        data.serviceType,
        JSON.stringify(data.items || []),
        Number(data.totalAmount || 0),
        JSON.stringify(data.deliveryAddress || {}),
        data.department || null,
        data.priority || 'normal',
        data.specialInstructions || null,
        JSON.stringify(data.timeline || []),
      ]
    );
    return this.findById(rows[0].id);
  },

  async findById(id) {
    const { rows } = await query(`${POPULATED_SELECT} WHERE dl.id = $1`, [id]);
    return mapDelivery(rows[0]);
  },

  async findByOrderNumber(orderNumber) {
    const { rows } = await query(
      `SELECT dl.*,
        CASE WHEN d.id IS NOT NULL THEN json_build_object('_id', d.id, 'id', d.id, 'name', d.name, 'code', d.code) ELSE NULL END AS department_obj
       FROM deliveries dl
       LEFT JOIN departments d ON dl.department_id = d.id
       WHERE UPPER(dl.order_number) = UPPER($1) LIMIT 1`,
      [orderNumber]
    );
    return mapDelivery(rows[0]);
  },

  async findAll({ role, userId, status, serviceType, search, page = 1, limit = 10 }) {
    const conditions = [];
    const params = [];
    let i = 1;
    if (role === 'user') { conditions.push(`dl.user_id = $${i++}`); params.push(userId); }
    if (status) { conditions.push(`dl.status = $${i++}`); params.push(status); }
    if (serviceType) { conditions.push(`dl.service_type = $${i++}`); params.push(serviceType); }
    if (search) { conditions.push(`dl.order_number ILIKE $${i++}`); params.push(`%${search}%`); }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const countRes = await query(`SELECT COUNT(*)::int AS total FROM deliveries dl ${where}`, params);
    const total = countRes.rows[0].total;
    const offset = (Number(page) - 1) * Number(limit);

    const { rows } = await query(
      `${POPULATED_SELECT} ${where} ORDER BY dl.created_at DESC LIMIT $${i++} OFFSET $${i}`,
      [...params, Number(limit), offset]
    );
    return { deliveries: rows.map(mapDelivery), total };
  },

  async updateStatus(id, { status, trackingId, assignedAgent, deliveredAt, timelineEntry }) {
    const existing = await this.findById(id);
    if (!existing) return null;
    const timeline = [...existing.timeline, timelineEntry];
    await query(
      `UPDATE deliveries SET
        status = $1,
        tracking_id = COALESCE($2, tracking_id),
        assigned_agent = COALESCE($3::jsonb, assigned_agent),
        delivered_at = COALESCE($4, delivered_at),
        timeline = $5::jsonb,
        updated_at = NOW()
      WHERE id = $6`,
      [
        status,
        trackingId || null,
        assignedAgent ? JSON.stringify(assignedAgent) : null,
        deliveredAt || null,
        JSON.stringify(timeline),
        id,
      ]
    );
    return this.findById(id);
  },

  async rate(id, rating) {
    await query('UPDATE deliveries SET rating = $1::jsonb, updated_at = NOW() WHERE id = $2', [
      JSON.stringify(rating),
      id,
    ]);
  },

  async getStats() {
    const total = (await query('SELECT COUNT(*)::int AS total FROM deliveries')).rows[0].total;
    const byStatus = (await query('SELECT status AS "_id", COUNT(*)::int AS count FROM deliveries GROUP BY status')).rows;
    const byType = (await query('SELECT service_type AS "_id", COUNT(*)::int AS count FROM deliveries GROUP BY service_type')).rows;
    return { total, byStatus, byType };
  },
};

module.exports = Delivery;
