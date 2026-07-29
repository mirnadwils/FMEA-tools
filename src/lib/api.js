/**
 * Client-side API helper — wraps all fetch() calls to the Next.js API routes.
 * Clerk handles auth cookies automatically.
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

// ---- Current User ----

export async function getMe() {
  return fetchJSON(`${BASE}/me`);
}

export async function updateProfile(profile) {
  return fetchJSON(`${BASE}/me/profile`, {
    method: 'PUT',
    body: JSON.stringify(profile),
  });
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

// ---- Membership (Clerk-authenticated) ----

export async function joinMembership(code, { professionalRoleKey, customRoleText, experienceLevel }) {
  return fetchJSON(`${BASE}/sessions/${encodeURIComponent(code)}/membership`, {
    method: 'POST',
    body: JSON.stringify({ professionalRoleKey, customRoleText, experienceLevel }),
  });
}

export async function getMembership(code) {
  return fetchJSON(`${BASE}/sessions/${encodeURIComponent(code)}/membership`);
}

// ---- Assessment (Clerk-authenticated) ----

export async function saveAssessmentDraft(code, draft) {
  return fetchJSON(`${BASE}/sessions/${encodeURIComponent(code)}/assessment`, {
    method: 'PUT',
    body: JSON.stringify(draft),
  });
}

export async function getAssessmentDrafts(code) {
  return fetchJSON(`${BASE}/sessions/${encodeURIComponent(code)}/assessment`);
}

// ---- Submission ----

export async function submitAssessment(code) {
  return fetchJSON(`${BASE}/sessions/${encodeURIComponent(code)}/submission`, {
    method: 'POST',
  });
}

export async function getSubmissionStatus(code) {
  return fetchJSON(`${BASE}/sessions/${encodeURIComponent(code)}/submission`);
}

export async function reopenSubmission(code, memberId, reason) {
  return fetchJSON(`${BASE}/sessions/${encodeURIComponent(code)}/submission`, {
    method: 'PUT',
    body: JSON.stringify({ memberId, reason }),
  });
}

// ---- Documents ----

export async function uploadDocument(code, file, title) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('title', title || 'Bypass Justification');

  const res = await fetch(`${BASE}/sessions/${encodeURIComponent(code)}/documents`, {
    method: 'POST',
    body: formData,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

export async function getDocumentInfo(code) {
  return fetchJSON(`${BASE}/sessions/${encodeURIComponent(code)}/documents?info=true`);
}

export function getDocumentDownloadUrl(code) {
  return `${BASE}/sessions/${encodeURIComponent(code)}/documents`;
}

// ---- Full Session (polling) ----

export async function getFullSession(code) {
  return fetchJSON(`${BASE}/sessions/${encodeURIComponent(code)}/full`);
}

// ---- Legacy: Participants & Votes (kept for backward compat) ----

export async function joinSession(code, participantKey, role, name, experience) {
  return fetchJSON(`${BASE}/sessions/${encodeURIComponent(code)}/participants`, {
    method: 'POST',
    body: JSON.stringify({ participantKey, role, name, experience }),
  });
}

export async function getParticipants(code) {
  return fetchJSON(`${BASE}/sessions/${encodeURIComponent(code)}/participants`);
}

export async function submitVote(code, participantKey, fmNo, likelihood, severity, detection) {
  return fetchJSON(`${BASE}/sessions/${encodeURIComponent(code)}/votes`, {
    method: 'POST',
    body: JSON.stringify({ participantKey, fmNo, likelihood, severity, detection }),
  });
}

// ---- Migration ----

export async function runMigration() {
  return fetchJSON(`${BASE}/migrate`, { method: 'POST' });
}
