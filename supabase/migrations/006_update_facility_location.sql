-- =====================================================
-- Update facility location to Lapu-Lapu City
-- =====================================================

INSERT INTO settings (key, value) VALUES
('facility', '{"name": "Court ni Wardo", "address": "123 Sports Avenue, Lapu-Lapu City, Philippines", "phone": "+63 912 345 6789", "email": "info@picklezone.ph"}')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();