const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { query } = require('../config/database');

/**
 * Adds exactly 2 calendar months to a date, clamping to the last day of the target month.
 */
function addTwoMonths(fromDate = new Date()) {
  const date = new Date(fromDate);
  const originalDay = date.getDate();
  date.setDate(1);
  date.setMonth(date.getMonth() + 2);
  const lastDayOfTargetMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  date.setDate(Math.min(originalDay, lastDayOfTargetMonth));
  return date;
}

class UserEntity {
  constructor(row) {
    this.id = row.id;
    this._id = row.id;
    this.name = row.name;
    this.email = row.email;
    this.password = row.password;
    this.hasPassword = Boolean(row.has_password);
    this.passwordChangedAt = row.password_changed_at;
    this.passwordExpiresAt = row.password_expires_at;
    this.phone = row.phone;
    this.role = row.role || 'user';
    this.department = row.department_obj || row.department_id || null;
    this.departmentId = row.department_id || null;
    this.avatar = row.avatar || '';
    this.googleId = row.google_id || null;
    this.authProvider = row.auth_provider || 'local';
    this.linkedProviders = Array.isArray(row.linked_providers) ? row.linked_providers : [];
    this.isVerified = Boolean(row.is_verified);
    this.isActive = row.is_active !== false;
    this.address = row.address || {};
    this.emailVerificationToken = row.email_verification_token;
    this.emailVerificationExpire = row.email_verification_expire;
    this.resetPasswordToken = row.reset_password_token;
    this.resetPasswordExpire = row.reset_password_expire;
    this.lastLogin = row.last_login;
    this.loginOtp = row.login_otp;
    this.loginOtpExpire = row.login_otp_expire;
    this.loginCount = row.login_count || 0;
    this.fcmToken = row.fcm_token;
    this.createdAt = row.created_at;
    this.updatedAt = row.updated_at;
  }

  async comparePassword(candidatePassword) {
    if (!this.password) return false;
    return bcrypt.compare(candidatePassword, this.password);
  }

  getPasswordExpiryDate() {
    if (!this.hasPassword && this.authProvider !== 'local' && !this.passwordChangedAt && !this.passwordExpiresAt) {
      return null;
    }
    if (this.passwordExpiresAt) return new Date(this.passwordExpiresAt);
    const baseDate = this.passwordChangedAt || this.createdAt || new Date();
    return addTwoMonths(baseDate);
  }

  isPasswordExpired() {
    const expiryDate = this.getPasswordExpiryDate();
    if (!expiryDate) return false;
    return Date.now() >= expiryDate.getTime();
  }

  getDaysUntilPasswordExpiry() {
    const expiryDate = this.getPasswordExpiryDate();
    if (!expiryDate) return null;
    const diffMs = expiryDate.getTime() - Date.now();
    if (diffMs <= 0) return 0;
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  }

