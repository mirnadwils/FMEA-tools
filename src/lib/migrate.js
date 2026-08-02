import { query } from './db';

/**
 * Run all migration SQL statements to create the database schema.
 * Safe to run multiple times — uses IF NOT EXISTS.
 * Includes both legacy tables (archival) and new authenticated schema.
 */
export async function runMigrations() {
  const statements = [
    // -----------------------------------------------------------------------
    // LEGACY TABLES (kept for archival — not used by new code)
    // -----------------------------------------------------------------------
    `CREATE TABLE IF NOT EXISTS sessions (
      id SERIAL PRIMARY KEY,
      code VARCHAR(6) UNIQUE NOT NULL,
      name TEXT NOT NULL,
      facilitator TEXT,
      status VARCHAR(20) DEFAULT 'active',
      template_version VARCHAR(50) DEFAULT 'merdeka-v1',
      created_at TIMESTAMPTZ DEFAULT NOW()
    )`,

    `CREATE TABLE IF NOT EXISTS failure_modes (
      id SERIAL PRIMARY KEY,
      session_id INTEGER REFERENCES sessions(id) ON DELETE CASCADE,
      fm_no TEXT NOT NULL,
      category TEXT,
      title TEXT,
      mechanism TEXT,
      initiation TEXT,
      continuation TEXT,
      progression TEXT,
      detection_monitoring TEXT,
      intervention TEXT,
      effect TEXT,
      notes TEXT,
      owner_action TEXT,
      UNIQUE(session_id, fm_no)
    )`,

    `CREATE TABLE IF NOT EXISTS fm_status (
      id SERIAL PRIMARY KEY,
      session_id INTEGER REFERENCES sessions(id) ON DELETE CASCADE,
      fm_no TEXT NOT NULL,
      status VARCHAR(20) DEFAULT 'locked',
      UNIQUE(session_id, fm_no)
    )`,

    // Legacy participants table — kept for archival
    `CREATE TABLE IF NOT EXISTS participants (
      id SERIAL PRIMARY KEY,
      session_id INTEGER REFERENCES sessions(id) ON DELETE CASCADE,
      participant_key TEXT NOT NULL,
      role TEXT NOT NULL,
      experience TEXT DEFAULT 'beginner',
      name TEXT,
      joined_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(session_id, participant_key)
    )`,

    // Legacy votes table — kept for archival
    `CREATE TABLE IF NOT EXISTS votes (
      id SERIAL PRIMARY KEY,
      session_id INTEGER REFERENCES sessions(id) ON DELETE CASCADE,
      participant_id INTEGER REFERENCES participants(id) ON DELETE CASCADE,
      fm_no TEXT NOT NULL,
      likelihood INTEGER NOT NULL CHECK (likelihood BETWEEN 1 AND 5),
      severity INTEGER NOT NULL CHECK (severity BETWEEN 1 AND 5),
      detection INTEGER NOT NULL CHECK (detection BETWEEN 1 AND 4),
      voted_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(participant_id, fm_no)
    )`,

    // -----------------------------------------------------------------------
    // NEW AUTHENTICATED SCHEMA
    // -----------------------------------------------------------------------

    // Users — synced from Clerk
    `CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      clerk_user_id TEXT UNIQUE NOT NULL,
      email TEXT NOT NULL,
      display_name TEXT NOT NULL,
      preferred_language VARCHAR(5) DEFAULT 'id',
      app_role VARCHAR(20) DEFAULT 'participant',
      professional_role_key TEXT,
      experience_level VARCHAR(20),
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )`,

    // Professional roles — seeded from spec
    `CREATE TABLE IF NOT EXISTS professional_roles (
      id SERIAL PRIMARY KEY,
      key TEXT UNIQUE NOT NULL,
      label_en TEXT NOT NULL,
      label_id TEXT NOT NULL,
      is_default BOOLEAN DEFAULT true,
      session_id INTEGER REFERENCES sessions(id) ON DELETE CASCADE
    )`,

    // Session members — Clerk-authenticated participants
    `CREATE TABLE IF NOT EXISTS session_members (
      id SERIAL PRIMARY KEY,
      session_id INTEGER REFERENCES sessions(id) ON DELETE CASCADE,
      clerk_user_id TEXT NOT NULL,
      professional_role_key TEXT,
      custom_role_text TEXT,
      experience_level VARCHAR(20) DEFAULT 'beginner',
      membership_status VARCHAR(20) DEFAULT 'active',
      joined_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(session_id, clerk_user_id)
    )`,

    // Assessment drafts — per member per FM
    `CREATE TABLE IF NOT EXISTS assessment_drafts (
      id SERIAL PRIMARY KEY,
      member_id INTEGER REFERENCES session_members(id) ON DELETE CASCADE,
      fm_no TEXT NOT NULL,
      risk_likelihood INTEGER CHECK (risk_likelihood BETWEEN 1 AND 5),
      negative_consequence INTEGER CHECK (negative_consequence BETWEEN 1 AND 5),
      opp_likelihood INTEGER CHECK (opp_likelihood BETWEEN 1 AND 5),
      positive_consequence INTEGER CHECK (positive_consequence BETWEEN 1 AND 5),
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(member_id, fm_no)
    )`,

    // Assessment submissions — immutable snapshot
    `CREATE TABLE IF NOT EXISTS assessment_submissions (
      id SERIAL PRIMARY KEY,
      member_id INTEGER REFERENCES session_members(id) ON DELETE CASCADE UNIQUE,
      template_version VARCHAR(50) NOT NULL,
      snapshot JSONB NOT NULL,
      submitted_at TIMESTAMPTZ DEFAULT NOW()
    )`,

    // Assessment reopens — audit trail for facilitator reopens
    `CREATE TABLE IF NOT EXISTS assessment_reopens (
      id SERIAL PRIMARY KEY,
      submission_id INTEGER NOT NULL,
      facilitator_user_id TEXT NOT NULL,
      reason TEXT NOT NULL,
      reopened_at TIMESTAMPTZ DEFAULT NOW()
    )`,

    // Session documents — bypass justification PDF
    `CREATE TABLE IF NOT EXISTS session_documents (
      id SERIAL PRIMARY KEY,
      session_id INTEGER REFERENCES sessions(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      storage_key TEXT NOT NULL,
      file_size INTEGER,
      mime_type VARCHAR(100) DEFAULT 'application/pdf',
      version INTEGER DEFAULT 1,
      uploader_user_id TEXT,
      is_active BOOLEAN DEFAULT true,
      uploaded_at TIMESTAMPTZ DEFAULT NOW()
    )`,

    // Audit logs
    `CREATE TABLE IF NOT EXISTS audit_logs (
      id SERIAL PRIMARY KEY,
      actor_user_id TEXT,
      session_id INTEGER REFERENCES sessions(id) ON DELETE SET NULL,
      action TEXT NOT NULL,
      entity_type TEXT,
      entity_id TEXT,
      metadata JSONB,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )`,
  ];

  const alters = [
    `ALTER TABLE participants ADD COLUMN IF NOT EXISTS experience TEXT DEFAULT 'beginner'`,
    `ALTER TABLE sessions ADD COLUMN IF NOT EXISTS template_version VARCHAR(50) DEFAULT 'merdeka-v1'`,

    // -----------------------------------------------------------------------
    // RISK-ONLY MIGRATION — Archive opportunity columns (rename, not drop)
    // -----------------------------------------------------------------------
    `DO $$ BEGIN
       IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='assessment_drafts' AND column_name='opp_likelihood') THEN
         ALTER TABLE assessment_drafts RENAME COLUMN opp_likelihood TO _legacy_opp_likelihood;
       END IF;
     END $$`,
    `DO $$ BEGIN
       IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='assessment_drafts' AND column_name='positive_consequence') THEN
         ALTER TABLE assessment_drafts RENAME COLUMN positive_consequence TO _legacy_positive_consequence;
       END IF;
     END $$`,

    // -----------------------------------------------------------------------
    // BILINGUAL TRANSLATION TABLE
    // -----------------------------------------------------------------------
    `CREATE TABLE IF NOT EXISTS failure_mode_translations (
       id SERIAL PRIMARY KEY,
       failure_mode_id INTEGER REFERENCES failure_modes(id) ON DELETE CASCADE,
       field_name TEXT NOT NULL,
       source_lang VARCHAR(5) NOT NULL,
       source_text TEXT NOT NULL,
       text_id TEXT,
       text_en TEXT,
       translation_status VARCHAR(20) DEFAULT 'pending',
       translation_provider TEXT,
       translated_at TIMESTAMPTZ,
       UNIQUE(failure_mode_id, field_name)
     )`,
  ];

  const results = [];
  for (const sql of statements) {
    await query(sql);
    const match = sql.match(/CREATE TABLE IF NOT EXISTS (\w+)/);
    results.push(match ? match[1] : 'unknown');
  }

  for (const sql of alters) {
    try {
      await query(sql);
      results.push('alter OK');
    } catch (e) {
      console.error('Alter table failed:', e.message);
    }
  }

  // Seed professional roles
  await seedProfessionalRoles();

  return results;
}

