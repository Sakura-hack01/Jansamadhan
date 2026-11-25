const { query } = require('../config/database');

const mapCenter = (row) => {
  if (!row) return null;
  return {
    _id: row.id,
    id: row.id,
    name: row.name,
    code: row.code,
    type: row.type,
    departmentName: row.department_name,
    address: row.address || {},
    lat: row.lat,
    lng: row.lng,
    phone: row.phone,
    email: row.email,
    workingDays: row.working_days,
    openHour: row.open_hour,
    closeHour: row.close_hour,
    services: Array.isArray(row.services) ? row.services : [],
    facilities: row.facilities || {},
    languages: Array.isArray(row.languages) ? row.languages : ['English', 'Hindi'],
    nearestTransit: row.nearest_transit,
    crowdLevel: row.crowd_level,
    avgWaitMinutes: row.avg_wait_minutes,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
};

const GrievanceCenter = {
  async count() {
    const { rows } = await query('SELECT COUNT(*)::int AS cnt FROM grievance_centers');
    return rows[0].cnt;
  },

  async create(c) {
    const lat = c.lat ?? c.location?.coordinates?.[1];
    const lng = c.lng ?? c.location?.coordinates?.[0];
    const { rows } = await query(
      `INSERT INTO grievance_centers (
        name, code, type, department_name, address, lat, lng, phone, email,
        working_days, open_hour, close_hour, services, facilities, languages,
        nearest_transit, crowd_level, avg_wait_minutes, is_active
      ) VALUES ($1,$2,$3,$4,$5::jsonb,$6,$7,$8,$9,$10,$11,$12,$13::jsonb,$14::jsonb,$15::jsonb,$16,$17,$18,$19)
      ON CONFLICT (code) DO UPDATE SET
        name = EXCLUDED.name,
        lat = EXCLUDED.lat,
        lng = EXCLUDED.lng,
        updated_at = NOW()
      RETURNING *`,
      [
        c.name,
        String(c.code).toUpperCase(),
        c.type || 'district',
        c.departmentName,
        JSON.stringify(c.address || {}),
        lat,
        lng,
        c.phone || null,
        c.email || null,
        c.workingDays || 'Mon - Fri',
        c.openHour ?? 9.5,
        c.closeHour ?? 17.5,
        JSON.stringify(c.services || []),
        JSON.stringify(c.facilities || {}),
        JSON.stringify(c.languages || ['English', 'Hindi']),
        c.nearestTransit || null,
        c.crowdLevel || 'moderate',
        c.avgWaitMinutes ?? 15,
        c.isActive !== false,
      ]
    );
    return mapCenter(rows[0]);
  },

  async insertMany(list) {
    const created = [];
    for (const item of list) {
      created.push(await this.create(item));
    }
    return created;
  },

  async deleteAll() {
    await query('DELETE FROM grievance_centers');
  },

  async findFiltered({ type, wheelchair, search }) {
    const conditions = ['is_active = TRUE'];
    const params = [];
    let i = 1;

    if (type && type !== 'all') {
      conditions.push(`type = $${i++}`);
      params.push(type);
    }
    if (wheelchair === 'true') {
      conditions.push(`(facilities->>'wheelchairAccessible')::boolean = TRUE`);
    }
    if (search) {
      conditions.push(
        `(name ILIKE $${i} OR department_name ILIKE $${i} OR address->>'city' ILIKE $${i} OR address->>'state' ILIKE $${i} OR address->>'pincode' ILIKE $${i})`
      );
      params.push(`%${search}%`);
      i++;
    }

    const { rows } = await query(
      `SELECT * FROM grievance_centers WHERE ${conditions.join(' AND ')} ORDER BY name ASC`,
      params
    );
    return rows.map(mapCenter);
  },
};

module.exports = GrievanceCenter;
