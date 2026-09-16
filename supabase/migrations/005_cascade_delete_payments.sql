-- Drop and recreate the foreign key with ON DELETE CASCADE
ALTER TABLE payments
  DROP CONSTRAINT IF EXISTS payments_reservation_id_fkey;

ALTER TABLE payments
  ADD CONSTRAINT payments_reservation_id_fkey
  FOREIGN KEY (reservation_id)
  REFERENCES reservations(id)
  ON DELETE CASCADE;
