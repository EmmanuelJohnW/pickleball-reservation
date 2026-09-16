-- =====================================================
-- Double Booking Protection
-- =====================================================

-- Function to check for overlapping reservations
CREATE OR REPLACE FUNCTION check_reservation_overlap()
RETURNS TRIGGER AS $$
BEGIN
  -- Check for overlapping reservations on same court/date
  IF EXISTS (
    SELECT 1 FROM reservations
    WHERE court_id = NEW.court_id
      AND reservation_date = NEW.reservation_date
      AND status NOT IN ('cancelled')
      AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
      AND start_time < NEW.end_time
      AND end_time > NEW.start_time
  ) THEN
    RAISE EXCEPTION 'Time slot is no longer available. Another reservation was made for this court.';
  END IF;

  -- Check for overlapping court blocks
  IF EXISTS (
    SELECT 1 FROM court_blocks
    WHERE court_id = NEW.court_id
      AND date = NEW.reservation_date
      AND start_time < NEW.end_time
      AND end_time > NEW.start_time
  ) THEN
    RAISE EXCEPTION 'This court is blocked for maintenance during this time.';
  END IF;

  -- Check court is active
  IF EXISTS (
    SELECT 1 FROM courts
    WHERE id = NEW.court_id AND status != 'active'
  ) THEN
    RAISE EXCEPTION 'This court is not available for booking.';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger on reservations
DROP TRIGGER IF EXISTS trg_check_reservation_overlap ON reservations;
CREATE TRIGGER trg_check_reservation_overlap
  BEFORE INSERT OR UPDATE ON reservations
  FOR EACH ROW
  EXECUTE FUNCTION check_reservation_overlap();

-- Function to generate reservation number
CREATE OR REPLACE FUNCTION generate_reservation_number()
RETURNS TRIGGER AS $$
DECLARE
  next_seq INTEGER;
BEGIN
  SELECT COUNT(*) + 1 INTO next_seq
  FROM reservations
  WHERE reservation_date = NEW.reservation_date;

  NEW.reservation_number := 'PB-' || TO_CHAR(NEW.reservation_date, 'YYYYMMDD') || '-' || LPAD(next_seq::TEXT, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_generate_reservation_number ON reservations;
CREATE TRIGGER trg_generate_reservation_number
  BEFORE INSERT ON reservations
  FOR EACH ROW
  EXECUTE FUNCTION generate_reservation_number();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_courts_updated_at BEFORE UPDATE ON courts FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_reservations_updated_at BEFORE UPDATE ON reservations FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_payments_updated_at BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_settings_updated_at BEFORE UPDATE ON settings FOR EACH ROW EXECUTE FUNCTION update_updated_at();
