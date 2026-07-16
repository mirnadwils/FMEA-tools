/**
 * Client-side API helper — wraps all fetch() calls to the Next.js API routes.
 * Used by FMEAApp.jsx to replace window.storage operations.
 */

const BASE = '/api';

async function fetchJSON(url, options = {}) {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || `HTTP ${res.status}`);
  }
  return data;
}

// ---- Sessions ----

export async function createSession(name, facilitator, code) {
  return fetchJSON(`${BASE}/sessions`, {
    method: 'POST',
    body: JSON.stringify({ name, facilitator, code }),
  });
}

export async function getSession(code) {
  return fetchJSON(`${BASE}/sessions?code=${encodeURIComponent(code)}`);
}

// ---- Failure Modes ----

export async function importFMs(code, fmList) {
  return fetchJSON(`${BASE}/sessions/${encodeURIComponent(code)}/fm`, {
    method: 'POST',
    body: JSON.stringify({ fmList }),
  });
}

export async function getFMs(code) {
  return fetchJSON(`${BASE}/sessions/${encodeURIComponent(code)}/fm`);
}

// ---- FM Status ----

export async function updateFMStatus(code, fmNo, status) {
  return fetchJSON(`${BASE}/sessions/${encodeURIComponent(code)}/fm-status`, {
    method: 'PUT',
    body: JSON.stringify({ fmNo, status }),
  });
}

export async function bulkUpdateFMStatus(code, items) {
  return fetchJSON(`${BASE}/sessions/${encodeURIComponent(code)}/fm-status`, {
    method: 'PUT',
    body: JSON.stringify({ bulk: items }),
  });
}

export async function getFMStatus(code) {
  return fetchJSON(`${BASE}/sessions/${encodeURIComponent(code)}/fm-status`);
}

// ---- Participants ----

export async function joinSession(code, participantKey, role, name, experience) {
  return fetchJSON(`${BASE}/sessions/${encodeURIComponent(code)}/participants`, {
    method: 'POST',
    body: JSON.stringify({ participantKey, role, name, experience }),
  });
}

export async function getParticipants(code) {
  return fetchJSON(`${BASE}/sessions/${encodeURIComponent(code)}/participants`);
}

// ---- Votes ----

export async function submitVote(code, participantKey, fmNo, likelihood, severity, detection) {
  return fetchJSON(`${BASE}/sessions/${encodeURIComponent(code)}/votes`, {
    method: 'POST',
    body: JSON.stringify({ participantKey, fmNo, likelihood, severity, detection }),
  });
}

// ---- Full Session (polling) ----

export async function getFullSession(code) {
  return fetchJSON(`${BASE}/sessions/${encodeURIComponent(code)}/full`);
}

// ---- Migration ----

export async function runMigration() {
  return fetchJSON(`${BASE}/migrate`, { method: 'POST' });
}
