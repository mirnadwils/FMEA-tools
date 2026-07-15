import { query } from './db';

/**
 * Run all migration SQL statements to create the database schema.
 * Safe to run multiple times — uses IF NOT EXISTS.
 */
export async function runMigrations() {
  const statements = [
    `CREATE TABLE IF NOT EXISTS sessions (
      id SERIAL PRIMARY KEY,
      code VARCHAR(6) UNIQUE NOT NULL,
      name TEXT NOT NULL,
      facilitator TEXT,
      status VARCHAR(20) DEFAULT 'active',
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

    `CREATE TABLE IF NOT EXISTS participants (
      id SERIAL PRIMARY KEY,
      session_id INTEGER REFERENCES sessions(id) ON DELETE CASCADE,
      participant_key TEXT NOT NULL,
      role TEXT NOT NULL,
      name TEXT,
      joined_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(session_id, participant_key)
    )`,

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
  ];

  const results = [];
  for (const sql of statements) {
    await query(sql);
    // Extract table name for logging
    const match = sql.match(/CREATE TABLE IF NOT EXISTS (\w+)/);
    results.push(match ? match[1] : 'unknown');
  }

  return results;
}
