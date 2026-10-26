import Database from 'better-sqlite3';

const db = new Database('telemed-aura.db');
db.pragma('journal_mode = WAL');
db.exec(`
  CREATE TABLE IF NOT EXISTS appointments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_name TEXT NOT NULL,
    email TEXT NOT NULL,
    specialty TEXT NOT NULL,
    doctor TEXT NOT NULL,
    appointment_date TEXT NOT NULL,
    appointment_time TEXT NOT NULL,
    reason TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Scheduled',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
`);

const count = db.prepare('SELECT COUNT(*) AS count FROM appointments').get() as { count: number };
if (count.count === 0) {
  const seed = db.prepare(`INSERT INTO appointments
    (patient_name,email,specialty,doctor,appointment_date,appointment_time,reason,status)
    VALUES (?,?,?,?,?,?,?,?)`);
  seed.run('Aarav Patel', 'aarav@example.com', 'General Medicine', 'Dr. Maya Shah', '2026-11-02', '09:30', 'Recurring headaches', 'Confirmed');
  seed.run('Neha Kulkarni', 'neha@example.com', 'Cardiology', 'Dr. Rohan Mehta', '2026-11-03', '11:00', 'Routine heart health check', 'Scheduled');
}

export default db;
