const { Pool } = require('pg');

const getPoolConfig = () => {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is not defined. Please add your Neon or Supabase PostgreSQL connection string to backend/.env.');
  }

  const isLocal =
    connectionString.includes('localhost') ||
    connectionString.includes('127.0.0.1');

  const needsSsl =
    !isLocal &&
    (process.env.NODE_ENV === 'production' ||
      connectionString.includes('sslmode=') ||
      connectionString.includes('neon.tech') ||
      connectionString.includes('supabase.'));

  return {
    connectionString,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
    ...(needsSsl ? { ssl: { rejectUnauthorized: false } } : {}),
  };
};

let pool = null;

const getPool = () => {
  if (!pool) {
    pool = new Pool(getPoolConfig());
    pool.on('error', (err) => {
      console.error('❌ Unexpected PostgreSQL pool error:', err.message);
    });
  }
  return pool;
};

const query = (text, params = []) => getPool().query(text, params);

const initSchema = async () => {
  await query(`
    CREATE TABLE IF NOT EXISTS departments (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(150) NOT NULL UNIQUE,
      code VARCHAR(30) NOT NULL UNIQUE,
      description TEXT,
      email VARCHAR(255) NOT NULL,
      phone VARCHAR(40),
      head_officer_id UUID,
      is_active BOOLEAN DEFAULT TRUE,
      category VARCHAR(30) DEFAULT 'central',
      resolution_days INTEGER DEFAULT 30,
      icon VARCHAR(50),
      color VARCHAR(30),
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(100) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      password TEXT,
      has_password BOOLEAN DEFAULT FALSE,
      password_changed_at TIMESTAMPTZ,
      password_expires_at TIMESTAMPTZ,
      phone VARCHAR(40),
      role VARCHAR(20) DEFAULT 'user',
      department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
      avatar TEXT DEFAULT '',
      google_id VARCHAR(255),
      auth_provider VARCHAR(20) DEFAULT 'local',
      linked_providers JSONB DEFAULT '[]'::jsonb,
      is_verified BOOLEAN DEFAULT FALSE,
      is_active BOOLEAN DEFAULT TRUE,
      address JSONB DEFAULT '{}'::jsonb,
      aadhaar_number VARCHAR(30),
      email_verification_token VARCHAR(255),
      email_verification_expire TIMESTAMPTZ,
      reset_password_token VARCHAR(255),
      reset_password_expire TIMESTAMPTZ,
      last_login TIMESTAMPTZ,
      login_otp VARCHAR(255),
      login_otp_expire TIMESTAMPTZ,
      login_count INTEGER DEFAULT 0,
      fcm_token TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);
    CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

    CREATE TABLE IF NOT EXISTS complaints (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      complaint_number VARCHAR(50) NOT NULL UNIQUE,
      title VARCHAR(200) NOT NULL,
      description TEXT NOT NULL,
      category VARCHAR(80) NOT NULL,
      sub_category VARCHAR(80),
      priority VARCHAR(20) DEFAULT 'medium',
      status VARCHAR(30) DEFAULT 'pending',
      complainant_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      department_id UUID NOT NULL REFERENCES departments(id) ON DELETE RESTRICT,
      assigned_officer_id UUID REFERENCES users(id) ON DELETE SET NULL,
      attachments JSONB DEFAULT '[]'::jsonb,
      timeline JSONB DEFAULT '[]'::jsonb,
      location JSONB DEFAULT '{}'::jsonb,
      resolution_note TEXT,
      rejection_reason TEXT,
      escalated BOOLEAN DEFAULT FALSE,
      escalated_at TIMESTAMPTZ,
      escalated_to_id UUID REFERENCES users(id) ON DELETE SET NULL,
      due_date TIMESTAMPTZ,
      resolved_at TIMESTAMPTZ,
      closed_at TIMESTAMPTZ,
      feedback JSONB,
      is_anonymous BOOLEAN DEFAULT FALSE,
      is_public BOOLEAN DEFAULT FALSE,
      views INTEGER DEFAULT 0,
      tags JSONB DEFAULT '[]'::jsonb,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_complaints_complainant ON complaints(complainant_id, status);
    CREATE INDEX IF NOT EXISTS idx_complaints_department ON complaints(department_id, status);
    CREATE INDEX IF NOT EXISTS idx_complaints_number ON complaints(complaint_number);
    CREATE INDEX IF NOT EXISTS idx_complaints_created ON complaints(created_at DESC);

    CREATE TABLE IF NOT EXISTS deliveries (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      order_number VARCHAR(50) NOT NULL UNIQUE,
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      service_type VARCHAR(50) NOT NULL,
      items JSONB DEFAULT '[]'::jsonb,
      total_amount NUMERIC(10, 2) DEFAULT 0,
      delivery_address JSONB NOT NULL,
      status VARCHAR(30) DEFAULT 'requested',
      tracking_id VARCHAR(100),
      assigned_agent JSONB,
      department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
      priority VARCHAR(20) DEFAULT 'normal',
      special_instructions TEXT,
      estimated_delivery TIMESTAMPTZ,
      delivered_at TIMESTAMPTZ,
      proof_of_delivery JSONB,
      timeline JSONB DEFAULT '[]'::jsonb,
      rating JSONB,
      payment_status VARCHAR(20) DEFAULT 'free',
      notes TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_deliveries_user ON deliveries(user_id, status);
    CREATE INDEX IF NOT EXISTS idx_deliveries_order ON deliveries(order_number);

    CREATE TABLE IF NOT EXISTS notifications (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title VARCHAR(255) NOT NULL,
      message TEXT NOT NULL,
      type VARCHAR(40) DEFAULT 'system',
      related_to JSONB,
      is_read BOOLEAN DEFAULT FALSE,
      read_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read);
    CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);

    CREATE TABLE IF NOT EXISTS settings (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      key VARCHAR(100) NOT NULL UNIQUE,
      value JSONB,
      description TEXT,
      category VARCHAR(40) DEFAULT 'general',
      is_public BOOLEAN DEFAULT FALSE,
      updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS grievance_centers (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(255) NOT NULL,
      code VARCHAR(50) NOT NULL UNIQUE,
      type VARCHAR(30) DEFAULT 'district',
      department_name VARCHAR(255) NOT NULL,
      address JSONB DEFAULT '{}'::jsonb,
      lat DOUBLE PRECISION NOT NULL,
      lng DOUBLE PRECISION NOT NULL,
      phone VARCHAR(60),
      email VARCHAR(255),
      working_days VARCHAR(60) DEFAULT 'Mon - Fri',
      open_hour DOUBLE PRECISION DEFAULT 9.5,
      close_hour DOUBLE PRECISION DEFAULT 17.5,
      services JSONB DEFAULT '[]'::jsonb,
      facilities JSONB DEFAULT '{}'::jsonb,
      languages JSONB DEFAULT '["English", "Hindi"]'::jsonb,
      nearest_transit VARCHAR(255),
      crowd_level VARCHAR(20) DEFAULT 'moderate',
      avg_wait_minutes INTEGER DEFAULT 15,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);
};

const connectDB = async () => {
  await query('SELECT 1');
  await initSchema();
  console.log('✅ PostgreSQL Connected & Schema Verified (Neon/Supabase Compatible)');
};

module.exports = { connectDB, getPool, query, initSchema };
