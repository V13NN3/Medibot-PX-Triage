-- Medibot-PX-Triage: Additional database tables
-- Run this in Supabase SQL Editor

-- Link Supabase Auth users to doctors
DROP TABLE IF EXISTS doctor_accounts;
CREATE TABLE doctor_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL,
  doctor_id UUID NOT NULL REFERENCES doctors(id),
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Doctor weekly availability schedule
CREATE TABLE IF NOT EXISTS doctor_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID REFERENCES doctors(id),
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_available BOOLEAN NOT NULL DEFAULT TRUE
);

-- Patient visit records
CREATE TABLE IF NOT EXISTS patient_visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES patients(id),
  doctor_id UUID REFERENCES doctors(id),
  visit_date DATE NOT NULL,
  diagnosis TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Queue tickets (per-patient, per-doctor)
CREATE TABLE IF NOT EXISTS queue_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number INTEGER NOT NULL,
  formatted_number TEXT NOT NULL,
  patient_name TEXT NOT NULL,
  doctor_id UUID REFERENCES doctors(id),
  status TEXT NOT NULL DEFAULT 'waiting',
  queue_date DATE NOT NULL DEFAULT (NOW() AT TIME ZONE 'Asia/Manila')::DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  called_at TIMESTAMPTZ
);

-- Remove now_serving from queue_counter (replaced by queue_tickets)
ALTER TABLE queue_counter DROP COLUMN IF EXISTS now_serving;

-- Lab result file uploads (stores Supabase Storage URL)
CREATE TABLE IF NOT EXISTS lab_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES patients(id),
  doctor_id UUID REFERENCES doctors(id),
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  notes TEXT,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Prescriptions (tied to queue tickets so patients can look them up by number + name)
CREATE TABLE IF NOT EXISTS prescriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID REFERENCES queue_tickets(id),
  formatted_number TEXT NOT NULL,
  patient_name TEXT NOT NULL,
  doctor_id UUID REFERENCES doctors(id),
  medications JSONB NOT NULL DEFAULT '[]',
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
