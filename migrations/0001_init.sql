CREATE TABLE IF NOT EXISTS bookings (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  pet_type TEXT NOT NULL,
  service_type TEXT NOT NULL,
  appointment_date TEXT NOT NULL,
  appointment_time TEXT NOT NULL,
  message TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending',
  admin_note TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS bookings_active_slot_unique
ON bookings (appointment_date, appointment_time)
WHERE status != 'cancelled';

CREATE INDEX IF NOT EXISTS bookings_status_idx
ON bookings (status, created_at DESC);

CREATE INDEX IF NOT EXISTS bookings_date_idx
ON bookings (appointment_date, appointment_time);
