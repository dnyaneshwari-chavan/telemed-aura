import { useEffect, useMemo, useState } from 'react';
import { Activity, ArrowDownRight, ArrowRight, Bell, CalendarDays, Check, ChevronDown, Clock3, FileText, HeartPulse, Home, MapPin, Menu, MessageCircle, Plus, Search, ShieldCheck, Sparkles, Stethoscope, Video, X } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL ?? '';
type Appointment = { id: number; patientName: string; email: string; specialty: string; doctor: string; date: string; time: string; reason: string; status: string };
type Triage = { level: 'urgent' | 'soon' | 'routine'; guidance: string; disclaimer: string };
const doctors = [
  { name: 'Dr. Maya Shah', specialty: 'General Medicine', initials: 'MS', tone: 'mint', rating: '4.9', experience: '12 years' },
  { name: 'Dr. Rohan Mehta', specialty: 'Cardiology', initials: 'RM', tone: 'peach', rating: '4.8', experience: '9 years' },
  { name: 'Dr. Aisha Rao', specialty: 'Dermatology', initials: 'AR', tone: 'lavender', rating: '5.0', experience: '8 years' },
  { name: 'Dr. Kabir Joshi', specialty: 'Pediatrics', initials: 'KJ', tone: 'blue', rating: '4.9', experience: '11 years' },
];
const symptomOptions = [
  ['headache', 'Headache'], ['fever', 'Fever'], ['cough', 'Cough'], ['fatigue', 'Fatigue'],
  ['chest-pain', 'Chest pain'], ['difficulty-breathing', 'Difficulty breathing'], ['fainting', 'Fainting'], ['severe-bleeding', 'Severe bleeding']
];
const fmtDate = (value: string) => new Date(`${value}T12:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

export default function App() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const [toast, setToast] = useState('');
  const [triageOpen, setTriageOpen] = useState(false);
  const [triageResult, setTriageResult] = useState<Triage | null>(null);
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [duration, setDuration] = useState('today');
  const [triageBusy, setTriageBusy] = useState(false);
  const [form, setForm] = useState({ patientName: '', email: '', specialty: 'General Medicine', doctor: 'Dr. Maya Shah', date: '', time: '09:30', reason: '' });

  async function loadAppointments() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/appointments`);
      if (!response.ok) throw new Error();
      setAppointments(await response.json());
    } catch { setToast('Could not connect to the API. Start the app with npm run dev.'); }
    finally { setLoading(false); }
  }
  useEffect(() => { void loadAppointments(); }, []);
  useEffect(() => { if (!toast) return; const timer = window.setTimeout(() => setToast(''), 4200); return () => window.clearTimeout(timer); }, [toast]);

  const upcoming = useMemo(() => appointments.filter((item) => item.date >= new Date().toISOString().slice(0, 10)), [appointments]);
  const nextAppointment = upcoming[0];
  const visibleAppointments = [...appointments].sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`)).slice(0, 4);
  const doctorForForm = doctors.find((doctor) => doctor.specialty === form.specialty)?.name ?? doctors[0].name;

  async function submitAppointment(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      const response = await fetch(`${API_BASE_URL}/api/appointments`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, doctor: doctorForForm }) });
      const data = await response.json();

if (!response.ok) {
  const details = Object.entries(data.details ?? {})
    .map(([field, messages]) => `${field}: ${(messages as string[]).join(', ')}`)
    .join('; ');

  throw new Error(details || data.error || 'Could not save appointment.');
}
      setAppointments((previous) => [...previous, data].sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`)));
      setModal(false); setForm({ patientName: '', email: '', specialty: 'General Medicine', doctor: 'Dr. Maya Shah', date: '', time: '09:30', reason: '' });
      setToast('Appointment booked. Your care team will be in touch.');
    } catch (error) { setToast(error instanceof Error ? error.message : 'Could not save appointment.'); }
  }

  async function checkSymptoms(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setTriageBusy(true); setTriageResult(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/triage`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ symptoms: selectedSymptoms, duration }) });
      const data = await response.json(); if (!response.ok) throw new Error(data.error ?? 'Unable to check symptoms.');
      setTriageResult(data);
    } catch (error) { setToast(error instanceof Error ? error.message : 'Unable to check symptoms.'); }
    finally { setTriageBusy(false); }
  }

  return <div className="app-shell">
    <aside className={`sidebar ${mobileNav ? 'sidebar-open' : ''}`}>
      <a className="brand" href="#home" onClick={() => setMobileNav(false)}><span className="brand-mark"><HeartPulse size={20} strokeWidth={2.4} /></span><span>telemed<span className="brand-light"> aura</span></span></a>
      <div className="workspace-label">YOUR WORKSPACE</div>
      <nav className="main-nav" aria-label="Main navigation">
        <a className="nav-link active" href="#home" onClick={() => setMobileNav(false)}><Home size={18} /> Overview</a>
        <a className="nav-link" href="#appointments" onClick={() => setMobileNav(false)}><CalendarDays size={18} /> Appointments <span className="nav-count">{upcoming.length}</span></a>
        <button className="nav-link" onClick={() => { setTriageOpen(true); setMobileNav(false); }}><Activity size={18} /> Symptom check</button>
        <a className="nav-link" href="#care-team" onClick={() => setMobileNav(false)}><Stethoscope size={18} /> Care team</a>
      </nav>
      <div className="sidebar-bottom">
        <div className="support-card"><div className="support-icon"><MessageCircle size={17} /></div><strong>Need a hand?</strong><p>Our care team is here for you.</p><button onClick={() => setToast('Support is available Monday–Saturday, 8am–8pm.')}>Contact support <ArrowRight size={14} /></button></div>
        <div className="sidebar-profile"><div className="profile-avatar">AP</div><div><strong>Aarav Patel</strong><span>Patient account</span></div><ChevronDown size={16} className="profile-chevron" /></div>
      </div>
    </aside>
    {mobileNav && <button className="mobile-scrim" aria-label="Close menu" onClick={() => setMobileNav(false)} />}
    <main className="main-content" id="home">
      <header className="topbar"><button className="mobile-menu icon-button" onClick={() => setMobileNav(true)} aria-label="Open menu"><Menu size={20} /></button><div className="breadcrumb">Your care <span>/</span> <strong>Overview</strong></div><div className="topbar-right"><div className="secure-label"><ShieldCheck size={15} /> Private & secure</div><button className="icon-button notification" aria-label="Notifications" onClick={() => setToast('You are all caught up.') }><Bell size={18} /><i /></button><div className="topbar-avatar">AP</div></div></header>
      <div className="page-wrap">
        <section className="welcome-row"><div><div className="eyebrow"><span className="eyebrow-dot" /> MONDAY, OCTOBER 26, 2026</div><h1>Good morning, Aarav <span className="wave">✳</span></h1><p className="welcome-copy">A little care goes a long way. Here’s your health at a glance.</p></div><button className="primary-button" onClick={() => setModal(true)}><Plus size={18} /> Book an appointment</button></section>

        <section className="hero-card"><div className="hero-copy"><div className="hero-kicker"><span className="hero-kicker-mark"><Sparkles size={13} /></span> CARE THAT COMES TO YOU</div><h2>Good health starts<br />with a conversation.</h2><p>Talk to a trusted clinician from wherever you are. No long trips, no long waits.</p><button className="hero-button" onClick={() => setModal(true)}>Find your doctor <ArrowRight size={16} /></button><div className="hero-trust"><div className="mini-avatars"><span>MS</span><span>RM</span><span>AR</span><span>+</span></div><span>Care from people who listen</span></div></div><div className="hero-art" aria-hidden="true"><div className="art-orbit orbit-one" /><div className="art-orbit orbit-two" /><div className="art-cross"><span /><i /></div><div className="art-card art-card-top"><span className="art-card-icon"><Video size={15} /></span><span><b>Virtual care</b><small>Wherever you are</small></span><span className="live-dot" /></div><div className="art-person"><div className="person-hair" /><div className="person-face"><i className="eye eye-left" /><i className="eye eye-right" /><i className="smile" /></div><div className="person-neck" /><div className="person-body"><span className="coat-line" /></div></div><div className="art-steth"><span /><i /></div><div className="art-card art-card-bottom"><span className="care-check"><Check size={14} /></span><span><b>You're in good hands</b><small>Compassionate care, always</small></span></div><span className="art-spark spark-one">✳</span><span className="art-spark spark-two">✦</span><span className="art-spark spark-three">✳</span></div></section>

        <section className="stats-grid" aria-label="Care summary"><article className="stat-card"><div className="stat-heading"><span className="stat-icon mint-icon"><CalendarDays size={17} /></span><span>UPCOMING VISITS</span><ArrowDownRight size={15} className="stat-arrow" /></div><div className="stat-value">{upcoming.length.toString().padStart(2, '0')}</div><div className="stat-foot">{nextAppointment ? `Next · ${fmtDate(nextAppointment.date)} at ${nextAppointment.time}` : 'No visits on your calendar'}</div><div className="stat-progress"><span style={{ width: `${Math.min(100, upcoming.length * 24)}%` }} /></div></article>
          <article className="stat-card"><div className="stat-heading"><span className="stat-icon peach-icon"><HeartPulse size={17} /></span><span>CARE CHECK-INS</span><ArrowDownRight size={15} className="stat-arrow" /></div><div className="stat-value">02</div><div className="stat-foot">Your wellbeing matters every day</div><div className="stat-link" onClick={() => setTriageOpen(true)}>Start a symptom check <ArrowRight size={13} /></div></article>
          <article className="stat-card"><div className="stat-heading"><span className="stat-icon lilac-icon"><FileText size={17} /></span><span>HEALTH RECORDS</span><ArrowDownRight size={15} className="stat-arrow" /></div><div className="stat-value">04</div><div className="stat-foot">Your health story, all in one place</div><div className="stat-link" onClick={() => setToast('Health records are coming soon.')}>View records <ArrowRight size={13} /></div></article>
        </section>

        <section className="content-grid"><div className="panel appointments-panel" id="appointments"><div className="panel-header"><div><div className="section-eyebrow">YOUR SCHEDULE</div><h3>Upcoming appointments <span className="small-count">{upcoming.length}</span></h3></div><button className="text-button" onClick={() => setModal(true)}>Book a visit <ArrowRight size={14} /></button></div>
          {loading ? <div className="empty-state">Loading your appointments…</div> : visibleAppointments.length === 0 ? <div className="empty-state">No appointments yet. Book a visit to get started.</div> : <div className="appointment-list">{visibleAppointments.map((item) => { const person = doctors.find((doctor) => doctor.name === item.doctor); return <article className="appointment-row" key={item.id}><div className={`doctor-avatar ${person?.tone ?? 'mint'}`}>{person?.initials ?? 'DR'}</div><div className="appointment-info"><strong>{item.doctor}</strong><span>{item.specialty} <i>·</i> {item.reason}</span></div><div className="appointment-date"><span>{fmtDate(item.date)}</span><small><Clock3 size={12} /> {item.time}</small></div><span className={`status-pill ${item.status.toLowerCase()}`}><i />{item.status}</span><button className="row-arrow" aria-label={`View appointment with ${item.doctor}`} onClick={() => setToast(`${item.specialty} visit with ${item.doctor} · ${fmtDate(item.date)} at ${item.time}`)}><ArrowRight size={16} /></button></article>; })}</div>}
          <button className="panel-footer" onClick={() => setToast('You are viewing all scheduled appointments.')}>View appointment history <ArrowRight size={14} /></button>
        </div>
        <div className="side-stack"><div className="nudge-card"><div className="nudge-decoration">✳</div><div className="nudge-icon"><Activity size={17} /></div><div className="section-eyebrow">A MOMENT FOR YOU</div><h3>How have you<br />been feeling?</h3><p>A quick check-in can help you decide what care feels right.</p><button onClick={() => setTriageOpen(true)}>Check my symptoms <ArrowRight size={14} /></button></div><div className="tip-card"><div className="tip-mark"><Sparkles size={15} /></div><div><strong>A little reminder</strong><p>Small, steady habits make a big difference. Take a moment to stretch and sip some water.</p></div></div></div></section>

        <section className="doctors-section" id="care-team"><div className="panel-header"><div><div className="section-eyebrow">HERE WHEN YOU NEED US</div><h3>Meet your care team</h3></div><button className="text-button" onClick={() => setToast('Showing our featured clinicians.')}>Meet everyone <ArrowRight size={14} /></button></div><div className="doctor-grid">{doctors.map((doctor) => <article className="doctor-card" key={doctor.name}><div className={`doctor-avatar doctor-large ${doctor.tone}`}>{doctor.initials}<span className="online-dot" /></div><div className="doctor-copy"><strong>{doctor.name}</strong><span>{doctor.specialty}</span><small>✦ {doctor.rating} <i>·</i> {doctor.experience}</small></div><button className="doctor-book" aria-label={`Book with ${doctor.name}`} onClick={() => { setForm((previous) => ({ ...previous, specialty: doctor.specialty, doctor: doctor.name })); setModal(true); }}><ArrowRight size={16} /></button></article>)}</div></section>
        <footer className="footer"><span>© 2026 Telemed Aura</span><span><ShieldCheck size={13} /> Your care, with privacy in mind</span><a href="#home">Back to top ↑</a></footer>
      </div>
    </main>

    {modal && <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setModal(false); }}><section className="modal-card" role="dialog" aria-modal="true" aria-labelledby="booking-title"><div className="modal-top"><div><div className="section-eyebrow">YOUR NEXT STEP</div><h2 id="booking-title">Book a visit</h2><p>Choose a clinician and a time that works for you.</p></div><button className="icon-button" onClick={() => setModal(false)} aria-label="Close"><X size={19} /></button></div><form className="booking-form" onSubmit={submitAppointment}><label>Your name<input required minLength={2} maxLength={80} value={form.patientName} onChange={(e) => setForm({ ...form, patientName: e.target.value })} placeholder="e.g. Aarav Patel" /></label><label>Email address<input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" /></label><div className="form-two"><label>Specialty<select value={form.specialty} onChange={(e) => setForm({ ...form, specialty: e.target.value })}>{doctors.map((doctor) => <option key={doctor.specialty}>{doctor.specialty}</option>)}</select></label><label>Clinician<input readOnly value={doctorForForm} /></label></div><div className="form-two"><label>Date<input required type="date" min={new Date().toISOString().slice(0, 10)} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></label><label>Time<select value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })}>{['09:30','10:00','11:00','13:30','14:00','15:30'].map((time) => <option key={time}>{time}</option>)}</select></label></div><label>What would you like to discuss?<textarea required minLength={5} maxLength={500} rows={3} value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} placeholder="Share a little about what brings you in…" /></label><div className="modal-note"><ShieldCheck size={15} /> Your details are only used to arrange this appointment.</div><button className="primary-button modal-submit" type="submit">Confirm appointment <ArrowRight size={16} /></button></form></section></div>}

    {triageOpen && <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) { setTriageOpen(false); setTriageResult(null); } }}><section className="modal-card triage-modal" role="dialog" aria-modal="true" aria-labelledby="triage-title"><div className="modal-top"><div><div className="section-eyebrow">A GENTLE CHECK-IN</div><h2 id="triage-title">How are you feeling?</h2><p>Share what’s going on for you today.</p></div><button className="icon-button" onClick={() => { setTriageOpen(false); setTriageResult(null); }} aria-label="Close"><X size={19} /></button></div>{triageResult ? <div className={`triage-result ${triageResult.level}`}><span className="result-badge">{triageResult.level === 'urgent' ? 'Please seek help now' : triageResult.level === 'soon' ? 'Consider care soon' : 'Routine guidance'}</span><p>{triageResult.guidance}</p><small>{triageResult.disclaimer}</small><button className="primary-button" onClick={() => { setTriageResult(null); setTriageOpen(false); if (triageResult.level !== 'urgent') setModal(true); }}> {triageResult.level === 'urgent' ? 'Close' : 'Book a clinician'} <ArrowRight size={15} /></button></div> : <form className="booking-form triage-form" onSubmit={checkSymptoms}><fieldset><legend>What symptoms are you experiencing?</legend><div className="symptom-grid">{symptomOptions.map(([value, label]) => <label key={value} className={`symptom-choice ${selectedSymptoms.includes(value) ? 'selected' : ''}`}><input type="checkbox" checked={selectedSymptoms.includes(value)} onChange={() => setSelectedSymptoms((current) => current.includes(value) ? current.filter((item) => item !== value) : [...current, value])} /><span className="check-box"><Check size={12} /></span>{label}</label>)}</div></fieldset><label>How long have you felt this way?<select value={duration} onChange={(e) => setDuration(e.target.value)}><option value="today">Started today</option><option value="few-days">A few days</option><option value="week-plus">A week or more</option></select></label><div className="medical-note"><ShieldCheck size={16} /><span>This is general educational guidance, not a medical diagnosis. For severe or life-threatening symptoms, contact local emergency services.</span></div><button disabled={triageBusy || selectedSymptoms.length === 0} className="primary-button modal-submit" type="submit">{triageBusy ? 'Checking…' : 'Get guidance'} <ArrowRight size={16} /></button></form>}</section></div>}
    {toast && <div className="toast"><span className="toast-check"><Check size={14} /></span>{toast}<button aria-label="Dismiss" onClick={() => setToast('')}><X size={15} /></button></div>}
  </div>;
}