/**
 * Seed professional roles from the design spec.
 */
async function seedProfessionalRoles() {
  const roles = [
    { key: 'owner', en: 'Owner / Asset Owner', id: 'Pemilik / Pemilik Aset' },
    { key: 'owners_engineer', en: "Owner's Engineer", id: 'Insinyur Pemilik' },
    { key: 'eor', en: 'Engineer of Record', id: 'Engineer of Record' },
    { key: 'dam_engineer', en: 'Dam Engineer', id: 'Insinyur Bendungan' },
    { key: 'geotech', en: 'Geotechnical Engineer', id: 'Insinyur Geoteknik' },
    { key: 'geologist', en: 'Geological Engineer / Engineering Geologist', id: 'Insinyur Geologi / Geolog Teknik' },
    { key: 'structural', en: 'Structural Engineer', id: 'Insinyur Struktur' },
    { key: 'hydraulic', en: 'Hydraulic / Hydrology Engineer', id: 'Insinyur Hidraulik / Hidrologi' },
    { key: 'seismic', en: 'Seismic Engineer', id: 'Insinyur Seismik' },
    { key: 'instrumentation', en: 'Instrumentation Engineer', id: 'Insinyur Instrumentasi' },
    { key: 'operations', en: 'Operations & Maintenance', id: 'Operasi & Pemeliharaan' },
    { key: 'construction', en: 'Construction Engineer', id: 'Insinyur Konstruksi' },
    { key: 'environmental', en: 'Environmental & Social Specialist', id: 'Spesialis Lingkungan & Sosial' },
    { key: 'emergency', en: 'Emergency Preparedness / Dam Safety', id: 'Kesiapsiagaan Darurat / Keselamatan Bendungan' },
    { key: 'itrb', en: 'ITRB', id: 'ITRB' },
    { key: 'regulator', en: 'Regulator / Government', id: 'Regulator / Pemerintah' },
    { key: 'risk_hse', en: 'Risk / HSE', id: 'Risiko / HSE' },
    { key: 'facilitator_role', en: 'Facilitator', id: 'Fasilitator' },
    { key: 'observer', en: 'Observer', id: 'Pengamat' },
    { key: 'other', en: 'Other / Lainnya', id: 'Lainnya' },
  ];

  for (const role of roles) {
    try {
      await query(
        `INSERT INTO professional_roles (key, label_en, label_id, is_default)
         VALUES ($1, $2, $3, true)
         ON CONFLICT (key) DO NOTHING`,
        [role.key, role.en, role.id]
      );
    } catch (e) {
      // Ignore duplicate errors
    }
  }
}