  generateJWT() {
    return jwt.sign(
      { id: this.id, role: this.role, email: this.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );
  }

  generateRefreshToken() {
    return jwt.sign(
      { id: this.id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: process.env.JWT_REFRESH_EXPIRE || '30d' }
    );
  }

  generatePasswordExpiredToken() {
    return jwt.sign(
      { id: this.id, purpose: 'password_expired' },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );
  }

  generateVerificationToken() {
    const token = crypto.randomBytes(32).toString('hex');
    this.emailVerificationToken = crypto.createHash('sha256').update(token).digest('hex');
    this.emailVerificationExpire = new Date(Date.now() + 24 * 60 * 60 * 1000);
    return token;
  }

  generatePasswordResetToken() {
    const token = crypto.randomBytes(32).toString('hex');
    this.resetPasswordToken = crypto.createHash('sha256').update(token).digest('hex');
    this.resetPasswordExpire = new Date(Date.now() + 30 * 60 * 1000);
    return token;
  }

  generateLoginOtp() {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    this.loginOtp = crypto.createHash('sha256').update(otp).digest('hex');
    this.loginOtpExpire = new Date(Date.now() + 5 * 60 * 1000);
    return otp;
  }

  toObject() {
    return {
      _id: this.id,
      id: this.id,
      name: this.name,
      email: this.email,
      hasPassword: this.hasPassword,
      passwordChangedAt: this.passwordChangedAt,
      passwordExpiresAt: this.passwordExpiresAt,
      phone: this.phone,
      role: this.role,
      department: this.department,
      avatar: this.avatar,
      googleId: this.googleId,
      authProvider: this.authProvider,
      linkedProviders: this.linkedProviders,
      isVerified: this.isVerified,
      isActive: this.isActive,
      address: this.address,
      lastLogin: this.lastLogin,
      loginCount: this.loginCount,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}

const mapRow = (row) => (row ? new UserEntity(row) : null);

const BASE_SELECT = `
  SELECT u.*,
    CASE WHEN d.id IS NOT NULL THEN json_build_object('_id', d.id, 'id', d.id, 'name', d.name, 'code', d.code) ELSE NULL END AS department_obj
  FROM users u
  LEFT JOIN departments d ON u.department_id = d.id
`;

const User = {
  UserEntity,
  addTwoMonths,

  async findById(id) {
    const { rows } = await query(`${BASE_SELECT} WHERE u.id = $1`, [id]);
    return mapRow(rows[0]);
  },

  async findByEmail(email) {
    const { rows } = await query(`${BASE_SELECT} WHERE u.email = $1`, [email.trim().toLowerCase()]);
    return mapRow(rows[0]);
  },

  async findByGoogleOrEmail(googleId, email) {
    const { rows } = await query(
      `${BASE_SELECT} WHERE u.google_id = $1 OR u.email = $2 LIMIT 1`,
      [googleId, email.trim().toLowerCase()]
    );
    return mapRow(rows[0]);
  },

  async findByVerificationToken(hashedToken) {
    const { rows } = await query(
      `${BASE_SELECT} WHERE u.email_verification_token = $1 AND u.email_verification_expire > NOW() LIMIT 1`,
      [hashedToken]
    );
    return mapRow(rows[0]);
  },

  async findByResetToken(hashedToken) {
    const { rows } = await query(
      `${BASE_SELECT} WHERE u.reset_password_token = $1 AND u.reset_password_expire > NOW() LIMIT 1`,
      [hashedToken]
    );
    return mapRow(rows[0]);
  },

  async findByOtp(email, hashedOtp) {
    const { rows } = await query(
      `${BASE_SELECT} WHERE u.email = $1 AND u.login_otp = $2 AND u.login_otp_expire > NOW() LIMIT 1`,
      [email.trim().toLowerCase(), hashedOtp]
    );
    return mapRow(rows[0]);
  },

  async create(data) {
    const now = new Date();
    let hashedPassword = null;
    let hasPassword = false;
    let passwordChangedAt = null;
    let passwordExpiresAt = null;
    const linked = Array.isArray(data.linkedProviders) ? [...data.linkedProviders] : [];

    if (data.password) {
      hashedPassword = await bcrypt.hash(data.password, 12);
      hasPassword = true;
      passwordChangedAt = now;
      passwordExpiresAt = addTwoMonths(now);
      if (!linked.includes('local')) linked.push('local');
    }

    if (data.authProvider && !linked.includes(data.authProvider)) {
      linked.push(data.authProvider);
    }

    const { rows } = await query(
      `INSERT INTO users (
        name, email, password, has_password, password_changed_at, password_expires_at,
        phone, role, department_id, avatar, google_id, auth_provider, linked_providers,
        is_verified, is_active, address
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13::jsonb,$14,$15,$16::jsonb)
      RETURNING *`,
      [
        data.name,
        data.email.trim().toLowerCase(),
        hashedPassword,
        hasPassword,
        passwordChangedAt,
        passwordExpiresAt,
        data.phone || null,
        data.role || 'user',
        data.department || null,
        data.avatar || '',
        data.googleId || null,
        data.authProvider || 'local',
        JSON.stringify(linked),
        Boolean(data.isVerified),
        data.isActive !== false,
        JSON.stringify(data.address || {}),
      ]
    );
    return this.findById(rows[0].id);
  },

  async save(user) {
    const { rows } = await query(
      `UPDATE users SET
        name = $1,
        email = $2,
        password = $3,
        has_password = $4,
        password_changed_at = $5,
        password_expires_at = $6,
        phone = $7,
        role = $8,
        department_id = $9,
        avatar = $10,
        google_id = $11,
        auth_provider = $12,
        linked_providers = $13::jsonb,
        is_verified = $14,
        is_active = $15,
        address = $16::jsonb,
        email_verification_token = $17,
        email_verification_expire = $18,
        reset_password_token = $19,
        reset_password_expire = $20,
        last_login = $21,
        login_otp = $22,
        login_otp_expire = $23,
        login_count = $24,
        updated_at = NOW()
      WHERE id = $25
      RETURNING *`,
      [
        user.name,
        user.email.trim().toLowerCase(),
        user.password || null,
        Boolean(user.hasPassword),
        user.passwordChangedAt || null,
        user.passwordExpiresAt || null,
        user.phone || null,
        user.role || 'user',
        user.departmentId || (typeof user.department === 'string' ? user.department : user.department?.id) || null,
        user.avatar || '',
        user.googleId || null,
        user.authProvider || 'local',
        JSON.stringify(user.linkedProviders || []),
        Boolean(user.isVerified),
        user.isActive !== false,
        JSON.stringify(user.address || {}),
        user.emailVerificationToken || null,
        user.emailVerificationExpire || null,
        user.resetPasswordToken || null,
        user.resetPasswordExpire || null,
        user.lastLogin || null,
        user.loginOtp || null,
        user.loginOtpExpire || null,
        user.loginCount || 0,
        user.id,
      ]
    );
    return this.findById(rows[0].id);
  },

  async setNewPassword(user, plainPassword) {
    const now = new Date();
    user.password = await bcrypt.hash(plainPassword, 12);
    user.hasPassword = true;
    user.passwordChangedAt = now;
    user.passwordExpiresAt = addTwoMonths(now);
    if (!user.linkedProviders.includes('local')) {
      user.linkedProviders.push('local');
    }
    return this.save(user);
  },

  async findAll({ role, isActive, search, page = 1, limit = 20 }) {
    const conditions = [];
    const params = [];
    let i = 1;
    if (role) { conditions.push(`u.role = $${i++}`); params.push(role); }
    if (isActive !== undefined) { conditions.push(`u.is_active = $${i++}`); params.push(isActive === 'true' || isActive === true); }
    if (search) {
      conditions.push(`(u.name ILIKE $${i} OR u.email ILIKE $${i})`);
      params.push(`%${search}%`);
      i++;
    }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const countRes = await query(`SELECT COUNT(*)::int AS total FROM users u ${where}`, params);
    const total = countRes.rows[0].total;

    const offset = (Number(page) - 1) * Number(limit);
    const { rows } = await query(
      `${BASE_SELECT} ${where} ORDER BY u.created_at DESC LIMIT $${i++} OFFSET $${i}`,
      [...params, Number(limit), offset]
    );
    return { users: rows.map(mapRow).map((u) => u.toObject()), total };
  },

  async updateProfile(id, { name, phone, address, avatar }) {
    await query(
      `UPDATE users SET
        name = COALESCE($1, name),
        phone = $2,
        address = COALESCE($3::jsonb, address),
        avatar = COALESCE($4, avatar),
        updated_at = NOW()
      WHERE id = $5`,
      [name, phone || null, address ? JSON.stringify(address) : null, avatar, id]
    );
    return this.findById(id);
  },

  async adminUpdate(id, { role, department, isActive }) {
    const fields = [];
    const params = [];
    let i = 1;
    if (role !== undefined) { fields.push(`role = $${i++}`); params.push(role); }
    if (department !== undefined) { fields.push(`department_id = $${i++}`); params.push(department || null); }
    if (isActive !== undefined) { fields.push(`is_active = $${i++}`); params.push(Boolean(isActive)); }
    if (fields.length) {
      fields.push('updated_at = NOW()');
      params.push(id);
      await query(`UPDATE users SET ${fields.join(', ')} WHERE id = $${i}`, params);
    }
    return this.findById(id);
  },

  async deleteById(id) {
    await query('DELETE FROM users WHERE id = $1', [id]);
  },

  async findByRole(role) {
    const { rows } = await query(`${BASE_SELECT} WHERE u.role = $1 AND u.is_active = TRUE`, [role]);
    return rows.map(mapRow);
  },

  async findOfficersByDepartment(departmentId) {
    const { rows } = await query(
      `SELECT id, id AS "_id", name, email, phone, avatar FROM users WHERE department_id = $1 AND role = 'officer' AND is_active = TRUE`,
      [departmentId]
    );
    return rows;
  },

  async getStats() {
    const totalRes = await query('SELECT COUNT(*)::int AS total FROM users');
    const byRoleRes = await query('SELECT role AS "_id", COUNT(*)::int AS count FROM users GROUP BY role');
    const activeRes = await query('SELECT COUNT(*)::int AS active FROM users WHERE is_active = TRUE');
    const monthRes = await query(
      `SELECT COUNT(*)::int AS cnt FROM users WHERE created_at >= date_trunc('month', NOW())`
    );
    return {
      total: totalRes.rows[0].total,
      byRole: byRoleRes.rows,
      active: activeRes.rows[0].active,
      newThisMonth: monthRes.rows[0].cnt,
    };
  },
};

module.exports = User;
