-- =====================================================
-- Pickleball Court Reservation System - Initial Schema
-- =====================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- USERS (Admin/Staff accounts)
-- =====================================================
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('super_admin', 'admin', 'staff')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- COURTS
-- =====================================================
CREATE TABLE courts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('indoor', 'outdoor')),
  price_per_hour NUMERIC(10,2) NOT NULL,
  image_url TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'maintenance', 'disabled')),
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- CUSTOMERS (Guest customers from reservations)
-- =====================================================
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX idx_customers_email_phone ON customers (lower(email), phone);

-- =====================================================
-- RESERVATIONS
-- =====================================================
CREATE TABLE reservations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reservation_number TEXT UNIQUE NOT NULL,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  court_id UUID NOT NULL REFERENCES courts(id) ON DELETE RESTRICT,
  reservation_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  duration INTEGER NOT NULL,
  total_amount NUMERIC(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'checked_in', 'completed', 'cancelled', 'no_show')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_reservations_date_court ON reservations (reservation_date, court_id);
CREATE INDEX idx_reservations_number ON reservations (reservation_number);
CREATE INDEX idx_reservations_customer ON reservations (customer_id);
CREATE INDEX idx_reservations_status ON reservations (status);
CREATE INDEX idx_reservations_date ON reservations (reservation_date);

-- =====================================================
-- PAYMENTS
-- =====================================================
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reservation_id UUID NOT NULL REFERENCES reservations(id) ON DELETE RESTRICT,
  amount NUMERIC(10,2) NOT NULL,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('gcash', 'gotyme', 'cash', 'card')),
  transaction_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed', 'cancelled', 'refunded')),
  paid_at TIMESTAMPTZ,
  refund_amount NUMERIC(10,2) DEFAULT 0,
  refund_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_payments_reservation ON payments (reservation_id);
CREATE INDEX idx_payments_status ON payments (status);

-- =====================================================
-- COURT BLOCKS (Maintenance/Blocked periods)
-- =====================================================
CREATE TABLE court_blocks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  court_id UUID NOT NULL REFERENCES courts(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  reason TEXT NOT NULL DEFAULT 'Maintenance',
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_court_blocks_court_date ON court_blocks (court_id, date);

-- =====================================================
-- SETTINGS (Key-value configuration)
-- =====================================================
CREATE TABLE settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- NOTIFICATIONS
-- =====================================================
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reservation_id UUID REFERENCES reservations(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('booking_confirmed', 'booking_cancelled', 'payment_received', 'reminder')),
  recipient TEXT NOT NULL,
  subject TEXT,
  body TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_notifications_reservation ON notifications (reservation_id);

-- =====================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE courts ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE court_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Public read access for courts (customers need to see available courts)
CREATE POLICY "Courts are viewable by everyone"
  ON courts FOR SELECT
  USING (true);

-- Settings are viewable by everyone
CREATE POLICY "Settings are viewable by everyone"
  ON settings FOR SELECT
  USING (true);

-- Reservations: anyone can read by reservation_number (for lookup)
CREATE POLICY "Reservations viewable for lookup"
  ON reservations FOR SELECT
  USING (true);

-- Payments readable for reservation lookup
CREATE POLICY "Payments viewable for reservation lookup"
  ON payments FOR SELECT
  USING (true);

-- Customers: readable for reservation lookup
CREATE POLICY "Customers viewable for reservation lookup"
  ON customers FOR SELECT
  USING (true);

-- Court blocks readable
CREATE POLICY "Court blocks viewable by everyone"
  ON court_blocks FOR SELECT
  USING (true);

-- Authenticated admin users can do everything
CREATE POLICY "Admins full access to users"
  ON users FOR ALL
  USING (auth.uid() IN (SELECT id FROM users));

CREATE POLICY "Admins full access to courts"
  ON courts FOR ALL
  USING (auth.uid() IN (SELECT id FROM users));

CREATE POLICY "Admins full access to customers"
  ON customers FOR ALL
  USING (auth.uid() IN (SELECT id FROM users));

CREATE POLICY "Admins full access to reservations"
  ON reservations FOR ALL
  USING (auth.uid() IN (SELECT id FROM users));

CREATE POLICY "Admins full access to payments"
  ON payments FOR ALL
  USING (auth.uid() IN (SELECT id FROM users));

CREATE POLICY "Admins full access to court_blocks"
  ON court_blocks FOR ALL
  USING (auth.uid() IN (SELECT id FROM users));

CREATE POLICY "Admins full access to settings"
  ON settings FOR ALL
  USING (auth.uid() IN (SELECT id FROM users));

CREATE POLICY "Admins full access to notifications"
  ON notifications FOR ALL
  USING (auth.uid() IN (SELECT id FROM users));

-- Allow anonymous inserts for reservations and customers (booking flow)
CREATE POLICY "Anyone can create customers"
  ON customers FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can create reservations"
  ON reservations FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can create payments"
  ON payments FOR INSERT
  WITH CHECK (true);
