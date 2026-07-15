import { neon } from '@neondatabase/serverless';

/**
 * Database connection helper using NeonDB serverless HTTP driver.
 * Each call creates a fresh connection via HTTP — ideal for Vercel serverless functions.
 */
function getSQL() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is not set');
  }
  return neon(process.env.DATABASE_URL);
}

/**
 * Execute a parameterized SQL query.
 * @param {string} sqlText - SQL query string with $1, $2 placeholders
 * @param {any[]} params - Array of parameter values
 * @returns {Promise<any[]>} - Array of result rows
 */
export async function query(sqlText, params = []) {
  const sql = getSQL();
  const rows = await sql.query(sqlText, params);
  return rows;
}

export default getSQL;
