import express from 'express';
import cors from 'cors';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import crypto from 'node:crypto';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const dbPath = path.join(root, 'data', 'db.json');
const app = express();
const PORT = process.env.PORT || 4000;
app.use(cors());
app.use(express.json({ limit: '1mb' }));

async function readDb() { return JSON.parse(await fs.readFile(dbPath, 'utf8')); }
async function writeDb(data) { await fs.writeFile(dbPath, JSON.stringify(data, null, 2)); }
const makeId = (prefix) => `${prefix}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

app.get('/api/health', (_req, res) => res.json({ ok: true, service: 'Telemed Aura API', timestamp: new Date().toISOString() }));
app.get('/api/dashboard', async (_req, res, next) => {
  try {
    const db = await readDb();
    const appointments = db.appointments;
    res.json({
      stats: [
        { label: 'Total patients', value: db.patients.length, change: '+12.8%', tone: 'violet' },
        { label: 'Appointments', value: appointments.filter(a => a.status !== 'Cancelled').length, change: '+8.2%', tone: 'blue' },
        { label: 'Available doctors', value: db.doctors.filter(d => d.availability === 'Available').length, change: 'Live status', tone: 'green' },
        { label: 'Pending reviews', value: appointments.filter(a => a.status === 'Pending').length, change: 'Needs attention', tone: 'orange' }
      ],
      appointments: appointments.slice(0, 6), doctors: db.doctors, activity: db.activity
    });
  } catch (e) { next(e); }
});
app.get('/api/appointments', async (req, res, next) => {
  try {
    const db = await readDb();
    let items = db.appointments;
    if (req.query.status && req.query.status !== 'All') items = items.filter(a => a.status === req.query.status);
    if (req.query.search) { const q = String(req.query.search).toLowerCase(); items = items.filter(a => [a.patient,a.doctor,a.specialty,a.id].some(v => v.toLowerCase().includes(q))); }
    res.json(items);
  } catch (e) { next(e); }
});
app.post('/api/appointments', async (req, res, next) => {
  try {
    const { patient, doctor, specialty, date, time, type, note = '' } = req.body;
    if (![patient, doctor, specialty, date, time, type].every(v => typeof v === 'string' && v.trim())) return res.status(400).json({ error: 'Please complete all required appointment fields.' });
    const db = await readDb();
    const conflict = db.appointments.some(a => a.doctor === doctor && a.date === date && a.time === time && a.status !== 'Cancelled');
    if (conflict) return res.status(409).json({ error: 'This doctor already has an appointment at that time.' });
    const item = { id: makeId('APT'), patient: patient.trim(), doctor, specialty, date, time, type, note: String(note).trim(), status: 'Pending' };
    db.appointments.unshift(item);
    db.activity.unshift({ id: makeId('ACT'), title: 'Appointment requested', detail: `${item.patient} · ${item.specialty}`, time: 'Just now', kind: 'calendar' });
    await writeDb(db);
    res.status(201).json(item);
  } catch (e) { next(e); }
});
app.patch('/api/appointments/:id', async (req, res, next) => {
  try {
    const allowed = ['Pending', 'Confirmed', 'Cancelled', 'Completed'];
    if (!allowed.includes(req.body.status)) return res.status(400).json({ error: 'Invalid appointment status.' });
    const db = await readDb();
    const item = db.appointments.find(a => a.id === req.params.id);
    if (!item) return res.status(404).json({ error: 'Appointment not found.' });
    item.status = req.body.status;
    db.activity.unshift({ id: makeId('ACT'), title: `Appointment ${req.body.status.toLowerCase()}`, detail: `${item.patient} · ${item.specialty}`, time: 'Just now', kind: 'check' });
    await writeDb(db);
    res.json(item);
  } catch (e) { next(e); }
});
app.get('/api/patients', async (req, res, next) => {
  try {
    const db = await readDb(); let items = db.patients;
    if (req.query.search) { const q = String(req.query.search).toLowerCase(); items = items.filter(p => [p.id,p.name,p.email,p.condition].some(v => v.toLowerCase().includes(q))); }
    res.json(items);
  } catch (e) { next(e); }
});
app.post('/api/patients', async (req, res, next) => {
  try {
    const { name, age, gender, email, phone, condition } = req.body;
    if (![name, gender, email, phone, condition].every(v => typeof v === 'string' && v.trim()) || !Number.isFinite(Number(age)) || Number(age) < 0) return res.status(400).json({ error: 'Enter valid patient details.' });
    const db = await readDb();
    const item = { id: makeId('P'), name: name.trim(), age: Number(age), gender, email: email.trim(), phone: phone.trim(), condition: condition.trim(), lastVisit: new Date().toISOString().slice(0,10), status: 'Active' };
    db.patients.unshift(item); await writeDb(db); res.status(201).json(item);
  } catch (e) { next(e); }
});
app.get('/api/doctors', async (_req, res, next) => { try { res.json((await readDb()).doctors); } catch (e) { next(e); } });
app.use((err, _req, res, _next) => { console.error(err); res.status(500).json({ error: 'Something went wrong on the server.' }); });

if (process.env.NODE_ENV === 'production') {
  const dist = path.join(root, 'dist');
  app.use(express.static(dist));
  app.get(/.*/, (_req, res) => res.sendFile(path.join(dist, 'index.html')));
}
app.listen(PORT, () => console.log(`Telemed Aura API running at http://localhost:${PORT}`));
