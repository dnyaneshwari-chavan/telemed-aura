import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { z } from 'zod';
import db from './db.js';

const app = express();
const port = Number(process.env.PORT ?? 4000);
app.use(cors({ origin: process.env.CLIENT_ORIGIN ?? 'http://localhost:5173' }));
app.use(express.json());

const appointmentInput = z.object({
  patientName: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(120),
  specialty: z.enum(['General Medicine', 'Cardiology', 'Dermatology', 'Pediatrics', 'Mental Wellness']),
  doctor: z.string().trim().min(2).max(80),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().regex(/^\d{2}:\d{2}$/),
  reason: z.string().trim().min(5).max(500)
});

app.get('/api/health', (_req, res) => res.json({ status: 'ok', service: 'Telemed Aura API' }));

app.post('/api/appointments', (req, res) => {
  try {
    const parsed = appointmentInput.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        error: 'Please check the appointment details.',
        details: parsed.error.flatten().fieldErrors
      });
    }

    const { patientName, email, specialty, doctor, date, time, reason } = parsed.data;

    const result = db.prepare(`
      INSERT INTO appointments
        (patient_name, email, specialty, doctor, appointment_date, appointment_time, reason)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(patientName, email, specialty, doctor, date, time, reason);

    const appointment = db.prepare(`
      SELECT
        id,
        patient_name AS patientName,
        email,
        specialty,
        doctor,
        appointment_date AS date,
        appointment_time AS time,
        reason,
        status
      FROM appointments
      WHERE id = ?
    `).get(result.lastInsertRowid);

    return res.status(201).json(appointment);
  } catch (error) {
    console.error('Appointment save failed:', error);
    return res.status(500).json({ error: 'Could not save the appointment.' });
  }
});
const triageInput = z.object({ symptoms: z.array(z.string()).min(1).max(12), duration: z.enum(['today', 'few-days', 'week-plus']) });
app.post('/api/triage', (req, res) => {
  const parsed = triageInput.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Choose at least one symptom.' });
  const urgent = new Set(['chest-pain', 'difficulty-breathing', 'fainting', 'severe-bleeding']);
  const { symptoms, duration } = parsed.data;
  const level = symptoms.some((item) => urgent.has(item)) ? 'urgent' : symptoms.length >= 3 || duration === 'week-plus' ? 'soon' : 'routine';
  const guidance = level === 'urgent'
    ? 'Seek emergency medical help now. If you are in immediate danger, contact your local emergency number.'
    : level === 'soon'
      ? 'Consider arranging a clinician consultation soon to discuss your symptoms.'
      : 'Consider booking a routine consultation if symptoms persist or concern you.';
  res.json({ level, guidance, disclaimer: 'This symptom check is educational guidance only. It is not a diagnosis and cannot replace care from a qualified clinician.' });
});

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: 'Something went wrong. Please try again.' });
});

app.listen(port, () => console.log(`Telemed Aura API listening on http://localhost:${port}`));
