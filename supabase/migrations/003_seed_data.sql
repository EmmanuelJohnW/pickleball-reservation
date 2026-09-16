-- =====================================================
-- Seed Data
-- =====================================================

-- Insert default settings
INSERT INTO settings (key, value) VALUES
('facility', '{"name": "Court ni Wardo", "address": "123 Sports Avenue, Lapu-Lapu City, Philippines", "phone": "+63 912 345 6789", "email": "info@picklezone.ph"}'),
('operating_hours', '{
  "monday": {"open": "08:00", "close": "22:00"},
  "tuesday": {"open": "08:00", "close": "22:00"},
  "wednesday": {"open": "08:00", "close": "22:00"},
  "thursday": {"open": "08:00", "close": "22:00"},
  "friday": {"open": "08:00", "close": "22:00"},
  "saturday": {"open": "08:00", "close": "22:00"},
  "sunday": {"open": "08:00", "close": "22:00"}
}'),
('booking', '{
  "min_duration": 60,
  "max_duration": 180,
  "cancellation_hours": 24,
  "advance_days": 1826,
  "date_range_start": "2026-01-01",
  "date_range_end": "2030-12-31"
}');

-- Insert sample courts
INSERT INTO courts (name, description, type, price_per_hour, status, sort_order) VALUES
('Court 1', 'Premium indoor court with professional lighting', 'indoor', 350, 'active', 1),
('Court 2', 'Indoor court with spectator seating', 'indoor', 350, 'active', 2),
('Court 3', 'Outdoor court with shade cover', 'outdoor', 300, 'active', 3),
('Court 4', 'Outdoor court with windscreens', 'outdoor', 300, 'active', 4),
('Court 5', 'Premium indoor court with AC', 'indoor', 400, 'active', 5),
('Court 6', 'Outdoor court with night lighting', 'outdoor', 320, 'active', 6);
